import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";

function EmployeeDetails() {
  const { id } = useParams();

  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");

  // ================= FETCH EMPLOYEE =================
  const fetchEmployee = async () => {
    const res = await API.get(`/employees/${id}`);
    setEmployee(res.data);
  };

  // ================= FETCH TASKS (FIXED ROUTE) =================
  const fetchTasks = async () => {
    const res = await API.get(`/tasks/employee/${id}`);
    setTasks(res.data);
  };

  useEffect(() => {
    fetchEmployee();
    fetchTasks();
  }, []);

  // ================= ADD TASK =================
  const addTask = async () => {
    if (!newTask) return;

    await API.post("/tasks", {
      title: newTask,
      assignedTo: id   // ✅ FIXED (was employeeId)
    });

    setNewTask("");
    fetchTasks();
  };

  // ================= TOGGLE TASK =================
  const toggleTask = async (taskId) => {
    await API.put(`/tasks/${taskId}`);
    fetchTasks();
  };

  // ================= DELETE TASK =================
  const deleteTask = async (taskId) => {
    await API.delete(`/tasks/${taskId}`);
    fetchTasks();
  };

  if (!employee) return <p>Loading...</p>;

  // ================= STATS (FIXED LOGIC) =================
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const progress = totalTasks ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(to right, #e0f2fe, #f8fafc)",
      padding: "30px"
    }}>

      <div style={{
        maxWidth: "700px",
        margin: "auto",
        background: "#fff",
        borderRadius: "16px",
        padding: "25px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
      }}>

        {/* 👤 PROFILE */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img
            src={
              employee.image
                ? `http://localhost:3000/uploads/${employee.image}`
                : "https://via.placeholder.com/100"
            }
            alt="profile"
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              objectFit: "cover",
              marginBottom: "10px",
              border: "3px solid #3b82f6"
            }}
          />

          <h2>{employee.name}</h2>
          <p style={{ color: "#6b7280" }}>{employee.department}</p>
        </div>

        {/* 💰 INFO */}
        <div style={{
          display: "flex",
          justifyContent: "space-around",
          marginBottom: "20px"
        }}>
          <div>
            <p style={{ fontSize: "14px", color: "#6b7280" }}>Salary</p>
            <h3>₹ {employee.salary}</h3>
          </div>

          <div>
            <p style={{ fontSize: "14px", color: "#6b7280" }}>Tasks</p>
            <h3>{totalTasks}</h3>
          </div>

          <div>
            <p style={{ fontSize: "14px", color: "#6b7280" }}>Completed</p>
            <h3>{completedTasks}</h3>
          </div>
        </div>

        {/* 📊 PROGRESS BAR */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{
            height: "10px",
            background: "#e5e7eb",
            borderRadius: "10px"
          }}>
            <div style={{
              width: `${progress}%`,
              height: "100%",
              background: "#22c55e",
              borderRadius: "10px",
              transition: "0.3s"
            }} />
          </div>

          <p style={{ fontSize: "12px", textAlign: "right" }}>
            {Math.round(progress)}% completed
          </p>
        </div>

        {/* ➕ ADD TASK */}
        <div style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px"
        }}>
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add new task..."
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc"
            }}
          />

          <button
            onClick={addTask}
            style={{
              padding: "10px 15px",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Add
          </button>
        </div>

        {/* 📋 TASK LIST */}
        {tasks.map((t) => (
          <div key={t._id} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "10px",
            background: "#f9fafb"
          }}>

            <span style={{
              textDecoration: t.status === "completed" ? "line-through" : "none",
              color: t.status === "completed" ? "#9ca3af" : "#111"
            }}>
              {t.title}
            </span>

            <div style={{ display: "flex", gap: "8px" }}>

              <button
                onClick={() => toggleTask(t._id)}
                style={{
                  background: t.status === "completed" ? "#facc15" : "#22c55e",
                  color: "#fff",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                {t.status === "completed" ? "Undo" : "Done"}
              </button>

              <button
                onClick={() => deleteTask(t._id)}
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Delete
              </button>

            </div>
          </div>
        ))}

      </div>
    </div>
  );
}

export default EmployeeDetails;