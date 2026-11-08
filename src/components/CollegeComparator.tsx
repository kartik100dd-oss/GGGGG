import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  GitCompare, DollarSign, MapPin, Award, TrendingUp, Shield, 
  HelpCircle, Compass, Heart, ArrowRight, Sparkles, Check, CheckCircle2 
} from 'lucide-react';
import { CollegeInfo } from '../types';

interface CollegeComparatorProps {
  availableColleges: CollegeInfo[];
}

export default function CollegeComparator({ availableColleges }: CollegeComparatorProps) {
  // Premium default Indian universities for comparison backup/presetting
  const defaultColleges: CollegeInfo[] = [
    {
      name: "IIT Delhi",
      tier: "Dream",
      course: "B.Tech Computer Science",
      location: "New Delhi, Delhi NCR",
      fees: "₹2.2 Lakhs/year",
      hostelCost: "₹35,000/year",
      accreditation: "NIRF Rank 2 / NAAC A++",
      placementQuality: "Excellent (98% placements)",
      averagePackage: "₹22.5 Lakhs/year",
      roi: "Extremely High (Payback in under 6 months)",
      advantages: "Top national coding environment, prime startup culture, elite global network"
    },
    {
      name: "BITS Pilani",
      tier: "Dream",
      course: "B.E. Computer Science",
      location: "Pilani, Rajasthan",
      fees: "₹5.5 Lakhs/year",
      hostelCost: "₹50,000/year",
      accreditation: "NIRF Rank 20 / NAAC A++",
      placementQuality: "Superb (96% placements)",
      averagePackage: "₹19.5 Lakhs/year",
      roi: "Very High (Payback in under 1.5 years)",
      advantages: "Zero attendance policy, massive entrepreneurial alumni, strong brand value"
    },
    {
      name: "Thapar Institute of Technology",
      tier: "Target",
      course: "B.E. Computer Engineering",
      location: "Patiala, Punjab",
      fees: "₹4.5 Lakhs/year",
      hostelCost: "₹65,000/year",
      accreditation: "NIRF Rank 40 / NAAC A+",
      placementQuality: "Good (90% placements)",
      averagePackage: "₹11.2 Lakhs/year",
      roi: "Moderate-High (Payback in under 1.8 years)",
      advantages: "Excellent regional placement quality, superb campus amenities, strong active partnerships"
    },
    {
      name: "Chitkara University",
      tier: "Safe",
      course: "B.E. Computer Science",
      location: "Rajpura, Punjab",
      fees: "₹2.0 Lakhs/year",
      hostelCost: "₹45,000/year",
      accreditation: "NIRF Rank 75 / NAAC A+",
      placementQuality: "Moderate-Good (85% placements)",
      averagePackage: "₹7.5 Lakhs/year",
      roi: "High (Payback in under 1.2 years)",
      advantages: "Affordable fee structures, active placement cell, regular industry hackathons"
    },
    {
      name: "SRM IST",
      tier: "Target",
      course: "B.Tech Computer Science",
      location: "Chennai, Tamil Nadu",
      fees: "₹3.5 Lakhs/year",
      hostelCost: "₹80,000/year",
      accreditation: "NIRF Rank 32 / NAAC A++",
      placementQuality: "Good (88% placements)",
      averagePackage: "₹9.2 Lakhs/year",
      roi: "Moderate (Payback in under 1.8 years)",
      advantages: "Massive campus capacity, global exchange programs, prime corporate ties"
    }
  ];

  // Combine available roadmap colleges with the default comparison set
  const collegesList = availableColleges && availableColleges.length > 0 
    ? [...availableColleges, ...defaultColleges.filter(dc => !availableColleges.some(ac => ac.name.toLowerCase() === dc.name.toLowerCase()))]
    : defaultColleges;

  const [selectedCol1, setSelectedCol1] = useState<string>(collegesList[0]?.name || '');
  const [selectedCol2, setSelectedCol2] = useState<string>(collegesList[1]?.name || collegesList[0]?.name || '');

  const collegeData1 = collegesList.find(c => c.name === selectedCol1);
  const collegeData2 = collegesList.find(c => c.name === selectedCol2);

  // Helper to extract NIRF ranking from the accreditation string
  const extractNIRFRank = (accreditation: string | undefined): string => {
    if (!accreditation) return "Rank N/A";
    const match = accreditation.match(/NIRF\s*(?:Rank|Ranks|#)?\s*(\d+)/i);
    if (match) return `Rank #${match[1]}`;
    // Fallback search for just "Rank \d+"
    const generalRankMatch = accreditation.match(/Rank\s*(\d+)/i);
    if (generalRankMatch) return `Rank #${generalRankMatch[1]}`;
    return "Rank Top 100 Verified";
  };

  // Helper to convert fees string to number for comparison
  const parseFees = (feesStr: string | undefined): number => {
    if (!feesStr) return 0;
    const cleanStr = feesStr.toLowerCase();
    const match = cleanStr.match(/([\d.]+)/);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    if (cleanStr.includes('lakh') || cleanStr.includes('l') || cleanStr.includes('₹')) {
      return value;
    }
    return value / 100000; // Assume plain Rupees
  };

  // Helper to parse average package for numeric comparison
  const parseAvgPackage = (pkgStr: string | undefined): number => {
    if (!pkgStr) return 0;
    const cleanStr = pkgStr.toLowerCase();
    const match = cleanStr.match(/([\d.]+)/);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    return value;
  };

  const fees1 = parseFees(collegeData1?.fees);
  const fees2 = parseFees(collegeData2?.fees);

  const pkg1 = parseAvgPackage(collegeData1?.averagePackage);
  const pkg2 = parseAvgPackage(collegeData2?.averagePackage);

  const nirf1 = extractNIRFRank(collegeData1?.accreditation);
  const nirf2 = extractNIRFRank(collegeData2?.accreditation);

  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-red-50 text-red-600 rounded-lg shrink-0">
              <GitCompare size={18} />
            </span>
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-tight">College Comparator Hub</h3>
          </div>
          <p className="text-[10px] text-gray-500 mt-1 max-w-xl">
            Audit academic pricing metrics, NIRF authority rankings, and student safety & campus coordinates side-by-side.
          </p>
        </div>
        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[8px] font-extrabold uppercase rounded-md tracking-wider">
          Side-By-Side Auditing
        </span>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-gray-100">
        <div>
          <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
            Select College A
          </label>
          <select
            value={selectedCol1}
            onChange={(e) => setSelectedCol1(e.target.value)}
            className="w-full text-xs font-bold text-gray-800 bg-white border border-gray-250 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500"
          >
            {collegesList.map((col, idx) => (
              <option key={`col1-${idx}`} value={col.name}>
                {col.name} ({col.tier} Tier)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
            Select College B
          </label>
          <select
            value={selectedCol2}
            onChange={(e) => setSelectedCol2(e.target.value)}
            className="w-full text-xs font-bold text-gray-800 bg-white border border-gray-250 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500"
          >
            {collegesList.map((col, idx) => (
              <option key={`col2-${idx}`} value={col.name}>
                {col.name} ({col.tier} Tier)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Grid / Table */}
      {collegeData1 && collegeData2 ? (
        <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-xs bg-white">
          <div className="grid grid-cols-3 bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-widest py-3.5 px-4 text-center items-center">
            <span className="text-left text-gray-400">Audited Parameters</span>
            <span className="text-red-400 truncate px-2">{collegeData1.name}</span>
            <span className="text-amber-400 truncate px-2">{collegeData2.name}</span>
          </div>

          <div className="divide-y divide-gray-100 text-xs">
            {/* 1. Academic Tier & Course */}
            <div className="grid grid-cols-3 p-4 items-center gap-4 hover:bg-slate-50/40 transition">
              <span className="font-extrabold text-gray-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Compass size={13} className="text-slate-400" /> Tier & Course
              </span>
              <div className="text-center px-1">
                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                  collegeData1.tier === 'Dream' ? 'bg-purple-100 text-purple-800' :
                  collegeData1.tier === 'Target' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                } mb-1`}>
                  {collegeData1.tier} Tier
                </span>
                <p className="font-semibold text-gray-800 text-[11px] leading-snug">{collegeData1.course}</p>
              </div>
              <div className="text-center px-1">
                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                  collegeData2.tier === 'Dream' ? 'bg-purple-100 text-purple-800' :
                  collegeData2.tier === 'Target' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                } mb-1`}>
                  {collegeData2.tier} Tier
                </span>
                <p className="font-semibold text-gray-800 text-[11px] leading-snug">{collegeData2.course}</p>
              </div>
            </div>

            {/* 2. Annual Academic Fees */}
            <div className="grid grid-cols-3 p-4 items-center gap-4 hover:bg-slate-50/40 transition">
              <span className="font-extrabold text-gray-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
                <DollarSign size={13} className="text-slate-400" /> Academic Fees
              </span>
              <div className="text-center">
                <span className="text-xs font-black text-slate-800">{collegeData1.fees}</span>
                {fees1 > 0 && fees2 > 0 && fees1 < fees2 && (
                  <p className="text-[8px] text-emerald-600 font-extrabold uppercase tracking-wide mt-1 bg-emerald-50 inline-block px-1.5 py-0.5 rounded border border-emerald-100">
                    Saves ~{Math.round((fees2 - fees1) * 10) / 10}L/Yr
                  </p>
                )}
              </div>
              <div className="text-center">
                <span className="text-xs font-black text-slate-800">{collegeData2.fees}</span>
                {fees1 > 0 && fees2 > 0 && fees2 < fees1 && (
                  <p className="text-[8px] text-emerald-600 font-extrabold uppercase tracking-wide mt-1 bg-emerald-50 inline-block px-1.5 py-0.5 rounded border border-emerald-100">
                    Saves ~{Math.round((fees1 - fees2) * 10) / 10}L/Yr
                  </p>
                )}
              </div>
            </div>

            {/* 3. NIRF / Accreditation */}
            <div className="grid grid-cols-3 p-4 items-center gap-4 hover:bg-slate-50/40 transition">
              <span className="font-extrabold text-gray-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Award size={13} className="text-slate-400" /> NIRF Ranking
              </span>
              <div className="text-center">
                <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-extrabold rounded-lg border border-red-100">
                  {nirf1}
                </span>
                <p className="text-[10px] text-gray-500 mt-1.5 font-medium leading-tight">{collegeData1.accreditation}</p>
              </div>
              <div className="text-center">
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-extrabold rounded-lg border border-amber-100">
                  {nirf2}
                </span>
                <p className="text-[10px] text-gray-500 mt-1.5 font-medium leading-tight">{collegeData2.accreditation}</p>
              </div>
            </div>

            {/* 4. Placement Average Package */}
            <div className="grid grid-cols-3 p-4 items-center gap-4 hover:bg-slate-50/40 transition">
              <span className="font-extrabold text-gray-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
                <TrendingUp size={13} className="text-slate-400" /> Placements
              </span>
              <div className="text-center">
                <span className="text-sm font-black text-red-600">{collegeData1.averagePackage}</span>
                <p className="text-[10px] text-gray-500 mt-1 font-semibold leading-tight">{collegeData1.placementQuality}</p>
                {pkg1 > 0 && pkg2 > 0 && pkg1 > pkg2 && (
                  <p className="text-[8px] text-red-600 font-extrabold uppercase tracking-wide mt-1 bg-red-50 inline-block px-1.5 py-0.5 rounded border border-red-100">
                    +{Math.round((pkg1 - pkg2) * 10) / 10} LPA premium
                  </p>
                )}
              </div>
              <div className="text-center">
                <span className="text-sm font-black text-amber-600">{collegeData2.averagePackage}</span>
                <p className="text-[10px] text-gray-500 mt-1 font-semibold leading-tight">{collegeData2.placementQuality}</p>
                {pkg1 > 0 && pkg2 > 0 && pkg2 > pkg1 && (
                  <p className="text-[8px] text-amber-600 font-extrabold uppercase tracking-wide mt-1 bg-amber-50 inline-block px-1.5 py-0.5 rounded border border-amber-100">
                    +{Math.round((pkg2 - pkg1) * 10) / 10} LPA premium
                  </p>
                )}
              </div>
            </div>

            {/* 5. Location & Hostel Cost */}
            <div className="grid grid-cols-3 p-4 items-center gap-4 hover:bg-slate-50/40 transition">
              <span className="font-extrabold text-gray-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
                <MapPin size={13} className="text-slate-400" /> Geography & Living
              </span>
              <div className="text-center">
                <p className="font-bold text-gray-800">{collegeData1.location}</p>
                <p className="text-[10px] text-gray-500 mt-1 font-medium">Hostel: {collegeData1.hostelCost}</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800">{collegeData2.location}</p>
                <p className="text-[10px] text-gray-500 mt-1 font-medium">Hostel: {collegeData2.hostelCost}</p>
              </div>
            </div>

            {/* 6. Return On Investment (ROI) */}
            <div className="grid grid-cols-3 p-4 items-center gap-4 hover:bg-slate-50/40 transition">
              <span className="font-extrabold text-gray-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Shield size={13} className="text-slate-400" /> Return on Invest
              </span>
              <div className="text-center">
                <span className="text-xs font-black text-slate-800">{collegeData1.roi}</span>
              </div>
              <div className="text-center">
                <span className="text-xs font-black text-slate-800">{collegeData2.roi}</span>
              </div>
            </div>

            {/* 7. Strategic Advantages */}
            <div className="grid grid-cols-3 p-4 items-center gap-4 hover:bg-slate-50/40 transition">
              <span className="font-extrabold text-gray-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={13} className="text-slate-400" /> Competitive Edge
              </span>
              <div className="text-left bg-slate-50/40 rounded-xl p-3 leading-relaxed text-[11px] text-gray-600 font-medium">
                {collegeData1.advantages}
              </div>
              <div className="text-left bg-slate-50/40 rounded-xl p-3 leading-relaxed text-[11px] text-gray-600 font-medium">
                {collegeData2.advantages}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-gray-400">
          <HelpCircle size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-xs font-medium">Failed to load colleges for comparison.</p>
        </div>
      )}
    </div>
  );
}
