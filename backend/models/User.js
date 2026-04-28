const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ""
  },
  role: {
    type: String,
    enum: ["admin", "manager", "employee"],
    default: "employee"
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
