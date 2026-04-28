const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },

  date: {
    type: String, // YYYY-MM-DD
    required: true
  },

  punchIn: Date,
  punchOut: Date,
  activePunchIn: Date,

  workedMs: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: false
  },

  workingHours: Number,

  status: {
    type: String,
    enum: ["P", "A", "HD"],
    default: "A"
  }
}, { timestamps: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
