import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./Login.css";
import { useAuth } from "../../contexts/AuthContext";

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { setToken } = useAuth();

    const navigate = useNavigate();


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new URLSearchParams();
            formData.append("username", username);
            formData.append("password", password);
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/login/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Login successful:', data);

                const token = data.access_token;
                setToken(token);

                navigate("/tables")
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return(
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card shadow-md">
                <div className="card-body p-4">
                    <h2 className="text-center mb-3">Login</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <input
                                type="text"
                                className="form-control"
                                name="username"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                />
                        </div>
                        <div className="mb-3">
                            <input
                                type="password"
                                className="form-control"
                                name="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Login'}
                        </button>
                    </form>
                    <hr className="my-3" />
                    <p className="text-center mb-0">
                        Don't have an account? <Link to="/register">Register here</Link>
                    </p>
                </div>
            </div>
        </div>
        );
}

export default Login;