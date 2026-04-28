const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");
const User = require("../models/User");

const normalizeEmployeePayload = (body = {}) => {
  const payload = {
    name: body.name,
    email: body.email ? body.email.toLowerCase().trim() : undefined,
    designation: body.designation,
    department: body.department,
  };

  if (body.salary !== undefined) {
    payload.salary = Number(body.salary) || 0;
  }

  if (body.dateOfJoin || body.dateofjoin) {
    payload.dateOfJoin = body.dateOfJoin || body.dateofjoin;
  }

  return payload;
};

exports.addEmployee = async (req, res) => {
  try {
    const { password } = req.body;
    const payload = normalizeEmployeePayload(req.body);

    if (!payload.name || !payload.email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    const existingUser = await User.findOne({ email: payload.email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: payload.email,
      password: hashedPassword,
      role: "employee",
    });

    try {
      const employee = new Employee({
        ...payload,
        image: req.file ? req.file.filename : null,
        userId: user._id,
      });

      await employee.save();
      return res.status(201).json(employee);
    } catch (error) {
      await User.findByIdAndDelete(user._id);
      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const {
      name,
      department,
      minSalary,
      maxSalary,
      sort,
      page,
      limit,
      search,
    } = req.query;

    const filter = {};

    if (search) {
      const isNumber = !isNaN(search);

      if (isNumber) {
        filter.salary = { $gte: Number(search) };
      } else {
        filter.$or = [
          { name: new RegExp(search, "i") },
          { department: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
        ];
      }
    }

    if (name) {
      filter.name = new RegExp(name, "i");
    }

    if (department) {
      filter.department = new RegExp(department, "i");
    }

    if (minSalary || maxSalary) {
      filter.salary = filter.salary || {};

      if (minSalary) filter.salary.$gte = Number(minSalary);
      if (maxSalary) filter.salary.$lte = Number(maxSalary);
    }

    let query = Employee.find(filter);

    if (sort) {
      query = query.sort(sort);
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    query = query.skip((pageNum - 1) * limitNum).limit(limitNum);

    const employees = await query;
    const total = await Employee.countDocuments(filter);

    res.json({
      total,
      page: pageNum,
      limit: limitNum,
      data: employees,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const existingEmployee = await Employee.findById(req.params.id);

    if (!existingEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const updatedData = normalizeEmployeePayload(req.body);

    if (req.file) {
      updatedData.image = req.file.filename;
    }

    if (updatedData.email && updatedData.email !== existingEmployee.email) {
      const duplicateUser = await User.findOne({
        email: updatedData.email,
        _id: { $ne: existingEmployee.userId },
      });

      if (duplicateUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
      runValidators: true,
    });

    const userUpdates = {};

    if (updatedData.email) {
      userUpdates.email = updatedData.email;
    }

    if (req.body.password) {
      userUpdates.password = await bcrypt.hash(req.body.password, 10);
    }

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(existingEmployee.userId, userUpdates, {
        new: true,
      });
    }

    res.json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);

    if (!deletedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (deletedEmployee.userId) {
      await User.findByIdAndDelete(deletedEmployee.userId);
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
