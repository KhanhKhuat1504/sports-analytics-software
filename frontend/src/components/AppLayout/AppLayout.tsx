import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import './AppLayout.css';

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Outlet />{}
      </div>
    </div>
  );
}

export default AppLayout;