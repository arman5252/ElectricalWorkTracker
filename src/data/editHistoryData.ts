import { StaffEditRecord } from '../types';

export const INITIAL_EDIT_HISTORY: StaffEditRecord[] = [
  {
    id: 'EDT-2026-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    staffUsername: 'Nayem',
    staffName: 'Nayem Siddik',
    staffRole: 'Senior Engineer',
    targetType: 'Cable',
    targetIdentifier: 'PCC1W01*',
    action: 'Updated Cable Laying Status',
    fieldChanged: 'Cable Laying',
    oldValue: 'Pending',
    newValue: 'Complete By VEL',
    notes: 'Cable pulled through trench and tray route safely. Insulation verified.'
  },
  {
    id: 'EDT-2026-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    staffUsername: 'Mossadek',
    staffName: 'Mossadek Hossain',
    staffRole: 'Senior Engineer',
    targetType: 'Approval',
    targetIdentifier: 'PCC1W01*',
    action: 'Approved Level 2 Engineering Sign-Off',
    fieldChanged: 'approvedBy2',
    oldValue: 'Pending Sign-Off',
    newValue: 'Mossadek Hossain (Sr. Engr)',
    notes: 'Inspected glanding and torque markings on lugs. Approved.'
  },
  {
    id: 'EDT-2026-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    staffUsername: 'Fahad',
    staffName: 'Md Fahad',
    staffRole: 'Manager PP',
    targetType: 'Work Assignment',
    targetIdentifier: 'PCC1W02*',
    action: 'Assigned Work to Staff',
    fieldChanged: 'Work Assignment',
    newValue: 'Insulation & Megger Test -> Nayem Siddik',
    notes: 'High priority feeder cable test required before energizing switchgear.'
  },
  {
    id: 'EDT-2026-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    staffUsername: 'arman',
    staffName: 'Arman (Admin)',
    staffRole: 'System Administrator',
    targetType: 'Cable',
    targetIdentifier: 'G1W01',
    action: 'Updated Pre-Commissioning Status',
    fieldChanged: 'Pre-Commissioning',
    oldValue: 'Pending',
    newValue: 'Progress',
    notes: 'Generator #1 control cabling pre-commissioning checks initiated.'
  },
  {
    id: 'EDT-2026-005',
    timestamp: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    staffUsername: 'Nayem',
    staffName: 'Nayem Siddik',
    staffRole: 'Senior Engineer',
    targetType: 'Approval',
    targetIdentifier: 'G1W02',
    action: 'Approved Level 1 Engineering Sign-Off',
    fieldChanged: 'approvedBy1',
    oldValue: 'Pending Sign-Off',
    newValue: 'Nayem Siddik (Sr. Engr)',
    notes: 'Continuity & resistance checks verified against Rev 3 specifications.'
  }
];
