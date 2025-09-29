import React from "react";
import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TableCard from "../TableCard/TableCard";
import AddRowModal from "../Modals/AddRowModal";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "./MainContent.css";
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);
import ImportCSV from "../ImportCSV/ImportCSV";

type TableKey = "players" | "matches" | "performance";

const MainContent = () => {
  const [rowData, setRowData] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRowData, setNewRowData] = useState<any>({});
  const [addError, setAddError] = useState<string | null>(null);
  const [tableMeta, setTableMeta] = useState<any[]>([]);
  const { selectedTable } = useParams();

  const navigate = useNavigate();

  const defaultColDef = useMemo(() => ({
    sortable: true,
    editable: true,
    filter: true,
    floatingFilter: true,
    resizable: true,
  }), []);

  // Inside your MainContent component

  const handleAddRow = async () => {
    if (!selectedTable) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/table/${selectedTable}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
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

  useEffect(() => {
    if (selectedTable) {
      fetch(`http://localhost:5000/api/table/${selectedTable}`)
        .then((res) => res.json())
        .then((data) => {
          setRowData(data.rows);
          setColumnDefs(data.columns);
        });
    } else {
      setRowData([]);
      setColumnDefs([]);
    }
  }, [selectedTable]);

  useEffect(() => {
    fetch("http://localhost:5000/api/table/get-tables")
      .then(res => res.json())
      .then(data => setTableMeta(data));
  }, []);


  return (
    <main className="main-content">
      <header className="main-header">
        <div>
          <h1>Table Management</h1>
          <p>Manage your data tables, schemas, and analytics datasets</p>
        </div>
        <div className="main-header-actions">
          <ImportCSV/>
          <button className="create-btn">+ Create Table</button>
        </div>
      </header>
      <div className="search-bar">
        <input type="text" placeholder="Search tables..." />
        <span className="tables-used">3/20 Tables Used</span>
      </div>
      {!selectedTable ? (
        <div className="table-cards">
          {tableMeta.map(table => (
            console.log(table.key),
            <TableCard
              key={table.key}
              title={table.key.charAt(0).toUpperCase() + table.key.slice(1)}
              tag={table.key}
              tagColor="blue" // or use a color map if you want
              description={`Table for ${table.key}`}
              rows={table.rows}
              columns={table.columns}
              modified="N/A"
              by="Admin"
              onClick={() => navigate(`/tables/${table.key}`)}
            />
          ))}
        </div>
      ) : (
        <div style={{ height: 400, width: "100%" }} className="ag-theme-quartz">
          <button onClick={() => navigate(`/tables/`)} style={{ marginBottom: 16 }}>
            ← Back to Tables
          </button>
          {selectedTable && (
            <button onClick={() => setShowAddModal(true)} style={{ marginBottom: 16 }}>
              + Add Row
            </button>
          )}
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            singleClickEdit={true}
            onCellValueChanged={(params) => handleUpdateRow(params.data, params.colDef.field ?? "")}
            stopEditingWhenCellsLoseFocus={true}
          />
          {showAddModal && (
            <AddRowModal
              columnDefs={columnDefs}
              requiredColumns={["id"]}
              newRowData={newRowData}
              setNewRowData={setNewRowData}
              onAdd={handleAddRow}
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