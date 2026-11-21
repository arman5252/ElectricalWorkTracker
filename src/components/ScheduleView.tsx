import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CableEntry, CableLayingStatus, CommissioningStatus } from '../types';
import * as XLSX from 'xlsx';
import { 
  Search, 
  RotateCcw, 
  Download, 
  ArrowRight, 
  Eye, 
  LayoutGrid, 
  List, 
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  X,
  ChevronDown,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  PlusCircle,
  Lock,
  ShieldCheck,
  MessageSquare,
  UserCheck
} from 'lucide-react';

export const normalizeStatus = (status?: string): string => {
  const s = String(status || '').trim();
  const lower = s.toLowerCase();
  if (lower === 'complete by vel' || lower === 'vel' || lower === 'complete vel') return 'Complete By VEL';
  if (lower === 'complete by bargen' || lower === 'bargen' || lower === 'complete bargen') return 'Complete By Bargen';
  if (lower === 'progress' || lower === 'in progress') return 'Progress';
  if (lower === 'pending') return 'Pending';
  if (lower === 'scope of bargen') return 'Scope of Bargen';
  if (lower === 'scope of vel') return 'Scope of VEL';
  if (lower === 'out of scope') return 'Out of Scope';
  if (lower === 'n/a' || lower === 'na') return 'N/A';
  return s || 'Pending';
};

export const getPillStyle = (status: string) => {
  const norm = normalizeStatus(status);
  switch (norm) {
    case 'Complete By VEL':
      return 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold';
    case 'Complete By Bargen':
      return 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 shadow-sm font-bold';
    case 'Progress':
      return 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 shadow-sm font-bold';
    case 'Scope of Bargen':
      return 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 shadow-sm font-bold';
    case 'Scope of VEL':
      return 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 shadow-sm font-bold';
    case 'Out of Scope':
      return 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 border border-slate-700/60 shadow-sm font-medium';
    case 'N/A':
      return 'bg-slate-800/60 hover:bg-slate-750 text-slate-500 border border-slate-700/40 shadow-sm font-medium';
    case 'Pending':
    default:
      return 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 shadow-sm font-bold';
  }
};

