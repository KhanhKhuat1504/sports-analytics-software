import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => (
  <aside className="sidebar">
    <NavLink
      to="/"
      className="sidebar-header"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <h2>
        SportsAnalytics <span className="ai">AI</span>
      </h2>
      <p className="powered">Powered by conversational analytics</p>
    </NavLink>

    <div className="sidebar-section">
      <div className="teams-view">
        <span className="globe">🔎</span>
        <div>
          <div className="teams-title">All Teams View</div>
          <div className="teams-desc">Complete NBA overview</div>
        </div>
      </div>

      <nav>
        <ul>
          <li>
            <NavLink
              to="/ai-assistant"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              AI Assistant
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/tables"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Tables
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Analytics Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Home
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>

    <div className="sidebar-footer">
      <div className="try-asking">
        <b>💡 Try asking:</b>
        <ul>
          <li>"Show All Teams View top scorers"</li>
          <li>"What's our win rate at home?"</li>
          <li>"Compare player performance"</li>
        </ul>
      </div>
    </div>
  </aside>
);

export default Sidebar;