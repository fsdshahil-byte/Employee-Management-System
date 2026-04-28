const Leave = require("../models/Leave");

// ✅ CREATE LEAVE
exports.createLeave = async (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      department = "",
      type = "Casual Leave",
      startDate,
      endDate,
      reason,
      duration = "full",
      session = "full-day",
    } = req.body;

    if (!employeeId || !employeeName || !startDate || !reason) {
      return res.status(400).json({
        message: "employeeId, employeeName, startDate and reason are required",
      });
    }

    if (!["full", "half"].includes(duration)) {
      return res.status(400).json({
        message: "Invalid duration value",
      });
    }

    if (!["full-day", "morning", "evening"].includes(session)) {
      return res.status(400).json({
        message: "Invalid leave session",
      });
    }

    if (duration === "half" && session === "full-day") {
      return res.status(400).json({
        message: "Half-day leave must be morning or evening",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate || startDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message: "Invalid date format",
      });
    }

    if (duration === "full" && end < start) {
      return res.status(400).json({
        message: "End date cannot be before start date",
      });
    }

    let days;

    if (duration === "half") {
      days = 0.5;
    } else {
      const diff = end.getTime() - start.getTime();
      days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    }

    const existingLeave = await Leave.findOne({
      employeeId,
      status: { $ne: "rejected" },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start },
        },
      ],
    });

    if (existingLeave) {
      return res.status(400).json({
        message: "Leave already exists for selected dates",
      });
    }

    const leave = await Leave.create({
      employeeId,
      employeeName,
      department,
      type,
      duration,
      session,
      startDate: start,
      endDate: duration === "half" ? start : end,
      days,
      reason,
    });

    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({
      message: "Failed to create leave",
      error: err.message,
    });
  }
};

// ✅ GET LEAVES
exports.getLeaves = async (req, res) => {
  try {
    const { status, search } = req.query;

    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { employeeName: new RegExp(search, "i") },
        { department: new RegExp(search, "i") },
        { type: new RegExp(search, "i") },
      ];
    }

    const leaves = await Leave.find(filter).sort({ createdAt: -1 });

    res.status(200).json(leaves);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch leaves",
      error: err.message,
    });
  }
};

// ✅ REVIEW LEAVE
exports.reviewLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, managerNote = "" } = req.body;

    // ✅ STRICT VALIDATION
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be approved or rejected",
      });
    }

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        message: "Leave not found",
      });
    }

    // ❌ PREVENT DOUBLE ACTION
    if (leave.status !== "pending") {
      return res.status(400).json({
        message: "Leave already reviewed",
      });
    }

    leave.status = status;
    leave.managerNote = managerNote.trim();
    leave.reviewedAt = new Date();

    await leave.save();

    res.status(200).json(leave);
  } catch (err) {
    res.status(500).json({
      message: "Failed to review leave",
      error: err.message,
    });
  }
};
