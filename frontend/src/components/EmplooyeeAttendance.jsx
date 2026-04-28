import { useEffect, useMemo, useState } from "react";
import { Clock3, LogIn, LogOut, Sparkles, UserRound } from "lucide-react";
import API from "../api/axios";
import { getUploadUrl } from "../config";

function EmployeeAttendance({ darkMode = false }) {
  const [msg, setMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const [employee, setEmployee] = useState(null);

  const getWorkedMs = (record) => {
    if (!record) return 0;

    if (typeof record.workedMs === "number") {
      return record.workedMs;
    }

    if (record.punchIn && record.punchOut) {
      return Math.max(0, new Date(record.punchOut) - new Date(record.punchIn));
    }

    return 0;
  };

  const getElapsedMs = (record) => {
    if (!record) return 0;

    const baseWorkedMs = getWorkedMs(record);

    if (record.isActive && record.activePunchIn) {
      return baseWorkedMs + Math.max(0, Date.now() - new Date(record.activePunchIn));
    }

    return baseWorkedMs;
  };

  const fetchTodayStatus = async () => {
    try {
      const res = await API.get("/attendance/today");
      const record = res.data;

      setTodayRecord(record || null);
      setElapsed(getElapsedMs(record));
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.message || "Failed to fetch attendance");
    }
  };

  const fetchEmployee = async () => {
    try {
      const res = await API.get("/employees/me");
      setEmployee(res.data.employee || null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
    fetchEmployee();
  }, []);

  useEffect(() => {
    if (!todayRecord?.isActive || !todayRecord?.activePunchIn) {
      return;
    }

    const interval = setInterval(() => {
      setElapsed(getElapsedMs(todayRecord));
    }, 1000);

    return () => clearInterval(interval);
  }, [todayRecord]);

  const isWorking = Boolean(todayRecord?.isActive);

  const handleToggle = async () => {
    try {
      if (loading) return;

      setLoading(true);
      setMsg("");

      if (!isWorking) {
        const res = await API.post("/attendance/punch-in");
        setTodayRecord(res.data);
        setElapsed(getElapsedMs(res.data));
        setMsg(todayRecord ? "Timer resumed" : "Checked in");
      } else {
        const res = await API.post("/attendance/punch-out");
        setTodayRecord(res.data);
        setElapsed(getElapsedMs(res.data));
        setMsg(`Checked out at ${res.data.workingHours} hrs`);
      }
    } catch (err) {
      console.error("ERROR:", err.response?.data || err.message);
      setMsg(err.response?.data?.message || "Error");
      await fetchTodayStatus();
    } finally {
      setLoading(false);
    }
  };

  const formatTimerParts = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ];
  };

  const formatClock = (value) => {
    if (!value) return "--:--";

    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const summaryHours = (elapsed / (1000 * 60 * 60)).toFixed(2);
  const statusLabel = isWorking ? "In" : todayRecord ? "Checked Out" : "Not Started";
  const statusColor = isWorking ? "#22c55e" : todayRecord ? "#ef4444" : "#64748b";
  const timerParts = formatTimerParts(elapsed);
  const initials = useMemo(() => {
    if (!employee?.name) return "EM";

    return employee.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [employee]);

  const imageUrl = getUploadUrl(employee?.image);

  const styles = {
    shell: {
      position: "relative",
      overflow: "hidden",
      borderRadius: "22px",
      background: darkMode ? "rgba(15,23,42,0.96)" : "#ffffff",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.16)"
        : "1px solid rgba(226,232,240,0.95)",
      boxShadow: darkMode
        ? "0 16px 34px rgba(2,6,23,0.28)"
        : "0 14px 30px rgba(15,23,42,0.08)",
      color: darkMode ? "#e2e8f0" : "#0f172a",
    },
    cover: {
      height: "18px",
      background: darkMode ? "rgba(30,41,59,0.9)" : "#f8fafc",
      position: "relative",
    },
    leafOverlay: {
      position: "absolute",
      inset: 0,
      background: "transparent",
    },
    body: {
      position: "relative",
      padding: "0 14px 14px",
      marginTop: "-28px",
    },
    topRow: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr)",
      gap: "16px",
    },
    profileCard: {
      background: darkMode ? "rgba(15,23,42,0.8)" : "rgba(255,255,255,0.94)",
      borderRadius: "20px",
      padding: "14px",
      boxShadow: darkMode
        ? "0 12px 24px rgba(2,6,23,0.22)"
        : "0 10px 22px rgba(15,23,42,0.07)",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.14)"
        : "1px solid rgba(226,232,240,0.92)",
      maxWidth: "320px",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
    },
    avatarWrap: {
      width: "72px",
      height: "72px",
      borderRadius: "18px",
      overflow: "hidden",
      border: "4px solid #ffffff",
      boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
      marginBottom: "10px",
      background: darkMode
        ? "linear-gradient(135deg, rgba(30,41,59,0.96), rgba(51,65,85,0.92))"
        : "linear-gradient(135deg, #dbeafe, #eff6ff)",
      display: "grid",
      placeItems: "center",
    },
    avatarImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    avatarFallback: {
      display: "grid",
      placeItems: "center",
      width: "100%",
      height: "100%",
      fontWeight: "800",
      fontSize: "1.5rem",
      color: darkMode ? "#e2e8f0" : "#0f172a",
    },
    employeeCode: {
      fontSize: "1rem",
      fontWeight: "700",
      color: darkMode ? "#f8fafc" : "#334155",
      marginBottom: "2px",
    },
    employeeRole: {
      fontSize: "0.76rem",
      color: darkMode ? "#94a3b8" : "#475569",
      marginBottom: "10px",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
    },
    statusRow: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      color: statusColor,
      fontWeight: "800",
      fontSize: "0.9rem",
      marginBottom: "10px",
      padding: "8px 14px",
      borderRadius: "999px",
      background: isWorking
        ? "linear-gradient(135deg, rgba(34,197,94,0.16), rgba(187,247,208,0.6))"
        : todayRecord
        ? "linear-gradient(135deg, rgba(248,113,113,0.14), rgba(254,226,226,0.8))"
        : "linear-gradient(135deg, rgba(148,163,184,0.16), rgba(226,232,240,0.75))",
      border: `1px solid ${statusColor}33`,
      boxShadow: `0 10px 24px ${statusColor}18`,
    },
    statusDot: {
      width: "12px",
      height: "12px",
      borderRadius: "999px",
      background: statusColor,
      boxShadow: `0 0 18px ${statusColor}`,
    },
    timerRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "7px",
      marginBottom: "10px",
      flexWrap: "wrap",
    },
    timerBlock: {
      minWidth: "40px",
      padding: "8px 7px",
      borderRadius: "12px",
      background: darkMode
        ? "linear-gradient(180deg, rgba(30,41,59,0.95), rgba(51,65,85,0.9))"
        : "linear-gradient(180deg, #f8fafc, #eef2ff)",
      textAlign: "center",
      boxShadow: darkMode
        ? "inset 0 0 0 1px rgba(148,163,184,0.16)"
        : "inset 0 0 0 1px rgba(226,232,240,0.9)",
    },
    timerValue: {
      fontSize: "1.08rem",
      fontWeight: "800",
      color: darkMode ? "#f8fafc" : "#0f172a",
      lineHeight: 1,
    },
    colon: {
      fontSize: "1rem",
      fontWeight: "700",
      color: darkMode ? "#94a3b8" : "#64748b",
    },
    actionButton: {
      width: "100%",
      border: "1px solid rgba(239,68,68,0.26)",
      borderRadius: "12px",
      padding: "12px 16px",
      background: isWorking
        ? "linear-gradient(135deg, #fff1f2, #ffe4e6)"
        : "linear-gradient(135deg, #ecfdf5, #dcfce7)",
      color: isWorking ? "#be123c" : "#166534",
      fontWeight: "800",
      fontSize: "0.86rem",
      cursor: loading ? "not-allowed" : "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      opacity: loading ? 0.7 : 1,
    },
    bottomGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
      gap: "8px",
      marginTop: "12px",
      width: "100%",
    },
    statCard: {
      padding: "10px",
      borderRadius: "14px",
      background: darkMode
        ? "linear-gradient(180deg, rgba(30,41,59,0.9), rgba(15,23,42,0.86))"
        : "linear-gradient(180deg, rgba(248,250,252,0.98), rgba(241,245,249,0.96))",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.14)"
        : "1px solid rgba(226,232,240,0.95)",
    },
    statLabel: {
      fontSize: "0.64rem",
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: darkMode ? "#94a3b8" : "#64748b",
      marginBottom: "8px",
      fontWeight: "700",
    },
    statValue: {
      fontSize: "0.82rem",
      fontWeight: "800",
      color: darkMode ? "#f8fafc" : "#0f172a",
    },
    helperBar: {
      marginTop: "12px",
      padding: "10px 12px",
      borderRadius: "14px",
      background: darkMode
        ? "linear-gradient(135deg, rgba(14,165,233,0.14), rgba(20,83,45,0.16))"
        : "linear-gradient(135deg, rgba(239,246,255,0.95), rgba(240,253,250,0.95))",
      border: darkMode
        ? "1px solid rgba(56,189,248,0.2)"
        : "1px solid rgba(125,211,252,0.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      color: darkMode ? "#a7f3d0" : "#0f766e",
      fontWeight: "600",
      flexWrap: "wrap",
      textAlign: "center",
    },
    helperText: {
      flex: 1,
      minWidth: "180px",
      lineHeight: 1.5,
      textAlign: "center",
    },
    message: {
      marginTop: "10px",
      minHeight: "16px",
      color:
        msg.toLowerCase().includes("error") || msg.toLowerCase().includes("failed")
          ? "#dc2626"
          : "#2563eb",
      fontWeight: "700",
      fontSize: "0.82rem",
      textAlign: "center",
    },
  };

  return (
    <div style={styles.shell}>
      <div style={styles.cover}>
        <div style={styles.leafOverlay} />
      </div>

      <div style={styles.body}>
        <div style={styles.topRow}>
          <div style={styles.profileCard}>
            <div style={styles.avatarWrap}>
              {imageUrl ? (
                <img src={imageUrl} alt={employee?.name || "Employee"} style={styles.avatarImage} />
              ) : (
                <div style={styles.avatarFallback}>
                  <UserRound size={36} />
                </div>
              )}
            </div>

            <div style={styles.employeeCode}>
              {employee?.name || "Employee"}
            </div>
            <div style={styles.employeeRole}>
              {employee?.designation || "Team Member"}
            </div>

            <div style={styles.statusRow}>
              <span style={styles.statusDot} />
              {statusLabel}
            </div>

            <div style={styles.timerRow}>
              <div style={styles.timerBlock}>
                <div style={styles.timerValue}>{timerParts[0]}</div>
              </div>
              <div style={styles.colon}>:</div>
              <div style={styles.timerBlock}>
                <div style={styles.timerValue}>{timerParts[1]}</div>
              </div>
              <div style={styles.colon}>:</div>
              <div style={styles.timerBlock}>
                <div style={styles.timerValue}>{timerParts[2]}</div>
              </div>
            </div>

            <button onClick={handleToggle} disabled={loading} style={styles.actionButton}>
              {isWorking ? <LogOut size={18} /> : <LogIn size={18} />}
              {loading ? "Processing..." : isWorking ? "Check-out" : "Check-in"}
            </button>

            <div style={styles.message}>{msg}</div>
          </div>
        </div>

        <div style={styles.bottomGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Hours Today</div>
            <div style={styles.statValue}>{summaryHours} hrs</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>First Punch In</div>
            <div style={styles.statValue}>{formatClock(todayRecord?.punchIn)}</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Last Punch Out</div>
            <div style={styles.statValue}>{formatClock(todayRecord?.punchOut)}</div>
          </div>
        </div>

        <div style={styles.helperBar}>
          <Clock3 size={18} />
          <div style={styles.helperText}>
            {isWorking
              ? "Your session is running live. Check out when you are ready to pause the timer."
              : "Start your session from here and keep today’s working time visible at a glance."}
          </div>
          <Sparkles size={18} />
        </div>
      </div>
    </div>
  );
}

export default EmployeeAttendance;
