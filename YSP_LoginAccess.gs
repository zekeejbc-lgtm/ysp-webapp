// ===== CONFIGURATION =====
const SPREADSHEET_ID = '1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU';
const SHEETS = {
  ACCESS_LOGS: 'Access Logs',
  USER_PROFILES: 'User Profiles',
  MASTER_ATTENDANCE: 'Master Attendance Log',
  ANNOUNCEMENTS: 'Announcements',
  FEEDBACK: 'Feedback',
  HOMEPAGE_CONTENT: 'Homepage Content'
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
    case 'recordAttendance':
      return handleRecordAttendance(data);
    case 'recordManualAttendance':
      return handleRecordManualAttendance(data);
    case 'getUserAttendance':
      return handleGetUserAttendance(data);
    case 'getEventAnalytics':
      return handleGetEventAnalytics(data);
    case 'createAnnouncement':
      return handleCreateAnnouncement(data);
    case 'getAnnouncements':
      return handleGetAnnouncements(data);
    case 'markAnnouncementAsRead':
      return handleMarkAnnouncementAsRead(data);
    case 'createFeedback':
      return handleCreateFeedback(data);
    case 'getFeedback':
      return handleGetFeedback(data);
    case 'replyToFeedback':
      return handleReplyToFeedback(data);
    case 'getHomepageContent':
      return handleGetHomepageContent(data);
    case 'getUserProfile':
      return handleGetUserProfile(data);
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
        // Log access with correct column order: Timestamp, Account Created, Email, ID Code, Name, Role
        const timestamp = new Date().toISOString();
        const accountCreated = row[0];        // Column A - Timestamp (from User Profiles)
        const email = row[12];                // Column M - Personal Email Address
        const idCode = row[18];               // Column S - ID Code
        const fullName = row[3];              // Column D - Full Name
        const role = row[20];                 // Column U - Role
        
        accessLogsSheet.appendRow([timestamp, accountCreated, email, idCode, fullName, role]);
        
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
    
    // Log guest access with correct column order: Timestamp, Account Created, Email, ID Code, Name, Role
    const timestamp = new Date().toISOString();
    accessLogsSheet.appendRow([timestamp, 'N/A', 'N/A', 'N/A', data.name || 'Guest', 'Guest']);
    
    return {
      success: true,
      user: {
        id: 'guest',
        username: 'Guest',
        role: 'Guest',
        firstName: data.name || 'Guest',
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
    
    const logsData = logsSheet.getDataRange().getValues();
    
    // Skip header row and reverse for newest first
    const logs = logsData.slice(1).reverse().map(row => {
      return {
        timestamp: row[0],  // Column A - Timestamp
        name: row[4],       // Column E - Name
        idCode: row[3],     // Column D - ID Code
        role: row[5]        // Column F - Role
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

// ===== RECORD ATTENDANCE HANDLER =====
function handleRecordAttendance(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.MASTER_ATTENDANCE);
    
    const eventId = data.eventId;
    const idCode = data.idCode;
    const timeType = data.timeType; // 'timeIn' or 'timeOut'
    
    if (!eventId || !idCode || !timeType) {
      return { success: false, message: 'Missing required fields' };
    }
    
    // Get current time in PH timezone (UTC+8) in 12-hour format
    const now = new Date();
    const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // Convert to PH time
    const hours = phTime.getUTCHours();
    const minutes = phTime.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeString = 'Present - ' + String(displayHours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ' ' + ampm;
    
    // Get all data
    const allData = sheet.getDataRange().getValues();
    const headerRow = allData[0];
    
    // Find the event column
    let eventColIndex = -1;
    for (let col = 4; col < headerRow.length; col += 6) {
      if (headerRow[col] && headerRow[col].toString() === eventId.toString()) {
        eventColIndex = col;
        break;
      }
    }
    
    if (eventColIndex === -1) {
      return { success: false, message: 'Event not found' };
    }
    
    // Determine which column to update (Time IN or Time OUT)
    const timeColIndex = timeType === 'timeIn' ? eventColIndex + 3 : eventColIndex + 4;
    
    // Find the person's row by ID Code (Column A, index 0)
    let personRowIndex = -1;
    for (let row = 1; row < allData.length; row++) {
      if (allData[row][0] && allData[row][0].toString() === idCode.toString()) {
        personRowIndex = row;
        break;
      }
    }
    
    if (personRowIndex === -1) {
      return { success: false, message: 'ID Code not found in Master Attendance Log' };
    }
    
    // Check if already recorded (to prevent duplicates)
    const currentValue = allData[personRowIndex][timeColIndex];
    if (currentValue && currentValue.toString().trim() !== '') {
      return { 
        success: false, 
        message: 'Already recorded! This person has already ' + (timeType === 'timeIn' ? 'timed in' : 'timed out') + ' for this event.',
        alreadyRecorded: true
      };
    }
    
    // Record the attendance (row is 1-indexed in getRange, col is 1-indexed)
    sheet.getRange(personRowIndex + 1, timeColIndex + 1).setValue(timeString);
    
    const personName = allData[personRowIndex][1]; // Column B - Name
    
    Logger.log('Recorded attendance: ' + personName + ' (' + idCode + ') - ' + timeType + ' at ' + timeString);
    
    return {
      success: true,
      message: 'Attendance recorded successfully',
      personName: personName,
      time: timeString,
      timeType: timeType
    };
  } catch (error) {
    Logger.log('Error recording attendance: ' + error.toString());
    return { success: false, message: 'Error recording attendance: ' + error.toString() };
  }
}

// ===== RECORD MANUAL ATTENDANCE HANDLER =====
function handleRecordManualAttendance(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.MASTER_ATTENDANCE);
    
    const eventId = data.eventId;
    const idCode = data.idCode;
    const timeType = data.timeType; // 'timeIn' or 'timeOut'
    const formattedValue = data.formattedValue; // Pre-formatted "(Status) - (Time)" from frontend
    const overwrite = data.overwrite || false; // Whether to overwrite existing record
    
    if (!eventId || !idCode || !timeType || !formattedValue) {
      return { success: false, message: 'Missing required fields' };
    }
    
    // Get all data
    const allData = sheet.getDataRange().getValues();
    const headerRow = allData[0];
    
    // Find the event column
    let eventColIndex = -1;
    for (let col = 4; col < headerRow.length; col += 6) {
      if (headerRow[col] && headerRow[col].toString() === eventId.toString()) {
        eventColIndex = col;
        break;
      }
    }
    
    if (eventColIndex === -1) {
      return { success: false, message: 'Event not found' };
    }
    
    // Determine which column to update (Time IN or Time OUT)
    const timeColIndex = timeType === 'timeIn' ? eventColIndex + 3 : eventColIndex + 4;
    
    // Find the person's row by ID Code (Column A, index 0)
    let personRowIndex = -1;
    for (let row = 1; row < allData.length; row++) {
      if (allData[row][0] && allData[row][0].toString() === idCode.toString()) {
        personRowIndex = row;
        break;
      }
    }
    
    if (personRowIndex === -1) {
      return { success: false, message: 'ID Code not found in Master Attendance Log' };
    }
    
    // Check if already recorded
    const currentValue = allData[personRowIndex][timeColIndex];
    if (currentValue && currentValue.toString().trim() !== '') {
      if (!overwrite) {
        // Return existing value for confirmation dialog
        return { 
          success: false, 
          message: 'Already recorded! This person has already ' + (timeType === 'timeIn' ? 'timed in' : 'timed out') + ' for this event.',
          alreadyRecorded: true,
          existingValue: currentValue.toString()
        };
      }
      // If overwrite is true, continue to update the record
      Logger.log('Overwriting existing record: ' + currentValue.toString() + ' with ' + formattedValue);
    }
    
    // Record the attendance with the formatted value from frontend
    sheet.getRange(personRowIndex + 1, timeColIndex + 1).setValue(formattedValue);
    
    const personName = allData[personRowIndex][1]; // Column B - Name
    
    Logger.log('Recorded manual attendance: ' + personName + ' (' + idCode + ') - ' + timeType + ' - ' + formattedValue);
    
    return {
      success: true,
      message: 'Attendance recorded successfully',
      personName: personName,
      formattedValue: formattedValue,
      timeType: timeType
    };
  } catch (error) {
    Logger.log('Error recording manual attendance: ' + error.toString());
    return { success: false, message: 'Error recording attendance: ' + error.toString() };
  }
}

// ===== GET USER ATTENDANCE HANDLER =====
function handleGetUserAttendance(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.MASTER_ATTENDANCE);
    
    const idCode = data.idCode;
    
    if (!idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    
    // Get all data
    const allData = sheet.getDataRange().getValues();
    const headerRow = allData[0];
    
    // Find the person's row by ID Code (Column A, index 0)
    let personRowIndex = -1;
    for (let row = 1; row < allData.length; row++) {
      if (allData[row][0] && allData[row][0].toString() === idCode.toString()) {
        personRowIndex = row;
        break;
      }
    }
    
    if (personRowIndex === -1) {
      return { success: false, message: 'ID Code not found in Master Attendance Log' };
    }
    
    const personRow = allData[personRowIndex];
    const attendanceRecords = [];
    
    // Loop through events (start from column E, index 4, increment by 6)
    for (let col = 4; col < headerRow.length; col += 6) {
      const eventId = headerRow[col];
      if (!eventId) continue;
      
      const eventName = headerRow[col + 1] || '';
      const eventDate = headerRow[col + 2] || '';
      const timeIn = personRow[col + 3] || '—';
      const timeOut = personRow[col + 4] || '—';
      
      // Extract status from Time IN value (format: "Status - HH:MM AM/PM")
      let status = '';
      if (timeIn && timeIn !== '—') {
        const timeInStr = timeIn.toString();
        if (timeInStr.includes(' - ')) {
          status = timeInStr.split(' - ')[0].trim();
        }
      }
      
      // Only include records where user has attended (has Time IN)
      if (timeIn && timeIn !== '—') {
        // Format the date
        let formattedDate = '';
        if (eventDate) {
          const dateObj = new Date(eventDate);
          if (!isNaN(dateObj.getTime())) {
            // Format as "YYYY-MM-DD"
            formattedDate = dateObj.getFullYear() + '-' + 
                           String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(dateObj.getDate()).padStart(2, '0');
          } else {
            formattedDate = eventDate.toString();
          }
        }
        
        attendanceRecords.push({
          eventId: eventId.toString(),
          eventName: eventName,
          date: formattedDate,
          timeIn: timeIn.toString(),
          timeOut: timeOut.toString(),
          status: status
        });
      }
    }
    
    // Sort by date (newest first)
    attendanceRecords.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
    
    Logger.log('Retrieved ' + attendanceRecords.length + ' attendance records for ' + idCode);
    
    return {
      success: true,
      records: attendanceRecords
    };
  } catch (error) {
    Logger.log('Error getting user attendance: ' + error.toString());
    return { success: false, message: 'Error getting user attendance: ' + error.toString() };
  }
}

// ===== GET USER ATTENDANCE HANDLER =====
function handleGetUserAttendance(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.MASTER_ATTENDANCE);
    
    const idCode = data.idCode;
    
    if (!idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    
    // Get all data
    const allData = sheet.getDataRange().getValues();
    const headerRow = allData[0];
    
    // Find the person's row by ID Code (Column A, index 0)
    let personRowIndex = -1;
    for (let row = 1; row < allData.length; row++) {
      if (allData[row][0] && allData[row][0].toString() === idCode.toString()) {
        personRowIndex = row;
        break;
      }
    }
    
    if (personRowIndex === -1) {
      return { success: false, message: 'ID Code not found in Master Attendance Log' };
    }
    
    const personRow = allData[personRowIndex];
    const attendanceRecords = [];
    
    // Process each event (starting from column E, index 4, every 6 columns)
    for (let col = 4; col < headerRow.length; col += 6) {
      const eventId = headerRow[col];
      if (eventId) {
        const eventName = headerRow[col + 1] || '';
        const eventDate = headerRow[col + 2] || '';
        const timeInValue = personRow[col + 3] || '';
        const timeOutValue = personRow[col + 4] || '';
        
        // Only include events where there's a Time IN value
        if (timeInValue && timeInValue.toString().trim() !== '') {
          // Extract status from Time IN (e.g., "Present - 2:00 PM" -> "Present")
          let status = 'Unknown';
          const timeInStr = timeInValue.toString();
          if (timeInStr.includes(' - ')) {
            status = timeInStr.split(' - ')[0].trim();
          } else {
            status = timeInStr.trim();
          }
          
          // Format date
          let formattedDate = '';
          if (eventDate) {
            const dateObj = new Date(eventDate);
            if (!isNaN(dateObj.getTime())) {
              formattedDate = dateObj.getFullYear() + '-' + 
                             String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                             String(dateObj.getDate()).padStart(2, '0');
            } else {
              formattedDate = eventDate.toString();
            }
          }
          
          attendanceRecords.push({
            date: formattedDate,
            eventName: eventName,
            timeIn: timeInValue.toString(),
            timeOut: timeOutValue ? timeOutValue.toString() : '—',
            status: status
          });
        }
      }
    }
    
    // Sort by date (newest first)
    attendanceRecords.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
    
    return {
      success: true,
      records: attendanceRecords
    };
  } catch (error) {
    Logger.log('Error fetching user attendance: ' + error.toString());
    return { success: false, message: 'Error fetching attendance: ' + error.toString() };
  }
}

// ===== GET EVENT ANALYTICS HANDLER =====
function handleGetEventAnalytics(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.MASTER_ATTENDANCE);
    
    const eventId = data.eventId;
    const committeeFilter = data.committee || 'all'; // 'all', 'heads', or committee prefix (e.g., 'YSPTIR')
    
    if (!eventId) {
      return { success: false, message: 'Event ID is required' };
    }
    
    // Get all data
    const allData = sheet.getDataRange().getValues();
    const headerRow = allData[0];
    
    // Find the event column
    let eventColIndex = -1;
    for (let col = 4; col < headerRow.length; col += 6) {
      if (headerRow[col] && headerRow[col].toString() === eventId.toString()) {
        eventColIndex = col;
        break;
      }
    }
    
    if (eventColIndex === -1) {
      return { success: false, message: 'Event not found' };
    }
    
    // Get event details
    const eventName = headerRow[eventColIndex + 1] || '';
    const eventDate = headerRow[eventColIndex + 2] || '';
    const timeInColIndex = eventColIndex + 3;
    
    // Committee prefix mapping
    const COMMITTEE_NAMES = {
      'YSPTIR': 'Membership and Internal Affairs Committee',
      'YSPTCM': 'Communications and Marketing Committee',
      'YSPTFR': 'Finance and Treasury Committee',
      'YSPTSD': 'Secretariat and Documentation Committee',
      'YSPTER': 'External Relations Committee',
      'YSPTPD': 'Program Development Committee'
    };
    
    // Valid head ID numbers
    const HEAD_ID_NUMBERS = ['25100', '25200', '25300', '25400', '25500', '25600', '25700'];
    
    // Initialize counters and attendee lists
    const analytics = {
      Present: { count: 0, attendees: [] },
      Late: { count: 0, attendees: [] },
      Absent: { count: 0, attendees: [] },
      Excused: { count: 0, attendees: [] },
      'Not Recorded': { count: 0, attendees: [] }
    };
    
    let totalAttendees = 0;
    
    // Process each person (skip header row)
    for (let row = 1; row < allData.length; row++) {
      const personRow = allData[row];
      const idCode = personRow[0] ? personRow[0].toString() : ''; // Column A - ID Code
      const name = personRow[1] ? personRow[1].toString() : ''; // Column B - Name
      const position = personRow[2] ? personRow[2].toString() : ''; // Column C - Position
      const idNumber = personRow[3] ? personRow[3].toString() : ''; // Column D - ID Number
      const timeInValue = personRow[timeInColIndex] || ''; // Time IN for this event
      
      // Skip empty rows
      if (!idCode || !name) {
        continue;
      }
      
      // Extract committee prefix from ID Code (e.g., "YSPTIR-2025" -> "YSPTIR")
      let committeePrefix = '';
      if (idCode.includes('-')) {
        committeePrefix = idCode.split('-')[0].trim();
      }
      
      // Apply committee filter
      let includeInAnalytics = false;
      
      if (committeeFilter === 'all') {
        includeInAnalytics = true;
      } else if (committeeFilter === 'heads') {
        // Check if ID Number is in the head list
        includeInAnalytics = HEAD_ID_NUMBERS.includes(idNumber);
      } else {
        // Filter by specific committee prefix
        includeInAnalytics = (committeePrefix === committeeFilter);
      }
      
      if (!includeInAnalytics) {
        continue;
      }
      
      // Determine status from Time IN value
      let status = 'Not Recorded';
      
      if (timeInValue && timeInValue.toString().trim() !== '') {
        const timeInStr = timeInValue.toString();
        if (timeInStr.includes(' - ')) {
          status = timeInStr.split(' - ')[0].trim(); // Extract "Present", "Late", "Absent", or "Excused"
        } else {
          status = timeInStr.trim();
        }
      }
      
      // Normalize status to match our analytics keys
      const normalizedStatus = ['Present', 'Late', 'Absent', 'Excused'].includes(status) ? status : 'Not Recorded';
      
      // Add to analytics
      if (analytics[normalizedStatus]) {
        analytics[normalizedStatus].count++;
        analytics[normalizedStatus].attendees.push({
          idCode: idCode,
          name: name,
          position: position,
          idNumber: idNumber,
          committee: COMMITTEE_NAMES[committeePrefix] || committeePrefix
        });
      }
      
      totalAttendees++;
    }
    
    // Format the date
    let formattedDate = '';
    if (eventDate) {
      const dateObj = new Date(eventDate);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.getFullYear() + '-' + 
                       String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(dateObj.getDate()).padStart(2, '0');
      } else {
        formattedDate = eventDate.toString();
      }
    }
    
    Logger.log('Event Analytics for ' + eventId + ': ' + JSON.stringify({
      total: totalAttendees,
      present: analytics.Present.count,
      late: analytics.Late.count,
      absent: analytics.Absent.count,
      excused: analytics.Excused.count,
      notRecorded: analytics['Not Recorded'].count
    }));
    
    return {
      success: true,
      event: {
        id: eventId,
        name: eventName,
        date: formattedDate
      },
      analytics: {
        Present: {
          count: analytics.Present.count,
          attendees: analytics.Present.attendees
        },
        Late: {
          count: analytics.Late.count,
          attendees: analytics.Late.attendees
        },
        Absent: {
          count: analytics.Absent.count,
          attendees: analytics.Absent.attendees
        },
        Excused: {
          count: analytics.Excused.count,
          attendees: analytics.Excused.attendees
        },
        'Not Recorded': {
          count: analytics['Not Recorded'].count,
          attendees: analytics['Not Recorded'].attendees
        }
      },
      totalAttendees: totalAttendees,
      committeeFilter: committeeFilter
    };
  } catch (error) {
    Logger.log('Error getting event analytics: ' + error.toString());
    return { success: false, message: 'Error getting event analytics: ' + error.toString() };
  }
}

