import React, { useState } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  RotateCcw,
  RefreshCw,
  Server,
  UploadCloud,
  KeyRound,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  getStoredSupabaseCredentials, 
  saveStoredSupabaseCredentials, 
  testSupabaseConnection, 
  bulkSeedCablesToSupabase 
} from '../services/supabaseService';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_SCHEMA = `-- 1. Create the Master Cable Schedule Table (with unique id as primary key)
CREATE TABLE IF NOT EXISTS public.cables (
  id TEXT PRIMARY KEY,
  schedule_type TEXT,
  section TEXT,
  sr_no TEXT,
  cable_tag TEXT NOT NULL,
  from_location TEXT,
  from_equipment TEXT,
  to_location TEXT,
  to_equipment TEXT,
  runs INTEGER DEFAULT 1,
  cable_size TEXT,
  cable_type TEXT,
  description TEXT,
  voltage TEXT,
  cable_laying_status TEXT DEFAULT 'Pending',
  cable_laying_remarks TEXT,
  pre_commissioning_status TEXT DEFAULT 'Pending',
  pre_commissioning_remarks TEXT,
  commissioning_status TEXT DEFAULT 'Pending',
  commissioning_remarks TEXT,
  approved_by1 TEXT,
  approved_by2 TEXT,
  approved_by3 TEXT,
  notes TEXT,
  drawing_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Drop tag unique constraint (if present) so duplicate engineering tags are safely handled
ALTER TABLE public.cables DROP CONSTRAINT IF EXISTS cables_cable_tag_key;

-- 3. Enable Row Level Security (RLS) & Grant Access for real-time reads & writes
ALTER TABLE public.cables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access cables" ON public.cables;
CREATE POLICY "Public access cables" ON public.cables FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.cables TO anon, authenticated;
`;

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({ isOpen, onClose }) => {
  const { 
    cables,
    resetToOriginalSpreadsheet,
    reloadFromSupabase,
    showToast 
  } = useApp();

  const initialCreds = getStoredSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(initialCreds.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initialCreds.anonKey);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseResult, setSupabaseResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState<{ done: number; total: number } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlEditor, setShowSqlEditor] = useState(false);

  if (!isOpen) return null;

  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredSupabaseCredentials(supabaseUrl, supabaseAnonKey);
    setIsTestingSupabase(true);
    const res = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
    setIsTestingSupabase(false);
    setSupabaseResult(res);
    if (res.success) {
      showToast('Supabase connected successfully! Real-time synchronization active.', 'success');
      reloadFromSupabase();
    } else {
      showToast(res.message, 'warning');
    }
  };

  const handleSeedSupabase = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      showToast('Please enter your Supabase URL and Anon Key first.', 'warning');
      return;
    }
    setIsSeeding(true);
    setSeedProgress({ done: 0, total: cables.length });

    const res = await bulkSeedCablesToSupabase(cables, (done, total) => {
      setSeedProgress({ done, total });
    });

    setIsSeeding(false);
    if (res.success) {
      showToast(`Successfully seeded all ${res.count} cables to Supabase!`, 'success');
      const test = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
      setSupabaseResult(test);
    } else {
      showToast(`Failed to seed Supabase: ${res.error}`, 'error');
    }
  };

  const copySqlSchema = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopiedSql(true);
    showToast('SQL Schema copied to clipboard!', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-card rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8 text-xs max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Supabase Cloud Database Settings
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Admin Only
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                PostgreSQL cloud database with instant Real-Time WebSockets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database Status Banner */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full ${
              supabaseResult?.success
                ? 'bg-emerald-400 ring-4 ring-emerald-400/20'
                : supabaseUrl
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-slate-600'
            }`} />
            <div>
              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                <span>{supabaseResult?.success ? 'Connected to Supabase PostgreSQL' : 'Supabase Cloud Database'}</span>
                <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-300 rounded font-mono">LIVE</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {supabaseResult?.message || 'Real-time WebSocket subscriptions active for all engineering users'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={copySqlSchema}
            className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs"
            title="Copy SQL table schema for Supabase SQL Editor"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Schema'}</span>
          </button>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSaveSupabase} className="mt-4 space-y-3.5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-[11px] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supabase Project URL</span>
              </span>
              <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                Open Dashboard <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </label>
            <input
              type="url"
              placeholder="https://your-project.supabase.co"
              value={supabaseUrl}
              onChange={e => setSupabaseUrl(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-[11px] flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Supabase Publishable / Anon API Key</span>
            </label>
            <input
              type="password"
              placeholder="sb_publishable_... or eyJhbGci..."
              value={supabaseAnonKey}
              onChange={e => setSupabaseAnonKey(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleSeedSupabase}
              disabled={isSeeding || !supabaseUrl}
              className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              title="Upload all 457 project cables into Supabase"
            >
              <UploadCloud className={`w-4 h-4 ${isSeeding ? 'animate-bounce text-amber-400' : ''}`} />
              <span>
                {isSeeding && seedProgress
                  ? `Seeding ${seedProgress.done}/${seedProgress.total}...`
                  : 'Seed All 457 Cables to Supabase'}
              </span>
            </button>

            <button
              type="submit"
              disabled={isTestingSupabase}
              className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
              <span>{isTestingSupabase ? 'Testing...' : 'Save & Test Connection'}</span>
            </button>
          </div>
        </form>

        {/* SQL Schema Viewer Toggle */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowSqlEditor(!showSqlEditor)}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
          >
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showSqlEditor ? 'Hide SQL Schema' : 'View SQL Table Definition'}</span>
          </button>

          {showSqlEditor && (
            <div className="mt-2 relative">
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-48 leading-relaxed">
                {SQL_SCHEMA}
              </pre>
              <button
                type="button"
                onClick={copySqlSchema}
                className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold border border-slate-700 flex items-center gap-1"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Maintenance / Local Cache Reset */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-slate-400">
          <div>
            <div className="font-semibold text-slate-300">Reset Local Browser Schedule</div>
            <div className="text-[10px] text-slate-500">Restore default 457 cables if local storage was cleared or corrupted.</div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (confirm('Are you sure you want to restore the authentic Rev 3 master schedule?')) {
                resetToOriginalSpreadsheet();
              }
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl font-bold transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Master</span>
          </button>
        </div>

      </div>
    </div>
  );
};