export const StatusPill: React.FC<{
  type: 'laying' | 'pre' | 'comm';
  status: string;
  onChange: (newStatus: any) => void;
  disabled?: boolean;
  onBlocked?: () => void;
}> = ({ status, onChange, disabled, onBlocked }) => {
  const norm = normalizeStatus(status);

  if (disabled) {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onBlocked?.();
        }}
        title="Public Viewer Mode: Click to log in as Senior Engineer or Admin to change status"
        className={`inline-flex items-center justify-center gap-1 cursor-pointer py-1 px-2 rounded-full text-[10.5px] border border-white/10 opacity-90 transition-all hover:opacity-100 hover:ring-1 hover:ring-amber-400/50 w-full max-w-[118px] text-center select-none truncate ${getPillStyle(norm)}`}
      >
        <span className="truncate">{norm}</span>
        <Lock className="w-2.5 h-2.5 opacity-60 shrink-0" />
      </div>
    );
  }

  return (
    <div 
      className="relative inline-block whitespace-nowrap w-full max-w-[118px]"
      onClick={(e) => e.stopPropagation()}
    >
      <select
        value={norm}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none cursor-pointer py-1 pl-2 pr-5 rounded-full text-[10.5px] tracking-tight border border-white/10 focus:outline-none transition-all w-full text-center truncate ${getPillStyle(norm)}`}
      >
        <option value="Complete By VEL" className="bg-slate-900 text-emerald-400 py-1 font-bold">✓ Complete By VEL</option>
        <option value="Complete By Bargen" className="bg-slate-900 text-emerald-300 py-1 font-bold">✓ Complete By Bargen</option>
        <option value="Progress" className="bg-slate-900 text-green-300 py-1 font-semibold">⏳ Progress</option>
        <option value="Pending" className="bg-slate-900 text-rose-400 py-1 font-semibold">⏱ Pending</option>
        <option value="Scope of Bargen" className="bg-slate-900 text-cyan-300 py-1 font-semibold">Scope of Bargen</option>
        <option value="Scope of VEL" className="bg-slate-900 text-blue-300 py-1 font-semibold">Scope of VEL</option>
        <option value="Out of Scope" className="bg-slate-900 text-slate-400 py-1 font-semibold">Out of Scope</option>
        <option value="N/A" className="bg-slate-900 text-slate-400 py-1 font-semibold">N/A</option>
      </select>
      <ChevronDown className={`w-2.5 h-2.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${
        norm === 'Progress' ? 'text-[#14532d]' : 'text-white/80'
      }`} />
    </div>
  );
};

export const ScheduleView: React.FC = () => {
  const {
    cables,
    searchQuery,
    setSearchQuery,
    scheduleTypeFilter,
    setScheduleTypeFilter,
    sectionFilter,
    setSectionFilter,
    fromLocationFilter,
    setFromLocationFilter,
    toLocationFilter,
    setToLocationFilter,
    cableTypeFilter,
    setCableTypeFilter,
    cableSizeFilter,
    setCableSizeFilter,
    cableLayingFilter,
    setCableLayingFilter,
    preCommissioningFilter,
    setPreCommissioningFilter,
    commissioningFilter,
    setCommissioningFilter,
    approverFilter,
    setApproverFilter,
    resetAllFilters,
    updateCableLayingStatus,
    updatePreCommissioningStatus,
    updateCommissioningStatus,
    updateApprovers,
    updateCable,
    setSelectedCable,
    workAssignments,
    openAssignWorkModal,
    downloadExcelFile,
    lastExcelSaveTime,
    importSpreadsheetData,
    showToast,
    settings,
    canEdit,
    canApproveLevel,
    currentUser,
    isStaff,
    setIsLoginModalOpen,
    setIsImportModalOpen
  } = useApp();

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(100);
  const [assignedStaffFilter, setAssignedStaffFilter] = useState('All');

  // Approval Sign-off Dialog with Note Option before approval
  interface ApprovalDialogState {
    cable: CableEntry;
    level: 1 | 2 | 3;
    signerName: string;
    action: 'sign' | 'revoke';
  }

  const [approvalDialog, setApprovalDialog] = useState<ApprovalDialogState | null>(null);
  const [approvalNoteInput, setApprovalNoteInput] = useState('');

  const openApprovalModal = (cable: CableEntry, level: 1 | 2 | 3, signerName: string) => {
    setApprovalDialog({ cable, level, signerName, action: 'sign' });
    const existingNote = level === 1 
      ? (cable.approvalNote1 || '') 
      : level === 2 
      ? (cable.approvalNote2 || '') 
      : (cable.approvalNote3 || '');
    setApprovalNoteInput(existingNote);
  };

  const openRevokeModal = (cable: CableEntry, level: 1 | 2 | 3, signerName: string) => {
    setApprovalDialog({ cable, level, signerName, action: 'revoke' });
  };

  const handleConfirmApproval = async () => {
    if (!approvalDialog) return;
    const { cable, level, signerName, action } = approvalDialog;
    if (action === 'sign') {
      await updateApprovers(cable.id, level, signerName, approvalNoteInput);
    } else {
      await updateApprovers(cable.id, level, '');
    }
    setApprovalDialog(null);
  };

  // Extract unique options
  const uniqueSections = useMemo(() => {
    return Array.from(new Set(cables.map(c => c.section).filter(Boolean))).sort();
  }, [cables]);

  const uniqueFromLocations = useMemo(() => {
    return Array.from(new Set(cables.map(c => c.fromLocation).filter(Boolean))).sort();
  }, [cables]);

  const uniqueToLocations = useMemo(() => {
    return Array.from(new Set(cables.map(c => c.toLocation).filter(Boolean))).sort();
  }, [cables]);

  const uniqueCableSizes = useMemo(() => {
    return Array.from(new Set(cables.map(c => c.cableSize).filter(Boolean))).sort();
  }, [cables]);

  const uniqueCableTypes = useMemo(() => {
    return Array.from(new Set(cables.map(c => c.cableType).filter(Boolean))).sort();
  }, [cables]);

  // Filtering
  const filteredCables = useMemo(() => {
    return cables.filter(cable => {
      if (scheduleTypeFilter !== 'All' && !(cable.scheduleType || '').includes(scheduleTypeFilter)) return false;
      if (sectionFilter !== 'All' && cable.section !== sectionFilter) return false;
      if (fromLocationFilter !== 'All' && cable.fromLocation !== fromLocationFilter) return false;
      if (toLocationFilter !== 'All' && cable.toLocation !== toLocationFilter) return false;
      if (cableSizeFilter !== 'All' && cable.cableSize !== cableSizeFilter) return false;
      if (cableTypeFilter !== 'All' && cable.cableType !== cableTypeFilter) return false;

      // 3 Stages Filters with normalized comparison
      if (cableLayingFilter !== 'All') {
        const norm = normalizeStatus(cable.cableLayingStatus);
        if (cableLayingFilter === 'Done' || cableLayingFilter === 'Completed' || cableLayingFilter === 'All Completed') {
          if (norm !== 'Complete By VEL' && norm !== 'Complete By Bargen') return false;
        } else if (norm !== normalizeStatus(cableLayingFilter)) {
          return false;
        }
      }
      if (preCommissioningFilter !== 'All') {
        const norm = normalizeStatus(cable.preCommissioningStatus);
        if (preCommissioningFilter === 'Done' || preCommissioningFilter === 'Completed' || preCommissioningFilter === 'All Completed') {
          if (norm !== 'Complete By VEL' && norm !== 'Complete By Bargen') return false;
        } else if (norm !== normalizeStatus(preCommissioningFilter)) {
          return false;
        }
      }
      if (commissioningFilter !== 'All') {
        const norm = normalizeStatus(cable.commissioningStatus);
        if (commissioningFilter === 'Done' || commissioningFilter === 'Completed' || commissioningFilter === 'All Completed') {
          if (norm !== 'Complete By VEL' && norm !== 'Complete By Bargen') return false;
        } else if (norm !== normalizeStatus(commissioningFilter)) {
          return false;
        }
      }
      if (approverFilter !== 'All') {
        if ((approverFilter === 'Fahad Sir' || approverFilter === 'Md Fahad (Manager PP)') && !cable.approvedBy3) return false;
        if ((approverFilter === 'Mosaddik Bhai' || approverFilter === 'Mossadek Hossain (Sr. Engr)') && !cable.approvedBy2) return false;
        if ((approverFilter === 'Naim Bhai' || approverFilter === 'Nayem Siddik (Sr. Engr)') && !cable.approvedBy1) return false;
      }

      // Assigned Staff Filter
      if (assignedStaffFilter !== 'All') {
        const assignment = workAssignments.find(a => (a.cableTag && a.cableTag === cable.cableTag) || (a.cableId && a.cableId === cable.id));
        if (assignedStaffFilter === 'unassigned') {
          if (assignment || cable.assignedTo) return false;
        } else {
          const target = (assignment?.assignedToUsername || assignment?.assignedToName || cable.assignedTo || '').toLowerCase();
          if (!target.includes(assignedStaffFilter.toLowerCase())) return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTag = cable.cableTag.toLowerCase().includes(q);
        const matchesDesc = cable.description.toLowerCase().includes(q);
        const matchesFrom = cable.fromEquipment.toLowerCase().includes(q) || cable.fromLocation.toLowerCase().includes(q);
        const matchesTo = cable.toEquipment.toLowerCase().includes(q) || cable.toLocation.toLowerCase().includes(q);
        const matchesSection = cable.section.toLowerCase().includes(q);
        const matchesSize = cable.cableSize.toLowerCase().includes(q);
        if (!matchesTag && !matchesDesc && !matchesFrom && !matchesTo && !matchesSection && !matchesSize) {
          return false;
        }
      }
      return true;
    });
  }, [
    cables,
    scheduleTypeFilter,
    sectionFilter,
    fromLocationFilter,
    toLocationFilter,
    cableSizeFilter,
    cableTypeFilter,
    cableLayingFilter,
    preCommissioningFilter,
    commissioningFilter,
    approverFilter,
    assignedStaffFilter,
    workAssignments,
    searchQuery
  ]);

  const activeFiltersCount = [
    scheduleTypeFilter !== 'All',
    sectionFilter !== 'All',
    fromLocationFilter !== 'All',
    toLocationFilter !== 'All',
    cableSizeFilter !== 'All',
    cableTypeFilter !== 'All',
    cableLayingFilter !== 'All',
    preCommissioningFilter !== 'All',
    commissioningFilter !== 'All',
    approverFilter !== 'All',
    assignedStaffFilter !== 'All',
    Boolean(searchQuery.trim())
  ].filter(Boolean).length;

  const totalPages = pageSize === -1 ? 1 : (Math.ceil(filteredCables.length / pageSize) || 1);
  const paginatedCables = pageSize === -1 
    ? filteredCables 
    : filteredCables.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCsv = () => {
    const headers = [
      'SR NO',
      'SECTION',
      'CABLE TAG',
      'FROM LOCATION',
      'FROM INSTRUMENT/PANEL',
      'TO LOCATION',
      'TO INSTRUMENT/PANEL',
      'NO OF RUNS',
      'CABLE SIZE',
      'CABLE TYPE',
      'DESCRIPTION',
      'CABLE LAYING STATUS',
      'PRE-COMMISSIONING STATUS',
      'COMMISSIONING STATUS',
      'APPROVE BY (LEVEL 1: NAYEM SIDDIK)',
      'NAYEM SIDDIK NOTE (L1)',
      'APPROVE BY (LEVEL 2: MOSSADEK HOSSAIN)',
      'MOSSADEK HOSSAIN NOTE (L2)',
      'APPROVE BY (LEVEL 3: MD FAHAD)',
      'MD FAHAD NOTE (L3)'
    ];

    const rows = filteredCables.map(c => [
      `"${c.srNo}"`,
      `"${c.section}"`,
      `"${c.cableTag}"`,
      `"${c.fromLocation}"`,
      `"${c.fromEquipment}"`,
      `"${c.toLocation}"`,
      `"${c.toEquipment}"`,
      c.runs,
      `"${c.cableSize}"`,
      `"${c.cableType}"`,
      `"${c.description.replace(/"/g, '""')}"`,
      `"${c.cableLayingStatus}"`,
      `"${c.preCommissioningStatus}"`,
      `"${c.commissioningStatus}"`,
      `"${c.approvedBy1 || ''}"`,
      `"${(c.approvalNote1 || '').replace(/"/g, '""')}"`,
      `"${c.approvedBy2 || ''}"`,
      `"${(c.approvalNote2 || '').replace(/"/g, '""')}"`,
      `"${c.approvedBy3 || ''}"`,
      `"${(c.approvalNote3 || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cable_Schedule_Status_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (!data || !data.length) {
          showToast('No cable rows found in uploaded Excel file', 'error');
          return;
        }

        const importedCables: CableEntry[] = data.map((r, idx) => ({
          id: `CABLE-IMP-${idx + 1}`,
          srNo: String(r['Sr. No.'] || r['SR. NO.'] || idx + 1),
          cableTag: String(r['Cable Designation'] || r['CABLE DESIGNATION'] || r['Tag'] || `TAG-${idx + 1}`),
          scheduleType: String(r['Schedule Type'] || 'LV Power Cable Schedule'),
          section: String(r['Section'] || 'General'),
          fromLocation: String(r['From Location'] || r['From (Location)'] || ''),
          fromEquipment: String(r['From Equipment / Panel'] || r['From Equipment'] || ''),
          toLocation: String(r['To Location'] || r['To (Location)'] || ''),
          toEquipment: String(r['To Equipment / Panel'] || r['To Equipment'] || ''),
          runs: Number(r['No. of Runs'] || r['Runs'] || 1),
          cableSize: String(r['Cable Size'] || ''),
          cableType: String(r['Cable Type'] || ''),
          description: String(r['Description / Scope'] || r['Description'] || ''),
          voltage: String(r['Voltage'] || '415V'),
          status: 'Installed',
          cableLayingStatus: (r['Cable Laying Status'] as CableLayingStatus) || 'Pending',
          cableLayingRemarks: String(r['Cable Laying Remarks'] || ''),
          preCommissioningStatus: (r['Pre-Commissioning Status'] as CommissioningStatus) || 'Pending',
          preCommissioningRemarks: String(r['Pre-Commissioning Remarks'] || ''),
          commissioningStatus: (r['Commissioning Status'] as CommissioningStatus) || 'Pending',
          commissioningRemarks: String(r['Commissioning Remarks'] || ''),
          approvedBy1: r['Approve: Nayem Siddik (Sr. Engr)'] || r['Nayem Siddik'] || r['Approve: Naim Bhai'] || r['Naim Bhai'] ? 'Nayem Siddik (Sr. Engr)' : undefined,
          approvedBy2: r['Approve: Mossadek Hossain (Sr. Engr)'] || r['Mossadek Hossain'] || r['Approve: Mosaddik Bhai'] || r['Mosaddik Bhai'] ? 'Mossadek Hossain (Sr. Engr)' : undefined,
          approvedBy3: r['Approve: Md Fahad (Manager PP)'] || r['Md Fahad'] || r['Approve: Fahad Sir'] || r['Fahad Sir'] ? 'Md Fahad (Manager PP)' : undefined,
          updatedAt: new Date().toISOString()
        }));

        importSpreadsheetData(importedCables);
        showToast(`Successfully imported & synced ${importedCables.length} cables from Excel!`, 'success');
      } catch (err: any) {
        showToast(`Failed to parse Excel file: ${err.message}`, 'error');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="glass-card rounded-2xl p-4 shadow-xl space-y-3.5">
        
        {/* Row 1: Search + Fast Schedule Tabs + Mode & Export */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Cable Tag (e.g. PCC1W01*, G1W01), Equipment, Scope..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-9 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/40 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Schedule Fast Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
            {[
              { id: 'All', label: 'All Schedules', count: cables.length },
              { id: 'LV Power', label: 'LV Power Cables', count: cables.filter(c => (c.scheduleType || '').includes('LV Power')).length },
              { id: 'Control', label: 'Control Cables', count: cables.filter(c => (c.scheduleType || '').includes('Control')).length }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => {
                  setScheduleTypeFilter(type.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                  scheduleTypeFilter === type.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <span>{type.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  scheduleTypeFilter === type.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-slate-400'
                }`}>
                  {type.count}
                </span>
              </button>
            ))}
          </div>

          {/* Table/Card View & Export */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'cards' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
                title="Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Live Excel Auto-Save Indicator */}
            {lastExcelSaveTime && (
              <span className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel Live-Saved {lastExcelSaveTime}</span>
              </span>
            )}

            {/* Quick Assign Work Button - Visible ONLY on Staff Profile */}
            {isStaff && (
              <button
                onClick={() => openAssignWorkModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs transition-all active:scale-95 shadow-md shadow-amber-500/20"
                title="Assign electrical work on cables to another staff member"
              >
                <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Assign Work</span>
              </button>
            )}

            {/* Direct Excel Download button - Visible ONLY for logged-in profiles: Admin, Nayem, Mossadek, Fahad */}
            {currentUser && (
              <button
                onClick={downloadExcelFile}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-emerald-600/20"
                title="Download live synchronized Excel spreadsheet (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Download Excel</span>
              </button>
            )}

            {/* Import Data Center button (Excel, PDF, Manual) - Visible ONLY for Admin Profile */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
                title="Import Excel, PDF or Manual Cable Input (Admin Only)"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Import Data</span>
              </button>
            )}

            {/* Manual Quick Add Cable button - Visible ONLY for Admin Profile */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all active:scale-95 shadow-md shadow-amber-500/20"
                title="Add Single Cable or Paste Data (Admin Only)"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Cable</span>
              </button>
            )}

            {/* Export CSV button - Visible ONLY for logged-in profiles: Admin, Nayem, Mossadek, Fahad */}
            {currentUser && (
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm"
                title="Download CSV spreadsheet"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Deep Filtering Dropdown Selectors */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Filter by Section, Routes & Statuses
              </span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  {activeFiltersCount} Active
                </span>
              )}
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1 text-slate-400 hover:text-amber-300 text-xs font-medium transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
            {/* Section */}
            <div>
              <select
                value={sectionFilter}
                onChange={e => { setSectionFilter(e.target.value); setCurrentPage(1); }}
                className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400 truncate"
              >
                <option value="All">All Sections ({uniqueSections.length})</option>
                {uniqueSections.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* From Location */}
            <div>
              <select
                value={fromLocationFilter}
                onChange={e => { setFromLocationFilter(e.target.value); setCurrentPage(1); }}
                className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400 truncate"
              >
                <option value="All">All Origins ({uniqueFromLocations.length})</option>
                {uniqueFromLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* To Location */}
            <div>
              <select
                value={toLocationFilter}
                onChange={e => { setToLocationFilter(e.target.value); setCurrentPage(1); }}
                className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400 truncate"
              >
                <option value="All">All Destinations ({uniqueToLocations.length})</option>
                {uniqueToLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Cable Laying Status */}
            <div>
              <select
                value={cableLayingFilter}
                onChange={e => { setCableLayingFilter(e.target.value); setCurrentPage(1); }}
                className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-400 truncate"
              >
                <option value="All">Laying: All</option>
                <option value="Done" className="font-bold text-emerald-400">✓ Laying: Total Done (VEL & Bargen)</option>
                <option value="Complete By VEL">Laying: Complete By VEL</option>
                <option value="Complete By Bargen">Laying: Complete By Bargen</option>
                <option value="Progress">Laying: Progress</option>
                <option value="Pending">Laying: Pending</option>
                <option value="Scope of Bargen">Laying: Scope of Bargen</option>
                <option value="Scope of VEL">Laying: Scope of VEL</option>
                <option value="Out of Scope">Laying: Out of Scope</option>
                <option value="N/A">Laying: N/A</option>
              </select>
            </div>

            {/* Pre-Commissioning Status */}
            <div>
              <select
                value={preCommissioningFilter}
                onChange={e => { setPreCommissioningFilter(e.target.value); setCurrentPage(1); }}
                className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-400 truncate"
              >
                <option value="All">Pre-Comm: All</option>
                <option value="Done" className="font-bold text-emerald-400">✓ Pre-Comm: Total Done (Bargen & VEL)</option>
                <option value="Complete By Bargen">Pre-Comm: Complete By Bargen</option>
                <option value="Complete By VEL">Pre-Comm: Complete By VEL</option>
                <option value="Progress">Pre-Comm: Progress</option>
                <option value="Pending">Pre-Comm: Pending</option>
                <option value="Scope of Bargen">Pre-Comm: Scope of Bargen</option>
                <option value="Scope of VEL">Pre-Comm: Scope of VEL</option>
                <option value="Out of Scope">Pre-Comm: Out of Scope</option>
                <option value="N/A">Pre-Comm: N/A</option>
              </select>
            </div>

            {/* Commissioning Status */}
            <div>
              <select
                value={commissioningFilter}
                onChange={e => { setCommissioningFilter(e.target.value); setCurrentPage(1); }}
                className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-400 truncate"
              >
                <option value="All">Comm: All</option>
                <option value="Done" className="font-bold text-emerald-400">✓ Comm: Total Done (Bargen & VEL)</option>
                <option value="Complete By Bargen">Comm: Complete By Bargen</option>
                <option value="Complete By VEL">Comm: Complete By VEL</option>
                <option value="Progress">Comm: Progress</option>
                <option value="Pending">Comm: Pending</option>
                <option value="Scope of Bargen">Comm: Scope of Bargen</option>
                <option value="Scope of VEL">Comm: Scope of VEL</option>
                <option value="Out of Scope">Comm: Out of Scope</option>
                <option value="N/A">Comm: N/A</option>
              </select>
            </div>

            {/* Approver Sign-off */}
            <div>
              <select
                value={approverFilter}
                onChange={e => { setApproverFilter(e.target.value); setCurrentPage(1); }}
                className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400 truncate"
              >
                <option value="All">Approvals: All</option>
                <option value="Md Fahad (Manager PP)">Approved: Md Fahad (Manager PP)</option>
                <option value="Mossadek Hossain (Sr. Engr)">Verified: Mossadek Hossain (Sr. Engr)</option>
                <option value="Nayem Siddik (Sr. Engr)">Checked: Nayem Siddik (Sr. Engr)</option>
              </select>
            </div>

            {/* Assigned Staff Filter */}
            <div>
              <select
                value={assignedStaffFilter}
                onChange={e => { setAssignedStaffFilter(e.target.value); setCurrentPage(1); }}
                className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400 truncate"
              >
                <option value="All">Assigned: All Staff</option>
                <option value="Nayem">Assigned: Nayem Siddik</option>
                <option value="Mossadek">Assigned: Mossadek Hossain</option>
                <option value="Fahad">Assigned: Md Fahad</option>
                <option value="unassigned">Unassigned Cables</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-800/60 text-[11px]">
              <span className="text-slate-400 font-semibold text-[10.5px]">Active:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium">
                  <span>Search: &quot;{searchQuery}&quot;</span>
                  <button onClick={() => setSearchQuery('')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {sectionFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-medium">
                  <span>Section: {sectionFilter}</span>
                  <button onClick={() => setSectionFilter('All')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {fromLocationFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-medium">
                  <span>From: {fromLocationFilter}</span>
                  <button onClick={() => setFromLocationFilter('All')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {toLocationFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-medium">
                  <span>To: {toLocationFilter}</span>
                  <button onClick={() => setToLocationFilter('All')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {cableLayingFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium">
                  <span>Laying: {cableLayingFilter}</span>
                  <button onClick={() => setCableLayingFilter('All')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {preCommissioningFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 font-medium">
                  <span>Pre-Comm: {preCommissioningFilter}</span>
                  <button onClick={() => setPreCommissioningFilter('All')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {commissioningFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-medium">
                  <span>Comm: {commissioningFilter}</span>
                  <button onClick={() => setCommissioningFilter('All')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {approverFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium">
                  <span>Approver: {approverFilter.split(' ')[0]}</span>
                  <button onClick={() => setApproverFilter('All')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {assignedStaffFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium">
                  <span>Staff: {assignedStaffFilter}</span>
                  <button onClick={() => setAssignedStaffFilter('All')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              <button
                onClick={resetAllFilters}
                className="text-[10px] text-amber-400 hover:text-amber-300 underline font-semibold ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Result Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-white">{filteredCables.length}</strong> of{' '}
            <strong className="text-slate-300">{cables.length}</strong> cables from spreadsheet
            {activeFiltersCount > 0 && <span className="text-amber-400 ml-1.5 font-semibold">(Filtered)</span>}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-700 text-white rounded-lg px-2 py-0.5 text-xs font-semibold focus:outline-none focus:border-amber-400"
            >
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
              <option value={200}>200 rows</option>
              <option value={-1}>All ({filteredCables.length} rows)</option>
            </select>
          </div>
          {pageSize !== -1 && totalPages > 1 && (
            <div className="font-medium text-slate-400">
              Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Table View matching user spreadsheet layout */}
      {viewMode === 'table' ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto max-h-[75vh] overflow-y-auto">
            <table className="w-full min-w-[1150px] text-left text-xs text-slate-300 border-collapse table-fixed">
              <colgroup>
                {/* 1. Sr # */}
                <col style={{ width: '44px' }} />
                {/* 2. Cable Designation */}
                <col style={{ width: '140px' }} />
                {/* 3. From (Origin) */}
                <col style={{ width: '155px' }} />
                {/* 4. To (Destination) */}
                <col style={{ width: '155px' }} />
                {/* 5. Cable Laying Status */}
                <col style={{ width: '130px' }} />
                {/* 6. Pre-Commissioning Status */}
                <col style={{ width: '130px' }} />
                {/* 7. Commissioning Status */}
                <col style={{ width: '130px' }} />
                {/* 8. Nayem Siddik */}
                <col style={{ width: '115px' }} />
                {/* 9. Mossadek Hossain */}
                <col style={{ width: '115px' }} />
                {/* 10. Md Fahad */}
                <col style={{ width: '115px' }} />
                {/* 11. View Action */}
                <col style={{ width: '44px' }} />
              </colgroup>

              {/* Top Tier Headers */}
              <thead>
                <tr className="bg-slate-900 text-white border-b border-slate-800 text-[11px] font-bold sticky top-0 z-20">
                  <th colSpan={4} className="py-2.5 px-3 border-r border-slate-800/80 bg-slate-900/95 text-slate-300 font-extrabold tracking-wider">
                    CABLE SPECIFICATION & ROUTING
                  </th>
                  <th colSpan={1} className="py-2.5 px-3 text-center bg-slate-900/95 text-emerald-400 font-extrabold border-r border-slate-800/80 tracking-wider">
                    Cable Laying
                  </th>
                  <th colSpan={1} className="py-2.5 px-3 text-center bg-slate-900/95 text-teal-400 font-extrabold border-r border-slate-800/80 tracking-wider">
                    Pre-Commissioning
                  </th>
                  <th colSpan={1} className="py-2.5 px-3 text-center bg-slate-900/95 text-cyan-400 font-extrabold border-r border-slate-800/80 tracking-wider">
                    Commissioning
                  </th>
                  <th colSpan={3} className="py-2.5 px-3 text-center bg-slate-900/95 text-amber-400 font-extrabold border-r border-slate-800/80 tracking-wider">
                    Approve By
                  </th>
                  <th className="py-2.5 px-1 text-center bg-slate-900/95"></th>
                </tr>

                {/* Subheaders */}
                <tr className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 font-bold sticky top-[36px] z-20 shadow-md">
                  <th className="py-2.5 px-2 text-slate-500 text-center border-r border-slate-800/60 bg-slate-950">Sr #</th>
                  <th className="py-2.5 px-3 bg-slate-950 border-r border-slate-800/60">Cable Designation</th>
                  <th className="py-2.5 px-3 bg-slate-950 border-r border-slate-800/60">From (Origin)</th>
                  <th className="py-2.5 px-3 bg-slate-950 border-r border-slate-800">To (Destination)</th>
                  
                  {/* Cable Laying subheader */}
                  <th className="py-2.5 px-2 text-center bg-slate-950 border-r border-slate-800">Status</th>

                  {/* Pre-Commissioning subheader */}
                  <th className="py-2.5 px-2 text-center bg-slate-950 border-r border-slate-800">Status</th>

                  {/* Commissioning subheader */}
                  <th className="py-2.5 px-2 text-center bg-slate-950 border-r border-slate-800">Status</th>

                  {/* Approve By subheaders - exact matching the 3 approval persons */}
                  <th className="py-2 px-2 text-center font-bold text-slate-200 border-r border-slate-800/60 bg-slate-950">
                    <div>Nayem Siddik</div>
                    <div className="text-[9px] text-slate-400 font-normal">Sr. Engr</div>
                  </th>
                  <th className="py-2 px-2 text-center font-bold text-slate-200 border-r border-slate-800/60 bg-slate-950">
                    <div>Mossadek Hossain</div>
                    <div className="text-[9px] text-slate-400 font-normal">Sr. Engr</div>
                  </th>
                  <th className="py-2 px-2 text-center font-bold text-amber-300 border-r border-slate-800 bg-slate-950">
                    <div>Md Fahad</div>
                    <div className="text-[9px] text-amber-400/80 font-normal">Manager PP</div>
                  </th>
                  <th className="py-2.5 px-1 text-center bg-slate-950 text-slate-500">View</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60 font-sans">
                {paginatedCables.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-16 text-center text-slate-500">
                      No cables matched your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedCables.map((cable) => (
                    <tr
                      key={cable.id}
                      className="hover:bg-slate-850/80 transition-colors group"
                    >
                      {/* Sr No */}
                      <td className="py-2 px-2 font-mono text-slate-500 text-[11px] text-center border-r border-slate-800/40">
                        {cable.srNo}
                      </td>

                      {/* Cable Tag */}
                      <td className="py-2 px-3 border-r border-slate-800/40">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span 
                            onClick={() => setSelectedCable(cable)}
                            className="font-mono font-bold text-amber-300 hover:text-amber-200 cursor-pointer bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-xs inline-block truncate max-w-full"
                            title="Click to inspect cable details & individual staff notes"
                          >
                            {cable.cableTag}
                          </span>
                          {(() => {
                            const assignment = workAssignments.find(a => (a.cableTag && a.cableTag === cable.cableTag) || (a.cableId && a.cableId === cable.id));
                            if (assignment) {
                              return (
                                <span 
                                  onClick={() => setSelectedCable(cable)}
                                  className="px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] font-bold cursor-pointer hover:bg-amber-500/25 shrink-0"
                                  title={`Assigned to ${assignment.assignedToName}: ${assignment.title} (${assignment.status})`}
                                >
                                  👤 {assignment.assignedToName.split(' ')[0]}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate" title={`${cable.cableSize} (${cable.cableType})`}>
                          {cable.cableSize} ({cable.cableType})
                        </div>
                      </td>

                      {/* From */}
                      <td className="py-2 px-3 border-r border-slate-800/40">
                        <div className="font-semibold text-white truncate text-xs" title={cable.fromEquipment}>
                          {cable.fromEquipment || '—'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate" title={cable.fromLocation}>
                          {cable.fromLocation || '—'}
                        </div>
                      </td>

                      {/* To */}
                      <td className="py-2 px-3 border-r border-slate-800">
                        <div className="font-semibold text-white truncate text-xs flex items-center gap-1" title={cable.toEquipment}>
                          <ArrowRight className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                          <span className="truncate">{cable.toEquipment || '—'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate pl-3.5" title={cable.toLocation}>
                          {cable.toLocation || '—'}
                        </div>
                      </td>

                      {/* Cable Laying Status Pill */}
                      <td className="py-2 px-2 text-center whitespace-nowrap bg-slate-950/30 border-r border-slate-800">
                        <StatusPill
                          type="laying"
                          status={cable.cableLayingStatus}
                          disabled={!canEdit}
                          onBlocked={() => {
                            showToast('Staff Login Required: Log in as Senior Engineer or Admin to change status.', 'warning');
                            setIsLoginModalOpen(true);
                          }}
                          onChange={(newStatus) => updateCableLayingStatus(cable.id, newStatus)}
                        />
                      </td>

                      {/* Pre-Commissioning Status Pill */}
                      <td className="py-2 px-2 text-center whitespace-nowrap bg-slate-950/20 border-r border-slate-800">
                        <StatusPill
                          type="pre"
                          status={cable.preCommissioningStatus}
                          disabled={!canEdit}
                          onBlocked={() => {
                            showToast('Staff Login Required: Log in as Senior Engineer or Admin to change status.', 'warning');
                            setIsLoginModalOpen(true);
                          }}
                          onChange={(newStatus) => updatePreCommissioningStatus(cable.id, newStatus)}
                        />
                      </td>

                      {/* Commissioning Status Pill */}
                      <td className="py-2 px-2 text-center whitespace-nowrap bg-slate-950/30 border-r border-slate-800">
                        <StatusPill
                          type="comm"
                          status={cable.commissioningStatus}
                          disabled={!canEdit}
                          onBlocked={() => {
                            showToast('Staff Login Required: Log in as Senior Engineer or Admin to change status.', 'warning');
                            setIsLoginModalOpen(true);
                          }}
                          onChange={(newStatus) => updateCommissioningStatus(cable.id, newStatus)}
                        />
                      </td>

                      {/* Approve By: Nayem Siddik (Only Nayem Siddik or Admin can sign) */}
                      <td className="py-2 px-1.5 text-center whitespace-nowrap border-r border-slate-800/60">
                        {(() => {
                          const canSign = canApproveLevel(1);
                          const isApproved = Boolean(cable.approvedBy1);
                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!canSign) {
                                  showToast('Access Restricted: Level 1 can only be signed off by Nayem Siddik (Senior Engineer) or Admin.', 'warning');
                                  setIsLoginModalOpen(true);
                                  return;
                                }
                                if (isApproved) {
                                  openRevokeModal(cable, 1, 'Nayem Siddik (Sr. Engr)');
                                } else {
                                  openApprovalModal(cable, 1, 'Nayem Siddik (Sr. Engr)');
                                }
                              }}
                              className={`w-full py-1 px-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                                isApproved
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm font-bold hover:bg-emerald-500/30'
                                  : canSign
                                  ? 'border border-dashed border-emerald-500/60 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 font-bold active:scale-95'
                                  : 'text-slate-600 hover:text-slate-400 opacity-60 cursor-not-allowed'
                              }`}
                              title={
                                !canSign
                                  ? isApproved
                                    ? `Signed by ${cable.approvedBy1}${cable.approvalNote1 ? `\nNayem's Note: ${cable.approvalNote1}` : ''}`
                                    : 'Restricted to Nayem Siddik (Senior Engineer) only'
                                  : isApproved
                                  ? `Signed: ${cable.approvedBy1}${cable.approvalNote1 ? `\nNayem's Note: ${cable.approvalNote1}` : ''}. Click to revoke.`
                                  : 'Click to enter note & sign Level 1 as Nayem Siddik'
                              }
                            >
                              {isApproved ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span className="truncate">Nayem</span>
                                  {cable.approvalNote1 && (
                                    <MessageSquare className="w-2.5 h-2.5 text-amber-300 shrink-0" title={`Nayem's Note: ${cable.approvalNote1}`} />
                                  )}
                                </>
                              ) : canSign ? (
                                <span className="truncate">+ Sign (Nayem)</span>
                              ) : (
                                <>
                                  <span className="truncate">—</span>
                                  <Lock className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                </>
                              )}
                            </button>
                          );
                        })()}
                      </td>

                      {/* Approve By: Mossadek Hossain (Only Mossadek Hossain or Admin can sign) */}
                      <td className="py-2 px-1.5 text-center whitespace-nowrap border-r border-slate-800/60">
                        {(() => {
                          const canSign = canApproveLevel(2);
                          const isApproved = Boolean(cable.approvedBy2);
                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!canSign) {
                                  showToast('Access Restricted: Level 2 can only be signed off by Mossadek Hossain (Senior Engineer) or Admin.', 'warning');
                                  setIsLoginModalOpen(true);
                                  return;
                                }
                                if (isApproved) {
                                  openRevokeModal(cable, 2, 'Mossadek Hossain (Sr. Engr)');
                                } else {
                                  openApprovalModal(cable, 2, 'Mossadek Hossain (Sr. Engr)');
                                }
                              }}
                              className={`w-full py-1 px-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                                isApproved
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm font-bold hover:bg-emerald-500/30'
                                  : canSign
                                  ? 'border border-dashed border-emerald-500/60 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 font-bold active:scale-95'
                                  : 'text-slate-600 hover:text-slate-400 opacity-60 cursor-not-allowed'
                              }`}
                              title={
                                !canSign
                                  ? isApproved
                                    ? `Signed by ${cable.approvedBy2}${cable.approvalNote2 ? `\nMossadek's Note: ${cable.approvalNote2}` : ''}`
                                    : 'Restricted to Mossadek Hossain (Senior Engineer) only'
                                  : isApproved
                                  ? `Signed: ${cable.approvedBy2}${cable.approvalNote2 ? `\nMossadek's Note: ${cable.approvalNote2}` : ''}. Click to revoke.`
                                  : 'Click to enter note & sign Level 2 as Mossadek Hossain'
                              }
                            >
                              {isApproved ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span className="truncate">Mossadek</span>
                                  {cable.approvalNote2 && (
                                    <MessageSquare className="w-2.5 h-2.5 text-amber-300 shrink-0" title={`Mossadek's Note: ${cable.approvalNote2}`} />
                                  )}
                                </>
                              ) : canSign ? (
                                <span className="truncate">+ Sign (Mossadek)</span>
                              ) : (
                                <>
                                  <span className="truncate">—</span>
                                  <Lock className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                </>
                              )}
                            </button>
                          );
                        })()}
                      </td>

                      {/* Approve By: Md Fahad (Only Md Fahad or Admin can sign) */}
                      <td className="py-2 px-1.5 text-center whitespace-nowrap border-r border-slate-800">
                        {(() => {
                          const canSign = canApproveLevel(3);
                          const isApproved = Boolean(cable.approvedBy3);
                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!canSign) {
                                  showToast('Access Restricted: Level 3 final approval can only be signed by Md Fahad (Manager PP) or Admin.', 'warning');
                                  setIsLoginModalOpen(true);
                                  return;
                                }
                                if (isApproved) {
                                  openRevokeModal(cable, 3, 'Md Fahad (Manager PP)');
                                } else {
                                  openApprovalModal(cable, 3, 'Md Fahad (Manager PP)');
                                }
                              }}
                              className={`w-full py-1 px-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                                isApproved
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm font-bold hover:bg-amber-500/30'
                                  : canSign
                                  ? 'border border-dashed border-amber-500/60 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 font-bold active:scale-95'
                                  : 'text-slate-600 hover:text-slate-400 opacity-60 cursor-not-allowed'
                              }`}
                              title={
                                !canSign
                                  ? isApproved
                                    ? `Final approval by ${cable.approvedBy3}${cable.approvalNote3 ? `\nFahad's Note: ${cable.approvalNote3}` : ''}`
                                    : 'Restricted to Md Fahad (Manager PP) only'
                                  : isApproved
                                  ? `Approved: ${cable.approvedBy3}${cable.approvalNote3 ? `\nFahad's Note: ${cable.approvalNote3}` : ''}. Click to revoke.`
                                  : 'Click to enter note & grant final approval as Md Fahad'
                              }
                            >
                              {isApproved ? (
                                <>
                                  <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="truncate">Md Fahad</span>
                                  {cable.approvalNote3 && (
                                    <MessageSquare className="w-2.5 h-2.5 text-amber-300 shrink-0" title={`Fahad's Note: ${cable.approvalNote3}`} />
                                  )}
                                </>
                              ) : canSign ? (
                                <span className="truncate">+ Approve (Fahad)</span>
                              ) : (
                                <>
                                  <span className="truncate">—</span>
                                  <Lock className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                </>
                              )}
                            </button>
                          );
                        })()}
                      </td>

                      {/* Inspect Drawer button */}
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => setSelectedCable(cable)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                          title="Inspect Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View with exact 3-stage status badges */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedCables.map((cable) => (
            <div
              key={cable.id}
              onClick={() => setSelectedCable(cable)}
              className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4.5 transition-all shadow-xl cursor-pointer flex flex-col justify-between group hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    {cable.cableTag}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {cable.runs} Run(s) • {cable.cableSize}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-300 mb-2 truncate">
                  {cable.section}
                </div>

                {/* Routing Flow */}
                <div className="p-3 bg-slate-950/70 border border-slate-850 rounded-xl space-y-1.5 text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-amber-400 block font-semibold">FROM:</span>
                    <span className="font-bold text-white text-xs">{cable.fromEquipment}</span>
                    <span className="text-slate-400 text-[11px] block">{cable.fromLocation}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-800/60">
                    <span className="text-[10px] text-emerald-400 block font-semibold">TO:</span>
                    <span className="font-bold text-white text-xs">{cable.toEquipment}</span>
                    <span className="text-slate-400 text-[11px] block">{cable.toLocation}</span>
                  </div>
                </div>

                {/* 3 Phases Badges Grid */}
                <div className="space-y-2 p-3 bg-slate-950/40 rounded-xl border border-slate-850/60 text-xs">
                  <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Cable Laying:</span>
                    <StatusPill
                      type="laying"
                      status={cable.cableLayingStatus}
                      disabled={!canEdit}
                      onBlocked={() => {
                        showToast('Staff Login Required: Log in as Senior Engineer or Admin to change status.', 'warning');
                        setIsLoginModalOpen(true);
                      }}
                      onChange={(newStatus) => updateCableLayingStatus(cable.id, newStatus)}
                    />
                  </div>
                  <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Pre-Commissioning:</span>
                    <StatusPill
                      type="pre"
                      status={cable.preCommissioningStatus}
                      disabled={!canEdit}
                      onBlocked={() => {
                        showToast('Staff Login Required: Log in as Senior Engineer or Admin to change status.', 'warning');
                        setIsLoginModalOpen(true);
                      }}
                      onChange={(newStatus) => updatePreCommissioningStatus(cable.id, newStatus)}
                    />
                  </div>
                  <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Commissioning:</span>
                    <StatusPill
                      type="comm"
                      status={cable.commissioningStatus}
                      disabled={!canEdit}
                      onBlocked={() => {
                        showToast('Staff Login Required: Log in as Senior Engineer or Admin to change status.', 'warning');
                        setIsLoginModalOpen(true);
                      }}
                      onChange={(newStatus) => updateCommissioningStatus(cable.id, newStatus)}
                    />
                  </div>
                </div>

                {/* 3-Level Approve By Bar in Card View */}
                <div className="mt-2.5 pt-2 border-t border-slate-850 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Engineering Sign-offs:</span>
                    <span className="text-slate-500 font-normal">3 Levels</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Level 1: Nayem */}
                    {(() => {
                      const canSign = canApproveLevel(1);
                      const isApproved = Boolean(cable.approvedBy1);
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (!canSign) {
                              showToast('Access Restricted: Level 1 sign-off is reserved to Nayem Siddik or Admin.', 'warning');
                              setIsLoginModalOpen(true);
                              return;
                            }
                            if (isApproved) {
                              openRevokeModal(cable, 1, 'Nayem Siddik (Sr. Engr)');
                            } else {
                              openApprovalModal(cable, 1, 'Nayem Siddik (Sr. Engr)');
                            }
                          }}
                          className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold text-center transition-all flex items-center justify-center gap-1 truncate ${
                            isApproved
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                              : canSign
                              ? 'border border-dashed border-emerald-500/60 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 font-bold'
                              : 'bg-slate-950/80 text-slate-600 border border-slate-800'
                          }`}
                          title={isApproved ? `Signed: ${cable.approvedBy1}` : canSign ? 'Click to sign L1 (Nayem Siddik)' : 'L1: Nayem Siddik'}
                        >
                          {isApproved ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" /> : !canSign && <Lock className="w-2 h-2 text-slate-600 shrink-0" />}
                          <span className="truncate">{isApproved ? 'Nayem' : canSign ? '+ L1' : 'L1: —'}</span>
                        </button>
                      );
                    })()}

                    {/* Level 2: Mossadek */}
                    {(() => {
                      const canSign = canApproveLevel(2);
                      const isApproved = Boolean(cable.approvedBy2);
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (!canSign) {
                              showToast('Access Restricted: Level 2 sign-off is reserved to Mossadek Hossain or Admin.', 'warning');
                              setIsLoginModalOpen(true);
                              return;
                            }
                            if (isApproved) {
                              openRevokeModal(cable, 2, 'Mossadek Hossain (Sr. Engr)');
                            } else {
                              openApprovalModal(cable, 2, 'Mossadek Hossain (Sr. Engr)');
                            }
                          }}
                          className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold text-center transition-all flex items-center justify-center gap-1 truncate ${
                            isApproved
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                              : canSign
                              ? 'border border-dashed border-emerald-500/60 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 font-bold'
                              : 'bg-slate-950/80 text-slate-600 border border-slate-800'
                          }`}
                          title={isApproved ? `Signed: ${cable.approvedBy2}` : canSign ? 'Click to sign L2 (Mossadek Hossain)' : 'L2: Mossadek Hossain'}
                        >
                          {isApproved ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" /> : !canSign && <Lock className="w-2 h-2 text-slate-600 shrink-0" />}
                          <span className="truncate">{isApproved ? 'Mossadek' : canSign ? '+ L2' : 'L2: —'}</span>
                        </button>
                      );
                    })()}

                    {/* Level 3: Fahad */}
                    {(() => {
                      const canSign = canApproveLevel(3);
                      const isApproved = Boolean(cable.approvedBy3);
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (!canSign) {
                              showToast('Access Restricted: Level 3 final approval is reserved to Md Fahad or Admin.', 'warning');
                              setIsLoginModalOpen(true);
                              return;
                            }
                            if (isApproved) {
                              openRevokeModal(cable, 3, 'Md Fahad (Manager PP)');
                            } else {
                              openApprovalModal(cable, 3, 'Md Fahad (Manager PP)');
                            }
                          }}
                          className={`py-1 px-1.5 rounded-lg text-[10px] font-bold text-center transition-all flex items-center justify-center gap-1 truncate ${
                            isApproved
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                              : canSign
                              ? 'border border-dashed border-amber-500/60 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                              : 'bg-slate-950/80 text-slate-600 border border-slate-800'
                          }`}
                          title={isApproved ? `Approved: ${cable.approvedBy3}` : canSign ? 'Click to grant final approval (Md Fahad)' : 'L3: Md Fahad'}
                        >
                          {isApproved ? <ShieldCheck className="w-2.5 h-2.5 text-amber-400 shrink-0" /> : !canSign && <Lock className="w-2 h-2 text-slate-600 shrink-0" />}
                          <span className="truncate">{isApproved ? 'Fahad' : canSign ? '+ Final' : 'L3: —'}</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px] font-mono text-amber-300">{cable.cableType}</span>
                <span className="text-amber-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Inspect &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && pageSize !== -1 && (
        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-3 rounded-2xl text-xs shadow-lg">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl transition-colors font-semibold"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-xl font-bold transition-all ${
                    currentPage === pageNum
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && <span className="text-slate-500 px-1 font-mono">... {totalPages}</span>}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl transition-colors font-semibold"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Approval Confirmation & Staff Note Modal */}
      {approvalDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${approvalDialog.action === 'sign' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {approvalDialog.action === 'sign' ? <ShieldCheck className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {approvalDialog.action === 'sign' ? `Confirm Level ${approvalDialog.level} Sign-off` : `Revoke Level ${approvalDialog.level} Sign-off`}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {approvalDialog.cable.cableTag} • {approvalDialog.signerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApprovalDialog(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {approvalDialog.action === 'sign' ? (
              <div className="space-y-3">
                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cable Laying:</span>
                    <span className="font-semibold text-slate-200">{approvalDialog.cable.cableLayingStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pre-Commissioning:</span>
                    <span className="font-semibold text-slate-200">{approvalDialog.cable.preCommissioningStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Commissioning:</span>
                    <span className="font-semibold text-slate-200">{approvalDialog.cable.commissioningStatus}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {approvalDialog.level === 1
                      ? "Nayem Siddik's Note (Before Approval):"
                      : approvalDialog.level === 2
                      ? "Mossadek Hossain's Note (Before Approval):"
                      : "Md Fahad's Final Approval Note:"}
                  </label>
                  <textarea
                    rows={3}
                    value={approvalNoteInput}
                    onChange={(e) => setApprovalNoteInput(e.target.value)}
                    placeholder={`Enter ${approvalDialog.signerName}'s verification note before signing approval...`}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/40"
                  />
                  <p className="text-[10px] text-slate-400">
                    This note is individually saved for {approvalDialog.signerName} and visible in Inspect Details.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-300 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                Are you sure you want to revoke the Level {approvalDialog.level} signature from <strong className="text-white">{approvalDialog.cable.cableTag}</strong>?
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setApprovalDialog(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all shadow-md ${
                  approvalDialog.action === 'sign'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                }`}
              >
                {approvalDialog.action === 'sign' ? 'Confirm & Sign Approval' : 'Confirm Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
