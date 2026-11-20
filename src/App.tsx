import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { ScheduleStats } from './components/ScheduleStats';
import { ScheduleView } from './components/ScheduleView';
import { VisualChartsView } from './components/VisualChartsView';
import { BoqView } from './components/BoqView';
import { SpecsView } from './components/SpecsView';
import { WorkAssignmentsView } from './components/WorkAssignmentsView';
import { CableDetailModal } from './components/CableDetailModal';
import { AssignWorkModal } from './components/AssignWorkModal';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { DataImportModal } from './components/DataImportModal';
import { LoginModal } from './components/LoginModal';
import { ToastContainer } from './components/ToastContainer';

export const App: React.FC = () => {
  const { 
    activeView, 
    isLoginModalOpen, 
    setIsLoginModalOpen, 
    isImportModalOpen, 
    setIsImportModalOpen, 
    isAssignModalOpen,
    setIsAssignModalOpen,
    currentUser,
    isStaff
  } = useApp();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200 engineering-grid">
      {/* Top Navbar */}
      <Navbar onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Container - Full Widescreen for 14-Column Engineering Spreadsheet */}
      <main className="flex-1 max-w-[1920px] mx-auto w-full p-3 sm:p-5 lg:p-6 space-y-5">
        {/* KPI & Quick Status Bar */}
        <ScheduleStats />

        {/* Dynamic View */}
        {activeView === 'schedule' && <ScheduleView />}
        {activeView === 'assignments' && <WorkAssignmentsView />}
        {activeView === 'analytics' && <VisualChartsView />}
        {activeView === 'boq' && <BoqView />}
        {activeView === 'specs' && <SpecsView />}
      </main>

      {/* Cable Details Drawer / Inspection Modal */}
      <CableDetailModal />

      {/* Work Assignment Modal - Assign Work to Staff (Staff Profile Only) */}
      {isStaff && (
        <AssignWorkModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
        />
      )}

      {/* Google Spreadsheet & Drive Cloud Integration Modal - Admin Profile Only */}
      {currentUser?.role === 'admin' && (
        <GoogleSyncModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Staff Authentication Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Engineering Data Import & Manual Entry Modal (Admin Only) */}
      {currentUser?.role === 'admin' && (
        <DataImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}

      {/* Toast Alerts */}
      <ToastContainer />
    </div>
  );
};

export default App;
