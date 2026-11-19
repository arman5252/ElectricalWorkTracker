import React, { useState } from 'react';
import { 
  Zap, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  User, 
  MapPin, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  Trash2, 
  Edit3, 
  Printer, 
  Upload, 
  LayoutGrid, 
  List, 
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WorkOrder, WorkOrderStatus, PriorityLevel, VoltageLevel, ElectricalCategory } from '../types';

interface WorkOrdersViewProps {
  onSelectWorkOrder: (wo: WorkOrder) => void;
  onOpenNewModal: boolean;
  onCloseNewModal: () => void;
}

const CATEGORIES: ElectricalCategory[] = [
  'Substation & Switchyard',
  'Power Transformers',
  'MV Switchgear & Breakers',
  'LV Distribution Panels',
  'Motor Control Centers (MCC)',
  'Cabling & Busway',
  'Earthing & Lightning Protection',
  'Emergency Diesel Genset & UPS',
  'Lighting & Small Power'
];

const VOLTAGES: VoltageLevel[] = [
  '110 kV (EHV)',
  '33 kV (HV)',
  '11 kV (MV)',
  '415V / 400V (3-Phase LV)',
  '230V / 240V (Single Phase)',
  '125V / 24V DC (Control/Battery)'
];

const STATUSES: (WorkOrderStatus | 'All')[] = [
  'All',
  'Scheduled',
  'In Progress',
  'Testing & Commissioning',
  'Pending Inspection',
  'Completed',
  'On Hold'
];

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  onSelectWorkOrder,
  onOpenNewModal,
  onCloseNewModal
}) => {
  const { state, addWorkOrder, updateWorkOrder, deleteWorkOrder, uploadDriveImage, isSyncing } = useApp();

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [localSearch, setLocalSearch] = useState<string>('');

  // Form State for New / Edit Modal
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editId, setEditId] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    category: 'LV Distribution Panels' as ElectricalCategory,
    voltage: '415V / 400V (3-Phase LV)' as VoltageLevel,
    location: '',
    priority: 'Medium' as PriorityLevel,
    status: 'Scheduled' as WorkOrderStatus,
    leadElectrician: '',
    teamMembers: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    lotoRequired: false,
    lotoTagNumber: '',
    lotoStatus: 'N/A' as any,
    arcFlashCategory: 'Cat 2 (8 cal/cm²)' as any,
    estimatedHours: 4,
    actualHours: 0,
    laborCost: 350,
    partsCost: 150,
    totalCost: 500,
    description: '',
    findings: '',
    imageUrl: ''
  });

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Filter logic
  const filteredOrders = state.workOrders.filter(wo => {
    const matchesStatus = statusFilter === 'All' || wo.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || wo.category === categoryFilter;
    const matchesPriority = priorityFilter === 'All' || wo.priority === priorityFilter;
    const q = localSearch.toLowerCase();
    const matchesSearch = !q || 
      wo.id.toLowerCase().includes(q) ||
      wo.title.toLowerCase().includes(q) ||
      wo.location.toLowerCase().includes(q) ||
      wo.leadElectrician.toLowerCase().includes(q) ||
      wo.voltage.toLowerCase().includes(q);

    return matchesStatus && matchesCategory && matchesPriority && matchesSearch;
  });

  const handleOpenEdit = (wo: WorkOrder) => {
    setIsEditing(true);
    setEditId(wo.id);
    setFormData({
      title: wo.title,
      category: wo.category,
      voltage: wo.voltage,
      location: wo.location,
      priority: wo.priority,
      status: wo.status,
      leadElectrician: wo.leadElectrician,
      teamMembers: wo.teamMembers || '',
      scheduledDate: wo.scheduledDate,
      dueDate: wo.dueDate,
      lotoRequired: wo.lotoRequired,
      lotoTagNumber: wo.lotoTagNumber || '',
      lotoStatus: wo.lotoStatus || 'N/A',
      arcFlashCategory: wo.arcFlashCategory || 'Cat 2 (8 cal/cm²)',
      estimatedHours: wo.estimatedHours,
      actualHours: wo.actualHours,
      laborCost: wo.laborCost,
      partsCost: wo.partsCost,
      totalCost: wo.totalCost,
      description: wo.description,
      findings: wo.findings || '',
      imageUrl: wo.imageUrl || ''
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedTotal = Number(formData.laborCost || 0) + Number(formData.partsCost || 0);

    if (isEditing && editId) {
      updateWorkOrder(editId, {
        ...formData,
        totalCost: calculatedTotal
      });
    } else {
      addWorkOrder({
        ...formData,
        totalCost: calculatedTotal
      });
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsEditing(false);
    setEditId('');
    onCloseNewModal();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingPhoto(true);

      // If Google Web App URL is connected, upload to Google Drive folder!
      if (state.settings.webAppUrl) {
        const driveUrl = await uploadDriveImage(file);
        if (driveUrl) {
          setFormData(prev => ({ ...prev, imageUrl: driveUrl }));
        }
      } else {
        // Fallback to local DataURL for dev/offline preview
        const reader = new FileReader();
        reader.onload = () => {
          setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
      setIsUploadingPhoto(false);
    }
  };

  const getPriorityBadgeClass = (priority: PriorityLevel) => {
    switch (priority) {
      case 'Critical': return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      case 'High': return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case 'Medium': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'Low': return 'bg-slate-700/50 text-slate-300 border border-slate-600/50';
    }
  };

  const getStatusBadgeClass = (status: WorkOrderStatus) => {
    switch (status) {
      case 'Scheduled': return 'bg-slate-800 text-slate-300 border border-slate-700';
      case 'In Progress': return 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse';
      case 'Testing & Commissioning': return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      case 'Pending Inspection': return 'bg-sky-500/20 text-sky-300 border border-sky-500/30';
      case 'Completed': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'On Hold': return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Electrical Work Orders & Maintenance Jobs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage high voltage switchyard jobs, LV maintenance, LOTO safety tags, and labor timesheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              title="Compact Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setIsEditing(false);
              setFormData({
                title: '',
                category: 'LV Distribution Panels',
                voltage: '415V / 400V (3-Phase LV)',
                location: '',
                priority: 'Medium',
                status: 'Scheduled',
                leadElectrician: '',
                teamMembers: '',
                scheduledDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
                lotoRequired: false,
                lotoTagNumber: '',
                lotoStatus: 'N/A',
                arcFlashCategory: 'Cat 2 (8 cal/cm²)',
                estimatedHours: 4,
                actualHours: 0,
                laborCost: 350,
                partsCost: 150,
                totalCost: 500,
                description: '',
                findings: '',
                imageUrl: ''
              });
              onOpenNewModal = true;
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Work Order</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
        {/* Status Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-medium px-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {STATUSES.map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {st} {st !== 'All' && `(${state.workOrders.filter(w => w.status === st).length})`}
            </button>
          ))}
        </div>

        {/* Secondary Dropdowns & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800 text-xs">
          <div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by title, location, lead electrician..."
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950/70 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-950/70 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Electrical Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-950/70 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical Priority</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Work Orders List / Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
          <Zap className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No work orders matched your filters</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting the status or search query.</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((wo) => {
            return (
              <div
                key={wo.id}
                className="group relative bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {wo.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityBadgeClass(wo.priority)}`}>
                        {wo.priority}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusBadgeClass(wo.status)}`}>
                        {wo.status}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 
                    onClick={() => onSelectWorkOrder(wo)}
                    className="text-base font-bold text-white group-hover:text-amber-300 transition-colors cursor-pointer mb-2"
                  >
                    {wo.title}
                  </h3>

                  {/* Thumbnail if present */}
                  {wo.imageUrl && (
                    <div 
                      onClick={() => onSelectWorkOrder(wo)}
                      className="cursor-pointer mb-3 rounded-xl overflow-hidden h-32 bg-slate-950 border border-slate-800/80 relative"
                    >
                      <img 
                        src={wo.imageUrl} 
                        alt={wo.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="absolute bottom-1.5 right-1.5 text-[10px] bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded text-slate-300 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-amber-400" /> Photo Attached
                      </span>
                    </div>
                  )}

                  {/* Details grid */}
                  <div className="space-y-1.5 text-xs text-slate-300 mb-4 bg-slate-950/50 p-3 rounded-xl border border-slate-850">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Voltage:
                      </span>
                      <span className="font-semibold text-slate-200">{wo.voltage}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location:
                      </span>
                      <span className="text-slate-200 truncate max-w-[170px]">{wo.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" /> Lead Wireman:
                      </span>
                      <span className="text-slate-200 truncate max-w-[170px]">{wo.leadElectrician}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Hours / Cost:
                      </span>
                      <span className="font-semibold text-slate-200">
                        {wo.actualHours} hrs • ${wo.totalCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {wo.lotoRequired ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        <Lock className="w-3 h-3" />
                        {wo.lotoTagNumber || 'LOTO'}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">No LOTO</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSelectWorkOrder(wo)}
                      title="View Permit & Print Report"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(wo)}
                      title="Edit Work Order"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete work order ${wo.id}?`)) {
                          deleteWorkOrder(wo.id);
                        }
                      }}
                      title="Delete Work Order"
                      className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">WO ID</th>
                  <th className="py-3 px-4">Job Title & Category</th>
                  <th className="py-3 px-4">Voltage</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Lead Electrician</th>
                  <th className="py-3 px-4">LOTO</th>
                  <th className="py-3 px-4 text-right">Cost ($)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredOrders.map(wo => (
                  <tr key={wo.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {wo.id}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div 
                        onClick={() => onSelectWorkOrder(wo)}
                        className="font-bold text-white hover:text-amber-300 cursor-pointer truncate"
                      >
                        {wo.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">{wo.category}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {wo.voltage}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getPriorityBadgeClass(wo.priority)}`}>
                        {wo.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(wo.status)}`}>
                        {wo.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 truncate max-w-[150px]">
                      {wo.leadElectrician}
                    </td>
                    <td className="py-3 px-4">
                      {wo.lotoRequired ? (
                        <span className="text-rose-400 font-mono text-[11px] flex items-center gap-1 font-semibold">
                          <Lock className="w-3 h-3" /> {wo.lotoTagNumber || 'YES'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                      ${wo.totalCost.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSelectWorkOrder(wo)}
                          className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
                          title="Inspect / Print"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(wo)}
                          className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${wo.id}?`)) deleteWorkOrder(wo.id);
                          }}
                          className="p-1 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Work Order Modal */}
      {(onOpenNewModal || isEditing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                {isEditing ? `Edit Work Order ${editId}` : 'Create New Electrical Work Order'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Job Title / Scope of Work *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 33kV Substation Bay Earthing Switch Overhaul"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Electrical System / Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as ElectricalCategory })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Operating Voltage Level
                  </label>
                  <select
                    value={formData.voltage}
                    onChange={e => setFormData({ ...formData, voltage: e.target.value as VoltageLevel })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    {VOLTAGES.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Location / Substation Bay *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Switchyard Bay 1 or Electrical Room B1"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Lead Electrician / Engineer *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arman Sheikh (Master Electrician)"
                    value={formData.leadElectrician}
                    onChange={e => setFormData({ ...formData, leadElectrician: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Critical">Critical (Immediate Outage / Safety)</option>
                    <option value="High">High (Mandatory Preventive)</option>
                    <option value="Medium">Medium (Routine Service)</option>
                    <option value="Low">Low (Cosmetic / Inspection)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Work Order Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as WorkOrderStatus })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Testing & Commissioning">Testing & Commissioning</option>
                    <option value="Pending Inspection">Pending Inspection</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Scheduled Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Safety & LOTO Section */}
                <div className="sm:col-span-2 p-3 bg-slate-950/70 border border-rose-500/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-rose-300 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.lotoRequired}
                        onChange={e => setFormData({ ...formData, lotoRequired: e.target.checked })}
                        className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                      />
                      <span>Lockout / Tagout (LOTO) & Electrical Isolation Required</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Zero-Energy Protocol</span>
                  </div>

                  {formData.lotoRequired && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-rose-500/20">
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">
                          LOTO Danger Tag #
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. LOTO-HV-33-02"
                          value={formData.lotoTagNumber}
                          onChange={e => setFormData({ ...formData, lotoTagNumber: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">
                          Arc Flash PPE Category
                        </label>
                        <select
                          value={formData.arcFlashCategory}
                          onChange={e => setFormData({ ...formData, arcFlashCategory: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200"
                        >
                          <option value="Cat 1 (4 cal/cm²)">Cat 1 (4 cal/cm² - Safety Glasses & Gloves)</option>
                          <option value="Cat 2 (8 cal/cm²)">Cat 2 (8 cal/cm² - Arc Shield & Balaclava)</option>
                          <option value="Cat 3 (25 cal/cm²)">Cat 3 (25 cal/cm² - Arc Suit & Hood)</option>
                          <option value="Cat 4 (40 cal/cm²)">Cat 4 (40 cal/cm² - Full 40-cal Suit)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Costs & Hours */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Labor Cost ($) & Hours
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Labor $"
                      value={formData.laborCost}
                      onChange={e => setFormData({ ...formData, laborCost: Number(e.target.value) })}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                    />
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Actual Hrs"
                      value={formData.actualHours}
                      onChange={e => setFormData({ ...formData, actualHours: Number(e.target.value) })}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Parts & Consumables Cost ($)
                  </label>
                  <input
                    type="number"
                    placeholder="Parts $"
                    value={formData.partsCost}
                    onChange={e => setFormData({ ...formData, partsCost: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>

                {/* Scope Description */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Job Scope / Work Instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe maintenance procedure, test specifications, and safety precautions..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
                  ></textarea>
                </div>

                {/* Photo / Google Drive Attachment */}
                <div className="sm:col-span-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Field Photo / As-Built Drawing (Uploaded to Google Drive Folder)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                    />
                    {isUploadingPhoto && (
                      <span className="text-amber-400 flex items-center gap-1 font-semibold">
                        <Upload className="w-3.5 h-3.5 animate-bounce" /> Uploading to Google Drive...
                      </span>
                    )}
                    {formData.imageUrl && (
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Attached
                        </span>
                        <a 
                          href={formData.imageUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-sky-400 hover:underline flex items-center gap-0.5 text-xs"
                        >
                          Preview <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all"
                >
                  {isEditing ? 'Update Work Order' : 'Save Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
