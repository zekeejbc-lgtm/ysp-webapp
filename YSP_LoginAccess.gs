// ===== CONFIGURATION =====
const SPREADSHEET_ID = '1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU';
const PROFILE_PICTURES_FOLDER_ID = '192-pVluL93fYKpyJoukfi_H5az_9fqFK'; // Google Drive folder for profile pictures
const PROJECTS_FOLDER_ID = '1G68-t3Urdc6iBW6Utl7zbvlb4xa6MvSH'; // Google Drive folder for homepage project images
const ORG_CHART_FOLDER_ID = '1-svfAWzLOwzY2WlNUom-KXoAF9_wNckR'; // Google Drive folder for org chart images
const FEEDBACK_IMAGES_FOLDER_ID = '12GOFbwF9Cyh-6WxE4aeMe-XaOzMdMm52'; // Google Drive folder for feedback images

// New image upload folder IDs from user requirements
const PROJECTS_IMPLEMENTED_FOLDER_ID = '1WfWmKxF9ewna6E5GnyAmNVS5HI7rlqRR'; // ProjectsImplementedURL
const ORGCHART_UPLOAD_FOLDER_ID = '109vHL0iaJAcmAb0H9v6qSAdWJk2bAHyt'; // OrgChartURL
const FOUNDER_IMAGE_FOLDER_ID = '1d7emUcnL3YEOpS40Y19ssoEFAohDveuv'; // FounderURL
const DEVELOPER_IMAGE_FOLDER_ID = '1d7emUcnL3YEOpS40Y19ssoEFAohDveuv'; // DeveloperURL
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
// Handle OPTIONS request for CORS preflight
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'YSP Web App API is running. Use POST requests for data operations.'
  }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    let data;
    
    // Handle both JSON and URL-encoded form data
    if (e.postData.type === 'application/x-www-form-urlencoded') {
      // Parse URL-encoded data
      data = {};
      const params = e.parameter;
      for (let key in params) {
        try {
          // Try to parse as JSON if it looks like JSON
          data[key] = params[key].startsWith('{') || params[key].startsWith('[') 
            ? JSON.parse(params[key]) 
            : params[key];
        } catch (err) {
          data[key] = params[key];
        }
      }
    } else {
      // Parse JSON data
      data = JSON.parse(e.postData.contents);
    }
    
    const response = handlePostRequest(data);
    
    // Return response with CORS headers
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
    case 'getAllAnnouncementsForMigration':
      return handleGetAllAnnouncementsForMigration(data);
    case 'getAllAttendanceForMigration':
      return handleGetAllAttendanceForMigration(data);
    case 'recalcAgesNow':
      return handleRecalcAgesNow(data);
    case 'installAgeRecalcTrigger':
      return handleInstallAgeRecalcTrigger(data);
    case 'uploadProjectImage':
      return handleUploadProjectImage(data);
    case 'addHomepageProject':
      return handleAddHomepageProject(data);
    case 'createProject':
      return handleCreateProject(data);
    case 'deleteHomepageProject':
      return handleDeleteHomepageProject(data);
    case 'updateHomepageContent':
      return handleUpdateHomepageContent(data);
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
    case 'uploadImage':
      return handleUploadImage(data);
    case 'uploadFounderImage':
      return handleUploadFounderImage(data);
    case 'uploadDeveloperImage':
      return handleUploadDeveloperImage(data);
    case 'updateFounderInfo':
      return handleUpdateFounderInfo(data);
    case 'updateDeveloperInfo':
      return handleUpdateDeveloperInfo(data);
    case 'deleteFounder':
      return handleDeleteFounder(data);
    case 'deleteDeveloper':
      return handleDeleteDeveloper(data);
    case 'initializeFounderInfo':
      return initializeFounderInfoSheet();
    case 'initializeDeveloperInfo':
      return initializeDeveloperInfoSheet();
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
    
    // Normalize input
    const inputUsername = (data.username || '').toString().trim();
    const inputPassword = (data.password || '').toString().trim();

    // Find user (skip header row)
    for (let i = 1; i < profilesData.length; i++) {
      const row = profilesData[i];
      const username = (row[13] || '').toString().trim(); // Column N - Username
      const password = (row[14] || '').toString().trim(); // Column O - Password
      
      if (username === inputUsername && password === inputPassword) {
        // Log access with NEW structure: Timestamp, Account Created, Email, ID Code, Name, Role, Action, ActionType, IP Address, Device, Status
        const timestamp = new Date().toISOString();
        const accountCreated = row[0];        // Column A - Timestamp (from User Profiles)
        const email = row[12];                // Column M - Personal Email Address
        const idCode = row[18];               // Column S - ID Code
        const fullName = row[3];              // Column D - Full Name
        const role = row[20];                 // Column U - Role
        
        // New columns
        const action = 'login';
        const actionType = 'authentication';
        const ipAddress = ''; // Not available from Apps Script
        const device = ''; // Not available from Apps Script
        const status = 'success';
        
        accessLogsSheet.appendRow([timestamp, accountCreated, email, idCode, fullName, role, action, actionType, ipAddress, device, status]);
        
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
    
    // Log guest access with NEW structure: Timestamp, Account Created, Email, ID Code, Name, Role, Action, ActionType, IP Address, Device, Status
    const timestamp = new Date().toISOString();
    accessLogsSheet.appendRow([timestamp, 'N/A', 'N/A', 'N/A', data.name || 'Guest', 'Guest', 'guestLogin', 'authentication', '', '', 'success']);
    
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
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const feedbackSheet = ss.getSheetByName(SHEETS.FEEDBACK);
    ensureFeedbackSchema(feedbackSheet);

    // Validate required fields
    if (!data.message) {
      return { success: false, message: 'Message is required' };
    }
    const authorNameInput = data.anonymous ? 'Anonymous' : (data.authorName || 'Guest');

    // Basic throttling: limit 3 submissions per 5 minutes per user/guest
    try {
      const throttled = checkFeedbackThrottle(data.authorIdCode || 'Guest', authorNameInput);
      if (throttled) {
        return { success: false, message: 'Too many submissions. Please try again in a few minutes.' };
      }
    } catch (thErr) {
      Logger.log('Throttle check error: ' + thErr);
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

    feedbackSheet.appendRow(row);
    
    Logger.log('Created feedback: ' + newReferenceId + ' by ' + data.authorName);
    
    return {
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
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Get Homepage Content (key-value pairs)
    const homepageData = getCachedOrFetch(
      'homepage_content',
      function() {
        const homepageSheet = ss.getSheetByName(SHEETS.HOMEPAGE_CONTENT);
        if (!homepageSheet) throw new Error('Homepage Content sheet not found');
        return homepageSheet.getRange(1, 1, homepageSheet.getLastRow(), homepageSheet.getLastColumn()).getValues();
      },
      CACHE_EXPIRATION.HOMEPAGE_CONTENT
    );

    // Build key-value map from Column A (key) and Column B (value), skip header row
    const map = {};
    for (let i = 1; i < homepageData.length; i++) {
      const k = (homepageData[i][0] || '').toString().trim();
      const v = homepageData[i][1];
      if (k) map[k] = v;
    }

    // Ensure all expected homepage fields are present with fallback values
    const ensure = (val, fallback = '') => (typeof val === 'string' && val.trim() !== '' ? val : fallback);
    map['aboutYSP'] = ensure(map['aboutYSP'] || map['about'], '');
    map['mission'] = ensure(map['mission'], '');
    map['vision'] = ensure(map['vision'], '');
    map['Section 3. YSP shall be guided by the following advocacy pillars:'] = ensure(map['Section 3. YSP shall be guided by the following advocacy pillars:'], '');
    map['title'] = ensure(map['title'], 'Welcome to Youth Service Philippines');
    map['subtitle'] = ensure(map['subtitle'], 'Tagum Chapter');
    map['motto'] = ensure(map['motto'], 'Empowering youth to serve communities');
    map['membership_URL'] = ensure(map['membership_URL'], '');
    map['orgChartUrl'] = ensure(map['orgChartUrl'], '');
    map['email'] = ensure(map['email'], '');
    map['phone'] = ensure(map['phone'], '');
    map['founderName'] = ensure(map['founderName'], '');
    map['location_url'] = ensure(map['location_url'], '');
    map['partner_url'] = ensure(map['partner_url'], '');

    // Get Projects from Homepage_Projects sheet
    const projectsData = getCachedOrFetch(
      'homepage_projects',
      function() {
        const projectsSheet = ss.getSheetByName('Homepage_Projects');
        if (!projectsSheet) return [];
        return getOptimizedRange(projectsSheet); // Skip header row
      },
      CACHE_EXPIRATION.HOMEPAGE_CONTENT
    );

    const projects = projectsData.map(function(row) {
      return {
        id: row[0] || '',
        title: row[1] || '',
        description: row[2] || '',
        image: convertToPublicDriveUrl(row[3] || ''),
        link: row[4] || '',
        linkText: row[5] || 'Learn More',
        active: row[6] !== false // Default to true if not specified
      };
    }).filter(function(p) { return p.active && p.title; }); // Only active projects with titles

    // Get Developer Info (new schema) from Home_DevInfo sheet (NO CACHE for always fresh data)
    let developers = [];
    try {
      const devSheet = ss.getSheetByName('Home_DevInfo');
      if (devSheet) {
        const values = devSheet.getDataRange().getValues();
        if (values.length >= 2) {
          const headers = values[0];
          for (let i=1;i<values.length;i++) {
            const row = values[i];
            if (!row[0]) continue;
            const obj = {};
            for (let c=0;c<headers.length;c++) obj[headers[c]] = row[c];
            // Aggregate backgrounds
            const backgrounds = [];
            for (let b=1;b<=5;b++) if (obj['Background_'+b]) backgrounds.push(obj['Background_'+b]);
            // Aggregate affiliations
            const affiliations = [];
            for (let a=1;a<=5;a++) {
              const aff = obj['Affiliation_'+a];
              const pos = obj['Position_'+a];
              if (aff || pos) affiliations.push({ affiliation: aff||'', position: pos||'' });
            }
            developers.push({
              id: obj['ID']||'',
              name: obj['Name']||'',
              role: obj['Role']||'',
              position: obj['Position']||'',
              organization: obj['Organization']||'',
              about: obj['About']||'',
              backgroundSegments: backgrounds,
              affiliations: affiliations,
              projectHighlights: obj['ProjectHighlights']||'',
              personalPhilosophy: obj['PersonalPhilosophy']||'',
              profilePicture: obj['ProfilePicture']||'',
              social: {
                facebook: obj['Facebook']||'',
                instagram: obj['Instagram']||'',
                twitter: obj['Twitter']||'',
                linkedin: obj['LinkedIn']||'',
                website: obj['Website']||''
              },
              contact: {
                email: obj['Email']||'',
                phone: obj['Phone']||'',
                location: obj['Location']||''
              },
              active: obj['Active'] !== false && obj['Active'] !== 'false'
            });
          }
        }
      }
    } catch (e) { developers = []; }
    developers = developers.filter(function(d){return d.active && d.name;});

    // Get Founder Info (new schema) from Home_FounderInfo sheet (NO CACHE for always fresh data)
    let founders = [];
    try {
      const fSheet = ss.getSheetByName('Home_FounderInfo');
      if (fSheet) {
        const values = fSheet.getDataRange().getValues();
        if (values.length >= 2) {
          const headers = values[0];
          for (let i=1;i<values.length;i++) {
            const row = values[i];
            if (!row[0]) continue;
            const obj = {};
            for (let c=0;c<headers.length;c++) obj[headers[c]] = row[c];
            // Gather achievements
            const achievements = [];
            for (let a=1;a<=10;a++) if (obj['Achievement_'+a]) achievements.push(obj['Achievement_'+a]);
            founders.push({
              id: obj['ID']||'',
              name: obj['Name']||'',
              nickname: obj['Nickname']||'',
              role: obj['Role']||'',
              about: obj['About']||'',
              backgroundJourney: obj['BackgroundJourney']||'',
              achievements: achievements,
              organizationalImpact: obj['OrganizationalImpact']||'',
              leadershipPhilosophy: obj['LeadershipPhilosophy']||'',
              profilePicture: obj['ProfilePicture']||'',
              social: {
                facebook: obj['Facebook']||'',
                instagram: obj['Instagram']||'',
                twitter: obj['Twitter']||'',
                linkedin: obj['LinkedIn']||'',
                website: obj['Website']||''
              },
              contact: {
                email: obj['Email']||'',
                phone: obj['Phone']||'',
                officeLocation: obj['OfficeLocation']||''
              },
              active: obj['Active'] !== false && obj['Active'] !== 'false'
            });
          }
        }
      }
    } catch (e) { founders = []; }
    founders = founders.filter(function(f){return f.active && f.name;});

    // Extract and normalize primary fields
    const title = (map['title'] || '').toString();
    const subtitle = (map['subtitle'] || '').toString();
    const membershipURL = (map['membership_URL'] || '').toString();
    const motto = (map['motto'] || '').toString();
    const vision = (map['vision'] || '').toString();
    const mission = (map['mission'] || '').toString();
    const objectivesText = (map['Section 3. YSP shall be guided by the following advocacy pillars:'] || '').toString();
    const orgChartUrl = (map['orgChartUrl'] || '').toString();
    const email = (map['email'] || '').toString();
    const phone = (map['phone'] || '').toString();
    const aboutYSP = (map['aboutYSP'] || map['about'] || '').toString();
    const founderName = (map['founderName'] || '').toString();
    const locationUrl = (map['location_url'] || '').toString();
    const partnerUrl = (map['partner_url'] || '').toString();
    
    // Helper to read value from map using multiple possible key variants
    function getMapValue(keys) {
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (map[k] !== undefined && map[k] !== null && String(map[k]).toString().trim() !== '') {
          return String(map[k]).toString();
        }
      }
      return '';
    }

    // Social media links (accept many legacy variants)
    const facebookUrl = getMapValue(['facebook_url', 'facebookUrl', 'facebook', 'facebook-url']);
    const instagramUrl = getMapValue(['instagram_url', 'instagramUrl', 'instagram', 'instagram-url']);
    const twitterUrl = getMapValue(['twitter_url', 'twitterUrl', 'twitter', 'twitter-url']);
    const linkedinUrl = getMapValue(['linkedin_url', 'linkedinUrl', 'linkedin', 'linkedin-url']);
    const youtubeUrl = getMapValue(['youtube_url', 'youtubeUrl', 'youtube', 'youtube-url']);
    const tiktokUrl = getMapValue(['tiktok_url', 'tiktokUrl', 'tiktok', 'tiktok-url']);

    Logger.log('Retrieved homepage content: ' + Object.keys(map).length + ' settings, ' + 
           projects.length + ' projects, ' + developers.length + ' developers, ' + 
           founders.length + ' founders');
    Logger.log('Homepage map object: ' + JSON.stringify(map));

    // Parse individual project keys (ProjectTitle_*, ProjectDesc_*, ProjectImageURL_*, ProjectLinkURL_*, ProjectLinkText_*)
    var legacyProjects = [];
    var projectIndex = 1;
    while (projectIndex < 50) { // reasonable upper bound
      var tKey = 'ProjectTitle_' + projectIndex;
      var dKey = 'ProjectDesc_' + projectIndex;
      var iKey = 'ProjectImageURL_' + projectIndex;
      var lKey = 'ProjectLinkURL_' + projectIndex;
      var ltKey = 'ProjectLinkText_' + projectIndex;
      if (map[tKey] || map[dKey] || map[iKey]) {
        legacyProjects.push({
          number: projectIndex,
          id: 'project_' + projectIndex,
          title: (map[tKey] || '').toString(),
          description: (map[dKey] || '').toString(),
          image: convertToPublicDriveUrl((map[iKey] || '').toString()),
          link: (map[lKey] || '').toString(),
          linkText: (map[ltKey] || 'Learn More').toString(),
          active: true
        });
      }
      projectIndex++;
    }
    // Combine sheet-based projects with legacy inline projects (legacy last)
    var combinedProjects = projects.concat(legacyProjects.filter(function(lp){return lp.title;}));

    // Build normalized content object with all expected keys and safe defaults
    const normalizedHero = {
      hero_main_heading: title || motto || 'Welcome to Youth Service Philippines',
      hero_sub_heading: subtitle || 'Tagum Chapter',
      hero_tagline: map['hero_tagline'] || map['heroTagline'] || motto || aboutYSP || '',
      membership_URL: membershipURL || ''
    };

    const normalizedContact = {
      title: map['contact_title'] || map['contactTitle'] || 'Get in Touch',
      email: email || '',
      emailHref: email ? ('mailto:' + String(email).trim()) : '',
      phone: phone || '',
      phoneHref: phone ? ('tel:' + String(phone).replace(/\s+/g, '')) : '',
      location: map['location_text'] || map['location_text'] || '',
      locationLink: locationUrl || getMapValue(['location_url', 'locationUrl', 'location', 'location-link']),
      // Individual social links
      facebook: facebookUrl || '',
      instagram: instagramUrl || '',
      twitter: twitterUrl || '',
      linkedin: linkedinUrl || '',
      youtube: youtubeUrl || '',
      tiktok: tiktokUrl || '',
      // Composite / legacy fields
      socialLink: map['social_link'] || facebookUrl || instagramUrl || linkedinUrl || '',
      socialLabel: map['social_label'] || 'Facebook',
      socialText: map['social_text'] || '',
      // Partner/organization
      partnerButtonLink: partnerUrl || getMapValue(['partner_url', 'partnerUrl', 'partner', 'partner-link']) || map['partner_url'] || '',
      partnerButtonText: map['partnerButtonText'] || map['partner_button_text'] || 'Partner with Us',
      partnerTitle: map['partnerTitle'] || map['partner_title'] || '',
      partnerDescription: map['partnerDescription'] || map['partner_description'] || '',
      // Provide an array of social links for UI to iterate
      socialLinks: [
        { platform: 'facebook', url: facebookUrl || '' },
        { platform: 'instagram', url: instagramUrl || '' },
        { platform: 'twitter', url: twitterUrl || '' },
        { platform: 'linkedin', url: linkedinUrl || '' },
        { platform: 'youtube', url: youtubeUrl || '' },
        { platform: 'tiktok', url: tiktokUrl || '' }
      ].filter(function(s){ return s.url && s.url.toString().trim() !== ''; })
    };

    const advocacyPillarsObj = {
      title: map['advocacy_title'] || 'Advocacy Pillars',
      intro: objectivesText || map['advocacy_intro'] || '',
      pillars: []
    };

    // Try to parse numbered pillars from intro if present (legacy format)
    try {
      const introText = advocacyPillarsObj.intro || '';
      const pillarMatches = introText.match(/\d+\.\)\s*[^\n]+/g) || [];
      if (pillarMatches.length) {
        advocacyPillarsObj.pillars = pillarMatches.map(function(p) { return { label: '', description: p.replace(/^\d+\.\)\s*/, '') }; });
      } else if (map['advocacy_pillars_json']) {
        try { advocacyPillarsObj.pillars = JSON.parse(map['advocacy_pillars_json']); } catch (e) { advocacyPillarsObj.pillars = []; }
      }
    } catch (e) { advocacyPillarsObj.pillars = []; }

    // Ensure projects are always an array
    const normalizedProjects = Array.isArray(combinedProjects) ? combinedProjects : [];

    // Ensure developers/founders arrays exist
    const normalizedDevelopers = Array.isArray(developers) ? developers : [];
    const normalizedFounders = Array.isArray(founders) ? founders : [];

    const normalizedContent = {
      // Keep legacy simple fields for backward compatibility
      mission: mission || '',
      vision: vision || '',
      about: aboutYSP || '',
      objectives: objectivesText ? [objectivesText] : [],
      orgChartUrl: convertToPublicDriveUrl(orgChartUrl || ''),
      email: email || '',
      phone: phone || '',
      motto: motto || '',
      membership_URL: membershipURL || '',
      founderName: founderName || '',
      location_url: locationUrl || '',
      partner_url: partnerUrl || '',

      // Hero (normalized)
      ...normalizedHero,

      // About/Mission/Vision normalized fields (as objects for frontend)
      about: {
        title: map['about_title'] || 'About Us',
        content: map['about_content'] || aboutYSP || ''
      },
      mission: {
        title: map['mission_title'] || 'Our Mission',
        content: map['mission_content'] || mission || ''
      },
      vision: {
        title: map['vision_title'] || 'Our Vision',
        content: map['vision_content'] || vision || ''
      },

      // Advocacy
      advocacyPillars: advocacyPillarsObj,

      // Contact block
      contact: normalizedContact,

      // Social media (flat + nested)
      social_facebook: facebookUrl || '',
      social_instagram: instagramUrl || '',
      social_twitter: twitterUrl || '',
      social_linkedin: linkedinUrl || '',
      social_youtube: youtubeUrl || '',
      social_tiktok: tiktokUrl || '',
      social: {
        facebook: facebookUrl || '',
        instagram: instagramUrl || '',
        twitter: twitterUrl || '',
        linkedin: linkedinUrl || '',
        youtube: youtubeUrl || '',
        tiktok: tiktokUrl || ''
      },

      // Projects, developers, founders
      projects: normalizedProjects,
      developers: normalizedDevelopers,
      founders: normalizedFounders,

      // Titles for UI
      hero_title: title || normalizedHero.hero_main_heading,
      hero_subtitle: subtitle || normalizedHero.hero_sub_heading,

      // Debug map for diagnostics
      _debug_map: map
    };

    return { success: true, content: normalizedContent };
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

    // Find the row with key 'orgChartUrl' in column A
    var allData = sheet.getDataRange().getValues();
    var found = false;
    for (var i = 0; i < allData.length; i++) {
      var key = allData[i][0] ? allData[i][0].toString() : '';
      if (key === 'orgChartUrl') {
        sheet.getRange(i + 1, 2).setValue(data.imageUrl);
        found = true;
        break;
      }
    }
    
    // If key doesn't exist, append new row
    if (!found) {
      var lastRow = sheet.getLastRow();
      sheet.getRange(lastRow + 1, 1).setValue('orgChartUrl');
      sheet.getRange(lastRow + 1, 2).setValue(data.imageUrl);
    }
    
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

    // Find the row with key 'orgChartUrl' in column A
    var allData = sheet.getDataRange().getValues();
    var currentUrl = '';
    var rowIndex = -1;
    
    for (var i = 0; i < allData.length; i++) {
      var key = allData[i][0] ? allData[i][0].toString() : '';
      if (key === 'orgChartUrl') {
        currentUrl = allData[i][1] ? allData[i][1].toString() : '';
        rowIndex = i + 1; // 1-indexed
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { success: false, message: 'Org chart URL not found in sheet' };
    }

    // Optionally trash existing file if link present
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
    sheet.getRange(rowIndex, 2).setValue('');
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
    // Match new uppercase 5-row structure: ProjectTitle_N, ProjectDesc_N, ProjectImageURL_N, ProjectLinkURL_N, ProjectLinkText_N
    var titleKey = 'ProjectTitle_' + data.projectNumber;
    var descKey = 'ProjectDesc_' + data.projectNumber;
    var imageKey = 'ProjectImageURL_' + data.projectNumber;
    var linkUrlKey = 'ProjectLinkURL_' + data.projectNumber;
    var linkTextKey = 'ProjectLinkText_' + data.projectNumber;
    
    var rowsToDelete = [];
    for (var i = 0; i < allData.length; i++) {
      var key = allData[i][0] ? allData[i][0].toString() : '';
      if (key === titleKey || key === descKey || key === imageKey || key === linkUrlKey || key === linkTextKey) {
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
    
    Logger.log('Deleted homepage project: ' + data.projectNumber + ' (deleted ' + rowsToDelete.length + ' rows)');
    
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

/**
 * UPDATE HOMEPAGE CONTENT HANDLER
 * Updates editable homepage content fields in Homepage Content sheet
 * Expects: { action: 'updateHomepageContent', mission, vision, about, motto, email, phone, facebookUrl, idCode }
 * Admin/Auditor only
 */
function handleUpdateHomepageContent(data) {
  try {
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    var role = _getUserRoleByIdCode(data.idCode);
    if (role !== 'Admin' && role !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Admin and Auditor can update homepage content' };
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEETS.HOMEPAGE_CONTENT);
    if (!sheet) {
      return { success: false, message: 'Homepage Content sheet not found' };
    }

    // Get all data to find and update rows
    var allData = sheet.getDataRange().getValues();
    var updates = [
      { key: 'mission', value: data.mission },
      { key: 'vision', value: data.vision },
      { key: 'aboutYSP', value: data.aboutYSP },
      { key: 'motto', value: data.motto },
      { key: 'email', value: data.email },
      { key: 'phone', value: data.phone },
      { key: 'facebook_url', value: data.facebook_url }
    ];

    var updatedKeys = [];
    for (var u = 0; u < updates.length; u++) {
      if (updates[u].value !== undefined && updates[u].value !== null) {
        var found = false;
        for (var i = 0; i < allData.length; i++) {
          var key = allData[i][0] ? allData[i][0].toString() : '';
          if (key === updates[u].key) {
            sheet.getRange(i + 1, 2).setValue(updates[u].value);
            updatedKeys.push(updates[u].key);
            found = true;
            break;
          }
        }
        // If key doesn't exist, append new row
        if (!found) {
          var lastRow = sheet.getLastRow();
          sheet.getRange(lastRow + 1, 1).setValue(updates[u].key);
          sheet.getRange(lastRow + 1, 2).setValue(updates[u].value);
          updatedKeys.push(updates[u].key + ' (new)');
        }
      }
    }

    Logger.log('Updated homepage content fields: ' + updatedKeys.join(', '));

    // Invalidate homepage cache
    invalidateCache('homepage_content');

    return {
      success: true,
      message: 'Homepage content updated successfully',
      updatedKeys: updatedKeys
    };
  } catch (e) {
    Logger.log('Error in handleUpdateHomepageContent: ' + e.toString());
    return { success: false, message: 'Error updating homepage content: ' + e.toString() };
  }
}

/**
 * CREATE PROJECT HANDLER
 * Creates a new project in the Homepage Content sheet
 * 
 * Adds 5 rows with keys:
 * - ProjectTitle_N
 * - ProjectDesc_N
 * - ProjectImageURL_N
 * - ProjectLinkURL_N
 * - ProjectLinkText_N
 */
function handleCreateProject(data) {
  try {
    // Validate user permissions
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    
    var role = _getUserRoleByIdCode(data.idCode);
    if (role !== 'Admin' && role !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Admin and Auditor can create projects' };
    }
    
    // Validate required fields
    if (!data.title || !data.description || !data.imageBase64) {
      return { success: false, message: 'Title, description, and image are required' };
    }
    
    // Step 1: Upload image to Google Drive
    var imageUrl = '';
    try {
      var folder = DriveApp.getFolderById(PROJECTS_IMPLEMENTED_FOLDER_ID);
      
      // Extract base64 data (remove data:image/xxx;base64, prefix if present)
      var base64Data = data.imageBase64;
      if (base64Data.indexOf(',') > -1) {
        base64Data = base64Data.split(',')[1];
      }
      
      // Determine MIME type
      var mimeType = 'image/jpeg';
      if (data.imageBase64.indexOf('data:image/png') > -1) {
        mimeType = 'image/png';
      } else if (data.imageBase64.indexOf('data:image/jpg') > -1) {
        mimeType = 'image/jpeg';
      }
      
      // Create sanitized filename
      var sanitizedTitle = (data.title || 'project')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 50);
      var timestamp = new Date().getTime();
      var extension = mimeType === 'image/png' ? 'png' : 'jpg';
      var fileName = 'project_' + sanitizedTitle + '_' + timestamp + '.' + extension;
      
      // Create blob and upload
      var blob = Utilities.newBlob(
        Utilities.base64Decode(base64Data),
        mimeType,
        fileName
      );
      
      var file = folder.createFile(blob);
      
      // Set public sharing
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      // Generate public URL
      var fileId = file.getId();
      imageUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;
      
      Logger.log('Uploaded project image: ' + fileName + ' -> ' + imageUrl);
    } catch (imgError) {
      Logger.log('Error uploading image: ' + imgError.toString());
      return { success: false, message: 'Error uploading image: ' + imgError.toString() };
    }
    
    // Step 2: Add project to Homepage Content sheet
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
      var match = key.match(/^ProjectTitle_(\d+)$/);
      if (match) {
        var num = parseInt(match[1], 10);
        if (num > maxN) maxN = num;
      }
    }
    var nextN = maxN + 1;
    
    // Find the last row to append the 5 new rows
    var lastRow = sheet.getLastRow();
    
    // Add 5 rows: ProjectTitle_N, ProjectDesc_N, ProjectImageURL_N, ProjectLinkURL_N, ProjectLinkText_N
    sheet.getRange(lastRow + 1, 1).setValue('ProjectTitle_' + nextN);
    sheet.getRange(lastRow + 1, 2).setValue(data.title);
    
    sheet.getRange(lastRow + 2, 1).setValue('ProjectDesc_' + nextN);
    sheet.getRange(lastRow + 2, 2).setValue(data.description);
    
    sheet.getRange(lastRow + 3, 1).setValue('ProjectImageURL_' + nextN);
    sheet.getRange(lastRow + 3, 2).setValue(imageUrl);
    
    sheet.getRange(lastRow + 4, 1).setValue('ProjectLinkURL_' + nextN);
    sheet.getRange(lastRow + 4, 2).setValue(data.link || '');
    
    sheet.getRange(lastRow + 5, 1).setValue('ProjectLinkText_' + nextN);
    sheet.getRange(lastRow + 5, 2).setValue(data.linkText || 'Learn More');
    
    Logger.log('Created new project: N=' + nextN + ', Title=' + data.title);
    
    // Invalidate homepage cache
    invalidateCache('homepage_content');
    
    return {
      success: true,
      message: 'Project created successfully',
      projectNumber: nextN,
      title: data.title,
      imageUrl: imageUrl
    };
    
  } catch (error) {
    Logger.log('Error in handleCreateProject: ' + error.toString());
    return { 
      success: false, 
      message: 'Error creating project: ' + error.toString()
    };
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

/**
 * Get all announcements for migration (no user filtering)
 */
function handleGetAllAnnouncementsForMigration(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const announcementsSheet = ss.getSheetByName(SHEETS.ANNOUNCEMENTS);
    
    const allData = announcementsSheet.getDataRange().getValues();
    const announcements = [];
    
    // Process announcements (skip header row)
    for (let row = 1; row < allData.length; row++) {
      const announcementRow = allData[row];
      
      // Skip if no announcement ID
      if (!announcementRow[1]) continue;
      
      announcements.push({
        timestamp: announcementRow[0] || '',
        announcement_id: announcementRow[1].toString(),
        author_id_code: announcementRow[2] || '',
        author_name: announcementRow[3] || '',
        title: announcementRow[4] || '',
        subject: announcementRow[5] || '',
        body: announcementRow[6] || '',
        recipient_type: announcementRow[7] || '',
        recipient_value: announcementRow[8] || '',
        email_status: announcementRow[9] || ''
      });
    }
    
    return {
      success: true,
      announcements: announcements,
      count: announcements.length
    };
  } catch (e) {
    Logger.log('Error in handleGetAllAnnouncementsForMigration: ' + e.toString());
    return { success: false, message: 'Error fetching announcements: ' + e.toString() };
  }
}

/**
 * Get all attendance records for migration
 */
function handleGetAllAttendanceForMigration(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const attendanceSheet = ss.getSheetByName(SHEETS.MASTER_ATTENDANCE);
    
    const allData = attendanceSheet.getDataRange().getValues();
    const headerRow = allData[0];
    
    // Find event columns (starting from column 5/index 4)
    const events = [];
    for (let col = 4; col < headerRow.length; col += 6) {
      const eventId = headerRow[col];
      if (eventId && eventId.toString().trim() !== '') {
        events.push({
          event_id: eventId.toString(),
          col_start: col
        });
      }
    }
    
    const attendanceRecords = [];
    
    // Process each user row (skip header)
    for (let row = 1; row < allData.length; row++) {
      const userRow = allData[row];
      
      const id_code = userRow[0] ? userRow[0].toString() : '';
      const name = userRow[1] ? userRow[1].toString() : '';
      const position = userRow[2] ? userRow[2].toString() : '';
      const id_number = userRow[3] ? userRow[3].toString() : '';
      
      // Skip if no ID code
      if (!id_code) continue;
      
      // Process each event for this user
      for (const event of events) {
        const timeIn = userRow[event.col_start + 1] || '';
        const timeOut = userRow[event.col_start + 2] || '';
        
        // Parse status from time_in field
        let status = 'Not Recorded';
        if (timeIn) {
          const timeInStr = timeIn.toString();
          if (timeInStr.includes('Present')) status = 'Present';
          else if (timeInStr.includes('Late')) status = 'Late';
          else if (timeInStr.includes('Absent')) status = 'Absent';
          else if (timeInStr.includes('Excused')) status = 'Excused';
        }
        
        attendanceRecords.push({
          id_code: id_code,
          name: name,
          position: position,
          id_number: id_number,
          event_id: event.event_id,
          time_in: timeIn.toString(),
          time_out: timeOut.toString(),
          status: status
        });
      }
    }
    
    return {
      success: true,
      attendance: attendanceRecords,
      count: attendanceRecords.length,
      events_found: events.length
    };
  } catch (e) {
    Logger.log('Error in handleGetAllAttendanceForMigration: ' + e.toString());
    return { success: false, message: 'Error fetching attendance: ' + e.toString() };
  }
}

  /**
   * Get all user profiles with credentials for migration
   * MIGRATION ONLY - Returns username and passwords
   */
  function handleGetAllUsersForMigration() {
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const profilesSheet = ss.getSheetByName(SHEETS.USER_PROFILES);
      const allData = profilesSheet.getDataRange().getValues();
    
      const users = [];
    
      // Skip header row
      for (let i = 1; i < allData.length; i++) {
        const row = allData[i];
      
        const idCode = row[18] ? row[18].toString().trim() : '';
      
        // Skip if no ID code
        if (!idCode) continue;
      
        users.push({
          id_code: idCode,
          username: row[13] ? row[13].toString().trim() : '',
          password: row[14] ? row[14].toString().trim() : '',
          full_name: row[3] ? row[3].toString().trim() : '',
          role: row[20] ? row[20].toString().trim() : 'Member'
        });
      }
    
      return {
        success: true,
        users: users,
        count: users.length
      };
    } catch (e) {
      Logger.log('Error in handleGetAllUsersForMigration: ' + e.toString());
      return { success: false, message: 'Error fetching users: ' + e.toString() };
    }
  }

// ===== GENERIC IMAGE UPLOAD HANDLER =====
/**
 * Generic image upload to Google Drive with automatic CORS-friendly URL transformation
 * @param {Object} data - Contains base64Image, fileName, uploadType ('project', 'orgchart', 'founder', 'developer')
 * @returns {Object} - Success status with public Drive URL
 */
function handleUploadImage(data) {
  try {
    const { base64Image, fileName, uploadType, mimeType } = data;
    
    if (!base64Image) {
      return { success: false, message: 'Image data is required' };
    }
    
    if (!uploadType) {
      return { success: false, message: 'Upload type is required (project, orgchart, founder, developer)' };
    }
    
    // Determine folder based on upload type
    let folderId;
    switch(uploadType.toLowerCase()) {
      case 'project':
      case 'projects':
        folderId = PROJECTS_IMPLEMENTED_FOLDER_ID;
        break;
      case 'orgchart':
      case 'org_chart':
        folderId = ORGCHART_UPLOAD_FOLDER_ID;
        break;
      case 'founder':
        folderId = FOUNDER_IMAGE_FOLDER_ID;
        break;
      case 'developer':
        folderId = DEVELOPER_IMAGE_FOLDER_ID;
        break;
      default:
        return { success: false, message: 'Invalid upload type. Use: project, orgchart, founder, or developer' };
    }
    
    // Get the target folder
    const folder = DriveApp.getFolderById(folderId);
    
    // Decode base64 image
    const base64Data = base64Image.split(',')[1] || base64Image;
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      mimeType || 'image/jpeg',
      fileName || 'upload_' + new Date().getTime() + '.jpg'
    );
    
    // Upload file to Drive
    const file = folder.createFile(blob);
    
    // Make file publicly viewable
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Get the file ID
    const fileId = file.getId();
    
    // Convert to CORS-friendly public URL format
    const publicUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;
    
    Logger.log('Image uploaded successfully: ' + fileName + ' → ' + publicUrl);
    
    return {
      success: true,
      message: 'Image uploaded successfully',
      fileId: fileId,
      publicUrl: publicUrl,
      fileName: file.getName(),
      uploadType: uploadType
    };
    
  } catch (error) {
    Logger.log('Error uploading image: ' + error.toString());
    return { success: false, message: 'Error uploading image: ' + error.toString() };
  }
}

