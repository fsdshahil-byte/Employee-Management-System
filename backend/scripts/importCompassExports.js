require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { EJSON } = require("bson");

const connectDB = require("../config/db");
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const Leave = require("../models/Leave");
const Meeting = require("../models/Meeting");
const Message = require("../models/Message");
const Task = require("../models/Task");
const Todo = require("../models/Todo");
const User = require("../models/User");

const exportDir =
  process.env.COMPASS_EXPORT_DIR ||
  "C:\\Users\\fsdsh\\AppData\\Local\\MongoDBCompass\\app-1.49.5";

const collections = [
  { file: "EmployeeDB.users.json", label: "users", model: User },
  { file: "EmployeeDB.employees.json", label: "employees", model: Employee },
  { file: "EmployeeDB.tasks.json", label: "tasks", model: Task },
  { file: "EmployeeDB.todos.json", label: "todos", model: Todo },
  { file: "EmployeeDB.messages.json", label: "messages", model: Message },
  { file: "EmployeeDB.meetings.json", label: "meetings", model: Meeting },
  { file: "EmployeeDB.leaves.json", label: "leaves", model: Leave },
  { file: "EmployeeDB.attendances.json", label: "attendances", model: Attendance },
];

const loadExport = (filePath) => {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = EJSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
};

const importCollection = async ({ file, label, model }) => {
  const filePath = path.join(exportDir, file);

  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${label}: export file not found`);
    return;
  }

  const documents = loadExport(filePath);

  if (documents.length === 0) {
    console.log(`Skipping ${label}: no documents in export`);
    return;
  }

  await model.bulkWrite(
    documents.map((document) => ({
      replaceOne: {
        filter: { _id: document._id },
        replacement: document,
        upsert: true,
      },
    })),
    { ordered: false }
  );

  console.log(`Imported ${documents.length} ${label}`);
};

const run = async () => {
  try {
    await connectDB();

    for (const collection of collections) {
      await importCollection(collection);
    }

    console.log("Compass export import completed");
    process.exit(0);
  } catch (error) {
    console.error("Compass export import failed");
    console.error(error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = run;
