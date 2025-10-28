// ===== CONFIGURATION =====
const SPREADSHEET_ID = '1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU';
const SHEETS = {
  ACCESS_LOGS: 'Access Logs',
  USER_PROFILES: 'User Profiles',
  MASTER_ATTENDANCE: 'Master Attendance Log'
};

// ===== MAIN ENTRY POINT =====
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const response = handlePostRequest(data);
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Error: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== REQUEST ROUTER =====
function handlePostRequest(data) {
  const action = data.action;
  
  switch(action) {
    case 'login':
      return handleLogin(data);
    case 'guestLogin':
      return handleGuestLogin(data);
    case 'getAccessLogs':
      return handleGetAccessLogs(data);
    case 'searchProfiles':
      return handleSearchProfiles(data);
    case 'getEvents':
      return handleGetEvents(data);
    case 'createEvent':
      return handleCreateEvent(data);
    case 'toggleEventStatus':
      return handleToggleEventStatus(data);
    default:
      return { success: false, message: 'Unknown action: ' + action };
  }
}

// ===== LOGIN HANDLER =====
function handleLogin(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const profilesSheet = ss.getSheetByName(SHEETS.USER_PROFILES);
    const accessLogsSheet = ss.getSheetByName(SHEETS.ACCESS_LOGS);
    
    const profilesData = profilesSheet.getDataRange().getValues();
    
    // Find user (skip header row)
    for (let i = 1; i < profilesData.length; i++) {
      const row = profilesData[i];
      const username = row[1]; // Column B
      const password = row[2]; // Column C
      
      if (username === data.username && password === data.password) {
        // Log access
        const timestamp = new Date().toISOString();
        accessLogsSheet.appendRow([timestamp, username, 'Login']);
        
        // Return user data
        return {
          success: true,
          user: {
            id: row[0],           // Column A - ID
            username: row[1],     // Column B - Username
            role: row[3],         // Column D - Role
            firstName: row[4],    // Column E - First Name
            lastName: row[5],     // Column F - Last Name
            middleName: row[6],   // Column G - Middle Name
            birthdate: row[7],    // Column H - Birthdate
            address: row[8],      // Column I - Address
            contactNumber: row[9], // Column J - Contact Number
            email: row[10],       // Column K - Email
            guardianName: row[11], // Column L - Guardian Name
            guardianContact: row[12], // Column M - Guardian Contact
            profilePicture: row[13] // Column N - Profile Picture
          }
        };
      }
    }
    
    return { success: false, message: 'Invalid username or password' };
  } catch (error) {
    return { success: false, message: 'Login error: ' + error.toString() };
  }
}

// ===== GUEST LOGIN HANDLER =====
function handleGuestLogin(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const accessLogsSheet = ss.getSheetByName(SHEETS.ACCESS_LOGS);
    
    // Log guest access
    const timestamp = new Date().toISOString();
    accessLogsSheet.appendRow([timestamp, 'Guest', 'Guest Login']);
    
    return {
      success: true,
      user: {
        id: 'guest',
        username: 'Guest',
        role: 'Guest',
        firstName: 'Guest',
        lastName: 'User'
      }
    };
  } catch (error) {
    return { success: false, message: 'Guest login error: ' + error.toString() };
  }
}

// ===== ACCESS LOGS HANDLER =====
function handleGetAccessLogs(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.ACCESS_LOGS);
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Skip header row and reverse for newest first
    const logs = values.slice(1).reverse().map(row => ({
      timestamp: row[0],
      username: row[1],
      action: row[2]
    }));
    
    return { success: true, logs: logs };
  } catch (error) {
    return { success: false, message: 'Error fetching logs: ' + error.toString() };
  }
}

// ===== SEARCH PROFILES HANDLER =====
function handleSearchProfiles(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.USER_PROFILES);
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    const searchTerm = (data.searchTerm || '').toLowerCase();
    
    // Skip header row
    const profiles = values.slice(1)
      .filter(row => {
        const id = (row[0] || '').toString().toLowerCase();
        const username = (row[1] || '').toString().toLowerCase();
        const firstName = (row[4] || '').toString().toLowerCase();
        const lastName = (row[5] || '').toString().toLowerCase();
        const fullName = firstName + ' ' + lastName;
        
        return id.includes(searchTerm) || 
               username.includes(searchTerm) || 
               fullName.includes(searchTerm);
      })
      .map(row => ({
        id: row[0],
        username: row[1],
        role: row[3],
        firstName: row[4],
        lastName: row[5],
        middleName: row[6],
        birthdate: row[7],
        address: row[8],
        contactNumber: row[9],
        email: row[10],
        guardianName: row[11],
        guardianContact: row[12],
        profilePicture: row[13]
      }));
    
    return { success: true, profiles: profiles };
  } catch (error) {
    return { success: false, message: 'Error searching profiles: ' + error.toString() };
  }
}

// ===== GET EVENTS HANDLER =====
function handleGetEvents(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.MASTER_ATTENDANCE);
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    const events = [];
    
    // Start from column E (index 4) and check every 6 columns
    for (let col = 4; col < headerRow.length; col += 6) {
      const eventId = headerRow[col];
      if (eventId) {
        events.push({
          id: eventId,
          name: headerRow[col + 1] || '',
          date: headerRow[col + 2] || '',
          timeIn: headerRow[col + 3] || '',
          timeOut: headerRow[col + 4] || '',
          status: headerRow[col + 5] || 'Active'
        });
      }
    }
    
    return { success: true, events: events };
  } catch (error) {
    return { success: false, message: 'Error fetching events: ' + error.toString() };
  }
}

// ===== CREATE EVENT HANDLER =====
function handleCreateEvent(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.MASTER_ATTENDANCE);
    
    const eventId = data.eventId;
    const eventName = data.eventName;
    const eventDate = data.eventDate;
    const timeIn = data.timeIn || '';
    const timeOut = data.timeOut || '';
    
    // Find the next available column (after existing events)
    const lastCol = sheet.getLastColumn();
    const nextCol = lastCol + 1;
    
    // Add 6 columns for the new event
    const headers = [eventId, eventName, eventDate, timeIn, timeOut, 'Active'];
    
    for (let i = 0; i < headers.length; i++) {
      sheet.getRange(1, nextCol + i).setValue(headers[i]);
    }
    
    return {
      success: true,
      message: 'Event created successfully',
      event: {
        id: eventId,
        name: eventName,
        date: eventDate,
        timeIn: timeIn,
        timeOut: timeOut,
        status: 'Active'
      }
    };
  } catch (error) {
    return { success: false, message: 'Error creating event: ' + error.toString() };
  }
}

// ===== TOGGLE EVENT STATUS HANDLER =====
function handleToggleEventStatus(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.MASTER_ATTENDANCE);
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    const eventId = data.eventId;
    
    // Find the event column
    for (let col = 4; col < headerRow.length; col += 6) {
      if (headerRow[col] === eventId) {
        const statusCol = col + 6; // Status is 6th column in the event group
        const currentStatus = sheet.getRange(1, statusCol).getValue();
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        
        sheet.getRange(1, statusCol).setValue(newStatus);
        
        return {
          success: true,
          message: 'Event status updated',
          newStatus: newStatus
        };
      }
    }
    
    return { success: false, message: 'Event not found' };
  } catch (error) {
    return { success: false, message: 'Error toggling status: ' + error.toString() };
  }
}
