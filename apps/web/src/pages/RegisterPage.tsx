import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { AuthGlassCanvas } from '../components/AuthGlassCanvas';
import { useAuth } from '../context/AuthContext';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Enter your name, email, and a password with at least 6 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register(name.trim(), email.trim(), password, referralCode.trim() || undefined);
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-studio-page auth-studio-page--inverted">
      <section className="auth-form-col">
        <div className="auth-form-nav auth-form-nav--split">
          <Link to="/" className="auth-col-brand">
            <img src="/patra-logo.png" alt="Patra Logo" />
            <span>Patra</span>
          </Link>
          <Link to="/" className="auth-quiet-link">
            <ArrowLeft size={14} /> Home
          </Link>
        </div>

        <div className="auth-form-inner">
          <form className="auth-editorial-form" onSubmit={handleSubmit}>
            <div className="auth-form-header">
              <span className="auth-kicker">NEW CREATOR</span>
              <h1>Create your studio account</h1>
              <p>Design 3D scenes and printable 1-page cards free.</p>
            </div>

            {error && <div className="auth-editorial-error">{error}</div>}

            <div className="field-group">
              <label className="auth-editorial-label" htmlFor="reg-name">
                Full Name
              </label>
              <input
                id="reg-name"
                className="auth-editorial-input"
                placeholder="Aarav Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div className="field-group">
              <label className="auth-editorial-label" htmlFor="reg-email">
                Email Address
              </label>
              <input
                id="reg-email"
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
              <label className="auth-editorial-label" htmlFor="reg-pass">
                Password
              </label>
              <div className="auth-editorial-pass">
                <input
                  id="reg-pass"
                  type={showPass ? 'text' : 'password'}
                  className="auth-editorial-input"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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

            <div className="field-group">
              <label className="auth-editorial-label" htmlFor="reg-ref">
                Friend Referral Code (Optional)
              </label>
              <input
                id="reg-ref"
                className="auth-editorial-input"
                placeholder="e.g. PATRA-ARJU8A"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
              />
            </div>

            <button type="submit" className="auth-obsidian-btn" disabled={busy}>
              {busy ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="auth-switch-note">
              Already have an account?{' '}
              <Link to="/login" className="auth-inline-link">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </section>

      <section className="auth-art-panel">
        <AuthGlassCanvas variant="register" />
        <div className="auth-art-scrim" />

        <div className="auth-art-top">
          <span className="auth-art-index">02 / CREATE ACCOUNT</span>
        </div>

        <div className="auth-art-bottom">
          <h2 className="auth-art-headline">Crafted to be opened, kept, and replayed.</h2>
          <p className="auth-art-caption">
            Build bespoke 3D celebrations across 30 global architectures, floral seals, and studio stationery.
          </p>
        </div>
      </section>
    </div>
  );
}
