import { CableEntry, CableStatus } from '../types';

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

  const rows = data.table.rows;
  const cables: CableEntry[] = [];
  let currentSection = 'A1 - Client PCC';

  // Find header row or start from row 4
  let dataStartIndex = 0;
  for (let i = 0; i < Math.min(6, rows.length); i++) {
    const rowCells = (rows[i].c || []).map((c: any) => (c && c.v !== null && c.v !== undefined ? String(c.v) : ''));
    if (rowCells.some((val: string) => val.toUpperCase().includes('CABLE DESIGNATION') || val.toUpperCase().includes('DESIGNATION'))) {
      dataStartIndex = i + 1;
      break;
    }
  }

  for (let i = dataStartIndex; i < rows.length; i++) {
    const c = rows[i].c || [];
    const getVal = (idx: number) => {
      const cell = c[idx];
      if (!cell || cell.v === null || cell.v === undefined) return '';
      return String(cell.v).trim();
    };

    const sr = getVal(0);
    const tag = getVal(1);

    // Section header detection (e.g. A1, B1, B2...)
    if (sr === 'A1' || sr === 'B1' || sr === 'B2' || sr === 'B3' || sr === 'B4' || sr === 'C1') {
      currentSection = tag ? `${sr} - ${tag}` : sr;
      continue;
    }

    if (!tag || tag.toUpperCase() === 'CABLE DESIGNATION') continue;

    const fromLoc = getVal(2);
    const fromEq = getVal(3);
    const toLoc = getVal(4);
    const toEq = getVal(5);
    const runsVal = parseInt(getVal(6) || '1', 10);
    const runs = isNaN(runsVal) ? 1 : runsVal;
    const cableSize = getVal(7);
    const cableType = getVal(8);
    const desc = getVal(9);
    const statusVal = (getVal(10) || 'Installed') as CableStatus;

    cables.push({
      id: `CABLE-LIVE-${i + 1}`,
      scheduleType: scheduleType,
      section: currentSection,
      srNo: sr,
      cableTag: tag,
      fromLocation: fromLoc,
      fromEquipment: fromEq,
      toLocation: toLoc,
      toEquipment: toEq,
      runs: runs,
      cableSize: cableSize,
      cableType: cableType,
      description: desc,
      status: ['Pending', 'Pulled', 'Terminated', 'Tested', 'Installed'].includes(statusVal) ? statusVal : 'Installed',
      voltage: currentSection.includes('24V') ? '24V DC' : '415V AC / LV'
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
      url.searchParams.set('_t', Date.now().toString()); // prevent caching

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
    // Extract Sheet ID
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
    // If Google redirected to login HTML
    if (text.includes('<!DOCTYPE html>') || text.includes('ServiceLogin')) {
      throw new Error('Google Sheet requires sharing permissions: Set "Anyone with the link can view", or connect Google Apps Script Web App.');
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
