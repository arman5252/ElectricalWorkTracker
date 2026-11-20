import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  User, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authenticate, ACCOUNTS } from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, login, logout, showToast } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const user = authenticate(username, password);
    if (!user) {
      setError('Invalid username or password. Please check your credentials.');
      return;
    }

    login(user);
    showToast(`Welcome back, ${user.name}! (${user.title})`, 'success');
    setUsername('');
    setPassword('');
    onClose();
  };

  const fillCredentials = (key: string) => {
    const acc = ACCOUNTS[key];
    if (acc) {
      setUsername(acc.user.username);
      setPassword(acc.password);
      setError(null);
    }
  };

  const quickLogin = (key: string) => {
    const acc = ACCOUNTS[key];
    if (acc) {
      login(acc.user);
      showToast(`Logged in as ${acc.user.name} (${acc.user.title})`, 'success');
      setUsername('');
      setPassword('');
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Staff Authentication</h3>
              <p className="text-xs text-slate-400">Bergen Engines 27MW Electrical Control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentUser ? (
          /* Already Logged In State */
          <div className="py-6 space-y-5 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">{currentUser.name}</h4>
              <p className="text-xs text-amber-400 font-semibold">{currentUser.title}</p>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">Role: {currentUser.role.toUpperCase()}</p>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 text-left space-y-1.5">
              <div className="font-semibold text-white">Your Assigned Permissions:</div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Edit Cable Laying, Pre-Comm & Comm Statuses</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sign off: <strong>{currentUser.approvalName || 'All Approvals'}</strong></span>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                showToast('You have been logged out. Switched to Viewer mode.', 'info');
              }}
              className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold rounded-xl text-xs transition-all active:scale-95"
            >
              Sign Out (Switch to Viewer)
            </button>
          </div>
        ) : (
          /* Login Form */
          <form onSubmit={handleSubmit} className="py-5 space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">
              <span className="font-bold">Public Viewer Mode:</span> All users can view and download Excel. Log in below to edit workflow phases or sign off approvals.
            </div>

            {error && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter username (e.g. Nayem, Mossadek, Fahad, arman)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>Sign In as Authorized Personnel</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick 1-Click Login Selection */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400">
                  Quick 1-Click Login:
                </span>
                <span className="text-[10px] text-amber-400 font-medium">Click name to sign in instantly</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => quickLogin('arman')}
                  className="p-2 bg-slate-950 hover:bg-slate-850 hover:border-amber-500/50 border border-slate-800 rounded-lg text-left transition-all group"
                >
                  <div className="font-bold text-amber-300 group-hover:text-amber-200">Admin (arman)</div>
                  <div className="text-[10px] text-slate-400">Full System Control</div>
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('nayem')}
                  className="p-2 bg-slate-950 hover:bg-slate-850 hover:border-emerald-500/50 border border-slate-800 rounded-lg text-left transition-all group"
                >
                  <div className="font-bold text-white group-hover:text-emerald-300">Nayem Siddik</div>
                  <div className="text-[10px] text-emerald-400">Sr. Engr (Level 1 Sign-off)</div>
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('mossadek')}
                  className="p-2 bg-slate-950 hover:bg-slate-850 hover:border-emerald-500/50 border border-slate-800 rounded-lg text-left transition-all group"
                >
                  <div className="font-bold text-white group-hover:text-emerald-300">Mossadek Hossain</div>
                  <div className="text-[10px] text-emerald-400">Sr. Engr (Level 2 Sign-off)</div>
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('fahad')}
                  className="p-2 bg-slate-950 hover:bg-slate-850 hover:border-amber-500/50 border border-slate-800 rounded-lg text-left transition-all group"
                >
                  <div className="font-bold text-white group-hover:text-amber-300">Md Fahad</div>
                  <div className="text-[10px] text-amber-400">Manager PP (Level 3 Sign-off)</div>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
