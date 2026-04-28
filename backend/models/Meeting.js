const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    attendees: {
      type: String,
      default: "",
      trim: true,
    },
    mode: {
      type: String,
      enum: ["Google Meet", "In Person", "Hybrid"],
      default: "Google Meet",
    },
    agenda: {
      type: String,
      default: "",
      trim: true,
    },
    meetLink: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", meetingSchema);
