import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Compass,
  Crown,
  Film,
  Gift,
  Image as ImageIcon,
  Layers,
  LifeBuoy,
  LogOut,
  MailOpen,
  Menu,
  Plus,
  Sparkles,
  SunMoon,
  UserCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    setDrawerOpen(false);
    logout();
    navigate('/login');
  };

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="app-shell">
      {/* Mobile sticky top bar */}
      <header className="app-mobile-bar">
        <button
          type="button"
          className="btn btn-sm"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          style={{ padding: '7px 9px' }}
        >
          <Menu size={17} />
        </button>

        <Link to="/" className="brand-mark">
          <img src="/patra-logo.png" alt="Patra Logo" />
          <span>Patra</span>
        </Link>

        <Link to="/app/editor/custom:wedding:1" className="btn btn-sm btn-primary">
          <Plus size={14} /> New
        </Link>
      </header>

      {drawerOpen && (
        <div className="drawer-backdrop" onClick={closeDrawer} aria-hidden="true" />
      )}

      <aside className={`app-sidebar ${drawerOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Link to="/" className="brand-mark" onClick={closeDrawer}>
              <img src="/patra-logo.png" alt="Patra Logo" />
              <span>Patra</span>
            </Link>
            <button
              type="button"
              className="btn btn-sm sidebar-close-btn"
              aria-label="Close menu"
              onClick={closeDrawer}
              style={{ padding: '6px 8px' }}
            >
              <X size={16} />
            </button>
          </div>

          <Link
            to="/app/editor/custom:wedding:1"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={closeDrawer}
          >
            <Plus size={16} /> New Invitation
          </Link>

          <nav className="side-nav" aria-label="Workspace">
            <NavLink to="/app" end className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`} onClick={closeDrawer}>
              <Compass size={17} /> Explore
            </NavLink>
            <NavLink to="/app/cards" className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`} onClick={closeDrawer}>
              <ImageIcon size={17} /> Cards
            </NavLink>
            <NavLink to="/app/premium-templates" className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`} onClick={closeDrawer}>
              <Crown size={17} /> Premium Templates
            </NavLink>
            <NavLink to="/app/studio" className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`} onClick={closeDrawer}>
              <Layers size={17} /> Studio &amp; Drafts
            </NavLink>
            <NavLink to="/app/wax-seal" className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`} onClick={closeDrawer}>
              <MailOpen size={17} /> Wax Seal
            </NavLink>
            <NavLink to="/app/atmosphere" className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`} onClick={closeDrawer}>
              <SunMoon size={17} /> Atmosphere
            </NavLink>
            <NavLink to="/app/exports" className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`} onClick={closeDrawer}>
              <Film size={17} /> Downloads
            </NavLink>
            <NavLink to="/app/refer" className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`} onClick={closeDrawer}>
              <Gift size={17} /> Refer &amp; Earn
            </NavLink>
            <NavLink to="/app/profile" className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`} onClick={closeDrawer}>
              <UserCircle size={17} /> Account &amp; Plans
            </NavLink>
            <NavLink to="/app/support" className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`} onClick={closeDrawer}>
              <LifeBuoy size={17} /> Support
            </NavLink>
          </nav>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {user && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 4,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12.5 }}>
                <Sparkles size={13} color="var(--accent)" />
                <span>{user.planTier === 'NONE' ? 'Pay-Per-Download' : user.planTier.replace(/_/g, ' ')}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                {user.planExportsRemaining > 0
                  ? `${user.planExportsRemaining} plan downloads left`
                  : `${user.exportCredits} download credits`}
              </div>
            </div>
          )}

          <button type="button" className="btn" onClick={handleLogout} style={{ width: '100%' }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="app-main">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav className="app-bottom-nav" aria-label="Mobile navigation">
        <NavLink to="/app" end className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}>
          <Compass size={18} />
          <span>Explore</span>
        </NavLink>
        <NavLink to="/app/studio" className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}>
          <Layers size={18} />
          <span>Studio</span>
        </NavLink>
        <NavLink to="/app/exports" className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}>
          <Film size={18} />
          <span>Downloads</span>
        </NavLink>
        <NavLink to="/app/refer" className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}>
          <Gift size={18} />
          <span>Refer</span>
        </NavLink>
        <NavLink to="/app/profile" className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}>
          <UserCircle size={18} />
          <span>Account</span>
        </NavLink>
      </nav>
    </div>
  );
}
