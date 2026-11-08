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

export type MoodRating = 1 | 2 | 3 | 4 | 5;
export type BurnoutLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export interface WellnessCheckinData {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  mood: MoodRating;
  moodLabel: string; // e.g. 'Exhausted' | 'Stressed' | 'Steady' | 'Confident' | 'Unstoppable'
  studyFocusHours: number; // e.g. 6.5
  energyLevel: number; // 0 - 100
  focusSubject: string;
  stressLevel: BurnoutLevel;
  reflectionNote: string;
  careerImpactInsight: string;
}

export interface WellnessStats {
  streakDays: number;
  avgFocusHours: number;
  dominantMood: string;
  burnoutRisk: BurnoutLevel;
  totalCheckins: number;
  lastCheckinDate?: string;
  adaptiveRoadmapRecommendation?: string;
}

export interface AadhaarVerificationData {
  verified: boolean;
  maskedNumber: string; // e.g. "•••• •••• 6012"
  holderName: string;
  dob: string;
  gender: string;
  state: string;
  verifiedAt: string;
  verificationId: string;
  documentUploaded?: boolean;
  documentName?: string;
}

export interface SecurityAuditLogItem {
  id: string;
  action: 'KEY_CREATED' | 'KEY_CHANGE_REQUESTED' | 'KEY_CHANGE_CANCELLED' | 'KEY_CHANGE_ACTIVATED' | 'AADHAAR_VERIFIED';
  timestamp: string;
  details: string;
  ipAddress?: string;
}

export interface SecurityKeyData {
  activeKey: string;
  createdAt: string;
  lastUsedAt?: string;
  pendingKey?: string | null;
  requestedAt?: string | null;
  unlockAt?: string | null; // exactly 24 hours after requestedAt
  auditLogs: SecurityAuditLogItem[];
}

export interface StudentDnaScore {
  academic: number;
  leadership: number;
  communication: number;
  innovation: number;
  research: number;
  entrepreneurship: number;
  problemSolving: number;
}

export interface CareerRecommendation {
  title: string;
  futureDemand: string;
  growthPotential: string;
  requiredSkills: string[];
  degreePath: string;
  salaryOutlook: string;
  aiRisk: string;
}

export interface CollegeInfo {
  name: string;
  tier: 'Dream' | 'Target' | 'Safe';
  course: string;
  location: string;
  fees: string;
  hostelCost: string;
  accreditation: string;
  placementQuality: string;
  averagePackage: string;
  roi: string;
  advantages: string;
}

export interface AdmissionChance {
  collegeName: string;
  category: 'Dream' | 'Reach' | 'Target' | 'Safe';
  probability: string;
  reasoning: string;
}

export interface Scholarship {
  name: string;
  type: 'Government' | 'State' | 'Merit' | 'Sports' | 'Private';
  eligibility: string;
  amount: string;
  details: string;
}

export interface RoiAnalysis {
  totalInvestment: string;
  expectedAnnualSalary: string;
  paybackPeriodMonths: string;
  rating: string;
  breakdown: string;
}

export interface LocationInfo {
  summary: string;
  distanceKm: string;
  nearestTransport: string;
  pgAndHostels: string;
  connectionScore: number;
}

export interface CostOfLiving {
  monthlyRent: string;
  monthlyFood: string;
  monthlyTransport: string;
  monthlyMisc: string;
  annualTotal: string;
}

export interface PlacementOutlook {
  industryEcosystem: string;
  entrySalary: string;
  midCareerSalary: string;
  majorHiringSectors: string[];
}

export interface SkillGapAnalysis {
  identifiedGaps: string[];
  certifications: string[];
  recommendedCourses: string[];
  targetProjects: string[];
}

export interface SuccessRoadmapStep {
  year: string;
  focus: string;
  skills: string[];
  milestones: string[];
}

export interface ParentSummary {
  totalFees: string;
  safetyDetails: string;
  hostelSafety: string;
  placementGuarantee: string;
  careerROI: string;
}

export interface IntelligenceReport {
  executiveSummary: string;
  studentDna: {
    scores: StudentDnaScore;
    analysis: string;
  };
  streamEvaluation: {
    currentSuitability: string;
    alternativePaths: string[];
    recommendations: string;
  };
  careerDNA: CareerRecommendation[];
  colleges: CollegeInfo[];
  admissionChances: AdmissionChance[];
  scholarships: Scholarship[];
  roiAnalyzer: RoiAnalysis;
  locationIntelligence: LocationInfo;
  costOfLiving: CostOfLiving;
  placementOutlook: PlacementOutlook;
  skillGapAnalysis: SkillGapAnalysis;
  successRoadmap: SuccessRoadmapStep[];
  parentSummary: ParentSummary;
  studyAbroad: {
    countries: string[];
    universities: { name: string; cost: string; rating: string }[];
    guidance: string;
  };
  careerTrends?: CareerTrends;
}

export interface CareerTrendItem {
  title: string;
  demandDirection: 'Surging' | 'Stable' | 'Declining';
  growthRate: string;
  description: string;
  keyEnablers: string[];
}

export interface CareerTrends {
  marketOutlookSummary: string;
  emergingRoles: string[];
  shifts: CareerTrendItem[];
}

export interface NewsBookmark {
  id: string;
  userId: string;
  title: string;
  link: string;
  source: string;
  pubDate: string;
  savedAt: string;
}

export type MultiModelPersona = 'gemini' | 'chatgpt' | 'claude' | 'grok';

export interface MultiModelMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model: MultiModelPersona;
  timestamp: string;
  groundingUrls?: { title: string; uri: string }[];
  mediaAttachment?: {
    name: string;
    type: 'image' | 'pdf' | 'audio' | 'video';
    dataUrl: string;
  };
}

export interface FacultyMember {
  id: string;
  name: string;
  title: string;
  institution: string;
  domain: 'STEM & AI' | 'Medicine & Bio' | 'Commerce & Finance' | 'Law & Humanities' | 'Design & Media';
  experienceYears: number;
  rating: number;
  reviewsCount: number;
  expertise: string[];
  bio: string;
  isOnline: boolean;
  avatarUrl: string;
  jitsiRoomId: string;
}

export type PricingRole = 'student' | 'teacher' | 'college';
export type BillingCadence = 'weekly' | 'monthly' | 'yearly';

export interface PayUPlanTier {
  id: string;
  role: PricingRole;
  name: string;
  tagline: string;
  popular?: boolean;
  priceWeekly: number;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
}

export interface CampusLocation {
  id: string;
  name: string;
  state: string;
  city: string;
  lat: number;
  lng: number;
  tier: 'Dream' | 'Target' | 'Safe';
  topCourse: string;
  avgFees: string;
  avgPlacement: string;
  nearestMetroStation: string;
  distanceFromAirportKm: number;
  hostelAvailability: string;
  description: string;
}


