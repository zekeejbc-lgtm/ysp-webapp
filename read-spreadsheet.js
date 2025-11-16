// Read and analyze Google Spreadsheet structure using service account
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Configuration
const SPREADSHEET_ID = '1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU';
const CREDENTIALS_PATH = path.join(__dirname, 'secrets', 'ysp-web-app-migration.json');

async function readSpreadsheet() {
  try {
    // Load service account credentials
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    
    // Authenticate with Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log('\n📊 Reading spreadsheet structure...\n');
    
    // Get spreadsheet metadata
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    console.log(`Spreadsheet: ${metadata.data.properties.title}`);
    console.log(`Total Sheets: ${metadata.data.sheets.length}\n`);
    
    const report = {
      spreadsheetTitle: metadata.data.properties.title,
      sheets: []
    };
    
    // Read each sheet
    for (const sheet of metadata.data.sheets) {
      const sheetName = sheet.properties.title;
      const sheetId = sheet.properties.sheetId;
      
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📄 Sheet: ${sheetName} (ID: ${sheetId})`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      
      // Get headers (first row)
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${sheetName}'!1:1`,
      });
      
      const headers = response.data.values?.[0] || [];
      
      // Get row count
      const dataResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${sheetName}'!A:A`,
      });
      
      const rowCount = dataResponse.data.values?.length || 0;
      
      console.log(`Total Rows: ${rowCount}`);
      console.log(`Total Columns: ${headers.length}`);
      console.log(`\nHeaders (${headers.length}):`);
      
      headers.forEach((header, index) => {
        const colLetter = String.fromCharCode(65 + (index % 26));
        console.log(`  ${colLetter}: ${header}`);
      });
      
      // Add to report
      report.sheets.push({
        name: sheetName,
        id: sheetId,
        rowCount,
        columnCount: headers.length,
        headers: headers
      });
    }
    
    // Save report to JSON
    const reportPath = path.join(__dirname, 'SPREADSHEET_ANALYSIS.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n\n✅ Analysis complete!`);
    console.log(`📝 Full report saved to: SPREADSHEET_ANALYSIS.json\n`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Error reading spreadsheet:', error.message);
    if (error.code === 'ENOENT') {
      console.error(`\n⚠️  Credentials file not found at: ${CREDENTIALS_PATH}`);
    } else if (error.code === 403) {
      console.error('\n⚠️  Permission denied. Make sure the service account has access to the spreadsheet.');
      console.error(`   Share the spreadsheet with: ysp-migrator@ysp-web-app-migration.iam.gserviceaccount.com`);
    }
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  readSpreadsheet()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { readSpreadsheet };
