// ============================================================================
// Setup_Sheet_Mappings.gs
// Applies the sheet structure defined in SUGGEST_MAPPINGS.md to your Spreadsheet
// - Idempotent: safe to run multiple times
// - Preserves existing data and columns
// - Does NOT rename or delete columns; only adds missing headers at the end
// - Detects existing sheets by multiple candidate names (space/underscore variants)
// - Logs a detailed summary of actions taken
// ============================================================================

/** Entry point: apply all suggested mappings */
function applySuggestedMappings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const changes = [];

  changes.push(ensureUserProfiles(ss));
  changes.push(ensureAccessLogs(ss));
  changes.push(ensureMasterAttendanceLog(ss));
  changes.push(ensureEventsControl(ss));
  changes.push(ensureAnnouncements(ss));
  changes.push(ensureFeedback(ss));
  changes.push(ensureHomepageContent(ss));
  changes.push(ensureHomepageProjects(ss));
  changes.push(ensureDonations(ss));
  changes.push(ensureDonationCampaigns(ss));
  changes.push(ensureDonationSettings(ss));
  changes.push(ensureMemberApplications(ss));
  changes.push(ensurePolls(ss));
  changes.push(ensurePollQuestions(ss));
  changes.push(ensurePollResponses(ss));

  logChangeSummary(changes);
}

/** Dry-run: log what would be changed without applying headers */
function dryRunSuggestedMappings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const previews = [];
  previews.push(previewHeaders(ss, ["User Profiles", "User_Profiles"], userProfilesHeaders()));
  previews.push(previewHeaders(ss, ["Access Logs", "Access_Logs"], accessLogsHeaders()));
  previews.push(previewHeaders(ss, ["Master Attendance Log", "Master_Attendance_Log"], masterAttendanceHeadersFixed()));
  previews.push(previewHeaders(ss, ["Events Control", "Events_Control"], eventsControlHeaders()));
  previews.push(previewHeaders(ss, ["Announcements"], announcementsHeadersFixed()));
  previews.push(previewHeaders(ss, ["Feedback"], feedbackHeaders()));
  previews.push(previewHeaders(ss, ["Homepage_Content"], homepageContentHeaders()));
  previews.push(previewHeaders(ss, ["Homepage_Projects"], homepageProjectsHeaders()));
  previews.push(previewHeaders(ss, ["Donations"], donationsHeaders()));
  previews.push(previewHeaders(ss, ["Donation_Campaigns"], donationCampaignsHeaders()));
  previews.push(previewHeaders(ss, ["Donation_Settings"], donationSettingsHeaders()));
  previews.push(previewHeaders(ss, ["Member_Applications"], memberApplicationsHeaders()));
  previews.push(previewHeaders(ss, ["Polls"], pollsHeaders()));
  previews.push(previewHeaders(ss, ["Poll_Questions"], pollQuestionsHeaders()));
  previews.push(previewHeaders(ss, ["Poll_Responses"], pollResponsesHeaders()));
  Logger.log(JSON.stringify(previews, null, 2));
}

// ========================= Utilities =========================

function ensureSheet(ss, nameCandidates) {
  for (var i = 0; i < nameCandidates.length; i++) {
    var s = ss.getSheetByName(nameCandidates[i]);
    if (s) return { sheet: s, name: nameCandidates[i], created: false, existed: true };
  }
  var newSheet = ss.insertSheet(nameCandidates[0]);
  return { sheet: newSheet, name: nameCandidates[0], created: true, existed: false };
}

function getHeaderRow(sheet) {
  if (sheet.getLastRow() === 0) return [];
  var range = sheet.getRange(1, 1, 1, sheet.getMaxColumns());
  var values = range.getValues()[0];
  // Trim trailing blanks
  while (values.length && (values[values.length - 1] === '' || values[values.length - 1] == null)) {
    values.pop();
  }
  return values.map(function (v) { return (v || '').toString().trim(); });
}

