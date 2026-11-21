import React from 'react';
import { useApp } from '../context/AppContext';
import { Boxes, Layers, ExternalLink, Zap, ArrowRight, Gauge, CheckCircle2 } from 'lucide-react';

export const BoqView: React.FC = () => {
  const { boq, cables, setCableSizeFilter, setCableTypeFilter, setActiveView } = useApp();

  const handleFilterToCables = (size: string, type: string) => {
    const rawType = type.includes('YFY') ? 'YFY' : '2XWY';
    setCableSizeFilter(size);
    setCableTypeFilter(rawType);
    setActiveView('schedule');
  };

  const sectionsSummary = [
    { section: 'A1', name: 'Client Power Control Center (PCC)', entries: 23, runs: 66, maxLen: 'Per Vendor / Site Data', color: 'from-amber-500/20 to-amber-500/5' },
    { section: 'B1', name: 'Engine MCC - 1 (EMCC-1)', entries: 20, runs: 20, maxLen: '80 m (Ambient 40°C)', color: 'from-sky-500/20 to-sky-500/5' },
    { section: 'B2', name: 'Engine MCC - 2 (EMCC-2)', entries: 20, runs: 20, maxLen: '80 m (Ambient 40°C)', color: 'from-sky-500/20 to-sky-500/5' },
    { section: 'B3', name: 'Engine MCC - 3 (EMCC-3)', entries: 20, runs: 20, maxLen: '80 m (Ambient 40°C)', color: 'from-sky-500/20 to-sky-500/5' },
    { section: 'B4', name: 'Common MCC (CMCC)', entries: 10, runs: 10, maxLen: '80 m (Ambient 40°C)', color: 'from-purple-500/20 to-purple-500/5' },
    { section: 'C1', name: '24V DC Battery Chargers (All 4 Units)', entries: 24, runs: 24, maxLen: '60 m (Ambient 40°C)', color: 'from-emerald-500/20 to-emerald-500/5' }
  ];

  const totalRunsAll = boq.reduce((s, b) => s + b.totalRuns, 0);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Sheet 6 Aggregations
            </span>
            <span className="text-xs text-slate-400">Doc. No. 1170-41-019 | Rev. 3</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-400" />
            Cable Summary & Bill of Quantities (BOQ)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated by Section, Cable Type, and Conductor Size directly from your project schedule.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-right">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Project Runs</div>
            <div className="text-xl font-extrabold text-amber-400 font-mono">{totalRunsAll} Runs</div>
          </div>
        </div>
      </div>

      {/* 1. Section Summary Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>1. Cable Schedule Summary by Panel / Section</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {sectionsSummary.map(sec => (
            <div 
              key={sec.section}
              className={`p-4 rounded-2xl border border-slate-800 bg-gradient-to-br ${sec.color} shadow-lg flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-slate-950/80 px-2.5 py-0.5 rounded-lg border border-slate-800">
                    Section {sec.section}
                  </span>
                  <span className="text-xs font-bold text-white font-mono">
                    {sec.runs} Runs
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white line-clamp-1 mb-1">
                  {sec.name}
                </h4>
                <div className="text-xs text-slate-400 mb-2">
                  Max Length: <strong className="text-slate-300 font-normal">{sec.maxLen}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <span>{sec.entries} Cable Entries</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Scheduled
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. BOQ Table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="font-bold text-sm text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>2. Bill of Quantities (BOQ) by Cable Type & Conductor Size</span>
          </div>
          <span className="text-xs text-slate-400">Click any row to filter schedule</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 font-bold">
              <tr>
                <th className="py-3 px-4 w-16">Item</th>
                <th className="py-3 px-4">Cable Insulation & Construction Type</th>
                <th className="py-3 px-4">Conductor Size (mm²)</th>
                <th className="py-3 px-4 text-center">Entries</th>
                <th className="py-3 px-4 text-center">Total Runs</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {boq.map((item, idx) => (
                <tr 
                  key={item.id} 
                  onClick={() => handleFilterToCables(item.conductorSize, item.cableType)}
                  className="hover:bg-slate-850/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-4 font-semibold text-white group-hover:text-amber-300 transition-colors">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-200 border border-slate-700 mr-2">
                      {item.cableType.split(' ')[0]}
                    </span>
                    <span>{item.cableType}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-amber-300 text-xs">
                    {item.conductorSize}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-300">{item.entriesCount}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400 text-xs">
                    {item.totalRuns}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold group-hover:underline">
                      Filter Cables &rarr;
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
