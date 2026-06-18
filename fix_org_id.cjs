const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/['"]/g, '');
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function fix() {
  console.log('Fixing leads, companies, and contacts...');
  
  // 1. Leads
  const { data: leads } = await supabase.from('leads').select('id, owner_id, organization_id');
  let leadsCount = 0;
  for (const lead of leads || []) {
    if (!lead.organization_id && lead.owner_id) {
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', lead.owner_id).single();
      if (profile && profile.organization_id) {
        await supabase.from('leads').update({ organization_id: profile.organization_id }).eq('id', lead.id);
        leadsCount++;
      }
    }
  }
  console.log(`Fixed ${leadsCount} leads.`);

  // 2. Companies
  const { data: companies } = await supabase.from('companies').select('id, owner_id, organization_id');
  let compCount = 0;
  for (const comp of companies || []) {
    if (!comp.organization_id && comp.owner_id) {
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', comp.owner_id).single();
      if (profile && profile.organization_id) {
        await supabase.from('companies').update({ organization_id: profile.organization_id }).eq('id', comp.id);
        compCount++;
      }
    }
  }
  console.log(`Fixed ${compCount} companies.`);

  // 3. Contacts
  const { data: contacts } = await supabase.from('contacts').select('id, owner_id, organization_id');
  let contactCount = 0;
  for (const contact of contacts || []) {
    if (!contact.organization_id && contact.owner_id) {
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', contact.owner_id).single();
      if (profile && profile.organization_id) {
        await supabase.from('contacts').update({ organization_id: profile.organization_id }).eq('id', contact.id);
        contactCount++;
      }
    }
  }
  console.log(`Fixed ${contactCount} contacts.`);
}

fix();
