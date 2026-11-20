import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { normalizeStatus } from './ScheduleView';
import { 
  CheckCircle2, 
  Activity, 
  Clock, 
  Layers, 
  TrendingUp, 
  ArrowUpRight,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Filter
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
    scheduleTypeFilter,
    setActiveView 
  } = useApp();

  // Dynamic scope: if user selected LV or Control tab in schedule, metrics reflect that scope. Otherwise All.
  const scopedCables = useMemo(() => {
    if (scheduleTypeFilter !== 'All') {
      return cables.filter(c => c.scheduleType.includes(scheduleTypeFilter));
    }
    return cables;
  }, [cables, scheduleTypeFilter]);

  const total = scopedCables.length;

  // 1. Cable Laying metrics
  const layingVel = useMemo(() => scopedCables.filter(c => normalizeStatus(c.cableLayingStatus) === 'Complete By VEL').length, [scopedCables]);
  const layingBargen = useMemo(() => scopedCables.filter(c => normalizeStatus(c.cableLayingStatus) === 'Complete By Bargen').length, [scopedCables]);
  const layingDone = layingVel + layingBargen;
  const layingProgress = useMemo(() => scopedCables.filter(c => normalizeStatus(c.cableLayingStatus) === 'Progress').length, [scopedCables]);
  const layingPending = useMemo(() => scopedCables.filter(c => {
    const s = normalizeStatus(c.cableLayingStatus);
    return s === 'Pending' || !s;
  }).length, [scopedCables]);
  const layingPercent = total > 0 ? Math.round((layingDone / total) * 100) : 0;
  const layingProgressPercent = total > 0 ? Math.round((layingProgress / total) * 100) : 0;
  const layingPendingPercent = total > 0 ? Math.max(0, 100 - layingPercent - layingProgressPercent) : 0;

  // 2. Pre-Commissioning metrics
  const preBargen = useMemo(() => scopedCables.filter(c => normalizeStatus(c.preCommissioningStatus) === 'Complete By Bargen').length, [scopedCables]);
  const preVel = useMemo(() => scopedCables.filter(c => normalizeStatus(c.preCommissioningStatus) === 'Complete By VEL').length, [scopedCables]);
  const preDone = preBargen + preVel;
  const preProgress = useMemo(() => scopedCables.filter(c => normalizeStatus(c.preCommissioningStatus) === 'Progress').length, [scopedCables]);
  const prePending = useMemo(() => scopedCables.filter(c => {
    const s = normalizeStatus(c.preCommissioningStatus);
    return s === 'Pending' || !s;
  }).length, [scopedCables]);
  const prePercent = total > 0 ? Math.round((preDone / total) * 100) : 0;
  const preProgressPercent = total > 0 ? Math.round((preProgress / total) * 100) : 0;
  const prePendingPercent = total > 0 ? Math.max(0, 100 - prePercent - preProgressPercent) : 0;

  // 3. Commissioning metrics
  const commBargen = useMemo(() => scopedCables.filter(c => normalizeStatus(c.commissioningStatus) === 'Complete By Bargen').length, [scopedCables]);
  const commVel = useMemo(() => scopedCables.filter(c => normalizeStatus(c.commissioningStatus) === 'Complete By VEL').length, [scopedCables]);
  const commDone = commBargen + commVel;
  const commProgress = useMemo(() => scopedCables.filter(c => normalizeStatus(c.commissioningStatus) === 'Progress').length, [scopedCables]);
  const commPending = useMemo(() => scopedCables.filter(c => {
    const s = normalizeStatus(c.commissioningStatus);
    return s === 'Pending' || !s;
  }).length, [scopedCables]);
  const commPercent = total > 0 ? Math.round((commDone / total) * 100) : 0;
  const commProgressPercent = total > 0 ? Math.round((commProgress / total) * 100) : 0;
  const commPendingPercent = total > 0 ? Math.max(0, 100 - commPercent - commProgressPercent) : 0;

  // 4. Approvals
  const approvedNaim = useMemo(() => scopedCables.filter(c => Boolean(c.approvedBy1)).length, [scopedCables]);
  const approvedMosaddik = useMemo(() => scopedCables.filter(c => Boolean(c.approvedBy2)).length, [scopedCables]);
  const approvedFahad = useMemo(() => scopedCables.filter(c => Boolean(c.approvedBy3)).length, [scopedCables]);

  const scopeLabel = scheduleTypeFilter === 'LV Power' 
    ? 'LV Power Schedule' 
    : scheduleTypeFilter === 'Control' 
    ? 'Control Schedule' 
    : 'All Schedules';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
        
        {/* Phase 1: Cable Laying */}
        <div 
          onClick={() => { 
            setCableLayingFilter(cableLayingFilter === 'Done' ? 'All' : 'Done'); 
            setActiveView('schedule'); 
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden shadow-lg ${
            cableLayingFilter !== 'All'
              ? 'bg-slate-900 border-emerald-500 ring-1 ring-emerald-500/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Cable Laying
              </span>
              {scheduleTypeFilter !== 'All' && (
                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {scheduleTypeFilter.includes('LV') ? 'LV' : 'CTRL'}
                </span>
              )}
            </div>

            {/* Interactive Status Selector Dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <select
                value={cableLayingFilter}
                onChange={(e) => {
                  setCableLayingFilter(e.target.value);
                  setActiveView('schedule');
                }}
                className={`appearance-none cursor-pointer py-0.5 pl-2.5 pr-6 rounded-full text-[10.5px] font-bold border transition-all shadow-sm focus:outline-none ${
                  cableLayingFilter !== 'All'
                    ? 'bg-emerald-600 text-white border-emerald-400 ring-1 ring-emerald-400/50'
                    : 'bg-[#10b981] hover:bg-[#059669] text-white border-emerald-500/50'
                }`}
                title="Filter schedule by Cable Laying status"
              >
                <option value="All" className="bg-slate-900 text-slate-300">All Laying ({total})</option>
                <option value="Done" className="bg-slate-900 text-emerald-400 font-bold">✓ Total Done ({layingDone})</option>
                <option value="Complete By VEL" className="bg-slate-900 text-emerald-300">✓ Complete By VEL ({layingVel})</option>
                <option value="Complete By Bargen" className="bg-slate-900 text-teal-300">✓ Complete By Bargen ({layingBargen})</option>
                <option value="Progress" className="bg-slate-900 text-green-300">⏳ Progress ({layingProgress})</option>
                <option value="Pending" className="bg-slate-900 text-rose-400">⏱ Pending ({layingPending})</option>
              </select>
              <ChevronDown className="w-2.5 h-2.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/90" />
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl font-extrabold text-white">
              {layingDone} <span className="text-xs font-normal text-slate-400">/ {total}</span>
            </div>
            <span className="text-xs font-bold text-emerald-400 font-mono">{layingPercent}%</span>
          </div>

          {/* 3-Part Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden flex">
            <div 
              className="bg-[#10b981] h-full transition-all duration-300" 
              style={{ width: `${layingPercent}%` }} 
              title={`Total Done: ${layingDone} (${layingVel} VEL, ${layingBargen} Bargen)`}
            />
            <div 
              className="bg-[#86efac] h-full transition-all duration-300" 
              style={{ width: `${layingProgressPercent}%` }} 
              title={`Progress: ${layingProgress}`}
            />
            <div 
              className="bg-[#991b1b] h-full transition-all duration-300" 
              style={{ width: `${layingPendingPercent}%` }} 
              title={`Pending: ${layingPending}`}
            />
          </div>

          {/* Interactive Breakdown Pills */}
          <div className="flex items-center justify-between mt-2.5 text-[10px]">
            <span 
              onClick={(e) => {
                e.stopPropagation();
                setCableLayingFilter(cableLayingFilter === 'Done' ? 'All' : 'Done');
                setActiveView('schedule');
              }}
              className={`font-semibold cursor-pointer transition-colors ${
                cableLayingFilter === 'Done' ? 'text-emerald-300 underline font-bold' : 'text-emerald-400 hover:text-emerald-300'
              }`}
              title={`Click to view all ${layingDone} completed cables (${layingVel} by VEL, ${layingBargen} by Bargen)`}
            >
              {layingDone} Done <span className="opacity-75 font-normal text-[9px]">({layingVel}V / {layingBargen}B)</span>
            </span>

            <span 
              onClick={(e) => {
                e.stopPropagation();
                setCableLayingFilter(cableLayingFilter === 'Progress' ? 'All' : 'Progress');
                setActiveView('schedule');
              }}
              className={`cursor-pointer transition-colors ${
                cableLayingFilter === 'Progress' ? 'text-green-300 underline font-bold' : 'text-emerald-200/90 hover:text-white'
              }`}
              title={`Click to view ${layingProgress} cables in progress`}
            >
              {layingProgress} Progress
            </span>

            <span 
              onClick={(e) => {
                e.stopPropagation();
                setCableLayingFilter(cableLayingFilter === 'Pending' ? 'All' : 'Pending');
                setActiveView('schedule');
              }}
              className={`font-semibold cursor-pointer transition-colors ${
                cableLayingFilter === 'Pending' ? 'text-rose-300 underline font-bold' : 'text-rose-400 hover:text-rose-300'
              }`}
              title={`Click to view ${layingPending} pending cables`}
            >
              {layingPending} Pending
            </span>
          </div>
        </div>

        {/* Phase 2: Pre-Commissioning */}
        <div 
          onClick={() => { 
            setPreCommissioningFilter(preCommissioningFilter === 'Done' ? 'All' : 'Done'); 
            setActiveView('schedule'); 
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden shadow-lg ${
            preCommissioningFilter !== 'All'
              ? 'bg-slate-900 border-emerald-600 ring-1 ring-emerald-600/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Pre-Commissioning
              </span>
              {scheduleTypeFilter !== 'All' && (
                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {scheduleTypeFilter.includes('LV') ? 'LV' : 'CTRL'}
                </span>
              )}
            </div>

            {/* Interactive Status Selector Dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <select
                value={preCommissioningFilter}
                onChange={(e) => {
                  setPreCommissioningFilter(e.target.value);
                  setActiveView('schedule');
                }}
                className={`appearance-none cursor-pointer py-0.5 pl-2.5 pr-6 rounded-full text-[10.5px] font-bold border transition-all shadow-sm focus:outline-none ${
                  preCommissioningFilter !== 'All'
                    ? 'bg-emerald-700 text-white border-emerald-500 ring-1 ring-emerald-500/50'
                    : 'bg-[#047857] hover:bg-[#065f46] text-white border-emerald-600/50'
                }`}
                title="Filter schedule by Pre-Commissioning status"
              >
                <option value="All" className="bg-slate-900 text-slate-300">All Pre-Comm ({total})</option>
                <option value="Done" className="bg-slate-900 text-emerald-400 font-bold">✓ Total Done ({preDone})</option>
                <option value="Complete By Bargen" className="bg-slate-900 text-emerald-300">✓ Complete By Bargen ({preBargen})</option>
                <option value="Complete By VEL" className="bg-slate-900 text-teal-300">✓ Complete By VEL ({preVel})</option>
                <option value="Progress" className="bg-slate-900 text-green-300">⏳ Progress ({preProgress})</option>
                <option value="Pending" className="bg-slate-900 text-rose-400">⏱ Pending ({prePending})</option>
              </select>
              <ChevronDown className="w-2.5 h-2.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/90" />
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl font-extrabold text-white">
              {preDone} <span className="text-xs font-normal text-slate-400">/ {total}</span>
            </div>
            <span className="text-xs font-bold text-emerald-400 font-mono">{prePercent}%</span>
          </div>

          {/* 3-Part Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden flex">
            <div 
              className="bg-[#047857] h-full transition-all duration-300" 
              style={{ width: `${prePercent}%` }} 
              title={`Total Done: ${preDone} (${preBargen} Bargen, ${preVel} VEL)`}
            />
            <div 
              className="bg-[#86efac] h-full transition-all duration-300" 
              style={{ width: `${preProgressPercent}%` }} 
              title={`Progress: ${preProgress}`}
            />
            <div 
              className="bg-[#991b1b] h-full transition-all duration-300" 
              style={{ width: `${prePendingPercent}%` }} 
              title={`Pending: ${prePending}`}
            />
          </div>

          {/* Interactive Breakdown Pills */}
          <div className="flex items-center justify-between mt-2.5 text-[10px]">
            <span 
              onClick={(e) => {
                e.stopPropagation();
                setPreCommissioningFilter(preCommissioningFilter === 'Done' ? 'All' : 'Done');
                setActiveView('schedule');
              }}
              className={`font-semibold cursor-pointer transition-colors ${
                preCommissioningFilter === 'Done' ? 'text-emerald-300 underline font-bold' : 'text-emerald-400 hover:text-emerald-300'
              }`}
              title={`Click to view all ${preDone} completed cables (${preBargen} by Bargen, ${preVel} by VEL)`}
            >
              {preDone} Done <span className="opacity-75 font-normal text-[9px]">({preBargen}B / {preVel}V)</span>
            </span>

            <span 
              onClick={(e) => {
                e.stopPropagation();
                setPreCommissioningFilter(preCommissioningFilter === 'Progress' ? 'All' : 'Progress');
                setActiveView('schedule');
              }}
              className={`cursor-pointer transition-colors ${
                preCommissioningFilter === 'Progress' ? 'text-green-300 underline font-bold' : 'text-emerald-200/90 hover:text-white'
              }`}
              title={`Click to view ${preProgress} cables in progress`}
            >
              {preProgress} Progress
            </span>

            <span 
              onClick={(e) => {
                e.stopPropagation();
                setPreCommissioningFilter(preCommissioningFilter === 'Pending' ? 'All' : 'Pending');
                setActiveView('schedule');
              }}
              className={`font-semibold cursor-pointer transition-colors ${
                preCommissioningFilter === 'Pending' ? 'text-rose-300 underline font-bold' : 'text-rose-400 hover:text-rose-300'
              }`}
              title={`Click to view ${prePending} pending cables`}
            >
              {prePending} Pending
            </span>
          </div>
        </div>

        {/* Phase 3: Commissioning */}
        <div 
          onClick={() => { 
            setCommissioningFilter(commissioningFilter === 'Done' ? 'All' : 'Done'); 
            setActiveView('schedule'); 
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden shadow-lg ${
            commissioningFilter !== 'All'
              ? 'bg-slate-900 border-emerald-600 ring-1 ring-emerald-600/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Commissioning
              </span>
              {scheduleTypeFilter !== 'All' && (
                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {scheduleTypeFilter.includes('LV') ? 'LV' : 'CTRL'}
                </span>
              )}
            </div>

            {/* Interactive Status Selector Dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <select
                value={commissioningFilter}
                onChange={(e) => {
                  setCommissioningFilter(e.target.value);
                  setActiveView('schedule');
                }}
                className={`appearance-none cursor-pointer py-0.5 pl-2.5 pr-6 rounded-full text-[10.5px] font-bold border transition-all shadow-sm focus:outline-none ${
                  commissioningFilter !== 'All'
                    ? 'bg-emerald-700 text-white border-emerald-500 ring-1 ring-emerald-500/50'
                    : 'bg-[#047857] hover:bg-[#065f46] text-white border-emerald-600/50'
                }`}
                title="Filter schedule by Commissioning status"
              >
                <option value="All" className="bg-slate-900 text-slate-300">All Comm ({total})</option>
                <option value="Done" className="bg-slate-900 text-emerald-400 font-bold">✓ Total Done ({commDone})</option>
                <option value="Complete By Bargen" className="bg-slate-900 text-emerald-300">✓ Complete By Bargen ({commBargen})</option>
                <option value="Complete By VEL" className="bg-slate-900 text-teal-300">✓ Complete By VEL ({commVel})</option>
                <option value="Progress" className="bg-slate-900 text-green-300">⏳ Progress ({commProgress})</option>
                <option value="Pending" className="bg-slate-900 text-rose-400">⏱ Pending ({commPending})</option>
              </select>
              <ChevronDown className="w-2.5 h-2.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/90" />
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl font-extrabold text-white">
              {commDone} <span className="text-xs font-normal text-slate-400">/ {total}</span>
            </div>
            <span className="text-xs font-bold text-emerald-400 font-mono">{commPercent}%</span>
          </div>

          {/* 3-Part Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden flex">
            <div 
              className="bg-[#047857] h-full transition-all duration-300" 
              style={{ width: `${commPercent}%` }} 
              title={`Total Done: ${commDone} (${commBargen} Bargen, ${commVel} VEL)`}
            />
            <div 
              className="bg-[#86efac] h-full transition-all duration-300" 
              style={{ width: `${commProgressPercent}%` }} 
              title={`Progress: ${commProgress}`}
            />
            <div 
              className="bg-[#991b1b] h-full transition-all duration-300" 
              style={{ width: `${commPendingPercent}%` }} 
              title={`Pending: ${commPending}`}
            />
          </div>

          {/* Interactive Breakdown Pills */}
          <div className="flex items-center justify-between mt-2.5 text-[10px]">
            <span 
              onClick={(e) => {
                e.stopPropagation();
                setCommissioningFilter(commissioningFilter === 'Done' ? 'All' : 'Done');
                setActiveView('schedule');
              }}
              className={`font-semibold cursor-pointer transition-colors ${
                commissioningFilter === 'Done' ? 'text-emerald-300 underline font-bold' : 'text-emerald-400 hover:text-emerald-300'
              }`}
              title={`Click to view all ${commDone} completed cables (${commBargen} by Bargen, ${commVel} by VEL)`}
            >
              {commDone} Done <span className="opacity-75 font-normal text-[9px]">({commBargen}B / {commVel}V)</span>
            </span>

            <span 
              onClick={(e) => {
                e.stopPropagation();
                setCommissioningFilter(commissioningFilter === 'Progress' ? 'All' : 'Progress');
                setActiveView('schedule');
              }}
              className={`cursor-pointer transition-colors ${
                commissioningFilter === 'Progress' ? 'text-green-300 underline font-bold' : 'text-emerald-200/90 hover:text-white'
              }`}
              title={`Click to view ${commProgress} cables in progress`}
            >
              {commProgress} Progress
            </span>

            <span 
              onClick={(e) => {
                e.stopPropagation();
                setCommissioningFilter(commissioningFilter === 'Pending' ? 'All' : 'Pending');
                setActiveView('schedule');
              }}
              className={`font-semibold cursor-pointer transition-colors ${
                commissioningFilter === 'Pending' ? 'text-rose-300 underline font-bold' : 'text-rose-400 hover:text-rose-300'
              }`}
              title={`Click to view ${commPending} pending cables`}
            >
              {commPending} Pending
            </span>
          </div>
        </div>

        {/* Phase 4: Approve By (Sign-offs) */}
        <div 
          className="p-4 rounded-2xl border transition-all bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-lg"
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
            <div 
              onClick={() => {
                setApproverFilter(approverFilter === 'Nayem Siddik (Sr. Engr)' ? 'All' : 'Nayem Siddik (Sr. Engr)');
                setActiveView('schedule');
              }}
              className={`flex items-center justify-between text-[11px] p-1 rounded-lg cursor-pointer transition-colors ${
                approverFilter === 'Nayem Siddik (Sr. Engr)' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'hover:bg-slate-800 text-slate-400'
              }`}
              title="Click to filter cables signed by Level 1: Nayem Siddik"
            >
              <span>Level 1: <strong className="text-white">Nayem Siddik</strong></span>
              <span className="font-mono font-bold text-emerald-400">{approvedNaim} Signed</span>
            </div>
            <div 
              onClick={() => {
                setApproverFilter(approverFilter === 'Mossadek Hossain (Sr. Engr)' ? 'All' : 'Mossadek Hossain (Sr. Engr)');
                setActiveView('schedule');
              }}
              className={`flex items-center justify-between text-[11px] p-1 rounded-lg cursor-pointer transition-colors ${
                approverFilter === 'Mossadek Hossain (Sr. Engr)' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'hover:bg-slate-800 text-slate-400'
              }`}
              title="Click to filter cables signed by Level 2: Mossadek Hossain"
            >
              <span>Level 2: <strong className="text-white">Mossadek Hossain</strong></span>
              <span className="font-mono font-bold text-emerald-400">{approvedMosaddik} Signed</span>
            </div>
            <div 
              onClick={() => {
                setApproverFilter(approverFilter === 'Md Fahad (Manager PP)' ? 'All' : 'Md Fahad (Manager PP)');
                setActiveView('schedule');
              }}
              className={`flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800 p-1 rounded-lg cursor-pointer transition-colors ${
                approverFilter === 'Md Fahad (Manager PP)' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'hover:bg-slate-800 text-slate-400'
              }`}
              title="Click to filter cables approved by Final: Md Fahad"
            >
              <span className="text-amber-300 font-semibold">Final: <strong>Md Fahad (Manager PP)</strong></span>
              <span className="font-mono font-bold text-amber-400">{approvedFahad} Approved</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
