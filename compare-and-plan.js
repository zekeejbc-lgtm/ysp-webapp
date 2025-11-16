// Compare actual spreadsheet structure against Setup_Sheet_Mappings.gs expectations
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU';
const CREDENTIALS_PATH = path.join(__dirname, 'secrets', 'ysp-web-app-migration.json');

// Expected headers from Setup_Sheet_Mappings.gs
const EXPECTED_STRUCTURE = {
  'User Profiles': [
    'Timestamp', 'Email Address', 'Data Privacy Agreement', 'Full name', 'Date of Birth', 'Age',
    'Sex/Gender', 'Pronouns', 'Civil Status', 'Contact Number', 'Religion', 'Nationality',
    'Personal Email Address', 'Username', 'Password', 'Data Privacy Acknowledgment',
    'Declaration of Truthfulness and Responsibility', 'Data Collection Agreement',
    'ID Code', 'Position', 'Role', 'ProfilePictureURL', 'Status', 'Committee', 'Notes', 'Last Updated'
  ],
  'Access Logs': [
    'Timestamp', 'Account Created', 'Email', 'ID Code', 'Name', 'Role', 'Action', 'ActionType',
    'IP Address', 'Device', 'Status'
  ],
  'Master Attendance Log': [
    'ID Code', 'Name', 'Position', 'ID number'
    // Note: Event blocks (E→) are dynamic and not validated
  ],
  'Events Control': [
    'Event ID', 'Name', 'Date', 'Start Time', 'End Time', 'Status', 'Created By', 'Notes'
  ],
  'Announcements': [
    'Timestamp', 'Announcement ID', 'Author ID Code', 'Author Name', 'Title', 'Subject', 'Body',
    'Recipient Type', 'Recipient Value', 'Email Status', 'Priority', 'Category', 'IsPinned',
    'ImageURL_1', 'ImageURL_2', 'ImageURL_3'
    // Note: Dynamic read-status columns (U→) are not expected in fixed structure
  ],
  'Feedback': [
    'Feedback ID', 'Timestamp', 'Author', 'Author ID Code', 'Feedback', 'Reply Timestamp',
    'Replier', 'Replier ID', 'Reply', 'Anonymous', 'Category', 'Image URL', 'Status',
    'Visibility', 'Notes', 'Email', 'Rating', 'Reference'
  ],
  'Homepage_Content': [
    'Key', 'Value', 'UpdatedAt'
  ],
  'Homepage_Projects': [
    'Project ID', 'Title', 'Description', 'ImageURL', 'Link', 'LinkText', 'Active'
  ],
  'Donations': [
    'Donation ID', 'Timestamp', 'Donor Name', 'Contact', 'Amount', 'Payment Method', 'Campaign',
    'Reference Number', 'Receipt URL', 'Status', 'Notes', 'Verified By'
  ],
  'Donation_Campaigns': [
    'Campaign ID', 'Name', 'Description', 'Target Amount', 'Current Amount', 'Start Date',
    'End Date', 'Status'
  ],
  'Donation_Settings': [
    'ID', 'Method', 'QR Image URL', 'Account Name/Number', 'Active'
  ],
  'Member_Applications': [
    'Application ID', 'Date Applied', 'Status', 'Full Name', 'Email', 'Phone', 'Address',
    'Date of Birth', 'Age', 'Gender', 'Civil Status', 'Nationality', 'Chapter',
    'Committee Preference', 'Desired Role', 'Skills', 'Education', 'Certifications',
    'Experience', 'Achievements', 'Volunteer History', 'Reason For Joining',
    'Personal Statement', 'Emergency Contact Name', 'Emergency Contact Relation',
    'Emergency Contact Number', 'Facebook', 'Instagram', 'Twitter', 'Profile Picture URL',
    'Attachments (JSON)', 'Reviewed By', 'Reviewed At', 'Decision Notes',
    'Converted To Member', 'Created Member ID Code', 'Created Username', 'Created Role',
    'Created Position', 'Created Committee', 'Created Notes'
  ],
  'Polls': [
    'Poll ID', 'Title', 'Description', 'Type', 'Status', 'Visibility', 'Created By',
    'Created By Role', 'Created At', 'Updated At', 'Deadline', 'Open Forever',
    'Target Audience', 'Allow Edit After Submit', 'Allow Multiple Submissions',
    'Anonymous Responses', 'Show Results To Participants', 'Account Only Submissions',
    'IP Lock', 'Device Lock', 'Requires Approval', 'Theme JSON'
  ],
  'Poll_Questions': [
    'Poll ID', 'Question ID', 'Order', 'Type', 'Text', 'Help Text', 'Required',
    'Options JSON', 'Validation JSON', 'Allow Other', 'Max Files', 'Max Size (MB)',
    'Matrix Rows JSON', 'Matrix Cols JSON'
  ],
  'Poll_Responses': [
    'Response ID', 'Poll ID', 'Respondent ID Code', 'Respondent Name', 'Timestamp',
    'Device', 'IP Address', 'Status', 'Score', 'Result Visibility', 'Answers JSON',
    'Reviewer', 'Reviewed At', 'Notes'
  ]
};

