import React from "react";
import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TableCard from "../TableCard/TableCard";
import AddRowModal from "../Modals/TableOperationsModals/AddRowModal";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "./MainContent.css";
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);
import ImportCSVButton from "../ImportCSV/ImportCSV";
import ImportCSVModal from "../Modals/ImportCSVModals/ImportCSVModal";
import CreateTableButton from "../CreateTable/CreateTable";
import CreateTableModal from "../Modals/TableOperationsModals/CreateTableModal";
import DeleteTableModal from "../Modals/TableOperationsModals/DeleteTableModal";
import { toColumnDefs } from "../../utilities/TableUtilities";
import { useAuth } from '../../contexts/AuthContext';

//TODO: When user import a table that already exists, ask them if they want to overwrite the existing table or add the rows that don't already exist.

const MainContent = () => {
  const [rowData, setRowData] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<any[]>([]);
  const [requiredColumns, setRequiredColumns] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newRowData, setNewRowData] = useState<any>({});
  const [addError, setAddError] = useState<string | null>(null);
  const [tableMeta, setTableMeta] = useState<any[]>([]);
  const { selectedTable } = useParams();
  console.log(columnDefs);

  const navigate = useNavigate();
  const { token } = useAuth();

  const defaultColDef = useMemo(() => ({
    sortable: true,
    editable: true,
    filter: true,
    floatingFilter: true,
    resizable: true,
  }), []);

  const actionsColDef = {
    headerName: "Actions",
    field: "actions",
    cellRenderer: (params: any) => (
      <div style={{ display: "flex", gap: 8 }}>
        <span
          style={{ color: "#ef4444", cursor: "pointer" }}
          title="Delete"
          onClick={() => handleDeleteRow(params.data)}
        >
          🗑️
        </span>
      </div>
    ),
    editable: false,
  };

  const handleAddRow = async () => {
    if (!selectedTable) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/table/${selectedTable}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ data: newRowData }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        setAddError(errorData.detail || "Failed to add row");
        return;
      }
      const data = await res.json();
      setRowData(prev => [...prev, data.row]);
      setShowAddModal(false);
      setNewRowData({});
      setAddError(null);
    } catch (err) {
      setAddError("Network error");
    }
  };

  const handleUpdateRow = async (updatedRowData: any, columnName: string) => {
    try {
      if (selectedTable) {
        await fetch(`http://localhost:5000/api/table/${selectedTable}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            data: updatedRowData,
            column_name: columnName,
          }),
        });
      }
    } catch (error) {
      console.error("Error updating row:", error);
    }
  };

  const handleDeleteRow = async (rowDataToDelete: any) => {
    console.log("Deleting row:", rowDataToDelete);
    console.log("Required columns for PK:", requiredColumns);
    console.log(selectedTable);
    if (!selectedTable || requiredColumns.length === 0) return;
    // Build PK object for all PK columns
    const pkObj = Object.fromEntries(
      requiredColumns.map(k => [k, rowDataToDelete[k]])
    );
    console.log("Primary key object for deletion:", pkObj);
    if (Object.values(pkObj).some(v => v === undefined)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/table/${selectedTable}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: pkObj }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.detail || "Failed to delete row");
        return;
      }
      // Remove the row from state
      setRowData(prev =>
        prev.filter(row =>
          !requiredColumns.every(k => row[k] === rowDataToDelete[k])
        )
      );
    } catch (err) {
      alert("Network error");
    }
  };

  const handleDeleteTable = async (tableName: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/table/delete-table/${tableName}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.detail || "Failed to delete table");
        return;
      }
      // Refetch table list after deletion
      fetchAllTableMeta();
    } catch (err) {
      alert("Network error");
    }
  };

  const openAddRowModal = async () => {
    if (!selectedTable) {
      return;
    }
    setShowAddModal(true);
  };

  const fetchAllTableMeta = () => {
    fetch("http://localhost:5000/api/table/get-tables", { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
      .then(res => res.json())
      .then(data => setTableMeta(data));
  };

  useEffect(() => {
    if (!selectedTable) {
      setRequiredColumns([]);
      return;
    }
    // Fetch primary key(s) when table changes
    fetch(`http://localhost:5000/api/table/primary-key/${selectedTable}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
      .then(res => res.ok ? res.json() : Promise.reject("failed to fetch primary key"))
      .then(data => {
        const pk = data.primary_key;
        const pks = Array.isArray(pk) ? pk : (pk ? [pk] : []);
        setRequiredColumns(pks.length ? pks : []);
        setNewRowData((prev: { [x: string]: any; }) => ({ ...prev, ...Object.fromEntries(pks.map(k => [k, prev[k] ?? ""])) }));
      })
      .catch(err => {
        console.error("Error fetching primary key:", err);
        setRequiredColumns([]);
      });
  }, [selectedTable]);

  useEffect(() => {
    if (selectedTable) {
      fetch(`http://localhost:5000/api/table/${selectedTable}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
        .then((res) => res.json())
        .then((data) => {
          setRowData(data.rows);
          setColumnDefs(toColumnDefs(data.columns, requiredColumns));
        });
    } else {
      setRowData([]);
      setColumnDefs([]);
    }
  }, [selectedTable, requiredColumns]);

  useEffect(() => {
    // Only fetch table metadata once a token exists (prevents unauthenticated requests)
    if (token) {
      fetchAllTableMeta();
    }
  }, [token]);


  return (
    <main className="main-content">
      <header className="main-header">
        <div>
          <h1>Table Management</h1>
          <p>Manage your data tables, schemas, and analytics datasets</p>
        </div>
        <div className="main-header-actions">
          <ImportCSVButton onClick={() => setShowImportModal(true)} />
          {showImportModal && (
            <ImportCSVModal
              onClose={() => setShowImportModal(false)}
              onSuccess={() => {
                fetchAllTableMeta();
                setShowImportModal(false);
              }}
            />
          )}
          <CreateTableButton onClick={() => setShowCreateTableModal(true)} />
          {showCreateTableModal && (
              <CreateTableModal
              onClose={() => setShowCreateTableModal(false)}
              onSuccess={() => {
                // Refetch table list after creation
                fetch("http://localhost:5000/api/table/get-tables", { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
                  .then(res => res.json())
                  .then(data => setTableMeta(data));
              }}
            />
          )}
        </div>
      </header>
      <div className="search-bar">
        <input type="text" placeholder="Search tables..." />
        <span className="tables-used">3/20 Tables Used</span>
      </div>
      {!selectedTable ? (
        <div className="table-cards">
          {tableMeta.map(table => (
            <div key={table.key} style={{ position: "relative" }}>
              <TableCard
                title={table.key.charAt(0).toUpperCase() + table.key.slice(1)}
                tag={table.key}
                tagColor="blue"
                description={`Table for ${table.key}`}
                rows={table.rows}
                columns={table.columns}
                modified="N/A"
                by="Admin"
                onClick={() => navigate(`/tables/${table.key}`)}
                onDelete={() => setDeleteTarget(table.key)}
              />
              {deleteTarget && (
                <DeleteTableModal
                  tableName={deleteTarget}
                  onCancel={() => setDeleteTarget(null)}
                  onConfirm={() => {
                    handleDeleteTable(deleteTarget);
                    setDeleteTarget(null);
                  }}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ height: 400, width: "100%" }} className="ag-theme-quartz">
          <button onClick={() => navigate(`/tables/`)} style={{ marginBottom: 16 }}>
            ← Back to Tables
          </button>
          {selectedTable && (
            <button onClick={openAddRowModal} style={{ marginBottom: 16 }}>
              + Add Row
            </button>
          )}
          <AgGridReact
            rowData={rowData}
            columnDefs={[...columnDefs, actionsColDef]}
            defaultColDef={defaultColDef}
            singleClickEdit={true}
            onCellValueChanged={(params) => handleUpdateRow(params.data, params.colDef.field ?? "")}
            stopEditingWhenCellsLoseFocus={true}
          />
          {showAddModal && (
            <AddRowModal
              columnDefs={columnDefs}
              requiredColumns={requiredColumns}
              newRowData={newRowData}
              setNewRowData={setNewRowData}
              onAdd={async () => {
                await handleAddRow();
              }}
              onCancel={() => {
                setShowAddModal(false);
                setNewRowData({});
              }}
              addError={addError}
            />
          )}
        </div>
      )}
    </main>
  );
};

export default MainContent;