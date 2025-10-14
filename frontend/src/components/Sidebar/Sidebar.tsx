import React from "react";
import "./Sidebar.css";
import { Link } from "react-router-dom";

const Sidebar = () => (
  <aside className="sidebar">
    <div className="sidebar-header">
      <h2>
        SportsAnalytics <span className="ai">AI</span>
      </h2>
      <p className="powered">Powered by conversational analytics</p>
    </div>
    <div className="sidebar-section">
      <div className="teams-view">
        <span className="globe">🌐</span>
        <div>
          <div className="teams-title">All Teams View</div>
          <div className="teams-desc">Complete NBA overview</div>
        </div>
      </div>
      <nav>
        <ul>
          <li>AI Assistant</li>
          <li className="active">Tables</li>
          <li>
            <Link to="/dashboard">Analytics Dashboard</Link>
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