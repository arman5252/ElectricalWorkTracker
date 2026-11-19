// Standalone script to ping Supabase and keep it awake
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pdgymjghsxkebdipuzwf.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_meUYwZlVSzp27MWFA2O1AA_GC0Lu4RQ';

async function pingDatabase() {
  const endpoint = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/cables?select=cable_tag&limit=1`;
  console.log(`[Keep-Alive] Pinging Supabase at: ${endpoint}...`);

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`[Keep-Alive] SUCCESS: Received response from database. Rows returned:`, data.length);
      console.log(`[Keep-Alive] Database is active and healthy!`);
      return;
    } else {
      console.error(`[Keep-Alive] ERROR: Server responded with status ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error(`[Keep-Alive] Details:`, text);
      process.exitCode = 1;
    }
  } catch (err) {
    console.error(`[Keep-Alive] Network or execution error:`, err.message);
    process.exitCode = 1;
  }
}

pingDatabase();
