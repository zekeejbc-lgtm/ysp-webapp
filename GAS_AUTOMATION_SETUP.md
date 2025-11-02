# Google Sheets + GAS Automation Setup

## Quick Fix Guide

### Issue 1: Clasp Login ✅ FIXED
The clasp login opened a URL but you need to complete the flow. Here's how:

1. Run the login command again:
```powershell
npm run gas:login
```

2. **Copy the entire URL** that appears after "Authorize clasp by visiting this url:"

3. **Paste it in your browser** and sign in with your **ysptagu mchapter@gmail.com** account (the one that owns the GAS project)

4. You'll see a code like `4/0AanRR...` - **Copy the entire code**

5. **Go back to PowerShell** and paste the code when it says "Enter the code from that page here:"

6. Press Enter. You should see "Authorization successful."

### Issue 2: Missing dotenv ✅ FIXED
Just ran `npm install` to add the dotenv package.

### Issue 3: GAS Script Not Updated Yet
The `initFeedbackSheet` action doesn't exist yet because we haven't pushed the updated script to your live GAS project.

**After you complete the clasp login above**, run these in order:

```powershell
# 1. Push the updated YSP_LoginAccess.gs to your GAS project
npm run gas:push

# 2. Deploy a new version (makes it live on your web app URL)
npm run gas:deploy

# 3. Now test the init action
$body = @{ action = "initFeedbackSheet" } | ConvertTo-Json
Invoke-WebRequest -Uri "https://ysp-webapp.vercel.app/api/gas-proxy" -Method POST -ContentType "application/json" -Body $body
```

## Before Running Sheets Snapshot

Make sure to share these with your service account email: **ysp-migrator@ysp-web-app-migration.iam.gserviceaccount.com**

1. **Spreadsheet** (as Editor):
   - https://docs.google.com/spreadsheets/d/1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU

2. **Drive Folder for Feedback Images** (as Editor):
   - https://drive.google.com/drive/folders/12GOFbwF9Cyh-6WxE4aeMe-XaOzMdMm52

Once shared, run:
```powershell
npm run sheets:snapshot
```

This will create `SHEET_HEADERS_SNAPSHOT.json` with all your sheet headers.

## Common Issues

### "Access blocked: clasp" error
This happens when the OAuth consent screen isn't set up. Don't worry—just use your personal Google account (ysptagu mchapter@gmail.com) that owns the GAS project. Clasp will work fine.

### "Unknown action" from GAS
The live GAS script hasn't been updated yet. Complete the clasp login and push steps above first.

### "Cannot find module" errors
Run `npm install` to ensure all dependencies are installed.
