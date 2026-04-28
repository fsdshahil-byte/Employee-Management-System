exports.getAttendance = async (req, res) => {
  try {
    const data = await Attendance.find()
      .populate("employee", "name email")
      .lean();

    const formatted = data.map((item) => {
      const employee = item.employee || {};

      return {
        _id: item._id,
        name: employee.name || "Unknown",
        email: employee.email || "-",
        date: item.date,
        punchIn: item.punchIn || null,
        punchOut: item.punchOut || null,
        workingHours: item.workingHours ?? 0,
        status: item.status || "A",
      };
    });

    return res.status(200).json(formatted);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch attendance",
      error: error.message,
    });
  }
};