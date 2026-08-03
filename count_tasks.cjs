const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xlkrdeygblaocxkdogoy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsa3JkZXlnYmxhb2N4a2RvZ295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTY3NjcsImV4cCI6MjA5NDQ5Mjc2N30.4waoEDQkDL7ua4kQSZMwdXYImAlgjibx2lSkJj7AKXY'
);

async function count() {
  const { data, error } = await supabase.from('tasks').select('type, status');
  if (error) { console.error(error); return; }
  
  const counts = {};
  for (const t of data) {
    const key = `${t.type} | ${t.status}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  console.log(counts);
}
count();
