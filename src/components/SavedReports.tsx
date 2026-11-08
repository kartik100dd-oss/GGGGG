import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Calendar, Trash2, ArrowUpRight, Check, X, 
  GitCompare, ArrowLeft, Coins, Award, BookOpen, 
  Compass, Scale, Shield, Landmark, TrendingUp, ChevronRight
} from 'lucide-react';
import { SavedReportData } from '../firebase';
import { IntelligenceReport } from '../types';
import BlueprintComparator from './BlueprintComparator';

interface SavedReportsProps {
  reports: SavedReportData[];
  onSelectReport: (report: SavedReportData) => void;
  onDeleteReport: (reportId: string) => void;
}

export default function SavedReports({ reports, onSelectReport, onDeleteReport }: SavedReportsProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [showComparatorModal, setShowComparatorModal] = useState(false);
  const [compareTab, setCompareTab] = useState<'overview' | 'financials' | 'colleges' | 'careers'>('overview');

  // Identify all root reports (either no parentReportId, or parent is missing)
  const rootReports = reports.filter(r => {
    if (!r.parentReportId) return true;
    const parentExists = reports.some(parent => parent.id === r.parentReportId);
    return !parentExists;
  });

  // Map each root to its family (the root itself + any children whose parentReportId === root.id)
  const rootReportsWithLatest = rootReports.map(root => {
    const family = reports.filter(r => r.id === root.id || r.parentReportId === root.id);
    // Sort family descending by creation time to find the absolute latest version
    const sortedFamily = [...family].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const latest = sortedFamily[0] || root;
    return {
      root,
      latest,
      versionsCount: family.length
    };
  });

  // Sort the final list by the latest version's createdAt time descending
  const sortedRootReportsWithLatest = [...rootReportsWithLatest].sort((a, b) => 
    new Date(b.latest.createdAt).getTime() - new Date(a.latest.createdAt).getTime()
  );

  if (rootReports.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-8 text-center max-w-xl mx-auto">
        <FileText className="mx-auto text-gray-300 mb-4" size={48} />
        <h4 className="text-sm font-bold text-gray-900">No Saved Reports Found</h4>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          You haven't generated any intelligence blueprints yet. Fill in your student profile and click "Generate AI Intelligence Report" to create and save your first analysis!
        </p>
      </div>
    );
  }

  // Handle toggling select for comparison
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        if (prev.length >= 2) {
          // Keep only the most recent selection and the new one
          return [prev[1], id];
        }
        return [...prev, id];
      }
    });
  };

  // Find the selected reports
  const selectedReports = sortedRootReportsWithLatest.filter(item => selectedIds.includes(item.root.id));
  
  // Parse report data safely using the latest report data from the family
  const parsedReports = selectedReports.map(item => {
    try {
      return {
        id: item.root.id,
        title: item.latest.title,
        createdAt: item.latest.createdAt,
        data: JSON.parse(item.latest.reportData) as IntelligenceReport,
        raw: item.latest
      };
    } catch (e) {
      console.error("Failed to parse report data", e);
      return null;
    }
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  const handleStartComparison = () => {
    if (parsedReports.length === 2) {
      setIsComparing(true);
    }
  };

  // Render comparison view
  if (isComparing && parsedReports.length === 2) {
    const [rep1, rep2] = parsedReports;
    const data1 = rep1.data;
    const data2 = rep2.data;

    return (
      <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm max-w-7xl mx-auto animate-fadeIn">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsComparing(false)}
              className="p-2 border border-gray-200 hover:border-gray-300 rounded-xl hover:bg-slate-50 text-slate-600 transition cursor-pointer"
              title="Back to Blueprints"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <span className="text-[10px] text-red-600 font-extrabold uppercase tracking-widest flex items-center gap-1">
                <GitCompare size={10} /> Side-by-Side Advisor Heuristics
              </span>
              <h3 className="text-base font-extrabold text-slate-800">
                Educational Blueprint Comparison
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 border border-gray-200 hover:border-red-200 text-slate-500 hover:text-red-600 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Clear Comparison
            </button>
            <button
              onClick={() => setIsComparing(false)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Exit Viewer
            </button>
          </div>
        </div>

        {/* Blueprint Columns Summary Headers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-5 rounded-2xl border-2 border-red-500/20 bg-slate-50/50 relative">
            <span className="absolute top-3 right-3 text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Blueprint A
            </span>
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Calendar size={12} />
              <span>{new Date(rep1.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <h4 className="text-sm font-black text-slate-800 leading-snug">{rep1.title}</h4>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => onSelectReport(rep1.raw)}
                className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-extrabold rounded-xl uppercase tracking-wider transition active:scale-95 cursor-pointer"
              >
                <span>Load Fully</span>
                <ArrowUpRight size={10} className="ml-1" />
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl border-2 border-amber-500/20 bg-slate-50/50 relative">
            <span className="absolute top-3 right-3 text-[10px] bg-amber-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Blueprint B
            </span>
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Calendar size={12} />
              <span>{new Date(rep2.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <h4 className="text-sm font-black text-slate-800 leading-snug">{rep2.title}</h4>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => onSelectReport(rep2.raw)}
                className="inline-flex items-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-extrabold rounded-xl uppercase tracking-wider transition active:scale-95 cursor-pointer"
              >
                <span>Load Fully</span>
                <ArrowUpRight size={10} className="ml-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-gray-150 mb-6 overflow-x-auto gap-2">
          <button
            onClick={() => setCompareTab('overview')}
            className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 whitespace-nowrap cursor-pointer ${
              compareTab === 'overview'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 Overview & DNA
          </button>
          <button
            onClick={() => setCompareTab('financials')}
            className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 whitespace-nowrap cursor-pointer ${
              compareTab === 'financials'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            💰 ROI & Financials
          </button>
          <button
            onClick={() => setCompareTab('colleges')}
            className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 whitespace-nowrap cursor-pointer ${
              compareTab === 'colleges'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🏛️ College Advisors
          </button>
          <button
            onClick={() => setCompareTab('careers')}
            className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 whitespace-nowrap cursor-pointer ${
              compareTab === 'careers'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            💼 Career Pathways
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-6">
          {compareTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Executive Summary Card A */}
              <div className="p-5 border border-slate-100 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
                  <BookOpen className="text-red-500" size={16} />
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
                    Executive Summary (A)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{data1.executiveSummary || 'No summary available.'}"
                </p>

                {/* Suitability Evaluation */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-red-600">Stream Suitability</span>
                  <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                    {data1.streamEvaluation?.currentSuitability || 'N/A'}
                  </p>
                </div>

                {/* Student DNA Ratings */}
                <div className="space-y-3 pt-2">
                  <h5 className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Student DNA Calibration</h5>
                  {data1.studentDna?.scores && (
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {Object.entries(data1.studentDna.scores).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-lg">
                          <span className="font-semibold text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-extrabold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">{val}/100</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Executive Summary Card B */}
              <div className="p-5 border border-slate-100 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
                  <BookOpen className="text-amber-500" size={16} />
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
                    Executive Summary (B)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{data2.executiveSummary || 'No summary available.'}"
                </p>

                {/* Suitability Evaluation */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-600">Stream Suitability</span>
                  <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                    {data2.streamEvaluation?.currentSuitability || 'N/A'}
                  </p>
                </div>

                {/* Student DNA Ratings */}
                <div className="space-y-3 pt-2">
                  <h5 className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Student DNA Calibration</h5>
                  {data2.studentDna?.scores && (
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {Object.entries(data2.studentDna.scores).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-lg">
                          <span className="font-semibold text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">{val}/100</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {compareTab === 'financials' && (
            <div className="space-y-6">
              {/* Core Financial Side-by-Side Matrix */}
              <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[9px] font-black tracking-widest">
                      <th className="p-4 w-1/3 border-b border-slate-800">Financial Metrics</th>
                      <th className="p-4 w-1/3 border-b border-slate-800 text-red-400">Blueprint A</th>
                      <th className="p-4 w-1/3 border-b border-slate-800 text-amber-400">Blueprint B</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    <tr>
                      <td className="p-4 font-extrabold text-slate-800 bg-slate-50/50">Total Capital Investment</td>
                      <td className="p-4 text-slate-900 font-bold">{data1.roiAnalyzer?.totalInvestment || 'N/A'}</td>
                      <td className="p-4 text-slate-900 font-bold">{data2.roiAnalyzer?.totalInvestment || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-extrabold text-slate-800 bg-slate-50/50">Expected Starting Salary</td>
                      <td className="p-4 text-slate-900 font-bold text-emerald-600 bg-emerald-50/10">
                        {data1.roiAnalyzer?.expectedAnnualSalary || data1.placementOutlook?.entrySalary || 'N/A'}
                      </td>
                      <td className="p-4 text-slate-900 font-bold text-emerald-600 bg-emerald-50/10">
                        {data2.roiAnalyzer?.expectedAnnualSalary || data2.placementOutlook?.entrySalary || 'N/A'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-extrabold text-slate-800 bg-slate-50/50">Estimated Payback Window</td>
                      <td className="p-4 text-slate-900 font-bold">{data1.roiAnalyzer?.paybackPeriodMonths || 'N/A'} months</td>
                      <td className="p-4 text-slate-900 font-bold">{data2.roiAnalyzer?.paybackPeriodMonths || 'N/A'} months</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-extrabold text-slate-800 bg-slate-50/50">ROI Performance Grade</td>
                      <td className="p-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {data1.roiAnalyzer?.rating || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {data2.roiAnalyzer?.rating || 'N/A'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-extrabold text-slate-800 bg-slate-50/50">Annual Cost of Living</td>
                      <td className="p-4 text-slate-900">{data1.costOfLiving?.annualTotal || 'N/A'}</td>
                      <td className="p-4 text-slate-900">{data2.costOfLiving?.annualTotal || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-extrabold text-slate-800 bg-slate-50/50">Mid-Career Salary Estimate</td>
                      <td className="p-4 text-slate-900 font-bold">{data1.placementOutlook?.midCareerSalary || 'N/A'}</td>
                      <td className="p-4 text-slate-900 font-bold">{data2.placementOutlook?.midCareerSalary || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Financial Breakdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-[9px] font-black uppercase tracking-wider text-red-600 block mb-1">ROI Analysis Breakdown A</span>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{data1.roiAnalyzer?.breakdown || 'No financial commentary available.'}"
                  </p>
                </div>
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 block mb-1">ROI Analysis Breakdown B</span>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{data2.roiAnalyzer?.breakdown || 'No financial commentary available.'}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {compareTab === 'colleges' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Colleges side A */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
                  <Landmark className="text-red-500" size={16} />
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
                    Blueprint A: College Portfolio
                  </h4>
                </div>
                
                {data1.colleges && data1.colleges.length > 0 ? (
                  <div className="space-y-3">
                    {data1.colleges.map((college, idx) => (
                      <div key={idx} className="p-4 border border-slate-100 bg-slate-50/40 rounded-xl space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border mb-1 ${
                              college.tier === 'Dream' ? 'bg-red-50 text-red-700 border-red-150' :
                              college.tier === 'Target' ? 'bg-blue-50 text-blue-700 border-blue-150' :
                              'bg-emerald-50 text-emerald-700 border-emerald-150'
                            }`}>
                              {college.tier} College
                            </span>
                            <h5 className="text-xs font-bold text-slate-850 leading-tight">{college.name}</h5>
                            <span className="text-[10px] text-slate-400 font-bold">{college.location}</span>
                          </div>
                          <span className="text-xs font-extrabold text-slate-800 shrink-0 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                            {college.averagePackage} LPA avg
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-[10px] pt-1.5 border-t border-slate-100 text-slate-600">
                          <div>
                            <span className="font-semibold text-slate-400 block">Annual Fees</span>
                            <span className="font-bold text-slate-700">{college.fees}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400 block">ROI Rating</span>
                            <span className="font-bold text-slate-700">{college.roi}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400 block">Placement Rating</span>
                            <span className="font-bold text-slate-700">{college.placementQuality}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400 block">Accreditation</span>
                            <span className="font-bold text-slate-700">{college.accreditation}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-bold py-4 text-center">No colleges proposed.</p>
                )}
              </div>

              {/* Colleges side B */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
                  <Landmark className="text-amber-500" size={16} />
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
                    Blueprint B: College Portfolio
                  </h4>
                </div>

                {data2.colleges && data2.colleges.length > 0 ? (
                  <div className="space-y-3">
                    {data2.colleges.map((college, idx) => (
                      <div key={idx} className="p-4 border border-slate-100 bg-slate-50/40 rounded-xl space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border mb-1 ${
                              college.tier === 'Dream' ? 'bg-red-50 text-red-700 border-red-150' :
                              college.tier === 'Target' ? 'bg-blue-50 text-blue-700 border-blue-150' :
                              'bg-emerald-50 text-emerald-700 border-emerald-150'
                            }`}>
                              {college.tier} College
                            </span>
                            <h5 className="text-xs font-bold text-slate-850 leading-tight">{college.name}</h5>
                            <span className="text-[10px] text-slate-400 font-bold">{college.location}</span>
                          </div>
                          <span className="text-xs font-extrabold text-slate-800 shrink-0 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                            {college.averagePackage} LPA avg
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] pt-1.5 border-t border-slate-100 text-slate-600">
                          <div>
                            <span className="font-semibold text-slate-400 block">Annual Fees</span>
                            <span className="font-bold text-slate-700">{college.fees}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400 block">ROI Rating</span>
                            <span className="font-bold text-slate-700">{college.roi}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400 block">Placement Rating</span>
                            <span className="font-bold text-slate-700">{college.placementQuality}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400 block">Accreditation</span>
                            <span className="font-bold text-slate-700">{college.accreditation}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-bold py-4 text-center">No colleges proposed.</p>
                )}
              </div>
            </div>
          )}

          {compareTab === 'careers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Careers side A */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
                  <TrendingUp className="text-red-500" size={16} />
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
                    Blueprint A: Career Demands
                  </h4>
                </div>

                {data1.careerDNA && data1.careerDNA.length > 0 ? (
                  <div className="space-y-3">
                    {data1.careerDNA.map((career, idx) => (
                      <div key={idx} className="p-4 border border-slate-100 bg-slate-50/40 rounded-xl space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h5 className="text-xs font-black text-slate-800">{career.title}</h5>
                            <span className="text-[9px] text-slate-400 font-bold">{career.degreePath}</span>
                          </div>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded">
                            {career.salaryOutlook}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] pt-1.5 border-t border-slate-100 text-slate-600">
                          <div>
                            <span className="font-semibold text-slate-400 block">Future Demand</span>
                            <span className="font-bold text-slate-700">{career.futureDemand}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400 block">AI Displacement Risk</span>
                            <span className="font-bold text-slate-700">{career.aiRisk}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-bold py-4 text-center">No careers recommendations.</p>
                )}

                {/* Study Abroad Side A */}
                {data1.studyAbroad && (
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-red-600 block">Study Abroad Guidance</span>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">{data1.studyAbroad.guidance}</p>
                    {data1.studyAbroad.countries && data1.studyAbroad.countries.length > 0 && (
                      <div className="flex gap-1 flex-wrap pt-1">
                        {data1.studyAbroad.countries.map((c, i) => (
                          <span key={i} className="text-[9px] font-bold bg-white px-2 py-0.5 border border-slate-200 rounded text-slate-600">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Careers side B */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
                  <TrendingUp className="text-amber-500" size={16} />
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
                    Blueprint B: Career Demands
                  </h4>
                </div>

                {data2.careerDNA && data2.careerDNA.length > 0 ? (
                  <div className="space-y-3">
                    {data2.careerDNA.map((career, idx) => (
                      <div key={idx} className="p-4 border border-slate-100 bg-slate-50/40 rounded-xl space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h5 className="text-xs font-black text-slate-800">{career.title}</h5>
                            <span className="text-[9px] text-slate-400 font-bold">{career.degreePath}</span>
                          </div>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded">
                            {career.salaryOutlook}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] pt-1.5 border-t border-slate-100 text-slate-600">
                          <div>
                            <span className="font-semibold text-slate-400 block">Future Demand</span>
                            <span className="font-bold text-slate-700">{career.futureDemand}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-400 block">AI Displacement Risk</span>
                            <span className="font-bold text-slate-700">{career.aiRisk}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-bold py-4 text-center">No careers recommendations.</p>
                )}

                {/* Study Abroad Side B */}
                {data2.studyAbroad && (
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 block">Study Abroad Guidance</span>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">{data2.studyAbroad.guidance}</p>
                    {data2.studyAbroad.countries && data2.studyAbroad.countries.length > 0 && (
                      <div className="flex gap-1 flex-wrap pt-1">
                        {data2.studyAbroad.countries.map((c, i) => (
                          <span key={i} className="text-[9px] font-bold bg-white px-2 py-0.5 border border-slate-200 rounded text-slate-600">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
        <h3 className="text-base font-extrabold text-gray-900 flex items-center">
          <FileText className="text-red-500 mr-2" size={20} />
          Your Saved Educational Blueprints ({sortedRootReportsWithLatest.length})
        </h3>

        {/* Blueprint Comparison Launcher */}
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <span className="text-[10px] font-extrabold text-red-600 bg-red-50 px-2.5 py-1 rounded-xl border border-red-150">
              Selected: {selectedIds.length}/2
            </span>
          )}
          <button
            onClick={() => {
              if (parsedReports.length === 2) {
                setShowComparatorModal(true);
              } else {
                handleStartComparison();
              }
            }}
            disabled={selectedIds.length !== 2}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition duration-150 uppercase tracking-wider ${
              selectedIds.length === 2
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer active:scale-95'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
            title={selectedIds.length !== 2 ? "Select exactly two blueprints below to unlock comparative heuristics" : "Compare Selected Blueprints Side-by-Side"}
          >
            <GitCompare size={14} />
            <span>Side-by-Side Comparator</span>
          </button>
        </div>
      </div>

      {selectedIds.length === 1 && (
        <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl mb-4 text-center animate-pulse">
          <p className="text-[10px] font-bold text-red-600">
            Select one more blueprint below to run the comparative advisor model.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {sortedRootReportsWithLatest.map(({ root, latest, versionsCount }) => {
          const isPendingDelete = deleteConfirmId === root.id;
          const isSelected = selectedIds.includes(root.id);

          return (
            <motion.div
              key={root.id}
              whileHover={{ y: -2 }}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl transition duration-200 gap-3 ${
                isSelected 
                  ? 'border-red-400 bg-red-50/10' 
                  : 'border-gray-100 hover:border-red-200 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {/* Selection Checkbox */}
                <button
                  onClick={() => handleToggleSelect(root.id)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                    isSelected 
                      ? 'bg-red-600 border-red-600 text-white' 
                      : 'border-slate-300 bg-white hover:border-red-500'
                  }`}
                  title="Select for side-by-side comparison"
                >
                  {isSelected && <Check size={12} className="stroke-[3]" />}
                </button>

                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 relative">
                  <FileText size={20} />
                  {versionsCount > 1 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border border-white">
                      v{versionsCount}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{latest.title}</h4>
                    {versionsCount > 1 && (
                      <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[8px] font-bold rounded">
                        {versionsCount} versions
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1.5 text-[10px] text-gray-400 mt-0.5">
                    <Calendar size={12} />
                    <span>Latest: {new Date(latest.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                {!isPendingDelete ? (
                  <>
                    <button
                      onClick={() => onSelectReport(latest)}
                      className="inline-flex items-center px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer"
                    >
                      <span>Load Blueprint</span>
                      <ArrowUpRight size={12} className="ml-1" />
                    </button>
                    
                    <button
                      onClick={() => setDeleteConfirmId(root.id)}
                      className="p-1.5 border border-gray-200 hover:border-red-200 hover:text-red-600 rounded-lg text-gray-400 transition cursor-pointer"
                      title="Delete Report"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                ) : (
                  <div className="flex items-center bg-red-50 border border-red-200 rounded-lg p-1 space-x-1 animate-fadeIn">
                    <span className="text-[10px] font-bold text-red-700 px-2">Delete?</span>
                    <button
                      onClick={() => {
                        onDeleteReport(root.id);
                        setDeleteConfirmId(null);
                        // Clean up selected comparison if deleted
                        setSelectedIds(prev => prev.filter(id => id !== root.id));
                      }}
                      className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition cursor-pointer"
                      title="Confirm Delete"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="p-1 bg-white border border-gray-200 text-gray-500 rounded hover:bg-gray-100 transition cursor-pointer"
                      title="Cancel"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {showComparatorModal && parsedReports.length === 2 && (
        <BlueprintComparator
          reportA={parsedReports[0].raw}
          reportB={parsedReports[1].raw}
          onClose={() => setShowComparatorModal(false)}
        />
      )}
    </div>
  );
}
