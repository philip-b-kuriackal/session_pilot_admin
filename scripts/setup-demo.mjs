// Creates demo auth users + profiles, shifts and sample posts.
// Run AFTER supabase/schema.sql and supabase/seed.sql have been applied.
// Usage: node scripts/setup-demo.mjs
// Requires .env with SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';

// minimal .env loader
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const url = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const ORG = 'a0000000-0000-4000-8000-000000000001';
const LOC_LITTLE_ASIA = 'c0000000-0000-4000-8000-000000000001';
const LOC_SVENSK24 = 'c0000000-0000-4000-8000-000000000002';
const DEPT_KITCHEN = 'd0000000-0000-4000-8000-000000000001';
const DEPT_MGMT = 'd0000000-0000-4000-8000-000000000007';
const ROLE_KITCHEN_STAFF = 'e0000000-0000-4000-8000-000000000002';
const ROLE_RESTAURANT_MANAGER = 'e0000000-0000-4000-8000-000000000008';
const ROLE_SHIFT_LEADER = 'e0000000-0000-4000-8000-000000000006';
const EVENT_PARTY = 'cc000000-0000-4000-8000-000000000001';

const USERS = [
  { email: 'admin@sessionpilot.demo', password: 'Demo1234!', first: 'Annika', last: 'Berg', role: 'org_admin', location: null, dept: DEPT_MGMT, job: null, position: 'Organization Admin', empId: 'PKF-001' },
  { email: 'manager@sessionpilot.demo', password: 'Demo1234!', first: 'Marcus', last: 'Lind', role: 'restaurant_manager', location: LOC_LITTLE_ASIA, dept: DEPT_MGMT, job: ROLE_RESTAURANT_MANAGER, position: 'Restaurant Manager', empId: 'PKF-002' },
  { email: 'shift@sessionpilot.demo', password: 'Demo1234!', first: 'Sara', last: 'Holm', role: 'shift_manager', location: LOC_LITTLE_ASIA, dept: DEPT_KITCHEN, job: ROLE_SHIFT_LEADER, position: 'Shift Leader', empId: 'PKF-003' },
  { email: 'employee@sessionpilot.demo', password: 'Demo1234!', first: 'Lukas', last: 'Jansson', role: 'employee', location: LOC_LITTLE_ASIA, dept: DEPT_KITCHEN, job: ROLE_KITCHEN_STAFF, position: 'Kitchen Staff', empId: 'PKF-004' },
  { email: 'employee2@sessionpilot.demo', password: 'Demo1234!', first: 'Elena', last: 'Petrova', role: 'employee', location: LOC_SVENSK24, dept: DEPT_KITCHEN, job: ROLE_KITCHEN_STAFF, position: 'Kitchen Staff', empId: 'PKF-005' }
];

const ids = {};

for (const u of USERS) {
  let userId;
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { first_name: u.first, last_name: u.last }
  });
  if (error) {
    if (String(error.message).toLowerCase().includes('already')) {
      const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
      userId = list.users.find((x) => x.email === u.email)?.id;
      console.log(`= ${u.email} already exists`);
    } else {
      console.error(`✗ ${u.email}: ${error.message}`);
      continue;
    }
  } else {
    userId = data.user.id;
    console.log(`✓ created ${u.email}`);
  }
  if (!userId) continue;
  ids[u.email] = userId;

  const { error: pErr } = await admin.from('profiles').upsert({
    id: userId,
    organization_id: ORG,
    location_id: u.location,
    department_id: u.dept,
    job_role_id: u.job,
    role: u.role,
    first_name: u.first,
    last_name: u.last,
    email: u.email,
    position: u.position,
    employee_id: u.empId,
    hire_date: '2025-03-01',
    status: 'active'
  });
  if (pErr) console.error(`✗ profile ${u.email}: ${pErr.message}`);
}

// Shifts for the next 7 days (Lukas + Sara at Little Asia)
const lukas = ids['employee@sessionpilot.demo'];
const sara = ids['shift@sessionpilot.demo'];
const shifts = [];
for (let d = 0; d < 7; d++) {
  const dt = new Date(Date.now() + d * 86400000); const date = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  const dow = new Date(date + 'T00:00:00').getDay();
  if (dow === 0) continue; // Sundays off
  if (lukas) shifts.push({ location_id: LOC_LITTLE_ASIA, user_id: lukas, department_id: DEPT_KITCHEN, shift_date: date, start_time: '09:00', end_time: '17:00', role_label: 'Kitchen' });
  if (sara) shifts.push({ location_id: LOC_LITTLE_ASIA, user_id: sara, department_id: DEPT_KITCHEN, shift_date: date, start_time: '12:00', end_time: '20:00', role_label: 'Shift Lead' });
}
if (shifts.length) {
  const { error } = await admin.from('shifts').insert(shifts);
  console.log(error ? `✗ shifts: ${error.message}` : `✓ ${shifts.length} shifts`);
}

// Event attendance
if (lukas) await admin.from('event_attendance').upsert({ event_id: EVENT_PARTY, user_id: lukas, status: 'joining' });
if (sara) await admin.from('event_attendance').upsert({ event_id: EVENT_PARTY, user_id: sara, status: 'joining' });

// Sample feed posts
const manager = ids['manager@sessionpilot.demo'];
if (manager) {
  const { data: existing } = await admin.from('posts').select('id').limit(1);
  if (!existing?.length) {
    await admin.from('posts').insert([
      {
        organization_id: ORG, location_id: LOC_LITTLE_ASIA, author_id: manager, is_important: true,
        content: 'Welcome to SessionPilot Ops! 🎉 From today all daily checklists run through the app — check your Schedule tab each morning.',
        reactions: { thumbsUp: 4, heart: 2, smile: 0, celebrate: 3, laugh: 0, views: 12, comments: 0, commentList: [] }
      },
      {
        organization_id: ORG, location_id: LOC_LITTLE_ASIA, author_id: manager, is_important: false,
        content: 'Great job on yesterday\'s health inspection team — 100% pass! 🙌',
        image_url: '/dummy_image1.jpg',
        reactions: { thumbsUp: 7, heart: 5, smile: 2, celebrate: 6, laugh: 0, views: 21, comments: 0, commentList: [] }
      }
    ]);
    console.log('✓ sample posts');
  }
}

console.log('\nDemo accounts (password: Demo1234!)');
for (const u of USERS) console.log(`  ${u.role.padEnd(20)} ${u.email}`);