// ===== FOUNDER INFO HANDLERS =====
/**
 * Upload founder profile image to Google Drive
 * Expects: { action: 'uploadFounderImage', base64Image, fileName, mimeType, idCode }
 */
function handleUploadFounderImage(data) {
  try {
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    var role = _getUserRoleByIdCode(data.idCode);
    if (role !== 'Admin' && role !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Admin and Auditor can upload founder images' };
    }
    if (!data.base64Image) {
      return { success: false, message: 'Image data is required' };
    }

    var folder = DriveApp.getFolderById(FOUNDER_IMAGE_FOLDER_ID);
    var base64Data = data.base64Image.split(',')[1] || data.base64Image;

    var timestamp = new Date().getTime();
    var ext = (data.mimeType || 'image/jpeg').split('/')[1] || 'jpg';
    var finalName = 'founder_' + timestamp + '.' + ext;

    var blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      data.mimeType || 'image/jpeg',
      finalName
    );

    // Remove any existing file with the same name
    var existingFiles = folder.getFilesByName(finalName);
    while (existingFiles.hasNext()) {
      existingFiles.next().setTrashed(true);
    }

    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileUrl = 'https://drive.google.com/uc?export=view&id=' + file.getId();

    return {
      success: true,
      message: 'Founder image uploaded successfully',
      imageUrl: fileUrl,
      fileName: finalName
    };
  } catch (e) {
    Logger.log('Error in handleUploadFounderImage: ' + e.toString());
    return { success: false, message: 'Error uploading founder image: ' + e.toString() };
  }
}

