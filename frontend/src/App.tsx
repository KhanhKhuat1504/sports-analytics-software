import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { BrowserRouter } from "react-router-dom"
import MainContent from "./components/MainContent/MainContent";
// import AnalyticsDashboard from "./components/AnalyticsDashboard/AnalyticsDashboard";
// import AllTeamsView from "./components/AllTeamsView/AllTeamsView";
import NavBar from "./components/NavBar/NavBar";
import AppLayout from './components/AppLayout/AppLayout';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import { AuthProvider } from './contexts/AuthContext';
import { StrictMode } from 'react';

function App() {
  return (
      <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                {/* <NavBar /> */}
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route element={<AppLayout />}>
                        <Route path="/tables" element={<MainContent />} />
                        <Route path="/tables/:selectedTable" element={<MainContent />} />
                        <Route path="/analytics" element={<div>Test Analytics Route</div>} />
                        <Route path="/ai-assistant" element={<div>Test AI Assistant Route</div>} />
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
  );
}

export default App;