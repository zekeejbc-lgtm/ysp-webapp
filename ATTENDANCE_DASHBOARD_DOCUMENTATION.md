# Attendance Dashboard & Analytics Documentation

## Overview

The Attendance Dashboard & Analytics feature provides comprehensive real-time attendance analysis for all events with advanced filtering capabilities by committee and role (heads).

---

## Features

### 1. Event Selection
- Search and select from all events (both Active and Inactive)
- Real-time event filtering as you type
- Shows event name, date, and status

### 2. Committee Filtering
Filter attendance data by:
- **All Committees** - Shows all members
- **All Heads** - Shows only organizational heads (based on ID Number pattern)
- **Specific Committees**:
  - Membership and Internal Affairs Committee (YSPTIR)
  - Communications and Marketing Committee (YSPTCM)
  - Finance and Treasury Committee (YSPTFR)
  - Secretariat and Documentation Committee (YSPTSD)
  - External Relations Committee (YSPTER)
  - Program Development Committee (YSPTPD)

### 3. Visual Analytics
- **Pie Chart** - Shows percentage distribution of attendance statuses
- **Status Breakdown** - Interactive cards showing counts for each status
- **Attendee Lists** - Click on any status to see individual names

### 4. Attendance Status Categories
- **Present** (Green) - Recorded as present
- **Late** (Yellow) - Recorded as late
- **Absent** (Red) - Recorded as absent
- **Excused** (Blue) - Recorded as excused
- **Not Recorded** (Gray) - No attendance record

---

## How It Works

### Backend Logic (`handleGetEventAnalytics`)

#### Committee Identification
1. **ID Code Prefix Extraction**
   - Extract prefix from ID Code (e.g., "YSPTIR-2025" → "YSPTIR")
   - Match against committee mapping table

2. **Head Identification**
   - Check ID Number (Column D in Master Attendance Log)
   - Valid head ID numbers: 25100, 25200, 25300, 25400, 25500, 25600, 25700
   - Pattern: Ends with "00" and matches specific values

#### Status Extraction
Status is determined from the **Time IN** field:
- Format: `"Status - HH:MM AM/PM"`
- Example: `"Present - 2:30 PM"` → Status: **Present**
- Empty or blank → Status: **Not Recorded**

#### Accuracy Measures
1. **100% Accurate Status Detection**
   - Parses Time IN field value
   - Splits on " - " separator
   - Extracts status text before time
   - Normalizes to standard status values

2. **Precise Committee Filtering**
   - Direct prefix matching from ID Code
   - No fuzzy matching to prevent errors

3. **Exact Head Identification**
   - Strict ID Number matching
   - Only accepts exact values from predefined list

---

## API Endpoint

### `getEventAnalytics`

**Request:**
```javascript
{
  action: 'getEventAnalytics',
  eventId: '0001',
  committee: 'all' // or 'heads', 'YSPTIR', 'YSPTCM', etc.
}
```

**Response:**
```javascript
{
  success: true,
  event: {
    id: '0001',
    name: 'General Assembly - October 2024',
    date: '2024-10-15'
  },
  analytics: {
    Present: {
      count: 45,
      attendees: [
        {
          idCode: 'YSPTIR-2025',
          name: 'Juan Cruz',
          position: 'Member',
          idNumber: '25101',
          committee: 'Membership and Internal Affairs Committee'
        },
        // ... more attendees
      ]
    },
    Late: {
      count: 8,
      attendees: [...]
    },
    Absent: {
      count: 12,
      attendees: [...]
    },
    Excused: {
      count: 5,
      attendees: [...]
    },
    'Not Recorded': {
      count: 3,
      attendees: [...]
    }
  },
  totalAttendees: 73,
  committeeFilter: 'all'
}
```

---

## Frontend Implementation

### Component: `AttendanceDashboard.tsx`

**Features:**
- Real-time event search with autocomplete suggestions
- Committee dropdown selector
- Animated pie chart with Recharts
- Expandable status cards showing attendee names
- Loading states and error handling
- Responsive design for mobile and desktop

**State Management:**
```typescript
const [events, setEvents] = useState<Event[]>([]);
const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
const [selectedCommittee, setSelectedCommittee] = useState<string>('all');
const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
const [totalAttendees, setTotalAttendees] = useState(0);
const [loading, setLoading] = useState(false);
```

