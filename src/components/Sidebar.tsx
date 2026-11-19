import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Cpu, 
  FileText, 
  Lock, 
  Boxes, 
  BarChart3, 
  Database,
  ExternalLink,
  Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings }) => {
  const { state, activeTab, setActiveTab, currentUser } = useApp();

  const activeWorkOrdersCount = state.workOrders.filter(
    w => w.status === 'In Progress' || w.status === 'Scheduled' || w.status === 'Testing & Commissioning'
  ).length;

  const activeLotoCount = state.safetyLoto.filter(l => l.status === 'Active').length;
  const lowSparesCount = state.spares.filter(s => s.quantityInStock <= s.minThreshold).length;

  const navItems = [
    {
      id: 'overview',
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'work-orders',
      label: 'Work Orders & Jobs',
      icon: ClipboardList,
      badge: activeWorkOrdersCount > 0 ? activeWorkOrdersCount : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    },
    {
      id: 'equipment',
      label: 'Equipment & Substation',
      icon: Cpu,
      badge: state.equipment.length,
      badgeColor: 'bg-slate-800 text-slate-400 border border-slate-700'
    },
    {
      id: 'daily-logs',
      label: 'Field Logs & Diary',
      icon: FileText,
      badge: state.dailyLogs.length,
      badgeColor: 'bg-slate-800 text-slate-400 border border-slate-700'
    },
    {
      id: 'safety-loto',
      label: 'LOTO & Safety Board',
      icon: Lock,
      badge: activeLotoCount > 0 ? activeLotoCount : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
    },
    {
      id: 'spares',
      label: 'Materials & Spares',
      icon: Boxes,
      badge: lowSparesCount > 0 ? `${lowSparesCount} low` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    },
    {
      id: 'analytics',
      label: 'Analytics & Insights',
      icon: BarChart3,
      badge: null
    }
  ];

  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800 flex flex-col shrink-0">
      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Operations & Control
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-300 border-l-2 border-amber-400 font-semibold shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Cloud Database Integration Status Widget in Sidebar Footer */}
      <div className="p-3 m-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">Supabase DB</span>
          </div>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Real-time
          </span>
        </div>

        <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
          PostgreSQL database with instant two-way WebSocket sync across all engineering devices.
        </p>

        {currentUser?.role === 'admin' && (
          <button
            onClick={onOpenSettings}
            className="mt-2 w-full py-1.5 px-2 text-[11px] font-semibold text-center text-amber-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Manage Supabase DB</span>
          </button>
        )}
      </div>
    </aside>
  );
};
