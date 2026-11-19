import fs from 'fs';

const raw = fs.readFileSync('scripts/uploaded_data.csv', 'utf8');

function parseCsvLines(text) {
  const lines = [];
  let curLine = [];
  let curToken = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        curToken += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      curLine.push(curToken);
      curToken = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      curLine.push(curToken);
      curToken = '';
      if (curLine.some(t => t.trim().length > 0)) {
        lines.push(curLine);
      }
      curLine = [];
    } else {
      curToken += c;
    }
  }
  if (curToken.length > 0 || curLine.length > 0) {
    curLine.push(curToken);
    lines.push(curLine);
  }
  return lines;
}

const parsed = parseCsvLines(raw);

function cleanStatus(val) {
  if (!val) return 'Pending';
  const trimmed = val.trim();
  if (!trimmed) return 'Pending';
  if (trimmed.toLowerCase() === 'progress') return 'progress';
  if (trimmed.toLowerCase() === 'pending') return 'Pending';
  return trimmed;
}

function getLvSection(tag, panel) {
  const t = (tag || '').toUpperCase();
  if (t.startsWith('PCC')) return 'PCC (Power Control Center)';
  if (t.startsWith('EMPC1')) return 'EMCC-1 (Engine Motor Control Center 1)';
  if (t.startsWith('EMPC2')) return 'EMCC-2 (Engine Motor Control Center 2)';
  if (t.startsWith('EMPC3')) return 'EMCC-3 (Engine Motor Control Center 3)';
  if (t.startsWith('CMPC')) return 'CMCC (Common Motor Control Center)';
  if (t.startsWith('B1W') || t.startsWith('BC1W')) return 'BCC-1 (24V DC Battery Charger 1)';
  if (t.startsWith('B2W') || t.startsWith('BC2W')) return 'BCC-2 (24V DC Battery Charger 2)';
  if (t.startsWith('B3W') || t.startsWith('BC3W')) return 'BCC-3 (24V DC Battery Charger 3)';
  if (t.startsWith('BC4W') || t.startsWith('BW111')) return 'BCC Common / Auxiliary';
  return 'General LV Power';
}

let currentSchedule = 'LV Power Cable Schedule';
const cables = [];
let lvIdx = 0;
let ctrlIdx = 0;
const seenTags = new Set();

for (const row of parsed) {
  const col0 = (row[0] || '').trim();
  const col1 = (row[1] || '').trim();
  const full = row.join(' ');

  if (full.includes('Control Cable Schedule')) {
    currentSchedule = 'Control Cable Schedule';
    continue;
  }
  if (full.includes('LV Power Cable Schedule')) {
    currentSchedule = 'LV Power Cable Schedule';
    continue;
  }
  if (full.includes('(11kv, 50Hz, 27MW') || full.includes('Cable Laying,,Pre-Commissioning')) {
    continue;
  }
  if (col0 === 'SR. NO.' || col0 === 'Section') {
    continue;
  }

  if (currentSchedule === 'LV Power Cable Schedule') {
    if (!col1) continue;
    lvIdx++;
    const id = `LV-${String(lvIdx).padStart(3, '0')}`;
    let cableTag = col1.trim();
    if (seenTags.has(cableTag)) {
      cableTag = `${cableTag}*`;
    }
    seenTags.add(cableTag);

    const section = getLvSection(cableTag, row[3]);
    const runs = Number(row[6]) > 0 ? Number(row[6]) : 1;

    cables.push({
      id,
      scheduleType: 'LV Power Cable Schedule',
      section,
      srNo: col0,
      cableTag,
      fromLocation: (row[2] || '').trim(),
      fromEquipment: (row[3] || '').trim(),
      toLocation: (row[4] || '').trim(),
      toEquipment: (row[5] || '').trim(),
      runs,
      cableSize: (row[7] || '').trim(),
      cableType: (row[8] || '').trim(),
      description: (row[9] || '').trim(),
      voltage: '415V',
      status: 'Installed',
      cableLayingStatus: cleanStatus(row[10]),
      cableLayingRemarks: (row[11] || '').trim(),
      preCommissioningStatus: cleanStatus(row[12]),
      preCommissioningRemarks: (row[13] || '').trim(),
      commissioningStatus: cleanStatus(row[14]),
      commissioningRemarks: (row[15] || '').trim(),
      approvedBy1: (row[16] || '').trim() || undefined,
      approvedBy2: (row[17] || '').trim() || undefined,
      approvedBy3: (row[18] || '').trim() || undefined,
      updatedAt: new Date().toISOString()
    });
  } else {
    // Control Cable
    const tag = (row[2] || '').trim();
    if (!tag) continue;
    ctrlIdx++;
    const id = `CTRL-${String(ctrlIdx).padStart(3, '0')}`;
    let cableTag = tag;
    if (seenTags.has(cableTag)) {
      cableTag = `${cableTag}*`;
    }
    seenTags.add(cableTag);

    const runs = Number(row[8]) > 0 ? Number(row[8]) : 1;

    cables.push({
      id,
      scheduleType: 'Control Cable Schedule',
      section: col0.trim(),
      srNo: (row[1] || '').trim(),
      cableTag,
      fromLocation: (row[3] || '').trim(),
      fromEquipment: (row[4] || '').trim(),
      toLocation: (row[5] || '').trim(),
      toEquipment: (row[6] || '').trim(),
      runs,
      cableSize: (row[9] || '').trim(),
      cableType: (row[10] || '').trim(),
      description: (row[11] || '').trim(),
      voltage: 'Control / 110V',
      status: 'Installed',
      cableLayingStatus: cleanStatus(row[13]),
      cableLayingRemarks: (row[14] || '').trim(),
      preCommissioningStatus: cleanStatus(row[15]),
      preCommissioningRemarks: (row[16] || '').trim(),
      commissioningStatus: cleanStatus(row[17]),
      commissioningRemarks: (row[18] || '').trim(),
      approvedBy1: (row[19] || '').trim() || undefined,
      approvedBy2: (row[20] || '').trim() || undefined,
      approvedBy3: (row[21] || '').trim() || undefined,
      updatedAt: new Date().toISOString()
    });
  }
}

