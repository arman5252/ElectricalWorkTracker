import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  ClipboardList, 
  AlertCircle, 
  Calendar, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { STAFF_MEMBERS, WorkPriority, WorkTaskType, CableEntry } from '../types';

interface AssignWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCable?: CableEntry | null;
}

const TASK_TYPES: WorkTaskType[] = [
  'Cable Laying',
  'Pre-Commissioning',
  'Commissioning',
  'Insulation & Megger Test',
  'Glanding & Termination',
  'Tray & Conduit Inspection',
  'Punch List & Rectification',
  'General Electrical Work'
];

export const AssignWorkModal: React.FC<AssignWorkModalProps> = ({
  isOpen,
  onClose,
  initialCable
}) => {
  const { 
    cables, 
    createWorkAssignment, 
    currentUser, 
    setIsLoginModalOpen,
    preselectedCableForAssignment,
    setPreselectedCableForAssignment
  } = useApp();

  const activeCable = initialCable || preselectedCableForAssignment;

  const [assignedToUsername, setAssignedToUsername] = useState('Nayem');
  const [taskType, setTaskType] = useState<WorkTaskType>('Insulation & Megger Test');
  const [priority, setPriority] = useState<WorkPriority>('High');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCableTag, setSelectedCableTag] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Assigner state (if not logged in, allow selecting their staff profile)
  const [assignerUsername, setAssignerUsername] = useState(currentUser?.username || 'Fahad');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (activeCable) {
        setSelectedCableTag(activeCable.cableTag);
        setTitle(`${taskType} for ${activeCable.cableTag}`);
        setDescription(`Complete ${taskType.toLowerCase()} on cable ${activeCable.cableTag} located at ${activeCable.fromLocation || 'Plant'} to ${activeCable.toLocation || 'MCC'}.`);
      } else {
        setSelectedCableTag('');
        setTitle('');
        setDescription('');
      }
      if (currentUser) {
        setAssignerUsername(currentUser.username);
      }
    }
  }, [isOpen, activeCable]);

  // Update default title when taskType or cable changes
  const handleTaskTypeChange = (newType: WorkTaskType) => {
    setTaskType(newType);
    if (selectedCableTag) {
      setTitle(`${newType} for ${selectedCableTag}`);
    } else if (!title || TASK_TYPES.some(t => title.startsWith(t))) {
      setTitle(`${newType} Work`);
    }
  };

  const handleCableSelect = (tag: string) => {
    setSelectedCableTag(tag);
    const found = cables.find(c => c.cableTag === tag);
    if (found) {
      setTitle(`${taskType} for ${found.cableTag}`);
      setDescription(`Complete ${taskType.toLowerCase()} on cable ${found.cableTag} (${found.section}). Check specs: ${found.cableSize} ${found.cableType}.`);
    }
  };

  if (!isOpen || !currentUser || currentUser.role === 'viewer') return null;

  const targetStaff = STAFF_MEMBERS.find(s => s.username === assignedToUsername) || STAFF_MEMBERS[0];
  const assignerStaff = currentUser 
    ? { name: currentUser.name, username: currentUser.username, title: currentUser.title } 
    : (STAFF_MEMBERS.find(s => s.username === assignerUsername) || STAFF_MEMBERS[2]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a work title or task summary.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please enter detailed work instructions for the assigned engineer.');
      return;
    }

    setIsSubmitting(true);
    try {
      const linkedCable = cables.find(c => c.cableTag === selectedCableTag);
      await createWorkAssignment({
        title: title.trim(),
        description: description.trim(),
        taskType,
        priority,
        status: 'Assigned',
        assignedToName: targetStaff.name,
        assignedToUsername: targetStaff.username,
        assignedByName: assignerStaff.name,
        assignedByUsername: assignerStaff.username,
        cableTag: linkedCable ? linkedCable.cableTag : (selectedCableTag || undefined),
        cableId: linkedCable ? linkedCable.id : undefined,
        section: linkedCable ? linkedCable.section : undefined,
        scheduleType: linkedCable ? linkedCable.scheduleType : undefined,
        dueDate
      });

      setPreselectedCableForAssignment(null);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to assign work');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                Assign Work to Staff
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Task Delegation
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Assign cable laying, pre-comm, commissioning, or testing work to an engineer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Who is Assigning (Staff Auth Indicator) */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-slate-400 text-[11px] block">Assigning Supervisor / Staff:</span>
                <strong className="text-white text-xs">{assignerStaff.name}</strong>{' '}
                <span className="text-slate-400 text-[10px]">({assignerStaff.title})</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Staff Verified
            </span>
          </div>

          {/* 2. Assignee Selection (Who Receives the Work) */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[10.5px] tracking-wider">
              1. Assign Work To (Engineer / Staff): *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STAFF_MEMBERS.map(staff => {
                const isSelected = assignedToUsername === staff.username;
                return (
                  <div
                    key={staff.username}
                    onClick={() => setAssignedToUsername(staff.username)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/40 text-white'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs">{staff.name}</div>
                        <div className="text-[10px] text-slate-400">{staff.title}</div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Task Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[10.5px] tracking-wider">
                2. Task Type / Phase: *
              </label>
              <select
                value={taskType}
                onChange={(e) => handleTaskTypeChange(e.target.value as WorkTaskType)}
                className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-400 font-medium"
              >
                {TASK_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[10.5px] tracking-wider">
                3. Priority Level:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Urgent', 'High', 'Medium', 'Low'] as WorkPriority[]).map(p => {
                  const isSelected = priority === p;
                  const colors = {
                    Urgent: isSelected ? 'bg-rose-600 text-white border-rose-500 ring-1 ring-rose-400' : 'bg-slate-950 text-rose-400 border-rose-900/40 hover:bg-rose-950/20',
                    High: isSelected ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 ring-1 ring-amber-300' : 'bg-slate-950 text-amber-400 border-amber-900/40 hover:bg-amber-950/20',
                    Medium: isSelected ? 'bg-emerald-600 text-white border-emerald-500 ring-1 ring-emerald-400' : 'bg-slate-950 text-emerald-400 border-emerald-900/40 hover:bg-emerald-950/20',
                    Low: isSelected ? 'bg-slate-600 text-white border-slate-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  };
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-1.5 px-2 rounded-lg text-center font-bold text-[10.5px] border transition-all ${colors[p]}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Target Cable (Optional / Preselected) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-bold uppercase text-[10.5px] tracking-wider">
                4. Related Cable Schedule Item (Optional):
              </label>
              {selectedCableTag && (
                <button
                  type="button"
                  onClick={() => setSelectedCableTag('')}
                  className="text-[10px] text-slate-400 hover:text-rose-400"
                >
                  Clear Cable Link
                </button>
              )}
            </div>

            {selectedCableTag ? (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-mono font-bold text-white text-xs">{selectedCableTag}</span>
                    {(() => {
                      const c = cables.find(x => x.cableTag === selectedCableTag);
                      return c ? (
                        <span className="text-[10.5px] text-slate-300 block">
                          {c.section} • {c.cableSize} {c.cableType} ({c.scheduleType.includes('LV') ? 'LV Power' : 'Control'})
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCableTag('')}
                  className="text-[10.5px] text-emerald-400 hover:underline font-semibold"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedCableTag}
                  onChange={(e) => handleCableSelect(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400 font-mono text-xs"
                >
                  <option value="">-- No specific cable (General Electrical Task) --</option>
                  <optgroup label="LV Power Cables (117)">
                    {cables.filter(c => c.scheduleType.includes('LV Power')).map(c => (
                      <option key={c.id} value={c.cableTag}>
                        {c.cableTag} - {c.section} ({c.cableSize})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Control Cables (332)">
                    {cables.filter(c => c.scheduleType.includes('Control')).slice(0, 50).map(c => (
                      <option key={c.id} value={c.cableTag}>
                        {c.cableTag} - {c.description.slice(0, 35)}...
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}
          </div>

          {/* 5. Work Title */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[10.5px] tracking-wider">
              5. Work Title / Task Name: *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Conduct insulation resistance test on Trafo Feeder PCC1W01*"
              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-semibold"
              required
            />
          </div>

          {/* 6. Detailed Instructions & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[10.5px] tracking-wider">
                6. Detailed Work Instructions: *
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specify work details, safety precautions, test voltages, tools required, or scope boundaries..."
                className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[10.5px] tracking-wider">
                Target Due Date:
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-400 font-mono text-xs"
              />
              <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Will notify upon assignment</span>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Assigning...' : `Assign Work to ${targetStaff.name}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
