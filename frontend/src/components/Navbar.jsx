function Navbar({ setIsAuth }) {
  const user = JSON.parse(localStorage.getItem("user")) || { name: "Admin" };

  const logout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      localStorage.clear(); // 🔥 better
      setIsAuth(false);
      window.location.href = "/"; // 🔥 redirect
    }
  };

  return (
    <header className="navbar">
      <h2 className="logo">Employee Dashboard</h2>

      <div className="nav-right">
        <span className="welcome-text">
          Welcome, {user.name} 👋
        </span>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;