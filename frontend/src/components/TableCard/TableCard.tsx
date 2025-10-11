import React from "react";
import "./TableCard.css";

interface TableCardProps {
  title: string;
  tag: string;
  tagColor: "blue" | "green" | "purple";
  description: string;
  rows: number;
  columns: number;
  modified: string;
  by: string;
  onClick?: () => void;
  onDelete?: () => void;
}

const TableCard: React.FC<TableCardProps> = ({
  title,
  tag,
  tagColor,
  description,
  rows,
  columns,
  modified,
  by,
  onClick,
  onDelete,
}) => {
  return (
    <div className="table-card" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <div className="table-card-header">
        <span className="table-icon">📝</span>
        <span className={`table-tag ${tagColor}`}>{tag}</span>
      </div>
      <h3>{title}</h3>
      <p className="table-desc">{description}</p>
      <div className="table-meta">
        <span>
          Rows <b>{rows.toLocaleString()}</b>
        </span>
        <span>
          Columns <b>{columns}</b>
        </span>
      </div>
      <div className="table-footer">
        <span>Modified {modified}</span>
        <span>by {by}</span>
      </div>
      {onDelete && (
        <button
          className="delete-btn"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete Table"
          type="button"
        >
          🗑️
        </button>
      )}
    </div>
  );
};

export default TableCard;