import { CableEntry, CableLayingStatus, CommissioningStatus, CableStatus } from '../types';

export interface LiveSyncResult {
  success: boolean;
  cables?: CableEntry[];
  error?: string;
  source: 'gviz' | 'apps_script';
  timestamp: string;
}

/**
 * Parse Google Visualization API (gviz) JSON response
 */
export function parseGvizResponse(rawText: string, scheduleType = 'LV Power Cable Schedule'): CableEntry[] {
  // Format is: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
  const startIdx = rawText.indexOf('{');
  const endIdx = rawText.lastIndexOf('}');

  if (startIdx === -1 || endIdx === -1) {
    throw new Error('Invalid Google Visualization response format');
  }

  const jsonStr = rawText.substring(startIdx, endIdx + 1);
  const data = JSON.parse(jsonStr);

  if (!data.table || !data.table.rows) {
    return [];
  }

  const cols = data.table.cols || [];
  const rows = data.table.rows || [];
  const cables: CableEntry[] = [];
  let currentSection = 'A1 - Client PCC';

  // Gather column labels from cols and first few header rows
  const colLabels: string[] = cols.map((col: any) => String(col.label || '').trim().toUpperCase());

  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(8, rows.length); i++) {
    const rowCells = (rows[i].c || []).map((c: any) => (c && c.v !== null && c.v !== undefined ? String(c.v).trim().toUpperCase() : ''));
    if (rowCells.some((val: string) => val.includes('CABLE DESIGNATION') || val.includes('DESIGNATION') || val.includes('CABLE TAG'))) {
      headerRowIndex = i;
      // Merge labels from this row if cols didn't have them
      rowCells.forEach((label: string, idx: number) => {
        if (label && (!colLabels[idx] || colLabels[idx] === '')) {
          colLabels[idx] = label;
        }
      });
      break;
    }
  }

  const dataStartIndex = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;

  // Helper to find column index by keywords
  const findIdx = (keywords: string[]) => {
    return colLabels.findIndex(l => keywords.some(k => l.includes(k)));
  };

  const colIdx = {
    sr: findIdx(['SR. NO', 'SR NO', 'SR#', 'SL']),
    tag: findIdx(['CABLE DESIGNATION', 'DESIGNATION', 'CABLE TAG', 'TAG']),
    fromLoc: findIdx(['FROM LOCATION', 'FROM (LOCATION)']),
    fromEq: findIdx(['FROM EQUIPMENT', 'FROM (INSTRUMENT)', 'FROM INSTRUMENT']),
    toLoc: findIdx(['TO LOCATION', 'TO (LOCATION)']),
    toEq: findIdx(['TO EQUIPMENT', 'TO (INSTRUMENT)', 'TO INSTRUMENT']),
    runs: findIdx(['NO. OF RUNS', 'NO. OF RUN', 'RUNS']),
    size: findIdx(['CABLE SIZE', 'SIZE']),
    type: findIdx(['CABLE TYPE', 'TYPE']),
    desc: findIdx(['DESCRIPTION', 'SCOPE']),
    // Exact 3 Workflow Stages
    layingStatus: findIdx(['CABLE LAYING STATUS', 'LAYING STATUS', 'CABLE LAYING']),
    layingRemarks: findIdx(['CABLE LAYING REMARKS', 'LAYING REMARKS']),
    preStatus: findIdx(['PRE-COMMISSIONING STATUS', 'PRE-COMM STATUS', 'PRE COMMISSIONING']),
    preRemarks: findIdx(['PRE-COMMISSIONING REMARKS', 'PRE-COMM REMARKS']),
    commStatus: findIdx(['COMMISSIONING STATUS', 'COMM STATUS', 'COMMISSIONING']),
    commRemarks: findIdx(['COMMISSIONING REMARKS', 'COMM REMARKS']),
    // Approvers
    naim: findIdx(['NAIM BHAI', 'APPROVE: NAIM']),
    mosaddik: findIdx(['MOSADDIK BHAI', 'APPROVE: MOSADDIK']),
    fahad: findIdx(['FAHAD SIR', 'APPROVE: FAHAD'])
  };

  // Fallbacks if header text wasn't found in cols
  if (colIdx.tag === -1) colIdx.tag = 1;
  if (colIdx.sr === -1) colIdx.sr = 0;
  if (colIdx.fromLoc === -1) colIdx.fromLoc = 2;
  if (colIdx.fromEq === -1) colIdx.fromEq = 3;
  if (colIdx.toLoc === -1) colIdx.toLoc = 4;
  if (colIdx.toEq === -1) colIdx.toEq = 5;
  if (colIdx.runs === -1) colIdx.runs = 6;
  if (colIdx.size === -1) colIdx.size = 7;
  if (colIdx.type === -1) colIdx.type = 8;
  if (colIdx.desc === -1) colIdx.desc = 9;

  for (let i = dataStartIndex; i < rows.length; i++) {
    const c = rows[i].c || [];
    const getVal = (idx: number) => {
      if (idx === -1 || idx >= c.length) return '';
      const cell = c[idx];
      if (!cell || cell.v === null || cell.v === undefined) return '';
      return String(cell.v).trim();
    };

    const sr = getVal(colIdx.sr);
    const tag = getVal(colIdx.tag);

    // Section header detection (e.g. A1, B1, B2...)
    if (sr === 'A1' || sr === 'B1' || sr === 'B2' || sr === 'B3' || sr === 'B4' || sr === 'C1') {
      currentSection = tag ? `${sr} - ${tag}` : sr;
      continue;
    }

    if (!tag || tag.toUpperCase().includes('CABLE DESIGNATION') || tag.toUpperCase() === 'TAG') continue;

    const fromLoc = getVal(colIdx.fromLoc);
    const fromEq = getVal(colIdx.fromEq);
    const toLoc = getVal(colIdx.toLoc);
    const toEq = getVal(colIdx.toEq);
    const runsVal = parseInt(getVal(colIdx.runs) || '1', 10);
    const runs = isNaN(runsVal) ? 1 : runsVal;
    const cableSize = getVal(colIdx.size);
    const cableType = getVal(colIdx.type);
    const desc = getVal(colIdx.desc);

    // Dynamic Phase & Approver resolution
    const rawLaying = getVal(colIdx.layingStatus);
    const layingStatus: CableLayingStatus = rawLaying.includes('Complete') ? 'Complete By VEL' :
                                           rawLaying.includes('Progress') ? 'Progress' : 'Pending';

    const rawPre = getVal(colIdx.preStatus);
    const preCommissioningStatus: CommissioningStatus = rawPre.includes('Complete') ? 'Complete By Bargen' :
                                                        rawPre.includes('Progress') ? 'Progress' : 'Pending';

    const rawComm = getVal(colIdx.commStatus);
    const commissioningStatus: CommissioningStatus = rawComm.includes('Complete') ? 'Complete By Bargen' :
                                                    rawComm.includes('Progress') ? 'Progress' : 'Pending';

    const approvedBy1 = colIdx.naim !== -1 && getVal(colIdx.naim) ? 'Naim Bhai' : undefined;
    const approvedBy2 = colIdx.mosaddik !== -1 && getVal(colIdx.mosaddik) ? 'Mosaddik Bhai' : undefined;
    const approvedBy3 = colIdx.fahad !== -1 && getVal(colIdx.fahad) ? 'Fahad Sir' : undefined;

    cables.push({
      id: `CABLE-LIVE-${i + 1}`,
      scheduleType: scheduleType,
      section: currentSection,
      srNo: sr || String(i + 1),
      cableTag: tag,
      fromLocation: fromLoc,
      fromEquipment: fromEq,
      toLocation: toLoc,
      toEquipment: toEq,
      runs: runs,
      cableSize: cableSize,
      cableType: cableType,
      description: desc,
      voltage: currentSection.includes('24V') ? '24V DC' : '415V AC / LV',
      // Workflow Phases
      cableLayingStatus,
      cableLayingRemarks: getVal(colIdx.layingRemarks),
      preCommissioningStatus,
      preCommissioningRemarks: getVal(colIdx.preRemarks),
      commissioningStatus,
      commissioningRemarks: getVal(colIdx.commRemarks),
      // Approvers
      approvedBy1,
      approvedBy2,
      approvedBy3,
      status: commissioningStatus === 'Complete By Bargen' ? 'Complete By Bargen' : layingStatus,
      updatedAt: new Date().toISOString()
    });
  }

  return cables;
}

