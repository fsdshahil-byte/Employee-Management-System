const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();
const auth = require("../middleware/auth");
const Employee = require("../models/Employee");

const {
  addEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeControllers");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${baseName}${ext}`);
  },
});

const upload = multer({ storage });

router.get("/me", auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({
      userId: req.user.id,
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({
      user: req.user,
      employee,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", upload.single("image"), addEmployee);
router.get("/", getEmployees);
router.get("/:id", getEmployeeById);
router.put("/:id", upload.single("image"), updateEmployee);
router.delete("/:id", deleteEmployee);

module.exports = router;
