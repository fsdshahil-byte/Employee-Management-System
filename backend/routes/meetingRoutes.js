const express = require("express");

const router = express.Router();
const auth = require("../middleware/auth");
const Meeting = require("../models/Meeting");
const User = require("../models/User");

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

const isValidUrl = (value) => {
  if (!value) return true;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
};

router.get("/", auth, async (req, res) => {
  try {
    const meetings = await Meeting.find().sort({ date: 1, startTime: 1, createdAt: -1 });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", auth, ensureManager, async (req, res) => {
  try {
    const {
      title,
      date,
      startTime,
      endTime,
      attendees = "",
      mode = "Google Meet",
      agenda = "",
      meetLink = "",
    } = req.body;

    if (!title || !date || !startTime || !endTime) {
      return res.status(400).json({
        message: "Title, date, start time, and end time are required",
      });
    }

    if (!isValidUrl(meetLink)) {
      return res.status(400).json({ message: "Invalid meeting link" });
    }

    const meeting = await Meeting.create({
      title,
      date,
      startTime,
      endTime,
      attendees,
      mode,
      agenda,
      meetLink,
      createdBy: req.user.id,
    });

    const io = req.app.get("io");
    io.emit("meetingUpdated");

    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", auth, ensureManager, async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndDelete(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const io = req.app.get("io");
    io.emit("meetingUpdated");

    res.json({ message: "Meeting deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
