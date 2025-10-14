export function toColumnDefs(columnNames: string[], primaryKeys: string[]): any[] {
  return columnNames.map(col => {
    const header = col.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    // Make "id" or columns ending with "_id" not editable
    const isPrimaryKey = primaryKeys.includes(col);
    return {
      headerName: header,
      field: col,
      editable: !isPrimaryKey,
    };
  });
}