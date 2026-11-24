import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { AuthGlassCanvas } from '../components/AuthGlassCanvas';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-studio-page">
      <section className="auth-art-panel">
        <AuthGlassCanvas variant="login" />
        <div className="auth-art-scrim" />

        <div className="auth-art-top">
          <Link to="/" className="auth-art-brand">
            <img src="/patra-logo.png" alt="Patra Logo" />
            <span>Patra</span>
          </Link>
          <span className="auth-art-index">01 / STUDIO ACCESS</span>
        </div>

        <div className="auth-art-bottom">
          <h2 className="auth-art-headline">Sculptural invitations, folded in light.</h2>
          <p className="auth-art-caption">
            Pick up your 3D architectural stages, wax-seal covers, and single-page cards right where you left off.
          </p>
        </div>
      </section>

      <section className="auth-form-col">
        <div className="auth-form-nav">
          <Link to="/" className="auth-quiet-link">
            <ArrowLeft size={14} /> Home
          </Link>
        </div>

        <div className="auth-form-inner">
          <form className="auth-editorial-form" onSubmit={handleSubmit}>
            <div className="auth-form-header">
              <span className="auth-kicker">SIGN IN</span>
              <h1>Welcome back</h1>
              <p>Enter your studio email and password to continue.</p>
            </div>

            {error && <div className="auth-editorial-error">{error}</div>}

            <div className="field-group">
              <label className="auth-editorial-label" htmlFor="login-email">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                className="auth-editorial-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="field-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="auth-editorial-label" htmlFor="login-pass">
                  Password
                </label>
                <Link to="/forgot-password" className="auth-inline-link">
                  Forgot password?
                </Link>
              </div>
              <div className="auth-editorial-pass">
                <input
                  id="login-pass"
                  type={showPass ? 'text' : 'password'}
                  className="auth-editorial-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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
              {busy ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="auth-switch-note">
              New to Patra?{' '}
              <Link to="/register" className="auth-inline-link">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
