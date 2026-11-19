import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  Zap, 
  ExternalLink, 
  Upload, 
  CheckCircle2, 
  FolderGit2, 
  FileSpreadsheet, 
  Save,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CableEntry, CableLayingStatus, CommissioningStatus } from '../types';

export const CableDetailModal: React.FC = () => {
  const { 
    selectedCable, 
    setSelectedCable, 
    updateCable, 
    uploadDriveDrawing, 
    settings, 
    isSyncing 
  } = useApp();

  if (!selectedCable) return null;

  const [cableLayingStatus, setCableLayingStatus] = useState<CableLayingStatus>(selectedCable.cableLayingStatus);
  const [cableLayingRemarks, setCableLayingRemarks] = useState<string>(selectedCable.cableLayingRemarks || '');
  
  const [preCommissioningStatus, setPreCommissioningStatus] = useState<CommissioningStatus>(selectedCable.preCommissioningStatus);
  const [preCommissioningRemarks, setPreCommissioningRemarks] = useState<string>(selectedCable.preCommissioningRemarks || '');

  const [commissioningStatus, setCommissioningStatus] = useState<CommissioningStatus>(selectedCable.commissioningStatus);
  const [commissioningRemarks, setCommissioningRemarks] = useState<string>(selectedCable.commissioningRemarks || '');

  const [approvedBy1, setApprovedBy1] = useState<boolean>(selectedCable.approvedBy1 === 'Naim Bhai');
  const [approvedBy2, setApprovedBy2] = useState<boolean>(selectedCable.approvedBy2 === 'Mosaddik Bhai');
  const [approvedBy3, setApprovedBy3] = useState<boolean>(selectedCable.approvedBy3 === 'Fahad Sir');

  const [notes, setNotes] = useState<string>(selectedCable.notes || '');
  const [drawingUrl, setDrawingUrl] = useState<string>(selectedCable.drawingUrl || '');
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCable(selectedCable.id, {
      cableLayingStatus,
      cableLayingRemarks,
      preCommissioningStatus,
      preCommissioningRemarks,
      commissioningStatus,
      commissioningRemarks,
      approvedBy1: approvedBy1 ? 'Naim Bhai' : undefined,
      approvedBy2: approvedBy2 ? 'Mosaddik Bhai' : undefined,
      approvedBy3: approvedBy3 ? 'Fahad Sir' : undefined,
      notes,
      drawingUrl
    });
    setSelectedCable(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      const url = await uploadDriveDrawing(file);
      if (url) {
        setDrawingUrl(url);
      } else {
        // Local preview fallback
        const reader = new FileReader();
        reader.onload = () => {
          setDrawingUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8 text-xs max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
              {selectedCable.cableTag}
            </span>
            <span className="text-slate-400 font-medium">
              {selectedCable.scheduleType} • {selectedCable.section}
            </span>
          </div>
          <button
            onClick={() => setSelectedCable(null)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cable Origin & Destination Route */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Cable Routing (From &rarr; To)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Origin */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-[10px] text-amber-400 block font-semibold mb-0.5">SOURCE / FROM:</span>
              <div className="font-bold text-sm text-white">{selectedCable.fromEquipment}</div>
              <div className="text-slate-400 mt-0.5 text-xs">{selectedCable.fromLocation}</div>
            </div>

            {/* Destination */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-[10px] text-emerald-400 block font-semibold mb-0.5">DESTINATION / TO:</span>
              <div className="font-bold text-sm text-white">{selectedCable.toEquipment}</div>
              <div className="text-slate-400 mt-0.5 text-xs">{selectedCable.toLocation}</div>
            </div>
          </div>
        </div>

        {/* Technical Specs 4-Grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Conductor Size</span>
            <div className="font-bold text-white text-xs mt-0.5">{selectedCable.cableSize}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-amber-400 block">Cable Type</span>
            <div className="font-bold text-amber-400 font-mono text-xs mt-0.5">{selectedCable.cableType}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Number of Runs</span>
            <div className="font-bold text-white text-xs mt-0.5">{selectedCable.runs} Run(s)</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">System Voltage</span>
            <div className="font-bold text-sky-400 text-xs mt-0.5">{selectedCable.voltage}</div>
          </div>
        </div>

        {/* Technical Scope / Description */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Engineering Scope & Functional Description:
          </span>
          <p className="text-slate-200 leading-relaxed text-xs">
            {selectedCable.description}
          </p>
        </div>

        {/* 3 Work Stages Form Controls */}
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Cable Laying */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                Cable Laying
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Status</label>
                <select
                  value={cableLayingStatus}
                  onChange={(e) => setCableLayingStatus(e.target.value as CableLayingStatus)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-semibold text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="Complete By VEL">Complete By VEL</option>
                  <option value="Progress">Progress</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="Laying remarks..."
                  value={cableLayingRemarks}
                  onChange={(e) => setCableLayingRemarks(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* 2. Pre-Commissioning */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-emerald-500 uppercase tracking-wide">
                Pre-Commissioning
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Status</label>
                <select
                  value={preCommissioningStatus}
                  onChange={(e) => setPreCommissioningStatus(e.target.value as CommissioningStatus)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-semibold text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="Complete By Bargen">Complete By Bargen</option>
                  <option value="Progress">Progress</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="Pre-comm remarks..."
                  value={preCommissioningRemarks}
                  onChange={(e) => setPreCommissioningRemarks(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* 3. Commissioning */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">
                Commissioning
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Status</label>
                <select
                  value={commissioningStatus}
                  onChange={(e) => setCommissioningStatus(e.target.value as CommissioningStatus)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-semibold text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="Complete By Bargen">Complete By Bargen</option>
                  <option value="Progress">Progress</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="Commissioning remarks..."
                  value={commissioningRemarks}
                  onChange={(e) => setCommissioningRemarks(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Approve By Tier */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Approve By Sign-Offs</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                approvedBy1 ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <input
                  type="checkbox"
                  checked={approvedBy1}
                  onChange={(e) => setApprovedBy1(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
                <span className="font-semibold text-xs">Naim Bhai</span>
              </label>

              <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                approvedBy2 ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <input
                  type="checkbox"
                  checked={approvedBy2}
                  onChange={(e) => setApprovedBy2(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
                <span className="font-semibold text-xs">Mosaddik Bhai</span>
              </label>

              <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                approvedBy3 ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <input
                  type="checkbox"
                  checked={approvedBy3}
                  onChange={(e) => setApprovedBy3(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <span className="text-xs">Fahad Sir (Final)</span>
              </label>
            </div>
          </div>

          {/* Drive Upload & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Attach Drawing / Proof Photo (Google Drive Folder)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                />
                {isUploading && <span className="text-amber-400 text-xs">Uploading...</span>}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Field Technician Notes / Megger Test
              </label>
              <input
                type="text"
                placeholder="e.g. Meggered 500MΩ phase to earth..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {drawingUrl && (
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Drawing / Proof Photo Attached
              </span>
              <a
                href={drawingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:underline flex items-center gap-1"
              >
                View in Google Drive <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <a
                href={settings.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 text-[11px]"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Open in Sheet</span>
              </a>
              <span className="text-slate-600">•</span>
              <a
                href={settings.driveFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-sky-400 flex items-center gap-1 text-[11px]"
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Open Drive Folder</span>
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCable(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
