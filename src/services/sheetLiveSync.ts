import { CableEntry, CableLayingStatus, CommissioningStatus } from '../types';

export interface LiveSyncResult {
  success: boolean;
  cables?: CableEntry[];
  error?: string;
  source: 'gviz' | 'apps_script';
  timestamp: string;
}

function normalizeStatus(val: string): CableLayingStatus {
  const v = String(val || '').trim();
  const up = v.toUpperCase();
  if (!v || up === 'STATUS' || up === 'PENDING') return 'Pending';
  if (up.includes('COMPLETE BY VEL')) return 'Complete By VEL';
  if (up.includes('COMPLETE BY BARGEN') || up.includes('COMPLETE BY BERGEN')) return 'Complete By Bargen';
  if (up.includes('SCOPE OF BARGEN') || up.includes('SCOPE OF BERGEN')) return 'Scope of Bargen';
  if (up.includes('SCOPE OF VEL')) return 'Scope of VEL';
  if (up.includes('OUT OF SCOPE') || up.includes('OUT SCOPE')) return 'Out of Scope';
  if (up === 'N/A' || up === 'NA' || up === 'NOT APPLICABLE') return 'N/A';
  if (up.includes('PROGRESS')) return 'Progress';
  if (up.includes('VEL')) return 'Complete By VEL';
  if (up.includes('BARGEN') || up.includes('BERGEN')) return 'Complete By Bargen';
  return 'Pending';
}

function cleanRemarks(val: string): string {
  const v = String(val || '').trim();
  if (v.toUpperCase() === 'REMARKS' || v === 'null' || v === 'undefined') return '';
  return v;
}

/**
 * Fetch and parse both sheets (LV Power and Control Cables) from Google Sheet
 */
