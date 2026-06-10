import { useState, useEffect, useCallback } from "react";
import { getNotifications } from "../services/apiService.js";
import { Log } from "../services/logger.js";
import FilterBar from "../components/FilterBar.jsx";
import NotificationCard from "../components/NotificationCard.jsx";
import Pagination from "../components/Pagination.jsx";
import Loading from "../components/Loading.jsx";
import ErrorDisplay from "../components/ErrorDisplay.jsx";

function AllNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [notificationType, setNotificationType] = useState("");
  const [viewedIds, setViewedIds] = useState(() => {
    try {
      const stored = localStorage.getItem("viewedNotifications");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const LIMIT = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      Log("frontend", "info", "page", `Fetching notifications page=${page} type=${notificationType || "all"}`);

      const data = await getNotifications({
        page,
        limit: LIMIT,
        notification_type: notificationType || undefined,
      });

      setNotifications(data.notifications || []);
      const total = data.total || data.notifications?.length || 0;
      setTotalPages(Math.max(1, Math.ceil(total / LIMIT)));

      Log("frontend", "info", "page", `Loaded ${data.notifications?.length || 0} notifications`);
    } catch (err) {
      Log("frontend", "error", "page", `Failed to fetch: ${err.message}`);
      setError(err.message || "Failed to fetch notifications");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [page, notificationType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTypeChange = (type) => {
    Log("frontend", "info", "component", `Filter changed to: ${type || "all"}`);
    setNotificationType(type);
    setPage(1);
  };

  // persist viewed state to localStorage
  const handleView = (id) => {
    setViewedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("viewedNotifications", JSON.stringify([...next]));
      return next;
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">All Notifications</h1>
        <p className="page-subtitle">
          Stay updated with the latest campus announcements
        </p>
      </div>

      <FilterBar
        notificationType={notificationType}
        onTypeChange={handleTypeChange}
      />

      {loading && <Loading />}

      {error && <ErrorDisplay message={error} onRetry={fetchData} />}

      {!loading && !error && notifications.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">—</div>
          <h3 className="empty-title">No notifications found</h3>
          <p>Try changing the filter or check back later.</p>
        </div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <>
          <div className="notification-grid">
            {notifications.map((notif, idx) => (
              <NotificationCard
                key={notif.ID}
                notification={notif}
                index={idx}
                isViewed={viewedIds.has(notif.ID)}
                onView={handleView}
              />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

export default AllNotificationsPage;
