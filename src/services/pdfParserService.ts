import * as pdfjsLib from 'pdfjs-dist';
import { CableEntry, CableLayingStatus, CommissioningStatus } from '../types';

// Set up worker
try {
  if (typeof window !== 'undefined') {
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = 
      `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('PDF Worker setup notice:', e);
}

export interface ExtractedPdfRow {
  srNo?: string;
  cableTag: string;
  scheduleType?: string;
  section?: string;
  fromLocation?: string;
  fromEquipment?: string;
  toLocation?: string;
  toEquipment?: string;
  runs?: number;
  cableSize?: string;
  cableType?: string;
  description?: string;
  voltage?: string;
  cableLayingStatus?: CableLayingStatus;
  preCommissioningStatus?: CommissioningStatus;
  commissioningStatus?: CommissioningStatus;
  remarks?: string;
  rawText?: string;
}

/**
 * Normalizes status strings from PDF or Excel into recognized status values
 */
export function normalizeStatus(raw: string): CableLayingStatus {
  if (!raw) return 'Pending';
  const clean = raw.trim();
  const lower = clean.toLowerCase();

  if (lower === 'vel') return 'VEL';
  if (lower === 'bargen' || lower === 'bergen') return 'Bargen';
  if (lower === 'pending') return 'Pending';
  if (lower === 'progress' || lower === 'in progress') return 'progress';
  if (lower.includes('scope of bargen') || lower.includes('scope of bergen')) return 'Scope of Bargen';
  if (lower.includes('out of scope')) return 'Out of Scope';
  if (lower === 'n/a' || lower === 'na') return 'N/A';
  if (lower === 'done' || lower === 'completed') return 'VEL';

  return clean as CableLayingStatus;
}

/**
 * Extracts text page-by-page from a PDF file
 */
export async function extractTextFromPdf(file: File, onProgress?: (percent: number) => void): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const allLines: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Group text items by roughly their Y coordinate to reconstruct table lines
    const lineMap = new Map<number, { x: number; text: string }[]>();

    for (const item of textContent.items as any[]) {
      if (!item.str || !item.str.trim()) continue;
      // item.transform: [scaleX, skewY, skewX, scaleY, posX, posY]
      const y = Math.round(item.transform[5] / 4) * 4; // snap within 4 units
      const x = item.transform[4];

      if (!lineMap.has(y)) {
        lineMap.set(y, []);
      }
      lineMap.get(y)!.push({ x, text: item.str });
    }

    // Sort lines by descending Y coordinate (top to bottom of page)
    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);

    for (const y of sortedY) {
      const items = lineMap.get(y)!;
      // Sort items within the line by X coordinate (left to right)
      items.sort((a, b) => a.x - b.x);
      const lineStr = items.map(i => i.text.trim()).join('   ');
      if (lineStr.trim().length > 3) {
        allLines.push(lineStr);
      }
    }

    if (onProgress) {
      onProgress(Math.round((pageNum / numPages) * 100));
    }
  }

  return allLines;
}

/**
 * Intelligent parser that converts extracted lines into CableEntry rows
 */
export function parsePdfLinesToCables(lines: string[]): ExtractedPdfRow[] {
  const results: ExtractedPdfRow[] = [];
  let index = 1;

  for (const line of lines) {
    // Skip common header/footer lines
    const lowerLine = line.toLowerCase();
    if (
      lowerLine.includes('page ') ||
      lowerLine.includes('cable schedule') ||
      lowerLine.includes('bergen engines') ||
      lowerLine.includes('sheet rev') ||
      (lowerLine.includes('cable tag') && lowerLine.includes('from'))
    ) {
      continue;
    }

    // Split line by multiple spaces, tabs, or pipes
    const tokens = line.split(/\s{2,}|\t|\|/).map(t => t.trim()).filter(Boolean);
    if (tokens.length < 2) continue;

    // Detect potential cable tag
    // Pattern: LV-xxx, CTRL-xxx, M01-xxx, or alphanumeric engineering tag (e.g., CMPCW09, B1W114A)
    const tagMatch = line.match(/\b(LV-[0-9A-Za-z_-]+|CTRL-[0-9A-Za-z_-]+|M[0-9]{2}-[0-9A-Za-z_-]+|[A-Z][0-9A-Z]{3,8}[A-Z0-9]?)\b/);

    if (tagMatch) {
      const cableTag = tagMatch[1];
      const isLV = cableTag.startsWith('LV-') || line.toLowerCase().includes('lv power');

      // Detect voltage
      const voltageMatch = line.match(/\b(415V|400V|230V|110V DC|110V|11kV|33kV|690V|Control)\b/i);
      const voltage = voltageMatch ? voltageMatch[1] : (isLV ? '415V' : 'Control / 110V');

      // Detect cable size (e.g. 4Cx240, 3Cx185, 2Cx1.5, 1Cx630, etc.)
      const sizeMatch = line.match(/\b(\d+C\s*x\s*\d+(?:\.\d+)?|\d+x\d+(?:\.\d+)?\s*(?:sq\s*mm|mm2|mm²)?)\b/i);
      const cableSize = sizeMatch ? sizeMatch[1].replace(/\s+/g, '') : '';

      // Detect status tokens
      let layingStatus: CableLayingStatus = 'Pending';
      let preCommStatus: CommissioningStatus = 'Pending';
      let commStatus: CommissioningStatus = 'Pending';

      for (const token of tokens) {
        const norm = normalizeStatus(token);
        if (norm !== 'Pending' && norm !== token) {
          layingStatus = norm;
          preCommStatus = norm;
          commStatus = norm;
          break;
        }
      }

      results.push({
        srNo: String(index),
        cableTag,
        scheduleType: isLV ? 'LV Power Cable Schedule' : 'Control Cable Schedule',
        section: 'Extracted Section',
        fromLocation: tokens[1] || 'From Station',
        fromEquipment: tokens[2] || '',
        toLocation: tokens[3] || 'To Equipment',
        toEquipment: tokens[4] || '',
        runs: 1,
        cableSize: cableSize || 'Standard',
        cableType: isLV ? 'Cu/XLPE/SWA/PVC' : 'Shielded Control',
        description: `Imported from PDF: ${cableTag}`,
        voltage,
        cableLayingStatus: layingStatus,
        preCommissioningStatus: preCommStatus,
        commissioningStatus: commStatus,
        rawText: line
      });

      index++;
    }
  }

  return results;
}
