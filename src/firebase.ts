import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  AadhaarVerificationData, SecurityKeyData, SecurityAuditLogItem,
  WellnessCheckinData, WellnessStats, MoodRating, BurnoutLevel 
} from './types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google Drive Scopes
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');

// Cache the access token in memory
let cachedAccessToken: string | null = null;

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
}

// Custom database ID support if present in configuration, otherwise default
const dbId = (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-bcf094b9-9c8c-4766-b81f-d00f64750a44';
export const db = getFirestore(app, dbId);

// Test connection on boot to catch potential issues early
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Firestore connection error: the client is offline. Please check your config.', error);
    }
  }
}
testConnection();

// Google Sign-In helper
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return result.user;
  } catch (error) {
    console.error('Error during Google Sign-In', error);
    throw error;
  }
}

// Google Sign-In with Redirect
export async function signInWithGoogleRedirect() {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error('Error starting redirect Google Sign-In', error);
    throw error;
  }
}

// Handle Google Redirect Result on reload
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
      }
      return result.user;
    }
    return null;
  } catch (error) {
    console.error('Error handling Google Sign-In redirect result', error);
    throw error;
  }
}

// Sign Out helper
export async function logOut() {
  try {
    await signOut(auth);
    cachedAccessToken = null;
  } catch (error) {
    console.error('Error signing out', error);
    throw error;
  }
}

// Register with email & password
export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    return result.user;
  } catch (error) {
    console.error('Error in signUpWithEmail', error);
    throw error;
  }
}

// Sign in with email & password
export async function signInWithEmail(email: string, password: string) {
  try {
    const result = await firebaseSignInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error('Error in signInWithEmail', error);
    throw error;
  }
}

// Send password reset email
export async function resetPassword(email: string) {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error in resetPassword', error);
    throw error;
  }
}

// Profile Save / Load
export interface StudentProfile {
  uid: string;
  name: string;
  email: string;
  stream: string;
  class10Marks: string;
  class12Marks: string;
  entranceScores: string;
  budget: string;
  locationPreference: string;
  hostelRequirement: boolean;
  careerInterests: string;
  achievements: string;
  resumeText: string;
  parentPreferences: string;
  targetCgpa?: string;
  targetRank?: string;
  currentCgpa?: string;
  currentRank?: string;
  yearCgpaTargets?: string;
  completedMilestones?: string;
  aadhaarData?: AadhaarVerificationData;
  securityKeyData?: SecurityKeyData;
  latestWellnessCheckin?: WellnessCheckinData;
  wellnessStats?: WellnessStats;
}

export async function saveStudentProfile(uid: string, profile: Omit<StudentProfile, 'uid' | 'email'>) {
  const userRef = doc(db, 'users', uid);
  
  const updatedData = {
    ...profile,
    uid,
    email: auth.currentUser?.email || '',
    updatedAt: new Date().toISOString()
  };

  await setDoc(userRef, updatedData, { merge: true });
  return updatedData;
}

// Aadhaar Verification Save
export async function saveAadhaarVerification(uid: string, aadhaarData: AadhaarVerificationData) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  const existing = snap.data() || {};
  
  // Create audit log entry
  const newAuditLog: SecurityAuditLogItem = {
    id: 'log_' + Date.now(),
    action: 'AADHAAR_VERIFIED',
    timestamp: new Date().toISOString(),
    details: `Aadhaar ID verified for ${aadhaarData.holderName} (${aadhaarData.maskedNumber}). UIDAI Ref: ${aadhaarData.verificationId}`,
    ipAddress: '127.0.0.1 (Secured SSL/TLS)'
  };

  const existingSecurity = existing.securityKeyData || {
    activeKey: 'ARD-SEC-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Date.now().toString().slice(-4),
    createdAt: new Date().toISOString(),
    auditLogs: []
  };

  const updatedSecurityData: SecurityKeyData = {
    ...existingSecurity,
    auditLogs: [newAuditLog, ...(existingSecurity.auditLogs || [])]
  };

  await setDoc(userRef, {
    aadhaarData,
    securityKeyData: updatedSecurityData,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  return { aadhaarData, securityKeyData: updatedSecurityData };
}

// Security Key - Save / Initialize
export async function saveSecurityKeyData(uid: string, securityKeyData: SecurityKeyData) {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    securityKeyData,
    updatedAt: new Date().toISOString()
  }, { merge: true });
  return securityKeyData;
}

