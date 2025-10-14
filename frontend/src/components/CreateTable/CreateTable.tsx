import React from "react";
import "./CreateTable.css";

interface CreateTableButtonProps {
  onClick?: () => void;
  className?: string;
  label?: string;
}

const CreateTableButton: React.FC<CreateTableButtonProps> = ({
  onClick,
  className = "create-btn",
  label = "+ Create Table",
}) => {
  return (
    <button className={className} onClick={onClick} type="button">
      {label}
    </button>
  );
};

export default CreateTableButton;