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
      const username = row[13]; // Column N - Username
      const password = row[14]; // Column O - Password
      
      if (username === data.username && password === data.password) {
        // Log access
        const timestamp = new Date().toISOString();
        accessLogsSheet.appendRow([timestamp, username, 'Login']);
        
        // Return user data
        return {
          success: true,
          user: {
            id: row[18],          // Column S - ID Code
            username: row[13],    // Column N - Username
            role: row[20],        // Column U - Role
            firstName: row[3],    // Column D - Full Name (we'll use this as firstName)
            lastName: '',         // Not separate in this sheet
            middleName: '',       // Not separate in this sheet
            birthdate: row[4],    // Column E - Date of Birth
            address: '',          // Not in this sheet
            contactNumber: row[9], // Column J - Contact Number
            email: row[12],       // Column M - Personal Email Address
            guardianName: '',     // Not in this sheet
            guardianContact: '',  // Not in this sheet
            profilePicture: row[21] // Column V - ProfilePictureURL
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
    const logsSheet = ss.getSheetByName(SHEETS.ACCESS_LOGS);
    const profilesSheet = ss.getSheetByName(SHEETS.USER_PROFILES);
    
    const logsData = logsSheet.getDataRange().getValues();
    const profilesData = profilesSheet.getDataRange().getValues();
    
    // Create a map of username -> user data for quick lookup
    const userMap = {};
    for (let i = 1; i < profilesData.length; i++) {
      const username = profilesData[i][13]; // Column N - Username
      userMap[username] = {
        name: profilesData[i][3],    // Column D - Full Name
        idCode: profilesData[i][18], // Column S - ID Code
        role: profilesData[i][20]    // Column U - Role
      };
    }
    
    // Skip header row and reverse for newest first
    const logs = logsData.slice(1).reverse().map(row => {
      const username = row[1];
      const action = row[2];
      const user = userMap[username] || { name: username, idCode: 'N/A', role: action === 'Guest Login' ? 'Guest' : 'Unknown' };
      
      return {
        timestamp: row[0],
        name: user.name,
        idCode: user.idCode,
        role: user.role
      };
    });
    
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
    
    const searchTerm = (data.search || data.searchTerm || '').toLowerCase();
    
    // Skip header row
    const profiles = values.slice(1)
      .filter(row => {
        const idCode = (row[18] || '').toString().toLowerCase();      // Column S - ID Code
        const username = (row[13] || '').toString().toLowerCase();    // Column N - Username
        const fullName = (row[3] || '').toString().toLowerCase();     // Column D - Full Name
        
        return idCode.includes(searchTerm) || 
               username.includes(searchTerm) || 
               fullName.includes(searchTerm);
      })
      .map(row => {
        // Calculate age from birthdate
        const birthdate = row[4] ? new Date(row[4]) : null;
        let age = 0;
        let formattedBirthday = '';
        
        if (birthdate && !isNaN(birthdate.getTime())) {
          const today = new Date();
          age = today.getFullYear() - birthdate.getFullYear();
          const monthDiff = today.getMonth() - birthdate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
            age--;
          }
          
          // Format as "Mon DD YYYY" (e.g., "May 20 2007")
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          formattedBirthday = months[birthdate.getMonth()] + ' ' + 
                             birthdate.getDate() + ' ' + 
                             birthdate.getFullYear();
        }
        
        return {
          idCode: row[18] || '',              // Column S - ID Code
          fullName: row[3] || '',             // Column D - Full Name
          email: row[12] || '',               // Column M - Personal Email Address
          position: row[19] || '',            // Column T - Position
          birthday: formattedBirthday,        // Formatted birthday
          contact: row[9] || '',              // Column J - Contact Number
          gender: row[6] || '',               // Column G - Sex/Gender
          age: age,                           // Calculated
          civilStatus: row[8] || '',          // Column I - Civil Status
          nationality: row[11] || '',         // Column L - Nationality
          religion: row[10] || '',            // Column K - Religion
          profilePic: row[21] || ''           // Column V - ProfilePictureURL
        };
      });
    
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
        // Format the date
        const rawDate = headerRow[col + 2];
        let formattedDate = '';
        if (rawDate) {
          const dateObj = new Date(rawDate);
          if (!isNaN(dateObj.getTime())) {
            // Format as "YYYY-MM-DD"
            formattedDate = dateObj.getFullYear() + '-' + 
                           String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(dateObj.getDate()).padStart(2, '0');
          } else {
            formattedDate = rawDate.toString();
          }
        }
        
        events.push({
          id: eventId.toString(),
          name: headerRow[col + 1] || '',
          date: formattedDate,
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
    
    const eventName = data.eventName || data.name;
    const eventDate = data.eventDate || data.date;
    
    if (!eventName || !eventDate) {
      return { success: false, message: 'Event name and date are required' };
    }
    
    // Generate Event ID (auto-increment from existing events)
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    let maxEventId = 0;
    
    // Find highest event ID
    for (let col = 4; col < headerRow.length; col += 6) {
      const eventId = headerRow[col];
      if (eventId) {
        const idNum = parseInt(eventId.toString());
        if (!isNaN(idNum) && idNum > maxEventId) {
          maxEventId = idNum;
        }
      }
    }
    
    // Generate new ID (padded to 4 digits)
    const newEventId = String(maxEventId + 1).padStart(4, '0');
    
    // Find the next available column (after existing events)
    const lastCol = sheet.getLastColumn();
    const nextCol = lastCol + 1;
    
    // Add 6 columns for the new event with proper headers
    const headers = [newEventId, eventName, eventDate, 'Time IN', 'Time OUT', 'Active'];
    
    for (let i = 0; i < headers.length; i++) {
      sheet.getRange(1, nextCol + i).setValue(headers[i]);
    }
    
    // Log the creation
    Logger.log('Created event: ' + newEventId + ' - ' + eventName + ' at column ' + nextCol);
    
    return {
      success: true,
      message: 'Event created successfully',
      event: {
        id: newEventId,
        name: eventName,
        date: eventDate,
        timeIn: 'Time IN',
        timeOut: 'Time OUT',
        status: 'Active'
      }
    };
  } catch (error) {
    Logger.log('Error creating event: ' + error.toString());
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
      if (headerRow[col].toString() === eventId.toString()) {
        const statusCol = col + 5; // Status is at position 5 (0-indexed: col+5)
        const currentStatus = sheet.getRange(1, statusCol + 1).getValue(); // +1 because getRange is 1-indexed
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        
        sheet.getRange(1, statusCol + 1).setValue(newStatus);
        
        Logger.log('Toggled event ' + eventId + ' from ' + currentStatus + ' to ' + newStatus);
        
        return {
          success: true,
          message: 'Event status updated',
          newStatus: newStatus
        };
      }
    }
    
    return { success: false, message: 'Event not found' };
  } catch (error) {
    Logger.log('Error toggling status: ' + error.toString());
    return { success: false, message: 'Error toggling status: ' + error.toString() };
  }
}
