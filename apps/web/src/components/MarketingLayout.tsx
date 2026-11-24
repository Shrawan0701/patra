import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HalftoneCanvas } from './HalftoneCanvas';

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div>
      {/* Floating Centered Dark Pill Header */}
      <div className="floating-nav-wrap">
        <div style={{ width: '100%', maxWidth: 820, position: 'relative' }}>
          <header className="floating-nav">
            <Link to="/" className="brand-mark" onClick={() => setMenuOpen(false)}>
              <img src="/patra-logo.png" alt="Patra Logo" />
              <span>Patra</span>
            </Link>

            <nav className="nav-links" aria-label="Primary">
              <NavLink to="/features">Features</NavLink>
              <NavLink to="/templates">Templates</NavLink>
              <NavLink to="/about">About</NavLink>
              <NavLink to="/contact">Contact</NavLink>
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                className="nav-mobile-toggle"
                aria-label="Toggle navigation menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
              <Link to={user ? '/app' : '/login'} className="nav-pill-cta" onClick={() => setMenuOpen(false)}>
                {user ? 'Open Studio' : 'Login'}
              </Link>
            </div>
          </header>

          {menuOpen && (
            <nav className="floating-nav-drawer" aria-label="Mobile menu">
              <NavLink to="/features" onClick={() => setMenuOpen(false)}>Features</NavLink>
              <NavLink to="/templates" onClick={() => setMenuOpen(false)}>Templates</NavLink>
              <NavLink to="/about" onClick={() => setMenuOpen(false)}>About</NavLink>
              <NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink>
            </nav>
          )}
        </div>
      </div>

      <main>{children}</main>

      {/* Monumental Obsidian Closing Footer */}
      <footer className="ol-obsidian-wrap">
        <HalftoneCanvas variant="horizon" />
        <div className="container ol-footer-inner">
          <div className="ol-footer-cols">
            <div>
              <h4>Product</h4>
              <ul>
                <li><Link to="/features">Features</Link></li>
                <li><Link to="/templates">Templates</Link></li>
                <li><Link to="/app">Open Studio</Link></li>
              </ul>
            </div>

            <div>
              <h4>Company</h4>
              <ul>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/careers">Careers</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                <li><Link to={user ? '/app' : '/login'}>{user ? 'Dashboard' : 'Sign In'}</Link></li>
              </ul>
            </div>

            <div>
              <h4>Legal</h4>
              <ul>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="ol-giant-brand">
            <h2 className="ol-giant-wordmark">Patra</h2>
            <span style={{ fontSize: 13, color: 'rgba(244, 246, 249, 0.56)', paddingBottom: 10 }}>
              © {new Date().getFullYear()} Patra
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
