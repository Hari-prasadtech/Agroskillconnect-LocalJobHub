import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle,
  Loader, RefreshCw, KeyRound, ShieldCheck, ArrowLeft
} from 'lucide-react';
import Navbar from '../components/Navbar';
import axios from '../utils/axios';

// Step 1: Enter email → send OTP
// Step 2: Enter OTP → verify
// Step 3: Enter new password → reset

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 | 2 | 3 | 4 (success)
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  useEffect(() => {
    if (otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer(s => s - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpTimer]);

  const sendOTP = async () => {
    if (!email) { setError('Please enter your email address'); return; }
    setLoading(true); setError('');
    try {
      await axios.post('/api/auth/send-otp', { email, type: 'reset' });
      setStep(2);
      setOtpTimer(60);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally { setLoading(false); }
  };

  const resendOTP = async () => {
    setLoading(true); setError('');
    try {
      await axios.post('/api/auth/send-otp', { email, type: 'reset' });
      setOtpTimer(60);
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to resend OTP.');
    } finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) { setError('Enter the 6-digit OTP sent to your email'); return; }
    setLoading(true); setError('');
    try {
      await axios.post('/api/auth/verify-otp', { email, otp, type: 'reset' });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Incorrect OTP. Please try again.');
    } finally { setLoading(false); }
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      await axios.post('/api/auth/reset-password', { email, otp, newPassword });
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally { setLoading(false); }
  };

  const stepInfo = [
    { num: 1, label: 'Enter Email' },
    { num: 2, label: 'Verify OTP' },
    { num: 3, label: 'New Password' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="gradient-bg pt-20 pb-20 min-h-screen flex items-center relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-primary-400/20 to-accent-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-accent-400/20 to-primary-400/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-md mx-auto px-4 sm:px-6 w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Reset Password</h1>
              <p className="text-primary-100 text-sm mt-1">
                {step === 1 && 'Enter your registered email to receive OTP'}
                {step === 2 && 'Enter the OTP sent to your email'}
                {step === 3 && 'Set your new password'}
                {step === 4 && 'Password changed successfully!'}
              </p>
            </div>

            {/* Step Progress (only steps 1-3) */}
            {step < 4 && (
              <div className="px-8 pt-6 flex items-center gap-2">
                {stepInfo.map((s, i) => (
                  <div key={s.num} className="flex items-center flex-1">
                    <div className={`flex items-center gap-1.5 ${step >= s.num ? 'text-primary-600' : 'text-neutral-400'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                        step > s.num ? 'bg-primary-500 border-primary-500 text-white' :
                        step === s.num ? 'border-primary-500 text-primary-600' :
                        'border-neutral-300 text-neutral-400'
                      }`}>
                        {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
                      </div>
                      <span className="text-xs font-medium hidden sm:block">{s.label}</span>
                    </div>
                    {i < stepInfo.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 rounded transition-colors ${step > s.num ? 'bg-primary-500' : 'bg-neutral-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="px-8 py-6">
              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Step 1 — Email */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendOTP()}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-neutral-200 rounded-xl text-base focus:outline-none focus:border-primary-500 transition-colors"
                        placeholder="yourname@gmail.com"
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-neutral-500 mt-1.5">We'll send a 6-digit OTP to this email</p>
                  </div>
                  <button
                    onClick={sendOTP}
                    disabled={loading || !email}
                    className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-base"
                  >
                    {loading ? <><Loader className="w-5 h-5 animate-spin"/> Sending OTP...</> : <><Mail className="w-5 h-5"/> Send OTP</>}
                  </button>
                </motion.div>
              )}

              {/* Step 2 — OTP */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="text-center bg-primary-50 rounded-xl p-4 border border-primary-100">
                    <Mail className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                    <p className="text-sm text-neutral-700">OTP sent to <strong className="text-primary-700">{email}</strong></p>
                    <p className="text-xs text-neutral-500 mt-1">Check your inbox (and spam folder)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Enter 6-Digit OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={e => { setError(''); setOtp(e.target.value.replace(/\D/g,'').slice(0,6)); }}
                      onKeyDown={e => e.key === 'Enter' && verifyOTP()}
                      placeholder="• • • • • •"
                      maxLength={6}
                      className="w-full px-4 py-4 border-2 border-neutral-200 rounded-xl text-3xl font-mono tracking-[12px] text-center focus:outline-none focus:border-primary-500 transition-colors bg-neutral-50"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={verifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-base"
                  >
                    {loading ? <><Loader className="w-5 h-5 animate-spin"/> Verifying...</> : <><ShieldCheck className="w-5 h-5"/> Verify OTP</>}
                  </button>
                  <div className="text-center">
                    {otpTimer > 0 ? (
                      <p className="text-sm text-neutral-500">Resend OTP in <strong>{otpTimer}s</strong></p>
                    ) : (
                      <button onClick={resendOTP} disabled={loading} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 mx-auto">
                        <RefreshCw className="w-4 h-4"/> Resend OTP
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 3 — New Password */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2 text-green-700 text-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" /> Email verified! Set your new password.
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-3.5 border-2 border-neutral-200 rounded-xl text-base focus:outline-none focus:border-primary-500 transition-colors"
                        placeholder="Minimum 6 characters"
                        autoFocus
                      />
                      <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                        {showPass ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && resetPassword()}
                        className="w-full pl-12 pr-12 py-3.5 border-2 border-neutral-200 rounded-xl text-base focus:outline-none focus:border-primary-500 transition-colors"
                        placeholder="Re-enter new password"
                      />
                      <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                        {showConfirm ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={resetPassword}
                    disabled={loading || !newPassword || !confirmPassword}
                    className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-base"
                  >
                    {loading ? <><Loader className="w-5 h-5 animate-spin"/> Resetting...</> : <><KeyRound className="w-5 h-5"/> Reset Password</>}
                  </button>
                </motion.div>
              )}

              {/* Step 4 — Success */}
              {step === 4 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4 space-y-5">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-1">Password Reset!</h3>
                    <p className="text-neutral-600 text-sm">Your password has been changed successfully. You can now log in with your new password.</p>
                  </div>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 text-base"
                  >
                    <ArrowRight className="w-5 h-5"/> Go to Login
                  </button>
                </motion.div>
              )}

              {step < 4 && (
                <div className="mt-5 text-center">
                  <Link to="/login" className="text-sm text-neutral-500 hover:text-primary-600 flex items-center justify-center gap-1 transition-colors">
                    <ArrowLeft className="w-4 h-4"/> Back to Login
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
