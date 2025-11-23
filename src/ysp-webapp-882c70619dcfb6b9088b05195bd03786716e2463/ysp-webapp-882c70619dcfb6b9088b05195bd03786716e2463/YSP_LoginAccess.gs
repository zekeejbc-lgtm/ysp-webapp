// ===== CONFIGURATION =====
const SPREADSHEET_ID = '1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU';
const PROFILE_PICTURES_FOLDER_ID = '192-pVluL93fYKpyJoukfi_H5az_9fqFK'; // Google Drive folder for profile pictures
const PROJECTS_FOLDER_ID = '1G68-t3Urdc6iBW6Utl7zbvlb4xa6MvSH'; // Google Drive folder for homepage project images
const ORG_CHART_FOLDER_ID = '1-svfAWzLOwzY2WlNUom-KXoAF9_wNckR'; // Google Drive folder for org chart images
const FEEDBACK_IMAGES_FOLDER_ID = '12GOFbwF9Cyh-6WxE4aeMe-XaOzMdMm52'; // Google Drive folder for feedback images
const SHEETS = {
  ACCESS_LOGS: 'Access Logs',
  USER_PROFILES: 'User Profiles',
  MASTER_ATTENDANCE: 'Master Attendance Log',
  ANNOUNCEMENTS: 'Announcements',
  FEEDBACK: 'Feedback',
  HOMEPAGE_CONTENT: 'Homepage Content',
  OFFICER_DIRECTORY: 'Officer Directory'
};

// ===== CACHE CONFIGURATION =====
const CACHE_EXPIRATION = {
  USER_PROFILES: 600,      // 10 minutes - changes infrequently
  OFFICER_DIRECTORY: 600,  // 10 minutes - changes infrequently
  HOMEPAGE_CONTENT: 1800,  // 30 minutes - rarely changes
  EVENTS: 300,             // 5 minutes - moderate changes
  ANNOUNCEMENTS: 180,      // 3 minutes - frequent updates
  FEEDBACK: 120            // 2 minutes - frequent updates
};

// ===== CACHE HELPERS =====
/**
 * Get cached data or execute function and cache result
 * @param {string} key - Cache key
 * @param {function} fetchFunction - Function to execute if cache miss
 * @param {number} expirationSeconds - Cache expiration in seconds
 */
function getCachedOrFetch(key, fetchFunction, expirationSeconds) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(key);
  
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      Logger.log('Cache parse error for key: ' + key);
    }
  }
  
  // Cache miss - fetch fresh data
  const freshData = fetchFunction();
  
  try {
    // CacheService has a 100KB limit per entry
    const serialized = JSON.stringify(freshData);
    if (serialized.length < 100000) {
      cache.put(key, serialized, expirationSeconds);
    } else {
      Logger.log('Cache entry too large for key: ' + key + ' (' + serialized.length + ' bytes)');
    }
  } catch (e) {
    Logger.log('Cache put error for key: ' + key + ' - ' + e.toString());
  }
  
  return freshData;
}

/**
 * Invalidate cache for a specific key or pattern
 */
function invalidateCache(keyPattern) {
  const cache = CacheService.getScriptCache();
  if (Array.isArray(keyPattern)) {
    cache.removeAll(keyPattern);
  } else {
    cache.remove(keyPattern);
  }
}

/**
 * Get optimized range instead of entire sheet
 * @param {Sheet} sheet - Sheet object
 * @param {number} headerRows - Number of header rows to skip (default 1)
 */
function getOptimizedRange(sheet, headerRows = 1) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  if (lastRow <= headerRows) {
    return [];
  }
  
  // Get only the data range, not the entire sheet
  return sheet.getRange(headerRows + 1, 1, lastRow - headerRows, lastCol).getValues();
}

