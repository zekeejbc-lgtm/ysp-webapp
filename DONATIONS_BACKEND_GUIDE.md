# Donations Backend Implementation Guide

## Overview
This guide provides the complete backend implementation for the Donations feature, including Google Apps Script endpoints, Sheets schema, and image upload handling.

## Google Sheets Setup

### Sheet Name: `Donations`

#### Columns (A-L):
1. **Donation ID** (A) - Auto-generated unique ID (e.g., `DON-001`)
2. **Timestamp** (B) - Date/time of submission
3. **Donor Name** (C) - Full name of donor
4. **Contact** (D) - Email or phone number
5. **Amount** (E) - Donation amount in PHP
6. **Payment Method** (F) - GCash, PayMaya, Bank Transfer, Cash, Other
7. **Campaign** (G) - Campaign name (e.g., General Fund, Youth Leadership Training)
8. **Reference Number** (H) - Payment reference/transaction number
9. **Receipt URL** (I) - Google Drive link to uploaded receipt image
10. **Status** (J) - Pending, Verified, Completed, Cancelled
11. **Notes** (K) - Optional donor message
12. **Verified By** (L) - Admin/Auditor who verified (user ID or name)

### Sheet Name: `Donation_Campaigns`

#### Columns (A-H):
1. **Campaign ID** (A) - Unique ID (e.g., `CAMP-001`)
2. **Name** (B) - Campaign name
3. **Description** (C) - Campaign description
4. **Target Amount** (D) - Target amount in PHP
5. **Current Amount** (E) - Current total (formula: `=SUMIF(Donations!G:G,A2,Donations!E:E)`)
6. **Start Date** (F) - Campaign start date
7. **End Date** (G) - Campaign end date
8. **Status** (H) - Active, Completed, Cancelled

### Sheet Name: `Donation_Settings`

#### Columns (A-E):
1. **Setting Key** (A) - Unique key (e.g., `gcash_qr`, `paymaya_qr`)
2. **Method** (B) - Payment method (GCash, PayMaya)
3. **QR Image URL** (C) - Google Drive link to QR code image
4. **Account Name** (D) - Account holder name
5. **Active** (E) - TRUE/FALSE

#### Initial Rows:
```
gcash_qr    | GCash   | [DRIVE_URL] | YSP Tagum Chapter | TRUE
paymaya_qr  | PayMaya | [DRIVE_URL] | YSP Tagum Chapter | TRUE
```

## Google Drive Folder Structure

Create a folder structure in your Google Drive:
```
YSP Assets/
└── Donations/
    ├── QR_Codes/          (for GCash/PayMaya QR images)
    └── Receipts/          (for donor receipt uploads)
        └── 2025/          (organized by year)
            └── October/   (organized by month)
```

**Important:** Make sure to set sharing permissions:
- QR_Codes folder: Anyone with link can view
- Receipts folder: Restricted (only Admins/Auditors)

## Google Apps Script Implementation

### 1. Add Donations Endpoints to Code.gs

