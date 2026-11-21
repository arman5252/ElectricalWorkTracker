import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  Edit3, 
  PlusCircle, 
  Check, 
  AlertCircle, 
  Database, 
  Layers, 
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Trash2,
  FileCheck2,
  Table
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CableEntry, CableLayingStatus, CommissioningStatus } from '../types';
import { readExcelSheets, parseSheetToCables, ParsedSheetData } from '../services/excelParserService';
import { extractTextFromPdf, parsePdfLinesToCables, ExtractedPdfRow } from '../services/pdfParserService';
import { parsePastedTextToCables } from '../services/manualParserService';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS: CableLayingStatus[] = [
  'Pending',
  'progress',
  'VEL',
  'Bargen',
  'Scope of Bargen',
  'Out of Scope',
  'N/A'
];

export const DataImportModal: React.FC<DataImportModalProps> = ({ isOpen, onClose }) => {
  const { addSingleCable, bulkImportCables, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'excel' | 'pdf' | 'manual'>('excel');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [syncWithSupabase, setSyncWithSupabase] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Excel State ---
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbookRef, setWorkbookRef] = useState<any>(null);
  const [parsedExcel, setParsedExcel] = useState<ParsedSheetData | null>(null);

  // --- PDF State ---
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfProgress, setPdfProgress] = useState<number>(0);
  const [pdfExtractedCables, setPdfExtractedCables] = useState<ExtractedPdfRow[]>([]);
  const [pdfRawLines, setPdfRawLines] = useState<string[]>([]);

  // --- Manual Entry State ---
  const [manualMode, setManualMode] = useState<'single' | 'bulk'>('single');

  // Single form fields
  const [singleTag, setSingleTag] = useState('');
  const [singleScheduleType, setSingleScheduleType] = useState('LV Power Cable Schedule');
  const [singleSection, setSingleSection] = useState('Engine Hall');
  const [singleFromLocation, setSingleFromLocation] = useState('');
  const [singleFromEquipment, setSingleFromEquipment] = useState('');
  const [singleToLocation, setSingleToLocation] = useState('');
  const [singleToEquipment, setSingleToEquipment] = useState('');
  const [singleRuns, setSingleRuns] = useState(1);
  const [singleSize, setSingleSize] = useState('4Cx240 mm²');
  const [singleType, setSingleType] = useState('Cu/XLPE/SWA/PVC');
  const [singleVoltage, setSingleVoltage] = useState('415V');
  const [singleDescription, setSingleDescription] = useState('');
  const [singleLaying, setSingleLaying] = useState<CableLayingStatus>('Pending');
  const [singlePreComm, setSinglePreComm] = useState<CommissioningStatus>('Pending');
  const [singleComm, setSingleComm] = useState<CommissioningStatus>('Pending');
  const [singleRemarks, setSingleRemarks] = useState('');

  // Bulk paste field
  const [pastedText, setPastedText] = useState('');
  const [parsedPastedCables, setParsedPastedCables] = useState<CableEntry[]>([]);

  const excelInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // --- Excel Handlers ---
  const handleExcelFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setExcelFile(file);
      const { workbook, sheetNames: names } = await readExcelSheets(file);
      setWorkbookRef(workbook);
      setSheetNames(names);
      const defaultSheet = names[0] || '';
      setSelectedSheet(defaultSheet);

      if (defaultSheet) {
        const parsed = parseSheetToCables(workbook, defaultSheet);
        setParsedExcel(parsed);
      }
      showToast(`Loaded "${file.name}" with ${names.length} sheet(s)`, 'success');
    } catch (err: any) {
      showToast(`Excel read failed: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSheetChange = (sheet: string) => {
    setSelectedSheet(sheet);
    if (workbookRef && sheet) {
      const parsed = parseSheetToCables(workbookRef, sheet);
      setParsedExcel(parsed);
    }
  };

  const handleConfirmExcelImport = async () => {
    if (!parsedExcel || parsedExcel.cables.length === 0) {
      showToast('No cables to import from this sheet', 'warning');
      return;
    }
    setIsProcessing(true);
    await bulkImportCables(parsedExcel.cables, importMode, syncWithSupabase);
    setIsProcessing(false);
    onClose();
  };

  // --- PDF Handlers ---
  const handlePdfFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setPdfFile(file);
      setPdfProgress(10);

      const lines = await extractTextFromPdf(file, pct => {
        setPdfProgress(pct);
      });
      setPdfRawLines(lines);

      const cables = parsePdfLinesToCables(lines);
      setPdfExtractedCables(cables);

      if (cables.length > 0) {
        showToast(`Extracted ${cables.length} cables from "${file.name}"!`, 'success');
      } else {
        showToast(`Read ${lines.length} lines from PDF. No standardized cable tags detected automatically.`, 'info');
      }
    } catch (err: any) {
      showToast(`PDF parsing failed: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPdfImport = async () => {
    if (pdfExtractedCables.length === 0) {
      showToast('No parsed PDF cables to import', 'warning');
      return;
    }
    const converted: CableEntry[] = pdfExtractedCables.map((c, idx) => ({
      id: `PDF-${c.cableTag.replace(/[^a-zA-Z0-9_-]/g, '')}-${idx + 1}-${Date.now().toString(36)}`,
      srNo: c.srNo || String(idx + 1),
      cableTag: c.cableTag,
      scheduleType: c.scheduleType || 'LV Power Cable Schedule',
      section: c.section || 'General',
      fromLocation: c.fromLocation || '',
      fromEquipment: c.fromEquipment || '',
      toLocation: c.toLocation || '',
      toEquipment: c.toEquipment || '',
      runs: c.runs || 1,
      cableSize: c.cableSize || 'Standard',
      cableType: c.cableType || 'Cu/XLPE/SWA/PVC',
      description: c.description || `Extracted from ${pdfFile?.name || 'PDF'}`,
      voltage: c.voltage || '415V',
      status: 'Installed',
      cableLayingStatus: c.cableLayingStatus || 'Pending',
      cableLayingRemarks: c.remarks || '',
      preCommissioningStatus: c.preCommissioningStatus || 'Pending',
      preCommissioningRemarks: '',
      commissioningStatus: c.commissioningStatus || 'Pending',
      commissioningRemarks: '',
      updatedAt: new Date().toISOString()
    }));

    setIsProcessing(true);
    await bulkImportCables(converted, importMode, syncWithSupabase);
    setIsProcessing(false);
    onClose();
  };

  // --- Manual Handlers ---
  const handleAddSingleCable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleTag.trim()) {
      showToast('Please enter a Cable Tag (e.g. LV-099 or CTRL-207)', 'warning');
      return;
    }

    const newCable: CableEntry = {
      id: `MANUAL-${singleTag.trim().replace(/[^a-zA-Z0-9_-]/g, '')}-${Date.now().toString(36)}`,
      srNo: String(Date.now().toString().slice(-4)),
      cableTag: singleTag.trim(),
      scheduleType: singleScheduleType,
      section: singleSection,
      fromLocation: singleFromLocation,
      fromEquipment: singleFromEquipment,
      toLocation: singleToLocation,
      toEquipment: singleToEquipment,
      runs: Number(singleRuns) || 1,
      cableSize: singleSize,
      cableType: singleType,
      description: singleDescription || `Manually entered cable ${singleTag.trim()}`,
      voltage: singleVoltage,
      status: 'Installed',
      cableLayingStatus: singleLaying,
      cableLayingRemarks: singleRemarks,
      preCommissioningStatus: singlePreComm,
      preCommissioningRemarks: '',
      commissioningStatus: singleComm,
      commissioningRemarks: '',
      updatedAt: new Date().toISOString()
    };

    setIsProcessing(true);
    const ok = await addSingleCable(newCable, syncWithSupabase);
    setIsProcessing(false);

    if (ok) {
      setSingleTag('');
      setSingleFromLocation('');
      setSingleFromEquipment('');
      setSingleToLocation('');
      setSingleToEquipment('');
      setSingleRemarks('');
      onClose();
    }
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      showToast('Please paste tab or comma separated text first', 'warning');
      return;
    }
    const parsed = parsePastedTextToCables(pastedText);
    setParsedPastedCables(parsed);
    if (parsed.length > 0) {
      showToast(`Parsed ${parsed.length} cables from pasted text!`, 'success');
    } else {
      showToast('Could not identify cable rows in pasted text.', 'warning');
    }
  };

  const handleConfirmPastedImport = async () => {
    if (parsedPastedCables.length === 0) {
      showToast('No cables to import', 'warning');
      return;
    }
    setIsProcessing(true);
    await bulkImportCables(parsedPastedCables, importMode, syncWithSupabase);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="glass-card rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl relative my-6 text-xs max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Data Import & Manual Input Center
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Admin
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Import data from Excel, parse PDF documents, or add cables manually
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-2 mt-4 p-1 bg-slate-950 border border-slate-800 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('excel')}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'excel'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span className="hidden sm:inline">Excel / CSV File</span>
            <span className="sm:hidden">Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'pdf'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-rose-300" />
            <span className="hidden sm:inline">PDF Document</span>
            <span className="sm:hidden">PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'manual'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">Manual Input</span>
            <span className="sm:hidden">Manual</span>
          </button>
        </div>

        {/* Global Import Config (Append vs Replace & Supabase sync) */}
        <div className="mt-3.5 px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              Mode:
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="radio"
                name="importMode"
                value="append"
                checked={importMode === 'append'}
                onChange={() => setImportMode('append')}
                className="text-amber-500 focus:ring-0"
              />
              <span>Merge & Update Existing</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-rose-400">
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="text-rose-500 focus:ring-0"
              />
              <span>Replace All</span>
            </label>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-emerald-400 font-semibold">
            <input
              type="checkbox"
              checked={syncWithSupabase}
              onChange={e => setSyncWithSupabase(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Save directly to Supabase Cloud DB</span>
          </label>
        </div>

        {/* Tab Body - Scrollable */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
          
          {/* ================================================================= */}
          {/* TAB 1: EXCEL / CSV IMPORT                                         */}
          {/* ================================================================= */}
          {activeTab === 'excel' && (
            <div className="space-y-4">
              {/* File Dropzone */}
              <div 
                onClick={() => excelInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 rounded-2xl p-6 bg-slate-950/60 hover:bg-slate-950 text-center cursor-pointer transition-all group"
              >
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelFileSelect}
                  className="hidden"
                />
                <FileSpreadsheet className="w-10 h-10 text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-slate-200 text-sm">
                  {excelFile ? excelFile.name : 'Click to Upload Excel (.xlsx, .xls) or CSV File'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports multi-sheet engineering workbooks, automatic header detection, and status mapping
                </p>
              </div>

              {/* Sheet Selector & Stats */}
              {excelFile && sheetNames.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300 text-[11px]">Select Sheet:</span>
                    <select
                      value={selectedSheet}
                      onChange={e => handleSheetChange(e.target.value)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 font-semibold text-xs focus:outline-none focus:border-emerald-400"
                    >
                      {sheetNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>

                  {parsedExcel && (
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {parsedExcel.cables.length} rows detected
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Data Preview Table */}
              {parsedExcel && parsedExcel.cables.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5 text-emerald-400" />
                      Parsed Preview (Showing first 6 of {parsedExcel.cables.length} cables)
                    </span>
                  </div>

                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                          <tr>
                            <th className="px-3 py-2">Tag</th>
                            <th className="px-3 py-2">From Location</th>
                            <th className="px-3 py-2">To Equipment</th>
                            <th className="px-3 py-2">Size</th>
                            <th className="px-3 py-2">Voltage</th>
                            <th className="px-3 py-2">Laying</th>
                            <th className="px-3 py-2">Pre-Comm</th>
                            <th className="px-3 py-2">Comm</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                          {parsedExcel.cables.slice(0, 6).map((c, i) => (
                            <tr key={i} className="hover:bg-slate-900/50">
                              <td className="px-3 py-1.5 font-bold text-amber-300">{c.cableTag}</td>
                              <td className="px-3 py-1.5 font-sans truncate max-w-[120px]">{c.fromLocation || '-'}</td>
                              <td className="px-3 py-1.5 font-sans truncate max-w-[120px]">{c.toEquipment || '-'}</td>
                              <td className="px-3 py-1.5">{c.cableSize || '-'}</td>
                              <td className="px-3 py-1.5 text-slate-400">{c.voltage}</td>
                              <td className="px-3 py-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-amber-300">
                                  {c.cableLayingStatus}
                                </span>
                              </td>
                              <td className="px-3 py-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-sky-300">
                                  {c.preCommissioningStatus}
                                </span>
                              </td>
                              <td className="px-3 py-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-emerald-300">
                                  {c.commissioningStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleConfirmExcelImport}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isProcessing ? 'Importing...' : `Import ${parsedExcel.cables.length} Cables`}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: PDF DOCUMENT PARSER                                        */}
          {/* ================================================================= */}
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              <div 
                onClick={() => pdfInputRef.current?.click()}
                className="border-2 border-dashed border-rose-500/40 hover:border-rose-400 rounded-2xl p-6 bg-slate-950/60 hover:bg-slate-950 text-center cursor-pointer transition-all group"
              >
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfFileSelect}
                  className="hidden"
                />
                <FileText className="w-10 h-10 text-rose-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-slate-200 text-sm">
                  {pdfFile ? pdfFile.name : 'Click to Upload PDF Cable Schedule or Drawing'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Extracts text page-by-page, detects engineering cable designations, voltage levels, routes & sizes
                </p>
              </div>

              {/* Progress */}
              {isProcessing && pdfProgress > 0 && (
                <div className="space-y-1 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>Extracting PDF text streams...</span>
                    <span>{pdfProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${pdfProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Extracted Cables Preview */}
              {pdfExtractedCables.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-rose-400" />
                      Extracted Cables ({pdfExtractedCables.length} detected)
                    </span>
                  </div>

                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800 sticky top-0">
                          <tr>
                            <th className="px-3 py-2">Tag</th>
                            <th className="px-3 py-2">Route</th>
                            <th className="px-3 py-2">Size</th>
                            <th className="px-3 py-2">Voltage</th>
                            <th className="px-3 py-2">Laying</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                          {pdfExtractedCables.map((c, i) => (
                            <tr key={i} className="hover:bg-slate-900/50">
                              <td className="px-3 py-1.5 font-bold text-amber-300">{c.cableTag}</td>
                              <td className="px-3 py-1.5 font-sans truncate max-w-[150px]">
                                {c.fromLocation} → {c.toLocation}
                              </td>
                              <td className="px-3 py-1.5">{c.cableSize}</td>
                              <td className="px-3 py-1.5 text-slate-400">{c.voltage}</td>
                              <td className="px-3 py-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-amber-300">
                                  {c.cableLayingStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleConfirmPdfImport}
                      className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-extrabold rounded-xl shadow-lg shadow-rose-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isProcessing ? 'Importing...' : `Import ${pdfExtractedCables.length} Cables from PDF`}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: MANUAL ENTRY & BULK PASTE                                  */}
          {/* ================================================================= */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              {/* Sub-mode selector */}
              <div className="flex gap-2 border-b border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setManualMode('single')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    manualMode === 'single'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Add Single Cable
                </button>
                <button
                  type="button"
                  onClick={() => setManualMode('bulk')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    manualMode === 'bulk'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bulk Text / Table Paste
                </button>
              </div>

              {/* Single Cable Form */}
              {manualMode === 'single' && (
                <form onSubmit={handleAddSingleCable} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Cable Tag / Designation *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. LV-099 or CTRL-207"
                        value={singleTag}
                        onChange={e => setSingleTag(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Schedule Type
                      </label>
                      <select
                        value={singleScheduleType}
                        onChange={e => setSingleScheduleType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                      >
                        <option value="LV Power Cable Schedule">LV Power Cable Schedule</option>
                        <option value="Control Cable Schedule">Control Cable Schedule</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Section / Plant Area
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Engine Hall, Switchgear"
                        value={singleSection}
                        onChange={e => setSingleSection(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Route: From & To */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                    <div className="space-y-2">
                      <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">
                        From Source
                      </span>
                      <input
                        type="text"
                        placeholder="From Location (e.g. Station 01)"
                        value={singleFromLocation}
                        onChange={e => setSingleFromLocation(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                      />
                      <input
                        type="text"
                        placeholder="From Equipment / Panel"
                        value={singleFromEquipment}
                        onChange={e => setSingleFromEquipment(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">
                        To Destination
                      </span>
                      <input
                        type="text"
                        placeholder="To Location (e.g. Control Room)"
                        value={singleToLocation}
                        onChange={e => setSingleToLocation(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                      />
                      <input
                        type="text"
                        placeholder="To Equipment / Panel"
                        value={singleToEquipment}
                        onChange={e => setSingleToEquipment(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Physical Specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Cable Size</label>
                      <input
                        type="text"
                        placeholder="e.g. 4Cx240 mm²"
                        value={singleSize}
                        onChange={e => setSingleSize(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">No. of Runs</label>
                      <input
                        type="number"
                        min="1"
                        value={singleRuns}
                        onChange={e => setSingleRuns(Number(e.target.value) || 1)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Voltage</label>
                      <input
                        type="text"
                        placeholder="e.g. 415V"
                        value={singleVoltage}
                        onChange={e => setSingleVoltage(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Cable Type</label>
                      <input
                        type="text"
                        placeholder="e.g. Cu/XLPE/SWA/PVC"
                        value={singleType}
                        onChange={e => setSingleType(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* 3 Status Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                    <div>
                      <label className="block text-amber-300 font-semibold mb-1">Cable Laying Status</label>
                      <select
                        value={singleLaying}
                        onChange={e => setSingleLaying(e.target.value as CableLayingStatus)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sky-300 font-semibold mb-1">Pre-Commissioning</label>
                      <select
                        value={singlePreComm}
                        onChange={e => setSinglePreComm(e.target.value as CommissioningStatus)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-emerald-300 font-semibold mb-1">Commissioning</label>
                      <select
                        value={singleComm}
                        onChange={e => setSingleComm(e.target.value as CommissioningStatus)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Remarks / Scope Notes</label>
                    <input
                      type="text"
                      placeholder="Optional remarks..."
                      value={singleRemarks}
                      onChange={e => setSingleRemarks(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{isProcessing ? 'Saving...' : 'Add Cable to Schedule'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Bulk Text Paste */}
              {manualMode === 'bulk' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-200">Paste tabular data directly from Excel, Notepad, or Email:</p>
                    <p className="font-mono text-[10px] text-amber-300/80">
                      Format: CableTag [TAB] FromLocation [TAB] FromEquipment [TAB] ToLocation [TAB] Size [TAB] Status...
                    </p>
                  </div>

                  <textarea
                    rows={6}
                    placeholder="LV-101&#9;Generator Hall&#9;Panel MDP&#9;Cooling Tower&#9;4Cx185&#9;Pending&#10;LV-102&#9;Substation&#9;Transformer TR1&#9;Main Busbar&#9;3Cx240&#9;progress"
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-400"
                  />

                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={handleParsePastedText}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 rounded-xl font-bold flex items-center gap-1.5 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Parse Text</span>
                    </button>

                    {parsedPastedCables.length > 0 && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleConfirmPastedImport}
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isProcessing ? 'Importing...' : `Import ${parsedPastedCables.length} Cables`}</span>
                      </button>
                    )}
                  </div>

                  {parsedPastedCables.length > 0 && (
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 mt-3">
                      <div className="p-2 bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-300">
                        Parsed Cables ({parsedPastedCables.length})
                      </div>
                      <div className="max-h-40 overflow-y-auto divide-y divide-slate-800 p-2 text-[11px] font-mono text-slate-300">
                        {parsedPastedCables.map((c, i) => (
                          <div key={i} className="py-1 flex items-center justify-between">
                            <span className="font-bold text-amber-300">{c.cableTag}</span>
                            <span className="text-slate-400">{c.fromLocation} → {c.toLocation}</span>
                            <span className="text-emerald-400">{c.cableSize}</span>
                            <span className="text-slate-500">{c.cableLayingStatus}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
