import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Auth from "./pages/Auth";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import ProtectedRoute from "./components/ProtectedRoutes";
import EmployeeDetails from "./pages/EmployeeDetails";
import Signup from "./pages/Signup";
function App() {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role") || "");

  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route
          path="/"
          element={
            isAuth ? (
              role === "manager" ? (
                <Navigate to="/manager" />
              ) : (
                <Navigate to="/employee" />
              )
            ) : (
              <Auth setIsAuth={setIsAuth} setRole={setRole} />
            )
          }
        />

        {/* EMPLOYEE */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute role="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/employee/:id" element={<EmployeeDetails />} />
        {/* MANAGER */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute role="manager">
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
<Route path="/signup" element={<Signup setIsAuth={setIsAuth} setRole={setRole} />} />
        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
      <ToastContainer position="top-right" autoClose={2000} />
    </BrowserRouter>
  );
}

export default App;
