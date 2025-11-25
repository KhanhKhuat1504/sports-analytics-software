import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Register.css';
import { useAuth } from "../../contexts/AuthContext";


function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<{ username: string; password: string; full_name?: string; is_admin?: boolean }>();

    const { setToken } = useAuth();

    const onSubmit = async (formData: { username: string; password: string; full_name?: string; is_admin?: boolean }) => {
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/login/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                    full_name: formData.full_name,
                    is_admin: !!formData.is_admin
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // If registering as admin, set token and go straight to tables (admin mapped to public schema)
            if (formData.is_admin) {
                if (setToken) setToken(data.access_token);
                else localStorage.setItem('token', data.access_token);
                navigate('/tables');
                return;
            }

            // Store temporary token for team creation flow
            localStorage.setItem('registrationToken', data.access_token);
            navigate('/create-first-team');

        } catch (err: any) {
            setError(err?.message || 'An error occurred during registration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card shadow-md">
                <div className="card-body p-4">
                    <h2 className="text-center mb-3">Register</h2>

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="mb-3">
                            <input
                                type="text"
                                className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                                placeholder="Username"
                                {...register("username", {
                                    required: "Username is required",
                                    minLength: {
                                        value: 3,
                                        message: "Username must be at least 3 characters"
                                    },
                                    maxLength: {
                                        value:20,
                                        message: "Username must be less than 20 characters"
                                    }
                                })}
                            />
                            {errors.username && (
                                <div className="invalid-feedback">
                                    {errors.username.message}
                                </div>
                            )}
                        </div>

                        <div className="mb-3">
                            <input
                                type="password"
                                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                placeholder="Password"
                                {...register("password", {
                                    required: "Password is required",
                                    minLength: {
                                        value: 6,
                                        message: "Password must be at least 6 characters"
                                    },
                                    pattern: {
                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                        message: "Password must contain uppercase, lowercase, and number"
                                    }
                                })}
                            />
                            {errors.password && (
                                <div className="invalid-feedback">
                                    {errors.password.message}
                                </div>
                            )}
                        </div>

                        <div className="mb-3">
                            <input
                                type="text"
                                className={`form-control`}
                                placeholder="Full Name"
                                {...register("full_name")}
                            />
                        </div>

                        <div className="mb-3 form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="is_admin"
                                {...register("is_admin")}
                            />
                            <label className="form-check-label" htmlFor="is_admin">Register as admin (map to public schema)</label>
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