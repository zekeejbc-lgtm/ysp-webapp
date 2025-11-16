# Google Apps Script (GAS) Integration Implementation Guide

## Overview
This document outlines the standard pattern for integrating frontend features with the Google Apps Script (GAS) backend that uses Google Sheets as a database.

## Architecture Pattern

```
Frontend (React/TypeScript)
    ↓
gasApi.ts (API Wrapper)
    ↓
GAS Web App (doPost handler)
    ↓
YSP_LoginAccess.gs (Request Router)
    ↓
Google Sheets (Database)
```

## Integration Steps

### 1. Define Data Structure in Google Sheets

**Location**: Google Spreadsheet (ID: 1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU)

#### Example: Homepage Content Sheet
```
Sheet Name: "Homepage Content"
Columns:
- Key (unique identifier)
- Value (content value)
- UpdatedAt (timestamp)
- Facebook (social link)
- Instagram (social link)
- Twitter (social link)
- LinkedIn (social link)
- YouTube (social link)
- TikTok (social link)
```

**Best Practices**:
- Use descriptive column headers
- Include timestamp fields (UpdatedAt, CreatedAt)
- Use consistent naming conventions (snake_case or camelCase)
- Add validation columns (Status, IsActive, etc.)

---

### 2. Create Backend Handler in YSP_LoginAccess.gs

**File**: `YSP_LoginAccess.gs`

#### Step 2a: Add Action to Request Router

```javascript
function handlePostRequest(data) {
  const action = data.action;
  
  // Add your new action here
  switch (action) {
    case 'getHomepageContent':
      return handleGetHomepageContent();
    case 'updateHomepageContent':
      return handleUpdateHomepageContent(data);
    // ... other actions
    default:
      return { success: false, message: 'Unknown action' };
  }
}
```

#### Step 2b: Implement Handler Function

```javascript
/**
 * Get homepage content from Google Sheets
 * @returns {Object} Homepage content with success status
 */
function handleGetHomepageContent() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Homepage Content');
    
    if (!sheet) {
      return { success: false, message: 'Homepage Content sheet not found' };
    }
    
    // Get all data
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Build content object by reading key-value pairs
    const content = {};
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const key = row[0]; // First column is the key
      const value = row[1]; // Second column is the value
      
      if (key) {
        content[key] = value;
      }
    }
    
    // Add social media links
    content.social_links = {
      facebook: data[1][3] || '', // Facebook column
      instagram: data[1][4] || '',
      twitter: data[1][5] || '',
      linkedin: data[1][6] || '',
      youtube: data[1][7] || '',
      tiktok: data[1][8] || ''
    };
    
    return {
      success: true,
      content: content
    };
  } catch (error) {
    Logger.log('Error in handleGetHomepageContent: ' + error.toString());
    return {
      success: false,
      message: 'Error retrieving homepage content: ' + error.message
    };
  }
}
```

**Key Patterns**:
- Always wrap in try-catch
- Return `{ success: boolean, ... }` structure
- Use Logger.log() for debugging
- Validate sheet existence
- Handle missing data gracefully

---

### 3. Create Frontend API Wrapper

**File**: `src/services/gasApi.ts`

#### Step 3a: Define TypeScript Interface

```typescript
export interface HomepageContentResponse {
  success: boolean;
  message?: string;
  content?: {
    hero_main_heading: string;
    hero_sub_heading: string;
    hero_tagline: string;
    about_title: string;
    about_content: string;
    // ... other fields
    social_links?: {
      facebook: string;
      instagram: string;
      twitter: string;
      linkedin: string;
      youtube: string;
      tiktok: string;
    };
  };
}
```

#### Step 3b: Create API Function

```typescript
export async function getHomepageContentFromGAS(): Promise<HomepageContentResponse | null> {
  try {
    const result = await callGAS('getHomepageContent', {});
    return result;
  } catch (error) {
    console.error('Error fetching homepage content:', error);
    return null;
  }
}
```

**The `callGAS` Helper** (already implemented):
```typescript
async function callGAS(action: string, data: any = {}): Promise<any> {
  try {
    // Use URL-encoded form data to avoid CORS preflight
    const formData = new URLSearchParams();
    formData.append('action', action);
    
    // Add all data fields to form
    Object.keys(data).forEach(key => {
      formData.append(key, typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
    });

    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error(`GAS API Error (${action}):`, error);
    throw error;
  }
}
```

