import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CableEntry, WorkAssignment, StaffEditRecord, StaffAccountItem } from '../types';

export const SUPABASE_URL_KEY = 'volttrack_supabase_url';
export const SUPABASE_ANON_KEY = 'volttrack_supabase_anon_key';

export const DEFAULT_SUPABASE_URL = 'https://pdgymjghsxkebdipuzwf.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_meUYwZlVSzp27MWFA2O1AA_GC0Lu4RQ';

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function cleanSupabaseUrl(raw: string): string {
  if (!raw) return '';
  let url = raw.trim();
  // Remove /rest/v1 or trailing slashes if user pasted full REST endpoint
  url = url.replace(/\/rest\/v1\/?$/, '');
  url = url.replace(/\/+$/, '');
  return url;
}

export function getStoredSupabaseCredentials(): { url: string; anonKey: string } {
  try {
    const rawUrl = localStorage.getItem(SUPABASE_URL_KEY) || (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const rawKey = localStorage.getItem(SUPABASE_ANON_KEY) || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    return { url: cleanSupabaseUrl(rawUrl), anonKey: rawKey.trim() };
  } catch {
    return { url: DEFAULT_SUPABASE_URL, anonKey: DEFAULT_SUPABASE_ANON_KEY };
  }
}

export function saveStoredSupabaseCredentials(url: string, anonKey: string) {
  try {
    const cleanUrl = cleanSupabaseUrl(url);
    if (cleanUrl) localStorage.setItem(SUPABASE_URL_KEY, cleanUrl);
    else localStorage.removeItem(SUPABASE_URL_KEY);

    if (anonKey) localStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim());
    else localStorage.removeItem(SUPABASE_ANON_KEY);

    cachedClient = null;
    cachedUrl = '';
    cachedKey = '';
  } catch (e) {
    console.error('Failed to save Supabase credentials to localStorage', e);
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseCredentials();
  if (!url || !anonKey) return null;

  if (cachedClient && cachedUrl === url && cachedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    cachedUrl = url;
    cachedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function mapDbRowToCableEntry(row: any): CableEntry {
  return {
    id: row.id || `CBL-${row.cable_tag || row.sr_no}`,
    scheduleType: row.schedule_type || 'Control Cable Schedule',
    section: row.section || 'General',
    srNo: String(row.sr_no || ''),
    cableTag: String(row.cable_tag || ''),
    fromLocation: row.from_location || '',
    fromEquipment: row.from_equipment || '',
    toLocation: row.to_location || '',
    toEquipment: row.to_equipment || '',
    runs: Number(row.runs) || 1,
    cableSize: row.cable_size || '',
    cableType: row.cable_type || '',
    description: row.description || '',
    voltage: row.voltage || 'Control / 110V',
    cableLayingStatus: row.cable_laying_status || 'Pending',
    cableLayingRemarks: row.cable_laying_remarks || '',
    preCommissioningStatus: row.pre_commissioning_status || 'Pending',
    preCommissioningRemarks: row.pre_commissioning_remarks || '',
    commissioningStatus: row.commissioning_status || 'Pending',
    commissioningRemarks: row.commissioning_remarks || '',
    approvedBy1: row.approved_by1 || undefined,
    approvalNote1: row.cable_laying_remarks || '',
    approvedBy2: row.approved_by2 || undefined,
    approvalNote2: row.pre_commissioning_remarks || '',
    approvedBy3: row.approved_by3 || undefined,
    approvalNote3: row.commissioning_remarks || '',
    notes: row.notes || '',
    drawingUrl: row.drawing_url || '',
    status: row.commissioning_status || 'Pending',
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

export function mapCableEntryToDbRow(cable: CableEntry): any {
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
    cable_laying_remarks: cable.approvalNote1 || cable.cableLayingRemarks || '',
    pre_commissioning_status: cable.preCommissioningStatus,
    pre_commissioning_remarks: cable.approvalNote2 || cable.preCommissioningRemarks || '',
    commissioning_status: cable.commissioningStatus,
    commissioning_remarks: cable.approvalNote3 || cable.commissioningRemarks || '',
    approved_by1: cable.approvedBy1 || null,
    approved_by2: cable.approvedBy2 || null,
    approved_by3: cable.approvedBy3 || null,
    notes: cable.notes || '',
    drawing_url: cable.drawingUrl || '',
    updated_at: new Date().toISOString()
  };
}

export async function testSupabaseConnection(url?: string, anonKey?: string): Promise<{ success: boolean; message: string; count?: number }> {
  let client: SupabaseClient | null = null;
  if (url && anonKey) {
    try {
      client = createClient(url.trim(), anonKey.trim());
    } catch (e: any) {
      return { success: false, message: `Invalid Supabase configuration: ${e.message}` };
    }
  } else {
    client = getSupabaseClient();
  }

  if (!client) {
    return { success: false, message: 'Supabase URL or Anon Key is missing.' };
  }

  try {
    const { data, count, error } = await client
      .from('cables')
      .select('cable_tag', { count: 'exact', head: false })
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        return { success: false, message: `Table "cables" not found. Please run the SQL schema in Supabase SQL Editor.` };
      }
      if (error.code === '42501') {
        return { success: false, message: `Permission Denied. Please run: GRANT ALL ON TABLE public.cables TO anon, authenticated; in Supabase SQL Editor.` };
      }
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: `Connected successfully! Found ${count ?? data?.length ?? 0} cables in database.`,
      count: count ?? data?.length ?? 0
    };
  } catch (err: any) {
    return { success: false, message: `Connection error: ${err.message}` };
  }
}

export function sortCablesInOrder(list: CableEntry[]): CableEntry[] {
  return [...list].sort((a, b) => {
    const aIsLV = a.id.startsWith('LV');
    const bIsLV = b.id.startsWith('LV');
    if (aIsLV && !bIsLV) return -1;
    if (!aIsLV && bIsLV) return 1;
    const aNum = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
    const bNum = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
    if (aNum !== bNum) return aNum - bNum;
    return a.id.localeCompare(b.id);
  });
}

export async function fetchAllCablesFromSupabase(): Promise<CableEntry[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('cables')
      .select('*')
      .limit(2000);

    if (error) {
      console.warn('[Supabase Fetch Error]:', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];
    const validRows = data.filter(r => 
      !String(r.id || '').startsWith('__SYSTEM_') && 
      !String(r.id || '').startsWith('SYS-') && 
      r.cable_tag !== '__STAFF_ACCOUNTS__' && 
      r.cable_tag !== '__WORK_ASSIGNMENTS__' && 
      r.cable_tag !== '__EDIT_HISTORY__' && 
      r.cable_tag !== '__CUSTOM_STATUSES__'
    );
    const mapped = validRows.map(mapDbRowToCableEntry);
    return sortCablesInOrder(mapped);
  } catch (e) {
    console.warn('[Supabase Fetch Exception]:', e);
    return null;
  }
}

export async function updateCableInSupabase(cable: CableEntry): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('[Supabase Update] Client not initialized');
    return { success: false, error: 'Supabase client not connected' };
  }

  try {
    const row = mapCableEntryToDbRow(cable);
    // 1. Direct update by primary key ID
    const { error: updateError } = await client
      .from('cables')
      .update(row)
      .eq('id', cable.id);

    if (updateError) {
      console.warn('[Supabase Update by ID warning, attempting upsert]:', updateError.message);
      const { error: upsertError } = await client
        .from('cables')
        .upsert(row, { onConflict: 'id' });

      if (upsertError) {
        console.error('[Supabase Upsert Error]:', upsertError.message);
        return { success: false, error: upsertError.message };
      }
    }
    return { success: true };
  } catch (e: any) {
    console.error('[Supabase Upsert Exception]:', e);
    return { success: false, error: e?.message || 'Network exception' };
  }
}

