import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Sliders, Milestone, DollarSign, BrainCircuit, RefreshCw } from 'lucide-react';

interface WhatIfSimulatorProps {
  currentMarks: string;
  currentBudget: string;
  currentStream: string;
  onSimulate: (simData: { marks: string; budget: string; stream: string }) => void;
  isSimulating: boolean;
}

export default function WhatIfSimulator({ currentMarks, currentBudget, currentStream, onSimulate, isSimulating }: WhatIfSimulatorProps) {
  const [marksValue, setMarksValue] = useState<number>(() => {
    const num = parseFloat(currentMarks);
    return isNaN(num) ? 85 : num;
  });

  const [budgetValue, setBudgetValue] = useState<number>(() => {
    if (currentBudget.includes('10')) return 1000000;
    if (currentBudget.includes('5')) return 500000;
    if (currentBudget.includes('3')) return 300000;
    if (currentBudget.includes('2')) return 200000;
    return 350000;
  });

  const [streamValue, setStreamValue] = useState<string>(currentStream || 'Science PCM');

  // Local eligibility simulation
  let simulatedEligibility = "Moderate eligibility for tier-1 national colleges.";
  let recommendationsCount = 4;
  if (marksValue >= 95) {
    simulatedEligibility = "Exceptional eligibility! Highly qualified for Dream status and premier merit-based scholarships.";
    recommendationsCount = 8;
  } else if (marksValue >= 85) {
    simulatedEligibility = "Strong suitability. Confident fit for excellent Target colleges and state scholarships.";
    recommendationsCount = 6;
  } else if (marksValue < 75) {
    simulatedEligibility = "Directing attention toward strong skill acquisition and high ROI local Safe colleges.";
    recommendationsCount = 3;
  }

  const handleSimulateSubmit = () => {
    onSimulate({
      marks: `${marksValue}%`,
      budget: `₹${budgetValue.toLocaleString()} / year`,
      stream: streamValue
    });
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute right-0 bottom-0 opacity-10">
        <Sliders size={200} />
      </div>

      <div className="flex items-center space-x-2 mb-6 border-b border-slate-800 pb-4 relative z-10">
        <BrainCircuit className="text-amber-400 animate-pulse" size={24} />
        <div>
          <h3 className="text-lg font-extrabold text-white">WHAT-IF SIMULATOR CONSOLE</h3>
          <p className="text-xs text-gray-400">Instantly test alternate marks, budget limits, or streams to see suitability shifts.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 relative z-10">
        {/* Controls */}
        <div className="space-y-6">
          {/* Slider for Marks */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Class 12 Percentage ({marksValue}%)</label>
              <span className="text-xs font-black text-amber-400">{marksValue >= 90 ? 'Outstanding' : marksValue >= 75 ? 'First Class' : 'Second Class'}</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={marksValue}
              onChange={(e) => setMarksValue(parseInt(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Slider for Budget */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Annual Budget Limit (₹{budgetValue.toLocaleString()})</label>
            </div>
            <input
              type="range"
              min="100000"
              max="1500000"
              step="50000"
              value={budgetValue}
              onChange={(e) => setBudgetValue(parseInt(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Dropdown for Stream */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Alternate Stream Target</label>
            <select
              value={streamValue}
              onChange={(e) => setStreamValue(e.target.value)}
              className="w-full text-sm font-semibold border border-slate-800 bg-slate-950 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-white"
            >
              <option value="Science PCM">Science PCM (Engineering, IT, Maths)</option>
              <option value="Science PCB">Science PCB (Medical, Biotech, Pharmacy)</option>
              <option value="Commerce">Commerce & Business Administration</option>
              <option value="Arts">Arts & Liberal Humanities</option>
              <option value="Law">Law & Corporate Counsel</option>
              <option value="Design">Design & Product Design</option>
              <option value="Defence">Defence Services</option>
              <option value="Management">Management (BBA/IPM)</option>
            </select>
          </div>
        </div>

        {/* Live Simulation Outcomes */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/15 text-amber-400 uppercase tracking-widest border border-amber-500/20">
              Live Suitability Feedback
            </span>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Estimated Eligibility Rank</p>
                <p className="text-sm font-bold text-gray-200 mt-1">{simulatedEligibility}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Viable Colleges</p>
                  <p className="text-xl font-black text-amber-400 mt-0.5">{marksValue >= 90 ? '12+ Premier' : '5-8 Quality'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Scholarship Fit</p>
                  <p className="text-xl font-black text-green-400 mt-0.5">{marksValue >= 92 ? '3 National' : marksValue >= 80 ? '2 State' : '1 Private'}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Strategic Advice</p>
                <p className="text-xs text-gray-400 leading-relaxed mt-0.5">
                  {streamValue === 'Commerce' 
                    ? "Focus strongly on quantitative aptitude tests (IPMAT/CUET) to secure highly prestigious corporate courses."
                    : streamValue.includes('PCM') 
                    ? "JEE Percentile is highly crucial. Target colleges are highly sensitive to small rank shifts."
                    : "Emphasize unique portfolio projects and community leadership. Non-exam pathways are highly personal."}
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleSimulateSubmit}
            disabled={isSimulating}
            className="mt-6 w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition duration-200 flex items-center justify-center space-x-2 cursor-pointer shadow-lg active:scale-95 disabled:bg-gray-700 disabled:text-gray-400"
          >
            <RefreshCw size={14} className={isSimulating ? 'animate-spin' : ''} />
            <span>{isSimulating ? 'Recalculating AI Parameters...' : 'Apply & Regenerate AI Blueprint'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
