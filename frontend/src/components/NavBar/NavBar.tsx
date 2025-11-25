import React, { useState } from "react";
import { Link } from 'react-router-dom';
import "./NavBar.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useAuth } from '../../contexts/AuthContext';
import TeamSelector from '../Team Selector/TeamSelector';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

export function NavBar() {
    const { token, user, logout } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [teamName, setTeamName] = useState("");
    const [teamDesc, setTeamDesc] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreateTeam = async () => {
        if (!teamName.trim()) {
            alert("Team name is required.");
            return;
        }
        setLoading(true);

        let username = user?.username || "";
        const payload = {
            username,
            teamName,
            teamDesc,
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/teams/create-team`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Error creating team");

            alert("Team created successfully!");
            setShowModal(false);
            setTeamName("");
            setTeamDesc("");
        } catch (err) {
            console.error(err);
            alert("Failed to create team.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom">
                <div className="container-fluid px-4">
                    <Link className="navbar-brand fw-bold" to="/">
                        <span className="brand-name">Sports Analytics Software</span>
                    </Link>

                    <div className="navbar-nav ms-auto d-flex align-items-center gap-3">
                        {token && (
                            <>
                                <TeamSelector />
                            </>
                        )}

                        {token ? (
                            <button 
                                onClick={logout} 
                                className="btn btn-primary btn-sm"
                                title="Logout"
                            >
                                <FontAwesomeIcon icon={faSignOutAlt} className="me-1" />
                                Logout
                            </button>
                        ) : (
                            <>
                                <Link to="/">
                                    <button className="btn btn-primary btn-sm">Login</button>
                                </Link>
                                <Link to="/register">
                                    <button className="btn btn-outline-primary btn-sm">Register</button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* CREATE TEAM MODAL */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Create a New Team</h5>
                                <button className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label fw-500">Team Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        placeholder="e.g., Lakers, Warriors"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-500">Description (optional)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={teamDesc}
                                        onChange={(e) => setTeamDesc(e.target.value)}
                                        placeholder="Short description"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    disabled={loading}
                                    onClick={handleCreateTeam}
                                >
                                    {loading ? "Creating..." : "Create Team"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default NavBar;