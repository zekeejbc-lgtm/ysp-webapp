# YSP Google Sheets → Supabase Migration

Automated migration tool to transfer data from Google Sheets (via GAS backend) to Supabase PostgreSQL database.

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase project created
- Google Apps Script backend deployed

## 🚀 Quick Start

### 1. Install Dependencies

```powershell
cd migration
npm install
```

### 2. Configure Environment

Edit `.env` file with your credentials (already configured):

```env
SUPABASE_URL=https://diwxloravcpddzyaufnf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GAS_URL=https://script.google.com/.../exec
```

### 3. Create Database Schema

Run the schema SQL in Supabase SQL Editor:

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase-schema.sql`
3. Execute

Or via CLI:
```powershell
# Install Supabase CLI: https://supabase.com/docs/guides/cli
supabase db push --db-url "postgresql://postgres:[password]@db.diwxloravcpddzyaufnf.supabase.co:5432/postgres" --file supabase-schema.sql
```

### 4. Run Migration

**Dry Run (test without inserting):**
```powershell
npm run migrate:dry-run
```

**Migrate All Tables:**
```powershell
npm run migrate
```

**Migrate Specific Table:**
```powershell
npm run migrate:users        # User profiles only
npm run migrate:events       # Events only
npm run migrate:announcements
```

**Custom Options:**
```powershell
node migrate.js --table=feedback --batch-size=100
```

## 📊 Migration Coverage

| Table | Status | Source | Notes |
|-------|--------|--------|-------|
| `user_profiles` | ✅ Ready | searchProfiles API | Migrates all user data |
| `events` | ✅ Ready | getEvents API | Event metadata from Master Attendance Log |
| `access_logs` | ✅ Ready | getAccessLogs API | Login/access history |
| `announcements` | ✅ Ready | getAnnouncements API | All announcements |
| `feedback` | ✅ Ready | getFeedback API | Feedback entries |
| `homepage_content` | ✅ Ready | getHomepageContent API | Key-value homepage data |
| `attendance_records` | ⚠️ Needs GAS | - | Requires custom GAS endpoint for attendance parsing |
| `announcement_read_status` | ⚠️ Needs GAS | - | Requires custom GAS endpoint for read status |
| `donations` | ⚠️ Needs GAS | - | Requires custom GAS endpoint |
| `donation_campaigns` | ⚠️ Needs GAS | - | Requires custom GAS endpoint |
| `polls` | ⚠️ Needs GAS | - | Requires custom GAS endpoint |
| `poll_responses` | ⚠️ Needs GAS | - | Requires custom GAS endpoint |

## 🔐 Security Notes

- **Service Role Key**: Used for migration to bypass Row Level Security (RLS)
- **RLS Enabled**: All tables have RLS enabled; configure policies in Supabase Dashboard
- **Password Hashing**: Passwords are stored as plain text in sheets. Migration script leaves `password_hash` empty. Implement hashing before production use.

## 📝 Post-Migration Tasks

### 1. Update User Passwords
```sql
-- Example: Hash passwords using pgcrypto
UPDATE user_profiles
SET password_hash = crypt(password_plain, gen_salt('bf'))
WHERE password_hash IS NULL OR password_hash = '';
```

### 2. Verify Row Counts
```sql
SELECT 
  'user_profiles' as table_name, COUNT(*) as rows FROM user_profiles
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'access_logs', COUNT(*) FROM access_logs
UNION ALL
SELECT 'announcements', COUNT(*) FROM announcements
UNION ALL
SELECT 'feedback', COUNT(*) FROM feedback
UNION ALL
SELECT 'homepage_content', COUNT(*) FROM homepage_content;
```

### 3. Configure RLS Policies

Edit policies in `supabase-schema.sql` or via Supabase Dashboard → Authentication → Policies.

Example policy:
```sql
-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = id::text);
```

### 4. Link Foreign Keys

```sql
-- Link access_logs to user_profiles
UPDATE access_logs al
SET user_id = up.id
FROM user_profiles up
WHERE al.id_code = up.id_code;
```

## 🛠️ Troubleshooting

### Migration Fails with "fetch is not defined"
- Ensure Node.js 18+ is installed (fetch is built-in)
- Or add: `import fetch from 'node-fetch';`

### Rate Limiting Errors
- Increase sleep delay in `migrate.js`:
  ```js
  await sleep(1000); // 1 second between batches
  ```

### Duplicate Key Errors
- Migration script uses `onConflict` to skip duplicates
- Check Supabase logs for specific conflicts

### Missing Data
- Verify GAS backend returns expected data:
  ```powershell
  curl -X POST https://script.google.com/.../exec `
    -H "Content-Type: application/json" `
    -d '{"action":"getEvents"}'
  ```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)

## 🤝 Support

For issues or questions:
1. Check migration logs in console
2. Verify Supabase Dashboard → Logs
3. Test GAS endpoints manually (see `OPERATIONS_GUIDE.md`)

---

**Migration Tool Version:** 1.0.0  
**Last Updated:** November 16, 2025
