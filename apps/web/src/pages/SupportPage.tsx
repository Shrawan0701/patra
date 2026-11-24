import React from 'react';
import { Clock, LifeBuoy, Mail } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';

export function SupportPage() {
  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 780 }}>
        <div>
          <span className="badge-pill">
            <LifeBuoy size={13} /> Help & Support
          </span>
          <h1 style={{ margin: '10px 0 4px', fontSize: 30, fontWeight: 700 }}>Patra Support</h1>
          <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5 }}>
            Questions about your video download, templates, or subscription plan? Reach our team anytime.
          </p>
        </div>

        <div className="card-glass" style={{ padding: 26, gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 6,
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mail size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>Direct Email Support</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                Typical response within one business day
              </div>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.65 }}>
            Write to us with your account email or project title and we will help resolve any issue right away.
          </p>

          <div
            style={{
              padding: 14,
              borderRadius: 4,
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>SUPPORT EMAIL</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>support@patra.media</div>
            </div>
            <a href="mailto:support@patra.media?subject=Patra%20Support%20Request" className="btn btn-primary">
              <Mail size={15} /> Email Support
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)' }}>
            <Clock size={14} /> Support Hours: Monday to Saturday, 10:00 AM to 7:00 PM UTC
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
