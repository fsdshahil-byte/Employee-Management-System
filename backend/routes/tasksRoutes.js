const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const auth = require("../middleware/auth");
const Employee = require("../models/Employee");


// ================= CREATE TASK =================
router.post("/", async (req, res) => {
  try {
    const task = await Task.create({
      title: req.body.title,
      assignedTo: req.body.assignedTo
    });

    const io = req.app.get("io");
    io.emit("taskUpdated");

    res.json(task);
  } catch (err) {
    res.status(500).json(err);
  }
});


// ================= GET ALL TASKS (MANAGER) =================
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find().populate("assignedTo");
    res.json(tasks);
  } catch (err) {
    res.status(500).json(err);
  }
});


// ================= GET TASKS BY EMPLOYEE =================
router.get("/employee/:employeeId", async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.params.employeeId
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json(err);
  }
});


// ================= GET LOGGED USER TASKS =================
router.get("/me", auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({
      userId: req.user.id
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const tasks = await Task.find({
      assignedTo: employee._id
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json(err);
  }
});


// ================= TOGGLE TASK STATUS (FIXED) =================
router.put("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // 🔥 TOGGLE FIX (IMPORTANT)
    task.status = task.status === "pending" ? "completed" : "pending";

    await task.save();

    const io = req.app.get("io");
    io.emit("taskUpdated");

    res.json(task);
  } catch (err) {
    res.status(500).json(err);
  }
});


// ================= DELETE TASK =================
router.delete("/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);

    const io = req.app.get("io");
    io.emit("taskUpdated");

    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;