// ===== ANNOUNCEMENTS HELPER FUNCTIONS =====

/**
 * Ensure user exists in Announcements sheet (columns Q, R, S, T)
 * Auto-populates from User Profiles if not found
 */
function ensureUserInAnnouncementsSheet(idCode) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const announcementsSheet = ss.getSheetByName(SHEETS.ANNOUNCEMENTS);
  const profilesSheet = ss.getSheetByName(SHEETS.USER_PROFILES);
  
  // Get all data from Announcements sheet
  const announcementsData = announcementsSheet.getDataRange().getValues();
  
  // Check if user already exists in column Q (index 16)
  for (let row = 1; row < announcementsData.length; row++) {
    if (announcementsData[row][16] && announcementsData[row][16].toString() === idCode.toString()) {
      return row + 1; // Return 1-indexed row number
    }
  }
  
  // User not found, fetch from User Profiles and add
  const profilesData = profilesSheet.getDataRange().getValues();
  
  for (let i = 1; i < profilesData.length; i++) {
    if (profilesData[i][18] && profilesData[i][18].toString() === idCode.toString()) {
      const fullName = profilesData[i][3] || ''; // Column D
      const position = profilesData[i][19] || ''; // Column T
      const role = profilesData[i][20] || ''; // Column U
      
      // Add user to next available row in Announcements sheet
      const nextRow = announcementsSheet.getLastRow() + 1;
      announcementsSheet.getRange(nextRow, 17).setValue(idCode); // Column Q
      announcementsSheet.getRange(nextRow, 18).setValue(fullName); // Column R
      announcementsSheet.getRange(nextRow, 19).setValue(position); // Column S
      announcementsSheet.getRange(nextRow, 20).setValue(role); // Column T
      
      Logger.log('Added user to Announcements sheet: ' + idCode + ' - ' + fullName);
      return nextRow;
    }
  }
  
  return -1; // User not found in User Profiles
}

