import { useEffect, useState } from "react";
import API from "../api/axios";

const API_BASE_URL = "http://localhost:3000";

function EmployeeForm({ fetchEmployees, setShowForm, selectedEmployee }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    designation: "",
    department: "",
    salary: "",
    dateOfJoin: "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (selectedEmployee) {
      setFormData({
        name: selectedEmployee.name || "",
        email: selectedEmployee.email || "",
        password: "",
        designation: selectedEmployee.designation || "",
        department: selectedEmployee.department || "",
        salary: selectedEmployee.salary || "",
        dateOfJoin: selectedEmployee.dateOfJoin?.slice(0, 10) || "",
      });

      if (selectedEmployee.image) {
        setPreview(`${API_BASE_URL}/uploads/${selectedEmployee.image}`);
      } else {
        setPreview(null);
      }
    }
  }, [selectedEmployee]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);

    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      alert("Name and email are required");
      return;
    }

    if (!selectedEmployee && !formData.password) {
      alert("Password is required for new employees");
      return;
    }

    try {
      const data = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== "") {
          data.append(key, value);
        }
      });

      if (image) {
        data.append("image", image);
      }

      if (selectedEmployee) {
        await API.put(`/employees/${selectedEmployee._id}`, data);
        alert("Employee updated successfully");
      } else {
        await API.post("/employees", data);
        alert("Employee added successfully");
      }

      setFormData({
        name: "",
        email: "",
        password: "",
        designation: "",
        department: "",
        salary: "",
        dateOfJoin: "",
      });
      setImage(null);
      setPreview(null);

      fetchEmployees();
      setShowForm(false);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>
        {selectedEmployee ? "Edit Employee" : "Add Employee"}
      </h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          type="text"
          name="name"
          placeholder="Enter name"
          value={formData.name}
          onChange={handleChange}
        />

        <input
          style={styles.input}
          type="email"
          name="email"
          placeholder="Enter email"
          value={formData.email}
          onChange={handleChange}
        />

        <input
          style={styles.input}
          type="password"
          name="password"
          placeholder={
            selectedEmployee ? "New password (optional)" : "Create password"
          }
          value={formData.password}
          onChange={handleChange}
        />

        <input
          style={styles.input}
          type="text"
          name="designation"
          placeholder="Enter designation"
          value={formData.designation}
          onChange={handleChange}
        />

        <input
          style={styles.input}
          type="text"
          name="department"
          placeholder="Enter department"
          value={formData.department}
          onChange={handleChange}
        />

        <input
          style={styles.input}
          type="number"
          name="salary"
          placeholder="Enter salary"
          value={formData.salary}
          onChange={handleChange}
        />

        <input
          style={styles.input}
          type="date"
          name="dateOfJoin"
          value={formData.dateOfJoin}
          onChange={handleChange}
        />

        <input type="file" accept="image/*" onChange={handleImageChange} />

        {preview && <img src={preview} alt="preview" style={styles.image} />}

        <button style={styles.button} type="submit">
          {selectedEmployee ? "Update Employee" : "Add Employee"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: {
    width: "100%",
    maxWidth: "420px",
    margin: "auto",
    marginTop: "20px",
    padding: "clamp(15px, 4vw, 25px)",
    borderRadius: "15px",
    background: "#ffffff",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },

  title: {
    textAlign: "center",
    marginBottom: "20px",
    fontSize: "clamp(18px, 2vw, 22px)",
    fontWeight: "600",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
  },

  input: {
    width: "100%",
    padding: "clamp(10px, 2vw, 12px)",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "clamp(13px, 2vw, 14px)",
    outline: "none",
    boxSizing: "border-box",
  },

  button: {
    padding: "clamp(10px, 2vw, 12px)",
    background: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
    transition: "0.2s",
  },

  image: {
    width: "100%",
    maxWidth: "120px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "10px",
    margin: "10px auto",
    display: "block",
  },
};

export default EmployeeForm;