/**
 * Upload developer profile image to Google Drive
 * Expects: { action: 'uploadDeveloperImage', base64Image, fileName, mimeType, idCode }
 */
function handleUploadDeveloperImage(data) {
  try {
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    var role = _getUserRoleByIdCode(data.idCode);
    if (role !== 'Admin' && role !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Admin and Auditor can upload developer images' };
    }
    if (!data.base64Image) {
      return { success: false, message: 'Image data is required' };
    }

    var folder = DriveApp.getFolderById(DEVELOPER_IMAGE_FOLDER_ID);
    var base64Data = data.base64Image.split(',')[1] || data.base64Image;

    var timestamp = new Date().getTime();
    var ext = (data.mimeType || 'image/jpeg').split('/')[1] || 'jpg';
    var finalName = 'developer_' + timestamp + '.' + ext;

    var blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      data.mimeType || 'image/jpeg',
      finalName
    );

    // Remove any existing file with the same name
    var existingFiles = folder.getFilesByName(finalName);
    while (existingFiles.hasNext()) {
      existingFiles.next().setTrashed(true);
    }

    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileUrl = 'https://drive.google.com/uc?export=view&id=' + file.getId();

    return {
      success: true,
      message: 'Developer image uploaded successfully',
      imageUrl: fileUrl,
      fileName: finalName
    };
  } catch (e) {
    Logger.log('Error in handleUploadDeveloperImage: ' + e.toString());
    return { success: false, message: 'Error uploading developer image: ' + e.toString() };
  }
}

