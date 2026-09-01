// ============================================
// HUNTLO SALES OS — DATA STORE (Production)
// ============================================
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import useAuthStore from './useAuthStore';
import useUIStore from './useUIStore';
import { sendAssignmentEmail } from '../lib/resend';

// Helper for assignment emails
const handleAssignmentNotification = (type, title, oldOwnerId, newOwnerId, itemId, getStore) => {
  if (!newOwnerId || oldOwnerId === newOwnerId) return;

  const { teamMembers } = getStore();
  const newOwner = teamMembers.find(t => t.id === newOwnerId);
  if (!newOwner || !newOwner.email) return;

  const { user } = useAuthStore.getState();
  const assignerProfile = teamMembers.find(t => t.id === user?.id);
  const assignerName = assignerProfile?.full_name || assignerProfile?.name || user?.email?.split('@')[0] || 'A team member';

  sendAssignmentEmail({
    toEmail: newOwner.email,
    toName: newOwner.full_name || newOwner.name || newOwner.email.split('@')[0],
    assignerName,
    itemType: type,
    itemTitle: title,
    itemId
  }).catch(e => console.warn('Failed to send assignment notification:', e));
};

// Helper to paginate past Supabase's 1000 row API limit
const fetchAllRows = async (table, orderCol = null, ascending = false) => {
  let allData = [];
  let from = 0;
  const step = 1000;
  while (from < 50000) {
    let req = supabase.from(table).select('*').range(from, from + step - 1);
    if (orderCol) req = req.order(orderCol, { ascending });
    const { data, error } = await req;
    if (error) return { data: allData, error }; // return what we have on error
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < step) break;
    from += step;
  }
  return { data: allData, error: null };
};