/**
 * Fetch live data from Google Sheets in real-time
 * Tries Apps Script Web App first (if configured), then direct gviz API endpoint.
 */
export async function fetchLiveSheetData(
  spreadsheetUrl: string,
  webAppUrl?: string
): Promise<LiveSyncResult> {
  const now = new Date().toLocaleTimeString();

  // 1. If Web App URL is present, use it for zero-CORS authenticated fetch
  if (webAppUrl && webAppUrl.trim()) {
    try {
      const url = new URL(webAppUrl.trim());
      url.searchParams.set('action', 'getCables');
      url.searchParams.set('_t', Date.now().toString());

      const res = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && Array.isArray(json.data.cables) && json.data.cables.length > 0) {
          return {
            success: true,
            cables: json.data.cables,
            source: 'apps_script',
            timestamp: now
          };
        }
      }
    } catch (e: any) {
      console.warn('Apps Script live fetch error, trying direct gviz:', e.message);
    }
  }

  // 2. Direct Google Sheets gviz API fetch
  try {
    const match = spreadsheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = match ? match[1] : '1vGcIIdzGF8PaF1F2iCzwoRZh0WcSLuAKiJxiOTsDDIk';

    const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&tq=&_t=${Date.now()}`;

    const res = await fetch(gvizUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    });

    if (!res.ok) {
      throw new Error(`Google Sheets responded with HTTP ${res.status}`);
    }

    const text = await res.text();
    if (text.includes('<!DOCTYPE html>') || text.includes('ServiceLogin')) {
      throw new Error('Google Sheet is Restricted. In Google Sheet, click Share and set to "Anyone with the link can view", or connect Google Apps Script Web App.');
    }

    const parsedCables = parseGvizResponse(text);
    if (parsedCables.length === 0) {
      throw new Error('Connected to Google Sheet, but no cable data rows were found.');
    }

    return {
      success: true,
      cables: parsedCables,
      source: 'gviz',
      timestamp: now
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      source: 'gviz',
      timestamp: now
    };
  }
}
