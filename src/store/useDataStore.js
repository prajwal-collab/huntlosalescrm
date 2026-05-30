import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import useAuthStore from './useAuthStore';
import {
  SEED_COMPANIES, SEED_CONTACTS, SEED_DEALS,
  SEED_TASKS, SEED_MEETINGS, SEED_DOCUMENTS, SEED_SEQUENCES
} from './seedData';

const useDataStore = create(
  persist(
    (set, get) => ({
      companies: [],
      contacts: [],
      deals: [],
      tasks: [],
      meetings: [],
      documents: [],
      sequences: [],
      loading: false,
      isSeeded: false,

      fetchData: async () => {
        set({ loading: true });

        if (!isSupabaseConfigured()) {
          const state = get();
          if (!state.isSeeded) {
            set({
              companies: SEED_COMPANIES,
              contacts: SEED_CONTACTS,
              deals: SEED_DEALS,
              tasks: SEED_TASKS,
              meetings: SEED_MEETINGS,
              documents: SEED_DOCUMENTS,
              sequences: SEED_SEQUENCES,
              isSeeded: true,
              loading: false
            });
          } else {
            set({ loading: false });
          }
          return;
        }

        try {
          const [companiesRes, contactsRes, dealsRes, tasksRes, meetingsRes, docsRes, seqRes] = await Promise.all([
            supabase.from('companies').select('*'),
            supabase.from('contacts').select('*'),
            supabase.from('deals').select('*'),
            supabase.from('tasks').select('*'),
            supabase.from('meetings').select('*'),
            supabase.from('documents').select('*'),
            supabase.from('sequences').select('*'),
          ]);

          set({
            companies: companiesRes.data || [],
            contacts: contactsRes.data || [],
            deals: dealsRes.data || [],
            tasks: tasksRes.data || [],
            meetings: meetingsRes.data || [],
            documents: docsRes.data || [],
            sequences: seqRes.data || [],
            isSeeded: true
          });
        } catch (error) {
          console.error('Error fetching data from Supabase:', error);
        } finally {
          set({ loading: false });
        }
      },

      createCompany: async (company) => {
        if (!isSupabaseConfigured()) {
          const newCompany = {
            id: `comp-${Date.now()}`,
            created_at: new Date().toISOString(),
            tags: [],
            notes: '',
            engagement_score: 0,
            ...company
          };
          set(state => ({ companies: [newCompany, ...state.companies] }));
          return newCompany;
        }
        const { data, error } = await supabase.from('companies').insert(company).select().single();
        if (error) throw error;
        set(state => ({ companies: [data, ...state.companies] }));
        return data;
      },

      bulkCreateCompanies: async (companiesList) => {
        if (!isSupabaseConfigured()) {
          const newCompanies = companiesList.map((c, i) => ({
            id: `comp-${Date.now()}-${i}`,
            created_at: new Date().toISOString(),
            tags: [],
            notes: '',
            engagement_score: 0,
            ...c
          }));
          set(state => ({ companies: [...newCompanies, ...state.companies] }));
          return newCompanies;
        }
        const { data, error } = await supabase.from('companies').insert(companiesList).select();
        if (error) throw error;
        set(state => ({ companies: [...data, ...state.companies] }));
        return data;
      },

      createContact: async (contact) => {
        if (!isSupabaseConfigured()) {
          const newContact = {
            id: `cont-${Date.now()}`,
            created_at: new Date().toISOString(),
            tags: [],
            notes: '',
            engagement_score: 0,
            sentiment: 'neutral',
            ...contact
          };
          set(state => ({ contacts: [newContact, ...state.contacts] }));
          return newContact;
        }
        const { data, error } = await supabase.from('contacts').insert(contact).select().single();
        if (error) throw error;
        set(state => ({ contacts: [data, ...state.contacts] }));
        return data;
      },

      bulkCreateContacts: async (contactsList) => {
        if (!isSupabaseConfigured()) {
          const newContacts = contactsList.map((c, i) => ({
            id: `cont-${Date.now()}-${i}`,
            created_at: new Date().toISOString(),
            tags: [],
            notes: '',
            engagement_score: 0,
            sentiment: 'neutral',
            ...c
          }));
          set(state => ({ contacts: [...newContacts, ...state.contacts] }));
          return newContacts;
        }
        const { data, error } = await supabase.from('contacts').insert(contactsList).select();
        if (error) throw error;
        set(state => ({ contacts: [...data, ...state.contacts] }));
        return data;
      },

      createDeal: async (deal) => {
        const { user } = useAuthStore.getState();
        if (!isSupabaseConfigured()) {
          const newDeal = {
            id: `deal-${Date.now()}`,
            created_at: new Date().toISOString(),
            last_activity: new Date().toISOString(),
            owner_id: user?.id || 'demo-user-1',
            engagement_score: 0,
            urgency: 'medium',
            ...deal
          };
          set(state => ({ deals: [newDeal, ...state.deals] }));
          return newDeal;
        }
        const newDeal = { ...deal, owner_id: user?.id };
        const { data, error } = await supabase.from('deals').insert(newDeal).select().single();
        if (error) throw error;
        set(state => ({ deals: [data, ...state.deals] }));
        return data;
      },

      createTask: async (task) => {
        const { user } = useAuthStore.getState();
        if (!isSupabaseConfigured()) {
          const newTask = {
            id: `task-${Date.now()}`,
            created_at: new Date().toISOString(),
            owner_id: user?.id || 'demo-user-1',
            status: 'pending',
            priority: 'medium',
            ...task
          };
          set(state => ({ tasks: [newTask, ...state.tasks] }));
          return newTask;
        }
        const newTask = { ...task, owner_id: user?.id };
        const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
        if (error) throw error;
        set(state => ({ tasks: [data, ...state.tasks] }));
        return data;
      },

      createMeeting: async (meeting) => {
        const { user } = useAuthStore.getState();
        if (!isSupabaseConfigured()) {
          const newMeeting = {
            id: `meet-${Date.now()}`,
            created_at: new Date().toISOString(),
            owner_id: user?.id || 'demo-user-1',
            status: 'scheduled',
            attendees: [],
            notes: '',
            ai_summary: '',
            next_action: '',
            pain_points: [],
            objections: [],
            ...meeting
          };
          set(state => ({ meetings: [newMeeting, ...state.meetings] }));
          return newMeeting;
        }
        const newMeeting = { ...meeting, owner_id: user?.id };
        const { data, error } = await supabase.from('meetings').insert(newMeeting).select().single();
        if (error) throw error;
        set(state => ({ meetings: [data, ...state.meetings] }));
        return data;
      },

      createDocument: async (doc) => {
        const { user } = useAuthStore.getState();
        if (!isSupabaseConfigured()) {
          const newDoc = {
            id: `doc-${Date.now()}`,
            created_at: new Date().toISOString(),
            owner_id: user?.id || 'demo-user-1',
            views: 0,
            ...doc
          };
          set(state => ({ documents: [newDoc, ...state.documents] }));
          return newDoc;
        }
        const newDoc = { ...doc, owner_id: user?.id };
        const { data, error } = await supabase.from('documents').insert(newDoc).select().single();
        if (error) throw error;
        set(state => ({ documents: [data, ...state.documents] }));
        return data;
      },

      createSequence: async (seq) => {
        if (!isSupabaseConfigured()) {
          const newSeq = {
            id: `seq-${Date.now()}`,
            created_at: new Date().toISOString(),
            status: 'inactive',
            steps: 0,
            enrolled: 0,
            reply_rate: 0,
            nodes: [],
            ...seq
          };
          set(state => ({ sequences: [newSeq, ...state.sequences] }));
          return newSeq;
        }
        const { data, error } = await supabase.from('sequences').insert(seq).select().single();
        if (error) throw error;
        set(state => ({ sequences: [data, ...state.sequences] }));
        return data;
      },

      updateDealStage: async (dealId, stage) => {
        if (!isSupabaseConfigured()) {
          set(state => ({
            deals: state.deals.map(d => d.id === dealId ? { ...d, stage, last_activity: new Date().toISOString() } : d)
          }));
          return;
        }
        const { error } = await supabase.from('deals').update({ stage, last_activity: new Date().toISOString() }).eq('id', dealId);
        if (error) throw error;
        set(state => ({
          deals: state.deals.map(d => d.id === dealId ? { ...d, stage } : d)
        }));
      },

      toggleTaskCompletion: async (taskId, currentStatus) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        if (!isSupabaseConfigured()) {
          set(state => ({
            tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
          }));
          return;
        }
        const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
        if (error) throw error;
        set(state => ({
          tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
        }));
      }
    }),
    {
      name: 'huntlo-crm-data',
      // Only persist local state in demo mode
      storage: {
        getItem: (name) => {
          if (isSupabaseConfigured()) return null;
          const val = localStorage.getItem(name);
          return val ? JSON.parse(val) : null;
        },
        setItem: (name, value) => {
          if (!isSupabaseConfigured()) {
            localStorage.setItem(name, JSON.stringify(value));
          }
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        }
      }
    }
  )
);

export default useDataStore;
