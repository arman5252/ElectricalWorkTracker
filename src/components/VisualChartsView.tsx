import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { useApp } from '../context/AppContext';
import { normalizeStatus } from './ScheduleView';
import { 
  BarChart3, 
  Zap, 
  Layers, 
  Activity, 
  CheckCircle2, 
  PieChart as PieIcon,
  ShieldCheck,
  TrendingUp,
  Clock,
  UserCheck,
  ArrowRight
} from 'lucide-react';

export const VisualChartsView: React.FC = () => {
  const { 
    cables, 
    setActiveView, 
    setCableLayingFilter, 
    setPreCommissioningFilter, 
    setCommissioningFilter, 
    setApproverFilter 
  } = useApp();

  const total = cables.length || 1;

  // 1. Stage 1: Cable Laying counts (normalized, including both VEL and Bargen completions)
  const layingVel = cables.filter(c => normalizeStatus(c.cableLayingStatus) === 'Complete By VEL').length;
  const layingBargen = cables.filter(c => normalizeStatus(c.cableLayingStatus) === 'Complete By Bargen').length;
  const layingDone = layingVel + layingBargen;
  const layingProgress = cables.filter(c => normalizeStatus(c.cableLayingStatus) === 'Progress').length;
  const layingPending = cables.filter(c => {
    const s = normalizeStatus(c.cableLayingStatus);
    return s === 'Pending' || !s;
  }).length;

  // 2. Stage 2: Pre-Commissioning counts (normalized, including Bargen and VEL)
  const preBargen = cables.filter(c => normalizeStatus(c.preCommissioningStatus) === 'Complete By Bargen').length;
  const preVel = cables.filter(c => normalizeStatus(c.preCommissioningStatus) === 'Complete By VEL').length;
  const preDone = preBargen + preVel;
  const preProgress = cables.filter(c => normalizeStatus(c.preCommissioningStatus) === 'Progress').length;
  const prePending = cables.filter(c => {
    const s = normalizeStatus(c.preCommissioningStatus);
    return s === 'Pending' || !s;
  }).length;

  // 3. Stage 3: Commissioning counts (normalized, including Bargen and VEL)
  const commBargen = cables.filter(c => normalizeStatus(c.commissioningStatus) === 'Complete By Bargen').length;
  const commVel = cables.filter(c => normalizeStatus(c.commissioningStatus) === 'Complete By VEL').length;
  const commDone = commBargen + commVel;
  const commProgress = cables.filter(c => normalizeStatus(c.commissioningStatus) === 'Progress').length;
  const commPending = cables.filter(c => {
    const s = normalizeStatus(c.commissioningStatus);
    return s === 'Pending' || !s;
  }).length;

  // 4. Multi-level Approvals
  const naimSign = cables.filter(c => Boolean(c.approvedBy1)).length;
  const mosaddikSign = cables.filter(c => Boolean(c.approvedBy2)).length;
  const fahadSign = cables.filter(c => Boolean(c.approvedBy3)).length;

  // Comparative Workflow Chart Data
  const stagesComparisonData = [
    {
      stage: 'Cable Laying',
      complete: layingDone,
      progress: layingProgress,
      pending: layingPending,
    },
    {
      stage: 'Pre-Commissioning',
      complete: preDone,
      progress: preProgress,
      pending: prePending,
    },
    {
      stage: 'Commissioning',
      complete: commDone,
      progress: commProgress,
      pending: commPending,
    }
  ];

  // Cable Laying Donut Data
  const layingPieData = [
    { name: 'Complete By VEL', value: layingVel, color: '#10b981' },
    { name: 'Complete By Bargen', value: layingBargen, color: '#14b8a6' },
    { name: 'Progress', value: layingProgress, color: '#0ea5e9' },
    { name: 'Pending', value: layingPending, color: '#f43f5e' },
  ];

  // Commissioning Donut Data
  const commPieData = [
    { name: 'Complete (Bargen/VEL)', value: commDone, color: '#10b981' },
    { name: 'Progress', value: commProgress, color: '#0ea5e9' },
    { name: 'Pending', value: commPending, color: '#f43f5e' },
  ];

  // Approver Sign-off Bar Data
  const approverData = [
    { name: 'Nayem Siddik (Sr. Engr)', signed: naimSign, remaining: Math.max(0, total - naimSign) },
    { name: 'Mossadek Hossain (Sr. Engr)', signed: mosaddikSign, remaining: Math.max(0, total - mosaddikSign) },
    { name: 'Md Fahad (Manager PP)', signed: fahadSign, remaining: Math.max(0, total - fahadSign) },
  ];

  // Top Conductor Sizes
  const sizeCounts = cables.reduce((acc, c) => {
    acc[c.cableSize] = (acc[c.cableSize] || 0) + (c.runs || 1);
    return acc;
  }, {} as Record<string, number>);

  const sizeBarData = Object.entries(sizeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([size, runs]) => ({
      size,
      runs
    }));

  // Cables by Section (Top 8 sections)
  const sectionCounts = cables.reduce((acc, c) => {
    const shortSec = c.section.length > 22 ? c.section.substring(0, 20) + '...' : c.section;
    acc[shortSec] = (acc[shortSec] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sectionBarData = Object.entries(sectionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([section, count]) => ({
      section,
      count
    }));

  return (
    <div className="space-y-6">
      {/* 4 Summary Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        
        {/* Card 1: Cable Laying */}
        <div 
          onClick={() => { setCableLayingFilter('Done'); setActiveView('schedule'); }}
          className="p-5 glass-card hover:border-emerald-500/50 rounded-2xl relative overflow-hidden cursor-pointer transition-all group"
        >
          <div className="absolute -right-4 -top-4 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-bold text-slate-200">Cable Laying (Stage 1)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {layingDone} Done
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {layingDone} <span className="text-sm font-normal text-slate-400">/ {total}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            <strong className="text-emerald-300">{Math.round((layingDone / total) * 100)}%</strong> laid ({layingVel} VEL, {layingBargen} Bargen)
          </p>
          <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round((layingDone / total) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Pre-Commissioning */}
        <div 
          onClick={() => { setPreCommissioningFilter('Done'); setActiveView('schedule'); }}
          className="p-5 glass-card hover:border-teal-500/50 rounded-2xl relative overflow-hidden cursor-pointer transition-all group"
        >
          <div className="absolute -right-4 -top-4 w-28 h-28 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all"></div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-bold text-slate-200">Pre-Commissioning (Stage 2)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
              {preDone} Done
            </span>
          </div>
          <div className="text-3xl font-black text-teal-300">
            {preDone} <span className="text-sm font-normal text-slate-400">/ {total}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            <strong className="text-teal-300">{Math.round((preDone / total) * 100)}%</strong> Meggered & Cold tested OK
          </p>
          <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round((preDone / total) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 3: Commissioning */}
        <div 
          onClick={() => { setCommissioningFilter('Done'); setActiveView('schedule'); }}
          className="p-5 glass-card hover:border-cyan-500/50 rounded-2xl relative overflow-hidden cursor-pointer transition-all group"
        >
          <div className="absolute -right-4 -top-4 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-bold text-slate-200">Commissioning (Stage 3)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {commDone} Done
            </span>
          </div>
          <div className="text-3xl font-black text-cyan-300">
            {commDone} <span className="text-sm font-normal text-slate-400">/ {total}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            <strong className="text-cyan-300">{Math.round((commDone / total) * 100)}%</strong> Live energized & verified
          </p>
          <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round((commDone / total) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 4: Final Sign-off Md Fahad */}
        <div 
          onClick={() => { setApproverFilter('Md Fahad (Manager PP)'); setActiveView('schedule'); }}
          className="p-5 glass-card hover:border-amber-500/50 rounded-2xl relative overflow-hidden cursor-pointer transition-all group"
        >
          <div className="absolute -right-4 -top-4 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-bold text-slate-200">Final Approval</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-300">
            {fahadSign} <span className="text-sm font-normal text-slate-400">/ {total}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            <strong className="text-amber-300">{Math.round((fahadSign / total) * 100)}%</strong> Approved by Md Fahad (Manager PP)
          </p>
          <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round((fahadSign / total) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Row 1: Workflow Stages Comparison & Approver Sign-Offs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Stage Comparison Stacked Bar */}
        <div className="glass-card rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>3-Stage Engineering Workflow Status</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Real-time Progress</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Comparison between Cable Laying, Pre-Commissioning, and Commissioning stages.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stagesComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '0.75rem', 
                    fontSize: '12px' 
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="complete" name="Completed (VEL / Bargen)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="progress" name="Progress" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3-Tier Approver Sign-offs */}
        <div className="glass-card rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Approval Sign-Off Progress (Approve By)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Hierarchy</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Sign-off counts for Nayem Siddik (Sr. Engr), Mossadek Hossain (Sr. Engr), and Md Fahad (Manager PP).
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={approverData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={135} />
                <Tooltip 
                  formatter={(val: any) => [`${val} Cables`, 'Count']}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '0.75rem', 
                    fontSize: '12px' 
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="signed" name="Approved / Signed" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                <Bar dataKey="remaining" name="Awaiting Approval" fill="#334155" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Cable Sizing & Panel Section Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Cable Sizes & Total Runs */}
        <div className="glass-card rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Top Cable Sizes by Total Number of Runs</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Conductor Sizing</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            High volume runs including 1C x 500, 3.5C x 300, 4C x 2.5, etc.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sizeBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                <YAxis type="category" dataKey="size" stroke="#94a3b8" fontSize={10} width={90} />
                <Tooltip 
                  formatter={(val: any) => [`${val} Runs`, 'Total Runs']}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '0.75rem', 
                    fontSize: '12px' 
                  }}
                />
                <Bar dataKey="runs" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cables by Panel / System Section */}
        <div className="glass-card rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Cable Distribution by Section / Equipment Panel</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Top Panels</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Number of cable tags routed into each major control cabinet and MCC board.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="section" stroke="#94a3b8" fontSize={10} interval={0} angle={-15} textAnchor="end" height={55} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip 
                  formatter={(val: any) => [`${val} Cables`, 'Cables Count']}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '0.75rem', 
                    fontSize: '12px' 
                  }}
                />
                <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
