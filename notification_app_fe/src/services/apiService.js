import axios from "axios";

const BASE_URL = "http://localhost:3001";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getNotifications({ page = 1, limit = 10, notification_type } = {}) {
  const params = { page, limit };
  if (notification_type) params.notification_type = notification_type;

  const response = await apiClient.get("/notifications", { params });
  return response.data;
}

export async function getPriorityNotifications({ n = 10, notification_type } = {}) {
  const params = { n };
  if (notification_type) params.notification_type = notification_type;

  const response = await apiClient.get("/notifications/priority", { params });
  return response.data;
}

export async function getHealthStatus() {
  const response = await apiClient.get("/health");
  return response.data;
}