function setMissingHeadersAtEnd(sheet, desiredHeaders) {
  var existing = getHeaderRow(sheet);
  var actions = { added: [], alreadyPresent: [], existingCount: existing.length };

  if (existing.length === 0) {
    // Empty sheet → write all headers starting at A1
    sheet.getRange(1, 1, 1, desiredHeaders.length).setValues([desiredHeaders]);
    actions.added = desiredHeaders.slice();
    return actions;
  }

  // Build a set for quick lookup
  var existingSet = {};
  for (var i = 0; i < existing.length; i++) existingSet[existing[i]] = true;

  var toAppend = [];
  for (var j = 0; j < desiredHeaders.length; j++) {
    var h = desiredHeaders[j];
    if (!h) continue;
    if (existingSet[h]) {
      actions.alreadyPresent.push(h);
    } else {
      toAppend.push(h);
      actions.added.push(h);
    }
  }

  if (toAppend.length > 0) {
    var startCol = existing.length + 1;
    sheet.getRange(1, startCol, 1, toAppend.length).setValues([toAppend]);
  }
  return actions;
}

function previewHeaders(ss, nameCandidates, desiredHeaders) {
  var info = ensureSheet(ss, nameCandidates);
  // Do not actually write in preview; just compare
  var existing = getHeaderRow(info.sheet);
  var missing = desiredHeaders.filter(function (h) { return existing.indexOf(h) === -1; });
  return {
    sheetName: info.name,
    exists: info.existed,
    wouldCreate: !info.existed,
    desiredHeadersCount: desiredHeaders.length,
    existingHeadersCount: existing.length,
    missingCount: missing.length,
    missing
  };
}

function logChangeSummary(changes) {
  Logger.log('===== Apply Suggested Mappings: Summary =====');
  changes.forEach(function (c) {
    Logger.log(JSON.stringify(c, null, 2));
  });
}

// ========================= Audit + Auto-Fix =========================

/**
 * Run a full audit and write a human-readable report to a "Mapping_Audit" sheet.
 * Does not change existing sheets.
 */
function auditMappings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const report = [];

  report.push(auditSheet(ss, ["User Profiles", "User_Profiles"], userProfilesHeaders(), { mode: 'exact' }));
  report.push(auditSheet(ss, ["Access Logs", "Access_Logs"], accessLogsHeaders(), { mode: 'exact' }));
  report.push(auditSheet(ss, ["Master Attendance Log", "Master_Attendance_Log"], masterAttendanceHeadersFixed(), { mode: 'prefix-only' }));
  report.push(auditSheet(ss, ["Events Control", "Events_Control"], eventsControlHeaders(), { mode: 'exact' }));
  report.push(auditSheet(ss, ["Announcements"], announcementsHeadersFixed(), { mode: 'exact' }));
  report.push(auditSheet(ss, ["Feedback"], feedbackHeaders(), { mode: 'exact' }));
  report.push(auditSheet(ss, ["Homepage_Content"], homepageContentHeaders(), { mode: 'exact' }));
  report.push(auditSheet(ss, ["Homepage_Projects"], homepageProjectsHeaders(), { mode: 'exact' }));
  report.push(auditSheet(ss, ["Donations"], donationsHeaders(), { mode: 'exact' }));
  report.push(auditSheet(ss, ["Donation_Campaigns"], donationCampaignsHeaders(), { mode: 'exact' }));
  report.push(auditSheet(ss, ["Donation_Settings"], donationSettingsHeaders(), { mode: 'exact' }));
  report.push(auditSheet(ss, ["Member_Applications"], memberApplicationsHeaders(), { mode: 'exact' }));
  report.push(auditSheet(ss, ["Polls"], pollsHeaders(), { mode: 'exact' }));
  report.push(auditSheet(ss, ["Poll_Questions"], pollQuestionsHeaders(), { mode: 'exact' }));
  report.push(auditSheet(ss, ["Poll_Responses"], pollResponsesHeaders(), { mode: 'exact' }));

  writeAuditSheet(ss, report);
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

/**
 * Audit + auto-fix in one go (with safe backups).
 * options = { reorderColumns: boolean, backupSheets: boolean }
 */
