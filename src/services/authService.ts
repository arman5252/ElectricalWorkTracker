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
  admin: {
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
      approvalName: 'Nayem Siddik (Sr. Engr)'
    }
  },
  naim: {
    password: 'Nayem2026',
    user: {
      username: 'Nayem',
      name: 'Nayem Siddik',
      title: 'Senior Engineer',
      role: 'engineer',
      approvalKey: 'approvedBy1',
      approvalName: 'Nayem Siddik (Sr. Engr)'
    }
  },
  naimz: {
    password: 'Nayem2026',
    user: {
      username: 'Nayem',
      name: 'Nayem Siddik',
      title: 'Senior Engineer',
      role: 'engineer',
      approvalKey: 'approvedBy1',
      approvalName: 'Nayem Siddik (Sr. Engr)'
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
      approvalName: 'Mossadek Hossain (Sr. Engr)'
    }
  },
  mosaddik: {
    password: 'Mossadek2026',
    user: {
      username: 'Mossadek',
      name: 'Mossadek Hossain',
      title: 'Senior Engineer',
      role: 'engineer',
      approvalKey: 'approvedBy2',
      approvalName: 'Mossadek Hossain (Sr. Engr)'
    }
  },
  mosadek: {
    password: 'Mossadek2026',
    user: {
      username: 'Mossadek',
      name: 'Mossadek Hossain',
      title: 'Senior Engineer',
      role: 'engineer',
      approvalKey: 'approvedBy2',
      approvalName: 'Mossadek Hossain (Sr. Engr)'
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
      approvalName: 'Md Fahad (Manager PP)'
    }
  }
};

export const AUTH_STORAGE_KEY = 'volttrack_auth_session_user';

export function authenticate(username: string, password: string): AppUser | null {
  const cleanUser = String(username || '').trim().toLowerCase();
  const account = ACCOUNTS[cleanUser];
  if (!account) return null;
  const pInput = String(password || '').trim();
  if (account.password === pInput || account.password.toLowerCase() === pInput.toLowerCase()) {
    return account.user;
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
