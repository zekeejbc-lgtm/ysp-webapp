// ===== CONFIGURATION =====
const SPREADSHEET_ID = '1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU';
const PROFILE_PICTURES_FOLDER_ID = '192-pVluL93fYKpyJoukfi_H5az_9fqFK'; // Google Drive folder for profile pictures
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
    case 'updateProfile':
      return handleUpdateProfile(data);
    case 'uploadProfilePicture':
      return handleUploadProfilePicture(data);
    case 'updateProfilePicture':
      return handleUpdateProfilePicture(data);
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
      
      const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5; }
    .header { background: linear-gradient(135deg, #f6421f 0%, #ee8724 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 0; }
    .header h1 { font-family: 'Lexend', sans-serif; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { font-family: 'Lexend', sans-serif; margin: 8px 0 0 0; font-size: 15px; font-weight: 400; opacity: 0.95; }
    .content { background-color: #ffffff; padding: 35px 30px; }
    .footer { background-color: #f8f9fa; padding: 25px 30px; text-align: center; color: #6c757d; font-size: 14px; }
    .alert-warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px 18px; border-radius: 6px; margin: 25px 0; color: #856404; }
    .developer-info { margin-top: 25px; padding-top: 25px; border-top: 2px solid #dee2e6; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f6421f 0%, #ee8724 100%); color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 8px; box-shadow: 0 4px 12px rgba(246, 66, 31, 0.3); transition: transform 0.2s; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(246, 66, 31, 0.4); }
    .btn-facebook { background: #1877f2; background: linear-gradient(135deg, #1877f2 0%, #0c5bad 100%); box-shadow: 0 4px 12px rgba(24, 119, 242, 0.3); }
    .btn-facebook:hover { box-shadow: 0 6px 16px rgba(24, 119, 242, 0.4); }
    .logo { max-width: 90px; height: auto; margin-bottom: 18px; }
    .button-group { text-align: center; margin: 30px 0; }
    .announcement-details { background-color: #f8f9fa; border-left: 4px solid #f6421f; padding: 18px 20px; margin: 25px 0; border-radius: 6px; }
    .message-box { background-color: #ffffff; border: 2px solid #e9ecef; padding: 24px; margin: 25px 0; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://i.imgur.com/J4wddTW.png" alt="YSP Logo" class="logo">
      <h1>Youth Service Philippines</h1>
      <p>Tagum Chapter</p>
    </div>
    
    <div class="content">
      <h2 style="color: #f6421f; margin-top: 0;">Official Announcement Notice</h2>
      
      <div class="announcement-details">
        <p style="margin: 5px 0;"><strong>Title:</strong> ${data.title}</p>
        <p style="margin: 5px 0;"><strong>Subject:</strong> ${data.subject}</p>
        <p style="margin: 5px 0;"><strong>Date Released:</strong> ${formattedDate}</p>
        <p style="margin: 5px 0;"><strong>Author:</strong> ${authorName}</p>
        <p style="margin: 5px 0;"><strong>Announcement ID:</strong> ${newAnnouncementId}</p>
        <p style="margin: 5px 0;"><strong>Intended Recipient(s):</strong> ${data.recipientType}</p>
      </div>
      
      <div class="message-box">
        <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #f6421f; padding-bottom: 10px;">Message:</h3>
        <div style="white-space: pre-wrap; color: #333;">${data.body}</div>
      </div>
      
      <div class="alert-warning">
        <strong>⚠️ Official Notice:</strong> This email has been formally issued by the Youth Service Philippines – Tagum Chapter. It is intended solely for the individual(s) or organization(s) to whom it is addressed. Unauthorized review, dissemination, or duplication of this message is strictly prohibited.
      </div>
      
      <div class="button-group">
        <a href="https://ysp-webapp.vercel.app" class="btn">Access Web App</a>
        <a href="https://www.facebook.com/YSPTagumChapter" class="btn btn-facebook">Visit Facebook Page</a>
      </div>
      
      <p style="margin-top: 25px; text-align: center; color: #666; font-size: 14px;">
        For announcements and more information, visit our platforms:<br>
        <a href="https://ysp-webapp.vercel.app" style="color: #f6421f; text-decoration: none; font-weight: 500;">Web App</a> • 
        <a href="https://www.facebook.com/YSPTagumChapter" style="color: #1877f2; text-decoration: none; font-weight: 500;">Facebook</a>
      </p>
      
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 10px 0;">This is an automated notification from the YSP Management System.</p>
      
      <div class="developer-info">
        <p style="margin: 5px 0; font-weight: bold;">System Developer:</p>
        <p style="margin: 5px 0;"><strong>Ezequiel John B. Crisostomo</strong></p>
        <p style="margin: 5px 0;">Membership and Internal Affairs Officer</p>
        <p style="margin: 5px 0;">Youth Service Philippines - Tagum Chapter</p>
      </div>
      
      <p style="margin-top: 20px; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} Youth Service Philippines - Tagum Chapter. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
      `;
      
      MailApp.sendEmail({
        to: recipientEmails.join(','),
        subject: emailSubject,
        htmlBody: htmlBody
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

// ===== SEND PROFILE UPDATE EMAIL =====
/**
 * Sends an email notification when profile is updated
 * @param {string} fullName - User's full name
 * @param {string} email - Email address to send to
 * @param {Array} changes - Array of changed fields with old and new values
 * @param {Array} unchanged - Array of unchanged field names
 */
function sendProfileUpdateEmail(fullName, email, changes, unchanged) {
  if (!email || email.trim() === '') {
    Logger.log('No email address provided, skipping notification');
    return;
  }
  
  const timestamp = new Date();
  const dateStr = Utilities.formatDate(timestamp, 'Asia/Manila', 'MMMM dd, yyyy');
  const timeStr = Utilities.formatDate(timestamp, 'Asia/Manila', 'hh:mm a');
  
  // Build changes HTML
  let changesHtml = '';
  if (changes.length > 0) {
    changesHtml = '<div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">';
    changesHtml += '<h3 style="color: #856404; margin-top: 0;">📝 Changes Made:</h3>';
    changesHtml += '<table style="width: 100%; border-collapse: collapse;">';
    changes.forEach(function(change) {
      changesHtml += '<tr style="border-bottom: 1px solid #ddd;">';
      changesHtml += '<td style="padding: 10px; font-weight: bold; color: #333;">' + change.field + '</td>';
      changesHtml += '<td style="padding: 10px;">';
      changesHtml += '<span style="color: #dc3545; text-decoration: line-through;">' + (change.old || '(empty)') + '</span>';
      changesHtml += ' → ';
      changesHtml += '<span style="color: #28a745; font-weight: bold;">' + change.new + '</span>';
      changesHtml += '</td>';
      changesHtml += '</tr>';
    });
    changesHtml += '</table>';
    changesHtml += '</div>';
  }
  
  // Build unchanged HTML
  let unchangedHtml = '';
  if (unchanged.length > 0) {
    unchangedHtml = '<div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">';
    unchangedHtml += '<h3 style="color: #155724; margin-top: 0;">✓ Unchanged Fields:</h3>';
    unchangedHtml += '<p style="color: #155724; margin: 0;">' + unchanged.join(', ') + '</p>';
    unchangedHtml += '</div>';
  }
  
  const subject = 'Your YSP Profile Has Been Updated';
  
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5; }
    .header { background: linear-gradient(135deg, #f6421f 0%, #ee8724 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 0; }
    .header h1 { font-family: 'Lexend', sans-serif; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { font-family: 'Lexend', sans-serif; margin: 8px 0 0 0; font-size: 15px; font-weight: 400; opacity: 0.95; }
    .content { background-color: #ffffff; padding: 35px 30px; }
    .footer { background-color: #f8f9fa; padding: 25px 30px; text-align: center; color: #6c757d; font-size: 14px; }
    .alert-warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px 18px; border-radius: 6px; margin: 25px 0; color: #856404; }
    .developer-info { margin-top: 25px; padding-top: 25px; border-top: 2px solid #dee2e6; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f6421f 0%, #ee8724 100%); color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 8px; box-shadow: 0 4px 12px rgba(246, 66, 31, 0.3); transition: transform 0.2s; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(246, 66, 31, 0.4); }
    .btn-facebook { background: #1877f2; background: linear-gradient(135deg, #1877f2 0%, #0c5bad 100%); box-shadow: 0 4px 12px rgba(24, 119, 242, 0.3); }
    .btn-facebook:hover { box-shadow: 0 6px 16px rgba(24, 119, 242, 0.4); }
    .logo { max-width: 90px; height: auto; margin-bottom: 18px; }
    .button-group { text-align: center; margin: 30px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://i.imgur.com/J4wddTW.png" alt="YSP Logo" class="logo">
      <h1>Youth Service Philippines</h1>
      <p>Tagum Chapter</p>
    </div>
    
    <div class="content">
      <h2 style="color: #f6421f; margin-top: 0;">Profile Update Notification</h2>
      
      <p>Dear <strong>${fullName}</strong>,</p>
      
      <p>Your Youth Service Philippines profile was successfully updated on <strong>${dateStr}</strong> at <strong>${timeStr}</strong>.</p>
      
      ${changesHtml}
      
      ${unchangedHtml}
      
      <div class="alert-warning">
        <strong>⚠️ Security Notice:</strong> If you did not make these changes, please contact the administrator immediately or reply to this email.
      </div>
      
      <div class="button-group">
        <a href="https://ysp-webapp.vercel.app" class="btn">Access Web App</a>
        <a href="https://www.facebook.com/YSPTagumChapter" class="btn btn-facebook">Visit Facebook Page</a>
      </div>
      
      <p style="margin-top: 25px; text-align: center; color: #666; font-size: 14px;">
        For announcements and more information, visit our platforms:<br>
        <a href="https://ysp-webapp.vercel.app" style="color: #f6421f; text-decoration: none; font-weight: 500;">Web App</a> • 
        <a href="https://www.facebook.com/YSPTagumChapter" style="color: #1877f2; text-decoration: none; font-weight: 500;">Facebook</a>
      </p>
      
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 10px 0;">This is an automated notification from the YSP Management System.</p>
      
      <div class="developer-info">
        <p style="margin: 5px 0; font-weight: bold;">System Developer:</p>
        <p style="margin: 5px 0;"><strong>Ezequiel John B. Crisostomo</strong></p>
        <p style="margin: 5px 0;">Membership and Internal Affairs Officer</p>
        <p style="margin: 5px 0;">Youth Service Philippines - Tagum Chapter</p>
      </div>
      
      <p style="margin-top: 20px; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} Youth Service Philippines - Tagum Chapter. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
  
  // Send email
  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
    Logger.log('Profile update email sent successfully to: ' + email);
  } catch (error) {
    Logger.log('Error sending profile update email: ' + error.toString());
    throw error;
  }
}

// ===== UPDATE USER PROFILE =====
function handleUpdateProfile(data) {
  try {
    const { idCode } = data;
    
    if (!idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const userProfilesSheet = ss.getSheetByName(SHEETS.USER_PROFILES);
    
    if (!userProfilesSheet) {
      return { success: false, message: 'User Profiles sheet not found' };
    }
    
    const userProfilesData = userProfilesSheet.getDataRange().getValues();
    
    // Helper utilities for robust equality checks
    const DATE_TZ = 'Asia/Manila';
    const DATE_FMT = 'yyyy-MM-dd';

    function isDateObject(v) {
      return Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime());
    }

    function normalizeString(v) {
      if (v === null || v === undefined) return '';
      return String(v).trim();
    }

    function normalizeNumber(v) {
      if (v === null || v === undefined || v === '') return '';
      const n = Number(v);
      return isNaN(n) ? normalizeString(v) : String(n);
    }

    function normalizeDate(v) {
      if (v === null || v === undefined || v === '') return '';
      if (isDateObject(v)) return Utilities.formatDate(v, DATE_TZ, DATE_FMT);
      // Try to parse common date strings
      // Prefer YYYY-MM-DD if present
      var s = String(v).trim();
      // Handle values like MM/DD/YYYY or YYYY-MM-DD
      var d = new Date(s);
      if (isDateObject(d)) return Utilities.formatDate(d, DATE_TZ, DATE_FMT);
      return s; // as-is fallback
    }

    function datesEqual(a, b) {
      return normalizeDate(a) === normalizeDate(b);
    }

    function numbersEqual(a, b) {
      return normalizeNumber(a) === normalizeNumber(b);
    }

    function stringsEqual(a, b) {
      return normalizeString(a) === normalizeString(b);
    }

    function dateFromYYYYMMDD(s) {
      const str = normalizeDate(s);
      const parts = str.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dt = new Date(y, m, d);
        if (isDateObject(dt)) return dt;
      }
      const d2 = new Date(str);
      return isDateObject(d2) ? d2 : null;
    }

    // Find the user's row by ID Code
    for (let i = 1; i < userProfilesData.length; i++) {
      const row = userProfilesData[i];
      const rowIdCode = row[18]; // Column S - ID Code
      
      if (rowIdCode === idCode) {
        // Store old values for comparison
        const oldValues = {
          fullName: row[3] || '',
          email: row[1] || '',
          birthday: row[4] || '',
          age: row[5] || '',
          gender: row[6] || '',
          pronouns: row[7] || '',
          civilStatus: row[8] || '',
          contactNumber: row[9] || '',
          religion: row[10] || '',
          nationality: row[11] || '',
          personalEmail: row[12] || '',
          username: row[13] || '',
          password: row[14] || ''
        };
        
        // Track changes for email notification
        const changes = [];
        const unchanged = [];
        // Update allowed fields based on SHEET_COLUMN_MAPPINGS.md
        
        // Column B (index 1) - Email Address
        if (data.email !== undefined && !stringsEqual(data.email, oldValues.email)) {
          userProfilesSheet.getRange(i + 1, 2).setValue(data.email);
          changes.push({ field: 'Email Address', old: oldValues.email, new: data.email });
        } else if (data.email === undefined || stringsEqual(data.email, oldValues.email)) {
          unchanged.push('Email Address');
        }
        
        // Column E (index 4) - Date of Birth (Birthday)
        var birthdayChanged = false;
        if (data.birthday !== undefined && !datesEqual(data.birthday, oldValues.birthday)) {
          const dateObj = dateFromYYYYMMDD(data.birthday);
          if (dateObj) {
            userProfilesSheet.getRange(i + 1, 5).setValue(dateObj);
          } else {
            userProfilesSheet.getRange(i + 1, 5).setValue(data.birthday);
          }
          changes.push({ field: 'Date of Birth', old: normalizeDate(oldValues.birthday), new: normalizeDate(data.birthday) });
          birthdayChanged = true;
        } else if (data.birthday === undefined || datesEqual(data.birthday, oldValues.birthday)) {
          unchanged.push('Date of Birth');
        }
        
        // Column F (index 5) - Age (Derived from Date of Birth; not editable)
        function computeAgeFromDate(dateVal) {
          const iso = normalizeDate(dateVal);
          if (!iso) return '';
          const dt = dateFromYYYYMMDD(iso);
          if (!dt) return '';
          const todayStr = Utilities.formatDate(new Date(), DATE_TZ, DATE_FMT);
          const parts = todayStr.split('-');
          const ty = parseInt(parts[0], 10);
          const tm = parseInt(parts[1], 10);
          const td = parseInt(parts[2], 10);
          let age = ty - dt.getFullYear();
          const bm = dt.getMonth() + 1;
          const bd = dt.getDate();
          if (tm < bm || (tm === bm && td < bd)) age--;
          return age < 0 ? '' : String(age);
        }

        const effectiveBirthday = data.birthday !== undefined ? data.birthday : oldValues.birthday;
        const newComputedAge = computeAgeFromDate(effectiveBirthday);
        const oldAgeStr = normalizeNumber(oldValues.age);
        if (newComputedAge !== '' && newComputedAge !== oldAgeStr) {
          // Update the sheet silently
          userProfilesSheet.getRange(i + 1, 6).setValue(Number(newComputedAge));
          // Only include Age in email changes if the birthday actually changed
          if (birthdayChanged) {
            changes.push({ field: 'Age', old: String(oldValues.age || ''), new: newComputedAge });
          }
        }
        
        // Column G (index 6) - Sex/Gender
        if (data.gender !== undefined && !stringsEqual(data.gender, oldValues.gender)) {
          userProfilesSheet.getRange(i + 1, 7).setValue(data.gender);
          changes.push({ field: 'Gender', old: oldValues.gender, new: data.gender });
        } else if (data.gender === undefined || stringsEqual(data.gender, oldValues.gender)) {
          unchanged.push('Gender');
        }
        
        // Column H (index 7) - Pronouns
        if (data.pronouns !== undefined && !stringsEqual(data.pronouns, oldValues.pronouns)) {
          userProfilesSheet.getRange(i + 1, 8).setValue(data.pronouns);
          changes.push({ field: 'Pronouns', old: oldValues.pronouns, new: data.pronouns });
        } else if (data.pronouns === undefined || stringsEqual(data.pronouns, oldValues.pronouns)) {
          unchanged.push('Pronouns');
        }
        
        // Column I (index 8) - Civil Status
        if (data.civilStatus !== undefined && !stringsEqual(data.civilStatus, oldValues.civilStatus)) {
          userProfilesSheet.getRange(i + 1, 9).setValue(data.civilStatus);
          changes.push({ field: 'Civil Status', old: oldValues.civilStatus, new: data.civilStatus });
        } else if (data.civilStatus === undefined || stringsEqual(data.civilStatus, oldValues.civilStatus)) {
          unchanged.push('Civil Status');
        }
        
        // Column J (index 9) - Contact Number
        if (data.contactNumber !== undefined && !stringsEqual(data.contactNumber, oldValues.contactNumber)) {
          userProfilesSheet.getRange(i + 1, 10).setValue(data.contactNumber);
          changes.push({ field: 'Contact Number', old: oldValues.contactNumber, new: data.contactNumber });
        } else if (data.contactNumber === undefined || stringsEqual(data.contactNumber, oldValues.contactNumber)) {
          unchanged.push('Contact Number');
        }
        
        // Column K (index 10) - Religion
        if (data.religion !== undefined && !stringsEqual(data.religion, oldValues.religion)) {
          userProfilesSheet.getRange(i + 1, 11).setValue(data.religion);
          changes.push({ field: 'Religion', old: oldValues.religion, new: data.religion });
        } else if (data.religion === undefined || stringsEqual(data.religion, oldValues.religion)) {
          unchanged.push('Religion');
        }
        
        // Column L (index 11) - Nationality
        if (data.nationality !== undefined && !stringsEqual(data.nationality, oldValues.nationality)) {
          userProfilesSheet.getRange(i + 1, 12).setValue(data.nationality);
          changes.push({ field: 'Nationality', old: oldValues.nationality, new: data.nationality });
        } else if (data.nationality === undefined || stringsEqual(data.nationality, oldValues.nationality)) {
          unchanged.push('Nationality');
        }
        
        // Column M (index 12) - Personal Email Address
        if (data.personalEmail !== undefined && !stringsEqual(data.personalEmail, oldValues.personalEmail)) {
          userProfilesSheet.getRange(i + 1, 13).setValue(data.personalEmail);
          changes.push({ field: 'Personal Email', old: oldValues.personalEmail, new: data.personalEmail });
        } else if (data.personalEmail === undefined || stringsEqual(data.personalEmail, oldValues.personalEmail)) {
          unchanged.push('Personal Email');
        }
        
        // Column N (index 13) - Username
        if (data.username !== undefined && !stringsEqual(data.username, oldValues.username)) {
          userProfilesSheet.getRange(i + 1, 14).setValue(data.username);
          changes.push({ field: 'Username', old: oldValues.username, new: data.username });
        } else if (data.username === undefined || stringsEqual(data.username, oldValues.username)) {
          unchanged.push('Username');
        }
        
        // Column O (index 14) - Password (Don't show actual passwords in email)
        if (data.password !== undefined && !stringsEqual(data.password, oldValues.password)) {
          userProfilesSheet.getRange(i + 1, 15).setValue(data.password);
          changes.push({ field: 'Password', old: '••••••••', new: '••••••••' });
        } else if (data.password === undefined || stringsEqual(data.password, oldValues.password)) {
          unchanged.push('Password');
        }
        
        // Send email notification if there are changes
        if (changes.length > 0) {
          try {
            sendProfileUpdateEmail(oldValues.fullName, oldValues.personalEmail || oldValues.email, changes, unchanged);
          } catch (emailError) {
            Logger.log('Failed to send email notification: ' + emailError.toString());
            // Don't fail the update if email fails
          }
        }
        
        Logger.log('Profile updated successfully for ID Code: ' + idCode);
        
        return { 
          success: true, 
          message: 'Profile updated successfully' 
        };
      }
    }
    
    return { success: false, message: 'User not found' };
    
  } catch (error) {
    Logger.log('Error updating user profile: ' + error.toString());
    return { success: false, message: 'Error updating user profile: ' + error.toString() };
  }
}

// ===== UPLOAD PROFILE PICTURE TO GOOGLE DRIVE =====
/**
 * Uploads a profile picture to Google Drive folder
 * @param {Object} data - Contains base64Image, fileName, username/idCode
 * @returns {Object} - Success status with Drive file URL
 */
function handleUploadProfilePicture(data) {
  try {
    const { base64Image, fileName, username, idCode, mimeType } = data;
    
    if (!base64Image) {
      return { success: false, message: 'Image data is required' };
    }
    
    if (!username && !idCode) {
      return { success: false, message: 'Username or ID Code is required' };
    }
    
    // Get the profile pictures folder
    const folder = DriveApp.getFolderById(PROFILE_PICTURES_FOLDER_ID);
    
    // Decode base64 image
    const base64Data = base64Image.split(',')[1] || base64Image;
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      mimeType || 'image/jpeg',
      fileName || 'profile_' + (username || idCode) + '.jpg'
    );
    
    // Check if user already has a profile picture and delete it
    const existingFiles = folder.getFilesByName(fileName || 'profile_' + (username || idCode) + '.jpg');
    while (existingFiles.hasNext()) {
      const file = existingFiles.next();
      file.setTrashed(true);
    }
    
    // Upload new file to Drive
    const file = folder.createFile(blob);
    
    // Make file publicly viewable
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Get the public URL
    const fileUrl = 'https://drive.google.com/uc?export=view&id=' + file.getId();
    
    // Update the User Profiles sheet with the new URL
    const updateResult = handleUpdateProfilePicture({
      username: username,
      idCode: idCode,
      profilePictureURL: fileUrl
    });
    
    if (!updateResult.success) {
      return { success: false, message: 'Image uploaded but failed to update profile: ' + updateResult.message };
    }
    
    return {
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePictureURL: fileUrl
    };
    
  } catch (error) {
    Logger.log('Error uploading profile picture: ' + error.toString());
    return { success: false, message: 'Error uploading profile picture: ' + error.toString() };
  }
}

// ===== UPDATE PROFILE PICTURE URL IN SHEET =====
/**
 * Updates the ProfilePictureURL in User Profiles sheet
 * @param {Object} data - Contains username/idCode and profilePictureURL
 * @returns {Object} - Success status
 */
function handleUpdateProfilePicture(data) {
  try {
    const { username, idCode, profilePictureURL } = data;
    
    if (!username && !idCode) {
      return { success: false, message: 'Username or ID Code is required' };
    }
    
    if (!profilePictureURL) {
      return { success: false, message: 'Profile picture URL is required' };
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
        // Update Column V (index 21) - ProfilePictureURL
        // Row number is i+1 because sheet rows are 1-indexed
        userProfilesSheet.getRange(i + 1, 22).setValue(profilePictureURL); // Column V is index 21, but Range uses 1-based indexing so it's 22
        
        Logger.log('Updated profile picture for user: ' + (username || idCode));
        
        return {
          success: true,
          message: 'Profile picture updated successfully',
          profilePictureURL: profilePictureURL
        };
      }
    }
    
    return { success: false, message: 'User not found' };
    
  } catch (error) {
    Logger.log('Error updating profile picture: ' + error.toString());
    return { success: false, message: 'Error updating profile picture: ' + error.toString() };
  }
}

// ===== DAILY AGE RECALCULATION UTILITIES =====
/**
 * Compute age from a given date value using Asia/Manila timezone.
 * Accepts Date objects or common date strings. Returns a numeric string or ''.
 */
function _computeAgeFromDate(value) {
  if (value === null || value === undefined || value === '') return '';
  var d = value;
  if (Object.prototype.toString.call(d) !== '[object Date]' || isNaN(d.getTime())) {
    d = new Date(String(value).trim());
  }
  if (Object.prototype.toString.call(d) !== '[object Date]' || isNaN(d.getTime())) return '';
  var tz = 'Asia/Manila';
  var todayStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var parts = todayStr.split('-');
  var ty = parseInt(parts[0], 10);
  var tm = parseInt(parts[1], 10);
  var td = parseInt(parts[2], 10);
  var by = d.getFullYear();
  var bm = d.getMonth() + 1;
  var bd = d.getDate();
  var age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age--;
  if (age < 0) return '';
  return String(age);
}

/**
 * Recalculate all ages (Column F) from Date of Birth (Column E) daily.
 * Writes changes without sending any emails.
 */
function recalcAllAges() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEETS.USER_PROFILES);
    if (!sheet) {
      Logger.log('User Profiles sheet not found');
      return { success: false, message: 'User Profiles sheet not found' };
    }
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      Logger.log('No user rows to update');
      return { success: true, updated: 0 };
    }
    var numRows = lastRow - 1;
    var dobValues = sheet.getRange(2, 5, numRows, 1).getValues(); // Column E
    var ageRange = sheet.getRange(2, 6, numRows, 1); // Column F
    var ageValues = ageRange.getValues();
    var updated = 0;
    for (var i = 0; i < numRows; i++) {
      var dob = dobValues[i][0];
      var newAgeStr = _computeAgeFromDate(dob);
      var newWrite = newAgeStr === '' ? '' : Number(newAgeStr);
      var oldVal = ageValues[i][0];
      var oldStr = (oldVal === '' || oldVal === null || oldVal === undefined) ? '' : String(oldVal);
      if (String(newWrite) !== oldStr) {
        ageValues[i][0] = newWrite;
        updated++;
      }
    }
    if (updated > 0) {
      ageRange.setValues(ageValues);
    }
    Logger.log('recalcAllAges: updated ' + updated + ' of ' + numRows + ' rows');
    return { success: true, updated: updated };
  } catch (err) {
    Logger.log('Error in recalcAllAges: ' + err.toString());
    return { success: false, message: err.toString() };
  }
}

/**
 * Install a time-driven trigger to run recalcAllAges daily at 00:05 Asia/Manila.
 * Safe to run multiple times; replaces any existing trigger for this handler.
 */
function installDailyAgeRecalcTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'recalcAllAges') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('recalcAllAges')
    .timeBased()
    .atHour(0)
    .nearMinute(5)
    .everyDays(1)
    .inTimezone('Asia/Manila')
    .create();
  Logger.log('Installed daily trigger for recalcAllAges at 00:05 Asia/Manila');
  return { success: true, message: 'Daily age recalc trigger installed at 00:05 Asia/Manila' };
}