**Why URLSearchParams?**
- Avoids CORS preflight requests (OPTIONS)
- Google Apps Script handles form data natively
- Simpler than configuring CORS headers

---

### 4. Integrate in Frontend Component

**File**: `src/App.tsx` (or component file)

#### Step 4a: Import API Function

```typescript
import { getHomepageContentFromGAS } from "./services/gasApi";
```

#### Step 4b: Create State

```typescript
const [homepageContent, setHomepageContent] = useState({
  hero: {
    mainHeading: "Loading...",
    subHeading: "",
    tagline: "",
  },
  // ... initial structure
});
```

#### Step 4c: Fetch Data on Mount

```typescript
useEffect(() => {
  const loadHomepageContent = async () => {
    try {
      const data = await getHomepageContentFromGAS();
      if (data && data.success) {
        // Map GAS response to component state
        setHomepageContent({
          hero: {
            mainHeading: data.content.hero_main_heading || "Default",
            subHeading: data.content.hero_sub_heading || "Default",
            tagline: data.content.hero_tagline || "Default",
          },
          // ... map other fields
        });
      }
    } catch (error) {
      console.error('Failed to load homepage content:', error);
      toast.error('Failed to load homepage content');
    }
  };

  loadHomepageContent();
}, []); // Empty dependency array = run once on mount
```

---

## Common Patterns & Best Practices

### 1. Error Handling

**Backend (GAS)**:
```javascript
try {
  // ... logic
  return { success: true, data: result };
} catch (error) {
  Logger.log('Error in handleAction: ' + error.toString());
  return { success: false, message: error.message };
}
```

**Frontend**:
```typescript
try {
  const result = await callGAS('action', data);
  if (result.success) {
    // Handle success
  } else {
    toast.error(result.message || 'Operation failed');
  }
} catch (error) {
  toast.error('Network error. Please try again.');
}
```

### 2. Loading States

```typescript
const [isLoading, setIsLoading] = useState(false);

const loadData = async () => {
  setIsLoading(true);
  try {
    const data = await getDataFromGAS();
    // ... process data
  } finally {
    setIsLoading(false);
  }
};
```

### 3. Caching in GAS

```javascript
function getCachedOrFetch(key, fetchFunction, expirationSeconds) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(key);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const freshData = fetchFunction();
  cache.put(key, JSON.stringify(freshData), expirationSeconds);
  return freshData;
}

// Usage
function handleGetHomepageContent() {
  return getCachedOrFetch('homepage_content', () => {
    // Fetch from sheet
    return { success: true, content: {...} };
  }, 1800); // 30 minutes
}
```

### 4. Data Validation

**Backend**:
```javascript
function handleUpdateProfile(data) {
  // Validate required fields
  if (!data.idCode || !data.email) {
    return { success: false, message: 'Missing required fields' };
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { success: false, message: 'Invalid email format' };
  }
  
  // ... proceed with update
}
```

### 5. Optimized Sheet Reading

```javascript
// ❌ Bad: Reading entire sheet every time
function getOptimizedRange(sheet) {
  return sheet.getDataRange().getValues();
}

// ✅ Good: Only read necessary range
function getOptimizedRange(sheet, headerRows = 1) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  if (lastRow <= headerRows) return [];
  
  return sheet.getRange(headerRows + 1, 1, lastRow - headerRows, lastCol).getValues();
}
```

---

## Deployment Checklist

### Backend (Google Apps Script)

1. **Update Code**:
   - Copy updated `YSP_LoginAccess.gs` to Apps Script Editor
   - Save file (Ctrl+S)

2. **Deploy New Version**:
   - Click Deploy → Manage deployments
   - Click Edit (pencil icon) on existing deployment
   - Change Version to "New version"
   - Add description of changes
   - Click Deploy

3. **Verify Deployment**:
   ```powershell
   Invoke-RestMethod -Uri "YOUR_GAS_URL" `
     -Method Post `
     -Body (@{action='getHomepageContent'} | ConvertTo-Json) `
     -ContentType 'application/json'
   ```

### Frontend (React/Vite)

1. **Environment Variables** (`.env`):
   ```env
   VITE_API_PROVIDER=gas
   VITE_GAS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

