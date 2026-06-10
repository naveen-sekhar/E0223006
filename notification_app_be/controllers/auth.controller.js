import { register, authenticate } from "../services/auth.service.js";
import { Log } from "../../logging_middleware/logger.js";

export async function handleRegister(req, res) {
  try {
    await Log("backend", "info", "controller", "Attempting registration with evaluation server");
    const result = await register();
    await Log("backend", "info", "controller", "Registration successful");
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    await Log("backend", "error", "controller", `Registration failed: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.response?.data?.message || error.message,
    });
  }
}

export async function handleGetToken(req, res) {
  try {
    await Log("backend", "info", "controller", "Requesting new auth token");
    const token = await authenticate();
    await Log("backend", "info", "controller", "Token acquired successfully");
    return res.status(200).json({
      success: true,
      access_token: token,
      message: "Token acquired successfully",
    });
  } catch (error) {
    await Log("backend", "error", "controller", `Token fetch failed: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to get token",
      error: error.response?.data?.message || error.message,
    });
  }
}