function auditAndFixMappings(options) {
  const cfg = Object.assign({ reorderColumns: true, backupSheets: true }, options || {});
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const actions = [];

  actions.push(fixSheet(ss, ["User Profiles", "User_Profiles"], userProfilesHeaders(), { mode: 'exact' }, cfg));
  actions.push(fixSheet(ss, ["Access Logs", "Access_Logs"], accessLogsHeaders(), { mode: 'exact' }, cfg));
  // Master Attendance: only ensure A–D, never touch event blocks
  actions.push(fixSheet(ss, ["Master Attendance Log", "Master_Attendance_Log"], masterAttendanceHeadersFixed(), { mode: 'prefix-only' }, cfg));
  actions.push(fixSheet(ss, ["Events Control", "Events_Control"], eventsControlHeaders(), { mode: 'exact' }, cfg));
  actions.push(fixSheet(ss, ["Announcements"], announcementsHeadersFixed(), { mode: 'exact' }, cfg));
  actions.push(fixSheet(ss, ["Feedback"], feedbackHeaders(), { mode: 'exact' }, cfg));
  actions.push(fixSheet(ss, ["Homepage_Content"], homepageContentHeaders(), { mode: 'exact' }, cfg));
  actions.push(fixSheet(ss, ["Homepage_Projects"], homepageProjectsHeaders(), { mode: 'exact' }, cfg));
  actions.push(fixSheet(ss, ["Donations"], donationsHeaders(), { mode: 'exact' }, cfg));
  actions.push(fixSheet(ss, ["Donation_Campaigns"], donationCampaignsHeaders(), { mode: 'exact' }, cfg));
  actions.push(fixSheet(ss, ["Donation_Settings"], donationSettingsHeaders(), { mode: 'exact' }, cfg));
  actions.push(fixSheet(ss, ["Member_Applications"], memberApplicationsHeaders(), { mode: 'exact' }, cfg));
  actions.push(fixSheet(ss, ["Polls"], pollsHeaders(), { mode: 'exact' }, cfg));
  actions.push(fixSheet(ss, ["Poll_Questions"], pollQuestionsHeaders(), { mode: 'exact' }, cfg));
  actions.push(fixSheet(ss, ["Poll_Responses"], pollResponsesHeaders(), { mode: 'exact' }, cfg));

  writeAuditSheet(ss, actions);
  Logger.log(JSON.stringify(actions, null, 2));
  return actions;
}

function auditSheet(ss, nameCandidates, desiredHeaders, opts) {
  const mode = (opts && opts.mode) || 'exact';
  const info = ensureSheet(ss, nameCandidates);
  const existing = getHeaderRow(info.sheet);

  // Compute differences
  const missing = desiredHeaders.filter(h => existing.indexOf(h) === -1);
  const extras = existing.filter(h => desiredHeaders.indexOf(h) === -1);
  const outOfOrder = orderDiff(existing, desiredHeaders);

  return {
    sheet: info.name,
    exists: info.existed || info.created,
    created: info.created,
    mode,
    existingCount: existing.length,
    desiredCount: desiredHeaders.length,
    missing,
    extras,
    outOfOrder
  };
}