```javascript
// ============================================
// DONATIONS API ENDPOINTS
// ============================================

/**
 * Get active donation campaigns
 */
function getDonationCampaigns() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Donation_Campaigns');
    
    if (!sheet) {
      return createResponse(false, 'Donation_Campaigns sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const campaigns = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) { // If Campaign ID exists
        campaigns.push({
          id: row[0],
          name: row[1],
          description: row[2],
          targetAmount: parseFloat(row[3]) || 0,
          currentAmount: parseFloat(row[4]) || 0,
          startDate: row[5] ? formatDate(row[5]) : '',
          endDate: row[6] ? formatDate(row[6]) : '',
          status: row[7] || 'Active'
        });
      }
    }
    
    return createResponse(true, 'Campaigns retrieved', { campaigns });
  } catch (error) {
    Logger.log('Error in getDonationCampaigns: ' + error.toString());
    return createResponse(false, 'Failed to retrieve campaigns: ' + error.toString());
  }
}

/**
 * Get donation records (Admin/Auditor only)
 */
function getDonations(params) {
  try {
    const userId = params.userId;
    const userRole = getUserRole(userId);
    
    if (userRole !== 'Admin' && userRole !== 'Auditor') {
      return createResponse(false, 'Access denied: Admin or Auditor role required');
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Donations');
    
    if (!sheet) {
      return createResponse(false, 'Donations sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    const donations = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) { // If Donation ID exists
        donations.push({
          id: row[0],
          timestamp: row[1] ? formatDate(row[1]) : '',
          donorName: row[2],
          contact: row[3],
          amount: parseFloat(row[4]) || 0,
          paymentMethod: row[5],
          campaign: row[6],
          referenceNumber: row[7],
          receiptUrl: row[8],
          status: row[9] || 'Pending',
          notes: row[10],
          verifiedBy: row[11]
        });
      }
    }
    
    return createResponse(true, 'Donations retrieved', { donations });
  } catch (error) {
    Logger.log('Error in getDonations: ' + error.toString());
    return createResponse(false, 'Failed to retrieve donations: ' + error.toString());
  }
}

/**
 * Submit a new donation
 */
function submitDonation(params) {
  try {
    const { donorName, contact, amount, paymentMethod, campaign, referenceNumber, notes, receiptBase64 } = params;
    
    // Validation
    if (!donorName || !contact || !amount || !paymentMethod || !campaign || !referenceNumber) {
      return createResponse(false, 'Missing required fields');
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Donations');
    
    if (!sheet) {
      return createResponse(false, 'Donations sheet not found');
    }
    
    // Generate donation ID
    const lastRow = sheet.getLastRow();
    const donationId = 'DON-' + String(lastRow).padStart(3, '0');
    
    // Upload receipt image if provided
    let receiptUrl = '';
    if (receiptBase64) {
      try {
        receiptUrl = uploadReceiptImage(receiptBase64, donationId);
      } catch (uploadError) {
        Logger.log('Receipt upload failed: ' + uploadError.toString());
        // Continue anyway - receipt upload is optional
      }
    }
    
    // Add donation record
    const timestamp = new Date();
    sheet.appendRow([
      donationId,
      timestamp,
      donorName,
      contact,
      parseFloat(amount),
      paymentMethod,
      campaign,
      referenceNumber,
      receiptUrl,
      'Pending',
      notes || '',
      ''
    ]);
    
    // Send notification email to admins (optional)
    try {
      notifyAdminsOfNewDonation(donationId, donorName, amount, campaign);
    } catch (emailError) {
      Logger.log('Email notification failed: ' + emailError.toString());
    }
    
    return createResponse(true, 'Donation submitted successfully', { 
      donationId,
      receiptUrl 
    });
  } catch (error) {
    Logger.log('Error in submitDonation: ' + error.toString());
    return createResponse(false, 'Failed to submit donation: ' + error.toString());
  }
}

/**
 * Get donation settings (payment methods, QR codes)
 */
function getDonationSettings() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Donation_Settings');
    
    if (!sheet) {
      return createResponse(false, 'Donation_Settings sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    const settings = {
      methods: [],
      gcash: {},
      paymaya: {}
    };
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) { // If Setting Key exists
        const method = row[1] ? row[1].toLowerCase() : '';
        const methodData = {
          method: row[1],
          qrImageUrl: row[2],
          accountName: row[3],
          active: row[4] === true || row[4] === 'TRUE'
        };
        
        settings.methods.push(methodData);
        
        if (method === 'gcash') {
          settings.gcash = methodData;
        } else if (method === 'paymaya') {
          settings.paymaya = methodData;
        }
      }
    }
    
    return createResponse(true, 'Settings retrieved', { settings });
  } catch (error) {
    Logger.log('Error in getDonationSettings: ' + error.toString());
    return createResponse(false, 'Failed to retrieve settings: ' + error.toString());
  }
}

/**
 * Update donation settings (Admin only)
 */
function updateDonationSettings(params) {
  try {
    const userId = params.userId;
    const userRole = getUserRole(userId);
    
    if (userRole !== 'Admin') {
      return createResponse(false, 'Access denied: Admin role required');
    }
    
    const { methods } = params;
    if (!methods || !Array.isArray(methods)) {
      return createResponse(false, 'Invalid methods data');
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Donation_Settings');
    
    if (!sheet) {
      return createResponse(false, 'Donation_Settings sheet not found');
    }
    
    // Update or insert settings
    methods.forEach(methodData => {
      const method = methodData.method;
      const key = method.toLowerCase() + '_qr';
      
      // Find existing row
      const data = sheet.getDataRange().getValues();
      let rowIndex = -1;
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === key) {
          rowIndex = i + 1; // Sheet rows are 1-indexed
          break;
        }
      }
      
      const rowData = [
        key,
        methodData.method,
        methodData.qrImageUrl || '',
        methodData.accountName || '',
        methodData.active !== false
      ];
      
      if (rowIndex > 0) {
        // Update existing row
        sheet.getRange(rowIndex, 1, 1, 5).setValues([rowData]);
      } else {
        // Add new row
        sheet.appendRow(rowData);
      }
    });
    
    return createResponse(true, 'Settings updated successfully');
  } catch (error) {
    Logger.log('Error in updateDonationSettings: ' + error.toString());
    return createResponse(false, 'Failed to update settings: ' + error.toString());
  }
}

/**
 * Upload payment QR code image (Admin only)
 */
function uploadPaymentQr(params) {
  try {
    const userId = params.userId;
    const userRole = getUserRole(userId);
    
    if (userRole !== 'Admin') {
      return createResponse(false, 'Access denied: Admin role required');
    }
    
    const { base64Data, fileName, mimeType, method } = params;
    
    if (!base64Data || !fileName || !method) {
      return createResponse(false, 'Missing required parameters');
    }
    
    // Get or create QR_Codes folder
    const qrFolder = getOrCreateFolder('YSP Assets/Donations/QR_Codes');
    
    // Remove data URI prefix if present
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Decode base64 and create blob
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Clean),
      mimeType || 'image/png',
      `${method}_QR_${new Date().getTime()}.png`
    );
    
    // Upload to Drive
    const file = qrFolder.createFile(blob);
    
    // Make file publicly viewable
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Get public URL
    const imageUrl = `https://drive.google.com/uc?export=view&id=${file.getId()}`;
    
    Logger.log(`QR uploaded: ${imageUrl}`);
    
    return createResponse(true, 'QR code uploaded successfully', { 
      imageUrl,
      fileId: file.getId()
    });
  } catch (error) {
    Logger.log('Error in uploadPaymentQr: ' + error.toString());
    return createResponse(false, 'Failed to upload QR code: ' + error.toString());
  }
}

