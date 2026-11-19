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
 * Bergen Engines - Electrical Cable Schedule Real-Time Read & Write API (Code.gs)
 * SPREADSHEET URL: https://docs.google.com/spreadsheets/d/1vGcIIdzGF8PaF1F2iCzwoRZh0WcSLuAKiJxiOTsDDIk
 * DRIVE FOLDER URL: https://drive.google.com/drive/folders/1PenXtqy18EQGOg8ilsQGz-7L_8X-4qBO
 */

const DRIVE_FOLDER_ID = "1PenXtqy18EQGOg8ilsQGz-7L_8X-4qBO";

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("Master Cable Schedule") || ss.getSheetByName("Cable Schedule") || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return jsonResponse({ success: true, data: { cables: [] } });

    let headerRowIdx = 0;
    for (let r = 0; r < Math.min(10, data.length); r++) {
      const rowText = data[r].join(" ").toUpperCase();
      if (rowText.indexOf("CABLE DESIGNATION") !== -1 || rowText.indexOf("DESIGNATION") !== -1) {
        headerRowIdx = r;
        break;
      }
    }
    const headers = data[headerRowIdx].map(h => String(h || "").trim());
    const cables = [];
    const rows = data.slice(headerRowIdx + 1);

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const tag = String(r[1] || "").trim();
      if (!tag || tag.toUpperCase().indexOf("CABLE DESIGNATION") !== -1) continue;

      cables.push({
        id: "CABLE-" + (i + 1),
        srNo: String(r[0] || i + 1),
        cableTag: tag,
        fromLocation: String(r[2] || ""),
        fromEquipment: String(r[3] || ""),
        toLocation: String(r[4] || ""),
        toEquipment: String(r[5] || ""),
        runs: Number(r[6] || 1),
        cableSize: String(r[7] || ""),
        cableType: String(r[8] || ""),
        description: String(r[9] || ""),
        cableLayingStatus: String(r[13] || "Pending"),
        cableLayingRemarks: String(r[14] || ""),
        preCommissioningStatus: String(r[15] || "Pending"),
        preCommissioningRemarks: String(r[16] || ""),
        commissioningStatus: String(r[17] || "Pending"),
        commissioningRemarks: String(r[18] || ""),
        approvedBy1: String(r[19] || "").trim() ? "Naim Bhai" : undefined,
        approvedBy2: String(r[20] || "").trim() ? "Mosaddik Bhai" : undefined,
        approvedBy3: String(r[21] || "").trim() ? "Fahad Sir" : undefined,
      });
    }

    return jsonResponse({ success: true, count: cables.length, data: { cables } });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!e || !e.postData || !e.postData.contents) return jsonResponse({ success: false, error: "Empty payload" });
    const payload = JSON.parse(e.postData.contents);

    // Update single cable
    if (payload.action === "updateCable") {
      let sheet = ss.getSheetByName("Master Cable Schedule") || ss.getSheetByName("Cable Schedule") || ss.getSheets()[0];
      const data = sheet.getDataRange().getValues();
      const targetTag = String(payload.cableTag || "").trim().toUpperCase();

      for (let r = 1; r < data.length; r++) {
        if (String(data[r][1] || "").trim().toUpperCase() === targetTag) {
          const row = r + 1;
          if (payload.cableLayingStatus !== undefined) sheet.getRange(row, 14).setValue(payload.cableLayingStatus);
          if (payload.cableLayingRemarks !== undefined) sheet.getRange(row, 15).setValue(payload.cableLayingRemarks);
          if (payload.preCommissioningStatus !== undefined) sheet.getRange(row, 16).setValue(payload.preCommissioningStatus);
          if (payload.preCommissioningRemarks !== undefined) sheet.getRange(row, 17).setValue(payload.preCommissioningRemarks);
          if (payload.commissioningStatus !== undefined) sheet.getRange(row, 18).setValue(payload.commissioningStatus);
          if (payload.commissioningRemarks !== undefined) sheet.getRange(row, 19).setValue(payload.commissioningRemarks);
          if (payload.approvedBy1 !== undefined) sheet.getRange(row, 20).setValue(payload.approvedBy1 ? "Naim Bhai" : "");
          if (payload.approvedBy2 !== undefined) sheet.getRange(row, 21).setValue(payload.approvedBy2 ? "Mosaddik Bhai" : "");
          if (payload.approvedBy3 !== undefined) sheet.getRange(row, 22).setValue(payload.approvedBy3 ? "Fahad Sir" : "");
          SpreadsheetApp.flush();
          return jsonResponse({ success: true, message: "Updated " + targetTag });
        }
      }
      return jsonResponse({ success: false, error: "Cable not found: " + targetTag });
    }

    // Upload attachment
    if (payload.action === "uploadFile") {
      let folder;
      try { folder = DriveApp.getFolderById(DRIVE_FOLDER_ID); } catch(e) { folder = DriveApp.getRootFolder(); }
      const blob = Utilities.newBlob(Utilities.base64Decode(payload.base64Data), payload.mimeType || "image/jpeg", payload.fileName || "Drawing.jpg");
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return jsonResponse({ success: true, url: "https://lh3.googleusercontent.com/d/" + file.getId() });
    }

    return jsonResponse({ success: true, message: "Acknowledged" });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}`;

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
