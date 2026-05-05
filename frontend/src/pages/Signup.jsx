import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await API.post("/auth/register", {
        ...form,
        role: "employee" // 🔥 force employee signup
      });

      alert("Account created! Please login.");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSignup} style={styles.card}>
        <h2>Create Account 🚀</h2>

        {error && <div style={styles.error}>{error}</div>}

        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={styles.input}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={styles.input}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          style={styles.input}
          required
        />

        <input
          placeholder="Department"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          style={styles.input}
        />

        <button style={styles.button} disabled={loading}>
          {loading ? "Creating..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  wrapper: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
  },
  card: {
    padding: "25px",
    background: "#1e293b",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "350px",
    color: "#fff"
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#fff"
  },
  button: {
    padding: "12px",
    background: "#22c55e",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: "bold"
  },
  error: {
    background: "#7f1d1d",
    padding: "8px",
    borderRadius: "6px",
    fontSize: "12px"
  }
};

export default Signup;