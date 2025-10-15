import React from 'react';
import './CreateTeam.css';

interface CreateTeamButtonProps {
    onClick:() => void;
    className?: string;
    label?:string;
    children?: React.ReactNode;
}

const CreateTeamButton: React.FC<CreateTeamButtonProps> = ({
    onClick, 
    className = 'create-team-btn', 
    label = 'Create Team', 
    children 
}) => (
    <button 
    className={'create-team-btn' + (className ? ' ' + className : '')} 
    onClick={onClick}>
        {children ? children : label}
    </button>
);

export default CreateTeamButton;