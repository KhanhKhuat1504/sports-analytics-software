// AddRowModal.tsx
import React, { useState } from "react";
import "./AddRowModal.css";

interface AddRowModalProps {
  columnDefs: any[];
  newRowData: any;
  setNewRowData: (data: any) => void;
  onAdd: () => void;
  onCancel: () => void;
  requiredColumns: string[];
  addError?: string | null;
}

const AddRowModal: React.FC<AddRowModalProps> = ({
  columnDefs,
  newRowData,
  setNewRowData,
  onAdd,
  onCancel,
  requiredColumns,
  addError = null,
}) => {
  const [missingRequiredFieldsError, setMissingRequiredFieldsError] = useState<string | null>(null);

  const handleMissingRequiredFields = () => {
    for (const field of requiredColumns) {
      if (newRowData[field].trim() === "") {
        setMissingRequiredFieldsError(`"${field}" is required.`);
        return;
      }
    }
    setMissingRequiredFieldsError(null);
    onAdd();
  };

  return (
    <div className="panel-backdrop" onClick={onCancel}>
      <div className="panel" onClick={e => e.stopPropagation()}>
        <h2>Add New Row</h2>
        {columnDefs.map((col: any) => (
          <div key={col.field} style={{ marginBottom: 16 }}>
            <label>
              {col.headerName}
              {requiredColumns.includes(col.field) && <span style={{ color: "red" }}> *</span>}
              :
            </label>
            <input
              type="text"
              value={newRowData[col.field] || ""}
              onChange={e =>
                setNewRowData({ ...newRowData, [col.field]: e.target.value })
              }
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
            />
          </div>
        ))}
        {missingRequiredFieldsError && <div style={{ color: "red", marginBottom: 12 }}>{missingRequiredFieldsError}</div>}
        {addError && <div style={{ color: "red", marginBottom: 12 }}>{addError}</div>}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ marginRight: 12 }}>Cancel</button>
          <button onClick={handleMissingRequiredFields} style={{ background: "#22c55e", color: "#fff" }}>Add</button>
        </div>
      </div>
    </div>
  );
};

export default AddRowModal;