/**
 * Update founder information in Home_FounderInfo sheet
 * Expects: { action: 'updateFounderInfo', founderId, name, role, bio, profilePicture, facebook, instagram, linkedin, email, active, idCode }
 */
function handleUpdateFounderInfo(data) {
  try {
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    var userRole = _getUserRoleByIdCode(data.idCode);
    if (userRole !== 'Admin' && userRole !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Admin and Auditor can update founder info' };
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Home_FounderInfo');
    if (!sheet) {
      return { success: false, message: 'Home_FounderInfo sheet not found' };
    }

    // Ensure headers match new schema
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var requiredHeaders = ['ID','Name','Nickname','Role','About','BackgroundJourney','Achievement_1','Achievement_2','Achievement_3','Achievement_4','Achievement_5','Achievement_6','Achievement_7','Achievement_8','Achievement_9','Achievement_10','OrganizationalImpact','LeadershipPhilosophy','ProfilePicture','Facebook','Instagram','Twitter','LinkedIn','Website','Email','Phone','OfficeLocation','Active'];
    if (headers.length < requiredHeaders.length || headers[1] !== 'Name') {
      // Reinitialize schema if mismatch
      initializeFounderInfoSheet();
      headers = requiredHeaders;
    }

    var founderId = data.founderId || '1';
    var allData = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var i = 1; i < allData.length; i++) {
      if (allData[i][0].toString() === founderId.toString()) {
        rowIndex = i + 1;
        break;
      }
    }
    if (rowIndex === -1) {
      rowIndex = sheet.getLastRow() + 1;
    }

    // Parse achievements string "achievements" separated by ||
    var achievements = [];
    if (data.achievements) {
      achievements = data.achievements.split('||').filter(function(a){return a && a.trim();});
    }

    sheet.getRange(rowIndex, headers.indexOf('ID')+1).setValue(founderId);
    if (data.name !== undefined) sheet.getRange(rowIndex, headers.indexOf('Name')+1).setValue(data.name);
    if (data.nickname !== undefined) sheet.getRange(rowIndex, headers.indexOf('Nickname')+1).setValue(data.nickname);
    if (data.role !== undefined) sheet.getRange(rowIndex, headers.indexOf('Role')+1).setValue(data.role);
    if (data.about !== undefined) sheet.getRange(rowIndex, headers.indexOf('About')+1).setValue(data.about);
    if (data.backgroundJourney !== undefined) sheet.getRange(rowIndex, headers.indexOf('BackgroundJourney')+1).setValue(data.backgroundJourney);
    if (data.organizationalImpact !== undefined) sheet.getRange(rowIndex, headers.indexOf('OrganizationalImpact')+1).setValue(data.organizationalImpact);
    if (data.leadershipPhilosophy !== undefined) sheet.getRange(rowIndex, headers.indexOf('LeadershipPhilosophy')+1).setValue(data.leadershipPhilosophy);
    if (data.profilePicture !== undefined) sheet.getRange(rowIndex, headers.indexOf('ProfilePicture')+1).setValue(data.profilePicture);
    if (data.facebook !== undefined) sheet.getRange(rowIndex, headers.indexOf('Facebook')+1).setValue(data.facebook);
    if (data.instagram !== undefined) sheet.getRange(rowIndex, headers.indexOf('Instagram')+1).setValue(data.instagram);
    if (data.twitter !== undefined) sheet.getRange(rowIndex, headers.indexOf('Twitter')+1).setValue(data.twitter);
    if (data.linkedin !== undefined) sheet.getRange(rowIndex, headers.indexOf('LinkedIn')+1).setValue(data.linkedin);
    if (data.website !== undefined) sheet.getRange(rowIndex, headers.indexOf('Website')+1).setValue(data.website);
    if (data.email !== undefined) sheet.getRange(rowIndex, headers.indexOf('Email')+1).setValue(data.email);
    if (data.phone !== undefined) sheet.getRange(rowIndex, headers.indexOf('Phone')+1).setValue(data.phone);
    if (data.officeLocation !== undefined) sheet.getRange(rowIndex, headers.indexOf('OfficeLocation')+1).setValue(data.officeLocation);
    if (data.active !== undefined) sheet.getRange(rowIndex, headers.indexOf('Active')+1).setValue(data.active !== false);

    // Write achievements up to 10
    for (var a=0; a<10; a++) {
      var colName = 'Achievement_' + (a+1);
      var colIdx = headers.indexOf(colName)+1;
      if (colIdx > 0) {
        sheet.getRange(rowIndex, colIdx).setValue(achievements[a] || '');
      }
    }

    Logger.log('Updated founder info (new schema): ' + founderId);
    invalidateCache('home_founderinfo');
    invalidateCache('homepage_content');
    return { success: true, message: 'Founder information updated successfully', founderId: founderId };
  } catch (e) {
    Logger.log('Error in handleUpdateFounderInfo (new schema): ' + e.toString());
    return { success: false, message: 'Error updating founder info: ' + e.toString() };
  }
}

