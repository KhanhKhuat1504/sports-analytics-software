import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

function Login() {
//     VIBE CODE DO NOT USE
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/login-html', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Login successful:', data);
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

// STYLING USES BOOTSTRAP
    return(
        <div className="container">
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
                    {error && (
                        <div className="alert alert-danger mt-3 mb-0" role="alert">
                            {error}
                        </div>
                    )}
                    <hr className="my-3" />
                    <p className="text-center mb-0">
                        Don't have an account? <a href="/register-html">Register here</a>
                    </p>
                </div>
            </div>
        </div>
        );
}

export default Login;