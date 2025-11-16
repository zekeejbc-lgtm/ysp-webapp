#!/usr/bin/env node
/**
 * YSP Google Sheets → Supabase Migration Script
 * 
 * This script migrates data from Google Sheets (via GAS backend) to Supabase.
 * 
 * Usage:
 *   npm run migrate              # Migrate all tables
 *   npm run migrate:dry-run      # Test migration without inserting
 *   npm run migrate:users        # Migrate only user_profiles
 *   node migrate.js --table=events --batch-size=100
 * 
 * Environment Variables:
 *   SUPABASE_URL                 # Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY    # Service role key (bypasses RLS)
 *   GAS_URL                      # Google Apps Script deployment URL
 *   BATCH_SIZE                   # Number of records per batch (default: 50)
 *   DRY_RUN                      # If true, don't insert data (default: false)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

// ============================================
// CONFIGURATION
// ============================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GAS_URL = process.env.GAS_URL;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '50', 10);
const DRY_RUN = process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Fetch data from Google Apps Script backend
 */
async function fetchFromGAS(action, payload = {}) {
  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload })
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(`GAS API Error: ${data.message}`);
  }
  
  return data;
}

/**
 * Parse date from various formats
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Parse status from Time IN field
 */
function parseAttendanceStatus(timeIn) {
  if (!timeIn || timeIn.toString().trim() === '') return 'Not Recorded';
  const timeInStr = timeIn.toString();
  if (timeInStr.includes(' - ')) {
    return timeInStr.split(' - ')[0].trim(); // Present, Late, Absent, Excused
  }
  return timeInStr.trim();
}

/**
 * Insert data in batches
 */
