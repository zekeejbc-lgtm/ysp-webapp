// Triggered when someone submits through the form
function onFormSubmit(e) {
  const sheet = e.source.getSheetByName("Main");
  const row = e.range.getRow();
  const designation = sheet.getRange(row, 22).getValue().trim(); // Column V
  const idCell = sheet.getRange(row, 27); // Column AA

  if (idCell.getValue() !== "") return; // Skip if already has ID
  generateID(sheet, row, designation, idCell);
}

// Triggered when someone manually types a designation in column V
function onEdit(e) {
  const sheet = e.source.getSheetByName("Main");
  const row = e.range.getRow();
  const col = e.range.getColumn();

  if (col !== 22 || row === 1) return; // Only act if editing column V (designation), not header

  const designation = sheet.getRange(row, 22).getValue().trim();
  const idCell = sheet.getRange(row, 27); // Column AA

  if (idCell.getValue() !== "") return; // Skip if already has ID
  generateID(sheet, row, designation, idCell);
}

// Shared ID generation function
function generateID(sheet, row, designation, idCell) {
  const idMap = {
    // Officers (Fixed IDs)
    "Tagum Chapter President": { prefix: "YSPTPR", fixed: "100" },
    "Membership and Internal Affairs Officer": { prefix: "YSPTIR", fixed: "200" },
    "External Relations Officer": { prefix: "YSPTER", fixed: "300" },
    "Secretariat and Documentation Officer": { prefix: "YSPTSD", fixed: "400" },
    "Finance and Treasury Officer": { prefix: "YSPTFR", fixed: "500" },
    "Program Development Officer": { prefix: "YSPTPD", fixed: "600" },
    "Communications and Marketing Officer": { prefix: "YSPTCM", fixed: "700" },

    // Volunteer & Members
    "Volunteer Member": { prefix: "YSPTVM", start: 801, end: 899 },
    "Member": { prefix: "YSPTMB", start: 901, end: 999 },

    // Committee Members
    "Committee Member: Membership and Internal Affairs": { prefix: "YSPTIR", start: 201, end: 299 },
    "Committee Member: External Relations": { prefix: "YSPTER", start: 301, end: 399 },
    "Committee Member: Secretariat and Documentation": { prefix: "YSPTSD", start: 401, end: 499 },
    "Committee Member: Finance and Treasury": { prefix: "YSPTFR", start: 501, end: 599 },
    "Committee Member: Program Development": { prefix: "YSPTPD", start: 601, end: 699 },
    "Committee Member: Communications and Marketing": { prefix: "YSPTCM", start: 701, end: 799 }
  };

  const roleInfo = idMap[designation];

  if (!roleInfo) {
    idCell.setValue("Invalid Role");
    return;
  }

  if (roleInfo.fixed) {
    const newID = `${roleInfo.prefix}-25${roleInfo.fixed}`;
    idCell.setValue(newID);
    return;
  }

  const existingIDs = sheet.getRange("AA2:AA").getValues().flat().filter(String);
  const usedNumbers = existingIDs.map(id => {
    const parts = id.split("-25");
    return parts.length === 2 ? parseInt(parts[1], 10) : null;
  }).filter(n => !isNaN(n));

  for (let num = roleInfo.start; num <= roleInfo.end; num++) {
    if (!usedNumbers.includes(num)) {
      const newID = `${roleInfo.prefix}-25${String(num).padStart(3, "0")}`;
      idCell.setValue(newID);
      return;
    }
  }

  idCell.setValue("Range Full");
}
function onFormSubmit(e) {
  const sheetName = "Master Attendance Log";
  const responseSheetName = "Form Responses 5";
  
  const attendanceSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const formSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(responseSheetName);

  const formData = e.values;
  
  const idCode = formData[5]; // Column F in form (index 5, zero-based)
  const eventName = formData[6]; // Column G in form (index 6)
  const status = formData[7]; // Column H in form (index 7)
  const time = formData[8]; // Column I in form (index 8)

  if (!idCode || !eventName || !status) return;

  const idCol = 1; // Column A in "Master Attendance Log" (ID Code)
  const headerRow = 1;

  const lastRow = attendanceSheet.getLastRow();
  const lastCol = attendanceSheet.getLastColumn();
  
  // Find row with matching ID
  const idRange = attendanceSheet.getRange(headerRow + 1, idCol, lastRow - headerRow, 1).getValues();
  const idIndex = idRange.findIndex(row => row[0] === idCode);
  if (idIndex === -1) return;

  const rowToEdit = idIndex + 2;

  // Find column with matching Event Name
  const header = attendanceSheet.getRange(headerRow, 5, 1, lastCol).getValues()[0]; // E is column 5
  const eventIndex = header.findIndex(col => col === eventName);
  if (eventIndex === -1) return;

  const colToEdit = eventIndex + 5;

  // Add attendance data
  attendanceSheet.getRange(rowToEdit, colToEdit).setValue(`${status} @ ${time}`);

  // Highlight based on status
  const cell = attendanceSheet.getRange(rowToEdit, colToEdit);
  switch (status.toLowerCase()) {
    case 'present':
      cell.setBackground('#A9DFBF'); // Green
      break;
    case 'excused':
      cell.setBackground('#FAD7A0'); // Orange
      break;
    case 'late':
      cell.setBackground('#FCF3CF'); // Yellow
      break;
    case 'absent':
      cell.setBackground('#F5B7B1'); // Red
      break;
    default:
      cell.setBackground('#FFFFFF');
  }
}
