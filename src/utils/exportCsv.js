// Columns exported for the "enrich missing contacts" workflow.
// The `id` column is intentionally included first so the re-import
// can update the exact existing lead row instead of creating a duplicate.
const ENRICHMENT_COLUMNS = [
  'id',
  'company_name',
  'contact_name',
  'designation',
  'phone',
  'email',
  'website',
  'linkedin_url',
  'contact_linkedin',
  'location',
  'industry',
  'stage',
  'notes',
];

/**
 * Exports a subset of lead fields (including id) to CSV so the user can
 * fill in missing contact details and re-import with updateLeads.
 */
export function exportLeadsForEnrichment(leads) {
  if (!leads || !leads.length) return;

  const rows = leads.map(lead => {
    const row = {};
    ENRICHMENT_COLUMNS.forEach(col => {
      let val = lead[col];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      row[col] = String(val);
    });
    return row;
  });

  const separator = ',';
  const csvContent =
    ENRICHMENT_COLUMNS.join(separator) +
    '\n' +
    rows.map(row =>
      ENRICHMENT_COLUMNS.map(col => {
        let cell = row[col];
        cell = cell.replace(/"/g, '""');
        if (cell.search(/(\"|,|\n)/g) >= 0) cell = `"${cell}"`;
        return cell;
      }).join(separator)
    ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'leads_missing_contact.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

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
