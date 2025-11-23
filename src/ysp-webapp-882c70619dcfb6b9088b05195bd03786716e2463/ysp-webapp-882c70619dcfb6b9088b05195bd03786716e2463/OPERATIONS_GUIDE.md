# Operations Guide: Age = f(Date of Birth)

This guide explains how to deploy and operate the daily age recalculation feature. It ensures Age (Column F) is always derived from Date of Birth (Column E) and cannot be edited directly.

## Preconditions
- Backend: This repository’s `YSP_LoginAccess.gs` is deployed to your Google Apps Script project connected to the sheets listed in `SHEETS`.
- Sheet structure: `User Profiles` sheet has:
  - Date of Birth in Column E
  - Age in Column F (derived)
  - ID Code in Column S
  - Role in Column U
- Timezone: Asia/Manila preferred (see below).

## What was added
- Server automatically computes Age when a profile is updated.
- A batch job `recalcAllAges()` that recomputes all ages from DOB.
- A daily trigger installer `installDailyAgeRecalcTrigger()` that runs at 00:05 Asia/Manila.
- Two secured API actions (Auditor-only):
  - `recalcAgesNow` — manually run a full recompute
  - `installAgeRecalcTrigger` — install the time-driven trigger

## One-time backend deployment
1) Open Google Apps Script for your backend project that serves the web app endpoint.
2) Replace/update its contents with the latest `YSP_LoginAccess.gs` from this repo (including the new utilities and routes listed above).
3) Save the project; set Project Settings → Time zone to “Asia/Manila”.
4) Deploy as a new version (if you use a Web App deployment) or keep latest for the bound script.

## Preparing the sheet (optional but recommended)
- In `User Profiles`, optionally clear Column F (Age) values for all rows (keep header). This is not strictly required because the batch recompute overwrites mismatches, but clearing makes it obvious that ages are derived.

## Initialize: seed ages and install the trigger
You have two choices to run these steps.

A) From Apps Script editor (process control)
- Run `recalcAllAges()` once.
- Run `installDailyAgeRecalcTrigger()` once. Confirm the new trigger appears in Triggers (clock icon) as a daily 00:05 run. This approach relies on who can open/run the Apps Script and is the simplest to keep Auditor-only by controlling project access.

B) From the Web App (Auditor-only API)
- Call POST action `recalcAgesNow` with payload `{ action: "recalcAgesNow", idCode: "<Auditor ID Code>" }`.
- Call POST action `installAgeRecalcTrigger` with payload `{ action: "installAgeRecalcTrigger", idCode: "<Auditor ID Code>" }`.
- Both endpoints verify the caller’s role via the `User Profiles` sheet. Only a user with Role = `Auditor` will be allowed.

Note: If you don’t need in-app control, prefer method (A) and manage access by sharing Apps Script only with the Auditor account.

## Ongoing operations
- The trigger runs daily at 00:05 Asia/Manila and recomputes all ages.
- If you ever update DOB for a user, age is recalculated on save, and the change email includes Age only if DOB actually changed.

## Verification checklist
- After running initial recompute: pick a few users and confirm Column F matches the DOB and their birthdays relative to today.
- Change one test user’s DOB in the web app → Save:
  - Age updates in the sheet
  - The profile update email includes DOB and Age only if DOB changed
- Check Triggers page in Apps Script: confirm a daily entry exists for `recalcAllAges` at 00:05.

## Access policy: Auditor-only
- If using the API, `recalcAgesNow` and `installAgeRecalcTrigger` require an `idCode` whose Role in `User Profiles` (Column U) is exactly `Auditor`.
- If using the Apps Script editor, share project access only with the Auditor account so only they can run the installer.

## Troubleshooting
- No changes applied: Make sure `User Profiles` sheet name matches, and DOB is a valid date. Re-run `recalcAllAges()`.
- Timezone mismatches: Ensure Project Settings → Time zone is set to “Asia/Manila”.
- Trigger missing or duplicate: Re-run `installDailyAgeRecalcTrigger()`. It removes older trigger(s) for the same handler and installs a fresh one at 00:05.
- Role not recognized: Confirm the Auditor’s `idCode` and that Role in Column U is `Auditor`.

## Notes
- The recompute is idempotent and updates only when the computed value differs from the sheet value.
- Age cells write numeric values when available; otherwise empty if DOB can’t be parsed.
