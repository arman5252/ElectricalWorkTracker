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
  AlertCircle,
  Zap,
  Server,
  UploadCloud,
  Layers,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  getStoredSupabaseCredentials, 
  saveStoredSupabaseCredentials, 
  testSupabaseConnection, 
  bulkSeedCablesToSupabase 
} from '../services/supabaseService';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({ isOpen, onClose }) => {
  const { 
    cables,
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

  const [activeTab, setActiveTab] = useState<'supabase' | 'sheets'>('supabase');

  // Supabase State
  const initialCreds = getStoredSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(initialCreds.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initialCreds.anonKey);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseResult, setSupabaseResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState<{ done: number; total: number } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Sheets State
  const [webAppUrl, setWebAppUrl] = useState(settings.webAppUrl || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredSupabaseCredentials(supabaseUrl, supabaseAnonKey);
    setIsTestingSupabase(true);
    const res = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
    setIsTestingSupabase(false);
    setSupabaseResult(res);
    if (res.success) {
      showToast('Supabase connected successfully! Real-time enabled.', 'success');
    } else {
      showToast(res.message, 'warning');
    }
  };

  const handleSeedSupabase = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      showToast('Please enter your Supabase URL and Anon Key first.', 'warning');
      return;
    }
    setIsSeeding(true);
    setSeedProgress({ done: 0, total: cables.length });

    const res = await bulkSeedCablesToSupabase(cables, (done, total) => {
      setSeedProgress({ done, total });
    });

    setIsSeeding(false);
    if (res.success) {
      showToast(`Successfully seeded all ${res.count} cables to Supabase!`, 'success');
      setSupabaseResult({
        success: true,
        message: `Database online! All ${res.count} cables seeded and synchronized.`,
        count: res.count
      });
    } else {
      showToast(`Seeding error: ${res.error}`, 'error');
    }
  };

  const copySqlSchema = async () => {
    const sql = `-- Master Cables Table for Bergen Engines Electrical Work Tracker
create table if not exists public.cables (
    id text primary key,
    schedule_type text not null default 'Control Cable Schedule',
    section text not null,
    sr_no text not null,
    cable_tag text not null unique,
    from_location text,
    from_equipment text,
    to_location text,
    to_equipment text,
    runs integer default 1,
    cable_size text,
    cable_type text,
    description text,
    voltage text,
    cable_laying_status text default 'Pending',
    cable_laying_remarks text default '',
    pre_commissioning_status text default 'Pending',
    pre_commissioning_remarks text default '',
    commissioning_status text default 'Pending',
    commissioning_remarks text default '',
    approved_by1 text,
    approved_by2 text,
    approved_by3 text,
    notes text default '',
    drawing_url text default '',
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_cables_tag on public.cables (cable_tag);
create index if not exists idx_cables_section on public.cables (section);

alter table public.cables enable row level security;
create policy "Allow public read" on public.cables for select using (true);
create policy "Allow public insert" on public.cables for insert with check (true);
create policy "Allow public update" on public.cables for update using (true);

alter publication supabase_realtime add table public.cables;
`;

    try {
      await navigator.clipboard.writeText(sql);
      setCopiedSql(true);
      showToast('Supabase SQL Schema copied! Paste in Supabase SQL Editor.', 'success');
      setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      showToast('Failed to copy SQL', 'error');
    }
  };

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
        if (payload.approvedBy1) approvals.push(String(payload.approvedBy1).trim() || "Nayem Siddik (Sr. Engr)");
        if (payload.approvedBy2) approvals.push(String(payload.approvedBy2).trim() || "Mossadek Hossain (Sr. Engr)");
        if (payload.approvedBy3) approvals.push(String(payload.approvedBy3).trim() || "Md Fahad (Manager PP)");
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
        if (payload.approvedBy1 !== undefined) ctrlSheet.getRange(row, 20).setValue(payload.approvedBy1 ? String(payload.approvedBy1) : "");
        if (payload.approvedBy2 !== undefined) ctrlSheet.getRange(row, 21).setValue(payload.approvedBy2 ? String(payload.approvedBy2) : "");
        if (payload.approvedBy3 !== undefined) ctrlSheet.getRange(row, 22).setValue(payload.approvedBy3 ? String(payload.approvedBy3) : "");

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
        approvedBy1: (appStr.indexOf("Naim") !== -1 || appStr.indexOf("Nayem") !== -1) ? "Nayem Siddik (Sr. Engr)" : undefined,
        approvedBy2: (appStr.indexOf("Mosaddik") !== -1 || appStr.indexOf("Mossadek") !== -1) ? "Mossadek Hossain (Sr. Engr)" : undefined,
        approvedBy3: appStr.indexOf("Fahad") !== -1 ? "Md Fahad (Manager PP)" : undefined,
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
        approvedBy1: (String(row[19] || "").indexOf("Naim") !== -1 || String(row[19] || "").indexOf("Nayem") !== -1) ? "Nayem Siddik (Sr. Engr)" : undefined,
        approvedBy2: (String(row[20] || "").indexOf("Mosaddik") !== -1 || String(row[20] || "").indexOf("Mossadek") !== -1) ? "Mossadek Hossain (Sr. Engr)" : undefined,
        approvedBy3: String(row[21] || "").indexOf("Fahad") !== -1 ? "Md Fahad (Manager PP)" : undefined,
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
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8 text-xs max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Database & Cloud Sync Settings
              </h3>
              <p className="text-[11px] text-slate-400">
                Bergen Engines 27MW Electrical Control (Admin Portal)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Supabase vs Google Sheets */}
        <div className="mt-4 flex p-1 bg-slate-950 border border-slate-800 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'supabase'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Supabase Cloud DB (PostgreSQL)</span>
            {supabaseUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sheets')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'sheets'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Google Sheets Live Sync</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SUPABASE CLOUD DATABASE                                            */}
        {/* ========================================================================= */}
        {activeTab === 'supabase' && (
          <div className="mt-4 space-y-4">
            
            {/* Supabase Status Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${
                  supabaseResult?.success
                    ? 'bg-emerald-400 ring-4 ring-emerald-400/20'
                    : supabaseUrl
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-slate-600'
                }`} />
                <div>
                  <div className="font-bold text-white text-xs">
                    {supabaseResult?.success
                      ? 'Connected to Supabase PostgreSQL'
                      : supabaseUrl
                      ? 'Credentials Configured (Click Test to verify)'
                      : 'Supabase Not Connected (Free Cloud DB)'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {supabaseResult?.message || 'Real-time WebSocket subscriptions & cloud storage'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={copySqlSchema}
                className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 rounded-xl font-bold flex items-center gap-1.5 transition-all"
                title="Copy ready-to-run SQL schema to paste in Supabase SQL editor"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Schema'}</span>
              </button>
            </div>

            {/* Quick 3-Step Setup Guide */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="font-bold text-slate-200 text-xs flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Zero-Hassle Supabase Setup in 2 Minutes:</span>
              </div>
              <ol className="list-decimal pl-5 text-[11px] text-slate-300 space-y-1 leading-relaxed">
                <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">supabase.com</a>.</li>
                <li>Click <strong>Copy SQL Schema</strong> above, open <strong>SQL Editor</strong> in Supabase, paste and click <strong>Run</strong>.</li>
                <li>Go to <strong>Project Settings &gt; API</strong>, copy your <strong>Project URL</strong> and <strong>anon key</strong>, paste below, and click <strong>Save & Test</strong>!</li>
              </ol>
            </div>

            {/* Supabase Credentials Form */}
            <form onSubmit={handleSaveSupabase} className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] flex items-center gap-1.5">
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                  <span>Supabase Project URL</span>
                </label>
                <input
                  type="url"
                  placeholder="https://your-project-id.supabase.co"
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrl(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] flex items-center gap-1.5">
                  <KeyRound className="w-3 h-3 text-amber-400" />
                  <span>Supabase Anon Public API Key (anon public key)</span>
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseAnonKey}
                  onChange={e => setSupabaseAnonKey(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Action Buttons for Supabase */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleSeedSupabase}
                  disabled={isSeeding || !supabaseUrl}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  title="Upload all 457 cables into your Supabase database table automatically"
                >
                  <UploadCloud className={`w-4 h-4 ${isSeeding ? 'animate-bounce text-amber-400' : ''}`} />
                  <span>
                    {isSeeding && seedProgress
                      ? `Uploading ${seedProgress.done}/${seedProgress.total}...`
                      : 'Seed All 457 Cables to Supabase'}
                  </span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="submit"
                    disabled={isTestingSupabase}
                    className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                    <span>{isTestingSupabase ? 'Verifying...' : 'Save & Test Connection'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: GOOGLE SHEETS LIVE SYNC                                            */}
        {/* ========================================================================= */}
        {activeTab === 'sheets' && (
          <div className="mt-4 space-y-4">
            {/* Real-Time Live Polling Engine Controls */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
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
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
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
            <form onSubmit={handleSave} className="space-y-3">
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
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-medium transition-colors"
          >
            Close Settings
          </button>
        </div>

      </div>
    </div>
  );
};
