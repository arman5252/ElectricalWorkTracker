/**
 * ==============================================================================
 * Bergen Engines - Electrical Cable Schedule & Work Tracker API (Code.gs)
 * ==============================================================================
 * SPREADSHEET URL: https://docs.google.com/spreadsheets/d/1vGcIIdzGF8PaF1F2iCzwoRZh0WcSLuAKiJxiOTsDDIk
 * DRIVE FOLDER URL: https://drive.google.com/drive/folders/1PenXtqy18EQGOg8ilsQGz-7L_8X-4qBO
 *
 * This Google Apps Script connects the Bergen Engines Electrical Cable Schedule
 * dashboard directly to your live Google Sheet and Google Drive folder for
 * FULL TWO-WAY READ & WRITE SYNC.
 *
 * HOW TO INSTALL IN GOOGLE SHEETS:
 * 1. Open your Google Spreadsheet:
 *    https://docs.google.com/spreadsheets/d/1vGcIIdzGF8PaF1F2iCzwoRZh0WcSLuAKiJxiOTsDDIk
 * 2. In the top menu, click Extensions > Apps Script.
 * 3. Replace all existing code in Code.gs with this file and press Save (Ctrl + S).
 * 4. Click Deploy > New deployment:
 *    - Click the gear icon > Select "Web app"
 *    - Description: "Cable Schedule Live Read-Write API"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 5. Click Deploy and copy the Web App URL (ends with /exec).
 * 6. Paste the Web App URL into the dashboard "Cloud Settings" modal!
 * ==============================================================================
 */

const DRIVE_FOLDER_ID = "1PenXtqy18EQGOg8ilsQGz-7L_8X-4qBO";

