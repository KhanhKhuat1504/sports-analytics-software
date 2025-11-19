import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './CreateFirstTeam.css';

const CreateFirstTeam: React.FC = () => {
    const navigate = useNavigate();
    const { setToken } = useAuth();
    const [teamName, setTeamName] = useState('');
    const [sportType, setSportType] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sportOptions = [
        'Basketball',
        'Football',
        'Baseball',
        'Soccer',
        'Hockey',
        'Volleyball',
        'Tennis',
        'Golf',
        'Other'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!teamName.trim()) {
            setError('Team name is required');
            return;
        }
        if (!sportType.trim()) {
            setError('Sport type is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Get registration token from localStorage
            const registrationToken = localStorage.getItem('registrationToken');
            
            if (!registrationToken) {
                setError('Registration token not found. Please register again.');
                setLoading(false);
                return;
            }
            
            const response = await fetch('http://localhost:5000/api/teams/create-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${registrationToken}`
                },
                body: JSON.stringify({
                    team_name: teamName.trim(),
                    sport_type: sportType.trim(),
                    description: description.trim() || null
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to create team');
            }

            // Set token (auto-logs in user with new team)
            setToken(data.access_token);
            
            // Clean up localStorage
            localStorage.removeItem('registrationToken');

            // Redirect to main app
            navigate('/tables');
        } catch (err: any) {
            setError(err.message || 'An error occurred while creating the team');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-first-team-container">
            <div className="create-first-team-card">
                <div className="create-first-team-header">
                    <h1>Welcome!</h1>
                    <p>Let's get started by creating your first team</p>
                </div>

                <form onSubmit={handleSubmit} className="create-first-team-form">
                    <div className="form-group">
                        <label htmlFor="teamName">Team Name *</label>
                        <input
                            id="teamName"
                            type="text"
                            placeholder="e.g., Lakers, Warriors, Nets"
                            value={teamName}
                            onChange={e => setTeamName(e.target.value)}
                            required
                            disabled={loading}
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="sportType">Sport Type *</label>
                        <select
                            id="sportType"
                            value={sportType}
                            onChange={e => setSportType(e.target.value)}
                            required
                            disabled={loading}
                            className="form-select"
                        >
                            <option value="">Select a sport</option>
                            {sportOptions.map(sport => (
                                <option key={sport} value={sport}>
                                    {sport}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description (optional)</label>
                        <textarea
                            id="description"
                            placeholder="Tell us about your team..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={4}
                            disabled={loading}
                            className="form-textarea"
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!teamName.trim() || !sportType.trim() || loading}
                        className="submit-button"
                    >
                        {loading ? 'Creating Team...' : 'Create Team & Get Started'}
                    </button>
                </form>

                <p className="form-note">
                    You can add more teams and team members later from your dashboard.
                </p>
            </div>
        </div>
    );
};

export default CreateFirstTeam;
