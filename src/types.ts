export type UserRole = 'admin' | 'engineer' | 'manager' | 'viewer';

export interface AppUser {
  username: string;
  name: string;
  title: string;
  role: UserRole;
  approvalKey?: 'approvedBy1' | 'approvedBy2' | 'approvedBy3' | 'all';
  approvalName?: string;
}

export interface StaffAccountItem {
  id: string; // 'arman' | 'nayem' | 'mossadek' | 'fahad'
  name: string;
  title: string;
  role: UserRole;
  username: string;
  password: string;
  approvalKey?: 'approvedBy1' | 'approvedBy2' | 'approvedBy3' | 'all';
  approvalName?: string;
  aliases?: string[];
  lastUpdated?: string;
}

export const STAFF_MEMBERS: { name: string; username: string; title: string; role: UserRole }[] = [
  { name: 'Nayem Siddik', username: 'Nayem', title: 'Senior Engineer', role: 'engineer' },
  { name: 'Mossadek Hossain', username: 'Mossadek', title: 'Senior Engineer', role: 'engineer' },
  { name: 'Md Fahad', username: 'Fahad', title: 'Manager PP', role: 'manager' },
  { name: 'Arman (Admin)', username: 'arman', title: 'System Administrator', role: 'admin' },
];

export interface StaffEditRecord {
  id: string;
  timestamp: string;
  staffUsername: string;
  staffName: string;
  staffRole: string;
  targetType: 'Cable' | 'Approval' | 'Work Assignment' | 'General';
  targetIdentifier: string;
  action: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  notes?: string;
}

export type WorkPriority = 'Urgent' | 'High' | 'Medium' | 'Low';
export type WorkAssignmentStatus = 'Assigned' | 'In Progress' | 'Under Review' | 'Completed' | 'On Hold';
export type WorkTaskType = 
  | 'Cable Laying' 
  | 'Pre-Commissioning' 
  | 'Commissioning' 
  | 'Insulation & Megger Test' 
  | 'Glanding & Termination' 
  | 'Tray & Conduit Inspection' 
  | 'Punch List & Rectification' 
  | 'General Electrical Work';

export interface WorkAssignment {
  id: string; // e.g. "WRK-2026-001"
  title: string; // e.g. "Megger Test on Trafo Feeders"
  description: string; // Detailed instructions or work scope
  taskType: WorkTaskType;
  priority: WorkPriority;
  status: WorkAssignmentStatus;
  
  // Assignee
  assignedToName: string; // "Nayem Siddik", "Mossadek Hossain", "Md Fahad", "Arman (Admin)"
  assignedToUsername: string; // "Nayem", "Mossadek", "Fahad", "arman"
  
  // Assigner
  assignedByName: string; // "Md Fahad", "Nayem Siddik", etc.
  assignedByUsername: string;
  
  // Associated Cable (Optional)
  cableTag?: string; // e.g. "PCC1W01*"
  cableId?: string; // e.g. "LV-001"
  section?: string; // e.g. "PCC (Power Control Center)"
  scheduleType?: string;
  
  // Timestamps & Deadlines
  createdAt: string;
  dueDate?: string;
  completedAt?: string;
  
  // Progress notes & Completion Remarks
  notes?: string;
  completionRemarks?: string;
}

export type CableStageStatus = 
  | 'Complete By VEL' 
  | 'Complete By Bargen' 
  | 'Progress' 
  | 'Pending' 
  | 'Scope of Bargen' 
  | 'Scope of VEL' 
  | 'Out of Scope' 
  | 'N/A';

export type CableLayingStatus = CableStageStatus;
export type CommissioningStatus = CableStageStatus;
export type CableStatus = CableStageStatus;

export interface CableEntry {
  id: string;
  scheduleType: string; // 'LV Power Cable Schedule' | 'Control Cable Schedule'
  section: string;
  srNo: string;
  cableTag: string; // e.g. "PCC1W01*", "G1W01"
  fromLocation: string; // e.g. "OUTSIDE", "MV/LV ROOM"
  fromEquipment: string; // e.g. "AUX.TRAFO #1", "CLIENT PCC"
  toLocation: string; // e.g. "MV/LV ROOM", "EMCC - 1"
  toEquipment: string; // e.g. "CLIENT PCC", "EMCC - 1"
  runs: number;
  cableSize: string; // e.g. "1C x 500", "3.5C x 300"
  cableType: string; // e.g. "YFY", "2XWY"
  description: string;
  cableDiaMm?: string;
  voltage: string;
  drawingUrl?: string;
  notes?: string;

  // Work Assignment link
  assignedTo?: string; // e.g. "Nayem Siddik", "Mossadek Hossain"
  assignedWorkId?: string; // link to WorkAssignment.id

  // Phase 1: Cable Laying
  cableLayingStatus: CableLayingStatus;
  cableLayingRemarks?: string;

  // Phase 2: Pre-Commissioning
  preCommissioningStatus: CommissioningStatus;
  preCommissioningRemarks?: string;

  // Phase 3: Commissioning
  commissioningStatus: CommissioningStatus;
  commissioningRemarks?: string;

  // Approvals (Approve By)
  approvedBy1?: string; // e.g. "Nayem Siddik (Sr. Engr)"
  approvalNote1?: string; // Nayem's individual note before approval
  approvedBy2?: string; // e.g. "Mossadek Hossain (Sr. Engr)"
  approvalNote2?: string; // Mossadek's individual note before approval
  approvedBy3?: string; // e.g. "Md Fahad (Manager PP)"
  approvalNote3?: string; // Md Fahad's individual note before approval

  status: CableStatus;
  updatedAt?: string;
}

export interface BoqItem {
  id: string;
  cableType: string;
  conductorSize: string;
  entriesCount: number;
  totalRuns: number;
}

export interface ProjectSettings {
  projectTitle: string;
  docNoPower: string;
  docNoControl: string;
  revision: string;
  spreadsheetUrl: string;
  driveFolderUrl: string;
  driveFolderId: string;
  webAppUrl: string;
  lastSyncTimestamp: string | null;
}
