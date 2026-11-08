import { useState } from 'react';
import { motion } from 'motion/react';
import { Swords, Check, AlertCircle, TrendingUp, DollarSign, Shield } from 'lucide-react';
import { CollegeInfo } from '../types';

interface CollegeBattleProps {
  availableColleges: CollegeInfo[];
}

export default function CollegeBattle({ availableColleges }: CollegeBattleProps) {
  const defaultColleges: CollegeInfo[] = [
    {
      name: "IIT Delhi",
      tier: "Dream",
      course: "B.Tech Computer Science",
      location: "New Delhi",
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
      accreditation: "NAAC A++ / NIRF Rank 20",
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
      accreditation: "NAAC A+ / NIRF Rank 40",
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
      accreditation: "NAAC A+",
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
      accreditation: "NAAC A++",
      placementQuality: "Good (88% placements)",
      averagePackage: "₹9.2 Lakhs/year",
      roi: "Moderate (Payback in under 1.8 years)",
      advantages: "Massive campus capacity, global exchange programs, prime corporate ties"
    }
  ];

  // Combine generated colleges with standard defaults
  const collegesList = availableColleges && availableColleges.length > 0 
    ? [...availableColleges, ...defaultColleges.filter(dc => !availableColleges.some(ac => ac.name === dc.name))]
    : defaultColleges;

  const [college1, setCollege1] = useState<string>(collegesList[0]?.name || '');
  const [college2, setCollege2] = useState<string>(collegesList[1]?.name || collegesList[0]?.name || '');

  const colData1 = collegesList.find(c => c.name === college1);
  const colData2 = collegesList.find(c => c.name === college2);

  // Helper to extract numerical value from strings
  const getPackageNum = (pkgStr: string | undefined): number => {
    if (!pkgStr) return 0;
    const match = pkgStr.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const getFeesNum = (feesStr: string | undefined): number => {
    if (!feesStr) return 0;
    const match = feesStr.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const pkg1 = getPackageNum(colData1?.averagePackage);
  const pkg2 = getPackageNum(colData2?.averagePackage);

  const fees1 = getFeesNum(colData1?.fees);
  const fees2 = getFeesNum(colData2?.fees);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-6 border-b border-gray-100 pb-4">
        <Swords className="text-red-500 animate-pulse" size={24} />
        <div>
          <h3 className="text-lg font-extrabold text-gray-900">COLLEGE BATTLE MODE</h3>
          <p className="text-xs text-gray-500 mt-0.5">Compare key performance and ROI markers side-by-side.</p>
        </div>
      </div>

      {/* Dropdown selectors */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">College Alpha</label>
          <select
            value={college1}
            onChange={(e) => setCollege1(e.target.value)}
            className="w-full text-sm font-semibold border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 bg-white"
          >
            {collegesList.map((c) => (
              <option key={c.name} value={c.name}>{c.name} ({c.tier})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">College Beta</label>
          <select
            value={college2}
            onChange={(e) => setCollege2(e.target.value)}
            className="w-full text-sm font-semibold border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 bg-white"
          >
            {collegesList.map((c) => (
              <option key={c.name} value={c.name}>{c.name} ({c.tier})</option>
            ))}
          </select>
        </div>
      </div>

      {colData1 && colData2 ? (
        <div className="grid md:grid-cols-2 gap-6 relative">
          {/* Visual dividing element */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 text-white font-black text-xs h-8 w-8 items-center justify-center rounded-full border-4 border-white shadow-md z-10">
            VS
          </div>

          {/* College 1 Card */}
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className={`border border-gray-100 rounded-2xl p-5 ${pkg1 >= pkg2 ? 'bg-gradient-to-tr from-white to-red-50/10 border-red-100' : ''}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 uppercase tracking-widest">
                {colData1.tier} tier
              </span>
              {pkg1 >= pkg2 && (
                <span className="inline-flex items-center text-[10px] font-extrabold text-red-600 bg-red-100/50 border border-red-200 px-2 py-0.5 rounded-md">
                  Higher Pkg
                </span>
              )}
            </div>

            <h4 className="text-xl font-black text-gray-900">{colData1.name}</h4>
            <p className="text-xs font-semibold text-red-600 mt-1">{colData1.course}</p>
            <p className="text-xs text-gray-400 mt-0.5">{colData1.location}</p>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Annual Academic Fees</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-bold text-gray-800">{colData1.fees}</span>
                  {fees1 <= fees2 && fees1 > 0 && (
                    <span className="text-[9px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-extrabold border border-green-100">More Budget Friendly</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Average Campus Placement</p>
                <p className="text-base font-extrabold text-slate-800 mt-0.5 flex items-center">
                  <TrendingUp size={16} className="text-red-500 mr-1 shrink-0" />
                  {colData1.averagePackage}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Campus Accreditation</p>
                <p className="text-xs font-semibold text-gray-700 mt-0.5">{colData1.accreditation}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ROI Assessment</p>
                <p className="text-xs font-semibold text-amber-700 mt-0.5">{colData1.roi}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Key Competitive Edge</p>
                <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{colData1.advantages}</p>
              </div>
            </div>
          </motion.div>

          {/* College 2 Card */}
          <motion.div 
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            className={`border border-gray-100 rounded-2xl p-5 ${pkg2 >= pkg1 ? 'bg-gradient-to-tr from-white to-red-50/10 border-red-100' : ''}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 uppercase tracking-widest">
                {colData2.tier} tier
              </span>
              {pkg2 >= pkg1 && (
                <span className="inline-flex items-center text-[10px] font-extrabold text-red-600 bg-red-100/50 border border-red-200 px-2 py-0.5 rounded-md">
                  Higher Pkg
                </span>
              )}
            </div>

            <h4 className="text-xl font-black text-gray-900">{colData2.name}</h4>
            <p className="text-xs font-semibold text-red-600 mt-1">{colData2.course}</p>
            <p className="text-xs text-gray-400 mt-0.5">{colData2.location}</p>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Annual Academic Fees</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-bold text-gray-800">{colData2.fees}</span>
                  {fees2 <= fees1 && fees2 > 0 && (
                    <span className="text-[9px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-extrabold border border-green-100">More Budget Friendly</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Average Campus Placement</p>
                <p className="text-base font-extrabold text-slate-800 mt-0.5 flex items-center">
                  <TrendingUp size={16} className="text-red-500 mr-1 shrink-0" />
                  {colData2.averagePackage}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Campus Accreditation</p>
                <p className="text-xs font-semibold text-gray-700 mt-0.5">{colData2.accreditation}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ROI Assessment</p>
                <p className="text-xs font-semibold text-amber-700 mt-0.5">{colData2.roi}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Key Competitive Edge</p>
                <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{colData2.advantages}</p>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center">Please generate an AI Report first to activate fully customized comparative lists.</p>
      )}
    </div>
  );
}