function fixSheet(ss, nameCandidates, desiredHeaders, opts, cfg) {
  const audit = auditSheet(ss, nameCandidates, desiredHeaders, opts);
  const sheet = ss.getSheetByName(audit.sheet);
  const result = Object.assign({ fixed: false, reheadered: false, reordered: false, backupName: '' }, audit);

  if (!sheet) return result;

  // For prefix-only modes (e.g., Master Attendance Log), just ensure headers A–D exist; do not reorder.
  if (opts && opts.mode === 'prefix-only') {
    const actions = setMissingHeadersAtEnd(sheet, desiredHeaders);
    result.fixed = actions.added && actions.added.length > 0;
    result.reheadered = result.fixed;
    return result;
  }

  // If there are missing headers or out-of-order and reordering is allowed, rebuild header row preserving extras at the end
  if (cfg.reorderColumns && (audit.missing.length > 0 || (audit.outOfOrder && audit.outOfOrder.length > 0))) {
    if (cfg.backupSheets) {
      const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
      const copy = sheet.copyTo(ss);
      copy.setName(audit.sheet + '_backup_' + stamp);
      result.backupName = copy.getName();
    }

    // Read all data first
    const range = sheet.getDataRange();
    const values = range.getValues();
    const existing = values.length > 0 ? values[0].map(v => (v || '').toString().trim()) : [];

    // Build new headers = desired + extras (extras keep their original order)
    const extras = existing.filter(h => desiredHeaders.indexOf(h) === -1 && h);
    const newHeaders = desiredHeaders.concat(extras);

    // Map existing header -> index
    const idx = {};
    for (var i = 0; i < existing.length; i++) {
      if (existing[i]) idx[existing[i]] = i;
    }

    // Recompose rows according to new header order
    const newValues = [];
    newValues.push(newHeaders);
    for (var r = 1; r < values.length; r++) {
      const row = values[r];
      const out = new Array(newHeaders.length);
      for (var c = 0; c < newHeaders.length; c++) {
        const h = newHeaders[c];
        const pos = idx.hasOwnProperty(h) ? idx[h] : -1;
        out[c] = pos >= 0 ? row[pos] : '';
      }
      newValues.push(out);
    }

    // Clear and write back
    sheet.clearContents();
    sheet.getRange(1, 1, newValues.length, newHeaders.length).setValues(newValues);
    result.fixed = true;
    result.reheadered = true;
    result.reordered = true;
    return result;
  }

  // If only missing and not reordering, just append headers
  if (audit.missing.length > 0) {
    const actions = setMissingHeadersAtEnd(sheet, desiredHeaders);
    result.fixed = actions.added && actions.added.length > 0;
    result.reheadered = result.fixed;
  }
  return result;
}

function orderDiff(existing, desired) {
  // Return headers that appear in both but in different order
  const common = desired.filter(h => existing.indexOf(h) !== -1);
  const existingOrder = common.map(h => existing.indexOf(h));
  const isOrdered = existingOrder.every((v, i, a) => i === 0 || a[i - 1] < v);
  return isOrdered ? [] : common;
}

function writeAuditSheet(ss, report) {
  const name = 'Mapping_Audit';
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  sheet.clearContents();
  const headers = ['Sheet','Exists','Created','Mode','Existing Count','Desired Count','Missing','Extras','OutOfOrder','Fixed','Reheadered','Reordered','BackupName'];
  const rows = [headers];
  for (var i = 0; i < report.length; i++) {
    const r = report[i];
    rows.push([
      r.sheet || '',
      r.exists === true,
      r.created === true,
      r.mode || '',
      r.existingCount || 0,
      r.desiredCount || 0,
      (r.missing || []).join(', '),
      (r.extras || []).join(', '),
      (r.outOfOrder || []).join(', '),
      r.fixed === true,
      r.reheadered === true,
      r.reordered === true,
      r.backupName || ''
    ]);
  }
  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);
}

// ========================= Sheet Ensurers =========================

function ensureUserProfiles(ss) {
  var info = ensureSheet(ss, ["User Profiles", "User_Profiles"]);
  var headers = userProfilesHeaders();
  var actions = setMissingHeadersAtEnd(info.sheet, headers);
  return { sheet: info.name, created: info.created, addedHeaders: actions.added, presentHeaders: actions.alreadyPresent };
}

function ensureAccessLogs(ss) {
  var info = ensureSheet(ss, ["Access Logs", "Access_Logs"]);
  var headers = accessLogsHeaders();
  var actions = setMissingHeadersAtEnd(info.sheet, headers);
  return { sheet: info.name, created: info.created, addedHeaders: actions.added, presentHeaders: actions.alreadyPresent };
}

function ensureMasterAttendanceLog(ss) {
  var info = ensureSheet(ss, ["Master Attendance Log", "Master_Attendance_Log"]);
  // Only ensure fixed A–D headers; do NOT touch event blocks
  var headers = masterAttendanceHeadersFixed();
  var actions = setMissingHeadersAtEnd(info.sheet, headers);
  return { sheet: info.name, created: info.created, addedHeaders: actions.added, presentHeaders: actions.alreadyPresent, note: "Event blocks unchanged" };
}

