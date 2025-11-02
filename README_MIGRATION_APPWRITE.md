# Appwrite migration: run it in parallel without breaking production

You can keep the current Google Apps Script (GAS) backend running for the live app while you build the Appwrite backend in the same repository. No new repo is required. The frontend can switch providers with a single env flag.

## Provider switch (frontend)

- Default provider is `gas` (your current production backend). Nothing changes unless you opt-in.
- To try Appwrite in development only, create `.env.local` in the project root and set:

```env
VITE_API_PROVIDER=appwrite
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT=YOUR_PROJECT_ID
VITE_APPWRITE_DATABASE_ID=YOUR_DATABASE_ID
VITE_APPWRITE_COL_USERS=...
VITE_APPWRITE_COL_EVENTS=...
VITE_APPWRITE_COL_ATTENDANCE=...
VITE_APPWRITE_COL_ANNOUNCEMENTS=...
VITE_APPWRITE_COL_FEEDBACK=...
VITE_APPWRITE_COL_ACCESSLOGS=...
```

- Run the dev server and test only the routes you’ve implemented in `src/services/appwrite/api.ts`.
- Set `VITE_API_PROVIDER=gas` (or remove the file) to go back to production behavior.

## What’s already wired for you

- `src/services/api.ts` now checks `VITE_API_PROVIDER`. When `appwrite`, it forwards calls to `src/services/appwrite/api.ts`. Otherwise, it uses GAS (`/api/gas-proxy`).
- `src/services/appwrite/api.ts` mirrors your existing API surface. Each method currently throws a “not configured” error—fill these in gradually as you build out Appwrite.
- `.env.example` includes both frontend and migration (server-side) environment keys.
- A migration scaffold lives at `scripts/migrate/migrate-to-appwrite.js`.

## Minimal first test (Events list)

Goal: implement a simple Appwrite read for Events so you can flip the provider locally and validate end‑to‑end.

1) In Appwrite console
	 - Create a Database (note its ID).
	 - Create a Collection named `events` (note its ID) with permissions that allow read access for your test user.
	 - Add attributes:
		 - `name` (string, required)
		 - `date` (string or datetime; pick one and keep consistent)
		 - `status` (string, default "Active")
	 - Add a few documents with those fields.

2) Local env
	 - Copy `.env.example` to `.env.local` if you haven't.
	 - Set:
		 - `VITE_API_PROVIDER=appwrite`
		 - `VITE_APPWRITE_ENDPOINT` and `VITE_APPWRITE_PROJECT`
		 - `VITE_APPWRITE_DATABASE_ID`
		 - `VITE_APPWRITE_COL_EVENTS` (the collection ID you created)

3) Install browser SDK (one-time):

```powershell
npm install appwrite
```

4) Run the app and navigate to a screen that lists events. The call will be routed to Appwrite and should show your documents.

5) Switch back to GAS any time by setting `VITE_API_PROVIDER=gas` or using the runtime toggle below.

## Migration scaffold (server-side)

This script reads rows from Google Sheets and writes to Appwrite.

1) Copy env template and fill server-only values:

```powershell
Copy-Item .env.example .env.local
# Edit .env.local and fill APPWRITE_* and GOOGLE_* values
```

2) Install runtime dependencies for the migration (one-time):

```powershell
npm install --save-dev dotenv googleapis node-appwrite
```

3) Run the migration script:

```powershell
npm run migrate:appwrite
```

Notes:
- Start with read-only resources (e.g., users) and verify document shapes.
- Add more stages (events, attendance, announcements, feedback) as you go.
- Prefer unique indexes in Appwrite (e.g., `idCode`) and implement upsert logic.

### Optional: runtime provider toggle (no rebuild)

For quick A/B testing without rebuilding, you can override the provider at runtime in your browser console:

```js
// Switch to Appwrite
localStorage.setItem('apiProvider', 'appwrite'); location.reload();

// Switch back to GAS
localStorage.setItem('apiProvider', 'gas'); location.reload();

// Clear override (falls back to VITE_API_PROVIDER)
localStorage.removeItem('apiProvider'); location.reload();
```

## Recommended rollout

- Phase 1 (read-only): Implement Appwrite reads for a small slice (e.g., announcements list) and switch `VITE_API_PROVIDER=appwrite` only in your local `.env.local`. Validate the UI behaves correctly.
- Phase 2 (dual-reads, shadow-writes): Keep using GAS for writes; perform Appwrite writes in parallel on the backend (or a dev branch) for a subset of actions. Compare results.
- Phase 3 (feature flags): Turn on Appwrite for a subset of users or environment (e.g., a dev Vercel preview) via `VITE_API_PROVIDER`.
- Phase 4 (cutover): Switch provider to Appwrite in production when confidence is high.

## FAQ

- Do we need a new repo? No. The provider flag isolates new backend code and keeps the current app stable.
- Will adding Appwrite break the build? The Appwrite code path is loaded on demand behind the flag. If you plan to use it, install the frontend SDK (`appwrite`) later when you implement the first method, or keep it installed from the start.
- How do we avoid PII leakage in the frontend? Keep admin credentials out of the browser. Use the browser SDK for end-user auth and reads; use server-side (Node) keys only in scripts or serverless functions.

## Where to implement first

- `src/services/appwrite/api.ts`: Fill in the easiest reads (e.g., `homepageAPI.getContent`) using your Appwrite collections. Keep the return types the same as `src/services/api.ts` for a drop-in swap.
- Create or script your database schema (IDs, permissions, indexes) for reproducibility.
