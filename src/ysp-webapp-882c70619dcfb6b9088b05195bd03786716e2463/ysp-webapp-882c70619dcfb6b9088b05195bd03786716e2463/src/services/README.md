# YSP API Service Documentation

## Overview
This centralized API service layer handles all communication between the frontend and Google Apps Script backend. Instead of duplicating fetch code in every component, import and use these pre-built functions.

## Configuration

### Change API Settings (One Place Only!)
Edit `src/services/api.ts`:

```typescript
const API_CONFIG = {
  baseURL: '/api/gas-proxy',  // Change this if your proxy URL changes
  spreadsheetIds: {
    main: '1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU',  // Reference only
  },
};
```

## Usage Examples

### 1. Authentication (Login)

```typescript
import { authAPI } from '../services/api';

// Regular Login
const handleLogin = async (username: string, password: string) => {
  try {
    const response = await authAPI.login(username, password);
    
    if (response.success) {
      console.log('Welcome:', response.name);
      console.log('Role:', response.role);
      console.log('ID Code:', response.idCode);
    } else {
      console.error('Login failed:', response.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Guest Login
const handleGuestLogin = async (name: string) => {
  try {
    const response = await authAPI.guestLogin(name);
    
    if (response.success) {
      console.log('Guest logged in:', response.name);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 2. Access Logs

```typescript
import { accessLogsAPI } from '../services/api';

// Get All Logs
const fetchAllLogs = async () => {
  try {
    const response = await accessLogsAPI.getAll();
    
    if (response.success) {
      console.log('Logs:', response.logs);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Search Logs
const searchLogs = async (searchTerm: string) => {
  try {
    const response = await accessLogsAPI.search(searchTerm);
    
    if (response.success) {
      console.log('Filtered logs:', response.logs);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 3. Attendance (Future Implementation)

```typescript
import { attendanceAPI } from '../services/api';

// Submit Attendance
const submitAttendance = async (eventId: string, idCode: string) => {
  try {
    const response = await attendanceAPI.submit(eventId, idCode);
    
    if (response.success) {
      console.log('Attendance recorded!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Get Attendance Records
const getAttendance = async (eventId: string) => {
  try {
    const response = await attendanceAPI.getRecords(eventId);
    
    if (response.success) {
      console.log('Attendance data:', response.records);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 4. Events (Future Implementation)

```typescript
import { eventsAPI } from '../services/api';

// Get All Events
const fetchEvents = async () => {
  try {
    const response = await eventsAPI.getAll();
    
    if (response.success) {
      console.log('Events:', response.events);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Create Event
const createEvent = async (name: string, date: string) => {
  try {
    const response = await eventsAPI.create({ name, date });
    
    if (response.success) {
      console.log('Event created!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Toggle Event Status
const toggleEvent = async (eventId: string) => {
  try {
    const response = await eventsAPI.toggleStatus(eventId);
    
    if (response.success) {
      console.log('Event status updated!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 5. User Profile (Future Implementation)

```typescript
import { userAPI } from '../services/api';

// Get User Profile
const fetchProfile = async (idCode: string) => {
  try {
    const response = await userAPI.getProfile(idCode);
    
    if (response.success) {
      console.log('Profile:', response.profile);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Update Profile
const updateProfile = async (idCode: string, updates: any) => {
  try {
    const response = await userAPI.updateProfile(idCode, updates);
    
    if (response.success) {
      console.log('Profile updated!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Benefits

✅ **Single Source of Truth**: Change API URL once, affects all components  
✅ **Type Safety**: Full TypeScript support with interfaces  
✅ **Consistent Error Handling**: Centralized error logging  
✅ **Easy to Test**: Mock the API service in tests  
✅ **Clean Components**: Components focus on UI, not API details  
✅ **Future-Proof**: Easy to add new endpoints  

## Adding New API Endpoints

To add a new endpoint, edit `src/services/api.ts`:

```typescript
export const myNewAPI = {
  myNewFunction: async (param1: string, param2: number): Promise<any> => {
    return apiRequest('myNewAction', { param1, param2 });
  },
};
```

Then use it in your component:

```typescript
import { myNewAPI } from '../services/api';

const result = await myNewAPI.myNewFunction('test', 123);
```

## Backend Requirements

Your Google Apps Script backend must handle the `action` parameter:

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  switch (action) {
    case 'login':
      return handleLogin(data);
    case 'guestLogin':
      return handleGuestLogin(data);
    case 'getAccessLogs':
      return handleGetAccessLogs(data);
    // Add more actions here
    default:
      return { success: false, message: 'Invalid action' };
  }
}
```

## Migration Guide

### Before (Old Way):
```typescript
const response = await fetch('/api/gas-proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'login', username, password })
});
const data = await response.json();
```

### After (New Way):
```typescript
import { authAPI } from '../services/api';
const data = await authAPI.login(username, password);
```

**Cleaner, shorter, and type-safe!** ✨
