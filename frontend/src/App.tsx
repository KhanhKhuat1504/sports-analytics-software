import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainContent from "./components/MainContent/MainContent";
// import AnalyticsDashboard from "./components/AnalyticsDashboard/AnalyticsDashboard";
// import AllTeamsView from "./components/AllTeamsView/AllTeamsView";
import NavBar from "./components/NavBar/NavBar";
import AppLayout from './components/AppLayout/AppLayout';

function App() {
  return (
    <Router>
      {/* <NavBar /> */}
      <Routes>
//         All Routes within the AppLayout have the sidebar
        <Route element={<AppLayout />}>
            <Route path="/" element={<div>Test Home Route</div>} />
            <Route path="/tables" element={<MainContent />} />
            <Route path="/tables/:selectedTable" element={<MainContent />} />
            <Route path="/analytics" element={<div>Test Analytics Route</div>} />
            <Route path="/ai-assistant" element={<div>Test AI Assistant Route</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;