2. **Restart Dev Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

---

## Testing Strategy

### 1. Terminal Testing (PowerShell)

```powershell
# Test GET request
Invoke-WebRequest -Uri "YOUR_GAS_URL" -Method Get

# Test POST request
$body = @{action='login'; username='test'; password='test'} | ConvertTo-Json
Invoke-RestMethod -Uri "YOUR_GAS_URL" -Method Post -Body $body -ContentType 'application/json'
```

### 2. Browser Console Testing

```javascript
// Test fetch call
fetch('YOUR_GAS_URL', {
  method: 'POST',
  body: new URLSearchParams({ action: 'getHomepageContent' })
})
  .then(r => r.json())
  .then(console.log);
```

### 3. Component Testing

- Check browser DevTools Network tab for request/response
- Verify data appears in UI
- Check console for errors

---

## Troubleshooting

### CORS Errors

**Symptom**: `Access-Control-Allow-Origin header is not present`

**Solution**:
1. Ensure GAS deployment has "Anyone" access
2. Use URLSearchParams instead of JSON in frontend
3. Backend `doPost` must handle form-encoded data

### 302 Redirect

**Symptom**: GAS returns redirect instead of data

**Solution**:
- This is normal for GET requests
- Use POST with form data
- Browser handles redirects automatically

### Data Not Updating

**Symptom**: Old data still appearing after changes

**Solution**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear GAS cache: `CacheService.getScriptCache().removeAll()`
3. Verify new deployment version is active

### Empty Response

**Symptom**: `{ success: false, message: 'Sheet not found' }`

**Solution**:
1. Check sheet name matches exactly (case-sensitive)
2. Verify spreadsheet ID is correct
3. Check GAS account has sheet access

---

## Example: Complete Feature Integration

### Feature: Get User Profile

#### 1. Sheet Structure
```
Sheet: "User Profiles"
Columns: ID Code | Username | Email | Role | Status | ...
```

#### 2. GAS Handler
```javascript
function handleGetProfile(data) {
  try {
    const idCode = data.idCode;
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('User Profiles');
    const values = sheet.getDataRange().getValues();
    
    // Find user by ID Code (column 0)
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === idCode) {
        return {
          success: true,
          profile: {
            idCode: values[i][0],
            username: values[i][1],
            email: values[i][2],
            role: values[i][3],
            status: values[i][4]
          }
        };
      }
    }
    
    return { success: false, message: 'Profile not found' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
```

#### 3. Frontend API
```typescript
export async function getProfileFromGAS(idCode: string) {
  try {
    const result = await callGAS('getProfile', { idCode });
    return result;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { success: false, message: 'Network error' };
  }
}
```

#### 4. Component Usage
```typescript
const [profile, setProfile] = useState(null);

useEffect(() => {
  const loadProfile = async () => {
    const data = await getProfileFromGAS(user.idCode);
    if (data.success) {
      setProfile(data.profile);
    } else {
      toast.error(data.message);
    }
  };
  loadProfile();
}, [user.idCode]);
```

---

## Quick Reference

### GAS URL
```
https://script.google.com/macros/s/AKfycbwI4Pmh-r3RtpmqzRlnU-56ByzeWvRD6QKtCyDrKD9YU4jVhvaauN4lkxl2i7Wsl_Ps/exec
```

### Spreadsheet ID
```
1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU
```

### Standard Response Format
```javascript
{
  success: boolean,
  message?: string,
  data?: any,
  // ... other fields
}
```

### Common Actions
- `login` - User authentication
- `guestLogin` - Guest access
- `getHomepageContent` - Homepage data
- `getAccessLogs` - Access history
- `searchProfiles` - User search
- `updateProfile` - Profile update

---

## Version History

- **v1.0** (Nov 16, 2025) - Initial guide created
  - Basic architecture pattern
  - Homepage content integration example
  - CORS workaround with URLSearchParams
  - Deployment procedures

---

## Additional Resources

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Sheets API Reference](https://developers.google.com/sheets/api)
- [React useEffect Guide](https://react.dev/reference/react/useEffect)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Next Steps for New Features**:
1. Define sheet structure
2. Add handler to `YSP_LoginAccess.gs`
3. Create frontend API function in `gasApi.ts`
4. Integrate in component with useEffect
5. Test → Deploy → Verify
