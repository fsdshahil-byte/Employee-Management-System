const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const auth = require("../middleware/auth");

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getStoredWorkedMs = (record) => {
  if (typeof record.workedMs === "number") {
    return record.workedMs;
  }

  if (record.punchIn && record.punchOut) {
    return Math.max(0, new Date(record.punchOut) - new Date(record.punchIn));
  }

  return 0;
};

const updateStatus = (record, totalWorkedMs) => {
  const hours = totalWorkedMs / (1000 * 60 * 60);
  record.workingHours = Number(hours.toFixed(2));

  if (hours >= 8) record.status = "P";
  else if (hours >= 4) record.status = "HD";
  else record.status = "A";
};

const getEmployeeForUser = async (userId) => {
  return Employee.findOne({ userId });
};

router.post("/punch-in", auth, async (req, res) => {
  try {
    const today = getLocalDateString();
    const employee = await getEmployeeForUser(req.user.id);

    if (!employee) {
      return res.status(400).json({ message: "Employee not linked" });
    }

    let record = await Attendance.findOne({
      employee: employee._id,
      date: today,
    });

    const now = new Date();

    if (!record) {
      record = new Attendance({
        employee: employee._id,
        date: today,
        punchIn: now,
        activePunchIn: now,
        isActive: true,
        workedMs: 0,
        workingHours: 0,
        status: "A",
      });
    } else if (record.isActive) {
      return res.status(400).json({ message: "Already punched in" });
    } else {
      record.activePunchIn = now;
      record.isActive = true;

      if (!record.punchIn) {
        record.punchIn = now;
      }
    }

    await record.save();
    req.app.get("io")?.emit("attendanceUpdated");

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/punch-out", auth, async (req, res) => {
  try {
    const today = getLocalDateString();
    const employee = await getEmployeeForUser(req.user.id);

    if (!employee) {
      return res.status(400).json({ message: "Employee not linked" });
    }

    const record = await Attendance.findOne({
      employee: employee._id,
      date: today,
    });

    if (!record || !record.isActive || !record.activePunchIn) {
      return res.status(400).json({ message: "Punch in first" });
    }

    const now = new Date();
    const currentWorkedMs = getStoredWorkedMs(record);
    const sessionWorkedMs = Math.max(0, now - new Date(record.activePunchIn));
    const totalWorkedMs = currentWorkedMs + sessionWorkedMs;

    record.workedMs = totalWorkedMs;
    record.punchOut = now;
    record.activePunchIn = null;
    record.isActive = false;
    updateStatus(record, totalWorkedMs);

    await record.save();
    req.app.get("io")?.emit("attendanceUpdated");

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/today", auth, async (req, res) => {
  try {
    const today = getLocalDateString();
    const employee = await getEmployeeForUser(req.user.id);

    if (!employee) {
      return res.status(400).json({ message: "Employee not linked" });
    }

    const record = await Attendance.findOne({
      employee: employee._id,
      date: today,
    }).lean();

    res.json(record || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const employee = await getEmployeeForUser(req.user.id);

    if (!employee) {
      return res.status(400).json({ message: "Employee not linked" });
    }

    const data = await Attendance.find({ employee: employee._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const data = await Attendance.find()
      .populate("employee", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = data.map((item) => ({
      _id: item._id,
      employeeName: item.employee?.name || "Unknown",
      email: item.employee?.email || "-",
      date: item.date,
      punchIn: item.punchIn || null,
      punchOut: item.punchOut || null,
      workingHours: item.workingHours ?? 0,
      workedMs: item.workedMs ?? 0,
      activePunchIn: item.activePunchIn || null,
      status: item.status || "A",
      isActive: Boolean(item.isActive),
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
