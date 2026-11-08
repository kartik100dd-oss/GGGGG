import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Save, Sparkles, BookOpen, User, DollarSign, MapPin, Award, 
  FileText, CheckCircle, UploadCloud, Loader2, AlertCircle 
} from 'lucide-react';
import { saveStudentProfile, StudentProfile } from '../firebase';

interface StudentProfileFormProps {
  userId: string;
  initialProfile: StudentProfile | null;
  onSaveSuccess: (updatedProfile: StudentProfile) => void;
}

export default function StudentProfileForm({ userId, initialProfile, onSaveSuccess }: StudentProfileFormProps) {
  const [profile, setProfile] = useState<Omit<StudentProfile, 'uid' | 'email'>>({
    name: '',
    stream: 'Science PCM',
    class10Marks: '',
    class12Marks: '',
    entranceScores: '',
    budget: '',
    locationPreference: '',
    hostelRequirement: true,
    careerInterests: '',
    achievements: '',
    resumeText: '',
    parentPreferences: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // File parser states
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccess, setParseSuccess] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setParseError('File size is too large. Please upload a file smaller than 8MB.');
      return;
    }

    setParsing(true);
    setParseError(null);
    setParseSuccess(null);

    try {
      const reader = new FileReader();
      
      const fileLoadedPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64String = result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = () => reject(new Error('Failed to read file.'));
      });

      reader.readAsDataURL(file);
      const base64Data = await fileLoadedPromise;

      const response = await fetch('/api/parse-marksheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData: base64Data,
          mimeType: file.type || 'application/pdf',
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = 'Failed to parse mark sheet.';
        try {
          const errorData = JSON.parse(text);
          errorMsg = errorData.error || errorMsg;
        } catch {
          errorMsg = `Server error (${response.status}): Failed to parse academic document.`;
        }
        throw new Error(errorMsg);
      }

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Server returned an invalid response. Please try again.');
      }
      
      setProfile(prev => ({
        ...prev,
        name: data.name || prev.name,
        stream: data.stream || prev.stream,
        class10Marks: data.class10Marks || prev.class10Marks,
        class12Marks: data.class12Marks || prev.class12Marks,
        entranceScores: data.entranceScores || prev.entranceScores,
        careerInterests: data.careerInterests || prev.careerInterests,
        achievements: data.achievements || prev.achievements,
        resumeText: data.resumeText || prev.resumeText,
      }));

      setParseSuccess(`Successfully parsed "${file.name}"! Key fields (Stream, Marks, Achievements) have been automatically populated.`);
      
      setTimeout(() => {
        setParseSuccess(null);
      }, 8000);
    } catch (err) {
      console.error('Error parsing file:', err);
      setParseError(err instanceof Error ? err.message : 'An unexpected error occurred during parsing.');
    } finally {
      setParsing(false);
      // Clear file input so same file can be uploaded again if needed
      e.target.value = '';
    }
  };

  useEffect(() => {
    if (initialProfile) {
      setProfile({
        name: initialProfile.name || '',
        stream: initialProfile.stream || 'Science PCM',
        class10Marks: initialProfile.class10Marks || '',
        class12Marks: initialProfile.class12Marks || '',
        entranceScores: initialProfile.entranceScores || '',
        budget: initialProfile.budget || '',
        locationPreference: initialProfile.locationPreference || '',
        hostelRequirement: initialProfile.hostelRequirement ?? true,
        careerInterests: initialProfile.careerInterests || '',
        achievements: initialProfile.achievements || '',
        resumeText: initialProfile.resumeText || '',
        parentPreferences: initialProfile.parentPreferences || ''
      });
    }
  }, [initialProfile]);

  const loadSamplePreset = () => {
    setProfile({
      name: 'Aditya Sharma',
      stream: 'Science PCM',
      class10Marks: '94.2%',
      class12Marks: '91.8%',
      entranceScores: 'JEE Mains: 98.4 percentile, CUET: 740/800',
      budget: '₹3,00,000 / year',
      locationPreference: 'Bangalore, Delhi NCR, Punjab',
      hostelRequirement: true,
      careerInterests: 'Software Engineering, Cyber Security, Artificial Intelligence',
      achievements: 'State Science Olympiad Rank 14, School Basketball Team Captain',
      resumeText: 'Built a simple portfolio website. Comfortable with Python and basic HTML/CSS. Completed a 4-week introductory course on Data Structures on Coursera.',
      parentPreferences: 'Prefers secure university hostels with 24/7 security. Prefers strong campus placements.'
    });
  };

  const loadCommercePreset = () => {
    setProfile({
      name: 'Kartik Bali',
      stream: 'Commerce',
      class10Marks: '88.5%',
      class12Marks: 'Pending (Class 12 Commerce Student)',
      entranceScores: 'Preparing for CUET & IPMAT',
      budget: '₹2,50,000 / year',
      locationPreference: 'Punjab, Delhi, Mumbai',
      hostelRequirement: true,
      careerInterests: 'Entrepreneurship, Finance, Fintech Product Management',
      achievements: 'Founder of AI RED DRAGON, Gold medalist in District Level Chess',
      resumeText: 'Active student organizer. Experienced in project formulation, building AI-powered Web tools, and managing online products. Highly analytical in budgeting and logistics.',
      parentPreferences: 'Wants safe nearby locations with high return on investment (ROI).'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const updated = await saveStudentProfile(userId, profile);
      onSaveSuccess(updated as StudentProfile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-4xl mx-auto">
      <div className="border-b border-gray-100 pb-5 mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <User className="text-red-500 mr-2" size={20} />
          Student Profile Builder
        </h2>
        <p className="text-xs text-gray-500 mt-1">Configure your academic and personal parameters for precise intelligence forecasting.</p>
      </div>

      {/* AI Mark Sheet PDF/Image Import */}
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn">
        <div className="flex items-start space-x-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              AI Mark Sheet Import
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-extrabold uppercase rounded-full tracking-wider">NEW</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-normal max-w-md">
              Upload your Class 10/12 report card, transcript, or entrance scorecard (PDF/Image). AI Red Dragon will analyze grades and pre-populate your profile instantly.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <label className="relative flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-sm select-none text-center">
            <UploadCloud size={14} />
            <span>{parsing ? 'Parsing...' : 'Import Mark Sheet'}</span>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileUpload}
              disabled={parsing}
              className="hidden"
            />
          </label>
          
          <div className="flex gap-1 justify-center">
            <button
              type="button"
              onClick={loadSamplePreset}
              className="bg-white hover:bg-slate-100 border border-gray-200 text-gray-700 font-bold py-2 px-3 rounded-lg text-[10px] transition cursor-pointer"
            >
              PCM Preset
            </button>
            <button
              type="button"
              onClick={loadCommercePreset}
              className="bg-white hover:bg-slate-100 border border-gray-200 text-gray-700 font-bold py-2 px-3 rounded-lg text-[10px] transition cursor-pointer"
            >
              Commerce Preset
            </button>
          </div>
        </div>
      </div>

      {/* Parsing Loading State */}
      {parsing && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-100 text-red-800 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold mb-6 animate-pulse"
        >
          <Loader2 className="animate-spin text-red-600 shrink-0" size={16} />
          <span>Analyzing mark sheet using AI Red Dragon 3.5... This takes 2-4 seconds.</span>
        </motion.div>
      )}

      {/* Parsing Success Alert */}
      {parseSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold mb-6"
        >
          <CheckCircle className="text-emerald-600 shrink-0" size={16} />
          <span className="flex-1">{parseSuccess}</span>
          <button 
            type="button"
            onClick={() => setParseSuccess(null)} 
            className="text-[10px] hover:underline font-bold text-emerald-700"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Parsing Error Alert */}
      {parseError && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold mb-6"
        >
          <AlertCircle className="text-amber-600 shrink-0" size={16} />
          <span className="flex-1">{parseError}</span>
          <button 
            type="button"
            onClick={() => setParseError(null)} 
            className="text-[10px] hover:underline font-bold text-amber-700"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Name & Stream */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Student's Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Kartik Bali"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Academic Stream</label>
            <select
              value={profile.stream}
              onChange={(e) => setProfile({ ...profile, stream: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="Science PCM">Science PCM (Physics, Chem, Maths)</option>
              <option value="Science PCB">Science PCB (Physics, Chem, Biology)</option>
              <option value="Commerce">Commerce</option>
              <option value="Arts">Arts & Humanities</option>
              <option value="Law">Law Pathway</option>
              <option value="Design">Design & Applied Arts</option>
              <option value="Defence">Defence Services</option>
              <option value="Management">Management studies (BBA/IPM)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Academics */}
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Class 10 Marks</label>
            <input
              type="text"
              placeholder="e.g. 92% or CGPA 9.5"
              value={profile.class10Marks}
              onChange={(e) => setProfile({ ...profile, class10Marks: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Class 12 Marks</label>
            <input
              type="text"
              placeholder="e.g. 91.5% or Commerce stream"
              value={profile.class12Marks}
              onChange={(e) => setProfile({ ...profile, class12Marks: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Entrance Exam Scores (Optional)</label>
            <input
              type="text"
              placeholder="JEE, NEET, CUET, SAT, or 'Preparing' (Optional)"
              value={profile.entranceScores}
              onChange={(e) => setProfile({ ...profile, entranceScores: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>
        </div>

        {/* Row 3: Budget & Hostels */}
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center">
              <DollarSign size={14} className="text-gray-400 mr-1" />
              Annual Budget Limit
            </label>
            <input
              type="text"
              placeholder="e.g. ₹2,00,000 / year"
              value={profile.budget}
              onChange={(e) => setProfile({ ...profile, budget: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center">
              <MapPin size={14} className="text-gray-400 mr-1" />
              Location Preferences
            </label>
            <input
              type="text"
              placeholder="e.g. Punjab, Delhi, Bangalore"
              value={profile.locationPreference}
              onChange={(e) => setProfile({ ...profile, locationPreference: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div className="flex flex-col justify-end pb-1">
            <label className="inline-flex items-center space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={profile.hostelRequirement}
                onChange={(e) => setProfile({ ...profile, hostelRequirement: e.target.checked })}
                className="w-5 h-5 text-red-600 rounded-lg border-gray-300 focus:ring-red-500/20 focus:ring-2 cursor-pointer"
              />
              <span className="text-sm font-semibold text-gray-700">Hostel / PG Requirement</span>
            </label>
          </div>
        </div>

        {/* Row 4: Interests & Achievements */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center">
              <BookOpen size={14} className="text-gray-400 mr-1" />
              Career Interests / Fields
            </label>
            <input
              type="text"
              placeholder="e.g. Machine Learning, Entrepreneurship, Stocks"
              value={profile.careerInterests}
              onChange={(e) => setProfile({ ...profile, careerInterests: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center">
              <Award size={14} className="text-gray-400 mr-1" />
              Achievements (Olympiads, Sports, etc)
            </label>
            <input
              type="text"
              placeholder="e.g. District chess champion, coding award"
              value={profile.achievements}
              onChange={(e) => setProfile({ ...profile, achievements: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>
        </div>

        {/* Row 5: Resume Description & Parent Preferences */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center">
              <FileText size={14} className="text-gray-400 mr-1" />
              Resume Text or Key Skills Portfolio
            </label>
            <textarea
              rows={4}
              placeholder="Paste text from your resume, key technical/soft skills, or personal projects you have completed..."
              value={profile.resumeText}
              onChange={(e) => setProfile({ ...profile, resumeText: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center">
              <Award size={14} className="text-gray-400 mr-1" />
              Parent Preferences & Constraints
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Safe secure hostel, near Punjab state, budget strictly below ₹3 Lakhs, curfew hours..."
              value={profile.parentPreferences}
              onChange={(e) => setProfile({ ...profile, parentPreferences: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
            />
          </div>
        </div>

        {/* Submit & Status */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center">
            {success && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg"
              >
                <CheckCircle size={14} className="mr-1" />
                Profile saved and synchronized!
              </motion.span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition active:scale-95 disabled:bg-gray-400 cursor-pointer"
          >
            <Save size={14} className="mr-2" />
            {loading ? 'Saving Parameters...' : 'Save & Sync Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
