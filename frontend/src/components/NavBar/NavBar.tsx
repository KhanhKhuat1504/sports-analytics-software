import React, { useState } from "react";
import "./NavBar.css";

const teams = [
  { id: 1, name: "Main Team" },
  { id: 2, name: "Youth Team" },
];
const username = "test_user"; // Replace with dynamic value based on user login

const NavBar: React.FC = () => {
  const [selectedTeam, setSelectedTeam] = useState(teams[0].id);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {/* add a logo or app name here if desired */}
      </div>
      <div className="navbar-center">
        <select
          className="team-select"
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(Number(e.target.value))}
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>
      <div className="navbar-right">
        <span className="username">{username}</span>
      </div>
    </nav>
  );
};

export default NavBar;
