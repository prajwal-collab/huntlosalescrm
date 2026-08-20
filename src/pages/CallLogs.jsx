// ============================================
// HUNTLO SALES OS — CALL LOGS PAGE
// ============================================
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, PhoneCall, PhoneOff, PhoneForwarded, 
  Clock, Calendar, User, Building2, FileText, 
  Filter, ChevronDown, Phone, Play, UploadCloud, Save, X, AlertTriangle,
  Bell, ArrowRight
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import useUIStore from '../store/useUIStore';
import CsvImporterModal from '../components/CsvImporterModal';
import './CallLogs.css';

const CALL_OUTCOMES = [
  { value: 'connected', label: 'Connected', color: '#16a34a', emoji: '✅', icon: PhoneCall },
  { value: 'voicemail', label: 'Voicemail', color: '#f59e0b', emoji: '📩', icon: PhoneForwarded },
  { value: 'no_answer', label: 'No Answer', color: '#64748b', emoji: '📵', icon: PhoneOff },
  { value: 'busy', label: 'Busy', color: '#ef4444', emoji: '🔴', icon: PhoneOff },
  { value: 'wrong_number', label: 'Wrong Number', color: '#94a3b8', emoji: '❌', icon: PhoneOff },
  { value: 'callback', label: 'Callback Requested', color: '#3b82f6', emoji: '🔄', icon: PhoneCall },
];

function safeFormatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (!isValid(d)) return '—';
  return format(d, 'MMM d, yyyy h:mm a');
}

