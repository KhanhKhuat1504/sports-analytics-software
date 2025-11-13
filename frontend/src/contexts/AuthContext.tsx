import { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

// Define AuthState object
type AuthState = {
    token: string | null;
    user?: { username: string; userId: string } | null;
    currentTeam: { id: string; name: string } | null;
    userTeams: { id: string; name: string }[];
    setToken: (t: string | null) => void;
    setCurrentTeam: (team: { id: string; name: string } | null) => void;
    setUserTeams: (teams: { id: string; name: string }[]) => void;
    logout: () => void;
    refreshTeams: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {

    const [token, _setToken] = useState<string | null>(() => {
        return localStorage.getItem("token");
    })

    const [currentTeam, setCurrentTeam] = useState<{ id: string; name: string } | null>(() => {
        const saved = localStorage.getItem("currentTeam");
        return saved ? JSON.parse(saved) : null;
    });

    const [userTeams, _setUserTeams] = useState<{ id: string; name: string }[]>(() => {
        const saved = localStorage.getItem("userTeams");
        return saved ? JSON.parse(saved) : [];
    });

    const setToken = (t: string | null) => {
        _setToken(t);
        if (t) {
            localStorage.setItem("token", t);
        } else {
            localStorage.removeItem("token");
            localStorage.removeItem("currentTeam");
            localStorage.removeItem("userTeams");
        }
    }

    const setUserTeams = (teams: { id: string; name: string }[]) => {
        _setUserTeams(teams);
        localStorage.setItem("userTeams", JSON.stringify(teams));
        
        // If current team is not set and we have teams, set the first one as default
        if (!currentTeam && teams.length > 0) {
            const defaultTeam = teams[0];
            setCurrentTeam(defaultTeam);
        }
    };

    const handleSetCurrentTeam = (team: { id: string; name: string } | null) => {
        setCurrentTeam(team);
        if (team) {
            localStorage.setItem("currentTeam", JSON.stringify(team));
        } else {
            localStorage.removeItem("currentTeam");
        }
    };

    const logout = () => { 
        setToken(null);
        setCurrentTeam(null);
        _setUserTeams([]);
    }

    // Fetch user's teams
    const refreshTeams = async () => {
        if (!token) return;
        
        try {
            const response = await fetch('http://localhost:5000/api/teams/user-teams', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setUserTeams(data.teams || []);
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    };

    // Load teams if token exists
    useEffect(() => {
        if (token) {
            refreshTeams();
        }
    }, [token]);

    const user = useMemo(() => {
        if (!token) return null;
        try {
            const payload = jwtDecode<{ sub: string; user_id: string; exp: number }>(token);
            return { 
                username: payload.sub,
                userId: payload.user_id || payload.sub
            }
        }
        catch {
            return null;
        }
    }, [token])

    const value = useMemo(() => ({ 
        token, 
        user, 
        currentTeam,
        userTeams,
        setToken, 
        setCurrentTeam: handleSetCurrentTeam,
        setUserTeams,
        logout,
        refreshTeams
    }), [token, user, currentTeam, userTeams])

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}