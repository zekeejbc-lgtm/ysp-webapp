/**
 * Diagnostic Script for Profile Pictures
 * 
 * Run this in Google Apps Script editor to check profile picture URLs
 * This will help identify issues with profile pictures not showing
 */

function diagnoseProfilePictures() {
  const SPREADSHEET_ID = '1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU';
  const PROFILE_PICTURES_FOLDER_ID = '192-pVluL93fYKpyJoukfi_H5az_9fqFK';
  
  try {
    // Open spreadsheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('User Profiles');
    
    if (!sheet) {
      Logger.log('❌ User Profiles sheet not found!');
      return;
    }
    
    Logger.log('✅ User Profiles sheet found');
    Logger.log('=====================================');
    
    // Get all data
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find column indexes
    const nameCol = headers.indexOf('Full Name');
    const usernameCol = headers.indexOf('Username');
    const idCodeCol = headers.indexOf('ID Code');
    const profilePicCol = headers.indexOf('ProfilePictureURL');
    
    Logger.log(`Column V (ProfilePictureURL) is at index: ${profilePicCol}`);
    Logger.log('=====================================\n');
    
    // Check each user
    let usersWithPictures = 0;
    let usersWithoutPictures = 0;
    let invalidURLs = 0;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const fullName = row[nameCol] || 'N/A';
      const username = row[usernameCol] || 'N/A';
      const idCode = row[idCodeCol] || 'N/A';
      const profilePicURL = row[profilePicCol] || '';
      
      if (profilePicURL && profilePicURL.trim() !== '') {
        usersWithPictures++;
        
        // Validate URL format
        if (profilePicURL.includes('drive.google.com')) {
          Logger.log(`✅ ${fullName} (${username})`);
          Logger.log(`   URL: ${profilePicURL}`);
          
          // Test if file is accessible
          try {
            const fileId = extractFileIdFromURL(profilePicURL);
            if (fileId) {
              const file = DriveApp.getFileById(fileId);
              const sharingAccess = file.getSharingAccess();
              const sharingPermission = file.getSharingPermission();
              
              Logger.log(`   File ID: ${fileId}`);
              Logger.log(`   Sharing: ${sharingAccess} - ${sharingPermission}`);
              
              if (sharingAccess !== DriveApp.Access.ANYONE_WITH_LINK) {
                Logger.log(`   ⚠️  WARNING: File is not publicly accessible!`);
              }
            } else {
              Logger.log(`   ❌ Could not extract file ID from URL`);
              invalidURLs++;
            }
          } catch (e) {
            Logger.log(`   ❌ Error accessing file: ${e.toString()}`);
            invalidURLs++;
          }
        } else {
          Logger.log(`⚠️  ${fullName} (${username})`);
          Logger.log(`   Non-Drive URL: ${profilePicURL}`);
        }
        Logger.log('');
      } else {
        usersWithoutPictures++;
      }
    }
    
    // Summary
    Logger.log('\n=====================================');
    Logger.log('SUMMARY');
    Logger.log('=====================================');
    Logger.log(`Total users: ${data.length - 1}`);
    Logger.log(`Users with profile pictures: ${usersWithPictures}`);
    Logger.log(`Users without profile pictures: ${usersWithoutPictures}`);
    Logger.log(`Invalid or inaccessible URLs: ${invalidURLs}`);
    
    // Check Drive folder
    Logger.log('\n=====================================');
    Logger.log('DRIVE FOLDER CHECK');
    Logger.log('=====================================');
    try {
      const folder = DriveApp.getFolderById(PROFILE_PICTURES_FOLDER_ID);
      const files = folder.getFiles();
      let fileCount = 0;
      
      Logger.log(`Folder: ${folder.getName()}`);
      Logger.log('Files in folder:');
      
      while (files.hasNext()) {
        const file = files.next();
        fileCount++;
        Logger.log(`  - ${file.getName()} (ID: ${file.getId()})`);
      }
      
      Logger.log(`\nTotal files in folder: ${fileCount}`);
    } catch (e) {
      Logger.log(`❌ Error accessing Drive folder: ${e.toString()}`);
    }
    
  } catch (error) {
    Logger.log(`❌ Error: ${error.toString()}`);
  }
}

/**
 * Extract file ID from Google Drive URL
 */
function extractFileIdFromURL(url) {
  try {
    // Format: https://drive.google.com/uc?export=view&id=FILE_ID
    if (url.includes('id=')) {
      const parts = url.split('id=');
      return parts[1].split('&')[0];
    }
    
    // Format: https://drive.google.com/file/d/FILE_ID/view
    if (url.includes('/file/d/')) {
      const parts = url.split('/file/d/');
      return parts[1].split('/')[0];
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Fix all profile picture URLs to use the correct format
 * CAUTION: This will modify the sheet!
 */
function fixProfilePictureURLs() {
  const SPREADSHEET_ID = '1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU';
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('User Profiles');
  
  if (!sheet) {
    Logger.log('❌ User Profiles sheet not found!');
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const profilePicCol = headers.indexOf('ProfilePictureURL');
  
  if (profilePicCol === -1) {
    Logger.log('❌ ProfilePictureURL column not found!');
    return;
  }
  
  let fixedCount = 0;
  
  for (let i = 1; i < data.length; i++) {
    const profilePicURL = data[i][profilePicCol] || '';
    
    if (profilePicURL && profilePicURL.includes('drive.google.com')) {
      const fileId = extractFileIdFromURL(profilePicURL);
      
      if (fileId) {
        const correctURL = `https://drive.google.com/uc?export=view&id=${fileId}`;
        
        if (profilePicURL !== correctURL) {
          sheet.getRange(i + 1, profilePicCol + 1).setValue(correctURL);
          Logger.log(`✅ Fixed URL for row ${i + 1}: ${correctURL}`);
          fixedCount++;
        }
      }
    }
  }
  
  Logger.log(`\nFixed ${fixedCount} URLs`);
}

/**
 * Test if a specific file is accessible
 */
function testFileAccess(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    Logger.log(`✅ File found: ${file.getName()}`);
    Logger.log(`   URL: ${file.getUrl()}`);
    Logger.log(`   Download URL: https://drive.google.com/uc?export=view&id=${fileId}`);
    Logger.log(`   Sharing: ${file.getSharingAccess()} - ${file.getSharingPermission()}`);
    
    // Try to make it public if it's not
    if (file.getSharingAccess() !== DriveApp.Access.ANYONE_WITH_LINK) {
      Logger.log(`\n⚠️  File is not public. Making it public...`);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      Logger.log(`✅ File is now publicly accessible`);
    }
    
    return true;
  } catch (e) {
    Logger.log(`❌ Error: ${e.toString()}`);
    return false;
  }
}
