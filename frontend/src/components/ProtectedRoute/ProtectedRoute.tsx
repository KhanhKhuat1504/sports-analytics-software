import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function ProtectedRoute() {
    const { token } = useAuth();

    if (!token) {
        return <Navigate to="/" replace/>;
    }

    return <Outlet />;
}

export default ProtectedRoute;