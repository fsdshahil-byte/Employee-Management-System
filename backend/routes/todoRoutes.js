const express = require("express");
const router = express.Router();
const Todo = require("../models/Todo");
const auth = require("../middleware/auth");

// ✅ CREATE TODO
router.post("/", auth, async (req, res) => {
  try {
    const todo = new Todo({
      text: req.body.text,
      createdBy: req.user.id
    });

    await todo.save();
    res.json(todo);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET ALL TODOS
router.get("/", auth, async (req, res) => {
  const todos = await Todo.find().sort({ createdAt: -1 });
  res.json(todos);
});

// ✅ UPDATE (TOGGLE / EDIT)
router.put("/:id", auth, async (req, res) => {
  const todo = await Todo.findById(req.params.id);

  if (!todo) {
    return res.status(404).json({ message: "Todo not found" });
  }

  if (req.body.text !== undefined) {
    todo.text = req.body.text;
  }

  if (req.body.completed !== undefined) {
    todo.completed = req.body.completed;
  }

  await todo.save();
  res.json(todo);
});

// ✅ DELETE
router.delete("/:id", auth, async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;