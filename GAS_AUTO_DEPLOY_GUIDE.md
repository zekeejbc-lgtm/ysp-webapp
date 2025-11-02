# 🚀 Automated Google Apps Script Deployment Guide

This guide explains how to automatically deploy your GAS code from VS Code to Google Apps Script without manual copy-paste.

## 📋 Prerequisites

1. **Service Account with Apps Script API Access**
   - Service account email: `ysp-migrator@ysp-web-app-migration.iam.gserviceaccount.com`
   - JSON key file: `secrets/ysp-web-app-migration.json`

2. **Apps Script API Enabled**
   - Must be enabled in your Google Cloud Console project

3. **Service Account Has Editor Access**
   - The service account must be shared on your GAS project with Editor permissions

## 🔧 Setup Steps

### Step 1: Enable Apps Script API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `ysp-web-app-migration`
3. Navigate to **APIs & Services > Library**
4. Search for "Apps Script API"
5. Click **Enable**

### Step 2: Share GAS Project with Service Account

1. Open your GAS project: https://script.google.com/home/projects/1CEx53zlJZHarkYESoUzbuV3Jj04rA6YKVSpsh1n-sClm_PHjXJyeuSXf/edit
2. Click **Share** (top right)
3. Add the service account email: `ysp-migrator@ysp-web-app-migration.iam.gserviceaccount.com`
4. Give it **Editor** access
5. Click **Send** (uncheck "Notify people" if you want)

### Step 3: Verify Environment Variables

Ensure your `.env.local` has:
```env
GOOGLE_SERVICE_ACCOUNT_JSON_PATH=c:\\Users\\cathl\\Downloads\\Finalize Web App UI Documentation\\secrets\\ysp-web-app-migration.json
```

## 🎯 Usage

### Automated Deployment (Recommended)

Deploy your code automatically with one command:

```powershell
npm run gas:auto-deploy
```

**What it does:**
1. ✅ Reads `YSP_LoginAccess.gs` from your repo
2. ✅ Authenticates with service account (no OAuth popup!)
3. ✅ Uploads code to GAS project via API
4. ✅ Creates a new version
5. ✅ Shows you the link to deploy in browser

**Output:**
```
🚀 Starting Google Apps Script deployment...

📋 Reading service account credentials...
🔐 Authenticating with Google Apps Script API...
✅ Authentication successful!

📂 Reading YSP_LoginAccess.gs...
   File size: 123.45 KB
   Lines: 3757

📥 Fetching current project metadata...
✅ Preserved appsscript.json manifest

📤 Uploading code to Google Apps Script...
✅ Code uploaded successfully!
   Script ID: 1CEx53zlJZHarkYESoUzbuV3Jj04rA6YKVSpsh1n-sClm_PHjXJyeuSXf
   Files updated: 2

🔢 Creating new version...
✅ New version created!
   Version: 42
   Created: 2025-11-02T12:34:56.789Z

🎉 Deployment complete!

📝 Next steps:
   1. Open: https://script.google.com/home/projects/1CEx53zlJZHarkYESoUzbuV3Jj04rA6YKVSpsh1n-sClm_PHjXJyeuSXf/edit
   2. Go to Deploy > Manage deployments
   3. Click Edit on your Web app deployment
   4. Select "New version" from the dropdown
   5. Click "Deploy"
```

### Manual Deployment (Clasp - Requires OAuth)

If you want to use clasp (blocked by OAuth verification currently):

```powershell
# Login (opens browser for OAuth)
npm run gas:login

# Push code
npm run gas:push

# Deploy
npm run gas:deploy
```

## 🔍 Troubleshooting

### Error: Permission denied (403)

**Problem:** Service account doesn't have access to the GAS project.

**Solution:**
1. Open your GAS project
2. Click **Share**
3. Add `ysp-migrator@ysp-web-app-migration.iam.gserviceaccount.com` as Editor
4. Save

### Error: Apps Script API has not been used

**Problem:** Apps Script API is not enabled in your Google Cloud project.

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Apps Script API (see Setup Step 1)

### Error: Service account JSON not found

**Problem:** The path in `.env.local` is incorrect.

**Solution:**
1. Check that `secrets/ysp-web-app-migration.json` exists
2. Update `GOOGLE_SERVICE_ACCOUNT_JSON_PATH` in `.env.local`
3. Use double backslashes in Windows paths: `c:\\Users\\...`

## 📊 Comparison: Auto-Deploy vs Manual

| Feature | Auto-Deploy | Manual Copy-Paste | Clasp |
|---------|-------------|-------------------|-------|
| Speed | ⚡ 10 seconds | 🐌 5 minutes | ⚡ 15 seconds |
| OAuth Required | ❌ No | ❌ No | ✅ Yes (blocked) |
| Browser Needed | ❌ No (code upload)<br>✅ Yes (final deploy) | ✅ Yes | ✅ Yes (login) |
| Automation Ready | ✅ Yes | ❌ No | ⚠️ Blocked |
| Version Control | ✅ Automatic | ❌ Manual | ✅ Automatic |

## 🎯 Recommended Workflow

### For Development (Fast Iteration):
```powershell
# 1. Edit YSP_LoginAccess.gs in VS Code
# 2. Deploy automatically
npm run gas:auto-deploy

# 3. Open the link from output
# 4. Deploy > Manage deployments > Edit > New version > Deploy
```

### For Production Deploy:
```powershell
# 1. Commit your changes
git add YSP_LoginAccess.gs
git commit -m "feat: add new feature"
git push origin main

# 2. Deploy to GAS
npm run gas:auto-deploy

# 3. Test the deployment
.\test-feedback-init.ps1
```

## 🔐 Security Notes

- ✅ Service account JSON is in `secrets/` (gitignored)
- ✅ Service account has minimal required permissions
- ✅ No OAuth tokens stored locally
- ✅ No browser-based authentication needed for code upload
- ⚠️ Final deployment still requires manual click in browser (Google requirement)

## 🚀 Future Automation (Optional)

To fully automate deployment (including the final "Deploy" click):

1. Use Google Apps Script API's `deployments.create()` endpoint
2. Requires additional API permissions
3. May need OAuth 2.0 (user consent) for deployment creation

Currently, the semi-automated approach (auto-upload + manual deploy button) is the most reliable and secure method.

## 📚 Additional Resources

- [Apps Script API Documentation](https://developers.google.com/apps-script/api/reference/rest)
- [Service Account Authentication](https://cloud.google.com/iam/docs/service-accounts)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**Last Updated:** November 2, 2025
