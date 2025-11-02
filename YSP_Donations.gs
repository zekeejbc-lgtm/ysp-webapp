// ============================================
// YSP DONATIONS MODULE
// Handles all donation-related functionality
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
    const campaigns = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) {
        campaigns.push({
          id: row[0],
          name: row[1],
          description: row[2],
          targetAmount: parseFloat(row[3]) || 0,
          currentAmount: parseFloat(row[4]) || 0,
          startDate: row[5] ? formatDonationDate(row[5]) : '',
          endDate: row[6] ? formatDonationDate(row[6]) : '',
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
      if (row[0]) {
        donations.push({
          id: row[0],
          timestamp: row[1] ? formatDonationDate(row[1]) : '',
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
    
    if (!donorName || !contact || !amount || !paymentMethod || !campaign || !referenceNumber) {
      return createResponse(false, 'Missing required fields');
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Donations');
    
    if (!sheet) {
      return createResponse(false, 'Donations sheet not found');
    }
    
    const lastRow = sheet.getLastRow();
    const donationId = 'DON-' + String(lastRow).padStart(3, '0');
    
    let receiptUrl = '';
    if (receiptBase64) {
      try {
        receiptUrl = uploadReceiptImage(receiptBase64, donationId);
      } catch (uploadError) {
        Logger.log('Receipt upload failed: ' + uploadError.toString());
      }
    }
    
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
      if (row[0]) {
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
    
    methods.forEach(methodData => {
      const method = methodData.method;
      const key = method.toLowerCase() + '_qr';
      
      const data = sheet.getDataRange().getValues();
      let rowIndex = -1;
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === key) {
          rowIndex = i + 1;
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
        sheet.getRange(rowIndex, 1, 1, 5).setValues([rowData]);
      } else {
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
    
    const qrFolder = getOrCreateDonationFolder('YSP Assets/Donations/QR_Codes');
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Clean),
      mimeType || 'image/png',
      `${method}_QR_${new Date().getTime()}.png`
    );
    
    const file = qrFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
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

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Upload receipt image to Google Drive
 */
function uploadReceiptImage(base64Data, donationId) {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.toLocaleString('en-US', { month: 'long' });
    
    const receiptsFolder = getOrCreateDonationFolder(`YSP Assets/Donations/Receipts/${year}/${month}`);
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Clean),
      'image/png',
      `receipt_${donationId}_${now.getTime()}.png`
    );
    
    const file = receiptsFolder.createFile(blob);
    file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    
    const imageUrl = `https://drive.google.com/uc?export=view&id=${file.getId()}`;
    
    return imageUrl;
  } catch (error) {
    Logger.log('Error uploading receipt: ' + error.toString());
    throw error;
  }
}

/**
 * Get or create nested folder structure in Drive
 */
function getOrCreateDonationFolder(path) {
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
 * Send email notifications to admins about new donations
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
 * Format date for consistent output
 */
function formatDonationDate(date) {
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
