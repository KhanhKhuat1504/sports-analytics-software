import { Outlet } from 'react-router-dom';
import { useState } from 'react'
import Sidebar from '../Sidebar/Sidebar';
import './AppLayout.css';
import NavBar from '../NavBar/NavBar';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

function AppLayout() {
    const [isCollapsed, setIsCollapsed] = useState(true);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

  return (
    <div className="app-layout">
      <div className="container-fluid">
        <div className="row mb-3">
          <NavBar />
        </div>

        {isCollapsed ? (
            <div className="row">
                <div className="col-md-3 col-lg-2 p-0 position-fixed overflow-auto sidebar-wrapper">
                    <Sidebar onToggle={toggleSidebar}/>
                </div>
                <div className="col-md-9 offset-2 col-lg-10 overflow-auto">
                    <Outlet />
                </div>
            </div>
        ) : (
            <div className="row">
                <div className="position-fixed overflow-auto sidebar-wrapper collapsed-sidebar">
                    <div className="d-flex flex-column h-100 pt-3">
                        <button onClick={toggleSidebar} className="h5 text-dark bg-transparent border-0 pt-3">
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>
                </div>
                <div className="overflow-auto">
                    <Outlet />
                </div>
            </div>
        )}

      </div>
    </div>
  );
}

export default AppLayout;