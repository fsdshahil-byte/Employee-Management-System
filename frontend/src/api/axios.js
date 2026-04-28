import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000/api",
});

// 🔐 attach token (optional but recommended)
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;