/**
 * Update developer information in Home_DevInfo sheet
 * Expects: { action: 'updateDeveloperInfo', developerId, name, role, bio, profilePicture, github, linkedin, twitter, email, active, idCode }
 */
function handleUpdateDeveloperInfo(data) {
  try {
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    var userRole = _getUserRoleByIdCode(data.idCode);
    if (userRole !== 'Admin' && userRole !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Admin and Auditor can update developer info' };
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Home_DevInfo');
    if (!sheet) {
      return { success: false, message: 'Home_DevInfo sheet not found' };
    }

    // Ensure headers match new schema
    var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
    var requiredHeaders = ['ID','Name','Role','Position','Organization','About','Background_1','Background_2','Background_3','Background_4','Background_5','Affiliation_1','Position_1','Affiliation_2','Position_2','Affiliation_3','Position_3','Affiliation_4','Position_4','Affiliation_5','Position_5','ProjectHighlights','PersonalPhilosophy','ProfilePicture','Facebook','Instagram','Twitter','LinkedIn','Website','Email','Phone','Location','Active'];
    if (headers.length < requiredHeaders.length || headers[3] !== 'Position' || headers[4] !== 'Organization') {
      initializeDeveloperInfoSheet();
      headers = requiredHeaders;
    }

    var developerId = data.developerId || '1';
    var allData = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var i=1;i<allData.length;i++) {
      if (allData[i][0].toString() === developerId.toString()) {
        rowIndex = i+1;
        break;
      }
    }
    if (rowIndex === -1) {
      rowIndex = sheet.getLastRow() + 1;
    }

    // Parse background segments & affiliations
    var backgrounds = [];
    if (data.backgrounds) backgrounds = data.backgrounds.split('||').filter(function(b){return b && b.trim();});
    var affiliations = [];
    if (data.affiliations) affiliations = data.affiliations.split('||').filter(function(a){return a && a.trim();});

    sheet.getRange(rowIndex, headers.indexOf('ID')+1).setValue(developerId);
    if (data.name !== undefined) sheet.getRange(rowIndex, headers.indexOf('Name')+1).setValue(data.name);
    if (data.role !== undefined) sheet.getRange(rowIndex, headers.indexOf('Role')+1).setValue(data.role);
    if (data.position !== undefined) sheet.getRange(rowIndex, headers.indexOf('Position')+1).setValue(data.position);
    if (data.organization !== undefined) sheet.getRange(rowIndex, headers.indexOf('Organization')+1).setValue(data.organization);
    if (data.about !== undefined) sheet.getRange(rowIndex, headers.indexOf('About')+1).setValue(data.about);
    if (data.projectHighlights !== undefined) sheet.getRange(rowIndex, headers.indexOf('ProjectHighlights')+1).setValue(data.projectHighlights);
    if (data.personalPhilosophy !== undefined) sheet.getRange(rowIndex, headers.indexOf('PersonalPhilosophy')+1).setValue(data.personalPhilosophy);
    if (data.profilePicture !== undefined) sheet.getRange(rowIndex, headers.indexOf('ProfilePicture')+1).setValue(data.profilePicture);
    if (data.facebook !== undefined) sheet.getRange(rowIndex, headers.indexOf('Facebook')+1).setValue(data.facebook);
    if (data.instagram !== undefined) sheet.getRange(rowIndex, headers.indexOf('Instagram')+1).setValue(data.instagram);
    if (data.twitter !== undefined) sheet.getRange(rowIndex, headers.indexOf('Twitter')+1).setValue(data.twitter);
    if (data.linkedin !== undefined) sheet.getRange(rowIndex, headers.indexOf('LinkedIn')+1).setValue(data.linkedin);
    if (data.website !== undefined) sheet.getRange(rowIndex, headers.indexOf('Website')+1).setValue(data.website);
    if (data.email !== undefined) sheet.getRange(rowIndex, headers.indexOf('Email')+1).setValue(data.email);
    if (data.phone !== undefined) sheet.getRange(rowIndex, headers.indexOf('Phone')+1).setValue(data.phone);
    if (data.location !== undefined) sheet.getRange(rowIndex, headers.indexOf('Location')+1).setValue(data.location);
    if (data.active !== undefined) sheet.getRange(rowIndex, headers.indexOf('Active')+1).setValue(data.active !== false);

    // Write backgrounds
    for (var b=0; b<5; b++) {
      var bCol = headers.indexOf('Background_' + (b+1)) + 1;
      if (bCol>0) sheet.getRange(rowIndex, bCol).setValue(backgrounds[b] || '');
    }
    // Write affiliations
    for (var f=0; f<5; f++) {
      var affPair = affiliations[f] || '';
      var parts = affPair.split('::');
      var aff = parts[0] || '';
      var pos = parts[1] || '';
      var affCol = headers.indexOf('Affiliation_' + (f+1)) + 1;
      var posCol = headers.indexOf('Position_' + (f+1)) + 1;
      if (affCol>0) sheet.getRange(rowIndex, affCol).setValue(aff);
      if (posCol>0) sheet.getRange(rowIndex, posCol).setValue(pos);
    }

    Logger.log('Updated developer info (new schema): ' + developerId);
    invalidateCache('home_devinfo');
    invalidateCache('homepage_content');
    return { success: true, message: 'Developer information updated successfully', developerId: developerId };
  } catch (e) {
    Logger.log('Error in handleUpdateDeveloperInfo (new schema): ' + e.toString());
    return { success: false, message: 'Error updating developer info: ' + e.toString() };
  }
}

