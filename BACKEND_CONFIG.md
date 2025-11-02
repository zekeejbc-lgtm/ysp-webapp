# YSP Backend Configuration Reference

## 🔗 Google Apps Script Details

### Script ID
```
1CEx53zlJZHarkYESoUzbuV3Jj04rA6YKVSpsh1n-sClm_PHjXJyeuSXf
```

### Deployment ID
```
AKfycbwJ5DdUuS5k__U6z2fle19wBNRgDO2gVG9KmKt7csuq3nzHxldpwvtl0Vcs54en_vRrVw
```

### Web App URL (Direct)
```
https://script.google.com/macros/s/AKfycbwJ5DdUuS5k__U6z2fle19wBNRgDO2gVG9KmKt7csuq3nzHxldpwvtl0Vcs54en_vRrVw/exec
```

## 📊 Google Sheets

### Main Spreadsheet ID
```
1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU
```

### Sheets in Spreadsheet
- **User Profiles** - User authentication data
- **Access Logs** - Login/access records
- **Logging Debug** - Debug information for access logging

## 🔧 Frontend Configuration

### API Proxy (Vercel)
```
/api/gas-proxy
```

### Where to Update URLs

1. **Frontend API Service**: `src/services/api.ts`
   ```typescript
   const API_CONFIG = {
     baseURL: '/api/gas-proxy',
     backend: {
       scriptId: '1CEx53zlJZHarkYESoUzbuV3Jj04rA6YKVSpsh1n-sClm_PHjXJyeuSXf',
  deploymentId: 'AKfycbwJ5DdUuS5k__U6z2fle19wBNRgDO2gVG9KmKt7csuq3nzHxldpwvtl0Vcs54en_vRrVw',
  webAppUrl: 'https://script.google.com/macros/s/AKfycbwJ5DdUuS5k__U6z2fle19wBNRgDO2gVG9KmKt7csuq3nzHxldpwvtl0Vcs54en_vRrVw/exec',
     },
   };
   ```

2. **Vercel Proxy**: `api/gas-proxy.js`
   ```javascript
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbwJ5DdUuS5k__U6z2fle19wBNRgDO2gVG9KmKt7csuq3nzHxldpwvtl0Vcs54en_vRrVw/exec';
   ```

## 📝 Backend Actions

The Google Apps Script handles these actions:

| Action | Description | Handler Function |
|--------|-------------|------------------|
| `login` | User authentication | `handleLogin()` |
| `guestLogin` | Guest access | `handleGuestLogin()` |
| `getAccessLogs` | Fetch access logs | `handleGetAccessLogs()` |

## 🔄 Deployment Workflow

### When Backend Changes:

1. Edit your Google Apps Script
2. Click **Deploy** → **Manage deployments**
3. Edit existing deployment → **New version**
4. Click **Deploy**
5. **No need to change frontend** - URLs stay the same!

### When Frontend Changes:

1. Make changes to components
2. Commit to Git
3. Vercel auto-deploys
4. **No need to touch backend**

### When You Need a New Deployment ID:

1. Create new deployment in Google Apps Script
2. Copy new Deployment ID
3. Update in **TWO places**:
   - `src/services/api.ts` → `API_CONFIG.backend.deploymentId`
   - `api/gas-proxy.js` → `GAS_URL`

## 🔒 Security Notes

- ✅ All requests go through Vercel proxy (`/api/gas-proxy`)
- ✅ Avoids CORS issues
- ✅ Hides direct Google Apps Script URL from browser
- ✅ Can add rate limiting/authentication at proxy level

## 🧪 Testing

### Test Backend Directly:
```bash
curl -X POST "https://script.google.com/macros/s/AKfycbwJ5DdUuS5k__U6z2fle19wBNRgDO2gVG9KmKt7csuq3nzHxldpwvtl0Vcs54en_vRrVw/exec" \
  -H "Content-Type: application/json" \
  -d '{"action":"login","username":"test","password":"test"}'
```

### Test Through Proxy (Local):
```bash
curl -X POST "http://localhost:3000/api/gas-proxy" \
  -H "Content-Type: application/json" \
  -d '{"action":"login","username":"test","password":"test"}'
```

### Test Through Proxy (Production):
```bash
curl -X POST "https://ysp-webapp.vercel.app/api/gas-proxy" \
  -H "Content-Type: application/json" \
  -d '{"action":"login","username":"test","password":"test"}'
```

## 📚 Quick Links

- [Google Apps Script Editor](https://script.google.com/home/projects/1CEx53zlJZHarkYESoUzbuV3Jj04rA6YKVSpsh1n-sClm_PHjXJyeuSXf/edit)
- [Google Spreadsheet](https://docs.google.com/spreadsheets/d/1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU/edit)
- [Vercel Dashboard](https://vercel.com/dashboard)

---

**Last Updated**: October 28, 2025
