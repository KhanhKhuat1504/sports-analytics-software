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
    const { token, refreshTeams } = useAuth();
    const [name, setName] = useState('');
    const [members, setMembers] = useState<string[]>([]);
    const [memberInput, setMemberInput] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleAddMember = () => {
        const trimmed = memberInput.trim();
        if (trimmed && !members.includes(trimmed)) {
            setMembers([...members, trimmed]);
            setMemberInput('');
        }
    };

    const handleRemoveMember = (member: string) => {
        setMembers(members.filter(m => m !== member));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Team name required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:5000/api/teams/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    member_usernames: members.length > 0 ? members : undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to create new team');
            }

            // Refresh list
            await refreshTeams();

            if (onSuccess) {
                onSuccess(data);
            }

            // Reset
            setName('');
            setMembers([]);
            setDescription('');
            setMemberInput('');
            
            onClose();
        } catch (err: any) {
            setError(err.message || 'An error occurred while creating the team');
        } finally {
            setLoading(false);
        }
    };

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
                        Let's get started by creating your first team. You can add members now or later.
                    </p>
                )}

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Team Name *"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        disabled={loading}
                    />

                    <textarea
                        placeholder="Description (optional)"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                        disabled={loading}
                    />

                    <div>
                        <label style={{ 
                            fontSize: '0.9rem', 
                            color: '#64748b', 
                            marginBottom: '8px',
                            display: 'block'
                        }}>
                            Add Team Members (optional)
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                type="text"
                                placeholder="Enter username"
                                value={memberInput}
                                onChange={e => setMemberInput(e.target.value)}
                                onKeyPress={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddMember();
                                    }
                                }}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="create-team-button"
                                style={{ minWidth: 70 }}
                                onClick={handleAddMember}
                                disabled={!memberInput.trim() || loading}
                            >
                                Add
                            </button>
                        </div>
                        {members.length > 0 && (
                            <div style={{ marginTop: 12, marginBottom: 8 }}>
                                {members.map(member => (
                                    <span
                                        key={member}
                                        style={{
                                            display: 'inline-block',
                                            background: '#e0e7ef',
                                            color: '#374151',
                                            borderRadius: 12,
                                            padding: '4px 12px',
                                            marginRight: 6,
                                            marginBottom: 6,
                                            fontSize: 14,
                                        }}
                                    >
                                        {member}
                                        <button
                                            type="button"
                                            style={{
                                                marginLeft: 6,
                                                background: 'none',
                                                border: 'none',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                            }}
                                            onClick={() => handleRemoveMember(member)}
                                            aria-label={`Remove ${member}`}
                                            disabled={loading}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

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
                            disabled={!name.trim() || loading}
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