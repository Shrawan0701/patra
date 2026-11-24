import React from 'react';
import { MarketingLayout } from '../components/MarketingLayout';

export function TermsPage() {
  return (
    <MarketingLayout>
      <section className="section" style={{ paddingTop: 132 }}>
        <div className="container" style={{ maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <span className="badge-pill" style={{ width: 'fit-content' }}>Legal</span>
          <h1 className="ol-hero-title" style={{ margin: '4px 0 8px' }}>Terms of Service</h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Last updated: November 24, 2026</p>

          <div className="card-glass">
            <h2 style={{ margin: 0, fontSize: 19 }}>1. Invitation Usage</h2>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5, lineHeight: 1.65 }}>
              Every invitation video you download with Patra may be shared freely with your guests, clients, and family across messaging apps and social channels.
            </p>
          </div>
          <div className="card-glass">
            <h2 style={{ margin: 0, fontSize: 19 }}>2. Passes, Subscriptions & Early Upgrades</h2>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5, lineHeight: 1.65 }}>
              Single Passes unlock a high-definition download plus seven days of free typo revisions for that saved invitation. Active monthly or yearly plans carry forward remaining downloads and remaining paid days if you upgrade early.
            </p>
          </div>
          <div className="card-glass">
            <h2 style={{ margin: 0, fontSize: 19 }}>3. Cancellation</h2>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5, lineHeight: 1.65 }}>
              You may cancel auto-renewal at any time inside your Account &amp; Plans page. Existing downloads remain usable until the end of the active billing period.
            </p>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
