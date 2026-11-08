import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, FileText, Lock, RefreshCw, Mail, Phone, MapPin, X, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';

export type LegalTab = 'terms' | 'privacy' | 'refund' | 'contact';

interface LegalPagesProps {
  initialTab?: LegalTab;
  onClose?: () => void;
}

export default function LegalPages({ initialTab = 'terms', onClose }: LegalPagesProps) {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-sm shadow">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider">
                PayU Merchant Regulatory & Legal Compliance Suite
              </h2>
              <p className="text-[10px] text-slate-400">
                Official terms, privacy, 7-day refund guarantee, and merchant grievance resolution
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 shrink-0 overflow-x-auto">
          {[
            { id: 'terms', label: 'Terms & Conditions', icon: <FileText size={13} /> },
            { id: 'privacy', label: 'Privacy Policy', icon: <Lock size={13} /> },
            { id: 'refund', label: 'Refund & Cancellation Policy', icon: <RefreshCw size={13} /> },
            { id: 'contact', label: 'Contact Us & Grievance', icon: <Building2 size={13} /> }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as LegalTab)}
              className={`py-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === t.id
                  ? 'border-red-600 text-red-600 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs text-slate-700 leading-relaxed bg-white">
          {activeTab === 'terms' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">Terms and Conditions of Service</h3>
                <p className="text-[11px] text-slate-400">Last Updated: November 2026 · Governed by laws of India and PayU Merchant Standards</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-900">1. Acceptance of Terms</h4>
                <p>
                  By accessing, browsing, registering an account, or subscribing to any paid intelligence tier on <strong>AI RED DRAGON (Golden Owl Technologies Division)</strong>, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you disagree with any part of these terms, you must discontinue platform use immediately.
                </p>

                <h4 className="text-xs font-black uppercase text-slate-900">2. Description of Educational Intelligence Services</h4>
                <p>
                  AI RED DRAGON provides algorithmic and artificial intelligence-assisted educational career advisory, admission probability forecasting, college benchmarking, scholarship tracking, student DNA psychometric evaluation, and virtual faculty consultation sessions. All predictions, cutoffs, and ROI payback metrics are computational guidance tools and do not constitute an explicit legal guarantee of college admission or employment placement.
                </p>

                <h4 className="text-xs font-black uppercase text-slate-900">3. User Accounts and Verification</h4>
                <p>
                  Users must provide accurate, current, and complete information during registration. You are solely responsible for maintaining the confidentiality of your account credentials. The platform reserves the right to suspend or terminate accounts that misrepresent academic marks or impersonate academic institutions.
                </p>

                <h4 className="text-xs font-black uppercase text-slate-900">4. Payment Processing via PayU India</h4>
                <p>
                  All commercial payments, including Student, Teacher, and College subscriptions (Weekly, Monthly, and Yearly), are processed securely through <strong>PayU Payments Private Limited</strong>. All card transactions are 256-bit SSL encrypted and adhere to RBI 3D-Secure 2.0 two-factor authentication standards.
                </p>

                <h4 className="text-xs font-black uppercase text-slate-900">5. Intellectual Property</h4>
                <p>
                  All algorithms, software architectures, UI components, brand trademarks, logos, and generated report templates are the exclusive intellectual property of Golden Owl Technologies. Users may download and print individual blueprint reports for personal or institutional advisory use only.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">Privacy & Data Protection Policy</h3>
                <p className="text-[11px] text-slate-400">Compliant with the Digital Personal Data Protection Act (DPDP India) and GDPR Principles</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-900">1. Information We Collect</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Account Identity:</strong> Full name, verified email address, phone number, and avatar provided via Firebase Authentication.</li>
                  <li><strong>Academic Records:</strong> Stream, Class 10 & 12 Board percentages, entrance exam scores (JEE, NEET, CUET, CLAT), and uploaded mark sheets.</li>
                  <li><strong>Counseling Metadata:</strong> Saved blueprints, consultation room notes, simulation what-if parameters, and career interests.</li>
                  <li><strong>Billing Records:</strong> Transaction IDs, payment timestamps, and subscription tier. We <em>never</em> store raw credit/debit card numbers or CVVs on our servers; all payment tokens reside in PayU PCI-DSS certified vaults.</li>
                </ul>

                <h4 className="text-xs font-black uppercase text-slate-900">2. How Your Data Is Utilized</h4>
                <p>
                  Your information is utilized solely to synthesize personalized career roadmaps, generate Student DNA competency scores, match institutional scholarship eligibilities, and facilitate Jitsi virtual consultations with professors. We strictly do not sell, rent, or trade your personal academic data to third-party telemarketers or coaching institutes.
                </p>

                <h4 className="text-xs font-black uppercase text-slate-900">3. Data Retention and Right to Deletion</h4>
                <p>
                  Users may at any time delete their student profile or individual saved blueprint reports directly from their dashboard. Deletion permanently erases your records from our Google Cloud Firestore datastore within 24 hours.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'refund' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">Refund, Cancellation & Delivery Policy</h3>
                <p className="text-[11px] text-slate-400">PayU Merchant Guidelines · 7-Day Unconditional Money-Back Guarantee</p>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-xs font-black text-emerald-900">7-Day Unconditional Money-Back Guarantee</h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    If AI RED DRAGON does not significantly improve your clarity regarding career options, college admissions, or financial ROI, you are entitled to a 100% refund within 7 days of purchase. No questions asked.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-900">1. Digital Delivery Policy</h4>
                <p>
                  All subscription features, including Multi-Model AI processing, Jitsi faculty consultation rooms, marksheet parsing, and unlimited blueprint generation, are delivered digitally and activated immediately upon confirmation from the PayU payment gateway.
                </p>

                <h4 className="text-xs font-black uppercase text-slate-900">2. Cancellation Policy</h4>
                <p>
                  You can cancel your recurring Weekly, Monthly, or Yearly subscription at any time directly through your dashboard settings. Upon cancellation, your access remains active until the end of the current billing cycle, with zero further charges.
                </p>

                <h4 className="text-xs font-black uppercase text-slate-900">3. Refund Initiation and Processing Timelines</h4>
                <p>
                  To request a refund within 7 days of your payment, email <strong>kartik100dd@gmail.com</strong> or our Grievance Officer with your PayU Transaction ID. Approved refunds are credited directly back to the original source bank account, UPI ID, or credit card within <strong>5 to 7 business days</strong> as per standard banking protocol.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">Contact Us & Grievance Redressal Officer</h3>
                <p className="text-[11px] text-slate-400">Mandatory PayU Merchant Identification & Customer Care Information</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="text-[10px] font-bold uppercase text-red-600 block">Registered Merchant Office</span>
                  <div className="flex items-start gap-2 text-xs">
                    <Building2 size={16} className="text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Golden Owl Technologies Division</strong>
                      <p className="text-slate-500 mt-0.5">AI RED DRAGON Educational Intelligence Suite</p>
                      <p className="text-slate-500">Tech Innovation Hub, Connaught Place</p>
                      <p className="text-slate-500">New Delhi - 110001, India</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="text-[10px] font-bold uppercase text-red-600 block">Direct Customer Support</span>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail size={14} className="text-slate-400" />
                      <span>support@aireddragon.edu / kartik100dd@gmail.com</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone size={14} className="text-slate-400" />
                      <span>+91 98100 XXXXX (Customer Care Mon-Sat 9AM-7PM IST)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-slate-200 rounded-2xl space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-900">Grievance Redressal Officer</h4>
                <p className="text-slate-600">
                  In accordance with the Information Technology Act 2000 and the Consumer Protection (E-Commerce) Rules:
                </p>
                <div className="text-xs space-y-1 font-medium text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p><strong>Designation:</strong> Head of Grievance Redressal & Student Advocacy</p>
                  <p><strong>Email:</strong> grievance@aireddragon.edu (Response SLA: 48 hours)</p>
                  <p><strong>Resolution SLA:</strong> All complaints resolved within 15 business days.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-slate-400">Golden Owl Technologies © 2026. All rights reserved. PayU India Verified Partner.</p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition hover:bg-slate-800 cursor-pointer"
            >
              Close Policies
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
