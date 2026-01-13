import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import './CreateTeamModal.css';

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (teamData: any) => void;
    isFirstTeam?: boolean;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    isFirstTeam = false
}) => {
    const { token, setToken } = useAuth();
    const [teamName, setTeamName] = useState('');
    const [sportType, setSportType] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

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
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/teams/create-team`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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

            // Update token with new team
            setToken(data.access_token);

            if (onSuccess) {
                onSuccess(data);
            }

            // Reset
            setTeamName('');
            setSportType('');
            setDescription('');
            
            onClose();
        } catch (err: any) {
            setError(err.message || 'An error occurred while creating the team');
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <div className="create-team-overlay" onClick={onClose}>
            <div className="create-team-modal" onClick={(e) => e.stopPropagation()}>
                <button className="create-team-modal-close" onClick={onClose} aria-label="Close">
                    &times;
                </button>
                
                <h2 className="create-team-title">
                    {isFirstTeam ? 'Create Your First Team' : 'Create New Team'}
                </h2>
                
                {isFirstTeam && (
                    <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '0.95rem' }}>
                        Let's get started by creating your first team.
                    </p>
                )}

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Team Name *"
                        value={teamName}
                        onChange={e => setTeamName(e.target.value)}
                        required
                        disabled={loading}
                    />

                    <select
                        value={sportType}
                        onChange={e => setSportType(e.target.value)}
                        required
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '10px',
                            marginBottom: '12px',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            fontSize: '14px'
                        }}
                    >
                        <option value="">Select Sport Type *</option>
                        {sportOptions.map(sport => (
                            <option key={sport} value={sport}>
                                {sport}
                            </option>
                        ))}
                    </select>

                    <textarea
                        placeholder="Description (optional)"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                        disabled={loading}
                    />

                    {error && (
                        <div style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            marginTop: '8px'
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="create-team-actions">
                        <button
                            type="button"
                            className="create-team-button"
                            style={{ background: "#e5e7eb", color: "#374151" }}
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="create-team-button"
                            disabled={!teamName.trim() || !sportType.trim() || loading}
                        >
                            {loading ? 'Creating...' : 'Create Team'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTeamModal;