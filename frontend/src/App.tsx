import { AuthProvider } from "./contexts/AuthContext";
import { StrictMode } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainContent from "./components/MainContent/MainContent";
// import NavBar from "./components/NavBar/NavBar";
import AssistantUI from "./components/AsisstantUI/AssistantUI";
import AppLayout from "./components/AppLayout/AppLayout";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import Dashboard from "./components/Dashboard/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

function App() {
    return (
        <StrictMode>
            <Router>
                <AuthProvider>
                    {/* <NavBar/> */}
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route element={<ProtectedRoute/>}>
                            <Route element={<AppLayout />}>
                                <Route path="/tables" element={<MainContent />} />
                                <Route
                                    path="/tables/:selectedTable"
                                    element={<MainContent />}
                                />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route
                                    path="/ai-assistant"
                                    element={<AssistantUI/>}                              
                                />
                                <Route
                                    path="/home"
                                    element={<div>Create Team</div>}                              
                                />
                            </Route>
                        </Route>
                    </Routes>
                </AuthProvider>
            </Router>
        </StrictMode>
    );
}

export default App;
