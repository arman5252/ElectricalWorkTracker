import { AppUser } from '../types';

export interface AuthAccount {
  user: AppUser;
  passwordHash: string; // password stored for client-side authentication
}

export const ACCOUNTS: Record<string, { password: string; user: AppUser }> = {
  arman: {
    password: 'arman2026**',
    user: {
      username: 'arman',
      name: 'Arman (Admin)',
      title: 'System Administrator',
      role: 'admin',
      approvalKey: 'all',
      approvalName: 'All Approvals'
    }
  },
  nayem: {
    password: 'Nayem2026',
    user: {
      username: 'Nayem',
      name: 'Nayem Siddik',
      title: 'Senior Engineer',
      role: 'engineer',
      approvalKey: 'approvedBy1',
      approvalName: 'Naim Bhai'
    }
  },
  mossadek: {
    password: 'Mossadek2026',
    user: {
      username: 'Mossadek',
      name: 'Mossadek Hossain',
      title: 'Senior Engineer',
      role: 'engineer',
      approvalKey: 'approvedBy2',
      approvalName: 'Mosaddik Bhai'
    }
  },
  fahad: {
    password: 'Fahad2026',
    user: {
      username: 'Fahad',
      name: 'Md Fahad',
      title: 'Manager PP',
      role: 'manager',
      approvalKey: 'approvedBy3',
      approvalName: 'Fahad Sir'
    }
  }
};

export const AUTH_STORAGE_KEY = 'volttrack_auth_session_user';

export function authenticate(username: string, password: string): AppUser | null {
  const cleanUser = String(username || '').trim().toLowerCase();
  const account = ACCOUNTS[cleanUser];
  if (!account) return null;
  if (account.password === password.trim()) {
    return account.user;
  }
  return null;
}

export function canEditSchedule(user: AppUser | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'engineer' || user.role === 'manager';
}

export function canSignApproval(user: AppUser | null, level: 1 | 2 | 3): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (level === 1) return user.approvalKey === 'approvedBy1';
  if (level === 2) return user.approvalKey === 'approvedBy2';
  if (level === 3) return user.approvalKey === 'approvedBy3';
  return false;
}
