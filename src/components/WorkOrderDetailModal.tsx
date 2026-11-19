import React from 'react';
import { 
  Zap, 
  Printer, 
  X, 
  Lock, 
  Calendar, 
  User, 
  MapPin, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  ShieldAlert, 
  ExternalLink,
  FileSpreadsheet
} from 'lucide-react';
import { WorkOrder } from '../types';
import { useApp } from '../context/AppContext';

interface WorkOrderDetailModalProps {
  workOrder: WorkOrder | null;
  onClose: () => void;
}

export const WorkOrderDetailModal: React.FC<WorkOrderDetailModalProps> = ({
  workOrder,
  onClose
}) => {
  const { updateWorkOrder, state } = useApp();

  if (!workOrder) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleToggleStatus = (newStatus: WorkOrder['status']) => {
    updateWorkOrder(workOrder.id, {
      status: newStatus,
      completedDate: newStatus === 'Completed' ? new Date().toISOString().split('T')[0] : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto no-print">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 print:p-0 print:border-none print:shadow-none">
        
        {/* Modal Controls (No print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
              {workOrder.id}
            </span>
            <span className="text-xs text-slate-400">Electrical Work Permit & Maintenance Certificate</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Permit</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="pt-6 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                {state.settings.companyName}
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {workOrder.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-300">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                  {workOrder.category}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  {workOrder.voltage}
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                  Status: {workOrder.status}
                </span>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6">
              <div className="text-xs text-slate-400">Priority</div>
              <div className="text-sm font-bold text-rose-400 uppercase tracking-wide">
                {workOrder.priority}
              </div>
              <div className="text-xs text-slate-400 mt-2">Due Date</div>
              <div className="text-sm font-semibold text-slate-200">
                {workOrder.dueDate}
              </div>
            </div>
          </div>

          {/* LOTO / Safety Permit Callout */}
          {workOrder.lotoRequired ? (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-200 uppercase tracking-wide">
                    LOTO SAFETY ISOLATION ACTIVE
                  </span>
                  <span className="font-mono font-bold text-rose-300">
                    Tag: {workOrder.lotoTagNumber || 'LOTO-ASSIGNED'}
                  </span>
                </div>
                <p className="text-rose-300/80 mt-1">
                  Arc Flash Hazard Level: <span className="font-bold text-rose-200">{workOrder.arcFlashCategory || 'Cat 2 (8 cal/cm²)'}</span>.
                  Ensure zero-energy verification and portable grounds are applied before touching busbars.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Standard Low Voltage Protocol applies. No High Voltage LOTO lock recorded.</span>
              <span className="text-emerald-400 font-medium">Safe Work Cleared</span>
            </div>
          )}

          {/* Key Parameters 4-Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-slate-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location
              </div>
              <div className="font-semibold text-slate-200">{workOrder.location}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-slate-400 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> Lead Wireman
              </div>
              <div className="font-semibold text-slate-200 truncate">{workOrder.leadElectrician}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-slate-400 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Logged Hours
              </div>
              <div className="font-semibold text-slate-200">
                {workOrder.actualHours} hrs <span className="text-slate-400 font-normal">({workOrder.estimatedHours} est)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-slate-400 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Total Cost
              </div>
              <div className="font-semibold text-emerald-400">
                ${workOrder.totalCost.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Scope of Work */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-200 uppercase tracking-wide">
              Work Instructions & Engineering Scope
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 leading-relaxed">
              {workOrder.description || 'Standard preventive maintenance and inspection routine.'}
            </div>
          </div>

          {/* Findings & Test Results */}
          {workOrder.findings && (
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-200 uppercase tracking-wide">
                Inspection Findings & Diagnostic Measurements
              </h4>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 leading-relaxed font-mono">
                {workOrder.findings}
              </div>
            </div>
          )}

          {/* Attached Photo / Google Drive Drawing */}
          {workOrder.imageUrl && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-200 uppercase tracking-wide">
                  Field Photo & Proof Attachment (Google Drive)
                </h4>
                <a
                  href={workOrder.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  Open Full Resolution in Drive <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-800 max-h-72 bg-slate-950 flex items-center justify-center">
                <img
                  src={workOrder.imageUrl}
                  alt={workOrder.title}
                  className="max-h-72 w-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Signatures & Certification block (Essential for electrical permits) */}
          <div className="pt-6 border-t border-slate-800 grid grid-cols-2 gap-8 text-xs">
            <div>
              <div className="text-slate-400 mb-6">Electrical Supervisor / Engineer Sign-off:</div>
              <div className="border-b border-slate-600 pb-1 font-mono text-slate-300">
                {workOrder.leadElectrician}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Authorized Certifier Stamp & Date</div>
            </div>

            <div>
              <div className="text-slate-400 mb-6">Facility Safety Officer / LOTO Clearance:</div>
              <div className="border-b border-slate-600 pb-1 font-mono text-slate-300">
                Zahid Hasan (LOTO Officer)
              </div>
              <div className="text-[10px] text-slate-400 mt-1">De-energization & Grounding Verified</div>
            </div>
          </div>
        </div>

        {/* Footer Quick Status Toggles (No Print) */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between gap-3 no-print">
          <div className="text-xs text-slate-400">
            Created on {workOrder.createdAt.split('T')[0]}
          </div>

          <div className="flex items-center gap-2">
            {workOrder.status !== 'Completed' ? (
              <button
                onClick={() => handleToggleStatus('Completed')}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Completed & Sign Off</span>
              </button>
            ) : (
              <button
                onClick={() => handleToggleStatus('In Progress')}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
              >
                <span>Re-open Work Order</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
