import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Award, BookOpen, GraduationCap, Compass, TrendingUp, DollarSign, 
  MapPin, Shield, Map, HelpCircle, Briefcase, ListTodo, Milestone, 
  PlaneTakeoff, Swords, Sliders, MessageSquare, ShieldCheck, Heart,
  FileText, Target, Share2, Copy, Check, Download, Volume2, VolumeX,
  Play, Pause, Newspaper, ExternalLink, Globe, RefreshCw, Bookmark,
  StickyNote, Plus, Trash, History, Clock, RotateCcw, X, AlertCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { IntelligenceReport, StudentProfile, CareerTrends, CareerTrendItem } from '../types';
import CollegeBattle from './CollegeBattle';
import CollegeComparator from './CollegeComparator';
import WhatIfSimulator from './WhatIfSimulator';
import ProfileBuilder from './ProfileBuilder';
import InterviewCoach from './InterviewCoach';
import AcademicGoalSetter from './AcademicGoalSetter';
import DailyWellnessCheckin from './DailyWellnessCheckin';
import { 
  SavedReportData, 
  shareReport, 
  saveNewsBookmark, 
  deleteNewsBookmark, 
  loadNewsBookmarks, 
  NewsBookmark,
  saveUserNotes,
  loadUserNotes,
  BlueprintNote
} from '../firebase';

interface DashboardProps {
  report: IntelligenceReport;
  profile: StudentProfile;
  onSimulate: (simData: { marks: string; budget: string; stream: string }) => void;
  isSimulating: boolean;
  savedReports?: SavedReportData[];
  userId?: string;
  onProfileUpdate?: (updatedProfile: StudentProfile) => void;
  activeReportId?: string;
  onSelectReport?: (report: SavedReportData) => void;
  onRestoreVersion?: (versionReportId: string, parentReportId: string) => void;
}

