console.log("🚀 Server starting...");

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const taskRoutes = require("./routes/tasksRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const todoRoutes = require("./routes/todoRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const messageRoutes = require("./routes/messageRoutes");
// Middleware
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

const app = express();

//  CONNECT DATABASE
connectDB();

// MIDDLEWARE
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(logger);

//  STATIC FILES
app.use("/uploads", express.static("uploads"));

//  API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/messages", messageRoutes);
// ROOT TEST ROUTE
app.get("/", (req, res) => {
  res.send("API is running...");
});

//  404 HANDLER
app.use(notFound);

//  ERROR HANDLER
app.use(errorHandler);

//  CREATE HTTP SERVER
const server = http.createServer(app);

// SOCKET.IO SETUP
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

//  MAKE SOCKET AVAILABLE IN ROUTES
app.set("io", io);

//  SOCKET CONNECTION
io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

//  START SERVER
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
});
