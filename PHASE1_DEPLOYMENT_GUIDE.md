# Phase 1 Deployment Guide

## ✅ Changes Completed

### Backend (Spreadsheet) Changes:
1. **Access Logs** - Restructured with login tracking
   - Added: `Action`, `ActionType`, `IP Address`, `Device`, `Status` columns
   - Migrated 8 existing records

2. **Homepage Content** - Enhanced
   - Added: `UpdatedAt` column
   - Added: 6 social media fields (facebook_url, instagram_url, twitter_url, linkedin_url, youtube_url, tiktok_url)

3. **New Sheets Created:**
   - `Homepage_Projects` (7 columns)
   - `Home_DevInfo` (10 columns)
   - `Home_FounderInfo` (10 columns)

### Apps Script (YSP_LoginAccess.gs) Changes:
1. **handleLogin()** - Updated to log with new Access Logs structure
2. **handleGuestLogin()** - Updated to log with new Access Logs structure
3. **handleGetHomepageContent()** - Complete rewrite:
   - Reads `Homepage Content` by key names (not row numbers)
   - Fetches projects from `Homepage_Projects` sheet
   - Fetches developers from `Home_DevInfo` sheet
   - Fetches founders from `Home_FounderInfo` sheet
   - Returns social media links

## 📋 Manual Deployment Steps

### Step 1: Deploy Apps Script
1. Open Google Apps Script Editor: https://script.google.com
2. Select your YSP project
3. Open `YSP_LoginAccess.gs`
4. Replace the **THREE updated functions** with the new code from this file
5. Click **Deploy** → **Manage Deployments**
6. Click **Edit** (pencil icon) on your existing deployment
7. Change **Version** to "New version"
8. Add description: "Phase 1: Login & Homepage restructure"
9. Click **Deploy**

### Step 2: Test Frontend Connection
Run the dev server to test:
```powershell
cd 'C:\Users\cathl\Downloads\Build Homepage Layout (Copy) (Copy) (Copy)'
npm run dev
```

### Step 3: Verify Changes
Test these features:
- ✅ Login (should log with new columns)
- ✅ Guest Login (should log with new columns)
- ✅ Homepage displays correctly
- ✅ Social media links appear
- ✅ Projects load from Homepage_Projects
- ✅ Developer info loads from Home_DevInfo
- ✅ Founder info loads from Home_FounderInfo

## 🎯 What This Achieves

### Key Improvements:
1. **Login mechanism** now tracks detailed action logs (Action, ActionType, Status, etc.)
2. **Homepage content** is **row-order independent** - uses key names, not row positions
3. **Social media links** are now supported
4. **Projects**, **Developers**, and **Founders** are in separate, manageable sheets
5. **Scalable** - Easy to add new projects/developers/founders without editing Apps Script

### Frontend Benefits:
- Homepage will load all social links dynamically
- Projects section will auto-update from spreadsheet
- Developer/Founder bios can be managed in spreadsheet
- No hardcoded row numbers - more maintainable

## 🔧 Frontend Code Location
The frontend API calls are in:
```
Build Homepage Layout (Copy) (Copy) (Copy)/src/services/api.ts
```

The homepage component should automatically work with the new backend structure since we maintained backward compatibility in the response format.

## ⚠️ Important Notes

1. **Cache**: After deployment, the Apps Script cache will expire in 30 minutes for homepage content
2. **Invalidate cache manually** if needed by modifying any value in Homepage Content sheet
3. **Backward compatible**: Old frontend code will still work while you update it
4. **Test on localhost first** before deploying to production

## 📞 Next Steps After Testing

Once Phase 1 is verified:
- Phase 2: User Profiles & Member Applications
- Phase 3: Announcements split (Announcements + Announcement_ReadStatus)
- Phase 4: Donations restructure
- Phase 5: Polls dynamic sheets (Poll_MasterLog + individual poll sheets)
