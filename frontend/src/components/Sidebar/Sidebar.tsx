import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faLightbulb, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Sidebar.css';

function Sidebar({ onToggle, collapsed = false }) {
    const location = useLocation();
    
    const isActive = (path: string) => location.pathname.includes(path);

    return(
        <div className={`app-sidebar d-flex flex-column h-100 ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-brand">
                    <span className="brand-text">SportsAnalytics</span>
                    <span className="brand-ai">AI</span>
                    <button onClick={onToggle} className="sidebar-toggle" title="Collapse sidebar">
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                </div>
                <p className="sidebar-subtitle">Powered by conversational analytics</p>
            </div>

            <div className="sidebar-content flex-grow-1">
                <div className="sidebar-section-highlight">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="section-icon" />
                    <div className="section-text">
                        <div className="section-title">Main Menu</div>
                        <div className="section-desc">Complete analytics workflow</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <Link 
                        to="/ai-assistant" 
                        className={`nav-item ${isActive('ai-assistant') ? 'active' : ''}`}
                    >
                        AI Assistant
                    </Link>
                    <Link 
                        to="/tables" 
                        className={`nav-item ${isActive('tables') ? 'active' : ''}`}
                    >
                        Tables
                    </Link>
                    <Link 
                        to="/dashboard" 
                        className={`nav-item ${isActive('dashboard') ? 'active' : ''}`}
                    >
                        Analytics Dashboard
                    </Link>
                </nav>
            </div>

            <div className="sidebar-footer">
                <div className="footer-label">
                    <FontAwesomeIcon icon={faLightbulb} /> Try asking:
                </div>
                <ul className="footer-tips">
                    <li>"Show All Teams View top scorers"</li>
                    <li>"What's our win rate at home?"</li>
                    <li>"Compare player performance"</li>
                </ul>
            </div>
        </div>
    );
}

export default Sidebar;