const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },

  completed: {
    type: Boolean,
    default: false
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User" // or "Employee" if you use that
  }

}, { timestamps: true });

module.exports = mongoose.model("Todo", todoSchema);