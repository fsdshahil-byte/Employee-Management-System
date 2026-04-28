import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function Login({ setIsAuth, setRole }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setIsAuth(true);
      setRole(res.data.user.role);

      navigate(res.data.user.role === "manager" ? "/manager" : "/employee");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const isMobile = window.innerWidth < 768;

  return (
    <div style={{
      ...styles.wrapper,
      padding: isMobile ? "15px" : "0"
    }}>

      <form onSubmit={handleLogin} style={{
        ...styles.card,
        width: isMobile ? "100%" : "350px",
        borderRadius: isMobile ? "10px" : "14px"
      }}>

        <h2 style={styles.title}>Welcome Back 👋</h2>
        <p style={styles.subtitle}>Login to continue</p>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        <input
          id="legacy-login-email"
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          autoComplete="email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={styles.input}
          required
        />

        <input
          id="legacy-login-password"
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          autoComplete="current-password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          style={styles.input}
          required
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </form>
    </div>
  );
}

/* INLINE STYLES */
const styles = {
  wrapper: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
  },

  card: {
    padding: "25px",
    background: "rgba(30, 41, 59, 0.9)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    color: "#fff"
  },

  title: {
    textAlign: "center",
    margin: 0
  },

  subtitle: {
    textAlign: "center",
    fontSize: "14px",
    color: "#94a3b8",
    marginBottom: "10px"
  },

  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #334155",
    outline: "none",
    background: "#0f172a",
    color: "#fff",
    fontSize: "14px"
  },

  button: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#3b82f6",
    color: "#fff",
    fontWeight: "bold",
    transition: "0.3s"
  },

  errorBox: {
    background: "#7f1d1d",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "13px",
    textAlign: "center"
  }
};

export default Login;
