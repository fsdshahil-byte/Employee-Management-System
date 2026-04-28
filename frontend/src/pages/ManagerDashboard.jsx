import { useEffect, useState } from "react";
import API from "../api/axios";
import { io } from "socket.io-client";
import EmployeeTable from "../components/EmployeeTable";
import EmployeeForm from "../components/EmployeeForm";
import ChatPanel from "../components/ChatPanel";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  Briefcase,
  CalendarDays,
  Clock3,
  LayoutGrid,
  LogOut,
  MoonStar,
  Camera,
  SunMedium,
  Users,
} from "lucide-react";

const BASE_URL = "http://localhost:3000";

function ManagerDashboard() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [managerProfile, setManagerProfile] = useState(() => ({
    name:
      storedUser.name ||
      (storedUser.email
        ? storedUser.email.split("@")[0].replace(/[._-]/g, " ")
        : "Manager"),
    image: storedUser.image || "",
    email: storedUser.email || "",
    role: storedUser.role || "manager",
  }));
  const managerName = managerProfile.name;
  const formattedManagerName = managerName
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  const managerInitials = formattedManagerName
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  const [view, setView] = useState("dashboard");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const [clockTick, setClockTick] = useState(Date.now());
  const [attendanceData, setAttendanceData] = useState([]);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveFilter, setLeaveFilter] = useState("all");
  const [reviewLoadingId, setReviewLoadingId] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [contactsLoading, setContactsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    attendees: "",
    mode: "Google Meet",
    agenda: "",
    meetLink: "",
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/employees?search=${search}`);
      setEmployees(res.data.data || res.data);
    } catch (err) {
      console.error("ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await API.get("/attendance");
      setAttendanceData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTodos = async () => {
    try {
      const res = await API.get("/todos");
      setTodos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaves = async (status = leaveFilter) => {
    try {
      const query = new URLSearchParams();

      if (status && status !== "all") {
        query.set("status", status);
      }

      const res = await API.get(`/leaves${query.toString() ? `?${query}` : ""}`);
      setLeaveRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMeetings = async () => {
    try {
      const res = await API.get("/meetings");
      setMeetings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchManagerProfile = async () => {
    try {
      const res = await API.get("/auth/me");
      const profile = res.data.user;
      if (profile) {
        setManagerProfile(profile);
        localStorage.setItem("user", JSON.stringify(profile));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchContacts = async () => {
    try {
      setContactsLoading(true);
      const res = await API.get("/messages/contacts");
      setContacts(res.data);
      setActiveContact((current) =>
        current ? res.data.find((item) => item.userId === current.userId) || current : res.data[0] || null
      );
    } catch (err) {
      console.error(err);
    } finally {
      setContactsLoading(false);
    }
  };

  const fetchConversation = async (otherUserId) => {
    if (!otherUserId) return;
    try {
      setMessagesLoading(true);
      const res = await API.get(`/messages/conversation/${otherUserId}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const addTodo = async () => {
    if (!newTodo) return;
    const res = await API.post("/todos", { text: newTodo });
    setTodos([res.data, ...todos]);
    setNewTodo("");
  };

  const toggleTodo = async (todo) => {
    const res = await API.put(`/todos/${todo._id}`, {
      completed: !todo.completed,
    });

    setTodos(todos.map((item) => (item._id === todo._id ? res.data : item)));
  };

  const deleteTodo = async (id) => {
    await API.delete(`/todos/${id}`);
    setTodos(todos.filter((todo) => todo._id !== id));
  };

  const saveEdit = async (id) => {
    const res = await API.put(`/todos/${id}`, {
      text: editText,
    });

    setTodos(todos.map((todo) => (todo._id === id ? res.data : todo)));
    setEditingId(null);
  };

  const deleteEmployee = async (id) => {
    try {
      await API.delete(`/employees/${id}`);
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (emp) => {
    setSelectedEmployee(emp);
    setShowForm(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
    fetchTodos();
    fetchMeetings();
    fetchManagerProfile();
    fetchContacts();
  }, [search]);

  useEffect(() => {
    fetchLeaves(leaveFilter);
  }, [leaveFilter]);

  useEffect(() => {
    const socket = io("http://localhost:3000");

    socket.on("attendanceUpdated", () => {
      fetchAttendance();
    });

    socket.on("leaveUpdated", () => {
      fetchLeaves(leaveFilter);
    });

    socket.on("meetingUpdated", () => {
      fetchMeetings();
    });

    socket.on("messageUpdated", () => {
      fetchContacts();
      if (activeContact?.userId) {
        fetchConversation(activeContact.userId);
      }
    });

    return () => socket.disconnect();
  }, [leaveFilter, activeContact?.userId]);

  useEffect(() => {
    if (activeContact?.userId) {
      fetchConversation(activeContact.userId);
    } else {
      setMessages([]);
    }
  }, [activeContact?.userId]);

  useEffect(() => {
    if (view !== "attendance") {
      return;
    }

    const interval = setInterval(() => {
      setClockTick(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [view]);

  const getLiveWorkedHours = (item) => {
    const baseWorkedMs =
      item.workedMs ?? Math.round((item.workingHours || 0) * 60 * 60 * 1000);

    if (!item.isActive || !item.activePunchIn) {
      return item.workingHours ?? 0;
    }

    const activeMs = Math.max(
      0,
      clockTick - new Date(item.activePunchIn).getTime()
    );
    return Number(((baseWorkedMs + activeMs) / (1000 * 60 * 60)).toFixed(2));
  };

  const getAttendanceLabel = (item) => {
    if (item.isActive) return "Active";
    if (item.status === "P") return "Present";
    if (item.status === "HD") return "Half Day";
    return "Absent";
  };

  const getAttendanceColor = (item) => {
    if (item.isActive) return "#0ea5e9";
    if (item.status === "P") return "#22c55e";
    if (item.status === "HD") return "#f59e0b";
    return "#ef4444";
  };

  const totalSalary = employees.reduce(
    (sum, employee) => sum + Number(employee.salary || 0),
    0
  );
  const activeEmployees = attendanceData.filter((item) => item.isActive).length;
  const pendingLeaveCount = leaveRequests.filter(
    (leave) => leave.status === "pending"
  ).length;

  const reviewLeave = async (leaveId, status) => {
    const managerNote =
      window.prompt(
        `Add an optional note for this ${status === "approved" ? "approval" : "rejection"}:`,
        ""
      ) || "";

    try {
      setReviewLoadingId(leaveId);
      await API.put(`/leaves/${leaveId}/review`, {
        status,
        managerNote,
      });
      fetchLeaves(leaveFilter);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Unable to update leave request");
    } finally {
      setReviewLoadingId(null);
    }
  };

  const getLeaveBadge = (status) => {
    if (status === "approved") {
      return { label: "Approved", color: "#22c55e" };
    }

    if (status === "rejected") {
      return { label: "Rejected", color: "#ef4444" };
    }

    return { label: "Pending", color: "#f59e0b" };
  };

  const getLeaveSessionLabel = (leave) => {
    if (leave.session === "morning") return "Morning";
    if (leave.session === "evening") return "Evening";
    return "Full Day";
  };

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

  const getCalendarDateTime = (date, time) => {
    const raw = new Date(`${date}T${time}`);
    const validDate = Number.isNaN(raw.getTime()) ? new Date() : raw;

    const year = validDate.getFullYear();
    const month = String(validDate.getMonth() + 1).padStart(2, "0");
    const day = String(validDate.getDate()).padStart(2, "0");
    const hours = String(validDate.getHours()).padStart(2, "0");
    const minutes = String(validDate.getMinutes()).padStart(2, "0");

    return `${year}${month}${day}T${hours}${minutes}00`;
  };

  const getGoogleCalendarUrl = (meeting) => {
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: meeting.title,
      dates: `${getCalendarDateTime(meeting.date, meeting.startTime)}/${getCalendarDateTime(
        meeting.date,
        meeting.endTime
      )}`,
      details: `${meeting.agenda || "Team meeting"}${
        meeting.attendees ? `\nAttendees: ${meeting.attendees}` : ""
      }`,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const addMeeting = (e) => {
    e.preventDefault();

    API.post("/meetings", meetingForm)
      .then(() => {
        setMeetingForm({
          title: "",
          date: "",
          startTime: "",
          endTime: "",
          attendees: "",
          mode: "Google Meet",
          agenda: "",
          meetLink: "",
        });
        fetchMeetings();
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.message || "Failed to add meeting");
      });
  };

  const deleteMeeting = (id) => {
    API.delete(`/meetings/${id}`)
      .then(() => {
        fetchMeetings();
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.message || "Failed to delete meeting");
      });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!activeContact?.userId || !messageText.trim()) return;

    try {
      await API.post("/messages", {
        recipientUserId: activeContact.userId,
        text: messageText,
      });
      setMessageText("");
      fetchConversation(activeContact.userId);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to send message");
    }
  };

  const editMessage = async (messageId, text) => {
    if (!activeContact?.userId || !text.trim()) return;

    try {
      await API.put(`/messages/${messageId}`, {
        text: text.trim(),
      });
      fetchConversation(activeContact.userId);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to edit message");
    }
  };

  const deleteMessage = async (messageId) => {
    if (!activeContact?.userId) return;

    try {
      await API.delete(`/messages/${messageId}`);
      fetchConversation(activeContact.userId);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete message");
    }
  };

  const handleManagerImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      const res = await API.put("/auth/me/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setManagerProfile(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update profile image");
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  };

  const styles = {
    page: {
      height: "100vh",
      overflow: "hidden",
      background: darkMode
        ? "radial-gradient(circle at top right, rgba(14,165,233,0.12), transparent 28%), linear-gradient(160deg, #020617 0%, #0f172a 48%, #111827 100%)"
        : "radial-gradient(circle at top right, rgba(56,189,248,0.18), transparent 25%), linear-gradient(160deg, #e0f2fe 0%, #eff6ff 50%, #f8fafc 100%)",
      color: darkMode ? "#e2e8f0" : "#0f172a",
    },

    shell: {
      display: "grid",
      gridTemplateColumns: "minmax(230px, 270px) minmax(0, 1fr)",
      height: "100vh",
    },

    sidebar: {
      height: "100vh",
      padding: "28px 20px",
      borderRight: darkMode
        ? "1px solid rgba(148,163,184,0.12)"
        : "1px solid rgba(148,163,184,0.18)",
      background: darkMode ? "rgba(2,6,23,0.74)" : "rgba(255,255,255,0.64)",
      backdropFilter: "blur(18px)",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      overflow: "hidden",
    },

    brand: {
      padding: "18px",
      borderRadius: "24px",
      background: darkMode
        ? "linear-gradient(145deg, rgba(37,99,235,0.2), rgba(14,165,233,0.12))"
        : "linear-gradient(145deg, rgba(37,99,235,0.1), rgba(14,165,233,0.06))",
      border: "1px solid rgba(59,130,246,0.16)",
    },

    profileTop: {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      marginBottom: "14px",
    },

    profileAvatar: {
      position: "relative",
      width: "64px",
      height: "64px",
      borderRadius: "20px",
      display: "grid",
      placeItems: "center",
      background: "linear-gradient(135deg, #2563eb, #06b6d4)",
      color: "#fff",
      fontWeight: "800",
      fontSize: "1.2rem",
      boxShadow: "0 14px 30px rgba(37,99,235,0.22)",
      overflow: "hidden",
      flexShrink: 0,
    },

    profileAvatarImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },

    profileUploadBadge: {
      position: "absolute",
      right: "4px",
      bottom: "4px",
      width: "24px",
      height: "24px",
      borderRadius: "999px",
      border: "none",
      background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
      color: "#fff",
      display: "grid",
      placeItems: "center",
      boxShadow: "0 10px 20px rgba(37,99,235,0.32)",
      cursor: "pointer",
    },

    profileMeta: {
      minWidth: 0,
    },

    brandLabel: {
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: "0.24em",
      color: "#0ea5e9",
      marginBottom: "10px",
      fontWeight: "700",
    },

    brandTitle: {
      fontSize: "1.2rem",
      fontWeight: "800",
      color: darkMode ? "#f8fafc" : "#0f172a",
      marginBottom: "4px",
    },

    brandText: {
      color: darkMode ? "#94a3b8" : "#475569",
      lineHeight: 1.6,
      fontSize: "0.95rem",
    },

    profileEmail: {
      color: darkMode ? "#cbd5e1" : "#334155",
      fontSize: "0.92rem",
      fontWeight: "600",
      marginTop: "6px",
      wordBreak: "break-word",
    },

    profileUploadLabel: {
      position: "absolute",
      inset: 0,
      cursor: "pointer",
    },

    uploadHint: {
      marginTop: "10px",
      color: darkMode ? "#94a3b8" : "#475569",
      fontSize: "0.82rem",
      fontWeight: "700",
    },

    hiddenInput: {
      display: "none",
    },

    navGroup: {
      display: "grid",
      gap: "10px",
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      paddingRight: "4px",
    },

    navButton: (active) => ({
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "14px 16px",
      borderRadius: "16px",
      border: "none",
      cursor: "pointer",
      fontWeight: "700",
      textAlign: "left",
      background: active
        ? "linear-gradient(135deg, #2563eb, #0ea5e9)"
        : darkMode
        ? "rgba(15,23,42,0.58)"
        : "rgba(255,255,255,0.78)",
      color: active ? "#fff" : darkMode ? "#cbd5e1" : "#1e293b",
      boxShadow: active ? "0 16px 32px rgba(37,99,235,0.24)" : "none",
    }),

    logoutButton: {
      border: "none",
      borderRadius: "18px",
      padding: "13px 16px",
      background: "linear-gradient(135deg, #ef4444, #b91c1c)",
      color: "#fff",
      fontWeight: "800",
      cursor: "pointer",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "10px",
      position: "sticky",
      bottom: 0,
    },

    main: {
      height: "100vh",
      padding: "clamp(18px, 3vw, 34px)",
      display: "grid",
      gap: "24px",
      overflowY: view === "dashboard" ? "hidden" : "auto",
    },

    topBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "16px",
      padding: "22px",
      borderRadius: "28px",
      background: darkMode ? "rgba(15,23,42,0.58)" : "rgba(255,255,255,0.74)",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.12)"
        : "1px solid rgba(148,163,184,0.18)",
      boxShadow: "0 18px 44px rgba(15,23,42,0.14)",
    },

    topCopy: {
      maxWidth: "560px",
    },

    overline: {
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: "0.24em",
      color: "#0ea5e9",
      marginBottom: "8px",
      fontWeight: "700",
    },

    title: {
      fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
      fontWeight: "800",
      color: darkMode ? "#f8fafc" : "#0f172a",
      marginBottom: "8px",
    },

    text: {
      color: darkMode ? "#94a3b8" : "#475569",
      lineHeight: 1.7,
      fontSize: "0.98rem",
    },

    controls: {
      display: "flex",
      gap: "12px",
      alignItems: "center",
      flexWrap: "wrap",
    },

    search: {
      minWidth: "220px",
      padding: "12px 16px",
      borderRadius: "999px",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.18)"
        : "1px solid rgba(148,163,184,0.22)",
      background: darkMode ? "rgba(2,6,23,0.55)" : "#ffffff",
      color: darkMode ? "#f8fafc" : "#0f172a",
      outline: "none",
    },

    toggle: {
      border: "none",
      borderRadius: "999px",
      padding: "12px 16px",
      background: darkMode ? "#f8fafc" : "#0f172a",
      color: darkMode ? "#0f172a" : "#f8fafc",
      fontWeight: "700",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },

    metricGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
      gap: "16px",
    },

    metricCard: {
      padding: "20px",
      borderRadius: "24px",
      background: darkMode
        ? "linear-gradient(145deg, rgba(15,23,42,0.72), rgba(30,41,59,0.66))"
        : "linear-gradient(145deg, rgba(255,255,255,0.92), rgba(241,245,249,0.95))",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.12)"
        : "1px solid rgba(148,163,184,0.14)",
      boxShadow: "0 18px 42px rgba(15,23,42,0.12)",
    },

    metricLabel: {
      color: darkMode ? "#94a3b8" : "#64748b",
      textTransform: "uppercase",
      letterSpacing: "0.14em",
      fontSize: "0.76rem",
      marginBottom: "14px",
    },

    metricValue: {
      fontSize: "2rem",
      fontWeight: "800",
      color: darkMode ? "#f8fafc" : "#0f172a",
      marginBottom: "8px",
    },

    metricHint: {
      color: darkMode ? "#cbd5e1" : "#334155",
      fontSize: "0.94rem",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },

    sectionCard: {
      padding: "22px",
      borderRadius: "28px",
      background: darkMode ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.78)",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.12)"
        : "1px solid rgba(148,163,184,0.16)",
      boxShadow: "0 20px 48px rgba(15,23,42,0.12)",
    },

    sectionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "14px",
      flexWrap: "wrap",
      marginBottom: "18px",
    },

    sectionTitle: {
      color: darkMode ? "#f8fafc" : "#0f172a",
      fontSize: "1.25rem",
      fontWeight: "800",
      marginBottom: "6px",
    },

    sectionText: {
      color: darkMode ? "#94a3b8" : "#64748b",
      lineHeight: 1.6,
      fontSize: "0.94rem",
    },

    dashboardGrid: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.9fr)",
      gap: "20px",
      alignItems: "start",
      minHeight: 0,
    },

    stack: {
      display: "grid",
      gap: "20px",
    },

    chartWrap: {
      height: "240px",
      marginTop: "8px",
    },

    addBtn: {
      border: "none",
      borderRadius: "16px",
      padding: "12px 16px",
      background: "linear-gradient(135deg, #22c55e, #15803d)",
      color: "#fff",
      fontWeight: "800",
      cursor: "pointer",
    },

    modal: {
      position: "fixed",
      inset: 0,
      background: "rgba(2,6,23,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "18px",
      zIndex: 50,
    },

    modalBox: {
      width: "100%",
      maxWidth: "470px",
      background: darkMode ? "#0f172a" : "#ffffff",
      borderRadius: "28px",
      padding: "20px",
      position: "relative",
      boxShadow: "0 28px 70px rgba(15,23,42,0.22)",
    },

    close: {
      position: "absolute",
      top: "14px",
      right: "14px",
      width: "34px",
      height: "34px",
      borderRadius: "999px",
      border: "none",
      background: "#ef4444",
      color: "#fff",
      cursor: "pointer",
      fontWeight: "800",
    },

    attendanceTableWrap: {
      overflowX: "auto",
      borderRadius: "20px",
    },

    table: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: "0 10px",
      minWidth: "720px",
    },

    th: {
      padding: "14px",
      fontSize: "13px",
      fontWeight: "700",
      textAlign: "center",
      color: darkMode ? "#e2e8f0" : "#0f172a",
      background: darkMode ? "#1e293b" : "#dbeafe",
    },

    tr: {
      background: darkMode ? "#0f172a" : "#f8fafc",
      boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
    },

    td: {
      padding: "14px",
      textAlign: "center",
      color: darkMode ? "#e2e8f0" : "#0f172a",
    },

    badge: (color) => ({
      padding: "6px 14px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "800",
      color: "#fff",
      display: "inline-block",
      background: color,
    }),

    todoInputRow: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginBottom: "16px",
    },

    input: {
      flex: 1,
      minWidth: "220px",
      padding: "12px 14px",
      borderRadius: "14px",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.18)"
        : "1px solid rgba(148,163,184,0.2)",
      background: darkMode ? "rgba(2,6,23,0.5)" : "#ffffff",
      color: darkMode ? "#f8fafc" : "#0f172a",
      outline: "none",
    },

    todoCard: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
      padding: "14px 16px",
      marginBottom: "10px",
      borderRadius: "18px",
      background: darkMode ? "rgba(2,6,23,0.42)" : "#f8fafc",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.1)"
        : "1px solid rgba(148,163,184,0.12)",
    },

    todoActions: {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
    },

    actionButton: {
      border: "none",
      borderRadius: "12px",
      padding: "8px 12px",
      cursor: "pointer",
      fontWeight: "700",
      background: darkMode ? "#1e293b" : "#e2e8f0",
      color: darkMode ? "#f8fafc" : "#0f172a",
    },

    filterRow: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginBottom: "18px",
    },

    filterButton: (active) => ({
      border: "none",
      borderRadius: "999px",
      padding: "10px 14px",
      fontWeight: "700",
      cursor: "pointer",
      background: active
        ? "linear-gradient(135deg, #2563eb, #0ea5e9)"
        : darkMode
        ? "rgba(15,23,42,0.58)"
        : "#e2e8f0",
      color: active ? "#fff" : darkMode ? "#cbd5e1" : "#0f172a",
    }),

    leaveGrid: {
      display: "grid",
      gap: "14px",
    },

    leaveCard: {
      padding: "18px",
      borderRadius: "20px",
      background: darkMode ? "rgba(2,6,23,0.42)" : "#f8fafc",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.1)"
        : "1px solid rgba(148,163,184,0.12)",
      display: "grid",
      gap: "12px",
    },

    leaveTop: {
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap",
      alignItems: "center",
    },

    leaveTitle: {
      fontWeight: "800",
      color: darkMode ? "#f8fafc" : "#0f172a",
      marginBottom: "4px",
    },

    leaveMeta: {
      color: darkMode ? "#94a3b8" : "#64748b",
      lineHeight: 1.6,
      fontSize: "0.93rem",
    },

    leaveActions: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    },

    approveBtn: {
      border: "none",
      borderRadius: "12px",
      padding: "10px 14px",
      background: "linear-gradient(135deg, #22c55e, #15803d)",
      color: "#fff",
      fontWeight: "800",
      cursor: "pointer",
    },

    rejectBtn: {
      border: "none",
      borderRadius: "12px",
      padding: "10px 14px",
      background: "linear-gradient(135deg, #ef4444, #b91c1c)",
      color: "#fff",
      fontWeight: "800",
      cursor: "pointer",
    },

    meetingFormGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "12px",
      marginBottom: "14px",
    },

    meetingList: {
      display: "grid",
      gap: "12px",
    },

    meetingCard: {
      padding: "18px",
      borderRadius: "20px",
      background: darkMode ? "rgba(2,6,23,0.42)" : "#f8fafc",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.1)"
        : "1px solid rgba(148,163,184,0.12)",
      display: "grid",
      gap: "10px",
    },

    meetingTitle: {
      fontWeight: "800",
      color: darkMode ? "#f8fafc" : "#0f172a",
    },

    meetingMeta: {
      color: darkMode ? "#94a3b8" : "#64748b",
      fontSize: "0.94rem",
      lineHeight: 1.6,
    },

    externalLink: {
      color: darkMode ? "#7dd3fc" : "#0284c7",
      textDecoration: "none",
      fontWeight: "700",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <aside style={styles.sidebar}>
          <div style={styles.brand}>
      
            <div style={styles.profileTop}>
              <div style={styles.profileAvatar}>
                {managerProfile.image ? (
                  <img
                    src={`${BASE_URL}/uploads/${managerProfile.image}`}
                    alt={formattedManagerName}
                    style={styles.profileAvatarImage}
                  />
                ) : (
                  managerInitials || "M"
                )}
                <label style={styles.profileUploadLabel} title="Update image">
                  <span style={styles.profileUploadBadge}>
                    <Camera size={13} />
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    style={styles.hiddenInput}
                    onChange={handleManagerImageUpload}
                  />
                </label>
              </div>

              <div style={styles.profileMeta}>
                <h2 style={styles.brandTitle}>{formattedManagerName}</h2>
                <p style={styles.brandText}>
                  {(managerProfile.role || "manager").charAt(0).toUpperCase() +
                    (managerProfile.role || "manager").slice(1)}
                </p>
              </div>
            </div>
            {managerProfile.email && (
              <p style={styles.profileEmail}>{managerProfile.email}</p>
            )}
          
            <p style={styles.brandText}>
              Stay in control of your team with real-time insights on employees, attendance, and daily operations.
            </p>
          </div>

          <div style={styles.navGroup}>
            {[
              { key: "dashboard", label: "Dashboard", icon: <LayoutGrid size={16} /> },
              { key: "employees", label: "Employees", icon: <Users size={16} /> },
              { key: "attendance", label: "Attendance", icon: <Activity size={16} /> },
              { key: "leaves", label: "Leaves", icon: <CalendarDays size={16} /> },
              { key: "meetings", label: "Meetings", icon: <Clock3 size={16} /> },
              { key: "messages", label: "Messages", icon: <Users size={16} /> },
              { key: "todos", label: "Todos", icon: <Briefcase size={16} /> },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                style={styles.navButton(view === item.key)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}

            <button onClick={handleLogout} style={styles.logoutButton}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        <main style={styles.main}>
          <section style={styles.topBar}>
            <div style={styles.topCopy}>
              
              <h1 style={styles.title}>Operate With A Clear View</h1>
              <p style={styles.text}>
                Keep track of people, active attendance, and task flow through a more intentional layout that stays readable on both laptop and mobile screens.
              </p>
            </div>

            <div style={styles.controls}>
              <input
                placeholder="Search name, department, salary..."
                style={styles.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <button
                onClick={() => setDarkMode(!darkMode)}
                style={styles.toggle}
              >
                {darkMode ? <SunMedium size={16} /> : <MoonStar size={16} />}
                {darkMode ? "Light" : "Dark"}
              </button>
            </div>
          </section>

          <section style={styles.metricGrid}>
            <div style={styles.metricCard}>
              <p style={styles.metricLabel}>Total Employees</p>
              <h2 style={styles.metricValue}>{employees.length}</h2>
              <p style={styles.metricHint}>
                <Users size={16} />
                Active team records
              </p>
            </div>

            <div style={styles.metricCard}>
              <p style={styles.metricLabel}>Total Salary</p>
              <h2 style={styles.metricValue}>Rs. {totalSalary}</h2>
              <p style={styles.metricHint}>
                <Briefcase size={16} />
                Current payroll snapshot
              </p>
            </div>

            <div style={styles.metricCard}>
              <p style={styles.metricLabel}>Working Right Now</p>
              <h2 style={styles.metricValue}>{activeEmployees}</h2>
              <p style={styles.metricHint}>
                <Activity size={16} />
                Live attendance count
              </p>
            </div>

            <div style={styles.metricCard}>
              <p style={styles.metricLabel}>Pending Leaves</p>
              <h2 style={styles.metricValue}>{pendingLeaveCount}</h2>
              <p style={styles.metricHint}>
                <CalendarDays size={16} />
                Awaiting manager action
              </p>
            </div>
          </section>

          {view === "dashboard" && (
            <section style={styles.dashboardGrid}>
              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div>
                    <h2 style={styles.sectionTitle}>Hiring Pipeline</h2>
                    <p style={styles.sectionText}>
                      A quick visual pulse on department distribution.
                    </p>
                  </div>
                </div>

                <div style={styles.chartWrap}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "HR", value: 4 },
                        { name: "IT", value: 8 },
                        { name: "Sales", value: 5 },
                      ]}
                    >
                      <XAxis dataKey="name" stroke={darkMode ? "#94a3b8" : "#64748b"} />
                      <YAxis stroke={darkMode ? "#94a3b8" : "#64748b"} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div>
                    <h2 style={styles.sectionTitle}>Performance Snapshot</h2>
                    <p style={styles.sectionText}>
                      A high-level placeholder view for team output.
                    </p>
                  </div>
                </div>

                <h2 style={{ ...styles.metricValue, marginBottom: "4px" }}>80.2%</h2>
                <p style={styles.sectionText}>Top performers are moving steadily this week.</p>
              </div>
            </section>
          )}

          {view === "employees" && (
            <section style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Employees</h2>
                  <p style={styles.sectionText}>
                    Browse the team directory, open employee details, or update records.
                  </p>
                </div>

                <button
                  style={styles.addBtn}
                  onClick={() => {
                    setSelectedEmployee(null);
                    setShowForm(true);
                  }}
                >
                  Add Employee
                </button>
              </div>

              <EmployeeTable
                employees={employees}
                loading={loading}
                handleEdit={handleEdit}
                deleteEmployee={deleteEmployee}
                darkMode={darkMode}
              />

              {showForm && (
                <div style={styles.modal}>
                  <div style={styles.modalBox}>
                    <button style={styles.close} onClick={() => setShowForm(false)}>
                      X
                    </button>

                    <EmployeeForm
                      fetchEmployees={fetchEmployees}
                      setShowForm={setShowForm}
                      selectedEmployee={selectedEmployee}
                    />
                  </div>
                </div>
              )}
            </section>
          )}

          {view === "attendance" && (
            <section style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Attendance Report</h2>
                  <p style={styles.sectionText}>
                    Monitor who is active right now and how many hours have been logged today.
                  </p>
                </div>
              </div>

              <div style={styles.attendanceTableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {["Employee", "Date", "In", "Out", "Hours", "Status"].map((heading) => (
                        <th key={heading} style={styles.th}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {attendanceData.map((item) => (
                      <tr key={item._id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: "700" }}>{item.employeeName}</td>
                        <td style={styles.td}>{item.date || "-"}</td>
                        <td style={styles.td}>
                          {item.punchIn
                            ? new Date(item.punchIn).toLocaleTimeString()
                            : "-"}
                        </td>
                        <td style={styles.td}>
                          {item.punchOut
                            ? new Date(item.punchOut).toLocaleTimeString()
                            : "-"}
                        </td>
                        <td style={styles.td}>
                          {getLiveWorkedHours(item)
                            ? `${getLiveWorkedHours(item).toFixed(2)} hrs`
                            : "-"}
                        </td>
                        <td style={styles.td}>
                          <span style={styles.badge(getAttendanceColor(item))}>
                            {getAttendanceLabel(item)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {view === "todos" && (
            <section style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Todo Manager</h2>
                  <p style={styles.sectionText}>
                    Keep your quick admin reminders visible and easy to edit.
                  </p>
                </div>
              </div>

              <div style={styles.todoInputRow}>
                <input
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  placeholder="Enter task..."
                  style={styles.input}
                />

                <button onClick={addTodo} style={styles.addBtn}>
                  Add
                </button>
              </div>

              {todos.map((todo) => (
                <div key={todo._id} style={styles.todoCard}>
                  {editingId === todo._id ? (
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      style={styles.input}
                    />
                  ) : (
                    <span
                      style={{
                        textDecoration: todo.completed ? "line-through" : "none",
                        opacity: todo.completed ? 0.6 : 1,
                        color: darkMode ? "#f8fafc" : "#0f172a",
                        fontWeight: "600",
                        flex: 1,
                        minWidth: "200px",
                      }}
                    >
                      {todo.text}
                    </span>
                  )}

                  <div style={styles.todoActions}>
                    <button style={styles.actionButton} onClick={() => toggleTodo(todo)}>
                      {todo.completed ? "Undo" : "Done"}
                    </button>

                    {editingId === todo._id ? (
                      <button style={styles.actionButton} onClick={() => saveEdit(todo._id)}>
                        Save
                      </button>
                    ) : (
                      <button
                        style={styles.actionButton}
                        onClick={() => {
                          setEditingId(todo._id);
                          setEditText(todo.text);
                        }}
                      >
                        Edit
                      </button>
                    )}

                    <button
                      style={styles.actionButton}
                      onClick={() => deleteTodo(todo._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {view === "leaves" && (
            <section style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Leave Management</h2>
                  <p style={styles.sectionText}>
                    Review employee leave requests and push decisions back to their dashboard.
                  </p>
                </div>
              </div>

              <div style={styles.filterRow}>
                {["all", "pending", "approved", "rejected"].map((item) => (
                  <button
                    key={item}
                    style={styles.filterButton(leaveFilter === item)}
                    onClick={() => setLeaveFilter(item)}
                  >
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </button>
                ))}
              </div>

              <div style={styles.leaveGrid}>
                {leaveRequests.length === 0 ? (
                  <div style={styles.sectionText}>No leave requests found in this view.</div>
                ) : (
                  leaveRequests.map((leave) => {
                    const badge = getLeaveBadge(leave.status);

                    return (
                      <div key={leave._id} style={styles.leaveCard}>
                        <div style={styles.leaveTop}>
                          <div>
                            <div style={styles.leaveTitle}>
                              {leave.employeeName} • {leave.type}
                            </div>
                            <div style={styles.leaveMeta}>
                              {leave.department || "No department"} •{" "}
                              {leave.duration === "half"
                                ? `${formatDate(leave.startDate)} • ${getLeaveSessionLabel(
                                    leave
                                  )} half`
                                : `${formatDate(leave.startDate)} to ${formatDate(
                                    leave.endDate
                                  )} • ${getLeaveSessionLabel(leave)} • ${leave.days} day${
                                    leave.days > 1 ? "s" : ""
                                  }`}
                            </div>
                          </div>

                          <span style={styles.badge(badge.color)}>{badge.label}</span>
                        </div>

                        <div style={styles.leaveMeta}>{leave.reason}</div>

                        {leave.managerNote ? (
                          <div style={styles.leaveMeta}>
                            Manager note: {leave.managerNote}
                          </div>
                        ) : null}

                        <div style={styles.leaveActions}>
                          <button
                            style={styles.approveBtn}
                            onClick={() => reviewLeave(leave._id, "approved")}
                            disabled={reviewLoadingId === leave._id}
                          >
                            {reviewLoadingId === leave._id && leave.status !== "approved"
                              ? "Saving..."
                              : "Approve"}
                          </button>

                          <button
                            style={styles.rejectBtn}
                            onClick={() => reviewLeave(leave._id, "rejected")}
                            disabled={reviewLoadingId === leave._id}
                          >
                            {reviewLoadingId === leave._id && leave.status !== "rejected"
                              ? "Saving..."
                              : "Reject"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {view === "meetings" && (
            <section style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Meeting Schedule</h2>
                  <p style={styles.sectionText}>
                    Plan internal syncs, reviews, and one-on-ones in one simple manager view.
                  </p>
                </div>
              </div>

              <form onSubmit={addMeeting}>
                <div style={styles.meetingFormGrid}>
                  <input
                    style={styles.input}
                    placeholder="Meeting title"
                    value={meetingForm.title}
                    onChange={(e) =>
                      setMeetingForm((current) => ({
                        ...current,
                        title: e.target.value,
                      }))
                    }
                  />

                  <input
                    type="date"
                    style={styles.input}
                    value={meetingForm.date}
                    onChange={(e) =>
                      setMeetingForm((current) => ({
                        ...current,
                        date: e.target.value,
                      }))
                    }
                  />

                  <input
                    type="time"
                    style={styles.input}
                    value={meetingForm.startTime}
                    onChange={(e) =>
                      setMeetingForm((current) => ({
                        ...current,
                        startTime: e.target.value,
                      }))
                    }
                  />

                  <input
                    type="time"
                    style={styles.input}
                    value={meetingForm.endTime}
                    onChange={(e) =>
                      setMeetingForm((current) => ({
                        ...current,
                        endTime: e.target.value,
                      }))
                    }
                  />

                  <input
                    style={styles.input}
                    placeholder="Attendees"
                    value={meetingForm.attendees}
                    onChange={(e) =>
                      setMeetingForm((current) => ({
                        ...current,
                        attendees: e.target.value,
                      }))
                    }
                  />

                  <select
                    style={styles.input}
                    value={meetingForm.mode}
                    onChange={(e) =>
                      setMeetingForm((current) => ({
                        ...current,
                        mode: e.target.value,
                      }))
                    }
                  >
                    <option value="Google Meet">Google Meet</option>
                    <option value="In Person">In Person</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>

                  <input
                    style={styles.input}
                    placeholder="Google Meet link"
                    value={meetingForm.meetLink}
                    onChange={(e) =>
                      setMeetingForm((current) => ({
                        ...current,
                        meetLink: e.target.value,
                      }))
                    }
                  />
                </div>

                <textarea
                  style={{ ...styles.input, minHeight: "96px", resize: "vertical" }}
                  placeholder="Agenda or notes"
                  value={meetingForm.agenda}
                  onChange={(e) =>
                    setMeetingForm((current) => ({
                      ...current,
                      agenda: e.target.value,
                    }))
                  }
                />

                <button type="submit" style={styles.addBtn}>
                  Add Meeting
                </button>
              </form>

              <div style={{ ...styles.meetingList, marginTop: "18px" }}>
                {meetings.length === 0 ? (
                  <div style={styles.sectionText}>No meetings scheduled yet.</div>
                ) : (
                  meetings.map((meeting) => (
                    <div key={meeting._id} style={styles.meetingCard}>
                      <div style={styles.leaveTop}>
                        <div>
                          <div style={styles.meetingTitle}>{meeting.title}</div>
                          <div style={styles.meetingMeta}>
                            {formatDate(meeting.date)} | {meeting.startTime} - {meeting.endTime} |{" "}
                            {meeting.mode}
                          </div>
                        </div>

                        <button
                          style={styles.actionButton}
                          onClick={() => deleteMeeting(meeting._id)}
                        >
                          Delete
                        </button>
                      </div>

                      <div style={styles.meetingMeta}>
                        Attendees: {meeting.attendees || "Team members"}
                      </div>

                       {meeting.agenda ? (
                        <div style={styles.meetingMeta}>Agenda: {meeting.agenda}</div>
                      ) : null}

                      <div style={styles.meetingMeta}>
                        {meeting.meetLink ? (
                          <a
                            href={meeting.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.externalLink}
                          >
                            Open Meet Link
                          </a>
                        ) : (
                          <a
                            href={getGoogleCalendarUrl(meeting)}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.externalLink}
                          >
                            Schedule in Google Calendar / Add Google Meet
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {view === "messages" && (
            <section style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Employee Messages</h2>
                  <p style={styles.sectionText}>
                    Chat with each employee in a simple WhatsApp-style thread.
                  </p>
                </div>
              </div>

              <ChatPanel
                contacts={contacts}
                activeContact={activeContact}
                onSelectContact={setActiveContact}
                messages={messages}
                messageText={messageText}
                onMessageTextChange={setMessageText}
                onSendMessage={sendMessage}
                onEditMessage={editMessage}
                onDeleteMessage={deleteMessage}
                loadingContacts={contactsLoading}
                loadingMessages={messagesLoading}
                darkMode={darkMode}
              />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default ManagerDashboard;