// ===== MAIN ENTRY POINT =====
function doPost(e) {
  try {
    Logger.log('[GAS Debug] doPost called - raw postData: ' + (e.postData?.contents || 'undefined'));
    
    if (!e.postData || !e.postData.contents) {
      Logger.log('[GAS Debug] ERROR: No postData contents received');
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'No data received in request'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = JSON.parse(e.postData.contents);
    Logger.log('[GAS Debug] Parsed data action: ' + (data.action || 'undefined'));
    Logger.log('[GAS Debug] Client Debug ID: ' + (data.clientDebugId || 'undefined'));
    
    const response = handlePostRequest(data);
    Logger.log('[GAS Debug] Response prepared: ' + JSON.stringify(response).slice(0, 200));
    
    // Ensure response is always valid JSON with success field
    if (typeof response !== 'object' || response === null) {
      Logger.log('[GAS Debug] WARNING: Response is not an object, wrapping it');
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Invalid response format from handler'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('[GAS Debug] CRITICAL ERROR in doPost: ' + error.toString());
    Logger.log('[GAS Debug] Error stack: ' + error.stack);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Server error: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== REQUEST ROUTER =====
function handlePostRequest(data) {
  const action = data.action;
  
  // Allow login actions without role check
  if (action === 'login' || action === 'guestLogin') {
    if (action === 'login') return handleLogin(data);
    if (action === 'guestLogin') return handleGuestLogin(data);
  }
  
  // Check for banned users (except for login actions and homepage content)
  if (data.idCode && action !== 'getHomepageContent') {
    const userRole = _getUserRoleByIdCode(data.idCode);
    if (userRole === 'Banned') {
      return { 
        success: false, 
        message: 'Access denied. Your account has been restricted. Please contact an administrator.',
        banned: true 
      };
    }
  }
  
  switch(action) {
    case 'ping':
      return { success: true, message: 'Backend is alive!', timestamp: new Date().toISOString(), version: 'b464368' };
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
    case 'getFeedbackByRef':
      return handleGetFeedbackByRef(data);
    case 'setFeedbackVisibility':
      return handleSetFeedbackVisibility(data);
    case 'updateFeedbackDetails':
      return handleUpdateFeedbackDetails(data);
    case 'uploadFeedbackImage':
      return handleUploadFeedbackImage(data);
    case 'initFeedbackSheet':
      return handleInitFeedbackSheet();
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
    case 'recalcAgesNow':
      return handleRecalcAgesNow(data);
    case 'installAgeRecalcTrigger':
      return handleInstallAgeRecalcTrigger(data);
    case 'uploadProjectImage':
      return handleUploadProjectImage(data);
    case 'addHomepageProject':
      return handleAddHomepageProject(data);
    case 'deleteHomepageProject':
      return handleDeleteHomepageProject(data);
      case 'uploadOrgChartImage':
        return handleUploadOrgChartImage(data);
      case 'updateOrgChartUrl':
        return handleUpdateOrgChartUrl(data);
      case 'deleteOrgChart':
        return handleDeleteOrgChart(data);
    case 'assignRoles':
      return handleAssignRoles(data);
    case 'getAllUserRoles':
      return handleGetAllUserRoles(data);
    case 'updateUserRole':
      return handleUpdateUserRole(data);
    case 'getDatabaseSchema':
      return handleGetDatabaseSchema(data);
    default:
      return { success: false, message: 'Unknown action: ' + action };
  }
}

// ===== LOGIN HANDLER =====
function handleLogin(data) {
  try {
    Logger.log('LOGIN ATTEMPT - Username: ' + data.username);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const profilesSheet = ss.getSheetByName(SHEETS.USER_PROFILES);
    const accessLogsSheet = ss.getSheetByName(SHEETS.ACCESS_LOGS);
    
    const profilesData = profilesSheet.getDataRange().getValues();
    Logger.log('Total rows in User Profiles: ' + profilesData.length);
    
    // Find user (skip header row)
    for (let i = 1; i < profilesData.length; i++) {
      const row = profilesData[i];
      const username = row[13]; // Column N - Username
      const password = row[14]; // Column O - Password
      
      Logger.log('Checking row ' + i + ' - Username: ' + username);
      
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
    
    Logger.log('LOGIN FAILED - No matching username/password found');
    return { success: false, message: 'Invalid username or password' };
  } catch (error) {
    Logger.log('LOGIN ERROR: ' + error.toString());
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
    const searchTerm = (data.search || data.searchTerm || '').toLowerCase();
    
    // Use cached user profiles data
    const values = getCachedOrFetch(
      'user_profiles_all',
      function() {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = ss.getSheetByName(SHEETS.USER_PROFILES);
        return getOptimizedRange(sheet); // Use optimized range instead of getDataRange()
      },
      CACHE_EXPIRATION.USER_PROFILES
    );
    
    // Filter profiles based on search term
    const profiles = values
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
    // Use cached events data
    const events = getCachedOrFetch(
      'events_all',
      function() {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = ss.getSheetByName(SHEETS.MASTER_ATTENDANCE);
        const lastCol = sheet.getLastColumn();
        const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        
        const eventsList = [];
        
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
            
            eventsList.push({
              id: eventId.toString(),
              name: headerRow[col + 1] || '',
              date: formattedDate,
              timeIn: headerRow[col + 3] || '',
              timeOut: headerRow[col + 4] || '',
              status: headerRow[col + 5] || 'Active'
            });
          }
        }
        
        return eventsList;
      },
      CACHE_EXPIRATION.EVENTS
    );
    
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
    
    // Invalidate events cache
    invalidateCache('events_all');
    
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
    Logger.log('[Feedback Debug] handleCreateFeedback called with data: ' + JSON.stringify(data).slice(0, 300));
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('[Feedback Debug] Spreadsheet opened successfully');
    
    const feedbackSheet = ss.getSheetByName(SHEETS.FEEDBACK);
    if (!feedbackSheet) {
      Logger.log('[Feedback Debug] ERROR: Feedback sheet not found');
      return { success: false, message: 'Feedback sheet not found in spreadsheet' };
    }
    Logger.log('[Feedback Debug] Feedback sheet found');
    
    ensureFeedbackSchema(feedbackSheet);
    Logger.log('[Feedback Debug] Schema ensured');

    // Validate required fields
    if (!data.message) {
      Logger.log('[Feedback Debug] ERROR: Message is missing');
      return { success: false, message: 'Message is required' };
    }
    
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      Logger.log('[Feedback Debug] ERROR: Invalid rating: ' + data.rating);
      return { success: false, message: 'Valid rating (1-5) is required' };
    }
    
    Logger.log('[Feedback Debug] Validation passed - message length: ' + data.message.length + ', rating: ' + data.rating);
    
    const authorNameInput = data.anonymous ? 'Anonymous' : (data.authorName || 'Guest');

    // Basic throttling: limit 3 submissions per 5 minutes per user/guest
    try {
      const throttled = checkFeedbackThrottle(data.authorIdCode || 'Guest', authorNameInput);
      if (throttled) {
        Logger.log('[Feedback Debug] Throttle limit hit');
        return { success: false, message: 'Too many submissions. Please try again in a few minutes.' };
      }
      Logger.log('[Feedback Debug] Throttle check passed');
    } catch (thErr) {
      Logger.log('[Feedback Debug] Throttle check error (non-critical): ' + thErr);
    }
    
    // Get PH timezone timestamp
    const now = new Date();
    const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    
    // Generate new Reference ID using FBCK-YYYY-XXXX (random base36)
    const newReferenceId = generateFeedbackId(feedbackSheet);
    
    // Determine author ID code (Guest if not provided)
    const authorIdCode = data.authorIdCode || 'Guest';

  // Normalize fields
    const category = (data.category || 'Other').toString();
    const status = (data.status || 'Pending').toString();
    const visibility = (data.visibility || 'Private').toString();
  const rating = (typeof data.rating === 'number' ? Math.max(1, Math.min(5, data.rating)) : (parseInt(data.rating, 10) || ''));
  const email = (data.email || '').toString();

    // Handle image: use provided URL or upload base64 to Drive
    let imageUrl = (data.imageUrl || '').toString();
    try {
      if (!imageUrl && data.imageBase64) {
        imageUrl = _saveBase64ToDrive(FEEDBACK_IMAGES_FOLDER_ID, data.imageBase64, data.imageFilename || ('feedback-' + newReferenceId + '.png'));
      }
    } catch (imgErr) {
      Logger.log('Image upload failed, proceeding without image. ' + imgErr);
    }

    // Write row using header-based indices
    const headers = feedbackSheet.getRange(1, 1, 1, feedbackSheet.getLastColumn()).getValues()[0];
    const idx = getFeedbackColumnIndexMap(headers);

    const row = new Array(headers.length).fill('');
    row[idx.Timestamp] = phTime.toISOString();
    row[idx['Feedback ID']] = newReferenceId; // store also in Feedback ID if exists
    row[idx['Reference ID']] = newReferenceId; // keep using Reference ID for compatibility
    row[idx.Author] = authorNameInput;
    row[idx.Anonymous] = data.anonymous ? true : false;
    row[idx['Author ID Code']] = authorIdCode;
    row[idx.Category] = category;
    row[idx.Feedback] = data.message;
  if (idx['Image URL'] !== undefined) row[idx['Image URL']] = imageUrl;
    row[idx.Status] = status;
    row[idx.Visibility] = visibility;
  if (idx.Rating !== undefined) row[idx.Rating] = rating;
  if (idx.Email !== undefined) row[idx.Email] = email;
    // Reply fields empty by default

    Logger.log('[Feedback Debug] Appending row to sheet...');
    feedbackSheet.appendRow(row);
    Logger.log('[Feedback Debug] Row appended successfully');
    
    Logger.log('[Feedback Debug] Created feedback: ' + newReferenceId + ' by ' + authorNameInput);
    
    const successResponse = {
      success: true,
      message: 'Feedback submitted successfully',
      feedback: {
        referenceId: newReferenceId,
        timestamp: phTime.toISOString(),
        authorName: authorNameInput,
        authorIdCode: authorIdCode,
        message: data.message,
        category: category,
        status: status,
        visibility: visibility,
        imageUrl: imageUrl,
        rating: typeof rating === 'number' ? rating : undefined,
        email: email || undefined
      }
    };
    
    Logger.log('[Feedback Debug] Success response prepared: ' + JSON.stringify(successResponse).slice(0, 200));
    return successResponse;
  } catch (error) {
    Logger.log('[Feedback Debug] CRITICAL ERROR in handleCreateFeedback: ' + error.toString());
    Logger.log('[Feedback Debug] Error stack: ' + error.stack);
    return { success: false, message: 'Error creating feedback: ' + error.toString() };
  }
}

// ===== GET FEEDBACK HANDLER =====
function handleGetFeedback(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const feedbackSheet = ss.getSheetByName(SHEETS.FEEDBACK);
    ensureFeedbackSchema(feedbackSheet);
    
    const userIdCode = data.idCode;
    const userName = data.name;
    const userRole = data.role;
    
    if (!userIdCode && !userName) {
      return { success: false, message: 'User ID Code or Name is required' };
    }
    
    // Get all feedback data
    const feedbackData = feedbackSheet.getDataRange().getValues();
    const headers = feedbackData[0] || [];
    const idx = getFeedbackColumnIndexMap(headers);
    const feedbackList = [];
    
    // Skip header row
    for (let i = 1; i < feedbackData.length; i++) {
      const row = feedbackData[i];
      
      // Skip rows without Reference ID
      const referenceId = row[idx['Reference ID']] || row[idx['Feedback ID']] || '';
      if (!referenceId) continue;

      const timestamp = row[idx.Timestamp];
      const authorName = row[idx.Author] || '';
      const authorIdCode = row[idx['Author ID Code']] || '';
      const message = row[idx.Feedback] || '';
      const replyTimestamp = row[idx['Reply Timestamp']] || '';
      const replierName = row[idx.Replier] || '';
      const replierIdCode = row[idx['Replier ID']] || '';
      const replyMessage = row[idx.Reply] || '';
      const category = row[idx.Category] || 'Other';
      const status = row[idx.Status] || 'Pending';
      const visibility = row[idx.Visibility] || 'Private';
  const imageUrl = idx['Image URL'] >= 0 ? (row[idx['Image URL']] || '') : '';
  const rating = idx.Rating >= 0 ? row[idx.Rating] : '';
  const email = idx.Email >= 0 ? (row[idx.Email] || '') : '';
      
      // Check if user should see this feedback
      let shouldInclude = false;
      
      if (userRole === 'Admin' || userRole === 'Auditor') {
        // Admin and Auditor see all feedback
        shouldInclude = true;
      } else {
        // Regular users see their own OR any Public items
        const isOwn = (authorIdCode === 'Guest')
          ? (authorName.toLowerCase() === (userName || '').toLowerCase())
          : (authorIdCode === userIdCode);
        const isPublic = (visibility === 'Public');
        shouldInclude = isOwn || isPublic;
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
        hasReply: !!(replyMessage && replyMessage.toString().trim() !== ''),
        category: category,
        status: status,
        visibility: visibility,
        imageUrl: imageUrl
      };
      if (rating !== '' && !isNaN(Number(rating))) {
        feedbackObj.rating = Number(rating);
      }
      if (email) {
        feedbackObj.email = email;
      }
      
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
    ensureFeedbackSchema(feedbackSheet);
    
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
  const headers = feedbackData[0] || [];
  const idx = getFeedbackColumnIndexMap(headers);
    
    // Find the feedback by Reference ID
    let feedbackRowIndex = -1;
    for (let i = 1; i < feedbackData.length; i++) {
      const ref = feedbackData[i][idx['Reference ID']] || feedbackData[i][idx['Feedback ID']];
      if (ref && ref.toString() === data.referenceId.toString()) {
        feedbackRowIndex = i;
        break;
      }
    }
    
    if (feedbackRowIndex === -1) {
      return { success: false, message: 'Feedback not found' };
    }
    
    // Check if already replied
    const existingReply = feedbackData[feedbackRowIndex][idx.Reply];
    if (existingReply && existingReply.toString().trim() !== '') {
      return { success: false, message: 'This feedback has already been replied to' };
    }
    
    // Get PH timezone timestamp
    const now = new Date();
    const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    
    // Update reply and optionally status/visibility
    if (idx['Reply Timestamp'] !== undefined) feedbackSheet.getRange(feedbackRowIndex + 1, idx['Reply Timestamp'] + 1).setValue(phTime.toISOString());
    if (idx.Replier !== undefined) feedbackSheet.getRange(feedbackRowIndex + 1, idx.Replier + 1).setValue(data.replierName);
    if (idx['Replier ID'] !== undefined) feedbackSheet.getRange(feedbackRowIndex + 1, idx['Replier ID'] + 1).setValue(data.replierIdCode);
    if (idx.Reply !== undefined) feedbackSheet.getRange(feedbackRowIndex + 1, idx.Reply + 1).setValue(data.reply);
    if (data.status && idx.Status !== undefined) feedbackSheet.getRange(feedbackRowIndex + 1, idx.Status + 1).setValue(data.status);
    if (data.visibility && idx.Visibility !== undefined) feedbackSheet.getRange(feedbackRowIndex + 1, idx.Visibility + 1).setValue(data.visibility);
    
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

// ===== GET FEEDBACK BY REFERENCE (Guest tracking) =====
function handleGetFeedbackByRef(data) {
  try {
    const ref = (data.referenceId || '').toString();
    if (!ref) return { success: false, message: 'referenceId is required' };
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.FEEDBACK);
    ensureFeedbackSchema(sheet);
    const values = sheet.getDataRange().getValues();
    const headers = values[0] || [];
    const idx = getFeedbackColumnIndexMap(headers);
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const referenceId = row[idx['Reference ID']] || row[idx['Feedback ID']] || '';
      if (referenceId && referenceId.toString() === ref) {
        const obj = {
          referenceId: referenceId,
          timestamp: toIso(row[idx.Timestamp]),
          category: row[idx.Category] || 'Other',
          status: row[idx.Status] || 'Pending',
          visibility: row[idx.Visibility] || 'Private',
          imageUrl: idx['Image URL'] >= 0 ? (row[idx['Image URL']] || '') : '',
          authorName: row[idx.Author] || '',
          message: row[idx.Feedback] || '',
        };
        if (idx.Rating >= 0) {
          const r = row[idx.Rating];
          if (r !== '' && !isNaN(Number(r))) obj.rating = Number(r);
        }
        if (idx.Email >= 0) {
          const em = row[idx.Email] || '';
          if (em) obj.email = em;
        }
        const reply = row[idx.Reply];
        if (reply && reply.toString().trim() !== '') {
          obj.replyMessage = reply;
          obj.replyTimestamp = toIso(row[idx['Reply Timestamp']]);
          obj.replierName = row[idx.Replier] || '';
        }
        return { success: true, feedback: obj };
      }
    }
    return { success: false, message: 'Not found' };
  } catch (e) {
    return { success: false, message: 'Error: ' + e.toString() };
  }
}

// ===== SET VISIBILITY =====
function handleSetFeedbackVisibility(data) {
  try {
    if (!data.referenceId || !data.visibility) return { success: false, message: 'referenceId and visibility required' };
    if (data.role !== 'Admin' && data.role !== 'Auditor') return { success: false, message: 'Not authorized' };
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.FEEDBACK);
    ensureFeedbackSchema(sheet);
    const values = sheet.getDataRange().getValues();
    const idx = getFeedbackColumnIndexMap(values[0] || []);
    for (let i = 1; i < values.length; i++) {
      const ref = values[i][idx['Reference ID']] || values[i][idx['Feedback ID']];
      if (ref && ref.toString() === data.referenceId.toString()) {
        sheet.getRange(i + 1, idx.Visibility + 1).setValue(data.visibility);
        return { success: true };
      }
    }
    return { success: false, message: 'Not found' };
  } catch (e) { return { success: false, message: 'Error: ' + e.toString() }; }
}

// ===== UPDATE FEEDBACK DETAILS (STATUS & VISIBILITY) =====
function handleUpdateFeedbackDetails(data) {
  try {
    Logger.log('[GAS Debug] handleUpdateFeedbackDetails called with: ' + JSON.stringify(data));
    
    if (!data.referenceId) return { success: false, message: 'referenceId required' };
    if (data.role !== 'Admin' && data.role !== 'Auditor') return { success: false, message: 'Not authorized' };
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.FEEDBACK);
    ensureFeedbackSchema(sheet);
    const values = sheet.getDataRange().getValues();
    const idx = getFeedbackColumnIndexMap(values[0] || []);
    
    for (let i = 1; i < values.length; i++) {
      const ref = values[i][idx['Reference ID']] || values[i][idx['Feedback ID']];
      if (ref && ref.toString() === data.referenceId.toString()) {
        // Update status if provided
        if (data.status && idx.Status !== undefined) {
          sheet.getRange(i + 1, idx.Status + 1).setValue(data.status);
          Logger.log('[GAS Debug] Updated status to: ' + data.status);
        }
        // Update visibility if provided
        if (data.visibility && idx.Visibility !== undefined) {
          sheet.getRange(i + 1, idx.Visibility + 1).setValue(data.visibility);
          Logger.log('[GAS Debug] Updated visibility to: ' + data.visibility);
        }
        Logger.log('[GAS Debug] Feedback updated successfully');
        return { success: true, message: 'Feedback updated successfully' };
      }
    }
    return { success: false, message: 'Feedback not found' };
  } catch (e) { 
    Logger.log('[GAS Debug] Error updating feedback: ' + e.toString());
    return { success: false, message: 'Error: ' + e.toString() }; 
  }
}

