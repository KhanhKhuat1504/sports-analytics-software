import React from "react";

interface ImportCSVButtonProps {
  onClick?: () => void;
  className?: string;
  label?: string;
}

const ImportCSVButton: React.FC<ImportCSVButtonProps> = ({ onClick, className = "import-btn", label = "Create Table from CSV" }) => {
  return (
    <button className={className} onClick={onClick} type="button">
      {label}
    </button>
  );
};

export default ImportCSVButton;