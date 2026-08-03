const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xlkrdeygblaocxkdogoy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsa3JkZXlnYmxhb2N4a2RvZ295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTY3NjcsImV4cCI6MjA5NDQ5Mjc2N30.4waoEDQkDL7ua4kQSZMwdXYImAlgjibx2lSkJj7AKXY'
);

async function pushDialerContactsToLeads() {
  console.log("Fetching pending dialer contacts...");
  
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .in('type', ['calling_list_item', 'cold_call'])
    .eq('status', 'pending');

  if (tasksError) {
    console.error("Error fetching tasks:", tasksError);
    return;
  }

  console.log(`Found ${tasks.length} pending dialer contacts.`);
  if (tasks.length === 0) return;

  const { data: existingLeads, error: leadsError } = await supabase
    .from('leads')
    .select('*');

  if (leadsError) {
    console.error("Error fetching leads:", leadsError);
    return;
  }

  const leadsToCreate = [];
  let skipped = 0;

  for (const t of tasks) {
    let notesData = {};
    try {
      notesData = JSON.parse(t.notes || '{}');
    } catch(e) {}

    const contactName = t.title || '';
    const company = notesData.company_name || '';
    const phone = notesData.phone || '';
    const email = notesData.email || '';
    
    const phoneClean = phone.replace(/\s+/g, '');
    const nameLower = contactName.toLowerCase().trim();
    const companyLower = company.toLowerCase().trim();

    // Check if already in leads
    const exists = existingLeads.find(l => {
      if (phoneClean && l.phone && l.phone.replace(/\s+/g, '') === phoneClean) return true;
      if (nameLower && l.contact_name && l.contact_name.toLowerCase().trim() === nameLower) return true;
      if (companyLower && l.company_name && l.company_name.toLowerCase().trim() === companyLower) return true;
      return false;
    });

    if (exists) {
      skipped++;
      continue;
    }

    // Also check if already in leadsToCreate (to avoid duplicate inserts in this batch)
    const existsInBatch = leadsToCreate.find(l => {
      if (phoneClean && l.phone && l.phone.replace(/\s+/g, '') === phoneClean) return true;
      if (nameLower && l.contact_name && l.contact_name.toLowerCase().trim() === nameLower) return true;
      if (companyLower && l.company_name && l.company_name.toLowerCase().trim() === companyLower) return true;
      return false;
    });

    if (existsInBatch) {
      skipped++;
      continue;
    }

    const uniqueCompany = company || (contactName ? `${contactName} (Individual)` : `Contact-${t.id}`);

    leadsToCreate.push({
      company_name: uniqueCompany,
      contact_name: contactName,
      phone: phone,
      email: email || null,
      stage: 'New Lead',
      source: 'Power Dialer List',
      notes: 'Imported from Power Dialer calling list.',
      owner_id: t.owner_id,
      organization_id: t.organization_id || null
    });
  }

  console.log(`Skipped ${skipped} contacts (already in leads).`);
  console.log(`Ready to insert ${leadsToCreate.length} new leads.`);

  if (leadsToCreate.length > 0) {
    // Supabase insert has limits, chunk it if large
    const chunkSize = 100;
    for (let i = 0; i < leadsToCreate.length; i += chunkSize) {
      const chunk = leadsToCreate.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('leads').insert(chunk);
      if (insertError) {
         console.error(`Error inserting chunk ${i}:`, insertError);
      } else {
         console.log(`Inserted chunk ${i} to ${i + chunk.length}`);
      }
    }
    console.log("Successfully pushed leads to CRM!");
  }
}

pushDialerContactsToLeads().catch(console.error);
