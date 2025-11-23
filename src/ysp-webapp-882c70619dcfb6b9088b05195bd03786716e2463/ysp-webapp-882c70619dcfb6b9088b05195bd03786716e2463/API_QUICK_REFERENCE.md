# YSP API Quick Reference

## 🎯 What Changed?

Instead of writing this in every component:
```typescript
const response = await fetch('/api/gas-proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'login', username, password })
});
```

You now write this:
```typescript
import { authAPI } from '../services/api';
const response = await authAPI.login(username, password);
```

## 📦 Available APIs

### 1. Authentication
```typescript
import { authAPI } from '../services/api';

// Login
await authAPI.login(username, password);

// Guest Login
await authAPI.guestLogin(name);
```

### 2. Access Logs
```typescript
import { accessLogsAPI } from '../services/api';

// Get all logs
await accessLogsAPI.getAll(role?);

// Search logs
await accessLogsAPI.search(searchTerm, role?);
```

### 3. Attendance (Coming Soon)
```typescript
import { attendanceAPI } from '../services/api';

await attendanceAPI.submit(eventId, idCode);
await attendanceAPI.getRecords(eventId?);
```

### 4. Events (Coming Soon)
```typescript
import { eventsAPI } from '../services/api';

await eventsAPI.getAll();
await eventsAPI.create(eventData);
await eventsAPI.toggleStatus(eventId);
```

### 5. User Profile (Coming Soon)
```typescript
import { userAPI } from '../services/api';

await userAPI.getProfile(idCode);
await userAPI.updateProfile(idCode, updates);
```

## ⚙️ Configuration

**Location**: `src/services/api.ts`

```typescript
const API_CONFIG = {
  baseURL: '/api/gas-proxy',  // ← Change once, applies everywhere
  spreadsheetIds: {
    main: '1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU',
  },
};
```

## 🔧 How to Add New Endpoints

1. Open `src/services/api.ts`
2. Add your new API group:

```typescript
export const myAPI = {
  myFunction: async (param: string): Promise<any> => {
    return apiRequest('myAction', { param });
  },
};
```

3. Use it in any component:

```typescript
import { myAPI } from '../services/api';

const result = await myAPI.myFunction('test');
```

## ✅ Benefits

- ✅ Change API URL once, not in 20+ files
- ✅ Type safety with TypeScript
- ✅ Cleaner, more readable code
- ✅ Easier to test and maintain
- ✅ Consistent error handling

## 📝 Updated Components

These components now use the API service:
- ✅ `LoginScreen.tsx` - Uses `authAPI`
- ✅ `AccessLogs.tsx` - Uses `accessLogsAPI`

## 🚀 Next Steps

Consider updating these components:
- `AttendanceDashboard.tsx`
- `ManageEvents.tsx`
- `MyProfile.tsx`
- `QRScanner.tsx`

Each can benefit from using the centralized API service!
