import React from "react"; 
import { useMemo, useState, useEffect } from "react";
import TableCard from "../TableCard/TableCard";
import AddRowModal from "../Modals/AddRowModal";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "./MainContent.css";
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

type TableKey = "players" | "matches" | "performance";

const MainContent = () => {
  const [selectedTable, setSelectedTable] = useState<TableKey | null>(null);
  const [rowData, setRowData] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRowData, setNewRowData] = useState<any>({});
  const [addError, setAddError] = useState<string | null>(null);

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

  return (
    <main className="main-content">
      <header className="main-header">
        <div>
          <h1>Table Management</h1>
          <p>Manage your data tables, schemas, and analytics datasets</p>
        </div>
        <div className="main-header-actions">
          <button className="import-btn">Import CSV</button>
          <button className="create-btn">+ Create Table</button>
        </div>
      </header>
      <div className="search-bar">
        <input type="text" placeholder="Search tables..." />
        <span className="tables-used">3/20 Tables Used</span>
      </div>
      {!selectedTable ? (
        <div className="table-cards">
          <TableCard
            title="Players"
            tag="players"
            tagColor="blue"
            description="Player roster and basic information"
            rows={187}
            columns={8}
            modified="1/14/2024"
            by="Admin"
            onClick={() => setSelectedTable("players")}
          />
          <TableCard
            title="Match Results"
            tag="matches"
            tagColor="green"
            description="Game outcomes and match statistics"
            rows={45}
            columns={12}
            modified="1/13/2024"
            by="Analyst"
            onClick={() => setSelectedTable("matches")}
          />
          <TableCard
            title="Performance Metrics"
            tag="performance"
            tagColor="purple"
            description="Individual player performance data"
            rows={2456}
            columns={15}
            modified="1/12/2024"
            by="Coach"
            onClick={() => setSelectedTable("performance")}
          />
        </div>
      ) : (
        <div style={{ height: 400, width: "100%" }} className="ag-theme-quartz">
          <button onClick={() => setSelectedTable(null)} style={{ marginBottom: 16 }}>
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