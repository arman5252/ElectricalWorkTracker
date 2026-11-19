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
  Upload
} from 'lucide-react';

export const getPillStyle = (status: string) => {
  switch (status) {
    case 'Complete By VEL':
      return 'bg-[#10b981] hover:bg-[#059669] text-white shadow-sm font-bold';
    case 'Complete By Bargen':
      return 'bg-[#047857] hover:bg-[#065f46] text-white shadow-sm font-bold';
    case 'Progress':
      return 'bg-[#dcfce7] hover:bg-[#bbf7d0] text-[#14532d] shadow-sm font-extrabold';
    case 'Scope of Bargen':
      return 'bg-[#0891b2] hover:bg-[#0e7490] text-white shadow-sm font-bold';
    case 'Scope of VEL':
      return 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-sm font-bold';
    case 'Out of Scope':
      return 'bg-[#475569] hover:bg-[#334155] text-slate-100 shadow-sm font-medium';
    case 'N/A':
      return 'bg-[#334155] hover:bg-[#1e293b] text-slate-300 shadow-sm font-medium';
    case 'Pending':
    default:
      return 'bg-[#991b1b] hover:bg-[#7f1d1d] text-white shadow-sm font-bold';
  }
};

export const StatusPill: React.FC<{
  type: 'laying' | 'pre' | 'comm';
  status: string;
  onChange: (newStatus: any) => void;
}> = ({ status, onChange }) => {
  return (
    <div className="relative inline-block whitespace-nowrap shrink-0">
      <select
        value={status}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none cursor-pointer py-1 pl-3 pr-6 rounded-full text-[11px] tracking-tight border border-white/10 focus:outline-none transition-all whitespace-nowrap min-w-[145px] text-center ${getPillStyle(status)}`}
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
      <ChevronDown className={`w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
        status === 'Progress' ? 'text-[#14532d]' : 'text-white/80'
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
    downloadExcelFile,
    lastExcelSaveTime,
    importSpreadsheetData,
    showToast,
    settings
  } = useApp();

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(100);

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
      if (scheduleTypeFilter !== 'All' && !cable.scheduleType.includes(scheduleTypeFilter)) return false;
      if (sectionFilter !== 'All' && cable.section !== sectionFilter) return false;
      if (fromLocationFilter !== 'All' && cable.fromLocation !== fromLocationFilter) return false;
      if (toLocationFilter !== 'All' && cable.toLocation !== toLocationFilter) return false;
      if (cableSizeFilter !== 'All' && cable.cableSize !== cableSizeFilter) return false;
      if (cableTypeFilter !== 'All' && cable.cableType !== cableTypeFilter) return false;

      // 3 Stages Filters
      if (cableLayingFilter !== 'All' && cable.cableLayingStatus !== cableLayingFilter) return false;
      if (preCommissioningFilter !== 'All' && cable.preCommissioningStatus !== preCommissioningFilter) return false;
      if (commissioningFilter !== 'All' && cable.commissioningStatus !== commissioningFilter) return false;
      if (approverFilter !== 'All') {
        if (approverFilter === 'Fahad Sir' && cable.approvedBy3 !== 'Fahad Sir') return false;
        if (approverFilter === 'Mosaddik Bhai' && cable.approvedBy2 !== 'Mosaddik Bhai') return false;
        if (approverFilter === 'Naim Bhai' && cable.approvedBy1 !== 'Naim Bhai') return false;
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
      'CABLE LAYING REMARKS',
      'PRE-COMMISSIONING STATUS',
      'PRE-COMMISSIONING REMARKS',
      'COMMISSIONING STATUS',
      'COMMISSIONING REMARKS',
      'APPROVE BY (LEVEL 1)',
      'APPROVE BY (LEVEL 2)',
      'APPROVE BY (LEVEL 3)'
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
      `"${c.cableLayingRemarks || ''}"`,
      `"${c.preCommissioningStatus}"`,
      `"${c.preCommissioningRemarks || ''}"`,
      `"${c.commissioningStatus}"`,
      `"${c.commissioningRemarks || ''}"`,
      `"${c.approvedBy1 || ''}"`,
      `"${c.approvedBy2 || ''}"`,
      `"${c.approvedBy3 || ''}"`
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
          approvedBy1: r['Approve: Naim Bhai'] || r['Naim Bhai'] ? 'Naim Bhai' : undefined,
          approvedBy2: r['Approve: Mosaddik Bhai'] || r['Mosaddik Bhai'] ? 'Mosaddik Bhai' : undefined,
          approvedBy3: r['Approve: Fahad Sir'] || r['Fahad Sir'] ? 'Fahad Sir' : undefined,
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
      {/* Real-time Google Sheet Connection Notification Banner */}
      {!settings.webAppUrl && (
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-slate-900 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                <span>Google Sheets Two-Way Live Sync is in Standby</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">1-Min Setup</span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                To sync your edits directly into your Google Sheet (<code className="text-amber-300 font-mono">1vGcIIdzGF8PaF1F2iCzwoRZh0WcSLuAKiJxiOTsDDIk</code>), connect your Google Apps Script Web App URL.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const btn = document.getElementById('open-settings-button');
              if (btn) btn.click();
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shrink-0 active:scale-95 shadow-lg shadow-amber-500/20"
          >
            Connect Google Sheet Now
          </button>
        </div>
      )}

      {/* Top Search & Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl space-y-3.5">
        
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
              { id: 'LV Power', label: 'LV Power Cables', count: cables.filter(c => c.scheduleType.includes('LV Power')).length },
              { id: 'Control', label: 'Control Cables', count: cables.filter(c => c.scheduleType.includes('Control')).length }
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

            {/* Direct Excel Download button */}
            <button
              onClick={downloadExcelFile}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-emerald-600/20"
              title="Download live synchronized Excel spreadsheet (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download Excel</span>
            </button>

            {/* Import Excel button */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Import Excel</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportExcel}
                className="hidden"
              />
            </label>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm"
              title="Download CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
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

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
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
                <option value="Fahad Sir">Approved: Fahad Sir</option>
                <option value="Mosaddik Bhai">Verified: Mosaddik Bhai</option>
                <option value="Naim Bhai">Checked: Naim Bhai</option>
              </select>
            </div>
          </div>
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1450px] text-left text-xs text-slate-300 border-collapse table-fixed">
              {/* Top Tier Headers (Matching the navy blue group headers in screenshot) */}
              <thead>
                <tr className="bg-[#0f2444] text-white border-b border-slate-800 text-[11px] font-bold">
                  <th colSpan={4} className="py-2.5 px-3.5 border-r border-slate-800/80">
                    CABLE SPECIFICATION & ROUTING
                  </th>
                  <th colSpan={2} className="py-2.5 px-3.5 text-center bg-[#13325c] border-r border-slate-800/80">
                    Cable Laying
                  </th>
                  <th colSpan={2} className="py-2.5 px-3.5 text-center bg-[#173d70] border-r border-slate-800/80">
                    Pre-Commissioning
                  </th>
                  <th colSpan={2} className="py-2.5 px-3.5 text-center bg-[#13325c] border-r border-slate-800/80">
                    Commissioning
                  </th>
                  <th colSpan={3} className="py-2.5 px-3.5 text-center bg-[#0f2444]">
                    Approve By
                  </th>
                  <th className="py-2.5 px-2 text-center w-12"></th>
                </tr>

                {/* Subheaders */}
                <tr className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 font-bold sticky top-0 z-10 shadow-sm">
                  <th className="py-2.5 px-3 w-12 text-slate-500 text-center">Sr #</th>
                  <th className="py-2.5 px-3 w-44">Cable Designation</th>
                  <th className="py-2.5 px-3 w-48">From (Origin)</th>
                  <th className="py-2.5 px-3 w-48 border-r border-slate-800">To (Destination)</th>
                  
                  {/* Cable Laying subheaders */}
                  <th className="py-2.5 px-3 w-44 text-center bg-slate-950/80">Status</th>
                  <th className="py-2.5 px-3 w-36 border-r border-slate-800 bg-slate-950/80">Remarks</th>

                  {/* Pre-Commissioning subheaders */}
                  <th className="py-2.5 px-3 w-44 text-center bg-slate-950/80">Status</th>
                  <th className="py-2.5 px-3 w-36 border-r border-slate-800 bg-slate-950/80">Remarks</th>

                  {/* Commissioning subheaders */}
                  <th className="py-2.5 px-3 w-44 text-center bg-slate-950/80">Status</th>
                  <th className="py-2.5 px-3 w-36 border-r border-slate-800 bg-slate-950/80">Remarks</th>

                  {/* Approve By subheaders - exact matching the 3 approval persons */}
                  <th className="py-2.5 px-2 w-28 text-center font-bold text-slate-200">Naim Bhai</th>
                  <th className="py-2.5 px-2 w-28 text-center font-bold text-slate-200">Mosaddik Bhai</th>
                  <th className="py-2.5 px-2 w-28 text-center font-bold text-amber-300">Fahad Sir</th>
                  <th className="py-2.5 px-2 w-12 text-center">View</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60 font-sans">
                {paginatedCables.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-16 text-center text-slate-500">
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
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] text-center">
                        {cable.srNo}
                      </td>

                      {/* Cable Tag */}
                      <td className="py-2.5 px-3">
                        <span 
                          onClick={() => setSelectedCable(cable)}
                          className="font-mono font-bold text-amber-300 hover:text-amber-200 cursor-pointer bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-xs inline-block"
                        >
                          {cable.cableTag}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          {cable.cableSize} ({cable.cableType})
                        </div>
                      </td>

                      {/* From */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white truncate text-xs" title={cable.fromEquipment}>
                          {cable.fromEquipment}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate" title={cable.fromLocation}>
                          {cable.fromLocation}
                        </div>
                      </td>

                      {/* To */}
                      <td className="py-2.5 px-3 border-r border-slate-800">
                        <div className="font-semibold text-white truncate text-xs flex items-center gap-1" title={cable.toEquipment}>
                          <ArrowRight className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                          <span className="truncate">{cable.toEquipment}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate pl-3.5" title={cable.toLocation}>
                          {cable.toLocation}
                        </div>
                      </td>

                      {/* Cable Laying Status Pill */}
                      <td className="py-2 px-3 text-center whitespace-nowrap bg-slate-950/30">
                        <StatusPill
                          type="laying"
                          status={cable.cableLayingStatus}
                          onChange={(newStatus) => updateCableLayingStatus(cable.id, newStatus)}
                        />
                      </td>

                      {/* Cable Laying Remarks (Direct Inline Editable) */}
                      <td className="py-1 px-2 border-r border-slate-800 bg-slate-950/30">
                        <input
                          type="text"
                          defaultValue={cable.cableLayingRemarks || ''}
                          key={`${cable.id}-laying-${cable.cableLayingRemarks || ''}`}
                          onBlur={(e) => {
                            if (e.target.value !== (cable.cableLayingRemarks || '')) {
                              updateCable(cable.id, { cableLayingRemarks: e.target.value });
                            }
                          }}
                          placeholder="—"
                          className="w-full bg-transparent hover:bg-slate-800/80 focus:bg-slate-950 border border-transparent focus:border-emerald-500/50 rounded px-1.5 py-1 text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none transition-colors truncate"
                          title="Click to edit Cable Laying remarks"
                        />
                      </td>

                      {/* Pre-Commissioning Status Pill */}
                      <td className="py-2 px-3 text-center whitespace-nowrap bg-slate-950/20">
                        <StatusPill
                          type="pre"
                          status={cable.preCommissioningStatus}
                          onChange={(newStatus) => updatePreCommissioningStatus(cable.id, newStatus)}
                        />
                      </td>

                      {/* Pre-Commissioning Remarks (Direct Inline Editable) */}
                      <td className="py-1 px-2 border-r border-slate-800 bg-slate-950/20">
                        <input
                          type="text"
                          defaultValue={cable.preCommissioningRemarks || ''}
                          key={`${cable.id}-pre-${cable.preCommissioningRemarks || ''}`}
                          onBlur={(e) => {
                            if (e.target.value !== (cable.preCommissioningRemarks || '')) {
                              updateCable(cable.id, { preCommissioningRemarks: e.target.value });
                            }
                          }}
                          placeholder="—"
                          className="w-full bg-transparent hover:bg-slate-800/80 focus:bg-slate-950 border border-transparent focus:border-emerald-500/50 rounded px-1.5 py-1 text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none transition-colors truncate"
                          title="Click to edit Pre-Commissioning remarks"
                        />
                      </td>

                      {/* Commissioning Status Pill */}
                      <td className="py-2 px-3 text-center whitespace-nowrap bg-slate-950/30">
                        <StatusPill
                          type="comm"
                          status={cable.commissioningStatus}
                          onChange={(newStatus) => updateCommissioningStatus(cable.id, newStatus)}
                        />
                      </td>

                      {/* Commissioning Remarks (Direct Inline Editable) */}
                      <td className="py-1 px-2 border-r border-slate-800 bg-slate-950/30">
                        <input
                          type="text"
                          defaultValue={cable.commissioningRemarks || ''}
                          key={`${cable.id}-comm-${cable.commissioningRemarks || ''}`}
                          onBlur={(e) => {
                            if (e.target.value !== (cable.commissioningRemarks || '')) {
                              updateCable(cable.id, { commissioningRemarks: e.target.value });
                            }
                          }}
                          placeholder="—"
                          className="w-full bg-transparent hover:bg-slate-800/80 focus:bg-slate-950 border border-transparent focus:border-emerald-500/50 rounded px-1.5 py-1 text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none transition-colors truncate"
                          title="Click to edit Commissioning remarks"
                        />
                      </td>

                      {/* Approve By: Naim Bhai (1-Click Interactive Toggle) */}
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => updateApprovers(cable.id, 1, cable.approvedBy1 === 'Naim Bhai' ? '' : 'Naim Bhai')}
                          className={`w-full py-1 px-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                            cable.approvedBy1 === 'Naim Bhai'
                              ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                              : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/60'
                          }`}
                          title={cable.approvedBy1 === 'Naim Bhai' ? 'Click to revoke Naim Bhai sign-off' : 'Click to sign as Naim Bhai'}
                        >
                          {cable.approvedBy1 === 'Naim Bhai' ? 'Naim Bhai' : '—'}
                        </button>
                      </td>

                      {/* Approve By: Mosaddik Bhai (1-Click Interactive Toggle) */}
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => updateApprovers(cable.id, 2, cable.approvedBy2 === 'Mosaddik Bhai' ? '' : 'Mosaddik Bhai')}
                          className={`w-full py-1 px-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                            cable.approvedBy2 === 'Mosaddik Bhai'
                              ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                              : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/60'
                          }`}
                          title={cable.approvedBy2 === 'Mosaddik Bhai' ? 'Click to revoke Mosaddik Bhai sign-off' : 'Click to sign as Mosaddik Bhai'}
                        >
                          {cable.approvedBy2 === 'Mosaddik Bhai' ? 'Mosaddik Bhai' : '—'}
                        </button>
                      </td>

                      {/* Approve By: Fahad Sir (1-Click Interactive Toggle) */}
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => updateApprovers(cable.id, 3, cable.approvedBy3 === 'Fahad Sir' ? '' : 'Fahad Sir')}
                          className={`w-full py-1 px-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                            cable.approvedBy3 === 'Fahad Sir'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                              : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/60'
                          }`}
                          title={cable.approvedBy3 === 'Fahad Sir' ? 'Click to revoke Fahad Sir approval' : 'Click to approve as Fahad Sir'}
                        >
                          {cable.approvedBy3 === 'Fahad Sir' ? 'Fahad Sir' : '—'}
                        </button>
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
                      onChange={(newStatus) => updateCableLayingStatus(cable.id, newStatus)}
                    />
                  </div>
                  <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Pre-Commissioning:</span>
                    <StatusPill
                      type="pre"
                      status={cable.preCommissioningStatus}
                      onChange={(newStatus) => updatePreCommissioningStatus(cable.id, newStatus)}
                    />
                  </div>
                  <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Commissioning:</span>
                    <StatusPill
                      type="comm"
                      status={cable.commissioningStatus}
                      onChange={(newStatus) => updateCommissioningStatus(cable.id, newStatus)}
                    />
                  </div>
                </div>

                {/* Approve By Strip */}
                {(cable.approvedBy1 || cable.approvedBy2 || cable.approvedBy3) && (
                  <div className="mt-2.5 pt-2 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Approved by:</span>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                      {cable.approvedBy1 && <span>{cable.approvedBy1}</span>}
                      {cable.approvedBy2 && <span>• {cable.approvedBy2}</span>}
                      {cable.approvedBy3 && <span className="text-amber-400 font-bold">• {cable.approvedBy3}</span>}
                    </div>
                  </div>
                )}
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
    </div>
  );
};