/**
 * Upload receipt image (helper function)
 */
function uploadReceiptImage(base64Data, donationId) {
  try {
    // Get or create Receipts folder with year/month structure
    const now = new Date();
    const year = now.getFullYear();
    const month = now.toLocaleString('en-US', { month: 'long' });
    
    const receiptsFolder = getOrCreateFolder(`YSP Assets/Donations/Receipts/${year}/${month}`);
    
    // Remove data URI prefix if present
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Decode base64 and create blob
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Clean),
      'image/png',
      `receipt_${donationId}_${now.getTime()}.png`
    );
    
    // Upload to Drive
    const file = receiptsFolder.createFile(blob);
    
    // Restrict access (only specific people with access to folder)
    file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    
    // Get shareable URL
    const imageUrl = `https://drive.google.com/uc?export=view&id=${file.getId()}`;
    
    return imageUrl;
  } catch (error) {
    Logger.log('Error uploading receipt: ' + error.toString());
    throw error;
  }
}

/**
 * Helper: Get or create nested folder structure
 */
function getOrCreateFolder(path) {
  const parts = path.split('/');
  let folder = DriveApp.getRootFolder();
  
  parts.forEach(part => {
    const folders = folder.getFoldersByName(part);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = folder.createFolder(part);
    }
  });
  
  return folder;
}

/**
 * Helper: Notify admins of new donation
 */
function notifyAdminsOfNewDonation(donationId, donorName, amount, campaign) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const membersSheet = ss.getSheetByName('Members');
    
    if (!membersSheet) return;
    
    const data = membersSheet.getDataRange().getValues();
    const adminEmails = [];
    
    // Find all Admin users
    for (let i = 1; i < data.length; i++) {
      const role = data[i][3]; // Column D: Role
      const email = data[i][2]; // Column C: Email
      
      if (role === 'Admin' && email) {
        adminEmails.push(email);
      }
    }
    
    if (adminEmails.length === 0) return;
    
    const subject = `[YSP] New Donation Received - ${donationId}`;
    const body = `
A new donation has been submitted to YSP Tagum Chapter:

Donation ID: ${donationId}
Donor: ${donorName}
Amount: ₱${amount}
Campaign: ${campaign}

Please review and verify this donation in the YSP Web App.

---
Youth for a Sustainable Philippines - Tagum Chapter
This is an automated notification.
    `;
    
    adminEmails.forEach(email => {
      try {
        MailApp.sendEmail(email, subject, body);
      } catch (e) {
        Logger.log('Failed to send email to ' + email + ': ' + e.toString());
      }
    });
    
  } catch (error) {
    Logger.log('Error in notifyAdminsOfNewDonation: ' + error.toString());
  }
}

/**
 * Helper: Format date for consistent output
 */
