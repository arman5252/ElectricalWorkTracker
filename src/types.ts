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
  approvedBy1?: string; // e.g. "Naim Bhai"
  approvedBy2?: string; // e.g. "Mosaddik Bhai"
  approvedBy3?: string; // e.g. "Fahad Sir"

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
