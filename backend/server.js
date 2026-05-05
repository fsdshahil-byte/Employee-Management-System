const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
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

// ✅ Correct frontend dist path
const frontendDistPath = path.resolve(__dirname, "../frontend/dist");

// 🔥 DEBUG (check this in Render logs)
console.log("Serving frontend from:", frontendDistPath);

// ✅ Flexible CORS (prevents blocking Render domain)
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
  "https://employee-management-system-3-amix.onrender.com"
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.error("Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(logger);

// Static uploads
app.use("/uploads", express.static("uploads"));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/messages", messageRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ message: "API is running..." });
});

// ✅ Serve frontend static files
app.use(express.static(frontendDistPath));

// ✅ Handle React/Vite routing safely
app.get(/^\/(?!api|uploads).*/, (req, res) => {
  const filePath = path.join(frontendDistPath, "index.html");

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending index.html:", err.message);
      res.status(500).send("Frontend build not found or failed to load.");
    }
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Socket setup
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Port
const PORT = process.env.PORT || 3000;

// Start server
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server");
    console.error(error.message);
    process.exit(1);
  }
};

startServer();