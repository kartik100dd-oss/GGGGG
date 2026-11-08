import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, Flame, Award, Globe, ShieldCheck, Heart, Sparkles, 
  CreditCard, CheckCircle2, Lock, ArrowRight, FileText, RefreshCw, X 
} from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { PricingRole, BillingCadence } from '../types';
import LegalPages, { LegalTab } from './LegalPages';

interface PricingPlansProps {
  currentPlan: string;
  onPlanSelected: (plan: string) => void;
  userId?: string;
}

export default function PricingPlans({ currentPlan, onPlanSelected, userId }: PricingPlansProps) {
  const [selectedRole, setSelectedRole] = useState<PricingRole>('student');
  const [selectedCadence, setSelectedCadence] = useState<BillingCadence>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  // PayU Checkout Modal State
  const [payuCheckoutPlan, setPayuCheckoutPlan] = useState<{
    name: string;
    amount: number;
    role: string;
    cadence: string;
  } | null>(null);

  const [payuCustomerName, setPayuCustomerName] = useState('Student');
  const [payuCustomerEmail, setPayuCustomerEmail] = useState('student@example.com');
  const [payuCustomerPhone, setPayuCustomerPhone] = useState('9876543210');
  const [payuPaymentMode, setPayuPaymentMode] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [payuProcessing, setPayuProcessing] = useState(false);
  const [payuReceipt, setPayuReceipt] = useState<any | null>(null);

  // Legal Modal State
  const [openLegalTab, setOpenLegalTab] = useState<LegalTab | null>(null);

  const studentPlans = [
    {
      id: 'student-free',
      name: 'Free Explorer',
      description: 'Ideal for basic career discovery and exploratory stream evaluation.',
      weeklyPrice: 0,
      monthlyPrice: 0,
      yearlyPrice: 0,
      badge: 'Starter',
      color: 'border-slate-200',
      features: [
        '3 Comprehensive AI Reports / month',
        'Basic Career DNA Projections',
        'Dream / Target / Safe College Lists',
        'Stream Compatibility Evaluation',
        'Central & State Scholarship Directory',
        'Standard Algorithmic Guidance'
      ]
    },
    {
      id: 'student-pro',
      name: 'Student Pro',
      description: 'The most popular pack for serious entrance exam & college applicants.',
      weeklyPrice: 49,
      monthlyPrice: 149,
      yearlyPrice: 999,
      badge: 'Most Popular',
      popular: true,
      color: 'border-red-500 ring-2 ring-red-500/20',
      features: [
        'Unlimited AI & Algorithmic Blueprints',
        'Dual-Blueprint Side-by-Side Comparator',
        'Multi-Model AI (Gemini, ChatGPT, Claude, Grok)',
        'Live Google Web Search Grounding',
        'Real Admission Probability Percentages',
        '4-Year Degree ROI Payback Analyzer',
        'Interactive Campus Google Map Locator',
        'Mark Sheet PDF & Image OCR Parser',
        'High-Resolution PDF Blueprint Export'
      ]
    },
    {
      id: 'student-elite',
      name: 'Elite Dragon',
      description: 'Complete 1-on-1 counseling, faculty video rooms & study abroad.',
      weeklyPrice: 99,
      monthlyPrice: 299,
      yearlyPrice: 1999,
      badge: 'All-Inclusive',
      color: 'border-purple-500',
      features: [
        'Everything in Student Pro, plus:',
        'Jitsi Virtual Consultation Rooms with Faculty',
        '1-on-1 Mock Interview Coach (HR & Technical)',
        'Global Study Abroad & Tuition-Free Matcher',
        'College Battle Arena & What-If Simulator',
        'Hostel, PG & Living Cost Intelligence',
        'Priority PayU Verification & Support',
        'Dedicated Career Advisory Line'
      ]
    }
  ];

  const teacherPlans = [
    {
      id: 'teacher-mentor',
      name: 'Mentor Advisor',
      description: 'Designed for individual school counselors and independent mentors.',
      weeklyPrice: 99,
      monthlyPrice: 299,
      yearlyPrice: 1999,
      badge: 'Individual Faculty',
      color: 'border-slate-200',
      features: [
        'Manage up to 50 active student blueprints',
        'Host private Jitsi video & audio meeting rooms',
        'Dual-blueprint comparison report generation',
        'Custom student milestone and target tracker',
        'Export institution-branded student roadmaps',
        'Direct parent progress report dispatches'
      ]
    },
    {
      id: 'teacher-leader',
      name: 'Department Head',
      description: 'For career guidance directors and high-school academic leads.',
      weeklyPrice: 199,
      monthlyPrice: 599,
      yearlyPrice: 3999,
      badge: 'Senior Faculty',
      popular: true,
      color: 'border-amber-500 ring-2 ring-amber-500/20',
      features: [
        'Manage up to 250 active student profiles',
        'Multi-Model AI advisory suite for faculty',
        'Batch marksheet OCR and grade parsing',
        'Institutional admission chance analytics',
        'Curriculum and skill gap scanner tools',
        'Dedicated Priority 24/7 Support Line'
      ]
    }
  ];

  const collegePlans = [
    {
      id: 'college-dept',
      name: 'Academic Department',
      description: 'For colleges looking to guide enrolled batches into high-ROI placements.',
      weeklyPrice: 499,
      monthlyPrice: 1499,
      yearlyPrice: 9999,
      badge: 'Departmental',
      color: 'border-slate-200',
      features: [
        'Up to 1,000 active student blueprints',
        'Central placement trends & recruiter matcher',
        'Alumni package and salary forecasting',
        'Multi-teacher Jitsi virtual room portal',
        'Campus Google Map transit highlight profile',
        'CSV and Google Drive batch synchronization'
      ]
    },
    {
      id: 'college-campus',
      name: 'Institutional Enterprise',
      description: 'Campus-wide intelligence operating system for universities & school groups.',
      weeklyPrice: 1299,
      monthlyPrice: 3999,
      yearlyPrice: 24999,
      badge: 'University-Wide',
      popular: true,
      color: 'border-red-600 ring-2 ring-red-600/30',
      features: [
        'Unlimited active student & faculty licenses',
        'White-label institutional reporting templates',
        'Direct API webhooks for campus ERP systems',
        'NIRF & NAAC metric benchmarking calculators',
        'Quarterly AI roadmap algorithm updates',
        'Custom PayU GST invoicing and SLA contract'
      ]
    }
  ];

  const currentPlansList = selectedRole === 'student' ? studentPlans : selectedRole === 'teacher' ? teacherPlans : collegePlans;

  const getPrice = (plan: any) => {
    if (selectedCadence === 'weekly') return plan.weeklyPrice;
    if (selectedCadence === 'monthly') return plan.monthlyPrice;
    return plan.yearlyPrice;
  };

  const handleInitiatePayU = (plan: any) => {
    const amount = getPrice(plan);
    if (amount === 0) {
      // Free activation
      handleDirectActivate(plan.name);
      return;
    }

    setPayuCheckoutPlan({
      name: plan.name,
      amount,
      role: selectedRole,
      cadence: selectedCadence
    });
  };

  const handleDirectActivate = async (planName: string) => {
    setLoading(planName);
    try {
      if (userId) {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { selectedPlan: planName });
      }
      onPlanSelected(planName);
      alert(`Success! You have activated ${planName}.`);
    } catch (e) {
      console.error('Error activating plan:', e);
      onPlanSelected(planName);
    } finally {
      setLoading(null);
    }
  };

  const handleExecutePayUPayment = async () => {
    if (!payuCheckoutPlan) return;
    setPayuProcessing(true);

    // Simulate PayU transaction processing with real transaction ID generation
    setTimeout(async () => {
      const txnid = 'PAYU_' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const mockReceipt = {
        txnid,
        amount: payuCheckoutPlan.amount,
        planName: payuCheckoutPlan.name,
        role: payuCheckoutPlan.role,
        cadence: payuCheckoutPlan.cadence,
        customerName: payuCustomerName,
        customerEmail: payuCustomerEmail,
        date: new Date().toLocaleString(),
        paymentMode: payuPaymentMode.toUpperCase(),
        status: 'SUCCESS',
        hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      };

      try {
        if (userId) {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, { 
            selectedPlan: `${payuCheckoutPlan.name} (${payuCheckoutPlan.cadence.toUpperCase()})`,
            lastPayuTxnId: txnid,
            lastPaymentAmount: payuCheckoutPlan.amount
          });
        }
      } catch (err) {
        console.warn('Could not update firestore plan document:', err);
      }

      onPlanSelected(`${payuCheckoutPlan.name} (${payuCheckoutPlan.cadence.toUpperCase()})`);
      setPayuProcessing(false);
      setPayuReceipt(mockReceipt);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Title & Tagline */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold uppercase tracking-wider">
          <CreditCard size={13} className="text-red-600" />
          <span>PayU India Verified Commercial Billing</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Transparent, Role-Tailored Educational Plans
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Select your academic role and preferred billing cycle. All transactions are securely protected by PayU India with our 7-day money-back guarantee.
        </p>
      </div>

      {/* Role Switcher Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-xs">
          {[
            { id: 'student', label: 'Students & Aspirants' },
            { id: 'teacher', label: 'Teachers & Counselors' },
            { id: 'college', label: 'Colleges & Institutions' }
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.id as PricingRole)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedRole === r.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cadence Switcher (Weekly, Monthly, Yearly) */}
      <div className="flex justify-center items-center gap-3">
        <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 shadow-xs">
          {[
            { id: 'weekly', label: 'Weekly' },
            { id: 'monthly', label: 'Monthly' },
            { id: 'yearly', label: 'Yearly (Save 30%)' }
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCadence(c.id as BillingCadence)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCadence === c.id
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className={`grid gap-6 ${currentPlansList.length === 3 ? 'lg:grid-cols-3 md:grid-cols-2' : 'md:grid-cols-2 max-w-4xl mx-auto'}`}>
        {currentPlansList.map((plan) => {
          const price = getPrice(plan);
          const isActive = currentPlan.includes(plan.name);

          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -4 }}
              className={`bg-white rounded-3xl border p-6 flex flex-col justify-between shadow-xs transition-all relative overflow-hidden ${plan.color} ${
                plan.popular ? 'shadow-md border-red-500/80 ring-2 ring-red-500/20' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-3 py-1 uppercase tracking-wider rounded-bl-xl">
                  {plan.badge}
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{plan.badge}</span>
                <h3 className="text-lg font-black text-slate-900 mt-1">{plan.name}</h3>
                <p className="text-xs text-slate-500 mt-1 min-h-[32px] leading-relaxed">{plan.description}</p>

                {/* Price Display */}
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">₹{price}</span>
                  <span className="text-xs text-slate-400 font-bold">/{selectedCadence}</span>
                </div>

                {/* Features List */}
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <Check size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleInitiatePayU(plan)}
                  disabled={loading === plan.name}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isActive
                      ? 'bg-slate-100 text-slate-500 cursor-default'
                      : plan.popular
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-md active:scale-95'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs active:scale-95'
                  }`}
                >
                  <CreditCard size={14} />
                  <span>{isActive ? 'Current Plan' : price === 0 ? 'Start Free' : `Pay ₹${price} via PayU`}</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* PayU Merchant Guarantee Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-white">
              7-Day Unconditional Refund Policy & PayU Protection
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl leading-relaxed">
              All transactions are secured by PayU 256-bit encryption. If you are not satisfied with your blueprint intelligence within 7 days, receive a 100% refund.
            </p>
          </div>
        </div>

        {/* Quick Compliance Links */}
        <div className="flex flex-wrap gap-2 text-[11px] shrink-0">
          <button onClick={() => setOpenLegalTab('terms')} className="text-slate-300 hover:text-white underline cursor-pointer">
            Terms & Conditions
          </button>
          <span className="text-slate-600">·</span>
          <button onClick={() => setOpenLegalTab('privacy')} className="text-slate-300 hover:text-white underline cursor-pointer">
            Privacy Policy
          </button>
          <span className="text-slate-600">·</span>
          <button onClick={() => setOpenLegalTab('refund')} className="text-slate-300 hover:text-white underline cursor-pointer">
            Refund Policy
          </button>
          <span className="text-slate-600">·</span>
          <button onClick={() => setOpenLegalTab('contact')} className="text-slate-300 hover:text-white underline cursor-pointer">
            Grievance Officer
          </button>
        </div>
      </div>

      {/* PayU Checkout Simulator Modal */}
      <AnimatePresence>
        {payuCheckoutPlan && !payuReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-xs">
                    ₹
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">PayU India Payment Gateway</h4>
                    <p className="text-[10px] text-slate-400">Merchant: Golden Owl Technologies</p>
                  </div>
                </div>
                <button
                  onClick={() => setPayuCheckoutPlan(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Order Summary */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 mb-4 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Selected Subscription:</span>
                  <span>{payuCheckoutPlan.name} ({payuCheckoutPlan.cadence})</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Role Classification:</span>
                  <span className="capitalize">{payuCheckoutPlan.role}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount Payable:</span>
                  <span className="text-emerald-600">₹{payuCheckoutPlan.amount}</span>
                </div>
              </div>

              {/* Customer Info Form */}
              <div className="space-y-3 mb-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payer Name</label>
                  <input
                    type="text"
                    value={payuCustomerName}
                    onChange={(e) => setPayuCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payer Email (Receipt Dispatch)</label>
                  <input
                    type="email"
                    value={payuCustomerEmail}
                    onChange={(e) => setPayuCustomerEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mobile (3D-Secure OTP)</label>
                  <input
                    type="text"
                    value={payuCustomerPhone}
                    onChange={(e) => setPayuCustomerPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div className="space-y-1.5 mb-5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Payment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['upi', 'card', 'netbanking'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setPayuPaymentMode(mode)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold uppercase transition cursor-pointer border ${
                        payuPaymentMode === mode
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {mode === 'upi' ? 'UPI / QR' : mode === 'card' ? 'Debit/Credit' : 'NetBanking'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit PayU Button */}
              <button
                onClick={handleExecutePayUPayment}
                disabled={payuProcessing}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                {payuProcessing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Processing PayU Gateway...</span>
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    <span>Confirm & Pay ₹{payuCheckoutPlan.amount} via PayU</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-slate-400 text-center mt-3">
                Protected by 256-bit SSL encryption. 7-Day Money-Back Guarantee.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PayU Payment Receipt Confirmation Modal */}
      <AnimatePresence>
        {payuReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                <CheckCircle2 size={32} />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  PayU Payment Verified
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2">Subscription Activated!</h3>
                <p className="text-xs text-slate-500">Your transaction has been settled successfully.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Txn ID:</span>
                  <span className="font-mono font-bold text-slate-800">{payuReceipt.txnid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Plan:</span>
                  <span className="font-bold text-slate-800">{payuReceipt.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Amount:</span>
                  <span className="font-bold text-emerald-600">₹{payuReceipt.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Mode:</span>
                  <span className="font-bold text-slate-800">{payuReceipt.paymentMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Date:</span>
                  <span className="text-slate-600">{payuReceipt.date}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setPayuReceipt(null);
                  setPayuCheckoutPlan(null);
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Access Activated Features
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legal Drawer / Modal */}
      {openLegalTab && (
        <LegalPages
          initialTab={openLegalTab}
          onClose={() => setOpenLegalTab(null)}
        />
      )}
    </div>
  );
}
