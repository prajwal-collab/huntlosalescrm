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
  console.log('Fetching leads...');
  const { data: leads, error: leadsErr } = await supabase.from('leads').select('*');
  console.log('Leads count:', leads?.length, 'Error:', leadsErr);
  
  if (leads) {
    const missing = leads.filter(l => !l.organization_id);
    console.log('Leads missing org_id:', missing.length);
    console.log(missing);
  }

  const { data: companies, error: compErr } = await supabase.from('companies').select('*');
  console.log('Companies count:', companies?.length, 'Error:', compErr);
  if (companies) {
    const missing = companies.filter(c => !c.organization_id);
    console.log('Companies missing org_id:', missing.length);
    console.log(missing);
  }
}

fix();
