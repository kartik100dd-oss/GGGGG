import { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Linkedin, PenTool, Check, Copy, User } from 'lucide-react';

interface ProfileBuilderProps {
  studentName: string;
  studentStream: string;
  interests: string;
  achievements: string;
  resumeHighlights: string;
}

export default function ProfileBuilder({ studentName, studentStream, interests, achievements, resumeHighlights }: ProfileBuilderProps) {
  const [activeTab, setActiveTab] = useState<'resume' | 'linkedin' | 'sop'>('resume');
  const [copied, setCopied] = useState<string | null>(null);

  const name = studentName || "Kartik Bali";
  const stream = studentStream || "Commerce";
  const careerInterests = interests || "Fintech, Entrepreneurship, Management";
  const achievementsText = achievements || "Founder of AI RED DRAGON";
  const highlights = resumeHighlights || "Active student developer; experienced in building custom AI-powered web tools.";

  // Generate Resume Draft
  const resumeDraft = `
=========================================
${name.toUpperCase()} - RESUME & PORTFOLIO
=========================================
Contact: Registered User at AI RED DRAGON
Location: Student Portal Profile Sync
Stream: Senior School (${stream})

OBJECTIVE:
Highly motivated and analytical ${stream} student seeking to leverage academic fundamentals, key achievements, and robust problem-solving capabilities in premium university courses and placement ecosystems focusing on ${careerInterests}.

ACADEMIC FUNDAMENTALS:
- Senior Secondary Schooling (${stream})
- Core Interest Areas: ${careerInterests}
- Outstanding Performance Matrix generated via AI RED DRAGON V1 DNA analysis.

ACHIEVEMENTS & MILESTONES:
- ${achievementsText}
- Diagnostic Score: High innovation and problem-solving index.

PRACTICAL SKILLS PORTFOLIO:
- Project Experience: ${highlights}
- Multi-disciplinary capabilities in stream-specific analyses, project formulation, and research logistics.
`;

  // Generate LinkedIn Bio
  const linkedinBio = `
🚀 ${stream} Student | Tech-forward Innovator | Future Practitioner in ${careerInterests}

I am an ambitious student specializing in ${stream} with a deep passion for ${careerInterests}. Recognized by the AI RED DRAGON intelligence system as having a high aptitude for innovation and leadership, I thrive at the intersection of rigorous theory and hands-on execution.

Key Highlights:
🏆 Achievements: ${achievementsText}
💡 Key Competencies: ${highlights}
🎯 Goal: Seeking elite university admissions and early corporate internship ecosystems.

Let's connect, share ideas, and build the future of education and technology!
`;

  // Generate Statement of Purpose (SOP)
  const sopDraft = `
STATEMENT OF PURPOSE

Dear Members of the Admissions Committee,

I am writing to express my profound interest in enrolling in your esteemed undergraduate program. As a student of ${stream}, I have dedicated my high school career to exploring the depths of academic theory, with a particular fascination regarding how these principles intersect with modern developments in ${careerInterests}.

My academic journey is characterized by active leadership and consistent curiosity, culminating in key achievements including ${achievementsText}. This foundation was further structured through analytical profiling via the AI RED DRAGON educational system, which highlighted my robust aptitude in Innovation, Problem Solving, and Stream-Specific Research.

Beyond conventional grades, I believe in practical execution. This is reflected in my project experience where I have successfully managed ${highlights}. Your institution, with its global reputation for academic excellence, elite placement ratios, and robust research ecosystems, is the perfect stage for me to cultivate my skills.

Thank you for your time and consideration of my candidacy.

Sincerely,
${name}
`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <div className="flex items-center space-x-2">
          <PenTool className="text-red-500" size={20} />
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">RESUME & PROFILE BUILDER</h3>
            <p className="text-xs text-gray-500">Custom tailored drafts and profiles based on your current student DNA.</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-gray-50 p-1 rounded-xl mt-4 sm:mt-0">
          <button
            onClick={() => setActiveTab('resume')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'resume' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FileText size={14} />
            <span>Resume</span>
          </button>
          <button
            onClick={() => setActiveTab('linkedin')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'linkedin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Linkedin size={14} className="text-blue-600" />
            <span>LinkedIn</span>
          </button>
          <button
            onClick={() => setActiveTab('sop')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'sop' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <PenTool size={14} />
            <span>SOP Draft</span>
          </button>
        </div>
      </div>

      {/* Content Block */}
      <div className="relative">
        {/* Copy Button */}
        <button
          onClick={() => {
            const textToCopy = activeTab === 'resume' ? resumeDraft : activeTab === 'linkedin' ? linkedinBio : sopDraft;
            copyToClipboard(textToCopy, activeTab);
          }}
          className="absolute right-4 top-4 inline-flex items-center px-3 py-1.5 bg-gray-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer z-10"
        >
          {copied === activeTab ? (
            <>
              <Check size={12} className="mr-1 text-green-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy size={12} className="mr-1" />
              Copy Draft
            </>
          )}
        </button>

        {/* Text Area display */}
        <div className="bg-slate-50 border border-gray-100 rounded-xl p-5 text-xs font-mono text-gray-700 h-[300px] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
          {activeTab === 'resume' && (
            <div className="animate-fadeIn">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-2">[Resume Outline Draft]</span>
              {resumeDraft.trim()}
            </div>
          )}
          {activeTab === 'linkedin' && (
            <div className="animate-fadeIn">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-2">[LinkedIn Profile Bio]</span>
              {linkedinBio.trim()}
            </div>
          )}
          {activeTab === 'sop' && (
            <div className="animate-fadeIn">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-2">[Statement of Purpose (SOP)]</span>
              {sopDraft.trim()}
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-gray-400 mt-3 text-center">
        *Drafts are dynamically contextualized based on active student profile parameters. Perfect to copy and expand.
      </p>
    </div>
  );
}
