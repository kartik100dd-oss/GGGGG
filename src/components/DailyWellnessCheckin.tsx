import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Sparkles, Brain, Clock, Flame, ShieldAlert, CheckCircle2, 
  TrendingUp, Calendar, AlertCircle, BarChart3, ChevronRight, RefreshCw,
  Sliders, Compass, Zap, BatteryCharging, Smile, Meh, Frown, Award
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  Tooltip, CartesianGrid, Cell 
} from 'recharts';
import { WellnessCheckinData, WellnessStats, MoodRating, BurnoutLevel, StudentProfile } from '../types';
import { saveWellnessCheckin, loadWellnessCheckins } from '../firebase';

interface DailyWellnessCheckinProps {
  userId: string;
  studentProfile: StudentProfile;
  onCheckinSaved?: (updatedProfile: StudentProfile) => void;
  onApplyAdaptiveRoadmap?: (recommendation: string) => void;
}

const MOOD_OPTIONS: { rating: MoodRating; label: string; icon: string; desc: string; color: string; bg: string }[] = [
  { rating: 1, label: 'Exhausted', icon: '😫', desc: 'Depleted energy, high mental fatigue', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  { rating: 2, label: 'Stressed', icon: '😕', desc: 'Anxious, overwhelmed by deadlines', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  { rating: 3, label: 'Steady', icon: '😐', desc: 'Calm, baseline routine, balanced', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  { rating: 4, label: 'Focused', icon: '😊', desc: 'High retention, positive motivation', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  { rating: 5, label: 'Peak Flow', icon: '🚀', desc: 'Unstoppable momentum, breakthrough', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
];

const STRESS_LEVELS: { level: BurnoutLevel; label: string; badge: string }[] = [
  { level: 'Low', label: 'Healthy Flow (Low Stress)', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { level: 'Moderate', label: 'Productive Pressure (Moderate)', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  { level: 'High', label: 'Approaching Fatigue (High)', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { level: 'Critical', label: 'Severe Strain (Burnout Risk)', badge: 'bg-rose-50 text-rose-700 border-rose-200' }
];

export default function DailyWellnessCheckin({
  userId,
  studentProfile,
  onCheckinSaved,
  onApplyAdaptiveRoadmap
}: DailyWellnessCheckinProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  // History & Stats
  const [history, setHistory] = useState<WellnessCheckinData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Form State
  const [selectedMood, setSelectedMood] = useState<MoodRating>(3);
  const [focusHours, setFocusHours] = useState<number>(5.5);
  const [energyLevel, setEnergyLevel] = useState<number>(75);
  const [focusSubject, setFocusSubject] = useState<string>(studentProfile.stream || 'Core Curriculum');
  const [stressLevel, setStressLevel] = useState<BurnoutLevel>('Low');
  const [reflectionNote, setReflectionNote] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  // Check if checked in today
  const existingTodayCheckin = history.find(c => c.date === todayStr) || 
    (studentProfile.latestWellnessCheckin?.date === todayStr ? studentProfile.latestWellnessCheckin : null);

  const hasCheckedInToday = !!existingTodayCheckin;

  // Load check-in history from Firestore
  useEffect(() => {
    async function fetchCheckins() {
      if (!userId) return;
      try {
        setLoadingHistory(true);
        const records = await loadWellnessCheckins(userId, 14);
        setHistory(records);
        
        // If there is a check-in for today, pre-fill form
        const todayRecord = records.find(r => r.date === todayStr);
        if (todayRecord) {
          setSelectedMood(todayRecord.mood);
          setFocusHours(todayRecord.studyFocusHours);
          setEnergyLevel(todayRecord.energyLevel);
          setFocusSubject(todayRecord.focusSubject);
          setStressLevel(todayRecord.stressLevel);
          setReflectionNote(todayRecord.reflectionNote || '');
        }
      } catch (err) {
        console.error('Failed to load wellness checkins:', err);
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchCheckins();
  }, [userId, todayStr]);

  // Current Mood Object
  const currentMoodObj = MOOD_OPTIONS.find(m => m.rating === selectedMood) || MOOD_OPTIONS[2];

  // Submit Daily Check-in to Firestore
  const handleSubmitCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSubmitting(true);
    setSaveSuccessNotice(null);

    try {
      const payload: Omit<WellnessCheckinData, 'id' | 'userId'> = {
        date: todayStr,
        timestamp: new Date().toISOString(),
        mood: selectedMood,
        moodLabel: currentMoodObj.label,
        studyFocusHours: Number(focusHours),
        energyLevel: Number(energyLevel),
        focusSubject: focusSubject.trim() || studentProfile.stream || 'Core Studies',
        stressLevel,
        reflectionNote: reflectionNote.trim(),
        careerImpactInsight: generateInsight(selectedMood, focusHours, stressLevel)
      };

      const result = await saveWellnessCheckin(userId, payload);

      // Update local history
      setHistory(prev => {
        const filtered = prev.filter(p => p.date !== todayStr);
        return [result.checkin, ...filtered];
      });

      // Update parent profile
      const updatedProfile: StudentProfile = {
        ...studentProfile,
        latestWellnessCheckin: result.checkin,
        wellnessStats: result.stats
      };

      if (onCheckinSaved) {
        onCheckinSaved(updatedProfile);
      }

      if (onApplyAdaptiveRoadmap && result.stats.adaptiveRoadmapRecommendation) {
        onApplyAdaptiveRoadmap(result.stats.adaptiveRoadmapRecommendation);
      }

      setSaveSuccessNotice('Today’s wellness check-in recorded! Career engine adapted.');
      setIsEditing(false);
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    } catch (err: any) {
      console.error('Error saving wellness checkin:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to generate immediate cognitive feedback
  function generateInsight(mood: MoodRating, hours: number, stress: BurnoutLevel): string {
    if (stress === 'Critical' || (hours >= 9 && mood <= 2)) {
      return 'High burnout risk detected. Roadmap adjusted with 48h active recovery buffers and stress-resilient career pacing.';
    }
    if (mood >= 4 && hours >= 6) {
      return 'Peak momentum! Career Engine activates Accelerated Competitive Track for Tier-1 Admissions and high-impact capstone projects.';
    }
    if (mood === 3) {
      return 'Steady equilibrium. 90%+ knowledge retention projected for upcoming semester entrance milestones.';
    }
    return 'Pacing optimized for balanced cognitive stamina and sustained exam preparation.';
  }

  // Prepare chart data for past 7 days
  const chartData = [...history]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7)
    .map(c => ({
      date: new Date(c.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      focusHours: c.studyFocusHours,
      mood: c.mood,
      moodLabel: c.moodLabel
    }));

  const stats = studentProfile.wellnessStats;

  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-6 sm:p-7 shadow-sm mb-8 transition hover:shadow-md">
      {/* Component Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <Heart size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                DAILY MENTAL WELLNESS & STUDY CHECK-IN
              </h3>
              {stats?.streakDays && stats.streakDays > 1 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-800 border border-orange-200">
                  <Flame size={12} className="mr-0.5 text-orange-600 fill-orange-500" />
                  {stats.streakDays} Day Streak
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Track your daily mood and study stamina. Your check-ins fine-tune career milestone pacing and prevent burnout.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="inline-flex items-center px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <BarChart3 size={13} className="mr-1.5 text-slate-500" />
              <span>Trends ({history.length})</span>
            </button>
          )}

          {hasCheckedInToday && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw size={13} className="mr-1.5 text-red-600" />
              <span>Update Today</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Banner */}
      {saveSuccessNotice && (
        <motion.div 
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{saveSuccessNotice}</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-600">Synced to Firestore ✓</span>
        </motion.div>
      )}

      {/* State A: Checked in Today Overview */}
      {hasCheckedInToday && !isEditing ? (
        <div className="mt-5 space-y-5">
          <div className="bg-gradient-to-r from-slate-50 via-red-50/20 to-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-2xl">
                  {existingTodayCheckin.mood === 1 ? '😫' : existingTodayCheckin.mood === 2 ? '😕' : existingTodayCheckin.mood === 3 ? '😐' : existingTodayCheckin.mood === 4 ? '😊' : '🚀'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
                      Today's Vibe: {existingTodayCheckin.moodLabel}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      ✓ Checked In
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    {existingTodayCheckin.studyFocusHours} Hours Dedicated • Energy at {existingTodayCheckin.energyLevel}% • Focus: {existingTodayCheckin.focusSubject}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Burnout Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold mt-0.5 ${
                    existingTodayCheckin.stressLevel === 'Low' ? 'bg-emerald-100 text-emerald-800' :
                    existingTodayCheckin.stressLevel === 'Moderate' ? 'bg-blue-100 text-blue-800' :
                    existingTodayCheckin.stressLevel === 'High' ? 'bg-amber-100 text-amber-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {existingTodayCheckin.stressLevel} Risk
                  </span>
                </div>
              </div>
            </div>

            {existingTodayCheckin.reflectionNote && (
              <div className="mt-3.5 pt-3 border-t border-slate-200/60 text-xs text-slate-600 italic">
                "{existingTodayCheckin.reflectionNote}"
              </div>
            )}
          </div>

          {/* Adaptive Career Roadmap Modulation Notice */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
            <Zap size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                Adaptive Career Roadmap Impact
              </h4>
              <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                {stats?.adaptiveRoadmapRecommendation || existingTodayCheckin.careerImpactInsight}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* State B: Interactive Check-in Form */
        <form onSubmit={handleSubmitCheckin} className="mt-5 space-y-6">
          {/* Step 1: Mood Rating */}
          <div>
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5">
              1. How is your mental state & mood today?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {MOOD_OPTIONS.map((m) => {
                const isSelected = selectedMood === m.rating;
                return (
                  <button
                    key={m.rating}
                    type="button"
                    onClick={() => setSelectedMood(m.rating)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? `${m.bg} ring-2 ring-red-500 shadow-xs`
                        : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{m.icon}</span>
                      {isSelected && <CheckCircle2 size={14} className="text-red-600" />}
                    </div>
                    <div className="mt-2">
                      <span className="block text-xs font-black text-slate-900">{m.label}</span>
                      <span className="block text-[10px] text-slate-500 leading-tight mt-0.5">{m.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Study Focus Hours & Energy Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Focus Hours Slider */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={14} className="text-red-500" />
                  <span>2. Study Focus Hours Today</span>
                </label>
                <span className="text-sm font-black font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {focusHours} hrs
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="14"
                step="0.5"
                value={focusHours}
                onChange={(e) => setFocusHours(parseFloat(e.target.value))}
                className="w-full accent-red-600 cursor-pointer"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                <span>0h (Rest)</span>
                <span>4h (Standard)</span>
                <span>8h (Intense)</span>
                <span>12h+ (Exam Sprint)</span>
              </div>
            </div>

            {/* Mental Energy / Stamina Level */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BatteryCharging size={14} className="text-emerald-500" />
                  <span>3. Mental Stamina & Energy</span>
                </label>
                <span className="text-sm font-black font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {energyLevel}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                <span>Drained (10%)</span>
                <span>Recharging (50%)</span>
                <span>Peak Stamina (100%)</span>
              </div>
            </div>
          </div>

          {/* Step 3: Primary Focus Subject & Stress Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                4. Primary Target / Subject Track
              </label>
              <input
                type="text"
                value={focusSubject}
                onChange={(e) => setFocusSubject(e.target.value)}
                placeholder="e.g., Mathematics & Problem Solving, Mock Entrance Test, SOP Drafting..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                5. Current Academic Stress & Pressure
              </label>
              <select
                value={stressLevel}
                onChange={(e) => setStressLevel(e.target.value as BurnoutLevel)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                {STRESS_LEVELS.map(s => (
                  <option key={s.level} value={s.level}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 4: Daily Reflection Note */}
          <div>
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
              6. Daily Wins or Blockers (Optional Reflection)
            </label>
            <textarea
              rows={2}
              value={reflectionNote}
              onChange={(e) => setReflectionNote(e.target.value)}
              placeholder="e.g. Mastered 3 hard dynamic programming questions today. Feeling good about upcoming semester exams."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
              <Brain size={14} className="text-red-500" />
              <span>Data is saved securely to your personal Firestore profile.</span>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold tracking-wide transition shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Saving to Firestore...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Save Daily Check-in</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* History & Trends Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Mental Wellness & Study Focus Analytics
                    </h3>
                    <p className="text-xs text-slate-500">
                      Historical trends over your recent check-in cycles.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  ✕
                </button>
              </div>

              {/* Mini Stats Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Avg Focus</span>
                  <span className="text-lg font-black text-slate-900 mt-0.5 block font-mono">
                    {stats?.avgFocusHours || focusHours}h / day
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Active Streak</span>
                  <span className="text-lg font-black text-orange-600 mt-0.5 block font-mono">
                    {stats?.streakDays || 1} Days
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Burnout Risk</span>
                  <span className={`text-lg font-black mt-0.5 block ${
                    stats?.burnoutRisk === 'Low' ? 'text-emerald-600' :
                    stats?.burnoutRisk === 'Moderate' ? 'text-blue-600' : 'text-amber-600'
                  }`}>
                    {stats?.burnoutRisk || 'Low'}
                  </span>
                </div>
              </div>

              {/* 7-Day Chart */}
              {chartData.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                    Recent Study Focus (Hours) vs Mood Score (1-5)
                  </h4>
                  <div className="h-48 w-full bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#FFF', fontSize: '11px' }} 
                        />
                        <Bar dataKey="focusHours" fill="#DC2626" radius={[4, 4, 0, 0]} name="Focus Hours" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Log List */}
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5">
                  Check-in History Log
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {history.map(item => (
                    <div key={item.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">
                          {item.mood === 1 ? '😫' : item.mood === 2 ? '😕' : item.mood === 3 ? '😐' : item.mood === 4 ? '😊' : '🚀'}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{item.moodLabel}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({item.date})</span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            {item.studyFocusHours}h study • Energy {item.energyLevel}% • Stress: {item.stressLevel}
                          </p>
                        </div>
                      </div>
                      {item.reflectionNote && (
                        <p className="text-[10px] text-slate-400 italic max-w-[180px] truncate text-right">
                          "{item.reflectionNote}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                >
                  Close Analytics
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
