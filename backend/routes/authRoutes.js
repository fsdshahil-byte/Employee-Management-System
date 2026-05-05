const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const User = require("../models/User");
const Employee = require("../models/Employee");
const auth = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${baseName}${ext}`);
  },
});

const upload = multer({ storage });

const buildUserPayload = async (user) => {
  const employeeProfile = await Employee.findOne({ userId: user._id }).lean();

  return {
    _id: user._id,
    name:
      employeeProfile?.name ||
      user.email.split("@")[0].replace(/[._-]/g, " "),
    email: user.email,
    role: user.role,
    image: employeeProfile?.image || user.image || "",
    designation: employeeProfile?.designation || "",
    department: employeeProfile?.department || "",
  };
};

// 🔐 LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("BODY:", req.body);

    // ✅ validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    // ✅ find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    console.log("USER:", user);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // ✅ compare password
    const match = await bcrypt.compare(password, user.password);
    console.log("MATCH:", match);

    if (!match) {
      return res.status(400).json({ message: "Wrong password" });
    }

    // ✅ generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "1d" }
    );
    res.json({
      message: "Login successful",
      token,
      user: await buildUserPayload(user)
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: await buildUserPayload(user) });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

router.put("/me/image", auth, upload.single("image"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    user.image = req.file.filename;
    await user.save();

    res.json({
      message: "Profile image updated successfully",
      user: await buildUserPayload(user),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/register", upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      department = "",
      designation = "",
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      role: "employee",
      image: req.file ? req.file.filename : "",
    });

    await Employee.create({
      userId: user._id,
      name,
      email: normalizedEmail,
      department,
      designation,
      image: req.file ? req.file.filename : "",
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: await buildUserPayload(user),
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
});

module.exports = router;
