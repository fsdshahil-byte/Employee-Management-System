import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function Auth({ setIsAuth, setRole }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
const [isSignup, setIsSignup] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/login", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("userId", res.data.user._id);

      setIsAuth(true);
      setRole(res.data.user.role);

      if (res.data.user.role === "manager") {
        navigate("/manager");
      } else {
        navigate("/employee");
      }

    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };
const handleAdminDemo = async () => {
  try {
    const res = await API.post("/auth/login", {
      email: "manager@gmail.com",
      password: "123456"
    });

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("role", res.data.user.role);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    setIsAuth(true);
    setRole(res.data.user.role);

    navigate("/manager-dashboard", { replace: true });
  } catch (err) {
    console.log("Demo login failed", err);
  }
};
  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.form}>

        <h2 style={styles.title}>Welcome Back 👋</h2>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.inputGroup}>
          <label htmlFor="login-email" style={styles.label}>Email</label>
          <input
            id="login-email"
            style={styles.input}
            type="email"
            name="email"
            placeholder="Enter your email"
            autoComplete="email"
            required
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="login-password" style={styles.label}>Password</label>
          <input
            id="login-password"
            style={styles.input}
            type="password"
            name="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />
        </div>

        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
<p style={{ textAlign: "center", fontSize: "13px" }}>
  New employee?{" "}
  <span
    onClick={() => navigate("/signup")}
    style={{ color: "#3b82f6", cursor: "pointer", fontWeight: "bold" }}
  >
    Create account
  </span>
</p>
<button
  type="button"
  onClick={handleAdminDemo}
  style={{
    marginTop: "15px",
    background: "transparent",
    border: "none",
    color: "#c8bfbf",
    cursor: "pointer",
    textDecoration: "underline"
  }}
>
  Are you an Admin? Click here
</button>
      </form>
    </div>
  );
}

export default Auth;

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    padding: "20px",
    background: "linear-gradient(135deg, #0f172a, #1e293b)"
  },

  form: {
    width: "100%",
    maxWidth: "380px",
    padding: "30px",
    borderRadius: "16px",
    background: "rgba(30, 41, 59, 0.9)",
    backdropFilter: "blur(10px)",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    color: "#fff",
    boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
  },

  title: {
    textAlign: "center",
    fontSize: "24px",
    fontWeight: "600",
    marginBottom: "10px"
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },

  label: {
    fontSize: "14px",
    color: "#cbd5f5"
  },

  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#fff",
    outline: "none",
    fontSize: "14px",
    transition: "0.3s",
  },

  button: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(to right, #3b82f6, #6366f1)",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "15px",
    cursor: "pointer",
    transition: "0.3s",
    opacity: 1
  },

  error: {
    color: "#f87171",
    textAlign: "center",
    fontSize: "14px",
    background: "rgba(248, 113, 113, 0.1)",
    padding: "8px",
    borderRadius: "6px"
  }
};