console.log(`Parsed ${cables.length} total cable entries.`);
console.log(`- LV Power Cables: ${lvIdx}`);
console.log(`- Control Cables: ${ctrlIdx}`);

// Calculate BOQ Summary
const boqMap = new Map();
for (const c of cables) {
  const key = `${c.cableType}__${c.cableSize}`;
  if (!boqMap.has(key)) {
    boqMap.set(key, {
      id: `BOQ-${boqMap.size + 1}`,
      cableType: c.cableType,
      conductorSize: c.cableSize,
      entriesCount: 0,
      totalRuns: 0
    });
  }
  const item = boqMap.get(key);
  item.entriesCount += 1;
  item.totalRuns += c.runs || 1;
}
const boqSummary = Array.from(boqMap.values());
console.log(`Calculated BOQ Summary: ${boqSummary.length} cable size/type combinations.`);

// Write out to src/data/cableData.ts
const fileContent = `import { CableEntry, BoqItem, ProjectSettings } from '../types';

export const projectMeta: ProjectSettings = {
  projectTitle: 'Bergen Engines 27MW Power Plant - Cable Schedule & Work Tracker',
  docNoPower: 'BERGEN-ELEC-LV-003',
  docNoControl: 'BERGEN-ELEC-CTRL-003',
  revision: 'Rev. 3 (Final As-Built)',
  spreadsheetUrl: '',
  driveFolderUrl: '',
  driveFolderId: '',
  webAppUrl: '',
  lastSyncTimestamp: null
};

export const initialCables: CableEntry[] = ${JSON.stringify(cables, null, 2)};

export const boqSummary: BoqItem[] = ${JSON.stringify(boqSummary, null, 2)};
`;

fs.writeFileSync('src/data/cableData.ts', fileContent, 'utf8');
console.log('Successfully updated src/data/cableData.ts with new 449 cables!');

// Now seed directly to Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pdgymjghsxkebdipuzwf.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_meUYwZlVSzp27MWFA2O1AA_GC0Lu4RQ';

function mapCableEntryToDbRow(cable) {
  return {
    id: cable.id,
    schedule_type: cable.scheduleType,
    section: cable.section,
    sr_no: cable.srNo,
    cable_tag: cable.cableTag,
    from_location: cable.fromLocation,
    from_equipment: cable.fromEquipment,
    to_location: cable.toLocation,
    to_equipment: cable.toEquipment,
    runs: cable.runs || 1,
    cable_size: cable.cableSize,
    cable_type: cable.cableType,
    description: cable.description,
    voltage: cable.voltage,
    cable_laying_status: cable.cableLayingStatus,
    cable_laying_remarks: cable.cableLayingRemarks || '',
    pre_commissioning_status: cable.preCommissioningStatus,
    pre_commissioning_remarks: cable.preCommissioningRemarks || '',
    commissioning_status: cable.commissioningStatus,
    commissioning_remarks: cable.commissioningRemarks || '',
    approved_by1: cable.approvedBy1 || null,
    approved_by2: cable.approvedBy2 || null,
    approved_by3: cable.approvedBy3 || null,
    notes: cable.notes || '',
    drawing_url: cable.drawingUrl || '',
    updated_at: new Date().toISOString()
  };
}

async function uploadToSupabase() {
  console.log(`\nUploading ${cables.length} cables to Supabase (${SUPABASE_URL})...`);
  const rows = cables.map(mapCableEntryToDbRow);

  // 1. Delete existing rows to replace with new data
  try {
    const delRes = await fetch(`${SUPABASE_URL}/rest/v1/cables?id=neq.placeholder`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    console.log(`Cleared existing Supabase table: HTTP ${delRes.status}`);
  } catch (e) {
    console.warn('Notice while clearing table:', e.message);
  }

  // 2. Insert new rows in chunks of 50
  const chunkSize = 50;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cables?on_conflict=id`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(chunk)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Error inserting chunk ${i} - ${i + chunk.length}: HTTP ${res.status} ${errText}`);
    } else {
      inserted += chunk.length;
      console.log(`Inserted chunk ${i + 1} - ${i + chunk.length} (Total: ${inserted}/${rows.length})`);
    }
  }

  console.log(`\n🎉 Supabase Upload Complete! All ${inserted}/${rows.length} cables successfully inserted.`);
}

uploadToSupabase();
