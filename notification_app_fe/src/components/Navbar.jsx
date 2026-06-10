import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <div className="navbar-logo">N</div>
          <span className="navbar-title">Campus Notifications</span>
        </div>
        <div className="navbar-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            All Notifications
          </NavLink>
          <NavLink
            to="/priority"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Priority Inbox
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
