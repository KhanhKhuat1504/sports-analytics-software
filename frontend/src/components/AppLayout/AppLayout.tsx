import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import './AppLayout.css';
import NavBar from '../NavBar/NavBar';
import 'bootstrap/dist/css/bootstrap.min.css';

function AppLayout() {
  return (
    <div className="app-layout">
      <div className="container-fluid">
        <div className="row">
          <NavBar />
        </div>
        <div className="row">
          <div className="col-md-3 col-lg-2 p-0 position-fixed overflow-auto sidebar-wrapper">
            <Sidebar />
          </div>
          <div className="col-md-9 offset-2 col-lg-10 overflow-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppLayout;