function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function NotificationCard({ notification, index, isViewed, onView, showPriority = false }) {
  const type = notification.Type;
  const typeClass = type ? type.toLowerCase() : "";

  const handleClick = () => {
    if (onView) onView(notification.ID);
  };

  const priorityPercent = showPriority && notification.priorityScore
    ? Math.min((notification.priorityScore / 400) * 100, 100)
    : 0;

  const priorityColor =
    priorityPercent > 70 ? "var(--accent-green)" :
    priorityPercent > 40 ? "var(--accent-amber)" :
    "var(--accent-red)";

  return (
    <div
      className={`notification-card ${isViewed ? "is-viewed" : "is-new"}`}
      data-type={type}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={handleClick}
      role="article"
      aria-label={`${type} notification: ${notification.Message}`}
    >
      <div className="card-top">
        <div className="card-badges">
          {!isViewed && <span className="new-indicator" title="New notification" />}
          <span className={`type-badge ${typeClass}`}>{type}</span>
        </div>
        <span className="card-timestamp">{formatTime(notification.Timestamp)}</span>
      </div>

      <p className="card-message">{notification.Message}</p>

      {showPriority && notification.priorityScore != null && (
        <div className="card-priority">
          <div className="priority-bar">
            <div
              className="priority-fill"
              style={{
                width: `${priorityPercent}%`,
                background: priorityColor,
              }}
            />
          </div>
          <span className="priority-label">
            Score: {notification.priorityScore.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}

export default NotificationCard;
