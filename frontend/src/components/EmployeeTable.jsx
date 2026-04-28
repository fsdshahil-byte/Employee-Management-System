import { useEffect, useState } from "react";
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const BASE_URL = "http://localhost:3000";

function EmployeeTable({
  employees,
  handleEdit,
  deleteEmployee,
  loading,
  darkMode = false,
}) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 625);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 625);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDelete = (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");
    if (confirmDelete) {
      deleteEmployee(id);
    }
  };

  const formatJoinDate = (value) => {
    if (!value) return "-";
    return value.slice(0, 10);
  };

  const imageUrl = (image) =>
    image ? `${BASE_URL}/uploads/${image}` : "https://via.placeholder.com/50";

  const iconStyle = (color) => ({
    cursor: "pointer",
    color,
    fontSize: "18px",
  });

  const styles = {
    mobileCard: {
      background: darkMode ? "rgba(15,23,42,0.88)" : "#ffffff",
      color: darkMode ? "#e2e8f0" : "#0f172a",
      padding: "15px",
      borderRadius: "12px",
      boxShadow: darkMode
        ? "0 10px 24px rgba(2,6,23,0.28)"
        : "0 4px 10px rgba(0,0,0,0.08)",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.14)"
        : "1px solid rgba(148,163,184,0.08)",
    },
    mobileMuted: {
      margin: 0,
      fontSize: "12px",
      color: darkMode ? "#94a3b8" : "#666",
    },
    mobileMeta: {
      marginTop: "10px",
      fontSize: "13px",
      color: darkMode ? "#cbd5e1" : "#0f172a",
    },
    desktopTable: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: "0 10px",
    },
    desktopHeadRow: {
      background: darkMode ? "#1d4ed8" : "#2563eb",
      color: "#fff",
      textAlign: "center",
    },
    desktopBodyRow: {
      background: darkMode ? "#0f172a" : "#f8fafc",
      textAlign: "center",
      boxShadow: darkMode
        ? "0 10px 24px rgba(2,6,23,0.28)"
        : "0 2px 8px rgba(0,0,0,0.05)",
      borderRadius: "10px",
    },
    desktopCell: {
      padding: "14px",
      color: darkMode ? "#e2e8f0" : "#0f172a",
    },
  };

  return (
    <div style={{ marginTop: "20px" }}>
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {loading ? (
            <p style={{ textAlign: "center" }}>Loading...</p>
          ) : employees.length === 0 ? (
            <p style={{ textAlign: "center" }}>No Employees Found</p>
          ) : (
            employees.map((emp) => (
              <div
                key={emp._id}
                style={styles.mobileCard}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <img
                    src={imageUrl(emp.image)}
                    alt="emp"
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                  <div>
                    <h4 style={{ margin: 0 }}>{emp.name}</h4>
                    <p style={styles.mobileMuted}>
                      {emp.designation}
                    </p>
                  </div>
                </div>

                <div style={styles.mobileMeta}>
                  <p><b>Dept:</b> {emp.department || "-"}</p>
                  <p><b>Email:</b> {emp.email || "-"}</p>
                  <p><b>Salary:</b> Rs. {emp.salary || 0}</p>
                  <p><b>Date:</b> {formatJoinDate(emp.dateOfJoin)}</p>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-around",
                    marginTop: "10px",
                  }}
                >
                  <FaEye
                    onClick={() => navigate(`/employee/${emp._id}`)}
                    style={iconStyle("#3b82f6")}
                  />
                  <FaEdit
                    onClick={() => handleEdit(emp)}
                    style={iconStyle("#22c55e")}
                  />
                  <FaTrash
                    onClick={() => handleDelete(emp._id)}
                    style={iconStyle("#ef4444")}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.desktopTable}>
            <thead>
              <tr style={styles.desktopHeadRow}>
                {["Name", "Email", "Designation", "Department", "Salary", "Date", "Image", "Action"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "14px",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: "20px", textAlign: "center" }}>
                    Loading...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: "20px", textAlign: "center" }}>
                    No Employees Found
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} style={styles.desktopBodyRow}>
                    <td style={{ ...styles.desktopCell, fontWeight: "600" }}>{emp.name}</td>
                    <td style={styles.desktopCell}>{emp.email || "-"}</td>
                    <td style={styles.desktopCell}>{emp.designation || "-"}</td>
                    <td style={styles.desktopCell}>{emp.department || "-"}</td>
                    <td style={{ ...styles.desktopCell, color: "#22c55e" }}>
                      Rs. {emp.salary || 0}
                    </td>
                    <td style={styles.desktopCell}>{formatJoinDate(emp.dateOfJoin)}</td>
                    <td style={styles.desktopCell}>
                      <img
                        src={imageUrl(emp.image)}
                        alt="emp"
                        style={{
                          width: "45px",
                          height: "45px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    </td>
                    <td style={styles.desktopCell}>
                      <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                        <FaEye onClick={() => navigate(`/employee/${emp._id}`)} style={iconStyle("#3b82f6")} />
                        <FaEdit onClick={() => handleEdit(emp)} style={iconStyle("#22c55e")} />
                        <FaTrash onClick={() => handleDelete(emp._id)} style={iconStyle("#ef4444")} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default EmployeeTable;
