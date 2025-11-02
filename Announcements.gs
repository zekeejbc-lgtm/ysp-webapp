function onEdit(e) {
  // Allow manual run (no event)
  const ss = e ? e.source : SpreadsheetApp.getActiveSpreadsheet();
  const sheet = e ? e.source.getActiveSheet() : ss.getActiveSheet();

  // Only trigger when editing "User Profiles" (ignore others)
  if (sheet.getName() !== "User Profiles") return;

  const userProfilesSheet = ss.getSheetByName("User Profiles");
  const announcementsSheet = ss.getSheetByName("Announcements");

  const lastRow = userProfilesSheet.getLastRow();

  // Fetch required data from User Profiles
  const idCodes = userProfilesSheet.getRange("S2:S" + lastRow).getValues(); // ID Code
  const names = userProfilesSheet.getRange("D2:D" + lastRow).getValues();   // Name
  const positions = userProfilesSheet.getRange("T2:T" + lastRow).getValues(); // Position
  const roles = userProfilesSheet.getRange("U2:U" + lastRow).getValues();   // Role

  // Combine all data into one array
  const combinedData = idCodes.map((_, i) => [
    idCodes[i][0],
    names[i][0],
    positions[i][0],
    roles[i][0]
  ]);

  // Clear previous Announcements data (Q–T)
  announcementsSheet.getRange("Q2:T" + announcementsSheet.getLastRow()).clearContent();

  // Write new data starting at Q2
  announcementsSheet.getRange(2, 17, combinedData.length, 4).setValues(combinedData);

  Logger.log("✅ Announcements updated successfully!");
}