export default function CallLogs() {
  const { tasks, leads, contacts, createTask, appendLeadNotes } = useDataStore();
  const { user, team, updateProfileMeta } = useAuthStore();
  const { addNotification } = useUIStore();

  // Role detection — admin sees all SDR data; SDRs see only their own
  const userProfile = team?.find(m => m.id === user?.id);
  const isAdmin = user?.email === 'prajwal@earlyjobs.in' || userProfile?.role === 'Admin' || userProfile?.role === 'Manager';
  const [sdrBannerDismissed, setSdrBannerDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState('history'); // 'history', 'dialer', 'bulk'
  
  // Bulk Tab State
  const [bulkSelected, setBulkSelected] = useState([]);
  const [bulkOutcome, setBulkOutcome] = useState('');
  
  // History Tab State
  const [search, setSearch] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [filterDate, setFilterDate] = useState('today');
  const [selectedCall, setSelectedCall] = useState(null);

  // Dialer & Call Logger State
  const [showCallLogger, setShowCallLogger] = useState(false);
  const [callForm, setCallForm] = useState({
    contactName: '', company: '', phone: '', outcome: 'connected',
    duration: '', notes: '', createFollowUp: false, followUpDue: '',
    linkedLeadId: '', updateLeadStage: '',
  });
  const [callSaving, setCallSaving] = useState(false);
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [showImporter, setShowImporter] = useState(false);
  const [activeCallIdx, setActiveCallIdx] = useState(0);
  const [activeCallForm, setActiveCallForm] = useState({ outcome: '', duration: '', notes: '' });
  const [dialerDone, setDialerDone] = useState(false);
  const [saving, setSaving] = useState(false);

  // Extract and parse cold call logs from tasks (for History view)
  // SDRs see only their own logs; Admins see all team logs
  const callLogs = useMemo(() => {
    return tasks
      .filter(t => {
        const isCallType = t.type === 'cold_call' || (t.type === 'call' && t.notes && t.notes.includes('_type":"cold_call_log"')) || (t.type === 'calling_list_item' && t.status === 'completed');
        if (!isCallType) return false;
        // Non-admins only see their own call logs
        if (!isAdmin && t.owner_id && user?.id && t.owner_id !== user.id) return false;
        return true;
      })
      .map(t => {
        let callData = {};
        try { callData = JSON.parse(t.notes); } catch (e) {}
        const ownerProfile = team?.find(m => m.id === t.owner_id);
        return {
          id: t.id,
          title: t.title,
          owner_id: t.owner_id,
          ownerName: ownerProfile?.full_name || ownerProfile?.name || ownerProfile?.email || 'Unknown',
          createdAt: t.created_at || callData.timestamp,
          contactName: callData.contactName || t.title || '',
          company: callData.company || callData.company_name || '',
          phone: callData.phone || '',
          outcome: callData.outcome || 'unknown',
          outcomeLabel: callData.outcomeLabel || '',
          duration: callData.duration || '',
          notes: callData.notes || '',
          pushedToLead: callData.pushedToLead || false,
          isDialerCall: t.type === 'calling_list_item'
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [tasks, isAdmin, user?.id, team]);

  const filteredLogs = useMemo(() => {
    return callLogs.filter(call => {
      const matchesSearch = 
        (call.contactName || '').toLowerCase().includes(search.toLowerCase()) ||
        (call.company || '').toLowerCase().includes(search.toLowerCase()) ||
        (call.phone || '').includes(search);
      const matchesOutcome = filterOutcome === 'all' || call.outcome === filterOutcome;
      
      let matchesDate = true;
      if (filterDate !== 'all' && call.createdAt) {
        const callDate = new Date(call.createdAt);
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        if (filterDate === 'today') {
          matchesDate = callDate >= startOfToday;
        } else if (filterDate === 'yesterday') {
          const startOfYesterday = new Date(startOfToday);
          startOfYesterday.setDate(startOfYesterday.getDate() - 1);
          matchesDate = callDate >= startOfYesterday && callDate < startOfToday;
        } else if (filterDate === 'this_week') {
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
          matchesDate = callDate >= startOfWeek;
        } else if (filterDate === 'this_month') {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          matchesDate = callDate >= startOfMonth;
        }
      }

      return matchesSearch && matchesOutcome && matchesDate;
    });
  }, [callLogs, search, filterOutcome, filterDate]);

  const totalCalls = callLogs.length;
  const connectedCalls = callLogs.filter(c => c.outcome === 'connected').length;
  const totalDuration = callLogs.reduce((acc, curr) => acc + (parseFloat(curr.duration) || 0), 0);

  // Power Dialer Derived State
  // Sort: pending first (preserving import order), then completed/skipped at the bottom.
  // SDRs only see their own dialing list; admins see all imported lists.
  const callingList = useMemo(() => {
    const cleanStr = (str) => {
      if (!str || typeof str !== 'string') return str || '';
      if (str.includes('#ERROR') || str.includes('#REF!') || str.includes('#VALUE!')) return '';
      return str;
    };
    const mapped = tasks
      .filter(t => {
        if (t.type !== 'calling_list_item') return false;
        // Non-admins only see their own list items
        if (!isAdmin && t.owner_id && user?.id && t.owner_id !== user.id) return false;
        return true;
      })
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // oldest first = import order
      .map(t => {
        let data = {};
        try { data = JSON.parse(t.notes); } catch(e) {}
        return {
          id: t.id,
          status: t.status,
          owner_id: t.owner_id,
          contact_name: cleanStr(t.title),
          company_name: cleanStr(data.company_name),
          phone: cleanStr(data.phone),
          email: cleanStr(data.email),
          outcome: data.outcome || '',
          outcomeLabel: data.outcomeLabel || '',
          duration: data.duration || '',
          notes: data.notes || '',
        };
      });
    // Pending contacts first, then completed, then skipped
    const statusOrder = { pending: 0, completed: 1, skipped: 2 };
    return mapped.sort((a, b) => (statusOrder[a.status] ?? 1) - (statusOrder[b.status] ?? 1));
  }, [tasks, isAdmin, user?.id]);

  // Separate list used by the dialer to navigate — only pending contacts.
  // The sidebar still shows the full callingList for visibility.
  const pendingDialerList = useMemo(
    () => callingList.filter(c => c.status === 'pending'),
    [callingList]
  );

  useEffect(() => {
    const current = callingList[activeCallIdx];
    // Only pre-fill the form if the contact is still pending (not already logged)
    if (current && current.status === 'pending') {
      setActiveCallForm(prev => {
        const next = { outcome: current.outcome || '', duration: current.duration || '', notes: current.notes || '' };
        if (prev.outcome === next.outcome && prev.duration === next.duration && prev.notes === next.notes) {
          return prev;
        }
        return next;
      });
      setDialerDone(prev => prev ? false : prev);
    }
  }, [activeCallIdx, callingList]);

  // Lead matching for manual call log
  // Memoize only the matched lead's ID (a stable primitive) to avoid
  // triggering effects on every render due to new object references.
  const matchedLeadId = useMemo(() => {
    if (!callForm.company && !callForm.contactName) return null;
    const q = (callForm.company || callForm.contactName).toLowerCase().trim();
    if (q.length < 2) return null;
    const found = leads.find(l =>
      (l.company_name && l.company_name.toLowerCase().includes(q)) ||
      (l.contact_name && l.contact_name.toLowerCase().includes(q)) ||
      (l.email && l.email.toLowerCase().includes(q))
    );
    return found ? found.id : null;
  }, [callForm.company, callForm.contactName, leads]);

  // Derive the full lead object from the stable ID for use in JSX
  const matchedLead = useMemo(
    () => (matchedLeadId ? leads.find(l => l.id === matchedLeadId) ?? null : null),
    [matchedLeadId, leads]
  );

  useEffect(() => {
    // Only auto-fill once: when a matched lead is found and linkedLeadId is not yet set.
    // Including callForm.linkedLeadId in deps prevents the infinite loop where
    // setCallForm → re-render → matchedLeadId unchanged but effect still fires.
    if (matchedLeadId && !callForm.linkedLeadId) {
      setCallForm(f => ({ ...f, linkedLeadId: matchedLeadId }));
    }
  }, [matchedLeadId, callForm.linkedLeadId]);

  // ── Strict duplicate detection for Call Logger ─────────────────────────
  // Checks contactName and phone against ALL existing leads
  const callDuplicateWarnings = useMemo(() => {
    const warnings = [];
    const name  = callForm.contactName.trim().toLowerCase();
    const phone = callForm.phone.trim().replace(/\s+/g, '');

    for (const lead of leads) {
      // ── Name duplicate ────────────────────────────────────────────────
      if (name && lead.contact_name?.trim().toLowerCase() === name) {
        warnings.push({
          field: 'name',
          message: `"${callForm.contactName.trim()}" already exists in CRM`,
          detail: `Found at ${lead.company_name || 'another company'} (${lead.email || lead.phone || 'no contact info'})`,
        });
      }
      // ── Phone duplicate ───────────────────────────────────────────────
      if (phone && lead.phone?.replace(/\s+/g, '') === phone) {
        warnings.push({
          field: 'phone',
          message: `Phone "${callForm.phone.trim()}" is already registered`,
          detail: `Used by ${lead.contact_name || 'unknown contact'} at ${lead.company_name || 'another company'}`,
        });
      }
    }
    // Deduplicate by field
    const seen = new Set();
    return warnings.filter(w => {
      if (seen.has(w.field)) return false;
      seen.add(w.field);
      return true;
    });
  }, [callForm.contactName, callForm.phone, leads]);

  const searchResults = useMemo(() => {
    if (!callForm.contactName || callForm.contactName.length < 2) return [];
    const q = callForm.contactName.toLowerCase();
    const results = [];
    
    // Search calling list
    callingList.forEach(c => {
      if ((c.contact_name && c.contact_name.toLowerCase().includes(q)) || 
          (c.company_name && c.company_name.toLowerCase().includes(q))) {
        results.push({
          type: 'calling_list',
          id: c.id,
          name: c.contact_name || c.company_name,
          company: c.company_name || 'Calling List Contact',
          phone: c.phone || '',
        });
      }
    });

    // Search contacts
    if (contacts) {
      contacts.forEach(c => {
        if ((c.name && c.name.toLowerCase().includes(q)) || 
            (c.email && c.email.toLowerCase().includes(q))) {
          results.push({
            type: 'contact',
            id: c.id,
            name: c.name,
            company: c.designation || 'CRM Contact',
            phone: c.whatsapp || '',
          });
        }
      });
    }

    // Search leads
    if (leads) {
      leads.forEach(l => {
        if ((l.contact_name && l.contact_name.toLowerCase().includes(q)) || 
            (l.company_name && l.company_name.toLowerCase().includes(q))) {
          results.push({
            type: 'lead',
            id: l.id,
            name: l.contact_name || l.company_name,
            company: l.company_name || 'CRM Lead',
            phone: l.phone || '',
          });
        }
      });
    }

    // Deduplicate by name/company and limit to 5
    const unique = [];
    const seen = new Set();
    for (let r of results) {
      const key = `${r.name}-${r.company}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(r);
        if (unique.length >= 6) break;
      }
    }
    return unique;
  }, [callForm.contactName, callingList, contacts, leads]);

  // --- Handlers ---
  const handleImportCallingList = async (mappedData) => {
    if (!mappedData || mappedData.length === 0) {
      alert('No valid rows found. Please check your CSV and column mapping.');
      return;
    }

    const cleanStr = (str) => {
      if (!str || typeof str !== 'string') return str || '';
      if (str.includes('#ERROR') || str.includes('#REF!') || str.includes('#VALUE!')) return '';
      return str;
    };

    const newTasks = mappedData.map(d => ({
      title: cleanStr(d.contact_name) || cleanStr(d.company_name) || 'Unknown',
      type: 'calling_list_item',
      status: 'pending',
      priority: 'medium',
      due: new Date().toISOString(),
      notes: JSON.stringify({
        _type: 'calling_list_data',
        company_name: cleanStr(d.company_name),
        phone: cleanStr(d.phone),
        email: cleanStr(d.email),
        outcome: cleanStr(d.outcome) || '',
        duration: cleanStr(d.duration) || '',
        notes: cleanStr(d.notes) || ''
      })
    }));
    try {
      setSaving(true);
      await useDataStore.getState().bulkCreateTasks(newTasks);
      setShowImporter(false);
      setActiveCallIdx(0);
      setActiveTab('dialer');
    } catch(e) {
      alert("Error importing calling list: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveActiveCallWithForm = async (status, form, isPushed = false) => {
    const curr = callingList[activeCallIdx];
    if (!curr) return;
    const task = tasks.find(t => t.id === curr.id);
    if (!task) return;
    let data = {};
    try { data = JSON.parse(task.notes || '{}'); } catch(e) {}
    const outcomeObj = CALL_OUTCOMES.find(o => o.value === form.outcome);
    const newNotes = JSON.stringify({
      ...data,
      outcome: form.outcome,
      outcomeLabel: outcomeObj?.label || '',
      duration: form.duration,
      notes: form.notes,
      timestamp: new Date().toISOString(),
      ...(isPushed ? { pushedToLead: true } : {})
    });
    await useDataStore.getState().updateTask(curr.id, { status, notes: newNotes });
  };

  // Advance to the next pending contact in the full callingList.
  // Because callingList puts pending contacts first, we just need the next
  // index that still has status === 'pending'.
  const advanceToNextPending = (afterIdx) => {
    for (let i = afterIdx + 1; i < callingList.length; i++) {
      if (callingList[i].status === 'pending') {
        setActiveCallIdx(i);
        return;
      }
    }
    // No more pending contacts — also check from the start in case the list
    // was re-sorted after a save (shouldn't happen but safety net)
    for (let i = 0; i <= afterIdx; i++) {
      if (callingList[i]?.status === 'pending') {
        setActiveCallIdx(i);
        return;
      }
    }
    setDialerDone(true);
  };

  const handlePushAllPendingToLeads = async () => {
    const pending = callingList.filter(c => c.status === 'pending');
    if (!pending.length) { alert('No pending contacts to push.'); return; }
    
    if (!window.confirm(`Are you sure you want to push ${pending.length} pending contacts to your Leads pipeline?`)) return;
    
    setSaving(true);
    try {
      const leadsToCreate = pending.map(curr => {
        const uniqueCompany = curr.company_name
          || (curr.contact_name ? `${curr.contact_name} (Individual)` : null)
          || `Dialer-${curr.id}`;
        return {
          company_name: uniqueCompany,
          contact_name: curr.contact_name || '',
          phone: curr.phone || '',
          email: curr.email || null,
          stage: 'New Lead',
          source: 'Power Dialer',
          notes: 'Pushed from Power Dialer calling list.',
        };
      });
      
      await useDataStore.getState().bulkCreateLeadsFromDialer(leadsToCreate);
      
      const allTasks = useDataStore.getState().tasks;
      const tasksToUpdate = pending.map(curr => {
        const originalTask = allTasks.find(t => t.id === curr.id);
        return {
          ...originalTask,
          status: 'completed'
        };
      });
      await useDataStore.getState().bulkUpdateTasks(tasksToUpdate);
      
      alert(`Successfully pushed ${leadsToCreate.length} pending contacts to CRM Leads!`);
    } catch (e) {
      console.error(e);
      alert('Error pushing leads.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogAndNext = async () => {
    if (!activeCallForm.outcome) { alert('Please select a call outcome first.'); return; }
    
    if (activeCallForm.outcome === 'connected' && (!activeCallForm.duration || !activeCallForm.notes)) {
      alert('Please enter a duration and notes when the call is connected.');
      return;
    }
    
    setSaving(true);
    try {
      const curr = callingList[activeCallIdx];
      const savedForm = { ...activeCallForm };
      
      // 1. Save locally to tasks (marks as completed + pushedToLead)
      await saveActiveCallWithForm('completed', savedForm, true);

      // 2. Immediately push to CRM.
      const outcomeObj = CALL_OUTCOMES.find(o => o.value === savedForm.outcome);
      const callNote = `📞 [${new Date().toLocaleDateString()}] ${outcomeObj?.label || savedForm.outcome} — ${savedForm.duration ? savedForm.duration + ' min' : 'N/A'} — ${savedForm.notes || 'No notes'}`;

      // Try to find an exact matching lead in the store (by phone, contact name, or company)
      const currentLeads = useDataStore.getState().leads;
      const existingLead = currentLeads.find(l => {
        if (curr.phone && l.phone && l.phone.replace(/\s+/g, '') === curr.phone.replace(/\s+/g, '')) return true;
        if (curr.email && l.email && l.email.toLowerCase() === curr.email.toLowerCase()) return true;
        if (curr.contact_name && l.contact_name && l.contact_name.toLowerCase() === curr.contact_name.toLowerCase()) return true;
        if (curr.company_name && l.company_name && l.company_name.toLowerCase() === curr.company_name.toLowerCase()) return true;
        return false;
      });

      if (existingLead) {
        // Append call note to the matched existing lead
        const stageOrder = [
          'New Lead','Researching','Ready for Outreach','Outreach Started',
          'Engaged','Qualified','Demo Scheduled','Demo Complete',
          'Trial Started','Customer','Lost'
        ];
        const currentStageIdx = stageOrder.indexOf(existingLead.stage || 'New Lead');
        const newStage = savedForm.outcome === 'connected' ? 'Engaged' : 'New Lead';
        const newStageIdx = stageOrder.indexOf(newStage);
        const stageUpdate = newStageIdx > currentStageIdx ? newStage : null;
        await useDataStore.getState().appendLeadNotes(existingLead.id, callNote, stageUpdate);
      } else {
        // No existing lead found — create a new CRM lead via the dialer function
        const uniqueCompany = curr.company_name
          || (curr.contact_name ? `${curr.contact_name} (Individual)` : null)
          || `Dialer-${curr.id}`;
        const leadData = {
          company_name: uniqueCompany,
          contact_name: curr.contact_name || '',
          phone: curr.phone || '',
          ...(curr.email ? { email: curr.email } : {}),
          stage: savedForm.outcome === 'connected' ? 'Engaged' : 'New Lead',
          source: 'Power Dialer',
          notes: callNote,
        };
        await useDataStore.getState().bulkCreateLeadsFromDialer([leadData]);
      }

      // ── Auto Follow-up Task ──────────────────────────────────────────
      if (savedForm.outcome === 'connected') {
        const due = new Date();
        due.setDate(due.getDate() + 2);
        await useDataStore.getState().createTask({
          title: `Follow-up: ${curr.contact_name || curr.company_name || 'Dialer Contact'}`,
          type: 'follow-up',
          priority: 'medium',
          due: due.toISOString(),
          status: 'pending'
        });
      }

      // ── Update Streak ──────────────────────────────────────────────────
      const todayStr = new Date().toDateString();
      const rawStreak = user?.user_metadata?.huntlo_call_streak || localStorage.getItem('huntlo_call_streak');
      let streakData = { count: 0, lastDate: null };
      if (rawStreak) { 
        try { streakData = typeof rawStreak === 'string' ? JSON.parse(rawStreak) : rawStreak; } catch(e) {} 
      }
      if (streakData.lastDate !== todayStr) {
        const lastD = streakData.lastDate ? new Date(streakData.lastDate) : new Date(0);
        const todayD = new Date(todayStr);
        const diff = Math.floor((todayD - lastD) / 86400000);
        if (diff === 1) streakData.count += 1;
        else if (diff > 1) streakData.count = 1;
        if (!streakData.count) streakData.count = 1;
        streakData.lastDate = todayStr;
        localStorage.setItem('huntlo_call_streak', JSON.stringify(streakData));
        if (updateProfileMeta) {
          updateProfileMeta({ huntlo_call_streak: streakData }).catch(() => {});
        }
      }

      // 3. Force-refresh leads table so the Leads page reflects new entries immediately
      useDataStore.getState()._refreshTable('leads');
      
      // 4. Clear the form and move to next pending contact
      setActiveCallForm({ outcome: '', duration: '', notes: '' });
      advanceToNextPending(activeCallIdx);
    } catch(e) {
      alert("Error logging call: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    try {
      const curr = callingList[activeCallIdx];
      const savedForm = { ...activeCallForm, outcome: 'skipped' };
      setActiveCallForm({ outcome: '', duration: '', notes: '' });
      await saveActiveCallWithForm('skipped', savedForm, true);

      const callNote = `⏭️ [${new Date().toLocaleDateString()}] Skipped from Power Dialer`;

      const currentLeads = useDataStore.getState().leads;
      const existingLead = currentLeads.find(l => {
        if (curr.phone && l.phone && l.phone.replace(/\s+/g, '') === curr.phone.replace(/\s+/g, '')) return true;
        if (curr.email && l.email && l.email.toLowerCase() === curr.email.toLowerCase()) return true;
        if (curr.contact_name && l.contact_name && l.contact_name.toLowerCase() === curr.contact_name.toLowerCase()) return true;
        if (curr.company_name && l.company_name && l.company_name.toLowerCase() === curr.company_name.toLowerCase()) return true;
        return false;
      });

      if (existingLead) {
        await useDataStore.getState().appendLeadNotes(existingLead.id, callNote, null);
      } else {
        const uniqueCompany = curr.company_name
          || (curr.contact_name ? `${curr.contact_name} (Individual)` : null)
          || `Dialer-${curr.id}`;
        const leadData = {
          company_name: uniqueCompany,
          contact_name: curr.contact_name || '',
          phone: curr.phone || '',
          ...(curr.email ? { email: curr.email } : {}),
          stage: 'New Lead',
          source: 'Power Dialer',
          notes: callNote,
        };
        await useDataStore.getState().bulkCreateLeadsFromDialer([leadData]);
      }

      const due = new Date();
      due.setDate(due.getDate() + 1);
      await useDataStore.getState().createTask({
        title: `Follow-up Skipped Lead: ${curr.contact_name || curr.company_name || 'Dialer Contact'}`,
        type: 'follow-up',
        priority: 'high',
        due: due.toISOString(),
        status: 'pending'
      });

      useDataStore.getState()._refreshTable('leads');

      addNotification({
        id: `skip-${Date.now()}`,
        type: 'reminder',
        title: 'Lead Skipped',
        message: `Skipped ${curr.contact_name || curr.company_name || 'contact'}. Reminder task created for tomorrow.`,
        time: new Date().toISOString(),
        unread: true,
      });

      advanceToNextPending(activeCallIdx);
    } catch(e) {
      alert("Error skipping call: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogColdCall = async (e, closeAfter = true) => {
    e.preventDefault();
    setCallSaving(true);
    setError(null);
    try {
      const outcomeInfo = CALL_OUTCOMES.find(o => o.value === callForm.outcome) || CALL_OUTCOMES[0];
      const noteText = `${outcomeInfo.emoji} ${outcomeInfo.label} — ${callForm.duration ? callForm.duration + ' min' : 'N/A'} — ${callForm.notes || 'No notes'}`;

      // ── Auto-detect existing lead (from explicit link OR duplicate match) ──
      let linkedLeadId = callForm.linkedLeadId || null;

      if (!linkedLeadId && callDuplicateWarnings.length > 0) {
        // A duplicate was detected — auto-link to the matched lead instead of blocking
        const nameLower = callForm.contactName.trim().toLowerCase();
        const phoneClean = callForm.phone.trim().replace(/\s+/g, '');
        const matchedLead = leads.find(l =>
          (nameLower && l.contact_name?.trim().toLowerCase() === nameLower) ||
          (phoneClean && l.phone?.replace(/\s+/g, '') === phoneClean)
        );
        if (matchedLead) linkedLeadId = matchedLead.id;
      }

      const callData = {
        _type: 'cold_call_log',
        contactName: callForm.contactName,
        company: callForm.company,
        phone: callForm.phone,
        outcome: callForm.outcome,
        outcomeLabel: outcomeInfo.label,
        duration: callForm.duration,
        notes: callForm.notes,
        linkedLeadId: linkedLeadId || null,
        timestamp: new Date().toISOString(),
        pushedToLead: true,
      };

      await createTask({
        title: `Cold Call — ${callForm.company || callForm.contactName || 'Unknown'} (${outcomeInfo.label})`,
        type: 'cold_call',
        priority: 'medium',
        due: new Date().toISOString(),
        status: 'completed',
        notes: JSON.stringify(callData),
      });

      if (linkedLeadId) {
        // ── Update existing lead with call notes ──────────────────────
        const stageOrder = [
          'New Lead','Researching','Ready for Outreach','Outreach Started',
          'Engaged','Qualified','Demo Scheduled','Demo Complete',
          'Trial Started','Customer','Lost'
        ];
        const existingLead = leads.find(l => l.id === linkedLeadId);
        const currentStageIdx = stageOrder.indexOf(existingLead?.stage || 'New Lead');
        const newStage = callForm.outcome === 'connected' ? 'Engaged' : existingLead?.stage;
        const newStageIdx = stageOrder.indexOf(newStage || 'New Lead');
        const stageUpdate = callForm.updateLeadStage || (newStageIdx > currentStageIdx ? newStage : null);
        await appendLeadNotes(linkedLeadId, noteText, stageUpdate);
      } else {
        // ── No existing lead linked → auto-create a new CRM lead ──────
        const uniqueCompany = callForm.company
          || (callForm.contactName ? `${callForm.contactName} (Individual)` : `Contact-${Date.now()}`);
        await useDataStore.getState().bulkCreateLeadsFromDialer([{
          company_name: uniqueCompany,
          contact_name: callForm.contactName || '',
          phone: callForm.phone || '',
          stage: callForm.outcome === 'connected' ? 'Engaged' : 'New Lead',
          source: 'Cold Call Log',
          notes: `📞 [${new Date().toLocaleDateString()}] ${noteText}`
        }]);
      }


      if (callForm.createFollowUp && callForm.followUpDue) {
        await createTask({
          title: `Follow-up: ${callForm.company || callForm.contactName || 'Cold Call'}`,
          type: 'follow-up',
          priority: 'medium',
          due: callForm.followUpDue,
          status: 'pending',
        });
      } else if (callForm.outcome === 'connected') {
        // Auto follow-up if none explicitly created
        const due = new Date();
        due.setDate(due.getDate() + 2);
        await createTask({
          title: `Follow-up: ${callForm.company || callForm.contactName || 'Cold Call'}`,
          type: 'follow-up',
          priority: 'medium',
          due: due.toISOString(),
          status: 'pending',
        });
      }

      // ── Update Streak ──────────────────────────────────────────────────
      const todayStr = new Date().toDateString();
      const rawStreak = user?.user_metadata?.huntlo_call_streak || localStorage.getItem('huntlo_call_streak');
      let streakData = { count: 0, lastDate: null };
      if (rawStreak) { 
        try { streakData = typeof rawStreak === 'string' ? JSON.parse(rawStreak) : rawStreak; } catch(e) {} 
      }
      if (streakData.lastDate !== todayStr) {
        const lastD = streakData.lastDate ? new Date(streakData.lastDate) : new Date(0);
        const todayD = new Date(todayStr);
        const diff = Math.floor((todayD - lastD) / 86400000);
        if (diff === 1) streakData.count += 1;
        else if (diff > 1) streakData.count = 1;
        if (!streakData.count) streakData.count = 1;
        streakData.lastDate = todayStr;
        localStorage.setItem('huntlo_call_streak', JSON.stringify(streakData));
        if (updateProfileMeta) {
          updateProfileMeta({ huntlo_call_streak: streakData }).catch(() => {});
        }
      }
      if (closeAfter) {
        setShowCallLogger(false);
      }
      setCallForm({
        contactName: '', company: '', phone: '', outcome: 'connected',
        duration: '', notes: '', createFollowUp: false, followUpDue: '',
        linkedLeadId: '', updateLeadStage: '',
      });
      setActiveTab('history');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to log cold call');
    } finally {
      setCallSaving(false);
    }
  };

  const handlePushAllPending = async () => {
    // Use ALL call logs (not just current date filter) so nothing gets missed
    const pendingLogs = callLogs.filter(call => !call.pushedToLead);
    if (pendingLogs.length === 0) return;
    
    setSaving(true);
    try {
      const stageOrder = [
        'New Lead','Researching','Ready for Outreach','Outreach Started',
        'Engaged','Qualified','Demo Scheduled','Demo Complete',
        'Trial Started','Customer','Lost'
      ];

      // Process each pending log: update existing lead or create new one.
      // Re-read leads from the store inside the loop so that leads created for
      // earlier iterations are visible to later ones (prevents duplicates).
      for (const call of pendingLogs) {
        const callNote = `📞 [${new Date().toLocaleDateString()}] ${call.outcomeLabel || call.outcome} — ${call.duration ? call.duration + ' min' : 'N/A'} — ${call.notes || 'No notes'}`;
        const phoneClean = (call.phone || '').replace(/\s+/g, '');
        const nameLower = (call.contactName || '').toLowerCase().trim();
        const companyLower = (call.company || '').toLowerCase().trim();

        // Always read the latest leads so newly-created leads are visible
        const latestLeads = useDataStore.getState().leads;

        // Smart match: phone > contact name > company name
        const existingLead = latestLeads.find(l => {
          if (phoneClean && l.phone && l.phone.replace(/\s+/g, '') === phoneClean) return true;
          if (nameLower && l.contact_name && l.contact_name.toLowerCase().trim() === nameLower) return true;
          if (companyLower && l.company_name && l.company_name.toLowerCase().trim() === companyLower) return true;
          return false;
        });

        if (existingLead) {
          // Append call note to existing lead
          const newStage = call.outcome === 'connected' ? 'Engaged' : null;
          const currentStageIdx = stageOrder.indexOf(existingLead.stage || 'New Lead');
          const newStageIdx = stageOrder.indexOf(newStage || 'New Lead');
          const stageUpdate = newStage && newStageIdx > currentStageIdx ? newStage : null;
          await useDataStore.getState().appendLeadNotes(existingLead.id, callNote, stageUpdate);
        } else {
          // No existing lead — create a new CRM lead
          const uniqueCompany = call.company
            || (call.contactName ? `${call.contactName} (Individual)` : null)
            || `Contact-${call.id}`;
          await useDataStore.getState().bulkCreateLeadsFromDialer([{
            company_name: uniqueCompany,
            contact_name: call.contactName || '',
            phone: call.phone || '',
            stage: call.outcome === 'connected' ? 'Engaged' : 'New Lead',
            source: 'Bulk Push from History',
            notes: callNote,
          }]);
        }
      }

      // Mark all pending logs as pushed in tasks.
      // Use getState().tasks (not the closure) to get the latest task records.
      const latestTasks = useDataStore.getState().tasks;
      const tasksToUpdate = [];
      pendingLogs.forEach(call => {
        const task = latestTasks.find(t => t.id === call.id);
        if (task) {
          let data = {};
          try { data = JSON.parse(task.notes || '{}'); } catch(e) {}
          const newNotes = JSON.stringify({ ...data, pushedToLead: true });
          tasksToUpdate.push({ ...task, notes: newNotes });
        }
      });
      if (tasksToUpdate.length > 0) {
        await useDataStore.getState().bulkUpdateTasks(tasksToUpdate);
      }
      
      if (selectedCall && pendingLogs.some(p => p.id === selectedCall.id)) {
        setSelectedCall({ ...selectedCall, pushedToLead: true });
      }
    } catch(e) {
      alert("Error pushing pending leads: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleManualPush = async (call) => {
    if (!call || call.pushedToLead) return;
    setSaving(true);
    try {
      const callNote = `📞 [${new Date().toLocaleDateString()}] ${call.outcomeLabel || call.outcome} — ${call.duration ? call.duration + ' min' : 'N/A'} — ${call.notes || 'No notes'}`;
      const phoneClean = (call.phone || '').replace(/\s+/g, '');
      const nameLower = (call.contactName || '').toLowerCase().trim();
      const companyLower = (call.company || '').toLowerCase().trim();
      const currentLeads = useDataStore.getState().leads;

      // Smart match: phone > contact name > company name
      const existingLead = currentLeads.find(l => {
        if (phoneClean && l.phone && l.phone.replace(/\s+/g, '') === phoneClean) return true;
        if (nameLower && l.contact_name && l.contact_name.toLowerCase().trim() === nameLower) return true;
        if (companyLower && l.company_name && l.company_name.toLowerCase().trim() === companyLower) return true;
        return false;
      });

      if (existingLead) {
        const stageOrder = [
          'New Lead','Researching','Ready for Outreach','Outreach Started',
          'Engaged','Qualified','Demo Scheduled','Demo Complete',
          'Trial Started','Customer','Lost'
        ];
        const newStage = call.outcome === 'connected' ? 'Engaged' : null;
        const currentStageIdx = stageOrder.indexOf(existingLead.stage || 'New Lead');
        const newStageIdx = stageOrder.indexOf(newStage || 'New Lead');
        const stageUpdate = newStage && newStageIdx > currentStageIdx ? newStage : null;
        await useDataStore.getState().appendLeadNotes(existingLead.id, callNote, stageUpdate);
      } else {
        const uniqueCompany = call.company
          || (call.contactName ? `${call.contactName} (Individual)` : 'Unknown Company');
        await useDataStore.getState().bulkCreateLeadsFromDialer([{
          company_name: uniqueCompany,
          contact_name: call.contactName || '',
          phone: call.phone || '',
          stage: call.outcome === 'connected' ? 'Engaged' : 'New Lead',
          source: 'Manual Push from History',
          notes: callNote,
        }]);
      }

      // Use getState().tasks (not the stale closure) to get the latest task record
      const latestTask = useDataStore.getState().tasks.find(t => t.id === call.id);
      if (latestTask) {
        let data = {};
        try { data = JSON.parse(latestTask.notes || '{}'); } catch(e) {}
        const newNotes = JSON.stringify({ ...data, pushedToLead: true });
        await useDataStore.getState().updateTask(latestTask.id, { notes: newNotes });
      }
      setSelectedCall({ ...call, pushedToLead: true });
    } catch(e) {
      alert("Error pushing to lead: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleBulkSelect = (id) => {
    setBulkSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  
  const selectAllBulk = () => {
    if (bulkSelected.length === callingList.length) setBulkSelected([]);
    else setBulkSelected(callingList.map(c => c.id));
  };

  const handleBulkUpdateOutcome = async () => {
    if (!bulkOutcome || bulkSelected.length === 0) return;
    setSaving(true);
    try {
      const outcomeObj = CALL_OUTCOMES.find(o => o.value === bulkOutcome);
      const tasksToUpdate = [];
      for (const id of bulkSelected) {
        const task = tasks.find(t => t.id === id);
        if (!task) continue;
        let data = {};
        try { data = JSON.parse(task.notes || '{}'); } catch(e) {}
        const newNotes = JSON.stringify({
          ...data,
          outcome: bulkOutcome,
          outcomeLabel: outcomeObj?.label || ''
        });
        tasksToUpdate.push({ ...task, notes: newNotes });
      }
      await useDataStore.getState().bulkUpdateTasks(tasksToUpdate);
      setBulkSelected([]);
      setBulkOutcome('');
    } catch(e) {
      alert("Error updating outcomes: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkLog = async () => {
    if (bulkSelected.length === 0) return;
    setSaving(true);
    try {
      const leadsToCreate = [];
      const tasksToUpdate = [];
      for (const id of bulkSelected) {
        const curr = callingList.find(c => c.id === id);
        if (!curr || !curr.outcome) continue; // Only log if outcome is set
        const task = tasks.find(t => t.id === id);
        const outcomeObj = CALL_OUTCOMES.find(o => o.value === curr.outcome);
        
        let data = {};
        try { data = JSON.parse(task?.notes || '{}'); } catch(e) {}
        const newNotes = JSON.stringify({ ...data, pushedToLead: true });

        tasksToUpdate.push({ ...task, status: 'completed', notes: newNotes });

        // Use unique company key per contact to prevent upsert collisions
        const uniqueCompany = curr.company_name
          || (curr.contact_name ? `${curr.contact_name} (Individual)` : null)
          || `Dialer-${curr.id}`;
        leadsToCreate.push({
          company_name: uniqueCompany,
          contact_name: curr.contact_name || '',
          phone: curr.phone || '',
          ...(curr.email ? { email: curr.email } : {}),
          stage: curr.outcome === 'connected' ? 'Engaged' : 'New Lead',
          source: 'Bulk Import',
          notes: `📞 [${new Date().toLocaleDateString()}] ${outcomeObj?.label || curr.outcome} — ${curr.duration ? curr.duration + ' min' : 'N/A'} — ${curr.notes || 'No notes'}`
        });
      }
      
      await useDataStore.getState().bulkUpdateTasks(tasksToUpdate);
      if (leadsToCreate.length > 0) {
        await useDataStore.getState().bulkCreateLeadsFromDialer(leadsToCreate);
      }
      // Force-refresh leads so the Leads page reflects bulk-pushed entries immediately
      useDataStore.getState()._refreshTable('leads');
      setBulkSelected([]);
      setActiveTab('history');
    } catch(e) {
      alert("Error bulk logging calls: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // UI Renderers
  const renderHistory = () => (
    <motion.div 
      className="cl-history-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="cl-toolbar">
        <div className="cl-search-wrapper">
          <Search size={16} className="cl-search-icon" />
          <input 
            type="text" 
            placeholder="Search contact, company, or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cl-search-input"
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {filteredLogs.some(c => !c.pushedToLead) && (
            <button 
              className="btn btn-primary" 
              onClick={handlePushAllPending} 
              disabled={saving}
              style={{ height: '36px', padding: '0 12px', fontSize: '13px', display: 'flex', alignItems: 'center' }}
            >
              <Save size={14} style={{ marginRight: 6 }} /> Push Pending
            </button>
          )}
          <div className="cl-filter-wrapper">
            <Calendar size={14} className="cl-filter-icon" />
            <select 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)}
              className="cl-filter-select"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
            <ChevronDown size={14} className="cl-dropdown-icon" />
          </div>
          <div className="cl-filter-wrapper">
            <Filter size={14} className="cl-filter-icon" />
            <select 
              value={filterOutcome} 
              onChange={(e) => setFilterOutcome(e.target.value)}
              className="cl-filter-select"
            >
              <option value="all">All Outcomes</option>
              {CALL_OUTCOMES.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="cl-dropdown-icon" />
          </div>
        </div>
      </div>

      <div className="cl-table-container">
        <div className="cl-table-scroll">
          <table className="cl-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                {isAdmin && <th>SDR</th>}
                <th>Contact</th>
                <th>Company</th>
                <th>Outcome</th>
                <th>Duration</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="cl-empty-cell">
                    <div className="cl-empty-state">
                      <div className="cl-empty-icon-wrap">
                        <Phone size={32} />
                      </div>
                      <h3>No calls found</h3>
                      <p>Get started by launching a Power Dialer campaign or logging a cold call manually.</p>
                      <button className="btn btn-primary" onClick={() => setActiveTab('dialer')}>
                        Launch Power Dialer
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(call => {
                  const style = CALL_OUTCOMES.find(o => o.value === call.outcome) || CALL_OUTCOMES[2];
                  
                  return (
                    <tr 
                      key={call.id} 
                      onClick={() => setSelectedCall(call)}
                      className={selectedCall?.id === call.id ? 'active-row' : ''}
                    >
                      <td>
                        <div className="cl-cell-date">
                          <span className="cl-date">{safeFormatDate(call.createdAt)}</span>
                        </div>
                      </td>
                      {isAdmin && (
                        <td>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {call.ownerName || '—'}
                          </div>
                        </td>
                      )}
                      <td>
                        <div className="cl-cell-contact">
                          <span className="cl-name">{call.contactName || '—'}</span>
                          {call.phone && <span className="cl-phone">{call.phone}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="cl-cell-company">
                          {call.company || '—'}
                        </div>
                      </td>
                      <td>
                        <div className="cl-outcome-pill" style={{ '--pill-color': style.color }}>
                          {style.emoji} {style.label}
                        </div>
                      </td>
                      <td>
                        <div className="cl-cell-duration">
                          {call.duration ? `${call.duration}m` : '—'}
                        </div>
                      </td>
                      <td>
                        <div className="cl-cell-notes">
                          <span className="cl-truncate">{call.notes || '—'}</span>
                        </div>
                      </td>
                      <td>
                        {!call.pushedToLead ? (
                          <button 
                            className="cl-push-btn" 
                            onClick={(e) => { e.stopPropagation(); handleManualPush(call); }}
                            disabled={saving}
                          >
                            Push to CRM
                          </button>
                        ) : (
                          <span className="cl-pushed-badge">
                            <Save size={12} /> Pushed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AnimatePresence>
          {selectedCall && (
            <motion.div 
              className="cl-details-sidebar"
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="cl-details-header">
                <h3>Call Details</h3>
                <button className="btn-icon" onClick={() => setSelectedCall(null)}>
                  <X size={18} />
                </button>
              </div>
              
              <div className="cl-details-body">
                {(() => {
                  const style = CALL_OUTCOMES.find(o => o.value === selectedCall.outcome) || CALL_OUTCOMES[2];
                  return (
                    <div className="cl-details-hero">
                      <div className="cl-hero-avatar" style={{ '--avatar-color': style.color }}>
                        {style.emoji}
                      </div>
                      <div className="cl-hero-text">
                        <h4>{selectedCall.contactName || 'Unknown Contact'}</h4>
                        <p>{selectedCall.company || 'Unknown Company'}</p>
                      </div>
                    </div>
                  );
                })()}

                <div className="cl-details-section">
                  <h5>Overview</h5>
                  <div className="cl-details-grid">
                    <div className="cl-detail-item">
                      <span className="cl-label">Date</span>
                      <span className="cl-value">{safeFormatDate(selectedCall.createdAt)}</span>
                    </div>
                    <div className="cl-detail-item">
                      <span className="cl-label">Phone</span>
                      <span className="cl-value">{selectedCall.phone || '—'}</span>
                    </div>
                    <div className="cl-detail-item">
                      <span className="cl-label">Outcome</span>
                      <span className="cl-value">
                        {CALL_OUTCOMES.find(o => o.value === selectedCall.outcome)?.label || selectedCall.outcome}
                      </span>
                    </div>
                    <div className="cl-detail-item">
                      <span className="cl-label">Duration</span>
                      <span className="cl-value">{selectedCall.duration ? `${selectedCall.duration} min` : '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="cl-details-section">
                  <h5>Notes</h5>
                  <div className="cl-notes-box">
                    {selectedCall.notes || 'No notes provided for this call.'}
                  </div>
                  
                  {/* The manual push button is now available in the table view as well */}
                  {!selectedCall.pushedToLead && (
                    <div style={{ marginTop: '16px' }}>
                      <button className="btn btn-primary" onClick={() => handleManualPush(selectedCall)} disabled={saving} style={{ width: '100%' }}>
                        Push to CRM Lead
                      </button>
                    </div>
                  )}
                  {selectedCall.pushedToLead && (
                    <div style={{ marginTop: '16px', color: 'var(--success)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <Save size={14} /> Pushed to Lead successfully
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  const renderDialer = () => (
    <motion.div 
      className="cl-dialer-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {callingList.length === 0 ? (
        <div className="cl-empty-state dialer-empty">
          <div className="cl-empty-icon-wrap primary">
            <Play size={40} />
          </div>
          <h2>Ready to start a calling campaign?</h2>
          <p>Upload a CSV with names and phone numbers, dial through them rapidly, and push results to the CRM when finished.</p>
          <button className="btn btn-primary" onClick={() => setShowImporter(true)}>
            <UploadCloud size={16} /> Import Calling List CSV
          </button>
        </div>
      ) : (
        <div className="cl-dialer-layout">
          <div className="cl-dialer-sidebar">
            <div className="cl-sidebar-header" style={{ flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>Up Next</span>
                <span className="cl-badge">{callingList.length}</span>
              </div>
              <button 
                className="btn btn-ghost" 
                style={{ width: '100%', fontSize: '11px', padding: '4px' }}
                onClick={handlePushAllPendingToLeads}
                disabled={saving}
              >
                Push Pending to Leads
              </button>
            </div>
            <div className="cl-sidebar-list">
              {callingList.map((c, idx) => (
                <div 
                  key={c.id} 
                  onClick={() => setActiveCallIdx(idx)}
                  className={`cl-list-item ${activeCallIdx === idx ? 'active' : ''}`}
                >
                  <div className={`cl-status-dot ${c.status}`} />
                  <div className="cl-item-text">
                    <div className="cl-item-title">{c.contact_name || c.company_name || 'Unknown'}</div>
                    <div className="cl-item-sub">{c.phone}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="cl-dialer-main">
            {dialerDone ? (
              <div className="cl-done-state">
                <div className="cl-done-icon">🎉</div>
                <h2>Campaign Complete!</h2>
                <p>You've worked through all {callingList.length} contacts.</p>
                <div className="cl-done-stats">
                  <div className="cl-done-card">
                    <div className="cl-val blue">{callingList.length}</div>
                    <div className="cl-label">Total</div>
                  </div>
                  <div className="cl-done-card">
                    <div className="cl-val green">{callingList.filter(c => c.status === 'completed').length}</div>
                    <div className="cl-label">Logged</div>
                  </div>
                  <div className="cl-done-card">
                    <div className="cl-val gray">{callingList.filter(c => c.status === 'skipped').length}</div>
                    <div className="cl-label">Skipped</div>
                  </div>
                </div>
                <div className="cl-done-actions">
                  <button className="btn btn-ghost" onClick={() => { setDialerDone(false); setActiveCallIdx(0); }}>Review List</button>
                  <button className="btn btn-success" onClick={() => setActiveTab('history')}>
                    View Call History
                  </button>
                </div>
              </div>
            ) : callingList[activeCallIdx] && callingList[activeCallIdx].status === 'pending' ? (
              <div className="cl-active-call">
                <div className="cl-active-header">
                  <div>
                    <h2 className="cl-active-name">{callingList[activeCallIdx].contact_name || 'Unknown Contact'}</h2>
                    <div className="cl-active-company">{callingList[activeCallIdx].company_name}</div>
                  </div>
                  <div className="cl-active-phone">{callingList[activeCallIdx].phone}</div>
                </div>
                
                <div className="cl-progress">
                  <div className="cl-progress-text">
                    <span>{pendingDialerList.length} remaining of {callingList.length} total</span>
                    <span>{callingList.filter(c => c.status === 'completed').length} logged</span>
                  </div>
                  <div className="cl-progress-track">
                    <div className="cl-progress-fill" style={{ width: `${(callingList.filter(c=>c.status==='completed').length / callingList.length)*100}%` }} />
                  </div>
                </div>

                <div className="cl-form-card">
                  <div className="cl-form-group">
                    <label>Call Outcome</label>
                    <div className="cl-outcome-grid">
                      {CALL_OUTCOMES.map(o => (
                        <button 
                          key={o.value} 
                          type="button"
                          onClick={() => setActiveCallForm({...activeCallForm, outcome: o.value})}
                          className={`cl-outcome-btn ${activeCallForm.outcome === o.value ? 'selected' : ''}`}
                          style={{ '--btn-color': o.color }}
                        >
                          {o.emoji} {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="cl-form-group">
                    <label>Duration (min)</label>
                    <input className="input-base" type="number" min="0" value={activeCallForm.duration} onChange={e => setActiveCallForm({...activeCallForm, duration: e.target.value})} placeholder="e.g. 5" />
                  </div>
                  <div className="cl-form-group">
                    <label>Notes</label>
                    <textarea className="input-base" rows={4} value={activeCallForm.notes} onChange={e => setActiveCallForm({...activeCallForm, notes: e.target.value})} placeholder="Discussed next steps..." />
                  </div>
                </div>

                <div className="cl-active-actions">
                  <button className="btn btn-ghost" onClick={handleSkip}>Skip Contact</button>
                  <button className="btn btn-success" onClick={handleLogAndNext}>✓ Log & Next</button>
                </div>


              </div>
            ) : null}
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderBulk = () => (
    <motion.div 
      className="cl-history-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="cl-toolbar">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            className="input-base" 
            style={{ width: '200px' }}
            value={bulkOutcome}
            onChange={(e) => setBulkOutcome(e.target.value)}
          >
            <option value="">-- Update Outcome --</option>
            {CALL_OUTCOMES.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button className="btn btn-ghost" onClick={handleBulkUpdateOutcome} disabled={saving || !bulkOutcome || bulkSelected.length === 0}>
            Apply to {bulkSelected.length}
          </button>
        </div>
        <div>
          <button className="btn btn-primary" onClick={handleBulkLog} disabled={saving || bulkSelected.length === 0}>
            <Save size={14} style={{ marginRight: 6 }} /> Log Selected to History
          </button>
        </div>
      </div>
      <div className="cl-table-container">
        <div className="cl-table-scroll">
          <table className="cl-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={callingList.length > 0 && bulkSelected.length === callingList.length}
                    onChange={selectAllBulk}
                  />
                </th>
                <th>Contact / Company</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {callingList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="cl-empty-cell">
                    <div className="cl-empty-state">
                      <p>No contacts in the calling list. Import a CSV to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                callingList.map(c => {
                  const style = CALL_OUTCOMES.find(o => o.value === c.outcome);
                  return (
                    <tr key={c.id}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={bulkSelected.includes(c.id)}
                          onChange={() => toggleBulkSelect(c.id)}
                        />
                      </td>
                      <td>
                        <div className="cl-cell-contact">
                          <span className="cl-name">{c.contact_name || '—'}</span>
                          <span className="cl-company">{c.company_name}</span>
                        </div>
                      </td>
                      <td>{c.phone || '—'}</td>
                      <td>
                        <span className={`cl-status-dot ${c.status}`} style={{ display: 'inline-block', marginRight: '6px', width: '8px', height: '8px', borderRadius: '50%', background: c.status === 'completed' ? 'var(--success)' : c.status === 'skipped' ? 'var(--text-tertiary)' : 'var(--primary)' }} />
                        <span style={{ textTransform: 'capitalize' }}>{c.status}</span>
                      </td>
                      <td>
                        {style ? (
                          <div className="cl-outcome-pill" style={{ '--pill-color': style.color, display: 'inline-block' }}>
                            {style.emoji} {style.label}
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="cl-container page-enter">
      <header className="cl-header">
        <div className="cl-header-top">
          <div className="cl-title-section">
            <div className="cl-title-icon"><Phone size={24} /></div>
            <div>
              <h1 className="cl-title">Call Center</h1>
              <p className="cl-subtitle">Track, analyze, and execute your cold calling campaigns</p>
            </div>
          </div>
          
          <div className="cl-header-actions">
            <div className="cl-stats">
              <div className="cl-stat-box success">
                <div className="cl-stat-val">{connectedCalls}</div>
                <div className="cl-stat-label">Connected</div>
              </div>
              <div className="cl-stat-box">
                <div className="cl-stat-val">{totalDuration}<small>m</small></div>
                <div className="cl-stat-label">Talk Time</div>
              </div>
            </div>
            <div className="cl-actions-group">
              <button className="btn btn-ghost" onClick={() => setShowImporter(true)}>
                <UploadCloud size={16} /> Import List
              </button>
              <button className="btn btn-primary" onClick={() => setShowCallLogger(true)}>
                <Phone size={14} /> Log Cold Call
              </button>
              <button 
                className="btn btn-primary" 
                style={{ background: '#ef4444', color: 'white', border: 'none' }}
                disabled={saving}
                onClick={async () => {
                  if (!window.confirm("This will forcefully push ALL uncalled contacts and any un-pushed logs to the Leads CRM. Continue?")) return;
                  setSaving(true);
                  try {
                    const latestTasks = useDataStore.getState().tasks;
                    const toPush = latestTasks.filter(t => t.type === 'calling_list_item' || t.type === 'cold_call');
                    
                    const leadsToCreate = [];
                    const tasksToUpdate = [];
                    
                    for (const t of toPush) {
                       let data = {};
                       try { data = JSON.parse(t.notes || '{}'); } catch(e) {}
                       
                       if (data.pushedToLead) continue; // already pushed
                       
                       const company = data.company_name || t.title || '';
                       const uniqueCompany = company || `Contact-${t.id}`;
                       leadsToCreate.push({
                         company_name: uniqueCompany,
                         contact_name: t.title || '',
                         phone: data.phone || '',
                         email: data.email || null,
                         stage: data.outcome === 'connected' ? 'Engaged' : 'New Lead',
                         source: 'Force Push',
                         notes: data.notes ? `[Call Note]: ${data.notes}` : 'Force pushed'
                       });
                       
                       tasksToUpdate.push({
                         ...t,
                         status: 'completed',
                         notes: JSON.stringify({ ...data, pushedToLead: true })
                       });
                    }
                    
                    if (leadsToCreate.length > 0) {
                      await useDataStore.getState().bulkCreateLeadsFromDialer(leadsToCreate);
                    }
                    if (tasksToUpdate.length > 0) {
                      await useDataStore.getState().bulkUpdateTasks(tasksToUpdate);
                    }
                    useDataStore.getState()._refreshTable('leads');
                    alert(`Emergency push successful! Pushed ${leadsToCreate.length} contacts to CRM.`);
                  } catch(e) {
                    alert("Error during force push: " + e.message);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? 'Pushing...' : '🚨 EMERGENCY PUSH ALL TO LEADS'}
              </button>
            </div>
          </div>
        </div>

        <div className="cl-header-bottom">
          <div className="cl-segmented-tabs">
            <button className={`cl-seg-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              Call History
            </button>
            <button className={`cl-seg-tab ${activeTab === 'dialer' ? 'active' : ''}`} onClick={() => setActiveTab('dialer')}>
              Power Dialer
              {callingList.filter(c => c.status === 'pending').length > 0 && (
                <span className="cl-tab-badge">{callingList.filter(c => c.status === 'pending').length}</span>
              )}
            </button>
            <button className={`cl-seg-tab ${activeTab === 'bulk' ? 'active' : ''}`} onClick={() => setActiveTab('bulk')}>
              Bulk Process
            </button>
          </div>
        </div>
      </header>

      {/* ── Role scope badge ─────────────────────────────────────────────────── */}
      {!isAdmin && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', background: 'rgba(59,130,246,0.08)',
          borderBottom: '1px solid rgba(59,130,246,0.12)',
          fontSize: 12, color: 'var(--accent-blue)', fontWeight: 500
        }}>
          <span>🔒</span>
          <span>Viewing your own calls only. Admins have full team visibility.</span>
        </div>
      )}

      {/* ── SDR Guidance Banner ─────────────────────────────────────────────── */}
      {!sdrBannerDismissed && (
        <div className="sdr-guidance-banner">
          <div className="sdr-banner-inner">
            <div className="sdr-banner-icon">📋</div>
            <div className="sdr-banner-content">
              <strong>SDR Quick Reference — How Leads Get Into CRM</strong>
              <ul className="sdr-banner-steps">
                <li><span className="sdr-step-pill dialer">Power Dialer</span> Always click <strong>"Log &amp; Next"</strong> — this instantly creates the lead. Clicking <em>Skip</em> does NOT push to CRM.</li>
                <li><span className="sdr-step-pill bulk">Bulk Process</span> For any skipped or pending contacts — select all → set an outcome → click <strong>"Log Selected to History"</strong>.</li>
                <li><span className="sdr-step-pill history">Call History</span> If you see a <strong>"Push to CRM"</strong> button on any row, click it or use <strong>"Push Pending"</strong> at the top to push all at once.</li>
                <li><span className="sdr-step-pill manual">Log Cold Call</span> Fill in <strong>Contact Name + Company</strong> — the system will auto-create a new lead. If the contact already exists, select them from the autocomplete to update their existing lead.</li>
                <li><span className="sdr-step-pill warn">CSV Import</span> Always include a <strong>Company Name</strong> column. Contacts without a company are saved as "[Name] (Individual)" to keep each lead unique.</li>
              </ul>
            </div>
            <button className="sdr-banner-close" onClick={() => setSdrBannerDismissed(true)} title="Dismiss">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Pending Push Alert Bar ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {callLogs.filter(c => !c.pushedToLead).length > 0 && (
          <motion.div
            className="cl-pending-alert-bar"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <div className="cl-pending-alert-inner">
              <div className="cl-pending-alert-left">
                <div className="cl-pending-alert-icon"><Bell size={16} /></div>
                <div>
                  <div className="cl-pending-alert-title">
                    <span className="cl-pending-count-badge">{callLogs.filter(c => !c.pushedToLead).length}</span>
                    &nbsp;call log{callLogs.filter(c => !c.pushedToLead).length !== 1 ? 's' : ''} not yet pushed to CRM
                  </div>
                  <div className="cl-pending-alert-sub">{isAdmin ? 'Team-wide: some call logs are not yet pushed to Leads.' : "Please push your pending call logs before closing today's session."}</div>
                </div>
              </div>
              <button
                className="cl-pending-alert-btn"
                onClick={() => { setActiveTab('history'); handlePushAllPending(); }}
                disabled={saving}
              >
                {saving ? 'Pushing…' : <><Save size={13} style={{ marginRight: 5 }} />Push All Pending <ArrowRight size={13} style={{ marginLeft: 4 }} /></>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="cl-main-content">
        {activeTab === 'history' ? renderHistory() : activeTab === 'bulk' ? renderBulk() : renderDialer()}
      </main>

      {showImporter && (
        <CsvImporterModal
          isOpen={true}
          onClose={() => setShowImporter(false)}
          onImportSuccess={handleImportCallingList}
          type="calling_list"
        />
      )}

      {/* Manual Call Logger Modal */}
      <AnimatePresence>
        {showCallLogger && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="drawer-overlay" onClick={() => setShowCallLogger(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="contact-detail log-call-modal">
              <div className="panel-header">
                <h2>Log a Call</h2>
                <button className="btn-icon" onClick={() => setShowCallLogger(false)}><X size={18} /></button>
              </div>
              <form onSubmit={(e) => handleLogColdCall(e, true)} className="form-layout" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <div className="panel-content">
                  {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

                  {/* Existing lead found — show as info notice (call notes will be appended) */}
                  {callDuplicateWarnings.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                      {callDuplicateWarnings.map((w, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 8,
                          background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)',
                          borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#15803d'
                        }}>
                          <span style={{ flexShrink: 0, marginTop: 1, fontSize: 14 }}>✅</span>
                          <div>
                            <strong>Existing lead found — call will be appended</strong>
                            <div style={{ marginTop: 2, color: '#166534', fontSize: 11 }}>{w.detail} · Notes will be added to the existing lead record.</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="cl-form-group" style={{ position: 'relative' }}>
                    <label>Contact Name *</label>
                    <input 
                      required 
                      className={`input-base${callDuplicateWarnings.some(w => w.field === 'name') ? ' input-success-green' : ''}`}
                      value={callForm.contactName} 
                      onChange={e => {
                        setCallForm({ ...callForm, contactName: e.target.value });
                        setDropdownOpen(true);
                      }} 
                      onFocus={() => setDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                      placeholder="John Doe" 
                    />
                    {callDuplicateWarnings.some(w => w.field === 'name') && (
                      <span style={{ fontSize: 11, color: '#d97706', marginTop: 3, display: 'block' }}>
                        ⚠ This name is already in the CRM
                      </span>
                    )}
                    <AnimatePresence>
                      {dropdownOpen && searchResults.length > 0 && (
                        <motion.div 
                          className="cl-autocomplete-dropdown"
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                        >
                          {searchResults.map((r, i) => (
                            <div 
                              key={i} 
                              className="cl-autocomplete-item"
                              onClick={() => {
                                setCallForm({
                                  ...callForm,
                                  contactName: r.name,
                                  company: r.company && r.company !== 'CRM Contact' && r.company !== 'Calling List Contact' && r.company !== 'CRM Lead' ? r.company : callForm.company,
                                  phone: r.phone || callForm.phone
                                });
                                setDropdownOpen(false);
                              }}
                            >
                              <div className="cl-autocomplete-icon">
                                <User size={14} />
                              </div>
                              <div className="cl-autocomplete-text">
                                <div className="cl-autocomplete-name">{r.name}</div>
                                <div className="cl-autocomplete-company">{r.company}</div>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="cl-form-group">
                    <label>Company</label>
                    <input className="input-base" value={callForm.company} onChange={e => setCallForm({ ...callForm, company: e.target.value })} placeholder="Acme Corp" />
                  </div>
                  
                  {matchedLead && (
                    <div className="cl-matched-lead">
                      <span className="emoji">🔗</span> Link to CRM Lead: <strong>{matchedLead.company_name || matchedLead.contact_name}</strong>
                    </div>
                  )}

                  <div className="cl-form-group">
                    <label>Phone</label>
                    <input
                      className={`input-base${callDuplicateWarnings.some(w => w.field === 'phone') ? ' input-error-amber' : ''}`}
                      value={callForm.phone}
                      onChange={e => setCallForm({ ...callForm, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                    {callDuplicateWarnings.some(w => w.field === 'phone') && (
                      <span style={{ fontSize: 11, color: '#d97706', marginTop: 3, display: 'block' }}>
                        ⚠ This phone is already registered in the CRM
                      </span>
                    )}
                  </div>
                  <div className="cl-form-group">
                    <label>Outcome</label>
                    <div className="cl-outcome-grid small">
                      {CALL_OUTCOMES.map(o => (
                        <button key={o.value} type="button" onClick={() => setCallForm({ ...callForm, outcome: o.value })}
                          className={`cl-outcome-btn ${callForm.outcome === o.value ? 'selected' : ''}`}
                          style={{ '--btn-color': o.color }}>
                          {o.emoji} {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="cl-form-group">
                    <label>Duration (min)</label>
                    <input className="input-base" type="number" min="0" value={callForm.duration} onChange={e => setCallForm({ ...callForm, duration: e.target.value })} placeholder="5" />
                  </div>
                  <div className="cl-form-group">
                    <label>Notes</label>
                    <textarea className="input-base" rows={4} value={callForm.notes} onChange={e => setCallForm({ ...callForm, notes: e.target.value })} placeholder="Call details..." />
                  </div>

                  <div className="cl-followup-box">
                    <label className="cl-checkbox-label">
                      <input type="checkbox" checked={callForm.createFollowUp} onChange={e => setCallForm({ ...callForm, createFollowUp: e.target.checked })} />
                      Create a follow-up task
                    </label>
                    {callForm.createFollowUp && (
                      <input type="datetime-local" className="input-base" style={{ marginTop: 12 }} value={callForm.followUpDue} onChange={e => setCallForm({ ...callForm, followUpDue: e.target.value })} />
                    )}
                  </div>
                </div>
                <div className="panel-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowCallLogger(false)}>Cancel</button>
                  <button
                    type="submit"
                    className="btn btn-secondary"
                    onClick={(e) => {
                      if (!callForm.contactName) return; // let HTML5 validation handle empty contactName if possible, or just return to prevent double firing
                      // Actually since we change onClick to handle the 'Log & Next' behavior:
                      e.preventDefault();
                      if (!e.currentTarget.form.checkValidity()) {
                        e.currentTarget.form.reportValidity();
                        return;
                      }
                      handleLogColdCall(e, false);
                    }}
                    disabled={callSaving}
                  >
                    {callSaving ? 'Saving...' : 'Log & Next'}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={callSaving}
                  >
                    {callSaving ? 'Saving...' : callDuplicateWarnings.length > 0 ? 'Append to Existing Lead' : 'Save Call Log'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
