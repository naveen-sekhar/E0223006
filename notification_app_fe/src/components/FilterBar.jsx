function FilterBar({ notificationType, onTypeChange }) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label className="filter-label" htmlFor="filter-type">
          Notification Type
        </label>
        <select
          id="filter-type"
          className="filter-select"
          value={notificationType}
          onChange={(e) => onTypeChange(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="Placement">Placement</option>
          <option value="Result">Result</option>
          <option value="Event">Event</option>
        </select>
      </div>
    </div>
  );
}

export default FilterBar;
