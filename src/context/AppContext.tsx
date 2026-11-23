import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { 
  CableEntry, 
  CableLayingStatus, 
  CableTerminationStatus,
  CommissioningStatus, 
  BoqItem, 
  ProjectSettings, 
  AppUser,
  WorkAssignment,
  STAFF_MEMBERS,
  StaffEditRecord,
  StaffAccountItem
} from '../types';
import { 
  AUTH_STORAGE_KEY, 
  canEditSchedule, 
  canSignApproval, 
  isStaffProfile,
  loadStoredStaffAccounts,
  saveStoredStaffAccounts,
  DEFAULT_STAFF_ACCOUNTS
} from '../services/authService';
import { initialCables, boqSummary, projectMeta } from '../data/cableData';
import { INITIAL_EDIT_HISTORY } from '../data/editHistoryData';
import { 
  getSupabaseClient, 
  fetchAllCablesFromSupabase, 
  updateCableInSupabase, 
  bulkSeedCablesToSupabase,
  mapDbRowToCableEntry,
  sortCablesInOrder,
  fetchWorkAssignmentsFromSupabase,
  saveWorkAssignmentsToSupabase,
  WORK_ASSIGNMENTS_RECORD_ID,
  fetchEditHistoryFromSupabase,
  saveEditHistoryToSupabase,
  EDIT_HISTORY_RECORD_ID,
  fetchStaffAccountsFromSupabase,
  saveStaffAccountsToSupabase,
  STAFF_ACCOUNTS_RECORD_ID,
  fetchCustomStatusesFromSupabase,
  saveCustomStatusesToSupabase,
  CUSTOM_STATUSES_RECORD_ID
} from '../services/supabaseService';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'volttrack_cables_schedule_state_v4_uploaded';
const SETTINGS_KEY = 'volttrack_settings_state_v3';
const ASSIGNMENTS_STORAGE_KEY = 'volttrack_work_assignments_v1';
const EDIT_HISTORY_STORAGE_KEY = 'volttrack_staff_edit_history_v1';
const CUSTOM_STATUSES_STORAGE_KEY = 'volttrack_custom_status_options_v1';

export const DEFAULT_STATUS_OPTIONS: string[] = [
  'Complete By VEL',
  'Complete By Bargen',
  'Progress',
  'Pending',
  'Scope of Bargen',
  'Scope of VEL',
  'Scope of Akij',
  'Out of Scope',
  'N/A'
];

