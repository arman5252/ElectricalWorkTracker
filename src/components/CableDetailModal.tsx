import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  Zap, 
  ExternalLink, 
  Upload, 
  CheckCircle2, 
  Save,
  ShieldCheck,
  Check,
  Lock,
  LogIn,
  MessageSquare,
  UserCheck,
  AlertCircle,
  History
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CableEntry, CableLayingStatus, CommissioningStatus } from '../types';
import { normalizeStatus } from './ScheduleView';

export const CableDetailModal: React.FC = () => {
  const { 
    selectedCable, 
    setSelectedCable, 
    updateCable, 
    workAssignments,
    openAssignWorkModal,
    isSyncing,
    currentUser,
    isStaff,
    canEdit,
    canApproveLevel,
    editHistory,
    setIsLoginModalOpen,
    customStatusOptions,
    addCustomStatusOption
  } = useApp();

  if (!selectedCable) return null;

  const [cableLayingStatus, setCableLayingStatus] = useState<CableLayingStatus>(
    (normalizeStatus(selectedCable.cableLayingStatus) as CableLayingStatus) || 'Pending'
  );
  
  const [preCommissioningStatus, setPreCommissioningStatus] = useState<CommissioningStatus>(
    (normalizeStatus(selectedCable.preCommissioningStatus) as CommissioningStatus) || 'Pending'
  );

  const [commissioningStatus, setCommissioningStatus] = useState<CommissioningStatus>(
    (normalizeStatus(selectedCable.commissioningStatus) as CommissioningStatus) || 'Pending'
  );

  const [approvedBy1, setApprovedBy1] = useState<boolean>(Boolean(selectedCable.approvedBy1));
  const [approvalNote1, setApprovalNote1] = useState<string>(selectedCable.approvalNote1 || '');
  const [approvedBy2, setApprovedBy2] = useState<boolean>(Boolean(selectedCable.approvedBy2));
  const [approvalNote2, setApprovalNote2] = useState<string>(selectedCable.approvalNote2 || '');
  const [approvedBy3, setApprovedBy3] = useState<boolean>(Boolean(selectedCable.approvedBy3));
  const [approvalNote3, setApprovalNote3] = useState<string>(selectedCable.approvalNote3 || '');

  const [notes, setNotes] = useState<string>(selectedCable.notes || '');
  const [drawingUrl, setDrawingUrl] = useState<string>(selectedCable.drawingUrl || '');
  const [isUploading, setIsUploading] = useState(false);

  const linkedAssignment = workAssignments.find(
    a => (a.cableTag && a.cableTag === selectedCable.cableTag) || (a.cableId && a.cableId === selectedCable.id)
  );

  const handleStatusSelection = async (
    val: string, 
    setter: (v: any) => void
  ) => {
    if (val === '__ADD_MORE_OPTION__') {
      const input = window.prompt("Enter new status option name (e.g. Scope of Akij, Third Party Inspection):");
      if (input && input.trim()) {
        const clean = input.trim();
        await addCustomStatusOption(clean);
        setter(clean);
      }
      return;
    }
    setter(val);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Respect RBAC: Only update approver fields that the logged-in user has permission to change
    const newApprovedBy1 = canApproveLevel(1)
      ? (approvedBy1 ? (selectedCable.approvedBy1 || 'Nayem Siddik (Sr. Engr)') : undefined)
      : selectedCable.approvedBy1;

    const newApprovedBy2 = canApproveLevel(2)
      ? (approvedBy2 ? (selectedCable.approvedBy2 || 'Mossadek Hossain (Sr. Engr)') : undefined)
      : selectedCable.approvedBy2;

    const newApprovedBy3 = canApproveLevel(3)
      ? (approvedBy3 ? (selectedCable.approvedBy3 || 'Md Fahad (Manager PP)') : undefined)
      : selectedCable.approvedBy3;

    updateCable(selectedCable.id, {
      cableLayingStatus,
      preCommissioningStatus,
      commissioningStatus,
      approvedBy1: newApprovedBy1,
      approvalNote1,
      approvedBy2: newApprovedBy2,
      approvalNote2,
      approvedBy3: newApprovedBy3,
      approvalNote3,
      notes,
      drawingUrl
    });
    setSelectedCable(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = () => {
        setDrawingUrl(reader.result as string);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-card rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8 text-xs max-h-[90vh] overflow-y-auto custom-scrollbar">
        
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

        {/* Read-only / Viewer Alert */}
        {!canEdit && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs">
                <strong>Read-Only Mode:</strong> Log in as an authorized engineer (Nayem, Mossadek, Fahad, or Admin) to change stage statuses or sign approvals.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shrink-0 shadow transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Staff Login</span>
            </button>
          </div>
        )}

        {/* 3 Work Stages Form Controls */}
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Cable Laying */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide flex items-center justify-between">
                <span>Cable Laying</span>
                {!canEdit && <Lock className="w-3 h-3 text-slate-500" />}
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Status</label>
                <select
                  disabled={!canEdit}
                  value={cableLayingStatus}
                  onChange={(e) => handleStatusSelection(e.target.value, setCableLayingStatus)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg text-slate-100 font-semibold text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="Complete By VEL">✓ Complete By VEL</option>
                  <option value="Complete By Bargen">✓ Complete By Bargen</option>
                  <option value="Progress">⏳ Progress</option>
                  <option value="Pending">⏱ Pending</option>
                  <option value="Scope of Bargen">Scope of Bargen</option>
                  <option value="Scope of VEL">Scope of VEL</option>
                  <option value="Scope of Akij">Scope of Akij</option>
                  <option value="Out of Scope">Out of Scope</option>
                  <option value="N/A">N/A</option>
                  {customStatusOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  <option value="__ADD_MORE_OPTION__" className="font-bold text-amber-400 bg-amber-950">
                    ➕ Add More Option...
                  </option>
                </select>
              </div>
            </div>

            {/* 2. Pre-Commissioning */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-emerald-500 uppercase tracking-wide flex items-center justify-between">
                <span>Pre-Commissioning</span>
                {!canEdit && <Lock className="w-3 h-3 text-slate-500" />}
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Status</label>
                <select
                  disabled={!canEdit}
                  value={preCommissioningStatus}
                  onChange={(e) => handleStatusSelection(e.target.value, setPreCommissioningStatus)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg text-slate-100 font-semibold text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="Complete By Bargen">✓ Complete By Bargen</option>
                  <option value="Complete By VEL">✓ Complete By VEL</option>
                  <option value="Progress">⏳ Progress</option>
                  <option value="Pending">⏱ Pending</option>
                  <option value="Scope of Bargen">Scope of Bargen</option>
                  <option value="Scope of VEL">Scope of VEL</option>
                  <option value="Scope of Akij">Scope of Akij</option>
                  <option value="Out of Scope">Out of Scope</option>
                  <option value="N/A">N/A</option>
                  {customStatusOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  <option value="__ADD_MORE_OPTION__" className="font-bold text-amber-400 bg-amber-950">
                    ➕ Add More Option...
                  </option>
                </select>
              </div>
            </div>

            {/* 3. Commissioning */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide flex items-center justify-between">
                <span>Commissioning</span>
                {!canEdit && <Lock className="w-3 h-3 text-slate-500" />}
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Status</label>
                <select
                  disabled={!canEdit}
                  value={commissioningStatus}
                  onChange={(e) => handleStatusSelection(e.target.value, setCommissioningStatus)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg text-slate-100 font-semibold text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="Complete By Bargen">✓ Complete By Bargen</option>
                  <option value="Complete By VEL">✓ Complete By VEL</option>
                  <option value="Progress">⏳ Progress</option>
                  <option value="Pending">⏱ Pending</option>
                  <option value="Scope of Bargen">Scope of Bargen</option>
                  <option value="Scope of VEL">Scope of VEL</option>
                  <option value="Scope of Akij">Scope of Akij</option>
                  <option value="Out of Scope">Out of Scope</option>
                  <option value="N/A">N/A</option>
                  {customStatusOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  <option value="__ADD_MORE_OPTION__" className="font-bold text-amber-400 bg-amber-950">
                    ➕ Add More Option...
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Staff Work Assignment Section */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wide">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span>Staff Work Assignment</span>
              </div>
              {isStaff && (
                <button
                  type="button"
                  onClick={() => openAssignWorkModal(selectedCable)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all shadow-sm active:scale-95"
                >
                  <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{linkedAssignment ? 'Reassign / Edit Work' : 'Assign to Staff'}</span>
                </button>
              )}
            </div>

            {linkedAssignment ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{linkedAssignment.title}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                      {linkedAssignment.priority}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    {linkedAssignment.status}
                  </span>
                </div>
                <p className="text-slate-300 text-xs">{linkedAssignment.description}</p>
                <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Assigned to: <strong className="text-white">{linkedAssignment.assignedToName}</strong></span>
                  <span>By: {linkedAssignment.assignedByName} • Due: {linkedAssignment.dueDate || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>No staff member is currently assigned to this cable.</span>
                </div>
                {isStaff && (
                  <button
                    type="button"
                    onClick={() => openAssignWorkModal(selectedCable)}
                    className="text-amber-400 hover:underline font-semibold text-xs"
                  >
                    Assign Now &rarr;
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Engineering Sign-Offs & Individual Notes */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Engineering Sign-Offs & Individual Staff Notes</span>
              </div>
              <span className="text-[10px] text-slate-400">
                Staff note recorded per approval tier
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Level 1: Nayem Siddik */}
              <div className={`p-3 rounded-xl border space-y-2.5 transition-all ${
                approvedBy1 ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-slate-900 border-slate-800'
              }`}>
                <label 
                  title={!canApproveLevel(1) ? "Sign-off allowed only for Nayem Siddik (Senior Engineer) or Admin" : "Toggle Nayem Siddik approval"}
                  className={`flex items-center justify-between cursor-pointer select-none ${
                    !canApproveLevel(1) ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      disabled={!canApproveLevel(1)}
                      checked={approvedBy1}
                      onChange={(e) => setApprovedBy1(e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-emerald-500 disabled:opacity-50"
                    />
                    <div>
                      <span className="font-semibold text-xs text-white block">Nayem Siddik</span>
                      <span className="text-[9px] text-slate-400 block">Level 1 • Sr. Engineer</span>
                    </div>
                  </div>
                  {!canApproveLevel(1) ? (
                    <Lock className="w-3 h-3 text-slate-500" />
                  ) : approvedBy1 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : null}
                </label>

                {/* Individual Note for Nayem Siddik */}
                <div className="space-y-1 pt-1 border-t border-slate-800/60">
                  <label className="text-[10px] font-semibold text-amber-300 flex items-center gap-1">
                    <MessageSquare className="w-2.5 h-2.5" /> Nayem Siddik's Note:
                  </label>
                  <textarea
                    rows={2}
                    disabled={!canApproveLevel(1)}
                    placeholder="Enter site findings or notes before L1 approval..."
                    value={approvalNote1}
                    onChange={(e) => setApprovalNote1(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 disabled:opacity-75 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-400 placeholder:text-slate-600 resize-none"
                  />
                </div>
              </div>

              {/* Level 2: Mossadek Hossain */}
              <div className={`p-3 rounded-xl border space-y-2.5 transition-all ${
                approvedBy2 ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-slate-900 border-slate-800'
              }`}>
                <label 
                  title={!canApproveLevel(2) ? "Sign-off allowed only for Mossadek Hossain (Senior Engineer) or Admin" : "Toggle Mossadek Hossain approval"}
                  className={`flex items-center justify-between cursor-pointer select-none ${
                    !canApproveLevel(2) ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      disabled={!canApproveLevel(2)}
                      checked={approvedBy2}
                      onChange={(e) => setApprovedBy2(e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-emerald-500 disabled:opacity-50"
                    />
                    <div>
                      <span className="font-semibold text-xs text-white block">Mossadek Hossain</span>
                      <span className="text-[9px] text-slate-400 block">Level 2 • Sr. Engineer</span>
                    </div>
                  </div>
                  {!canApproveLevel(2) ? (
                    <Lock className="w-3 h-3 text-slate-500" />
                  ) : approvedBy2 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : null}
                </label>

                {/* Individual Note for Mossadek Hossain */}
                <div className="space-y-1 pt-1 border-t border-slate-800/60">
                  <label className="text-[10px] font-semibold text-amber-300 flex items-center gap-1">
                    <MessageSquare className="w-2.5 h-2.5" /> Mossadek Hossain's Note:
                  </label>
                  <textarea
                    rows={2}
                    disabled={!canApproveLevel(2)}
                    placeholder="Enter verification notes before L2 approval..."
                    value={approvalNote2}
                    onChange={(e) => setApprovalNote2(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 disabled:opacity-75 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-400 placeholder:text-slate-600 resize-none"
                  />
                </div>
              </div>

              {/* Level 3: Md Fahad */}
              <div className={`p-3 rounded-xl border space-y-2.5 transition-all ${
                approvedBy3 ? 'bg-amber-500/15 border-amber-500/50' : 'bg-slate-900 border-slate-800'
              }`}>
                <label 
                  title={!canApproveLevel(3) ? "Final sign-off allowed only for Md Fahad (Manager PP) or Admin" : "Toggle Md Fahad approval"}
                  className={`flex items-center justify-between cursor-pointer select-none ${
                    !canApproveLevel(3) ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      disabled={!canApproveLevel(3)}
                      checked={approvedBy3}
                      onChange={(e) => setApprovedBy3(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500 disabled:opacity-50"
                    />
                    <div>
                      <span className="font-bold text-xs text-white block">Md Fahad</span>
                      <span className="text-[9px] text-amber-400/80 block">Level 3 • Manager PP (Final)</span>
                    </div>
                  </div>
                  {!canApproveLevel(3) ? (
                    <Lock className="w-3 h-3 text-slate-500" />
                  ) : approvedBy3 ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  ) : null}
                </label>

                {/* Individual Note for Md Fahad */}
                <div className="space-y-1 pt-1 border-t border-slate-800/60">
                  <label className="text-[10px] font-semibold text-amber-300 flex items-center gap-1">
                    <MessageSquare className="w-2.5 h-2.5" /> Md Fahad's Final Note:
                  </label>
                  <textarea
                    rows={2}
                    disabled={!canApproveLevel(3)}
                    placeholder="Enter management notes before final approval..."
                    value={approvalNote3}
                    onChange={(e) => setApprovalNote3(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 disabled:opacity-75 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-400 placeholder:text-slate-600 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Drive Upload */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
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

          {drawingUrl && (
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Drawing / Proof Photo Attached
              </span>
              <a
                href={drawingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              >
                View Attachment <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Cable Specific Edit History (if available) */}
          {editHistory.filter(h => h.targetIdentifier === selectedCable.cableTag).length > 0 && (
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  <span>Recent Staff Edit Records for this Cable</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  {editHistory.filter(h => h.targetIdentifier === selectedCable.cableTag).length} edits
                </span>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 text-[11px] custom-scrollbar">
                {editHistory
                  .filter(h => h.targetIdentifier === selectedCable.cableTag)
                  .map(rec => (
                    <div key={rec.id} className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span className="text-amber-400 font-bold">{rec.staffName}</span>
                          <span className="text-slate-400 text-[10px]">({rec.action})</span>
                        </div>
                        {rec.notes && <p className="text-slate-400 italic text-[10.5px] mt-0.5">&ldquo;{rec.notes}&rdquo;</p>}
                      </div>
                      <span className="text-[9.5px] text-slate-500 shrink-0 font-mono">
                        {new Date(rec.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              {currentUser?.role === 'admin' ? 'Synced with Supabase Cloud DB' : 'Real-Time Cloud Synced'}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCable(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              {!canEdit ? (
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-xl transition-all"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Login to Edit</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
