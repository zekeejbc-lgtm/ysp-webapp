# Automatic Deployment Workflow

## 🚀 How Vercel Auto-Deploy Works

Your repository is connected to Vercel, which means:

✅ **Every push to `main` branch** → Automatic deployment to production  
✅ **Every push to other branches** → Preview deployment  
✅ **Every pull request** → Preview deployment with unique URL  

## 📝 Standard Workflow

Whenever you make changes to the frontend:

```bash
# 1. Stage all changes
git add .

# 2. Commit with descriptive message
git commit -m "feat: describe your changes"

# 3. Push to GitHub (triggers Vercel deployment)
git push origin main
```

## ⚡ Quick Commands

### Option 1: Add, Commit, and Push All Changes
```powershell
git add . ; git commit -m "update: frontend changes" ; git push origin main
```

### Option 2: Add Specific Files
```powershell
git add src/components/MyComponent.tsx ; git commit -m "fix: update MyComponent" ; git push origin main
```

### Option 3: Quick Update (shorter)
```powershell
git add . ; git commit -m "update" ; git push
```

## 🔍 Check Deployment Status

1. **Vercel Dashboard**: https://vercel.com/dashboard
2. **GitHub Actions** (if configured): https://github.com/zekeejbc-lgtm/ysp-webapp/actions
3. **Vercel CLI** (if installed):
   ```bash
   vercel list
   ```

## 📊 Deployment Timeline

```
Code Change → Git Push → GitHub → Vercel Detects → Build → Deploy
              (instant)  (instant) (~1-3 min)      (~30s)
```

Typical deployment time: **2-4 minutes**

## 🎯 Best Practices

### Commit Message Format
```
type: description

Examples:
feat: add new attendance feature
fix: resolve login button issue
update: improve AccessLogs UI
docs: update README
style: format code
refactor: reorganize API service
```

### Before Pushing
```powershell
# Check what will be committed
git status

# Review changes
git diff

# Test locally first
npm run dev
```

## 🔧 Vercel Configuration

Your project uses these files for deployment:

- **`vercel.json`** - Vercel configuration
- **`package.json`** - Dependencies and build scripts
- **`vite.config.ts`** - Build configuration

## 🚨 If Deployment Fails

1. Check Vercel dashboard for error logs
2. Verify build locally:
   ```bash
   npm run build
   ```
3. Check for TypeScript errors:
   ```bash
   npm run type-check
   ```
4. Review Vercel deployment logs

## 📱 Current Deployment

- **Production URL**: https://ysp-webapp.vercel.app
- **Repository**: https://github.com/zekeejbc-lgtm/ysp-webapp
- **Branch**: main

## 💡 Pro Tips

1. **Commit often** with small, focused changes
2. **Use descriptive messages** so you can track changes
3. **Test locally** before pushing
4. **Check Vercel dashboard** after pushing to confirm deployment
5. **Use branches** for experimental features

## 🔄 Typical Development Cycle

```
1. Make changes to code
2. Test locally (npm run dev)
3. Fix any errors
4. git add .
5. git commit -m "descriptive message"
6. git push origin main
7. Check Vercel dashboard
8. Verify deployment at production URL
```

---

**Remember**: Every push to `main` automatically deploys to production! 🚀
