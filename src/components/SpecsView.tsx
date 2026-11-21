import React from 'react';
import { FileText, ShieldCheck, History, Info, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SpecsView: React.FC = () => {
  const { settings } = useApp();

  const revHistory = [
    { rev: '3', date: '17.11.2025', by: 'AKS', chkd: 'RVR (18.11.2025)', appd: 'AKD (18.11.2025)', notes: 'REVISED AS HIGHLIGHTED - Master LV Power & Control Schedules synchronized' },
    { rev: '2', date: '05.12.2024', by: 'GS', chkd: 'RVR (05.12.2024)', appd: 'AKD (05.12.2024)', notes: 'Installation Details - LV Power Cable Schedule updated' },
    { rev: '1', date: '22.11.2021', by: 'GS/AS', chkd: 'AKD (22.11.2021)', appd: 'AKD (22.11.2021)', notes: 'Engine Rating finalized: 11kV, 50Hz, 27 MW (03 OFF B35:40V20AG2)' },
    { rev: '0', date: '20.03.2023', by: 'GS/AS', chkd: 'AKD (20.03.2023)', appd: 'AKD (20.03.2023)', notes: 'Preliminary engineering issue - OEM: Bergen Engines (BEAS IP)' }
  ];

  const specs = [
    {
      clause: '1.1',
      topic: 'Galvanic Isolation',
      desc: "All analog signals must be galvanic isolated in sender's end. Signal to be powered by sender. Digital signals should, as a general rule, be potential free dry contacts in sender end."
    },
    {
      clause: '1.2',
      topic: 'Signal Voltage & Limits',
      desc: 'No signals connected to the IPC cabinet can carry higher voltage than 48VAC/DC. Maximum current through potential free dry contacts is 6A.'
    },
    {
      clause: '1.3',
      topic: 'Bergen Engines Cabinets Integrity',
      desc: 'No extra equipment must be mounted inside or onto Bergen Engines supplied units without written approval by Bergen Engines.'
    },
    {
      clause: '1.4',
      topic: 'Screening & Shielding Rules',
      desc: 'Interface list must be checked and adjusted according to site conditions (cable length, voltage drop, cable type) by installer. All cables must be of screened type and screened at one end only. Notation: 2x10x0.5mm² (10-pair individually screened); 10x1.5mm² (10-core overall screen).'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          General Technical Information & Installation Specifications
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          From Sheet 7 of Project Doc. No. 1170-41-019 & 1170-41-020 (Bergen Engines 27 MW Complex).
        </p>
      </div>

      {/* Revision History */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="font-bold text-sm text-white flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <span>Document Revision History (Sheet 1)</span>
          </div>
          <span className="text-xs font-mono text-amber-400 font-bold">Current: Rev 3</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 w-14">Rev</th>
                <th className="py-2.5 px-4">Date & Author</th>
                <th className="py-2.5 px-4">Checked By</th>
                <th className="py-2.5 px-4">Approved By</th>
                <th className="py-2.5 px-4">Revision Details & Amendments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {revHistory.map(r => (
                <tr key={r.rev} className="hover:bg-slate-850/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-amber-400">{r.rev}</td>
                  <td className="py-3 px-4 font-medium text-white">{r.by} ({r.date})</td>
                  <td className="py-3 px-4 text-slate-300">{r.chkd}</td>
                  <td className="py-3 px-4 text-emerald-400 font-medium">{r.appd}</td>
                  <td className="py-3 px-4 text-slate-400">{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Installation Specifications */}
      <div className="glass-card rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            General Cable & Electrical Installation Specifications
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {specs.map(s => (
            <div key={s.clause} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Clause {s.clause}
                </span>
                <span className="font-bold text-sm text-white">{s.topic}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
