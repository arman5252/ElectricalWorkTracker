/**
 * ==============================================================================
 * Bergen Engines - Electrical Cable Schedule & Work Tracker API (Code.gs)
 * ==============================================================================
 * SPREADSHEET URL: https://docs.google.com/spreadsheets/d/1vGcIIdzGF8PaF1F2iCzwoRZh0WcSLuAKiJxiOTsDDIk
 * DRIVE FOLDER URL: https://drive.google.com/drive/folders/1PenXtqy18EQGOg8ilsQGz-7L_8X-4qBO
 *
 * FULL TWO-WAY REAL-TIME SYNC:
 * - Reads all 457 cables from both "LV Power Cable Schedule" & "Control Cable Schedule"
 * - Writes instant updates from dashboard directly into the exact cells of both sheets
 * - Uploads drawings and inspection photos to Google Drive folder
 * ==============================================================================
 */

const DRIVE_FOLDER_ID = "1PenXtqy18EQGOg8ilsQGz-7L_8X-4qBO";

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getCables";

    if (action === "ping") {
      return jsonResponse({
        success: true,
        message: "Bergen Engines Cable Schedule API operational",
        title: ss.getName(),
        timestamp: new Date().toISOString()
      });
    }

    if (action === "updateCable") {
      return handleUpdateCable(ss, e.parameter);
    }

    if (action === "getCables") {
      return handleGetAllCables(ss);
    }

    return jsonResponse({ success: true, message: "Action: " + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let payload = {};

    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (ex) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;

    if (action === "updateCable") {
      return handleUpdateCable(ss, payload);
    }

    if (action === "syncCables" || action === "syncAllCables") {
      return handleBatchSync(ss, payload.cables || []);
    }

    if (action === "uploadFile" || action === "uploadImage") {
      return handleFileUpload(payload);
    }

    return jsonResponse({ success: true, message: "Received action: " + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Update a single cable across both LV Power and Control Cable sheets
 */
function handleUpdateCable(ss, payload) {
  const targetTag = String(payload.cableTag || "").trim().toUpperCase();
  if (!targetTag) {
    return jsonResponse({ success: false, error: "Missing cableTag" });
  }

  // 1. Try LV Power Cable Schedule
  const lvSheet = ss.getSheetByName("LV Power Cable Schedule");
  if (lvSheet) {
    const lvData = lvSheet.getDataRange().getValues();
    // In LV sheet: Col B (index 1, 1-based col 2) is Cable Designation
    for (let r = 0; r < lvData.length; r++) {
      const tag = String(lvData[r][1] || "").trim().toUpperCase();
      if (tag === targetTag || tag.replace(/\*/g, "") === targetTag.replace(/\*/g, "")) {
        const row = r + 1; // 1-based row index
        if (payload.cableLayingStatus !== undefined) lvSheet.getRange(row, 11).setValue(payload.cableLayingStatus);
        if (payload.cableLayingRemarks !== undefined) lvSheet.getRange(row, 12).setValue(payload.cableLayingRemarks);
        if (payload.preCommissioningStatus !== undefined) lvSheet.getRange(row, 13).setValue(payload.preCommissioningStatus);
        if (payload.preCommissioningRemarks !== undefined) lvSheet.getRange(row, 14).setValue(payload.preCommissioningRemarks);
        if (payload.commissioningStatus !== undefined) lvSheet.getRange(row, 15).setValue(payload.commissioningStatus);
        if (payload.commissioningRemarks !== undefined) lvSheet.getRange(row, 16).setValue(payload.commissioningRemarks);

        const approvals = [];
        if (payload.approvedBy1) approvals.push("Naim Bhai");
        if (payload.approvedBy2) approvals.push("Mosaddik Bhai");
        if (payload.approvedBy3) approvals.push("Fahad Sir");
        if (approvals.length > 0 || payload.approvedBy1 !== undefined) {
          lvSheet.getRange(row, 17).setValue(approvals.join(", "));
        }

        SpreadsheetApp.flush();
        return jsonResponse({
          success: true,
          message: "Updated " + targetTag + " in LV Power Cable Schedule",
          sheet: "LV Power Cable Schedule",
          row: row
        });
      }
    }
  }

  // 2. Try Control Cable Schedule
  const ctrlSheet = ss.getSheetByName("Control Cable Schedule");
  if (ctrlSheet) {
    const ctrlData = ctrlSheet.getDataRange().getValues();
    // In Control sheet: Col C (index 2, 1-based col 3) is Cable Designation
    for (let r = 0; r < ctrlData.length; r++) {
      const tag = String(ctrlData[r][2] || "").trim().toUpperCase();
      if (tag === targetTag || tag.replace(/\*/g, "") === targetTag.replace(/\*/g, "")) {
        const row = r + 1;
        if (payload.cableLayingStatus !== undefined) ctrlSheet.getRange(row, 14).setValue(payload.cableLayingStatus);
        if (payload.cableLayingRemarks !== undefined) ctrlSheet.getRange(row, 15).setValue(payload.cableLayingRemarks);
        if (payload.preCommissioningStatus !== undefined) ctrlSheet.getRange(row, 16).setValue(payload.preCommissioningStatus);
        if (payload.preCommissioningRemarks !== undefined) ctrlSheet.getRange(row, 17).setValue(payload.preCommissioningRemarks);
        if (payload.commissioningStatus !== undefined) ctrlSheet.getRange(row, 18).setValue(payload.commissioningStatus);
        if (payload.commissioningRemarks !== undefined) ctrlSheet.getRange(row, 19).setValue(payload.commissioningRemarks);
        if (payload.approvedBy1 !== undefined) ctrlSheet.getRange(row, 20).setValue(payload.approvedBy1 ? "Naim Bhai" : "");
        if (payload.approvedBy2 !== undefined) ctrlSheet.getRange(row, 21).setValue(payload.approvedBy2 ? "Mosaddik Bhai" : "");
        if (payload.approvedBy3 !== undefined) ctrlSheet.getRange(row, 22).setValue(payload.approvedBy3 ? "Fahad Sir" : "");

        SpreadsheetApp.flush();
        return jsonResponse({
          success: true,
          message: "Updated " + targetTag + " in Control Cable Schedule",
          sheet: "Control Cable Schedule",
          row: row
        });
      }
    }
  }

  return jsonResponse({ success: false, error: "Cable tag " + targetTag + " not found in either schedule" });
}

/**
 * Read all cables from both sheets
 */
function handleGetAllCables(ss) {
  const cables = [];

  // 1. LV Power Cables
  const lvSheet = ss.getSheetByName("LV Power Cable Schedule");
  if (lvSheet) {
    const data = lvSheet.getDataRange().getValues();
    let currentSec = "A1 - Client PCC";
    for (let r = 0; r < data.length; r++) {
      const row = data[r];
      const sr = String(row[0] || "").trim();
      const tag = String(row[1] || "").trim();
      if (["A1", "B1", "B2", "B3", "B4", "C1"].indexOf(sr) !== -1) {
        currentSec = tag ? (sr + " - " + tag) : sr;
        continue;
      }
      if (!tag || tag.toUpperCase().indexOf("CABLE DESIGNATION") !== -1 || tag.toUpperCase() === "TAG") continue;

      const appStr = String(row[16] || "");
      cables.push({
        id: "LV-" + (r + 1),
        scheduleType: "LV Power Cable Schedule",
        section: currentSec,
        srNo: sr || String(r + 1),
        cableTag: tag,
        fromLocation: String(row[2] || ""),
        fromEquipment: String(row[3] || ""),
        toLocation: String(row[4] || ""),
        toEquipment: String(row[5] || ""),
        runs: parseInt(row[6] || 1, 10) || 1,
        cableSize: String(row[7] || ""),
        cableType: String(row[8] || ""),
        description: String(row[9] || ""),
        cableLayingStatus: row[10] || "Pending",
        cableLayingRemarks: row[11] || "",
        preCommissioningStatus: row[12] || "Pending",
        preCommissioningRemarks: row[13] || "",
        commissioningStatus: row[14] || "Pending",
        commissioningRemarks: row[15] || "",
        approvedBy1: appStr.indexOf("Naim") !== -1 ? "Naim Bhai" : undefined,
        approvedBy2: appStr.indexOf("Mosaddik") !== -1 ? "Mosaddik Bhai" : undefined,
        approvedBy3: appStr.indexOf("Fahad") !== -1 ? "Fahad Sir" : undefined,
        voltage: currentSec.indexOf("24V") !== -1 ? "24V DC" : "415V AC / LV",
        status: row[14] || "Pending"
      });
    }
  }

  // 2. Control Cables
  const ctrlSheet = ss.getSheetByName("Control Cable Schedule");
  if (ctrlSheet) {
    const data = ctrlSheet.getDataRange().getValues();
    for (let r = 0; r < data.length; r++) {
      const row = data[r];
      const sec = String(row[0] || "").trim();
      const sr = String(row[1] || "").trim();
      const tag = String(row[2] || "").trim();
      if (!tag || tag.toUpperCase() === "CABLE DESIGNATION" || sr === "Sr. No.") continue;

      cables.push({
        id: "CTRL-" + (r + 1),
        scheduleType: "Control Cable Schedule",
        section: sec || "Control & Protection",
        srNo: sr || String(r + 1),
        cableTag: tag,
        fromLocation: String(row[3] || ""),
        fromEquipment: String(row[4] || ""),
        toLocation: String(row[5] || ""),
        toEquipment: String(row[6] || ""),
        runs: parseInt(row[8] || 1, 10) || 1,
        cableSize: String(row[9] || ""),
        cableType: String(row[10] || ""),
        description: String(row[11] || ""),
        cableLayingStatus: row[13] || "Pending",
        cableLayingRemarks: row[14] === "Remarks" ? "" : (row[14] || ""),
        preCommissioningStatus: row[15] || "Pending",
        preCommissioningRemarks: row[16] === "Remarks" ? "" : (row[16] || ""),
        commissioningStatus: row[17] || "Pending",
        commissioningRemarks: row[18] === "Remarks" ? "" : (row[18] || ""),
        approvedBy1: String(row[19] || "").indexOf("Naim") !== -1 ? "Naim Bhai" : undefined,
        approvedBy2: String(row[20] || "").indexOf("Mosaddik") !== -1 ? "Mosaddik Bhai" : undefined,
        approvedBy3: String(row[21] || "").indexOf("Fahad") !== -1 ? "Fahad Sir" : undefined,
        voltage: "Control / 110V",
        status: row[17] || "Pending"
      });
    }
  }

  return jsonResponse({
    success: true,
    count: cables.length,
    data: { cables: cables }
  });
}

function handleBatchSync(ss, cables) {
  let count = 0;
  cables.forEach(c => {
    handleUpdateCable(ss, c);
    count++;
  });
  return jsonResponse({ success: true, count: count });
}

function handleFileUpload(payload) {
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

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
