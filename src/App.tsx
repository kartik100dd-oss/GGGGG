import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, signInWithGoogle, signInWithGoogleRedirect, handleRedirectResult, logOut, getStudentProfile, 
  loadReports, saveReport, deleteReport, StudentProfile, SavedReportData,
  getSharedReport, shareReport, updateReport,
  signUpWithEmail, signInWithEmail, resetPassword
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  ShieldCheck, HelpCircle, User as UserIcon, LogOut, Compass, Sparkles, 
  RefreshCw, FileText, Swords, AlertCircle, Cpu, Shield, Globe, Landmark,
  CheckCircle2, Info, X, Copy, Terminal, ChevronDown, ChevronUp
} from 'lucide-react';
import StudentProfileForm from './components/StudentProfileForm';
import Dashboard from './components/Dashboard';
import SavedReports from './components/SavedReports';
import AboutUs from './components/AboutUs';
import PricingPlans from './components/PricingPlans';
import GoogleDrivePanel from './components/GoogleDrivePanel';
import MultiAiAssistant from './components/MultiAiAssistant';
import ProfessorPortal from './components/ProfessorPortal';
import CampusMapExplorer from './components/CampusMapExplorer';
import LegalPages, { LegalTab } from './components/LegalPages';
import AadhaarVerification from './components/AadhaarVerification';
import SecurityKeyManager from './components/SecurityKeyManager';
import { IntelligenceReport, AadhaarVerificationData, SecurityKeyData } from './types';
// @ts-ignore
import logoImg from './assets/images/golden_owl_logo_1783933151695.jpg';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [userPlan, setUserPlan] = useState<string>('100% Free All-Access ($0)');
  const [profileSubTab, setProfileSubTab] = useState<'academic' | 'aadhaar' | 'security' | 'drive'>('academic');

  // Authentication Form States
  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'forgot'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authActionLoading, setAuthActionLoading] = useState(false);

  // Shared report states
  const [sharedReport, setSharedReport] = useState<{
    id: string;
    title: string;
    createdAt: string;
    createdBy: string;
    reportData: any;
    profileData: StudentProfile | null;
  } | null>(null);
  const [loadingShared, setLoadingShared] = useState(false);

  // Toast notification state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };
  
  // Navigation
  const [activeView, setActiveView] = useState<'dashboard' | 'profile' | 'saved' | 'about' | 'pricing' | 'multiai' | 'faculty' | 'campusmap'>('dashboard');
  const [legalModalTab, setLegalModalTab] = useState<LegalTab | null>(null);
  
  // Reports
  const [savedReports, setSavedReports] = useState<SavedReportData[]>([]);
  const [activeReport, setActiveReport] = useState<IntelligenceReport | null>(null);
  const [activeReportTitle, setActiveReportTitle] = useState<string>('');
  const [activeReportId, setActiveReportId] = useState<string>('');
  
  // AI Generation Loading States
  const [generatingReport, setGeneratingReport] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');

  // User-facing API error states for catching downtime & invalid JSON gracefully
  const [apiError, setApiError] = useState<{
    message: string;
    title: string;
    type: 'downtime' | 'parsing' | 'credentials' | 'network' | 'generic';
    details?: string;
  } | null>(null);

  const [lastGenerationArgs, setLastGenerationArgs] = useState<{
    profile: StudentProfile;
    titlePrefix?: string;
    parentReportId?: string;
  } | null>(null);

  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [copiedDiagnostics, setCopiedDiagnostics] = useState(false);

  // Track Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Fetch student profile if it exists
          const profile = await getStudentProfile(firebaseUser.uid);
          setStudentProfile(profile);
          if (profile && (profile as any).selectedPlan) {
            setUserPlan((profile as any).selectedPlan);
          }
          
          // Fetch saved reports list
          const reports = await loadReports(firebaseUser.uid);
          setSavedReports(reports);
          if (reports.length > 0) {
            // Load the most recent report as default
            const latest = JSON.parse(reports[0].reportData) as IntelligenceReport;
            setActiveReport(latest);
            setActiveReportTitle(reports[0].title);
            setActiveReportId(reports[0].id);
          }
        } catch (error) {
          console.error('Error fetching user documents:', error);
        }
      } else {
        setStudentProfile(null);
        setSavedReports([]);
        setActiveReport(null);
        setActiveReportTitle('');
        setActiveReportId('');
        setUserPlan('100% Free All-Access ($0)');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handle Google Sign-In redirect results on page mount
  useEffect(() => {
    handleRedirectResult()
      .then((firebaseUser) => {
        if (firebaseUser) {
          addToast('Successfully authenticated via Google!', 'success');
        }
      })
      .catch((err: any) => {
        console.error('Redirect Sign-In Error:', err);
        let msg = err?.message || 'Failed to complete Google Sign-In.';
        if (err?.code === 'auth/unauthorized-domain') {
          msg = 'Unauthorized Domain: This URL is not whitelisted in your Firebase Console. Please add this domain to "Authorized Domains" in the Firebase Auth Settings.';
        }
        addToast(msg, 'error');
      });
  }, []);

  // Detect shared report ID in query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('sharedReportId');
    if (sharedId) {
      setLoadingShared(true);
      getSharedReport(sharedId)
        .then((shared) => {
          if (shared) {
            setSharedReport(shared);
            addToast(`Successfully loaded shared blueprint: ${shared.title}`, 'success');
          } else {
            addToast('The shared link is invalid or has expired.', 'error');
            // Clean up invalid query param
            const url = new URL(window.location.href);
            url.searchParams.delete('sharedReportId');
            window.history.pushState({}, '', url.toString());
          }
        })
        .catch((err) => {
          console.error('Error loading shared report:', err);
          addToast('Could not load the shared blueprint.', 'error');
        })
        .finally(() => {
          setLoadingShared(false);
        });
    }
  }, []);

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) {
      addToast('Please enter your email address.', 'error');
      return;
    }

    setAuthActionLoading(true);
    try {
      if (authMode === 'signin') {
        if (!authPassword) {
          addToast('Please enter your password.', 'error');
          setAuthActionLoading(false);
          return;
        }
        await signInWithEmail(authEmail, authPassword);
        addToast('Successfully signed in!', 'success');
      } else if (authMode === 'register') {
        if (!authPassword || authPassword.length < 6) {
          addToast('Password must be at least 6 characters long.', 'error');
          setAuthActionLoading(false);
          return;
        }
        await signUpWithEmail(authEmail, authPassword, authName || undefined);
        addToast('Account successfully registered!', 'success');
      } else if (authMode === 'forgot') {
        await resetPassword(authEmail);
        addToast('Password reset link has been dispatched to your email!', 'success');
        setAuthMode('signin');
      }
    } catch (err: any) {
      console.error('Email authentication error:', err);
      let errMsg = err?.message || 'Authentication operation failed.';
      if (errMsg.includes('auth/invalid-credential') || errMsg.includes('auth/wrong-password')) {
        errMsg = 'Invalid email or password credentials.';
      } else if (errMsg.includes('auth/email-already-in-use')) {
        errMsg = 'This email address is already registered.';
      } else if (errMsg.includes('auth/weak-password')) {
        errMsg = 'The password is too weak. Please use at least 6 characters.';
      } else if (errMsg.includes('auth/user-not-found')) {
        errMsg = 'No user account found with this email address.';
      }
      addToast(errMsg, 'error');
    } finally {
      setAuthActionLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      addToast('Successfully signed in with Google!', 'success');
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      const isIframe = window.self !== window.top;
      let msg = err?.message || 'Failed to authenticate via Google.';
      
      if (isIframe) {
        msg = 'IFrame Blocked: Browser third-party cookie restrictions are blocking Google login popups in embedded frames. Please click the "Open in New Tab" button at the top-right of the preview to sign in successfully!';
      } else if (err?.code === 'auth/popup-closed-by-user') {
        msg = 'The sign-in popup was closed before completion.';
      } else if (err?.code === 'auth/cancelled-popup-request') {
        msg = 'Multiple sign-in popups were opened. Please try again.';
      } else if (err?.code === 'auth/popup-blocked') {
        msg = 'The browser blocked the authentication popup. Please allow popups for this site.';
      }
      addToast(msg, 'error');
    }
  };

  const handleGoogleSignInRedirect = async () => {
    try {
      addToast('Redirecting to Google Sign-In...', 'info');
      await signInWithGoogleRedirect();
    } catch (err: any) {
      console.error('Google Redirect Sign-In Error:', err);
      addToast(err?.message || 'Failed to initiate redirect login.', 'error');
    }
  };

  const handleProfileSave = (updatedProfile: StudentProfile) => {
    setStudentProfile(updatedProfile);
    if ((updatedProfile as any).selectedPlan) {
      setUserPlan((updatedProfile as any).selectedPlan);
    }
    addToast('Student Profile saved and synchronized successfully!', 'success');
  };

  const handleAadhaarComplete = (aadhaarData: AadhaarVerificationData) => {
    setStudentProfile((prev) => {
      if (!prev) return null;
      return { ...prev, aadhaarData };
    });
  };

  const handleSecurityUpdate = (securityKeyData: SecurityKeyData) => {
    setStudentProfile((prev) => {
      if (!prev) return null;
      return { ...prev, securityKeyData };
    });
  };

  const handleImportProfile = (importedProfile: any) => {
    setStudentProfile(prev => {
      const base: Partial<StudentProfile> = prev || {
        uid: user?.uid || '',
        email: user?.email || '',
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
      };
      const merged = {
        ...base,
        ...importedProfile,
        uid: user?.uid || base.uid,
        email: user?.email || base.email,
      };
      return merged as StudentProfile;
    });
    addToast('Profile loaded from Google Drive. Don\'t forget to click "Save & Sync Profile" to persist!', 'info');
  };

  const handlePlanSelection = (selectedPlanName: string) => {
    setUserPlan(selectedPlanName);
    addToast(`Successfully switched plan to ${selectedPlanName}!`, 'success');
  };

  const selectReport = (reportDataObj: SavedReportData) => {
    const reportObj = JSON.parse(reportDataObj.reportData) as IntelligenceReport;
    setActiveReport(reportObj);
    setActiveReportTitle(reportDataObj.title);
    setActiveReportId(reportDataObj.id);
    setActiveView('dashboard');
    addToast('Loaded saved blueprint into dashboard.', 'info');
  };

  const handleDeleteSavedReport = async (reportId: string) => {
    if (!user) return;
    try {
      await deleteReport(user.uid, reportId);
      // Recursively delete all child versions of this report
      const childVersions = savedReports.filter(r => r.parentReportId === reportId);
      for (const child of childVersions) {
        await deleteReport(user.uid, child.id);
      }

      const updatedList = savedReports.filter(r => r.id !== reportId && r.parentReportId !== reportId);
      setSavedReports(updatedList);
      if (activeReportTitle && updatedList.length === 0) {
        setActiveReport(null);
        setActiveReportTitle('');
        setActiveReportId('');
      } else if (updatedList.length > 0) {
        const latest = JSON.parse(updatedList[0].reportData) as IntelligenceReport;
        setActiveReport(latest);
        setActiveReportTitle(updatedList[0].title);
        setActiveReportId(updatedList[0].id);
      }
      addToast('Saved blueprint and its version history deleted successfully.', 'info');
    } catch (error) {
      console.error('Error deleting report:', error);
      addToast('Failed to delete blueprint.', 'error');
    }
  };

  const handleRestoreVersion = async (versionReportId: string, parentReportId: string) => {
    if (!user) return;
    const versionReport = savedReports.find(r => r.id === versionReportId);
    const parentReport = savedReports.find(r => r.id === parentReportId);
    if (versionReport && parentReport) {
      try {
        await updateReport(user.uid, parentReportId, {
          reportData: versionReport.reportData
        });
        
        const updatedReports = savedReports.map(r => {
          if (r.id === parentReportId) {
            return { ...r, reportData: versionReport.reportData };
          }
          return r;
        });
        setSavedReports(updatedReports);
        
        const parentObj = JSON.parse(versionReport.reportData) as IntelligenceReport;
        setActiveReport(parentObj);
        setActiveReportTitle(parentReport.title);
        setActiveReportId(parentReportId);
        
        addToast('Successfully restored previous version as current parent!', 'success');
      } catch (err) {
        console.error('Error restoring report version:', err);
        addToast('Failed to restore report version.', 'error');
      }
    }
  };

  // Run What-If parameter updates or full regeneration
  const runSimulation = async (simulatedParams: { marks: string; budget: string; stream: string }) => {
    if (!studentProfile || !user) return;
    
    // Create a modified profile snapshot just for simulation
    const simulatedProfile: StudentProfile = {
      ...studentProfile,
      class12Marks: simulatedParams.marks,
      budget: simulatedParams.budget,
      stream: simulatedParams.stream
    };

    await triggerReportGeneration(simulatedProfile, `What-If Analysis: ${simulatedParams.stream} (${simulatedParams.marks})`);
  };

  // Generate Report with Gemini server-side API
  const triggerReportGeneration = async (profileToGenerate: StudentProfile, titlePrefix?: string, parentReportId?: string) => {
    if (!user) return;
    setGeneratingReport(true);
    setApiError(null);
    setLastGenerationArgs({ profile: profileToGenerate, titlePrefix, parentReportId });

    const steps = [
      'Calibrating Academic DNA indicators...',
      'Synthesizing stream suitability models...',
      'Accessing national NIRF & NAAC college registries...',
      'Calculating ROI and compensation structures...',
      'Mapping transit and cost of living metrics...',
      'Compiling year-by-year success roadmaps...',
      'Hardening parent safety metrics...',
      'Assembling final comprehensive intelligence blueprint...'
    ];

    let currentStep = 0;
    setLoadingStep(steps[currentStep]);
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setLoadingStep(steps[currentStep]);
      }
    }, 2000);

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profileToGenerate })
      });

      clearInterval(timer);

      const responseText = await response.text();
      let generatedReport: IntelligenceReport;
      try {
        const parsed = JSON.parse(responseText);
        if (!response.ok) {
          throw new Error(parsed.error || 'Intelligence Generation failed. Verify API Key settings.');
        }
        generatedReport = parsed as IntelligenceReport;
      } catch (e: any) {
        if (!response.ok) {
          throw new Error(`Intelligence Generation failed with status ${response.status}. Please check your Gemini API key.`);
        }
        throw new Error(`Invalid response format from server during blueprint generation: ${e?.message || String(e)}`);
      }
      
      // Save report in Firestore
      let title = titlePrefix || `AI Blueprint: ${profileToGenerate.stream} (${new Date().toLocaleDateString()})`;
      if (parentReportId) {
        const parentReportObj = savedReports.find(r => r.id === parentReportId);
        const parentTitle = parentReportObj ? parentReportObj.title : `AI Blueprint: ${profileToGenerate.stream}`;
        // Clean parent title from existing " (Version ...)" suffix if any
        const cleanedParentTitle = parentTitle.replace(/\s\(Version\s\d+\)$/i, '');
        const siblingCount = savedReports.filter(r => r.parentReportId === parentReportId || r.id === parentReportId).length;
        title = `${cleanedParentTitle} (Version ${siblingCount + 1})`;
      }

      const saved = await saveReport(user.uid, title, generatedReport, parentReportId);
      
      // Update local reports state
      const updatedReports = [saved, ...savedReports];
      setSavedReports(updatedReports);
      setActiveReport(generatedReport);
      setActiveReportTitle(title);
      setActiveReportId(saved.id);
      setActiveView('dashboard');
      addToast('AI Intelligence Blueprint generated successfully!', 'success');
    } catch (error: any) {
      clearInterval(timer);
      console.error('Error during AI generation:', error);
      addToast('Intelligence Blueprint generation failed.', 'error');
      
      const errorMsg = error?.message || String(error);
      
      let errorTitle = 'AI Intelligence Generation Failed';
      let errorType: 'downtime' | 'parsing' | 'credentials' | 'network' | 'generic' = 'generic';
      let explainedMessage = 'An unexpected issue occurred while calling the educational reasoning model.';

      if (
        errorMsg.includes('503') || 
        errorMsg.toLowerCase().includes('unavailable') || 
        errorMsg.toLowerCase().includes('high demand') ||
        errorMsg.toLowerCase().includes('rate limit')
      ) {
        errorTitle = 'Educational AI Model High Demand';
        errorType = 'downtime';
        explainedMessage = 'The primary Gemini model is currently experiencing high demand. This is typically a transient surge in traffic. Your profile data is safe, and you can retry generation immediately or in a few moments.';
      } else if (
        errorMsg.toLowerCase().includes('unexpected token') || 
        errorMsg.toLowerCase().includes('json') || 
        errorMsg.toLowerCase().includes('doctype')
      ) {
        errorTitle = 'Invalid Server Document Format';
        errorType = 'parsing';
        explainedMessage = 'The application received an invalid raw response (typically an HTML gateway timeout page or server configuration notice) instead of structured career JSON data. This usually indicates high demand on our upstream reasoning gateway.';
      } else if (
        errorMsg.toLowerCase().includes('api key') || 
        errorMsg.toLowerCase().includes('gemini_api_key') || 
        errorMsg.toLowerCase().includes('settings > secrets') ||
        errorMsg.toLowerCase().includes('unauthorized') ||
        errorMsg.toLowerCase().includes('status 403') ||
        errorMsg.toLowerCase().includes('status 400')
      ) {
        errorTitle = 'API Authorization Needed';
        errorType = 'credentials';
        explainedMessage = 'The backend was unable to authenticate with Google GenAI. Please verify that a valid GEMINI_API_KEY is active in your project settings (Settings > Secrets).';
      } else if (
        errorMsg.toLowerCase().includes('fetch') || 
        errorMsg.toLowerCase().includes('network') || 
        errorMsg.toLowerCase().includes('disconnected')
      ) {
        errorTitle = 'Network Connection Interrupted';
        errorType = 'network';
        explainedMessage = 'Unable to establish a connection with the backend service. Please check your internet connectivity and try again.';
      }

      setApiError({
        title: errorTitle,
        message: explainedMessage,
        type: errorType,
        details: errorMsg
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  if (authLoading || loadingShared) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-900 text-white font-sans">
        <Cpu className="animate-spin text-red-500 mb-4" size={40} />
        <h2 className="text-sm font-extrabold tracking-widest uppercase text-gray-400">
          {loadingShared ? 'Loading Shared Blueprint...' : 'Loading AI RED DRAGON v1...'}
        </h2>
      </div>
    );
  }

  // Shared View-Only Viewer Mode (Accessible without login)
  if (sharedReport) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-gray-800">
        {/* Shared Report Top Bar */}
        <div className="bg-red-600 text-white text-xs font-bold py-3.5 px-6 shadow-md sticky top-0 z-50 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-red-700">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shrink-0"></span>
            <span>
              Viewing Shared Blueprint: <strong className="underline decoration-wavy decoration-white/50">{sharedReport.title}</strong> (Shared on {new Date(sharedReport.createdAt).toLocaleDateString()})
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            {user ? (
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('sharedReportId');
                  window.history.pushState({}, '', url.toString());
                  setSharedReport(null);
                  setActiveView('dashboard');
                }}
                className="bg-slate-900/70 hover:bg-slate-900/90 text-white font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider transition active:scale-95 cursor-pointer border border-white/10"
              >
                Go to My Dashboard
              </button>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="bg-white hover:bg-gray-100 text-slate-900 font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-sm"
              >
                Sign In & Create Your Own Blueprint
              </button>
            )}
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('sharedReportId');
                window.history.pushState({}, '', url.toString());
                setSharedReport(null);
              }}
              className="bg-white/15 hover:bg-white/25 text-white font-extrabold px-3 py-2 rounded-xl text-[10px] uppercase transition cursor-pointer"
            >
              Exit Viewer
            </button>
          </div>
        </div>

        {/* Dashboard in shared, read-only mode */}
        <main className="flex-1 py-8">
          <Dashboard 
            report={sharedReport.reportData} 
            profile={sharedReport.profileData || {
              uid: 'shared',
              name: 'Shared Student',
              email: '',
              stream: 'Science PCM',
              class10Marks: '90%',
              class12Marks: '92%',
              entranceScores: 'JEE Rank: 12000',
              budget: '5,00,000 INR',
              locationPreference: 'Delhi, Punjab',
              hostelRequirement: true,
              careerInterests: 'Computer Science, AI',
              achievements: 'Maths Olympiad Winner',
              resumeText: 'Passionate computer enthusiast',
              parentPreferences: 'Strict security, good hostel'
            }} 
            onSimulate={() => {
              addToast('Simulation is disabled in view-only shared mode. Sign in to run simulation models.', 'info');
            }}
            isSimulating={false}
            savedReports={[]}
            userId="" // Empty disables saving/editing cloud-side
            onProfileUpdate={() => {}}
          />
        </main>

        {/* Toast Notification Container */}
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md bg-white/95 ${
                  toast.type === 'success' ? 'border-emerald-100/80 shadow-emerald-950/5' :
                  toast.type === 'error' ? 'border-rose-100/80 shadow-rose-950/5' :
                  'border-sky-100/80 shadow-sky-950/5'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {toast.type === 'success' && <CheckCircle2 className="text-emerald-500" size={18} />}
                  {toast.type === 'error' && <AlertCircle className="text-rose-500" size={18} />}
                  {toast.type === 'info' && <Info className="text-sky-500" size={18} />}
                </div>
                
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-900 leading-normal">
                    {toast.message}
                  </p>
                </div>

                <button
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="text-slate-400 hover:text-slate-600 transition shrink-0 p-0.5 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Not authenticated screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans relative overflow-hidden px-4">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full px-6 py-8 sm:py-10 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl relative z-10 text-center backdrop-blur-md my-8"
        >
          {/* Logo element */}
          <div className="relative w-24 h-24 mx-auto mb-6 rounded-3xl overflow-hidden border-2 border-amber-500/30 shadow-xl shadow-amber-500/10 hover:border-amber-500/60 transition-all duration-300">
            <img 
              src={logoImg} 
              alt="Golden Owl Technologies Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <span className="px-3 py-1 text-[9px] font-black bg-red-600/10 text-red-400 rounded-full uppercase tracking-widest border border-red-500/20">
            Advanced Educational Intelligence
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-white mt-4 tracking-tight">
            AI RED DRAGON <span className="text-red-500">V1</span>
          </h1>
          <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
            Ultimate Career Counselor, College Advisor, Admission Strategist & Scholarship Expert.
          </p>

          {/* Form container */}
          <form onSubmit={handleEmailAuthSubmit} className="mt-8 text-left space-y-4">
            
            {authMode === 'register' && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500 transition"
                  disabled={authActionLoading}
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500 transition"
                disabled={authActionLoading}
              />
            </div>

            {authMode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Password
                  </label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[10px] font-bold text-slate-400 hover:text-red-400 transition cursor-pointer"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500 transition"
                  disabled={authActionLoading}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={authActionLoading}
              className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 px-6 rounded-xl text-xs uppercase tracking-wider shadow-xl transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {authActionLoading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : authMode === 'signin' ? (
                'Sign In'
              ) : authMode === 'register' ? (
                'Create Account'
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          {/* Toggle Modes */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            {authMode === 'signin' ? (
              <>
                <span>Don't have an account?</span>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="font-extrabold text-red-400 hover:text-red-500 cursor-pointer"
                >
                  Register Here
                </button>
              </>
            ) : authMode === 'register' ? (
              <>
                <span>Already have an account?</span>
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className="font-extrabold text-red-400 hover:text-red-500 cursor-pointer"
                >
                  Sign In
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className="font-extrabold text-slate-300 hover:text-white cursor-pointer"
              >
                Back to Sign In
              </button>
            )}
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
              <span className="bg-slate-900 px-3 text-slate-500">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center space-x-3 bg-white text-slate-900 hover:bg-gray-100 font-extrabold py-3 px-6 rounded-xl shadow-xl transition-all duration-200 cursor-pointer active:scale-95"
          >
            {/* Google Vector Icon */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.115-5.137 4.115-3.48 0-6.3-2.82-6.3-6.3s2.82-6.3 6.3-6.3c1.547 0 2.954.562 4.053 1.493l3.036-3.036C19.112 2.5 15.938 1.5 12.24 1.5c-5.79 0-10.5 4.71-10.5 10.5s4.71 10.5 10.5 10.5c5.38 0 9.948-3.86 9.948-10.5 0-.54-.054-1.06-.144-1.565h-9.804z" />
            </svg>
            <span className="text-xs text-slate-900">Sign in with Google</span>
          </button>

          <p className="text-[10px] text-slate-400 mt-3 text-center leading-relaxed">
            Popup failing or closing instantly? <br />
            <button
              onClick={handleGoogleSignInRedirect}
              className="text-red-400 font-black hover:underline cursor-pointer"
            >
              Sign in with Google Redirect Mode
            </button>
          </p>

          <p className="text-[10px] text-gray-500 mt-5 leading-relaxed max-w-xs mx-auto">
            Secure, credentialed login via Firebase Auth. We preserve your academic profiles and personalized decision reports securely.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-gray-800">
      
      {/* Top Banner & Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50 border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveView('dashboard')}>
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-500/30 shadow-md">
              <img 
                src={logoImg} 
                alt="Golden Owl Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight flex items-center gap-1.5">
                AI RED DRAGON 
                <span className="bg-amber-500/10 text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest">V1</span>
              </h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                GOLDEN OWL TECHNOLOGIES DIVISION
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-5 text-xs font-bold uppercase tracking-wider">
            <button 
              onClick={() => setActiveView('dashboard')} 
              className={`hover:text-red-400 transition cursor-pointer ${activeView === 'dashboard' ? 'text-red-500' : 'text-gray-300'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveView('multiai')} 
              className={`hover:text-red-400 transition cursor-pointer flex items-center gap-1 ${activeView === 'multiai' ? 'text-red-500' : 'text-gray-300'}`}
            >
              <Sparkles size={12} className="text-amber-400" />
              <span>Multi-AI</span>
            </button>
            <button 
              onClick={() => setActiveView('faculty')} 
              className={`hover:text-red-400 transition cursor-pointer ${activeView === 'faculty' ? 'text-red-500' : 'text-gray-300'}`}
            >
              Faculty & Video
            </button>
            <button 
              onClick={() => setActiveView('campusmap')} 
              className={`hover:text-red-400 transition cursor-pointer ${activeView === 'campusmap' ? 'text-red-500' : 'text-gray-300'}`}
            >
              Campus Map
            </button>
            <button 
              onClick={() => setActiveView('saved')} 
              className={`hover:text-red-400 transition cursor-pointer ${activeView === 'saved' ? 'text-red-500' : 'text-gray-300'}`}
            >
              Saved Blueprints
            </button>
            <button 
              onClick={() => setActiveView('profile')} 
              className={`hover:text-red-400 transition cursor-pointer ${activeView === 'profile' ? 'text-red-500' : 'text-gray-300'}`}
            >
              Profile
            </button>
            <button 
              onClick={() => setActiveView('pricing')} 
              className={`hover:text-red-400 transition cursor-pointer ${activeView === 'pricing' ? 'text-red-500' : 'text-gray-300'}`}
            >
              Plans & PayU
            </button>
            <button 
              onClick={() => setLegalModalTab('terms')} 
              className="text-[10px] text-slate-400 hover:text-white transition cursor-pointer border border-slate-700 px-2 py-1 rounded"
              title="PayU Terms, Privacy & Refund Policy"
            >
              Policies
            </button>
          </nav>

          {/* User Widget */}
          <div className="flex items-center space-x-3">
            {/* Aadhaar Verification Status Quick Badge */}
            {studentProfile?.aadhaarData?.verified ? (
              <button
                type="button"
                onClick={() => { setActiveView('profile'); setProfileSubTab('aadhaar'); }}
                className="hidden md:inline-flex items-center space-x-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-[10px] font-bold tracking-wide hover:bg-green-500/20 transition cursor-pointer"
                title="UIDAI Aadhaar Verified Identity"
              >
                <ShieldCheck size={12} className="text-green-400" />
                <span>AADHAAR VERIFIED</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setActiveView('profile'); setProfileSubTab('aadhaar'); }}
                className="hidden md:inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg text-[10px] font-bold tracking-wide hover:bg-amber-500/20 transition cursor-pointer"
                title="Verify Aadhaar for Priority Admissions"
              >
                <AlertCircle size={12} className="text-amber-400" />
                <span>VERIFY AADHAAR</span>
              </button>
            )}

            {/* 24h Security Key Status Quick Button */}
            <button
              type="button"
              onClick={() => { setActiveView('profile'); setProfileSubTab('security'); }}
              className="hidden xl:inline-flex items-center space-x-1 px-2 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-bold hover:text-white transition cursor-pointer"
              title="Manage 24h Timelock Security Key"
            >
              <Shield size={11} className="text-red-400" />
              <span>24H KEY LOCK</span>
            </button>

            <div className="text-right hidden sm:block">
              <span className="block text-[10px] font-black uppercase text-gray-300">{user.displayName || 'Student'}</span>
              <span className="block text-[8px] font-bold text-red-400 uppercase tracking-widest">{userPlan}</span>
            </div>
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border-2 border-red-500 shrink-0 cursor-pointer" onClick={() => setActiveView('profile')} referrerPolicy="no-referrer" />
            ) : (
              <div onClick={() => setActiveView('profile')} className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer">U</div>
            )}
            <button
              onClick={logOut}
              className="p-1.5 border border-slate-700 hover:border-red-500/50 hover:text-red-400 rounded-xl transition cursor-pointer"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAV BOTTOM TABS */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 text-gray-400 py-2 px-3 flex justify-around text-[9px] font-bold uppercase tracking-wider z-50">
        <button onClick={() => setActiveView('dashboard')} className={`flex flex-col items-center space-y-0.5 ${activeView === 'dashboard' ? 'text-red-500' : ''}`}>
          <Compass size={15} />
          <span>Dashboard</span>
        </button>
        <button onClick={() => setActiveView('multiai')} className={`flex flex-col items-center space-y-0.5 ${activeView === 'multiai' ? 'text-red-500' : ''}`}>
          <Sparkles size={15} />
          <span>Multi-AI</span>
        </button>
        <button onClick={() => setActiveView('faculty')} className={`flex flex-col items-center space-y-0.5 ${activeView === 'faculty' ? 'text-red-500' : ''}`}>
          <UserIcon size={15} />
          <span>Faculty</span>
        </button>
        <button onClick={() => setActiveView('campusmap')} className={`flex flex-col items-center space-y-0.5 ${activeView === 'campusmap' ? 'text-red-500' : ''}`}>
          <Globe size={15} />
          <span>Map</span>
        </button>
        <button onClick={() => setActiveView('saved')} className={`flex flex-col items-center space-y-0.5 ${activeView === 'saved' ? 'text-red-500' : ''}`}>
          <FileText size={15} />
          <span>Saved</span>
        </button>
        <button onClick={() => setActiveView('pricing')} className={`flex flex-col items-center space-y-0.5 ${activeView === 'pricing' ? 'text-red-500' : ''}`}>
          <Landmark size={15} />
          <span>PayU</span>
        </button>
      </div>

      {/* Loading overlay for AI Blueprint Generation */}
      <AnimatePresence>
        {generatingReport && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col justify-center items-center text-center p-6 z-50 text-white"
          >
            <div className="w-24 h-24 relative flex items-center justify-center">
              {/* Outer spinning elements */}
              <div className="absolute inset-0 border-4 border-dashed border-red-500 rounded-full animate-spin"></div>
              <Cpu className="text-red-500" size={32} />
            </div>

            <h3 className="mt-8 text-xl font-extrabold tracking-tight">Generating AI Intelligence Blueprint</h3>
            <p className="mt-2 text-xs text-amber-400 font-mono tracking-widest uppercase">{loadingStep}</p>
            
            <p className="mt-8 max-w-sm text-xs text-gray-400 leading-relaxed">
              We are accessing the latest NIRF ratings, parsing NAAC accreditation scores, estimating hostel curfews, compiling year-by-year success milestones, and calculating complex ROI matrices.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Robust User-Facing Error Overlay */}
      <AnimatePresence>
        {apiError && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-center items-center p-4 z-50 text-white"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative accent background red flare */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-2xl"></div>
              
              <div className="flex items-start gap-4 mb-5">
                <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 shrink-0">
                  <AlertCircle size={28} />
                </div>
                <div className="flex-1">
                  <span className="text-[9px] font-black uppercase text-amber-500 tracking-widest bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 inline-block mb-1.5">
                    {apiError.type === 'downtime' ? 'AI Capacity Notice' :
                     apiError.type === 'parsing' ? 'System Format Misalignment' :
                     apiError.type === 'credentials' ? 'Service Keys Required' :
                     apiError.type === 'network' ? 'Connectivity Disrupted' : 'Operation Interrupted'}
                  </span>
                  <h3 className="text-lg font-extrabold text-white tracking-tight">{apiError.title}</h3>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 mb-5 text-xs text-gray-300 leading-relaxed space-y-3">
                <p>{apiError.message}</p>
                
                {apiError.type === 'downtime' && (
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex items-start gap-2.5">
                    <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-300/90 leading-normal">
                      <strong>Downtime recovery tip:</strong> If the primary model is busy, we attempt fallbacks automatically. Sometimes a simple, immediate retry succeeds because the rate-limiting window resets instantly.
                    </p>
                  </div>
                )}

                {/* Collapsible Diagnostics Block */}
                <div>
                  <button
                    onClick={() => setShowDiagnostics(!showDiagnostics)}
                    className="flex items-center justify-between w-full py-2 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Terminal size={12} />
                      Developer Diagnostic Logs
                    </span>
                    {showDiagnostics ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  
                  <AnimatePresence>
                    {showDiagnostics && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[10px] text-rose-300 max-h-32 overflow-y-auto break-all relative">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(apiError.details || apiError.message);
                              setCopiedDiagnostics(true);
                              setTimeout(() => setCopiedDiagnostics(false), 2000);
                            }}
                            className="absolute top-2 right-2 p-1 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 text-gray-400 hover:text-white transition cursor-pointer"
                            title="Copy details"
                          >
                            <Copy size={10} />
                          </button>
                          {copiedDiagnostics ? 'Copied to clipboard!\n\n' : ''}
                          {apiError.details || 'No trace available.'}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setApiError(null)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-extrabold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer text-center"
                >
                  Dismiss
                </button>
                
                {lastGenerationArgs && (
                  <button
                    onClick={() => {
                      const args = lastGenerationArgs;
                      setApiError(null);
                      triggerReportGeneration(args.profile, args.titlePrefix, args.parentReportId);
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer text-center"
                  >
                    <RefreshCw size={12} className="mr-2" />
                    Retry Generation
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Body */}
      <main className="flex-1 pb-20 md:pb-12 pt-6 px-4">
        
        {/* Floating Quick CTA to Generate Report */}
        {activeView === 'dashboard' && studentProfile && !activeReport && (
          <div className="max-w-xl mx-auto py-12 text-center bg-white border border-gray-100 rounded-3xl shadow-sm p-8 mb-8 animate-fadeIn">
            <Sparkles className="mx-auto text-amber-400 animate-bounce mb-4" size={40} />
            <h3 className="text-lg font-extrabold text-gray-900">Your Student Profile is Synchronized!</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed max-w-sm mx-auto">
              Ready to construct your Ultimate Career & College Intelligence Report? Click below to run AI heuristics.
            </p>
            <button
              onClick={() => triggerReportGeneration(studentProfile)}
              className="mt-6 inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl text-xs tracking-wider uppercase shadow-lg active:scale-95 cursor-pointer"
            >
              <span>Generate AI Intelligence Report</span>
            </button>
          </div>
        )}

        {/* Missing profile CTA */}
        {activeView === 'dashboard' && !studentProfile && (
          <div className="max-w-xl mx-auto py-12 text-center bg-white border border-gray-100 rounded-3xl shadow-sm p-8 mb-8">
            <UserIcon className="mx-auto text-gray-300 mb-4 animate-pulse" size={40} />
            <h3 className="text-lg font-extrabold text-gray-900">Configure Student Profile First</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed max-w-sm mx-auto">
              Please enter your marks, stream, budget limits, and achievements to authorize personalized AI report generation.
            </p>
            <button
              onClick={() => setActiveView('profile')}
              className="mt-6 inline-flex items-center px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl text-xs tracking-wider uppercase shadow-md active:scale-95 cursor-pointer"
            >
              <span>Build Student Profile Now</span>
            </button>
          </div>
        )}

        {/* active report header strip on dashboard */}
        {activeView === 'dashboard' && activeReport && (
          <div className="max-w-7xl mx-auto bg-white border border-gray-100 rounded-2xl px-6 py-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[9px] text-red-600 font-bold uppercase tracking-widest">Active Blueprint Target</span>
              <h2 className="text-sm font-black text-slate-800 uppercase mt-0.5">{activeReportTitle}</h2>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (studentProfile) {
                    const activeReportObj = savedReports.find(r => r.id === activeReportId);
                    const parentId = activeReportObj ? (activeReportObj.parentReportId || activeReportObj.id) : undefined;
                    triggerReportGeneration(studentProfile, undefined, parentId);
                  }
                }}
                className="inline-flex items-center px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-extrabold rounded-xl uppercase tracking-wider transition active:scale-95 cursor-pointer"
              >
                <RefreshCw size={10} className="mr-1.5" />
                Regenerate AI Report
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          {activeView === 'dashboard' && activeReport && studentProfile && (
            <>
              <GoogleDrivePanel 
                userId={user?.uid || ''} 
                activeReport={activeReport} 
                activeProfile={studentProfile} 
                onImportProfile={handleImportProfile}
                addToast={addToast}
              />
              <Dashboard 
                report={activeReport} 
                profile={studentProfile} 
                onSimulate={runSimulation}
                isSimulating={generatingReport}
                savedReports={savedReports}
                userId={user?.uid || ''}
                onProfileUpdate={handleProfileSave}
                activeReportId={activeReportId}
                onSelectReport={selectReport}
                onRestoreVersion={handleRestoreVersion}
              />
            </>
          )}

          {activeView === 'profile' && user && (
            <div className="space-y-6">
              {/* Profile Subtabs Switcher */}
              <div className="bg-white border border-gray-150 rounded-2xl p-2 shadow-xs flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProfileSubTab('academic')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    profileSubTab === 'academic'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <UserIcon size={14} />
                  <span>Academic Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileSubTab('aadhaar')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    profileSubTab === 'aadhaar'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <ShieldCheck size={14} />
                  <span>Aadhaar ID Verification</span>
                  {studentProfile?.aadhaarData?.verified ? (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 ml-1">
                      Verified
                    </span>
                  ) : (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 ml-1">
                      Pending
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setProfileSubTab('security')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    profileSubTab === 'security'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Shield size={14} className="text-red-400" />
                  <span>Security Key & 24h Timelock</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileSubTab('drive')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    profileSubTab === 'drive'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Globe size={14} />
                  <span>Google Drive Cloud Sync</span>
                </button>
              </div>

              {/* Subtab Contents */}
              {profileSubTab === 'academic' && (
                <StudentProfileForm 
                  userId={user.uid} 
                  initialProfile={studentProfile} 
                  onSaveSuccess={handleProfileSave}
                />
              )}

              {profileSubTab === 'aadhaar' && (
                <AadhaarVerification
                  userId={user.uid}
                  initialAadhaarData={studentProfile?.aadhaarData}
                  onVerificationComplete={handleAadhaarComplete}
                  addToast={addToast}
                  defaultName={studentProfile?.name || user?.displayName || ''}
                />
              )}

              {profileSubTab === 'security' && (
                <SecurityKeyManager
                  userId={user.uid}
                  initialSecurityData={studentProfile?.securityKeyData}
                  onSecurityUpdate={handleSecurityUpdate}
                  addToast={addToast}
                />
              )}

              {profileSubTab === 'drive' && (
                <GoogleDrivePanel 
                  userId={user?.uid || ''} 
                  activeReport={activeReport} 
                  activeProfile={studentProfile} 
                  onImportProfile={handleImportProfile}
                  addToast={addToast}
                />
              )}
            </div>
          )}

          {activeView === 'saved' && (
            <SavedReports 
              reports={savedReports} 
              onSelectReport={selectReport} 
              onDeleteReport={handleDeleteSavedReport}
            />
          )}

          {activeView === 'about' && (
            <AboutUs />
          )}

          {activeView === 'multiai' && (
            <MultiAiAssistant 
              studentProfile={studentProfile} 
              activeReport={activeReport} 
            />
          )}

          {activeView === 'faculty' && (
            <ProfessorPortal />
          )}

          {activeView === 'campusmap' && (
            <CampusMapExplorer />
          )}

          {activeView === 'pricing' && (
            <PricingPlans 
              currentPlan={userPlan} 
              onPlanSelected={handlePlanSelection}
              userId={user.uid}
            />
          )}
        </div>
      </main>

      {/* PayU Regulatory Legal Compliance Modal */}
      {legalModalTab && (
        <LegalPages
          initialTab={legalModalTab}
          onClose={() => setLegalModalTab(null)}
        />
      )}

      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md bg-white/95 ${
                toast.type === 'success' ? 'border-emerald-100/80 shadow-emerald-950/5' :
                toast.type === 'error' ? 'border-rose-100/80 shadow-rose-950/5' :
                'border-sky-100/80 shadow-sky-950/5'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' && (
                  <CheckCircle2 className="text-emerald-500" size={18} />
                )}
                {toast.type === 'error' && (
                  <AlertCircle className="text-rose-500" size={18} />
                )}
                {toast.type === 'info' && (
                  <Info className="text-sky-500" size={18} />
                )}
              </div>
              
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-900 leading-normal">
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-slate-400 hover:text-slate-600 transition shrink-0 p-0.5 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Corporate & PayU Compliance Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 sm:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left mt-8">
        <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 sm:gap-6 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Division:</span>
            <span className="font-bold text-slate-800">Golden Owl Technologies</span>
          </div>
          <span className="text-slate-300">·</span>
          <button onClick={() => setLegalModalTab('terms')} className="hover:text-red-600 hover:underline cursor-pointer">
            Terms of Service
          </button>
          <span className="text-slate-300">·</span>
          <button onClick={() => setLegalModalTab('privacy')} className="hover:text-red-600 hover:underline cursor-pointer">
            Privacy Policy
          </button>
          <span className="text-slate-300">·</span>
          <button onClick={() => setLegalModalTab('refund')} className="hover:text-emerald-700 font-semibold hover:underline cursor-pointer">
            Refund Policy (7-Day Guarantee)
          </button>
          <span className="text-slate-300">·</span>
          <button onClick={() => setLegalModalTab('contact')} className="hover:text-red-600 hover:underline cursor-pointer">
            Contact & Grievance
          </button>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            © 2026 AI RED DRAGON™ · PayU India Verified Partner
          </p>
          <p className="text-[9px] text-slate-400">Bathinda, Punjab, 151001 · support@aireddragon.edu</p>
        </div>
      </footer>

    </div>
  );
}
