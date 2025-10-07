import React, { useState } from "react";
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Register.css';


function Register() {
// VIBE CODE
    const [username, setUsername] = useState('');
            const [password, setPassword] = useState('');
            const [full_name, setFullName] = useState('');
            const [loading, setLoading] = useState(false);
            const [error, setError] = useState('');
            const [success, setSuccess] = useState('');

            const handleSubmit = async (e) => {
                e.preventDefault();
                setError('');
                setSuccess('');
                setLoading(true);

                try {
                    // Replace this URL with your actual API endpoint
                    const response = await fetch('http://localhost:5000/api/login/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            username,
                            password,
                            full_name
                        }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Registration failed');
                    }

                    setSuccess('Registration successful!');
                    // Optional: redirect to login or dashboard
                    // window.location.href = '/login';

                } catch (err) {
                    setError(err.message || 'An error occurred during registration');
                } finally {
                    setLoading(false);
                }
            };

// USES BOOTSTRAP STYLING
    return(
        <div className="container d-flex justify-content-center align-items-center vh-100">
                    <div className="card shadow-md">
                        <div className="card-body p-4">
                            <h2 className="text-center mb-3">Register</h2>
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
                                <div className="mb-3">
                                     <input
                                         type="full_name"
                                         className="form-control"
                                         name="full_name"
                                         placeholder="Full Name"
                                         onChange={(e) => setFullName(e.target.value)}
                                         required
                                     />
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={loading}
                                >
                                    {loading ? 'Loading...' : 'Register'}
                                </button>
                            </form>
                            <hr className="my-3" />
                            <p className="text-center mb-0">
                                Already have an account? <Link to="/">Login here</Link>
                            </p>
                        </div>
                    </div>
                </div>
        );
}

export default Register;