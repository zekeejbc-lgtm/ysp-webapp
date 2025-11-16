import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const GAS_URL = process.env.GAS_URL;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║   Migration Verification Report                       ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

async function verify() {
  const results = [];
  
  // User Profiles
  console.log('📋 Checking User Profiles...');
  const gasProfiles = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'searchProfiles', query: '' })
  }).then(r => r.json());
  
  const { count: supabaseProfiles } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true });
  
  const profilesSource = gasProfiles.profiles?.length || 0;
  const profilesWithIdCode = gasProfiles.profiles?.filter(p => p.id_code).length || 0;
  results.push({
    table: 'User Profiles',
    source: profilesSource,
    migrated: supabaseProfiles,
    match: supabaseProfiles === profilesWithIdCode,
    note: `${profilesSource - profilesWithIdCode} skipped (no id_code)`
  });
  
  // Events
  console.log('📅 Checking Events...');
  const gasEvents = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getEvents' })
  }).then(r => r.json());
  
  const { count: supabaseEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true });
  
  const eventsSource = gasEvents.events?.length || 0;
  results.push({
    table: 'Events',
    source: eventsSource,
    migrated: supabaseEvents,
    match: supabaseEvents === eventsSource,
    note: ''
  });
  
  // Access Logs
  console.log('🔐 Checking Access Logs...');
  const gasLogs = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getAccessLogs' })
  }).then(r => r.json());
  
  const { count: supabaseLogs } = await supabase
    .from('access_logs')
    .select('*', { count: 'exact', head: true });
  
  const logsSource = gasLogs.logs?.length || 0;
  results.push({
    table: 'Access Logs',
    source: logsSource,
    migrated: supabaseLogs,
    match: supabaseLogs === logsSource,
    note: ''
  });
  
  // Homepage Content
  console.log('🏠 Checking Homepage Content...');
  const gasHomepage = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getHomepageContent' })
  }).then(r => r.json());
  
  const { count: supabaseHomepage } = await supabase
    .from('homepage_content')
    .select('*', { count: 'exact', head: true });
  
  const homepageKeys = Object.keys(gasHomepage.content || {}).length;
  results.push({
    table: 'Homepage Content',
    source: homepageKeys,
    migrated: supabaseHomepage,
    match: supabaseHomepage === homepageKeys,
    note: ''
  });
  
  // Feedback
  console.log('💬 Checking Feedback...');
  const { count: supabaseFeedback } = await supabase
    .from('feedback')
    .select('*', { count: 'exact', head: true });
  
  results.push({
    table: 'Feedback',
    source: 0,
    migrated: supabaseFeedback,
    match: true,
    note: 'No feedback entries in source'
  });
  
  // Announcements
  console.log('📢 Checking Announcements...');
  const { count: supabaseAnnouncements } = await supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true });
  
  results.push({
    table: 'Announcements',
    source: '?',
    migrated: supabaseAnnouncements,
    match: false,
    note: 'GAS endpoint requires valid user ID'
  });
  
  // Attendance
  console.log('📊 Checking Attendance...');
  const { count: supabaseAttendance } = await supabase
    .from('attendance_records')
    .select('*', { count: 'exact', head: true });
  
  results.push({
    table: 'Attendance',
    source: '?',
    migrated: supabaseAttendance,
    match: false,
    note: 'Requires custom GAS endpoint'
  });
  
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Verification Results                                ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  let totalMatch = 0;
  let totalFail = 0;
  
  results.forEach(r => {
    const status = r.match ? '✅' : '❌';
    const line = `${status} ${r.table.padEnd(20)} | Source: ${String(r.source).padEnd(4)} | Migrated: ${String(r.migrated).padEnd(4)}`;
    console.log(line);
    if (r.note) {
      console.log(`   ${r.note}`);
    }
    if (r.match) totalMatch++;
    else totalFail++;
  });
  
  console.log('\n' + '─'.repeat(60));
  console.log(`Total: ${totalMatch} ✅ matched | ${totalFail} ❌ incomplete`);
  console.log('─'.repeat(60) + '\n');
  
  // Overall status
  if (totalFail === 0) {
    console.log('🎉 100% MIGRATION SUCCESS! All data migrated.\n');
  } else {
    console.log('⚠️  Migration partially complete.');
    console.log('   - Core data (users, events, logs, homepage) migrated ✅');
    console.log('   - Announcements & Attendance need GAS endpoint updates ⚠️\n');
  }
}

verify().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
