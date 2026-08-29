/**
 * HUNTLO — Shared INR Formatter
 * Centralised to avoid duplication across HomeOS, Pipeline, Reports, DealDrawer.
 */
export function fmtINR(val) {
  const n = Number(val) || 0;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n.toLocaleString('en-IN')}`;
}