// Sheet name variations to check
const SHEET_VARIANTS = {
  'User Profiles': ['User Profiles', 'User_Profiles'],
  'Access Logs': ['Access Logs', 'Access_Logs'],
  'Master Attendance Log': ['Master Attendance Log', 'Master_Attendance_Log'],
  'Events Control': ['Events Control', 'Events_Control'],
  'Announcements': ['Announcements'],
  'Feedback': ['Feedback'],
  'Homepage_Content': ['Homepage_Content', 'Homepage Content'],
  'Homepage_Projects': ['Homepage_Projects', 'Homepage Projects'],
  'Donations': ['Donations'],
  'Donation_Campaigns': ['Donation_Campaigns', 'Donation Campaigns'],
  'Donation_Settings': ['Donation_Settings', 'Donation Settings'],
  'Member_Applications': ['Member_Applications', 'Member Applications'],
  'Polls': ['Polls'],
  'Poll_Questions': ['Poll_Questions', 'Poll Questions'],
  'Poll_Responses': ['Poll_Responses', 'Poll Responses']
};

function normalizeHeader(header) {
  return (header || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

function compareHeaders(actual, expected, options = {}) {
  const { mode = 'exact' } = options;
  
  // Normalize for comparison
  const actualNorm = actual.map(normalizeHeader);
  const expectedNorm = expected.map(normalizeHeader);
  
  const missing = [];
  const extras = [];
  const outOfOrder = [];
  const closeMatches = [];
  
  // For prefix-only mode (Master Attendance), only check first N columns
  const checkExpected = mode === 'prefix-only' ? expected : expected;
  
  // Find missing headers
  checkExpected.forEach((exp, idx) => {
    const expNorm = normalizeHeader(exp);
    const actualIdx = actualNorm.indexOf(expNorm);
    
    if (actualIdx === -1) {
      // Check for close matches
      const similar = actual.filter(a => {
        const aNorm = normalizeHeader(a);
        return aNorm.includes(expNorm.substring(0, 10)) || expNorm.includes(aNorm.substring(0, 10));
      });
      
      if (similar.length > 0) {
        closeMatches.push({ expected: exp, actual: similar[0], expectedIndex: idx });
      } else {
        missing.push({ header: exp, expectedIndex: idx });
      }
    } else if (mode !== 'prefix-only' && actualIdx !== idx) {
      outOfOrder.push({ header: exp, expectedIndex: idx, actualIndex: actualIdx });
    }
  });
  
  // Find extra headers (not in expected)
  if (mode !== 'prefix-only') {
    actual.forEach((act, idx) => {
      const actNorm = normalizeHeader(act);
      if (!expectedNorm.includes(actNorm) && actNorm) {
        extras.push({ header: act, actualIndex: idx });
      }
    });
  }
  
  return { missing, extras, outOfOrder, closeMatches };
}

async function compareStructure() {
  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log('\n🔍 COMPARING SPREADSHEET STRUCTURE\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const metadata = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const existingSheets = metadata.data.sheets.map(s => s.properties.title);
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalExpected: Object.keys(EXPECTED_STRUCTURE).length,
        totalActual: existingSheets.length,
        sheetsWithIssues: 0,
        missingSheets: 0,
        totalMissingHeaders: 0,
        totalExtraHeaders: 0,
        totalOutOfOrder: 0,
        totalCloseMatches: 0
      },
      sheets: []
    };
    
    for (const [expectedName, expectedHeaders] of Object.entries(EXPECTED_STRUCTURE)) {
      const variants = SHEET_VARIANTS[expectedName] || [expectedName];
      let actualSheet = null;
      let actualName = null;
      
      // Find the sheet (check all variants)
      for (const variant of variants) {
        if (existingSheets.includes(variant)) {
          actualName = variant;
          break;
        }
      }
      
      console.log(`\n📋 ${expectedName}`);
      console.log('─'.repeat(60));
      
      if (!actualName) {
        console.log('❌ SHEET NOT FOUND');
        console.log(`   Expected one of: ${variants.join(', ')}`);
        report.summary.missingSheets++;
        report.sheets.push({
          expectedName,
          status: 'MISSING',
          variants,
          issues: ['Sheet does not exist']
        });
        continue;
      }
      
      console.log(`✓ Found as: "${actualName}"`);
      
      // Get actual headers
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${actualName}'!1:1`,
      });
      
      const actualHeaders = response.data.values?.[0] || [];
      const mode = expectedName === 'Master Attendance Log' ? 'prefix-only' : 'exact';
      
      const comparison = compareHeaders(actualHeaders, expectedHeaders, { mode });
      const hasIssues = comparison.missing.length > 0 || 
                       comparison.extras.length > 0 || 
                       comparison.outOfOrder.length > 0 ||
                       comparison.closeMatches.length > 0;
      
      if (hasIssues) {
        report.summary.sheetsWithIssues++;
      }
      
      console.log(`   Columns: ${actualHeaders.length} actual vs ${expectedHeaders.length} expected`);
      
      const issues = [];
      
      if (comparison.missing.length > 0) {
        console.log(`\n   ❌ MISSING HEADERS (${comparison.missing.length}):`);
        comparison.missing.forEach(m => {
          const col = String.fromCharCode(65 + m.expectedIndex);
          console.log(`      ${col}: "${m.header}"`);
        });
        issues.push(`Missing ${comparison.missing.length} headers`);
        report.summary.totalMissingHeaders += comparison.missing.length;
      }
      
      if (comparison.closeMatches.length > 0) {
        console.log(`\n   ⚠️  CLOSE MATCHES (${comparison.closeMatches.length}):`);
        comparison.closeMatches.forEach(m => {
          const col = String.fromCharCode(65 + m.expectedIndex);
          console.log(`      ${col}: Expected "${m.expected}"`);
          console.log(`          Got "${m.actual}"`);
        });
        issues.push(`${comparison.closeMatches.length} headers with slight differences`);
        report.summary.totalCloseMatches += comparison.closeMatches.length;
      }
      
      if (comparison.extras.length > 0 && mode !== 'prefix-only') {
        console.log(`\n   ℹ️  EXTRA HEADERS (${comparison.extras.length}):`);
        comparison.extras.slice(0, 5).forEach(e => {
          const col = String.fromCharCode(65 + e.actualIndex);
          console.log(`      ${col}: "${e.header}"`);
        });
        if (comparison.extras.length > 5) {
          console.log(`      ... and ${comparison.extras.length - 5} more`);
        }
        issues.push(`${comparison.extras.length} extra headers`);
        report.summary.totalExtraHeaders += comparison.extras.length;
      }
      
      if (comparison.outOfOrder.length > 0) {
        console.log(`\n   🔄 OUT OF ORDER (${comparison.outOfOrder.length}):`);
        comparison.outOfOrder.slice(0, 3).forEach(o => {
          const expCol = String.fromCharCode(65 + o.expectedIndex);
          const actCol = String.fromCharCode(65 + o.actualIndex);
          console.log(`      "${o.header}" at ${actCol}, expected at ${expCol}`);
        });
        if (comparison.outOfOrder.length > 3) {
          console.log(`      ... and ${comparison.outOfOrder.length - 3} more`);
        }
        issues.push(`${comparison.outOfOrder.length} headers out of order`);
        report.summary.totalOutOfOrder += comparison.outOfOrder.length;
      }
      
      if (!hasIssues) {
        console.log('   ✅ ALL HEADERS MATCH PERFECTLY');
      }
      
      report.sheets.push({
        expectedName,
        actualName,
        status: hasIssues ? 'HAS_ISSUES' : 'OK',
        mode,
        actualColumns: actualHeaders.length,
        expectedColumns: expectedHeaders.length,
        issues,
        missing: comparison.missing,
        extras: comparison.extras,
        outOfOrder: comparison.outOfOrder,
        closeMatches: comparison.closeMatches
      });
    }
    
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Expected Sheets: ${report.summary.totalExpected}`);
    console.log(`Missing Sheets: ${report.summary.missingSheets}`);
    console.log(`Sheets with Issues: ${report.summary.sheetsWithIssues}`);
    console.log(`Total Missing Headers: ${report.summary.totalMissingHeaders}`);
    console.log(`Total Close Matches: ${report.summary.totalCloseMatches}`);
    console.log(`Total Extra Headers: ${report.summary.totalExtraHeaders}`);
    console.log(`Total Out of Order: ${report.summary.totalOutOfOrder}`);
    
    // Save report
    const reportPath = path.join(__dirname, 'STRUCTURE_COMPARISON.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n✅ Detailed report saved to: STRUCTURE_COMPARISON.json\n`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

if (require.main === module) {
  compareStructure()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { compareStructure };