// ===== UPLOAD FEEDBACK IMAGE =====
function handleUploadFeedbackImage(data) {
  try {
    if (!data.imageBase64) return { success: false, message: 'imageBase64 is required' };
    const url = _saveBase64ToDrive(FEEDBACK_IMAGES_FOLDER_ID, data.imageBase64, data.filename || ('feedback-' + Date.now() + '.png'));
    return { success: true, url: url };
  } catch (e) { return { success: false, message: 'Error: ' + e.toString() }; }
}

// ===== UTILITIES FOR FEEDBACK SCHEMA =====
function ensureFeedbackSchema(sheet) {
  if (!sheet) throw new Error('Feedback sheet not found');
  const requiredHeaders = [
    'Timestamp',
    'Feedback ID',
    'Reference ID',
    'Author',
    'Anonymous',
    'Author ID Code',
    'Email',
    'Category',
    'Feedback',
    'Rating',
    'Image URL',
    'Status',
    'Visibility',
    'Reply Timestamp',
    'Replier',
    'Replier ID',
    'Reply',
    'Notes'
  ];
  const lastCol = sheet.getLastColumn();
  const headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  const missing = requiredHeaders.filter(h => headers.indexOf(h) === -1);
  if (headers.length === 0) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
  } else if (missing.length > 0) {
    // append missing headers
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
  }
  // Data validation for enums
  const idx = getFeedbackColumnIndexMap(sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0]);
  const rules = SpreadsheetApp.newDataValidation().requireValueInList(['Complaint','Suggestion','Bug','Compliment','Inquiry','Other']).setAllowInvalid(true).build();
  sheet.getRange(2, idx.Category + 1, Math.max(1, sheet.getMaxRows()-1)).setDataValidation(rules);
  const srules = SpreadsheetApp.newDataValidation().requireValueInList(['Pending','Reviewed','Resolved']).setAllowInvalid(true).build();
  sheet.getRange(2, idx.Status + 1, Math.max(1, sheet.getMaxRows()-1)).setDataValidation(srules);
  const vrules = SpreadsheetApp.newDataValidation().requireValueInList(['Private','Public']).setAllowInvalid(true).build();
  sheet.getRange(2, idx.Visibility + 1, Math.max(1, sheet.getMaxRows()-1)).setDataValidation(vrules);
}

