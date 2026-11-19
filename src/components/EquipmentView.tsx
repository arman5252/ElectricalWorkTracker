import React, { useState } from 'react';
import { 
  Cpu, 
  Plus, 
  Search, 
  Filter, 
  Gauge, 
  Thermometer, 
  ShieldCheck, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  ExternalLink,
  Activity,
  Calendar,
  Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EquipmentAsset, AssetHealthStatus } from '../types';

export const EquipmentView: React.FC = () => {
  const { state, addEquipment, updateEquipment, deleteEquipment } = useApp();

  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<EquipmentAsset, 'id'>>({
    tag: '',
    category: 'Power Transformer',
    substationBay: 'Bay 1',
    voltageRating: '33 kV / 11 kV',
    currentRating: '1200 A',
    manufacturer: 'Siemens',
    modelNumber: '',
    serialNumber: '',
    healthStatus: 'Optimal',
    insulationResistanceMOhms: 2500,
    earthResistanceOhms: 0.45,
    operatingTemperatureC: 45,
    oilDielectricKV: 65,
    lastServicedDate: new Date().toISOString().split('T')[0],
    nextInspectionDue: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0],
    location: 'Main Substation Yard',
    notes: ''
  });

  const filtered = state.equipment.filter(eq => {
    const matchesHealth = healthFilter === 'All' || eq.healthStatus === healthFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      eq.tag.toLowerCase().includes(q) ||
      eq.category.toLowerCase().includes(q) ||
      eq.manufacturer.toLowerCase().includes(q) ||
      eq.location.toLowerCase().includes(q);
    return matchesHealth && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      tag: '',
      category: 'Power Transformer',
      substationBay: 'Bay 1',
      voltageRating: '33 kV / 11 kV',
      currentRating: '1200 A',
      manufacturer: 'Siemens',
      modelNumber: '',
      serialNumber: '',
      healthStatus: 'Optimal',
      insulationResistanceMOhms: 2500,
      earthResistanceOhms: 0.45,
      operatingTemperatureC: 45,
      oilDielectricKV: 65,
      lastServicedDate: new Date().toISOString().split('T')[0],
      nextInspectionDue: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0],
      location: 'Main Substation Yard',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (eq: EquipmentAsset) => {
    setEditingId(eq.id);
    setFormData({
      tag: eq.tag,
      category: eq.category,
      substationBay: eq.substationBay || '',
      voltageRating: eq.voltageRating,
      currentRating: eq.currentRating,
      manufacturer: eq.manufacturer,
      modelNumber: eq.modelNumber,
      serialNumber: eq.serialNumber,
      healthStatus: eq.healthStatus,
      insulationResistanceMOhms: eq.insulationResistanceMOhms,
      earthResistanceOhms: eq.earthResistanceOhms,
      operatingTemperatureC: eq.operatingTemperatureC,
      oilDielectricKV: eq.oilDielectricKV,
      lastServicedDate: eq.lastServicedDate,
      nextInspectionDue: eq.nextInspectionDue,
      location: eq.location,
      notes: eq.notes
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateEquipment(editingId, formData);
    } else {
      addEquipment(formData);
    }
    setIsModalOpen(false);
  };

  const getHealthBadge = (health: AssetHealthStatus) => {
    switch (health) {
      case 'Optimal':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'Advisory':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'Warning':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case 'Critical Action':
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse';
      case 'Decommissioned':
        return 'bg-slate-700 text-slate-300 border border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            Electrical Equipment & Substation Asset Register
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor high-voltage transformers, switchgear bays, breakers, Megger insulation values (MΩ), and earth pits (&lt;1.0 Ω).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register Equipment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search equipment tag, bay, brand..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/70 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-400 font-medium">Health:</span>
          {(['All', 'Optimal', 'Advisory', 'Warning', 'Critical Action'] as const).map(h => (
            <button
              key={h}
              onClick={() => setHealthFilter(h)}
              className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                healthFilter === h
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(eq => (
          <div
            key={eq.id}
            className="bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 shadow-md flex flex-col justify-between transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {eq.id}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getHealthBadge(eq.healthStatus)}`}>
                  {eq.healthStatus}
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-1 line-clamp-1">
                {eq.tag}
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                {eq.manufacturer} • {eq.modelNumber || 'Industrial Spec'}
              </p>

              {/* Electrical Parameters */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-850 text-center mb-3">
                <div>
                  <div className="text-[10px] text-slate-400">Insulation</div>
                  <div className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                    {eq.insulationResistanceMOhms > 0 ? `${eq.insulationResistanceMOhms} MΩ` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Earth Pit</div>
                  <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                    {eq.earthResistanceOhms} Ω
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Temp</div>
                  <div className="text-xs font-mono font-bold text-sky-400 mt-0.5">
                    {eq.operatingTemperatureC} °C
                  </div>
                </div>
              </div>

              {/* Specification Specs */}
              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Rating:</span>
                  <span className="font-semibold">{eq.voltageRating} • {eq.currentRating}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="truncate max-w-[180px]">{eq.location}</span>
                </div>
                {eq.substationBay && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Substation Bay:</span>
                    <span className="text-emerald-400">{eq.substationBay}</span>
                  </div>
                )}
                {eq.oilDielectricKV && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Oil Dielectric:</span>
                    <span className="font-mono text-purple-300">{eq.oilDielectricKV} kV breakdown</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                Next check: {eq.nextInspectionDue}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(eq)}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
                  title="Edit Asset"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Remove asset ${eq.tag}?`)) deleteEquipment(eq.id);
                  }}
                  className="p-1.5 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 rounded-lg transition-colors"
                  title="Delete Asset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Equipment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                {editingId ? 'Edit Equipment Asset' : 'Register Substation Equipment'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Equipment Tag / Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50 MVA Power Transformer #2"
                    value={formData.tag}
                    onChange={e => setFormData({ ...formData, tag: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Power Transformer or Switchgear"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Substation Bay
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bay 2 (33kV Feeder)"
                    value={formData.substationBay}
                    onChange={e => setFormData({ ...formData, substationBay: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Voltage Rating
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 33 kV / 11 kV or 415V"
                    value={formData.voltageRating}
                    onChange={e => setFormData({ ...formData, voltageRating: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Current Rating
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2000 A (31.5kA Breaking)"
                    value={formData.currentRating}
                    onChange={e => setFormData({ ...formData, currentRating: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Manufacturer / Brand
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Siemens, ABB, Schneider"
                    value={formData.manufacturer}
                    onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Health Status
                  </label>
                  <select
                    value={formData.healthStatus}
                    onChange={e => setFormData({ ...formData, healthStatus: e.target.value as AssetHealthStatus })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                  >
                    <option value="Optimal">Optimal</option>
                    <option value="Advisory">Advisory</option>
                    <option value="Warning">Warning</option>
                    <option value="Critical Action">Critical Action</option>
                    <option value="Decommissioned">Decommissioned</option>
                  </select>
                </div>

                {/* Diagnostics */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Insulation Megger (MΩ)
                  </label>
                  <input
                    type="number"
                    value={formData.insulationResistanceMOhms}
                    onChange={e => setFormData({ ...formData, insulationResistanceMOhms: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Earth Resistance (Ω) (&lt;1.0 Ω)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.earthResistanceOhms}
                    onChange={e => setFormData({ ...formData, earthResistanceOhms: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Operating Temp (°C)
                  </label>
                  <input
                    type="number"
                    value={formData.operatingTemperatureC}
                    onChange={e => setFormData({ ...formData, operatingTemperatureC: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