async function insertBatch(table, records, options = {}) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would insert ${records.length} records into ${table}`);
    return { count: records.length, errors: [] };
  }
  
  let query;
  
  if (options.onConflict) {
    // Use upsert for conflict handling
    query = supabase.from(table).upsert(records, {
      onConflict: options.onConflict,
      ignoreDuplicates: options.ignoreDuplicates || false
    });
  } else {
    query = supabase.from(table).insert(records);
  }
  
  const { data, error } = await query.select();
  
  if (error) {
    console.error(`❌ Error inserting into ${table}:`, error.message);
    return { count: 0, errors: [error] };
  }
  
  return { count: data?.length || records.length, errors: [] };
}

/**
 * Sleep for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// MIGRATION FUNCTIONS
// ============================================

/**
 * Migrate User Profiles
 */
async function migrateUserProfiles() {
  console.log('\n📋 Migrating User Profiles...');
  
  try {
    // Fetch all user profiles via GAS searchProfiles
    const response = await fetchFromGAS('searchProfiles', { search: '' });
    const profiles = response.profiles || [];
    
    console.log(`Found ${profiles.length} user profiles`);
    
    const records = profiles.map(p => ({
      id_code: (p.idCode || '').trim(),
      username: (p.fullName || '').trim(), // Using fullName as username since sheet doesn't expose username via searchProfiles
      password_hash: '', // Will need to be set separately or use GAS getUserProfile
      full_name: (p.fullName || '').trim(),
      email: (p.email || '').trim(),
      personal_email: (p.email || '').trim(),
      date_of_birth: parseDate(p.birthday),
      age: p.age || null,
      gender: (p.gender || '').trim(),
      civil_status: (p.civilStatus || '').trim(),
      contact_number: (p.contact || '').trim(),
      religion: (p.religion || '').trim(),
      nationality: (p.nationality || '').trim(),
      position: (p.position || '').trim(),
      role: 'Member', // Default, will update via getUserProfile
      profile_picture_url: (p.profilePic || '').trim(),
      created_at: new Date().toISOString()
    })).filter(r => r.id_code); // Only include records with ID code
    
    // Insert in batches
    let inserted = 0;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const result = await insertBatch('user_profiles', batch, { onConflict: 'id_code' });
      inserted += result.count;
      console.log(`  ✓ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${result.count} records`);
      await sleep(500); // Rate limiting
    }
    
    console.log(`✅ User Profiles: ${inserted}/${records.length} migrated\n`);
    return { total: records.length, inserted };
    
  } catch (error) {
    console.error('❌ User Profiles migration failed:', error.message);
    return { total: 0, inserted: 0, error };
  }
}

/**
 * Migrate Events from Master Attendance Log header
 */
async function migrateEvents() {
  console.log('\n📅 Migrating Events...');
  
  try {
    const response = await fetchFromGAS('getEvents');
    const events = response.events || [];
    
    console.log(`Found ${events.length} events`);
    
    const records = events.map(e => ({
      event_id: (e.id || '').toString(),
      name: (e.name || '').trim(),
      date: parseDate(e.date),
      time_in: (e.timeIn || 'Time IN').trim(),
      time_out: (e.timeOut || 'Time OUT').trim(),
      status: (e.status || 'Active').trim(),
      created_at: new Date().toISOString()
    })).filter(r => r.event_id);
    
    let inserted = 0;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const result = await insertBatch('events', batch, { onConflict: 'event_id' });
      inserted += result.count;
      console.log(`  ✓ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${result.count} records`);
      await sleep(500);
    }
    
    console.log(`✅ Events: ${inserted}/${records.length} migrated\n`);
    return { total: records.length, inserted };
    
  } catch (error) {
    console.error('❌ Events migration failed:', error.message);
    return { total: 0, inserted: 0, error };
  }
}

/**
 * Migrate Attendance Records (complex - requires parsing Master Attendance Log)
 */
async function migrateAttendance() {
  console.log('\n📊 Migrating Attendance Records...');
  
  try {
    // Use migration-specific endpoint
    const response = await fetchFromGAS('getAllAttendanceForMigration', {});
    const attendanceRecords = response.attendance || [];
    
    console.log(`Found ${attendanceRecords.length} attendance records (${response.events_found} events)`);
    
    const records = attendanceRecords.map(a => ({
      id_code: (a.id_code || '').trim(),
      name: (a.name || '').trim(),
      position: (a.position || '').trim(),
      id_number: (a.id_number || '').trim(),
      event_id: (a.event_id || '').trim(),
      time_in: (a.time_in || '').trim(),
      time_out: (a.time_out || '').trim(),
      status: (a.status || 'Not Recorded').trim(),
      created_at: new Date().toISOString()
    })).filter(r => r.id_code && r.event_id);
    
    let inserted = 0;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const result = await insertBatch('attendance_records', batch);
      inserted += result.count;
      console.log(`  ✓ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${result.count} records`);
      await sleep(500);
    }
    
    console.log(`✅ Attendance: ${inserted}/${records.length} migrated\n`);
    return { total: records.length, inserted };
    
  } catch (error) {
    console.error('❌ Attendance migration failed:', error.message);
    return { total: 0, inserted: 0, error };
  }
}

/**
 * Migrate Access Logs
 */
async function migrateAccessLogs() {
  console.log('\n🔐 Migrating Access Logs...');
  
  try {
    const response = await fetchFromGAS('getAccessLogs');
    const logs = response.logs || [];
    
    console.log(`Found ${logs.length} access logs`);
    
    const records = logs.map(log => ({
      timestamp: parseDate(log.timestamp) || new Date().toISOString(),
      id_code: (log.idCode || '').trim(),
      name: (log.name || '').trim(),
      role: (log.role || '').trim(),
      created_at: new Date().toISOString()
    }));
    
    let inserted = 0;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const result = await insertBatch('access_logs', batch);
      inserted += result.count;
      console.log(`  ✓ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${result.count} records`);
      await sleep(500);
    }
    
    console.log(`✅ Access Logs: ${inserted}/${records.length} migrated\n`);
    return { total: records.length, inserted };
    
  } catch (error) {
    console.error('❌ Access Logs migration failed:', error.message);
    return { total: 0, inserted: 0, error };
  }
}

/**
 * Migrate Announcements
 */
async function migrateAnnouncements() {
  console.log('\n📢 Migrating Announcements...');
  
  try {
    // Use migration-specific endpoint (no user filtering)
    const response = await fetchFromGAS('getAllAnnouncementsForMigration', {});
    const announcements = response.announcements || [];
    
    console.log(`Found ${announcements.length} announcements`);
    
    const records = announcements.map(a => ({
      announcement_id: (a.announcement_id || '').trim(),
      author_id_code: (a.author_id_code || '').trim(),
      author_name: (a.author_name || '').trim(),
      title: (a.title || '').trim(),
      subject: (a.subject || '').trim(),
      body: (a.body || '').trim(),
      recipient_type: (a.recipient_type || '').trim(),
      recipient_value: (a.recipient_value || '').trim(),
      email_status: (a.email_status || '').trim(),
      timestamp: parseDate(a.timestamp) || new Date().toISOString(),
      created_at: new Date().toISOString()
    })).filter(r => r.announcement_id);
    
    let inserted = 0;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const result = await insertBatch('announcements', batch, { onConflict: 'announcement_id' });
      inserted += result.count;
      console.log(`  ✓ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${result.count} records`);
      await sleep(500);
    }
    
    console.log(`✅ Announcements: ${inserted}/${records.length} migrated\n`);
    return { total: records.length, inserted };
    
  } catch (error) {
    console.error('❌ Announcements migration failed:', error.message);
    return { total: 0, inserted: 0, error };
  }
}

/**
 * Migrate Feedback
 */
async function migrateFeedback() {
  console.log('\n💬 Migrating Feedback...');
  
  try {
    // Get feedback requires a user ID; use a test ID
    const response = await fetchFromGAS('getFeedback', { idCode: 'GUEST' });
    const feedbackList = response.feedback || [];
    
    console.log(`Found ${feedbackList.length} feedback entries`);
    
    const records = feedbackList.map(f => ({
      feedback_id: (f.id || '').trim(),
      author: (f.author || '').trim(),
      author_id_code: (f.authorId || '').trim(),
      feedback_text: (f.feedback || f.message || '').trim(),
      image_url: (f.imageUrl || '').trim(),
      reply_timestamp: parseDate(f.replyTimestamp),
      replier: (f.replier || '').trim(),
      replier_id: (f.replierId || '').trim(),
      reply: (f.reply || '').trim(),
      anonymous: f.anonymous === true || f.anonymous === 'true',
      category: (f.category || '').trim(),
      status: (f.status || '').trim(),
      visibility: (f.visibility || '').trim(),
      notes: (f.notes || '').trim(),
      timestamp: parseDate(f.timestamp) || new Date().toISOString(),
      created_at: new Date().toISOString()
    })).filter(r => r.author || r.feedback_text);
    
    let inserted = 0;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const result = await insertBatch('feedback', batch);
      inserted += result.count;
      console.log(`  ✓ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${result.count} records`);
      await sleep(500);
    }
    
    console.log(`✅ Feedback: ${inserted}/${records.length} migrated\n`);
    return { total: records.length, inserted };
    
  } catch (error) {
    console.error('❌ Feedback migration failed:', error.message);
    return { total: 0, inserted: 0, error };
  }
}

/**
 * Migrate Homepage Content
 */
async function migrateHomepageContent() {
  console.log('\n🏠 Migrating Homepage Content...');
  
  try {
    const response = await fetchFromGAS('getHomepageContent');
    const content = response.content || {};
    
    // Convert content object to key-value pairs
    const records = [];
    
    // Direct fields
    const directFields = [
      'membership_URL', 'motto', 'vision', 'mission', 
      'orgChartUrl', 'facebookUrl', 'email', 'phone', 
      'founderName', 'about'
    ];
    
    directFields.forEach(key => {
      if (content[key]) {
        records.push({
          key,
          value: content[key].toString(),
          created_at: new Date().toISOString()
        });
      }
    });
    
    // Objectives (array → single value)
    if (content.objectives && content.objectives.length > 0) {
      records.push({
        key: 'Section 3. YSP shall be guided by the following advocacy pillars:',
        value: content.objectives[0],
        created_at: new Date().toISOString()
      });
    }
    
    // Projects (convert to individual keys)
    if (content.projects && Array.isArray(content.projects)) {
      content.projects.forEach(project => {
        const n = project.number;
        if (project.title) {
          records.push({ key: `projectTitle_${n}`, value: project.title, created_at: new Date().toISOString() });
        }
        if (project.image) {
          records.push({ key: `projectImageUrl_${n}`, value: project.image, created_at: new Date().toISOString() });
        }
        if (project.description) {
          records.push({ key: `projectDesc_${n}`, value: project.description, created_at: new Date().toISOString() });
        }
        if (project.link) {
          records.push({ key: `projectLinkURL_${n}`, value: project.link, created_at: new Date().toISOString() });
        }
      });
    }
    
    console.log(`Found ${records.length} homepage content keys`);
    
    let inserted = 0;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const result = await insertBatch('homepage_content', batch, { onConflict: 'key' });
      inserted += result.count;
      console.log(`  ✓ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${result.count} records`);
      await sleep(500);
    }
    
    console.log(`✅ Homepage Content: ${inserted}/${records.length} migrated\n`);
    return { total: records.length, inserted };
    
  } catch (error) {
    console.error('❌ Homepage Content migration failed:', error.message);
    return { total: 0, inserted: 0, error };
  }
}

// ============================================
// MAIN MIGRATION ORCHESTRATOR
// ============================================

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   YSP Google Sheets → Supabase Migration Tool            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No data will be inserted\n');
  }
  
  console.log(`📊 Configuration:`);
  console.log(`   - Supabase URL: ${SUPABASE_URL}`);
  console.log(`   - GAS URL: ${GAS_URL}`);
  console.log(`   - Batch Size: ${BATCH_SIZE}`);
  console.log('');
  
  const startTime = Date.now();
  const results = {};
  
  // Parse command line args for specific table
  const args = process.argv.slice(2);
  const tableArg = args.find(arg => arg.startsWith('--table='));
  const specificTable = tableArg ? tableArg.split('=')[1] : null;
  
  if (specificTable) {
    console.log(`🎯 Migrating only: ${specificTable}\n`);
  } else {
    console.log(`🎯 Migrating all tables\n`);
  }
  
  // Run migrations
  if (!specificTable || specificTable === 'user_profiles') {
    results.userProfiles = await migrateUserProfiles();
  }
  
  if (!specificTable || specificTable === 'events') {
    results.events = await migrateEvents();
  }
  
  if (!specificTable || specificTable === 'access_logs') {
    results.accessLogs = await migrateAccessLogs();
  }
  
  if (!specificTable || specificTable === 'announcements') {
    results.announcements = await migrateAnnouncements();
  }
  
  if (!specificTable || specificTable === 'feedback') {
    results.feedback = await migrateFeedback();
  }
  
  if (!specificTable || specificTable === 'homepage_content') {
    results.homepageContent = await migrateHomepageContent();
  }
  
  if (!specificTable || specificTable === 'attendance') {
    results.attendance = await migrateAttendance();
  }
  
  // Summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Migration Summary                                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  Object.entries(results).forEach(([table, result]) => {
    const status = result.skipped ? '⏭️  SKIPPED' : result.error ? '❌ FAILED' : '✅ SUCCESS';
    console.log(`${status} ${table}: ${result.inserted || 0}/${result.total || 0} records`);
  });
  
  console.log(`\n⏱️  Total time: ${duration}s\n`);
  
  if (DRY_RUN) {
    console.log('ℹ️  This was a dry run. Re-run without --dry-run to insert data.\n');
  }
}

// Run migration
main().catch(console.error);
