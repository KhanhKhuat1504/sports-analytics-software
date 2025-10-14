import React from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import MainContent from "./components/MainContent/MainContent";
import Dashboard from "./pages/Dashboard";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

function App() {
    return (
        <Router>
            <div className="app-layout">
                <Sidebar />
                <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/*" element={<MainContent />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
