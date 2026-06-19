export function exportToCsv(filename, rows) {
  if (!rows || !rows.length) {
    return;
  }
  
  const separator = ',';
  // Use the keys of the first object to create the CSV header
  const keys = Object.keys(rows[0]);
  
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        
        // Handle Date objects
        if (cell instanceof Date) {
          cell = cell.toLocaleString();
        } 
        // Handle Arrays (like tags)
        else if (Array.isArray(cell)) {
          cell = cell.join('; ');
        }
        // Handle Objects (if any remain)
        else if (typeof cell === 'object') {
          cell = JSON.stringify(cell);
        }
        else {
          cell = cell.toString();
        }

        // Escape double quotes
        cell = cell.replace(/"/g, '""');
        
        // Wrap in quotes if there's a comma, newline, or quote
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
