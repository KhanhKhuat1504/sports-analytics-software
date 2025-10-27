import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faLightbulb } from '@fortawesome/free-solid-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';

const Sidebar = () => (
    <div className="d-flex flex-column h-100 pt-3" style={{width: '100%'}}>
      <div className="p-3">
        <div className="h3 mb-1">
          SportsAnalytics <span className="text-primary">AI</span>
        </div>
        <p className="text-muted small mb-0">Powered by conversational analytics</p>
      </div>

      <div className="flex-grow-1 p-3">
        <div className="d-flex align-items-center gap-3 p-3 border-top border-bottom bg-opacity-25 mb-3">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="fs-5" />
          <div>
            <div className="fw-semibold">All Teams View</div>
            <div className="text-muted small">Complete NBA overview</div>
          </div>
        </div>

        <ul className="list-unstyled">
          <li className="mb-2">
            <Link to="/ai-assistant" className="text-decoration-none d-block p-2">
              AI Assistant
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/tables" className="text-decoration-none d-block p-2 ">
              Tables
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/dashboard" className="text-decoration-none d-block p-2">
              Analytics Dashboard
            </Link>
          </li>
        </ul>
      </div>

      <div className="p-3 border-top border-secondary">
        <div className="small">
          <div className="fw-bold mb-2">
            <FontAwesomeIcon icon={faLightbulb} /> Try asking:
          </div>
          <ul className="list-unstyled ps-3 text-muted">
            <li className="mb-1">"Show All Teams View top scorers"</li>
            <li className="mb-1">"What's our win rate at home?"</li>
            <li className="mb-1">"Compare player performance"</li>
          </ul>
        </div>
      </div>
    </div>
);

export default Sidebar;