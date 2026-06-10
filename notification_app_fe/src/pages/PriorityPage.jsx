import { useState, useEffect, useCallback } from "react";
import { getPriorityNotifications } from "../services/apiService.js";
import { Log } from "../services/logger.js";
import FilterBar from "../components/FilterBar.jsx";
import NotificationCard from "../components/NotificationCard.jsx";
import Loading from "../components/Loading.jsx";
import ErrorDisplay from "../components/ErrorDisplay.jsx";

function PriorityPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topN, setTopN] = useState(10);
  const [notificationType, setNotificationType] = useState("");
  const [viewedIds, setViewedIds] = useState(() => {
    try {
      const stored = localStorage.getItem("viewedNotifications");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const TOP_N_OPTIONS = [5, 10, 15, 20];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      Log("frontend", "info", "page", `Fetching top ${topN} priority, type=${notificationType || "all"}`);

      const data = await getPriorityNotifications({
        n: topN,
        notification_type: notificationType || undefined,
      });

      setNotifications(data.notifications || []);
      Log("frontend", "info", "page", `Loaded ${data.notifications?.length || 0} priority notifications`);
    } catch (err) {
      Log("frontend", "error", "page", `Priority fetch failed: ${err.message}`);
      setError(err.message || "Failed to fetch priority notifications");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [topN, notificationType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTypeChange = (type) => {
    Log("frontend", "info", "component", `Priority filter changed: ${type || "all"}`);
    setNotificationType(type);
  };

  const handleTopNChange = (n) => {
    Log("frontend", "info", "component", `Top-N changed to ${n}`);
    setTopN(n);
  };

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
        <h1 className="page-title">Priority Inbox</h1>
        <p className="page-subtitle">
          Top notifications ranked by importance and recency
        </p>
      </div>

      <div className="top-n-selector">
        <span className="filter-label" style={{ alignSelf: "center" }}>Show Top</span>
        <div className="top-n-buttons">
          {TOP_N_OPTIONS.map((n) => (
            <button
              key={n}
              className={`top-n-btn ${topN === n ? "active" : ""}`}
              onClick={() => handleTopNChange(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <FilterBar
        notificationType={notificationType}
        onTypeChange={handleTypeChange}
      />

      {loading && <Loading message="Computing priority scores..." />}

      {error && <ErrorDisplay message={error} onRetry={fetchData} />}

      {!loading && !error && notifications.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">—</div>
          <h3 className="empty-title">No priority notifications</h3>
          <p>No notifications match the current filter.</p>
        </div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <div className="notification-grid">
          {notifications.map((notif, idx) => (
            <NotificationCard
              key={notif.ID}
              notification={notif}
              index={idx}
              isViewed={viewedIds.has(notif.ID)}
              onView={handleView}
              showPriority={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PriorityPage;
