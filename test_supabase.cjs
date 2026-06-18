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
  const { data, error } = await supabase.from('leads').select('*').limit(1);
  console.log('Leads error:', error);
  const { data: compData, error: compErr } = await supabase.from('companies').select('*').limit(1);
  console.log('Companies error:', compErr);
}
fix();
