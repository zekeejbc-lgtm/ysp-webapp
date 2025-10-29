# Profile Picture Troubleshooting Guide

## Quick Diagnosis

If profile pictures are not showing from Google Sheets, follow this troubleshooting guide.

---

## Step 1: Run Diagnostic Script

1. Open Google Apps Script editor for your project
2. Create a new file and paste the content from `DiagnosticScript_ProfilePictures.gs`
3. Run the function `diagnoseProfilePictures()`
4. Check the Logs (View → Logs or Ctrl+Enter)

This will show you:
- How many users have profile picture URLs
- Which URLs are valid/invalid
- If files are publicly accessible
- What's in the Drive folder

---

## Step 2: Check Common Issues

### Issue 1: Empty URLs
**Symptom:** Users have no profile picture URL in Column V

**Solution:**
- Users need to upload their profile picture through the app
- Or manually add Google Drive URLs to Column V

### Issue 2: Wrong URL Format
**Symptom:** URLs exist but images don't load

**Check these URL formats:**

❌ **BAD - Won't work:**
```
https://drive.google.com/file/d/FILE_ID/view
https://drive.google.com/open?id=FILE_ID
```

✅ **GOOD - Will work:**
```
https://drive.google.com/uc?export=view&id=FILE_ID
```

**Fix:** Run `fixProfilePictureURLs()` function in the diagnostic script to auto-fix all URLs.

### Issue 3: File Permissions
**Symptom:** URL is correct but image doesn't load (shows placeholder)

**Solution:**
1. Open the file in Google Drive
2. Click "Share" button
3. Change to "Anyone with the link"
4. Set permission to "Viewer"
5. Click "Done"

Or run `testFileAccess('FILE_ID')` in the diagnostic script to auto-fix permissions.

### Issue 4: CORS (Cross-Origin) Issues
**Symptom:** Browser console shows CORS errors

**Solutions:**
- Already implemented: Added `crossOrigin="anonymous"` to image tags
- Google Drive should support CORS for public files
- If still failing, consider alternative hosting (see below)

---

## Step 3: Manual Testing

### Test a Profile Picture URL:
1. Copy a URL from Column V in User Profiles sheet
2. Paste it directly in your browser
3. If you see the image → URL is correct ✅
4. If you see an error → URL needs fixing ❌

### Test File Permissions:
1. Right-click the URL in browser
2. Open in incognito/private window
3. If image loads → permissions are correct ✅
4. If asks to log in → needs public permission ❌

---

## Step 4: Fix Profile Picture URLs

### Option A: Auto-Fix with Script (Recommended)

```javascript
// Run this in Google Apps Script
function fixProfilePictureURLs() {
  // See DiagnosticScript_ProfilePictures.gs
}
```

This will:
- Convert all Drive URLs to the correct format
- Preserve file IDs
- Update the sheet automatically

### Option B: Manual Fix

For each user with a broken URL:
1. Find their row in User Profiles sheet
2. Look at Column V (ProfilePictureURL)
3. Extract the FILE_ID from the URL
4. Replace with: `https://drive.google.com/uc?export=view&id=FILE_ID`

Example:
```
Before: https://drive.google.com/file/d/1AbC123XyZ/view
After:  https://drive.google.com/uc?export=view&id=1AbC123XyZ
```

---

## Step 5: Alternative Solutions

If Google Drive continues to have issues, consider these alternatives:

### Option A: Direct Base64 (No External Hosting)

**Pros:**
- No external dependencies
- Images stored directly in sheet
- Instant loading

**Cons:**
- Larger sheet size
- Slower for big images
- Sheet size limits (10MB per cell)

**Implementation:**
```javascript
// Store base64 directly in Column V
data:image/jpeg;base64,/9j/4AAQSkZJRg...
```

### Option B: Imgur

**Pros:**
- Free image hosting
- Good CORS support
- Simple API
- No authentication for anonymous uploads

**Cons:**
- Public hosting (anyone can see)
- Rate limits

**Implementation:**
```javascript
// Upload to Imgur API
// Store Imgur URL in Column V
https://i.imgur.com/ABC123.jpg
```

### Option C: Cloudinary

**Pros:**
- Professional image CDN
- Free tier available
- Excellent CORS support
- Image transformations

**Cons:**
- Requires account setup
- Free tier limits

**Implementation:**
```javascript
// Upload to Cloudinary
// Store Cloudinary URL in Column V
https://res.cloudinary.com/yourcloud/image/upload/v123/profile.jpg
```

### Option D: Firebase Storage

**Pros:**
- Reliable Google infrastructure
- Good integration with Google Sheets
- Generous free tier

**Cons:**
- Requires Firebase project setup
- More complex setup

---

## Step 6: Verify the Fix

After implementing a solution:

1. **Clear Browser Cache:**
   - Chrome: Ctrl+Shift+Delete → Clear images and files
   - Or open in incognito/private window

2. **Test in App:**
   - Log in to the web app
   - Go to "My Profile"
   - Check if your profile picture loads
   - Try uploading a new picture

3. **Check Console:**
   - Press F12 to open Developer Tools
   - Go to Console tab
   - Look for any errors related to images
   - Check Network tab to see if image request succeeds

4. **Test on Different Devices:**
   - Mobile browser
   - Different computer
   - Different network

---

## Current Implementation Details

### Frontend (MyProfile.tsx)
```typescript
<img
  src={profile.profilePictureURL && profile.profilePictureURL.trim() !== '' 
    ? profile.profilePictureURL 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&size=200`}
  alt={profile.fullName}
  crossOrigin="anonymous"
  onError={(e) => {
    console.error('Failed to load profile picture:', profile.profilePictureURL);
    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&size=200`;
  }}
/>
```

### Backend (YSP_LoginAccess.gs)
- **Upload Function:** `handleUploadProfilePicture(data)`
  - Uploads to Drive folder ID: `192-pVluL93fYKpyJoukfi_H5az_9fqFK`
  - Sets file to public: `DriveApp.Access.ANYONE_WITH_LINK`
  - Uses format: `https://drive.google.com/uc?export=view&id=FILE_ID`

- **Update Function:** `handleUpdateProfilePicture(data)`
  - Updates Column V (ProfilePictureURL) in User Profiles sheet
  - Uses Column 22 in sheet (1-indexed)

---

## Quick Reference

### Column Mapping
- Column V (22nd column) = ProfilePictureURL
- Zero-indexed: `row[21]`
- One-indexed (Range): `.getRange(row, 22)`

### Folder ID
```
192-pVluL93fYKpyJoukfi_H5az_9fqFK
```

### Correct URL Format
```
https://drive.google.com/uc?export=view&id=FILE_ID
```

### Fallback Avatar
```
https://ui-avatars.com/api/?name=FULL_NAME&size=200&background=f6421f&color=fff
```

---

## Need More Help?

1. Run `diagnoseProfilePictures()` and share the logs
2. Check browser console for specific errors
3. Test a specific file ID with `testFileAccess('FILE_ID')`
4. Verify Google Sheets column structure
5. Consider switching to alternative hosting if Drive continues to have issues

---

## Best Practices

1. ✅ Keep image files under 5MB
2. ✅ Use square images (1:1 ratio) for best display
3. ✅ Always set Drive files to "Anyone with link"
4. ✅ Use the correct URL format
5. ✅ Test uploads in incognito mode to verify public access
6. ✅ Keep backup of profile pictures
7. ✅ Monitor sheet size (Google Sheets has limits)
