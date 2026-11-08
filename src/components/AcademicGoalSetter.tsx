import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Target, Award, TrendingUp, CheckCircle, Circle, Save, 
  Sparkles, ListTodo, ShieldAlert, CheckCircle2 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { StudentProfile, SuccessRoadmapStep } from '../types';
import { saveAcademicGoals } from '../firebase';

interface AcademicGoalSetterProps {
  profile: StudentProfile;
  userId: string;
  successRoadmap: SuccessRoadmapStep[];
  onSave: (updatedProfile: StudentProfile) => void;
}

export default function AcademicGoalSetter({ profile, userId, successRoadmap, onSave }: AcademicGoalSetterProps) {
  // Input states for core goals
  const [targetCgpa, setTargetCgpa] = useState(profile.targetCgpa || '');
  const [currentCgpa, setCurrentCgpa] = useState(profile.currentCgpa || '');
  const [targetRank, setTargetRank] = useState(profile.targetRank || '');
  const [currentRank, setCurrentRank] = useState(profile.currentRank || '');

  // Year-by-year CGPA actuals and targets
  const [yearTargets, setYearTargets] = useState<{ [key: string]: { target: number; actual: number | null } }>(() => {
    if (profile.yearCgpaTargets) {
      try {
        return JSON.parse(profile.yearCgpaTargets);
      } catch (e) {
        console.error('Failed to parse yearCgpaTargets', e);
      }
    }
    // Fallbacks
    return {
      'Year 1': { target: 8.0, actual: 7.8 },
      'Year 2': { target: 8.5, actual: 8.3 },
      'Year 3': { target: 9.0, actual: 8.8 },
      'Year 4': { target: 9.2, actual: null }
    };
  });

  // Completed roadmap milestones (keys like "Year 1-0", "Year 2-1")
  const [completedMilestones, setCompletedMilestones] = useState<string[]>(() => {
    if (profile.completedMilestones) {
      try {
        return JSON.parse(profile.completedMilestones);
      } catch (e) {
        console.error('Failed to parse completedMilestones', e);
      }
    }
    return [];
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // State for tracking auto-save status
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Synchronize state with profile updates if profile changes
  useEffect(() => {
    if (profile.targetCgpa !== undefined) setTargetCgpa(profile.targetCgpa);
    if (profile.currentCgpa !== undefined) setCurrentCgpa(profile.currentCgpa);
    if (profile.targetRank !== undefined) setTargetRank(profile.targetRank);
    if (profile.currentRank !== undefined) setCurrentRank(profile.currentRank);
    
    if (profile.yearCgpaTargets) {
      try {
        setYearTargets(JSON.parse(profile.yearCgpaTargets));
      } catch (e) {}
    }
    if (profile.completedMilestones) {
      try {
        setCompletedMilestones(JSON.parse(profile.completedMilestones));
      } catch (e) {}
    }
  }, [profile]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!userId) return;

    // Check if any value is actually different from the profile prop to prevent redundant saves on mount
    let targetsChanged = false;
    if (profile.yearCgpaTargets) {
      try {
        const parsedProfileTargets = JSON.parse(profile.yearCgpaTargets);
        targetsChanged = JSON.stringify(yearTargets) !== JSON.stringify(parsedProfileTargets);
      } catch (e) {
        targetsChanged = true;
      }
    } else {
      const fallback = {
        'Year 1': { target: 8.0, actual: 7.8 },
        'Year 2': { target: 8.5, actual: 8.3 },
        'Year 3': { target: 9.0, actual: 8.8 },
        'Year 4': { target: 9.2, actual: null }
      };
      targetsChanged = JSON.stringify(yearTargets) !== JSON.stringify(fallback);
    }

    let milestonesChanged = false;
    if (profile.completedMilestones) {
      try {
        const parsedProfileMilestones = JSON.parse(profile.completedMilestones);
        milestonesChanged = JSON.stringify([...completedMilestones].sort()) !== JSON.stringify([...parsedProfileMilestones].sort());
      } catch (e) {
        milestonesChanged = true;
      }
    } else {
      milestonesChanged = completedMilestones.length > 0;
    }

    const hasChanged = 
      targetCgpa !== (profile.targetCgpa || '') ||
      currentCgpa !== (profile.currentCgpa || '') ||
      targetRank !== (profile.targetRank || '') ||
      currentRank !== (profile.currentRank || '') ||
      targetsChanged ||
      milestonesChanged;

    if (!hasChanged) {
      return;
    }

    // Trigger auto-save after 1200ms delay of inactivity
    const delayDebounceFn = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        const goalsPayload = {
          targetCgpa,
          currentCgpa,
          targetRank,
          currentRank,
          yearCgpaTargets: JSON.stringify(yearTargets),
          completedMilestones: JSON.stringify(completedMilestones)
        };

        await saveAcademicGoals(userId, goalsPayload);

        const updatedProfile: StudentProfile = {
          ...profile,
          ...goalsPayload
        };

        onSave(updatedProfile);
        setAutoSaveStatus('saved');

        // Reset status back to idle after a brief duration
        const statusTimer = setTimeout(() => {
          setAutoSaveStatus('idle');
        }, 3000);

        return () => clearTimeout(statusTimer);
      } catch (error) {
        console.error('Error in auto-save:', error);
        setAutoSaveStatus('error');
      }
    }, 1200);

    return () => clearTimeout(delayDebounceFn);
  }, [targetCgpa, currentCgpa, targetRank, currentRank, yearTargets, completedMilestones, userId, profile, onSave]);

  const handleSaveAll = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const goalsPayload = {
        targetCgpa,
        currentCgpa,
        targetRank,
        currentRank,
        yearCgpaTargets: JSON.stringify(yearTargets),
        completedMilestones: JSON.stringify(completedMilestones)
      };

      await saveAcademicGoals(userId, goalsPayload);
      
      // Update local profile state in parent App
      const updatedProfile: StudentProfile = {
        ...profile,
        ...goalsPayload
      };
      
      onSave(updatedProfile);
      setMessage({ text: 'Academic goals and milestone configurations saved successfully!', type: 'success' });
      setAutoSaveStatus('saved');
      
      setTimeout(() => {
        setMessage(null);
      }, 4000);
    } catch (error) {
      console.error('Error saving goals:', error);
      setMessage({ text: 'Failed to synchronize goals with database.', type: 'error' });
      setAutoSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleYearValueChange = (year: string, field: 'target' | 'actual', value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setYearTargets(prev => ({
      ...prev,
      [year]: {
        ...prev[year],
        [field]: numValue === null && field === 'actual' ? null : (numValue ?? 0)
      }
    }));
  };

  const toggleMilestone = (milestoneKey: string) => {
    setCompletedMilestones(prev => {
      const exists = prev.includes(milestoneKey);
      if (exists) {
        return prev.filter(k => k !== milestoneKey);
      } else {
        return [...prev, milestoneKey];
      }
    });
  };

  // Convert yearTargets to Recharts-friendly data format
  const cgpaChartData = Object.keys(yearTargets).map(year => ({
    name: year,
    Target: yearTargets[year].target,
    Actual: yearTargets[year].actual
  }));

  // Flatten milestones to calculate progress
  const totalRoadmapMilestones = successRoadmap?.reduce((acc, step) => {
    return acc + (step.milestones?.length || 0);
  }, 0) || 0;

  const completedCount = successRoadmap?.reduce((acc, step) => {
    let count = 0;
    step.milestones?.forEach((_, idx) => {
      const key = `${step.year}-${idx}`;
      if (completedMilestones.includes(key)) {
        count++;
      }
    });
    return acc + count;
  }, 0) || 0;

  const milestoneProgressPercent = totalRoadmapMilestones > 0 
    ? Math.round((completedCount / totalRoadmapMilestones) * 100) 
    : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Notification Message */}
      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            message.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <CheckCircle2 size={18} className="shrink-0" />
          <p className="text-xs font-semibold leading-normal">{message.text}</p>
        </motion.div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Core Inputs Panel */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs md:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <Target className="text-red-500" size={18} />
                <h3 className="text-xs font-extrabold text-gray-900 uppercase">Academic Goal Setter</h3>
              </div>
              {userId && (
                <div className="text-[10px] font-semibold text-gray-405 shrink-0 select-none">
                  {autoSaveStatus === 'saving' && (
                    <span className="text-amber-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                      Saving...
                    </span>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <span className="text-emerald-600 flex items-center gap-1 font-bold">
                      ✓ Auto-saved
                    </span>
                  )}
                  {autoSaveStatus === 'error' && (
                    <span className="text-rose-600 flex items-center gap-1 font-bold">
                      ⚠ Save Error
                    </span>
                  )}
                  {autoSaveStatus === 'idle' && (
                    <span className="text-slate-400 font-medium">
                      ✓ Saved
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <p className="text-[10px] text-gray-500 leading-relaxed mb-4">
              Define your custom target scores, entrance exam rank goals, and real-time CGPA configurations to align your success metrics.
            </p>

            <div className="space-y-4">
              {/* Target CGPA */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Target Cumulative CGPA</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="e.g. 9.50"
                    value={targetCgpa}
                    onChange={(e) => setTargetCgpa(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <span className="absolute right-3 top-2 text-[10px] font-extrabold text-gray-400">/ 10</span>
                </div>
              </div>

              {/* Current CGPA */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Current Cumulative CGPA</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="e.g. 8.35"
                    value={currentCgpa}
                    onChange={(e) => setCurrentCgpa(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <span className="absolute right-3 top-2 text-[10px] font-extrabold text-gray-400">/ 10</span>
                </div>
              </div>

              {/* Target Entrance Rank */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Target Exam Rank / Percentile</label>
                <input
                  type="text"
                  placeholder="e.g. JEE Rank < 5000"
                  value={targetRank}
                  onChange={(e) => setTargetRank(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Current Status / Mock Rank */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Current Status / Mock Rank</label>
                <input
                  type="text"
                  placeholder="e.g. Mock Score ~8200"
                  value={currentRank}
                  onChange={(e) => setCurrentRank(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleSaveAll}
              disabled={saving || autoSaveStatus === 'saving'}
              className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-sm"
            >
              <Save size={14} className="text-red-500" />
              <span>
                {saving || autoSaveStatus === 'saving' 
                  ? 'Saving...' 
                  : autoSaveStatus === 'saved'
                    ? 'All Saved to Cloud'
                    : 'Sync Goals to Cloud'}
              </span>
            </button>
          </div>
        </div>

        {/* Year-by-Year CGPA Tracker & Recharts Line Graph */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs md:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="text-red-500" size={18} />
              <h3 className="text-xs font-extrabold text-gray-900 uppercase">CGPA Progress Timeline</h3>
            </div>
            <span className="text-[9px] font-black bg-red-50 border border-red-100 text-red-700 px-2 py-0.5 rounded uppercase tracking-wider">
              Year-by-Year Target vs. Actual
            </span>
          </div>

          {/* Grid inputs for year-by-year targets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.keys(yearTargets).map((year) => (
              <div key={year} className="bg-slate-50 border border-gray-150 rounded-xl p-3 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-800 block">{year}</span>
                <div className="space-y-1">
                  <div>
                    <label className="text-[8px] text-gray-400 uppercase font-bold tracking-wider block">Target</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={yearTargets[year].target}
                      onChange={(e) => handleYearValueChange(year, 'target', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-[11px] font-extrabold text-gray-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-gray-400 uppercase font-bold tracking-wider block">Actual</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="--"
                      value={yearTargets[year].actual ?? ''}
                      onChange={(e) => handleYearValueChange(year, 'actual', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-[11px] font-extrabold text-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recharts Chart */}
          <div className="h-[220px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cgpaChartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  stroke="#cbd5e1"
                  tickLine={false}
                />
                <YAxis 
                  domain={[5, 10]}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  stroke="#cbd5e1"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '12px', 
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#94a3b8' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 600 }} />
                <Line 
                  type="monotone" 
                  dataKey="Target" 
                  stroke="#94a3b8" 
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Actual" 
                  stroke="#dc2626" 
                  strokeWidth={2.5}
                  connectNulls
                  dot={{ r: 5, strokeWidth: 1 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Visually Track Progress Milestones on Success Roadmap */}
      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <ListTodo className="text-red-500" size={18} />
            <div>
              <h3 className="text-xs font-extrabold text-gray-900 uppercase">Roadmap Milestone Progress Hub</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Toggle and track specific milestones on your personalized AI year-by-year success roadmap.</p>
            </div>
          </div>

          {/* Progress Ring / Bar */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-800 block">
                {completedCount} of {totalRoadmapMilestones} Milestones
              </span>
              <span className="text-[8px] font-extrabold text-red-600 uppercase tracking-widest">
                {milestoneProgressPercent}% Completed
              </span>
            </div>
            
            <div className="w-16 bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
              <div 
                className="bg-red-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${milestoneProgressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Interactive milestones mapping from Success Roadmap */}
        {successRoadmap && successRoadmap.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {successRoadmap.map((step) => (
              <div key={step.year} className="bg-slate-50/50 border border-gray-150 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">{step.year}</span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[8px] font-extrabold uppercase tracking-widest border border-red-200">
                    {step.focus}
                  </span>
                </div>

                <div className="space-y-2">
                  {step.milestones?.map((mil, idx) => {
                    const milestoneKey = `${step.year}-${idx}`;
                    const isCompleted = completedMilestones.includes(milestoneKey);
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleMilestone(milestoneKey)}
                        className={`w-full flex items-start gap-3 p-2.5 rounded-xl border text-left transition text-xs font-semibold ${
                          isCompleted 
                            ? 'bg-green-50/65 border-green-200 text-green-800' 
                            : 'bg-white border-gray-200 text-gray-700 hover:border-red-300'
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {isCompleted ? (
                            <CheckCircle className="text-green-600 shrink-0" size={15} />
                          ) : (
                            <Circle className="text-gray-350 shrink-0 hover:text-red-500" size={15} />
                          )}
                        </div>
                        <span className="leading-snug flex-1">{mil}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-center text-amber-900 text-xs font-semibold">
            Please compile or load your Student Blueprint to visualize interactive roadmap milestones.
          </div>
        )}

        {/* Direct save prompt bottom bar */}
        <div className="flex items-center justify-between p-3.5 bg-slate-900 text-white rounded-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="text-amber-400 shrink-0" size={15} />
            <span className="text-[10px] font-semibold text-gray-300">
              {autoSaveStatus === 'saving' 
                ? 'Saving milestone progress in real-time...' 
                : autoSaveStatus === 'saved'
                  ? 'All progress checked off and auto-saved!'
                  : 'Milestones auto-save instantly. Your roadmap progress is secure.'}
            </span>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={saving || autoSaveStatus === 'saving'}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-500 text-white font-extrabold rounded-lg text-[9px] uppercase tracking-wider transition active:scale-95 cursor-pointer"
          >
            {saving || autoSaveStatus === 'saving' ? 'Syncing...' : 'Save Progress Logs'}
          </button>
        </div>
      </div>
    </div>
  );
}