/**
 * Get recipient emails based on recipient type
 */
function getRecipientEmails(recipientType, recipientValue) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const profilesSheet = ss.getSheetByName(SHEETS.USER_PROFILES);
  const profilesData = profilesSheet.getDataRange().getValues();
  
  const emails = [];
  const HEAD_ID_NUMBERS = ['25100', '25200', '25300', '25400', '25500', '25600', '25700'];
  
  // Committee prefix mapping
  const COMMITTEE_PREFIXES = {
    'Membership and Internal Affairs Committee': 'YSPTIR',
    'Communications and Marketing Committee': 'YSPTCM',
    'Finance and Treasury Committee': 'YSPTFR',
    'Secretariat and Documentation Committee': 'YSPTSD',
    'External Relations Committee': 'YSPTER',
    'Program Development Committee': 'YSPTPD'
  };
  
  // Skip header row
  for (let i = 1; i < profilesData.length; i++) {
    const row = profilesData[i];
    const email = row[12]; // Column M - Personal Email Address
    const idCode = row[18]; // Column S - ID Code
    const idNumber = row[3] ? row[3].toString() : ''; // Column D - ID number (from Master Attendance, but we'll use from context)
    
    if (!email) continue;
    
    let includeRecipient = false;
    
    if (recipientType === 'All Members') {
      includeRecipient = true;
    } else if (recipientType === 'Only Heads') {
      // Check ID number from Master Attendance Log
      const masterSheet = ss.getSheetByName(SHEETS.MASTER_ATTENDANCE);
      const masterData = masterSheet.getDataRange().getValues();
      
      for (let j = 1; j < masterData.length; j++) {
        if (masterData[j][0] && masterData[j][0].toString() === idCode.toString()) {
          const personIdNumber = masterData[j][3] ? masterData[j][3].toString() : '';
          if (HEAD_ID_NUMBERS.includes(personIdNumber)) {
            includeRecipient = true;
          }
          break;
        }
      }
    } else if (recipientType === 'Specific Committee') {
      // Extract committee prefix from ID Code
      const prefix = COMMITTEE_PREFIXES[recipientValue];
      if (prefix && idCode && idCode.toString().startsWith(prefix)) {
        includeRecipient = true;
      }
    } else if (recipientType === 'Specific Person/s') {
      // recipientValue contains comma-separated ID Codes
      const targetIdCodes = recipientValue.split(',').map(id => id.trim());
      if (targetIdCodes.includes(idCode.toString())) {
        includeRecipient = true;
      }
    }
    
    if (includeRecipient && email) {
      emails.push(email.toString());
    }
  }
  
  return emails;
}

