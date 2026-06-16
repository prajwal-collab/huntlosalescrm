const fs = require('fs');

let content = fs.readFileSync('scratch_leads_fixed.jsx', 'utf8');

// 1. Imports
content = content.replace(
  "import { useDialog } from '../context/DialogContext';\r\nimport './Leads.css';",
  "import { useDialog } from '../context/DialogContext';\r\nimport { computeSignalScore, getPriority } from '../utils/leadScoring';\r\nimport './Leads.css';"
);

// 2. Remove old scoring logic
content = content.replace(
  /\/\/ ── Signal score computation ──[\s\S]*?\/\/ ── Stage colours/m,
  "// ── Signal score computation ────────────────────────────────\r\n// Extracted to src/utils/leadScoring.js\r\n\r\n// ── Stage colours"
);

// 3. LeadRow definition
content = content.replace(
  "function LeadRow({ lead, isSelected, onSelect, onClick, updateLead, team }) {",
  "function LeadRow({ lead, isSelected, onSelect, onClick, updateLead, team, user }) {"
);

content = content.replace(
  "const scoreColor = score >= 70 ? '#dc2626' : score >= 35 ? '#d97706' : '#94a3b8';",
  "const scoreColor = score >= 70 ? '#dc2626' : score >= 35 ? '#d97706' : '#94a3b8';\n  const isOwner = user?.id === lead.owner_id;"
);

// 4. LeadRow Checkbox
content = content.replace(
  /<div className="lc" onClick=\{e => \{ e\.stopPropagation\(\); onSelect\(lead\.id\); \}\}>\s*<input\s*type="checkbox"\s*checked=\{isSelected\}\s*onChange=\{\(\) => \{\}\}\s*style=\{\{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var\(--accent-blue\)' \}\}\s*\/>\s*<\/div>/,
  `<div className="lc" onClick={e => { if (isOwner) { e.stopPropagation(); onSelect(lead.id); } }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          disabled={!isOwner}
          title={!isOwner ? 'Only owner can select this lead' : ''}
          style={{ width: 15, height: 15, cursor: isOwner ? 'pointer' : 'not-allowed', accentColor: 'var(--accent-blue)', opacity: isOwner ? 1 : 0.5 }}
        />
      </div>`
);

// 5. LeadRow Notes double-click
content = content.replace(
  "onClick={(e) => e.stopPropagation()} onDoubleClick={() => setIsEditingNote(true)}>",
  "onClick={(e) => e.stopPropagation()} onDoubleClick={() => { if (isOwner) setIsEditingNote(true); }}>"
);

content = content.replace(
  "cursor: 'pointer'",
  "cursor: isOwner ? 'pointer' : 'default'"
);

// 6. Leads component
content = content.replace(
  "const { team } = useAuthStore();",
  "const { team, user } = useAuthStore();"
);

// 7. toggleAll
content = content.replace(
  /const toggleAll = \(\) => \{\s*if \(selectedIds\.length === filtered\.length\) setSelectedIds\(\[\]\);\s*else setSelectedIds\(filtered\.map\(l => l\.id\)\);\s*\};/,
  `const toggleAll = () => {
    // Only select leads the user owns
    const selectable = filtered.filter(l => l.owner_id === user?.id);
    if (selectedIds.length === selectable.length && selectable.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectable.map(l => l.id));
    }
  };`
);

// 8. Leads Table Head Checkbox
content = content.replace(
  /checked=\{selectedIds\.length === filtered\.length && filtered\.length > 0\}/,
  "checked={selectedIds.length > 0 && selectedIds.length === filtered.filter(l => l.owner_id === user?.id).length}"
);

// 9. LeadRow render inside map
content = content.replace(
  /updateLead=\{updateLead\}\r\n\s*team=\{team\}\r\n\s*\/>/g,
  "updateLead={updateLead}\n                  team={team}\n                  user={user}\n                />"
);

// Remove the weird duplicated import header if it exists
if (content.split("import { useState, useMemo }").length > 2) {
  content = content.replace(
    /\/\/ ============================================\r\n\/\/ HUNTLO — LEADS PAGE\r\n\/\/ AI-Native Signal-Driven Lead System\r\n\/\/ ============================================\r\nimport \{ useState, useMemo \} from 'react';\r\nimport \{\r\n  Search, Plus, X, Zap, TrendingUp, Building2,\r\n  Mail, Link2, Phone, Globe, ChevronDown,\r\n  AlertCircle, Calendar, Target, DollarSign,\r\n  Users, SlidersHorizontal, CheckCircle2\r\n/,
    ""
  );
}

fs.writeFileSync('src/pages/Leads.jsx', content);
console.log('Fixed Leads.jsx');
