const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) must be set in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    console.log('Fetching users...');
    const { data: users, error: uErr } = await supabase.from('users').select('id');
    if (uErr) throw uErr;
    const ids = users.map(u => u.id);
    console.log(`Found ${ids.length} users.`);

    console.log('Deleting orphan scores (scores with userId not in users)...');
    const { error: delErr, count } = await supabase.from('scores').delete().not('userId', 'in', ids).select('*', { count: 'exact' });
    if (delErr) {
      console.error('Failed to delete orphan scores:', delErr.message || delErr);
    } else {
      console.log('Deleted orphan scores.');
    }

    console.log('Done.');
  } catch (err) {
    console.error('Cleanup failed:', err.message || err);
    process.exit(2);
  }
})();