/**
 * Check if user is a recipient of an announcement
 */
function isUserRecipient(userIdCode, recipientType, recipientValue) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const HEAD_ID_NUMBERS = ['25100', '25200', '25300', '25400', '25500', '25600', '25700'];
  
  // Committee prefix mapping
  const COMMITTEE_PREFIXES = {
    'Membership and Internal Affairs Committee': 'YSPTIR',
    'Communications and Marketing Committee': 'YSPTCM',
    'Finance and Treasury Committee': 'YSPTFR',
    'Secretariat and Documentation Committee': 'YSPTSD',
    'External Relations Committee': 'YSPTER',
    'Program Development Committee': 'YSPTPD'
  };
  
  if (recipientType === 'All Members') {
    return true;
  } else if (recipientType === 'Only Heads') {
    // Check if user's ID Number is in heads list
    const masterSheet = ss.getSheetByName(SHEETS.MASTER_ATTENDANCE);
    const masterData = masterSheet.getDataRange().getValues();
    
    for (let i = 1; i < masterData.length; i++) {
      if (masterData[i][0] && masterData[i][0].toString() === userIdCode.toString()) {
        const idNumber = masterData[i][3] ? masterData[i][3].toString() : '';
        return HEAD_ID_NUMBERS.includes(idNumber);
      }
    }
    return false;
  } else if (recipientType === 'Specific Committee') {
    const prefix = COMMITTEE_PREFIXES[recipientValue];
    return prefix && userIdCode.toString().startsWith(prefix);
  } else if (recipientType === 'Specific Person/s') {
    const targetIdCodes = recipientValue.split(',').map(id => id.trim());
    return targetIdCodes.includes(userIdCode.toString());
  }
  
  return false;
}

