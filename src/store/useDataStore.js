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
  loading: false,
  error: null,

  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('Not authenticated');

      const results = await Promise.allSettled([
        supabase.from('companies').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('contacts').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('deals').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').is('deleted_at', null).order('due', { ascending: true }),
        supabase.from('meetings').select('*').is('deleted_at', null).order('date', { ascending: true }),
        supabase.from('documents').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('sequences').select('*').is('deleted_at', null).order('created_at', { ascending: false })
      ]);

      const [companiesRes, contactsRes, dealsRes, tasksRes, meetingsRes, docsRes, seqRes] = results;

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
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('[DataStore] Fetch error:', error);
      set({ error: error.message, loading: false });
    }
  },

  // ── Companies ─────────────────────────────
  createCompany: async (company) => {
    const { user } = useAuthStore.getState();
    const newCompany = { ...company, owner_id: user?.id };
    const { data, error } = await supabase.from('companies').insert(newCompany).select().single();
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

  bulkCreateCompanies: async (companiesList) => {
    const { user } = useAuthStore.getState();
    const listWithOwner = companiesList.map(c => ({ ...c, owner_id: user?.id }));
    const { data, error } = await supabase.from('companies').insert(listWithOwner).select();
    if (error) throw error;
    set(state => ({ companies: [...data, ...state.companies] }));
    return data;
  },

  // ── Contacts ──────────────────────────────
  createContact: async (contact) => {
    const { user } = useAuthStore.getState();
    const newContact = { ...contact, owner_id: user?.id };
    const { data, error } = await supabase.from('contacts').insert(newContact).select().single();
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

  bulkCreateContacts: async (contactsList) => {
    const { user } = useAuthStore.getState();
    const listWithOwner = contactsList.map(c => ({ ...c, owner_id: user?.id }));
    const { data, error } = await supabase.from('contacts').insert(listWithOwner).select();
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
    const { data, error } = await supabase.from('sequences').insert(seq).select().single();
    if (error) throw error;
    set(state => ({ sequences: [data, ...state.sequences] }));
    return data;
  },

  updateSequence: async (id, updates) => {
    const { data, error } = await supabase.from('sequences').update(updates).eq('id', id).select().single();
    if (error) throw error;
    set(state => ({ sequences: state.sequences.map(s => s.id === id ? data : s) }));
    return data;
  },

  deleteSequence: async (id) => {
    const { error } = await supabase.from('sequences').delete().eq('id', id);
    if (error) throw error;
    set(state => ({ sequences: state.sequences.filter(s => s.id !== id) }));
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
