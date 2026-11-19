import { CableEntry, CableLayingStatus, CommissioningStatus } from '../types';
import { normalizeStatus } from './pdfParserService';

/**
 * Parses multi-row pasted text (tab-separated, comma-separated, or pipe-separated)
 */
export function parsePastedTextToCables(text: string): CableEntry[] {
  if (!text || !text.trim()) return [];

  const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (rawLines.length === 0) return [];

  // Detect delimiter of first non-empty line
  const firstLine = rawLines[0];
  let delimiter: string | RegExp = '\t';
  if (firstLine.includes('\t')) {
    delimiter = '\t';
  } else if (firstLine.includes(',')) {
    delimiter = ',';
  } else if (firstLine.includes('|')) {
    delimiter = '|';
  } else {
    delimiter = /\s{2,}/; // multiple whitespace
  }

  // Check if first line is a header
  const firstTokens = firstLine.split(delimiter).map(t => t.trim().toLowerCase());
  const hasHeader = firstTokens.some(t => 
    t.includes('tag') || t.includes('designation') || t.includes('cable') || t.includes('from') || t.includes('sr')
  );

  const dataLines = hasHeader ? rawLines.slice(1) : rawLines;

  return dataLines.map((line, idx) => {
    const tokens = line.split(delimiter).map(t => t.trim().replace(/^["']|["']$/g, ''));

    // Expected common order when copying from engineering schedule:
    // [0]: Sr No / Tag
    // [1]: Cable Designation / Tag
    // [2]: Schedule Type or From Location
    // ...
    let cableTag = '';
    let srNo = String(idx + 1);
    let fromLocation = '';
    let fromEquipment = '';
    let toLocation = '';
    let toEquipment = '';
    let cableSize = '';
    let cableType = 'Cu/XLPE/SWA/PVC';
    let voltage = '415V';
    let cableLayingStatus: CableLayingStatus = 'Pending';
    let preCommissioningStatus: CommissioningStatus = 'Pending';
    let commissioningStatus: CommissioningStatus = 'Pending';

    if (tokens.length === 1) {
      // Just a tag
      cableTag = tokens[0];
    } else if (tokens.length >= 2) {
      // If token[0] is numeric, it's srNo, token[1] is tag
      if (/^\d+$/.test(tokens[0])) {
        srNo = tokens[0];
        cableTag = tokens[1];
        fromLocation = tokens[2] || '';
        fromEquipment = tokens[3] || '';
        toLocation = tokens[4] || '';
        toEquipment = tokens[5] || '';
        cableSize = tokens[6] || '';
        if (tokens[7]) cableLayingStatus = normalizeStatus(tokens[7]);
        if (tokens[8]) preCommissioningStatus = normalizeStatus(tokens[8]);
        if (tokens[9]) commissioningStatus = normalizeStatus(tokens[9]);
      } else {
        cableTag = tokens[0];
        fromLocation = tokens[1] || '';
        fromEquipment = tokens[2] || '';
        toLocation = tokens[3] || '';
        toEquipment = tokens[4] || '';
        cableSize = tokens[5] || '';
        if (tokens[6]) cableLayingStatus = normalizeStatus(tokens[6]);
        if (tokens[7]) preCommissioningStatus = normalizeStatus(tokens[7]);
        if (tokens[8]) commissioningStatus = normalizeStatus(tokens[8]);
      }
    }

    if (!cableTag) {
      cableTag = `CBL-MAN-${idx + 1}`;
    }

    const isLV = cableTag.startsWith('LV-') || !cableTag.startsWith('CTRL-');
    if (!isLV) voltage = 'Control / 110V';

    return {
      id: `MANUAL-${cableTag.replace(/[^a-zA-Z0-9_-]/g, '')}-${idx + 1}-${Date.now().toString(36)}`,
      srNo,
      cableTag,
      scheduleType: isLV ? 'LV Power Cable Schedule' : 'Control Cable Schedule',
      section: 'General',
      fromLocation,
      fromEquipment,
      toLocation,
      toEquipment,
      runs: 1,
      cableSize: cableSize || 'Standard',
      cableType,
      description: `Manual Entry: ${cableTag}`,
      voltage,
      status: 'Installed',
      cableLayingStatus,
      preCommissioningStatus,
      commissioningStatus,
      updatedAt: new Date().toISOString()
    };
  });
}
