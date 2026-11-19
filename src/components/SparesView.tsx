import React, { useState } from 'react';
import { 
  Boxes, 
  Plus, 
  Search, 
  AlertTriangle, 
  DollarSign, 
  Edit3, 
  Trash2, 
  PackageCheck,
  Tag
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SparePart } from '../types';

export const SparesView: React.FC = () => {
  const { state, addSparePart, updateSparePart, deleteSparePart } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<SparePart, 'id'>>({
    partNumber: '',
    name: '',
    category: 'Circuit Breakers',
    specification: '',
    quantityInStock: 10,
    unit: 'pcs',
    minThreshold: 4,
    unitCost: 45.00,
    storageBin: 'Bin A-01'
  });

  const categories = [
    'Circuit Breakers',
    'Cables & Busbars',
    'Fuses & Relays',
    'Transformers & Coils',
    'Meters & CTs',
    'Safety & PPE'
  ];

  const filtered = state.spares.filter(s => {
    const matchesCat = categoryFilter === 'All' || s.category === categoryFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      s.name.toLowerCase().includes(q) ||
      s.partNumber.toLowerCase().includes(q) ||
      s.specification.toLowerCase().includes(q) ||
      s.storageBin.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const totalInventoryValue = state.spares.reduce(
    (sum, p) => sum + (p.quantityInStock * p.unitCost), 0
  );

  const lowStockCount = state.spares.filter(p => p.quantityInStock <= p.minThreshold).length;

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      partNumber: '',
      name: '',
      category: 'Circuit Breakers',
      specification: '',
      quantityInStock: 10,
      unit: 'pcs',
      minThreshold: 4,
      unitCost: 45.00,
      storageBin: 'Bin A-01'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (part: SparePart) => {
    setEditingId(part.id);
    setFormData({
      partNumber: part.partNumber,
      name: part.name,
      category: part.category,
      specification: part.specification,
      quantityInStock: part.quantityInStock,
      unit: part.unit,
      minThreshold: part.minThreshold,
      unitCost: part.unitCost,
      storageBin: part.storageBin
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateSparePart(editingId, formData);
    } else {
      addSparePart(formData);
    }
    setIsModalOpen(false);
  };

  const adjustQty = (part: SparePart, delta: number) => {
    const newQty = Math.max(0, part.quantityInStock + delta);
    updateSparePart(part.id, { quantityInStock: newQty });
  };

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-purple-400" />
            Electrical Materials & Spare Parts Inventory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Maintain stock of circuit breakers, busbars, XLPE cables, high-speed fuses, and PPE kits.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Spare Part</span>
        </button>
      </div>

      {/* Inventory Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 font-medium">Total Inventory Value</div>
            <div className="text-xl font-bold text-white mt-1">
              ${totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 font-medium">Distinct Stock Items</div>
            <div className="text-xl font-bold text-slate-200 mt-1">
              {state.spares.length} SKUs
            </div>
          </div>
          <div className="p-3 bg-slate-800 text-slate-300 rounded-xl">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 font-medium">Low Stock Alerts</div>
            <div className={`text-xl font-bold mt-1 ${lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {lowStockCount} Parts Below Min
            </div>
          </div>
          <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-amber-500/10 text-amber-400 animate-pulse' : 'bg-emerald-500/10 text-emerald-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search part name, part #, bin..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/70 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <span className="text-slate-400 font-medium">Category:</span>
          {['All', ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-full font-medium transition-all shrink-0 ${
                categoryFilter === cat
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Spares Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Part / SKU #</th>
                <th className="py-3 px-4">Item Name & Spec</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Storage Bin</th>
                <th className="py-3 px-4 text-center">In Stock</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                <th className="py-3 px-4 text-right">Total Val</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map(part => {
                const isLow = part.quantityInStock <= part.minThreshold;
                return (
                  <tr key={part.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-purple-400">
                      {part.partNumber || part.id}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-white truncate">{part.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{part.specification}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {part.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                      {part.storageBin}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => adjustQty(part, -1)}
                          className="w-5 h-5 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold"
                        >
                          -
                        </button>
                        <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                          isLow
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {part.quantityInStock} {part.unit}
                        </span>
                        <button
                          onClick={() => adjustQty(part, +1)}
                          className="w-5 h-5 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold"
                        >
                          +
                        </button>
                      </div>
                      {isLow && (
                        <div className="text-[10px] text-rose-400 mt-1 font-semibold">
                          Reorder Alert (min {part.minThreshold})
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-200">
                      ${part.unitCost.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                      ${(part.quantityInStock * part.unitCost).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(part)}
                          className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
                          title="Edit Part"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${part.name}?`)) deleteSparePart(part.id);
                          }}
                          className="p-1 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 rounded"
                          title="Delete Part"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Part Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-purple-400" />
                {editingId ? 'Edit Spare Part' : 'Add Electrical Spare Part'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 pt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Part / Catalog Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schneider-NSX250F"
                  value={formData.partNumber}
                  onChange={e => setFormData({ ...formData, partNumber: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Item Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 250A 3P 36kA MCCB Breaker"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Technical Specification
                </label>
                <input
                  type="text"
                  placeholder="e.g. 415V AC, IEC 60947-2, Electronic Trip"
                  value={formData.specification}
                  onChange={e => setFormData({ ...formData, specification: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Initial Stock Qty *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.quantityInStock}
                    onChange={e => setFormData({ ...formData, quantityInStock: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Unit (pcs, meters, sets)
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Unit Cost ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.unitCost}
                    onChange={e => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Min Alert Threshold
                  </label>
                  <input
                    type="number"
                    value={formData.minThreshold}
                    onChange={e => setFormData({ ...formData, minThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Storage Bin / Rack Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bin E-02 (Heavy Switchgear)"
                  value={formData.storageBin}
                  onChange={e => setFormData({ ...formData, storageBin: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl"
                >
                  Save Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
