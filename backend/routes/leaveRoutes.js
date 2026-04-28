const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Employee = require("../models/Employee");
const Leave = require("../models/Leave");
const User = require("../models/User");

// ✅ Manager middleware
const ensureManager = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.role !== "manager") {
      return res.status(403).json({ message: "Manager access required" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATED DAYS CALCULATION
const getLeaveDays = (startDate, endDate, duration) => {
  if (duration === "half") return 0.5;

  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

// ✅ GET MY LEAVES
router.get("/me", auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const leaves = await Leave.find({ employeeId: employee._id }).sort({
      createdAt: -1,
    });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ CREATE LEAVE
router.post("/", auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const {
      type,
      startDate,
      endDate,
      reason,
      duration = "full",
      session = "full-day",
    } = req.body;

    if (!startDate || !endDate || !reason) {
      return res
        .status(400)
        .json({ message: "Start date, end date, and reason are required" });
    }

    if (!["full", "half"].includes(duration)) {
      return res.status(400).json({ message: "Invalid leave duration" });
    }

    if (!["full-day", "morning", "evening"].includes(session)) {
      return res.status(400).json({ message: "Invalid leave session" });
    }

    if (duration === "half" && session === "full-day") {
      return res
        .status(400)
        .json({ message: "Half-day leave must be morning or evening" });
    }

    const start = new Date(startDate);
    const end = new Date(duration === "half" ? startDate : endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid leave dates provided" });
    }

    if (end < start) {
      return res
        .status(400)
        .json({ message: "End date cannot be earlier than start date" });
    }

    const overlappingLeave = await Leave.findOne({
      employeeId: employee._id,
      status: { $ne: "rejected" },
      startDate: { $lte: end },
      endDate: { $gte: start },
    });

    if (overlappingLeave) {
      return res
        .status(400)
        .json({ message: "A leave request already exists for those dates" });
    }

    const leave = await Leave.create({
      employeeId: employee._id,
      employeeName: employee.name,
      department: employee.department || "",
      type,
      duration,
      session,
      startDate: start,
      endDate: end,
      days: getLeaveDays(start, end, duration),
      reason,
    });

    const io = req.app.get("io");
    io.emit("leaveUpdated");

    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ MANAGER VIEW
router.get("/", auth, ensureManager, async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status && status !== "all") filter.status = status;

    const leaves = await Leave.find(filter).sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ REVIEW
router.put("/:id/review", auth, ensureManager, async (req, res) => {
  try {
    const { status, managerNote = "" } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid review status" });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({ message: "Leave already reviewed" });
    }

    leave.status = status;
    leave.managerNote = managerNote.trim();
    leave.reviewedAt = new Date();

    await leave.save();

    const io = req.app.get("io");
    io.emit("leaveUpdated");

    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
