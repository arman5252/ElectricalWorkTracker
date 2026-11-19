import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CableEntry } from '../types';

export const SUPABASE_URL_KEY = 'volttrack_supabase_url';
export const SUPABASE_ANON_KEY = 'volttrack_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getStoredSupabaseCredentials(): { url: string; anonKey: string } {
  try {
    const url = localStorage.getItem(SUPABASE_URL_KEY) || (import.meta as any).env?.VITE_SUPABASE_URL || '';
    const anonKey = localStorage.getItem(SUPABASE_ANON_KEY) || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
    return { url: url.trim(), anonKey: anonKey.trim() };
  } catch {
    return { url: '', anonKey: '' };
  }
}

export function saveStoredSupabaseCredentials(url: string, anonKey: string) {
  try {
    if (url) localStorage.setItem(SUPABASE_URL_KEY, url.trim());
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
    approvedBy2: row.approved_by2 || undefined,
    approvedBy3: row.approved_by3 || undefined,
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

export async function fetchAllCablesFromSupabase(): Promise<CableEntry[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('cables')
      .select('*')
      .order('sr_no', { ascending: true })
      .limit(2000);

    if (error) {
      console.warn('[Supabase Fetch Error]:', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];
    return data.map(mapDbRowToCableEntry);
  } catch (e) {
    console.warn('[Supabase Fetch Exception]:', e);
    return null;
  }
}

export async function updateCableInSupabase(cable: CableEntry): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = mapCableEntryToDbRow(cable);
    const { error } = await client
      .from('cables')
      .upsert(row, { onConflict: 'cable_tag' });

    if (error) {
      console.error('[Supabase Upsert Error]:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Supabase Upsert Exception]:', e);
    return false;
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
        .upsert(chunk, { onConflict: 'cable_tag' });

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
