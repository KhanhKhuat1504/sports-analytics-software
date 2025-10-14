import React, { useState } from "react";
import "./ImportCSVModal.css";

interface ImportCSVModalProps {
  onClose: () => void;
  onSuccess: (result?: any) => void;
  uploadUrl?: string;
}

export default function ImportCSVModal({ onClose, onSuccess, uploadUrl = "http://localhost:5000/api/upload/import-csv" }: ImportCSVModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [tableName, setTableName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a CSV file.");
      return;
    }
    setError(null);
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    if (tableName.trim()) fd.append("table_name", tableName.trim());

    try {
      const res = await fetch(uploadUrl, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Failed to import CSV");
      } else {
        onSuccess(data);
        onClose();
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="icm-backdrop" role="dialog" aria-modal="true">
      <div className="icm-panel">
        <h3 className="icm-title">Import CSV</h3>
        <p className="icm-sub">Choose a CSV file and optional table name. The backend will infer column types.</p>

        <div className="icm-row">
          <label className="icm-label">Optional table name</label>
          <input className="icm-input" value={tableName} onChange={e => setTableName(e.target.value)} placeholder="e.g. players" />
        </div>

        <div className="icm-row">
          <label className="icm-label">CSV file</label>
          <input type="file" accept=".csv,text/csv" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} />
          {file && <div className="icm-filename">{file.name}</div>}
        </div>

        {error && <div className="icm-error">{error}</div>}

        <div className="icm-actions">
          <button className="icm-btn cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="icm-btn primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Importing..." : "Import CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}