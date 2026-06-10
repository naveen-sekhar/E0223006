import {
  fetchNotifications,
  fetchPriorityNotifications,
} from "../services/notification.service.js";
import { Log } from "../../logging_middleware/logger.js";

export async function getAllNotifications(req, res) {
  try {
    const { page = 1, limit = 10, notification_type } = req.query;

    const validTypes = ["Event", "Result", "Placement"];
    if (notification_type && !validTypes.includes(notification_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid notification_type. Must be one of: ${validTypes.join(", ")}`,
      });
    }

    const result = await fetchNotifications({
      page: Number(page),
      limit: Number(limit),
      notification_type,
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    Log("backend", "error", "controller", `getAllNotifications failed: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
}

export async function getPriorityNotifications(req, res) {
  try {
    const { n = 10, notification_type } = req.query;

    const topN = Number(n);
    if (isNaN(topN) || topN < 1 || topN > 100) {
      return res.status(400).json({
        success: false,
        message: "Parameter 'n' must be a number between 1 and 100",
      });
    }

    const notifications = await fetchPriorityNotifications(topN, notification_type);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    Log("backend", "error", "controller", `getPriority failed: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch priority notifications",
      error: error.message,
    });
  }
}
