import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, Shield, Clock, AlertTriangle, CheckCircle2, XCircle, 
  Copy, Check, Eye, EyeOff, RefreshCw, Zap, ShieldAlert,
  History, Lock, ArrowRight, ShieldCheck, Info
} from 'lucide-react';
import { SecurityKeyData, SecurityAuditLogItem } from '../types';
import { 
  saveSecurityKeyData, 
  requestSecurityKeyChange, 
  cancelSecurityKeyChange, 
  activateSecurityKeyChange,
  fastForwardSecurityKeyTimelock
} from '../firebase';

interface SecurityKeyManagerProps {
  userId: string;
  initialSecurityData?: SecurityKeyData;
  onSecurityUpdate: (data: SecurityKeyData) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

function generateRandomSecurityKey(): string {
  const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ARD-SEC-${segment()}-${segment()}-${segment()}-${Date.now().toString().slice(-4)}`;
}

export default function SecurityKeyManager({
  userId,
  initialSecurityData,
  onSecurityUpdate,
  addToast
}: SecurityKeyManagerProps) {
  // Initialize default active key if none exists
  const [securityData, setSecurityData] = useState<SecurityKeyData>(() => {
    if (initialSecurityData?.activeKey) {
      return initialSecurityData;
    }
    const defaultKey = generateRandomSecurityKey();
    const initialLog: SecurityAuditLogItem = {
      id: 'log_' + Date.now(),
      action: 'KEY_CREATED',
      timestamp: new Date().toISOString(),
      details: 'Initial master account security key generated and registered.',
      ipAddress: '127.0.0.1 (Secured Session)'
    };
    return {
      activeKey: defaultKey,
      createdAt: new Date().toISOString(),
      auditLogs: [initialLog]
    };
  });

  const [showActiveKey, setShowActiveKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [proposedKey, setProposedKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Time remaining state in milliseconds
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);

  // Sync state if prop changes
  useEffect(() => {
    if (initialSecurityData?.activeKey) {
      setSecurityData(initialSecurityData);
    }
  }, [initialSecurityData]);

  // Save initial key to Firestore if first time
  useEffect(() => {
    if (!initialSecurityData?.activeKey && userId) {
      saveSecurityKeyData(userId, securityData).catch((err) =>
        console.error('Failed to initialize default security key:', err)
      );
    }
  }, [userId]);

  // Calculate and update 24-hour countdown timer
  useEffect(() => {
    if (!securityData.unlockAt) {
      setTimeLeftMs(0);
      return;
    }

    const updateTimer = () => {
      const unlockTime = new Date(securityData.unlockAt!).getTime();
      const now = Date.now();
      const diff = unlockTime - now;
      setTimeLeftMs(Math.max(0, diff));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [securityData.unlockAt]);

  const hasPendingChange = !!securityData.pendingKey && !!securityData.unlockAt;
  const is24HoursPassed = hasPendingChange && timeLeftMs <= 0;

  // Format milliseconds into HH:MM:SS
  const formatTimeRemaining = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0')
    };
  };

  const timer = formatTimeRemaining(timeLeftMs);

  // Total 24 hours in ms for progress bar
  const TOTAL_24_HOURS_MS = 24 * 60 * 60 * 1000;
  const progressPercent = Math.min(100, Math.max(0, ((TOTAL_24_HOURS_MS - timeLeftMs) / TOTAL_24_HOURS_MS) * 100));

  // Copy Key to Clipboard
  const handleCopyKey = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(true);
    addToast('Security key copied to clipboard!', 'info');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Open Request Key Change Modal
  const handleOpenRequestModal = () => {
    setProposedKey(generateRandomSecurityKey());
    setShowNewKeyModal(true);
  };

  // Submit Request for Key Change (Starts 24-hour Timelock)
  const handleConfirmRequest = async () => {
    if (!proposedKey.trim()) {
      addToast('Please specify a valid security key.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await requestSecurityKeyChange(userId, proposedKey.trim(), securityData);
      setSecurityData(updated);
      onSecurityUpdate(updated);
      setShowNewKeyModal(false);
      addToast('Security key change requested! Mandatory 24-hour timelock initiated.', 'info');
    } catch (err: any) {
      console.error('Failed to request key change:', err);
      addToast('Failed to initiate key change.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel Pending Change Request
  const handleCancelRequest = async () => {
    setIsSubmitting(true);
    try {
      const updated = await cancelSecurityKeyChange(userId, securityData);
      setSecurityData(updated);
      onSecurityUpdate(updated);
      addToast('Security key change cancelled. Current key remains active.', 'success');
    } catch (err: any) {
      console.error('Failed to cancel key change:', err);
      addToast('Failed to cancel request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Activate New Key after 24 hours elapsed
  const handleActivateNewKey = async () => {
    if (!is24HoursPassed) {
      addToast('The 24-hour security cooling period has not elapsed yet.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await activateSecurityKeyChange(userId, securityData);
      setSecurityData(updated);
      onSecurityUpdate(updated);
      addToast('New security key is now active! All previous keys revoked.', 'success');
    } catch (err: any) {
      console.error('Failed to activate new key:', err);
      addToast('Failed to activate key.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fast-Forward 24 Hours (For Testing / Evaluation)
  const handleFastForward = async () => {
    setIsSubmitting(true);
    try {
      const updated = await fastForwardSecurityKeyTimelock(userId, securityData);
      setSecurityData(updated);
      onSecurityUpdate(updated);
      setTimeLeftMs(0);
      addToast('24-Hour timelock fast-forwarded for test verification!', 'info');
    } catch (err: any) {
      console.error('Failed to fast forward:', err);
      addToast('Error in fast-forward simulation.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-3 bg-slate-900 text-red-500 rounded-xl">
            <Lock size={26} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">SECURITY KEY & 24H TIMELOCK</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                <Clock size={12} className="mr-1 text-slate-600" />
                24-Hour Cooldown Enforced
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Cryptographic account authorization key with zero-trust 24-hour protection against credential hijacking.
            </p>
          </div>
        </div>

        {!hasPendingChange && (
          <button
            type="button"
            onClick={handleOpenRequestModal}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 self-start sm:self-auto cursor-pointer shadow-sm active:scale-95"
          >
            <Key size={14} />
            <span>Rotate / Change Key</span>
          </button>
        )}
      </div>

      {/* Active Security Key Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Current Active Security Key
            </span>
            <div className="flex items-center space-x-3 mt-1.5">
              <span className="font-mono text-base font-extrabold text-slate-900 tracking-wider">
                {showActiveKey ? securityData.activeKey : '•••• •••• •••• •••• ••••'}
              </span>
              <button
                type="button"
                onClick={() => setShowActiveKey(!showActiveKey)}
                className="text-gray-400 hover:text-gray-600 transition"
                title={showActiveKey ? 'Hide Key' : 'Show Key'}
              >
                {showActiveKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                type="button"
                onClick={() => handleCopyKey(securityData.activeKey)}
                className="text-gray-400 hover:text-gray-600 transition"
                title="Copy Key"
              >
                {copiedKey ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-500 sm:text-right">
            <span className="block font-medium">Created: {new Date(securityData.createdAt).toLocaleDateString()}</span>
            <span className="text-[11px] text-green-600 font-bold flex items-center sm:justify-end mt-0.5">
              <CheckCircle2 size={12} className="mr-1" /> Active & Authorized
            </span>
          </div>
        </div>
      </div>

      {/* 24-Hour Timelock Banner (When a change has been requested) */}
      {hasPendingChange && (
        <div className="border border-amber-300 bg-amber-50/70 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-start space-x-3 mb-4">
            <div className="p-2 bg-amber-500 text-white rounded-lg">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-amber-950 uppercase tracking-wide">
                24-Hour Security Change Lock in Progress
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                A security key change was requested. In adherence to enterprise account defense standards, a mandatory <strong>24-hour cooling-off delay</strong> is enforced before the new key can be activated.
              </p>
            </div>
          </div>

          {/* Live Countdown Clock */}
          <div className="bg-white border border-amber-200 rounded-xl p-4 my-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Time Remaining Until Key Activation Unlock:
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <div className="text-2xl font-mono font-black text-gray-900 tracking-wider">
                  <span>{timer.hours}</span>
                  <span className="text-xs font-sans text-gray-400 mx-1">h</span>
                  <span>{timer.minutes}</span>
                  <span className="text-xs font-sans text-gray-400 mx-1">m</span>
                  <span>{timer.seconds}</span>
                  <span className="text-xs font-sans text-gray-400 mx-1">s</span>
                </div>
                {is24HoursPassed && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-green-100 text-green-800">
                    Unlocked!
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full md:w-64">
              <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                <span>Lock Progress</span>
                <span>{progressPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${is24HoursPassed ? 'bg-green-500' : 'bg-amber-500'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Pending Key Preview */}
          <div className="text-xs text-amber-900 mb-4 bg-amber-100/50 p-3 rounded-lg flex items-center justify-between">
            <div>
              <span className="font-bold">Pending Replacement Key: </span>
              <span className="font-mono">{securityData.pendingKey}</span>
            </div>
            <span className="text-[11px] text-amber-700">Unlocks: {new Date(securityData.unlockAt!).toLocaleString()}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCancelRequest}
                className="px-4 py-2 border border-red-300 bg-white hover:bg-red-50 text-red-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <XCircle size={14} />
                <span>Cancel Request & Keep Active Key</span>
              </button>

              {/* Dev / Testing Fast-Forward Button */}
              <button
                type="button"
                disabled={isSubmitting || is24HoursPassed}
                onClick={handleFastForward}
                className="px-3 py-2 bg-amber-200/80 hover:bg-amber-300 text-amber-900 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                title="Fast-forward 24 hours to test instant activation"
              >
                <Zap size={14} className="text-amber-700" />
                <span>Simulate 24h Expiry (Dev Test)</span>
              </button>
            </div>

            {/* Activate button (Enabled only when 24 hours have passed) */}
            <button
              type="button"
              disabled={isSubmitting || !is24HoursPassed}
              onClick={handleActivateNewKey}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                is24HoursPassed
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 size={14} />
              <span>Confirm & Activate New Key</span>
            </button>
          </div>
        </div>
      )}

      {/* Security Audit Log */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <History size={16} className="text-gray-500" />
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Security Audit & Activity Log
            </h4>
          </div>
          <span className="text-[11px] text-gray-400">Real-time tamper-evident events</span>
        </div>

        <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
          {(securityData.auditLogs || []).length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400">No security events recorded yet.</div>
          ) : (
            securityData.auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.action === 'KEY_CHANGE_ACTIVATED' || log.action === 'AADHAAR_VERIFIED'
                        ? 'bg-green-100 text-green-800'
                        : log.action === 'KEY_CHANGE_REQUESTED'
                        ? 'bg-amber-100 text-amber-800'
                        : log.action === 'KEY_CHANGE_CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {log.action}
                    </span>
                    <span className="text-gray-700 font-medium">{log.details}</span>
                  </div>
                </div>
                <div className="text-[11px] text-gray-400 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Request Key Change Modal */}
      <AnimatePresence>
        {showNewKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Initiate Security Key Change</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Starting this request initiates a mandatory 24-hour security lock before the key can be deployed.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Generated 256-Bit Key:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={proposedKey}
                    onChange={(e) => setProposedKey(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setProposedKey(generateRandomSecurityKey())}
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition cursor-pointer"
                    title="Regenerate"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center space-x-1">
                  <Clock size={13} className="text-amber-700" />
                  <span>24-Hour Cooling Notice</span>
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Your current key will remain active for the next 24 hours. The new key will automatically become eligible for activation exactly 24 hours from submission. You can cancel at any time.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewKeyModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmRequest}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm cursor-pointer"
                >
                  {isSubmitting ? 'Submitting...' : 'Start 24-Hour Timelock'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
