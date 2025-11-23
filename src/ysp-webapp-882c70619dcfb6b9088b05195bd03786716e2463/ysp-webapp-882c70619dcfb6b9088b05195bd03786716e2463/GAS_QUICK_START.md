# 🎯 Quick Reference: GAS Auto-Deployment

## 🚀 One-Command Deployment

```powershell
npm run gas:auto-deploy
```

## 📋 Setup Checklist (One-Time)

Run verification first:
```powershell
.\verify-gas-setup.ps1
```

Then complete these steps:

### ✅ 1. Enable Apps Script API
- **Link:** https://console.cloud.google.com/apis/library/script.googleapis.com
- **Action:** Click "ENABLE"

### ✅ 2. Share GAS Project
- **Link:** https://script.google.com/home/projects/1CEx53zlJZHarkYESoUzbuV3Jj04rA6YKVSpsh1n-sClm_PHjXJyeuSXf/edit
- **Action:** Share → Add `ysp-migrator@ysp-web-app-migration.iam.gserviceaccount.com` as **Editor**

## 📝 Typical Workflow

```powershell
# 1. Edit code in VS Code (YSP_LoginAccess.gs)

# 2. Deploy automatically
npm run gas:auto-deploy

# 3. Open the link from output and click:
#    Deploy → Manage deployments → Edit → New version → Deploy

# 4. Test
.\test-feedback-init.ps1
```

## 🔥 Why This is Better Than Manual

| Task | Manual | Auto-Deploy |
|------|--------|-------------|
| Copy code | 30 sec | 0 sec |
| Paste code | 30 sec | 0 sec |
| Save | 5 sec | 0 sec |
| **Total** | **65 sec** | **10 sec** |

**Time saved per deployment:** 55 seconds ⏱️

## 🎓 Learn More

See: `GAS_AUTO_DEPLOY_GUIDE.md` for full documentation
