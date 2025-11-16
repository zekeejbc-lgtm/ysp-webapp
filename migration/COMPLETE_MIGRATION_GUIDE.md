# Complete Migration Guide

## ✅ What's Already Done

All accessible data has been migrated:
- ✅ User Profiles: 25/26 records
- ✅ Events: 3/3 records  
- ✅ Access Logs: 8/8 records
- ✅ Homepage Content: 14 keys
- ✅ Feedback: 0/0 (none exist)

## 🔧 What You Need To Do

### Step 1: Update Google Apps Script

1. **Open the Apps Script Editor:**
   - Go to https://script.google.com/home
   - Find your YSP project
   - Open `YSP_LoginAccess.gs`

2. **Copy the updated file from your workspace:**
   - The file is at: `C:\Users\cathl\Downloads\Finalize Web App UI Documentation\YSP_LoginAccess.gs`
   - Or copy/paste the two new functions I added (lines 3740-3868):
     - `handleGetAllAnnouncementsForMigration()`
     - `handleGetAllAttendanceForMigration()`

3. **Save and Deploy:**
   - Click File → Save
   - Click Deploy → Manage deployments
   - Click the pencil icon (Edit) next to your active deployment
   - Change version to "New version"
   - Click "Deploy"

### Step 2: Run the Updated Migration

Once the GAS is deployed, run the migration again:

```powershell
cd 'C:\Users\cathl\Downloads\Finalize Web App UI Documentation\migration'
npm run migrate
```

This will now migrate:
- ✅ Announcements (all records without user filtering)
- ✅ Attendance Records (parsed from Master Attendance Log)

### Step 3: Verify Complete Migration

After migration completes, verify all data:

```powershell
node verify-migration.js
```

## 📋 What the New Endpoints Do

### `getAllAnnouncementsForMigration`
- Returns ALL announcements from the Announcements sheet
- No user filtering or access checks
- Perfect for migration purposes

### `getAllAttendanceForMigration`
- Parses the Master Attendance Log sheet structure
- Finds all event columns (every 6 columns starting from column E)
- Extracts attendance records for each user×event combination
- Returns normalized attendance data

## 🎯 Expected Final Counts

After completing these steps, you should have:
- User Profiles: 25
- Events: 3
- Access Logs: 8
- Homepage Content: 14
- Announcements: ~? (whatever exists in your sheet)
- Attendance Records: ~? (users × events)
- Feedback: 0

## ❓ If You See Errors

- **"Project settings not found"**: You need to update GAS manually via the web editor
- **"Unknown action"**: The GAS deployment hasn't propagated yet; wait 30 seconds and retry
- **"Event not found"**: Attendance references event_id that doesn't exist in Events table (foreign key constraint)

## 🚀 Alternative: Quick Copy-Paste

If you prefer not to upload the entire file:

**Add these two functions at the end of `YSP_LoginAccess.gs` (before the closing braces):**

```javascript
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
    const attendanceSheet = ss.getSheetByName(SHEETS.MASTER_ATTENDANCE_LOG);
    
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
```

**And add the case handlers in the `doPost` switch statement (around line 180):**

```javascript
    case 'getAllAnnouncementsForMigration':
      return handleGetAllAnnouncementsForMigration(data);
    case 'getAllAttendanceForMigration':
      return handleGetAllAttendanceForMigration(data);
```
