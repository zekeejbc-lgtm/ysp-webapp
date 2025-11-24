Build Homepage Layout (Copy) (Copy) (Copy)

This folder is a Vite-based frontend for the YSP webapp (UI). The file `package.json` defines build scripts. This document explains how to push this project to GitHub and deploy to Vercel.

Quick local build

1. Install dependencies:

```powershell
npm install
```

2. Build for production:

```powershell
npm run build
```

Produced build folder: `build/` (configured in `vite.config.ts`).

Prepare & push to GitHub

1. Initialize git (if repository not already initialized):

```powershell
cd "c:\Users\cathl\Downloads\Build Homepage Layout (Copy) (Copy) (Copy)"
# Initialize if needed
git init
# Stage files
git add .
# Commit
git commit -m "chore: prepare frontend for deployment"
```

2. Create a GitHub repo (choose one):
- Use the GitHub UI: https://github.com/new
- Or use GitHub CLI (if installed):

```powershell
gh repo create <USERNAME>/<REPO_NAME> --public --source=. --remote=origin --push
```

3. If you created the repo manually, add remote and push:

```powershell
git remote add origin https://github.com/<USERNAME>/<REPO_NAME>.git
git branch -M main
git push -u origin main
```

Deploy to Vercel (two options)

Option A — Vercel Dashboard (recommended):
- Go to https://vercel.com and sign in.
- Import Project -> Select your GitHub repository -> Set Build Command to `npm run build` and Output Directory to `build` -> Deploy.

Option B — Vercel CLI:

```powershell
npm i -g vercel
cd "c:\Users\cathl\Downloads\Build Homepage Layout (Copy) (Copy) (Copy)"
vercel login
vercel --prod
```

Notes
- If your project uses environment variables or needs special build settings, configure them in the Vercel dashboard under Project Settings -> Environment Variables.
- This project already includes a `vercel.json` and `vite.config.ts` — confirm the Output Directory (`build`) matches the Vercel settings.

If you want, I can attempt to create a local commit now and guide or run the steps to push to GitHub and trigger a Vercel deploy (I will need the GitHub repo URL or a token/`gh` access to perform remote creation/push).