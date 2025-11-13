import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CreateTeamModal from '../Modals/CreateTeamModals/CreateTeamModal';
import './TeamSelector.css';

const TeamSelector: React.FC = () => {
    const { currentTeam, userTeams, setCurrentTeam } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTeamSelect = (team: { id: string; name: string }) => {
        setCurrentTeam(team);
        setIsOpen(false);
    };

    const handleCreateClick = () => {
        setIsOpen(false);
        setShowCreateModal(true);
    };

    return (
        <>
            <div className="team-selector-wrapper" ref={dropdownRef}>
                <button 
                    className="team-selector-button"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                >
                    <span className="team-selector-label">
                        {currentTeam ? currentTeam.name : 'Select Team'}
                    </span>
                    <svg 
                        className={`team-selector-arrow ${isOpen ? 'open' : ''}`}
                        width="12" 
                        height="12" 
                        viewBox="0 0 12 12"
                        fill="currentColor"
                    >
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                </button>

                {isOpen && (
                    <div className="team-selector-dropdown">
                        {userTeams.length > 0 ? (
                            <>
                                <div className="team-selector-section">
                                    <div className="team-selector-section-title">Your Teams</div>
                                    {userTeams.map(team => (
                                        <button
                                            key={team.id}
                                            className={`team-selector-item ${currentTeam?.id === team.id ? 'active' : ''}`}
                                            onClick={() => handleTeamSelect(team)}
                                        >
                                            <span className="team-selector-item-icon">👥</span>
                                            {team.name}
                                            {currentTeam?.id === team.id && (
                                                <span className="team-selector-checkmark">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <div className="team-selector-divider"></div>
                            </>
                        ) : (
                            <div className="team-selector-empty">
                                <p>No teams added yet</p>
                            </div>
                        )}
                        <button 
                            className="team-selector-create-btn"
                            onClick={handleCreateClick}
                        >
                            <span className="team-selector-create-icon">+</span>
                            Create New Team
                        </button>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <CreateTeamModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                />
            )}
        </>
    );
};

export default TeamSelector;