// ===== CREATE ANNOUNCEMENT HANDLER =====
function handleCreateAnnouncement(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const announcementsSheet = ss.getSheetByName(SHEETS.ANNOUNCEMENTS);
    const profilesSheet = ss.getSheetByName(SHEETS.USER_PROFILES);
    
    // Validate required fields
    if (!data.title || !data.subject || !data.body || !data.recipientType || !data.authorIdCode) {
      return { success: false, message: 'Missing required fields' };
    }
    
    // Get author information
    const profilesData = profilesSheet.getDataRange().getValues();
    let authorName = '';
    let authorRole = '';
    
    for (let i = 1; i < profilesData.length; i++) {
      if (profilesData[i][18] && profilesData[i][18].toString() === data.authorIdCode.toString()) {
        authorName = profilesData[i][3] || ''; // Column D - Full Name
        authorRole = profilesData[i][20] || ''; // Column U - Role
        
        // Check if user can create announcements (Heads, Auditor, or Admin)
        let canCreateAnnouncement = false;
        
        if (authorRole === 'Auditor' || authorRole === 'Admin') {
          // Auditor and Admin can always create announcements
          canCreateAnnouncement = true;
        } else if (authorRole === 'Head') {
          // For Heads, verify they have a valid Head ID Number
          const masterSheet = ss.getSheetByName(SHEETS.MASTER_ATTENDANCE);
          const masterData = masterSheet.getDataRange().getValues();
          
          for (let j = 1; j < masterData.length; j++) {
            if (masterData[j][0] && masterData[j][0].toString() === data.authorIdCode.toString()) {
              const idNumber = masterData[j][3] ? masterData[j][3].toString() : '';
              const HEAD_ID_NUMBERS = ['25100', '25200', '25300', '25400', '25500', '25600', '25700'];
              if (HEAD_ID_NUMBERS.includes(idNumber)) {
                canCreateAnnouncement = true;
              }
              break;
            }
          }
        }
        
        if (!canCreateAnnouncement) {
          return { success: false, message: 'Only Heads, Auditor, and Admin can create announcements' };
        }
        break;
      }
    }
    
    if (!authorName) {
      return { success: false, message: 'Author not found in User Profiles' };
    }
    
    // Generate Announcement ID (ANN-YYYY-###)
    const announcementsData = announcementsSheet.getDataRange().getValues();
    const currentYear = new Date().getFullYear();
    let maxNumber = 0;
    
    // Find highest announcement number for current year
    for (let i = 1; i < announcementsData.length; i++) {
      const annId = announcementsData[i][1]; // Column B - Announcement ID
      if (annId) {
        const match = annId.toString().match(/^ANN-(\d{4})-(\d{3})$/);
        if (match && parseInt(match[1]) === currentYear) {
          const num = parseInt(match[2]);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }
    
    const newAnnouncementId = 'ANN-' + currentYear + '-' + String(maxNumber + 1).padStart(3, '0');
    
    // Get PH timezone timestamp
    const now = new Date();
    const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    
    // Determine recipient value
    let recipientValue = data.recipientValue || '';
    if (data.recipientType === 'All Members') {
      recipientValue = 'All Members';
    } else if (data.recipientType === 'Only Heads') {
      recipientValue = 'Only Heads';
    } else if (data.recipientType === 'Specific Committee') {
      recipientValue = data.recipientValue; // Committee name
    } else if (data.recipientType === 'Specific Person/s') {
      recipientValue = data.recipientValue; // Comma-separated ID Codes
    }
    
    // Get recipient emails
    const recipientEmails = getRecipientEmails(data.recipientType, recipientValue);
    
    if (recipientEmails.length === 0) {
      return { success: false, message: 'No recipients found for the selected criteria' };
    }
    
    // Send emails
    let emailStatus = 'Sent';
    try {
      const emailSubject = data.subject;
      const formattedDate = phTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      
      const emailBody = 
        '====================================================================\n' +
        '                 OFFICIAL ANNOUNCEMENT NOTICE\n' +
        '====================================================================\n\n' +
        'Title: ' + data.title + '\n' +
        'Subject: ' + data.subject + '\n' +
        'Date Released: ' + formattedDate + '\n' +
        'Author: ' + authorName + '\n' +
        'Announcement ID: ' + newAnnouncementId + '\n' +
        'Intended Recipient(s): ' + data.recipientType + '\n\n' +
        '--------------------------------------------------------------------\n' +
        'MESSAGE:\n' +
        '--------------------------------------------------------------------\n' +
        data.body + '\n\n' +
        '--------------------------------------------------------------------\n' +
        'End of Message\n' +
        '--------------------------------------------------------------------\n\n' +
        'Youth Service Philippines – Tagum Chapter\n' +
        'If you wish to see more information or related updates, you may visit our official web application:\n' +
        '🌐 Web App: https://ysp-webapp.vercel.app\n\n' +
        '--------------------------------------------------------------------\n' +
        'OFFICIAL NOTICE AND DISCLAIMER:\n' +
        '--------------------------------------------------------------------\n' +
        'This email has been formally issued by the Youth Service Philippines – Tagum Chapter.\n' +
        'It is intended solely for the individual(s) or organization(s) to whom it is addressed.\n' +
        'Unauthorized review, dissemination, or duplication of this message is strictly prohibited.\n\n' +
        'If you believe this email was sent to you in error, please contact:\n' +
        'Ezequiel John B. Crisostomo\n' +
        'Membership and Internal Affairs Officer\n' +
        'Youth Service Philippines – Tagum Chapter\n' +
        '--------------------------------------------------------------------';
      
      MailApp.sendEmail({
        to: recipientEmails.join(','),
        subject: emailSubject,
        body: emailBody
      });
      
      Logger.log('Sent announcement emails to ' + recipientEmails.length + ' recipients');
    } catch (emailError) {
      emailStatus = 'Error: ' + emailError.toString();
      Logger.log('Error sending emails: ' + emailError.toString());
    }
    
    // Add announcement to sheet (Columns A-J)
    const nextRow = announcementsSheet.getLastRow() + 1;
    announcementsSheet.getRange(nextRow, 1, 1, 10).setValues([[
      phTime.toISOString(),           // A - Timestamp
      newAnnouncementId,              // B - Announcement ID
      data.authorIdCode,              // C - Author ID Code
      authorName,                     // D - Author Name
      data.title,                     // E - Title
      data.subject,                   // F - Subject
      data.body,                      // G - Body
      data.recipientType,             // H - Recipient Type
      recipientValue,                 // I - Recipient Value
      emailStatus                     // J - Email Status
    ]]);
    
    // Add announcement status columns (U onwards)
    const headerRow = announcementsSheet.getRange(1, 1, 1, announcementsSheet.getLastColumn()).getValues()[0];
    
    // Find next available column (after existing announcements)
    let nextCol = 21; // Start at column U (index 20, 1-indexed = 21)
    
    // Find the last used column for announcements
    for (let col = 20; col < headerRow.length; col += 2) {
      if (!headerRow[col] || headerRow[col].toString().trim() === '') {
        nextCol = col + 1; // 1-indexed
        break;
      } else {
        nextCol = col + 3; // Skip to next pair (col + 2 for next announcement)
      }
    }
    
    // Add announcement ID and Title to row 1
    announcementsSheet.getRange(1, nextCol).setValue(newAnnouncementId); // Announcement ID
    announcementsSheet.getRange(1, nextCol + 1).setValue(data.title); // Title
    
    // Initialize read/unread status for all users in the sheet
    const announcementsAllData = announcementsSheet.getDataRange().getValues();
    
    for (let row = 1; row < announcementsAllData.length; row++) {
      const userIdCode = announcementsAllData[row][16]; // Column Q - ID Code
      
      if (userIdCode) {
        const isRecipient = isUserRecipient(userIdCode.toString(), data.recipientType, recipientValue);
        const status = isRecipient ? 'Unread' : 'N/A';
        
        announcementsSheet.getRange(row + 1, nextCol).setValue(status);
      }
    }
    
    Logger.log('Created announcement: ' + newAnnouncementId + ' - ' + data.title);
    
    return {
      success: true,
      message: 'Announcement created and sent successfully',
      announcement: {
        id: newAnnouncementId,
        title: data.title,
        subject: data.subject,
        timestamp: phTime.toISOString(),
        authorName: authorName,
        recipientType: data.recipientType,
        emailStatus: emailStatus,
        recipientCount: recipientEmails.length
      }
    };
  } catch (error) {
    Logger.log('Error creating announcement: ' + error.toString());
    return { success: false, message: 'Error creating announcement: ' + error.toString() };
  }
}

// ===== GET ANNOUNCEMENTS HANDLER =====
function handleGetAnnouncements(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const announcementsSheet = ss.getSheetByName(SHEETS.ANNOUNCEMENTS);
    
    const userIdCode = data.idCode;
    
    if (!userIdCode) {
      return { success: false, message: 'User ID Code is required' };
    }
    
    // Ensure user exists in Announcements sheet
    ensureUserInAnnouncementsSheet(userIdCode);
    
    // Get all data
    const allData = announcementsSheet.getDataRange().getValues();
    const headerRow = allData[0];
    
    // Find user's row
    let userRowIndex = -1;
    for (let row = 1; row < allData.length; row++) {
      if (allData[row][16] && allData[row][16].toString() === userIdCode.toString()) {
        userRowIndex = row;
        break;
      }
    }
    
    if (userRowIndex === -1) {
      return { success: false, message: 'User not found in Announcements sheet' };
    }
    
    const announcements = [];
    
    // Process announcements (rows 2 onwards, columns A-J)
    for (let row = 1; row < allData.length; row++) {
      const announcementRow = allData[row];
      
      // Skip if no announcement ID
      if (!announcementRow[1]) continue;
      
      const annId = announcementRow[1].toString();
      const recipientType = announcementRow[7] || '';
      const recipientValue = announcementRow[8] || '';
      
      // Check if user is a recipient
      const isRecipient = isUserRecipient(userIdCode.toString(), recipientType.toString(), recipientValue.toString());
      
      if (!isRecipient) continue;
      
      // Find the announcement's status column for this user
      let readStatus = 'Unread';
      
      // Search for announcement ID in header row (columns U onwards)
      for (let col = 20; col < headerRow.length; col += 2) {
        if (headerRow[col] && headerRow[col].toString() === annId) {
          // Found the announcement column, get user's status
          readStatus = allData[userRowIndex][col] || 'Unread';
          break;
        }
      }
      
      // Format timestamp
      let formattedTimestamp = '';
      if (announcementRow[0]) {
        const dateObj = new Date(announcementRow[0]);
        if (!isNaN(dateObj.getTime())) {
          formattedTimestamp = dateObj.toISOString();
        } else {
          formattedTimestamp = announcementRow[0].toString();
        }
      }
      
      announcements.push({
        announcementId: annId,
        timestamp: formattedTimestamp,
        authorIdCode: announcementRow[2] || '',
        authorName: announcementRow[3] || '',
        title: announcementRow[4] || '',
        subject: announcementRow[5] || '',
        body: announcementRow[6] || '',
        recipientType: recipientType,
        recipientValue: recipientValue.toString(),
        emailStatus: announcementRow[9] || '',
        readStatus: readStatus
      });
    }
    
    // Sort by timestamp (newest first)
    announcements.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB - dateA;
    });
    
    Logger.log('Retrieved ' + announcements.length + ' announcements for ' + userIdCode);
    
    return {
      success: true,
      announcements: announcements
    };
  } catch (error) {
    Logger.log('Error fetching announcements: ' + error.toString());
    return { success: false, message: 'Error fetching announcements: ' + error.toString() };
  }
}

