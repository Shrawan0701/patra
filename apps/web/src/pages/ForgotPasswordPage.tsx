import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { AuthGlassCanvas } from '../components/AuthGlassCanvas';
import { api } from '../lib/api';

type Step = 'email' | 'otp' | 'password';

const STEP_LIST: { id: Step; label: string }[] = [
  { id: 'email', label: '01 Email' },
  { id: 'otp', label: '02 Code' },
  { id: 'password', label: '03 Password' },
];

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Enter your registered email address.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.forgotPassword(email.trim());
      setInfo(res.message);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send verification code');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setError('Enter the 6-digit code emailed to you.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.verifyOtp(email.trim(), otp.trim());
      setStep('password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code');
    } finally {
      setBusy(false);
    }
  };

  const resetPwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.resetPassword(email.trim(), otp.trim(), newPassword);
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-recovery-page">
      <AuthGlassCanvas variant="forgot" />
      <div className="auth-recovery-scrim" />

      <div className="auth-recovery-topbar">
        <Link to="/" className="auth-art-brand">
          <img src="/patra-logo.png" alt="Patra Logo" />
          <span>Patra</span>
        </Link>
        <span className="auth-art-index">03 / ACCOUNT RECOVERY</span>
      </div>

      <main className="auth-recovery-stage">
        <div className="auth-recovery-card">
          <Link to="/login" className="auth-quiet-link" style={{ width: 'fit-content' }}>
            <ArrowLeft size={14} /> Back to Sign In
          </Link>

          <div className="auth-form-header">
            <span className="auth-kicker">PASSWORD RESET</span>
            <h1>Reset Password</h1>
            <p>
              {step === 'email' && 'We will email a 6-digit verification code to reset your password.'}
              {step === 'otp' && `Enter the 6-digit code sent to ${email}.`}
              {step === 'password' && 'Create a new password for your Patra studio account.'}
            </p>
          </div>

          <div className="auth-step-strip" aria-label="Reset progress">
            {STEP_LIST.map((item) => (
              <span
                key={item.id}
                className={`auth-step-item ${step === item.id ? 'active' : ''}`}
              >
                {item.label}
              </span>
            ))}
          </div>

          {error && <div className="auth-editorial-error">{error}</div>}
          {info && <div className="auth-editorial-info">{info}</div>}

          {step === 'email' && (
            <form onSubmit={sendOtp} className="auth-editorial-form">
              <div className="field-group">
                <label className="auth-editorial-label" htmlFor="fp-email">
                  Email Address
                </label>
                <input
                  id="fp-email"
                  type="email"
                  className="auth-editorial-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="auth-obsidian-btn" disabled={busy}>
                {busy ? 'Sending...' : 'Send 6-Digit OTP'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={verifyCode} className="auth-editorial-form">
              <div className="field-group">
                <label className="auth-editorial-label" htmlFor="fp-otp">
                  6-Digit OTP Code
                </label>
                <input
                  id="fp-otp"
                  className="auth-editorial-input"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="auth-obsidian-btn" disabled={busy}>
                {busy ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={resetPwd} className="auth-editorial-form">
              <div className="field-group">
                <label className="auth-editorial-label" htmlFor="fp-pass">
                  New Password
                </label>
                <div className="auth-editorial-pass">
                  <input
                    id="fp-pass"
                    type={showPass ? 'text' : 'password'}
                    className="auth-editorial-input"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-editorial-eye"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="auth-obsidian-btn" disabled={busy}>
                {busy ? 'Saving...' : 'Save New Password'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
