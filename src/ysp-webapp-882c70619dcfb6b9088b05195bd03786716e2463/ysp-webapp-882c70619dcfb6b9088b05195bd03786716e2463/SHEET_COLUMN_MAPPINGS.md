# Google Sheets Column Mappings

**IMPORTANT**: Each sheet has DIFFERENT column structures. Always refer to this file before writing code that accesses sheet data.

---

## 📋 User Profiles Sheet

| Column | Index | Field Name |
|--------|-------|------------|
| A | 0 | Timestamp |
| B | 1 | Email Address |
| C | 2 | DATA PRIVACY AGREEMENT |
| D | 3 | Full name |
| E | 4 | Date of Birth |
| F | 5 | Age |
| G | 6 | Sex/Gender |
| H | 7 | Pronouns |
| I | 8 | Civil Status |
| J | 9 | Contact Number |
| K | 10 | Religion |
| L | 11 | Nationality |
| M | 12 | Personal Email Address |
| N | 13 | **Username** ⭐ |
| O | 14 | **Password** ⭐ |
| P | 15 | Data Privacy Acknowledgment |
| Q | 16 | Declaration of Truthfulness and Responsibility |
| R | 17 | Data Collection Agreement |
| S | 18 | **ID Code** ⭐ |
| T | 19 | Position |
| U | 20 | **Role** ⭐ |
| V | 21 | **ProfilePictureURL** ⭐ |

### Key Fields for Login:
- Username: Column N (index 13)
- Password: Column O (index 14)
- ID Code: Column S (index 18)
- Role: Column U (index 20)

---

## 📋 Access Logs Sheet

| Column | Index | Field Name |
|--------|-------|------------|
| A | 0 | Timestamp |
| B | 1 | Username |
| C | 2 | Action |

---

## 📋 Master Attendance Log Sheet

**Structure**: 
- Columns A-D: Fixed user identification columns
- Columns E onwards: Event blocks (6 columns per event)

### Fixed Columns (A-D):
| Column | Index | Field Name |
|--------|-------|------------|
| A | 0 | ID Code |
| B | 1 | Name |
| C | 2 | Position |
| D | 3 | ID number |

### Event Blocks (Starting from Column E, index 4):
Each event takes 6 columns in this order:
1. **Event ID** (format: 0000, incrementing)
2. **Event Name**
3. **Event Date**
4. **Time IN**
5. **Time OUT**
6. **Status** (Active/Inactive)

**Pattern**: `[E-J]` = Event 1, `[K-P]` = Event 2, `[Q-V]` = Event 3, etc.

Example:
- Event 1: Columns E, F, G, H, I, J (indices 4, 5, 6, 7, 8, 9)
  - E (4) = Event ID (e.g., "0001")
  - F (5) = Event Name
  - G (6) = Event Date
  - H (7) = Time IN
  - I (8) = Time OUT
  - J (9) = Status
- Event 2: Columns K, L, M, N, O, P (indices 10, 11, 12, 13, 14, 15)
  - K (10) = Event ID (e.g., "0002")
  - L (11) = Event Name
  - M (12) = Event Date
  - N (13) = Time IN
  - O (14) = Time OUT
  - P (15) = Status
- Event 3: Columns Q, R, S, T, U, V (indices 16, 17, 18, 19, 20, 21)
  - Q (16) = Event ID (e.g., "0003")
  - R (17) = Event Name
  - S (18) = Event Date
  - T (19) = Time IN
  - U (20) = Time OUT
  - V (21) = Status

---

## ⚠️ Critical Notes

1. **User Profiles** has 22 columns (A-V)
2. **Access Logs** has 3 columns (A-C)
3. **Master Attendance Log** has 4 fixed columns + dynamic event columns (6 per event)

4. **NEVER assume column positions are the same across sheets!**
5. **ALWAYS check this file before accessing sheet data**
6. **Array indices are 0-based** (Column A = index 0, Column B = index 1, etc.)

---

## 🔧 Code Reference

### Accessing User Profiles:
```javascript
const username = row[13];  // Column N
const password = row[14];  // Column O
const idCode = row[18];    // Column S
const role = row[20];      // Column U
```

### Accessing Master Attendance Log (fixed columns):
```javascript
const idCode = row[0];     // Column A - ID Code
const name = row[1];       // Column B - Name
const position = row[2];   // Column C - Position
const idNumber = row[3];   // Column D - ID number
```

### Accessing Master Attendance Log (event columns):
```javascript
// For first event (starting at column E, index 4):
const eventId = headerRow[4];      // Column E - Event ID (e.g., "0001")
const eventName = headerRow[5];    // Column F - Event Name
const eventDate = headerRow[6];    // Column G - Event Date
const timeIn = headerRow[7];       // Column H - Time IN
const timeOut = headerRow[8];      // Column I - Time OUT
const status = headerRow[9];       // Column J - Status

// For subsequent events, add 6 to the starting index
// Second event starts at index 10, third at 16, etc.
```

---

## 📊 Committee Mappings (Based on ID Code Prefix)

| ID Code Prefix | Committee Name |
|----------------|---------------|
| YSPTIR | Membership and Internal Affairs Committee |
| YSPTCM | Communications and Marketing Committee |
| YSPTFR | Finance and Treasury Committee |
| YSPTSD | Secretariat and Documentation Committee |
| YSPTER | External Relations Committee |
| YSPTPD | Program Development Committee |