// ===== MARK ANNOUNCEMENT AS READ HANDLER =====
function handleMarkAnnouncementAsRead(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const announcementsSheet = ss.getSheetByName(SHEETS.ANNOUNCEMENTS);
    
    const userIdCode = data.idCode;
    const announcementId = data.announcementId;
    
    if (!userIdCode || !announcementId) {
      return { success: false, message: 'User ID Code and Announcement ID are required' };
    }
    
    // Get all data
    const allData = announcementsSheet.getDataRange().getValues();
    const headerRow = allData[0];
    
    // Find user's row
    let userRowIndex = -1;
    for (let row = 1; row < allData.length; row++) {
      if (allData[row][16] && allData[row][16].toString() === userIdCode.toString()) {
        userRowIndex = row;
        break;
      }
    }
    
    if (userRowIndex === -1) {
      return { success: false, message: 'User not found in Announcements sheet' };
    }
    
    // Find announcement column
    let annColIndex = -1;
    for (let col = 20; col < headerRow.length; col += 2) {
      if (headerRow[col] && headerRow[col].toString() === announcementId.toString()) {
        annColIndex = col;
        break;
      }
    }
    
    if (annColIndex === -1) {
      return { success: false, message: 'Announcement not found' };
    }
    
    // Check current status
    const currentStatus = allData[userRowIndex][annColIndex] || '';
    
    if (currentStatus === 'N/A') {
      return { success: false, message: 'You are not a recipient of this announcement' };
    }
    
    // Mark as Read
    announcementsSheet.getRange(userRowIndex + 1, annColIndex + 1).setValue('Read');
    
    Logger.log('Marked announcement ' + announcementId + ' as Read for user ' + userIdCode);
    
    return {
      success: true,
      message: 'Announcement marked as read'
    };
  } catch (error) {
    Logger.log('Error marking announcement as read: ' + error.toString());
    return { success: false, message: 'Error marking announcement as read: ' + error.toString() };
  }
}

