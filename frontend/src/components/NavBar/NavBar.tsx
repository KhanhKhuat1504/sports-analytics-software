import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import "./NavBar.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import sportsLogo from '../../assets/sportslogo.png';
import { useAuth } from '../../contexts/AuthContext';

export function NavBar(){
    const { token, user, logout } = useAuth();

    return(
        <nav className="navbar navbar-expand-lg navbar-light bg-light ms-auto">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/">
                    <img src={sportsLogo} alt="Logo" className="img-fluid" style={{ maxHeight: '40px' }} />
                    Sports Analytics Software
                </Link>
                <div className="navbar-nav">
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
    );
};

export default NavBar;
