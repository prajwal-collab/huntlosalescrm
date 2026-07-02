// ============================================
// HUNTLO SALES OS — PIPELINE STORE (Optimized)
// ============================================
import { create } from 'zustand';
import useDataStore from './useDataStore';
import useAuthStore from './useAuthStore';

const usePipelineStore = create((set, get) => ({
  selectedDealId: null,
  drawerOpen: false,
  filter: 'all',
  search: '',

  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),

  selectDeal: (id) => set({ selectedDealId: id, drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false, selectedDealId: null }),

  getSelectedDeal: () => {
    const { deals, companies, contacts, teamMembers } = useDataStore.getState();
    const { selectedDealId } = get();
    const rawDeal = deals.find(d => d.id === selectedDealId);
    if (!rawDeal) return null;
    
    const company = companies.find(c => c.id === rawDeal.company_id);
    const dealContacts = contacts.filter(c => c.company_id === rawDeal.company_id).map(c => c.name);
    const owner = teamMembers?.find(tm => tm.id === rawDeal.owner_id);
    const ownerName = owner?.full_name || owner?.email || 'Unknown';
    
    return {
      ...rawDeal,
      company: company?.name || 'Unknown',
      logo: company?.name?.charAt(0) || 'U',
      color: '#3b82f6',
      owner: {
        name: ownerName,
        color: owner?.color || '#3b82f6',
        initials: (owner?.initials || ownerName.substring(0, 2)).toUpperCase()
      },
      contacts: dealContacts,
      activities: [], // Mock activities
      engagementScore: rawDeal.engagement_score || 0,
      taskCount: 0 // Mock task count
    };
  },

  moveDeal: (dealId, newStage) => {
    useDataStore.getState().updateDealStage(dealId, newStage);
  },

  getFilteredDeals: () => {
    const { filter, search } = get();
    const { deals, companies, contacts, teamMembers } = useDataStore.getState();
    
    // 1. Create O(1) hash maps for quick lookups
    const companyMap = new Map(companies.map(c => [c.id, c]));
    const teamMap = new Map((teamMembers || []).map(tm => [tm.id, tm]));
    const contactsMap = new Map(contacts.map(c => [c.id, c]));
    
    // Group contacts by company_id to avoid repeated filtering
    const contactsByCompany = new Map();
    for (const c of contacts) {
      if (!c.company_id) continue;
      if (!contactsByCompany.has(c.company_id)) {
        contactsByCompany.set(c.company_id, []);
      }
      contactsByCompany.get(c.company_id).push(c);
    }

    // 2. Filter raw deals first (faster because we process fewer items in mapping)
    let filteredDeals = deals;

    if (filter !== 'all') {
      if (filter === 'hot') {
        filteredDeals = filteredDeals.filter(d => (d.engagement_score || 0) >= 75);
      } else if (filter === 'stale') {
        filteredDeals = filteredDeals.filter(d => {
          const lastAct = d.last_activity || d.created_at || Date.now();
          const days = (Date.now() - new Date(lastAct)) / 86400000;
          return days > 5;
        });
      } else if (filter === 'urgent') {
        filteredDeals = filteredDeals.filter(d => d.urgency === 'urgent' || d.urgency === 'high');
      }
    }

    // 3. Map to UI structure using the hash maps
    let mapped = filteredDeals.map(d => {
      const company = companyMap.get(d.company_id);
      const companyContacts = contactsByCompany.get(d.company_id) || [];
      
      let leadName = 'No Lead assigned';
      let specificContactId = null;
      
      // Parse assigned lead from notes if present
      if (d.notes && d.notes.includes('Assigned Lead: ')) {
        const match = d.notes.match(/Assigned Lead:\s*([0-9a-fA-F-]+)/);
        if (match) specificContactId = match[1];
      }

      if (specificContactId && contactsMap.has(specificContactId)) {
        leadName = contactsMap.get(specificContactId).name;
      } else if (companyContacts.length > 0) {
        leadName = companyContacts[0].name;
      }

      const owner = teamMap.get(d.owner_id);
      const currentUser = useAuthStore.getState().user;
      
      let ownerName = 'Unknown';
      let ownerColor = '#3b82f6';
      let ownerInitials = 'UN';

      if (owner) {
        ownerName = owner.full_name || owner.email || 'Unknown';
        ownerColor = owner.color || '#3b82f6';
        ownerInitials = (owner.initials || ownerName.substring(0, 2)).toUpperCase();
      } else if (currentUser && d.owner_id === currentUser.id) {
        ownerName = currentUser.user_metadata?.full_name || currentUser.email || 'You';
        ownerInitials = (currentUser.user_metadata?.full_name || currentUser.email || 'U').substring(0, 2).toUpperCase();
      }

      return { 
        ...d, 
        company: company?.name || 'Unknown', 
        leadName,
        logo: (company?.name || 'U').charAt(0).toUpperCase(),
        color: '#3b82f6',
        owner: {
          name: ownerName,
          color: ownerColor,
          initials: ownerInitials
        },
        engagementScore: d.engagement_score || 0
      };
    });

    // 4. Apply search filtering on the mapped structures
    if (search) {
      const q = search.toLowerCase();
      mapped = mapped.filter(d =>
        d.title?.toLowerCase().includes(q) ||
        d.company?.toLowerCase().includes(q) ||
        d.stage?.toLowerCase().includes(q)
      );
    }

    return mapped;
  },
}));

export default usePipelineStore;
