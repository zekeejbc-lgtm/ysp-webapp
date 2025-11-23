# Google Sheets Suggested Mappings (GAS Backend)

This document proposes a complete, GAS-friendly spreadsheet layout that supports all current frontend features. It builds on the existing mappings and fills gaps needed by Announcements, Attendance, Donations, Feedback, Homepage content, Member management, Officer directory, Access logs, QR scanning, and Polling/Evaluations.

Note: Column letters use 1-based spreadsheet columns; array indices in GAS are zero-based. Keep headers in row 1.

## Sheets Overview
- `User_Profiles`
- `Access_Logs`
- `Master_Attendance_Log`
- `Events_Control`
- `Announcements`
- `Feedback`
- `Homepage_Content`
- `Homepage_Projects`
- `Donations`
- `Donation_Campaigns`
- `Donation_Settings`
- `Member_Applications`
- `Polls`
- `Poll_Questions`
- `Poll_Responses`

---

## User_Profiles
Supports: Login, Officer Directory, Manage Members, role/permission checks.

Columns (A–Z suggested):
- A. `Timestamp` — Date created
- B. `Email Address`
- C. `Data Privacy Agreement`
- D. `Full name`
- E. `Date of Birth`
- F. `Age`
- G. `Sex/Gender`
- H. `Pronouns`
- I. `Civil Status`
- J. `Contact Number`
- K. `Religion`
- L. `Nationality`
- M. `Personal Email Address`
- N. `Username` (login key)
- O. `Password` (plain for GAS-only auth)
- P. `Data Privacy Acknowledgment`
- Q. `Declaration of Truthfulness and Responsibility`
- R. `Data Collection Agreement`
- S. `ID Code` (unique member identifier; carries committee prefix)
- T. `Position` (e.g., President, Member)
- U. `Role` (Admin, Head, Auditor, Member, Guest, Banned)
- V. `ProfilePictureURL`
- W. `Status` (Active, Inactive, Suspended)
- X. `Committee` (optional explicit committee; can be derived from `ID Code` prefix)
- Y. `Notes` (admin notes)
- Z. `Last Updated`

Key rules:
- Login uses N (Username) + O (Password).
- Committee can be derived from `ID Code` prefix (e.g., YSPTIR → Membership & Internal Affairs). Keep explicit X for overrides.

---

## Access_Logs
Supports: Access Logs page, audit trail.

Columns (A–K):
- A. `Timestamp` (ISO)
- B. `Account Created` (from profiles Timestamp)
- C. `Email` (M)
- D. `ID Code` (S)
- E. `Name` (D)
- F. `Role` (U)
- G. `Action` (e.g., Login, Logout, View, Edit, Create, Delete)
- H. `ActionType` (login|logout|view|edit|create|delete)
- I. `IP Address` (best effort)
- J. `Device` (UA summary)
- K. `Status` (success|failed|warning)

Note: Existing handler writes A–F. Extend writer to include G–K when available.

---

## Master_Attendance_Log
Supports: QR Scanner, Manual Attendance, Dashboard, Transparency.

Fixed columns (A–D):
- A. `ID Code`
- B. `Name`
- C. `Position`
- D. `ID number` (used to detect Heads: 25100, 25200, …, 25700)

Event blocks (6 columns per event, repeating):
- 1. `Event ID` (e.g., 0001)
- 2. `Event Name`
- 3. `Event Date`
- 4. `Time IN` (e.g., "Present - 09:05 AM")
- 5. `Time OUT` (e.g., "10:30 AM")
- 6. `Status` (Active/Inactive)

Notes:
- Dashboard status parsing derives Present/Late/Absent/Excused from `Time IN` text.
- Active events = blocks where Status == Active.
- Manual/QR writes to `Time IN` / `Time OUT` as per selection; prevent Time OUT for Absent/Excused.

---

## Events_Control
Supports: Listing/creating/toggling active events without editing the big log headers.

Columns (A–H):
- A. `Event ID` (must match block header in Master_Attendance_Log)
- B. `Name`
- C. `Date`
- D. `Start Time`
- E. `End Time`
- F. `Status` (Active/Inactive)
- G. `Created By`
- H. `Notes`

Note: GAS may still extract from `Master_Attendance_Log` headers for compatibility; this sheet gives an admin-friendly control panel.

