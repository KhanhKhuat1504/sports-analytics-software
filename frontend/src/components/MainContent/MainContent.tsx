import React, { useState } from "react";
import TableCard from "../TableCard/TableCard";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "./MainContent.css";
import { playersColumns, playersRows } from "../../sample_data/PlayersData";
import { performanceColumns, performanceRows } from "../../sample_data/PerformanceData";
import { matchesColumns, matchesRows } from "../../sample_data/MatchData";
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import ImportCSV from "../ImportCSV/ImportCSV";
ModuleRegistry.registerModules([AllCommunityModule]);

type TableKey = "players" | "matches" | "performance";

const tableData: Record<TableKey, { columns: any[]; rows: any[] }> = {
  players: { columns: playersColumns, rows: playersRows },
  matches: { columns: matchesColumns, rows: matchesRows },
  performance: { columns: performanceColumns, rows: performanceRows },
};

const MainContent = () => {
  const [selectedTable, setSelectedTable] = useState<TableKey | null>(null);

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
          <AgGridReact
            rowData={selectedTable ? tableData[selectedTable].rows : []}
            columnDefs={selectedTable ? tableData[selectedTable].columns : []}
            domLayout="autoHeight"
          />
        </div>
      )}
    </main>
  );
};

export default MainContent;