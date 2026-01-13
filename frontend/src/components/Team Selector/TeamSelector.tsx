import React, { useState } from 'react';
import './TeamSelector.css';
import { useAuth } from '../../contexts/AuthContext';
import CreateTeamModal from '../Modals/CreateTeamModals/CreateTeamModal';

const TeamSelector: React.FC = () => {
    const { currentTeam, userTeams, switchTeam } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const handleSwitchTeam = async (teamId: string) => {
        setIsLoading(true);
        try {
            await switchTeam(teamId);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="team-selector-container">
            <div className="team-tiles">
                {userTeams && userTeams.length > 0 && userTeams.map((team) => (
                    <button
                        key={team.id}
                        className={`team-tile ${currentTeam?.id === team.id ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
                        onClick={() => handleSwitchTeam(team.id)}
                        disabled={isLoading}
                        title={team.name}
                    >
                        <div className="team-tile-name">{team.name}</div>
                        <div className="team-tile-sport">{team.sport_type}</div>
                    </button>
                ))}
                <button 
                    className="team-tile team-create-btn"
                    onClick={() => setShowCreateModal(true)}
                    title="Create a new team"
                >
                    <div className="team-tile-name">+</div>
                    <div className="team-tile-sport">New Team</div>
                </button>
            </div>

            {showCreateModal && (
                <CreateTeamModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                />
            )}
        </div>
    );
};

export default TeamSelector;