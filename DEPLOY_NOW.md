# 🚀 Deploy YSP_LoginAccess.gs - Quick Guide

## Current Status
✅ CORS is enabled on your deployment (Access-Control-Allow-Origin: *)
✅ Code has been updated locally with `doGet()` function
❌ **Updated code NOT deployed yet** - need to redeploy

## Quick Deploy Steps (5 minutes)

### 1. Open Apps Script
https://script.google.com/home/projects/1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU/edit

### 2. Replace the Code
1. Click on `YSP_LoginAccess.gs` file in the left sidebar
2. **Select ALL** code (Ctrl+A)
3. **Copy** the updated code from: `c:\Users\cathl\Downloads\Finalize Web App UI Documentation\YSP_LoginAccess.gs`
4. **Paste** into Apps Script editor
5. Click **💾 Save** (Ctrl+S)

### 3. Create New Deployment
1. Click **Deploy** button (top right)
2. Select **"Manage deployments"**
3. Find your current deployment (ID: AKfycbwI4Pmh-r3RtpmqzRlnU-56ByzeWvRD6QKtCyDrKD9YU4jVhvaauN4lkxl2i7Wsl_Ps)
4. Click **✏️ Edit** (pencil icon)
5. Change **"Version"** to **"New version"**
6. Add description: "Added doGet for CORS + Phase 1 fixes"
7. Click **"Deploy"**
8. Click **"Done"**

### 4. Test Immediately
The deployment URL stays the same:
```
https://script.google.com/macros/s/AKfycbwI4Pmh-r3RtpmqzRlnU-56ByzeWvRD6QKtCyDrKD9YU4jVhvaauN4lkxl2i7Wsl_Ps/exec
```

No need to update `.env` - just **refresh your browser** at http://localhost:3001/ and try logging in!

### 5. Verify
After deployment, test in browser console (F12):
```javascript
fetch('https://script.google.com/macros/s/AKfycbwI4Pmh-r3RtpmqzRlnU-56ByzeWvRD6QKtCyDrKD9YU4jVhvaauN4lkxl2i7Wsl_Ps/exec', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'login', username: 'ZekeYSP', password: 'Zeke#25200' })
})
  .then(r => r.json())
  .then(console.log);
```

You should see a successful login response!

## Why This Works
- Your deployment already has CORS enabled (`Access-Control-Allow-Origin: *`)
- The new code adds `doGet()` function to handle GET requests properly
- Updating the deployment version applies the new code without changing the URL

## Common Issues

### "Script function not found: doGet"
- **Solution**: You haven't saved the file. Click 💾 Save.

### Still getting CORS errors
- **Solution**: Hard refresh browser (Ctrl+Shift+R) to clear cached responses

### "Authorization required"
- **Solution**: Click "Review Permissions" and authorize the script

## Current Deployment Info
- **Deployment ID**: AKfycbwI4Pmh-r3RtpmqzRlnU-56ByzeWvRD6QKtCyDrKD9YU4jVhvaauN4lkxl2i7Wsl_Ps
- **Access**: Anyone (CORS enabled ✅)
- **Version**: Needs update with new code

**Next Action**: Copy YSP_LoginAccess.gs to Apps Script and create new version deployment!