export async function bulkSeedCablesToSupabase(cables: CableEntry[], onProgress?: (done: number, total: number) => void): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, count: 0, error: 'Supabase client not configured' };

  try {
    const rows = cables.map(mapCableEntryToDbRow);
    const chunkSize = 50;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await client
        .from('cables')
        .upsert(chunk, { onConflict: 'id' });

      if (error) {
        throw new Error(error.message);
      }
      inserted += chunk.length;
      if (onProgress) onProgress(inserted, rows.length);
    }

    return { success: true, count: inserted };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message };
  }
}

export const WORK_ASSIGNMENTS_RECORD_ID = '__SYSTEM_WORK_ASSIGNMENTS__';

export async function fetchWorkAssignmentsFromSupabase(): Promise<WorkAssignment[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('cables')
      .select('description')
      .eq('id', WORK_ASSIGNMENTS_RECORD_ID)
      .maybeSingle();

    if (error || !data || !data.description) return null;
    return JSON.parse(data.description) as WorkAssignment[];
  } catch (e) {
    console.warn('[Supabase Work Assignments Fetch Error]:', e);
    return null;
  }
}

export async function saveWorkAssignmentsToSupabase(assignments: WorkAssignment[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const row = {
      id: WORK_ASSIGNMENTS_RECORD_ID,
      schedule_type: 'System Meta',
      section: 'Work Management',
      sr_no: '0',
      cable_tag: '__WORK_ASSIGNMENTS__',
      description: JSON.stringify(assignments),
      notes: 'Real-time staff work assignments and task distribution store',
      updated_at: new Date().toISOString()
    };
    const { error } = await client.from('cables').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase Work Assignments Save Error]:', error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.error('[Supabase Work Assignments Save Exception]:', e?.message || e);
    return false;
  }
}

