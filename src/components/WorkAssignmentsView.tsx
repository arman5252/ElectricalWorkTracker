import React, { useState, useMemo } from 'react';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Zap, 
  Calendar, 
  User, 
  Tag, 
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Trash2,
  Edit3,
  ExternalLink,
  Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WorkAssignment, WorkAssignmentStatus, WorkPriority, STAFF_MEMBERS } from '../types';

export const WorkAssignmentsView: React.FC = () => {
  const { 
    workAssignments, 
    updateWorkAssignment, 
    deleteWorkAssignment, 
    openAssignWorkModal, 
    currentUser,
    isStaff,
    setSelectedCable,
    cables,
    setActiveView
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [staffFilter, setStaffFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

  // Quick prompt for completion notes
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');

  // Filtering
  const filteredAssignments = useMemo(() => {
    return workAssignments.filter(assignment => {
      // Staff filter
      if (staffFilter === 'mine' && currentUser) {
        if (assignment.assignedToUsername.toLowerCase() !== currentUser.username.toLowerCase()) return false;
      } else if (staffFilter !== 'All') {
        if (assignment.assignedToUsername.toLowerCase() !== staffFilter.toLowerCase()) return false;
      }

      // Status filter
      if (statusFilter !== 'All' && assignment.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter !== 'All' && assignment.priority !== priorityFilter) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = assignment.title.toLowerCase().includes(q);
        const matchesDesc = assignment.description.toLowerCase().includes(q);
        const matchesStaff = assignment.assignedToName.toLowerCase().includes(q) || assignment.assignedByName.toLowerCase().includes(q);
        const matchesCable = (assignment.cableTag || '').toLowerCase().includes(q);
        const matchesSection = (assignment.section || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesStaff && !matchesCable && !matchesSection) return false;
      }

      return true;
    });
  }, [workAssignments, staffFilter, statusFilter, priorityFilter, searchQuery, currentUser]);

  // Statistics
  const totalCount = workAssignments.length;
  const inProgressCount = workAssignments.filter(a => a.status === 'In Progress').length;
  const assignedCount = workAssignments.filter(a => a.status === 'Assigned').length;
  const completedCount = workAssignments.filter(a => a.status === 'Completed').length;
  const urgentCount = workAssignments.filter(a => a.priority === 'Urgent' && a.status !== 'Completed').length;

  const handleStartWork = (id: string) => {
    updateWorkAssignment(id, { status: 'In Progress' });
  };

  const handleConfirmCompletion = (id: string) => {
    updateWorkAssignment(id, { 
      status: 'Completed', 
      completedAt: new Date().toISOString(),
      completionRemarks: completionNotes.trim() || undefined
    });
    setCompletingId(null);
    setCompletionNotes('');
  };

  const handleInspectCable = (tag?: string) => {
    if (!tag) return;
    const found = cables.find(c => c.cableTag === tag);
    if (found) {
      setSelectedCable(found);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/40 shrink-0">
            <UserCheck className="w-6 h-6 stroke-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                Staff Work Assignments & Task Distribution
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {workAssignments.length} Tasks
              </span>
            </div>
            <p className="text-slate-400 text-xs">
              Assign, delegate, and track electrical work across Senior Engineers & Management in real-time
            </p>
          </div>
        </div>

        {/* Assign New Work Button - Staff Profile Only */}
        {isStaff && (
          <button
            onClick={() => openAssignWorkModal()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Assign New Work</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Tasks */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-1 text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10.5px]">Total Assignments</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Across all engineers & management</div>
        </div>

        {/* In Progress */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-1 text-emerald-300">
            <span className="font-bold uppercase tracking-wider text-[10.5px]">In Progress</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{inProgressCount}</div>
          <div className="text-[10px] text-emerald-300/70 mt-1">Currently being executed</div>
        </div>

        {/* Assigned / Pending */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-1 text-cyan-300">
            <span className="font-bold uppercase tracking-wider text-[10.5px]">Assigned / To-Do</span>
            <UserCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{assignedCount}</div>
          <div className="text-[10px] text-cyan-300/70 mt-1">Awaiting field action</div>
        </div>

        {/* Completed */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-1 text-emerald-400">
            <span className="font-bold uppercase tracking-wider text-[10.5px]">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{completedCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Done & signed off</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search work title, instructions, staff, or cable tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
            />
          </div>

          {/* Quick Staff Fast Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto shrink-0">
            {currentUser && (
              <button
                onClick={() => setStaffFilter(staffFilter === 'mine' ? 'All' : 'mine')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  staffFilter === 'mine'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30'
                }`}
              >
                <span>My Assigned Work</span>
                <span className="text-[9.5px] px-1.5 rounded-full bg-slate-950/30 font-mono">
                  {workAssignments.filter(a => a.assignedToUsername.toLowerCase() === currentUser.username.toLowerCase()).length}
                </span>
              </button>
            )}

            <button
              onClick={() => setStaffFilter('All')}
              className={`px-2.5 py-1.5 rounded-xl font-semibold transition-all ${
                staffFilter === 'All' ? 'bg-slate-700 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              All Staff
            </button>

            {STAFF_MEMBERS.map(s => {
              const count = workAssignments.filter(a => a.assignedToUsername.toLowerCase() === s.username.toLowerCase()).length;
              return (
                <button
                  key={s.username}
                  onClick={() => setStaffFilter(staffFilter === s.username ? 'All' : s.username)}
                  className={`px-2.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1 shrink-0 ${
                    staffFilter.toLowerCase() === s.username.toLowerCase()
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{s.name.split(' ')[0]}</span>
                  <span className="text-[9.5px] font-mono opacity-80 font-bold">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Deep Selectors: Status & Priority */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber-400" />
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 px-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Statuses ({workAssignments.length})</option>
              <option value="Assigned">Assigned ({assignedCount})</option>
              <option value="In Progress">In Progress ({inProgressCount})</option>
              <option value="Completed">Completed ({completedCount})</option>
            </select>

            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-2">
              Priority:
            </span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="py-1 px-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {(staffFilter !== 'All' || statusFilter !== 'All' || priorityFilter !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setStaffFilter('All');
                setStatusFilter('All');
                setPriorityFilter('All');
                setSearchQuery('');
              }}
              className="flex items-center gap-1 text-[11px] text-amber-400 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Task Cards List */}
      {filteredAssignments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/50">
          <UserCheck className="w-10 h-10 text-slate-600 mx-auto mb-2.5" />
          <h3 className="text-sm font-bold text-slate-300">No work assignments found</h3>
          <p className="text-slate-500 text-xs mt-1">Try adjusting your search or filters, or assign a new task to staff.</p>
          {isStaff && (
            <button
              onClick={() => openAssignWorkModal()}
              className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20"
            >
              + Assign Work to Staff
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAssignments.map(assignment => {
            const isCompleted = assignment.status === 'Completed';
            const isInProgress = assignment.status === 'In Progress';
            const isUrgent = assignment.priority === 'Urgent';

            return (
              <div
                key={assignment.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-lg relative ${
                  isCompleted
                    ? 'bg-slate-900/50 border-emerald-900/40 opacity-80 hover:opacity-100'
                    : isUrgent
                    ? 'bg-slate-900 border-rose-600/60 ring-1 ring-rose-500/30'
                    : isInProgress
                    ? 'bg-slate-900 border-amber-500/50 ring-1 ring-amber-500/20'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Card Header: Priority & Status */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        assignment.priority === 'Urgent' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                        assignment.priority === 'High' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        assignment.priority === 'Medium' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {assignment.priority}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">
                        {assignment.taskType}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold flex items-center gap-1 ${
                      isCompleted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                      isInProgress ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}>
                      {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      {isInProgress && <Clock className="w-3 h-3 text-amber-400" />}
                      <span>{assignment.status}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-extrabold text-white mb-2 leading-snug">
                    {assignment.title}
                  </h3>

                  {/* Related Cable Link Pill */}
                  {assignment.cableTag && (
                    <div 
                      onClick={() => handleInspectCable(assignment.cableTag)}
                      className="mb-2.5 p-1.5 px-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-400/50 cursor-pointer flex items-center justify-between group transition-colors"
                      title="Click to inspect this cable in schedule"
                    >
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-300 font-bold">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Cable: {assignment.cableTag}</span>
                        {assignment.section && (
                          <span className="text-slate-400 font-normal text-[10px]">({assignment.section})</span>
                        )}
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-amber-300 transition-colors" />
                    </div>
                  )}

                  {/* Description / Instructions */}
                  <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-slate-300 text-[11px] leading-relaxed mb-3">
                    <p className="whitespace-pre-line">{assignment.description}</p>
                    {assignment.completionRemarks && (
                      <div className="mt-2 pt-2 border-t border-slate-800 text-emerald-300 text-[10.5px]">
                        <strong>Completion Report:</strong> {assignment.completionRemarks}
                      </div>
                    )}
                  </div>

                  {/* Staff Info Boxes */}
                  <div className="space-y-1.5 text-[10.5px]">
                    {/* Assigned To */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/40 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                          {assignment.assignedToName.charAt(0)}
                        </div>
                        <div>
                          <span className="text-slate-400 text-[9.5px] block leading-none">Assigned To:</span>
                          <strong className="text-white text-xs">{assignment.assignedToName}</strong>
                        </div>
                      </div>
                      {assignment.dueDate && (
                        <div className="text-right">
                          <span className="text-slate-400 text-[9.5px] block leading-none">Due Date:</span>
                          <span className="font-mono font-semibold text-slate-200">{assignment.dueDate}</span>
                        </div>
                      )}
                    </div>

                    {/* Assigned By */}
                    <div className="flex items-center justify-between text-slate-400 px-1 text-[10px]">
                      <span>Assigned by: <strong className="text-slate-300">{assignment.assignedByName}</strong></span>
                      <span>{new Date(assignment.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                  {/* Status update buttons */}
                  <div className="flex items-center gap-1.5 flex-1">
                    {assignment.status === 'Assigned' && (
                      <button
                        onClick={() => handleStartWork(assignment.id)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10.5px] transition-all flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Start Work</span>
                      </button>
                    )}

                    {assignment.status === 'In Progress' && (
                      completingId === assignment.id ? (
                        <div className="w-full space-y-1.5">
                          <input
                            type="text"
                            placeholder="Completion notes (optional)..."
                            value={completionNotes}
                            onChange={(e) => setCompletionNotes(e.target.value)}
                            className="w-full py-1 px-2 bg-slate-950 border border-emerald-500/50 rounded-lg text-slate-100 text-xs focus:outline-none"
                          />
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleConfirmCompletion(assignment.id)}
                              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                            >
                              Confirm Complete
                            </button>
                            <button
                              onClick={() => setCompletingId(null)}
                              className="text-slate-400 hover:text-white text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setCompletingId(assignment.id);
                            setCompletionNotes('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10.5px] transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Mark Complete</span>
                        </button>
                      )
                    )}

                    {isCompleted && (
                      <span className="text-emerald-400 text-[10.5px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Work Completed</span>
                      </span>
                    )}
                  </div>

                  {/* Reassign / Delete buttons - Staff Profile Only */}
                  {isStaff && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const nextStaff = STAFF_MEMBERS.find(s => s.username !== assignment.assignedToUsername) || STAFF_MEMBERS[0];
                          updateWorkAssignment(assignment.id, { 
                            assignedToName: nextStaff.name, 
                            assignedToUsername: nextStaff.username 
                          });
                        }}
                        title="Reassign to another staff"
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => deleteWorkAssignment(assignment.id)}
                        title="Delete assignment"
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
