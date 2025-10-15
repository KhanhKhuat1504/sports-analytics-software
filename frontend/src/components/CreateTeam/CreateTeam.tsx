import React from 'react';
import './CreateTeam.css';

interface CreateTeamButtonProps {
    onClick: () => void;
    className?: string;
    label?: string;
    children?: React.ReactNode;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
}

const CreateTeamButton: React.FC<CreateTeamButtonProps> = ({
    onClick,
    className = '',
    label = 'Create Team',
    children,
    type = 'button',
    disabled = false,
}) => (
    <button
        type={type}
        className={`create-team-btn${className ? ' ' + className : ''}`}
        onClick={onClick}
        disabled={disabled}
    >
        {children ? children : label}
    </button>
);

export default CreateTeamButton;