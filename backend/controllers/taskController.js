const Task = require("../models/Task");

// ➤ ADD TASK (Manager)
exports.addTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);

    const io = req.app.get("io");
    io.emit("taskAdded", task); // 🔥 real-time

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ➤ GET TASKS (Employee)
exports.getTasksByEmployee = async (req, res) => {
  try {
    const tasks = await Task.find({
      employeeId: req.params.employeeId
    }).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ➤ TOGGLE COMPLETE
exports.toggleTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    task.completed = !task.completed;
    await task.save();

    const io = req.app.get("io");
    io.emit("taskUpdated", task); // 🔥 real-time

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ➤ DELETE TASK
exports.deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);

    const io = req.app.get("io");
    io.emit("taskDeleted", req.params.id);

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};