function getFeedbackColumnIndexMap(headers) {
  const map = {};
  headers.forEach((h, i) => { map[h] = i; });
  // Provide named indices with fallbacks to legacy positions
  return {
    Timestamp: map['Timestamp'] ?? 0,
    'Feedback ID': map['Feedback ID'] ?? (map['Reference ID'] ?? 4),
    'Reference ID': map['Reference ID'] ?? (map['Feedback ID'] ?? 4),
    Author: map['Author'] ?? 1,
    Anonymous: map['Anonymous'] ?? -1,
    'Author ID Code': map['Author ID Code'] ?? 2,
    Email: map['Email'] ?? -1,
    Category: map['Category'] ?? -1,
    Feedback: map['Feedback'] ?? 3,
    Rating: map['Rating'] ?? -1,
    'Image URL': map['Image URL'] ?? -1,
    Status: map['Status'] ?? -1,
    Visibility: map['Visibility'] ?? -1,
    'Reply Timestamp': map['Reply Timestamp'] ?? 5,
    Replier: map['Replier'] ?? 6,
    'Replier ID': map['Replier ID'] ?? 7,
    Reply: map['Reply'] ?? 8,
    Notes: map['Notes'] ?? -1
  };
}

function generateFeedbackId(sheet) {
  const values = sheet.getDataRange().getValues();
  const year = new Date().getFullYear();
  const existing = new Set(values.slice(1).map(r => (r[1] || r[4] || '').toString())); // Feedback ID or Reference ID
  let id = '';
  do {
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    id = 'FBCK-' + year + '-' + rand;
  } while (existing.has(id));
  return id;
}

function _saveBase64ToDrive(folderId, base64, filename) {
  const contentTypeMatch = base64.match(/^data:(.*?);base64,/);
  const contentType = contentTypeMatch ? contentTypeMatch[1] : 'image/png';
  const clean = base64.replace(/^data:.*;base64,/, '');
  const blob = Utilities.newBlob(Utilities.base64Decode(clean), contentType, filename);
  const folder = DriveApp.getFolderById(folderId);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function checkFeedbackThrottle(idCode, name) {
  const cache = CacheService.getUserCache();
  const key = 'fb_rate_' + (idCode || 'Guest') + '_' + (name || 'Guest');
  const raw = cache.get(key);
  let obj = raw ? JSON.parse(raw) : { count: 0, ts: Date.now() };
  if (Date.now() - obj.ts > 5 * 60 * 1000) { // reset after 5 minutes
    obj = { count: 0, ts: Date.now() };
  }
  obj.count += 1;
  cache.put(key, JSON.stringify(obj), 5 * 60);
  // Allow more submissions during testing; adjust threshold as needed
  return obj.count > 10;
}

function toIso(val) {
  if (!val) return '';
  try { const d = new Date(val); return isNaN(d.getTime()) ? val.toString() : d.toISOString(); } catch(e){return val.toString();}
}

function handleInitFeedbackSheet() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.FEEDBACK);
    ensureFeedbackSchema(sheet);
    return { success: true };
  } catch (e) { return { success: false, message: 'Error: ' + e.toString() }; }
}

