export function toColumnDefs(columnNames: string[]): any[] {
  return columnNames.map(col => {
    const header = col.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    // Make "id" or columns ending with "_id" not editable
    const isId = col === "id" || col.endsWith("_id");
    return {
      headerName: header,
      field: col,
      editable: !isId,
    };
  });
}