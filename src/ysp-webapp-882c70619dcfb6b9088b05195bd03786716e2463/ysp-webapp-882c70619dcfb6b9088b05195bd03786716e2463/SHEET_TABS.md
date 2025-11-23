# Sheet Tabs (Canonical Names)

These are the canonical tab names for the source Google Spreadsheet. Headers are at row 1 and data begins at row 2 for all tabs unless stated otherwise.

- User Profiles: `User Profiles` (range base: `A2:V`)
- Master Attendance Log: `Master Attendance Log` (range base: `A1:ZZ`, includes the event header row at row 1)
- Announcements: `Announcements` (range base: `A2:J`)

Persisted in environment variables so scripts never ask again:

- SHEET_TAB_USER_PROFILES=User Profiles
- SHEET_TAB_MASTER_ATTENDANCE=Master Attendance Log
- SHEET_TAB_ANNOUNCEMENTS=Announcements

If you ever rename a sheet, update `.env.local` (and optionally `.env.example`) with the new names before running tools.