/**
 * Initialize Founder Info sheet with proper headers and real data
 */
function initializeFounderInfoSheet() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Home_FounderInfo');
    if (!sheet) sheet = ss.insertSheet('Home_FounderInfo');

    var headers = ['ID','Name','Nickname','Role','About','BackgroundJourney','Achievement_1','Achievement_2','Achievement_3','Achievement_4','Achievement_5','Achievement_6','Achievement_7','Achievement_8','Achievement_9','Achievement_10','OrganizationalImpact','LeadershipPhilosophy','ProfilePicture','Facebook','Instagram','Twitter','LinkedIn','Website','Email','Phone','OfficeLocation','Active'];
    sheet.clear();
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    sheet.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#4a90e2').setFontColor('#ffffff');

    // Founder base data
    var about = 'Juanquine Carlo R. Castro, known affectionately as "Wacky Racho," is the visionary founder of Youth Service Philippines - Tagum Chapter. With an unwavering commitment to community service and youth empowerment, he established the organization to mobilize Filipino youth in creating meaningful social change across Tagum City and Davao del Norte.';
    var backgroundJourney = 'His leadership philosophy centers on grassroots engagement, collaborative partnerships, and sustainable community development. Under his guidance, YSP Tagum Chapter has grown into a dynamic organization that touches thousands of lives through diverse programs spanning education, health, environment, and disaster response.';
    var organizationalImpact = 'Impacts across Education, Environment, Health, Disaster Response, Leadership Development.';
    var leadershipPhilosophy = 'True leadership empowers others to discover and unleash their potential for the greater good.';
    var achievements = [
      'Founded YSP Tagum Chapter',
      'Led 50+ community outreach programs',
      'Mobilized 200+ active youth volunteers',
      'Established multi-sector partnerships'
    ];

    var row = [
      '1','Juanquine Carlo R. Castro','Wacky Racho','Founder & Visionary Leader',
      about,backgroundJourney,
      achievements[0]||'',achievements[1]||'',achievements[2]||'',achievements[3]||'', '', '', '', '', '', '',
      organizationalImpact,leadershipPhilosophy,
      '', // ProfilePicture
      'https://www.facebook.com/YSPTagumChapter','', '', '', '', 'YSPTagumChapter@gmail.com','+63 917 123 4567','Tagum City, Davao del Norte, Philippines','true'
    ];
    sheet.getRange(2,1,1,row.length).setValues([row]);
    return { success: true, message: 'Founder Info sheet initialized (new schema) successfully' };
  } catch(e) {
    Logger.log('Error initializeFounderInfoSheet(new): ' + e.toString());
    return { success:false, message: 'Error initializing Founder Info sheet: ' + e.toString() };
  }
}

