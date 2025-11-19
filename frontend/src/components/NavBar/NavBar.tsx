// import React, { useState, useEffect } from "react";
// import { Link } from 'react-router-dom';
// import "./NavBar.css";
// import 'bootstrap/dist/css/bootstrap.min.css';
// import sportsLogo from '../../assets/sportslogo.png';
// import { useAuth } from '../../contexts/AuthContext';

// export function NavBar(){
//     const { token, user, logout } = useAuth();

//     return(
//         <nav className="navbar navbar-expand-lg navbar-light bg-light ms-auto">
//             <div className="container-fluid">
//                 <Link className="navbar-brand" to="/">
//                     <img src={sportsLogo} alt="Logo" className="img-fluid" style={{ maxHeight: '40px' }} />
//                     Sports Analytics Software
//                 </Link>
//                 <div className="navbar-nav">
//                     {token ? (
//                         <>
//                             <button onClick={logout} className="btn btn-primary m-2">
//                                 Logout
//                             </button>
//                         </>
//                     ) : (
//                         <>
//                             <Link to="/">
//                                 <button className="btn btn-primary m-2">Login</button>
//                             </Link>
//                             <Link to="/register">
//                                 <button className="btn btn-secondary m-2">Register</button>
//                             </Link>
//                         </>
//                     )}
//                 </div>
//             </div>
//         </nav>
//     );
// };

// export default NavBar;

import React, { useState } from "react";
import { Link } from 'react-router-dom';
import "./NavBar.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import sportsLogo from '../../assets/sportslogo.png';
import { useAuth } from '../../contexts/AuthContext';
import TeamSelector from '../Team Selector/TeamSelector';

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

        let username = "";
        if (user) {
            username = user.username
        }

        console.log(username)
        const payload = {
                    username,
                    teamName,
                    teamDesc,
                }
        console.log(payload)

        try {
            // You will implement this backend later
            const res = await fetch("/api/teams/create-team", {
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
            <nav className="navbar navbar-expand-lg navbar-light bg-light ms-auto">
                <div className="container-fluid">
                    <Link className="navbar-brand" to="/">
                        <img src={sportsLogo} alt="Logo" className="img-fluid" style={{ maxHeight: '40px' }} />
                        Sports Analytics Software
                    </Link>

                    <div className="navbar-nav d-flex align-items-center">

                        {token && (
                            <>
                                <TeamSelector />
                            </>
                        )}

                        {token ? (
                            <>
                                <button onClick={logout} className="btn btn-primary m-2">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/">
                                    <button className="btn btn-primary m-2">Login</button>
                                </Link>
                                <Link to="/register">
                                    <button className="btn btn-secondary m-2">Register</button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* --------------------- CREATE TEAM MODAL --------------------- */}
            {showModal && (
                <div className="modal show fade d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog">
                        <div className="modal-content">

                            <div className="modal-header">
                                <h5 className="modal-title">Create a New Team</h5>
                                <button
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>

                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Team Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        placeholder="e.g., Lakers, Warriors"
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Description (optional)</label>
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
