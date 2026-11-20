import React, { useState, useMemo } from 'react';
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
  ArrowRight,
  History,
  Search,
  Trash2,
  Clock,
  Tag,
  ArrowRightLeft,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authenticate, ACCOUNTS } from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { 
    currentUser, 
    login, 
    logout, 
    showToast,
    editHistory,
    clearEditHistory,
    profileModalTab,
    setProfileModalTab,
    setSelectedCable,
    cables
  } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History filtering state
  const [historyScope, setHistoryScope] = useState<'mine' | 'all'>('mine');
  const [historySearch, setHistorySearch] = useState('');

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

  // Filter edit history
  const filteredHistory = useMemo(() => {
    if (!currentUser) return [];
    return editHistory.filter(record => {
      // Scope filter: My Edits vs All Staff
      if (historyScope === 'mine') {
        const isMe = record.staffUsername.toLowerCase() === currentUser.username.toLowerCase() ||
                     record.staffName.toLowerCase().includes(currentUser.name.toLowerCase());
        if (!isMe) return false;
      }

      // Keyword search
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const matchesTarget = (record.targetIdentifier || '').toLowerCase().includes(q);
        const matchesAction = (record.action || '').toLowerCase().includes(q);
        const matchesStaff = (record.staffName || '').toLowerCase().includes(q);
        const matchesNotes = (record.notes || '').toLowerCase().includes(q);
        const matchesField = (record.fieldChanged || '').toLowerCase().includes(q);
        const matchesVal = (record.newValue || '').toLowerCase().includes(q) || (record.oldValue || '').toLowerCase().includes(q);
        if (!matchesTarget && !matchesAction && !matchesStaff && !matchesNotes && !matchesField && !matchesVal) {
          return false;
        }
      }

      return true;
    });
  }, [editHistory, currentUser, historyScope, historySearch]);

  const myEditsCount = currentUser 
    ? editHistory.filter(r => r.staffUsername.toLowerCase() === currentUser.username.toLowerCase()).length
    : 0;

  const handleInspectCableFromHistory = (tag: string) => {
    const cable = cables.find(c => c.cableTag === tag);
    if (cable) {
      setSelectedCable(cable);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={`relative w-full ${currentUser ? 'max-w-2xl' : 'max-w-md'} bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-7 text-slate-100 transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              {currentUser ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {currentUser ? 'Staff Profile & Activity Hub' : 'Staff Authentication'}
              </h3>
              <p className="text-xs text-slate-400">
                {currentUser ? `${currentUser.name} • ${currentUser.title}` : 'Bergen Engines 27MW Electrical Control'}
              </p>
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
          /* Logged In Staff Hub */
          <div className="pt-3 space-y-4">
            {/* Top Navigation Tabs: Profile vs Edit History */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setProfileModalTab('profile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  profileModalTab === 'profile'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile & Permissions</span>
              </button>

              <button
                type="button"
                onClick={() => setProfileModalTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  profileModalTab === 'history'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Staff Edit History</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  profileModalTab === 'history' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {myEditsCount}
                </span>
              </button>
            </div>

            {/* TAB 1: Profile & Permissions */}
            {profileModalTab === 'profile' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20 shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <h4 className="text-lg font-bold text-white">{currentUser.name}</h4>
                    <p className="text-xs text-amber-400 font-semibold">{currentUser.title}</p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono">
                        ROLE: {currentUser.role.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        {currentUser.approvalName || 'Authorized Signatory'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300">
                        {myEditsCount} recorded edits
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assigned Permissions Checklist */}
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-2">
                  <div className="font-bold text-white uppercase text-[11px] tracking-wider text-slate-400">
                    Authorized System Capabilities
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Edit Cable Laying, Pre-Comm & Comm Statuses</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Assign, Delegate & Complete Work Orders</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Sign off: <strong>{currentUser.approvalName || 'All Approvals'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Full Audit Logging & Edit History Tracking</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setProfileModalTab('history')}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <History className="w-4 h-4" />
                    <span>View My Edit History ({myEditsCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      showToast('You have been logged out. Switched to Viewer mode.', 'info');
                    }}
                    className="py-2.5 px-4 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold rounded-xl text-xs transition-all active:scale-95"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Staff Edit History */}
            {profileModalTab === 'history' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  {/* Scope filter pills */}
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setHistoryScope('mine')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        historyScope === 'mine'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      My Edits ({myEditsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryScope('all')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        historyScope === 'all'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All Staff ({editHistory.length})
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search cable, action, notes..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Admin Clear Option */}
                  {currentUser.role === 'admin' && editHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear the edit history?')) {
                          clearEditHistory();
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs transition-colors shrink-0"
                      title="Clear Edit History (Admin Only)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Edit Records Scrollable List */}
                <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1 text-xs custom-scrollbar">
                  {filteredHistory.length === 0 ? (
                    <div className="py-12 text-center rounded-2xl bg-slate-950/60 border border-slate-800">
                      <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="font-semibold text-slate-300">No edit records found</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {historySearch ? 'No edits match your search keyword.' : 'Any status change or approval signed by staff will be tracked here.'}
                      </p>
                    </div>
                  ) : (
                    filteredHistory.map((record) => {
                      const isMe = record.staffUsername.toLowerCase() === currentUser.username.toLowerCase();
                      const dateObj = new Date(record.timestamp);
                      const formattedTime = !isNaN(dateObj.getTime())
                        ? dateObj.toLocaleString(undefined, { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : record.timestamp;

                      return (
                        <div 
                          key={record.id}
                          className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700/80 transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {/* Staff badge */}
                              <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                                isMe 
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                                  : 'bg-slate-800 text-slate-300'
                              }`}>
                                {record.staffName}
                              </span>
                              <span className="text-[10px] text-slate-400">({record.staffRole})</span>
                            </div>

                            {/* Timestamp */}
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {formattedTime}
                            </span>
                          </div>

                          {/* Action summary & Target tag */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              <span>{record.action}</span>
                            </div>

                            {/* Target Identifier Button (e.g. PCC1W01*) */}
                            {record.targetIdentifier && (
                              <button
                                type="button"
                                onClick={() => handleInspectCableFromHistory(record.targetIdentifier)}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-slate-200 text-[10px] font-mono font-bold flex items-center gap-1 border border-slate-700 transition-colors"
                                title="Click to view cable details"
                              >
                                <Tag className="w-2.5 h-2.5 text-amber-400" />
                                <span>{record.targetIdentifier}</span>
                              </button>
                            )}
                          </div>

                          {/* Old vs New Value Change */}
                          {(record.oldValue || record.newValue) && (
                            <div className="flex items-center gap-2 text-[11px] p-2 rounded-xl bg-slate-900/90 border border-slate-850">
                              <span className="text-slate-400">{record.fieldChanged || 'Status'}:</span>
                              {record.oldValue && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 line-through">
                                  {record.oldValue}
                                </span>
                              )}
                              <ArrowRightLeft className="w-3 h-3 text-amber-400" />
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                {record.newValue}
                              </span>
                            </div>
                          )}

                          {/* Attached remarks/notes */}
                          {record.notes && (
                            <p className="text-[11px] text-slate-300 italic bg-slate-900/60 p-2 rounded-lg border-l-2 border-amber-500">
                              &ldquo;{record.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Login Form for unauthenticated visitors */
          <form onSubmit={handleSubmit} className="py-5 space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">
              <span className="font-bold">Public Viewer Mode:</span> All users can view and download Excel. Log in below to edit workflow phases, assign work, or sign off approvals.
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
