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
  UserCheck
} from 'lucide-react';

export const VisualChartsView: React.FC = () => {
  const { cables, setActiveView, setCableLayingFilter, setPreCommissioningFilter, setCommissioningFilter, setApproverFilter } = useApp();

  const total = cables.length;

  // 1. Stage 1: Cable Laying counts
  const velComplete = cables.filter(c => c.cableLayingStatus === 'Complete By VEL').length;
  const velProgress = cables.filter(c => c.cableLayingStatus === 'Progress').length;
  const velPending = cables.filter(c => c.cableLayingStatus === 'Pending').length;

  // 2. Stage 2: Pre-Commissioning counts
  const preComplete = cables.filter(c => c.preCommissioningStatus === 'Complete By Bargen').length;
  const preProgress = cables.filter(c => c.preCommissioningStatus === 'Progress').length;
  const prePending = cables.filter(c => c.preCommissioningStatus === 'Pending').length;

  // 3. Stage 3: Commissioning counts
  const commComplete = cables.filter(c => c.commissioningStatus === 'Complete By Bargen').length;
  const commProgress = cables.filter(c => c.commissioningStatus === 'Progress').length;
  const commPending = cables.filter(c => c.commissioningStatus === 'Pending').length;

  // 4. Multi-level Approvals
  const naimSign = cables.filter(c => Boolean(c.approvedBy1)).length;
  const mosaddikSign = cables.filter(c => Boolean(c.approvedBy2)).length;
  const fahadSign = cables.filter(c => Boolean(c.approvedBy3)).length;

  // Comparative Workflow Chart Data
  const stagesComparisonData = [
    {
      stage: 'Cable Laying',
      complete: velComplete,
      progress: velProgress,
      pending: velPending,
    },
    {
      stage: 'Pre-Commissioning',
      complete: preComplete,
      progress: preProgress,
      pending: prePending,
    },
    {
      stage: 'Commissioning',
      complete: commComplete,
      progress: commProgress,
      pending: commPending,
    }
  ];

  // Cable Laying Donut Data
  const layingPieData = [
    { name: 'Complete By VEL', value: velComplete, color: '#10b981' },
    { name: 'Progress', value: velProgress, color: '#86efac' },
    { name: 'Pending', value: velPending, color: '#991b1b' },
  ];

  // Commissioning Donut Data
  const commPieData = [
    { name: 'Complete By Bargen', value: commComplete, color: '#047857' },
    { name: 'Progress', value: commProgress, color: '#86efac' },
    { name: 'Pending', value: commPending, color: '#991b1b' },
  ];

  // Approver Sign-off Bar Data
  const approverData = [
    { name: 'Nayem Siddik (Sr. Engr)', signed: naimSign, remaining: total - naimSign },
    { name: 'Mossadek Hossain (Sr. Engr)', signed: mosaddikSign, remaining: total - mosaddikSign },
    { name: 'Md Fahad (Manager PP)', signed: fahadSign, remaining: total - fahadSign },
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
        
        {/* Card 1: Cable Laying VEL */}
        <div 
          onClick={() => { setCableLayingFilter('Complete By VEL'); setActiveView('schedule'); }}
          className="p-5 bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-emerald-500/50 rounded-2xl relative overflow-hidden shadow-lg cursor-pointer transition-all"
        >
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-semibold text-slate-300">Cable Laying (VEL)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10b981] text-white">
              Complete By VEL
            </span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {velComplete} <span className="text-sm font-normal text-slate-400">/ {total}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {Math.round((velComplete / total) * 100)}% laid on cable tray by VEL
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-[#10b981] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round((velComplete / total) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Pre-Commissioning Bargen */}
        <div 
          onClick={() => { setPreCommissioningFilter('Complete By Bargen'); setActiveView('schedule'); }}
          className="p-5 bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-emerald-600/50 rounded-2xl relative overflow-hidden shadow-lg cursor-pointer transition-all"
        >
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-600/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-semibold text-slate-300">Pre-Commissioning</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#047857] text-white">
              Complete By Bargen
            </span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-300">
            {preComplete} <span className="text-sm font-normal text-slate-400">/ {total}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {Math.round((preComplete / total) * 100)}% Meggered & Cold tested OK
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-[#047857] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round((preComplete / total) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 3: Commissioning Bargen */}
        <div 
          onClick={() => { setCommissioningFilter('Complete By Bargen'); setActiveView('schedule'); }}
          className="p-5 bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-emerald-600/50 rounded-2xl relative overflow-hidden shadow-lg cursor-pointer transition-all"
        >
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-600/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-semibold text-slate-300">Commissioning</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#047857] text-white">
              Complete By Bargen
            </span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-300">
            {commComplete} <span className="text-sm font-normal text-slate-400">/ {total}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {Math.round((commComplete / total) * 100)}% Live energized & verified
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-[#047857] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round((commComplete / total) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 4: Final Sign-off Fahad Sir */}
        <div 
          onClick={() => { setApproverFilter('Fahad Sir'); setActiveView('schedule'); }}
          className="p-5 bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-amber-500/50 rounded-2xl relative overflow-hidden shadow-lg cursor-pointer transition-all"
        >
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-semibold text-slate-300">Final Approval</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-300">
            {fahadSign} <span className="text-sm font-normal text-slate-400">/ {total}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Signed off by Fahad Sir (Final Approver)
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
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
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
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
                <Bar dataKey="progress" name="Progress" fill="#86efac" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#991b1b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3-Tier Approver Sign-offs */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
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
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={120} />
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
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
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
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
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
