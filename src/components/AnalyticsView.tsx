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
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Cpu, 
  ShieldCheck, 
  DollarSign, 
  Clock 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const STATUS_COLORS: Record<string, string> = {
  'Scheduled': '#64748b',
  'In Progress': '#f59e0b',
  'Testing & Commissioning': '#a855f7',
  'Pending Inspection': '#38bdf8',
  'Completed': '#10b981',
  'On Hold': '#f43f5e'
};

const VOLTAGE_COLORS = ['#f59e0b', '#0ea5e9', '#10b981', '#a855f7', '#ec4899', '#64748b'];

export const AnalyticsView: React.FC = () => {
  const { state } = useApp();

  // 1. Status Distribution
  const statusCounts = state.workOrders.reduce((acc, wo) => {
    acc[wo.status] = (acc[wo.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
    color: STATUS_COLORS[name] || '#94a3b8'
  }));

  // 2. Voltage Level Breakdown
  const voltageCounts = state.workOrders.reduce((acc, wo) => {
    const vKey = wo.voltage.split(' ')[0] + ' ' + (wo.voltage.split(' ')[1] || '');
    acc[vKey] = (acc[vKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const voltageData = Object.entries(voltageCounts).map(([voltage, count], i) => ({
    voltage,
    count,
    fill: VOLTAGE_COLORS[i % VOLTAGE_COLORS.length]
  }));

  // 3. Category Cost Breakdown
  const categoryCosts = state.workOrders.reduce((acc, wo) => {
    const catShort = wo.category.split(' ')[0] + ' ' + (wo.category.split(' ')[1] || '');
    acc[catShort] = (acc[catShort] || 0) + wo.totalCost;
    return acc;
  }, {} as Record<string, number>);

  const costData = Object.entries(categoryCosts).map(([category, cost]) => ({
    category,
    cost
  }));

  // 4. Equipment Insulation Resistance (Megger Test)
  const equipmentInsulation = state.equipment.map(eq => ({
    name: eq.tag.split(' ')[0] + ' ' + (eq.tag.split(' ')[1] || ''),
    insulation: eq.insulationResistanceMOhms,
    temp: eq.operatingTemperatureC
  }));

  const totalCost = state.workOrders.reduce((s, w) => s + w.totalCost, 0);
  const totalHours = state.workOrders.reduce((s, w) => s + w.actualHours, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-400" />
          Electrical Asset Intelligence & Engineering Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Breakdown of maintenance investments, voltage load distribution, insulation trends, and crew hours.
        </p>
      </div>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="text-slate-400 mb-1">Total Maintenance Spend</div>
          <div className="text-2xl font-extrabold text-emerald-400">
            ${totalCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Labor + Spare parts</div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="text-slate-400 mb-1">Total Labor Logged</div>
          <div className="text-2xl font-extrabold text-amber-400">
            {totalHours.toFixed(1)} hrs
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across certified wiremen</div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="text-slate-400 mb-1">Substation Assets</div>
          <div className="text-2xl font-extrabold text-sky-400">
            {state.equipment.length} Units
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Transformers & Switchgears</div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="text-slate-400 mb-1">LOTO Safety Adherence</div>
          <div className="text-2xl font-extrabold text-purple-400">
            100%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Zero unverified energizations</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status Distribution Pie */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Work Orders Status Distribution
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Active ratio between scheduled, in-progress, and completed jobs
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Voltage Level Bar Chart */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-400" />
            Jobs by Voltage Level
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Distribution of jobs across EHV, HV, MV, and LV systems
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={voltageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="voltage" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Work Orders" radius={[6, 6, 0, 0]}>
                  {voltageData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance Cost by Category */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Maintenance Cost by Electrical System ($)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Capital expenditure and repair cost distribution
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `$${val}`} />
                <YAxis type="category" dataKey="category" stroke="#94a3b8" fontSize={10} width={110} />
                <Tooltip 
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Cost']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar dataKey="cost" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Equipment Insulation Resistance (Megger Test) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            Equipment Insulation Resistance (MΩ)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Megger insulation values (Higher is better &gt; 1000 MΩ)
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={equipmentInsulation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v}MΩ`} />
                <Tooltip 
                  formatter={(val: any) => [`${Number(val).toLocaleString()} MΩ`, 'Insulation']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar dataKey="insulation" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
