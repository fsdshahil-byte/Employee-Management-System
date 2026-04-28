require("dotenv").config();

const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");
const User = require("../models/User");

const DEFAULT_MANAGER_EMAIL =
  process.env.DEMO_MANAGER_EMAIL || "manager@gmail.com";
const DEFAULT_MANAGER_PASSWORD =
  process.env.DEMO_MANAGER_PASSWORD || "123456";

const run = async () => {
  try {
    await connectDB();

    const hashedPassword = await bcrypt.hash(DEFAULT_MANAGER_PASSWORD, 10);

    const user = await User.findOneAndUpdate(
      { email: DEFAULT_MANAGER_EMAIL.toLowerCase() },
      {
        email: DEFAULT_MANAGER_EMAIL.toLowerCase(),
        password: hashedPassword,
        role: "manager",
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log("Demo manager login is ready");
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${DEFAULT_MANAGER_PASSWORD}`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to prepare demo manager login");
    console.error(error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = run;
