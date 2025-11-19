import { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

// Define AuthState object
type AuthState = {
    token: string | null;
    user?: { username: string; userId: string } | null;
    currentTeam: { id: string; name: string } | null;
    userTeams: { id: string; name: string; sport_type?: string; schema_name?: string; description?: string }[];
    setToken: (t: string | null) => void;
    setCurrentTeam: (team: { id: string; name: string } | null) => void;
    setUserTeams: (teams: { id: string; name: string; sport_type?: string; schema_name?: string; description?: string }[]) => void;
    logout: () => void;
    refreshTeams: () => Promise<void>;
    switchTeam: (teamId: string) => Promise<void>;
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

    const [userTeams, _setUserTeams] = useState<{ id: string; name: string; sport_type?: string; schema_name?: string; description?: string }[]>(() => {
        const saved = localStorage.getItem("userTeams");
        return saved ? JSON.parse(saved) : [];
    });

    const setToken = (t: string | null) => {
        _setToken(t);
        if (t) {
            localStorage.setItem("token", t);
            // Extract current_team_id from token and update currentTeam
            try {
                const decoded = jwtDecode<{ sub: string; current_team_id: string }>(t);
                if (decoded.current_team_id && userTeams.length > 0) {
                    const team = userTeams.find(t => t.id === decoded.current_team_id);
                    if (team) {
                        setCurrentTeam(team);
                    }
                }
            } catch (e) {
                console.error("Failed to decode token", e);
            }
        } else {
            localStorage.removeItem("token");
            localStorage.removeItem("currentTeam");
            localStorage.removeItem("userTeams");
        }
    }

    const setUserTeams = (teams: { id: string; name: string; sport_type?: string; schema_name?: string; description?: string }[]) => {
        _setUserTeams(teams);
        localStorage.setItem("userTeams", JSON.stringify(teams));
        
        // If current team is not set and we have teams, set to the token-provided current_team_id if present,
        // otherwise set the first team as default for the user.
        if (!currentTeam && teams.length > 0) {
            const tokenCurrentTeamId = (token ? jwtDecode<{ current_team_id?: string }>(token as string).current_team_id : null) || null;
            let defaultTeam = teams[0];
            if (tokenCurrentTeamId) {
                const match = teams.find(t => t.id === tokenCurrentTeamId);
                if (match) defaultTeam = match;
            }
            handleSetCurrentTeam(defaultTeam);
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
        handleSetCurrentTeam(null);
        _setUserTeams([]);
    }

    // Fetch user's teams
    const refreshTeams = async () => {
        if (!token || !user?.username) return;
        
        try {
            const response = await fetch(`http://localhost:5000/api/teams/user-teams?username=${user.username}`, {
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

    // Switch to a different team - calls backend to get new token
    const switchTeam = async (teamId: string) => {
        if (!token) return;
        
        try {
            const response = await fetch(`http://localhost:5000/api/teams/set-current-team/${teamId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setToken(data.access_token); // This triggers re-renders via token change
            } else {
                console.error('Failed to switch team', response.status);
            }
        } catch (error) {
            console.error('Error switching team:', error);
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
        refreshTeams,
        switchTeam
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