// ===== GET HOMEPAGE CONTENT HANDLER =====
function handleGetHomepageContent(data) {
  try {
    // Use cached homepage content
    const homepageData = getCachedOrFetch(
      'homepage_content',
      function() {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const homepageSheet = ss.getSheetByName(SHEETS.HOMEPAGE_CONTENT);
        
        if (!homepageSheet) {
          throw new Error('Homepage Content sheet not found');
        }
        
        const lastRow = homepageSheet.getLastRow();
        const lastCol = homepageSheet.getLastColumn();
        return homepageSheet.getRange(1, 1, lastRow, lastCol).getValues();
      },
      CACHE_EXPIRATION.HOMEPAGE_CONTENT
    );
    
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
  let motto = '';
    
    // Read from index 0 onwards (NO header row offset!)
    if (homepageData.length > 0) vision = homepageData[0][1] || ''; // SHEET ROW 1, Column B
    if (homepageData.length > 1) mission = homepageData[1][1] || ''; // SHEET ROW 2, Column B
    if (homepageData.length > 2) objectives = homepageData[2][1] || ''; // SHEET ROW 3, Column B
    if (homepageData.length > 3) orgChartUrl = homepageData[3][1] || ''; // SHEET ROW 4, Column B
    if (homepageData.length > 4) facebookUrl = homepageData[4][1] || ''; // SHEET ROW 5, Column B
    if (homepageData.length > 5) email = homepageData[5][1] || ''; // SHEET ROW 6, Column B
    if (homepageData.length > 6) founderName = homepageData[6][1] || ''; // SHEET ROW 7, Column B
    if (homepageData.length > 7) aboutYSP = homepageData[7][1] || ''; // SHEET ROW 8, Column B

    // Optional Motto row handling (backward-compatible):
    // If SHEET ROW 9 (index 8) first cell is not 'projectTitle_1', treat it as motto
    if (homepageData.length > 8) {
      const row9colA = (homepageData[8][0] || '').toString();
      if (!row9colA.startsWith('projectTitle_')) {
        motto = homepageData[8][1] || '';
      }
    }
    
    // Keep objectives as-is, don't split
    const objectivesArray = objectives ? [objectives] : [];
    
    // Extract projects starting from SHEET ROW 9 (array index 8)
    // NEW SCHEMA (3 rows per project):
    // SHEET ROW 9  (index 8): projectTitle_1
    // SHEET ROW 10 (index 9): projectImageUrl_1
    // SHEET ROW 11 (index 10): projectDesc_1
    // SHEET ROW 12 (index 11): projectTitle_2
    // SHEET ROW 13 (index 12): projectImageUrl_2
    // SHEET ROW 14 (index 13): projectDesc_2
    // etc...
    const projects = [];
    // Projects start at SHEET ROW 9 (index 8) by default;
    // if a Motto row occupies SHEET ROW 9, start at SHEET ROW 10 (index 9)
    let rowIndex = 8;
    if (homepageData.length > 8) {
      const row9colA = (homepageData[8][0] || '').toString();
      if (!row9colA.startsWith('projectTitle_')) {
        rowIndex = 9; // Skip motto row
      }
    }
    
    while (rowIndex < homepageData.length) {
      const titleRow = homepageData[rowIndex];
      const imageRow = homepageData[rowIndex + 1];
      const descRow = homepageData[rowIndex + 2];
      
      // Check if this is a project block
      const titleKey = titleRow ? (titleRow[0] || '').toString() : '';
      if (!titleKey.startsWith('projectTitle_')) {
        break; // No more projects
      }
      
      const title = titleRow[1] || '';
      const imageUrl = imageRow ? (imageRow[1] || '') : '';
      const description = descRow ? (descRow[1] || '') : '';
      
      if (title || imageUrl || description) {
        // Extract project number from key for frontend reference
        const match = titleKey.match(/projectTitle_(\d+)/);
        const projectNumber = match ? parseInt(match[1], 10) : 0;
        
        projects.push({
          number: projectNumber,
          title: title,
          image: imageUrl,
          description: description
        });
      }
      
      rowIndex += 3; // Move to next project (skip 3 rows)
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
        projects: projects,
        motto: motto
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
    // Ensure Age column shows as a number
    try { ageRange.setNumberFormat('0'); } catch (e) { Logger.log('setNumberFormat failed (non-fatal): ' + e.toString()); }
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

/**
 * Debug helper to inspect DOB parsing and computed ages for the first ~20 rows.
 * Writes a summary line to a sheet named "Logging Debug" (creates if missing).
 */
function recalcAllAgesDebug() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEETS.USER_PROFILES);
    if (!sheet) {
      Logger.log('User Profiles sheet not found');
      return { success: false, message: 'User Profiles sheet not found' };
    }
    var lastRow = sheet.getLastRow();
    var numRows = Math.max(0, Math.min(20, lastRow - 1));
    if (numRows === 0) return { success: true, message: 'No data rows' };
    var dobValues = sheet.getRange(2, 5, numRows, 1).getValues();
    var sample = [];
    for (var i = 0; i < numRows; i++) {
      var v = dobValues[i][0];
      var isDate = Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime());
      var computed = _computeAgeFromDate(v);
      sample.push({ row: i + 2, type: isDate ? 'Date' : (v === '' ? 'Empty' : typeof v), value: String(v), computed: computed });
    }
    Logger.log('recalcAllAgesDebug sample: ' + JSON.stringify(sample));
    var logSheet = ss.getSheetByName('Logging Debug');
    if (!logSheet) logSheet = ss.insertSheet('Logging Debug');
    logSheet.appendRow([new Date().toISOString(), 'recalcAllAgesDebug', JSON.stringify(sample)]);
    return { success: true, sample: sample };
  } catch (e) {
    Logger.log('Error in recalcAllAgesDebug: ' + e.toString());
    return { success: false, message: e.toString() };
  }
}

// ===== HOMEPAGE PROJECTS MANAGEMENT =====
/**
 * Upload a project image to Google Drive (Admin/Auditor only)
 * Expects: { action: 'uploadProjectImage', base64Image, fileName, mimeType, projectTitle, idCode }
 */
