import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRightLeft, Download, Award, TrendingUp, GraduationCap, DollarSign, ShieldAlert, Sparkles, Check, AlertCircle } from 'lucide-react';
import { SavedReportData } from '../firebase';
import { IntelligenceReport } from '../types';

interface BlueprintComparatorProps {
  reportA: SavedReportData;
  reportB: SavedReportData;
  onClose: () => void;
}

export default function BlueprintComparator({ reportA, reportB, onClose }: BlueprintComparatorProps) {
  let dataA: IntelligenceReport | null = null;
  let dataB: IntelligenceReport | null = null;

  try {
    dataA = JSON.parse(reportA.reportData) as IntelligenceReport;
  } catch (e) {
    console.error('Error parsing report A:', e);
  }

  try {
    dataB = JSON.parse(reportB.reportData) as IntelligenceReport;
  } catch (e) {
    console.error('Error parsing report B:', e);
  }

  const handlePrint = () => {
    window.print();
  };

  if (!dataA || !dataB) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-center">
          <AlertCircle className="mx-auto text-rose-500 mb-3" size={36} />
          <h3 className="text-base font-black text-slate-900">Blueprint Parse Error</h3>
          <p className="text-xs text-slate-500 mt-2">One of the selected blueprints could not be parsed into comparison format.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Close</button>
        </div>
      </div>
    );
  }

  const dnaKeys: { key: keyof IntelligenceReport['studentDna']['scores']; label: string }[] = [
    { key: 'academic', label: 'Academic Index' },
    { key: 'problemSolving', label: 'Problem Solving' },
    { key: 'innovation', label: 'Innovation Aptitude' },
    { key: 'leadership', label: 'Leadership & Vision' },
    { key: 'communication', label: 'Communication Dynamics' },
    { key: 'research', label: 'Research Depth' },
    { key: 'entrepreneurship', label: 'Entrepreneurial Drive' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col p-2 sm:p-6 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col h-full max-w-7xl mx-auto w-full border border-slate-200 overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                Dual Blueprint Analytical Comparator
                <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30">Side-by-Side</span>
              </h2>
              <p className="text-[11px] text-slate-400">Benchmarking divergent career trajectories, admission odds, and financial ROI</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer border border-slate-700"
            >
              <Download size={13} />
              <span>Print / Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50">
          
          {/* Header Banner Side-by-Side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Blueprint A Header */}
            <div className="p-4 bg-white rounded-xl border-2 border-red-200 shadow-xs relative">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded">Blueprint A</span>
              <h3 className="text-base font-black text-slate-900 mt-2 truncate">{reportA.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Created: {new Date(reportA.createdAt).toLocaleDateString()}</p>
              <div className="mt-2 text-xs font-medium text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-2">
                {dataA.executiveSummary}
              </div>
            </div>

            {/* Blueprint B Header */}
            <div className="p-4 bg-white rounded-xl border-2 border-blue-200 shadow-xs relative">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Blueprint B</span>
              <h3 className="text-base font-black text-slate-900 mt-2 truncate">{reportB.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Created: {new Date(reportB.createdAt).toLocaleDateString()}</p>
              <div className="mt-2 text-xs font-medium text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-2">
                {dataB.executiveSummary}
              </div>
            </div>
          </div>

          {/* Section 1: Student DNA Score Delta Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2">
              <Award size={16} className="text-amber-600" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Student DNA 7-Axis Competency Delta</h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Competency Dimension</th>
                    <th className="py-2.5 px-4 text-center text-red-700 bg-red-50/50">Blueprint A Score</th>
                    <th className="py-2.5 px-4 text-center text-blue-700 bg-blue-50/50">Blueprint B Score</th>
                    <th className="py-2.5 px-4 text-center">Variance / Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {dnaKeys.map(({ key, label }) => {
                    const valA = dataA?.studentDna?.scores?.[key] ?? 70;
                    const valB = dataB?.studentDna?.scores?.[key] ?? 70;
                    const delta = valB - valA;
                    return (
                      <tr key={key} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-slate-800">{label}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900">{valA}/100</td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900">{valB}/100</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                            delta > 0 ? 'bg-emerald-50 text-emerald-700' : delta < 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {delta > 0 ? `+${delta} (B Ahead)` : delta < 0 ? `${delta} (A Ahead)` : 'Parity'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Career Path & Salary Trajectory Comparison */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-600" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Target Career Paths & Compensation Comparison</h4>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-200">
              {/* Report A Career DNA */}
              <div className="p-4 space-y-3">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Blueprint A Target Careers</span>
                {(dataA.careerDNA || []).slice(0, 3).map((career, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <div className="font-bold text-slate-900">{career.title}</div>
                    <div className="text-[11px] text-emerald-700 font-semibold mt-1">Salary: {career.salaryOutlook}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Demand: {career.futureDemand}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Degree: {career.degreePath}</div>
                  </div>
                ))}
              </div>

              {/* Report B Career DNA */}
              <div className="p-4 space-y-3">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Blueprint B Target Careers</span>
                {(dataB.careerDNA || []).slice(0, 3).map((career, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <div className="font-bold text-slate-900">{career.title}</div>
                    <div className="text-[11px] text-emerald-700 font-semibold mt-1">Salary: {career.salaryOutlook}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Demand: {career.futureDemand}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Degree: {career.degreePath}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Admission Chances & Target Colleges */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2">
              <GraduationCap size={16} className="text-purple-600" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">College Admission Probability Comparison</h4>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-200">
              {/* College Admissions A */}
              <div className="p-4 space-y-2.5">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Blueprint A Colleges</span>
                {(dataA.admissionChances || []).slice(0, 3).map((adm, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{adm.collegeName}</div>
                      <div className="text-[11px] text-slate-500">{adm.category} Tier</div>
                    </div>
                    <div className="font-mono font-black text-red-600 text-sm">{adm.probability}</div>
                  </div>
                ))}
              </div>

              {/* College Admissions B */}
              <div className="p-4 space-y-2.5">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Blueprint B Colleges</span>
                {(dataB.admissionChances || []).slice(0, 3).map((adm, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{adm.collegeName}</div>
                      <div className="text-[11px] text-slate-500">{adm.category} Tier</div>
                    </div>
                    <div className="font-mono font-black text-blue-600 text-sm">{adm.probability}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Financial ROI & Payback Horizon */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-600" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Financial Investment & ROI Payback Horizon</h4>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-200 p-4">
              <div className="pr-4 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Blueprint A ROI Metrics</span>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Est. Total 4-Yr Outlay:</span>
                  <span className="font-bold text-slate-900">{dataA.roiAnalyzer?.totalInvestment || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Median Starting Package:</span>
                  <span className="font-bold text-emerald-600">{dataA.roiAnalyzer?.expectedAnnualSalary || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Capital Payback Period:</span>
                  <span className="font-bold text-slate-900">{dataA.roiAnalyzer?.paybackPeriodMonths || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Overall Rating:</span>
                  <span className="font-bold text-red-700">{dataA.roiAnalyzer?.rating || 'Strong ROI'}</span>
                </div>
              </div>

              <div className="pl-4 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Blueprint B ROI Metrics</span>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Est. Total 4-Yr Outlay:</span>
                  <span className="font-bold text-slate-900">{dataB.roiAnalyzer?.totalInvestment || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Median Starting Package:</span>
                  <span className="font-bold text-emerald-600">{dataB.roiAnalyzer?.expectedAnnualSalary || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Capital Payback Period:</span>
                  <span className="font-bold text-slate-900">{dataB.roiAnalyzer?.paybackPeriodMonths || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Overall Rating:</span>
                  <span className="font-bold text-blue-700">{dataB.roiAnalyzer?.rating || 'Strong ROI'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400">Comparing 2 distinct educational blueprints. Data computed from AI RED DRAGON intelligence models.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            Done Comparing
          </button>
        </div>
      </div>
    </div>
  );
}