function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date;
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
```

### 2. Update doPost Handler

Add these cases to your existing `doPost` function in `Code.gs`:

```javascript
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    
    // ... existing actions ...
    
    // Donations actions
    if (action === 'getDonationCampaigns') {
      return ContentService.createTextOutput(JSON.stringify(getDonationCampaigns()))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'getDonations') {
      return ContentService.createTextOutput(JSON.stringify(getDonations(params)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'submitDonation') {
      return ContentService.createTextOutput(JSON.stringify(submitDonation(params)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'getDonationSettings') {
      return ContentService.createTextOutput(JSON.stringify(getDonationSettings()))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'updateDonationSettings') {
      return ContentService.createTextOutput(JSON.stringify(updateDonationSettings(params)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'uploadPaymentQr') {
      return ContentService.createTextOutput(JSON.stringify(uploadPaymentQr(params)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // ... rest of existing code ...
    
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify(createResponse(false, 'Server error: ' + error.toString())))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Testing Checklist

### 1. Sheet Setup
- [ ] Create `Donations` sheet with correct columns
- [ ] Create `Donation_Campaigns` sheet with sample campaigns
- [ ] Create `Donation_Settings` sheet with GCash/PayMaya rows
- [ ] Add formula in `Donation_Campaigns` Current Amount column

### 2. Drive Setup
- [ ] Create folder structure: `YSP Assets/Donations/QR_Codes` and `Receipts`
- [ ] Set QR_Codes folder to "Anyone with link can view"
- [ ] Keep Receipts folder restricted

### 3. Backend Deployment
- [ ] Copy all functions to your Google Apps Script project
- [ ] Update doPost handler with new action cases
- [ ] Deploy as web app and note the URL
- [ ] Update frontend API endpoint if needed

### 4. Frontend Testing
- [ ] Test donation form submission (with and without receipt)
- [ ] Test QR code display for public users
- [ ] Test Admin QR upload (GCash and PayMaya)
- [ ] Test Admin donation management dashboard
- [ ] Verify receipt images upload and display correctly
- [ ] Verify email notifications to admins

### 5. End-to-End Flow
1. Public user views Donations page
2. Sees GCash/PayMaya QR codes
3. Makes payment via GCash
4. Fills donation form with reference number
5. Uploads receipt image
6. Submits form
7. Admin receives email notification
8. Admin logs in and sees pending donation
9. Admin verifies donation and updates status

## Security Considerations

1. **Receipt Privacy**: Receipt images are stored in a private folder accessible only to Admins/Auditors
2. **QR Codes**: Payment QR codes are public (anyone with link) so donors can scan them
3. **Role Checks**: All admin functions verify user role before allowing access
4. **Input Validation**: All inputs are validated before processing
5. **Error Logging**: All errors are logged to Apps Script Logger for debugging

## Troubleshooting

### Issue: Images not uploading
- Check that Drive API is enabled in Apps Script
- Verify folder permissions
- Check base64 encoding is correct

### Issue: Email notifications not working
- Verify MailApp quota hasn't been exceeded
- Check admin email addresses in Members sheet
- Review Apps Script execution logs

### Issue: Settings not saving
- Verify Donation_Settings sheet exists and has correct structure
- Check user has Admin role
- Review response in browser console

## Sample Data for Testing

### Donation_Campaigns Sample Rows:
```
CAMP-001 | General Fund | Support ongoing programs | 50000 | =SUMIF(Donations!G:G,A2,Donations!E:E) | 2025-01-01 | 2025-12-31 | Active
CAMP-002 | Youth Leadership Training | Fund training workshops | 25000 | =SUMIF(Donations!G:G,A3,Donations!E:E) | 2025-10-01 | 2025-12-31 | Active
CAMP-003 | Community Outreach | Support outreach programs | 15000 | =SUMIF(Donations!G:G,A4,Donations!E:E) | 2025-06-01 | 2025-11-30 | Active
```

### Donation_Settings Sample Rows:
```
gcash_qr   | GCash   | https://drive.google.com/uc?export=view&id=YOUR_FILE_ID | YSP Tagum - GCash | TRUE
paymaya_qr | PayMaya | https://drive.google.com/uc?export=view&id=YOUR_FILE_ID | YSP Tagum - PayMaya | TRUE
```

## Next Steps

1. Set up the Google Sheets with correct structure
2. Copy the Apps Script code to your project
3. Upload initial QR codes for GCash and PayMaya
4. Test the complete flow from UI to backend
5. Monitor the first few real donations to ensure everything works smoothly

---

**Questions or Issues?** Check the Apps Script execution logs first, then review browser console for frontend errors.