export async function fetchLiveSheetData(
  spreadsheetUrl: string,
  webAppUrl?: string
): Promise<LiveSyncResult> {
  const now = new Date().toLocaleTimeString();

  // 1. Primary Live Read: Direct Google Sheets gviz API (reads ALL 457 cables across both LV Power and Control tabs)
  try {
    const match = spreadsheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = match ? match[1] : '1vGcIIdzGF8PaF1F2iCzwoRZh0WcSLuAKiJxiOTsDDIk';
    const baseUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&_t=${Date.now()}`;

    const allCables: CableEntry[] = [];

    // --- SHEET 1: LV Power Cable Schedule ---
    try {
      const resLV = await fetch(`${baseUrl}&sheet=${encodeURIComponent('LV Power Cable Schedule')}`);
      if (resLV.ok) {
        const textLV = await resLV.text();
        if (!textLV.includes('<!DOCTYPE html>') && textLV.includes('status":"ok"')) {
          const s = textLV.indexOf('{');
          const e = textLV.lastIndexOf('}');
          const dataLV = JSON.parse(textLV.substring(s, e + 1));
          const rows = dataLV.table?.rows || [];
          let currentSection = 'A1 - Client PCC';

          rows.forEach((r: any, idx: number) => {
            const c = r.c || [];
            const getV = (i: number) => (c[i] && c[i].v !== null && c[i].v !== undefined) ? String(c[i].v).trim() : '';
            const sr = getV(0);
            const tag = getV(1);

            if (['A1', 'B1', 'B2', 'B3', 'B4', 'C1'].includes(sr)) {
              currentSection = tag ? `${sr} - ${tag}` : sr;
              return;
            }
            if (!tag || tag.toUpperCase().includes('CABLE DESIGNATION') || tag.toUpperCase() === 'TAG') return;

            const layingRaw = getV(10);
            const preRaw = getV(12);
            const commRaw = getV(14);
            const approveRaw = getV(16);

            allCables.push({
              id: `LV-${idx + 1}`,
              scheduleType: 'LV Power Cable Schedule',
              section: currentSection,
              srNo: sr || String(idx + 1),
              cableTag: tag,
              fromLocation: getV(2),
              fromEquipment: getV(3),
              toLocation: getV(4),
              toEquipment: getV(5),
              runs: parseInt(getV(6) || '1', 10) || 1,
              cableSize: getV(7),
              cableType: getV(8),
              description: getV(9),
              cableLayingStatus: normalizeStatus(layingRaw),
              cableLayingRemarks: cleanRemarks(getV(11)),
              preCommissioningStatus: normalizeStatus(preRaw),
              preCommissioningRemarks: cleanRemarks(getV(13)),
              commissioningStatus: normalizeStatus(commRaw),
              commissioningRemarks: cleanRemarks(getV(15)),
              approvedBy1: (approveRaw.includes('Naim') || approveRaw.includes('Nayem')) ? 'Nayem Siddik (Sr. Engr)' : undefined,
              approvedBy2: (approveRaw.includes('Mosaddik') || approveRaw.includes('Mossadek')) ? 'Mossadek Hossain (Sr. Engr)' : undefined,
              approvedBy3: approveRaw.includes('Fahad') ? 'Md Fahad (Manager PP)' : undefined,
              voltage: currentSection.includes('24V') ? '24V DC' : '415V AC / LV',
              status: normalizeStatus(commRaw),
              updatedAt: new Date().toISOString()
            });
          });
        }
      }
    } catch (e: any) {
      console.warn('LV Sheet gviz fetch notice:', e.message);
    }

    // --- SHEET 2: Control Cable Schedule ---
    try {
      const resCtrl = await fetch(`${baseUrl}&sheet=${encodeURIComponent('Control Cable Schedule')}`);
      if (resCtrl.ok) {
        const textCtrl = await resCtrl.text();
        if (!textCtrl.includes('<!DOCTYPE html>') && textCtrl.includes('status":"ok"')) {
          const s = textCtrl.indexOf('{');
          const e = textCtrl.lastIndexOf('}');
          const dataCtrl = JSON.parse(textCtrl.substring(s, e + 1));
          const rows = dataCtrl.table?.rows || [];

          rows.forEach((r: any, idx: number) => {
            const c = r.c || [];
            const getV = (i: number) => (c[i] && c[i].v !== null && c[i].v !== undefined) ? String(c[i].v).trim() : '';
            const sec = getV(0);
            const sr = getV(1);
            const tag = getV(2);

            // Skip header rows if tag is column label or sr is header
            if (!tag || tag.toUpperCase() === 'CABLE DESIGNATION' || sr === 'Sr. No.') return;

            const layingRaw = getV(13);
            const preRaw = getV(15);
            const commRaw = getV(17);
            const app1 = getV(19);
            const app2 = getV(20);
            const app3 = getV(21);

            allCables.push({
              id: `CTRL-${idx + 1}`,
              scheduleType: 'Control Cable Schedule',
              section: sec || 'Control & Protection',
              srNo: sr || String(idx + 1),
              cableTag: tag,
              fromLocation: getV(3),
              fromEquipment: getV(4),
              toLocation: getV(5),
              toEquipment: getV(6),
              runs: parseInt(getV(8) || '1', 10) || 1,
              cableSize: getV(9),
              cableType: getV(10),
              description: getV(11),
              cableLayingStatus: normalizeStatus(layingRaw),
              cableLayingRemarks: cleanRemarks(getV(14)),
              preCommissioningStatus: normalizeStatus(preRaw),
              preCommissioningRemarks: cleanRemarks(getV(16)),
              commissioningStatus: normalizeStatus(commRaw),
              commissioningRemarks: cleanRemarks(getV(18)),
              approvedBy1: app1 && (app1.includes('Naim') || app1.includes('Nayem') || app1.includes('Yes')) ? 'Nayem Siddik (Sr. Engr)' : undefined,
              approvedBy2: app2 && (app2.includes('Mosaddik') || app2.includes('Mossadek') || app2.includes('Yes')) ? 'Mossadek Hossain (Sr. Engr)' : undefined,
              approvedBy3: app3 && (app3.includes('Fahad') || app3.includes('Yes')) ? 'Md Fahad (Manager PP)' : undefined,
              voltage: 'Control / 110V',
              status: normalizeStatus(commRaw),
              updatedAt: new Date().toISOString()
            });
          });
        }
      }
    } catch (e: any) {
      console.warn('Control Sheet gviz fetch notice:', e.message);
    }

    if (allCables.length === 0) {
      throw new Error('Connected to Google Sheet, but no cable rows could be parsed.');
    }

    return {
      success: true,
      cables: allCables,
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