function handleUploadProjectImage(data) {
  try {
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    var role = _getUserRoleByIdCode(data.idCode);
    if (role !== 'Admin' && role !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Admin and Auditor can upload project images' };
    }
    if (!data.base64Image) {
      return { success: false, message: 'Image data is required' };
    }
    
    var folder = DriveApp.getFolderById(PROJECTS_FOLDER_ID);
    var base64Data = data.base64Image.split(',')[1] || data.base64Image;
    
    // Sanitize project title for filename
    var sanitized = (data.projectTitle || 'untitled').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    var timestamp = new Date().getTime();
    var ext = (data.mimeType || 'image/jpeg').split('/')[1] || 'jpg';
    var finalName = 'project_' + timestamp + '_' + sanitized + '.' + ext;
    
    var blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      data.mimeType || 'image/jpeg',
      finalName
    );
    
    // Check for existing file and trash
    var existingFiles = folder.getFilesByName(finalName);
    while (existingFiles.hasNext()) {
      existingFiles.next().setTrashed(true);
    }
    
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    var fileUrl = 'https://drive.google.com/uc?export=view&id=' + file.getId();
    
    Logger.log('Uploaded project image: ' + finalName + ' -> ' + fileUrl);
    
    return {
      success: true,
      message: 'Project image uploaded successfully',
      imageUrl: fileUrl,
      fileName: finalName
    };
  } catch (e) {
    Logger.log('Error in handleUploadProjectImage: ' + e.toString());
    return { success: false, message: 'Error uploading project image: ' + e.toString() };
  }
}

// ===== ORG CHART MANAGEMENT =====
/**
 * Upload an org chart image to Google Drive (Admin/Auditor only)
 * Expects: { action: 'uploadOrgChartImage', base64Image, fileName, mimeType, idCode }
 */
function handleUploadOrgChartImage(data) {
  try {
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    var role = _getUserRoleByIdCode(data.idCode);
    if (role !== 'Admin' && role !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Admin and Auditor can upload org chart images' };
    }
    if (!data.base64Image) {
      return { success: false, message: 'Image data is required' };
    }

    var folder = DriveApp.getFolderById(ORG_CHART_FOLDER_ID);
    var base64Data = data.base64Image.split(',')[1] || data.base64Image;

    var timestamp = new Date().getTime();
    var ext = (data.mimeType || 'image/jpeg').split('/')[1] || 'jpg';
    var finalName = 'orgchart_' + timestamp + '.' + ext;

    var blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      data.mimeType || 'image/jpeg',
      finalName
    );

    // Remove any existing file with the same name (unlikely) then create new
    var existingFiles = folder.getFilesByName(finalName);
    while (existingFiles.hasNext()) {
      existingFiles.next().setTrashed(true);
    }

    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileUrl = 'https://drive.google.com/uc?export=view&id=' + file.getId();

    return {
      success: true,
      message: 'Org chart image uploaded successfully',
      imageUrl: fileUrl,
      fileName: finalName
    };
  } catch (e) {
    Logger.log('Error in handleUploadOrgChartImage: ' + e.toString());
    return { success: false, message: 'Error uploading org chart image: ' + e.toString() };
  }
}

/**
 * Update the org chart URL in the sheet (Admin/Auditor only)
 * Expects: { action: 'updateOrgChartUrl', imageUrl, idCode }
 */
function handleUpdateOrgChartUrl(data) {
  try {
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    var role = _getUserRoleByIdCode(data.idCode);
    if (role !== 'Admin' && role !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Admin and Auditor can update org chart' };
    }
    if (!data.imageUrl) {
      return { success: false, message: 'Image URL is required' };
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEETS.HOMEPAGE_CONTENT);
    if (!sheet) {
      return { success: false, message: 'Homepage Content sheet not found' };
    }

    // Row 4 (index 3) Column B holds orgChartUrl according to handleGetHomepageContent
    sheet.getRange(4, 2).setValue(data.imageUrl);
    return { success: true, message: 'Org chart updated' };
  } catch (e) {
    Logger.log('Error in handleUpdateOrgChartUrl: ' + e.toString());
    return { success: false, message: 'Error updating org chart link: ' + e.toString() };
  }
}

/**
 * Delete the org chart (clear link and optionally trash the file) (Admin/Auditor only)
 * Expects: { action: 'deleteOrgChart', idCode }
 */
function handleDeleteOrgChart(data) {
  try {
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    var role = _getUserRoleByIdCode(data.idCode);
    if (role !== 'Admin' && role !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Admin and Auditor can delete org chart' };
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEETS.HOMEPAGE_CONTENT);
    if (!sheet) {
      return { success: false, message: 'Homepage Content sheet not found' };
    }

    // Optionally trash existing file if link present
    var currentUrl = sheet.getRange(4, 2).getValue();
    try {
      if (currentUrl && typeof currentUrl === 'string') {
        var idMatch = currentUrl.match(/[?&]id=([^&]+)/) || currentUrl.match(/\/file\/d\/([^/]+)/);
        if (idMatch && idMatch[1]) {
          var file = DriveApp.getFileById(idMatch[1]);
          file.setTrashed(true);
        }
      }
    } catch (inner) {
      Logger.log('Warning (non-fatal) trashing org chart file: ' + inner.toString());
    }

    // Clear the URL from the sheet
    sheet.getRange(4, 2).setValue('');
    return { success: true, message: 'Org chart link cleared' };
  } catch (e) {
    Logger.log('Error in handleDeleteOrgChart: ' + e.toString());
    return { success: false, message: 'Error deleting org chart: ' + e.toString() };
  }
}
/**
 * Add a new homepage project (Admin/Auditor only)
 * Expects: { action: 'addHomepageProject', title, imageUrl, description, idCode }
 * Appends 3 rows: projectTitle_N, projectImageUrl_N, projectDesc_N
 */
function handleAddHomepageProject(data) {
  try {
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    var role = _getUserRoleByIdCode(data.idCode);
    if (role !== 'Admin' && role !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Admin and Auditor can add projects' };
    }
    if (!data.title || !data.imageUrl || !data.description) {
      return { success: false, message: 'Title, image URL, and description are required' };
    }
    
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEETS.HOMEPAGE_CONTENT);
    if (!sheet) {
      return { success: false, message: 'Homepage Content sheet not found' };
    }
    
    // Find highest existing project number
    var allData = sheet.getDataRange().getValues();
    var maxN = 0;
    for (var i = 0; i < allData.length; i++) {
      var key = allData[i][0] ? allData[i][0].toString() : '';
      var match = key.match(/^projectTitle_(\d+)$/);
      if (match) {
        var num = parseInt(match[1], 10);
        if (num > maxN) maxN = num;
      }
    }
    var nextN = maxN + 1;
    
    // Append 3 rows at the end
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1).setValue('projectTitle_' + nextN);
    sheet.getRange(lastRow + 1, 2).setValue(data.title);
    sheet.getRange(lastRow + 2, 1).setValue('projectImageUrl_' + nextN);
    sheet.getRange(lastRow + 2, 2).setValue(data.imageUrl);
    sheet.getRange(lastRow + 3, 1).setValue('projectDesc_' + nextN);
    sheet.getRange(lastRow + 3, 2).setValue(data.description);
    
    Logger.log('Added homepage project: ' + nextN + ' - ' + data.title);
    
    // Invalidate homepage cache
    invalidateCache('homepage_content');
    
    return {
      success: true,
      message: 'Project added successfully',
      projectNumber: nextN,
      title: data.title
    };
  } catch (e) {
    Logger.log('Error in handleAddHomepageProject: ' + e.toString());
    return { success: false, message: 'Error adding project: ' + e.toString() };
  }
}

