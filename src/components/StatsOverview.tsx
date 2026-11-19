import React from 'react';
import { 
  Zap, 
  ClipboardList, 
  Cpu, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  DollarSign, 
  ShieldCheck, 
  Gauge,
  Calendar,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WorkOrder } from '../types';

interface StatsOverviewProps {
  onOpenNewWorkOrder: () => void;
  onOpenNewLog: () => void;
  onOpenNewLoto: () => void;
  onSelectWorkOrder: (wo: WorkOrder) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  onOpenNewWorkOrder,
  onOpenNewLog,
  onOpenNewLoto,
  onSelectWorkOrder
}) => {
  const { state, setActiveTab, triggerGoogleSync, isSyncing } = useApp();

  const totalWorkOrders = state.workOrders.length;
  const inProgressWorkOrders = state.workOrders.filter(w => w.status === 'In Progress').length;
  const scheduledWorkOrders = state.workOrders.filter(w => w.status === 'Scheduled').length;
  const completedWorkOrders = state.workOrders.filter(w => w.status === 'Completed').length;
  const activeLoto = state.safetyLoto.filter(l => l.status === 'Active');
  const lowStockSpares = state.spares.filter(s => s.quantityInStock <= s.minThreshold);

  const totalSpent = state.workOrders.reduce((sum, w) => sum + (w.totalCost || 0), 0);
  const totalHours = state.workOrders.reduce((sum, w) => sum + (w.actualHours || 0), 0);

  const optimalEquipmentCount = state.equipment.filter(e => e.healthStatus === 'Optimal').length;
  const equipmentHealthPercent = state.equipment.length > 0
    ? Math.round((optimalEquipmentCount / state.equipment.length) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 p-6 shadow-xl">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-amber-300" />
                Live Substation Operations
              </span>
              <span className="text-xs text-slate-400">
                Connected to Google Sheets & Drive
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Electrical Work & Asset Control Center
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Track high-voltage switchgear maintenance, transformer diagnostics, Lockout/Tagout (LOTO) isolation, daily field work orders, and spare parts inventory.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenNewWorkOrder}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Create Work Order</span>
            </button>
            <button
              onClick={onOpenNewLog}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-medium transition-colors"
            >
              Log Daily Work
            </button>
            <button
              onClick={onOpenNewLoto}
              className="px-3.5 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              Apply LOTO
            </button>
            <button
              onClick={() => triggerGoogleSync('push')}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isSyncing ? 'Syncing...' : 'Sync DB'}
            </button>
          </div>
        </div>
      </div>

      {/* 4 High-Impact KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Jobs */}
        <div 
          onClick={() => setActiveTab('work-orders')}
          className="cursor-pointer group p-5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-2xl transition-all shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <ClipboardList className="w-5 h-5" />
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-0.5 group-hover:text-amber-400 transition-colors">
              Manage <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {inProgressWorkOrders} <span className="text-sm font-normal text-slate-400">/ {totalWorkOrders} total</span>
          </div>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Active Jobs ({scheduledWorkOrders} scheduled, {completedWorkOrders} done)
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-amber-400 h-full rounded-full transition-all"
              style={{ width: `${totalWorkOrders > 0 ? (completedWorkOrders / totalWorkOrders) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Equipment & Substation Health */}
        <div 
          onClick={() => setActiveTab('equipment')}
          className="cursor-pointer group p-5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-2xl transition-all shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Cpu className="w-5 h-5" />
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-0.5 group-hover:text-emerald-400 transition-colors">
              Assets <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            {equipmentHealthPercent}%
          </div>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Substation Equipment Health ({optimalEquipmentCount} / {state.equipment.length} Optimal)
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all"
              style={{ width: `${equipmentHealthPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Safety & LOTO Status */}
        <div 
          onClick={() => setActiveTab('safety-loto')}
          className="cursor-pointer group p-5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/40 rounded-2xl transition-all shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <Lock className="w-5 h-5" />
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-0.5 group-hover:text-rose-400 transition-colors">
              Safety <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-rose-400">
            {activeLoto.length} Locks
          </div>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Active Lockout/Tagout Protections (Zero-Energy)
          </p>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-rose-300 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Zero-energy protocol adherence</span>
          </div>
        </div>

        {/* Maintenance Cost & Hours */}
        <div 
          onClick={() => setActiveTab('analytics')}
          className="cursor-pointer group p-5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/40 rounded-2xl transition-all shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-0.5 group-hover:text-sky-400 transition-colors">
              Costs <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white">
            ${totalSpent.toLocaleString()}
          </div>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Total Maintenance Cost ({totalHours.toFixed(1)} Labor Hours)
          </p>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-sky-300 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Avg ${(totalSpent / (state.workOrders.length || 1)).toFixed(0)} per work order</span>
          </div>
        </div>
      </div>

      {/* In-Progress & Scheduled Work Orders Carousel / Grid */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">Priority Electrical Jobs & Work Orders</h3>
            <span className="px-2 py-0.5 rounded text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {state.workOrders.length} records
            </span>
          </div>
          <button 
            onClick={() => setActiveTab('work-orders')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            View All Work Orders <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {state.workOrders.slice(0, 3).map((wo) => {
            const isCritical = wo.priority === 'Critical';
            return (
              <div
                key={wo.id}
                onClick={() => onSelectWorkOrder(wo)}
                className="cursor-pointer group relative p-4 rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {wo.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : wo.priority === 'High'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {wo.priority}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-semibold">
                        {wo.status}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors line-clamp-2 mb-2">
                    {wo.title}
                  </h4>

                  <div className="space-y-1 text-xs text-slate-400 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Voltage:</span>
                      <span className="text-slate-200 font-medium">{wo.voltage}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Location:</span>
                      <span className="text-slate-200 truncate max-w-[180px]">{wo.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Lead:</span>
                      <span className="text-slate-200 truncate max-w-[180px]">{wo.leadElectrician}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-850 flex items-center justify-between text-xs">
                  {wo.lotoRequired ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-rose-400">
                      <Lock className="w-3 h-3" />
                      {wo.lotoTagNumber || 'LOTO Tagged'}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">No LOTO Required</span>
                  )}
                  <span className="font-semibold text-slate-200">
                    ${wo.totalCost.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Substation Asset Telemetry & Active LOTO Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Substation Asset Telemetry */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Substation Equipment Health & Insulation</h3>
              </div>
              <button 
                onClick={() => setActiveTab('equipment')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                Inspect Assets <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {state.equipment.slice(0, 4).map((asset) => (
                <div 
                  key={asset.id}
                  className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white truncate">
                        {asset.tag}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        {asset.healthStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {asset.voltageRating} • {asset.location}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-200">
                        {asset.insulationResistanceMOhms > 0 ? `${asset.insulationResistanceMOhms} MΩ` : 'N/A'}
                      </div>
                      <div className="text-[10px] text-slate-400">Insulation</div>
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-amber-400">
                        {asset.earthResistanceOhms} Ω
                      </div>
                      <div className="text-[10px] text-slate-400">Earth Pit</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>IEEE 80 Earth Pit Criteria: &lt; 1.0 Ω</span>
            <span className="text-emerald-400 font-medium">All Ground Pits Certified</span>
          </div>
        </div>

        {/* Active Lockout / Tagout (LOTO) Board */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-400" />
                <h3 className="text-base font-bold text-white">Active Lockout / Tagout (LOTO) Board</h3>
                <span className="px-2 py-0.5 rounded text-xs bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  {activeLoto.length} Active Locks
                </span>
              </div>
              <button 
                onClick={() => setActiveTab('safety-loto')}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
              >
                View LOTO Log <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {activeLoto.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No active lockouts. All systems energized or isolated per standard operating procedure.
                </div>
              ) : (
                activeLoto.slice(0, 3).map((loto) => (
                  <div 
                    key={loto.id}
                    className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-rose-500/30 text-rose-200 font-mono text-xs font-bold border border-rose-500/40">
                          {loto.tagNumber}
                        </span>
                        <span className="text-xs text-slate-300 font-medium">
                          {loto.lockNumber}
                        </span>
                      </div>
                      <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                        DO NOT OPERATE
                      </span>
                    </div>
                    <div className="text-xs text-white font-medium truncate mt-1">
                      {loto.equipmentTag}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {loto.isolationPoints}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-rose-500/20">
                      <span>Applied by: {loto.appliedBy}</span>
                      <span>{loto.appliedDate}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {lowStockSpares.length > 0 && (
            <div className="mt-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{lowStockSpares.length} Spare parts below threshold level!</span>
              </div>
              <button 
                onClick={() => setActiveTab('spares')}
                className="text-amber-400 hover:underline font-bold"
              >
                Reorder &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
