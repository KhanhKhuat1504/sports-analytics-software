import React from "react";
import "./DeleteTableModal.css";

interface DeleteTableModalProps {
  tableName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteTableModal: React.FC<DeleteTableModalProps> = ({ tableName, onConfirm, onCancel }) => (
  <div className="dtm-backdrop">
    <div className="dtm-panel">
      <h2>Delete Table</h2>
      <p>
        Are you sure you want to delete the table <b>{tableName}</b>?<br />
        This action cannot be undone.
      </p>
      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={onCancel}>No</button>
        <button onClick={onConfirm} style={{ background: "#dc2626", color: "#fff" }}>Yes, Delete</button>
      </div>
    </div>
  </div>
);

export default DeleteTableModal;