### Committee Filtering Rules:
1. Extract the prefix from ID Code (Column A in Master Attendance Log, Column S in User Profiles)
2. Example: ID Code "YSPTIR-2025" → Prefix "YSPTIR" → Membership and Internal Affairs Committee
3. Filter "All Committees" shows all members
4. Filter "All Heads" shows only members whose ID Number (Column D in Master Attendance Log) matches the head pattern

---

## 👔 Head Identification (Based on ID Number)

**Head ID Number Pattern**: Ends with "00" and has specific values

### Valid Head ID Numbers:
- 25100
- 25200
- 25300
- 25400
- 25500
- 25600
- 25700

### Head Detection Rule:
- Check ID Number (Column D in Master Attendance Log)
- Head if: ID Number is exactly one of the values above
- Example: ID Number "25100" → Head ✓
- Example: ID Number "25101" → Not a Head ✗

---

## 📈 Attendance Status Extraction

Status is determined from the **Time IN** field value:

### Status Formats in Time IN field:
- `"Present - HH:MM AM/PM"` → Status: **Present**
- `"Late - HH:MM AM/PM"` → Status: **Late**
- `"Absent - HH:MM AM/PM"` → Status: **Absent**
- `"Excused - HH:MM AM/PM"` → Status: **Excused**
- Empty or blank → Status: **Not Recorded**

### Extraction Logic:
```javascript
const timeInValue = row[timeInColumnIndex]; // Time IN column for specific event
let status = 'Not Recorded';

if (timeInValue && timeInValue.toString().trim() !== '') {
  const timeInStr = timeInValue.toString();
  if (timeInStr.includes(' - ')) {
    status = timeInStr.split(' - ')[0].trim(); // Extract "Present", "Late", "Absent", or "Excused"
  } else {
    status = timeInStr.trim();
  }
}
```

---

## 📢 Announcements Sheet

**Structure**: Fixed columns A-T, then dynamic announcement status columns (U onwards)

### Fixed Columns (A-J): Announcement Details
| Column | Index | Field Name |
|--------|-------|------------|
| A | 0 | Timestamp (PH time) |
| B | 1 | **Announcement ID** (format: ANN-YYYY-###) |
| C | 2 | Author ID Code |
| D | 3 | Author Name |
| E | 4 | **Title** |
| F | 5 | Subject |
| G | 6 | Body |
| H | 7 | **Recipient Type** |
| I | 8 | **Recipient Value** |
| J | 9 | Email Status |

### Empty Columns (K-P):
Reserved for future use - **DO NOT MODIFY**

### User Roster Columns (Q-T):
| Column | Index | Field Name |
|--------|-------|------------|
| Q | 16 | **ID Code** (for matching users) |
| R | 17 | Name |
| S | 18 | Position |
| T | 19 | Role |

### Dynamic Announcement Status Columns (U onwards):
Starting from column U (index 20), each announcement creates 2 columns:

**Pattern**: For each announcement, there are 2 columns:
1. **Announcement ID Column** (U, W, Y, AA, etc.) - Row 1 contains announcement ID
2. **Title Column** (V, X, Z, AB, etc.) - Row 1 contains announcement title

**Rows 2+ contain status** for each user:
- `"Read"` - User has marked the announcement as read
- `"Unread"` - User is a recipient but hasn't read it yet
- `"N/A"` - User is not a recipient of this announcement

Example:
```
| U1: ANN-2025-001 | V1: Monthly Meeting Notice |
| U2: Unread       | V2: (empty)                 |  ← User's read status
| U3: Read         | V3: (empty)                 |
| U4: N/A          | V4: (empty)                 |
```

### Recipient Type Values:
- **"All Members"** - All users in User Profiles
- **"Only Heads"** - Users with Head role AND ID Number in [25100-25700]
- **"Specific Committee"** - Users with specific ID Code prefix
- **"Specific Person/s"** - Comma-separated list of ID Codes

### Recipient Value Mapping:
| Recipient Type | Recipient Value Example |
|----------------|------------------------|
| All Members | `"All Members"` |
| Only Heads | `"Only Heads"` |
| Specific Committee | `"Membership and Internal Affairs Committee"` |
| Specific Person/s | `"YSPTIR-2025, YSPTCM-2024, YSPTFR-2023"` |

### Committee Names for Recipient Value:
- Membership and Internal Affairs Committee (YSPTIR)
- Communications and Marketing Committee (YSPTCM)
- Finance and Treasury Committee (YSPTFR)
- Secretariat and Documentation Committee (YSPTSD)
- External Relations Committee (YSPTER)
- Program Development Committee (YSPTPD)

### Code Reference:
```javascript
// Accessing announcement details (fixed columns)
const timestamp = row[0];        // Column A
const announcementId = row[1];   // Column B
const authorIdCode = row[2];     // Column C
const authorName = row[3];       // Column D
const title = row[4];            // Column E
const subject = row[5];          // Column F
const body = row[6];             // Column G
const recipientType = row[7];    // Column H
const recipientValue = row[8];   // Column I
const emailStatus = row[9];      // Column J

// Accessing user roster
const userIdCode = row[16];      // Column Q
const userName = row[17];        // Column R
const userPosition = row[18];    // Column S
const userRole = row[19];        // Column T

// Finding announcement status column
// Search header row (row 0) starting from column U (index 20)
// For each announcement, check every 2 columns (announcement ID, title)
for (let col = 20; col < headerRow.length; col += 2) {
  if (headerRow[col] === announcementId) {
    const statusColIndex = col; // This column contains Read/Unread/N/A status
    const userStatus = row[statusColIndex];
    break;
  }
}
```

---

**Last Updated**: October 29, 2025
