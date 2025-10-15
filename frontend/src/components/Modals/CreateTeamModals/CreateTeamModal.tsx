import React from 'react';
import './CreateTeamModal.css';

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateTeam: (team: {
        name: string;
        members: string[];
        description?: string;
        lead?: string;
        type?: string;
        isPublic?: boolean;
    }) => void;
    teamLeads?: string[];
    teamTypes?: string[];
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
    isOpen,
    onClose,
    onCreateTeam,
    teamLeads = [],
    teamTypes = [],
}) => {
    const [name, setName] = React.useState('');
    const [members, setMembers] = React.useState<string[]>([]);
    const [memberInput, setMemberInput] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [lead, setLead] = React.useState('');
    const [type,setType] = React.useState('');
    const [isPublic, setPublic] = React.useState(false);

    if (!isOpen) return null;

    // change this afterwards 

     const handleAddMember = () => {
        if (memberInput.trim() && !members.includes(memberInput.trim())) {
            setMembers([...members, memberInput.trim()]);
            setMemberInput('');
        }
    };

    const handleRemoveMember = (member: string) => {
        setMembers(members.filter(m => m !== member));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onCreateTeam({
            name: name.trim(),
            members,
            description: description.trim() || undefined,
            lead: lead || undefined,
             type: type || undefined,
            isPublic,
        });
        // Reset form
        setName('');
        setMembers([]);
        setDescription('');
        setLead('');
        setType('');
        setIsPublic(false);
        onClose();
    };

    return (
        <div className="create-team-overlay">
            <div className="create-team-modal">
                <button className="create-team-modal-close" onClick={onClose} aria-label="Close">&times;</button>
                <h2 className="create-team-title">Create Team</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Team Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                    <div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                type="text"
                                placeholder="Add member"
                                value={memberInput}
                                onChange={e => setMemberInput(e.target.value)}
                            />
                            <button
                                type="button"
                                className="create-team-button"
                                 style={{ minWidth: 70 }}
                                onClick={handleAddMember}
                                disabled={!memberInput.trim()}
                            >
                                Add
                            </button>
                        </div>
                        <div style={{ marginTop: 8, marginBottom: 8 }}>
                            {members.map(member => (
                                <span
                                    key={member}
                                    style={{
                                        display: 'inline-block',
                                        background: '#e0e7ef',
                                        color: '#374151',
                                        borderRadius: 12,
                                        padding: '2px 10px',
                                        marginRight: 6,
                                          marginBottom: 4,
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
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                    <textarea
                        placeholder="Description (optional)"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                    />
                    {teamLeads.length > 0 && (
                        <select value={lead} onChange={e => setLead(e.target.value)}>
                            <option value="">Select Team Lead (optional)</option>
                            {teamLeads.map(l => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    )}
                    {teamTypes.length > 0 && (
                        <select value={type} onChange={e => setType(e.target.value)}>
                            <option value="">Select Team Type (optional)</option>
                            {teamTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                         )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={e => setIsPublic(e.target.checked)}
                        />
                        Public Team
                    </label>
                    <div className="create-team-actions">
                        <button
                            type="button"
                            className="create-team-button"
                            style={{ background: "#e5e7eb", color: "#374151" }}
                            onClick={onClose}
                        >
                            Cancel
                             </button>
                        <button
                            type="submit"
                            className="create-team-button"
                            disabled={!name.trim()}
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTeamModal;