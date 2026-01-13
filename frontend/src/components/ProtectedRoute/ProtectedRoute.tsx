import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../contexts/AuthContext';

function ProtectedRoute() {
    const { token } = useAuth();

    if (!token) {
        return <Navigate to="/" replace/>;
    }

    // Check if user has a current_team_id in JWT
    try {
        const decoded = jwtDecode<{sub: string, current_team_id?: string}>(token);
        if (!decoded.current_team_id) {
            // User logged in but has no team - redirect to create first team
            return <Navigate to="/create-first-team" replace/>;
        }
    } catch (e) {
        // Invalid token
        return <Navigate to="/" replace/>;
    }

    return <Outlet />;
}

export default ProtectedRoute;