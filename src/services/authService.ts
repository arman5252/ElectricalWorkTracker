import { AppUser, StaffAccountItem, UserRole } from '../types';

export const DEFAULT_STAFF_ACCOUNTS: StaffAccountItem[] = [
  {
    id: 'arman',
    name: 'Arman (Admin)',
    title: 'System Administrator',
    role: 'admin',
    username: 'arman',
    password: 'arman2026**',
    approvalKey: 'all',
    approvalName: 'All Approvals',
    aliases: ['admin']
  },
  {
    id: 'nayem',
    name: 'Nayem Siddik',
    title: 'Senior Engineer',
    role: 'engineer',
    username: 'Nayem',
    password: 'Nayem2026',
    approvalKey: 'approvedBy1',
    approvalName: 'Nayem Siddik (Sr. Engr)',
    aliases: ['naim', 'naimz']
  },
  {
    id: 'mossadek',
    name: 'Mossadek Hossain',
    title: 'Senior Engineer',
    role: 'engineer',
    username: 'Mossadek',
    password: 'Mossadek2026',
    approvalKey: 'approvedBy2',
    approvalName: 'Mossadek Hossain (Sr. Engr)',
    aliases: ['mosaddik', 'mosadek']
  },
  {
    id: 'fahad',
    name: 'Md Fahad',
    title: 'Manager PP',
    role: 'manager',
    username: 'Fahad',
    password: 'Fahad2026',
    approvalKey: 'approvedBy3',
    approvalName: 'Md Fahad (Manager PP)',
    aliases: ['fahad-sir']
  }
];

export const STAFF_ACCOUNTS_STORAGE_KEY = 'volttrack_staff_accounts_credentials';
export const AUTH_STORAGE_KEY = 'volttrack_auth_session_user';

export function loadStoredStaffAccounts(): StaffAccountItem[] {
  try {
    const saved = localStorage.getItem(STAFF_ACCOUNTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return DEFAULT_STAFF_ACCOUNTS.map(def => {
          const match = parsed.find((p: any) => p && (p.id === def.id || (p.role === def.role && p.approvalKey === def.approvalKey)));
          if (match) {
            return {
              ...def,
              username: match.username || def.username,
              password: match.password || def.password,
              lastUpdated: match.lastUpdated
            };
          }
          return def;
        });
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored staff accounts:', e);
  }
  return DEFAULT_STAFF_ACCOUNTS;
}

export function saveStoredStaffAccounts(accounts: StaffAccountItem[]) {
  try {
    localStorage.setItem(STAFF_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.warn('Failed to save staff accounts to storage:', e);
  }
}

export const getAccountsMap = (accountsList?: StaffAccountItem[]): Record<string, { password: string; user: AppUser }> => {
  const accounts = accountsList && accountsList.length > 0 ? accountsList : loadStoredStaffAccounts();
  const map: Record<string, { password: string; user: AppUser }> = {};
  for (const acc of accounts) {
    const user: AppUser = {
      username: acc.username,
      name: acc.name,
      title: acc.title,
      role: acc.role,
      approvalKey: acc.approvalKey,
      approvalName: acc.approvalName
    };
    map[acc.id.toLowerCase()] = { password: acc.password, user };
    map[acc.username.toLowerCase()] = { password: acc.password, user };
    if (Array.isArray(acc.aliases)) {
      for (const a of acc.aliases) {
        map[a.toLowerCase()] = { password: acc.password, user };
      }
    }
  }
  return map;
};

// Dynamic proxy for ACCOUNTS dictionary to always provide latest saved credentials
export const ACCOUNTS = new Proxy({} as Record<string, { password: string; user: AppUser }>, {
  get(_, prop: string) {
    if (typeof prop !== 'string') return undefined;
    return getAccountsMap()[prop.toLowerCase()];
  }
});

export function authenticate(username: string, password: string, accountsList?: StaffAccountItem[]): AppUser | null {
  const accounts = accountsList && accountsList.length > 0 ? accountsList : loadStoredStaffAccounts();
  const cleanUser = String(username || '').trim().toLowerCase();
  const pInput = String(password || '').trim();

  const found = accounts.find(acc => {
    if ((acc.username || '').toLowerCase() === cleanUser) return true;
    if (Array.isArray(acc.aliases) && acc.aliases.some(a => a.toLowerCase() === cleanUser)) return true;
    return false;
  });

  if (!found) return null;

  if (found.password === pInput || found.password.toLowerCase() === pInput.toLowerCase()) {
    return {
      username: found.username,
      name: found.name,
      title: found.title,
      role: found.role,
      approvalKey: found.approvalKey,
      approvalName: found.approvalName
    };
  }
  return null;
}

export function isStaffProfile(user: AppUser | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'engineer' || user.role === 'manager';
}

export function canEditSchedule(user: AppUser | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'engineer' || user.role === 'manager';
}

export function canSignApproval(user: AppUser | null, level: 1 | 2 | 3): boolean {
  if (!user) return false;
  const u = (user.username || '').toLowerCase();
  if (user.role === 'admin' || u === 'arman' || u === 'admin') return true;
  if (level === 1) {
    return user.approvalKey === 'approvedBy1' || u === 'nayem' || u === 'naim' || u === 'naimz';
  }
  if (level === 2) {
    return user.approvalKey === 'approvedBy2' || u === 'mossadek' || u === 'mosaddik' || u === 'mosadek';
  }
  if (level === 3) {
    return user.approvalKey === 'approvedBy3' || u === 'fahad';
  }
  return false;
}
