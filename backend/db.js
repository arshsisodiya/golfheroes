// In-memory store with optional Supabase persistence
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const db = {
  users: [],
  scores: [],
  draws: [],
  charities: [],
  subscriptions: [],
  drawEntries: [],
  winners: [],
  drawResults: [],
  donations: [],
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
db.useSupabase = Boolean(supabase);
db.supabase = supabase;

// Seed charities
db.charities = [
  {
    id: uuidv4(), name: "Green Fairways Foundation", description: "Supporting youth golf programs in underserved communities across the UK.", category: "Youth Sports", image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400", featured: true, totalReceived: 12400, upcomingEvents: ["Charity Golf Day - Apr 12", "Junior Open - May 5"], active: true, createdAt: new Date()
  },
  {
    id: uuidv4(), name: "Cancer Research Golf Alliance", description: "Every putt counts. Funding breakthrough cancer research one round at a time.", category: "Health", image: "https://images.unsplash.com/photo-1576013551627-0ae6c56b4d12?w=400", featured: true, totalReceived: 28750, upcomingEvents: ["Annual Pro-Am - Mar 30"], active: true, createdAt: new Date()
  },
  {
    id: uuidv4(), name: "Greens for Veterans", description: "Providing therapeutic golf programs for veterans recovering from PTSD and injury.", category: "Veterans", image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400", featured: false, totalReceived: 9100, upcomingEvents: [], active: true, createdAt: new Date()
  },
  {
    id: uuidv4(), name: "Junior Golf Trust", description: "Scholarships and coaching for talented young golfers regardless of background.", category: "Education", image: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400", featured: false, totalReceived: 15600, upcomingEvents: ["Coaching Camp - Apr 20"], active: true, createdAt: new Date()
  },
  {
    id: uuidv4(), name: "Mental Health on the Fairway", description: "Using the game of golf to combat loneliness, depression and anxiety.", category: "Mental Health", image: "https://images.unsplash.com/photo-1516546453174-5e1098a4b4af?w=400", featured: true, totalReceived: 7200, upcomingEvents: ["Awareness Round - May 18"], active: true, createdAt: new Date()
  },
  {
    id: uuidv4(), name: "Global Golf for Good", description: "International humanitarian aid funded through global golf community events.", category: "Humanitarian", image: "https://images.unsplash.com/photo-1526657782461-9fe13402a841?w=400", featured: false, totalReceived: 34000, upcomingEvents: [], active: true, createdAt: new Date()
  },
];

// Seed admin user
const bcrypt = require('bcryptjs');
const adminId = uuidv4();
db.users.push({
  id: adminId,
  name: "Admin User",
  email: "admin@golfheroes.com",
  password: bcrypt.hashSync("Admin123!", 10),
  role: "admin",
  subscriptionStatus: "active",
  subscriptionPlan: "yearly",
  charityId: db.charities[0].id,
  charityContribution: 10,
  createdAt: new Date(),
  avatarInitials: "AU"
});

// Seed demo subscriber
const demoId = uuidv4();
db.users.push({
  id: demoId,
  name: "Demo Player",
  email: "player@golfheroes.com",
  password: bcrypt.hashSync("Player123!", 10),
  role: "subscriber",
  subscriptionStatus: "active",
  subscriptionPlan: "monthly",
  subscriptionRenewal: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  charityId: db.charities[1].id,
  charityContribution: 15,
  totalWon: 250,
  createdAt: new Date(),
  avatarInitials: "DP"
});

// Seed scores for demo player
const scoreData = [
  { value: 32, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  { value: 27, date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
  { value: 35, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
  { value: 28, date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000) },
  { value: 31, date: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000) },
];
scoreData.forEach(s => {
  db.scores.push({ id: uuidv4(), userId: demoId, value: s.value, date: s.date, createdAt: new Date() });
});

// Seed a past draw result
db.drawResults.push({
  id: uuidv4(),
  month: "February 2026",
  drawnNumbers: [12, 28, 35, 7, 19],
  drawType: "random",
  totalPool: 1200,
  jackpotPool: 480,
  fourMatchPool: 420,
  threeMatchPool: 300,
  jackpotWinners: [],
  fourMatchWinners: [],
  threeMatchWinners: [demoId],
  jackpotRolledOver: true,
  published: true,
  publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
});

const seedSnapshot = {
  users: [...db.users],
  scores: [...db.scores],
  charities: [...db.charities],
  subscriptions: [...db.subscriptions],
  drawEntries: [...db.drawEntries],
  winners: [...db.winners],
  drawResults: [...db.drawResults],
  donations: [...db.donations],
};

async function upsertRows(table, rows) {
  if (!db.useSupabase || !rows || rows.length === 0) return;
  let toUpsert = rows;
  // Prevent email-unique conflicts by deduplicating users by email, preferring the first occurrence.
  if (table === 'users') {
    const seen = new Set();
    const filtered = [];
    for (const r of rows) {
      if (r && r.email) {
        if (seen.has(r.email)) continue;
        seen.add(r.email);
      }
      filtered.push(r);
    }
    toUpsert = filtered;
  }

  const { error } = await supabase.from(table).upsert(toUpsert, { onConflict: 'id' });
  if (error) {
    console.warn(`Supabase upsert failed for ${table}:`, error.message);
    if (table === 'users') {
      console.warn('Failed user upsert payload sample:', JSON.stringify(toUpsert.slice(0,10).map(u=>({id:u.id,email:u.email}))))
    }
    // If this was a users upsert, attempt per-row upsert with remediation for duplicate-email conflicts.
    if (table === 'users') {
      for (const r of toUpsert) {
        try {
          const { error: e2 } = await supabase.from('users').upsert(r, { onConflict: 'id' });
          if (e2) {
            // If duplicate email error, remap any references to the existing user and update that record instead.
            if (typeof e2.message === 'string' && e2.message.includes('users_email_key')) {
              const { data: existing } = await supabase.from('users').select('id').eq('email', r.email).maybeSingle();
              if (existing && existing.id) {
                console.log(`Found existing user for email ${r.email}, remapping references ${r.id} -> ${existing.id}`);
                const remapId = existing.id;
                // Remap in-memory references so subsequent upserts use the correct id.
                for (const s of db.scores) if (s.userId === r.id) s.userId = remapId;
                for (const w of db.winners) if (w.userId === r.id) w.userId = remapId;
                for (const d of db.drawResults) {
                  if (Array.isArray(d.threeMatchWinners)) d.threeMatchWinners = d.threeMatchWinners.map(id => id === r.id ? remapId : id);
                  if (Array.isArray(d.fourMatchWinners)) d.fourMatchWinners = d.fourMatchWinners.map(id => id === r.id ? remapId : id);
                  if (Array.isArray(d.jackpotWinners)) d.jackpotWinners = d.jackpotWinners.map(id => id === r.id ? remapId : id);
                }
                // Update the existing user record with non-null fields from r
                const updatePayload = { ...r };
                delete updatePayload.id;
                await supabase.from('users').update(updatePayload).eq('id', remapId);
              } else {
                console.warn(`Duplicate-email conflict for ${r.email} but no existing row found.`);
              }
            } else {
              console.warn(`Per-user upsert failed for user ${r.id}:`, e2.message);
            }
          }
        } catch (ex) {
          console.warn(`Unexpected error upserting user ${r.id}:`, ex.message || ex);
        }
      }
    }
    // If scores upsert fails (FK issues), try per-score upsert and skip scores referencing missing users.
    if (table === 'scores') {
      for (const s of toUpsert) {
        try {
          const { data: existingUser } = await supabase.from('users').select('id').eq('id', s.userId).maybeSingle();
          if (!existingUser) {
            console.warn(`Skipping score ${s.id} — user ${s.userId} not found in Supabase.`);
            continue;
          }
          const { error: e3 } = await supabase.from('scores').upsert(s, { onConflict: 'id' });
          if (e3) console.warn(`Per-score upsert failed for ${s.id}:`, e3.message);
        } catch (ex) {
          console.warn(`Unexpected error upserting score ${s.id}:`, ex.message || ex);
        }
      }
    }
  }
}

async function deleteRow(table, id) {
  if (!db.useSupabase) return;
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    console.warn(`Supabase delete failed for ${table}:`, error.message);
  }
}

async function selectAll(table) {
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw error;
  return data || [];
}

async function selectAllOptional(table) {
  try {
    return await selectAll(table);
  } catch (error) {
    console.warn(`Optional table ${table} unavailable:`, error.message);
    return [];
  }
}

db.init = async () => {
  if (!db.useSupabase) {
    console.log('Supabase not configured. Using in-memory data store.');
    return;
  }

  try {
    const [users, scores, charities, subscriptions, drawEntries, winners, drawResults, donations] = await Promise.all([
      selectAll('users'),
      selectAll('scores'),
      selectAll('charities'),
      selectAllOptional('subscriptions'),
      selectAllOptional('draw_entries'),
      selectAll('winners'),
      selectAll('draw_results'),
      selectAllOptional('donations')
    ]);

    // Prefer remote rows when present, otherwise use local seed baseline.
    db.users = users.length ? users : [...seedSnapshot.users];
    db.scores = scores.length ? scores : [...seedSnapshot.scores];
    db.charities = charities.length ? charities : [...seedSnapshot.charities];
    db.subscriptions = subscriptions.length ? subscriptions : [...seedSnapshot.subscriptions];
    db.drawEntries = drawEntries.length ? drawEntries : [...seedSnapshot.drawEntries];
    db.winners = winners.length ? winners : [...seedSnapshot.winners];
    db.drawResults = drawResults.length ? drawResults : [...seedSnapshot.drawResults];
    db.donations = donations.length ? donations : [...seedSnapshot.donations];

    console.log(`Seeding snapshot: users=${db.users.length}, scores=${db.scores.length}, charities=${db.charities.length}`);
    const emailCounts = db.users.reduce((m,u)=>{ if(u && u.email){ m[u.email]=(m[u.email]||0)+1;} return m; },{});
    const dupEmails = Object.keys(emailCounts).filter(e=>emailCounts[e]>1);
    if (dupEmails.length) console.warn('Duplicate emails detected in combined users:', dupEmails);

    const adminSeed = seedSnapshot.users.find(u => u.email === 'admin@golfheroes.com');
    if (!db.users.some(u => u.email === 'admin@golfheroes.com') && adminSeed) {
      db.users.push(adminSeed);
    }

    const playerSeed = seedSnapshot.users.find(u => u.email === 'player@golfheroes.com');
    if (!db.users.some(u => u.email === 'player@golfheroes.com') && playerSeed) {
      db.users.push(playerSeed);
    }

    // Ensure parent tables are upserted before dependent tables to avoid FK constraint errors.
    await upsertRows('users', db.users);
    // Charities should exist before donations which reference them.
    await upsertRows('charities', db.charities);

    // Ensure any users referenced by scores exist before upserting scores.
    const missingUsers = [];
    for (const s of db.scores) {
      if (!db.users.some(u => u.id === s.userId) && !missingUsers.some(u => u.id === s.userId)) {
        // Try to find a seed user with this id
        const seedUser = seedSnapshot.users.find(u => u.id === s.userId);
        if (seedUser) {
          missingUsers.push(seedUser);
          db.users.push(seedUser);
        } else {
          // Create a minimal placeholder user so FK constraints pass.
          const placeholder = {
            id: s.userId,
            name: 'Imported User',
            email: `imported+${s.userId}@local.invalid`,
            password: bcrypt.hashSync(uuidv4(), 10),
            role: 'subscriber',
            subscriptionStatus: null,
            subscriptionPlan: null,
            createdAt: new Date(),
            avatarInitials: 'IM'
          };
          missingUsers.push(placeholder);
          db.users.push(placeholder);
        }
      }
    }

    if (missingUsers.length) {
      console.log(`Adding ${missingUsers.length} missing users referenced by scores:`,
        missingUsers.map(u=>({id:u.id,email:u.email})).slice(0,10)
      );

      // If the remote DB already contains a user with the same email but a different id,
      // remap scores/winners to the existing user id instead of attempting to insert a conflicting user.
      const existingByEmail = new Map((users || []).filter(u => u && u.email).map(u => [u.email, u.id]));
      const remap = {};
      const toInsert = [];
      for (const mu of missingUsers) {
        if (mu.email && existingByEmail.has(mu.email) && existingByEmail.get(mu.email) !== mu.id) {
          remap[mu.id] = existingByEmail.get(mu.email);
          console.log(`Remapping user ${mu.id} -> ${remap[mu.id]} due to existing email ${mu.email}`);
        } else {
          toInsert.push(mu);
        }
      }

      // Apply remapping to scores, winners, and drawResults references
      if (Object.keys(remap).length) {
        const applyRemap = (arr) => {
          for (const row of arr) {
            if (row.userId && remap[row.userId]) row.userId = remap[row.userId];
            if (Array.isArray(row.threeMatchWinners)) {
              row.threeMatchWinners = row.threeMatchWinners.map(id => remap[id] || id);
            }
            if (Array.isArray(row.fourMatchWinners)) {
              row.fourMatchWinners = row.fourMatchWinners.map(id => remap[id] || id);
            }
            if (Array.isArray(row.jackpotWinners)) {
              row.jackpotWinners = row.jackpotWinners.map(id => remap[id] || id);
            }
          }
        };
        applyRemap(db.scores);
        applyRemap(db.winners);
        applyRemap(db.drawResults);
      }

      if (toInsert.length) {
        await upsertRows('users', toInsert);
      }
    }

    await Promise.all([
      upsertRows('scores', db.scores),
      upsertRows('subscriptions', db.subscriptions),
      upsertRows('draw_entries', db.drawEntries),
      upsertRows('winners', db.winners),
      upsertRows('draw_results', db.drawResults),
      upsertRows('donations', db.donations),
    ]);

    console.log('Loaded data from Supabase with seed safety checks.');
  } catch (error) {
    console.warn('Supabase init failed. Falling back to in-memory store.', error.message);
    db.useSupabase = false;
    db.supabase = null;
  }
};

db.syncUser = async (user) => upsertRows('users', [user]);
db.syncUsers = async (users) => upsertRows('users', users);

db.syncScore = async (score) => upsertRows('scores', [score]);
db.deleteScore = async (id) => deleteRow('scores', id);

db.syncCharity = async (charity) => upsertRows('charities', [charity]);

db.syncSubscription = async (subscription) => upsertRows('subscriptions', [subscription]);
db.syncSubscriptions = async (subscriptions) => upsertRows('subscriptions', subscriptions);

db.syncDrawEntry = async (drawEntry) => upsertRows('draw_entries', [drawEntry]);
db.syncDrawEntries = async (drawEntries) => upsertRows('draw_entries', drawEntries);

db.syncWinner = async (winner) => upsertRows('winners', [winner]);
db.syncWinners = async (winners) => upsertRows('winners', winners);

db.syncDrawResult = async (drawResult) => upsertRows('draw_results', [drawResult]);

db.syncDonation = async (donation) => upsertRows('donations', [donation]);

module.exports = db;
