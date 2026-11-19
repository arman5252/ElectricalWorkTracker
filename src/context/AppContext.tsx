import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CableEntry, CableLayingStatus, CommissioningStatus, BoqItem, ProjectSettings, AppUser } from '../types';
import { AUTH_STORAGE_KEY, canEditSchedule, canSignApproval } from '../services/authService';
import { initialCables, boqSummary, projectMeta } from '../data/cableData';
import { fetchLiveSheetData, LiveSyncResult } from '../services/sheetLiveSync';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'volttrack_cables_schedule_state_v3_exact_phases';
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
  login: (user: AppUser) => void;
  logout: () => void;
  canEdit: boolean;
  canApproveLevel: (level: 1 | 2 | 3) => boolean;
  
  // Real-time Live Sync State
  isLiveSyncEnabled: boolean;
  setIsLiveSyncEnabled: (enabled: boolean) => void;
  liveSyncIntervalSeconds: number;
  setLiveSyncIntervalSeconds: (seconds: number) => void;
  lastLiveSyncTimestamp: string | null;
  liveSyncStatus: 'live' | 'syncing' | 'error' | 'paused';
  liveSyncError: string | null;
  manualRefreshFromSheet: () => Promise<void>;

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
  updateApprovers: (id: string, level: 1 | 2 | 3, name: string) => void;
  updateCable: (id: string, updates: Partial<CableEntry>) => void;
  importSpreadsheetData: (newCables: CableEntry[]) => void;
  resetToOriginalSpreadsheet: () => void;
  updateSettings: (newSettings: Partial<ProjectSettings>) => void;
  uploadDriveDrawing: (file: File) => Promise<string | null>;

  // Sync state
  isSyncing: boolean;
  setIsSyncing: (s: boolean) => void;
  triggerGoogleSync: (direction: 'push' | 'pull') => Promise<boolean>;
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
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load local storage:', e);
    }
    return initialCables;
  });

  const [boq] = useState<BoqItem[]>(boqSummary);
  const [settings, setSettings] = useState<ProjectSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...projectMeta,
          ...parsed,
          webAppUrl: (parsed.webAppUrl && parsed.webAppUrl.trim()) ? parsed.webAppUrl : (projectMeta.webAppUrl || '')
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

  // Real-Time Live Sync Settings
  const [isLiveSyncEnabled, setIsLiveSyncEnabled] = useState<boolean>(true);
  const [liveSyncIntervalSeconds, setLiveSyncIntervalSeconds] = useState<number>(10);
  const [lastLiveSyncTimestamp, setLastLiveSyncTimestamp] = useState<string | null>(null);
  const [liveSyncStatus, setLiveSyncStatus] = useState<'live' | 'syncing' | 'error' | 'paused'>('live');
  const [liveSyncError, setLiveSyncError] = useState<string | null>(null);

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

  const [isSyncing, setIsSyncing] = useState(false);
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

  const performLiveSync = async (silent = true): Promise<LiveSyncResult> => {
    setLiveSyncStatus('syncing');
    const res = await fetchLiveSheetData(settings.spreadsheetUrl, settings.webAppUrl);

    if (res.success && res.cables && res.cables.length > 0) {
      setLastLiveSyncTimestamp(res.timestamp);
      setLiveSyncStatus('live');
      setLiveSyncError(null);

      setCables(prevCables => {
        const prevIdMap = new Map(prevCables.map(c => [c.id, c]));
        const prevTagMap = new Map(prevCables.map(c => [c.cableTag, c]));
        const merged = res.cables!.map(incoming => {
          const existing = prevIdMap.get(incoming.id) || prevTagMap.get(incoming.cableTag);
          return {
            ...incoming,
            drawingUrl: incoming.drawingUrl || existing?.drawingUrl,
            notes: incoming.notes || existing?.notes
          };
        });

        if (selectedCable) {
          const updatedSelected = merged.find(c => c.id === selectedCable.id || c.cableTag === selectedCable.cableTag);
          if (updatedSelected) setSelectedCable(updatedSelected);
        }

        return merged;
      });

      if (!silent) {
        showToast(`Real-time update: Synced ${res.cables.length} cables from sheet!`, 'success');
      }
    } else {
      setLiveSyncStatus('error');
      setLiveSyncError(res.error || 'Unable to fetch from sheet');
      if (!silent) {
        showToast(res.error || 'Failed to update from sheet.', 'warning');
      }
    }

    return res;
  };

  const manualRefreshFromSheet = async () => {
    showToast('Fetching latest updates from Google Sheet...', 'info');
    await performLiveSync(false);
  };

  const pollTimerRef = useRef<any>(null);

  useEffect(() => {
    if (!isLiveSyncEnabled) {
      setLiveSyncStatus('paused');
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    performLiveSync(true);

    const intervalMs = Math.max(5, liveSyncIntervalSeconds) * 1000;
    pollTimerRef.current = setInterval(() => {
      performLiveSync(true);
    }, intervalMs);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isLiveSyncEnabled, liveSyncIntervalSeconds, settings.spreadsheetUrl, settings.webAppUrl]);

  const [lastExcelSaveTime, setLastExcelSaveTime] = useState<string | null>(null);
  const isInitialMount = useRef(true);
  const saveDebounceTimer = useRef<any>(null);

  // Sync cable changes to Google Sheet Web App (if URL configured)
  const lastMissingWebAppAlert = useRef<number>(0);
  const syncCableToGoogleSheet = async (cable: CableEntry) => {
    if (!settings.webAppUrl || !settings.webAppUrl.trim()) {
      const now = Date.now();
      if (now - lastMissingWebAppAlert.current > 15000) {
        lastMissingWebAppAlert.current = now;
        showToast('Tip: Connect Google Apps Script in Settings ⚙️ to save directly into Google Sheet cells.', 'info');
      }
      return;
    }

    try {
      // 1. Send via GET query params (mode: no-cors bypasses cross-origin 302 redirects)
      const url = new URL(settings.webAppUrl.trim());
      url.searchParams.set('action', 'updateCable');
      url.searchParams.set('cableTag', cable.cableTag);
      url.searchParams.set('cableLayingStatus', cable.cableLayingStatus);
      url.searchParams.set('cableLayingRemarks', cable.cableLayingRemarks || '');
      url.searchParams.set('preCommissioningStatus', cable.preCommissioningStatus);
      url.searchParams.set('preCommissioningRemarks', cable.preCommissioningRemarks || '');
      url.searchParams.set('commissioningStatus', cable.commissioningStatus);
      url.searchParams.set('commissioningRemarks', cable.commissioningRemarks || '');
      url.searchParams.set('approvedBy1', cable.approvedBy1 || '');
      url.searchParams.set('approvedBy2', cable.approvedBy2 || '');
      url.searchParams.set('approvedBy3', cable.approvedBy3 || '');
      url.searchParams.set('_t', Date.now().toString());

      fetch(url.toString(), {
        method: 'GET',
        mode: 'no-cors'
      }).catch(() => {});

      // 2. Also send via POST payload for complete coverage
      fetch(settings.webAppUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'updateCable',
          ...cable
        })
      }).catch(() => {});

      console.log(`[Google Sheet Two-Way Write] Dispatched update for ${cable.cableTag} to Google Sheet`);
    } catch (e) {
      console.warn(`[Google Sheet Write Notice]`, e);
    }
  };

  // Check for Web App URL in URL query parameters on initial load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const apiParam = params.get('api');
      if (apiParam && apiParam.startsWith('http')) {
        updateSettings({ webAppUrl: apiParam });
        showToast('Google Sheet Web App URL connected from link!', 'success');
      }
    } catch (e) {}
  }, []);

  // Auto-save on edit: writes locally if server exists and tracks save timestamp
  useEffect(() => {
    setLastExcelSaveTime(new Date().toLocaleTimeString());

    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetch('/api/save-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cables })
      }).catch(() => {});
      return;
    }

    if (saveDebounceTimer.current) clearTimeout(saveDebounceTimer.current);

    saveDebounceTimer.current = setTimeout(() => {
      fetch('/api/save-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cables })
      }).catch(() => {});
    }, 350);

    return () => {
      if (saveDebounceTimer.current) clearTimeout(saveDebounceTimer.current);
    };
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
        'Cable Laying Remarks': c.cableLayingRemarks || '',
        'Pre-Commissioning Status': c.preCommissioningStatus || 'Pending',
        'Pre-Commissioning Remarks': c.preCommissioningRemarks || '',
        'Commissioning Status': c.commissioningStatus || 'Pending',
        'Commissioning Remarks': c.commissioningRemarks || '',
        'Approve: Nayem Siddik (Sr. Engr)': c.approvedBy1 || '',
        'Approve: Mossadek Hossain (Sr. Engr)': c.approvedBy2 || '',
        'Approve: Md Fahad (Manager PP)': c.approvedBy3 || '',
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

  // Actions for 3 Stages & Approvals with Real-time Two-Way Write
  const updateCableLayingStatus = (id: string, status: CableLayingStatus, remarks?: string) => {
    if (!canEdit) {
      showToast('Authentication required: Please log in as Senior Engineer or Admin to edit Cable Laying.', 'warning');
      setIsLoginModalOpen(true);
      return;
    }
    let targetUpdated: CableEntry | null = null;
    setCables(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { 
          ...c, 
          cableLayingStatus: status, 
          cableLayingRemarks: remarks !== undefined ? remarks : c.cableLayingRemarks,
          updatedAt: new Date().toISOString() 
        };
        targetUpdated = updated;
        if (selectedCable && selectedCable.id === id) setSelectedCable(updated);
        return updated;
      }
      return c;
    }));
    if (targetUpdated) syncCableToGoogleSheet(targetUpdated);
    showToast(`Cable Laying status set to "${status}" (Saving to Excel...)`, 'success');
  };

  const updatePreCommissioningStatus = (id: string, status: CommissioningStatus, remarks?: string) => {
    if (!canEdit) {
      showToast('Authentication required: Please log in as Senior Engineer or Admin to edit Pre-Commissioning.', 'warning');
      setIsLoginModalOpen(true);
      return;
    }
    let targetUpdated: CableEntry | null = null;
    setCables(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { 
          ...c, 
          preCommissioningStatus: status, 
          preCommissioningRemarks: remarks !== undefined ? remarks : c.preCommissioningRemarks,
          updatedAt: new Date().toISOString() 
        };
        targetUpdated = updated;
        if (selectedCable && selectedCable.id === id) setSelectedCable(updated);
        return updated;
      }
      return c;
    }));
    if (targetUpdated) syncCableToGoogleSheet(targetUpdated);
    showToast(`Pre-Commissioning status set to "${status}" (Saving to Excel...)`, 'success');
  };

  const updateCommissioningStatus = (id: string, status: CommissioningStatus, remarks?: string) => {
    if (!canEdit) {
      showToast('Authentication required: Please log in as Senior Engineer or Admin to edit Commissioning.', 'warning');
      setIsLoginModalOpen(true);
      return;
    }
    let targetUpdated: CableEntry | null = null;
    setCables(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { 
          ...c, 
          commissioningStatus: status, 
          commissioningRemarks: remarks !== undefined ? remarks : c.commissioningRemarks,
          updatedAt: new Date().toISOString() 
        };
        targetUpdated = updated;
        if (selectedCable && selectedCable.id === id) setSelectedCable(updated);
        return updated;
      }
      return c;
    }));
    if (targetUpdated) syncCableToGoogleSheet(targetUpdated);
    showToast(`Commissioning status set to "${status}" (Saving to Excel...)`, 'success');
  };

  const updateApprovers = (id: string, level: 1 | 2 | 3, name: string) => {
    if (!canApproveLevel(level)) {
      const allowedNames = { 1: 'Nayem Siddik (Senior Engineer)', 2: 'Mossadek Hossain (Senior Engineer)', 3: 'Md Fahad (Manager PP)' };
      showToast(`Access Restricted: Level ${level} sign-off can only be approved by ${allowedNames[level]} or Admin.`, 'warning');
      setIsLoginModalOpen(true);
      return;
    }
    let targetUpdated: CableEntry | null = null;
    setCables(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { 
          ...c, 
          approvedBy1: level === 1 ? name : c.approvedBy1,
          approvedBy2: level === 2 ? name : c.approvedBy2,
          approvedBy3: level === 3 ? name : c.approvedBy3,
          updatedAt: new Date().toISOString() 
        };
        targetUpdated = updated;
        if (selectedCable && selectedCable.id === id) setSelectedCable(updated);
        return updated;
      }
      return c;
    }));
    if (targetUpdated) syncCableToGoogleSheet(targetUpdated);
    showToast(`Sign-off updated for Level ${level} (Saving to Excel...)`, 'success');
  };

  const updateCable = (id: string, updates: Partial<CableEntry>) => {
    if (!canEdit) {
      showToast('Authentication required: Please log in to edit cable data.', 'warning');
      setIsLoginModalOpen(true);
      return;
    }
    let targetUpdated: CableEntry | null = null;
    setCables(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, ...updates, updatedAt: new Date().toISOString() };
        targetUpdated = updated;
        if (selectedCable && selectedCable.id === id) {
          setSelectedCable(updated);
        }
        return updated;
      }
      return c;
    }));
    if (targetUpdated) syncCableToGoogleSheet(targetUpdated);
    showToast(`Cable updated & storing to Excel...`, 'info');
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

  const uploadDriveDrawing = async (file: File): Promise<string | null> => {
    if (!settings.webAppUrl) {
      showToast('Connect Google Apps Script Web App in Settings to upload directly to Drive folder.', 'warning');
      return null;
    }

    setIsSyncing(true);
    showToast('Uploading to Google Drive Folder...', 'info');

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      const res = await fetch(settings.webAppUrl, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'uploadFile',
          fileName: `Drawing_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
          mimeType: file.type || 'image/jpeg',
          base64Data
        })
      });

      const json = await res.json();
      if (json.success && json.url) {
        showToast('Uploaded to Google Drive!', 'success');
        return json.url;
      } else {
        showToast(json.error || 'Upload failed', 'error');
        return null;
      }
    } catch (e: any) {
      showToast(`Upload failed: ${e.message}`, 'error');
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  const triggerGoogleSync = async (direction: 'push' | 'pull'): Promise<boolean> => {
    if (!settings.webAppUrl) {
      showToast('Please set your Google Apps Script Web App URL first.', 'warning');
      return false;
    }

    setIsSyncing(true);
    showToast(direction === 'push' ? 'Pushing cable schedule to Google Sheets...' : 'Pulling schedule from Google Sheets...', 'info');

    try {
      if (direction === 'push') {
        const res = await fetch(settings.webAppUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'syncCables',
            cables: cables,
            settings: settings
          })
        });

        const json = await res.json();
        if (json.success) {
          const nowStr = new Date().toLocaleTimeString();
          setSettings(prev => ({ ...prev, lastSyncTimestamp: nowStr }));
          showToast(`Google Sheets updated successfully at ${nowStr}!`, 'success');
          return true;
        } else {
          showToast(`Push failed: ${json.error || 'Server error'}`, 'error');
          return false;
        }
      } else {
        const url = new URL(settings.webAppUrl);
        url.searchParams.set('action', 'getCables');
        const res = await fetch(url.toString(), { method: 'GET', mode: 'cors' });
        const json = await res.json();
        if (json.success && json.data && json.data.cables) {
          setCables(json.data.cables);
          const nowStr = new Date().toLocaleTimeString();
          setSettings(prev => ({ ...prev, lastSyncTimestamp: nowStr }));
          showToast(`Pulled ${json.data.cables.length} cables from Google Sheets!`, 'success');
          return true;
        } else {
          showToast(`Pull error: ${json.error || 'No cables returned'}`, 'error');
          return false;
        }
      }
    } catch (err: any) {
      showToast(`Sync exception: ${err.message}`, 'error');
      return false;
    } finally {
      setIsSyncing(false);
    }
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
      login,
      logout,
      canEdit,
      canApproveLevel,
      isLiveSyncEnabled,
      setIsLiveSyncEnabled,
      liveSyncIntervalSeconds,
      setLiveSyncIntervalSeconds,
      lastLiveSyncTimestamp,
      liveSyncStatus,
      liveSyncError,
      manualRefreshFromSheet,
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
      importSpreadsheetData,
      resetToOriginalSpreadsheet,
      updateSettings,
      uploadDriveDrawing,
      isSyncing,
      setIsSyncing,
      triggerGoogleSync,
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
