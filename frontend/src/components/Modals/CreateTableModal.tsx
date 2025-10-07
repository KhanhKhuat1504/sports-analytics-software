import React, { useState } from "react";
import "./CreateTableModal.css";

const columnTypes = [
  "SERIAL PRIMARY KEY",
  "INTEGER",
  "VARCHAR(255)",
  "TEXT",
  "BOOLEAN",
  "DATE",
  "FLOAT"
];

interface CreateTableModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type ColumnAttributes = { name: string; type: string; };

const CreateTableModal: React.FC<CreateTableModalProps> = ({ onClose, onSuccess }) => {
  const [tableName, setTableName] = useState("");
  const [columns, setColumns] = useState<ColumnAttributes[]>([{ name: "", type: "VARCHAR(255)" }]);
  const [error, setError] = useState("");

  const handleAddColumn = () => setColumns([...columns, { name: "", type: "VARCHAR(255)" }]);
  const handleColumnChange = (idx: number, field: keyof ColumnAttributes, value: string) => {
    const newCols = [...columns];
    newCols[idx][field] = value;
    setColumns(newCols);
  };

  const handleRemoveColumn = (idx: number) => {
    setColumns(columns.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!tableName.trim() || columns.some(col => !col.name.trim() || !col.type)) {
      setError("Table name and all columns are required.");
      return;
    }
    const res = await fetch("http://localhost:5000/api/table/create-table", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table_name: tableName, columns }),
    });
    if (res.ok) {
      onSuccess();
      onClose();
    } else {
      const data = await res.json();
      setError(data.detail || "Failed to create table");
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal create-table-modal">
        <h2>Create New Table</h2>
        <div className="modal-section">
          <label className="modal-label">Table Name</label>
          <input
            className="modal-input"
            placeholder="e.g. players"
            value={tableName}
            onChange={e => setTableName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="modal-section">
          <label className="modal-label">Columns</label>
          <div className="columns-list">
            {columns.map((col, idx) => (
              <div className="column-row" key={idx}>
                <input
                  className="modal-input"
                  placeholder="Column Name"
                  value={col.name}
                  onChange={e => handleColumnChange(idx, "name", e.target.value)}
                />
                <select
                  className="modal-select"
                  value={col.type}
                  onChange={e => handleColumnChange(idx, "type", e.target.value)}
                >
                  {columnTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {columns.length > 1 && (
                  <button
                    className="remove-col-btn"
                    onClick={() => handleRemoveColumn(idx)}
                    title="Remove column"
                    type="button"
                  >
                    ❌
                  </button>
                )}
              </div>
            ))}
          </div>
          <button className="add-col-btn" onClick={handleAddColumn} type="button">
            + Add Column
          </button>
        </div>
        {error && <div className="modal-error">{error}</div>}
        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
          <button className="modal-btn create" onClick={handleSubmit}>Create Table</button>
        </div>
      </div>
    </div>
  );
};

export default CreateTableModal;