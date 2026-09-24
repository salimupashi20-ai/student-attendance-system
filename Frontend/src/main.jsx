import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";

import "./index.css";
import App from "./App.jsx";

// ========================================
// AXIOS API CONFIGURATION
// ========================================
//
// Local development:
// VITE_API_BASE_URL is normally missing,
// so Axios uses relative /api URLs and the
// Vite development proxy handles them.
//
// Production:
// Railway provides VITE_API_BASE_URL,
// so /api requests are sent to the
// Railway Express backend.
// ========================================

axios.defaults.baseURL =
  import.meta.env.VITE_API_BASE_URL || "";

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <App />
  </StrictMode>
);