export const INITIAL_WORK_ASSIGNMENTS: WorkAssignment[] = [
  {
    id: 'WRK-2026-001',
    title: 'Pre-Commissioning Megger Test on Trafo Feeder PCC1W01*',
    description: 'Perform 2.5kV insulation resistance (megger) test between phases and earth before connection to Auxiliary Transformer 1. Record all readings in log.',
    taskType: 'Insulation & Megger Test',
    priority: 'High',
    status: 'In Progress',
    assignedToName: 'Nayem Siddik',
    assignedToUsername: 'Nayem',
    assignedByName: 'Md Fahad (Manager PP)',
    assignedByUsername: 'Fahad',
    cableTag: 'PCC1W01*',
    cableId: 'LV-001',
    section: 'PCC (Power Control Center)',
    scheduleType: 'LV Power Cable Schedule',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    notes: 'Safety clearance obtained. Trafo secondary isolated.'
  },
  {
    id: 'WRK-2026-002',
    title: 'Inspect Generator Junction Box Cable Clamping',
    description: 'Verify 4C x 2.5 2XWY cable gland tight seal and wire ferrules numbering at Generator Junction Box for G1W01.',
    taskType: 'Glanding & Termination',
    priority: 'Urgent',
    status: 'Assigned',
    assignedToName: 'Mossadek Hossain',
    assignedToUsername: 'Mossadek',
    assignedByName: 'Md Fahad (Manager PP)',
    assignedByUsername: 'Fahad',
    cableTag: 'G1W01',
    cableId: 'CTRL-001',
    section: 'GENERATOR CONTROL CABINET GCC-1',
    scheduleType: 'Control Cable Schedule',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  },
  {
    id: 'WRK-2026-003',
    title: 'Final Commissioning Check for EMCC-1 Incomer',
    description: 'Verify 3.5C x 240 YFY voltage drop and phase sequencing before energization of PCC1W03.',
    taskType: 'Commissioning',
    priority: 'High',
    status: 'Completed',
    assignedToName: 'Md Fahad',
    assignedToUsername: 'Fahad',
    assignedByName: 'Nayem Siddik (Sr. Engr)',
    assignedByUsername: 'Nayem',
    cableTag: 'PCC1W03',
    cableId: 'LV-003',
    section: 'PCC (Power Control Center)',
    scheduleType: 'LV Power Cable Schedule',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    completedAt: new Date(Date.now() - 86400000).toISOString(),
    dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    completionRemarks: 'Phase rotation verified L1-L2-L3 clockwise. Ready for full energization.'
  }
];

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppContextType {
  cables: CableEntry[];
  boq: BoqItem[];
  settings: ProjectSettings;
  activeView: 'schedule' | 'assignments' | 'boq' | 'analytics' | 'specs';
  setActiveView: (view: 'schedule' | 'assignments' | 'boq' | 'analytics' | 'specs') => void;
  selectedCable: CableEntry | null;
  setSelectedCable: (cable: CableEntry | null) => void;

  // Work Assignments
  workAssignments: WorkAssignment[];
  isAssignModalOpen: boolean;
  setIsAssignModalOpen: (open: boolean) => void;
  preselectedCableForAssignment: CableEntry | null;
  setPreselectedCableForAssignment: (cable: CableEntry | null) => void;
  openAssignWorkModal: (cable?: CableEntry | null) => void;
  createWorkAssignment: (data: Omit<WorkAssignment, 'id' | 'createdAt'>) => Promise<WorkAssignment>;
  updateWorkAssignment: (id: string, updates: Partial<WorkAssignment>) => Promise<boolean>;
  deleteWorkAssignment: (id: string) => Promise<boolean>;
  
  // Authentication & Permissions
  currentUser: AppUser | null;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  profileModalTab: 'profile' | 'history' | 'accounts';
  setProfileModalTab: (tab: 'profile' | 'history' | 'accounts') => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;
  login: (user: AppUser) => void;
  logout: () => void;
  canEdit: boolean;
  isStaff: boolean;
  canApproveLevel: (level: 1 | 2 | 3) => boolean;

  // Staff Credentials & Security (Admin Managed)
  staffAccounts: StaffAccountItem[];
  updateStaffCredentials: (staffId: string, newUsername: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  resetStaffCredentialsToDefault: () => Promise<void>;

  // Custom Dynamic Status Options
  customStatusOptions: string[];
  allStatusOptions: string[];
  addCustomStatusOption: (newOption: string) => Promise<boolean>;
  removeCustomStatusOption: (optionToRemove: string) => Promise<boolean>;

  // Staff Edit History & Audit Logs
  editHistory: StaffEditRecord[];
  recordStaffEdit: (entry: Omit<StaffEditRecord, 'id' | 'timestamp' | 'staffUsername' | 'staffName' | 'staffRole'>) => void;
  clearEditHistory: () => Promise<void>;
  
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
  
  // Progress & Approval Filters
  cableLayingFilter: string;
  setCableLayingFilter: (val: string) => void;
  cableTerminationFilter: string;
  setCableTerminationFilter: (val: string) => void;
  preCommissioningFilter: string;
  setPreCommissioningFilter: (val: string) => void;
  commissioningFilter: string;
  setCommissioningFilter: (val: string) => void;
  approverFilter: string;
  setApproverFilter: (val: string) => void;

  resetAllFilters: () => void;

  // Actions for the stages & approvals
  updateCableLayingStatus: (id: string, status: CableLayingStatus, remarks?: string) => void;
  updateCableTerminationStatus: (id: string, status: CableTerminationStatus, remarks?: string) => void;
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
          return sortCablesInOrder(parsed.map(c => ({
            ...c,
            cableTerminationStatus: c.cableTerminationStatus || 'Pending'
          })));
        }
      }
    } catch (e) {
      console.warn('Failed to load local storage:', e);
    }
    return sortCablesInOrder(initialCables.map(c => ({
      ...c,
      cableTerminationStatus: (c as any).cableTerminationStatus || 'Pending'
    })));
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

  const [activeView, setActiveView] = useState<'schedule' | 'assignments' | 'boq' | 'analytics' | 'specs'>('schedule');
  const [selectedCable, setSelectedCable] = useState<CableEntry | null>(null);

  // Work Assignments State
  const [workAssignments, setWorkAssignments] = useState<WorkAssignment[]>(() => {
    try {
      const saved = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return INITIAL_WORK_ASSIGNMENTS;
  });

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [preselectedCableForAssignment, setPreselectedCableForAssignment] = useState<CableEntry | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(workAssignments));
    } catch (e) {}
  }, [workAssignments]);

  // Authentication state (Default is public Viewer)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'history' | 'accounts'>('profile');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Staff Credentials Accounts State (Admin Managed)
  const [staffAccounts, setStaffAccounts] = useState<StaffAccountItem[]>(() => loadStoredStaffAccounts());

  // Custom Dynamic Status Options State
  const [customStatusOptions, setCustomStatusOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_STATUSES_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const allStatusOptions = useMemo(() => {
    const list = [...DEFAULT_STATUS_OPTIONS];
    for (const opt of customStatusOptions) {
      if (!list.includes(opt)) list.push(opt);
    }
    return list;
  }, [customStatusOptions]);

  const addCustomStatusOption = async (newOption: string): Promise<boolean> => {
    const clean = String(newOption || '').trim();
    if (!clean) {
      showToast('Status name cannot be empty', 'warning');
      return false;
    }
    if (allStatusOptions.some(opt => opt.toLowerCase() === clean.toLowerCase())) {
      showToast(`Status option "${clean}" already exists!`, 'info');
      return true;
    }

    const updated = [...customStatusOptions, clean];
    setCustomStatusOptions(updated);
    try {
      localStorage.setItem(CUSTOM_STATUSES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}

    await saveCustomStatusesToSupabase(updated);
    showToast(`Added new status option: "${clean}"`, 'success');
    return true;
  };

  const removeCustomStatusOption = async (optionToRemove: string): Promise<boolean> => {
    const updated = customStatusOptions.filter(opt => opt !== optionToRemove);
    setCustomStatusOptions(updated);
    try {
      localStorage.setItem(CUSTOM_STATUSES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
    await saveCustomStatusesToSupabase(updated);
    showToast(`Removed custom status option: "${optionToRemove}"`, 'info');
    return true;
  };

  // Maximum number of edit history records retained (auto-prunes older records)
  const MAX_EDIT_HISTORY_RECORDS = 500;

  // Staff Edit History & Audit Logs (recent 500 records)
  const [editHistory, setEditHistory] = useState<StaffEditRecord[]>(() => {
    try {
      const saved = localStorage.getItem(EDIT_HISTORY_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, MAX_EDIT_HISTORY_RECORDS);
      }
    } catch (e) {}
    return INITIAL_EDIT_HISTORY.slice(0, MAX_EDIT_HISTORY_RECORDS);
  });

  const recordStaffEdit = (entry: Omit<StaffEditRecord, 'id' | 'timestamp' | 'staffUsername' | 'staffName' | 'staffRole'>) => {
    const staff = currentUser || {
      username: 'Staff',
      name: 'Staff Member',
      title: 'Engineer'
    };

    const newRecord: StaffEditRecord = {
      id: `EDT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      staffUsername: staff.username,
      staffName: staff.name,
      staffRole: staff.title,
      ...entry
    };

    setEditHistory(prev => {
      // Automatically keep the most recent 500 records, older records are deleted
      const next = [newRecord, ...prev].slice(0, MAX_EDIT_HISTORY_RECORDS);
      try {
        localStorage.setItem(EDIT_HISTORY_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      saveEditHistoryToSupabase(next).catch(err => console.warn('Supabase edit history sync error:', err));
      return next;
    });
  };

  const clearEditHistory = async () => {
    setEditHistory([]);
    try {
      localStorage.setItem(EDIT_HISTORY_STORAGE_KEY, JSON.stringify([]));
    } catch (e) {}
    await saveEditHistoryToSupabase([]);
    showToast('Edit history cleared', 'info');
  };

  const updateStaffCredentials = async (
    staffId: string,
    newUsername: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    // Strict Admin check: ONLY Admin has permission to modify credentials
    if (currentUser?.role !== 'admin') {
      return {
        success: false,
        message: 'Permission Denied: Only the System Administrator can change usernames and passwords.'
      };
    }

    const uClean = String(newUsername || '').trim();
    const pClean = String(newPassword || '').trim();

    if (!uClean) {
      return { success: false, message: 'Username cannot be empty.' };
    }
    if (pClean.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long.' };
    }

    // Check duplicate username with other accounts
    const duplicate = staffAccounts.find(
      acc => acc.id !== staffId && acc.username.toLowerCase() === uClean.toLowerCase()
    );
    if (duplicate) {
      return {
        success: false,
        message: `Username "${uClean}" is already in use by ${duplicate.name}. Please choose a unique username.`
      };
    }

    const targetAccount = staffAccounts.find(acc => acc.id === staffId);
    if (!targetAccount) {
      return { success: false, message: 'Staff profile not found.' };
    }

    const oldUsername = targetAccount.username;
    const updatedAccounts = staffAccounts.map(acc => {
      if (acc.id === staffId) {
        return {
          ...acc,
          username: uClean,
          password: pClean,
          lastUpdated: new Date().toISOString()
        };
      }
      return acc;
    });

    setStaffAccounts(updatedAccounts);
    saveStoredStaffAccounts(updatedAccounts);
    saveStaffAccountsToSupabase(updatedAccounts).catch(err =>
      console.warn('Supabase staff accounts sync error:', err)
    );

    // If Admin updated their own account, keep active currentUser in sync
    if (targetAccount.id === 'arman' || (currentUser.username && currentUser.username.toLowerCase() === oldUsername.toLowerCase())) {
      const updatedSelf: AppUser = {
        ...currentUser,
        username: uClean
      };
      setCurrentUser(updatedSelf);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedSelf));
      } catch (e) {}
    }

    // Audit record in edit history
    recordStaffEdit({
      targetType: 'General',
      targetIdentifier: targetAccount.name,
      action: 'Updated Staff Credentials',
      fieldChanged: 'Username/Password',
      oldValue: `User: ${oldUsername}`,
      newValue: `User: ${uClean}`,
      notes: `Administrator modified credentials for ${targetAccount.name}`
    });

    showToast(`Credentials updated for ${targetAccount.name}!`, 'success');
    return {
      success: true,
      message: `Credentials for ${targetAccount.name} successfully updated!`
    };
  };

  const resetStaffCredentialsToDefault = async () => {
    if (currentUser?.role !== 'admin') {
      showToast('Permission Denied: Only Admin can reset credentials.', 'warning');
      return;
    }
    setStaffAccounts(DEFAULT_STAFF_ACCOUNTS);
    saveStoredStaffAccounts(DEFAULT_STAFF_ACCOUNTS);
    await saveStaffAccountsToSupabase(DEFAULT_STAFF_ACCOUNTS);

    recordStaffEdit({
      targetType: 'General',
      targetIdentifier: 'All Staff Accounts',
      action: 'Reset Credentials to Default',
      fieldChanged: 'Staff Passwords',
      notes: 'Administrator reset all staff usernames and passwords to system defaults'
    });

    showToast('All staff credentials reset to factory defaults.', 'info');
  };

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
  const isStaff = isStaffProfile(currentUser);
  const canApproveLevel = (level: 1 | 2 | 3) => canSignApproval(currentUser, level);

  const openAssignWorkModal = (cable?: CableEntry | null) => {
    if (!isStaff) {
      showToast('Assign Work option is only accessible to Staff profiles. Please log in.', 'error');
      setIsLoginModalOpen(true);
      return;
    }
    setPreselectedCableForAssignment(cable || null);
    setIsAssignModalOpen(true);
  };

  const [dbStatus, setDbStatus] = useState<'connected' | 'connecting' | 'standby'>('connecting');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleTypeFilter, setScheduleTypeFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [fromLocationFilter, setFromLocationFilter] = useState('All');
  const [toLocationFilter, setToLocationFilter] = useState('All');
  const [cableSizeFilter, setCableSizeFilter] = useState('All');
  const [cableTypeFilter, setCableTypeFilter] = useState('All');

  // Exact Stages & Approval Filters
  const [cableLayingFilter, setCableLayingFilter] = useState('All');
  const [cableTerminationFilter, setCableTerminationFilter] = useState('All');
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

    // 1b. Fetch Work Assignments from Supabase
    fetchWorkAssignmentsFromSupabase().then(dbAssignments => {
      if (dbAssignments !== null && Array.isArray(dbAssignments)) {
        setWorkAssignments(dbAssignments);
        try {
          localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(dbAssignments));
        } catch (e) {}
        console.log(`[Supabase DB] Loaded ${dbAssignments.length} work assignments`);
      }
    }).catch(err => console.warn('[Supabase Work Assignments Load Warning]:', err));

    // 1c. Fetch Staff Edit History from Supabase
    fetchEditHistoryFromSupabase().then(dbHistory => {
      if (dbHistory !== null && Array.isArray(dbHistory)) {
        const trimmed = dbHistory.slice(0, MAX_EDIT_HISTORY_RECORDS);
        setEditHistory(trimmed);
        try {
          localStorage.setItem(EDIT_HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
        } catch (e) {}
        console.log(`[Supabase DB] Loaded ${trimmed.length} edit history records (capped at ${MAX_EDIT_HISTORY_RECORDS})`);
      }
    }).catch(err => console.warn('[Supabase Edit History Load Warning]:', err));

    // 1d. Fetch Staff Accounts Credentials from Supabase
    fetchStaffAccountsFromSupabase().then(dbAccounts => {
      if (dbAccounts && Array.isArray(dbAccounts) && dbAccounts.length > 0) {
        setStaffAccounts(dbAccounts);
        saveStoredStaffAccounts(dbAccounts);
        console.log(`[Supabase DB] Loaded ${dbAccounts.length} staff credentials accounts`);
      }
    }).catch(err => console.warn('[Supabase Staff Accounts Load Warning]:', err));

    // 1e. Fetch Custom Status Options from Supabase
    fetchCustomStatusesFromSupabase().then(dbStatuses => {
      if (dbStatuses !== null && Array.isArray(dbStatuses)) {
        setCustomStatusOptions(dbStatuses);
        try {
          localStorage.setItem(CUSTOM_STATUSES_STORAGE_KEY, JSON.stringify(dbStatuses));
        } catch (e) {}
        console.log(`[Supabase DB] Loaded ${dbStatuses.length} custom status options`);
      }
    }).catch(err => console.warn('[Supabase Custom Statuses Load Warning]:', err));

    // 2. Real-Time WebSocket Channel for instant sync across all users
    try {
      const channel = client
        .channel('cables-realtime-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cables' }, (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            // Check if it's work assignments record
            if (payload.new && payload.new.id === WORK_ASSIGNMENTS_RECORD_ID && payload.new.description) {
              try {
                const parsed = JSON.parse(payload.new.description);
                if (Array.isArray(parsed)) {
                  setWorkAssignments(parsed);
                  localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(parsed));
                }
              } catch (e) {}
              return;
            }

            // Check if it's edit history record
            if (payload.new && payload.new.id === EDIT_HISTORY_RECORD_ID && payload.new.description) {
              try {
                const parsed = JSON.parse(payload.new.description);
                if (Array.isArray(parsed)) {
                  const trimmed = parsed.slice(0, MAX_EDIT_HISTORY_RECORDS);
                  setEditHistory(trimmed);
                  localStorage.setItem(EDIT_HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
                }
              } catch (e) {}
              return;
            }

            // Check if it's staff accounts record
            if (payload.new && (payload.new.id === STAFF_ACCOUNTS_RECORD_ID || payload.new.cable_tag === '__STAFF_ACCOUNTS__') && payload.new.description) {
              try {
                const parsed = JSON.parse(payload.new.description);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setStaffAccounts(parsed);
                  saveStoredStaffAccounts(parsed);
                }
              } catch (e) {}
              return;
            }

            // Check if it's custom statuses record
            if (payload.new && (payload.new.id === CUSTOM_STATUSES_RECORD_ID || payload.new.cable_tag === '__CUSTOM_STATUSES__') && payload.new.description) {
              try {
                const parsed = JSON.parse(payload.new.description);
                if (Array.isArray(parsed)) {
                  setCustomStatusOptions(parsed);
                  localStorage.setItem(CUSTOM_STATUSES_STORAGE_KEY, JSON.stringify(parsed));
                }
              } catch (e) {}
              return;
            }

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
    setCableTerminationFilter('All');
    setPreCommissioningFilter('All');
    setCommissioningFilter('All');
    setApproverFilter('All');
    showToast('All filters cleared', 'info');
  };

  // Actions for Stages & Approvals with direct Supabase Database Persistence
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

    recordStaffEdit({
      targetType: 'Cable',
      targetIdentifier: existing.cableTag,
      action: 'Updated Cable Laying Status',
      fieldChanged: 'Cable Laying',
      oldValue: existing.cableLayingStatus,
      newValue: status,
      notes: remarks || undefined
    });
  };

  const updateCableTerminationStatus = async (id: string, status: CableTerminationStatus, remarks?: string) => {
    if (!canEdit) {
      showToast('Authentication required: Please log in as Senior Engineer or Admin to edit Cable Termination.', 'warning');
      setIsLoginModalOpen(true);
      return;
    }

    const existing = cables.find(c => c.id === id);
    if (!existing) return;

    const updated: CableEntry = { 
      ...existing, 
      cableTerminationStatus: status, 
      cableTerminationRemarks: remarks !== undefined ? remarks : existing.cableTerminationRemarks,
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
      showToast(`Cable Termination status set to "${status}" (Saved to Supabase DB)`, 'success');
    } else {
      console.warn('[Supabase Sync Warning]:', res.error);
      showToast(`Saved locally. Supabase DB notice: ${res.error || 'Sync queued'}`, 'info');
    }

    recordStaffEdit({
      targetType: 'Cable',
      targetIdentifier: existing.cableTag,
      action: 'Updated Cable Termination Status',
      fieldChanged: 'Cable Termination',
      oldValue: existing.cableTerminationStatus,
      newValue: status,
      notes: remarks || undefined
    });
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

    recordStaffEdit({
      targetType: 'Cable',
      targetIdentifier: existing.cableTag,
      action: 'Updated Pre-Commissioning Status',
      fieldChanged: 'Pre-Commissioning',
      oldValue: existing.preCommissioningStatus,
      newValue: status,
      notes: remarks || undefined
    });
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

    recordStaffEdit({
      targetType: 'Cable',
      targetIdentifier: existing.cableTag,
      action: 'Updated Commissioning Status',
      fieldChanged: 'Commissioning',
      oldValue: existing.commissioningStatus,
      newValue: status,
      notes: remarks || undefined
    });
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

    recordStaffEdit({
      targetType: 'Approval',
      targetIdentifier: existing.cableTag,
      action: `Approved Level ${level} Engineering Sign-Off`,
      fieldChanged: `approvedBy${level}`,
      oldValue: (level === 1 ? existing.approvedBy1 : level === 2 ? existing.approvedBy2 : existing.approvedBy3) || 'Pending Sign-Off',
      newValue: name,
      notes: note || undefined
    });
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

    const changedFields = Object.keys(updates).join(', ');
    recordStaffEdit({
      targetType: 'Cable',
      targetIdentifier: existing.cableTag,
      action: 'Modified Cable Specifications',
      fieldChanged: changedFields,
      notes: `Updated fields: ${changedFields}`
    });
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

  const createWorkAssignment = async (data: Omit<WorkAssignment, 'id' | 'createdAt'>): Promise<WorkAssignment> => {
    if (!isStaff) {
      showToast('Staff profile required to assign work.', 'error');
      setIsLoginModalOpen(true);
      throw new Error('Staff profile required to assign work.');
    }

    const id = `WRK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const newAssignment: WorkAssignment = {
      ...data,
      id,
      createdAt: new Date().toISOString()
    };

    const nextAssignments = [newAssignment, ...workAssignments];
    setWorkAssignments(nextAssignments);
    try {
      localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(nextAssignments));
    } catch (e) {}

    // Link with cable in schedule if specified
    if (data.cableId || data.cableTag) {
      setCables(prev => prev.map(c => {
        if ((data.cableId && c.id === data.cableId) || (data.cableTag && c.cableTag === data.cableTag)) {
          return { ...c, assignedTo: data.assignedToName, assignedWorkId: id };
        }
        return c;
      }));
    }

    try {
      await saveWorkAssignmentsToSupabase(nextAssignments);
    } catch (err) {
      console.warn('Failed to sync assignments to Supabase:', err);
    }

    recordStaffEdit({
      targetType: 'Work Assignment',
      targetIdentifier: data.cableTag || newAssignment.id,
      action: 'Assigned Work to Staff',
      fieldChanged: 'Work Assignment',
      newValue: `${data.title} -> ${data.assignedToName}`,
      notes: `Assigned to ${data.assignedToName} (${data.priority} priority, Task: ${data.taskType})`
    });

    showToast(`Work "${data.title}" assigned to ${data.assignedToName} successfully!`, 'success');
    return newAssignment;
  };

  const updateWorkAssignment = async (id: string, updates: Partial<WorkAssignment>): Promise<boolean> => {
    if (!isStaff) {
      showToast('Staff profile required to update work assignments.', 'error');
      setIsLoginModalOpen(true);
      return false;
    }

    const nextAssignments = workAssignments.map(a => a.id === id ? { ...a, ...updates } : a);
    setWorkAssignments(nextAssignments);
    try {
      localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(nextAssignments));
    } catch (e) {}

    // If reassigning, update cable's assignedTo
    if (updates.assignedToName) {
      const assignment = workAssignments.find(a => a.id === id);
      if (assignment?.cableTag || assignment?.cableId) {
        setCables(prev => prev.map(c => {
          if ((assignment.cableId && c.id === assignment.cableId) || (assignment.cableTag && c.cableTag === assignment.cableTag)) {
            return { ...c, assignedTo: updates.assignedToName };
          }
          return c;
        }));
      }
    }

    const existingAssignment = workAssignments.find(a => a.id === id);
    recordStaffEdit({
      targetType: 'Work Assignment',
      targetIdentifier: existingAssignment?.cableTag || existingAssignment?.title || id,
      action: updates.status ? `Work Status Changed to ${updates.status}` : 'Updated Work Assignment',
      fieldChanged: Object.keys(updates).join(', '),
      oldValue: existingAssignment?.status,
      newValue: updates.status || updates.assignedToName,
      notes: updates.completionRemarks ? `Remarks: ${updates.completionRemarks}` : undefined
    });

    try {
      await saveWorkAssignmentsToSupabase(nextAssignments);
    } catch (e) {
      console.warn('Failed to sync updated assignment to Supabase:', e);
    }
    showToast('Work assignment updated successfully!', 'success');
    return true;
  };

  const deleteWorkAssignment = async (id: string): Promise<boolean> => {
    if (!isStaff) {
      showToast('Staff profile required to delete work assignments.', 'error');
      setIsLoginModalOpen(true);
      return false;
    }

    const assignment = workAssignments.find(a => a.id === id);
    const nextAssignments = workAssignments.filter(a => a.id !== id);
    setWorkAssignments(nextAssignments);
    try {
      localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(nextAssignments));
    } catch (e) {}

    if (assignment?.cableTag || assignment?.cableId) {
      setCables(prev => {
        const next = prev.map(c => {
          if ((assignment.cableId && c.id === assignment.cableId) || (assignment.cableTag && c.cableTag === assignment.cableTag)) {
            return { ...c, assignedTo: undefined, assignedWorkId: undefined };
          }
          return c;
        });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }

    recordStaffEdit({
      targetType: 'Work Assignment',
      targetIdentifier: assignment?.cableTag || assignment?.title || id,
      action: 'Deleted Work Assignment',
      fieldChanged: 'Work Assignment',
      oldValue: assignment?.title,
      newValue: 'Removed'
    });

    try {
      await saveWorkAssignmentsToSupabase(nextAssignments);
    } catch (e) {
      console.warn('Failed to sync deleted assignment to Supabase:', e);
    }
    showToast('Work assignment removed', 'info');
    return true;
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
      workAssignments,
      isAssignModalOpen,
      setIsAssignModalOpen,
      preselectedCableForAssignment,
      setPreselectedCableForAssignment,
      openAssignWorkModal,
      createWorkAssignment,
      updateWorkAssignment,
      deleteWorkAssignment,
      currentUser,
      isLoginModalOpen,
      setIsLoginModalOpen,
      profileModalTab,
      setProfileModalTab,
      isImportModalOpen,
      setIsImportModalOpen,
      login,
      logout,
      canEdit,
      isStaff,
      canApproveLevel,
      staffAccounts,
      updateStaffCredentials,
      resetStaffCredentialsToDefault,
      customStatusOptions,
      allStatusOptions,
      addCustomStatusOption,
      removeCustomStatusOption,
      editHistory,
      recordStaffEdit,
      clearEditHistory,
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
      cableTerminationFilter,
      setCableTerminationFilter,
      preCommissioningFilter,
      setPreCommissioningFilter,
      commissioningFilter,
      setCommissioningFilter,
      approverFilter,
      setApproverFilter,
      resetAllFilters,
      updateCableLayingStatus,
      updateCableTerminationStatus,
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
