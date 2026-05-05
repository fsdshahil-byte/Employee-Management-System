import { memo, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Briefcase,
  CalendarDays,
  CheckCircle,
  Clock3,
  LayoutGrid,
  LogOut,
  MessageCircleMore,
  MoonStar,
  SunMedium,
  User,
  Users,
} from "lucide-react";
import API from "../api/axios";
import EmployeeAttendance from "../components/EmplooyeeAttendance";
import ChatPanel from "../components/ChatPanel";
import { getUploadUrl, SOCKET_URL } from "../config";

const MemoEmployeeAttendance = memo(EmployeeAttendance);

const UPCOMING_HOLIDAYS = [
  { name: "May Day", date: "2026-05-01" },
  { name: "Id-ul Ad'ha (Bakrid)", date: "2026-05-27" },
  { name: "Muharram", date: "2026-06-25" },
  { name: "Independence Day", date: "2026-08-15" },
];

export default function EmployeeDashboard() {
  const token = localStorage.getItem("token");
  const [activeView, setActiveView] = useState("dashboard");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("employeeDarkMode");
    return saved === null ? false : saved === "true";
  });

  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [contactsLoading, setContactsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: "Casual Leave",
    duration: "full",
    session: "full-day",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const fetchEmployee = async () => {
    try {
      const res = await API.get("/employees/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployee(res.data.employee);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await API.get("/tasks/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async () => {
    try {
      setLeaveLoading(true);
      const res = await API.get("/leaves/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaveRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLeaveLoading(false);
    }
  };

  const fetchMeetings = async () => {
    try {
      setMeetingsLoading(true);
      const res = await API.get("/meetings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMeetings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setMeetingsLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      setContactsLoading(true);
      const res = await API.get("/messages/contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const res = await API.get(`/messages/conversation/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchEmployee();
      fetchTasks();
      fetchLeaves();
      fetchMeetings();
      fetchContacts();
    }
  }, [token]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("employeeDarkMode", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on("leaveUpdated", () => {
      fetchLeaves();
    });

    socket.on("taskUpdated", () => {
      fetchTasks();
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
  }, [activeContact?.userId]);

  useEffect(() => {
    if (activeContact?.userId) {
      fetchConversation(activeContact.userId);
    } else {
      setMessages([]);
    }
  }, [activeContact?.userId]);

  const toggleTask = async (id, currentStatus) => {
    try {
      const newStatus =
        currentStatus === "completed" ? "pending" : "completed";
      await API.put(`/tasks/${id}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const submitLeaveRequest = async (e) => {
    e.preventDefault();

    const payload = {
      ...leaveForm,
      endDate:
        leaveForm.duration === "half"
          ? leaveForm.startDate
          : leaveForm.endDate,
    };

    try {
      setLeaveSubmitting(true);
      await API.post("/leaves", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLeaveForm({
        type: "Casual Leave",
        duration: "full",
        session: "full-day",
        startDate: "",
        endDate: "",
        reason: "",
      });
      fetchLeaves();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to submit leave request");
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!activeContact?.userId || !messageText.trim()) return;

    try {
      await API.post(
        "/messages",
        {
          recipientUserId: activeContact.userId,
          text: messageText,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
      await API.put(
        `/messages/${messageId}`,
        {
          text: text.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchConversation(activeContact.userId);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to edit message");
    }
  };

  const deleteMessage = async (messageId) => {
    if (!activeContact?.userId) return;

    try {
      await API.delete(`/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchConversation(activeContact.userId);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete message");
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter === "completed") return task.status === "completed";
      if (filter === "pending") return task.status === "pending";
      return true;
    });
  }, [tasks, filter]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pendingTaskCount = tasks.filter((task) => task.status === "pending").length;
  const completedTaskCount = tasks.filter(
    (task) => task.status === "completed"
  ).length;
  const approvedLeaves = leaveRequests.filter(
    (leave) => leave.status === "approved"
  ).length;
  const pendingLeaves = leaveRequests.filter(
    (leave) => leave.status === "pending"
  ).length;

  const activeLeaveRequests = leaveRequests.filter((leave) => {
    const leaveDate = new Date(leave.endDate);
    leaveDate.setHours(0, 0, 0, 0);
    return leave.status === "pending" || leaveDate >= today;
  });

  const pastLeaves = leaveRequests.filter((leave) => {
    const leaveDate = new Date(leave.endDate);
    leaveDate.setHours(0, 0, 0, 0);
    return leaveDate < today || leave.status !== "pending";
  });

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

  const getLeaveBadge = (status) => {
    if (status === "approved") {
      return {
        label: "Approved",
        background: "rgba(34,197,94,0.18)",
        color: "#86efac",
      };
    }

    if (status === "rejected") {
      return {
        label: "Rejected",
        background: "rgba(239,68,68,0.18)",
        color: "#fca5a5",
      };
    }

    return {
      label: "Pending",
      background: "rgba(251,191,36,0.18)",
      color: "#fde68a",
    };
  };

  const getLeaveSessionLabel = (leave) => {
    if (leave.session === "morning") return "Morning";
    if (leave.session === "evening") return "Evening";
    return "Full Day";
  };

  const graphData = [
    { name: "Mon", hours: 5 },
    { name: "Tue", hours: 6 },
    { name: "Wed", hours: 7 },
    { name: "Thu", hours: 4 },
    { name: "Fri", hours: 8 },
  ];

  const viewCopy = {
    dashboard: {
      overline: "Employee Dashboard",
      title: "Own Your Workday",
      text: "Attendance stays front and center, while your tasks, leave, and meetings are one click away.",
    },
    tasks: {
      overline: "Task Board",
      title: "Focus On What Is Open",
      text: "Jump straight into your assigned work and mark progress without searching around the page.",
    },
    leaves: {
      overline: "Leave Desk",
      title: "Plan Time Away Clearly",
      text: "Request leave with full-day, half-day, morning, or evening slots and keep history visible.",
    },
    meetings: {
      overline: "Meeting Schedule",
      title: "Stay Ready For Team Calls",
      text: "See your shared meeting schedule and open the meet link directly when it is time to join.",
    },
    messages: {
      overline: "Messages",
      title: "Stay In Touch With Your Manager",
      text: "Use a direct chat-style thread to ask questions, share updates, and get quick replies.",
    },
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background: darkMode
        ? "radial-gradient(circle at top left, rgba(14,165,233,0.14), transparent 28%), linear-gradient(160deg, #020617 0%, #0f172a 48%, #111827 100%)"
        : "radial-gradient(circle at top left, rgba(56,189,248,0.18), transparent 25%), linear-gradient(160deg, #e0f2fe 0%, #eff6ff 50%, #f8fafc 100%)",
      color: darkMode ? "#e2e8f0" : "#0f172a",
    },
    shell: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "minmax(240px, 280px) minmax(0, 1fr)",
      minHeight: "100vh",
    },
    sidebar: {
      padding: isMobile ? "18px 16px" : "28px 20px",
      borderRight: isMobile
        ? "none"
        : darkMode
        ? "1px solid rgba(148,163,184,0.12)"
        : "1px solid rgba(148,163,184,0.18)",
      borderBottom: isMobile
        ? darkMode
          ? "1px solid rgba(148,163,184,0.12)"
          : "1px solid rgba(148,163,184,0.18)"
        : "none",
      background: darkMode ? "rgba(2,6,23,0.72)" : "rgba(255,255,255,0.72)",
      backdropFilter: "blur(18px)",
      display: "flex",
      flexDirection: "column",
      gap: "18px",
    },
    brand: {
      padding: "18px",
      borderRadius: "24px",
      background: darkMode
        ? "linear-gradient(145deg, rgba(14,165,233,0.16), rgba(34,197,94,0.1))"
        : "linear-gradient(145deg, rgba(37,99,235,0.1), rgba(14,165,233,0.06))",
      border: "1px solid rgba(125,211,252,0.18)",
      display: "grid",
      gap: "14px",
    },
    brandLabel: {
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: "0.24em",
      color: darkMode ? "#67e8f9" : "#0284c7",
      fontWeight: "700",
    },
    profileRow: {
      display: "flex",
      alignItems: "center",
      gap: "14px",
    },
    avatar: {
      width: "58px",
      height: "58px",
      borderRadius: "18px",
      display: "grid",
      placeItems: "center",
      background: "linear-gradient(135deg, #0ea5e9, #22c55e)",
      color: "#fff",
      flexShrink: 0,
      objectFit: "cover",
    },
    userName: {
      color: darkMode ? "#f8fafc" : "#0f172a",
      fontWeight: "800",
      marginBottom: "4px",
      fontSize: "1.02rem",
    },
    userMeta: {
      color: darkMode ? "#cbd5e1" : "#475569",
      fontSize: "0.92rem",
      lineHeight: 1.5,
    },
    brandText: {
      color: darkMode ? "#94a3b8" : "#475569",
      lineHeight: 1.6,
      fontSize: "0.95rem",
    },
    navGroup: {
      display: isMobile ? "flex" : "grid",
      flexWrap: "wrap",
      gap: "10px",
    },
    navButton: (active) => ({
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "14px 16px",
      borderRadius: "16px",
      border: "1px solid rgba(148,163,184,0.08)",
      background: active
        ? "linear-gradient(135deg, #0ea5e9, #2563eb)"
        : darkMode
        ? "rgba(15,23,42,0.6)"
        : "rgba(255,255,255,0.8)",
      color: active ? "#fff" : darkMode ? "#fff" : "#0f172a",
      fontWeight: "700",
      cursor: "pointer",
      textAlign: "left",
      flex: isMobile ? "1 1 140px" : "unset",
    }),
    logoutButton: {
      marginTop: isMobile ? "0" : "auto",
      width: "100%",
      border: "none",
      borderRadius: "16px",
      padding: "12px 16px",
      background: "linear-gradient(135deg, #ef4444, #b91c1c)",
      color: "#fff",
      fontWeight: "800",
      cursor: "pointer",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "10px",
    },
    main: {
      padding: isMobile ? "16px" : "clamp(18px, 3vw, 34px)",
      display: "grid",
      gap: "24px",
      overflowY: "auto",
    },
    topBar: {
      padding: isMobile ? "16px" : "20px 22px",
      borderRadius: "28px",
      background: darkMode ? "rgba(15,23,42,0.58)" : "rgba(255,255,255,0.74)",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.12)"
        : "1px solid rgba(148,163,184,0.18)",
      boxShadow: "0 18px 45px rgba(2,6,23,0.22)",
      display: "grid",
      gap: "18px",
    },
    overline: {
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: "0.24em",
      color: darkMode ? "#38bdf8" : "#0284c7",
      marginBottom: "8px",
      fontWeight: "700",
    },
    pageTitle: {
      fontSize: "clamp(1.7rem, 4vw, 2.6rem)",
      fontWeight: "800",
      color: darkMode ? "#f8fafc" : "#0f172a",
      marginBottom: "8px",
    },
    pageText: {
      color: darkMode ? "#94a3b8" : "#475569",
      lineHeight: 1.7,
      fontSize: "0.98rem",
    },
    metricsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
      gap: "16px",
    },
    metricCard: {
      padding: "20px",
      borderRadius: "24px",
      background: darkMode
        ? "linear-gradient(145deg, rgba(15,23,42,0.72), rgba(30,41,59,0.68))"
        : "linear-gradient(145deg, rgba(255,255,255,0.94), rgba(241,245,249,0.95))",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.12)"
        : "1px solid rgba(148,163,184,0.14)",
      boxShadow: darkMode
        ? "0 18px 45px rgba(2,6,23,0.18)"
        : "0 18px 40px rgba(15,23,42,0.08)",
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
    contentGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
      gap: "20px",
      alignItems: "start",
    },
    leaveGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
      gap: "20px",
      alignItems: "start",
    },
    sectionCard: {
      padding: isMobile ? "16px" : "22px",
      borderRadius: "28px",
      background: darkMode ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.78)",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.12)"
        : "1px solid rgba(148,163,184,0.16)",
      boxShadow: "0 20px 48px rgba(2,6,23,0.18)",
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
    filterRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      marginBottom: "16px",
    },
    filterButton: (active) => ({
      border: "none",
      borderRadius: "999px",
      padding: "10px 14px",
      fontWeight: "700",
      cursor: "pointer",
      background: active
        ? "linear-gradient(135deg, #0ea5e9, #2563eb)"
        : darkMode
        ? "rgba(30,41,59,0.82)"
        : "#e2e8f0",
      color: active ? "#fff" : darkMode ? "#fff" : "#0f172a",
    }),
    taskList: {
      display: "grid",
      gap: "12px",
    },
    taskRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
      padding: "15px 16px",
      borderRadius: "18px",
      background: darkMode ? "rgba(2,6,23,0.34)" : "#f8fafc",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.08)"
        : "1px solid rgba(148,163,184,0.12)",
    },
    taskTitle: (done) => ({
      color: done ? "#64748b" : darkMode ? "#f8fafc" : "#0f172a",
      textDecoration: done ? "line-through" : "none",
      fontWeight: "600",
      flex: 1,
      minWidth: "180px",
    }),
    doneButton: {
      border: "none",
      borderRadius: "14px",
      padding: "10px 14px",
      background: "linear-gradient(135deg, #22c55e, #15803d)",
      color: "#fff",
      fontWeight: "800",
      cursor: "pointer",
    },
    emptyState: {
      padding: "20px",
      borderRadius: "18px",
      textAlign: "center",
      color: darkMode ? "#94a3b8" : "#64748b",
      background: darkMode ? "rgba(2,6,23,0.3)" : "rgba(255,255,255,0.65)",
      border: "1px dashed rgba(148,163,184,0.2)",
    },
    chartWrap: {
      height: isMobile ? "220px" : "250px",
      marginTop: "8px",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
      gap: "12px",
      marginBottom: "12px",
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "14px",
      border: "1px solid rgba(148,163,184,0.18)",
      background: darkMode ? "rgba(2,6,23,0.36)" : "#ffffff",
      color: darkMode ? "#f8fafc" : "#0f172a",
      outline: "none",
    },
    readOnlyInput: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "14px",
      border: "1px solid rgba(148,163,184,0.18)",
      background: darkMode ? "rgba(30,41,59,0.55)" : "#e2e8f0",
      color: darkMode ? "#cbd5e1" : "#334155",
      display: "flex",
      alignItems: "center",
      minHeight: "48px",
    },
    textarea: {
      width: "100%",
      minHeight: "110px",
      padding: "12px 14px",
      borderRadius: "16px",
      border: "1px solid rgba(148,163,184,0.18)",
      background: darkMode ? "rgba(2,6,23,0.36)" : "#ffffff",
      color: darkMode ? "#f8fafc" : "#0f172a",
      outline: "none",
      resize: "vertical",
      marginBottom: "12px",
    },
    submitButton: {
      border: "none",
      borderRadius: "16px",
      padding: "12px 16px",
      background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
      color: "#fff",
      fontWeight: "800",
      cursor: "pointer",
    },
    leaveList: {
      display: "grid",
      gap: "12px",
      marginTop: "18px",
    },
    leaveCard: {
      padding: "16px",
      borderRadius: "18px",
      background: darkMode ? "rgba(2,6,23,0.34)" : "#f8fafc",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.08)"
        : "1px solid rgba(148,163,184,0.12)",
      display: "grid",
      gap: "10px",
    },
    leaveTop: {
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap",
      alignItems: "center",
    },
    leaveType: {
      color: darkMode ? "#f8fafc" : "#0f172a",
      fontWeight: "800",
    },
    leaveMeta: {
      color: darkMode ? "#94a3b8" : "#64748b",
      fontSize: "0.92rem",
      lineHeight: 1.6,
    },
    statusBadge: (badge) => ({
      padding: "6px 12px",
      borderRadius: "999px",
      background: badge.background,
      color: badge.color,
      fontWeight: "800",
      fontSize: "0.78rem",
    }),
    meetingList: {
      display: "grid",
      gap: "12px",
    },
    meetingCard: {
      padding: "16px",
      borderRadius: "18px",
      background: darkMode ? "rgba(2,6,23,0.34)" : "#f8fafc",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.08)"
        : "1px solid rgba(148,163,184,0.12)",
      display: "grid",
      gap: "8px",
    },
    meetingTitle: {
      color: darkMode ? "#f8fafc" : "#0f172a",
      fontWeight: "800",
    },
    meetingLink: {
      color: darkMode ? "#67e8f9" : "#0284c7",
      textDecoration: "none",
      fontWeight: "700",
    },
    holidayGrid: {
      display: "grid",
      gap: "12px",
    },
    holidayCard: {
      padding: "14px 16px",
      borderRadius: "18px",
      background: darkMode ? "rgba(2,6,23,0.34)" : "#f8fafc",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.08)"
        : "1px solid rgba(148,163,184,0.12)",
    },
    holidayName: {
      color: darkMode ? "#f8fafc" : "#0f172a",
      fontWeight: "800",
      marginBottom: "4px",
    },
    toggle: {
      border: "none",
      borderRadius: "999px",
      padding: "12px 16px",
      background: darkMode ? "#f8fafc" : "#0f172a",
      color: darkMode ? "#0f172a" : "#f8fafc",
      fontWeight: "700",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      width: "fit-content",
    },
  };

  const renderTasksSection = () => (
    <section style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
        <div>
          <h3 style={styles.sectionTitle}>My Tasks</h3>
          <p style={styles.sectionText}>
            Click into your task space from the sidebar and work only on what matters now.
          </p>
        </div>
      </div>

      <div style={styles.filterRow}>
        {["all", "pending", "completed"].map((item) => (
          <button
            key={item}
            style={styles.filterButton(filter === item)}
            onClick={() => setFilter(item)}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      <div style={styles.taskList}>
        {loading ? (
          <div style={styles.emptyState}>Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div style={styles.emptyState}>No tasks in this view.</div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task._id} style={styles.taskRow}>
              <span style={styles.taskTitle(task.status === "completed")}>
                {task.title}
              </span>

              {task.status !== "completed" && (
                <button
                  style={styles.doneButton}
                  onClick={() => toggleTask(task._id, task.status)}
                >
                  Done
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );

  const renderMeetingsSection = () => (
    <section style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
        <div>
          <h3 style={styles.sectionTitle}>Meeting Schedule</h3>
          <p style={styles.sectionText}>
            See upcoming team meetings and open the meet link directly from this panel.
          </p>
        </div>
      </div>

      <div style={styles.meetingList}>
        {meetingsLoading ? (
          <div style={styles.emptyState}>Loading meetings...</div>
        ) : meetings.length === 0 ? (
          <div style={styles.emptyState}>No meetings scheduled yet.</div>
        ) : (
          meetings.map((meeting) => (
            <div key={meeting._id} style={styles.meetingCard}>
              <div style={styles.meetingTitle}>{meeting.title}</div>
              <div style={styles.leaveMeta}>
                {formatDate(meeting.date)} | {meeting.startTime} - {meeting.endTime} |{" "}
                {meeting.mode}
              </div>
              <div style={styles.leaveMeta}>
                Attendees: {meeting.attendees || "Team members"}
              </div>
              {meeting.agenda ? (
                <div style={styles.leaveMeta}>Agenda: {meeting.agenda}</div>
              ) : null}
              {meeting.meetLink ? (
                <a
                  href={meeting.meetLink}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.meetingLink}
                >
                  Join Google Meet
                </a>
              ) : (
                <div style={styles.leaveMeta}>
                  Meet link will appear after the manager adds it.
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );

  const renderMessagesSection = () => (
    <section style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
        <div>
          <h3 style={styles.sectionTitle}>Manager Messages</h3>
          <p style={styles.sectionText}>
            Chat directly with your manager in a simple message thread.
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
  );

  const renderLeavesSection = () => (
    <section style={styles.leaveGrid}>
      <div style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <div>
            <h3 style={styles.sectionTitle}>Leave Request</h3>
            <p style={styles.sectionText}>
              Request full-day or half-day leave and choose a morning or evening slot when needed.
            </p>
          </div>
        </div>

        <form onSubmit={submitLeaveRequest}>
          <div style={styles.formGrid}>
            <select
              style={styles.input}
              value={leaveForm.type}
              onChange={(e) =>
                setLeaveForm((current) => ({
                  ...current,
                  type: e.target.value,
                }))
              }
            >
              {[
                "Casual Leave",
                "Sick Leave",
                "Earned Leave",
                "Work From Home",
              ].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              style={styles.input}
              value={leaveForm.duration}
              onChange={(e) =>
                setLeaveForm((current) => ({
                  ...current,
                  duration: e.target.value,
                  session:
                    e.target.value === "half" && current.session === "full-day"
                      ? "morning"
                      : e.target.value === "full" &&
                        (current.session === "morning" ||
                          current.session === "evening")
                      ? current.session
                      : current.session,
                  endDate:
                    e.target.value === "half"
                      ? current.startDate || current.endDate
                      : current.endDate,
                }))
              }
            >
              <option value="full">Full Leave</option>
              <option value="half">Half Leave</option>
            </select>

            <select
              style={styles.input}
              value={leaveForm.session}
              onChange={(e) =>
                setLeaveForm((current) => ({
                  ...current,
                  session: e.target.value,
                }))
              }
            >
              {leaveForm.duration === "full" ? (
                <>
                  <option value="full-day">Full Day</option>
                  <option value="morning">Morning Part</option>
                  <option value="evening">Evening Part</option>
                </>
              ) : (
                <>
                  <option value="morning">Morning Half</option>
                  <option value="evening">Evening Half</option>
                </>
              )}
            </select>

            <input
              type="date"
              style={styles.input}
              value={leaveForm.startDate}
              onChange={(e) =>
                setLeaveForm((current) => ({
                  ...current,
                  startDate: e.target.value,
                  endDate:
                    current.duration === "half"
                      ? e.target.value
                      : current.endDate,
                }))
              }
              required
            />

            {leaveForm.duration === "full" ? (
              <input
                type="date"
                style={styles.input}
                value={leaveForm.endDate}
                onChange={(e) =>
                  setLeaveForm((current) => ({
                    ...current,
                    endDate: e.target.value,
                  }))
                }
                required
              />
            ) : (
              <div style={styles.readOnlyInput}>
                {leaveForm.session === "morning"
                  ? "Morning half-day will apply on the selected date."
                  : "Evening half-day will apply on the selected date."}
              </div>
            )}
          </div>

          <textarea
            style={styles.textarea}
            placeholder="Reason for leave"
            value={leaveForm.reason}
            onChange={(e) =>
              setLeaveForm((current) => ({
                ...current,
                reason: e.target.value,
              }))
            }
            required
          />

          <button type="submit" style={styles.submitButton} disabled={leaveSubmitting}>
            {leaveSubmitting ? "Submitting..." : "Request Leave"}
          </button>
        </form>

        <div style={styles.leaveList}>
          {leaveLoading ? (
            <div style={styles.emptyState}>Loading active leave requests...</div>
          ) : activeLeaveRequests.length === 0 ? (
            <div style={styles.emptyState}>No active leave requests.</div>
          ) : (
            activeLeaveRequests.map((leave) => {
              const badge = getLeaveBadge(leave.status);

              return (
                <div key={leave._id} style={styles.leaveCard}>
                  <div style={styles.leaveTop}>
                    <div>
                      <div style={styles.leaveType}>{leave.type}</div>
                      <div style={styles.leaveMeta}>
                        {leave.duration === "half"
                          ? `${formatDate(leave.startDate)} | ${getLeaveSessionLabel(
                              leave
                            )} half`
                          : `${formatDate(leave.startDate)} to ${formatDate(
                              leave.endDate
                            )} | ${getLeaveSessionLabel(leave)} | ${leave.days} day${
                              leave.days > 1 ? "s" : ""
                            }`}
                      </div>
                    </div>

                    <span style={styles.statusBadge(badge)}>{badge.label}</span>
                  </div>

                  <div style={styles.leaveMeta}>{leave.reason}</div>

                  {leave.managerNote ? (
                    <div style={styles.leaveMeta}>
                      Manager note: {leave.managerNote}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={{ display: "grid", gap: "20px" }}>
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h3 style={styles.sectionTitle}>Past Leaves</h3>
              <p style={styles.sectionText}>
                Review your previous approved, rejected, and completed leave entries.
              </p>
            </div>
          </div>

          <div style={styles.leaveList}>
            {leaveLoading ? (
              <div style={styles.emptyState}>Loading leave history...</div>
            ) : pastLeaves.length === 0 ? (
              <div style={styles.emptyState}>No past leave history yet.</div>
            ) : (
              pastLeaves.map((leave) => {
                const badge = getLeaveBadge(leave.status);

                return (
                  <div key={leave._id} style={styles.leaveCard}>
                    <div style={styles.leaveTop}>
                      <div>
                        <div style={styles.leaveType}>{leave.type}</div>
                        <div style={styles.leaveMeta}>
                          {leave.duration === "half"
                            ? `${formatDate(leave.startDate)} | ${getLeaveSessionLabel(
                                leave
                              )} half`
                            : `${formatDate(leave.startDate)} to ${formatDate(
                                leave.endDate
                              )} | ${getLeaveSessionLabel(leave)}`}
                        </div>
                      </div>

                      <span style={styles.statusBadge(badge)}>{badge.label}</span>
                    </div>

                    <div style={styles.leaveMeta}>{leave.reason}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h3 style={styles.sectionTitle}>Upcoming Holidays</h3>
              <p style={styles.sectionText}>
                Keep an eye on the next company and public holidays while planning leave.
              </p>
            </div>
          </div>

          <div style={styles.holidayGrid}>
            {UPCOMING_HOLIDAYS.map((holiday) => (
              <div key={holiday.name} style={styles.holidayCard}>
                <div style={styles.holidayName}>{holiday.name}</div>
                <div style={styles.leaveMeta}>{formatDate(holiday.date)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  const renderDashboardView = () => (
    <>
      <section style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <p style={styles.metricLabel}>Completed Tasks</p>
          <h2 style={styles.metricValue}>{completedTaskCount}</h2>
          <p style={styles.metricHint}>
            <CheckCircle size={16} />
            Closed and ready
          </p>
        </div>

        <div style={styles.metricCard}>
          <p style={styles.metricLabel}>Pending Tasks</p>
          <h2 style={styles.metricValue}>{pendingTaskCount}</h2>
          <p style={styles.metricHint}>
            <Clock3 size={16} />
            Still in progress
          </p>
        </div>

        <div style={styles.metricCard}>
          <p style={styles.metricLabel}>Department</p>
          <h2 style={{ ...styles.metricValue, fontSize: "1.45rem" }}>
            {employee?.department || "Not set"}
          </h2>
          <p style={styles.metricHint}>
            <Briefcase size={16} />
            Current team
          </p>
        </div>

        <div style={styles.metricCard}>
          <p style={styles.metricLabel}>Leave Requests</p>
          <h2 style={styles.metricValue}>{pendingLeaves}</h2>
          <p style={styles.metricHint}>
            <CalendarDays size={16} />
            {approvedLeaves} approved so far
          </p>
        </div>
      </section>

      <section style={styles.contentGrid}>
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h3 style={styles.sectionTitle}>Weekly Work Pattern</h3>
              <p style={styles.sectionText}>
                A quick snapshot of your hour distribution across the week.
              </p>
            </div>
          </div>

          <div style={styles.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphData}>
                <XAxis dataKey="name" stroke={darkMode ? "#94a3b8" : "#64748b"} />
                <YAxis stroke={darkMode ? "#94a3b8" : "#64748b"} />
                <Tooltip />
                <Bar dataKey="hours" fill="#38bdf8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h3 style={styles.sectionTitle}>Quick Summary</h3>
              <p style={styles.sectionText}>
                A quick glance at what needs attention next.
              </p>
            </div>
          </div>

          <div style={styles.leaveList}>
            <div style={styles.leaveCard}>
              <div style={styles.leaveType}>Open Tasks</div>
              <div style={styles.leaveMeta}>
                {pendingTaskCount} task{pendingTaskCount !== 1 ? "s" : ""} still need action.
              </div>
            </div>

            <div style={styles.leaveCard}>
              <div style={styles.leaveType}>Upcoming Meetings</div>
              <div style={styles.leaveMeta}>
                {meetings.length} shared meeting{meetings.length !== 1 ? "s" : ""} in your schedule.
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <aside style={styles.sidebar}>
          <div style={styles.brand}>
            <div>
              <p style={styles.brandLabel}>Employee Space</p>
            </div>

            <div style={styles.profileRow}>
              {employee?.image ? (
                <img
                  src={getUploadUrl(employee.image)}
                  alt={employee?.name || "Employee"}
                  style={styles.avatar}
                />
              ) : (
                <div style={styles.avatar}>
                  <User size={22} />
                </div>
              )}
              <div>
                <p style={styles.userName}>{employee?.name || "Employee"}</p>
                <p style={styles.userMeta}>
                  {employee?.department || "Team member"}
                  {employee?.designation ? ` | ${employee.designation}` : ""}
                </p>
              </div>
            </div>

            <p style={styles.brandText}>
              Move between tasks, leave, and meetings from the sidebar while keeping your profile pinned on the left.
            </p>
          </div>

          <div style={styles.navGroup}>
            {[
              { key: "dashboard", label: "Dashboard", icon: <LayoutGrid size={16} /> },
              { key: "tasks", label: "Tasks", icon: <Briefcase size={16} /> },
              { key: "leaves", label: "Leave", icon: <CalendarDays size={16} /> },
              { key: "meetings", label: "Meetings", icon: <Users size={16} /> },
              { key: "messages", label: "Messages", icon: <MessageCircleMore size={16} /> },
            ].map((item) => (
              <button
                key={item.key}
                style={styles.navButton(activeView === item.key)}
                onClick={() => setActiveView(item.key)}
              >
            {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          <button onClick={handleLogout} style={styles.logoutButton}>
            <LogOut size={16} />
            Logout
          </button>
        </aside>

        <main style={styles.main}>
          <section style={styles.topBar}>
            {activeView === "dashboard" ? <MemoEmployeeAttendance darkMode={darkMode} /> : null}

            <div>
              <p style={styles.overline}>{viewCopy[activeView].overline}</p>
              <h1 style={styles.pageTitle}>{viewCopy[activeView].title}</h1>
              <p style={styles.pageText}>{viewCopy[activeView].text}</p>
              <button
                onClick={() => setDarkMode((current) => !current)}
                style={{ ...styles.toggle, marginTop: "14px" }}
              >
                {darkMode ? <SunMedium size={16} /> : <MoonStar size={16} />}
                {darkMode ? "light" : "Dark"}
              </button>
            </div>
          </section>

          {activeView === "dashboard" && renderDashboardView()}
          {activeView === "tasks" && renderTasksSection()}
          {activeView === "meetings" && renderMeetingsSection()}
          {activeView === "messages" && renderMessagesSection()}
          {activeView === "leaves" && renderLeavesSection()}
        </main>
      </div>
    </div>
  );
}
