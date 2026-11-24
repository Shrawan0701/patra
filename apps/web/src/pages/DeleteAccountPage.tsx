import React from 'react';
import { MarketingLayout } from '../components/MarketingLayout';

export function DeleteAccountPage() {
  return (
    <MarketingLayout>
      <section className="section" style={{ paddingTop: 132 }}>
        <div className="container" style={{ maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <span className="badge-pill" style={{ width: 'fit-content' }}>Account &amp; Privacy</span>
          <h1 className="ol-hero-title" style={{ margin: '4px 0 8px' }}>
            Delete Your Patra Account
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Applies to Patra (patra.media) and the Patra Android &amp; iOS mobile applications.
          </p>

          <div className="card-glass">
            <h2 style={{ margin: 0, fontSize: 19 }}>1. How to Request Account Deletion</h2>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5, lineHeight: 1.65 }}>
              To permanently delete your Patra account and associated data, send an email to{' '}
              <a href="mailto:support@patra.media?subject=Delete%20My%20Patra%20Account" style={{ fontWeight: 600 }}>
                support@patra.media
              </a>{' '}
              from the email address registered on your Patra account with the subject line{' '}
              <strong>Delete My Patra Account</strong>.
            </p>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5, lineHeight: 1.65 }}>
              We verify ownership of the account and complete deletion requests within 7 business days.
            </p>
          </div>

          <div className="card-glass">
            <h2 style={{ margin: 0, fontSize: 19 }}>2. Data Permanently Deleted</h2>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5, lineHeight: 1.65 }}>
              Once your deletion request is processed, we permanently erase your Patra user profile (name, email, hashed password, and referral code), saved 3D invitation drafts, custom images uploaded inside drafts, download history records, notification tokens, and remaining download credits.
            </p>
          </div>

          <div className="card-glass">
            <h2 style={{ margin: 0, fontSize: 19 }}>3. Data Retained for Legal Compliance</h2>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5, lineHeight: 1.65 }}>
              Minimum payment transaction metadata and tax/billing records required by law or payment processor rules may be retained in anonymized form for statutory financial compliance, and are never used for marketing or account recovery.
            </p>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
