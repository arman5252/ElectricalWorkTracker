import React, { useState } from 'react';
import { 
  Database, 
  FileSpreadsheet, 
  FolderGit2, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  RotateCcw,
  RefreshCw,
  Radio,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({ isOpen, onClose }) => {
  const { 
    settings, 
    updateSettings, 
    resetToOriginalSpreadsheet,
    isLiveSyncEnabled,
    setIsLiveSyncEnabled,
    liveSyncIntervalSeconds,
    setLiveSyncIntervalSeconds,
    lastLiveSyncTimestamp,
    liveSyncStatus,
    liveSyncError,
    manualRefreshFromSheet,
    showToast 
  } = useApp();

  const [webAppUrl, setWebAppUrl] = useState(settings.webAppUrl || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ webAppUrl: webAppUrl.trim() });
    showToast('Real-time sync configuration saved!', 'success');
  };

  const handleTestLive = async () => {
    setIsTesting(true);
    await manualRefreshFromSheet();
    setIsTesting(false);
  };

  const copyScriptCode = async () => {
    const code = `/**
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
`;

    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      showToast('Apps Script code copied to clipboard!', 'success');
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      showToast('Please copy from google-apps-script/Code.gs', 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h3 className="text-base font-bold text-white">
              Real-Time Google Sheets Live Updating
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-Time Live Polling Engine Controls */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-sm text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Live Real-Time Auto-Sync Engine
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatically detects when someone edits the Google Sheet and refreshes data on screen.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isLiveSyncEnabled}
                onChange={e => setIsLiveSyncEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Polling Interval Selector */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
            <span className="text-slate-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Check Sheet for Updates Every:
            </span>
            <div className="flex items-center gap-1">
              {[5, 10, 30, 60].map(sec => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setLiveSyncIntervalSeconds(sec)}
                  className={`px-2 py-1 rounded font-bold transition-all ${
                    liveSyncIntervalSeconds === sec
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Current Live Status */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                liveSyncStatus === 'live' 
                  ? 'bg-emerald-400 animate-ping' 
                  : liveSyncStatus === 'syncing'
                  ? 'bg-amber-400 animate-spin'
                  : 'bg-rose-400'
              }`}></span>
              <span className="font-semibold text-slate-200">
                {liveSyncStatus === 'live' && 'Connected to Live Sheet'}
                {liveSyncStatus === 'syncing' && 'Fetching latest changes...'}
                {liveSyncStatus === 'error' && 'Waiting for permissions / Web App'}
                {liveSyncStatus === 'paused' && 'Real-time sync paused'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleTestLive}
              disabled={isTesting}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg font-semibold flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin text-amber-400' : ''}`} />
              <span>Test Real-Time Fetch</span>
            </button>
          </div>
        </div>

        {/* Two Setup Methods (No-Code vs Full Web App) */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
          <div className="text-slate-200 font-bold flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold text-[11px]">
              1
            </span>
            <span>Zero-Code Instant Live Updates (Recommended)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed pl-6">
            In your Google Sheet, click the top-right <strong>Share</strong> button, change General access from <em>Restricted</em> to <strong>"Anyone with the link can view"</strong>. The dashboard will immediately start streaming live updates every {liveSyncIntervalSeconds} seconds!
          </p>

          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-slate-200 font-bold flex items-center justify-between gap-1.5 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center font-extrabold text-[11px]">
                  2
                </span>
                <span>Optional: Google Apps Script Web App (For Private Sheets & Drive Uploads)</span>
              </div>
              <button
                type="button"
                onClick={copyScriptCode}
                className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded flex items-center gap-1 text-[10px]"
              >
                {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied' : 'Copy Script'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed pl-6">
              Paste into <strong>Extensions &gt; Apps Script</strong>, deploy as Web App (Anyone), and paste the URL below:
            </p>
          </div>
        </div>

        {/* Web App URL Form */}
        <form onSubmit={handleSave} className="mt-4 space-y-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Google Apps Script Web App URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={webAppUrl}
              onChange={e => setWebAppUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 font-mono text-[11px] focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('Restore the exact 455 project cables from Bergen Engines schedules?')) {
                  resetToOriginalSpreadsheet();
                }
              }}
              className="flex items-center gap-1 text-slate-400 hover:text-amber-300 text-xs font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset 455 Cables</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