/**
 * Handle HTTP GET Requests
 * Used by the Dashboard to READ data in real-time from the Google Sheet.
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getCables";

    if (action === "ping") {
      return jsonResponse({
        success: true,
        message: "Cable Schedule API is operational",
        title: ss.getName(),
        driveFolderId: DRIVE_FOLDER_ID,
        timestamp: new Date().toISOString()
      });
    }

    // Get the target sheet
    let sheet = ss.getSheetByName("Master Cable Schedule") || 
                ss.getSheetByName("Cable Schedule") || 
                ss.getSheetByName("LV Power Cable Schedule") || 
                ss.getSheets()[0];

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return jsonResponse({ success: true, data: { cables: [] } });
    }

    // Find header row index
    let headerRowIdx = -1;
    for (let r = 0; r < Math.min(10, data.length); r++) {
      const rowText = data[r].join(" ").toUpperCase();
      if (rowText.indexOf("CABLE DESIGNATION") !== -1 || rowText.indexOf("DESIGNATION") !== -1 || rowText.indexOf("CABLE TAG") !== -1) {
        headerRowIdx = r;
        break;
      }
    }

    if (headerRowIdx === -1) headerRowIdx = 0;
    const headers = data[headerRowIdx].map(h => String(h || "").trim());

    // Map column indices
    const colIndex = {
      srNo: findColIdx(headers, ["SR. NO.", "SR NO", "SR", "SL"]),
      tag: findColIdx(headers, ["CABLE DESIGNATION", "DESIGNATION", "CABLE TAG", "TAG"]),
      fromLoc: findColIdx(headers, ["FROM LOCATION", "FROM (LOCATION)", "LOCATION"]),
      fromEq: findColIdx(headers, ["FROM EQUIPMENT", "FROM (INSTRUMENT)", "FROM INSTRUMENT / PANEL"]),
      toLoc: findColIdx(headers, ["TO LOCATION", "TO (LOCATION)"]),
      toEq: findColIdx(headers, ["TO EQUIPMENT", "TO (INSTRUMENT)", "TO INSTRUMENT / PANEL"]),
      runs: findColIdx(headers, ["NO. OF RUNS", "NO. OF RUN", "RUNS"]),
      size: findColIdx(headers, ["CABLE SIZE", "SIZE"]),
      type: findColIdx(headers, ["CABLE TYPE", "TYPE"]),
      desc: findColIdx(headers, ["DESCRIPTION", "DESCRIPTION / SCOPE"]),
      // Workflow status columns
      layingStatus: findColIdx(headers, ["CABLE LAYING STATUS", "CABLE LAYING"]),
      layingRemarks: findColIdx(headers, ["CABLE LAYING REMARKS", "LAYING REMARKS"]),
      preStatus: findColIdx(headers, ["PRE-COMMISSIONING STATUS", "PRE-COMMISSIONING", "PRE COMMISSIONING"]),
      preRemarks: findColIdx(headers, ["PRE-COMMISSIONING REMARKS", "PRE-COMM REMARKS"]),
      commStatus: findColIdx(headers, ["COMMISSIONING STATUS", "COMMISSIONING"]),
      commRemarks: findColIdx(headers, ["COMMISSIONING REMARKS", "COMM REMARKS"]),
      // Approver columns
      naim: findColIdx(headers, ["NAIM BHAI", "APPROVE: NAIM BHAI"]),
      mosaddik: findColIdx(headers, ["MOSADDIK BHAI", "APPROVE: MOSADDIK BHAI"]),
      fahad: findColIdx(headers, ["FAHAD SIR", "APPROVE: FAHAD SIR"])
    };

    const cables = [];
    const rows = data.slice(headerRowIdx + 1);

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const tag = colIndex.tag !== -1 ? String(r[colIndex.tag] || "").trim() : "";
      if (!tag || tag.toUpperCase().indexOf("CABLE DESIGNATION") !== -1) continue;

      cables.push({
        id: "CABLE-" + (i + 1),
        srNo: colIndex.srNo !== -1 ? String(r[colIndex.srNo] || "") : String(i + 1),
        cableTag: tag,
        fromLocation: colIndex.fromLoc !== -1 ? String(r[colIndex.fromLoc] || "") : "",
        fromEquipment: colIndex.fromEq !== -1 ? String(r[colIndex.fromEq] || "") : "",
        toLocation: colIndex.toLoc !== -1 ? String(r[colIndex.toLoc] || "") : "",
        toEquipment: colIndex.toEq !== -1 ? String(r[colIndex.toEq] || "") : "",
        runs: colIndex.runs !== -1 ? Number(r[colIndex.runs] || 1) : 1,
        cableSize: colIndex.size !== -1 ? String(r[colIndex.size] || "") : "",
        cableType: colIndex.type !== -1 ? String(r[colIndex.type] || "") : "",
        description: colIndex.desc !== -1 ? String(r[colIndex.desc] || "") : "",
        // 3 Workflow Phases
        cableLayingStatus: colIndex.layingStatus !== -1 && r[colIndex.layingStatus] ? String(r[colIndex.layingStatus]) : "Pending",
        cableLayingRemarks: colIndex.layingRemarks !== -1 ? String(r[colIndex.layingRemarks] || "") : "",
        preCommissioningStatus: colIndex.preStatus !== -1 && r[colIndex.preStatus] ? String(r[colIndex.preStatus]) : "Pending",
        preCommissioningRemarks: colIndex.preRemarks !== -1 ? String(r[colIndex.preRemarks] || "") : "",
        commissioningStatus: colIndex.commStatus !== -1 && r[colIndex.commStatus] ? String(r[colIndex.commStatus]) : "Pending",
        commissioningRemarks: colIndex.commRemarks !== -1 ? String(r[colIndex.commRemarks] || "") : "",
        // Approvers
        approvedBy1: colIndex.naim !== -1 && String(r[colIndex.naim] || "").trim() ? "Naim Bhai" : undefined,
        approvedBy2: colIndex.mosaddik !== -1 && String(r[colIndex.mosaddik] || "").trim() ? "Mosaddik Bhai" : undefined,
        approvedBy3: colIndex.fahad !== -1 && String(r[colIndex.fahad] || "").trim() ? "Fahad Sir" : undefined,
      });
    }

    return jsonResponse({
      success: true,
      count: cables.length,
      data: { cables: cables }
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Handle HTTP POST Requests
 * Used by the Dashboard to WRITE updates directly into the Google Sheet.
 */
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: "Empty request payload" });
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    // 1. UPDATE A SINGLE CABLE (When user changes status, remarks, or approval)
    if (action === "updateCable") {
      let sheet = getMasterSheet(ss);
      const data = sheet.getDataRange().getValues();
      const headerRowIdx = findHeaderRow(data);
      const headers = data[headerRowIdx].map(h => String(h || "").trim());

      const tagColIdx = findColIdx(headers, ["CABLE DESIGNATION", "DESIGNATION", "CABLE TAG", "TAG"]);
      if (tagColIdx === -1) {
        return jsonResponse({ success: false, error: "Cable Designation column not found" });
      }

      // Ensure required workflow columns exist in header
      const cols = ensureWorkflowColumns(sheet, headerRowIdx, headers);

      // Find target row
      const targetTag = String(payload.cableTag || "").trim();
      let targetRowIdx = -1;
      for (let r = headerRowIdx + 1; r < data.length; r++) {
        if (String(data[r][tagColIdx] || "").trim().toUpperCase() === targetTag.toUpperCase()) {
          targetRowIdx = r + 1; // 1-based index for SpreadsheetApp
          break;
        }
      }

      if (targetRowIdx === -1) {
        return jsonResponse({ success: false, error: "Cable " + targetTag + " not found in spreadsheet" });
      }

      // Write values to target cells
      if (payload.cableLayingStatus !== undefined && cols.layingStatus) {
        sheet.getRange(targetRowIdx, cols.layingStatus).setValue(payload.cableLayingStatus);
      }
      if (payload.cableLayingRemarks !== undefined && cols.layingRemarks) {
        sheet.getRange(targetRowIdx, cols.layingRemarks).setValue(payload.cableLayingRemarks);
      }
      if (payload.preCommissioningStatus !== undefined && cols.preStatus) {
        sheet.getRange(targetRowIdx, cols.preStatus).setValue(payload.preCommissioningStatus);
      }
      if (payload.preCommissioningRemarks !== undefined && cols.preRemarks) {
        sheet.getRange(targetRowIdx, cols.preRemarks).setValue(payload.preCommissioningRemarks);
      }
      if (payload.commissioningStatus !== undefined && cols.commStatus) {
        sheet.getRange(targetRowIdx, cols.commStatus).setValue(payload.commissioningStatus);
      }
      if (payload.commissioningRemarks !== undefined && cols.commRemarks) {
        sheet.getRange(targetRowIdx, cols.commRemarks).setValue(payload.commissioningRemarks);
      }
      if (payload.approvedBy1 !== undefined && cols.naim) {
        sheet.getRange(targetRowIdx, cols.naim).setValue(payload.approvedBy1 ? "Naim Bhai" : "");
      }
      if (payload.approvedBy2 !== undefined && cols.mosaddik) {
        sheet.getRange(targetRowIdx, cols.mosaddik).setValue(payload.approvedBy2 ? "Mosaddik Bhai" : "");
      }
      if (payload.approvedBy3 !== undefined && cols.fahad) {
        sheet.getRange(targetRowIdx, cols.fahad).setValue(payload.approvedBy3 ? "Fahad Sir" : "");
      }

      SpreadsheetApp.flush();
      return jsonResponse({
        success: true,
        message: "Successfully updated cable " + targetTag + " in Google Sheet",
        cableTag: targetTag,
        timestamp: new Date().toISOString()
      });
    }

    // 2. BATCH SYNC ALL CABLES INTO SPREADSHEET
    if (action === "syncCables" || action === "syncAllCables") {
      const cables = payload.cables || [];
      if (!cables.length) {
        return jsonResponse({ success: false, error: "No cables provided" });
      }

      let sheet = getMasterSheet(ss);
      const data = sheet.getDataRange().getValues();
      const headerRowIdx = findHeaderRow(data);
      const headers = data[headerRowIdx].map(h => String(h || "").trim());
      const tagColIdx = findColIdx(headers, ["CABLE DESIGNATION", "DESIGNATION", "CABLE TAG", "TAG"]);
      const cols = ensureWorkflowColumns(sheet, headerRowIdx, headers);

      // Map rows by cableTag for quick lookup
      const tagRowMap = {};
      for (let r = headerRowIdx + 1; r < data.length; r++) {
        const tag = String(data[r][tagColIdx] || "").trim().toUpperCase();
        if (tag) tagRowMap[tag] = r + 1;
      }

      let updatedCount = 0;
      cables.forEach(c => {
        const t = String(c.cableTag || "").trim().toUpperCase();
        const row = tagRowMap[t];
        if (row) {
          if (cols.layingStatus) sheet.getRange(row, cols.layingStatus).setValue(c.cableLayingStatus || "Pending");
          if (cols.layingRemarks) sheet.getRange(row, cols.layingRemarks).setValue(c.cableLayingRemarks || "");
          if (cols.preStatus) sheet.getRange(row, cols.preStatus).setValue(c.preCommissioningStatus || "Pending");
          if (cols.preRemarks) sheet.getRange(row, cols.preRemarks).setValue(c.preCommissioningRemarks || "");
          if (cols.commStatus) sheet.getRange(row, cols.commStatus).setValue(c.commissioningStatus || "Pending");
          if (cols.commRemarks) sheet.getRange(row, cols.commRemarks).setValue(c.commissioningRemarks || "");
          if (cols.naim) sheet.getRange(row, cols.naim).setValue(c.approvedBy1 ? "Naim Bhai" : "");
          if (cols.mosaddik) sheet.getRange(row, cols.mosaddik).setValue(c.approvedBy2 ? "Mosaddik Bhai" : "");
          if (cols.fahad) sheet.getRange(row, cols.fahad).setValue(c.approvedBy3 ? "Fahad Sir" : "");
          updatedCount++;
        }
      });

      SpreadsheetApp.flush();
      return jsonResponse({
        success: true,
        message: "Synced " + updatedCount + " cables into Google Sheet",
        count: updatedCount
      });
    }

    // 3. UPLOAD AS-BUILT DRAWINGS / PHOTOS TO GOOGLE DRIVE FOLDER
    if (action === "uploadFile" || action === "uploadImage") {
      if (!payload.base64Data) {
        return jsonResponse({ success: false, error: "Missing base64Data" });
      }

      let folder;
      try {
        folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      } catch (err) {
        folder = DriveApp.getRootFolder();
      }

      const mimeType = payload.mimeType || "image/jpeg";
      const fileName = payload.fileName || ("Cable_Drawing_" + Date.now() + ".jpg");
      const decodedBytes = Utilities.base64Decode(payload.base64Data);
      const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      const cdnUrl = "https://lh3.googleusercontent.com/d/" + file.getId();

      return jsonResponse({
        success: true,
        fileId: file.getId(),
        fileName: fileName,
        url: cdnUrl,
        driveUrl: file.getUrl()
      });
    }

    return jsonResponse({ success: true, message: "Acknowledged action: " + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// Helpers
function getMasterSheet(ss) {
  return ss.getSheetByName("Master Cable Schedule") || 
         ss.getSheetByName("Cable Schedule") || 
         ss.getSheetByName("LV Power Cable Schedule") || 
         ss.getSheets()[0];
}

function findHeaderRow(data) {
  for (let r = 0; r < Math.min(10, data.length); r++) {
    const rowText = data[r].join(" ").toUpperCase();
    if (rowText.indexOf("CABLE DESIGNATION") !== -1 || rowText.indexOf("DESIGNATION") !== -1) {
      return r;
    }
  }
  return 0;
}

function findColIdx(headers, aliases) {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toUpperCase();
    for (let j = 0; j < aliases.length; j++) {
      if (h === aliases[j] || h.indexOf(aliases[j]) !== -1) {
        return i;
      }
    }
  }
  return -1;
}

function ensureWorkflowColumns(sheet, headerRowIdx, headers) {
  // Check if columns exist; if not, append to header
  const required = [
    { key: "layingStatus", title: "Cable Laying Status" },
    { key: "layingRemarks", title: "Cable Laying Remarks" },
    { key: "preStatus", title: "Pre-Commissioning Status" },
    { key: "preRemarks", title: "Pre-Commissioning Remarks" },
    { key: "commStatus", title: "Commissioning Status" },
    { key: "commRemarks", title: "Commissioning Remarks" },
    { key: "naim", title: "Naim Bhai" },
    { key: "mosaddik", title: "Mosaddik Bhai" },
    { key: "fahad", title: "Fahad Sir" }
  ];

  const colMap = {};
  let lastCol = headers.length;

  required.forEach(req => {
    let idx = findColIdx(headers, [req.title.toUpperCase()]);
    if (idx !== -1) {
      colMap[req.key] = idx + 1; // 1-based
    } else {
      // Append column to sheet
      lastCol++;
      sheet.getRange(headerRowIdx + 1, lastCol).setValue(req.title);
      colMap[req.key] = lastCol;
      headers.push(req.title);
    }
  });

  return colMap;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
