const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/['"]/g, '');
});
const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function run() {
  const { data, error } = await supabase.from('profiles').select('*').ilike('full_name', '%saurav%');
  if (error) console.error('Error fetching profiles:', error);
  else console.log('Found by name:', data);
  
  const { data: data2, error: error2 } = await supabase.from('profiles').select('*').ilike('email', '%saurav%');
  if (error2) console.error('Error fetching profiles by email:', error2);
  else console.log('Found by email:', data2);
}
run();
