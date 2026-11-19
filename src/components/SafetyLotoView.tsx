import React, { useState } from 'react';
import { 
  Lock, 
  Plus, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Key, 
  Unlock, 
  Trash2, 
  Zap, 
  UserCheck 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SafetyLotoRecord } from '../types';

export const SafetyLotoView: React.FC = () => {
  const { state, addSafetyLoto, updateSafetyLotoStatus, deleteSafetyLoto } = useApp();

  const [filter, setFilter] = useState<'All' | 'Active' | 'Cleared'>('Active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clearanceModalOpen, setClearanceModalOpen] = useState(false);
  const [targetClearanceId, setTargetClearanceId] = useState<string | null>(null);
  const [clearingOfficer, setClearingOfficer] = useState('');

  const [formData, setFormData] = useState({
    workOrderId: state.workOrders[0]?.id || '',
    equipmentTag: '33kV Switchyard Bay 1 Disconnector',
    tagNumber: 'LOTO-HV-33-02',
    lockNumber: 'PADLOCK-RED-114',
    appliedBy: 'Arman Sheikh (Master Electrician)',
    appliedDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
    verifiedBy: 'Safety Officer Zahid Hasan',
    isolationPoints: 'Primary breaker racked out to DISCONNECTED position; Grounding switch closed & padlocked; Control DC supply fuses pulled.',
    status: 'Active' as SafetyLotoRecord['status']
  });

  const filtered = state.safetyLoto.filter(l => {
    if (filter === 'Active') return l.status === 'Active';
    if (filter === 'Cleared') return l.status === 'Cleared & Restored';
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSafetyLoto(formData);
    setIsModalOpen(false);
  };

  const handleOpenClearance = (id: string) => {
    setTargetClearanceId(id);
    setClearingOfficer('Zahid Hasan (LOTO Officer)');
    setClearanceModalOpen(true);
  };

  const handleConfirmClearance = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetClearanceId) {
      updateSafetyLotoStatus(targetClearanceId, 'Cleared & Restored', clearingOfficer);
      setClearanceModalOpen(false);
      setTargetClearanceId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-rose-400" />
            Lockout / Tagout (LOTO) & Electrical Isolation Board
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Zero-energy safety compliance per OSHA 1910.147 and NFPA 70E. Never energize tagged breakers.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Apply New LOTO Lock</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setFilter('Active')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            filter === 'Active'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Active Padlocks ({state.safetyLoto.filter(l => l.status === 'Active').length})
        </button>
        <button
          onClick={() => setFilter('Cleared')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            filter === 'Cleared'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Cleared & Restored ({state.safetyLoto.filter(l => l.status === 'Cleared & Restored').length})
        </button>
        <button
          onClick={() => setFilter('All')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            filter === 'All'
              ? 'bg-amber-500 text-slate-950'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          All Records ({state.safetyLoto.length})
        </button>
      </div>

      {/* LOTO Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(loto => {
          const isActive = loto.status === 'Active';
          return (
            <div
              key={loto.id}
              className={`rounded-2xl p-5 border shadow-lg text-xs space-y-3 transition-all ${
                isActive
                  ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60'
                  : 'bg-slate-900/60 border-slate-800 opacity-80'
              }`}
            >
              {/* Top Banner Tag */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs border ${
                    isActive
                      ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {loto.tagNumber}
                  </span>
                  <span className="font-mono text-slate-300">
                    Lock: <strong className="text-white">{loto.lockNumber}</strong>
                  </span>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isActive
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {isActive ? 'DANGER - DO NOT ENERGIZE' : 'CLEARED & RESTORED'}
                </span>
              </div>

              {/* Equipment & Work order */}
              <div>
                <h3 className="text-base font-bold text-white mb-0.5">
                  {loto.equipmentTag}
                </h3>
                <p className="text-slate-400 text-xs">
                  Work Order: <span className="font-mono text-amber-400 font-semibold">{loto.workOrderId}</span>
                </p>
              </div>

              {/* Isolation Points */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                  Physical Isolation Points & Verification:
                </div>
                <div className="text-slate-200 leading-relaxed font-mono text-[11px]">
                  {loto.isolationPoints}
                </div>
              </div>

              {/* Applied & Verified details */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                <div>
                  <span className="block text-[10px] text-slate-400">Applied By:</span>
                  <span className="font-semibold text-slate-200">{loto.appliedBy}</span>
                  <span className="block text-[10px]">{loto.appliedDate}</span>
                </div>

                <div>
                  <span className="block text-[10px] text-slate-400">Safety Verification:</span>
                  <span className="font-semibold text-slate-200">{loto.verifiedBy}</span>
                  {loto.clearedDate && (
                    <span className="block text-[10px] text-emerald-400">Cleared: {loto.clearedDate}</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                {isActive ? (
                  <button
                    onClick={() => handleOpenClearance(loto.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Clear LOTO & Re-energize</span>
                  </button>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1 font-medium text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Safe to operate
                  </span>
                )}

                <button
                  onClick={() => {
                    if (confirm(`Delete LOTO record ${loto.tagNumber}?`)) deleteSafetyLoto(loto.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-950/40"
                  title="Remove record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Apply LOTO Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-400" />
                Apply Safety LOTO & Electrical Lockout
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
                  Work Order *
                </label>
                <select
                  value={formData.workOrderId}
                  onChange={e => setFormData({ ...formData, workOrderId: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                >
                  {state.workOrders.map(wo => (
                    <option key={wo.id} value={wo.id}>{wo.id} - {wo.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Equipment Tag / Isolator Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.equipmentTag}
                  onChange={e => setFormData({ ...formData, equipmentTag: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Danger Tag Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tagNumber}
                    onChange={e => setFormData({ ...formData, tagNumber: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Padlock Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lockNumber}
                    onChange={e => setFormData({ ...formData, lockNumber: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Applied By (Wireman / Tech) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.appliedBy}
                  onChange={e => setFormData({ ...formData, appliedBy: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Verified By (Safety Officer) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.verifiedBy}
                  onChange={e => setFormData({ ...formData, verifiedBy: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Isolation Points & De-energization Procedure *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.isolationPoints}
                  onChange={e => setFormData({ ...formData, isolationPoints: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                ></textarea>
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
                  Confirm Lock Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clearance Modal */}
      {clearanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <Unlock className="w-5 h-5 text-emerald-400" />
              LOTO Removal & Re-energization Sign-off
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Verify that all personnel are clear, grounds are disconnected, and panels are closed before restoring power.
            </p>

            <form onSubmit={handleConfirmClearance} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Authorizing Safety Officer / Engineer *
                </label>
                <input
                  type="text"
                  required
                  value={clearingOfficer}
                  onChange={e => setClearingOfficer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClearanceModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Authorize Removal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
