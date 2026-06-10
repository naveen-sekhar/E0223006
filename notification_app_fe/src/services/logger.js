import axios from "axios";

const LOG_API_URL = "http://4.224.186.213/evaluation-service/logs";
let _token = null;
let initialized = false;

export async function setupLogger() {
  if (initialized) return;
  try {
    const res = await axios.post("http://localhost:3001/auth/token");
    _token = res.data.access_token;
    if (_token) {
      initialized = true;
      Log("frontend", "info", "config", "Frontend logger initialized");
    }
  } catch (err) {
    console.error("Logger init failed:", err.message);
  }
}

export async function Log(stack, level, pkg, message) {
  if (!_token) return null;

  const truncatedMsg = message.length > 48 ? message.substring(0, 45) + "..." : message;

  try {
    const response = await axios.post(
      LOG_API_URL,
      { stack, level, package: pkg, message: truncatedMsg },
      {
        headers: {
          Authorization: `Bearer ${_token}`,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );
    return response.data;
  } catch {
    return null;
  }
}