/**
 * Delete a homepage project by number (Admin/Auditor only)
 * Expects: { action: 'deleteHomepageProject', projectNumber, idCode }
 * Removes 3 rows: projectTitle_N, projectImageUrl_N, projectDesc_N
 */
function handleDeleteHomepageProject(data) {
  try {
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    var role = _getUserRoleByIdCode(data.idCode);
    if (role !== 'Admin' && role !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Admin and Auditor can delete projects' };
    }
    if (!data.projectNumber) {
      return { success: false, message: 'Project number is required' };
    }
    
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEETS.HOMEPAGE_CONTENT);
    if (!sheet) {
      return { success: false, message: 'Homepage Content sheet not found' };
    }
    
    var allData = sheet.getDataRange().getValues();
    var titleKey = 'projectTitle_' + data.projectNumber;
    var imageKey = 'projectImageUrl_' + data.projectNumber;
    var descKey = 'projectDesc_' + data.projectNumber;
    
    var rowsToDelete = [];
    for (var i = 0; i < allData.length; i++) {
      var key = allData[i][0] ? allData[i][0].toString() : '';
      if (key === titleKey || key === imageKey || key === descKey) {
        rowsToDelete.push(i + 1); // 1-indexed
      }
    }
    
    if (rowsToDelete.length === 0) {
      return { success: false, message: 'Project not found' };
    }
    
    // Delete rows in reverse order to maintain indices
    rowsToDelete.sort(function(a, b) { return b - a; });
    for (var j = 0; j < rowsToDelete.length; j++) {
      sheet.deleteRow(rowsToDelete[j]);
    }
    
    Logger.log('Deleted homepage project: ' + data.projectNumber);
    
    // Invalidate homepage cache
    invalidateCache('homepage_content');
    
    return {
      success: true,
      message: 'Project deleted successfully',
      projectNumber: data.projectNumber
    };
  } catch (e) {
    Logger.log('Error in handleDeleteHomepageProject: ' + e.toString());
    return { success: false, message: 'Error deleting project: ' + e.toString() };
  }
}

// ===== ADMIN/AUDITOR-ONLY API ENDPOINTS FOR AGE RECALC =====
/**
 * Internal helper: get role by ID Code from User Profiles
 */
function _getUserRoleByIdCode(idCode) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEETS.USER_PROFILES);
    if (!sheet) return '';
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][18] && rows[i][18].toString() === String(idCode)) {
        return rows[i][20] || '';
      }
    }
    return '';
  } catch (e) {
    Logger.log('Error in _getUserRoleByIdCode: ' + e.toString());
    return '';
  }
}

/**
 * Manually trigger age recalculation from the client. Auditor-only.
 * Expects: { action: 'recalcAgesNow', idCode: '...' }
 */
function handleRecalcAgesNow(data) {
  try {
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    var role = _getUserRoleByIdCode(data.idCode);
    if (role !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Auditor can run age recalculation' };
    }
    var result = recalcAllAges();
    return { success: result.success, message: result.message || ('Age recalculated for ' + (result.updated || 0) + ' user(s)'), updated: result.updated || 0 };
  } catch (e) {
    Logger.log('Error in handleRecalcAgesNow: ' + e.toString());
    return { success: false, message: 'Error recalculating ages: ' + e.toString() };
  }
}

/**
 * Install the daily trigger from the client. Auditor-only.
 * Expects: { action: 'installAgeRecalcTrigger', idCode: '...' }
 */
function handleInstallAgeRecalcTrigger(data) {
  try {
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    var role = _getUserRoleByIdCode(data.idCode);
    if (role !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Auditor can install the daily trigger' };
    }
    var res = installDailyAgeRecalcTrigger();
    return res;
  } catch (e) {
    Logger.log('Error in handleInstallAgeRecalcTrigger: ' + e.toString());
    return { success: false, message: 'Error installing trigger: ' + e.toString() };
  }
}

// ===== ROLE ASSIGNMENT & MANAGEMENT SYSTEM =====
/**
 * Determine the role based on ID Code and Position
 */
function determineRole(idCode, position) {
  // Check for Admin role
  if (idCode === 'YSPTPR-25100') {
    return 'Admin';
  }
  
  // Check for Auditor role
  if (idCode === 'YSPTIR-25200') {
    return 'Auditor';
  }
  
  // Check if ID code ends with 00 (last 2 digits are zeros) -> Head
  if (idCode && String(idCode).match(/-\d{3}00$/)) {
    return 'Head';
  }
  
  // Check for Committee Member position
  if (position && String(position).toLowerCase().indexOf('committee member') !== -1) {
    return 'Member';
  }
  
  return '';
}

/**
 * Bulk update user profiles with automatic role assignment
 * Syncs User Profiles with Officer Directory data
 * Updates ID Code (Column S/19), Position (Column T/20), and Role (Column U/21)
 */
function updateUserProfiles() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var userProfiles = ss.getSheetByName(SHEETS.USER_PROFILES);
    var officerDirectory = ss.getSheetByName(SHEETS.OFFICER_DIRECTORY);

    if (!userProfiles || !officerDirectory) {
      Logger.log('❌ Missing required sheet(s).');
      return { success: false, message: 'Missing required sheets' };
    }

    var userLastRow = userProfiles.getLastRow();
    var officerLastRow = officerDirectory.getLastRow();

    if (userLastRow < 2 || officerLastRow < 2) {
      Logger.log('❌ No data to process.');
      return { success: false, message: 'No data to process' };
    }

    // Read data
    var userData = userProfiles.getRange(2, 1, userLastRow - 1, userProfiles.getLastColumn()).getValues();
    var officerData = officerDirectory.getRange(2, 1, officerLastRow - 1, 3).getValues();

    // Build lookup maps
    var nameToID = {};
    var nameToPosition = {};
    for (var i = 0; i < officerData.length; i++) {
      var id = officerData[i][0];
      var name = officerData[i][1];
      var position = officerData[i][2];
      if (name && id) {
        var key = String(name).replace(/\s+/g, ' ').trim().toLowerCase();
        nameToID[key] = id;
        nameToPosition[key] = position;
      }
    }

    var updates = 0;
    for (var j = 0; j < userData.length; j++) {
      var row = j + 2;
      var fullName = userData[j][3]; // Column D = Full Name
      var currentRole = userData[j][20]; // Column U = Current Role

      if (!fullName) continue;

      var key = String(fullName).replace(/\s+/g, ' ').trim().toLowerCase();
      var idCode = nameToID[key];
      var position = nameToPosition[key];

      if (idCode || position) {
        var newRole = determineRole(idCode, position);
        
        // Protect existing Head and Banned roles from being overridden
        // Only override if:
        // 1. Current role is NOT 'Head' (unless new role is also 'Head' based on ID)
        // 2. Current role is NOT 'Banned'
        var shouldUpdateRole = true;
        if (currentRole === 'Banned') {
          // Never override Banned status
          shouldUpdateRole = false;
          newRole = 'Banned';
        } else if (currentRole === 'Head' && newRole !== 'Head') {
          // Preserve existing Head role unless new ID code also indicates Head
          shouldUpdateRole = false;
          newRole = 'Head';
        }
        
        userProfiles.getRange(row, 19).setValue(idCode || '');
        userProfiles.getRange(row, 20).setValue(position || '');
        userProfiles.getRange(row, 21).setValue(newRole || '');
        updates++;
      }
    }

    Logger.log('✅ Updated ' + updates + ' rows.');
    return { success: true, message: 'Updated ' + updates + ' user profiles', updated: updates };
  } catch (e) {
    Logger.log('Error in updateUserProfiles: ' + e.toString());
    return { success: false, message: 'Error updating profiles: ' + e.toString() };
  }
}

