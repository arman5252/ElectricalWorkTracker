import React, { useState } from 'react';
import { 
  Zap, 
  FileSpreadsheet, 
  FolderGit2, 
  ExternalLink, 
  Settings as SettingsIcon, 
  RefreshCw, 
  Layers, 
  Boxes, 
  FileText,
  BarChart3,
  AlertCircle,
  Lock,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavbarProps {
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings }) => {
  const { 
    settings, 
    activeView, 
    setActiveView, 
    cables, 
    liveSyncIntervalSeconds,
    lastLiveSyncTimestamp,
    liveSyncStatus,
    liveSyncError,
    manualRefreshFromSheet,
    currentUser,
    setIsLoginModalOpen,
    logout
  } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-2.5 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 max-w-[1920px] mx-auto w-full">
        
        {/* Brand & Live Connection Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/40 shrink-0">
            <Zap className="w-5 h-5 fill-slate-950 stroke-slate-950" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Bergen Engines <span className="text-amber-400 font-black">Cable Tracker</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-full">
                Rev. 3
              </span>
            </div>
            
            {/* Real-time status ticker */}
            <div className="flex items-center gap-2 mt-0.5">
              <div className="relative inline-flex items-center gap-1.5">
                {liveSyncStatus === 'live' && (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-400">
                      Live Sheet Syncing ({liveSyncIntervalSeconds}s)
                    </span>
                  </>
                )}
                {liveSyncStatus === 'syncing' && (
                  <>
                    <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                    <span className="text-[11px] font-semibold text-amber-300">
                      Syncing changes...
                    </span>
                  </>
                )}
                {liveSyncStatus === 'error' && (
                  <button 
                    onClick={onOpenSettings}
                    className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:underline"
                    title={liveSyncError || 'Click to verify Google Sheet sharing permissions'}
                  >
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    <span>Real-Time Standby</span>
                  </button>
                )}
                {liveSyncStatus === 'paused' && (
                  <span className="text-[11px] text-slate-400">Real-time paused</span>
                )}
              </div>

              {lastLiveSyncTimestamp && (
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  • Synced at {lastLiveSyncTimestamp}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-950/90 border border-slate-800 rounded-xl p-1 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveView('schedule')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
              activeView === 'schedule'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Schedule ({cables.length})</span>
          </button>

          <button
            onClick={() => setActiveView('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
              activeView === 'analytics'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Visual Analytics</span>
          </button>

          <button
            onClick={() => setActiveView('boq')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
              activeView === 'boq'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>BOQ & Quantities</span>
          </button>

          <button
            onClick={() => setActiveView('specs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
              activeView === 'specs'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Specs & Rev 3</span>
          </button>
        </div>

        {/* Real-time Refresh, Links & Settings */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Manual Refresh button */}
          <button
            onClick={manualRefreshFromSheet}
            disabled={liveSyncStatus === 'syncing'}
            title="Fetch latest updates from Google Sheet now"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${liveSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>Refresh Sheet</span>
          </button>

          {/* Direct link to Google Sheet */}
          <a
            href={settings.spreadsheetUrl}
            target="_blank"
            rel="noreferrer"
            title="Open Live Google Spreadsheet"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Sheet</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          {/* Direct link to Drive folder */}
          <a
            href={settings.driveFolderUrl}
            target="_blank"
            rel="noreferrer"
            title="Open Google Drive Attachments Folder"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 rounded-lg text-xs font-semibold transition-colors"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Drive</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          {/* Settings button */}
          <button
            id="open-settings-button"
            onClick={onOpenSettings}
            title="Configure Real-Time Sync & Google Cloud DB"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 rounded-lg transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          {/* Staff Authentication / Profile Badge */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center gap-2 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-left transition-all"
                  title="Click to view permissions or switch account"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-[11px] font-bold text-white leading-tight">{currentUser.name}</div>
                    <div className="text-[9px] text-amber-400 font-medium leading-none">{currentUser.title}</div>
                  </div>
                </button>
                <button
                  onClick={() => logout()}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                  title="Log out and switch to Viewer mode"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-amber-500/20 active:scale-95"
                title="Log in as Engineer or Admin to change statuses and approve"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Staff Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
