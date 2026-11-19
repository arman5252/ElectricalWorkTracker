import * as XLSX from 'xlsx';
import { CableEntry, CableLayingStatus, CommissioningStatus } from '../types';
import { normalizeStatus } from './pdfParserService';

export interface ParsedSheetData {
  sheetName: string;
  totalRows: number;
  headers: string[];
  cables: CableEntry[];
  rawRows: any[];
}

/**
 * Reads an Excel file (.xlsx, .xls, .csv) and returns list of sheet names
 */
export async function readExcelSheets(file: File): Promise<{ workbook: XLSX.WorkBook; sheetNames: string[] }> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  return {
    workbook,
    sheetNames: workbook.SheetNames
  };
}

/**
 * Finds value in row object matching any of candidate keys (case-insensitive & trimmed)
 */
function findRowValue(row: any, candidates: string[]): any {
  const rowKeys = Object.keys(row);
  for (const candidate of candidates) {
    const candNorm = candidate.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const key of rowKeys) {
      const keyNorm = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (keyNorm === candNorm) {
        return row[key];
      }
    }
  }
  return undefined;
}

/**
 * Parses a selected sheet in the workbook into typed CableEntry objects
 */
export function parseSheetToCables(workbook: XLSX.WorkBook, sheetName: string): ParsedSheetData {
  const ws = workbook.Sheets[sheetName];
  if (!ws) {
    return { sheetName, totalRows: 0, headers: [], cables: [], rawRows: [] };
  }

  const rawRows = XLSX.utils.sheet_to_json(ws) as any[];
  if (!rawRows || rawRows.length === 0) {
    return { sheetName, totalRows: 0, headers: [], cables: [], rawRows: [] };
  }

  const headers = Object.keys(rawRows[0] || {});
  const isControlSchedule = sheetName.toLowerCase().includes('control');
  const defaultScheduleType = isControlSchedule ? 'Control Cable Schedule' : 'LV Power Cable Schedule';

  const cables: CableEntry[] = rawRows.map((r, idx) => {
    const rawTag = findRowValue(r, [
      'cable designation', 
      'cable tag', 
      'tag', 
      'cable no', 
      'cable designation*', 
      'cable code',
      'designation'
    ]);
    const cableTag = rawTag ? String(rawTag).trim() : `CBL-ROW-${idx + 1}`;

    const srNo = String(findRowValue(r, ['sr. no.', 'sr no', 'sl no', 'no', 'serial']) || (idx + 1));
    const section = String(findRowValue(r, ['section', 'area', 'zone', 'system']) || 'General');
    const scheduleType = String(findRowValue(r, ['schedule type', 'schedule', 'type of schedule']) || defaultScheduleType);

    const fromLocation = String(findRowValue(r, ['from location', 'from (location)', 'from', 'source location']) || '');
    const fromEquipment = String(findRowValue(r, ['from equipment / panel', 'from equipment', 'from panel', 'source equipment']) || '');
    const toLocation = String(findRowValue(r, ['to location', 'to (location)', 'to', 'destination location']) || '');
    const toEquipment = String(findRowValue(r, ['to equipment / panel', 'to equipment', 'to panel', 'destination equipment']) || '');

    const rawRuns = findRowValue(r, ['no. of runs', 'no of runs', 'runs', 'run']);
    const runs = Number(rawRuns) > 0 ? Number(rawRuns) : 1;

    const cableSize = String(findRowValue(r, ['cable size', 'size', 'conductor size', 'sq mm']) || '');
    const cableType = String(findRowValue(r, ['cable type', 'type', 'specification', 'spec']) || 'Cu/XLPE/SWA/PVC');
    const description = String(findRowValue(r, ['description / scope', 'description', 'scope', 'work scope']) || '');
    const voltage = String(findRowValue(r, ['voltage', 'volts', 'voltage grade', 'level']) || (isControlSchedule ? 'Control / 110V' : '415V'));

    const rawLaying = findRowValue(r, ['cable laying status', 'cable laying', 'laying status', 'laying']);
    const cableLayingStatus = normalizeStatus(String(rawLaying || 'Pending'));
    const cableLayingRemarks = String(findRowValue(r, ['cable laying remarks', 'laying remarks', 'laying notes']) || '');

    const rawPreComm = findRowValue(r, ['pre-commissioning status', 'pre commissioning status', 'pre-comm', 'pre commissioning']);
    const preCommissioningStatus = normalizeStatus(String(rawPreComm || 'Pending'));
    const preCommissioningRemarks = String(findRowValue(r, ['pre-commissioning remarks', 'pre commissioning remarks', 'pre-comm remarks']) || '');

    const rawComm = findRowValue(r, ['commissioning status', 'commissioning', 'comm status', 'comm']);
    const commissioningStatus = normalizeStatus(String(rawComm || 'Pending'));
    const commissioningRemarks = String(findRowValue(r, ['commissioning remarks', 'comm remarks']) || '');

    const approvedBy1 = findRowValue(r, ['approve: nayem siddik (sr. engr)', 'approved by 1', 'approver 1', 'nayem']);
    const approvedBy2 = findRowValue(r, ['approve: mossadek hossain (sr. engr)', 'approved by 2', 'approver 2', 'mossadek']);
    const approvedBy3 = findRowValue(r, ['approve: md fahad (manager pp)', 'approved by 3', 'approver 3', 'fahad']);

    const notes = String(findRowValue(r, ['notes', 'remarks', 'comments', 'field notes']) || '');

    // Construct persistent unique ID
    const prefix = isControlSchedule ? 'CTRL' : 'LV';
    const id = `${prefix}-${cableTag.replace(/[^a-zA-Z0-9_-]/g, '')}-${idx + 1}`;

    return {
      id,
      srNo,
      cableTag,
      scheduleType,
      section,
      fromLocation,
      fromEquipment,
      toLocation,
      toEquipment,
      runs,
      cableSize,
      cableType,
      description,
      voltage,
      status: 'Installed',
      cableLayingStatus,
      cableLayingRemarks,
      preCommissioningStatus,
      preCommissioningRemarks,
      commissioningStatus,
      commissioningRemarks,
      approvedBy1: approvedBy1 ? String(approvedBy1).trim() : undefined,
      approvedBy2: approvedBy2 ? String(approvedBy2).trim() : undefined,
      approvedBy3: approvedBy3 ? String(approvedBy3).trim() : undefined,
      notes,
      updatedAt: new Date().toISOString()
    };
  });

  return {
    sheetName,
    totalRows: cables.length,
    headers,
    cables,
    rawRows
  };
}