/**
 * Auto-trigger when you edit a Full Name (Column D)
 * Automatically syncs role data when a name is edited
 */
function onEdit(e) {
  try {
    var sheet = e.source.getActiveSheet();
    if (sheet.getName() !== SHEETS.USER_PROFILES) return;
    var col = e.range.getColumn();
    var row = e.range.getRow();

    // Only run if Full Name column (D)
    if (col !== 4 || row < 2) return;

    var name = e.range.getValue();
    if (!name) return;

    var ss = e.source;
    var officerDirectory = ss.getSheetByName(SHEETS.OFFICER_DIRECTORY);
    var officerData = officerDirectory.getRange(2, 1, officerDirectory.getLastRow() - 1, 3).getValues();

    var nameToID = {};
    var nameToPosition = {};
    for (var i = 0; i < officerData.length; i++) {
      var id = officerData[i][0];
      var fullName = officerData[i][1];
      var position = officerData[i][2];
      if (fullName) {
        var key = String(fullName).replace(/\s+/g, ' ').trim().toLowerCase();
        nameToID[key] = id;
        nameToPosition[key] = position;
      }
    }

    var key = String(name).replace(/\s+/g, ' ').trim().toLowerCase();
    var idCode = nameToID[key];
    var position = nameToPosition[key];
    var newRole = determineRole(idCode, position);
    
    // Get current role to check if it should be protected
    var currentRole = sheet.getRange(row, 21).getValue();

    if (idCode || position) {
      // Protect existing Head and Banned roles
      if (currentRole === 'Banned') {
        // Never override Banned status
        newRole = 'Banned';
      } else if (currentRole === 'Head' && newRole !== 'Head') {
        // Preserve existing Head role unless new ID code also indicates Head
        newRole = 'Head';
      }
      
      sheet.getRange(row, 19).setValue(idCode || '');
      sheet.getRange(row, 20).setValue(position || '');
      sheet.getRange(row, 21).setValue(newRole || '');
    }

    Logger.log('✅ Row ' + row + ' updated for ' + name);
  } catch (err) {
    Logger.log('Error in onEdit: ' + err.toString());
  }
}

/**
 * Auditor-only: Trigger bulk role assignment
 * Expects: { action: 'assignRoles', idCode: '...' }
 */
function handleAssignRoles(data) {
  try {
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    var role = _getUserRoleByIdCode(data.idCode);
    if (role !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Auditor can assign roles' };
    }
    var result = updateUserProfiles();
    return result;
  } catch (e) {
    Logger.log('Error in handleAssignRoles: ' + e.toString());
    return { success: false, message: 'Error assigning roles: ' + e.toString() };
  }
}

/**
 * Get all users with their ID Code, Name, and Role
 * Auditor-only endpoint for role management
 * Expects: { action: 'getAllUserRoles', idCode: '...' }
 */
function handleGetAllUserRoles(data) {
  try {
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    var role = _getUserRoleByIdCode(data.idCode);
    if (role !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Auditor can view all user roles' };
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEETS.USER_PROFILES);
    if (!sheet) {
      return { success: false, message: 'User Profiles sheet not found' };
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { success: true, message: 'No users found', users: [] };
    }

    // Get Full Name (D/4), ID Code (S/19), and Role (U/21)
    var data = sheet.getRange(2, 1, lastRow - 1, 21).getValues();
    var users = [];

    for (var i = 0; i < data.length; i++) {
      var fullName = data[i][3]; // Column D
      var idCode = data[i][18]; // Column S
      var userRole = data[i][20]; // Column U

      if (fullName && idCode) {
        users.push({
          fullName: String(fullName),
          idCode: String(idCode),
          role: String(userRole || '')
        });
      }
    }

    return {
      success: true,
      message: 'Retrieved ' + users.length + ' users',
      users: users
    };
  } catch (e) {
    Logger.log('Error in handleGetAllUserRoles: ' + e.toString());
    return { success: false, message: 'Error retrieving user roles: ' + e.toString() };
  }
}

/**
 * Update a user's role manually (overrides automatic assignment)
 * Auditor-only endpoint
 * Expects: { action: 'updateUserRole', idCode: '...', targetIdCode: '...', newRole: '...' }
 */
function handleUpdateUserRole(data) {
  try {
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    var role = _getUserRoleByIdCode(data.idCode);
    if (role !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Auditor can update user roles' };
    }

    if (!data.targetIdCode || !data.newRole) {
      return { success: false, message: 'Target ID Code and new role are required' };
    }

    // Validate role
    var validRoles = ['Admin', 'Auditor', 'Head', 'Member', 'Banned'];
    if (validRoles.indexOf(data.newRole) === -1) {
      return { success: false, message: 'Invalid role. Must be one of: ' + validRoles.join(', ') };
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEETS.USER_PROFILES);
    if (!sheet) {
      return { success: false, message: 'User Profiles sheet not found' };
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { success: false, message: 'No users found' };
    }

    // Find user by ID Code (Column S/19)
    var idCodes = sheet.getRange(2, 19, lastRow - 1, 1).getValues();
    var targetRow = -1;

    for (var i = 0; i < idCodes.length; i++) {
      if (String(idCodes[i][0]) === String(data.targetIdCode)) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) {
      return { success: false, message: 'User with ID Code ' + data.targetIdCode + ' not found' };
    }

    // Update role (Column U/21)
    sheet.getRange(targetRow, 21).setValue(data.newRole);

    Logger.log('✅ Updated role for ' + data.targetIdCode + ' to ' + data.newRole);
    return {
      success: true,
      message: 'Role updated successfully',
      idCode: data.targetIdCode,
      newRole: data.newRole
    };
  } catch (e) {
    Logger.log('Error in handleUpdateUserRole: ' + e.toString());
    return { success: false, message: 'Error updating role: ' + e.toString() };
  }
}


// ===== GET DATABASE SCHEMA HANDLER =====
function handleGetDatabaseSchema(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheets = ss.getSheets();
    const schema = {};
    
    sheets.forEach(sheet => {
      const sheetName = sheet.getName();
      const lastCol = sheet.getLastColumn();
      if (lastCol > 0) {
        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        // Filter out empty headers
        schema[sheetName] = headers.map(h => h ? h.toString() : '');
      } else {
        schema[sheetName] = [];
      }
    });
    
    return { success: true, schema: schema };
  } catch (error) {
    return { success: false, message: 'Error fetching schema: ' + error.toString() };
  }
}