function ensureEventsControl(ss) {
  var info = ensureSheet(ss, ["Events Control", "Events_Control"]);
  var headers = eventsControlHeaders();
  var actions = setMissingHeadersAtEnd(info.sheet, headers);
  return { sheet: info.name, created: info.created, addedHeaders: actions.added, presentHeaders: actions.alreadyPresent };
}

function ensureAnnouncements(ss) {
  var info = ensureSheet(ss, ["Announcements"]);
  var headers = announcementsHeadersFixed();
  var actions = setMissingHeadersAtEnd(info.sheet, headers);
  return { sheet: info.name, created: info.created, addedHeaders: actions.added, presentHeaders: actions.alreadyPresent, note: "Dynamic status columns (U→) not auto-created" };
}

function ensureFeedback(ss) {
  var info = ensureSheet(ss, ["Feedback"]);
  var headers = feedbackHeaders();
  var actions = setMissingHeadersAtEnd(info.sheet, headers);
  return { sheet: info.name, created: info.created, addedHeaders: actions.added, presentHeaders: actions.alreadyPresent };
}

function ensureHomepageContent(ss) {
  var info = ensureSheet(ss, ["Homepage_Content"]);
  var headers = homepageContentHeaders();
  var actions = setMissingHeadersAtEnd(info.sheet, headers);
  return { sheet: info.name, created: info.created, addedHeaders: actions.added, presentHeaders: actions.alreadyPresent };
}

function ensureHomepageProjects(ss) {
  var info = ensureSheet(ss, ["Homepage_Projects"]);
  var headers = homepageProjectsHeaders();
  var actions = setMissingHeadersAtEnd(info.sheet, headers);
  return { sheet: info.name, created: info.created, addedHeaders: actions.added, presentHeaders: actions.alreadyPresent };
}

function ensureDonations(ss) {
  var info = ensureSheet(ss, ["Donations"]);
  var headers = donationsHeaders();
  var actions = setMissingHeadersAtEnd(info.sheet, headers);
  return { sheet: info.name, created: info.created, addedHeaders: actions.added, presentHeaders: actions.alreadyPresent };
}

function ensureDonationCampaigns(ss) {
  var info = ensureSheet(ss, ["Donation_Campaigns"]);
  var headers = donationCampaignsHeaders();
  var actions = setMissingHeadersAtEnd(info.sheet, headers);
  return { sheet: info.name, created: info.created, addedHeaders: actions.added, presentHeaders: actions.alreadyPresent };
}

function ensureDonationSettings(ss) {
  var info = ensureSheet(ss, ["Donation_Settings"]);
  var headers = donationSettingsHeaders();
  var actions = setMissingHeadersAtEnd(info.sheet, headers);
  return { sheet: info.name, created: info.created, addedHeaders: actions.added, presentHeaders: actions.alreadyPresent };
}

function ensureMemberApplications(ss) {
  var info = ensureSheet(ss, ["Member_Applications"]);
  var headers = memberApplicationsHeaders();
  var actions = setMissingHeadersAtEnd(info.sheet, headers);
  return { sheet: info.name, created: info.created, addedHeaders: actions.added, presentHeaders: actions.alreadyPresent };
}

function ensurePolls(ss) {
  var info = ensureSheet(ss, ["Polls"]);
  var headers = pollsHeaders();
  var actions = setMissingHeadersAtEnd(info.sheet, headers);
  return { sheet: info.name, created: info.created, addedHeaders: actions.added, presentHeaders: actions.alreadyPresent };
}

function ensurePollQuestions(ss) {
  var info = ensureSheet(ss, ["Poll_Questions"]);
  var headers = pollQuestionsHeaders();
  var actions = setMissingHeadersAtEnd(info.sheet, headers);
  return { sheet: info.name, created: info.created, addedHeaders: actions.added, presentHeaders: actions.alreadyPresent };
}

