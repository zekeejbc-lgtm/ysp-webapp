# 🔐 Setting Up OAuth Client for Clasp

## 📥 Step 1: Download OAuth Client Credentials

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials
   - Select project: **ysp-web-app-migration**

2. **Find or Create OAuth 2.0 Client ID:**
   - Look for: `client_secret_151174609303-rifgvemnu05rs8rlhbu0ncj3tib6q3uu.apps.googleusercontent.com.json`
   - If not found, create a new one:
     - Click **+ CREATE CREDENTIALS** > **OAuth client ID**
     - Application type: **Desktop app**
     - Name: `Clasp CLI`
     - Click **CREATE**

3. **Download the JSON file:**
   - Click the **⬇️ Download** icon next to your OAuth client
   - Save as: `client_secret_151174609303-rifgvemnu05rs8rlhbu0ncj3tib6q3uu.apps.googleusercontent.com.json`

4. **Move to your project:**
   ```powershell
   # Move the downloaded file to the secrets folder
   Move-Item "~/Downloads/client_secret_*.json" "secrets/"
   ```

## 🚀 Step 2: Login with Clasp

Once you have the file in the `secrets/` folder:

```powershell
# Login using the OAuth credentials
clasp login --creds "secrets/client_secret_151174609303-rifgvemnu05rs8rlhbu0ncj3tib6q3uu.apps.googleusercontent.com.json"
```

## ⚠️ Known Issue: OAuth App Not Verified

Even with your own OAuth client, you might still see:
- **"Access blocked: This app's request is invalid"**
- This happens because the OAuth app needs to be verified by Google

## 💡 Recommended Solution

**Use the automated deployment instead:**

```powershell
npm run gas:auto-deploy
```

This uses the service account (already working) and bypasses OAuth completely!

## 📊 Comparison

| Method | Requires OAuth | Works Now | Setup Time |
|--------|----------------|-----------|------------|
| `clasp login` | ✅ Yes | ⚠️ Blocked | 10 min |
| `npm run gas:auto-deploy` | ❌ No | ✅ Yes | 2 min |

---

**Bottom line:** The service account method (`gas:auto-deploy`) is easier and already working! 🎯
