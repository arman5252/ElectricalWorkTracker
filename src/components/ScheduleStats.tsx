import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckCircle2, 
  Activity, 
  Clock, 
  Layers, 
  TrendingUp, 
  ArrowUpRight,
  ShieldCheck,
  UserCheck,
  ChevronDown
} from 'lucide-react';

export const ScheduleStats: React.FC = () => {
  const { 
    cables, 
    cableLayingFilter,
    setCableLayingFilter,
    preCommissioningFilter,
    setPreCommissioningFilter,
    commissioningFilter,
    setCommissioningFilter,
    approverFilter,
    setApproverFilter,
    setActiveView 
  } = useApp();

  const total = cables.length;

  // 1. Cable Laying metrics
  const velComplete = cables.filter(c => c.cableLayingStatus === 'Complete By VEL').length;
  const velProgress = cables.filter(c => c.cableLayingStatus === 'Progress').length;
  const velPending = cables.filter(c => c.cableLayingStatus === 'Pending').length;
  const velPercent = total > 0 ? Math.round((velComplete / total) * 100) : 0;

  // 2. Pre-Commissioning metrics
  const preBargenComplete = cables.filter(c => c.preCommissioningStatus === 'Complete By Bargen').length;
  const preProgress = cables.filter(c => c.preCommissioningStatus === 'Progress').length;
  const prePending = cables.filter(c => c.preCommissioningStatus === 'Pending').length;
  const prePercent = total > 0 ? Math.round((preBargenComplete / total) * 100) : 0;

  // 3. Commissioning metrics
  const commBargenComplete = cables.filter(c => c.commissioningStatus === 'Complete By Bargen').length;
  const commProgress = cables.filter(c => c.commissioningStatus === 'Progress').length;
  const commPending = cables.filter(c => c.commissioningStatus === 'Pending').length;
  const commPercent = total > 0 ? Math.round((commBargenComplete / total) * 100) : 0;

  // 4. Approvals
  const approvedFahad = cables.filter(c => c.approvedBy3 === 'Fahad Sir').length;
  const approvedMosaddik = cables.filter(c => c.approvedBy2 === 'Mosaddik Bhai').length;
  const approvedNaim = cables.filter(c => c.approvedBy1 === 'Naim Bhai').length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
        
        {/* Phase 1: Cable Laying */}
        <div 
          onClick={() => { setCableLayingFilter(cableLayingFilter === 'Complete By VEL' ? 'All' : 'Complete By VEL'); setActiveView('schedule'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden shadow-lg ${
            cableLayingFilter === 'Complete By VEL'
              ? 'bg-slate-900 border-emerald-500 ring-1 ring-emerald-500/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Cable Laying
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10b981] text-white flex items-center gap-1 shadow-sm">
              <span>Complete By VEL</span>
              <ChevronDown className="w-2.5 h-2.5" />
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl font-extrabold text-white">
              {velComplete} <span className="text-xs font-normal text-slate-400">/ {total}</span>
            </div>
            <span className="text-xs font-bold text-emerald-400 font-mono">{velPercent}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden flex">
            <div className="bg-[#10b981] h-full" style={{ width: `${velPercent}%` }} title={`Complete By VEL: ${velComplete}`}></div>
            <div className="bg-[#86efac] h-full" style={{ width: `${Math.round((velProgress / total) * 100)}%` }} title={`Progress: ${velProgress}`}></div>
            <div className="bg-[#991b1b] h-full" style={{ width: `${Math.round((velPending / total) * 100)}%` }} title={`Pending: ${velPending}`}></div>
          </div>

          <div className="flex items-center justify-between mt-2.5 text-[10px] text-slate-400">
            <span className="text-emerald-400 font-semibold">{velComplete} Done</span>
            <span className="text-emerald-200">{velProgress} Progress</span>
            <span className="text-rose-400 font-semibold">{velPending} Pending</span>
          </div>
        </div>

        {/* Phase 2: Pre-Commissioning */}
        <div 
          onClick={() => { setPreCommissioningFilter(preCommissioningFilter === 'Complete By Bargen' ? 'All' : 'Complete By Bargen'); setActiveView('schedule'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden shadow-lg ${
            preCommissioningFilter === 'Complete By Bargen'
              ? 'bg-slate-900 border-emerald-600 ring-1 ring-emerald-600/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Pre-Commissioning
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#047857] text-white flex items-center gap-1 shadow-sm">
              <span>Complete By Bargen</span>
              <ChevronDown className="w-2.5 h-2.5" />
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl font-extrabold text-white">
              {preBargenComplete} <span className="text-xs font-normal text-slate-400">/ {total}</span>
            </div>
            <span className="text-xs font-bold text-emerald-400 font-mono">{prePercent}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden flex">
            <div className="bg-[#047857] h-full" style={{ width: `${prePercent}%` }} title={`Complete By Bargen: ${preBargenComplete}`}></div>
            <div className="bg-[#86efac] h-full" style={{ width: `${Math.round((preProgress / total) * 100)}%` }} title={`Progress: ${preProgress}`}></div>
            <div className="bg-[#991b1b] h-full" style={{ width: `${Math.round((prePending / total) * 100)}%` }} title={`Pending: ${prePending}`}></div>
          </div>

          <div className="flex items-center justify-between mt-2.5 text-[10px] text-slate-400">
            <span className="text-emerald-400 font-semibold">{preBargenComplete} Done</span>
            <span className="text-emerald-200">{preProgress} Progress</span>
            <span className="text-rose-400 font-semibold">{prePending} Pending</span>
          </div>
        </div>

        {/* Phase 3: Commissioning */}
        <div 
          onClick={() => { setCommissioningFilter(commissioningFilter === 'Complete By Bargen' ? 'All' : 'Complete By Bargen'); setActiveView('schedule'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden shadow-lg ${
            commissioningFilter === 'Complete By Bargen'
              ? 'bg-slate-900 border-emerald-600 ring-1 ring-emerald-600/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Commissioning
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#047857] text-white flex items-center gap-1 shadow-sm">
              <span>Complete By Bargen</span>
              <ChevronDown className="w-2.5 h-2.5" />
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl font-extrabold text-white">
              {commBargenComplete} <span className="text-xs font-normal text-slate-400">/ {total}</span>
            </div>
            <span className="text-xs font-bold text-emerald-400 font-mono">{commPercent}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden flex">
            <div className="bg-[#047857] h-full" style={{ width: `${commPercent}%` }} title={`Complete By Bargen: ${commBargenComplete}`}></div>
            <div className="bg-[#86efac] h-full" style={{ width: `${Math.round((commProgress / total) * 100)}%` }} title={`Progress: ${commProgress}`}></div>
            <div className="bg-[#991b1b] h-full" style={{ width: `${Math.round((commPending / total) * 100)}%` }} title={`Pending: ${commPending}`}></div>
          </div>

          <div className="flex items-center justify-between mt-2.5 text-[10px] text-slate-400">
            <span className="text-emerald-400 font-semibold">{commBargenComplete} Done</span>
            <span className="text-emerald-200">{commProgress} Progress</span>
            <span className="text-rose-400 font-semibold">{commPending} Pending</span>
          </div>
        </div>

        {/* Phase 4: Approve By (Sign-offs) */}
        <div 
          onClick={() => { setApproverFilter(approverFilter === 'Fahad Sir' ? 'All' : 'Fahad Sir'); setActiveView('schedule'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden shadow-lg ${
            approverFilter === 'Fahad Sir'
              ? 'bg-slate-900 border-amber-500 ring-1 ring-amber-500/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Approve By (Sign-off)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              <span>3-Level Sign-off</span>
            </span>
          </div>

          <div className="space-y-1.5 mt-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Level 1: <strong className="text-white">Naim Bhai</strong></span>
              <span className="font-mono font-bold text-slate-200">{approvedNaim} Signed</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Level 2: <strong className="text-white">Mosaddik Bhai</strong></span>
              <span className="font-mono font-bold text-slate-200">{approvedMosaddik} Signed</span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
              <span className="text-amber-300 font-semibold">Final: <strong>Fahad Sir</strong></span>
              <span className="font-mono font-bold text-amber-400">{approvedFahad} Approved</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