function ensurePollResponses(ss) {
  var info = ensureSheet(ss, ["Poll_Responses"]);
  var headers = pollResponsesHeaders();
  var actions = setMissingHeadersAtEnd(info.sheet, headers);
  return { sheet: info.name, created: info.created, addedHeaders: actions.added, presentHeaders: actions.alreadyPresent };
}

// ========================= Header Definitions =========================

function userProfilesHeaders() {
  return [
    'Timestamp','Email Address','Data Privacy Agreement','Full name','Date of Birth','Age','Sex/Gender','Pronouns','Civil Status','Contact Number','Religion','Nationality','Personal Email Address','Username','Password','Data Privacy Acknowledgment','Declaration of Truthfulness and Responsibility','Data Collection Agreement','ID Code','Position','Role','ProfilePictureURL','Status','Committee','Notes','Last Updated'
  ];
}

function accessLogsHeaders() {
  return ['Timestamp','Account Created','Email','ID Code','Name','Role','Action','ActionType','IP Address','Device','Status'];
}

function masterAttendanceHeadersFixed() {
  // Only fixed A–D are ensured; event blocks are left intact
  return ['ID Code','Name','Position','ID number'];
}

function eventsControlHeaders() {
  return ['Event ID','Name','Date','Start Time','End Time','Status','Created By','Notes'];
}

function announcementsHeadersFixed() {
  // Dynamic read-status columns (U→) are not auto-generated; handled by app logic
  return ['Timestamp','Announcement ID','Author ID Code','Author Name','Title','Subject','Body','Recipient Type','Recipient Value','Email Status','Priority','Category','IsPinned','ImageURL_1','ImageURL_2','ImageURL_3'];
}

function feedbackHeaders() {
  return ['Feedback ID','Timestamp','Author','Author ID Code','Feedback','Reply Timestamp','Replier','Replier ID','Reply','Anonymous','Category','Image URL','Status','Visibility','Notes','Email','Rating','Reference'];
}

function homepageContentHeaders() {
  return ['Key','Value','UpdatedAt'];
}

function homepageProjectsHeaders() {
  return ['Project ID','Title','Description','ImageURL','Link','LinkText','Active'];
}

function donationsHeaders() {
  return ['Donation ID','Timestamp','Donor Name','Contact','Amount','Payment Method','Campaign','Reference Number','Receipt URL','Status','Notes','Verified By'];
}

function donationCampaignsHeaders() {
  return ['Campaign ID','Name','Description','Target Amount','Current Amount','Start Date','End Date','Status'];
}

function donationSettingsHeaders() {
  return ['ID','Method','QR Image URL','Account Name/Number','Active'];
}

function memberApplicationsHeaders() {
  return ['Application ID','Date Applied','Status','Full Name','Email','Phone','Address','Date of Birth','Age','Gender','Civil Status','Nationality','Chapter','Committee Preference','Desired Role','Skills','Education','Certifications','Experience','Achievements','Volunteer History','Reason For Joining','Personal Statement','Emergency Contact Name','Emergency Contact Relation','Emergency Contact Number','Facebook','Instagram','Twitter','Profile Picture URL','Attachments (JSON)','Reviewed By','Reviewed At','Decision Notes','Converted To Member','Created Member ID Code','Created Username','Created Role','Created Position','Created Committee','Created Notes'];
}

function pollsHeaders() {
  return ['Poll ID','Title','Description','Type','Status','Visibility','Created By','Created By Role','Created At','Updated At','Deadline','Open Forever','Target Audience','Allow Edit After Submit','Allow Multiple Submissions','Anonymous Responses','Show Results To Participants','Account Only Submissions','IP Lock','Device Lock','Requires Approval','Theme JSON'];
}

function pollQuestionsHeaders() {
  return ['Poll ID','Question ID','Order','Type','Text','Help Text','Required','Options JSON','Validation JSON','Allow Other','Max Files','Max Size (MB)','Matrix Rows JSON','Matrix Cols JSON'];
}

function pollResponsesHeaders() {
  return ['Response ID','Poll ID','Respondent ID Code','Respondent Name','Timestamp','Device','IP Address','Status','Score','Result Visibility','Answers JSON','Reviewer','Reviewed At','Notes'];
}
