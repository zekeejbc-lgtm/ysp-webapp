# Appwrite Setup Guide – Complete Configuration

This guide walks you through setting up Appwrite from scratch for the YSP Web App. Follow these steps to create your project, database, collections, and permissions.

---

## Prerequisites

- An Appwrite Cloud account (https://cloud.appwrite.io) or a self-hosted Appwrite instance
- Basic understanding of document databases and permissions

---

## Step 1: Create a New Project

1. Log in to your Appwrite Console
2. Click **"Create Project"**
3. Enter project details:
   - **Name**: `YSP Web App` (or your preferred name)
   - **Project ID**: Will be auto-generated; note this down
4. Click **"Create"**
5. **Save your Project ID** – you'll need it for `.env.local` as `VITE_APPWRITE_PROJECT`

---

## Step 2: Create the Database

1. In your project, navigate to **Databases** in the left sidebar
2. Click **"Create Database"**
3. Enter:
   - **Database ID**: `ysp-main` (or auto-generate)
   - **Name**: `YSP Main Database`
4. Click **"Create"**
5. **Save your Database ID** – you'll need it for `.env.local` as `VITE_APPWRITE_DATABASE_ID`

---

## Step 3: Create Collections and Attributes

You'll create 6 collections to match your current Google Sheets structure. For each collection below:

1. Click **"Create Collection"**
2. Enter the Collection ID and Name
3. Set **Permissions** (see below)
4. Click **"Create"**
5. Add **Attributes** as listed
6. **Save the Collection ID** for your `.env.local`

---

### Collection 1: Users

**Collection ID**: `users` (save as `VITE_APPWRITE_COL_USERS`)  
**Name**: Users

**Attributes**:
| Key | Type | Size | Required | Default | Array |
|-----|------|------|----------|---------|-------|
| `idCode` | String | 50 | Yes | - | No |
| `fullName` | String | 200 | Yes | - | No |
| `username` | String | 100 | Yes | - | No |
| `email` | Email | 255 | Yes | - | No |
| `password` | String | 255 | Yes | - | No |
| `role` | String | 50 | Yes | "Member" | No |
| `contactNumber` | String | 50 | No | - | No |
| `birthday` | String | 50 | No | - | No |
| `age` | String | 10 | No | - | No |
| `gender` | String | 20 | No | - | No |
| `pronouns` | String | 50 | No | - | No |
| `civilStatus` | String | 50 | No | - | No |
| `religion` | String | 100 | No | - | No |
| `nationality` | String | 100 | No | - | No |
| `position` | String | 100 | No | - | No |
| `profilePictureURL` | URL | 2000 | No | - | No |

**Indexes**:
- `idCode_unique`: Unique index on `idCode`
- `username_unique`: Unique index on `username`
- `email_unique`: Unique index on `email`

**Permissions**:
- **Create**: Any (for registration) or role:users
- **Read**: role:users (authenticated users can read profiles)
- **Update**: users:[USER_ID] (users can update their own documents)
- **Delete**: role:admin (only admins can delete users)

---

### Collection 2: Events

**Collection ID**: `events` (save as `VITE_APPWRITE_COL_EVENTS`)  
**Name**: Events

**Attributes**:
| Key | Type | Size | Required | Default | Array |
|-----|------|------|----------|---------|-------|
| `name` | String | 200 | Yes | - | No |
| `date` | String | 50 | Yes | - | No |
| `status` | String | 50 | Yes | "Active" | No |

**Indexes**:
- `date_asc`: Index on `date` (ascending) for efficient ordering

**Permissions**:
- **Create**: role:admin, role:auditor
- **Read**: role:users (all authenticated users can see events)
- **Update**: role:admin, role:auditor
- **Delete**: role:admin, role:auditor

---

### Collection 3: Attendance

**Collection ID**: `attendance` (save as `VITE_APPWRITE_COL_ATTENDANCE`)  
**Name**: Attendance

**Attributes**:
| Key | Type | Size | Required | Default | Array |
|-----|------|------|----------|---------|-------|
| `eventId` | String | 100 | Yes | - | No |
| `idCode` | String | 50 | Yes | - | No |
| `name` | String | 200 | Yes | - | No |
| `status` | String | 50 | Yes | "Not Recorded" | No |
| `timestamp` | String | 50 | No | - | No |
| `position` | String | 100 | No | - | No |
| `committee` | String | 100 | No | - | No |

**Indexes**:
- `eventId_idx`: Index on `eventId`
- `idCode_idx`: Index on `idCode`
- `event_user_unique`: Unique index on `eventId` + `idCode` (composite)

**Permissions**:
- **Create**: role:users (attendance can be submitted by any authenticated user)
- **Read**: role:users
- **Update**: role:admin, role:auditor, role:head
- **Delete**: role:admin, role:auditor

---

### Collection 4: Announcements

**Collection ID**: `announcements` (save as `VITE_APPWRITE_COL_ANNOUNCEMENTS`)  
**Name**: Announcements

**Attributes**:
| Key | Type | Size | Required | Default | Array |
|-----|------|------|----------|---------|-------|
| `title` | String | 200 | Yes | - | No |
| `subject` | String | 200 | Yes | - | No |
| `body` | String | 10000 | Yes | - | No |
| `authorIdCode` | String | 50 | Yes | - | No |
| `authorName` | String | 200 | Yes | - | No |
| `timestamp` | String | 50 | Yes | - | No |
| `recipientType` | String | 100 | Yes | - | No |
| `recipientValue` | String | 500 | No | - | No |
| `emailStatus` | String | 50 | Yes | "Pending" | No |
| `readBy` | String | 10000 | No | - | Yes |

**Indexes**:
- `timestamp_desc`: Index on `timestamp` (descending) for recent-first ordering

**Permissions**:
- **Create**: role:head, role:admin, role:auditor
- **Read**: role:users (with additional logic to filter by recipient in your app code)
- **Update**: role:head, role:admin, role:auditor
- **Delete**: role:admin, role:auditor

---

### Collection 5: Feedback

**Collection ID**: `feedback` (save as `VITE_APPWRITE_COL_FEEDBACK`)  
**Name**: Feedback

**Attributes**:
| Key | Type | Size | Required | Default | Array |
|-----|------|------|----------|---------|-------|
| `referenceId` | String | 100 | Yes | - | No |
| `timestamp` | String | 50 | Yes | - | No |
| `authorName` | String | 200 | Yes | - | No |
| `authorIdCode` | String | 50 | No | "Guest" | No |
| `message` | String | 5000 | Yes | - | No |
| `hasReply` | Boolean | - | Yes | false | No |
| `replyTimestamp` | String | 50 | No | - | No |
| `replyMessage` | String | 5000 | No | - | No |
| `replierName` | String | 200 | No | - | No |
| `replierIdCode` | String | 50 | No | - | No |

**Indexes**:
- `referenceId_unique`: Unique index on `referenceId`
- `timestamp_desc`: Index on `timestamp` (descending)

**Permissions**:
- **Create**: Any (guests can submit feedback)
- **Read**: users:[USER_ID] (users can read their own feedback), role:admin, role:auditor (can read all)
- **Update**: role:admin, role:auditor (for adding replies)
- **Delete**: role:admin, role:auditor

---

### Collection 6: Access Logs

**Collection ID**: `accessLogs` (save as `VITE_APPWRITE_COL_ACCESSLOGS`)  
**Name**: Access Logs

**Attributes**:
| Key | Type | Size | Required | Default | Array |
|-----|------|------|----------|---------|-------|
| `timestamp` | String | 50 | Yes | - | No |
| `idCode` | String | 50 | Yes | - | No |
| `name` | String | 200 | Yes | - | No |
| `role` | String | 50 | Yes | - | No |
| `action` | String | 100 | No | "login" | No |

**Indexes**:
- `timestamp_desc`: Index on `timestamp` (descending)
- `idCode_idx`: Index on `idCode`

**Permissions**:
- **Create**: role:users (logs created on login/actions)
- **Read**: role:admin, role:auditor
- **Update**: None (logs are immutable)
- **Delete**: role:admin

---

## Step 4: Configure Authentication (Optional but Recommended)

1. Navigate to **Auth** in the left sidebar
2. Enable authentication methods:
   - **Email/Password**: Enable for traditional login
   - **Anonymous Sessions**: Enable if you want guest access
3. Configure **Security** settings:
   - Session length: 30 days (or your preference)
   - Password policy: Set minimum requirements
4. Set **OAuth** providers if needed (Google, GitHub, etc.)

---

## Step 5: Set Up Storage (for Profile Pictures and Images)

1. Navigate to **Storage** in the left sidebar
2. Click **"Create Bucket"**
3. Create buckets:

### Bucket 1: Profile Pictures
- **Bucket ID**: `profile-pictures`
- **Name**: Profile Pictures
- **Permissions**:
  - **Create**: role:users
  - **Read**: Any (public read for profile pictures)
  - **Update**: users:[USER_ID]
  - **Delete**: role:admin, users:[USER_ID]
- **File Size Limit**: 5MB
- **Allowed File Extensions**: jpg, jpeg, png, gif, webp

### Bucket 2: Project Images
- **Bucket ID**: `project-images`
- **Name**: Project Images
- **Permissions**:
  - **Create**: role:admin, role:auditor
  - **Read**: Any (public read)
  - **Update**: role:admin, role:auditor
  - **Delete**: role:admin, role:auditor
- **File Size Limit**: 10MB
- **Allowed File Extensions**: jpg, jpeg, png, gif, webp

---

## Step 6: Get Your API Keys

1. Navigate to **Settings** > **API Keys** (or **Overview** for project details)
2. You'll need:
   - **Endpoint**: Your Appwrite API endpoint (e.g., `https://cloud.appwrite.io/v1`)
   - **Project ID**: Already saved from Step 1
3. For **server-side operations** (migration script):
   - Create an **API Key** with:
     - **Name**: Migration Script
     - **Scopes**: Select all necessary scopes (databases.read, databases.write, etc.)
   - **Copy the API Key** – you'll need this for `.env.local` as `APPWRITE_API_KEY`
   - ⚠️ **NEVER expose this key in the frontend or commit it to git**

---

## Step 7: Configure Your Local Environment

1. In your project root, copy `.env.example` to `.env.local`:
   ```powershell
   Copy-Item .env.example .env.local
   ```

2. Edit `.env.local` and fill in your values:

   ```env
   # Frontend (browser-safe)
   VITE_API_PROVIDER=appwrite
   VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT=<your-project-id>
   VITE_APPWRITE_DATABASE_ID=<your-database-id>
   VITE_APPWRITE_COL_USERS=users
   VITE_APPWRITE_COL_EVENTS=events
   VITE_APPWRITE_COL_ATTENDANCE=attendance
   VITE_APPWRITE_COL_ANNOUNCEMENTS=announcements
   VITE_APPWRITE_COL_FEEDBACK=feedback
   VITE_APPWRITE_COL_ACCESSLOGS=accessLogs

   # Server-side (migration script only – keep secret!)
   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   APPWRITE_PROJECT=<your-project-id>
   APPWRITE_API_KEY=<your-server-api-key>
   APPWRITE_DATABASE_ID=<your-database-id>
   APPWRITE_COL_USERS=users
   APPWRITE_COL_EVENTS=events
   APPWRITE_COL_ATTENDANCE=attendance
   APPWRITE_COL_ANNOUNCEMENTS=announcements
   APPWRITE_COL_FEEDBACK=feedback
   APPWRITE_COL_ACCESSLOGS=accessLogs

   # Google Sheets (for migration)
   GOOGLE_SHEETS_SPREADSHEET_ID=<your-google-sheets-id>
   GOOGLE_SERVICE_ACCOUNT_JSON_PATH=<path-to-service-account-json>
   # or
   GOOGLE_SERVICE_ACCOUNT_JSON=<json-content-as-single-line>
   ```

3. **Important**: Add `.env.local` to your `.gitignore` if it's not already there

---

## Step 8: Test Your Setup

1. **Start the dev server**:
   ```powershell
   npm run dev
   ```

2. **Test the Events list** (already implemented):
   - Navigate to any screen that shows events
   - If `VITE_API_PROVIDER=appwrite`, the app will fetch from Appwrite
   - Check browser console for any errors

3. **Runtime toggle** (optional, no rebuild needed):
   - Open browser console and run:
     ```js
     localStorage.setItem('apiProvider', 'appwrite'); location.reload();
     ```
   - Switch back to GAS:
     ```js
     localStorage.setItem('apiProvider', 'gas'); location.reload();
     ```

---

## Step 9: Migrate Your Data (Optional)

Once your collections are set up, you can migrate existing data from Google Sheets:

1. **Configure Google API access**:
   - Go to Google Cloud Console
   - Create a Service Account with Sheets API access
   - Download the JSON key file
   - Reference it in `.env.local` as `GOOGLE_SERVICE_ACCOUNT_JSON_PATH`

2. **Run the migration script**:
   ```powershell
   npm run migrate:appwrite
   ```

3. The script will:
   - Read rows from your Google Sheets
   - Transform them to match Appwrite collection schemas
   - Insert/update documents in Appwrite

---

## Security Best Practices

1. **Permissions**:
   - Use role-based permissions (`role:users`, `role:admin`, etc.)
   - Use document-level permissions where users should only access their own data
   - Never use `Any` permission for write operations on sensitive collections

2. **API Keys**:
   - Keep server API keys out of the frontend and version control
   - Use environment variables and secrets management
   - Rotate keys periodically

3. **Authentication**:
   - Implement proper session management
   - Use secure password policies
   - Consider enabling 2FA for admin accounts

4. **Data Validation**:
   - Always validate inputs on the server side
   - Use Appwrite's built-in validation (required fields, data types)
   - Implement additional validation in your app code

---

## Next Steps

1. **Implement more API methods**: Expand `src/services/appwrite/api.ts` to cover all your use cases
2. **Add authentication flow**: Wire up login/logout using Appwrite's Account API
3. **Implement file uploads**: Use Storage API for profile pictures and project images
4. **Add real-time updates**: Use Appwrite Realtime for live data sync
5. **Create Appwrite Functions**: For complex server-side logic (email notifications, scheduled tasks)

---

## Troubleshooting

### "Appwrite events collection not configured"
- Check that `VITE_APPWRITE_DATABASE_ID` and `VITE_APPWRITE_COL_EVENTS` are set in `.env.local`
- Restart your dev server after changing `.env.local`

### "Missing permissions" errors
- Review collection permissions in Appwrite Console
- Ensure your user has the correct role
- Check that you're authenticated (session exists)

### CORS errors
- In Appwrite Console, go to **Settings** > **Platforms**
- Add your development URL (e.g., `http://localhost:5173`)
- Add your production URL (e.g., `https://your-app.vercel.app`)

### Migration script fails
- Verify Google Sheets API credentials
- Check that spreadsheet ID is correct
- Ensure service account has read access to the sheet
- Verify Appwrite API key has necessary scopes

---

## Support and Resources

- **Appwrite Docs**: https://appwrite.io/docs
- **Appwrite Discord**: https://appwrite.io/discord
- **GitHub Issues**: https://github.com/appwrite/appwrite/issues

---

🎉 **You're all set!** Your Appwrite backend is configured and ready to use. Start implementing API methods in `src/services/appwrite/api.ts` and migrate your features incrementally.
