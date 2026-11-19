import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Clock, 
  User, 
  Upload, 
  Trash2, 
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DailyWorkLog } from '../types';

export const DailyLogsView: React.FC = () => {
  const { state, addDailyLog, deleteDailyLog, uploadDriveImage } = useApp();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    workOrderId: state.workOrders[0]?.id || '',
    workOrderTitle: state.workOrders[0]?.title || '',
    electrician: '',
    toolboxTalkAttended: true,
    toolboxTalkTopic: 'Arc Flash PPE Verification & LOTO De-energization',
    zeroEnergyVerified: true,
    summary: '',
    hoursWorked: 8,
    voltageReadings: '415V Phase-to-Phase (L1-L2: 415V, L2-L3: 416V, L3-L1: 414V)',
    currentReadings: 'Operating current: 350A',
    temperatureReadings: 'Terminals: 42°C',
    photoUrl: ''
  });

  const filteredLogs = state.dailyLogs.filter(log => {
    const q = search.toLowerCase();
    return !q ||
      log.electrician.toLowerCase().includes(q) ||
      log.workOrderId.toLowerCase().includes(q) ||
      (log.workOrderTitle && log.workOrderTitle.toLowerCase().includes(q)) ||
      log.summary.toLowerCase().includes(q);
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      if (state.settings.webAppUrl) {
        const driveUrl = await uploadDriveImage(file);
        if (driveUrl) {
          setFormData(prev => ({ ...prev, photoUrl: driveUrl }));
        }
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedWo = state.workOrders.find(w => w.id === formData.workOrderId);
    addDailyLog({
      ...formData,
      workOrderTitle: matchedWo?.title || formData.workOrderTitle
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-400" />
            Field Daily Work Logs & Safety Diary
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log shift tasks, Toolbox Safety briefings, Zero-energy electrical verifications, and labor timesheets.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Daily Log</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by wireman, work order, summary..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/70 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-400"
          />
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        {filteredLogs.map(log => (
          <div
            key={log.id}
            className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-md text-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {log.id}
                </span>
                <span className="text-slate-400">Date:</span>
                <span className="font-semibold text-white">{log.date}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Logged by:</span>
                <span className="font-semibold text-amber-300">{log.electrician}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono font-semibold">
                  {log.hoursWorked} Labor Hours
                </span>
                <button
                  onClick={() => {
                    if (confirm(`Remove daily log ${log.id}?`)) deleteDailyLog(log.id);
                  }}
                  className="p-1 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 rounded"
                  title="Delete Log"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Work order link */}
            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono text-slate-300 font-bold">{log.workOrderId}:</span>
                <span className="text-white font-medium">{log.workOrderTitle || 'Associated Electrical Task'}</span>
              </div>
            </div>

            {/* Safety Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {log.toolboxTalkAttended ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Toolbox Safety Talk: {log.toolboxTalkTopic}
                </span>
              ) : (
                <span className="text-slate-500">No Toolbox Talk logged</span>
              )}

              {log.zeroEnergyVerified && (
                <span className="flex items-center gap-1.5 text-sky-400 font-medium bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  <ShieldCheck className="w-4 h-4" />
                  Zero-Energy De-energization Confirmed
                </span>
              )}
            </div>

            {/* Work Performed Summary */}
            <div className="text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-850">
              {log.summary}
            </div>

            {/* Field Telemetry Readings */}
            {(log.voltageReadings || log.currentReadings || log.temperatureReadings) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono">
                {log.voltageReadings && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Voltage Readings:</span>
                    <span className="text-amber-300">{log.voltageReadings}</span>
                  </div>
                )}
                {log.currentReadings && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Current Readings:</span>
                    <span className="text-emerald-300">{log.currentReadings}</span>
                  </div>
                )}
                {log.temperatureReadings && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Temperature:</span>
                    <span className="text-sky-300">{log.temperatureReadings}</span>
                  </div>
                )}
              </div>
            )}

            {/* Photo preview if present */}
            {log.photoUrl && (
              <div className="pt-2">
                <a
                  href={log.photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sky-400 hover:underline font-semibold"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>View Field Proof Photo (Drive)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New Daily Log Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-400" />
                Record Field Daily Work Log
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 pt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Associated Work Order *
                </label>
                <select
                  value={formData.workOrderId}
                  onChange={e => setFormData({ ...formData, workOrderId: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                >
                  {state.workOrders.map(wo => (
                    <option key={wo.id} value={wo.id}>
                      {wo.id} - {wo.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Hours Worked *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.hoursWorked}
                    onChange={e => setFormData({ ...formData, hoursWorked: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Lead Wireman / Technician *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arman Sheikh"
                  value={formData.electrician}
                  onChange={e => setFormData({ ...formData, electrician: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                />
              </div>

              {/* Safety verifications */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.toolboxTalkAttended}
                    onChange={e => setFormData({ ...formData, toolboxTalkAttended: e.target.checked })}
                    className="rounded text-amber-500"
                  />
                  <span>Toolbox Safety Talk Completed Before Starting</span>
                </label>

                <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.zeroEnergyVerified}
                    onChange={e => setFormData({ ...formData, zeroEnergyVerified: e.target.checked })}
                    className="rounded text-sky-500"
                  />
                  <span>Zero-Energy (0.0V) Verified with Proving Unit & Meter</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Work Summary & Actions Completed *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe operations performed, torque applied, test results..."
                  value={formData.summary}
                  onChange={e => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                ></textarea>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Field Photo Attachment (Google Drive Folder)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                  className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                />
                {isUploading && (
                  <span className="text-amber-400 block mt-1">Uploading to Drive...</span>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl"
                >
                  Save Daily Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
