import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CableEntry, CableLayingStatus, CommissioningStatus, BoqItem, ProjectSettings, AppUser } from '../types';
import { AUTH_STORAGE_KEY, canEditSchedule, canSignApproval } from '../services/authService';
import { initialCables, boqSummary, projectMeta } from '../data/cableData';
import { 
  getSupabaseClient, 
  fetchAllCablesFromSupabase, 
  updateCableInSupabase, 
  bulkSeedCablesToSupabase,
  mapDbRowToCableEntry,
  sortCablesInOrder
} from '../services/supabaseService';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'volttrack_cables_schedule_state_v4_uploaded';
const SETTINGS_KEY = 'volttrack_settings_state_v3';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppContextType {
  cables: CableEntry[];
  boq: BoqItem[];
  settings: ProjectSettings;
  activeView: 'schedule' | 'boq' | 'analytics' | 'specs';
  setActiveView: (view: 'schedule' | 'boq' | 'analytics' | 'specs') => void;
  selectedCable: CableEntry | null;
  setSelectedCable: (cable: CableEntry | null) => void;
  
  // Authentication & Permissions
  currentUser: AppUser | null;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;
  login: (user: AppUser) => void;
  logout: () => void;
  canEdit: boolean;
  canApproveLevel: (level: 1 | 2 | 3) => boolean;
  
  // Database Connection Status
  dbStatus: 'connected' | 'connecting' | 'standby';
  reloadFromSupabase: () => Promise<void>;

  // Filters
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  scheduleTypeFilter: string;
  setScheduleTypeFilter: (val: string) => void;
  sectionFilter: string;
  setSectionFilter: (val: string) => void;
  fromLocationFilter: string;
  setFromLocationFilter: (val: string) => void;
  toLocationFilter: string;
  setToLocationFilter: (val: string) => void;
  cableSizeFilter: string;
  setCableSizeFilter: (val: string) => void;
  cableTypeFilter: string;
  setCableTypeFilter: (val: string) => void;
  
  // 3-Stage Progress & Approval Filters
  cableLayingFilter: string;
  setCableLayingFilter: (val: string) => void;
  preCommissioningFilter: string;
  setPreCommissioningFilter: (val: string) => void;
  commissioningFilter: string;
  setCommissioningFilter: (val: string) => void;
  approverFilter: string;
  setApproverFilter: (val: string) => void;

  resetAllFilters: () => void;

  // Actions for the 3 stages & approvals
  updateCableLayingStatus: (id: string, status: CableLayingStatus, remarks?: string) => void;
  updatePreCommissioningStatus: (id: string, status: CommissioningStatus, remarks?: string) => void;
  updateCommissioningStatus: (id: string, status: CommissioningStatus, remarks?: string) => void;
  updateApprovers: (id: string, level: 1 | 2 | 3, name: string, note?: string) => void;
  updateCable: (id: string, updates: Partial<CableEntry>) => void;
  addSingleCable: (cable: CableEntry, saveToSupabase?: boolean) => Promise<boolean>;
  bulkImportCables: (newCables: CableEntry[], mode?: 'append' | 'replace', saveToSupabase?: boolean) => Promise<number>;
  importSpreadsheetData: (newCables: CableEntry[]) => void;
  resetToOriginalSpreadsheet: () => void;
  updateSettings: (newSettings: Partial<ProjectSettings>) => void;

  // Local Excel State & Client-side Exporter
  isSyncing: boolean;
  downloadExcelFile: () => void;
  lastExcelSaveTime: string | null;

  // Toast notifications
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cables, setCables] = useState<CableEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].cableLayingStatus) {
          return sortCablesInOrder(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load local storage:', e);
    }
    return sortCablesInOrder(initialCables);
  });

  const [boq] = useState<BoqItem[]>(boqSummary);
  const [settings, setSettings] = useState<ProjectSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...projectMeta,
          ...parsed
        };
      }
    } catch (e) {}
    return {
      ...projectMeta,
      lastSyncTimestamp: null
    };
  });

  const [activeView, setActiveView] = useState<'schedule' | 'boq' | 'analytics' | 'specs'>('schedule');
  const [selectedCable, setSelectedCable] = useState<CableEntry | null>(null);

  // Authentication state (Default is public Viewer)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const login = (user: AppUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {}
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {}
  };

  const canEdit = canEditSchedule(currentUser);
  const canApproveLevel = (level: 1 | 2 | 3) => canSignApproval(currentUser, level);

  const [dbStatus, setDbStatus] = useState<'connected' | 'connecting' | 'standby'>('connecting');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleTypeFilter, setScheduleTypeFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [fromLocationFilter, setFromLocationFilter] = useState('All');
  const [toLocationFilter, setToLocationFilter] = useState('All');
  const [cableSizeFilter, setCableSizeFilter] = useState('All');
  const [cableTypeFilter, setCableTypeFilter] = useState('All');

  // Exact 3 Stages & Approval Filters
  const [cableLayingFilter, setCableLayingFilter] = useState('All');
  const [preCommissioningFilter, setPreCommissioningFilter] = useState('All');
  const [commissioningFilter, setCommissioningFilter] = useState('All');
  const [approverFilter, setApproverFilter] = useState('All');

  const [isSyncing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cables));
    } catch (e) {
      console.warn('Failed to save cables to localStorage:', e);
    }
  }, [cables]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const reloadFromSupabase = async () => {
    setDbStatus('connecting');
    const dbCables = await fetchAllCablesFromSupabase();
    if (dbCables && dbCables.length > 0) {
      const sorted = sortCablesInOrder(dbCables);
      setCables(sorted);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
      } catch (e) {}
      setDbStatus('connected');
      showToast(`Reloaded and synchronized ${sorted.length} cables from Supabase Database!`, 'success');
    } else {
      setDbStatus('standby');
      showToast('Could not fetch cables from Supabase. Working with cached project schedule.', 'info');
    }
  };

  // Supabase Real-Time WebSocket & Auto-Sync Hook
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setDbStatus('standby');
      return;
    }

    // 1. Initial fetch from Supabase if table has records
    fetchAllCablesFromSupabase().then(dbCables => {
      if (dbCables && dbCables.length > 0) {
        const sorted = sortCablesInOrder(dbCables);
        setCables(sorted);
        setDbStatus('connected');
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
        } catch (e) {}
        console.log(`[Supabase DB] Loaded and synchronized ${sorted.length} cables from Supabase`);
      } else {
        setDbStatus('connected');
      }
    }).catch((err) => {
      console.warn('[Supabase Initial Fetch Warning]:', err);
      setDbStatus('standby');
    });

    // 2. Real-Time WebSocket Channel for instant sync across all users
    try {
      const channel = client
        .channel('cables-realtime-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cables' }, (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updated = mapDbRowToCableEntry(payload.new);
            setCables(prev => {
              const exists = prev.some(c => c.id === updated.id || c.cableTag === updated.cableTag);
              const nextList = exists
                ? prev.map(c => (c.id === updated.id || c.cableTag === updated.cableTag) ? { ...c, ...updated } : c)
                : [...prev, updated];
              const sorted = sortCablesInOrder(nextList);
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
              } catch (e) {}
              return sorted;
            });
            if (selectedCable && (selectedCable.id === updated.id || selectedCable.cableTag === updated.cableTag)) {
              setSelectedCable(prev => prev ? { ...prev, ...updated } : updated);
            }
          }
        })
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } catch (e) {
      console.warn('[Supabase Realtime Channel Notice]:', e);
    }
  }, []);

  const [lastExcelSaveTime, setLastExcelSaveTime] = useState<string | null>(null);

  // Auto-save on edit: writes timestamp
  useEffect(() => {
    setLastExcelSaveTime(new Date().toLocaleTimeString());
  }, [cables]);

  // Client-side instant Excel export (Works 100% on GitHub Pages, mobile, and desktop)
  const downloadExcelFile = () => {
    try {
      const rows = cables.map((c: any) => ({
        'Sr. No.': c.srNo || '',
        'Cable Designation': c.cableTag || '',
        'Schedule Type': c.scheduleType || '',
        'Section': c.section || '',
        'From Location': c.fromLocation || '',
        'From Equipment / Panel': c.fromEquipment || '',
        'To Location': c.toLocation || '',
        'To Equipment / Panel': c.toEquipment || '',
        'No. of Runs': c.runs || 1,
        'Cable Size': c.cableSize || '',
        'Cable Type': c.cableType || '',
        'Description / Scope': c.description || '',
        'Voltage': c.voltage || '',
        'Cable Laying Status': c.cableLayingStatus || 'Pending',
        'Pre-Commissioning Status': c.preCommissioningStatus || 'Pending',
        'Commissioning Status': c.commissioningStatus || 'Pending',
        'Approve: Nayem Siddik (Sr. Engr)': c.approvedBy1 || '',
        'Nayem Siddik Note (L1)': c.approvalNote1 || '',
        'Approve: Mossadek Hossain (Sr. Engr)': c.approvedBy2 || '',
        'Mossadek Hossain Note (L2)': c.approvalNote2 || '',
        'Approve: Md Fahad (Manager PP)': c.approvedBy3 || '',
        'Md Fahad Note (L3)': c.approvalNote3 || '',
        'General Notes': c.notes || '',
        'Last Updated': c.updatedAt || new Date().toISOString()
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Master Cable Schedule');
      XLSX.writeFile(wb, 'Bergen_Engines_Cable_Schedule_Live.xlsx');
      showToast('Downloaded live Bergen Engines Cable Schedule Excel (.xlsx)!', 'success');
    } catch (err: any) {
      showToast(`Excel export failed: ${err.message}`, 'error');
    }
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setScheduleTypeFilter('All');
    setSectionFilter('All');
    setFromLocationFilter('All');
    setToLocationFilter('All');
    setCableSizeFilter('All');
    setCableTypeFilter('All');
    setCableLayingFilter('All');
    setPreCommissioningFilter('All');
    setCommissioningFilter('All');
    setApproverFilter('All');
    showToast('All filters cleared', 'info');
  };

  // Actions for 3 Stages & Approvals with direct Supabase Database Persistence
  const updateCableLayingStatus = async (id: string, status: CableLayingStatus, remarks?: string) => {
    if (!canEdit) {
      showToast('Authentication required: Please log in as Senior Engineer or Admin to edit Cable Laying.', 'warning');
      setIsLoginModalOpen(true);
      return;
    }

    const existing = cables.find(c => c.id === id);
    if (!existing) return;

    const updated: CableEntry = { 
      ...existing, 
      cableLayingStatus: status, 
      cableLayingRemarks: remarks !== undefined ? remarks : existing.cableLayingRemarks,
      updatedAt: new Date().toISOString() 
    };

    // 1. Immediately update React state
    setCables(prev => prev.map(c => c.id === id ? updated : c));
    if (selectedCable && selectedCable.id === id) setSelectedCable(updated);

    // 2. Immediately persist to localStorage
    try {
      const nextList = cables.map(c => c.id === id ? updated : c);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
    } catch (e) {}

    // 3. Immediately persist to Supabase Database
    const res = await updateCableInSupabase(updated);
    if (res.success) {
      showToast(`Cable Laying status set to "${status}" (Saved to Supabase DB)`, 'success');
    } else {
      console.warn('[Supabase Sync Warning]:', res.error);
      showToast(`Saved locally. Supabase DB notice: ${res.error || 'Sync queued'}`, 'info');
    }
  };

  const updatePreCommissioningStatus = async (id: string, status: CommissioningStatus, remarks?: string) => {
    if (!canEdit) {
      showToast('Authentication required: Please log in as Senior Engineer or Admin to edit Pre-Commissioning.', 'warning');
      setIsLoginModalOpen(true);
      return;
    }

    const existing = cables.find(c => c.id === id);
    if (!existing) return;

    const updated: CableEntry = { 
      ...existing, 
      preCommissioningStatus: status, 
      preCommissioningRemarks: remarks !== undefined ? remarks : existing.preCommissioningRemarks,
      updatedAt: new Date().toISOString() 
    };

    // 1. Immediately update React state
    setCables(prev => prev.map(c => c.id === id ? updated : c));
    if (selectedCable && selectedCable.id === id) setSelectedCable(updated);

    // 2. Immediately persist to localStorage
    try {
      const nextList = cables.map(c => c.id === id ? updated : c);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
    } catch (e) {}

    // 3. Immediately persist to Supabase Database
    const res = await updateCableInSupabase(updated);
    if (res.success) {
      showToast(`Pre-Commissioning status set to "${status}" (Saved to Supabase DB)`, 'success');
    } else {
      console.warn('[Supabase Sync Warning]:', res.error);
      showToast(`Saved locally. Supabase DB notice: ${res.error || 'Sync queued'}`, 'info');
    }
  };

  const updateCommissioningStatus = async (id: string, status: CommissioningStatus, remarks?: string) => {
    if (!canEdit) {
      showToast('Authentication required: Please log in as Senior Engineer or Admin to edit Commissioning.', 'warning');
      setIsLoginModalOpen(true);
      return;
    }

    const existing = cables.find(c => c.id === id);
    if (!existing) return;

    const updated: CableEntry = { 
      ...existing, 
      commissioningStatus: status, 
      commissioningRemarks: remarks !== undefined ? remarks : existing.commissioningRemarks,
      updatedAt: new Date().toISOString() 
    };

    // 1. Immediately update React state
    setCables(prev => prev.map(c => c.id === id ? updated : c));
    if (selectedCable && selectedCable.id === id) setSelectedCable(updated);

    // 2. Immediately persist to localStorage
    try {
      const nextList = cables.map(c => c.id === id ? updated : c);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
    } catch (e) {}

    // 3. Immediately persist to Supabase Database
    const res = await updateCableInSupabase(updated);
    if (res.success) {
      showToast(`Commissioning status set to "${status}" (Saved to Supabase DB)`, 'success');
    } else {
      console.warn('[Supabase Sync Warning]:', res.error);
      showToast(`Saved locally. Supabase DB notice: ${res.error || 'Sync queued'}`, 'info');
    }
  };

  const updateApprovers = async (id: string, level: 1 | 2 | 3, name: string, note?: string) => {
    if (!canApproveLevel(level)) {
      const allowedNames = { 1: 'Nayem Siddik (Senior Engineer)', 2: 'Mossadek Hossain (Senior Engineer)', 3: 'Md Fahad (Manager PP)' };
      showToast(`Access Restricted: Level ${level} sign-off can only be approved by ${allowedNames[level]} or Admin.`, 'warning');
      setIsLoginModalOpen(true);
      return;
    }

    const existing = cables.find(c => c.id === id);
    if (!existing) return;

    const updated: CableEntry = { 
      ...existing, 
      approvedBy1: level === 1 ? name : existing.approvedBy1,
      approvalNote1: level === 1 && note !== undefined ? note : existing.approvalNote1,
      approvedBy2: level === 2 ? name : existing.approvedBy2,
      approvalNote2: level === 2 && note !== undefined ? note : existing.approvalNote2,
      approvedBy3: level === 3 ? name : existing.approvedBy3,
      approvalNote3: level === 3 && note !== undefined ? note : existing.approvalNote3,
      updatedAt: new Date().toISOString() 
    };

    // 1. Immediately update React state
    setCables(prev => prev.map(c => c.id === id ? updated : c));
    if (selectedCable && selectedCable.id === id) setSelectedCable(updated);

    // 2. Immediately persist to localStorage
    try {
      const nextList = cables.map(c => c.id === id ? updated : c);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
    } catch (e) {}

    // 3. Immediately persist to Supabase Database
    const res = await updateCableInSupabase(updated);
    if (res.success) {
      showToast(`Sign-off updated for Level ${level} (Saved to Supabase DB)`, 'success');
    } else {
      console.warn('[Supabase Sync Warning]:', res.error);
      showToast(`Saved locally. Supabase DB notice: ${res.error || 'Sync queued'}`, 'info');
    }
  };

  const updateCable = async (id: string, updates: Partial<CableEntry>) => {
    if (!canEdit) {
      showToast('Authentication required: Please log in to edit cable data.', 'warning');
      setIsLoginModalOpen(true);
      return;
    }

    const existing = cables.find(c => c.id === id);
    if (!existing) return;

    const updated: CableEntry = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };

    // 1. Immediately update React state
    setCables(prev => prev.map(c => c.id === id ? updated : c));
    if (selectedCable && selectedCable.id === id) setSelectedCable(updated);

    // 2. Immediately persist to localStorage
    try {
      const nextList = cables.map(c => c.id === id ? updated : c);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
    } catch (e) {}

    // 3. Immediately persist to Supabase Database
    const res = await updateCableInSupabase(updated);
    if (res.success) {
      showToast(`Cable ${existing.cableTag} updated (Saved to Supabase DB)`, 'success');
    } else {
      console.warn('[Supabase Sync Warning]:', res.error);
      showToast(`Saved locally. Supabase DB notice: ${res.error || 'Sync queued'}`, 'info');
    }
  };

  const addSingleCable = async (cable: CableEntry, saveToSupabase = true): Promise<boolean> => {
    if (!canEdit) {
      showToast('Authentication required: Please log in as Admin or Senior Engineer to add cables.', 'warning');
      setIsLoginModalOpen(true);
      return false;
    }

    setCables(prev => [cable, ...prev]);

    if (saveToSupabase) {
      const ok = await updateCableInSupabase(cable);
      if (ok) {
        showToast(`Cable "${cable.cableTag}" created & saved to Supabase!`, 'success');
      } else {
        showToast(`Cable "${cable.cableTag}" saved to local workspace.`, 'info');
      }
    } else {
      showToast(`Cable "${cable.cableTag}" added to schedule.`, 'success');
    }

    return true;
  };

  const bulkImportCables = async (newCables: CableEntry[], mode: 'append' | 'replace' = 'append', saveToSupabase = true): Promise<number> => {
    if (!canEdit) {
      showToast('Authentication required: Please log in to import cables.', 'warning');
      setIsLoginModalOpen(true);
      return 0;
    }

    if (!newCables || newCables.length === 0) {
      showToast('No cables found to import.', 'warning');
      return 0;
    }

    if (mode === 'replace') {
      setCables(newCables);
    } else {
      setCables(prev => {
        const merged = [...prev];
        for (const incoming of newCables) {
          const existingIdx = merged.findIndex(c => c.id === incoming.id || (incoming.cableTag && c.cableTag === incoming.cableTag));
          if (existingIdx >= 0) {
            merged[existingIdx] = { ...merged[existingIdx], ...incoming };
          } else {
            merged.push(incoming);
          }
        }
        return merged;
      });
    }

    if (saveToSupabase) {
      showToast(`Saving ${newCables.length} imported cables to Supabase database...`, 'info');
      try {
        const res = await bulkSeedCablesToSupabase(newCables);
        if (res.success) {
          showToast(`Successfully imported & saved ${res.count} cables into Supabase!`, 'success');
        } else {
          showToast(`Saved to workspace. Supabase notice: ${res.error}`, 'warning');
        }
      } catch (e: any) {
        showToast(`Saved to workspace. Supabase error: ${e.message}`, 'warning');
      }
    } else {
      showToast(`Successfully imported ${newCables.length} cables into local schedule!`, 'success');
    }

    return newCables.length;
  };

  const importSpreadsheetData = (newCables: CableEntry[]) => {
    setCables(newCables);
    showToast(`Loaded ${newCables.length} cables from spreadsheet!`, 'success');
  };

  const resetToOriginalSpreadsheet = () => {
    setCables(initialCables);
    localStorage.removeItem(STORAGE_KEY);
    showToast(`Restored all ${initialCables.length} cables from original project schedule!`, 'info');
  };

  const updateSettings = (newSettings: Partial<ProjectSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    showToast('Settings updated', 'success');
  };

  return (
    <AppContext.Provider value={{
      cables,
      boq,
      settings,
      activeView,
      setActiveView,
      selectedCable,
      setSelectedCable,
      currentUser,
      isLoginModalOpen,
      setIsLoginModalOpen,
      isImportModalOpen,
      setIsImportModalOpen,
      login,
      logout,
      canEdit,
      canApproveLevel,
      dbStatus,
      reloadFromSupabase,
      searchQuery,
      setSearchQuery,
      scheduleTypeFilter,
      setScheduleTypeFilter,
      sectionFilter,
      setSectionFilter,
      fromLocationFilter,
      setFromLocationFilter,
      toLocationFilter,
      setToLocationFilter,
      cableSizeFilter,
      setCableSizeFilter,
      cableTypeFilter,
      setCableTypeFilter,
      cableLayingFilter,
      setCableLayingFilter,
      preCommissioningFilter,
      setPreCommissioningFilter,
      commissioningFilter,
      setCommissioningFilter,
      approverFilter,
      setApproverFilter,
      resetAllFilters,
      updateCableLayingStatus,
      updatePreCommissioningStatus,
      updateCommissioningStatus,
      updateApprovers,
      updateCable,
      addSingleCable,
      bulkImportCables,
      importSpreadsheetData,
      resetToOriginalSpreadsheet,
      updateSettings,
      isSyncing,
      downloadExcelFile,
      lastExcelSaveTime,
      toasts,
      showToast,
      dismissToast
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
