import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app.jsx";  // make sure path is correct
import "./app.css";           // main styles

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);