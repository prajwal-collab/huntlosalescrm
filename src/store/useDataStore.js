// ============================================
// HUNTLO SALES OS — DATA STORE (Production)
// ============================================
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import useAuthStore from './useAuthStore';

const useDataStore = create((set, get) => ({
  companies: [],
  contacts: [],
  deals: [],
  tasks: [],
  meetings: [],
  documents: [],
  sequences: [],
  leads: [],
  loading: false,
  error: null,

  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('Not authenticated');

      const results = await Promise.allSettled([
        supabase.from('companies').select('*').order('created_at', { ascending: false }),
        supabase.from('contacts').select('*').order('created_at', { ascending: false }),
        supabase.from('deals').select('*').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').order('due', { ascending: true }),
        supabase.from('meetings').select('*').order('date', { ascending: true }),
        supabase.from('documents').select('*').order('created_at', { ascending: false }),
        supabase.from('sequences').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*').order('signal_score', { ascending: false }),
      ]);

      const [companiesRes, contactsRes, dealsRes, tasksRes, meetingsRes, docsRes, seqRes, leadsRes] = results;

      // Helper to safely extract data from allSettled results
      const extract = (res) => (res.status === 'fulfilled' && !res.value.error) ? res.value.data : [];

      set({
        companies: extract(companiesRes),
        contacts: extract(contactsRes),
        deals: extract(dealsRes),
        tasks: extract(tasksRes),
        meetings: extract(meetingsRes),
        documents: extract(docsRes),
        sequences: extract(seqRes),
        leads: extract(leadsRes),
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('[DataStore] Fetch error:', error);
      set({ error: error.message, loading: false });
    }
  },

  // ── Leads ──────────────────────────────────
  createLead: async (lead) => {
    const { user } = useAuthStore.getState();
    const newLead = { ...lead, owner_id: user?.id };
    const { data, error } = await supabase.from('leads').insert(newLead).select().single();
    if (error) throw error;
    set(state => ({ leads: [data, ...state.leads] }));
    return data;
  },

  updateLead: async (id, updates) => {
    const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
    if (error) throw error;
    set(state => ({ leads: state.leads.map(l => l.id === id ? data : l) }));
    return data;
  },

  deleteLead: async (id) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
    set(state => ({ leads: state.leads.filter(l => l.id !== id) }));
  },

  bulkDeleteLeads: async (ids) => {
    const { error } = await supabase.from('leads').delete().in('id', ids);
    if (error) throw error;
    set(state => ({ leads: state.leads.filter(l => !ids.includes(l.id)) }));
  },

  bulkCreateLeads: async (leadsList) => {
    const { user } = useAuthStore.getState();
    const records = leadsList.map(l => ({ ...l, owner_id: user?.id }));
    const { data, error } = await supabase.from('leads').insert(records).select();
    if (error) throw error;
    set(state => ({ leads: [...data, ...state.leads] }));
    return data;
  },

  // ── Companies ─────────────────────────────
  createCompany: async (company) => {
    const { data, error } = await supabase.from('companies').insert(company).select().single();
    if (error) throw error;
    set(state => ({ companies: [data, ...state.companies] }));
    return data;
  },

  updateCompany: async (id, updates) => {
    const { data, error } = await supabase.from('companies').update(updates).eq('id', id).select().single();
    if (error) throw error;
    set(state => ({ companies: state.companies.map(c => c.id === id ? data : c) }));
    return data;
  },

  deleteCompany: async (id) => {
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) throw error;
    set(state => ({ companies: state.companies.filter(c => c.id !== id) }));
  },

  bulkDeleteCompanies: async (ids) => {
    const { error } = await supabase.from('companies').delete().in('id', ids);
    if (error) throw error;
    set(state => ({ companies: state.companies.filter(c => !ids.includes(c.id)) }));
  },

  bulkCreateCompanies: async (companiesList) => {
    const listWithoutOwner = companiesList.map(c => {
      // Remove any fields that don't belong in the table
      const { company: _c, title: _t, phone: _p, employees: _e, revenue: _r, status: _s, ...rest } = c;
      return {
        name: c.name,
        industry: c.industry,
        size: c.employees, // map from employees
        arr_estimate: c.revenue, // map from revenue
        website: c.domain,
        ...rest
      };
    });
    const { data, error } = await supabase.from('companies').insert(listWithoutOwner).select();
    if (error) throw error;
    set(state => ({ companies: [...data, ...state.companies] }));
    return data;
  },

  // ── Contacts ──────────────────────────────
  createContact: async (contact) => {
    const { data, error } = await supabase.from('contacts').insert(contact).select().single();
    if (error) throw error;
    set(state => ({ contacts: [data, ...state.contacts] }));
    return data;
  },

  updateContact: async (id, updates) => {
    const { data, error } = await supabase.from('contacts').update(updates).eq('id', id).select().single();
    if (error) throw error;
    set(state => ({ contacts: state.contacts.map(c => c.id === id ? data : c) }));
    return data;
  },

  deleteContact: async (id) => {
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) throw error;
    set(state => ({ contacts: state.contacts.filter(c => c.id !== id) }));
  },

  bulkDeleteContacts: async (ids) => {
    const { error } = await supabase.from('contacts').delete().in('id', ids);
    if (error) throw error;
    set(state => ({ contacts: state.contacts.filter(c => !ids.includes(c.id)) }));
  },

  bulkCreateContacts: async (contactsList) => {
    const state = get();
    let allCompanies = [...state.companies];
    
    // 1. Auto-create any missing companies from the import
    const newCompanyNames = [...new Set(contactsList.map(c => c.company).filter(Boolean))];
    const companiesToCreate = newCompanyNames.filter(name => !allCompanies.some(comp => comp.name.toLowerCase() === name.toLowerCase()));
    
    if (companiesToCreate.length > 0) {
      const { data: newComps, error: compErr } = await supabase.from('companies').insert(
        companiesToCreate.map(name => ({ name, industry: 'Unknown', arr_estimate: 0, engagement_score: 0 }))
      ).select();
      if (!compErr && newComps) {
        allCompanies = [...allCompanies, ...newComps];
        set(state => ({ companies: [...newComps, ...state.companies] }));
      }
    }

    const mappedList = contactsList.map(c => {
      let company_id = null;
      if (c.company) {
        const match = allCompanies.find(comp => comp.name.toLowerCase() === c.company.toLowerCase());
        if (match) company_id = match.id;
      }
      return {
        name: c.name,
        email: c.email,
        designation: c.title, // map from title
        whatsapp: c.phone, // map from phone
        linkedin: c.linkedin,
        company_id: company_id
      };
    });
    const { data, error } = await supabase.from('contacts').insert(mappedList).select();
    if (error) throw error;
    set(state => ({ contacts: [...data, ...state.contacts] }));
    return data;
  },

  // ── Deals ─────────────────────────────────
  createDeal: async (deal) => {
    const { user } = useAuthStore.getState();
    const newDeal = { ...deal, owner_id: user?.id };
    const { data, error } = await supabase.from('deals').insert(newDeal).select().single();
    if (error) throw error;
    set(state => ({ deals: [data, ...state.deals] }));
    return data;
  },

  updateDeal: async (id, updates) => {
    const { data, error } = await supabase.from('deals').update(updates).eq('id', id).select().single();
    if (error) throw error;
    set(state => ({ deals: state.deals.map(d => d.id === id ? data : d) }));
    return data;
  },

  updateDealStage: async (dealId, stage) => {
    const { error } = await supabase
      .from('deals')
      .update({ stage, last_activity: new Date().toISOString() })
      .eq('id', dealId);
    if (error) throw error;
    set(state => ({
      deals: state.deals.map(d =>
        d.id === dealId ? { ...d, stage, last_activity: new Date().toISOString() } : d
      ),
    }));
  },

  deleteDeal: async (id) => {
    const { error } = await supabase.from('deals').delete().eq('id', id);
    if (error) throw error;
    set(state => ({ deals: state.deals.filter(d => d.id !== id) }));
  },

  // ── Tasks ─────────────────────────────────
  createTask: async (task) => {
    const { user } = useAuthStore.getState();
    const newTask = { ...task, owner_id: user?.id };
    const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
    if (error) throw error;
    set(state => ({ tasks: [data, ...state.tasks] }));
    return data;
  },

  updateTask: async (id, updates) => {
    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;
    set(state => ({ tasks: state.tasks.map(t => t.id === id ? data : t) }));
    return data;
  },

  toggleTaskCompletion: async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (error) throw error;
    set(state => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t),
    }));
  },

  deleteTask: async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
  },

  // ── Meetings ──────────────────────────────
  createMeeting: async (meeting) => {
    const { user } = useAuthStore.getState();
    const newMeeting = { ...meeting, owner_id: user?.id };
    const { data, error } = await supabase.from('meetings').insert(newMeeting).select().single();
    if (error) throw error;
    set(state => ({ meetings: [data, ...state.meetings] }));
    return data;
  },

  updateMeeting: async (id, updates) => {
    const { data, error } = await supabase.from('meetings').update(updates).eq('id', id).select().single();
    if (error) throw error;
    set(state => ({ meetings: state.meetings.map(m => m.id === id ? data : m) }));
    return data;
  },

  deleteMeeting: async (id) => {
    const { error } = await supabase.from('meetings').delete().eq('id', id);
    if (error) throw error;
    set(state => ({ meetings: state.meetings.filter(m => m.id !== id) }));
  },

  // ── Documents ─────────────────────────────
  createDocument: async (doc) => {
    const { user } = useAuthStore.getState();
    const newDoc = { ...doc, owner_id: user?.id };
    const { data, error } = await supabase.from('documents').insert(newDoc).select().single();
    if (error) throw error;
    set(state => ({ documents: [data, ...state.documents] }));
    return data;
  },

  updateDocument: async (id, updates) => {
    const { data, error } = await supabase.from('documents').update(updates).eq('id', id).select().single();
    if (error) throw error;
    set(state => ({ documents: state.documents.map(d => d.id === id ? data : d) }));
    return data;
  },

  deleteDocument: async (id) => {
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) throw error;
    set(state => ({ documents: state.documents.filter(d => d.id !== id) }));
  },

  // ── Sequences ─────────────────────────────
  createSequence: async (seq) => {
    try {
      const { data, error } = await supabase.from('sequences').insert(seq).select().single();
      if (error) throw error;
      set(state => ({ sequences: [data, ...state.sequences] }));
      return data;
    } catch (err) {
      console.warn('Supabase insert failed, falling back to local state:', err.message);
      const newSeq = { ...seq, id: Date.now().toString(), created_at: new Date().toISOString() };
      set(state => ({ sequences: [newSeq, ...state.sequences] }));
      return newSeq;
    }
  },

  updateSequence: async (id, updates) => {
    try {
      const { data, error } = await supabase.from('sequences').update(updates).eq('id', id).select().single();
      if (error) throw error;
      set(state => ({ sequences: state.sequences.map(s => s.id === id ? data : s) }));
      return data;
    } catch (err) {
      console.warn('Supabase update failed, falling back to local state:', err.message);
      set(state => {
        const sequences = state.sequences.map(s => s.id === id ? { ...s, ...updates } : s);
        return { sequences };
      });
      return { id, ...updates }; // Return an approximation
    }
  },

  deleteSequence: async (id) => {
    try {
      const { error } = await supabase.from('sequences').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase delete failed, falling back to local state:', err.message);
    }
    set(state => ({ sequences: state.sequences.filter(s => s.id !== id) }));
  },

  enrollLeadsInSequence: async ({ sequenceId, leadIds, config }) => {
    const state = get();
    const sequence = state.sequences.find(s => s.id === sequenceId);
    if (!sequence) throw new Error('Sequence not found');

    const firstStep = sequence.nodes?.[0];

    // Find the actual leads being enrolled
    const enrolledLeads = state.leads.filter(l => leadIds.includes(l.id));

    // Simulate sequence execution (Day 1 / Touchpoint 1) if it's an email step
    if (firstStep && firstStep.type === 'email') {
      try {
        const { parseTemplate } = await import('../utils/personalization.js');
        const { sendSequenceEmail } = await import('../lib/resend.js');
        const { user } = useAuthStore.getState();

        // Dispatch emails in parallel without blocking the UI completely
        Promise.all(enrolledLeads.map(async (lead) => {
          const leadEmail = lead.email || lead.contact_linkedin; // simple fallback
          if (!leadEmail || !leadEmail.includes('@')) return;

          const parsedSubject = parseTemplate(firstStep.subject, lead, user);
          const parsedContent = parseTemplate(firstStep.content, lead, user);

          await sendSequenceEmail({
            toEmail: leadEmail,
            subject: parsedSubject,
            body: parsedContent,
            fromName: user?.user_metadata?.full_name || 'Huntlo Sales',
          });
        })).catch(err => console.error('[Sequence Execution Error]:', err));
      } catch (err) {
        console.error('Failed to execute initial sequence step:', err);
      }
    }

    set(state => {
      const sequences = state.sequences.map(s => {
        if (s.id === sequenceId) {
          return { ...s, enrolled: (s.enrolled || 0) + leadIds.length };
        }
        return s;
      });
      return { sequences };
    });
    return new Promise(resolve => setTimeout(resolve, 800));
  },

  // ── Email Settings ────────────────────────
  fetchEmailSettings: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return null;
    const { data, error } = await supabase
      .from('user_email_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows returned
    return data || null;
  },

  saveEmailSettings: async (settings) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error('Not authenticated');
    
    const payload = { ...settings, user_id: user.id };
    const { data, error } = await supabase
      .from('user_email_settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
}));

export default useDataStore;