---

## Announcements
Supports: Enhanced Announcements (priority, category, pinned, recipients, images).

Fixed columns (A–P):
- A. `Timestamp`
- B. `Announcement ID` (e.g., ANN-2025-001)
- C. `Author ID Code`
- D. `Author Name`
- E. `Title`
- F. `Subject`
- G. `Body`
- H. `Recipient Type` (All Members | Only Heads | Specific Committee | Specific Person/s)
- I. `Recipient Value` (committee name or comma-separated ID Codes)
- J. `Email Status`
- K. `Priority` (urgent|important|normal)
- L. `Category` (e.g., Updates, Events, Programs)
- M. `IsPinned` (TRUE/FALSE)
- N. `ImageURL_1`
- O. `ImageURL_2`
- P. `ImageURL_3` (extend P→T if you want up to 5 images)

Dynamic status columns (from U onwards):
- Pattern per announcement = 2 cols:
  - `AnnID` column (U, W, Y, …) — header row contains Announcement ID
  - `Title` column (V, X, Z, …) — header row contains Title
- Rows 2+ contain per-user status: Read | Unread | N/A

---

## Feedback
Supports: Feedback submission, admin replies, visibility, rating, categories, single image.

Columns (A–R):
- A. `Feedback ID` (e.g., FB-001)
- B. `Timestamp`
- C. `Author` (name or "Anonymous")
- D. `Author ID Code` (or "Guest")
- E. `Feedback`
- F. `Reply Timestamp`
- G. `Replier`
- H. `Replier ID`
- I. `Reply`
- J. `Anonymous` (TRUE/FALSE)
- K. `Category` (Complaint|Suggestion|Bug|Compliment|Inquiry|Confession|Other)
- L. `Image URL`
- M. `Status` (Pending|Reviewed|Resolved|Dropped)
- N. `Visibility` (Public|Private)
- O. `Notes`
- P. `Email`
- Q. `Rating` (1–5)
- R. `Reference` (optional linking to entity)

---

## Homepage_Content
Supports: App hero/about/mission/vision/pillars content and other global text.

Columns (A–C):
- A. `Key` (e.g., hero.mainHeading, hero.subHeading, hero.tagline, hero.loginButtonText, about.title, about.content, mission.title, mission.content, vision.title, vision.content, advocacyPillars.title, advocacyPillars.intro)
- B. `Value` (string)
- C. `UpdatedAt`

Notes:
- For list-like sections (pillars), use structured JSON values or separate sheet below.

## Homepage_Projects
Supports: Project cards in the homepage modal.

Columns (A–G):
- A. `Project ID`
- B. `Title`
- C. `Description`
- D. `ImageURL`
- E. `Link`
- F. `LinkText`
- G. `Active` (TRUE/FALSE)

---

## Donations
Supports: Donation form, list, verification, receipts.