export const EDIT_HISTORY_RECORD_ID = '__SYSTEM_EDIT_HISTORY__';

export async function fetchEditHistoryFromSupabase(): Promise<StaffEditRecord[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('cables')
      .select('description')
      .eq('id', EDIT_HISTORY_RECORD_ID)
      .maybeSingle();

    if (error || !data || !data.description) return null;
    return JSON.parse(data.description) as StaffEditRecord[];
  } catch (e) {
    console.warn('[Supabase Edit History Fetch Error]:', e);
    return null;
  }
}

export async function saveEditHistoryToSupabase(history: StaffEditRecord[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const row = {
      id: EDIT_HISTORY_RECORD_ID,
      schedule_type: 'System Meta',
      section: 'Audit Logs',
      sr_no: '0',
      cable_tag: '__EDIT_HISTORY__',
      description: JSON.stringify(history.slice(0, 100)),
      notes: 'Real-time staff edit history and audit log store',
      updated_at: new Date().toISOString()
    };
    const { error } = await client.from('cables').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase Edit History Save Error]:', error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.error('[Supabase Edit History Save Exception]:', e?.message || e);
    return false;
  }
}

export const STAFF_ACCOUNTS_RECORD_ID = 'SYS-STAFF-ACCOUNTS-SYNC';

export async function fetchStaffAccountsFromSupabase(): Promise<StaffAccountItem[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('cables')
      .select('description')
      .eq('id', STAFF_ACCOUNTS_RECORD_ID)
      .maybeSingle();

    if (error || !data || !data.description) return null;
    return JSON.parse(data.description) as StaffAccountItem[];
  } catch (e) {
    console.warn('[Supabase Staff Accounts Fetch Error]:', e);
    return null;
  }
}

export async function saveStaffAccountsToSupabase(accounts: StaffAccountItem[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const row = {
      id: STAFF_ACCOUNTS_RECORD_ID,
      schedule_type: 'System Meta',
      section: 'Security & Auth',
      sr_no: '0',
      cable_tag: '__STAFF_ACCOUNTS__',
      description: JSON.stringify(accounts),
      notes: 'Real-time staff credentials store (Admin managed)',
      updated_at: new Date().toISOString()
    };
    const { error } = await client.from('cables').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase Staff Accounts Save Error]:', error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.error('[Supabase Staff Accounts Save Exception]:', e?.message || e);
    return false;
  }
}

export const CUSTOM_STATUSES_RECORD_ID = '__SYSTEM_CUSTOM_STATUSES__';

export async function fetchCustomStatusesFromSupabase(): Promise<string[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('cables')
      .select('description')
      .eq('id', CUSTOM_STATUSES_RECORD_ID)
      .maybeSingle();

    if (error || !data || !data.description) return null;
    return JSON.parse(data.description) as string[];
  } catch (e) {
    console.warn('[Supabase Custom Statuses Fetch Error]:', e);
    return null;
  }
}

export async function saveCustomStatusesToSupabase(statuses: string[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const row = {
      id: CUSTOM_STATUSES_RECORD_ID,
      schedule_type: 'System Meta',
      section: 'Work Management',
      sr_no: '0',
      cable_tag: '__CUSTOM_STATUSES__',
      description: JSON.stringify(statuses),
      notes: 'Custom dynamic status options for cable stages',
      updated_at: new Date().toISOString()
    };
    const { error } = await client.from('cables').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase Custom Statuses Save Error]:', error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.error('[Supabase Custom Statuses Save Exception]:', e?.message || e);
    return false;
  }
}