const useDataStore = create((set, get) => ({
  companies: [],
  contacts: [],
  deals: [],
  tasks: [],
  meetings: [],
  documents: [],
  sequences: [],
  leads: [],
  teamMembers: [],
  proposals: [],
  webinars: [],
  webinar_funnel_stages: [],
  webinar_registrants: [],
  webinar_content_assets: [],
  webinar_follow_ups: [],
  webinar_sops: [],
  loading: false,
  error: null,
  _realtimeChannel: null,

  // Ensure the current user has a profile and organization
  // This self-heals when the signup trigger didn't fire properly
  ensureProfile: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    try {
      // Check if profile exists
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, organization_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileErr && profileErr.code !== 'PGRST116') {
        console.warn('[DataStore] Profile check error:', profileErr.message);
      }

      // If no profile exists, create organization + profile
      if (!profile) {
        console.log('[DataStore] No profile found, auto-creating...');
        
        // Create a default organization
        const { data: org, error: orgErr } = await supabase
          .from('organizations')
          .insert({ name: user.user_metadata?.full_name ? `${user.user_metadata.full_name}'s Workspace` : 'My Workspace' })
          .select()
          .single();

        if (orgErr) {
          console.error('[DataStore] Failed to create organization:', orgErr.message);
          return;
        }

        // Create the user's profile
        const { error: insertErr } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email,
            role: 'Admin',
            organization_id: org.id,
          });

        if (insertErr) {
          console.error('[DataStore] Failed to create profile:', insertErr.message);
        } else {
          console.log('[DataStore] Profile created successfully for org:', org.id);
        }
      } else if (!profile.organization_id) {
        // Profile exists but no organization — create one and link it
        console.log('[DataStore] Profile missing organization, auto-creating...');
        const { data: org, error: orgErr } = await supabase
          .from('organizations')
          .insert({ name: 'My Workspace' })
          .select()
          .single();

        if (!orgErr && org) {
          await supabase
            .from('profiles')
            .update({ organization_id: org.id })
            .eq('id', user.id);
        }
      }
    } catch (err) {
      console.error('[DataStore] ensureProfile error:', err);
    }
  },


  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('Not authenticated');

      // Auto-repair profile/organization if missing
      await get().ensureProfile();

      const results = await Promise.allSettled([
        fetchAllRows('companies', 'created_at', false),
        fetchAllRows('contacts', 'created_at', false),
        fetchAllRows('deals', 'created_at', false),
        fetchAllRows('tasks', 'due', true),
        fetchAllRows('meetings', 'date', true),
        fetchAllRows('documents', 'created_at', false),
        fetchAllRows('sequences', 'created_at', false),
        fetchAllRows('leads', 'created_at', false),
        fetchAllRows('profiles', 'id', true), // Profiles usually doesn't have created_at
        fetchAllRows('proposals', 'created_at', false),
        fetchAllRows('webinars', 'date_time', true),
        fetchAllRows('webinar_funnel_stages', 'due_date', true),
        fetchAllRows('webinar_registrants', 'created_at', false),
        fetchAllRows('webinar_content_assets', 'created_at', false),
        fetchAllRows('webinar_follow_ups', 'day_offset', true),
        fetchAllRows('webinar_sops', 'created_at', false),
      ]);

      const [companiesRes, contactsRes, dealsRes, tasksRes, meetingsRes, docsRes, seqRes, leadsRes, teamRes, proposalsRes, webinarsRes, funnelStagesRes, registrantsRes, assetsRes, followUpsRes, sopsRes] = results;

      // Helper to safely extract data from allSettled results
      const extract = (res, name) => {
        if (res.status === 'fulfilled' && !res.value.error) {
          return res.value.data;
        }
        const errMsg = res.status === 'rejected' ? res.reason : res.value.error;
        console.error(`[DataStore] Error fetching ${name}:`, errMsg);
        
        // Show a UI notification so the user sees the error
        try {
          useUIStore.getState().addNotification({
            id: `fetch-err-${name}-${Date.now()}`,
            type: 'system',
            title: `Error loading ${name}`,
            message: String(errMsg?.message || errMsg),
            unread: true,
            time: new Date().toISOString()
          });
        } catch (e) {
          // ignore
        }
        
        return [];
      };

      set({
        companies: extract(companiesRes, 'companies'),
        contacts: extract(contactsRes, 'contacts'),
        deals: extract(dealsRes, 'deals'),
        tasks: extract(tasksRes, 'tasks'),
        meetings: extract(meetingsRes, 'meetings'),
        documents: extract(docsRes, 'documents'),
        sequences: extract(seqRes, 'sequences'),
        leads: extract(leadsRes, 'leads'),
        teamMembers: extract(teamRes, 'teamMembers'),
        proposals: extract(proposalsRes, 'proposals'),
        webinars: extract(webinarsRes, 'webinars'),
        webinar_funnel_stages: extract(funnelStagesRes, 'webinar_funnel_stages'),
        webinar_registrants: extract(registrantsRes, 'webinar_registrants'),
        webinar_content_assets: extract(assetsRes, 'webinar_content_assets'),
        webinar_follow_ups: extract(followUpsRes, 'webinar_follow_ups'),
        webinar_sops: extract(sopsRes, 'webinar_sops'),
        loading: false,
        error: null
      });

      // Set up Realtime subscriptions for team transparency
      get().setupRealtime();

      // Auto-push missed call logs from previous days
      get().autoPushMissedCallLogs();
    } catch (error) {
      console.error('[DataStore] Fetch error:', error);
      set({ error: error.message, loading: false });
    }
  },

  // Supabase Realtime — live sync across all team members
  setupRealtime: () => {
    // Clean up existing subscription
    const existing = get()._realtimeChannel;
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase
      .channel('org-data-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const lead = payload.new;
          const { user } = useAuthStore.getState();
          if (lead.owner_id !== user?.id) {
            const { teamMembers } = get();
            const owner = teamMembers?.find(tm => tm.id === lead.owner_id);
            const ownerName = owner?.name || 'A teammate';
            useUIStore.getState().addNotification({
              id: `lead-${lead.id}`,
              type: 'lead',
              title: lead.source === 'Webhook' ? '🤖 Lead Auto-Created' : '👤 New Lead Added',
              message: `${ownerName} added ${lead.contact_name || lead.email || 'a contact'} from ${lead.company_name || 'a company'}.`,
              route: '/leads',
              unread: true,
              time: new Date().toISOString(),
            });
          }
        }
        get()._refreshTable('leads');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, (payload) => {
        const { user } = useAuthStore.getState();
        if (payload.eventType === 'INSERT') {
          const deal = payload.new;
          if (deal.owner_id !== user?.id) {
            const { teamMembers } = get();
            const owner = teamMembers?.find(tm => tm.id === deal.owner_id);
            const ownerName = owner?.name || 'A teammate';
            useUIStore.getState().addNotification({
              id: `deal-new-${deal.id}`,
              type: 'deal',
              title: '💼 New Deal Created',
              message: `${ownerName} added "${deal.title || 'a new deal'}" to the pipeline.`,
              route: '/pipeline',
              unread: true,
              time: new Date().toISOString(),
            });
          }
        } else if (payload.eventType === 'UPDATE') {
          const deal = payload.new;
          const old = payload.old;
          if (deal.stage && deal.stage !== old?.stage && deal.owner_id !== user?.id) {
            const { teamMembers } = get();
            const owner = teamMembers?.find(tm => tm.id === deal.owner_id);
            const ownerName = owner?.name || 'A teammate';
            useUIStore.getState().addNotification({
              id: `deal-stage-${deal.id}-${Date.now()}`,
              type: 'deal',
              title: '💼 Deal Stage Updated',
              message: `${ownerName} moved "${deal.title}" → ${deal.stage}.`,
              route: '/pipeline',
              unread: true,
              time: new Date().toISOString(),
            });
          }
        }
        get()._refreshTable('deals');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const meeting = payload.new;
          const { user } = useAuthStore.getState();
          if (meeting.owner_id !== user?.id) {
            const { teamMembers } = get();
            const owner = teamMembers?.find(tm => tm.id === meeting.owner_id);
            const ownerName = owner?.name || 'A teammate';
            useUIStore.getState().addNotification({
              id: `meeting-new-${meeting.id}`,
              type: 'meeting',
              title: '📅 Meeting Scheduled',
              message: `${ownerName} scheduled "${meeting.title}" on ${meeting.date ? new Date(meeting.date).toLocaleDateString() : 'an upcoming date'}.`,
              route: '/meetings',
              unread: true,
              time: new Date().toISOString(),
            });
          }
        }
        get()._refreshTable('meetings');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const task = payload.new;
          const { user } = useAuthStore.getState();
          if (task.owner_id !== user?.id) {
            const { teamMembers } = get();
            const creator = teamMembers?.find(tm => tm.id === task.owner_id);
            const creatorName = creator?.name || 'A teammate';
            useUIStore.getState().addNotification({
              id: `task-new-${task.id}`,
              type: 'task',
              title: '✅ New Task Created',
              message: `${creatorName} added task: "${task.title}".`,
              route: '/tasks',
              unread: true,
              time: new Date().toISOString(),
            });
          }
        }
        get()._refreshTable('tasks');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const doc = payload.new;
          const { user } = useAuthStore.getState();
          if (doc.owner_id !== user?.id) {
            useUIStore.getState().addNotification({
              id: `doc-${doc.id}`,
              title: 'New Document Added',
              message: `${doc.name} was added by your team.`,
              type: 'system',
              unread: true,
              time: new Date().toISOString()
            });
          }
        }
        get()._refreshTable('documents');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => {
        get()._refreshTable('companies');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => {
        get()._refreshTable('contacts');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sequences' }, () => {
        get()._refreshTable('sequences');
      })
      // L7 FIX: Realtime subscription for proposals
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proposals' }, () => {
        get()._refreshTable('proposals');
      })
      .subscribe();

    set({ _realtimeChannel: channel });
  },

  // Refresh a single table (called by Realtime)
  // M5 FIX: Paginate properly with fetchAllRows to support up to 50k items
  _refreshTable: async (table) => {
    try {
      const orderCol = table === 'tasks' ? 'due' : table === 'meetings' ? 'date' : 'created_at';
      const ascending = table === 'tasks' || table === 'meetings';
      const { data, error } = await fetchAllRows(table, orderCol, ascending);
      if (!error && data) {
        set({ [table]: data });
      }
    } catch (err) {
      console.warn(`[DataStore] Realtime refresh failed for ${table}:`, err);
    }
  },

  _getOrgId: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return null;
    const { data } = await supabase.from('profiles').select('organization_id').eq('id', user.id).maybeSingle();
    return data?.organization_id || null;
  },

  // Auto-push all un-pushed completed call logs to Leads CRM on app load.
  // Previously this only ran for calls from previous days (taskDate < today).
  // Now it covers ALL un-pushed completed calls including same-day calls so
  // that leads are never missed if the SDR forgot to click "Log & Next".
  autoPushMissedCallLogs: async () => {
    try {
      const { tasks, bulkCreateLeadsFromDialer, bulkUpdateTasks } = get();

      // Handle BOTH calling_list_item (power dialer) AND cold_call (manual call logger)
      // so that ALL 935+ un-pushed call logs get reflected in the Leads CRM.
      const missedTasks = tasks.filter(t => {
        const isCallType = t.type === 'calling_list_item' || t.type === 'cold_call';
        if (!isCallType) return false;
        // calling_list_item must be completed; cold_call logs are always completed by design
        if (t.type === 'calling_list_item' && t.status !== 'completed') return false;
        
        let data = {};
        try { data = JSON.parse(t.notes || '{}'); } catch(e) {}
        
        if (data.pushedToLead) return false;
        if (!data.outcome) return false;
        
        return true; // Push all un-pushed completed calls regardless of date
      });

      if (missedTasks.length === 0) return;
      console.log(`[DataStore] Found ${missedTasks.length} un-pushed call log(s) — auto-pushing to leads...`);

      const leadsToCreate = [];
      const tasksToUpdate = [];

      for (const t of missedTasks) {
        let data = {};
        try { data = JSON.parse(t.notes || '{}'); } catch(e) {}
        
        // cold_call logs store contact/company differently than calling_list_item
        const contactName = data.contactName || t.title || '';
        const companyName = data.company || data.company_name || '';

        // Use a unique company_name per contact to avoid upsert collisions.
        // Contacts without a company_name fall back to "[Name] (Individual)" or
        // a unique ID-based key so they never merge into a shared "Unknown Company".
        const uniqueCompany = companyName
          || (contactName ? `${contactName} (Individual)` : null)
          || `AutoPush-${t.id}`;

        const callDate = t.created_at ? new Date(t.created_at).toLocaleDateString() : new Date().toLocaleDateString();
        leadsToCreate.push({
          company_name: uniqueCompany,
          contact_name: contactName && contactName !== companyName ? contactName : '',
          phone: data.phone || '',
          ...(data.email ? { email: data.email } : {}),
          stage: data.outcome === 'connected' ? 'Engaged' : 'New Lead',
          source: t.type === 'cold_call' ? 'Cold Call Log' : 'Auto-Push Missed Call',
          notes: `📞 [${callDate}] ${data.outcomeLabel || data.outcome} — ${data.duration ? data.duration + ' min' : 'N/A'} — ${data.notes || 'No notes'}`
        });

        // Always mark as pushed — even if the lead upsert merges into an existing
        // record, we don't want to retry this task on every subsequent page load.
        tasksToUpdate.push({
          id: t.id,
          notes: JSON.stringify({ ...data, pushedToLead: true })
        });
      }

      // Always mark tasks as pushed first, then attempt lead upsert.
      // This prevents the same tasks from being retried infinitely if the
      // upsert hits a duplicate (which is now handled gracefully anyway).
      await bulkUpdateTasks(tasksToUpdate);
      if (leadsToCreate.length > 0) {
        try {
          await bulkCreateLeadsFromDialer(leadsToCreate);
        } catch (upsertErr) {
          console.error('[DataStore] Auto-push lead upsert failed:', upsertErr.message);
          // Don't re-throw — tasks are already marked pushed; leads can be created manually.
        }
      }
      console.log(`[DataStore] Auto-pushed ${leadsToCreate.length} call log(s) to leads (dialer + cold call).`);

    } catch (err) {
      console.error('[DataStore] Failed to auto-push missed calls:', err);
    }
  },


  // ── Leads ──────────────────────────────────
  createLead: async (lead) => {
    const { user } = useAuthStore.getState();
    const orgId = await get()._getOrgId();
    const newLead = { ...lead, owner_id: user?.id, ...(orgId ? { organization_id: orgId } : {}) };
    const { data, error } = await supabase.from('leads').insert(newLead).select().single();
    if (error) {
      console.error('Supabase insert failed:', error.message);
      throw error;
    }
    set(state => ({ leads: [data, ...state.leads] }));

    // ── Auto-link: silently create/match Company + Contact ──────────────
    try {
      await get()._autoLinkLeadToEntities(data, orgId);
    } catch (linkErr) {
      console.warn('[DataStore] Auto-link failed (non-fatal):', linkErr.message);
    }

    return data;
  },

  // Auto-creates or matches a Company record and a Contact record for a lead
  _autoLinkLeadToEntities: async (lead, orgId) => {
    if (!lead.company_name) return;
    const state = get();

    // ── 1. Find or create Company ──────────────────────────────────────
    let company = state.companies.find(
      c => c.name?.toLowerCase() === lead.company_name?.toLowerCase()
    );

    if (!company) {
      const companyPayload = {
        name: lead.company_name,
        website: lead.website || null,
        industry: lead.industry || null,
        size: lead.employee_size || null,
        ...(orgId ? { organization_id: orgId } : {}),
      };
      const { data: newComp, error: compErr } = await supabase
        .from('companies')
        .insert(companyPayload)
        .select()
        .single();
      if (!compErr && newComp) {
        company = newComp;
        set(state => ({ companies: [newComp, ...state.companies] }));
      }
    }

    // ── 2. Find or create Contact ──────────────────────────────────────
    if (lead.contact_name || lead.email) {
      const existingContact = state.contacts.find(
        c => (lead.email && c.email?.toLowerCase() === lead.email?.toLowerCase()) ||
             (lead.contact_name && c.name?.toLowerCase() === lead.contact_name?.toLowerCase() && c.company_id === company?.id)
      );

      if (!existingContact) {
        const contactPayload = {
          name: lead.contact_name || null,
          email: lead.email || null,
          whatsapp: lead.phone || null,
          designation: lead.designation || null,
          linkedin: lead.contact_linkedin || null,
          company_id: company?.id || null,
          ...(orgId ? { organization_id: orgId } : {}),
        };
        const { data: newContact, error: contactErr } = await supabase
          .from('contacts')
          .insert(contactPayload)
          .select()
          .single();
        if (!contactErr && newContact) {
          set(state => ({ contacts: [newContact, ...state.contacts] }));
        }
      }
    }
  },

  updateLead: async (id, updates) => {
    const oldLead = get().leads.find(l => l.id === id);
    const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
    if (error) throw error;
    set(state => ({ leads: state.leads.map(l => l.id === id ? data : l) }));
    
    if (updates.owner_id !== undefined && oldLead) {
      handleAssignmentNotification('Lead', oldLead.company_name || oldLead.contact_name || 'Unknown Lead', oldLead.owner_id, updates.owner_id, id, get);
    }
    
    return data;
  },

  // Append timestamped notes to a lead without overwriting existing notes
  appendLeadNotes: async (id, newNote, stageUpdate) => {
    const lead = get().leads.find(l => l.id === id);
    if (!lead) return null;
    const timestamp = new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const existingNotes = lead.notes || '';
    const appendedNotes = existingNotes
      ? `${existingNotes}\n\n---\n📞 [${timestamp}] ${newNote}`
      : `📞 [${timestamp}] ${newNote}`;
    const updates = { notes: appendedNotes };
    if (stageUpdate) updates.stage = stageUpdate;
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

  bulkUpdateLeads: async (ids, updates) => {
    const { data, error } = await supabase.from('leads').update(updates).in('id', ids).select();
    if (error) throw error;
    set(state => ({ leads: state.leads.map(l => ids.includes(l.id) ? { ...l, ...updates } : l) }));
    return data;
  },

  bulkCreateLeads: async (leadsList) => {
    const { user } = useAuthStore.getState();
    await get().ensureProfile();
    const orgId = await get()._getOrgId();
    const records = leadsList.map(l => ({ 
      ...l, 
      owner_id: user?.id,
      ...(orgId ? { organization_id: orgId } : {})
    }));
    const { data, error } = await supabase.from('leads').upsert(records, { onConflict: 'organization_id,email', ignoreDuplicates: true }).select();
    if (error) throw error;
    set(state => ({ leads: [...data, ...state.leads] }));
    return data;
  },

  // Used by the "Import & Update" flow — enriches existing leads with contact
  // details filled in offline. Matches each row by `id` first; falls back to
  // company_name match. Never creates new lead records (update-only).
  bulkUpdateLeadsFromCsv: async (rowsList) => {
    const currentLeads = get().leads;
    let updated = 0;
    let notFound = 0;
    const updatedLeads = [];

    // Fields we allow to be patched via this enrichment flow
    const ALLOWED_FIELDS = [
      'contact_name', 'designation', 'phone', 'email',
      'website', 'linkedin_url', 'contact_linkedin',
      'location', 'industry', 'stage', 'notes',
    ];

    for (const row of rowsList) {
      // ── Find the matching lead ────────────────────────────────────────
      let existingLead = null;

      // Priority 1: match by id (exact UUID)
      if (row.id && row.id.trim()) {
        existingLead = currentLeads.find(l => l.id === row.id.trim());
      }

      // Priority 2: fallback to company_name (case-insensitive)
      if (!existingLead && row.company_name && row.company_name.trim()) {
        existingLead = currentLeads.find(
          l => l.company_name?.toLowerCase().trim() === row.company_name.toLowerCase().trim()
        );
      }

      if (!existingLead) {
        notFound++;
        continue;
      }

      // ── Build the patch object (only non-empty enrichment fields) ─────
      const patch = {};
      ALLOWED_FIELDS.forEach(field => {
        if (row[field] !== undefined && row[field] !== null && String(row[field]).trim() !== '') {
          patch[field] = String(row[field]).trim();
        }
      });

      if (Object.keys(patch).length === 0) {
        // Nothing to update for this row
        notFound++;
        continue;
      }

      try {
        const { data, error } = await supabase
          .from('leads')
          .update(patch)
          .eq('id', existingLead.id)
          .select()
          .single();

        if (error) {
          console.error('[UpdateLeads] Supabase update error:', error.message, row);
          notFound++;
        } else if (data) {
          updated++;
          updatedLeads.push(data);
        }
      } catch (err) {
        console.error('[UpdateLeads] Unexpected error:', err);
        notFound++;
      }
    }

    // Patch the in-memory store for all updated leads
    if (updatedLeads.length > 0) {
      const updatedMap = Object.fromEntries(updatedLeads.map(l => [l.id, l]));
      set(state => ({
        leads: state.leads.map(l => updatedMap[l.id] ? updatedMap[l.id] : l)
      }));
    }

    console.log(`[UpdateLeads] ${updated} updated, ${notFound} not matched.`);
    return { updated, notFound };
  },

  // Used by Power Dialer "Push to CRM" — contacts often have no email.
  // For existing leads (matched by company_name), call notes are APPENDED to
  // the existing notes rather than overwritten. For new leads, a fresh record is created.
  bulkCreateLeadsFromDialer: async (leadsList) => {
    const { user } = useAuthStore.getState();
    await get().ensureProfile();
    const orgId = await get()._getOrgId();

    const inserted = [];
    const mergedLeads = [];

    for (const lead of leadsList) {
      const record = {
        ...lead,
        owner_id: user?.id,
        ...(orgId ? { organization_id: orgId } : {})
      };

      // ── Check if a lead already exists for this company in this org ──
      const existingLead = orgId
        ? get().leads.find(
            l =>
              l.organization_id === orgId &&
              l.company_name?.toLowerCase().trim() === lead.company_name?.toLowerCase().trim()
          )
        : null;

      if (existingLead) {
        // ── Existing lead: APPEND call note to existing notes ───────────
        const timestamp = new Date().toLocaleString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
        const existingNotes = existingLead.notes || '';
        const newCallNote = lead.notes || '';
        const appendedNotes = existingNotes
          ? `${existingNotes}\n\n---\n${newCallNote}`
          : newCallNote;

        // Only update stage if the new stage is "more advanced" than current
        const stageOrder = [
          'New Lead','Researching','Ready for Outreach','Outreach Started',
          'Engaged','Qualified','Demo Scheduled','Demo Complete',
          'Trial Started','Customer','Lost'
        ];
        const currentStageIdx = stageOrder.indexOf(existingLead.stage || 'New Lead');
        const newStageIdx = stageOrder.indexOf(lead.stage || 'New Lead');
        const updatedStage = newStageIdx > currentStageIdx ? lead.stage : existingLead.stage;

        const updates = {
          notes: appendedNotes,
          stage: updatedStage,
          // Enrich phone/contact_name if missing on existing lead
          ...(lead.phone && !existingLead.phone ? { phone: lead.phone } : {}),
          ...(lead.contact_name && !existingLead.contact_name ? { contact_name: lead.contact_name } : {}),
          ...(lead.email && !existingLead.email ? { email: lead.email } : {}),
        };

        const { data, error } = await supabase
          .from('leads')
          .update(updates)
          .eq('id', existingLead.id)
          .select()
          .single();

        if (error) {
          console.error('[Dialer] Lead update error:', error.message, lead.company_name);
        } else if (data) {
          mergedLeads.push(data);
          set(state => ({
            leads: state.leads.map(l => l.id === data.id ? data : l)
          }));
        }
      } else {
        // ── New lead: upsert (handles race conditions / DB-level duplicates) ──
        const { data, error } = await supabase
          .from('leads')
          .upsert(record, {
            onConflict: 'organization_id,company_name',
            ignoreDuplicates: false,
          })
          .select()
          .single();

        if (error) {
          console.error('[Dialer] Lead upsert error:', error.message, lead.company_name);
        } else if (data) {
          // Double-check: was it actually new or did it merge at DB level?
          const existsBefore = get().leads.some(l => l.id === data.id);
          if (existsBefore) {
            mergedLeads.push(data);
            set(state => ({
              leads: state.leads.map(l => l.id === data.id ? data : l)
            }));
          } else {
            inserted.push(data);
            set(state => ({ leads: [data, ...state.leads] }));
          }
          try {
            await get()._autoLinkLeadToEntities(data, orgId);
          } catch (linkErr) {
            console.warn('[DataStore] Auto-link failed (non-fatal):', linkErr.message);
          }
        }
      }
    }

    if (mergedLeads.length > 0) {
      console.log(`[Dialer] Appended notes to ${mergedLeads.length} existing lead(s).`);
    }
    if (inserted.length > 0) {
      console.log(`[Dialer] Created ${inserted.length} new lead(s).`);
    }

    // Force-refresh the leads table so the Leads page reflects new/updated entries
    // immediately without waiting for Realtime events (which can be delayed).
    try {
      const { data: freshLeads, error: refreshErr } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (!refreshErr && freshLeads) {
        set({ leads: freshLeads });
        console.log(`[Dialer] Leads refreshed — ${freshLeads.length} total in store.`);
      }
    } catch (refreshErr) {
      console.warn('[Dialer] Post-insert leads refresh failed (non-fatal):', refreshErr);
    }

    return [...inserted, ...mergedLeads];
  },

  // ── Companies ─────────────────────────────
  createCompany: async (company) => {
    const { user } = useAuthStore.getState();
    const orgId = await get()._getOrgId();
    const payload = { ...company, ...(orgId ? { organization_id: orgId } : {}) };
    const { data, error } = await supabase.from('companies').insert(payload).select().single();
    if (error) {
      console.error('Supabase insert failed:', error.message);
      throw error;
    }
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

  bulkUpdateCompanies: async (ids, updates) => {
    const { data, error } = await supabase.from('companies').update(updates).in('id', ids).select();
    if (error) throw error;
    set(state => ({ companies: state.companies.map(c => ids.includes(c.id) ? { ...c, ...updates } : c) }));
    return data;
  },

  bulkCreateCompanies: async (companiesList) => {
    const { user } = useAuthStore.getState();
    await get().ensureProfile();
    const orgId = await get()._getOrgId();
    const listWithoutOwner = companiesList.map(c => {
      // Remove any fields that don't belong in the table
      // eslint-disable-next-line no-unused-vars
      const { company: _c, title: _t, phone: _p, employees: _e, revenue: _r, status: _s, ...rest } = c;
      return {
        name: c.name,
        industry: c.industry,
        size: c.employees, // map from employees
        arr_estimate: parseFloat(c.revenue) || 0, // map from revenue
        website: c.domain,
        ...(orgId ? { organization_id: orgId } : {}),
        ...rest
      };
    });
    const { data, error } = await supabase.from('companies').upsert(listWithoutOwner, { onConflict: 'organization_id,name', ignoreDuplicates: true }).select();
    if (error) throw error;
    set(state => ({ companies: [...data, ...state.companies] }));
    return data;
  },

  // ── Contacts ──────────────────────────────
  createContact: async (contact) => {
    const { user } = useAuthStore.getState();
    const orgId = await get()._getOrgId();
    const payload = { ...contact, ...(orgId ? { organization_id: orgId } : {}) };
    const { data, error } = await supabase.from('contacts').insert(payload).select().single();
    if (error) {
      console.error('Supabase insert failed:', error.message);
      throw error;
    }
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

  bulkUpdateContacts: async (ids, updates) => {
    const { data, error } = await supabase.from('contacts').update(updates).in('id', ids).select();
    if (error) throw error;
    set(state => ({ contacts: state.contacts.map(c => ids.includes(c.id) ? { ...c, ...updates } : c) }));
    return data;
  },

  bulkCreateContacts: async (contactsList) => {
    const { user } = useAuthStore.getState();
    await get().ensureProfile();
    const orgId = await get()._getOrgId();
    const state = get();
    let allCompanies = [...state.companies];
    
    // 1. Auto-create any missing companies from the import
    const newCompanyNames = [...new Set(contactsList.map(c => c.company).filter(Boolean))];
    const companiesToCreate = newCompanyNames.filter(name => !allCompanies.some(comp => comp.name.toLowerCase() === name.toLowerCase()));
    
    if (companiesToCreate.length > 0) {
      const { data: newComps, error: compErr } = await supabase.from('companies').insert(
        companiesToCreate.map(name => ({ 
          name, 
          industry: 'Unknown', 
          arr_estimate: 0, 
          engagement_score: 0,
          ...(orgId ? { organization_id: orgId } : {})
        }))
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
        company_id: company_id,
        ...(orgId ? { organization_id: orgId } : {})
      };
    });
    const { data, error } = await supabase.from('contacts').upsert(mappedList, { onConflict: 'organization_id,email', ignoreDuplicates: true }).select();
    if (error) throw error;
    set(state => ({ contacts: [...data, ...state.contacts] }));
    return data;
  },

  // ── Deals ─────────────────────────────────
  createDeal: async (deal) => {
    const { user } = useAuthStore.getState();
    const orgId = await get()._getOrgId();
    const newDeal = { ...deal, owner_id: user?.id, ...(orgId ? { organization_id: orgId } : {}) };
    let { data, error } = await supabase.from('deals').insert(newDeal).select().single();

    // If the migration adding expected_payment_date / follow_up_date hasn't been run
    // yet, Supabase returns a schema-cache error. Retry without those columns so the
    // app is never hard-blocked while the migration is pending.
    if (error && error.message?.includes('schema cache')) {
      console.warn('Schema cache miss — retrying without date fields. Run the migration: 20260829_deal_payment_followup_dates.sql');
      const { expected_payment_date, follow_up_date, ...dealWithoutDates } = newDeal;
      const retry = await supabase.from('deals').insert(dealWithoutDates).select().single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('Supabase insert failed:', error.message);
      throw error;
    }
    set(state => ({ deals: [data, ...state.deals] }));
    return data;
  },

  updateDeal: async (id, updates) => {
    const oldDeal = get().deals.find(d => d.id === id);
    const { data, error } = await supabase.from('deals').update(updates).eq('id', id).select().single();
    if (error) throw error;
    set(state => ({ deals: state.deals.map(d => d.id === id ? data : d) }));

    if (updates.owner_id !== undefined && oldDeal) {
      handleAssignmentNotification('Deal', oldDeal.title || oldDeal.company || 'Unknown Deal', oldDeal.owner_id, updates.owner_id, id, get);
    }

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
    const orgId = await get()._getOrgId();
    const newTask = { ...task, owner_id: user?.id, ...(orgId ? { organization_id: orgId } : {}) };
    const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
    if (error) {
      console.error('Supabase insert failed:', error.message);
      throw error;
    }
    set(state => ({ tasks: [data, ...state.tasks] }));
    return data;
  },

  updateTask: async (id, updates) => {
    const oldTask = get().tasks.find(t => t.id === id);
    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;
    set(state => ({ tasks: state.tasks.map(t => t.id === id ? data : t) }));

    if (updates.owner_id !== undefined && oldTask) {
      handleAssignmentNotification('Task', oldTask.title || 'Unknown Task', oldTask.owner_id, updates.owner_id, id, get);
    }

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

  logFieldCheckIn: async (leadId, location, photoUrl) => {
    const { user } = useAuthStore.getState();
    const orgId = await get()._getOrgId();
    
    const notesData = {
      _type: 'field_visit',
      check_in_lat: location.lat,
      check_in_lng: location.lng,
      check_in_time: new Date().toISOString(),
      photo_url: photoUrl,
      lead_id: leadId
    };

    const newTask = {
      title: 'Field Visit',
      type: 'field_visit',
      status: 'in_progress',
      due: new Date().toISOString(),
      owner_id: user?.id,
      notes: JSON.stringify(notesData),
      ...(orgId ? { organization_id: orgId } : {})
    };

    const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
    if (error) {
      console.error('Field Check-in failed:', error.message);
      throw error;
    }
    set(state => ({ tasks: [data, ...state.tasks] }));
    return data;
  },

  logFieldCheckOut: async (taskId, meetingNotes) => {
    const storeState = get();
    const task = storeState.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    
    let parsedNotes = {};
    try { parsedNotes = JSON.parse(task.notes || '{}'); } catch(e) {}
    
    parsedNotes.check_out_time = new Date().toISOString();
    if (meetingNotes) parsedNotes.meeting_notes = meetingNotes;
    
    const { data, error } = await supabase.from('tasks').update({
      status: 'completed',
      notes: JSON.stringify(parsedNotes)
    }).eq('id', taskId).select().single();
    
    if (error) throw error;
    set(state => ({ tasks: state.tasks.map(t => t.id === taskId ? data : t) }));
    return data;
  },

  bulkCreateTasks: async (tasksList) => {
    const { user } = useAuthStore.getState();
    await get().ensureProfile();
    const orgId = await get()._getOrgId();
    const records = tasksList.map(t => ({ 
      ...t, 
      owner_id: user?.id,
      ...(orgId ? { organization_id: orgId } : {})
    }));
    const { data, error } = await supabase.from('tasks').insert(records).select();
    if (error) throw error;
    set(state => ({ tasks: [...data, ...state.tasks] }));
    return data;
  },

  bulkUpdateTasks: async (tasksList) => {
    const { data, error } = await supabase.from('tasks').upsert(tasksList).select();
    if (error) throw error;
    set(state => ({
      tasks: state.tasks.map(t => {
        const updated = data.find(d => d.id === t.id);
        return updated || t;
      })
    }));
    return data;
  },

  // ── Proposals ──────────────────────────────
  createProposal: async (proposal) => {
    const { user } = useAuthStore.getState();
    const orgId = await get()._getOrgId();
    const newProposal = { ...proposal, owner_id: user?.id, ...(orgId ? { organization_id: orgId } : {}) };
    
    // Ensure line_items is properly stringified JSON if it's an object, or let Supabase handle it if JS object
    // Supabase JS client handles arrays automatically for JSONB
    
    const { data, error } = await supabase.from('proposals').insert(newProposal).select().single();
    if (error) throw error;
    
    set(state => ({ proposals: [data, ...state.proposals] }));
    return data;
  },

  updateProposal: async (id, updates) => {
    const { data, error } = await supabase.from('proposals').update(updates).eq('id', id).select().single();
    if (error) throw error;
    
    set(state => ({ proposals: state.proposals.map(p => p.id === id ? data : p) }));
    return data;
  },

  deleteProposal: async (id) => {
    const { error } = await supabase.from('proposals').delete().eq('id', id);
    if (error) throw error;
    
    set(state => ({ proposals: state.proposals.filter(p => p.id !== id) }));
  },

  migrateLocalProposals: async () => {
    // Utility to run once to migrate localStorage proposals to Supabase
    const { user } = useAuthStore.getState();
    const orgId = await get()._getOrgId();
    if (!user || !orgId) return;

    let totalMigrated = 0;
    
    // Iterate all deals in local state
    const deals = get().deals;
    for (const deal of deals) {
      const localKey = `huntlo_proposals_${deal.id}`;
      const localData = localStorage.getItem(localKey);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Found local proposals
            for (const p of parsed) {
              const newProp = {
                deal_id: deal.id,
                title: p.title || 'Untitled Proposal',
                status: p.status || 'draft',
                amount: p.amount || 0,
                valid_until: p.validUntil || null,
                notes: p.notes || '',
                line_items: p.lineItems || [],
                owner_id: user.id,
                organization_id: orgId
              };
              
              const { data, error } = await supabase.from('proposals').insert(newProp).select().single();
              if (!error && data) {
                totalMigrated++;
                // Add to local state immediately
                set(state => ({ proposals: [...state.proposals, data] }));
              }
            }
            // Clear localStorage so we don't migrate again
            localStorage.removeItem(localKey);
          }
        } catch (e) {
          console.error('Failed to parse local proposals for deal', deal.id, e);
        }
      }
    }
    return totalMigrated;
  },

  // ── Meetings ──────────────────────────────
  createMeeting: async (meeting) => {
    const { user, session } = useAuthStore.getState();
    const orgId = await get()._getOrgId();
    let meetingData = { ...meeting, owner_id: user?.id, ...(orgId ? { organization_id: orgId } : {}) };

    // Try to create a Google Calendar event if the user has linked Google
    const googleToken = session?.provider_token;
    if (googleToken) {
      try {
        const { createGoogleCalendarEvent } = await import('../lib/googleCalendar.js');

        // Try to find the contact email via the deal
        let contactEmail = null;
        if (meeting.deal_id) {
          const storeState = get();
          const deal = storeState.deals.find(d => d.id === meeting.deal_id);
          if (deal?.company_id) {
            const { data: contacts } = await supabase
              .from('contacts')
              .select('email')
              .eq('company_id', deal.company_id)
              .not('email', 'is', null)
              .limit(1);
            if (contacts?.length > 0) contactEmail = contacts[0].email;
          }
        }

        const calResult = await createGoogleCalendarEvent({
          token: googleToken,
          title: meeting.title,
          description: meeting.notes || '',
          startDateTime: meeting.date,
          durationMinutes: Number(meeting.duration) || 30,
          contactEmail,
          platform: meeting.platform,
        });

        // Override the meeting link with the auto-generated Meet link
        if (calResult.meeting_link) {
          meetingData.meeting_link = calResult.meeting_link;
        }
        if (calResult.htmlLink) {
          meetingData.notes = (meetingData.notes || '') + `\nGoogle Calendar Event: ${calResult.htmlLink}`;
        }
        console.log('[Meetings] Google Calendar event created:', calResult.id);
      } catch (calErr) {
        // Non-fatal — just log the error and continue saving to Supabase
        console.warn('[Meetings] Google Calendar creation failed (non-fatal):', calErr.message);
      }
    }

    const { data, error } = await supabase.from('meetings').insert(meetingData).select().single();
    if (error) {
      console.error('Supabase insert failed:', error.message);
      throw error;
    }
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
    const orgId = await get()._getOrgId();

    const newDoc = { 
      ...doc, 
      owner_id: user?.id,
      ...(orgId ? { organization_id: orgId } : {})
    };

    const { data, error } = await supabase.from('documents').insert(newDoc).select().single();
    if (error) {
      console.error('Supabase insert failed:', error.message);
      throw error;
    }
    
    // Notify team members via email
    try {
      const { sendSequenceEmail } = await import('../lib/resend.js');
      const { teamMembers } = get();
      const currentMember = teamMembers.find(tm => tm.id === user?.id);
      const uploaderName = currentMember?.name || 'A team member';

      for (const member of teamMembers) {
        if (member.id !== user?.id && member.email) {
          sendSequenceEmail({
            toEmail: member.email,
            subject: `New Document Added: ${data.name}`,
            body: `${uploaderName} has added a new document to the Huntlo CRM.\n\nDocument: ${data.name}\nType: ${data.type || 'Link'}\n\nYou can access it directly here: ${data.url}\n\nBest,\nHuntlo Sales OS`,
            fromName: 'Huntlo Notifications'
          }).catch(err => console.warn('Email notify failed:', err));
        }
      }
    } catch (emailErr) {
      console.warn('Failed to load email client for notifications:', emailErr);
    }

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
      const { user } = useAuthStore.getState();
      const orgId = await get()._getOrgId();
      const payload = { ...seq, owner_id: user?.id, ...(orgId ? { organization_id: orgId } : {}) };
      const { data, error } = await supabase.from('sequences').insert(payload).select().single();
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

  // eslint-disable-next-line no-unused-vars
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
        
        // Fetch personal email settings for SDR
        let emailSettings = null;
        if (user) {
          const { data } = await supabase
            .from('user_email_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();
          emailSettings = data;
        }

        const senderName = emailSettings?.sender_name || user?.user_metadata?.full_name || 'Huntlo Sales';
        const replyToEmail = emailSettings?.smtp_user || undefined;

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
            fromName: senderName,
            replyTo: replyToEmail,
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

  // ── Webhooks ──────────────────────────────
  fetchWebhookConfig: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return null;
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!profile?.organization_id) return null;
    
    let { data, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .single();
      
    if (error && error.code === 'PGRST116') {
      const { data: newConfig } = await supabase
        .from('webhook_configs')
        .insert({ organization_id: profile.organization_id })
        .select()
        .single();
      data = newConfig;
    }
    return data || null;
  },

  saveWebhookConfig: async (configId, updates) => {
    const { data, error } = await supabase
      .from('webhook_configs')
      .update(updates)
      .eq('id', configId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  regenerateWebhookToken: async (configId) => {
    const newToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    const { data, error } = await supabase
      .from('webhook_configs')
      .update({ secret_token: newToken })
      .eq('id', configId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  fetchWebhookEvents: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return [];
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!profile?.organization_id) return [];

    const { data, error } = await supabase
      .from('webhook_events')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },


  // ── Webinars ──────────────────────────────
  createWebinar: async (webinar) => {
    const { user } = useAuthStore.getState();
    const orgId = await get()._getOrgId();
    const payload = { ...webinar, owner_id: user?.id, ...(orgId ? { organization_id: orgId } : {}) };
    
    const { data, error } = await supabase.from('webinars').insert(payload).select().single();
    if (error) throw error;
    
    set(state => ({ webinars: [data, ...state.webinars] }));

    // Auto-create tasks based on default SOP
    const sops = get().webinar_sops;
    const defaultSop = sops.length > 0 ? sops[0] : null;
    
    if (defaultSop && defaultSop.tasks) {
      const webinarDate = new Date(data.date_time);
      const tasksToCreate = defaultSop.tasks.map(t => {
        const dueDate = new Date(webinarDate);
        dueDate.setDate(dueDate.getDate() + (t.offset_days || 0));
        return {
          title: t.title,
          type: t.type || 'follow-up',
          priority: 'medium',
          due: dueDate.toISOString(),
          status: 'pending',
          owner_id: user?.id,
          webinar_id: data.id,
          checklist_source: defaultSop.id,
          ...(orgId ? { organization_id: orgId } : {})
        };
      });

      const { data: createdTasks, error: taskErr } = await supabase.from('tasks').insert(tasksToCreate).select();
      if (!taskErr && createdTasks) {
        set(state => ({ tasks: [...createdTasks, ...state.tasks] }));
      }
    }

    return data;
  },

  updateWebinar: async (id, updates) => {
    const { data, error } = await supabase.from('webinars').update(updates).eq('id', id).select().single();
    if (error) throw error;
    set(state => ({ webinars: state.webinars.map(w => w.id === id ? data : w) }));
    return data;
  },

  deleteWebinar: async (id) => {
    const { error } = await supabase.from('webinars').delete().eq('id', id);
    if (error) throw error;
    set(state => ({ webinars: state.webinars.filter(w => w.id !== id) }));
  },

  createWebinarRegistrant: async (registrant) => {
    const { user } = useAuthStore.getState();
    const orgId = await get()._getOrgId();
    
    // Auto-calculate lead score based on qualification answers
    let score = 0;
    const ans = registrant.qualification_answers || {};
    if (ans.urgent_roles === 'yes') score += 20;
    if (ans.hiring_volume && parseInt(ans.hiring_volume) > 10) score += 30;
    if (ans.agency_or_in_house === 'agency') score += 15;
    if (ans.team_size && parseInt(ans.team_size) > 5) score += 15;
    
    const payload = { 
      ...registrant, 
      lead_score: score,
      ...(orgId ? { organization_id: orgId } : {})
    };

    const { data, error } = await supabase.from('webinar_registrants').insert(payload).select().single();
    if (error) throw error;
    
    set(state => ({ webinar_registrants: [data, ...state.webinar_registrants] }));
    return data;
  },

  updateWebinarRegistrant: async (id, updates) => {
    const state = get();
    const existing = state.webinar_registrants.find(r => r.id === id);
    
    const { data, error } = await supabase.from('webinar_registrants').update(updates).eq('id', id).select().single();
    if (error) throw error;
    
    set(state => ({ webinar_registrants: state.webinar_registrants.map(r => r.id === id ? data : r) }));

    // Automations:
    // If demo_requested flipped to true, create a Deal.
    if (updates.demo_requested === true && existing?.demo_requested !== true) {
      // Find contact to get company id and name
      const contact = state.contacts.find(c => c.id === data.contact_id);
      if (contact) {
        const { user } = useAuthStore.getState();
        const orgId = await get()._getOrgId();
        
        const dealTitle = `${contact.name || contact.email} - Webinar Demo Request`;
        const newDeal = {
          title: dealTitle,
          company_id: contact.company_id,
          stage: 'Discovery',
          arr: 0,
          owner_id: user?.id,
          notes: `Created from Webinar registration.\nAnswers: ${JSON.stringify(data.qualification_answers, null, 2)}`,
          ...(orgId ? { organization_id: orgId } : {})
        };
        
        const { data: createdDeal, error: dealErr } = await supabase.from('deals').insert(newDeal).select().single();
        if (!dealErr && createdDeal) {
          set(state => ({ deals: [createdDeal, ...state.deals] }));
          
          // Optionally, add a notification
          useUIStore.getState().addNotification({
            id: `deal-auto-${createdDeal.id}`,
            type: 'deal',
            title: '💼 Auto-created Deal',
            message: `A deal was created for ${contact.name} from webinar request.`,
            route: '/pipeline',
            unread: true,
            time: new Date().toISOString(),
          });
        }
      }
    }
    
    return data;
  },

  syncWebinarRegistrants: async (webinarId, parsedData) => {
    const { user } = useAuthStore.getState();
    await get().ensureProfile();
    const orgId = await get()._getOrgId();
    
    let newContactsCount = 0;
    let newDealsCount = 0;
    let newTasksCount = 0;
    let syncedCount = 0;

    for (const row of parsedData) {
      // Find standard Luma columns (Name, Email, Job Title, Company)
      const name = row['Name'] || row['Full Name'] || row['name'] || '';
      const email = row['Email'] || row['email'] || '';
      const title = row['Job Title'] || row['title'] || row['Designation'] || '';
      const companyName = row['Company'] || row['company'] || row['Company Name'] || '';
      
      if (!email) continue; // Skip rows without email

      // 1. Resolve Company
      let companyId = null;
      if (companyName) {
        const existingCompany = get().companies.find(c => c.name?.toLowerCase() === companyName.toLowerCase());
        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          // Auto-create company
          try {
            const { data: newCompany } = await supabase.from('companies').insert({
              name: companyName,
              ...(orgId ? { organization_id: orgId } : {})
            }).select().single();
            if (newCompany) {
              companyId = newCompany.id;
              set(state => ({ companies: [newCompany, ...state.companies] }));
            }
          } catch(e) {}
        }
      }

      // 2. Resolve Contact
      let contactId = null;
      const existingContact = get().contacts.find(c => c.email?.toLowerCase() === email.toLowerCase());
      if (existingContact) {
        contactId = existingContact.id;
      } else {
        try {
          const { data: newContact } = await supabase.from('contacts').insert({
            name,
            email,
            designation: title,
            company_id: companyId,
            ...(orgId ? { organization_id: orgId } : {})
          }).select().single();
          if (newContact) {
            contactId = newContact.id;
            set(state => ({ contacts: [newContact, ...state.contacts] }));
            newContactsCount++;
          }
        } catch(e) {}
      }

      if (!contactId) continue;

      // 3. Intelligent Lead Scoring based on title/company
      let leadScore = 30; // base score
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('founder') || lowerTitle.includes('ceo') || lowerTitle.includes('vp')) leadScore += 40;
      if (lowerTitle.includes('hr') || lowerTitle.includes('recruiter') || lowerTitle.includes('talent')) leadScore += 30;
      if (companyName) leadScore += 10;

      // Check if already registered
      const alreadyRegistered = get().webinar_registrants.find(r => r.webinar_id === webinarId && r.contact_id === contactId);
      
      if (!alreadyRegistered) {
        // Create registrant
        try {
          const { data: newReg } = await supabase.from('webinar_registrants').insert({
            webinar_id: webinarId,
            contact_id: contactId,
            lead_score: leadScore,
            registration_date: new Date().toISOString(),
            ...(orgId ? { organization_id: orgId } : {})
          }).select().single();
          if (newReg) {
            set(state => ({ webinar_registrants: [newReg, ...state.webinar_registrants] }));
            syncedCount++;

            // 4. World Class Automations for VIPs (Score >= 70)
            if (leadScore >= 70) {
              // Auto Deal
              try {
                const { data: newDeal } = await supabase.from('deals').insert({
                  title: `${companyName || name} - Webinar VIP Lead`,
                  contact_id: contactId,
                  company_id: companyId,
                  stage: 'Discovery',
                  arr: 0,
                  owner_id: user?.id,
                  notes: `Auto-created from Luma sync. VIP Registrant (Score: ${leadScore}).`,
                  ...(orgId ? { organization_id: orgId } : {})
                }).select().single();
                if (newDeal) {
                  set(state => ({ deals: [newDeal, ...state.deals] }));
                  newDealsCount++;
                }
              } catch(e) {}

              // Auto Task
              try {
                const { data: newTask } = await supabase.from('tasks').insert({
                  title: `Review VIP Webinar Registrant: ${name}`,
                  webinar_id: webinarId,
                  contact_id: contactId,
                  status: 'pending',
                  due: new Date().toISOString(),
                  assigned_to: user?.id,
                  ...(orgId ? { organization_id: orgId } : {})
                }).select().single();
                if (newTask) {
                  set(state => ({ tasks: [newTask, ...state.tasks] }));
                  newTasksCount++;
                }
              } catch(e) {}
            }
          }
        } catch(e) {}
      }
    }
    
    return { synced: syncedCount, newContacts: newContactsCount, newDeals: newDealsCount, newTasks: newTasksCount };
  },

  createWebinarSOP: async (sop) => {
    const { user } = useAuthStore.getState();
    const orgId = await get()._getOrgId();
    const payload = { ...sop, ...(orgId ? { organization_id: orgId } : {}) };
    const { data, error } = await supabase.from('webinar_sops').insert(payload).select().single();
    if (error) throw error;
    set(state => ({ webinar_sops: [data, ...state.webinar_sops] }));
    return data;
  },
  
  updateWebinarSOP: async (id, updates) => {
    const { data, error } = await supabase.from('webinar_sops').update(updates).eq('id', id).select().single();
    if (error) throw error;
    set(state => ({ webinar_sops: state.webinar_sops.map(s => s.id === id ? data : s) }));
    return data;
  },

}));

export default useDataStore;
