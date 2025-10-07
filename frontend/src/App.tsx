import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainContent from "./components/MainContent/MainContent";
// import AnalyticsDashboard from "./components/AnalyticsDashboard/AnalyticsDashboard";
// import AllTeamsView from "./components/AllTeamsView/AllTeamsView";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import NavBar from "./components/NavBar/NavBar";
import Sidebar from "./components/Sidebar/Sidebar";
import AssistantFrame from "./components/Assistant/Assistant";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <div style={{ flex: 1 }}>
          {/* <NavBar /> */}
          <Routes>
            <Route path="/login" element={<Login></Login>}/>
            <Route path="/register" element={<Register></Register>}/>
            <Route element={<ProtectedRoute/>}>
              <Route path="/" element={<div>Test Home Route</div>} />
              <Route path="/tables" element={<MainContent />} />
              <Route path="/tables/:selectedTable" element={<MainContent />} />
              <Route path="/analytics" element={<div>Test Analytics Route</div>} />
              <Route path="/ai-assistant" element={<AssistantFrame />} />
            </Route>
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;