// ===== CREATE FEEDBACK HANDLER =====
function handleCreateFeedback(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const feedbackSheet = ss.getSheetByName(SHEETS.FEEDBACK);
    
    // Validate required fields
    if (!data.message || !data.authorName) {
      return { success: false, message: 'Message and author name are required' };
    }
    
    // Get PH timezone timestamp
    const now = new Date();
    const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    
    // Generate Reference ID (FBC-YYYY-###)
    const feedbackData = feedbackSheet.getDataRange().getValues();
    const currentYear = new Date().getFullYear();
    let maxNumber = 0;
    
    // Find highest feedback number for current year
    for (let i = 1; i < feedbackData.length; i++) {
      const refId = feedbackData[i][4]; // Column E - Reference ID
      if (refId) {
        const match = refId.toString().match(/^FBC-(\d{4})-(\d{3})$/);
        if (match && parseInt(match[1]) === currentYear) {
          const num = parseInt(match[2]);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }
    
    const newReferenceId = 'FBC-' + currentYear + '-' + String(maxNumber + 1).padStart(3, '0');
    
    // Determine author ID code (Guest if not provided)
    const authorIdCode = data.authorIdCode || 'Guest';
    
    // Add feedback to sheet (Columns A-E, F-I will be empty until replied)
    const nextRow = feedbackSheet.getLastRow() + 1;
    feedbackSheet.getRange(nextRow, 1, 1, 5).setValues([[
      phTime.toISOString(),           // A - Timestamp
      data.authorName,                // B - Author Name
      authorIdCode,                   // C - Author ID Code
      data.message,                   // D - Feedback Message
      newReferenceId                  // E - Reference ID
    ]]);
    
    Logger.log('Created feedback: ' + newReferenceId + ' by ' + data.authorName);
    
    return {
      success: true,
      message: 'Feedback submitted successfully',
      feedback: {
        referenceId: newReferenceId,
        timestamp: phTime.toISOString(),
        authorName: data.authorName,
        authorIdCode: authorIdCode,
        message: data.message
      }
    };
  } catch (error) {
    Logger.log('Error creating feedback: ' + error.toString());
    return { success: false, message: 'Error creating feedback: ' + error.toString() };
  }
}

// ===== GET FEEDBACK HANDLER =====
function handleGetFeedback(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const feedbackSheet = ss.getSheetByName(SHEETS.FEEDBACK);
    
    const userIdCode = data.idCode;
    const userName = data.name;
    const userRole = data.role;
    
    if (!userIdCode && !userName) {
      return { success: false, message: 'User ID Code or Name is required' };
    }
    
    // Get all feedback data
    const feedbackData = feedbackSheet.getDataRange().getValues();
    const feedbackList = [];
    
    // Skip header row
    for (let i = 1; i < feedbackData.length; i++) {
      const row = feedbackData[i];
      
      // Skip empty rows
      if (!row[4]) continue;
      
      const timestamp = row[0];
      const authorName = row[1] || '';
      const authorIdCode = row[2] || '';
      const message = row[3] || '';
      const referenceId = row[4] || '';
      const replyTimestamp = row[5] || '';
      const replierName = row[6] || '';
      const replierIdCode = row[7] || '';
      const replyMessage = row[8] || '';
      
      // Check if user should see this feedback
      let shouldInclude = false;
      
      if (userRole === 'Admin' || userRole === 'Auditor') {
        // Admin and Auditor see all feedback
        shouldInclude = true;
      } else {
        // Regular users see only their own feedback
        if (authorIdCode === 'Guest') {
          // For guests, match by name
          shouldInclude = (authorName.toLowerCase() === userName.toLowerCase());
        } else {
          // For members, match by ID Code
          shouldInclude = (authorIdCode === userIdCode);
        }
      }
      
      if (!shouldInclude) continue;
      
      // Format timestamp
      let formattedTimestamp = '';
      if (timestamp) {
        const dateObj = new Date(timestamp);
        if (!isNaN(dateObj.getTime())) {
          formattedTimestamp = dateObj.toISOString();
        } else {
          formattedTimestamp = timestamp.toString();
        }
      }
      
      // Format reply timestamp
      let formattedReplyTimestamp = '';
      if (replyTimestamp) {
        const dateObj = new Date(replyTimestamp);
        if (!isNaN(dateObj.getTime())) {
          formattedReplyTimestamp = dateObj.toISOString();
        } else {
          formattedReplyTimestamp = replyTimestamp.toString();
        }
      }
      
      // Build feedback object
      const feedbackObj = {
        referenceId: referenceId,
        timestamp: formattedTimestamp,
        authorName: authorName,
        message: message,
        hasReply: !!(replyMessage && replyMessage.toString().trim() !== '')
      };
      
      // Show author ID only to Admin/Auditor
      if (userRole === 'Admin' || userRole === 'Auditor') {
        feedbackObj.authorIdCode = authorIdCode;
      }
      
      // Add reply information if exists
      if (feedbackObj.hasReply) {
        feedbackObj.replyTimestamp = formattedReplyTimestamp;
        feedbackObj.replyMessage = replyMessage;
        
        // Show replier info only to Admin/Auditor
        if (userRole === 'Admin' || userRole === 'Auditor') {
          feedbackObj.replierName = replierName;
          feedbackObj.replierIdCode = replierIdCode;
        }
      }
      
      feedbackList.push(feedbackObj);
    }
    
    // Sort by timestamp (newest first)
    feedbackList.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB - dateA;
    });
    
    Logger.log('Retrieved ' + feedbackList.length + ' feedback items for ' + (userIdCode || userName));
    
    return {
      success: true,
      feedback: feedbackList
    };
  } catch (error) {
    Logger.log('Error fetching feedback: ' + error.toString());
    return { success: false, message: 'Error fetching feedback: ' + error.toString() };
  }
}

// ===== REPLY TO FEEDBACK HANDLER =====
function handleReplyToFeedback(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const feedbackSheet = ss.getSheetByName(SHEETS.FEEDBACK);
    
    // Validate required fields
    if (!data.referenceId || !data.reply || !data.replierName || !data.replierIdCode) {
      return { success: false, message: 'Reference ID, reply, replier name, and replier ID are required' };
    }
    
    // Check if replier is Admin or Auditor
    if (data.replierRole !== 'Admin' && data.replierRole !== 'Auditor') {
      return { success: false, message: 'Only Admin and Auditor can reply to feedback' };
    }
    
    // Get all feedback data
    const feedbackData = feedbackSheet.getDataRange().getValues();
    
    // Find the feedback by Reference ID
    let feedbackRowIndex = -1;
    for (let i = 1; i < feedbackData.length; i++) {
      if (feedbackData[i][4] && feedbackData[i][4].toString() === data.referenceId.toString()) {
        feedbackRowIndex = i;
        break;
      }
    }
    
    if (feedbackRowIndex === -1) {
      return { success: false, message: 'Feedback not found' };
    }
    
    // Check if already replied
    const existingReply = feedbackData[feedbackRowIndex][8]; // Column I - Reply Message
    if (existingReply && existingReply.toString().trim() !== '') {
      return { success: false, message: 'This feedback has already been replied to' };
    }
    
    // Get PH timezone timestamp
    const now = new Date();
    const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    
    // Add reply (Columns F-I)
    feedbackSheet.getRange(feedbackRowIndex + 1, 6, 1, 4).setValues([[
      phTime.toISOString(),           // F - Reply Timestamp
      data.replierName,               // G - Replier Name
      data.replierIdCode,             // H - Replier ID Code
      data.reply                      // I - Reply Message
    ]]);
    
    Logger.log('Replied to feedback ' + data.referenceId + ' by ' + data.replierName);
    
    return {
      success: true,
      message: 'Reply submitted successfully',
      reply: {
        referenceId: data.referenceId,
        replyTimestamp: phTime.toISOString(),
        replierName: data.replierName,
        replierIdCode: data.replierIdCode,
        replyMessage: data.reply
      }
    };
  } catch (error) {
    Logger.log('Error replying to feedback: ' + error.toString());
    return { success: false, message: 'Error replying to feedback: ' + error.toString() };
  }
}

