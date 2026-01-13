import React, { useState } from "react";
import { useAuth } from '../../../contexts/AuthContext';
import "./ImportCSVModal.css";

interface ImportCSVModalProps {
  onClose: () => void;
  onSuccess: (result?: any) => void;
  uploadUrl?: string;
}

export default function ImportCSVModal({ onClose, onSuccess, uploadUrl = `${import.meta.env.VITE_API_BASE_URL}/api/upload/import-csv` }: ImportCSVModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [tableName, setTableName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [primaryKeys, setPrimaryKeys] = useState<string[]>([]);

  const { token } = useAuth();

  // Parse headers when file is selected
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setHeaders([]);
    setPrimaryKeys([]);
    if (f) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        const firstLine = text.split(/\r?\n/)[0];
        const cols = firstLine.split(",").map(s => s.trim()).filter(Boolean);
        setHeaders(cols);
      };
      reader.readAsText(f);
      setError(null);
    }
  };

  const handlePKChange = (col: string, checked: boolean) => {
    setPrimaryKeys(pk => checked ? [...pk, col] : pk.filter(k => k !== col));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a CSV file.");
      return;
    }
    if (headers.length && primaryKeys.length === 0) {
      setError("Select at least one column as primary column.");
      return;
    }
    setError(null);
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    if (tableName.trim()) fd.append("table_name", tableName.trim());
    if (primaryKeys.length) fd.append("primary_keys", JSON.stringify(primaryKeys));
    try {
      const res = await fetch(uploadUrl, 
        { method: "POST", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: fd });
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
        <h3 className="icm-title">Create Table from CSV</h3>
        <p className="icm-sub">Import a csv file and let us know the table name you want to use and the primary column(s). We will do the rest.</p>

        <div className="icm-row">
          <label className="icm-label">Table name (optional)</label>
          <input className="icm-input" value={tableName} onChange={e => setTableName(e.target.value)} placeholder="e.g. players" />
        </div>

        <div className="icm-row">
          <label className="icm-label">CSV file</label>
          <input type="file" accept=".csv,text/csv" onChange={handleFileChange} />
          {file && <div className="icm-filename">{file.name}</div>}
        </div>

        {headers.length > 0 && (
          <div className="icm-row">
            <label className="icm-label">Select Primary Column(s):</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {headers.map(col => (
                <label key={col} style={{ marginRight: 16 }}>
                  <input
                    type="checkbox"
                    checked={primaryKeys.includes(col)}
                    onChange={e => handlePKChange(col, e.target.checked)}
                  />{" "}
                  {col}
                </label>
              ))}
            </div>
          </div>
        )}

        {error && <div className="icm-error">{error}</div>}

        <div className="icm-actions">
          <button className="icm-btn cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="icm-btn primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}