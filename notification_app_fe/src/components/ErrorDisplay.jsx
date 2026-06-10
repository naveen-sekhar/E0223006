function ErrorDisplay({ message, onRetry }) {
  return (
    <div className="error-container">
      <div className="error-icon">!</div>
      <h3 className="error-title">Something went wrong</h3>
      <p className="error-message">{message || "Failed to load data. Please try again."}</p>
      {onRetry && (
        <button className="retry-btn" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorDisplay;
