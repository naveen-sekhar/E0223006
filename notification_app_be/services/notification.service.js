import axios from "axios";
import { getToken } from "./auth.service.js";
import { Log } from "../../logging_middleware/logger.js";

const NOTIFICATION_API = "http://4.224.186.213/evaluation-service/notifications";

const TYPE_WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

export async function fetchNotifications({ page, limit, notification_type } = {}) {
  const token = await getToken();

  const queryParams = {};
  if (page) queryParams.page = page;
  if (limit) queryParams.limit = limit;
  if (notification_type) queryParams.notification_type = notification_type;

  Log("backend", "info", "service", `Fetching notifs page=${page} limit=${limit}`);

  const response = await axios.get(NOTIFICATION_API, {
    headers: { Authorization: `Bearer ${token}` },
    params: queryParams,
    timeout: 8000,
  });

  const notifications = response.data.notifications || [];

  return {
    notifications,
    total: notifications.length,
  };
}

export function calculatePriority(notification) {
  const typeWeight = TYPE_WEIGHTS[notification.Type] || 0;
  const ageInDays = (Date.now() - new Date(notification.Timestamp).getTime()) / 86400000;
  const recencyScore = Math.exp(-0.099 * ageInDays);
  return typeWeight * 100 + recencyScore * 100;
}

export function getTopNPriority(notifications, n = 10) {
  if (!notifications || notifications.length === 0) return [];

  const scored = notifications.map((notif) => ({
    ...notif,
    priorityScore: calculatePriority(notif),
  }));

  scored.sort((a, b) => b.priorityScore - a.priorityScore);
  return scored.slice(0, n);
}

export async function fetchPriorityNotifications(n = 10, notification_type) {
  const { notifications } = await fetchNotifications({ notification_type });
  const topN = getTopNPriority(notifications, n);
  Log("backend", "info", "service", `Computed top ${n} priority notifs`);
  return topN;
}
