import React, { useState } from "react";
import "./CreateTableModal.css";

const columnTypes = [
  "SERIAL",
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

type ColumnAttributes = { name: string; type: string; isPrimary?: string };

const CreateTableModal: React.FC<CreateTableModalProps> = ({ onClose, onSuccess }) => {
  const [tableName, setTableName] = useState("");
  const [columns, setColumns] = useState<ColumnAttributes[]>([{ name: "", type: "VARCHAR(255)", isPrimary: "false" }]);
  const [error, setError] = useState("");

  const handleAddColumn = () => setColumns([...columns, { name: "", type: "VARCHAR(255)", isPrimary: "false" }]);
  const handleColumnChange = (idx: number, field: keyof ColumnAttributes, value: any) => {
    const newCols = [...columns];
    // @ts-ignore
    newCols[idx][field] = value;
    setColumns(newCols);
  };
  const handlePrimaryChange = (idx: number, checked: boolean) => {
    const newCols = [...columns];
    newCols[idx].isPrimary = checked ? "true" : "false";
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
    if (!columns.some(col => col.isPrimary === "true")) {
      setError("At least one column must be marked as PRIMARY KEY.");
      return;
    }
    // Add PRIMARY KEY to the type of the selected column(s)
    const columnsWithPK = columns.map(col =>
      col.isPrimary && !col.type.toUpperCase().includes("PRIMARY KEY")
        ? { ...col, type: col.type + " PRIMARY KEY" }
        : col
    );
    const res = await fetch("http://localhost:5000/api/table/create-table", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table_name: tableName, columns: columnsWithPK }),
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
    <div className="ctm-backdrop">
      <div className="ctm-panel">
        <h2>Create New Table</h2>
        <div className="ctm-section">
          <label className="ctm-label">Table Name</label>
          <input
            className="ctm-input"
            placeholder="e.g. players"
            value={tableName}
            onChange={e => setTableName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="ctm-section">
          <label className="ctm-label">Columns</label>
          <div className="columns-list">
            {columns.map((col, idx) => (
              <div className="column-row" key={idx}>
                <input
                  className="ctm-input"
                  placeholder="Column Name"
                  value={col.name}
                  onChange={e => handleColumnChange(idx, "name", e.target.value)}
                />
                <select
                  className="ctm-select"
                  value={col.type}
                  onChange={e => handleColumnChange(idx, "type", e.target.value)}
                >
                  {columnTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <label style={{ marginLeft: 8 }}>
                  <input
                    type="checkbox"
                    checked={col.isPrimary === "true"}
                    onChange={e => handlePrimaryChange(idx, e.target.checked)}
                  />{" "}
                  Primary Key
                </label>
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
        {error && <div className="ctm-error">{error}</div>}
        <div className="ctm-actions">
          <button className="ctm-btn cancel" onClick={onClose}>Cancel</button>
          <button className="ctm-btn create" onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
};

export default CreateTableModal;