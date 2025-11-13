import { createContext, useState, useContext, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';

// Define AuthState object, optional decoded user
type AuthState = {
    token: string | null;
    user?: { username: string } | null;
    setToken: (t: string | null) => void;
    logout: () => void;
}

// Context should be an AuthState type 
// Allows 'undefined' when there's no context provided to the consuming node from its parent nodes
// Catch undefined context in useAuth()
const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {

    const [token, _setToken] = useState<string | null>(() => {
        return localStorage.getItem("token"); // hydrate token from local storage once on-load
    })

    const setToken = (t: string | null) => {
        _setToken(t)
        if (t)
            localStorage.setItem("token", t);
        else localStorage.removeItem("token")
    }

    const logout = () => { setToken(null) }

    // show decoded user for debugging
    const user = useMemo(() => {
        if (!token) return null;
        try {
            const payload = jwtDecode<{ sub: string, exp: number }>(token);
            console.log('Current User ID: ', payload.sub)
            return { username: payload.sub}
        }
        catch {
            return null;
        }
    }, [token])

    const value = useMemo(() => ({ token, user, setToken, logout }), [token, user])

    console.log(value)

    return (
        <AuthContext value={value}>
            {children}
        </AuthContext>
    );
}

export default AuthContext;

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}
