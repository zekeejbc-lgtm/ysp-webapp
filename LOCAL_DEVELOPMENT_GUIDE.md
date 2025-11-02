# 🏠 Local Development Guide

This guide explains how to run the YSP Web App locally for testing new features without affecting the live Vercel deployment.

---

## ✅ **What This Setup Does:**

- **Frontend**: Runs on your computer at `http://localhost:3000`
- **Backend**: Uses the real production Google Apps Script
- **Production**: Users continue to see the Vercel version (unaffected)
- **Safety**: Your local changes are never deployed until you push to GitHub

---

## 🚀 **Getting Started**

### **1. Install Dependencies** (One-time setup)

Open PowerShell in the project folder and run:

```powershell
npm install
```

This installs all required packages.

---

### **2. Start Development Server**

```powershell
npm run dev
```

**What happens:**
- Vite starts a local development server
- Automatically opens `http://localhost:3000` in your browser
- Hot reload: code changes appear instantly (no refresh needed!)
- Console shows all API requests and responses

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
➜  press h + enter to show help
```

---

### **3. Testing Your Changes**

**Every change you make is instant:**
1. Edit any `.tsx`, `.ts`, or `.css` file
2. Save the file (Ctrl+S)
3. Browser updates automatically in <1 second
4. No need to refresh!

**View Console Logs:**
- Open Chrome DevTools (F12)
- See network requests, errors, and logs
- All API calls are visible with request/response data

---

## 🔍 **How Local Testing Works**

```
Your Browser (localhost:3000)
    ↓
Vite Dev Server (your computer)
    ↓
Proxy: /api/gas-proxy
    ↓
Google Apps Script (production backend)
    ↓
Google Sheets (real data!)
```

**Key Points:**
✅ You test with **real production data**  
✅ Changes stay on **your computer only**  
✅ Other users see **Vercel version** (unchanged)  
✅ Backend API serves **both** simultaneously  

---

## 📝 **Development Workflow**

### **Recommended Process:**

1. **Start Dev Server**
   ```powershell
   npm run dev
   ```

2. **Make Changes**
   - Edit components in `src/components/`
   - Add new features
   - Fix bugs
   - Test thoroughly

3. **Test Everything**
   - Try all features
   - Test in light and dark mode
   - Test different user roles
   - Check mobile view (DevTools responsive mode)

4. **When Ready to Deploy:**
   ```powershell
   git add .
   git commit -m "feat: your feature description"
   git push origin main
   ```

5. **Vercel Auto-Deploys**
   - Vercel detects the push
   - Automatically builds and deploys
   - Live in ~2 minutes

---

## 🛠️ **Useful Commands**

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start local development server |
| `npm run build` | Build for production (test build locally) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Check for code errors |

---

## 🐛 **Troubleshooting**

### **Port Already in Use**

**Error:**
```
Port 3000 is already in use
```

**Solution:**
Edit `vite.config.ts` and change the port:
```typescript
server: {
  port: 3001, // Change to any available port
  // ...
}
```

---

### **API Requests Failing**

**Symptoms:**
- Network errors in console
- "Failed to fetch" messages
- 500 errors

**Check:**
1. Is your internet connected?
2. Is Google Apps Script deployed and accessible?
3. Check browser console for detailed error messages

**Verify Backend:**
Open this URL directly in browser:
```
https://script.google.com/macros/s/AKfycbwJ5DdUuS5k__U6z2fle19wBNRgDO2gVG9KmKt7csuq3nzHxldpwvtl0Vcs54en_vRrVw/exec
```

Should return an error (expected), but confirms it's accessible.

---

### **Changes Not Appearing**

**Solutions:**
1. **Hard Refresh:** Ctrl+Shift+R (clears browser cache)
2. **Clear Vite Cache:**
   ```powershell
   Remove-Item -Recurse -Force node_modules\.vite
   npm run dev
   ```
3. **Restart Dev Server:** Ctrl+C to stop, then `npm run dev` again

---

### **TypeScript Errors**

**Error:**
```
Type 'X' is not assignable to type 'Y'
```

**Check:**
1. Run `npm run build` to see all TypeScript errors
2. Fix type mismatches
3. Add type annotations where needed

---

## 🎯 **Testing Checklist**

Before pushing to production, verify:

- [ ] All pages load without errors
- [ ] Login works for all user types (Admin, Auditor, Head, Member, Guest)
- [ ] Light mode and dark mode both work
- [ ] Mobile view works (responsive design)
- [ ] No console errors in browser DevTools
- [ ] All buttons are visible and clickable
- [ ] Forms submit correctly
- [ ] Data loads and displays properly
- [ ] Role-based access control works
- [ ] Logout works correctly

---

## 🔐 **Security Notes**

**Safe to Do Locally:**
✅ Test with real data  
✅ Make API calls  
✅ Create/edit/delete test records  
✅ Test all user roles  

**Be Careful:**
⚠️ Don't delete important production data  
⚠️ Test with test accounts, not real users  
⚠️ Be mindful of rate limits on Google Apps Script  

---

## 📊 **Performance Monitoring**

**Watch These Metrics:**

**In Browser DevTools → Network Tab:**
- API request times (should be <1 second)
- Bundle sizes (main.js, vendor.js)
- Total page load time

**In Console:**
- `[DEV]` logs show proxy requests
- Response times logged
- Error messages visible

---

## 🚀 **When Ready for Production**

**Final Steps:**

1. **Test Build Locally:**
   ```powershell
   npm run build
   npm run preview
   ```
   Opens at `http://localhost:4173` (production-like build)

2. **Verify Production Build:**
   - Test all features again
   - Check file sizes (should be optimized)
   - Verify no build errors

3. **Deploy:**
   ```powershell
   git add .
   git commit -m "feat: your changes"
   git push origin main
   ```

4. **Monitor Vercel:**
   - Watch deployment logs
   - Verify build succeeds
   - Test live site after deployment

---

## 💡 **Pro Tips**

### **Multiple Terminal Windows**

Keep these terminals open:
- **Terminal 1:** Dev server (`npm run dev`)
- **Terminal 2:** Git commands
- **Terminal 3:** Any other commands

### **VS Code Extensions**

Recommended extensions:
- **ES7+ React/Redux/React-Native snippets**
- **Prettier** (code formatting)
- **ESLint** (error detection)
- **Tailwind CSS IntelliSense**

### **Browser DevTools**

Essential tabs:
- **Console:** See logs and errors
- **Network:** Monitor API calls
- **Application → Local Storage:** Check saved data
- **Lighthouse:** Performance audits

---

## 🆘 **Need Help?**

Common issues and solutions above should cover most scenarios. If you encounter something else:

1. Check browser console for errors
2. Check terminal for build errors
3. Try restarting dev server
4. Clear all caches and restart
5. Check if issue exists in production (Vercel) too

---

**Happy Coding! 🎉**

*Last Updated: October 30, 2025*