// ===== GET HOMEPAGE CONTENT HANDLER =====
function handleGetHomepageContent(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const homepageSheet = ss.getSheetByName(SHEETS.HOMEPAGE_CONTENT);
    
    if (!homepageSheet) {
      return { success: false, message: 'Homepage Content sheet not found' };
    }
    
    // Get all data from Homepage Content sheet
    const homepageData = homepageSheet.getDataRange().getValues();
    
    // ===================================================================
    // CRITICAL: NO HEADER ROW IN SHEET!
    // Sheet Row 1 = Array Index 0 (contains vision content)
    // ===================================================================
    
    // YOUR EXACT SHEET STRUCTURE:
    // SHEET ROW 1  (index 0): vision - Column B has Vision content
    // SHEET ROW 2  (index 1): mission - Column B has Mission content  
    // SHEET ROW 3  (index 2): Section 3... - Column B has Pillars content
    // SHEET ROW 4  (index 3): orgChartUrl
    // SHEET ROW 5  (index 4): facebookUrl
    // SHEET ROW 6  (index 5): email
    // SHEET ROW 7  (index 6): founderName
    // SHEET ROW 8  (index 7): aboutYSP
    // SHEET ROW 9  (index 8): projectImageUrl_1
    // SHEET ROW 10 (index 9): projectDesc_1
    // SHEET ROW 11 (index 10): projectImageUrl_2
    // SHEET ROW 12 (index 11): projectDesc_2
    // etc...
    
    let vision = '';
    let mission = '';
    let objectives = '';
    let orgChartUrl = '';
    let facebookUrl = '';
    let email = '';
    let founderName = '';
    let aboutYSP = '';
    
    // Read from index 0 onwards (NO header row offset!)
    if (homepageData.length > 0) vision = homepageData[0][1] || ''; // SHEET ROW 1, Column B
    if (homepageData.length > 1) mission = homepageData[1][1] || ''; // SHEET ROW 2, Column B
    if (homepageData.length > 2) objectives = homepageData[2][1] || ''; // SHEET ROW 3, Column B
    if (homepageData.length > 3) orgChartUrl = homepageData[3][1] || ''; // SHEET ROW 4, Column B
    if (homepageData.length > 4) facebookUrl = homepageData[4][1] || ''; // SHEET ROW 5, Column B
    if (homepageData.length > 5) email = homepageData[5][1] || ''; // SHEET ROW 6, Column B
    if (homepageData.length > 6) founderName = homepageData[6][1] || ''; // SHEET ROW 7, Column B
    if (homepageData.length > 7) aboutYSP = homepageData[7][1] || ''; // SHEET ROW 8, Column B
    
    if (homepageData.length > 7) aboutYSP = homepageData[7][1] || ''; // SHEET ROW 8, Column B
    
    // Keep objectives as-is, don't split
    const objectivesArray = objectives ? [objectives] : [];
    
    // Extract projects starting from SHEET ROW 9 (array index 8)
    // SHEET ROW 9  (index 8): projectImageUrl_1
    // SHEET ROW 10 (index 9): projectDesc_1
    // SHEET ROW 11 (index 10): projectImageUrl_2
    // SHEET ROW 12 (index 11): projectDesc_2
    // etc...
    const projects = [];
    let projectIndex = 1;
    let rowIndex = 8; // Start from array index 8 (SHEET ROW 9)
    
    while (rowIndex < homepageData.length) {
      const imageUrl = homepageData[rowIndex][1] || ''; // projectImageUrl_X
      const description = homepageData[rowIndex + 1] ? (homepageData[rowIndex + 1][1] || '') : ''; // projectDesc_X
      
      if (!imageUrl && !description) {
        break; // No more projects
      }
      
      if (imageUrl || description) {
        projects.push({
          image: imageUrl,
          description: description,
          title: 'Project ' + projectIndex
        });
        projectIndex++;
      }
      
      rowIndex += 2; // Move to next project (skip 2 rows)
    }
    
    Logger.log('Retrieved homepage content with ' + projects.length + ' projects');
    
    return {
      success: true,
      content: {
        mission: mission,
        vision: vision,
        about: aboutYSP,
        objectives: objectivesArray,
        orgChartUrl: orgChartUrl,
        founderName: founderName,
        email: email,
        facebookUrl: facebookUrl,
        projects: projects
      }
    };
  } catch (error) {
    Logger.log('Error fetching homepage content: ' + error.toString());
    return { success: false, message: 'Error fetching homepage content: ' + error.toString() };
  }
}

// ===== GET USER PROFILE =====
/**
 * Retrieves the full profile information for a specific user
 * @param {Object} data - Contains username or idCode to identify the user
 * @returns {Object} - User profile with all fields
 */
function handleGetUserProfile(data) {
  try {
    const { username, idCode } = data;
    
    if (!username && !idCode) {
      return { success: false, message: 'Username or ID Code is required' };
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const userProfilesSheet = ss.getSheetByName(SHEETS.USER_PROFILES);
    
    if (!userProfilesSheet) {
      return { success: false, message: 'User Profiles sheet not found' };
    }
    
    const userProfilesData = userProfilesSheet.getDataRange().getValues();
    
    // Skip header row (index 0), start from row 1
    for (let i = 1; i < userProfilesData.length; i++) {
      const row = userProfilesData[i];
      const rowUsername = row[13]; // Column N - Username
      const rowIdCode = row[18]; // Column S - ID Code
      
      // Match by username or ID code
      if ((username && rowUsername === username) || (idCode && rowIdCode === idCode)) {
        // Extract all profile fields
        const fullName = row[3] || ''; // Column D - Full name
        const email = row[1] || ''; // Column B - Email Address
        const dateOfBirth = row[4] || ''; // Column E - Date of Birth
        const ageFromSheet = row[5] || ''; // Column F - Age
        const gender = row[6] || ''; // Column G - Sex/Gender
        const pronouns = row[7] || ''; // Column H - Pronouns
        const civilStatus = row[8] || ''; // Column I - Civil Status
        const contactNumber = row[9] || ''; // Column J - Contact Number
        const religion = row[10] || ''; // Column K - Religion
        const nationality = row[11] || ''; // Column L - Nationality
        const password = row[14] || ''; // Column O - Password
        const position = row[19] || ''; // Column T - Position
        const role = row[20] || ''; // Column U - Role
        const profilePictureURL = row[21] || ''; // Column V - ProfilePictureURL
        
        // Calculate age from date of birth if not provided in sheet
        let age = ageFromSheet;
        if (!age && dateOfBirth) {
          try {
            const birthDate = new Date(dateOfBirth);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
          } catch (error) {
            Logger.log('Error calculating age: ' + error.toString());
          }
        }
        
        // Format birthday for display
        let formattedBirthday = dateOfBirth;
        if (dateOfBirth) {
          try {
            const birthDate = new Date(dateOfBirth);
            formattedBirthday = Utilities.formatDate(birthDate, Session.getScriptTimeZone(), 'MMMM dd, yyyy');
          } catch (error) {
            Logger.log('Error formatting birthday: ' + error.toString());
          }
        }
        
        return {
          success: true,
          profile: {
            fullName: fullName,
            username: rowUsername,
            idCode: rowIdCode,
            email: email,
            contactNumber: contactNumber,
            birthday: formattedBirthday,
            age: age.toString(),
            gender: gender,
            pronouns: pronouns,
            civilStatus: civilStatus,
            religion: religion,
            nationality: nationality,
            password: password,
            position: position,
            role: role,
            profilePictureURL: profilePictureURL
          }
        };
      }
    }
    
    return { success: false, message: 'User not found' };
    
  } catch (error) {
    Logger.log('Error fetching user profile: ' + error.toString());
    return { success: false, message: 'Error fetching user profile: ' + error.toString() };
  }
}