/**
 * Initialize Developer Info sheet with proper headers and real data
 */
function initializeDeveloperInfoSheet() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Home_DevInfo');
    if (!sheet) sheet = ss.insertSheet('Home_DevInfo');
    var headers = ['ID','Name','Role','Position','Organization','About','Background_1','Background_2','Background_3','Background_4','Background_5','Affiliation_1','Position_1','Affiliation_2','Position_2','Affiliation_3','Position_3','Affiliation_4','Position_4','Affiliation_5','Position_5','ProjectHighlights','PersonalPhilosophy','ProfilePicture','Facebook','Instagram','Twitter','LinkedIn','Website','Email','Phone','Location','Active'];
    sheet.clear();
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    sheet.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#4a90e2').setFontColor('#ffffff');

    var about = 'Ezequiel John B. Crisostomo is a passionate full-stack developer and system architect dedicated to creating innovative digital solutions.';
    var backgrounds = [
      'Focus on scalable, user-friendly applications',
      'Experience in React & TypeScript ecosystems',
      'Commitment to leveraging tech for social good'
    ];
    var projectHighlights = 'Member Management, QR Attendance, Polling Platform, Dynamic Navigation, Glassmorphism UI, Real-Time Updates, Responsive Design';
    var personalPhilosophy = 'Technology should serve humanity by making lives easier and communities more connected.';
    var affiliations = [
      ['Youth Service Philippines - Tagum Chapter','Membership & Internal Affairs Officer']
    ];

    var row = [
      '1','Ezequiel John B. Crisostomo','Full-Stack Developer & System Architect','Membership & Internal Affairs Officer','Youth Service Philippines - Tagum Chapter',about,
      backgrounds[0]||'',backgrounds[1]||'',backgrounds[2]||'',backgrounds[3]||'',backgrounds[4]||'',
      affiliations[0] ? affiliations[0][0] : '', affiliations[0] ? affiliations[0][1] : '', '', '', '', '', '', '', '', '',
      projectHighlights, personalPhilosophy,
      '', // ProfilePicture
      '','', '', '', '', 'YSPTagumChapter@gmail.com','+63 917 123 4567','Tagum City, Davao del Norte, Philippines','true'
    ];
    sheet.getRange(2,1,1,row.length).setValues([row]);
    return { success:true, message: 'Developer Info sheet initialized (new schema) successfully' };
  } catch(e) {
    Logger.log('Error initializeDeveloperInfoSheet(new): ' + e.toString());
    return { success:false, message: 'Error initializing Developer Info sheet: ' + e.toString() };
  }
}