`Donations` Columns (A–L):
- A. `Donation ID` (DON-###)
- B. `Timestamp`
- C. `Donor Name`
- D. `Contact`
- E. `Amount`
- F. `Payment Method`
- G. `Campaign`
- H. `Reference Number`
- I. `Receipt URL`
- J. `Status` (Pending|Verified|Rejected)
- K. `Notes`
- L. `Verified By`

`Donation_Campaigns` Columns (A–H):
- A. `Campaign ID`
- B. `Name`
- C. `Description`
- D. `Target Amount`
- E. `Current Amount`
- F. `Start Date`
- G. `End Date`
- H. `Status` (Active|Ended|Paused)

`Donation_Settings` Columns (A–E):
- A. `ID`
- B. `Method` (GCash|PayMaya|Bank)
- C. `QR Image URL`
- D. `Account Name/Number`
- E. `Active` (TRUE/FALSE)

---

## Member_Applications
Supports: Manage Members → Pending applications and detailed resume view.

Columns (A–AO recommended):
- A. `Application ID` (APP-###)
- B. `Date Applied`
- C. `Status` (pending|approved|rejected)
- D. `Full Name`
- E. `Email`
- F. `Phone`
- G. `Address`
- H. `Date of Birth`
- I. `Age`
- J. `Gender`
- K. `Civil Status`
- L. `Nationality`
- M. `Chapter`
- N. `Committee Preference`
- O. `Desired Role`
- P. `Skills`
- Q. `Education`
- R. `Certifications`
- S. `Experience`
- T. `Achievements`
- U. `Volunteer History`
- V. `Reason For Joining`
- W. `Personal Statement`
- X. `Emergency Contact Name`
- Y. `Emergency Contact Relation`
- Z. `Emergency Contact Number`
- AA. `Facebook`
- AB. `Instagram`
- AC. `Twitter`
- AD. `Profile Picture URL`
- AE. `Attachments (JSON)`
- AF. `Reviewed By`
- AG. `Reviewed At`
- AH. `Decision Notes`
- AI. `Converted To Member` (TRUE/FALSE)
- AJ. `Created Member ID Code`
- AK. `Created Username`
- AL. `Created Role`
- AM. `Created Position`
- AN. `Created Committee`
- AO. `Created Notes`

---

## Polling / Evaluations
Supports: PollingEvaluationsPage (public/private polls, responses, results).

`Polls` Columns (A–V):
- A. `Poll ID` (POLL-### or EVAL-###)
- B. `Title`
- C. `Description`
- D. `Type` (poll|evaluation)
- E. `Status` (open|closed|paused|draft)
- F. `Visibility` (public|private)
- G. `Created By`
- H. `Created By Role`
- I. `Created At`
- J. `Updated At`
- K. `Deadline`
- L. `Open Forever` (TRUE/FALSE)
- M. `Target Audience` (all|heads|officers|members|committee:XYZ|idcodes:CSV)
- N. `Allow Edit After Submit` (TRUE/FALSE)
- O. `Allow Multiple Submissions` (TRUE/FALSE)
- P. `Anonymous Responses` (TRUE/FALSE)
- Q. `Show Results To Participants` (TRUE/FALSE)
- R. `Account Only Submissions` (TRUE/FALSE)
- S. `IP Lock` (TRUE/FALSE)
- T. `Device Lock` (TRUE/FALSE)
- U. `Requires Approval` (TRUE/FALSE)
- V. `Theme JSON` (styling prefs)

`Poll_Questions` Columns (A–N):
- A. `Poll ID`
- B. `Question ID`
- C. `Order`
- D. `Type` (multiple_choice|checkbox|rating|text|long_text|matrix|date|time|file)
- E. `Text`
- F. `Help Text`
- G. `Required` (TRUE/FALSE)
- H. `Options JSON` (choices, scales)
- I. `Validation JSON`
- J. `Allow Other` (TRUE/FALSE)
- K. `Max Files`
- L. `Max Size (MB)`
- M. `Matrix Rows JSON`
- N. `Matrix Cols JSON`

`Poll_Responses` Columns (A–N):
- A. `Response ID`
- B. `Poll ID`
- C. `Respondent ID Code` (or "Guest")
- D. `Respondent Name` (or "Anonymous")
- E. `Timestamp`
- F. `Device`
- G. `IP Address`
- H. `Status` (submitted|draft|rejected)
- I. `Score` (optional)
- J. `Result Visibility` (public|private)
- K. `Answers JSON` (keyed by Question ID)
- L. `Reviewer`
- M. `Reviewed At`
- N. `Notes`

---

## Gap Analysis (Based on Scan vs Frontend Needs)

### Donation_Campaigns
- **Missing:** `Image URL`
- **Impact:** Campaign images will fallback to placeholders.
- **Action:** Add `Image URL` column (e.g., Column I).

### Donations
- **Missing:** Explicit `Rejection Reason` column.
- **Impact:** Rejection reasons might be lost or need to be stored in `Notes`.
- **Action:** Use `Notes` column or add `Rejection Reason` column.

### Officer Directory
- **Observation:** The `Officer Directory` sheet is minimal. The frontend search uses `User Profiles` sheet for full details (images, contact info).
- **Action:** Ensure `User Profiles` is kept up-to-date with officer roles.

## Implementation Notes
- Keep sheet names stable; handlers map directly by name.
- For lists/complex fields, store JSON to avoid excessive columns.
- Where possible, preserve the existing column orders from current GAS code to reduce refactors; new fields can fill previously-reserved blanks.
- For Announcements image support, store URLs (upload images to Drive first); keep up to 3–5.
- For Attendance, event blocks must remain 6-wide to preserve parsing logic.