**API Integration:**
```typescript
// Load events on mount
useEffect(() => {
  loadEvents();
}, []);

// Load analytics when event or committee changes
useEffect(() => {
  if (selectedEvent) {
    loadAnalytics(selectedEvent.id, selectedCommittee);
  }
}, [selectedEvent, selectedCommittee]);
```

---

## Data Flow

1. **User selects an event** → Triggers `loadAnalytics(eventId, committee)`
2. **API call** → `eventsAPI.getAnalytics(eventId, committee)`
3. **Backend processes** → Reads Master Attendance Log sheet
4. **Filtering** → Applies committee/head filter based on ID Code/ID Number
5. **Status extraction** → Parses Time IN field for each person
6. **Aggregation** → Counts and groups by status
7. **Response** → Returns analytics with detailed attendee lists
8. **Frontend renders** → Updates pie chart and status cards
9. **User interaction** → Click status cards to see attendee names

---

## Committee Mapping Reference

| ID Code Prefix | Committee Name |
|----------------|---------------|
| YSPTIR | Membership and Internal Affairs Committee |
| YSPTCM | Communications and Marketing Committee |
| YSPTFR | Finance and Treasury Committee |
| YSPTSD | Secretariat and Documentation Committee |
| YSPTER | External Relations Committee |
| YSPTPD | Program Development Committee |

---

## Head ID Numbers

Valid head ID numbers (Column D in Master Attendance Log):
- 25100
- 25200
- 25300
- 25400
- 25500
- 25600
- 25700

**Detection Logic:**
```javascript
const HEAD_ID_NUMBERS = ['25100', '25200', '25300', '25400', '25500', '25600', '25700'];
const isHead = HEAD_ID_NUMBERS.includes(idNumber);
```

---

## UI/UX Features

### Color Coding
- **Present**: Green (#4ade80)
- **Late**: Yellow (#fbbf24)
- **Absent**: Red (#f87171)
- **Excused**: Blue (#60a5fa)
- **Not Recorded**: Gray (#9ca3af)

### Animations
- Smooth transitions using Framer Motion
- Expand/collapse animations for attendee lists
- Fade-in effects for loading states
- Hover effects on interactive elements

### Responsive Design
- Mobile-optimized layout
- Touch-friendly interactive elements
- Scrollable attendee lists
- Adaptive chart sizing

---

## Error Handling

### Frontend
- Loading states while fetching data
- Error messages for failed API calls
- Graceful degradation if data unavailable
- Empty state messages

### Backend
- Input validation (eventId required)
- Sheet existence verification
- Event ID validation
- Safe parsing of Time IN values
- Logger statements for debugging

---

## Testing Checklist

✅ **Event Selection**
- [ ] Can search and select all events
- [ ] Active and inactive events both appear
- [ ] Event details display correctly

✅ **Committee Filtering**
- [ ] "All Committees" shows all members
- [ ] "All Heads" shows only heads (ID Numbers: 25100-25700)
- [ ] Each committee filter shows only matching members
- [ ] Filter changes update analytics in real-time

✅ **Status Accuracy**
- [ ] Present status extracted correctly from Time IN
- [ ] Late status extracted correctly
- [ ] Absent status extracted correctly
- [ ] Excused status extracted correctly
- [ ] Empty Time IN fields show as "Not Recorded"

✅ **Data Display**
- [ ] Pie chart shows correct percentages
- [ ] Status counts match actual data
- [ ] Total attendees is accurate
- [ ] Attendee names display when clicked
- [ ] Committee names show in tooltips

✅ **UI/UX**
- [ ] Loading states work properly
- [ ] Error messages display when needed
- [ ] Animations are smooth
- [ ] Mobile-responsive layout
- [ ] Dark mode compatible

---

## Performance Optimization

1. **Efficient Data Processing**
   - Single loop through attendance data
   - Early filtering before status extraction
   - Minimal string operations

2. **Frontend Caching**
   - Events loaded once on mount
   - Analytics cached per event/committee combination
   - Prevents unnecessary re-renders

3. **Lazy Loading**
   - Attendee lists only rendered when expanded
   - Chart only renders with valid data

---

## Future Enhancements

- Export analytics to PDF/Excel
- Date range filtering for multiple events
- Trend analysis across events
- Email notifications for low attendance
- Attendance comparison between committees
- Individual member attendance history

---

**Last Updated**: October 29, 2025
