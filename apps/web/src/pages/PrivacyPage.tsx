import React from 'react';
import { MarketingLayout } from '../components/MarketingLayout';

export function PrivacyPage() {
  return (
    <MarketingLayout>
      <section className="section" style={{ paddingTop: 132 }}>
        <div className="container" style={{ maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <span className="badge-pill" style={{ width: 'fit-content' }}>Legal</span>
          <h1 className="ol-hero-title" style={{ margin: '4px 0 8px' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Last updated: November 24, 2026</p>

          <div className="card-glass">
            <h2 style={{ margin: 0, fontSize: 19 }}>1. Information You Provide</h2>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5, lineHeight: 1.65 }}>
              When you create a Patra account, we store your name, email address, securely hashed credentials, saved invitation drafts, and billing history so your designs remain accessible whenever you sign in.
            </p>
          </div>
          <div className="card-glass">
            <h2 style={{ margin: 0, fontSize: 19 }}>2. Your Videos & Invitations</h2>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5, lineHeight: 1.65 }}>
              Your rendered invitation videos save directly to your device downloads or personal downloads library. We never share or publish private celebration details with third parties.
            </p>
          </div>
          <div className="card-glass">
            <h2 style={{ margin: 0, fontSize: 19 }}>3. Payments & Account Security</h2>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5, lineHeight: 1.65 }}>
              Card and digital checkout transactions are handled through encrypted third-party payment partners. Account verification codes are delivered solely for password resets and account security.
            </p>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
