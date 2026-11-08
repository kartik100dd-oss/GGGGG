import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, Video, VideoOff, Mic, MicOff, PhoneCall, PhoneOff, 
  Star, Clock, CheckCircle2, Award, Calendar, BookOpen, MessageSquare, 
  ExternalLink, Search, Filter, ShieldCheck, Sparkles, X 
} from 'lucide-react';
import { FacultyMember } from '../types';

export default function ProfessorPortal() {
  const [activeTab, setActiveTab] = useState<'directory' | 'live-room'>('directory');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoomId, setActiveRoomId] = useState<string>('aireddragon-advisory-center');
  const [activeFaculty, setActiveFaculty] = useState<FacultyMember | null>(null);
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [jitsiDomain, setJitsiDomain] = useState<string>('meet.jit.si');

  useEffect(() => {
    fetch('/api/jitsi-config')
      .then(res => res.json())
      .then(data => {
        if (data?.domain) {
          setJitsiDomain(data.domain);
        }
      })
      .catch(err => console.warn('Jitsi config fetch fallback:', err));
  }, []);

  const facultyList: FacultyMember[] = [
    {
      id: 'fac-1',
      name: 'Prof. Rajeshwar Sharma',
      title: 'Dean of Computer Systems & AI',
      institution: 'IIT Delhi / Former Stanford Visiting Fellow',
      domain: 'STEM & AI',
      experienceYears: 18,
      rating: 4.95,
      reviewsCount: 342,
      expertise: ['Distributed Systems', 'Generative AI Architecture', 'JEE Counseling', 'Silicon Valley Placement'],
      bio: 'Leading researcher in neural architecture search. Has guided over 850 students into tier-1 research programs and FAANG leadership roles.',
      isOnline: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      jitsiRoomId: 'aireddragon-prof-sharma-ai'
    },
    {
      id: 'fac-2',
      name: 'Dr. Ananya Sen, MD',
      title: 'Director of Clinical Genomics',
      institution: 'AIIMS New Delhi / Harvard Global Health',
      domain: 'Medicine & Bio',
      experienceYears: 15,
      rating: 4.92,
      reviewsCount: 280,
      expertise: ['NEET Medical Admissions', 'CRISPR Bioethics', 'USMLE Roadmaps', 'Clinical Residency'],
      bio: 'Pioneered genetic screening programs. Specializes in advising medical aspirants on clinical rotations, NEET super-specialties, and international licensing.',
      isOnline: true,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
      jitsiRoomId: 'aireddragon-dr-sen-med'
    },
    {
      id: 'fac-3',
      name: 'Prof. Vikramaditya Singhal, FCA',
      title: 'Chair of Quantitative Finance & Banking',
      institution: 'SRCC / Indian Institute of Management (IIM)',
      domain: 'Commerce & Finance',
      experienceYears: 22,
      rating: 4.88,
      reviewsCount: 410,
      expertise: ['Investment Banking Track', 'CFA & CA Integration', 'Fintech Startups', 'LBO Valuation'],
      bio: 'Senior corporate advisor and author of Quantitative Equity Portfolios. Mentored hundreds of top commerce graduates entering private equity and consulting.',
      isOnline: false,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      jitsiRoomId: 'aireddragon-prof-singhal-fin'
    },
    {
      id: 'fac-4',
      name: 'Adv. Meenakshi Ramanathan',
      title: 'Senior Advocate & Constitutional Jurist',
      institution: 'National Law School (NLSIU) Bangalore',
      domain: 'Law & Humanities',
      experienceYears: 16,
      rating: 4.96,
      reviewsCount: 195,
      expertise: ['CLAT Strategic Prep', 'Corporate Law Partnerships', 'Cyber Jurisdiction', 'Judicial Services'],
      bio: 'Supreme Court practicing advocate and visiting lecturer in tech policy and IP law. Guides students through legal competitive exams and corporate mooting.',
      isOnline: true,
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
      jitsiRoomId: 'aireddragon-adv-ramanathan-law'
    },
    {
      id: 'fac-5',
      name: 'Dr. Siddharth Mukherjee',
      title: 'Principal of Spatial UX & Interaction',
      institution: 'National Institute of Design (NID) / RCA London',
      domain: 'Design & Media',
      experienceYears: 14,
      rating: 4.90,
      reviewsCount: 160,
      expertise: ['UCEED & NID Portfolio Prep', 'Spatial Interface Design', 'Design Systems', 'Creative Direction'],
      bio: 'Industrial design director focused on human-computer interaction and generative aesthetics. Reviews student design portfolios for top global design schools.',
      isOnline: true,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      jitsiRoomId: 'aireddragon-dr-mukherjee-des'
    }
  ];

  const filteredFaculty = facultyList.filter((f) => {
    const matchesDomain = selectedDomain === 'All' || f.domain === selectedDomain;
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.expertise.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDomain && matchesSearch;
  });

  const launchMeeting = (roomId: string, faculty?: FacultyMember) => {
    setActiveRoomId(roomId);
    if (faculty) setActiveFaculty(faculty);
    setIsMeetingActive(true);
    setActiveTab('live-room');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <GraduationCap size={18} className="text-red-600" />
            Faculty & Professor Advisory Portal
          </h2>
          <p className="text-[11px] text-slate-500">Live 1-on-1 video & voice counseling powered by embedded Jitsi Meet WebRTC</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Faculty Directory
          </button>
          <button
            onClick={() => setActiveTab('live-room')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'live-room'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video size={13} />
            <span>Virtual Consultation Studio</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: FACULTY DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-5">
          {/* Filters & Search */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Domain Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {['All', 'STEM & AI', 'Medicine & Bio', 'Commerce & Finance', 'Law & Humanities', 'Design & Media'].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDomain(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    selectedDomain === d
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mentors, domains..."
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>
          </div>

          {/* Faculty Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFaculty.map((fac) => (
              <motion.div
                key={fac.id}
                whileHover={{ y: -2 }}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img src={fac.avatarUrl} alt={fac.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-900 leading-snug">{fac.name}</h3>
                        <p className="text-[11px] text-slate-500 font-medium">{fac.title}</p>
                        <p className="text-[10px] text-red-600 font-bold">{fac.institution}</p>
                      </div>
                    </div>

                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      fac.isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {fac.isOnline ? 'Available' : 'Busy'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mt-2">{fac.bio}</p>

                  {/* Expertise Badges */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {fac.expertise.map((exp, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                    <Star size={13} className="text-amber-500 fill-amber-500" />
                    <span>{fac.rating}</span>
                    <span className="text-slate-400 font-normal">({fac.reviewsCount})</span>
                  </div>

                  <button
                    onClick={() => launchMeeting(fac.jitsiRoomId, fac)}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Video size={13} />
                    <span>Start Video Room</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: VIRTUAL JITSI CONSULTATION STUDIO */}
      {activeTab === 'live-room' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Consultation Studio Top Controls */}
          <div className="px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow">
                <Video size={18} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <span>Jitsi Advisory Room:</span>
                  <span className="text-amber-400 font-mono lowercase">#{activeRoomId}</span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  {activeFaculty ? `Advisory session with ${activeFaculty.name}` : 'Open Academic Consultation Studio'}
                </p>
              </div>
            </div>

            {/* Room Switcher input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={activeRoomId}
                onChange={(e) => setActiveRoomId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="Custom Room ID..."
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <button
                onClick={() => setIsMeetingActive(true)}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                Connect
              </button>
              {isMeetingActive && (
                <button
                  onClick={() => setIsMeetingActive(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <PhoneOff size={13} />
                  <span>Leave</span>
                </button>
              )}
            </div>
          </div>

          {/* Jitsi Iframe Room Mount */}
          <div className="p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-center min-h-[580px]">
            {isMeetingActive ? (
              <div className="w-full h-[540px] rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
                <iframe
                  title="Jitsi Video Conference"
                  src={`https://${jitsiDomain}/${activeRoomId}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.defaultRemoteDisplayName="Student"`}
                  allow="camera; microphone; fullscreen; display-capture; autoplay"
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="text-center max-w-md p-8 text-white">
                <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto text-red-500 mb-4">
                  <Video size={28} />
                </div>
                <h3 className="text-lg font-black text-white">Virtual Consultation Studio Ready</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Connect face-to-face with mentors, professors, and career counselors. Camera, microphone, chat, and screen-sharing are fully integrated.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={() => setIsMeetingActive(true)}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    <Video size={14} />
                    <span>Launch Jitsi Session</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('directory')}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Select a Professor
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Advice strip */}
          <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
            <span>🛡️ End-to-end encrypted WebRTC audio and video transmission via Jitsi API.</span>
            <span>Tip: Share your screen to review blueprints and marksheets directly with your counselor.</span>
          </div>
        </div>
      )}
    </div>
  );
}