export default function Dashboard({ 
  report, 
  profile, 
  onSimulate, 
  isSimulating, 
  savedReports, 
  userId, 
  onProfileUpdate,
  activeReportId,
  onSelectReport,
  onRestoreVersion
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'colleges' | 'career' | 'skills' | 'parent' | 'tools' | 'goals' | 'wellness'>('overview');
  const [completedSkills, setCompletedSkills] = useState<string[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  
  // Split-View Mode states
  const [isSplitView, setIsSplitView] = useState(false);
  
  // Sharing states and handlers
  const [isSharing, setIsSharing] = useState(false);
  const [sharedLink, setSharedLink] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresInSeconds, setExpiresInSeconds] = useState<number>(86400); // Default: 24 hours (86400)
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [linkExpiresAt, setLinkExpiresAt] = useState<string | null>(null);

  // Real-time News state
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [newsFeedType, setNewsFeedType] = useState<'profile' | 'global'>('global');

  // News Bookmarks state
  const [bookmarks, setBookmarks] = useState<NewsBookmark[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  // Notes states
  const [userNotes, setUserNotes] = useState<BlueprintNote[]>([]);
  const [noteInput, setNoteInput] = useState<string>('');
  const [isNoteActionItem, setIsNoteActionItem] = useState<boolean>(false);
  const [notesLoading, setNotesLoading] = useState<boolean>(false);

  // Safely format link URLs as Firestore-compliant IDs
  const getSafeId = (link: string) => {
    return link.replace(/[^a-zA-Z0-9_\-]+/g, '_').substring(0, 100);
  };

  // Toggle bookmark logic
  const handleToggleBookmark = async (e: React.MouseEvent, item: { title: string; link: string; source: string; pubDate?: string }) => {
    e.preventDefault();
    e.stopPropagation();
    const uid = profile?.uid || userId;
    if (!uid) {
      alert("Please log in to save news articles to your profile.");
      return;
    }

    const bId = getSafeId(item.link);
    const isBookmarked = bookmarks.some(b => b.id === bId);

    if (isBookmarked) {
      // Optimitic update: remove bookmark
      setBookmarks(prev => prev.filter(b => b.id !== bId));
      try {
        await deleteNewsBookmark(uid, bId);
      } catch (err) {
        console.error("Error deleting bookmark:", err);
        // Rollback on failure
        const refreshed = await loadNewsBookmarks(uid);
        setBookmarks(refreshed);
      }
    } else {
      // Optimistic update: add bookmark
      const newBookmark = {
        id: bId,
        title: item.title,
        link: item.link,
        source: item.source || 'Unknown Source',
        pubDate: item.pubDate || new Date().toISOString()
      };
      setBookmarks(prev => [
        { ...newBookmark, userId: uid, savedAt: new Date().toISOString() },
        ...prev
      ]);
      try {
        await saveNewsBookmark(uid, newBookmark);
      } catch (err) {
        console.error("Error saving bookmark:", err);
        // Rollback on failure
        const refreshed = await loadNewsBookmarks(uid);
        setBookmarks(refreshed);
      }
    }
  };

  // Load user bookmarks on component mount/UID changes
  useEffect(() => {
    let active = true;
    const fetchBookmarks = async () => {
      const uid = profile?.uid || userId;
      if (!uid) return;
      setBookmarksLoading(true);
      try {
        const data = await loadNewsBookmarks(uid);
        if (active) {
          setBookmarks(data || []);
        }
      } catch (err) {
        console.error("Error loading bookmarks:", err);
      } finally {
        if (active) {
          setBookmarksLoading(false);
        }
      }
    };
    fetchBookmarks();
    return () => {
      active = false;
    };
  }, [profile?.uid, userId]);

  // Load user notes effect
  useEffect(() => {
    let active = true;
    const fetchNotes = async () => {
      const uid = profile?.uid || userId;
      if (!uid) {
        const local = localStorage.getItem('blueprint_notes');
        if (local && active) {
          try {
            setUserNotes(JSON.parse(local));
          } catch (e) {
            console.error('Error parsing local notes:', e);
          }
        }
        return;
      }
      setNotesLoading(true);
      try {
        const dbNotes = await loadUserNotes(uid);
        if (active) {
          setUserNotes(dbNotes || []);
          localStorage.setItem('blueprint_notes', JSON.stringify(dbNotes));
        }
      } catch (err) {
        console.error("Error loading user notes:", err);
        const local = localStorage.getItem('blueprint_notes');
        if (local && active) {
          try {
            setUserNotes(JSON.parse(local));
          } catch (e) {}
        }
      } finally {
        if (active) {
          setNotesLoading(false);
        }
      }
    };
    fetchNotes();
    return () => {
      active = false;
    };
  }, [profile?.uid, userId]);

  const handleAddNote = async (sectionId: string) => {
    if (!noteInput.trim()) return;
    const uid = profile?.uid || userId;
    
    const activeSavedReport = savedReports?.find(r => {
      try {
        const parsed = JSON.parse(r.reportData);
        return parsed.executiveSummary === report.executiveSummary;
      } catch (e) {
        return false;
      }
    });
    const currentReportId = activeSavedReport?.id || 'current_active_blueprint';

    const newNote: BlueprintNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      reportId: currentReportId,
      sectionId,
      text: noteInput.trim(),
      createdAt: new Date().toISOString(),
      isActionItem: isNoteActionItem,
      isCompleted: false
    };

    const updatedNotes = [newNote, ...userNotes];
    setUserNotes(updatedNotes);
    setNoteInput('');
    setIsNoteActionItem(false);

    localStorage.setItem('blueprint_notes', JSON.stringify(updatedNotes));
    if (uid) {
      try {
        await saveUserNotes(uid, updatedNotes);
      } catch (err) {
        console.error("Failed to save user notes to DB:", err);
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const uid = profile?.uid || userId;
    const updatedNotes = userNotes.filter(n => n.id !== noteId);
    setUserNotes(updatedNotes);

    localStorage.setItem('blueprint_notes', JSON.stringify(updatedNotes));
    if (uid) {
      try {
        await saveUserNotes(uid, updatedNotes);
      } catch (err) {
        console.error("Failed to save user notes to DB after deletion:", err);
      }
    }
  };

  const handleToggleNoteCompletion = async (noteId: string) => {
    const uid = profile?.uid || userId;
    const updatedNotes = userNotes.map(n => 
      n.id === noteId ? { ...n, isCompleted: !n.isCompleted } : n
    );
    setUserNotes(updatedNotes);

    localStorage.setItem('blueprint_notes', JSON.stringify(updatedNotes));
    if (uid) {
      try {
        await saveUserNotes(uid, updatedNotes);
      } catch (err) {
        console.error("Failed to save user notes to DB after toggle:", err);
      }
    }
  };

  const renderSectionNotes = (sectionId: string, side: 'left' | 'right' | 'full') => {
    if (side === 'right') return null;

    const activeSavedReport = savedReports?.find(r => {
      try {
        const parsed = JSON.parse(r.reportData);
        return parsed.executiveSummary === report.executiveSummary;
      } catch (e) {
        return false;
      }
    });
    const currentReportId = activeSavedReport?.id || 'current_active_blueprint';
    const sectionNotes = userNotes.filter(n => n.reportId === currentReportId && n.sectionId === sectionId);

    return (
      <div className="mt-8 bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-4 text-slate-800">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <StickyNote size={16} />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-gray-900 uppercase">
                Section Commentary & Action Items
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Attach personal logs, notes, task targets, or checklist items to this section of your report.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 text-[9px] font-black bg-slate-50 text-slate-600 border border-slate-200 rounded-full uppercase tracking-widest">
            {sectionNotes.length} {sectionNotes.length === 1 ? 'Note' : 'Notes'}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Type a personal commentary or action item..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddNote(sectionId);
                }
              }}
              className="flex-1 bg-slate-50 border border-gray-200 text-xs font-semibold text-gray-800 rounded-xl px-4 py-3 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
            />
            <button
              onClick={() => handleAddNote(sectionId)}
              className="inline-flex items-center justify-center px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus size={14} className="mr-1" />
              <span>Add</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNoteActionItem(!isNoteActionItem)}
              className="flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
            >
              <div className={`h-4 w-4 rounded border flex items-center justify-center transition ${isNoteActionItem ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-gray-300'}`}>
                {isNoteActionItem && <Check size={10} className="stroke-[3] text-white" />}
              </div>
              <span className="text-[11px] font-bold">Mark as Action Item / Checklist Task</span>
            </button>
          </div>
        </div>

        {sectionNotes.length > 0 ? (
          <div className="space-y-2.5 pt-2">
            {sectionNotes.map((note) => (
              <div
                key={note.id}
                className={`flex items-start justify-between p-3.5 rounded-xl border transition ${
                  note.isActionItem 
                    ? note.isCompleted 
                      ? 'bg-emerald-50/40 border-emerald-100 text-slate-500 line-through' 
                      : 'bg-amber-50/30 border-amber-100/70 text-slate-800' 
                    : 'bg-slate-50/70 border-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  {note.isActionItem ? (
                    <button
                      onClick={() => handleToggleNoteCompletion(note.id)}
                      className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition ${
                        note.isCompleted 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'bg-white border-amber-300 hover:border-amber-500'
                      }`}
                    >
                      {note.isCompleted && <Check size={10} className="stroke-[3] text-white" />}
                    </button>
                  ) : (
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0"></div>
                  )}

                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-relaxed break-words">{note.text}</p>
                    <div className="flex items-center space-x-2 text-[9px] text-gray-400 font-bold">
                      <span>
                        {new Date(note.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {note.isActionItem && (
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          note.isCompleted 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {note.isCompleted ? 'Completed' : 'Pending Task'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-slate-100/50 rounded-lg transition shrink-0 ml-2"
                  title="Delete Note"
                >
                  <Trash size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
            <p className="text-xs text-gray-400 font-semibold italic">No commentary or action items added yet for this section.</p>
          </div>
        )}
      </div>
    );
  };

  // Fetch news effect whenever profile stream or career interests change, or report updates
  useEffect(() => {
    let active = true;
    const fetchNews = async () => {
      if (!profile) return;
      setNewsLoading(true);
      setNewsError(null);
      try {
        const streamParam = encodeURIComponent(profile.stream || '');
        const interestsParam = encodeURIComponent(profile.careerInterests || '');
        const res = await fetch(`/api/stream-news?stream=${streamParam}&interests=${interestsParam}&type=${newsFeedType}`);
        if (!res.ok) {
          throw new Error('Failed to fetch news feed');
        }
        const data = await res.json();
        if (active) {
          setNews(data);
        }
      } catch (err: any) {
        console.error('Error fetching stream news:', err);
        if (active) {
          setNewsError(err?.message || 'Error fetching real-time headlines');
        }
      } finally {
        if (active) {
          setNewsLoading(false);
        }
      }
    };

    fetchNews();
    return () => {
      active = false;
    };
  }, [profile?.stream, profile?.careerInterests, report, newsFeedType]);

  // Web Speech API / Summary narration states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  }, [report]);

  const handleToggleSpeech = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) {
      alert("Web Speech API is not supported in this browser or environment.");
      return;
    }

    if (isSpeaking) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    } else {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = speechRate;
      
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      setIsPaused(false);
    }
  };

  const handleStopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const handleShare = () => {
    if (!userId) {
      alert("Please authenticate or save your profile first to share reports.");
      return;
    }
    setSharedLink(null);
    setCopied(false);
    setRecipientEmail('');
    setEmailSuccess(null);
    setEmailError(null);
    setLinkExpiresAt(null);
    setShowShareModal(true);
  };

  const handleGenerateShareLink = async () => {
    setIsSharing(true);
    setSharedLink(null);
    setCopied(false);
    setEmailSuccess(null);
    setEmailError(null);
    try {
      const title = `AI Blueprint: ${profile.stream} (${new Date().toLocaleDateString()})`;
      const sharedId = await shareReport(userId, title, report, profile, expiresInSeconds);
      const generatedUrl = `${window.location.origin}${window.location.pathname}?sharedReportId=${sharedId}`;
      setSharedLink(generatedUrl);

      if (expiresInSeconds > 0) {
        const expiryDate = new Date(Date.now() + expiresInSeconds * 1000);
        setLinkExpiresAt(expiryDate.toISOString());
      } else {
        setLinkExpiresAt(null);
      }
    } catch (err) {
      console.error("Error sharing report:", err);
      alert("Failed to generate shared link. Please check your connection and try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !sharedLink) return;

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setIsSendingEmail(true);
    setEmailSuccess(null);
    setEmailError(null);

    try {
      const title = `AI Blueprint: ${profile.stream} (${new Date().toLocaleDateString()})`;
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: recipientEmail,
          link: sharedLink,
          title,
          expiresAt: linkExpiresAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send share email.');
      }

      setEmailSuccess(`Success! Shared blueprint link has been dispatched to ${recipientEmail}`);
      setRecipientEmail('');
    } catch (err: any) {
      console.error("Error sending share email:", err);
      setEmailError(err?.message || "Failed to dispatch email. Please try again.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCopyLink = () => {
    if (sharedLink) {
      navigator.clipboard.writeText(sharedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const [selectedComparisonReportId, setSelectedComparisonReportId] = useState<string>('');
  const [comparisonReport, setComparisonReport] = useState<IntelligenceReport | null>(null);
  const [comparisonTitle, setComparisonTitle] = useState<string>('');

  const handleComparisonSelect = (reportId: string) => {
    setSelectedComparisonReportId(reportId);
    if (!reportId) {
      setComparisonReport(null);
      setComparisonTitle('');
      return;
    }
    const found = savedReports?.find(r => r.id === reportId);
    if (found) {
      try {
        const parsed = JSON.parse(found.reportData) as IntelligenceReport;
        setComparisonReport(parsed);
        setComparisonTitle(found.title);
      } catch (err) {
        console.error("Failed to parse comparison report data", err);
      }
    }
  };

  const downloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const margin = 15;
      const pageWidth = 210;
      const pageHeight = 297;
      const maxContentY = 270;
      let currY = 25;

      const drawHeaderLine = (titleText: string) => {
        doc.setDrawColor(220, 38, 38); // red-600
        doc.setLineWidth(0.4);
        doc.line(margin, 12, pageWidth - margin, 12);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(titleText.toUpperCase(), margin, 9);

        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        doc.setFont("helvetica", "normal");
        doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin - 15, pageHeight - 8);
      };

      const startNewPage = (titleText = "AI RED DRAGON - PORTABLE EDUCATION BLUEPRINT") => {
        doc.addPage();
        currY = 25;
        drawHeaderLine(titleText);
      };

      const printHeading = (text: string, level: 1 | 2 | 3 = 1) => {
        const size = level === 1 ? 13 : level === 2 ? 10.5 : 9.5;
        const color = level === 1 ? [185, 28, 28] : level === 2 ? [15, 23, 42] : [71, 85, 105];
        
        if (currY + size > maxContentY) {
          startNewPage();
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(text, margin, currY);
        currY += size * 0.4 + 3;

        // Draw an underline for level 1 heading
        if (level === 1) {
          doc.setDrawColor(226, 232, 240); // slate-200
          doc.setLineWidth(0.3);
          doc.line(margin, currY - 1, pageWidth - margin, currY - 1);
          currY += 2;
        }
      };

      const printParagraph = (text: string, fontSize = 9, textColor = [51, 65, 85], isBold = false) => {
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setFontSize(fontSize);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);

        const splitText = doc.splitTextToSize(text, pageWidth - (margin * 2));

        for (let i = 0; i < splitText.length; i++) {
          if (currY + 5 > maxContentY) {
            startNewPage();
          }
          doc.text(splitText[i], margin, currY);
          currY += fontSize * 0.35 + 2;
        }
      };

      const printBulletPoint = (label: string, text: string) => {
        if (currY + 8 > maxContentY) {
          startNewPage();
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(`• ${label}:`, margin + 3, currY);
        
        const labelWidth = doc.getTextWidth(`• ${label}: `);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85); // slate-700
        
        const contentWidth = pageWidth - (margin * 2) - labelWidth - 3;
        const splitText = doc.splitTextToSize(text, contentWidth);
        
        for (let i = 0; i < splitText.length; i++) {
          if (currY + 5 > maxContentY) {
            startNewPage();
          }
          if (i === 0) {
            doc.text(splitText[i], margin + 3 + labelWidth, currY);
          } else {
            doc.text(splitText[i], margin + 6, currY);
          }
          currY += 9 * 0.35 + 1.8;
        }
        currY += 1.5;
      };
            // --- PAGE 1: DEDICATED COVER PAGE (No Header/Footer on Page 1) ---
      
      // Draw left decorative crimson border band (10mm wide)
      doc.setFillColor(185, 28, 28); // red-700
      doc.rect(0, 0, 10, pageHeight, "F");
      
      // Draw right golden border band (2.5mm wide) to represent Golden Owl Technologies
      doc.setFillColor(212, 175, 55); // Metallic gold
      doc.rect(10, 0, 2.5, pageHeight, "F");
      
      // Let's set a margin offset of 22mm from the left edge for content
      const coverX = 22;
      
      // Platform Brand
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("AI RED DRAGON EDUCATIONAL INTELLIGENCE PLATFORM", coverX, 35);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(185, 28, 28); // red-700
      doc.text("PREDICTIVE ANALYSIS REPORT • SERIES V1.0", coverX, 40);
      
      // High-tech Matte Black Corporate Logo Badge for Golden Owl Technologies
      doc.setFillColor(15, 23, 42); // Matte black/deep slate
      doc.roundedRect(pageWidth - margin - 35, 25, 30, 30, 3, 3, "F");

      const logoCX = pageWidth - margin - 20;
      const logoCY = 40;
      doc.setDrawColor(212, 175, 55); // Metallic Gold
      doc.setLineWidth(0.4);
      doc.circle(logoCX, logoCY, 10, 'D'); // Outer sharp golden circle

      // Sleek gold owl eyes
      doc.setFillColor(212, 175, 55);
      doc.circle(logoCX - 3.5, logoCY - 1.5, 1.2, 'D');
      doc.circle(logoCX + 3.5, logoCY - 1.5, 1.2, 'D');
      // Glowing golden pupils
      doc.setFillColor(255, 215, 0); // Bright gold
      doc.circle(logoCX - 3.5, logoCY - 1.5, 0.5, 'F');
      doc.circle(logoCX + 3.5, logoCY - 1.5, 0.5, 'F');

      // Sharp beak
      doc.triangle(logoCX, logoCY - 0.5, logoCX - 1, logoCY + 2, logoCX + 1, logoCY + 2, 'FD');

      // Sleek eyebrows/mask contours
      doc.line(logoCX - 6, logoCY - 4, logoCX - 2, logoCY - 2.5);
      doc.line(logoCX + 6, logoCY - 4, logoCX + 2, logoCY - 2.5);
      doc.line(logoCX - 6, logoCY + 2, logoCX - 3, logoCY + 4.5);
      doc.line(logoCX + 6, logoCY + 2, logoCX + 3, logoCY + 4.5);

      // Corporate name text below badge
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(212, 175, 55); // Golden
      doc.text("GOLDEN OWL", pageWidth - margin - 35, 60);
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("TECHNOLOGIES", pageWidth - margin - 35, 63.5);

      // Horizontal dividing rule
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.4);
      doc.line(coverX, 48, pageWidth - margin, 48);
      
      // Document Main Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("PERSONALIZED ACADEMIC BLUEPRINT", coverX, 65);
      doc.text("& CAREER PATHWAY ROADMAP", coverX, 75);
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10.5);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("Comprehensive high-precision stream evaluations, institutional mapping,", coverX, 83);
      doc.text("financial return indicators, and geographic intelligence.", coverX, 88);
      
      // Prepared For block
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(185, 28, 28); // red-700
      doc.text("PREPARED EXCLUSIVELY FOR:", coverX, 106);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(profile.name?.toUpperCase() || "ACADEMIC APPLICANT", coverX, 116);
      
      // Rounded Card for Student Profile Details (Split layout: Left = Profile, Right = DNA)
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setLineWidth(0.3);
      doc.roundedRect(coverX, 126, 173, 106, 4, 4, "FD");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(185, 28, 28); // red-700
      doc.text("STUDENT APPLICANT INDEX", coverX + 6, 134);

      // Vertical card divider
      doc.setDrawColor(226, 232, 240);
      doc.line(coverX + 85, 134, coverX + 85, 222);
      
      // Underline inside left block
      doc.setDrawColor(241, 245, 249);
      doc.line(coverX + 6, 138, coverX + 79, 138);

      let cy = 146;
      const drawCoverFieldLeft = (label: string, value: string, yPos: number) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(`${label}:`, coverX + 6, yPos);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(value, coverX + 36, yPos);
      };
      
      drawCoverFieldLeft("Stream Focus", profile.stream || "N/A", cy); cy += 8.5;
      drawCoverFieldLeft("Class 10 Score", profile.class10Marks || "N/A", cy); cy += 8.5;
      drawCoverFieldLeft("Class 12 Score", profile.class12Marks || "N/A", cy); cy += 8.5;
      drawCoverFieldLeft("Entrance Score", profile.entranceScores || "N/A", cy); cy += 8.5;
      drawCoverFieldLeft("Budget Limit", profile.budget || "N/A", cy); cy += 8.5;
      drawCoverFieldLeft("Hostel Req.", profile.hostelRequirement ? "Yes" : "No", cy); cy += 8.5;
      drawCoverFieldLeft("Target Region", profile.locationPreference || "Flexible", cy); cy += 8.5;

      // Primary Career Focus Block
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Career Focus:", coverX + 6, cy);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const splitFocus = doc.splitTextToSize(profile.careerInterests || "Not Specified", 72);
      doc.text(splitFocus[0] || "N/A", coverX + 6, cy + 4);

      // Right Column: Aptitude DNA scores matrix on the cover page!
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(185, 28, 28); // red-700
      doc.text("APTITUDE DNA ASSESSMENT", coverX + 91, 134);

      doc.setDrawColor(241, 245, 249);
      doc.line(coverX + 91, 138, coverX + 167, 138);

      const covScores = report.studentDna?.scores || {};
      const covScoreLabels: { [key: string]: string } = {
        academic: "Academic Strength",
        problemSolving: "Problem Solving",
        innovation: "Innovation Quotient",
        communication: "Communication Index",
        leadership: "Leadership Aptitude",
        research: "Research Aptitude",
        entrepreneurship: "Entrepreneurship Index"
      };

      let dy = 145;
      Object.keys(covScoreLabels).forEach((key) => {
        const val = (covScores as any)[key] ?? 75;
        
        // Label
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(covScoreLabels[key], coverX + 91, dy);
        
        // Value text
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(`${val}/100`, coverX + 158, dy);
        
        // Progress bar BG
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(coverX + 91, dy + 1.5, 75, 2.2, 0.5, 0.5, "F");
        
        // Progress bar Fill (colors: crimson for high, amber for target, blue for safe)
        if (val >= 85) {
          doc.setFillColor(220, 38, 38); // crimson
        } else if (val >= 70) {
          doc.setFillColor(245, 158, 11); // amber
        } else {
          doc.setFillColor(59, 130, 246); // blue
        }
        const barWidth = (val / 100) * 75;
        doc.roundedRect(coverX + 91, dy + 1.5, barWidth, 2.2, 0.5, 0.5, "F");
        
        dy += 9.5;
      });
      
      // Bottom Document Controls
      doc.setDrawColor(226, 232, 240);
      doc.line(coverX, 245, pageWidth - margin, 245);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("DOCUMENT SECURITY & CONTROLS", coverX, 252);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`DATE OF ISSUE: ${new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}`, coverX, 258);
      doc.text(`ISSUING NODE: GOLDEN OWL TECHNOLOGIES REPORT DEPLOYMENT`, coverX, 263);
      doc.text("SECURITY CLASSIFICATION: CONFIDENTIAL (PROPRIETARY EVALUATION)", coverX, 268);
      doc.text("This portable document contains automated predictive guidance based on student aptitude matrices.", coverX, 273);
 
       // --- PAGE 2: EXECUTIVE SUMMARY & STUDENT DNA (Start actual report layout) ---
       doc.addPage();
       currY = 25;
       drawHeaderLine("AI RED DRAGON - EXECUTIVE SUMMARY & APTITUDE INDEX");
      
      // Executive Summary
      printHeading("EXECUTIVE INTELLIGENCE SUMMARY", 1);
      printParagraph(report.executiveSummary, 9.5);
      currY += 6;

      // Student DNA Analysis
      printHeading("STUDENT DNA ANALYSIS & APTITUDE MAPPING", 1);
      
      const scores = report.studentDna?.scores || {};
      const scoreLabels: { [key: string]: string } = {
        academic: "Academic Strength",
        problemSolving: "Problem Solving",
        innovation: "Innovation Quotient",
        communication: "Communication Index",
        leadership: "Leadership Aptitude",
        research: "Research Aptitude",
        entrepreneurship: "Entrepreneurship Index"
      };

      printHeading("Aptitude Dimensions Matrix", 2);
      Object.keys(scoreLabels).forEach((key) => {
        const val = (scores as any)[key] ?? 75;
        printBulletPoint(scoreLabels[key], `${val}/100`);
      });
      currY += 4;

      if (report.studentDna?.analysis) {
        printParagraph(`Aptitude Analysis Narrative: ${report.studentDna.analysis}`, 9);
      }

      // --- PAGE 3: ACADEMIC STREAM & SHORTLISTED COLLEGES ---
      startNewPage("AI RED DRAGON - COLLEGES & ADMISSIONS BLUEPRINT");

      printHeading("ACADEMIC STREAM SUITABILITY ANALYSIS", 1);
      if (report.streamEvaluation?.currentSuitability) {
        printParagraph(`Current Stream Suitability Assessment: ${report.streamEvaluation.currentSuitability}`, 9.5);
        currY += 3;
      }
      if (report.streamEvaluation?.alternativePaths && report.streamEvaluation.alternativePaths.length > 0) {
        printParagraph(`Alternative Recommended Tracks: ${report.streamEvaluation.alternativePaths.join(', ')}`, 9, [185, 28, 28], true);
        currY += 3;
      }
      if (report.streamEvaluation?.recommendations) {
        printParagraph(`Academic Guidance Counsellor Advice: ${report.streamEvaluation.recommendations}`, 9);
        currY += 6;
      }

      printHeading("UNIVERSITY MATCHES & ADMISSION PROBABILITY", 1);
      
      const tiers: ('Dream' | 'Target' | 'Safe')[] = ['Dream', 'Target', 'Safe'];
      tiers.forEach((tier) => {
        const list = report.colleges?.filter(c => c.tier === tier) || [];
        if (list.length > 0) {
          printHeading(`${tier} Tier Match`, 2);
          list.forEach((col) => {
            const chance = report.admissionChances?.find(ac => ac.collegeName === col.name);
            printParagraph(`${col.name} - ${col.course}`, 10, [15, 23, 42], true);
            printParagraph(`Location: ${col.location} | Annual Fees: ${col.fees} | Avg. Placement Package: ${col.averagePackage}`, 8.5, [71, 85, 105]);
            printParagraph(`Admission Probability: ${chance?.probability || '75%+'} - ${chance?.reasoning || 'Matches profile highlights.'}`, 8.5, [185, 28, 28]);
            
            if (col.advantages) {
              printParagraph(`Primary Advantage: ${col.advantages}`, 8.5, [30, 41, 59]);
            }
            currY += 4;
          });
          currY += 2;
        }
      });

      if (report.scholarships && report.scholarships.length > 0) {
        printHeading("SCHOLARSHIP OPPORTUNITIES & ELIGIBILITY", 1);
        report.scholarships.forEach((sch) => {
          printParagraph(`${sch.name} (${sch.type})`, 9.5, [15, 23, 42], true);
          printParagraph(`Eligibility Criteria: ${sch.eligibility}`, 8.5);
          printParagraph(`Funding Amount: ${sch.amount}`, 8.5, [22, 101, 52], true);
          currY += 3;
        });
      }

      // --- PAGE 4: CAREER RECOMMENDER & ROADMAP ---
      startNewPage("AI RED DRAGON - CAREER PLAN & YEAR-BY-YEAR ROADMAP");

      printHeading("FUTURE CAREER COMPATIBILITY RECOMMENDER", 1);
      if (report.careerDNA && report.careerDNA.length > 0) {
        report.careerDNA.forEach((car) => {
          printParagraph(car.title, 11, [185, 28, 28], true);
          printParagraph(`Future Demand: ${car.futureDemand} | Growth Potential: ${car.growthPotential} | Salary Outlook: ${car.salaryOutlook}`, 8.5, [71, 85, 105]);
          printParagraph(`Degrees recommended: ${car.degreePath}`, 8.5);
          printParagraph(`Key required skill-sets: ${car.requiredSkills?.join(', ')}`, 8.5);
          if (car.aiRisk) {
            printParagraph(`AI Automation Risk Factor: ${car.aiRisk}`, 8.5, [15, 23, 42], true);
          }
          currY += 4;
        });
      }

      printHeading("SKILL GAP ANALYSIS & ACTIONABLE CERTIFICATIONS", 1);
      if (report.skillGapAnalysis) {
        const gap = report.skillGapAnalysis;
        if (gap.identifiedGaps && gap.identifiedGaps.length > 0) {
          printBulletPoint("Identified Weaknesses & Gaps", gap.identifiedGaps.join(', '));
        }
        if (gap.certifications && gap.certifications.length > 0) {
          printBulletPoint("Target Professional Certifications", gap.certifications.join(', '));
        }
        if (gap.recommendedCourses && gap.recommendedCourses.length > 0) {
          printBulletPoint("Recommended Online Courses", gap.recommendedCourses.join(', '));
        }
        if (gap.targetProjects && gap.targetProjects.length > 0) {
          printBulletPoint("Recommended Portfolio Projects", gap.targetProjects.join(', '));
        }
        currY += 4;
      }

      if (report.successRoadmap && report.successRoadmap.length > 0) {
        printHeading("YEAR-BY-YEAR SUCCESS TIMELINE ROADMAP", 1);
        report.successRoadmap.forEach((step) => {
          printParagraph(step.year, 10, [15, 23, 42], true);
          printBulletPoint("Primary focus of the year", step.focus || 'Core fundamentals');
          if (step.skills && step.skills.length > 0) {
            printBulletPoint("Skills to master", step.skills.join(', '));
          }
          if (step.milestones && step.milestones.length > 0) {
            printBulletPoint("Target achievements", step.milestones.join(', '));
          }
          currY += 2;
        });
      }

      // --- PAGE 5: FINANCIAL ANALYSIS & ROI BAR CHART ---
      startNewPage("AI RED DRAGON - ROI & FINANCIAL INTELLIGENCE");

      printHeading("FINANCIAL LEVERAGE & RETURN ON INVESTMENT (ROI)", 1);

      // Define internal amount helper to parse lakhs
      const parseSingleAmount = (text: string): number => {
        if (!text) return 0;
        let s = text.toLowerCase().replace(/,/g, '').trim();
        s = s.replace(/\([^)]*\)/g, ''); // remove parenthesized content
        const matches = s.match(/[\d.]+/g);
        if (!matches || matches.length === 0) return 0;
        let val1 = parseFloat(matches[0]);
        if (s.includes('-') || s.includes('to')) {
          const val2 = matches.length > 1 ? parseFloat(matches[1]) : val1;
          val1 = (val1 + val2) / 2;
        }
        if (s.includes('lakh') || s.includes('l') || s.includes('lac') || s.includes('lpa')) {
          return val1;
        }
        if (val1 >= 1000) {
          return val1 / 100000;
        }
        return val1;
      };

      // Draw ROI Bar Chart in PDF
      const drawPdfRoiChart = (x: number, y: number) => {
        const chartWidth = 110;
        const barHeight = 5;
        const barSpacing = 5.5;
        const labels = [
          "Total Academic Cost",
          "Expected Starting Salary",
          "Industry Entry Avg",
          "Mid-Career Average"
        ];
        const colors = [
          [148, 163, 184], // slate-400
          [245, 158, 11],  // amber-500
          [59, 130, 246],  // blue-500
          [220, 38, 38]    // red-600
        ];
        
        // Parse amounts
        const costVal = parseFloat(parseSingleAmount(report.roiAnalyzer?.totalInvestment).toFixed(1)) || 0;
        const startVal = parseFloat(parseSingleAmount(report.roiAnalyzer?.expectedAnnualSalary).toFixed(1)) || 0;
        const entryVal = parseFloat(parseSingleAmount(report.placementOutlook?.entrySalary).toFixed(1)) || 0;
        const midVal = parseFloat(parseSingleAmount(report.placementOutlook?.midCareerSalary).toFixed(1)) || 0;
        
        const vals = [costVal, startVal, entryVal, midVal];
        const maxVal = Math.max(...vals, 1);
        
        // Draw card background
        doc.setFillColor(248, 250, 252); // slate-50
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, 180, 72, 4, 4, "FD");
        
        // Chart Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text("ROI & COMPENSATIONAL MILESTONES (VALUES IN LAKHS INR)", x + 6, y + 8);
        
        // Draw Y axis line
        const axisX = x + 46;
        const axisYStart = y + 14;
        const axisYEnd = y + 64;
        doc.setDrawColor(148, 163, 184); // slate-400
        doc.line(axisX, axisYStart, axisX, axisYEnd);
        
        // Draw light grid lines (vertical ticks)
        const numTicks = 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        
        for (let i = 0; i <= numTicks; i++) {
          const tickVal = (maxVal * (i / numTicks));
          const pctX = (i / numTicks) * chartWidth;
          const tickX = axisX + pctX;
          
          // Grid line (except at axis itself)
          if (i > 0) {
            doc.setDrawColor(241, 245, 249);
            doc.line(tickX, axisYStart, tickX, axisYEnd);
          }
          
          // Label
          doc.text(`₹${tickVal.toFixed(1)}L`, tickX - 4, axisYEnd + 4);
        }
        
        // Draw Bars
        let currBarY = axisYStart + 4;
        for (let i = 0; i < 4; i++) {
          const val = vals[i];
          const label = labels[i];
          const color = colors[i];
          
          // Draw label (aligned right relative to axisX)
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85); // slate-700
          doc.text(label, axisX - 3, currBarY + 3.5, { align: "right" });
          
          // Draw bar
          const fillWidth = (val / maxVal) * chartWidth;
          if (fillWidth > 0) {
            doc.setFillColor(color[0], color[1], color[2]);
            doc.roundedRect(axisX, currBarY, fillWidth, barHeight, 0.8, 0.8, "F");
          }
          
          // Draw value text next to bar
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42);
          doc.text(`₹${val.toFixed(1)}L`, axisX + fillWidth + 2.5, currBarY + 4);
          
          currBarY += barHeight + barSpacing;
        }
      };

      if (currY + 76 > maxContentY) {
        startNewPage("AI RED DRAGON - ROI & FINANCIAL INTELLIGENCE");
      }
      drawPdfRoiChart(margin, currY);
      currY += 76;

      if (report.roiAnalyzer) {
        if (currY + 36 > maxContentY) {
          startNewPage("AI RED DRAGON - ROI & FINANCIAL INTELLIGENCE");
        }
        
        // Draw elegant visual ROI audit summary card (Teal themed for financial health)
        doc.setFillColor(240, 253, 250); // teal-50
        doc.setDrawColor(13, 148, 136); // teal-600
        doc.setLineWidth(0.4);
        doc.roundedRect(margin, currY, 180, 25, 3, 3, "FD");

        // Vertical separators
        doc.setDrawColor(204, 251, 241); // teal-100
        doc.line(margin + 60, currY + 4, margin + 60, currY + 21);
        doc.line(margin + 120, currY + 4, margin + 120, currY + 21);

        // Column 1: Payback Window
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(20, 110, 100);
        doc.text("PAYBACK WINDOW", margin + 6, currY + 7);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`${report.roiAnalyzer.paybackPeriodMonths || 'N/A'}`, margin + 6, currY + 13);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Amortization timeline", margin + 6, currY + 18);

        // Column 2: Career Yield Multiplier
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(20, 110, 100);
        doc.text("CAREER YIELD MULTIPLIER", margin + 66, currY + 7);
        
        // Compute dynamic multiplier
        const costVal = parseFloat(parseSingleAmount(report.roiAnalyzer?.totalInvestment).toFixed(1)) || 1;
        const midVal = parseFloat(parseSingleAmount(report.placementOutlook?.midCareerSalary).toFixed(1)) || 1;
        const mult = costVal > 0 ? (midVal / costVal).toFixed(1) : "N/A";
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`${mult}x Investment`, margin + 66, currY + 13);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Mid-career vs program cost", margin + 66, currY + 18);

        // Column 3: Audit Rating
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(20, 110, 100);
        doc.text("ROI SUSTAINABILITY INDEX", margin + 126, currY + 7);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(185, 28, 28); // Crimson for premium value
        doc.text("HIGH OPTIMAL", margin + 126, currY + 13);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Recommended for enrollment", margin + 126, currY + 18);

        currY += 30;

        printParagraph("Financial Leverage Matrix Audit Detail:", 9.5, [185, 28, 28], true);
        printParagraph(
          `Your total academic program investment is estimated at ₹${report.roiAnalyzer.totalInvestment}, compared against an expected starting package of ₹${report.roiAnalyzer.expectedAnnualSalary}. This yields a calculated payback period of ${report.roiAnalyzer.paybackPeriodMonths}. Over a mid-to-long term career horizon, mid-career salary figures scale significantly to an average of ₹${report.placementOutlook?.midCareerSalary || 'N/A'}, demonstrating highly favorable career compound interest.`,
          9
        );
        currY += 4;
      }

      printHeading("PARENTAL GUARDRAILS & SAFETY DASHBOARD", 1);
      if (report.parentSummary) {
        const ps = report.parentSummary;
        printParagraph(`Estimated Total Budget Requirement: ${ps.totalFees || 'N/A'}`, 10, [15, 23, 42], true);
        currY += 2;
        printBulletPoint("Campus Safety & Surveillance Details", ps.safetyDetails || 'Fully secured campuses');
        printBulletPoint("Hostel Curfews & Local Regulations", ps.hostelSafety || 'Strict wardens & security checks');
        printBulletPoint("Placement Guarantees & Verification", ps.placementGuarantee || 'Full placement drive access');
        printBulletPoint("Career Return on Investment (ROI)", ps.careerROI || 'Optimal payout within years');
        currY += 4;
      }

      // --- PAGE 6: LOCAL LIVING COSTS & OVERSEAS PATHWAYS ---
      startNewPage("AI RED DRAGON - GEOGRAPHIC & OVERSEAS ADVISOR");

      printHeading("LOCAL LIVING COSTS & GEOGRAPHIC INTELLIGENCE", 1);
      if (report.locationIntelligence) {
        printBulletPoint("Distance and Regional Connectivity", report.locationIntelligence.distanceKm || 'Close transit links');
        printBulletPoint("Local PG & External Hostel Ecosystem", report.locationIntelligence.pgAndHostels || 'Highly secure accommodation options');
      }
      if (report.costOfLiving) {
        const col = report.costOfLiving;
        printBulletPoint("Estimated Monthly Rent", col.monthlyRent || 'N/A');
        printBulletPoint("Estimated Food & Grocery Expenses", col.monthlyFood || 'N/A');
        printBulletPoint("Monthly Transport & Travel Cost", col.monthlyTransport || 'N/A');
        printBulletPoint("Total Estimated Annual Living Cost", col.annualTotal || 'N/A');
      }
      currY += 4;

      if (report.studyAbroad && report.studyAbroad.countries && report.studyAbroad.countries.length > 0) {
        printHeading("GLOBAL OVERSEAS PATHWAYS ADVISOR", 1);
        printParagraph(`Advice & Strategy: ${report.studyAbroad.guidance}`, 9);
        printParagraph(`Recommended Overseas Countries: ${report.studyAbroad.countries.join(', ')}`, 9, [185, 28, 28], true);
        
        if (report.studyAbroad.universities && report.studyAbroad.universities.length > 0) {
          printHeading("Overseas University Matches", 2);
          report.studyAbroad.universities.forEach((uni) => {
            printParagraph(`• ${uni.name} - Est. Tuition: ${uni.cost} (Global Rating: ${uni.rating})`, 8.5);
          });
        }
      }

      // Save document
      const fileName = `${profile.name.replace(/\s+/g, '_')}_AI_Red_Dragon_Blueprint.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("Failed to generate PDF document:", err);
      alert("Encountered an issue generating the portable document.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const downloadCsv = () => {
    try {
      const escapeCSV = (val: any): string => {
        if (val === null || val === undefined) return '';
        let str = String(val).replace(/"/g, '""'); // Escape double quotes
        if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
          return `"${str}"`;
        }
        return str;
      };

      let csvContent = "";

      // 1. COLLEGES SECTION
      csvContent += "=== COLLEGE LIST ===\n";
      const collegeHeaders = [
        "College Name",
        "Tier",
        "Course",
        "Location",
        "Annual Fees",
        "Hostel Cost",
        "Accreditation & NIRF",
        "Placement Quality",
        "Average Package",
        "ROI Status",
        "Strategic Advantages"
      ];
      csvContent += collegeHeaders.map(escapeCSV).join(",") + "\n";

      if (report.colleges && report.colleges.length > 0) {
        report.colleges.forEach((col) => {
          const row = [
            col.name,
            col.tier,
            col.course,
            col.location,
            col.fees,
            col.hostelCost,
            col.accreditation,
            col.placementQuality,
            col.averagePackage,
            col.roi,
            col.advantages
          ];
          csvContent += row.map(escapeCSV).join(",") + "\n";
        });
      } else {
        csvContent += "No colleges available in the active blueprint.\n";
      }

      csvContent += "\n\n";

      // 2. ROADMAP MILESTONES SECTION
      csvContent += "=== SUCCESS ROADMAP MILESTONES ===\n";
      const roadmapHeaders = [
        "Academic Year",
        "Focus Area",
        "Core Skills to Build",
        "Milestones & Goals"
      ];
      csvContent += roadmapHeaders.map(escapeCSV).join(",") + "\n";

      if (report.successRoadmap && report.successRoadmap.length > 0) {
        report.successRoadmap.forEach((step) => {
          const row = [
            step.year,
            step.focus,
            step.skills ? step.skills.join("; ") : "",
            step.milestones ? step.milestones.join("; ") : ""
          ];
          csvContent += row.map(escapeCSV).join(",") + "\n";
        });
      } else {
        csvContent += "No roadmap milestones available in the active blueprint.\n";
      }

      // Trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      
      const fileStreamName = profile.stream ? profile.stream.replace(/[^a-z0-9]/gi, '_') : 'Profile';
      const fileProfileName = profile.name ? profile.name.replace(/[^a-z0-9]/gi, '_') : 'Student';
      const fileName = `AI_Blueprint_${fileProfileName}_${fileStreamName}_Roadmap.csv`;
      link.setAttribute("download", fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting CSV:", err);
      alert("Failed to export blueprint data to CSV.");
    }
  };

  const toggleSkill = (skill: string) => {
    if (completedSkills.includes(skill)) {
      setCompletedSkills(completedSkills.filter(s => s !== skill));
    } else {
      setCompletedSkills([...completedSkills, skill]);
    }
  };

  const dnaFields = [
    { key: 'academic', label: 'Academic Strength', color: 'bg-red-500' },
    { key: 'problemSolving', label: 'Problem Solving', color: 'bg-amber-500' },
    { key: 'innovation', label: 'Innovation Quotient', color: 'bg-green-500' },
    { key: 'communication', label: 'Communication Index', color: 'bg-blue-500' },
    { key: 'leadership', label: 'Leadership Aptitude', color: 'bg-purple-500' },
    { key: 'research', label: 'Research Aptitude', color: 'bg-teal-500' },
    { key: 'entrepreneurship', label: 'Entrepreneurship', color: 'bg-pink-500' }
  ];

  const getDnaValue = (key: string): number => {
    const scores = report.studentDna?.scores as any;
    return scores && typeof scores[key] === 'number' ? scores[key] : 75;
  };

  const getFallbackTrends = (stream: string, interests: string): CareerTrends => {
    const streamAndInterests = `${stream || ''} ${interests || ''}`.toLowerCase();
    const isSciencePCM = /science.*pcm|tech|computer|eng|coding|software|it|developer/i.test(streamAndInterests);
    const isSciencePCB = /science.*pcb|medical|bio|doctor|pharma|clinical/i.test(streamAndInterests);
    const isCommerce = /commerce|finance|business|acc|mba|investment|bba|economics/i.test(streamAndInterests);

    if (isSciencePCM) {
      return {
        marketOutlookSummary: "The technology sector is experiencing massive paradigm shifts driven by Generative AI, cloud-native scalability, and edge intelligence. Standard developer roles are transitioning into multi-agent design, orchestration, and LLM fine-tuning.",
        emergingRoles: ["Generative AI Engineer", "Cloud Solutions Architect", "Machine Learning Ops Expert"],
        shifts: [
          {
            title: "AI-Augmented Systems Engineering",
            demandDirection: "Surging",
            growthRate: "35% YoY",
            description: "Software engineering is shifting from manual coding to AI pair programming, prompt crafting, and model deployment architectures.",
            keyEnablers: ["Python", "Large Language Models", "Prompt Engineering"]
          },
          {
            title: "Quantum & Edge Computing",
            demandDirection: "Stable",
            growthRate: "18% YoY",
            description: "Decentralized computation at the edge is replacing traditional cloud latency models, demanding local optimized networks.",
            keyEnablers: ["Rust Programming", "Edge Security", "Microservices"]
          }
        ]
      };
    } else if (isSciencePCB) {
      return {
        marketOutlookSummary: "Medical and biological streams are merging rapidly with artificial intelligence, remote healthcare systems, and advanced genomics, leading to highly personalized treatment structures.",
        emergingRoles: ["Bioinformatics Specialist", "Telemedicine Administrator", "Genomic Data Scientist"],
        shifts: [
          {
            title: "AI-Driven Drug Discovery",
            demandDirection: "Surging",
            growthRate: "28% YoY",
            description: "Traditional laboratory pipeline testing is being fast-tracked through computational predictive modeling and molecular simulation.",
            keyEnablers: ["Bioinformatics tools", "Machine Learning", "Molecular Biology"]
          },
          {
            title: "Global Health Security & Epidemiology",
            demandDirection: "Stable",
            growthRate: "15% YoY",
            description: "Enhanced global surveillance networks are hiring specialists to model disease vectors and predict mutation paths dynamically.",
            keyEnablers: ["Statistical Modeling", "R Programming", "Public Health Audit"]
          }
        ]
      };
    } else if (isCommerce) {
      return {
        marketOutlookSummary: "Financial ecosystems are undergoing digitization, automated auditing, and algorithmic trade optimizations. Traditional bookkeeping is obsolete; the market is pivoting to fintech compliance, decentralized ledgers, and carbon accounting.",
        emergingRoles: ["Fintech Compliance Officer", "DeFi Risk Analyst", "ESG Investment Specialist"],
        shifts: [
          {
            title: "ESG & Green Finance Auditing",
            demandDirection: "Surging",
            growthRate: "42% YoY",
            description: "Corporations are scrutinized for climate impact; green-bond structuring and environmental risk accounting are seeing explosive growth.",
            keyEnablers: ["Sustainability Reporting", "Financial Modeling", "Regulatory Auditing"]
          },
          {
            title: "Algorithmic Accounting & RPA",
            demandDirection: "Stable",
            growthRate: "12% YoY",
            description: "Robotic Process Automation is streamlining high-frequency transactional data audits, shifting focus to high-value strategic consulting.",
            keyEnablers: ["RPA tools", "Python for Finance", "Data Visualization"]
          }
        ]
      };
    } else {
      return {
        marketOutlookSummary: "The creative and liberal arts landscapes are navigating the rise of generative media, human-AI collaborative workflows, and virtual space UX architecture. Authenticity, storytelling, and ethical curation are the new high-value capitals.",
        emergingRoles: ["Immersive Experience UX Designer", "Ethical AI Content Curation Expert", "Digital Heritage Restorer"],
        shifts: [
          {
            title: "Augmented Reality (AR) & Spatial UX",
            demandDirection: "Surging",
            growthRate: "22% YoY",
            description: "With Apple Vision Pro and spatial platforms, content creation is shifting from flat screens to immersive 3D spatial UI/UX designs.",
            keyEnablers: ["Unity/Unreal Engine", "Spatial UI Guidelines", "3D Modeling"]
          },
          {
            title: "Human Centered Storytelling & IP Curation",
            demandDirection: "Stable",
            growthRate: "10% YoY",
            description: "As programmatic text is commoditized, deeply human narrative structures, cultural context adaptation, and IP safeguarding are critical.",
            keyEnablers: ["Creative Direction", "IP Law basics", "Ethical AI usage"]
          }
        ]
      };
    }
  };

  const renderTabContent = (rep: IntelligenceReport, prof: StudentProfile, side: 'left' | 'right' | 'full') => {
    const isFull = side === 'full';
    
    const getLocalDnaValue = (key: string): number => {
      const scores = rep.studentDna?.scores as any;
      return scores && typeof scores[key] === 'number' ? scores[key] : 75;
    };

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Daily Mental Wellness & Progress Check-In */}
            {side !== 'right' && (
              <DailyWellnessCheckin
                userId={userId || ''}
                studentProfile={prof}
                onCheckinSaved={(updated) => onProfileUpdate && onProfileUpdate(updated)}
              />
            )}

            {/* Executive Summary Card */}
            <div className={`bg-gradient-to-br ${side === 'right' ? 'from-slate-900 to-amber-950/90' : 'from-slate-900 to-red-950/90'} text-white rounded-3xl ${isFull ? 'p-8' : 'p-6'} shadow-lg relative overflow-hidden`}>
              <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500 via-transparent to-transparent"></div>
              <div className="relative z-10">
                <span className={`px-2.5 py-0.5 text-[9px] font-black ${side === 'right' ? 'bg-amber-600/35 border-amber-500/50 text-amber-300' : 'bg-red-600/35 border-red-500/50 text-red-300'} rounded-full uppercase tracking-widest border`}>
                  {side === 'right' ? 'Comparison Report' : 'Active Intelligence Report'}
                </span>
                <h2 className={`${isFull ? 'text-2xl' : 'text-lg'} font-black mt-3 leading-tight`}>Executive Summary</h2>
                <p className="mt-2.5 text-xs text-gray-300 leading-relaxed">
                  {rep.executiveSummary}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
                  <div className="bg-slate-800/85 border border-slate-700 px-3 py-1.5 rounded-lg">
                    <span className="text-gray-400 block uppercase tracking-wider text-[8px] font-bold">Target Stream</span>
                    <span className="font-extrabold text-red-400 mt-0.5 block">{prof.stream}</span>
                  </div>
                  <div className="bg-slate-800/85 border border-slate-700 px-3 py-1.5 rounded-lg">
                    <span className="text-gray-400 block uppercase tracking-wider text-[8px] font-bold">Budget Limit</span>
                    <span className="font-extrabold text-amber-400 mt-0.5 block">{prof.budget || 'Open'}</span>
                  </div>
                  <div className="bg-slate-800/85 border border-slate-700 px-3 py-1.5 rounded-lg">
                    <span className="text-gray-400 block uppercase tracking-wider text-[8px] font-bold">Location</span>
                    <span className="font-extrabold text-green-400 mt-0.5 block">{prof.locationPreference || 'Open'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* DNA Analysis & Stream Suite */}
            <div className={`grid ${isFull ? 'md:grid-cols-3' : 'grid-cols-1'} gap-6`}>
              {/* DNA Score Matrix */}
              <div className={`${isFull ? 'md:col-span-2' : ''} bg-white border border-gray-150 rounded-2xl p-5 shadow-xs`}>
                <h3 className="text-xs font-extrabold text-gray-900 mb-4 flex items-center">
                  <Award className="text-red-500 mr-2 shrink-0" size={16} />
                  STUDENT DNA APTITUDE MAPPING
                </h3>
                
                <div className="space-y-3">
                  {dnaFields.map((field) => {
                    const val = getLocalDnaValue(field.key);
                    let diffText = '';
                    if (isSplitView && comparisonReport && side === 'left') {
                      const otherVal = (comparisonReport.studentDna?.scores as any)?.[field.key] ?? 75;
                      const diff = val - otherVal;
                      if (diff > 0) {
                        diffText = ` (+${diff})`;
                      } else if (diff < 0) {
                        diffText = ` (${diff})`;
                      }
                    }
                    return (
                      <div key={field.key}>
                        <div className="flex justify-between text-[11px] font-bold text-gray-700 mb-0.5">
                          <span>{field.label}</span>
                          <span className="text-red-600">
                            {val}/100
                            {diffText && <span className={diffText.includes('+') ? 'text-emerald-600 font-black ml-1' : 'text-rose-500 font-black ml-1'}>{diffText}</span>}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${val}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`${field.color} h-1.5 rounded-full`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 border-t border-gray-100 pt-3">
                  <p className="text-[11px] text-gray-600 leading-relaxed font-semibold">
                    <strong>DNA Aptitude Narrative:</strong> {rep.studentDna?.analysis}
                  </p>
                </div>
              </div>

              {/* Stream Suitability */}
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900 mb-3 flex items-center">
                    <BookOpen className="text-red-500 mr-2 shrink-0" size={16} />
                    STREAM SUITABILITY EVALUATION
                  </h3>
                  <div className="bg-red-50/50 border border-red-100 rounded-lg p-3 mb-3">
                    <p className="text-[9px] text-red-600 font-bold uppercase tracking-wider">Current Suitability</p>
                    <p className="text-xs text-gray-800 mt-1 leading-relaxed font-semibold">
                      {rep.streamEvaluation?.currentSuitability}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Alternative Tracks</p>
                    <div className="flex flex-wrap gap-1">
                      {rep.streamEvaluation?.alternativePaths?.map((path, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold bg-gray-150 text-gray-700">
                          {path}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 mt-4">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Recommendations</p>
                  <p className="text-xs text-gray-600 leading-relaxed mt-1 font-medium">
                    {rep.streamEvaluation?.recommendations}
                  </p>
                </div>
              </div>
            </div>

            {/* Career Trends & Market Shifts Widget */}
            {(() => {
              const trendsData = rep.careerTrends || getFallbackTrends(prof.stream, prof.careerInterests);
              const getFullNarrationText = () => {
                let text = `Market Outlook Summary: ${trendsData.marketOutlookSummary || ''} `;
                if (trendsData.emergingRoles && trendsData.emergingRoles.length > 0) {
                  text += `Current high growth trending roles include: ${trendsData.emergingRoles.join(', ')}. `;
                }
                if (trendsData.shifts && trendsData.shifts.length > 0) {
                  text += `Specific key industry transitions to watch out for: `;
                  trendsData.shifts.forEach((shift) => {
                    text += `For ${shift.title}, which has a ${shift.demandDirection} demand direction with a growth rate of ${shift.growthRate || ''}. Description: ${shift.description} Essential catalyst skills include: ${shift.keyEnablers ? shift.keyEnablers.join(', ') : 'not specified'}. `;
                  });
                }
                return text;
              };
              const fullNarrationText = getFullNarrationText();

              return (
                <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-3 gap-2">
                    <div>
                      <h3 className="text-xs font-extrabold text-gray-900 flex items-center">
                        <TrendingUp className="text-red-500 mr-2 shrink-0 animate-pulse" size={16} />
                        FUTURE CAREER TRENDS & INDUSTRY SHIFTS
                      </h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Dynamic market audit analyzing technology disruptors, job demand, and skills alignment for your profile.
                      </p>
                    </div>
                    <span className="self-start md:self-auto px-2.5 py-0.5 text-[8px] font-black bg-amber-50 text-amber-700 border border-amber-100 rounded-full uppercase tracking-widest animate-pulse">
                      Active AI Market Pulse
                    </span>
                  </div>

                  {/* Market Summary */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-slate-800 leading-relaxed font-medium">
                      {trendsData.marketOutlookSummary}
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSpeech(fullNarrationText)}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition active:scale-95 cursor-pointer shadow-xs border ${
                            isSpeaking && !isPaused
                              ? 'bg-red-500 text-white border-red-600 hover:bg-red-600'
                              : 'bg-white text-slate-700 border-gray-200 hover:bg-slate-50'
                          }`}
                        >
                          {isSpeaking && !isPaused ? (
                            <>
                              <Pause size={12} className="shrink-0" />
                              <span>Pause Narration</span>
                            </>
                          ) : (
                            <>
                              <Volume2 size={12} className="shrink-0 text-red-500" />
                              <span>{isSpeaking && isPaused ? 'Resume Summary' : 'Listen to Summary'}</span>
                            </>
                          )}
                        </button>

                        {isSpeaking && (
                          <button
                            onClick={handleStopSpeech}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold bg-slate-100 text-slate-600 hover:bg-slate-200 transition active:scale-95 cursor-pointer border border-slate-200"
                          >
                            <VolumeX size={12} className="shrink-0" />
                            <span>Stop</span>
                          </button>
                        )}
                      </div>

                      {/* Speed Controller & Equalizer Animation */}
                      <div className="flex items-center gap-3">
                        {isSpeaking && !isPaused && (
                          <div className="flex items-center gap-0.5 h-3 px-1.5">
                            <span className="w-0.5 bg-red-500 rounded-full animate-pulse h-2"></span>
                            <span className="w-0.5 bg-red-500 rounded-full animate-bounce h-3"></span>
                            <span className="w-0.5 bg-red-500 rounded-full animate-pulse h-1.5"></span>
                            <span className="w-0.5 bg-red-500 rounded-full animate-bounce h-2.5"></span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                          <span className="text-[9px] font-bold text-slate-400 px-1 uppercase tracking-wider">Speed:</span>
                          {[1.0, 1.25, 1.5].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => {
                                setSpeechRate(rate);
                                // If already speaking, restart with the new rate to apply changes immediately
                                if (isSpeaking) {
                                  if ('speechSynthesis' in window) {
                                    window.speechSynthesis.cancel();
                                  }
                                  const utterance = new SpeechSynthesisUtterance(fullNarrationText);
                                  utterance.rate = rate;
                                  const voices = window.speechSynthesis.getVoices();
                                  const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
                                  if (englishVoice) {
                                    utterance.voice = englishVoice;
                                  }
                                  utterance.onend = () => {
                                    setIsSpeaking(false);
                                    setIsPaused(false);
                                  };
                                  utterance.onerror = () => {
                                    setIsSpeaking(false);
                                    setIsPaused(false);
                                  };
                                  window.speechSynthesis.speak(utterance);
                                  setIsSpeaking(true);
                                  setIsPaused(false);
                                }
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition ${
                                speechRate === rate
                                  ? 'bg-slate-900 text-white'
                                  : 'text-slate-600 hover:bg-slate-55'
                              }`}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Emerging Roles */}
                  {trendsData.emergingRoles && trendsData.emergingRoles.length > 0 && (
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-2">High-Growth Emerging Roles to Watch</p>
                      <div className="flex flex-wrap gap-2">
                        {trendsData.emergingRoles.map((role, idx) => (
                          <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-100">
                            ★ {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Industry Shifts Grid */}
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-3">Key Industry Transitions & Catalyst Skills</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {trendsData.shifts?.map((shift, idx) => (
                        <div key={idx} className="border border-gray-150 rounded-xl p-3.5 hover:border-red-200 transition duration-150 bg-white flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="text-xs font-black text-slate-900 leading-snug">{shift.title}</h4>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                  shift.demandDirection === 'Surging' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                                  shift.demandDirection === 'Stable' ? 'bg-blue-50 text-blue-700 border border-blue-150' : 'bg-rose-50 text-rose-700 border border-rose-150'
                                }`}>
                                  {shift.demandDirection}
                                </span>
                                {shift.growthRate && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-slate-900 text-white font-mono">
                                    {shift.growthRate}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-gray-600 leading-relaxed mb-3 font-medium">
                              {shift.description}
                            </p>
                          </div>

                          <div className="border-t border-gray-100 pt-2.5 mt-2">
                            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Catalyst Skills & Enablers</span>
                            <div className="flex flex-wrap gap-1">
                              {shift.keyEnablers?.map((enabler, eIdx) => (
                                <span key={eIdx} className="inline-block px-2 py-0.5 bg-slate-50 border border-slate-150 text-slate-700 text-[9px] font-semibold rounded">
                                  {enabler}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Google News Real-time Search Feed */}
                  <div className="border-t border-gray-150 pt-4 mt-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Newspaper size={14} className="text-red-500" />
                        <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
                          Live Google News Hub
                        </h4>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-2.5">
                        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          <button
                            onClick={() => {
                              setShowBookmarksOnly(false);
                              setNewsFeedType('profile');
                            }}
                            className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition duration-150 cursor-pointer ${
                              !showBookmarksOnly && newsFeedType === 'profile'
                                ? 'bg-white text-slate-800 shadow-xs' 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Stream Focus
                          </button>
                          <button
                            onClick={() => {
                              setShowBookmarksOnly(false);
                              setNewsFeedType('global');
                            }}
                            className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition duration-150 cursor-pointer ${
                              !showBookmarksOnly && newsFeedType === 'global'
                                ? 'bg-white text-slate-800 shadow-xs' 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Education Worldwide
                          </button>
                          <button
                            onClick={() => setShowBookmarksOnly(true)}
                            className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition duration-150 cursor-pointer flex items-center gap-1 ${
                              showBookmarksOnly 
                                ? 'bg-white text-slate-800 shadow-xs' 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <Bookmark size={9} className={bookmarks.length > 0 ? "fill-amber-400 text-amber-500" : "text-slate-400"} />
                            Saved ({bookmarks.length})
                          </button>
                        </div>

                        {!showBookmarksOnly && (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-150 animate-pulse">
                              <Globe size={10} className="animate-spin text-red-500" /> {newsFeedType === 'global' ? 'Worldwide' : 'Stream'} Feed
                            </span>
                            
                            <button
                              onClick={async () => {
                                if (newsLoading) return;
                                setNewsLoading(true);
                                setNewsError(null);
                                try {
                                  const streamParam = encodeURIComponent(profile?.stream || '');
                                  const interestsParam = encodeURIComponent(profile?.careerInterests || '');
                                  const res = await fetch(`/api/stream-news?stream=${streamParam}&interests=${interestsParam}&type=${newsFeedType}`);
                                  if (!res.ok) throw new Error('Failed to fetch news feed');
                                  const data = await res.json();
                                  setNews(data);
                                } catch (err: any) {
                                  setNewsError(err?.message || 'Error refreshing news');
                                } finally {
                                  setNewsLoading(false);
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-slate-700 hover:bg-slate-50 border border-transparent hover:border-gray-200 rounded transition cursor-pointer"
                              title="Refresh Feed"
                              disabled={newsLoading}
                            >
                              <RefreshCw size={10} className={`${newsLoading ? 'animate-spin' : ''}`} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {showBookmarksOnly ? (
                      bookmarksLoading ? (
                        <div className="flex flex-col items-center justify-center py-6 space-y-2 bg-slate-50/50 border border-slate-100 rounded-xl">
                          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-[10px] font-bold text-slate-400 animate-pulse">Retrieving bookmarked headlines...</p>
                        </div>
                      ) : bookmarks && bookmarks.length > 0 ? (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                          {bookmarks.map((item, idx) => {
                            const bId = getSafeId(item.link);
                            const isBookmarked = true;
                            return (
                              <div
                                key={idx}
                                className="group block p-2.5 bg-slate-50/70 hover:bg-amber-50/20 border border-slate-100 hover:border-amber-150 rounded-xl transition duration-150 relative"
                              >
                                <div className="flex items-start justify-between gap-2.5">
                                  <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="inline-block px-1.5 py-0.5 bg-white border border-slate-150 text-slate-500 text-[8px] font-black uppercase rounded tracking-wider">
                                        {item.source}
                                      </span>
                                      {item.pubDate && (
                                        <span className="text-[8px] text-gray-400 font-bold">
                                          {new Date(item.pubDate).toLocaleDateString(undefined, { 
                                            month: 'short', 
                                            day: 'numeric'
                                          })}
                                        </span>
                                      )}
                                      {item.savedAt && (
                                        <span className="text-[8px] text-amber-500 font-bold bg-amber-50 px-1 rounded">
                                          Saved {new Date(item.savedAt).toLocaleDateString(undefined, { 
                                            month: 'short', 
                                            day: 'numeric'
                                          })}
                                        </span>
                                      )}
                                    </div>
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      referrerPolicy="no-referrer"
                                      rel="noopener noreferrer"
                                      className="block"
                                    >
                                      <h5 className="text-[11px] font-bold text-slate-800 leading-snug group-hover:text-amber-700 transition">
                                        {item.title}
                                      </h5>
                                    </a>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0 self-start mt-0.5">
                                    <button
                                      onClick={(e) => handleToggleBookmark(e, item)}
                                      className="p-1 hover:bg-white rounded border border-transparent hover:border-gray-200 text-amber-500 hover:text-red-500 transition cursor-pointer"
                                      title="Remove Bookmark"
                                    >
                                      <Bookmark size={12} className="fill-amber-400 text-amber-500 hover:fill-none hover:text-red-500" />
                                    </button>
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      referrerPolicy="no-referrer"
                                      rel="noopener noreferrer"
                                      className="p-1 hover:bg-white rounded border border-transparent hover:border-gray-200 text-gray-300 hover:text-amber-600 transition"
                                      title="Open Article"
                                    >
                                      <ExternalLink size={10} className="text-gray-300 group-hover:text-amber-600 transition" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-5 text-center bg-slate-50/50 border border-slate-100 rounded-xl space-y-1">
                          <Bookmark size={16} className="text-gray-300 mx-auto" />
                          <p className="text-[10px] font-bold text-gray-400">No bookmarked articles yet.</p>
                          <p className="text-[9px] text-gray-400">Save important headlines from the Live Feed to reference later on your profile.</p>
                        </div>
                      )
                    ) : (
                      /* Live Feed */
                      newsLoading ? (
                        <div className="flex flex-col items-center justify-center py-6 space-y-2 bg-slate-50/50 border border-slate-100 rounded-xl">
                          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-[10px] font-bold text-slate-400 animate-pulse">Retrieving industry headlines...</p>
                        </div>
                      ) : newsError ? (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-center">
                          <p className="text-[10px] font-semibold text-red-600">{newsError}</p>
                        </div>
                      ) : news && news.length > 0 ? (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                          {news.map((item, idx) => {
                            const bId = getSafeId(item.link);
                            const isBookmarked = bookmarks.some(b => b.id === bId);
                            return (
                              <div
                                key={idx}
                                className="group block p-2.5 bg-slate-50/70 hover:bg-red-50/40 border border-slate-100 hover:border-red-150 rounded-xl transition duration-150 relative"
                              >
                                <div className="flex items-start justify-between gap-2.5">
                                  <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="inline-block px-1.5 py-0.5 bg-white border border-slate-150 text-slate-500 text-[8px] font-black uppercase rounded tracking-wider">
                                        {item.source}
                                      </span>
                                      {item.pubDate && (
                                        <span className="text-[8px] text-gray-400 font-bold">
                                          {new Date(item.pubDate).toLocaleDateString(undefined, { 
                                            month: 'short', 
                                            day: 'numeric'
                                          })}
                                        </span>
                                      )}
                                    </div>
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      referrerPolicy="no-referrer"
                                      rel="noopener noreferrer"
                                      className="block"
                                    >
                                      <h5 className="text-[11px] font-bold text-slate-800 leading-snug group-hover:text-red-700 transition">
                                        {item.title}
                                      </h5>
                                    </a>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0 self-start mt-0.5">
                                    <button
                                      onClick={(e) => handleToggleBookmark(e, item)}
                                      className="p-1 hover:bg-white rounded border border-transparent hover:border-gray-200 text-gray-400 hover:text-amber-500 transition cursor-pointer"
                                      title={isBookmarked ? "Remove Bookmark" : "Bookmark Article"}
                                    >
                                      <Bookmark size={12} className={isBookmarked ? "fill-amber-400 text-amber-500" : "text-gray-400"} />
                                    </button>
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      referrerPolicy="no-referrer"
                                      rel="noopener noreferrer"
                                      className="p-1 hover:bg-white rounded border border-transparent hover:border-gray-200 text-gray-300 hover:text-red-500 transition"
                                      title="Open Article"
                                    >
                                      <ExternalLink size={10} className="text-gray-300 group-hover:text-red-500 transition shrink-0" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 text-center bg-slate-50/50 border border-slate-100 rounded-xl">
                          <p className="text-[10px] font-semibold text-gray-400">No headlines available at this moment.</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })()}

            {side !== 'right' && (
              <WhatIfSimulator
                currentMarks={prof.class12Marks}
                currentBudget={prof.budget}
                currentStream={prof.stream}
                onSimulate={onSimulate}
                isSimulating={isSimulating}
              />
            )}
          </div>
        );

      case 'colleges':
        return (
          <div className="space-y-6">
            <div className="border-l-4 border-red-500 pl-3">
              <h3 className="text-sm font-extrabold text-gray-900">COLLEGE MATRIX & STRATEGIES</h3>
              <p className="text-[10px] text-gray-500">Tiered university matching matrix categorized for profile validation.</p>
            </div>

            {/* Colleges Grid */}
            <div className={`grid ${isFull ? 'md:grid-cols-3' : 'grid-cols-1'} gap-6`}>
              {['Dream', 'Target', 'Safe'].map((tier) => {
                const tierColleges = rep.colleges?.filter(c => c.tier === tier) || [];
                return (
                  <div key={tier} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs space-y-3">
                    <span className={`px-2.5 py-0.5 text-[8px] font-black rounded uppercase tracking-wider inline-block border ${tier === 'Dream' ? 'bg-purple-50 text-purple-700 border-purple-150' : tier === 'Target' ? 'bg-amber-50 text-amber-700 border-amber-150' : 'bg-green-50 text-green-700 border-green-150'}`}>
                      {tier} colleges ({tierColleges.length})
                    </span>

                    <div className="space-y-3 divide-y divide-gray-100">
                      {tierColleges.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-2">No recommended colleges in this tier.</p>
                      ) : (
                        tierColleges.map((col, idx) => {
                          const chance = rep.admissionChances?.find(ac => ac.collegeName === col.name);
                          return (
                            <div key={idx} className="pt-3 first:pt-0">
                              <h5 className="text-xs font-extrabold text-gray-900 leading-snug">{col.name}</h5>
                              <p className="text-[10px] font-semibold text-red-600 mt-0.5">{col.course}</p>
                              <p className="text-[9px] text-gray-400">{col.location}</p>
                              
                              <div className="mt-2 grid grid-cols-2 gap-2 text-[9px]">
                                <div>
                                  <span className="text-gray-400 block uppercase tracking-wider text-[7px] font-bold">Fees</span>
                                  <span className="font-bold text-gray-700">{col.fees}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block uppercase tracking-wider text-[7px] font-bold">Avg. Pkg</span>
                                  <span className="font-bold text-slate-800">{col.averagePackage}</span>
                                </div>
                              </div>

                              <div className="mt-2 bg-slate-50 border border-gray-100 rounded p-2">
                                <div className="flex items-center justify-between text-[9px]">
                                  <span className="font-bold text-slate-600">Admission Probability:</span>
                                  <span className={`font-black ${tier === 'Dream' ? 'text-purple-600' : tier === 'Target' ? 'text-amber-600' : 'text-green-600'}`}>
                                    {chance?.probability || '75%+'}
                                  </span>
                                </div>
                                <p className="text-[9px] text-gray-500 mt-0.5 leading-relaxed font-medium">
                                  {chance?.reasoning}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ROI and Compensation Bar Chart */}
            {rep.colleges && rep.colleges.length > 0 && (
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold text-gray-900 flex items-center">
                      <TrendingUp className="text-red-500 mr-2 shrink-0" size={16} />
                      COLLEGE ROI & COMPENSATION METRICS
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Comparing the annual academic investment (fees) against the average placement compensation (LPA) for matched campuses.
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0 px-2.5 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded-lg border border-red-100 uppercase tracking-wider self-start md:self-auto">
                    Values in Lakhs (INR)
                  </div>
                </div>

                <div className="h-[280px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(rep.colleges || []).map(col => {
                        let feesVal = 0;
                        if (col.fees) {
                          const cleanFees = col.fees.toLowerCase().replace(/,/g, '').trim();
                          const match = cleanFees.match(/([\d.]+)/);
                          if (match) {
                            feesVal = parseFloat(match[1]);
                            if (cleanFees.includes('crore') || cleanFees.includes('cr')) {
                              feesVal = feesVal * 100;
                            } else if (!cleanFees.includes('lakh') && !cleanFees.includes('l') && !cleanFees.includes('lac') && !cleanFees.includes('lpa') && feesVal > 1000) {
                              feesVal = feesVal / 100000;
                            }
                          }
                        }

                        let pkgVal = 0;
                        if (col.averagePackage) {
                          const cleanPkg = col.averagePackage.toLowerCase().replace(/,/g, '').trim();
                          const match = cleanPkg.match(/([\d.]+)/);
                          if (match) {
                            pkgVal = parseFloat(match[1]);
                            if (!cleanPkg.includes('lakh') && !cleanPkg.includes('l') && !cleanPkg.includes('lac') && !cleanPkg.includes('lpa') && pkgVal > 1000) {
                              pkgVal = pkgVal / 100000;
                            }
                          }
                        }

                        return {
                          name: col.name,
                          'Annual Fees': parseFloat(feesVal.toFixed(2)),
                          'Average Package': parseFloat(pkgVal.toFixed(2)),
                          tier: col.tier
                        };
                      })}
                      margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                        stroke="#cbd5e1"
                        tickLine={false}
                      />
                      <YAxis 
                        tickFormatter={(value) => `₹${value}L`}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                        stroke="#cbd5e1"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => [`₹${value} Lakhs / year`, name]}
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderRadius: '12px', 
                          border: 'none',
                          color: '#fff',
                          fontSize: '11px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        labelStyle={{ fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px' }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={36} 
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: '#334155' }}
                      />
                      <Bar 
                        dataKey="Annual Fees" 
                        fill="#94a3b8" 
                        name="Annual Fees (Lakhs/yr)" 
                        radius={[4, 4, 0, 0]} 
                      />
                      <Bar 
                        dataKey="Average Package" 
                        fill="#dc2626" 
                        name="Average Package (LPA)" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-600 leading-relaxed font-medium">
                  <p>
                    <strong>ROI Audit Breakdown:</strong> A healthy ROI is marked by an <strong>Average Package</strong> that substantially exceeds the <strong>Annual Fees</strong>. 
                    Dream-tier institutions (such as top-rank IITs or BITS) showcase exceptional compensation structures with near-instant payback matrices, 
                    while Target-tier options maintain balanced trajectories appropriate for regional placement leverage.
                  </p>
                </div>
              </div>
            )}

            {/* Scholarship Engine */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-extrabold text-gray-900 mb-4 flex items-center">
                <Award className="text-red-500 mr-2 shrink-0" size={16} />
                SCHOLARSHIP INTELLIGENCE
              </h3>
              
              <div className={`grid ${isFull ? 'md:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                {rep.scholarships?.map((sch, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <span className="px-2 py-0.5 text-[8px] font-bold bg-red-100 text-red-700 rounded border border-red-200 uppercase tracking-wider inline-block mb-2">
                        {sch.type}
                      </span>
                      <h4 className="text-xs font-bold text-gray-900 leading-tight">{sch.name}</h4>
                      <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                        <strong>Eligibility:</strong> {sch.eligibility}
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-150 flex items-center justify-between text-[10px]">
                      <span className="font-bold text-gray-600">Potential Funding:</span>
                      <span className="font-black text-green-600">{sch.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Study Abroad Mode */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10">
                <PlaneTakeoff size={120} />
              </div>
              <div className="relative z-10 grid grid-cols-1 gap-4 items-center">
                <div>
                  <span className="px-2 py-0.5 rounded text-[8px] font-extrabold bg-amber-500/10 text-amber-400 uppercase tracking-widest border border-amber-500/20">
                    GLOBAL PATHWAYS ADVISOR
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-2">Study Abroad Match</h3>
                  <p className="text-[11px] text-gray-300 mt-1 leading-relaxed font-medium">
                    {rep.studyAbroad?.guidance}
                  </p>
                  
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {rep.studyAbroad?.countries?.map((country, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-[9px] font-bold bg-slate-800 border border-slate-700 rounded text-amber-400">
                        {country}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 mt-2">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Recommended Universities</p>
                  {rep.studyAbroad?.universities?.map((univ, idx) => (
                    <div key={idx} className="border-b border-slate-800 last:border-0 pb-1.5 last:pb-0">
                      <p className="text-xs font-bold text-white">{univ.name}</p>
                      <div className="flex justify-between items-center text-[9px] text-gray-400 mt-0.5">
                        <span>Cost: {univ.cost}</span>
                        <span className="text-amber-400 font-bold">{univ.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Side-by-Side College Comparator Tool */}
            <CollegeComparator availableColleges={rep.colleges || []} />
          </div>
        );

      case 'career': {
        const parseSalaryToLpa = (salaryStr: string): number => {
          if (!salaryStr) return 6.0;
          const str = salaryStr.toLowerCase().replace(/,/g, '');
          const matches = str.match(/[\d.]+/g);
          if (!matches || matches.length === 0) return 6.0;
          let val = parseFloat(matches[0]);
          if (str.includes('lpa') || str.includes('lakh') || str.includes('lac') || val < 100) {
            return val;
          }
          if (val >= 1000) {
            return val / 100000;
          }
          return val;
        };

        const parseSingleAmount = (text: string): number => {
          if (!text) return 0;
          let s = text.toLowerCase().replace(/,/g, '').trim();
          s = s.replace(/\([^)]*\)/g, ''); // remove parenthesized content
          const matches = s.match(/[\d.]+/g);
          if (!matches || matches.length === 0) return 0;
          let val1 = parseFloat(matches[0]);
          if (s.includes('-') || s.includes('to')) {
            const val2 = matches.length > 1 ? parseFloat(matches[1]) : val1;
            val1 = (val1 + val2) / 2;
          }
          if (s.includes('lakh') || s.includes('l') || s.includes('lac') || s.includes('lpa')) {
            return val1;
          }
          if (val1 >= 1000) {
            return val1 / 100000;
          }
          return val1;
        };

        const salaryTrendData = [
          { name: 'Year 1' },
          { name: 'Year 2' },
          { name: 'Year 3' },
          { name: 'Year 4' },
          { name: 'Year 5' },
        ] as any[];

        const careersList = rep.careerDNA || [];
        const lineColors = ['#dc2626', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

        if (careersList.length === 0) {
          const entryVal = parseSalaryToLpa(rep.placementOutlook?.entrySalary || "6.0");
          const midVal = parseSalaryToLpa(rep.placementOutlook?.midCareerSalary || "15.0");
          const fallbackTitle = "Ecosystem Benchmark";
          const cagr = Math.pow(midVal / entryVal, 1 / 4) - 1 || 0.15;
          
          salaryTrendData[0][fallbackTitle] = parseFloat(entryVal.toFixed(1));
          salaryTrendData[1][fallbackTitle] = parseFloat((entryVal * (1 + cagr)).toFixed(1));
          salaryTrendData[2][fallbackTitle] = parseFloat((entryVal * Math.pow(1 + cagr, 2)).toFixed(1));
          salaryTrendData[3][fallbackTitle] = parseFloat((entryVal * Math.pow(1 + cagr, 3)).toFixed(1));
          salaryTrendData[4][fallbackTitle] = parseFloat((entryVal * Math.pow(1 + cagr, 4)).toFixed(1));
        } else {
          careersList.forEach((career) => {
            const startSalary = parseSalaryToLpa(career.salaryOutlook);
            let growthRate = 0.12;
            const growthLower = career.growthPotential?.toLowerCase() || '';
            const demandLower = career.futureDemand?.toLowerCase() || '';
            
            if (growthLower.includes('high') || demandLower.includes('high') || demandLower.includes('exponential')) {
              growthRate = 0.16;
            } else if (growthLower.includes('low') || demandLower.includes('low')) {
              growthRate = 0.08;
            }
            
            salaryTrendData[0][career.title] = parseFloat(startSalary.toFixed(1));
            salaryTrendData[1][career.title] = parseFloat((startSalary * Math.pow(1 + growthRate, 1)).toFixed(1));
            salaryTrendData[2][career.title] = parseFloat((startSalary * Math.pow(1 + growthRate, 2)).toFixed(1));
            salaryTrendData[3][career.title] = parseFloat((startSalary * Math.pow(1 + growthRate, 3)).toFixed(1));
            salaryTrendData[4][career.title] = parseFloat((startSalary * Math.pow(1 + growthRate, 4)).toFixed(1));
          });
        }

        return (
          <div className="space-y-6">
            <div className="border-l-4 border-red-500 pl-3">
              <h3 className="text-sm font-extrabold text-gray-900">CAREER PATHWAYS & PLACEMENTS</h3>
              <p className="text-[10px] text-gray-500">Predictive assessments analyzing vocational demand, compensation ratios, and automation threats.</p>
            </div>

            {/* Adaptive Wellness Modulation Notice */}
            {prof.wellnessStats?.adaptiveRoadmapRecommendation && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3.5 shadow-xs">
                <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
                  <Heart size={18} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                      Mental Wellness & Stamina Modulation
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      {prof.wellnessStats.dominantMood} • {prof.wellnessStats.avgFocusHours}h/day avg
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                    {prof.wellnessStats.adaptiveRoadmapRecommendation}
                  </p>
                </div>
              </div>
            )}

            {/* Careers Grid */}
            <div className={`grid ${isFull ? 'md:grid-cols-3' : 'grid-cols-1'} gap-6`}>
              {careersList.map((career, idx) => (
                <div key={idx} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 text-[8px] font-bold bg-red-50 text-red-700 rounded border border-red-100 uppercase tracking-wider">
                        Demand: {career.futureDemand}
                      </span>
                      <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded uppercase ${career.aiRisk.includes('Low') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        AI Risk: {career.aiRisk}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-gray-900 leading-tight">{career.title}</h4>
                    <p className="text-[10px] text-red-600 mt-0.5 font-bold">{career.degreePath}</p>
                    
                    <div className="mt-3">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {career.requiredSkills?.map((sk, sIdx) => (
                          <span key={sIdx} className="inline-block px-1.5 py-0.5 text-[8px] font-semibold bg-gray-50 text-gray-600 border border-gray-200 rounded">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-[10px]">
                    <span className="font-bold text-gray-500">Salary Outlook:</span>
                    <span className="font-black text-slate-800">{career.salaryOutlook}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* ROI Analyzer & Placement Outlook */}
            <div className={`grid ${isFull ? 'md:grid-cols-2' : 'grid-cols-1'} gap-6`}>
              {/* ROI Math */}
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs">
                <h3 className="text-xs font-extrabold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="text-red-500 mr-1 shrink-0" size={16} />
                  ROI ASSESSMENT SUMMARY
                </h3>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-slate-50 border border-gray-150 rounded-lg p-2.5 text-center">
                    <span className="text-[8px] text-gray-400 font-bold uppercase block">Total Cost</span>
                    <span className="text-[11px] font-black text-red-600 block mt-0.5">{rep.roiAnalyzer?.totalInvestment}</span>
                  </div>
                  <div className="bg-slate-50 border border-gray-150 rounded-lg p-2.5 text-center">
                    <span className="text-[8px] text-gray-400 font-bold uppercase block">Starting</span>
                    <span className="text-[11px] font-black text-slate-800 block mt-0.5">{rep.roiAnalyzer?.expectedAnnualSalary}</span>
                  </div>
                  <div className="bg-slate-50 border border-gray-150 rounded-lg p-2.5 text-center">
                    <span className="text-[8px] text-gray-400 font-bold uppercase block">Payback</span>
                    <span className="text-[11px] font-black text-green-600 block mt-0.5">{rep.roiAnalyzer?.paybackPeriodMonths}</span>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-green-700">Classification:</span>
                    <span className="font-black text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded uppercase text-[9px]">
                      {rep.roiAnalyzer?.rating}
                    </span>
                  </div>
                  <p className="text-[10px] text-green-600 leading-relaxed mt-1.5 font-medium">
                    {rep.roiAnalyzer?.breakdown}
                  </p>
                </div>
              </div>

              {/* Placement Outlook */}
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900 mb-3 flex items-center">
                    <Briefcase className="text-red-500 mr-2 shrink-0" size={16} />
                    PLACEMENT ECOLOGY OUTLOOK
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Industry Ecosystem</p>
                      <p className="text-xs text-gray-700 mt-0.5 leading-relaxed font-medium">{rep.placementOutlook?.industryEcosystem}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Entry Level</p>
                        <p className="font-bold text-gray-850">{rep.placementOutlook?.entrySalary}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Mid-Career</p>
                        <p className="font-bold text-gray-850">{rep.placementOutlook?.midCareerSalary}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 mt-4">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Major Hiring Sectors</p>
                  <div className="flex flex-wrap gap-1">
                    {rep.placementOutlook?.majorHiringSectors?.map((sector, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 text-[8px] font-bold bg-red-50 text-red-700 rounded border border-red-100">
                        {sector}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ROI and Compensation Bar Chart */}
            {rep.roiAnalyzer && (
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold text-gray-900 flex items-center">
                      <TrendingUp className="text-red-500 mr-2 shrink-0" size={16} />
                      ROI & COMPENSATIONAL MILESTONES BAR CHART
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Comparing the total academic investment with dynamic entry and mid-career compensation thresholds.
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0 px-2.5 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded-lg border border-red-100 uppercase tracking-wider self-start md:self-auto">
                    Values in Lakhs (INR)
                  </div>
                </div>

                <div className="h-[280px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          metric: 'Total Academic Cost',
                          'Value (Lakhs)': parseFloat(parseSingleAmount(rep.roiAnalyzer?.totalInvestment).toFixed(1)),
                        },
                        {
                          metric: 'Expected Starting Salary',
                          'Value (Lakhs)': parseFloat(parseSingleAmount(rep.roiAnalyzer?.expectedAnnualSalary).toFixed(1)),
                        },
                        {
                          metric: 'Industry Entry Average',
                          'Value (Lakhs)': parseFloat(parseSingleAmount(rep.placementOutlook?.entrySalary).toFixed(1)),
                        },
                        {
                          metric: 'Mid-Career Average',
                          'Value (Lakhs)': parseFloat(parseSingleAmount(rep.placementOutlook?.midCareerSalary).toFixed(1)),
                        }
                      ]}
                      margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis 
                        dataKey="metric" 
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                        stroke="#cbd5e1"
                        tickLine={false}
                      />
                      <YAxis 
                        tickFormatter={(value) => `₹${value}L`}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                        stroke="#cbd5e1"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        formatter={(value: any) => [`₹${value} Lakhs`, 'Amount']}
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderRadius: '12px', 
                          border: 'none',
                          color: '#fff',
                          fontSize: '11px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        labelStyle={{ fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px' }}
                      />
                      <Bar 
                        dataKey="Value (Lakhs)" 
                        radius={[6, 6, 0, 0]}
                        maxBarSize={60}
                      >
                        {[
                          { fill: '#94a3b8' }, // Total Cost color
                          { fill: '#f59e0b' }, // Starting Salary color
                          { fill: '#3b82f6' }, // Entry Avg color
                          { fill: '#dc2626' }  // Mid-Career color
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-600 leading-relaxed font-medium">
                  <p>
                    <strong>Financial Leverage Matrix:</strong> Your total program cost of <strong>₹{rep.roiAnalyzer?.totalInvestment}</strong> is paired against an expected starting salary of <strong>₹{rep.roiAnalyzer?.expectedAnnualSalary}</strong>. 
                    This equates to an outstanding payback period of <strong>{rep.roiAnalyzer?.paybackPeriodMonths}</strong>. Over a 5-to-10 year horizon, mid-career earnings scale significantly to an average of <strong>{rep.placementOutlook?.midCareerSalary}</strong>, indicating highly favorable career equity.
                  </p>
                </div>
              </div>
            )}

            {/* Projected Salary Growth Line Graph */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900 flex items-center">
                    <TrendingUp className="text-red-500 mr-2 shrink-0" size={16} />
                    PROJECTED SALARY GROWTH TRENDS (5-YEAR OUTLOOK)
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Compounded salary trajectories modeled based on entry-level potential and forecasted industry demand.
                  </p>
                </div>
                <div className="mt-2 md:mt-0 px-2.5 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded-lg border border-red-100 uppercase tracking-wider self-start md:self-auto">
                  Values in LPA (Lakhs Per Annum)
                </div>
              </div>

              <div className="h-[320px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={salaryTrendData}
                    margin={{ top: 10, right: 30, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                      stroke="#cbd5e1"
                      tickLine={false}
                    />
                    <YAxis 
                      tickFormatter={(value) => `₹${value}L`}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                      stroke="#cbd5e1"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => [`₹${value} Lakhs / year`, name]}
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderRadius: '12px', 
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      labelStyle={{ fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}
                    />
                    {(careersList.length === 0 ? [{ title: "Ecosystem Benchmark" }] : careersList).map((career, idx) => (
                      <Line
                        key={career.title}
                        type="monotone"
                        dataKey={career.title}
                        stroke={lineColors[idx % lineColors.length]}
                        activeDot={{ r: 6 }}
                        strokeWidth={2.5}
                        dot={{ r: 4, strokeWidth: 1 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-600 leading-relaxed font-medium">
                <p>
                  <strong>How to read this chart:</strong> This projection showcases the financial compound potential for each recommended role. 
                  High demand pathways (e.g., AI/Machine Learning, Cloud Architecture) are compounded at a standard <strong>16% CAGR</strong>, 
                  while stable and conventional paths are calculated with a healthy <strong>12% CAGR</strong>, matching real-world career acceleration matrices.
                </p>
              </div>
            </div>
          </div>
        );
      }

      case 'skills':
        return (
          <div className="space-y-6">
            <div className="border-l-4 border-red-500 pl-3">
              <h3 className="text-sm font-extrabold text-gray-900">SKILL MATRIX & SUCCESS ROADMAP</h3>
              <p className="text-[10px] text-gray-500">Interactive tracker detailing certifications, online syllabus alignments, and milestone milestones.</p>
            </div>

            {/* Adaptive Wellness Roadmap Notice */}
            {prof.wellnessStats?.adaptiveRoadmapRecommendation && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3.5 shadow-xs">
                <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
                  <Heart size={18} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                      Stamina & Cognitive Capacity Guidance
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      {prof.wellnessStats.dominantMood} • {prof.wellnessStats.avgFocusHours}h/day avg
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                    {prof.wellnessStats.adaptiveRoadmapRecommendation}
                  </p>
                </div>
              </div>
            )}

            <div className={`grid ${isFull ? 'md:grid-cols-3' : 'grid-cols-1'} gap-6`}>
              {/* Identified Gaps */}
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs">
                <span className="px-2 py-0.5 text-[8px] font-bold bg-red-100 text-red-700 rounded uppercase tracking-wider">
                  Syllabus Gap
                </span>
                <h4 className="text-xs font-black text-gray-900 mt-2 mb-3">Identified Missing Skills</h4>
                
                <div className="space-y-1.5">
                  {rep.skillGapAnalysis?.identifiedGaps?.map((gap) => {
                    const isDone = completedSkills.includes(gap);
                    return (
                      <button
                        key={gap}
                        onClick={() => toggleSkill(gap)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition ${isDone ? 'bg-green-50/70 border-green-200 text-green-850 font-semibold' : 'bg-slate-50 border-gray-200 text-gray-700 hover:border-red-300'}`}
                      >
                        <span className="text-[11px] font-semibold">{gap}</span>
                        <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 ${isDone ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300'}`}>
                          {isDone && <span className="text-[8px] font-black">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recommended Courses */}
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs space-y-3">
                <span className="px-2 py-0.5 text-[8px] font-bold bg-amber-100 text-amber-700 rounded uppercase tracking-wider">
                  Certifications
                </span>
                
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Recommended Certificates</h4>
                  <ul className="space-y-1">
                    {rep.skillGapAnalysis?.certifications?.map((cert, idx) => (
                      <li key={idx} className="text-[11px] font-semibold text-gray-700 flex items-start leading-tight">
                        <span className="text-amber-500 mr-1.5">•</span>
                        {cert}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Curated Learning paths</h4>
                  <ul className="space-y-1">
                    {rep.skillGapAnalysis?.recommendedCourses?.map((course, idx) => (
                      <li key={idx} className="text-[11px] text-gray-600 flex items-start leading-tight">
                        <span className="text-blue-500 mr-1.5">•</span>
                        {course}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Projects */}
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[8px] font-bold bg-green-100 text-green-700 rounded uppercase tracking-wider">
                    Recommended Projects
                  </span>
                  <h4 className="text-xs font-black text-gray-900 mt-2 mb-3">Portfolio Projects to Build</h4>
                  <ul className="space-y-2">
                    {rep.skillGapAnalysis?.targetProjects?.map((proj, idx) => (
                      <li key={idx} className="bg-slate-50 border border-gray-100 rounded-lg p-2.5 text-[11px] text-gray-700 font-semibold leading-relaxed">
                        {proj}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Success Timeline Roadmap */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-extrabold text-gray-900 mb-4 flex items-center">
                <Milestone className="text-red-500 mr-2 shrink-0" size={16} />
                YEAR-BY-YEAR COLLEGE SUCCESS ROADMAP
              </h3>

              <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {rep.successRoadmap?.map((step, idx) => (
                  <div key={idx} className="relative pl-6 flex flex-col md:flex-row md:items-start md:space-x-4">
                    <div className="absolute left-1 top-1.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-4 ring-red-50"></div>
                    
                    <div className="md:w-1/4">
                      <span className="text-sm font-black text-gray-900 block">{step.year}</span>
                      <span className="text-[10px] font-bold text-red-600 mt-0.5 block leading-tight">{step.focus}</span>
                    </div>

                    <div className="md:w-3/4 mt-1.5 md:mt-0 space-y-2">
                      <div>
                        <div className="flex flex-wrap gap-1">
                          {step.skills?.map((sk, skIdx) => (
                            <span key={skIdx} className="px-1.5 py-0.5 text-[9px] font-semibold bg-gray-50 text-gray-600 border border-gray-200 rounded">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ul className="space-y-1 text-[11px] text-gray-600">
                        {step.milestones?.map((mil, milIdx) => (
                          <li key={milIdx} className="flex items-start">
                            <span className="text-red-500 mr-1.5 font-bold">✓</span>
                            {mil}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'parent':
        return (
          <div className="space-y-6">
            <div className="border-l-4 border-red-500 pl-3">
              <h3 className="text-sm font-extrabold text-gray-900">PARENTAL GUARDRAILS DASHBOARD</h3>
              <p className="text-[10px] text-gray-500">Security audits, Hostel norms, and locational summaries tailored for parents.</p>
            </div>

            <div className={`grid ${isFull ? 'md:grid-cols-3' : 'grid-cols-1'} gap-6`}>
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs md:col-span-2 space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center">
                    <Shield className="text-red-500 mr-1.5 shrink-0" size={12} />
                    Campus Safety & Protection Services
                  </h4>
                  <p className="text-xs font-semibold text-gray-800 leading-relaxed mt-1 font-medium">
                    {rep.parentSummary?.safetyDetails}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center">
                    <Heart className="text-red-500 mr-1.5 shrink-0" size={12} />
                    Hostel Safety & Strict Guidelines
                  </h4>
                  <p className="text-xs font-semibold text-gray-800 leading-relaxed mt-1 font-medium">
                    {rep.parentSummary?.hostelSafety}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center">
                    <TrendingUp className="text-red-500 mr-1.5 shrink-0" size={12} />
                    ROI & Job Placement Safety Check
                  </h4>
                  <p className="text-xs font-semibold text-gray-800 leading-relaxed mt-1 font-medium">
                    {rep.parentSummary?.careerROI}
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[8px] font-bold bg-amber-500/10 text-amber-400 rounded uppercase tracking-wider border border-amber-500/20">
                    Decision Summary
                  </span>
                  
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Estimated Outgo (Fees)</p>
                      <p className="text-xs text-gray-200 mt-1 font-semibold leading-normal">
                        {rep.parentSummary?.totalFees}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Placement Outlook</p>
                      <p className="text-xs text-gray-200 mt-1 font-semibold leading-normal">
                        {rep.parentSummary?.placementGuarantee}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-800 pt-3 text-center">
                  <p className="text-[10px] text-slate-400 font-medium">
                    Verified for regional guidelines.
                  </p>
                </div>
              </div>
            </div>

            {/* Geographical Living Info */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-extrabold text-gray-900 mb-3 flex items-center">
                <Map className="text-red-500 mr-2 shrink-0" size={16} />
                MAPS & LOCATION INTELLIGENCE (SANDBOX)
              </h3>
              
              <div className={`grid ${isFull ? 'md:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                <div className="bg-slate-50 border border-gray-100 rounded-xl p-3.5 space-y-2">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Distance & Connectivity</p>
                  <p className="text-xs font-bold text-gray-800">{rep.locationIntelligence?.distanceKm}</p>
                  <p className="text-[9px] text-gray-500 leading-relaxed font-medium">
                    <strong>Transit links:</strong> {rep.locationIntelligence?.nearestTransport}
                  </p>
                </div>

                <div className="bg-slate-50 border border-gray-100 rounded-xl p-3.5 space-y-2">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Monthly Living Cost</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[8px] text-gray-400 uppercase block">Rent</span>
                      <span className="font-bold text-gray-700">{rep.costOfLiving?.monthlyRent}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-gray-400 uppercase block">Food</span>
                      <span className="font-bold text-gray-700">{rep.costOfLiving?.monthlyFood}</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-gray-500 pt-1.5 border-t border-gray-150 font-medium">
                    <strong>Annual Outlay:</strong> {rep.costOfLiving?.annualTotal}
                  </p>
                </div>

                <div className="bg-slate-50 border border-gray-100 rounded-xl p-3.5 flex flex-col justify-between">
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Hostels & PG Hubs</p>
                    <p className="text-[11px] text-gray-700 leading-relaxed mt-1 font-medium">{rep.locationIntelligence?.pgAndHostels}</p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-gray-150 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-gray-500">Transit Score:</span>
                    <span className="text-red-600">{rep.locationIntelligence?.connectionScore}/100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'tools':
        return (
          <div className="space-y-6">
            {side === 'right' ? (
              <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-8 text-center text-amber-950 font-semibold text-xs leading-relaxed max-w-sm mx-auto">
                <Swords size={24} className="mx-auto text-amber-500 mb-2 animate-pulse" />
                Comparison tools are active on the primary panel. Select any standard module above (Overview, Colleges, Career, Skills, Parents) to view and compare historical data side-by-side.
              </div>
            ) : (
              <div className="space-y-8">
                {/* College Battle Mode */}
                <CollegeBattle availableColleges={rep.colleges} />

                {/* Profile & Resume Builder */}
                <ProfileBuilder
                  studentName={prof.name}
                  studentStream={prof.stream}
                  interests={prof.careerInterests}
                  achievements={prof.achievements}
                  resumeHighlights={prof.resumeText}
                />

                {/* AI Mock Interview Coach */}
                <InterviewCoach profile={prof} />
              </div>
            )}
          </div>
        );

      case 'goals':
        return (
          <AcademicGoalSetter
            profile={prof}
            userId={side === 'right' ? '' : (userId || '')}
            successRoadmap={rep.successRoadmap || []}
            onSave={(updated) => onProfileUpdate && onProfileUpdate(updated)}
          />
        );

      case 'wellness':
        return (
          <div className="space-y-6">
            <DailyWellnessCheckin
              userId={side === 'right' ? '' : (userId || '')}
              studentProfile={prof}
              onCheckinSaved={(updated) => onProfileUpdate && onProfileUpdate(updated)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const activeSavedReport = savedReports?.find(r => r.id === activeReportId);
  const rootReportId = activeSavedReport?.parentReportId || activeReportId;
  const groupReports = savedReports?.filter(r => r.id === rootReportId || r.parentReportId === rootReportId) || [];
  const sortedGroupReports = [...groupReports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Top action header for Blueprint */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-gray-150">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-red-600 font-extrabold uppercase tracking-widest bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
              Educational Intelligence Hub
            </span>
            {profile.aadhaarData?.verified ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200" title={`Aadhaar Ref: ${profile.aadhaarData.verificationId}`}>
                <ShieldCheck size={12} className="mr-1 text-green-600" />
                UIDAI Verified ({profile.aadhaarData.maskedNumber})
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle size={12} className="mr-1 text-amber-500" />
                Aadhaar Unverified
              </span>
            )}
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-2.5 flex items-center gap-2">
            <span className="w-2.5 h-5 bg-red-600 rounded-full inline-block"></span>
            Your AI Intelligence Blueprint
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {savedReports && savedReports.length > 0 && (
            <button
              onClick={() => setShowVersionHistory(!showVersionHistory)}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs border ${
                showVersionHistory 
                  ? 'bg-red-600 border-red-600 text-white hover:bg-red-700' 
                  : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50'
              }`}
            >
              <History size={14} className="mr-1.5 text-red-500" />
              <span>Version History ({sortedGroupReports.length})</span>
            </button>
          )}

          {savedReports && savedReports.length > 0 && (
            <button
              onClick={() => {
                const nextSplitState = !isSplitView;
                setIsSplitView(nextSplitState);
                if (nextSplitState && !selectedComparisonReportId) {
                  // Pre-populate with first other report if available
                  const other = savedReports.find(r => r.reportData !== JSON.stringify(report));
                  if (other) {
                    handleComparisonSelect(other.id);
                  } else {
                    handleComparisonSelect(savedReports[0].id);
                  }
                }
              }}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs border ${
                isSplitView 
                  ? 'bg-red-600 border-red-600 text-white hover:bg-red-700' 
                  : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50'
              }`}
            >
              <Swords size={14} className="mr-1.5 text-red-500" />
              <span>{isSplitView ? 'Exit Split-View' : 'Compare Blueprints'}</span>
            </button>
          )}

          <button
            onClick={downloadPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isGeneratingPdf ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileText size={14} className="mr-1.5 text-red-500" />
                <span>Download PDF Blueprint</span>
              </>
            )}
          </button>

          <button
            onClick={downloadCsv}
            className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
          >
            <Download size={14} className="mr-1.5 text-emerald-600 animate-pulse" />
            <span>Download Data as CSV</span>
          </button>

          {userId && (
            <button
              onClick={handleShare}
              className="inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm border border-red-600"
            >
              <Share2 size={14} className="mr-1.5" />
              <span>Share Blueprint</span>
            </button>
          )}
        </div>
      </div>

      {/* Version History Drawer / Panel */}
      {showVersionHistory && (
        <div className="bg-white border border-red-100 rounded-2xl p-5 mb-6 shadow-sm border-l-4 border-red-600 animate-fadeIn space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                <History size={16} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Blueprint Version History</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Explore previous AI generations or restore them to the primary master blueprint.</p>
              </div>
            </div>
            <button
              onClick={() => setShowVersionHistory(false)}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {sortedGroupReports.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No version history found for this blueprint.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedGroupReports.map((v) => {
                const isActive = v.id === activeReportId;
                const isRoot = !v.parentReportId;
                const dateStr = new Date(v.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div 
                    key={v.id}
                    className={`p-3.5 border rounded-xl transition duration-150 flex flex-col justify-between ${
                      isActive 
                        ? 'border-red-500 bg-red-50/10 ring-1 ring-red-500' 
                        : 'border-slate-150 bg-slate-50/30 hover:border-red-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          isRoot 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {isRoot ? 'Master Blueprint' : 'Historical Version'}
                        </span>
                        {isActive && (
                          <span className="text-[9px] font-black text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Check size={10} className="stroke-[3]" /> Active
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-1">
                        {v.title}
                      </h4>
                      <div className="flex items-center text-[10px] text-slate-400 font-medium">
                        <Clock size={10} className="mr-1" />
                        <span>{dateStr}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-1.5 border-t border-slate-100/60 pt-3">
                      {!isActive ? (
                        <button
                          onClick={() => onSelectReport && onSelectReport(v)}
                          className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition text-center cursor-pointer"
                        >
                          Load State
                        </button>
                      ) : (
                        <span className="flex-1 py-1.5 bg-red-50 border border-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-wider text-center select-none">
                          Loaded
                        </span>
                      )}
                      
                      {!isRoot && (
                        <button
                          onClick={() => onRestoreVersion && onRestoreVersion(v.id, rootReportId)}
                          className="inline-flex items-center justify-center p-1.5 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-650 hover:bg-white rounded-lg transition cursor-pointer"
                          title="Restore this version as the master active report state"
                        >
                          <RotateCcw size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Comparison Selector Bar */}
      {isSplitView && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 mb-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-red-650 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600/20 text-red-400 rounded-xl">
              <Swords size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Side-by-Side Comparison Mode</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Compare your active blueprint against other historical blueprints to track growth.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider shrink-0">Secondary Report:</span>
            <select
              value={selectedComparisonReportId}
              onChange={(e) => handleComparisonSelect(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 max-w-xs cursor-pointer"
            >
              <option value="">-- Choose saved blueprint --</option>
              {savedReports?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({new Date(r.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-hide mb-8">
        {[
          { id: 'overview', label: 'Executive Overview', icon: <Compass size={16} /> },
          { id: 'wellness', label: 'Mental Wellness & Focus', icon: <Heart size={16} className="text-rose-500" /> },
          { id: 'colleges', label: 'Colleges & Admissions', icon: <GraduationCap size={16} /> },
          { id: 'career', label: 'Career DNA & Placements', icon: <TrendingUp size={16} /> },
          { id: 'skills', label: 'Skills & Year-by-Year Roadmap', icon: <ListTodo size={16} /> },
          { id: 'goals', label: 'Academic Goal Setter', icon: <Target size={16} /> },
          { id: 'parent', label: 'Parent Safety Dashboard', icon: <ShieldCheck size={16} /> },
          { id: 'tools', label: 'Battle Mode & Tools', icon: <Swords size={16} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-6 py-3 text-xs font-bold transition border-b-2 -mb-[2px] ${activeTab === tab.id ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Render layout */}
      <div>
        {isSplitView ? (
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* LEFT COLUMN: ACTIVE BLUEPRINT */}
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                <span className="text-[10px] text-red-600 font-extrabold uppercase tracking-widest bg-white px-2.5 py-1 rounded-full border border-red-100">
                  Primary Panel (Current Active)
                </span>
              </div>
              {renderTabContent(report, profile, 'left')}
              {renderSectionNotes(activeTab, 'left')}
            </div>

            {/* RIGHT COLUMN: COMPARISON BLUEPRINT */}
            <div className="space-y-6 font-medium text-gray-800">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                <span className="text-[10px] text-amber-700 font-extrabold uppercase tracking-widest bg-white px-2.5 py-1 rounded-full border border-amber-100">
                  Secondary Panel (Comparison)
                </span>
              </div>
              {comparisonReport ? (
                renderTabContent(comparisonReport, profile, 'right')
              ) : (
                <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center space-y-4 shadow-sm">
                  <HelpCircle size={48} className="mx-auto text-gray-300 animate-bounce" />
                  <h4 className="text-sm font-bold text-gray-900">No Secondary Blueprint Loaded</h4>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                    Please select a saved blueprint from the selector above to visualize side-by-side growth and parameter shifts.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn space-y-6">
            {renderTabContent(report, profile, 'full')}
            {renderSectionNotes(activeTab, 'full')}
          </div>
        )}
      </div>

      {/* Share Link Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-fadeIn">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-gray-100 max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-start space-x-3 mb-5">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <Share2 size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase">Share Your Career Roadmap</h3>
                <p className="text-[11px] text-gray-500 mt-1">Generate a private, time-limited, view-only academic report and share it securely with mentors, advisors, or parents.</p>
              </div>
            </div>

            {isSharing ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                <svg className="animate-spin h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-xs font-bold text-gray-600">Generating secure sharing signature...</p>
              </div>
            ) : (
              <div className="space-y-5">
                {!sharedLink ? (
                  <div className="space-y-4 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        Step 1: Choose Link Expiration Limit
                      </label>
                      <select
                        value={expiresInSeconds}
                        onChange={(e) => setExpiresInSeconds(Number(e.target.value))}
                        className="w-full bg-white border border-gray-200 text-xs font-semibold text-gray-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                      >
                        <option value={3600}>1 Hour (Temporary Audit)</option>
                        <option value={43200}>12 Hours (Half Day)</option>
                        <option value={86400}>24 Hours (1 Day - Recommended)</option>
                        <option value={259200}>3 Days (Weekend Access)</option>
                        <option value={604800}>7 Days (1 Week)</option>
                        <option value={2592000}>30 Days (1 Month)</option>
                        <option value={0}>Permanent Link (Never Expires)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleGenerateShareLink}
                      className="w-full py-3 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition uppercase tracking-wider shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>Generate Secure Shareable Link</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Link Generated Successfully */}
                    <div className="border border-emerald-100 rounded-2xl p-4 bg-emerald-50/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded tracking-wider">
                          Secure Link Generated
                        </span>
                        <button
                          onClick={() => setSharedLink(null)}
                          className="text-[9px] font-bold text-slate-500 hover:text-red-650 underline"
                        >
                          Change Expiration
                        </button>
                      </div>

                      <div className="bg-white border border-gray-150 rounded-xl p-3 flex items-center justify-between gap-2 shadow-xs">
                        <span className="text-xs text-slate-600 font-mono select-all truncate flex-1 leading-normal pr-2">
                          {sharedLink}
                        </span>
                        <button
                          onClick={handleCopyLink}
                          className="shrink-0 inline-flex items-center justify-center px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition uppercase tracking-wider cursor-pointer"
                        >
                          {copied ? (
                            <>
                              <Check size={12} className="mr-1 text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} className="mr-1" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-medium pl-1">
                        <Clock size={12} className="text-slate-400 shrink-0" />
                        <span>
                          {linkExpiresAt ? (
                            <>
                              Expires on <strong className="text-slate-700">{new Date(linkExpiresAt).toLocaleString()}</strong>
                            </>
                          ) : (
                            <strong className="text-emerald-700">Permanent shared link. Never expires.</strong>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Step 2: Email Dispatch Form */}
                    <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                      <div>
                        <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                          Step 2: Dispatch Blueprint via Email
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Send this secure link directly to your mentor, parent, or college counselor.</p>
                      </div>

                      <form onSubmit={handleSendEmail} className="space-y-2.5">
                        <div className="flex gap-2">
                          <input
                            type="email"
                            required
                            placeholder="Recipient's email address..."
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            className="flex-1 bg-white border border-gray-200 text-xs font-semibold text-gray-800 rounded-xl px-3.5 py-2.5 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                          />
                          <button
                            type="submit"
                            disabled={isSendingEmail || !recipientEmail}
                            className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            {isSendingEmail ? (
                              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <span>Send Email</span>
                            )}
                          </button>
                        </div>

                        {emailSuccess && (
                          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-[10px] font-semibold border border-emerald-100 flex items-start gap-2 animate-fadeIn">
                            <span className="p-0.5 bg-emerald-500 text-white rounded-full shrink-0">
                              <Check size={8} />
                            </span>
                            <p>{emailSuccess}</p>
                          </div>
                        )}

                        {emailError && (
                          <div className="p-3 bg-red-50 text-red-800 rounded-xl text-[10px] font-semibold border border-red-100 flex items-start gap-2 animate-fadeIn">
                            <span className="p-0.5 bg-red-500 text-white rounded-full shrink-0">
                              <X size={8} />
                            </span>
                            <p>{emailError}</p>
                          </div>
                        )}
                      </form>

                      {/* Client Mailto Fallback Option */}
                      <div className="pt-2 border-t border-slate-200/50 flex justify-between items-center gap-2">
                        <span className="text-[9px] text-slate-400 font-medium">Or use your system email client:</span>
                        <a
                          href={`mailto:?subject=${encodeURIComponent(`Shared AI Educational Blueprint: AI Blueprint for ${profile.stream}`)}&body=${encodeURIComponent(
                            `Dear Mentor/Advisor/Parent,\n\nI have generated my personalized AI Educational Blueprint & Career Roadmap on the AI RED DRAGON V1 platform.\n\nYou can access and review the complete 18-module interactive roadmap here:\n\n${sharedLink}\n\n${
                              linkExpiresAt 
                                ? `Note: This is a time-limited link that will remain active until ${new Date(linkExpiresAt).toLocaleString()}.` 
                                : 'Note: This is a permanent secure shareable link.'
                            }\n\nBest regards,\n${profile.name}`
                          )}`}
                          className="inline-flex items-center text-[10px] font-bold text-red-600 hover:text-red-700 hover:underline"
                        >
                          <ExternalLink size={10} className="mr-1" />
                          <span>Open in Email App</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 flex items-start gap-2.5">
                  <span className="p-1 bg-emerald-500 text-white rounded-full shrink-0">
                    <Check size={10} />
                  </span>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-emerald-900">Parental Safety Audit Included</h4>
                    <p className="text-[10px] text-emerald-700/90 leading-relaxed mt-0.5 font-medium">This shareable view includes your complete 18-module intelligence dashboard, local transport links, cost of living breakdowns, and parental safety guardrails.</p>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="text-xs font-bold text-red-650 hover:underline hover:text-red-700 cursor-pointer"
                  >
                    Dismiss Shared Panel
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