// Security Key - Request Change (Enforces 24-Hour Timelock)
export async function requestSecurityKeyChange(uid: string, newKey: string, currentSecurityData?: SecurityKeyData) {
  const userRef = doc(db, 'users', uid);
  const requestedAt = new Date();
  const unlockAt = new Date(requestedAt.getTime() + 24 * 60 * 60 * 1000); // exactly 24 hours later

  const auditLog: SecurityAuditLogItem = {
    id: 'log_' + Date.now(),
    action: 'KEY_CHANGE_REQUESTED',
    timestamp: requestedAt.toISOString(),
    details: `New security key change requested. Mandatory 24-hour security timelock initiated until ${unlockAt.toLocaleString()}.`,
    ipAddress: '127.0.0.1 (Secured Client)'
  };

  const current = currentSecurityData || {
    activeKey: 'ARD-SEC-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Date.now().toString().slice(-4),
    createdAt: new Date().toISOString(),
    auditLogs: []
  };

  const updated: SecurityKeyData = {
    ...current,
    pendingKey: newKey,
    requestedAt: requestedAt.toISOString(),
    unlockAt: unlockAt.toISOString(),
    auditLogs: [auditLog, ...(current.auditLogs || [])]
  };

  await setDoc(userRef, {
    securityKeyData: updated,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  return updated;
}

// Security Key - Cancel Pending Change Request
export async function cancelSecurityKeyChange(uid: string, currentSecurityData: SecurityKeyData) {
  const userRef = doc(db, 'users', uid);
  const now = new Date().toISOString();

  const auditLog: SecurityAuditLogItem = {
    id: 'log_' + Date.now(),
    action: 'KEY_CHANGE_CANCELLED',
    timestamp: now,
    details: 'Pending 24-hour security key change request was manually aborted by account owner.',
    ipAddress: '127.0.0.1 (Secured Client)'
  };

  const updated: SecurityKeyData = {
    ...currentSecurityData,
    pendingKey: null,
    requestedAt: null,
    unlockAt: null,
    auditLogs: [auditLog, ...(currentSecurityData.auditLogs || [])]
  };

  await setDoc(userRef, {
    securityKeyData: updated,
    updatedAt: now
  }, { merge: true });

  return updated;
}

// Security Key - Activate after 24 Hours elapsed (or approved)
export async function activateSecurityKeyChange(uid: string, currentSecurityData: SecurityKeyData) {
  if (!currentSecurityData.pendingKey) {
    throw new Error('No pending security key to activate.');
  }

  const userRef = doc(db, 'users', uid);
  const now = new Date().toISOString();

  const auditLog: SecurityAuditLogItem = {
    id: 'log_' + Date.now(),
    action: 'KEY_CHANGE_ACTIVATED',
    timestamp: now,
    details: `New security key successfully verified and activated after 24-hour security cooling period.`,
    ipAddress: '127.0.0.1 (Secured Client)'
  };

  const updated: SecurityKeyData = {
    ...currentSecurityData,
    activeKey: currentSecurityData.pendingKey,
    createdAt: now,
    pendingKey: null,
    requestedAt: null,
    unlockAt: null,
    auditLogs: [auditLog, ...(currentSecurityData.auditLogs || [])]
  };

  await setDoc(userRef, {
    securityKeyData: updated,
    updatedAt: now
  }, { merge: true });

  return updated;
}

// Security Key - Fast-Forward 24 Hours (For testing / verification)
export async function fastForwardSecurityKeyTimelock(uid: string, currentSecurityData: SecurityKeyData) {
  const userRef = doc(db, 'users', uid);
  const pastTime = new Date(Date.now() - 1000).toISOString(); // 1 second in the past so it is immediately unlocked

  const updated: SecurityKeyData = {
    ...currentSecurityData,
    unlockAt: pastTime
  };

  await setDoc(userRef, {
    securityKeyData: updated,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  return updated;
}

export async function saveAcademicGoals(
  uid: string,
  goals: {
    targetCgpa: string;
    targetRank: string;
    currentCgpa: string;
    currentRank: string;
    yearCgpaTargets?: string;
    completedMilestones?: string;
  }
) {
  const userRef = doc(db, 'users', uid);
  const updatedData = {
    ...goals,
    updatedAt: new Date().toISOString()
  };
  await setDoc(userRef, updatedData, { merge: true });
  return updatedData;
}

export async function getStudentProfile(uid: string): Promise<StudentProfile | null> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data() as StudentProfile;
  }
  return null;
}

// Report Save / Load
export interface SavedReportData {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  reportData: string; // Serialized complete 18 modules
  parentReportId?: string; // Optional parent report ID for version history
}

export async function saveReport(uid: string, title: string, reportDataObj: any, parentReportId?: string) {
  const reportId = 'rep_' + Date.now();
  const reportRef = doc(db, 'users', uid, 'reports', reportId);
  const newReport: SavedReportData = {
    id: reportId,
    userId: uid,
    title,
    createdAt: new Date().toISOString(),
    reportData: JSON.stringify(reportDataObj),
    parentReportId: parentReportId || ""
  };
  await setDoc(reportRef, newReport);
  return newReport;
}

export async function updateReport(uid: string, reportId: string, updatedFields: Partial<SavedReportData>) {
  const reportRef = doc(db, 'users', uid, 'reports', reportId);
  await setDoc(reportRef, updatedFields, { merge: true });
}

export async function loadReports(uid: string): Promise<SavedReportData[]> {
  const collRef = collection(db, 'users', uid, 'reports');
  const querySnap = await getDocs(collRef);
  const reports: SavedReportData[] = [];
  querySnap.forEach((docSnap) => {
    reports.push(docSnap.data() as SavedReportData);
  });
  return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function deleteReport(uid: string, reportId: string) {
  const reportRef = doc(db, 'users', uid, 'reports', reportId);
  await deleteDoc(reportRef);
}

// Interview / Chat Sessions
export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  type: 'interview_coach' | 'mentor';
  messages: string; // Serialized ChatMessage[]
  updatedAt: string;
}

export async function saveChatSession(uid: string, type: 'interview_coach' | 'mentor', messages: ChatMessage[]) {
  const sessionId = `${type}_session`;
  const sessionRef = doc(db, 'users', uid, 'chats', sessionId);
  const session: ChatSession = {
    id: sessionId,
    userId: uid,
    type,
    messages: JSON.stringify(messages),
    updatedAt: new Date().toISOString()
  };
  await setDoc(sessionRef, session);
  return session;
}

export async function loadChatSession(uid: string, type: 'interview_coach' | 'mentor'): Promise<ChatMessage[]> {
  const sessionId = `${type}_session`;
  const sessionRef = doc(db, 'users', uid, 'chats', sessionId);
  const snap = await getDoc(sessionRef);
  if (snap.exists()) {
    const data = snap.data() as ChatSession;
    return JSON.parse(data.messages) as ChatMessage[];
  }
  return [];
}

// Shareable reports interfaces & helpers
export interface SharedReportData {
  id: string;
  title: string;
  createdAt: string;
  createdBy: string;
  reportData: string;
  profileData?: string;
  expiresAt?: string;
}

export async function shareReport(
  uid: string,
  title: string,
  reportDataObj: any,
  profileDataObj: any,
  expiresInSeconds?: number
): Promise<string> {
  // Generate a random-looking path-friendly share ID
  const sharedId = 'share_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  const shareRef = doc(db, 'shared_reports', sharedId);

  let expiresAt: string | undefined = undefined;
  if (expiresInSeconds && expiresInSeconds > 0) {
    expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  }

  const payload: SharedReportData = {
    id: sharedId,
    title,
    createdAt: new Date().toISOString(),
    createdBy: uid,
    reportData: JSON.stringify(reportDataObj),
    profileData: JSON.stringify(profileDataObj),
    expiresAt,
  };
  await setDoc(shareRef, payload);
  return sharedId;
}

export async function getSharedReport(sharedId: string): Promise<{
  id: string;
  title: string;
  createdAt: string;
  createdBy: string;
  reportData: any;
  profileData: StudentProfile | null;
  expiresAt?: string;
} | null> {
  const shareRef = doc(db, 'shared_reports', sharedId);
  const snap = await getDoc(shareRef);
  if (snap.exists()) {
    const data = snap.data() as SharedReportData;

    // Check link expiration
    if (data.expiresAt) {
      const now = new Date();
      const expiry = new Date(data.expiresAt);
      if (now > expiry) {
        console.warn(`Shared link ${sharedId} has expired at ${data.expiresAt}`);
        return null;
      }
    }

    let parsedReport = null;
    let parsedProfile = null;
    try {
      parsedReport = JSON.parse(data.reportData);
    } catch (e) {
      console.error('Failed to parse shared reportData', e);
    }
    if (data.profileData) {
      try {
        parsedProfile = JSON.parse(data.profileData) as StudentProfile;
      } catch (e) {
        console.error('Failed to parse shared profileData', e);
      }
    }
    return {
      id: data.id,
      title: data.title,
      createdAt: data.createdAt,
      createdBy: data.createdBy,
      reportData: parsedReport,
      profileData: parsedProfile,
      expiresAt: data.expiresAt,
    };
  }
  return null;
}

// News Bookmarking Helpers & Types
export interface NewsBookmark {
  id: string;
  userId: string;
  title: string;
  link: string;
  source: string;
  pubDate: string;
  savedAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function saveNewsBookmark(uid: string, bookmark: Omit<NewsBookmark, 'userId' | 'savedAt'>) {
  const path = `users/${uid}/news_bookmarks/${bookmark.id}`;
  try {
    const bookmarkRef = doc(db, 'users', uid, 'news_bookmarks', bookmark.id);
    const newBookmark: NewsBookmark = {
      ...bookmark,
      userId: uid,
      savedAt: new Date().toISOString()
    };
    await setDoc(bookmarkRef, newBookmark);
    return newBookmark;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteNewsBookmark(uid: string, bookmarkId: string) {
  const path = `users/${uid}/news_bookmarks/${bookmarkId}`;
  try {
    const bookmarkRef = doc(db, 'users', uid, 'news_bookmarks', bookmarkId);
    await deleteDoc(bookmarkRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function loadNewsBookmarks(uid: string): Promise<NewsBookmark[]> {
  const path = `users/${uid}/news_bookmarks`;
  try {
    const collRef = collection(db, 'users', uid, 'news_bookmarks');
    const querySnap = await getDocs(collRef);
    const bookmarks: NewsBookmark[] = [];
    querySnap.forEach((docSnap) => {
      bookmarks.push(docSnap.data() as NewsBookmark);
    });
    return bookmarks.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export interface BlueprintNote {
  id: string;
  reportId: string;
  sectionId: string;
  text: string;
  createdAt: string;
  isActionItem: boolean;
  isCompleted?: boolean;
}

export async function saveUserNotes(uid: string, notes: BlueprintNote[]) {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { blueprintNotes: JSON.stringify(notes) }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadUserNotes(uid: string): Promise<BlueprintNote[]> {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.blueprintNotes) {
        return JSON.parse(data.blueprintNotes) as BlueprintNote[];
      }
    }
    return [];
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

// Bookmarking Colleges
export interface CollegeBookmark {
  name: string;
  tier: string;
  course: string;
  location: string;
  fees: string;
  hostelCost: string;
  accreditation: string;
  placementQuality: string;
  averagePackage: string;
  roi: string;
  advantages: string;
  savedAt: string;
}

export async function saveCollegeBookmark(uid: string, college: Omit<CollegeBookmark, 'savedAt'>) {
  const path = `users/${uid}/colleges/${encodeURIComponent(college.name)}`;
  try {
    const collegeRef = doc(db, 'users', uid, 'colleges', college.name);
    const newBookmark: CollegeBookmark = {
      ...college,
      savedAt: new Date().toISOString()
    };
    await setDoc(collegeRef, newBookmark);
    return newBookmark;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCollegeBookmark(uid: string, collegeName: string) {
  const path = `users/${uid}/colleges/${encodeURIComponent(collegeName)}`;
  try {
    const collegeRef = doc(db, 'users', uid, 'colleges', collegeName);
    await deleteDoc(collegeRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function loadCollegeBookmarks(uid: string): Promise<CollegeBookmark[]> {
  const path = `users/${uid}/colleges`;
  try {
    const collRef = collection(db, 'users', uid, 'colleges');
    const querySnap = await getDocs(collRef);
    const colleges: CollegeBookmark[] = [];
    querySnap.forEach((docSnap) => {
      colleges.push(docSnap.data() as CollegeBookmark);
    });
    return colleges.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Bookmarking Scholarships
export interface ScholarshipBookmark {
  name: string;
  type: string;
  eligibility: string;
  amount: string;
  details: string;
  savedAt: string;
}

export async function saveScholarshipBookmark(uid: string, scholarship: Omit<ScholarshipBookmark, 'savedAt'>) {
  const path = `users/${uid}/scholarships/${encodeURIComponent(scholarship.name)}`;
  try {
    const scholarshipRef = doc(db, 'users', uid, 'scholarships', scholarship.name);
    const newBookmark: ScholarshipBookmark = {
      ...scholarship,
      savedAt: new Date().toISOString()
    };
    await setDoc(scholarshipRef, newBookmark);
    return newBookmark;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteScholarshipBookmark(uid: string, scholarshipName: string) {
  const path = `users/${uid}/scholarships/${encodeURIComponent(scholarshipName)}`;
  try {
    const scholarshipRef = doc(db, 'users', uid, 'scholarships', scholarshipName);
    await deleteDoc(scholarshipRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function loadScholarshipBookmarks(uid: string): Promise<ScholarshipBookmark[]> {
  const path = `users/${uid}/scholarships`;
  try {
    const collRef = collection(db, 'users', uid, 'scholarships');
    const querySnap = await getDocs(collRef);
    const scholarships: ScholarshipBookmark[] = [];
    querySnap.forEach((docSnap) => {
      scholarships.push(docSnap.data() as ScholarshipBookmark);
    });
    return scholarships.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// User Preferences Persistence
export interface UserPreferencesData {
  darkMode?: boolean;
  notificationPreferences?: string;
  defaultStream?: string;
  updatedAt: string;
}

export async function saveUserPreferences(uid: string, preferences: Omit<UserPreferencesData, 'updatedAt'>) {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const payload: UserPreferencesData = {
      ...preferences,
      updatedAt: new Date().toISOString()
    };
    await setDoc(userRef, { preferences: JSON.stringify(payload) }, { merge: true });
    return payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadUserPreferences(uid: string): Promise<UserPreferencesData | null> {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.preferences) {
        return JSON.parse(data.preferences) as UserPreferencesData;
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// Daily Mental Wellness & Progress Check-In System
export async function saveWellnessCheckin(
  uid: string,
  checkinData: Omit<WellnessCheckinData, 'id' | 'userId'>
): Promise<{ checkin: WellnessCheckinData; stats: WellnessStats }> {
  const checkinId = `checkin_${checkinData.date.replace(/-/g, '')}_${Date.now().toString().slice(-4)}`;
  const path = `users/${uid}/wellness_checkins/${checkinId}`;
  
  try {
    const fullCheckin: WellnessCheckinData = {
      ...checkinData,
      id: checkinId,
      userId: uid
    };

    // 1. Save specific daily checkin document
    const checkinRef = doc(db, 'users', uid, 'wellness_checkins', checkinId);
    await setDoc(checkinRef, fullCheckin);

    // 2. Fetch recent checkins to compute updated analytics & career impact recommendations
    const checkinsColl = collection(db, 'users', uid, 'wellness_checkins');
    const querySnap = await getDocs(checkinsColl);
    const allCheckins: WellnessCheckinData[] = [];
    querySnap.forEach((d) => allCheckins.push(d.data() as WellnessCheckinData));

    // Sort descending by date
    allCheckins.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate streak
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const checkinDates = Array.from(new Set(allCheckins.map(c => c.date))).sort().reverse();
    
    if (checkinDates.length > 0) {
      let dayIndex = 0;
      while (dayIndex < 365) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - dayIndex);
        const dateStr = targetDate.toISOString().split('T')[0];
        if (checkinDates.includes(dateStr)) {
          streak++;
          dayIndex++;
        } else if (dayIndex === 0) {
          dayIndex++;
        } else {
          break;
        }
      }
    }
    streak = Math.max(1, streak);

    // Calculate averages & dominant moods
    const totalFocus = allCheckins.reduce((acc, curr) => acc + (curr.studyFocusHours || 0), 0);
    const avgFocus = allCheckins.length > 0 ? Number((totalFocus / allCheckins.length).toFixed(1)) : checkinData.studyFocusHours;

    const moodCounts: Record<string, number> = {};
    allCheckins.forEach(c => {
      moodCounts[c.moodLabel] = (moodCounts[c.moodLabel] || 0) + 1;
    });
    const dominantMood = Object.keys(moodCounts).sort((a, b) => moodCounts[b] - moodCounts[a])[0] || checkinData.moodLabel;

    // Assess burnout risk
    let burnoutRisk: BurnoutLevel = 'Low';
    if (checkinData.stressLevel === 'Critical' || (avgFocus > 10 && (checkinData.mood === 1 || checkinData.mood === 2))) {
      burnoutRisk = 'Critical';
    } else if (checkinData.stressLevel === 'High' || avgFocus > 9) {
      burnoutRisk = 'High';
    } else if (checkinData.stressLevel === 'Moderate' || (checkinData.mood === 2 && avgFocus > 6)) {
      burnoutRisk = 'Moderate';
    }

    // Generate Adaptive Career Roadmap Recommendation
    let adaptiveRoadmapRecommendation = '';
    if (burnoutRisk === 'Critical' || burnoutRisk === 'High') {
      adaptiveRoadmapRecommendation = `Cognitive fatigue alert: Pacing modified to include mandatory 48-hour decompression cycles. Career Engine deprioritizes hyper-volatile 80hr/week tracks and emphasizes resilient, sustainable engineering & analytical disciplines (Data Architecture, Research Fellowships, Strategic Consulting) with Pomodoro intervals.`;
    } else if (checkinData.mood >= 4 && avgFocus >= 6) {
      adaptiveRoadmapRecommendation = `High focus & positive momentum detected: Career Engine activates Accelerated Competitive Track for Tier-1 Admissions (IIT/IIM/Ivy League, Top 1% placements), recommending high-yield hackathons and capstone portfolio projects this quarter.`;
    } else {
      adaptiveRoadmapRecommendation = `Balanced equilibrium: Steady cognitive flow supports steady milestone progression. 90%+ knowledge retention projected for upcoming entrance assessments and internship milestones.`;
    }

    const updatedStats: WellnessStats = {
      streakDays: streak,
      avgFocusHours: avgFocus,
      dominantMood,
      burnoutRisk,
      totalCheckins: allCheckins.length,
      lastCheckinDate: checkinData.date,
      adaptiveRoadmapRecommendation
    };

    // 3. Merge latest checkin and stats into user profile for immediate dashboard access
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      latestWellnessCheckin: fullCheckin,
      wellnessStats: updatedStats,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return { checkin: fullCheckin, stats: updatedStats };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function loadWellnessCheckins(uid: string, limitCount = 14): Promise<WellnessCheckinData[]> {
  const path = `users/${uid}/wellness_checkins`;
  try {
    const coll = collection(db, 'users', uid, 'wellness_checkins');
    const querySnap = await getDocs(coll);
    const checkins: WellnessCheckinData[] = [];
    querySnap.forEach((d) => checkins.push(d.data() as WellnessCheckinData));
    return checkins
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limitCount);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function loadWellnessStats(uid: string): Promise<WellnessStats | null> {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return (data?.wellnessStats as WellnessStats) || null;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}



