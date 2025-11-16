// Phase 1: Fix Access Logs (Login) and Homepage Structure
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU';
const CREDENTIALS_PATH = path.join(__dirname, 'secrets', 'ysp-web-app-migration.json');

async function phase1Fixes() {
  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log('\n🚀 PHASE 1: Login Mechanism & Homepage Structure\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const actions = [];
    
    // ========== 1. FIX ACCESS LOGS (Login Mechanism) ==========
    console.log('📝 Step 1: Restructuring Access Logs...');
    
    // Get current data
    const accessLogsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Access Logs!A:K',
    });
    
    const accessLogsData = accessLogsResponse.data.values || [];
    const oldHeaders = accessLogsData[0] || [];
    
    // New structure for Access Logs
    const newAccessLogsHeaders = [
      'Timestamp',
      'Account Created',
      'Email',
      'ID Code',
      'Name',
      'Role',
      'Action',        // NEW: login, logout, page_view, etc.
      'ActionType',    // NEW: authentication, navigation, etc.
      'IP Address',    // NEW
      'Device',        // NEW
      'Status'         // NEW: success, failed, etc.
    ];
    
    // Transform old data to new structure
    const newAccessLogsData = [newAccessLogsHeaders];
    
    // Skip header row, process existing data
    for (let i = 1; i < accessLogsData.length; i++) {
      const row = accessLogsData[i];
      newAccessLogsData.push([
        row[0] || '',  // Timestamp
        row[1] || '',  // Account Created
        row[2] || '',  // Email
        row[3] || '',  // ID Code
        row[4] || '',  // Name
        row[5] || '',  // Role
        'login',       // Action (default from old data)
        'authentication', // ActionType
        '',            // IP Address (empty for old records)
        '',            // Device (empty for old records)
        'success'      // Status (assume success for old records)
      ]);
    }
    
    // Clear and rewrite Access Logs
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Access Logs!A:Z',
    });
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Access Logs!A1',
      valueInputOption: 'RAW',
      resource: { values: newAccessLogsData },
    });
    
    console.log(`   ✅ Access Logs restructured (${newAccessLogsData.length - 1} records migrated)`);
    actions.push({
      sheet: 'Access Logs',
      action: 'Restructured',
      oldColumns: oldHeaders.length,
      newColumns: newAccessLogsHeaders.length,
      recordsMigrated: newAccessLogsData.length - 1
    });
    
    // ========== 2. FIX HOMEPAGE CONTENT ==========
    console.log('\n📝 Step 2: Updating Homepage Content...');
    
    const homepageResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Homepage Content!A:B',
    });
    
    const homepageData = homepageResponse.data.values || [];
    
    // Add UpdatedAt column
    const newHomepageData = [
      ['Key', 'Value', 'UpdatedAt']
    ];
    
    const now = new Date().toISOString();
    for (let i = 1; i < homepageData.length; i++) {
      const row = homepageData[i];
      newHomepageData.push([
        row[0] || '',
        row[1] || '',
        row[2] || now  // Add timestamp
      ]);
    }
    
    // Add social media fields if not present
    const existingKeys = homepageData.slice(1).map(row => row[0]);
    const socialFields = [
      'facebook_url',
      'instagram_url',
      'twitter_url',
      'linkedin_url',
      'youtube_url',
      'tiktok_url'
    ];
    
    socialFields.forEach(key => {
      if (!existingKeys.includes(key)) {
        newHomepageData.push([key, '', now]);
      }
    });
    
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Homepage Content!A:Z',
    });
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Homepage Content!A1',
      valueInputOption: 'RAW',
      resource: { values: newHomepageData },
    });
    
    console.log(`   ✅ Homepage Content updated (${newHomepageData.length - 1} entries)`);
    actions.push({
      sheet: 'Homepage Content',
      action: 'Updated',
      addedColumn: 'UpdatedAt',
      addedSocialLinks: 6,
      totalEntries: newHomepageData.length - 1
    });
    
    // ========== 3. CREATE HOMEPAGE_PROJECTS ==========
    console.log('\n📝 Step 3: Creating Homepage_Projects sheet...');
    
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: 'Homepage_Projects',
                gridProperties: {
                  rowCount: 100,
                  columnCount: 7
                }
              }
            }
          }]
        }
      });
      
      const projectHeaders = [
        ['Project ID', 'Title', 'Description', 'ImageURL', 'Link', 'LinkText', 'Active']
      ];
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Homepage_Projects!A1',
        valueInputOption: 'RAW',
        resource: { values: projectHeaders },
      });
      
      console.log('   ✅ Homepage_Projects created');
      actions.push({
        sheet: 'Homepage_Projects',
        action: 'Created',
        columns: 7
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Homepage_Projects already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // ========== 4. CREATE HOME_DEVINFO ==========
    console.log('\n📝 Step 4: Creating Home_DevInfo sheet...');
    
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: 'Home_DevInfo',
                gridProperties: {
                  rowCount: 100,
                  columnCount: 10
                }
              }
            }
          }]
        }
      });
      
      const devHeaders = [
        ['Dev ID', 'Name', 'Role', 'Bio', 'ProfilePictureURL', 'GitHub', 'LinkedIn', 'Twitter', 'Email', 'Active']
      ];
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Home_DevInfo!A1',
        valueInputOption: 'RAW',
        resource: { values: devHeaders },
      });
      
      console.log('   ✅ Home_DevInfo created');
      actions.push({
        sheet: 'Home_DevInfo',
        action: 'Created',
        columns: 10
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Home_DevInfo already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // ========== 5. CREATE HOME_FOUNDERINFO ==========
    console.log('\n📝 Step 5: Creating Home_FounderInfo sheet...');
    
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: 'Home_FounderInfo',
                gridProperties: {
                  rowCount: 100,
                  columnCount: 10
                }
              }
            }
          }]
        }
      });
      
      const founderHeaders = [
        ['Founder ID', 'Name', 'Role', 'Bio', 'ProfilePictureURL', 'Facebook', 'Instagram', 'LinkedIn', 'Email', 'Active']
      ];
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Home_FounderInfo!A1',
        valueInputOption: 'RAW',
        resource: { values: founderHeaders },
      });
      
      console.log('   ✅ Home_FounderInfo created');
      actions.push({
        sheet: 'Home_FounderInfo',
        action: 'Created',
        columns: 10
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Home_FounderInfo already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // ========== SAVE REPORT ==========
    const reportPath = path.join(__dirname, 'PHASE1_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      phase: 1,
      description: 'Login Mechanism & Homepage Structure',
      actions
    }, null, 2));
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ PHASE 1 COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📝 Report saved to: PHASE1_REPORT.json\n`);
    
    return actions;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

if (require.main === module) {
  phase1Fixes()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { phase1Fixes };