/**
 * Delete founder profile
 * Expects: { action: 'deleteFounder', founderId, idCode }
 */
function handleDeleteFounder(data) {
  try {
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    var role = _getUserRoleByIdCode(data.idCode);
    if (role !== 'Admin' && role !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Admin and Auditor can delete founder profiles' };
    }
    
    var founderId = data.founderId || '1';
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Home_FounderInfo');
    
    if (!sheet) {
      return { success: false, message: 'Home_FounderInfo sheet not found' };
    }
    
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    
    for (var i = 1; i < values.length; i++) {
      if (values[i][0].toString() === founderId.toString()) {
        sheet.deleteRow(i + 1);
        invalidateCache('home_founderinfo');
        invalidateCache('homepage_content');
        return { success: true, message: 'Founder profile deleted successfully' };
      }
    }
    
    return { success: false, message: 'Founder profile not found' };
  } catch (e) {
    Logger.log('Error in handleDeleteFounder: ' + e.toString());
    return { success: false, message: 'Error deleting founder profile: ' + e.toString() };
  }
}

/**
 * Delete developer profile
 * Expects: { action: 'deleteDeveloper', developerId, idCode }
 */
function handleDeleteDeveloper(data) {
  try {
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    var role = _getUserRoleByIdCode(data.idCode);
    if (role !== 'Admin' && role !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Admin and Auditor can delete developer profiles' };
    }
    
    var developerId = data.developerId || '1';
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Home_DevInfo');
    
    if (!sheet) {
      return { success: false, message: 'Home_DevInfo sheet not found' };
    }
    
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    
    for (var i = 1; i < values.length; i++) {
      if (values[i][0].toString() === developerId.toString()) {
        sheet.deleteRow(i + 1);
        invalidateCache('home_devinfo');
        invalidateCache('homepage_content');
        return { success: true, message: 'Developer profile deleted successfully' };
      }
    }
    
    return { success: false, message: 'Developer profile not found' };
  } catch (e) {
    Logger.log('Error in handleDeleteDeveloper: ' + e.toString());
    return { success: false, message: 'Error deleting developer profile: ' + e.toString() };
  }
}

// ===== HELPER: Convert any Google Drive link to public CORS-friendly format =====
/**
 * Transforms various Google Drive URL formats to public view format
 * @param {string} driveUrl - Any Google Drive URL
 * @returns {string} - Public CORS-friendly URL or original if not a Drive link
 */
function convertToPublicDriveUrl(driveUrl) {
  if (!driveUrl || typeof driveUrl !== 'string') return '';
  
  // Extract file ID from various Drive URL formats
  let fileId = null;
  
  // Format: https://drive.google.com/file/d/FILE_ID/view
  let match = driveUrl.match(/\/file\/d\/([^\/]+)/);
  if (match) {
    fileId = match[1];
  }
  
  // Format: https://drive.google.com/open?id=FILE_ID
  if (!fileId) {
    match = driveUrl.match(/[?&]id=([^&]+)/);
    if (match) {
      fileId = match[1];
    }
  }
  
  // Format: https://drive.google.com/uc?export=view&id=FILE_ID (already correct)
  if (!fileId) {
    match = driveUrl.match(/uc\?export=view&id=([^&]+)/);
    if (match) {
      return driveUrl; // Already in correct format
    }
  }
  
  // If file ID extracted, return public format
  if (fileId) {
    return 'https://drive.google.com/uc?export=view&id=' + fileId;
  }
  
  // If not a Drive link or couldn't parse, return original
  return driveUrl;
}
