import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xlkrdeygblaocxkdogoy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsa3JkZXlnYmxhb2N4a2RvZ295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTY3NjcsImV4cCI6MjA5NDQ5Mjc2N30.4waoEDQkDL7ua4kQSZMwdXYImAlgjibx2lSkJj7AKXY'
);

async function pushAllPending() {
  console.log("Fetching tasks and leads...");
  const [{ data: tasks }, { data: leads }] = await Promise.all([
    supabase.from('tasks').select('*'),
    supabase.from('leads').select('*')
  ]);

  const stageOrder = [
    'New Lead','Researching','Ready for Outreach','Outreach Started',
    'Engaged','Qualified','Demo Scheduled','Demo Complete',
    'Trial Started','Customer','Lost'
  ];

  const pendingLogs = tasks.filter(t => {
    if (t.type !== 'calling_list_item' && t.type !== 'cold_call') return false;
    if (t.status !== 'completed') return false;
    let data = {};
    try { data = JSON.parse(t.notes || '{}'); } catch(e) {}
    if (data.pushedToLead) return false;
    if (!data.outcome) return false;
    return true;
  });

  console.log(`Found ${pendingLogs.length} pending logs to push.`);
  if (pendingLogs.length === 0) return;

  const leadsToCreate = [];
  const tasksToUpdate = [];
  
  // Track new leads to avoid duplicate companies within the same batch
  const newLeadCompanies = new Set();

  for (const t of pendingLogs) {
    let data = {};
    try { data = JSON.parse(t.notes || '{}'); } catch(e) {}
    
    const contactName = t.title || '';
    const company = data.company_name || '';
    const phone = data.phone || '';
    const outcome = data.outcome;
    const outcomeLabel = data.outcomeLabel || outcome;
    const duration = data.duration;
    const callNotes = data.notes;
    const callDate = new Date(t.created_at).toLocaleDateString();

    const callNote = `📞 [${callDate}] ${outcomeLabel} — ${duration ? duration + ' min' : 'N/A'} — ${callNotes || 'No notes'}`;
    const phoneClean = phone.replace(/\s+/g, '');
    const nameLower = contactName.toLowerCase().trim();
    const companyLower = company.toLowerCase().trim();

    let existingLead = leads.find(l => {
      if (phoneClean && l.phone && l.phone.replace(/\s+/g, '') === phoneClean) return true;
      if (nameLower && l.contact_name && l.contact_name.toLowerCase().trim() === nameLower) return true;
      if (companyLower && l.company_name && l.company_name.toLowerCase().trim() === companyLower) return true;
      return false;
    });
    
    // Also check leadsToCreate to see if we just created one for this company in this batch
    if (!existingLead) {
        existingLead = leadsToCreate.find(l => {
          if (phoneClean && l.phone && l.phone.replace(/\s+/g, '') === phoneClean) return true;
          if (nameLower && l.contact_name && l.contact_name.toLowerCase().trim() === nameLower) return true;
          if (companyLower && l.company_name && l.company_name.toLowerCase().trim() === companyLower) return true;
          return false;
        });
    }

    if (existingLead) {
      const newStage = outcome === 'connected' ? 'Engaged' : null;
      const currentStageIdx = stageOrder.indexOf(existingLead.stage || 'New Lead');
      const newStageIdx = stageOrder.indexOf(newStage || 'New Lead');
      const stageUpdate = newStage && newStageIdx > currentStageIdx ? newStage : null;
      
      const updatedNotes = existingLead.notes ? `${existingLead.notes}\n\n---\n${callNote}` : callNote;
      
      if (existingLead.id) {
          console.log(`Updating existing lead in DB: ${existingLead.company_name}`);
          await supabase.from('leads').update({
            notes: updatedNotes,
            ...(stageUpdate ? { stage: stageUpdate } : {})
          }).eq('id', existingLead.id);
          
          existingLead.notes = updatedNotes;
          if (stageUpdate) existingLead.stage = stageUpdate;
      } else {
          console.log(`Appending to pending new lead: ${existingLead.company_name}`);
          existingLead.notes = updatedNotes;
          if (stageUpdate) existingLead.stage = stageUpdate;
      }
      
    } else {
      const uniqueCompany = company || (contactName ? `${contactName} (Individual)` : `Contact-${t.id}`);
      
      console.log(`Creating new lead: ${uniqueCompany}`);
      leadsToCreate.push({
        company_name: uniqueCompany,
        contact_name: contactName,
        phone: phone,
        email: data.email || null,
        stage: outcome === 'connected' ? 'Engaged' : 'New Lead',
        source: 'Scripted Bulk Push',
        notes: callNote,
        owner_id: t.owner_id,
        organization_id: t.organization_id || null
      });
    }

    const newNotesObj = { ...data, pushedToLead: true };
    tasksToUpdate.push({
      ...t,
      notes: JSON.stringify(newNotesObj)
    });
  }

  if (leadsToCreate.length > 0) {
    console.log(`Inserting ${leadsToCreate.length} leads...`);
    const { error } = await supabase.from('leads').insert(leadsToCreate);
    if (error) console.error("Error inserting leads:", error);
  }

  if (tasksToUpdate.length > 0) {
    console.log(`Updating ${tasksToUpdate.length} tasks...`);
    const { error } = await supabase.from('tasks').upsert(tasksToUpdate);
    if (error) console.error("Error updating tasks:", error);
  }

  console.log("Push all pending complete!");
}

pushAllPending().catch(console.error);
