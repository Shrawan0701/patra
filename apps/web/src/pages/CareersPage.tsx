import React from 'react';
import { Briefcase, Mail, Sparkles } from 'lucide-react';
import { MarketingLayout } from '../components/MarketingLayout';

export function CareersPage() {
  return (
    <MarketingLayout>
      <section className="ol-hero" style={{ minHeight: 'auto', padding: '150px 0 56px' }}>
        <div className="container" style={{ maxWidth: 880 }}>
          <span className="badge-pill">
            <Sparkles size={13} /> Careers at Patra
          </span>
          <h1 className="ol-hero-title" style={{ marginTop: 14 }}>
            Help shape the future of sculptural invitations.
          </h1>
          <p className="ol-hero-sub" style={{ maxWidth: 640 }}>
            We are a design-driven studio crafting expressive architectural video experiences for meaningful celebrations worldwide.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 880, display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div>
            <h2 className="section-title" style={{ fontSize: 24, marginBottom: 14 }}>
              Open Roles
            </h2>
            <div
              className="card-glass"
              style={{
                padding: '32px 26px',
                alignItems: 'center',
                textAlign: 'center',
                background: 'var(--bg-subtle)',
              }}
            >
              <Briefcase size={26} color="var(--muted)" />
              <h3 style={{ margin: '4px 0 0', fontSize: 18 }}>No open roles right now</h3>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)', maxWidth: 460 }}>
                We do not have any listed openings at the moment, though we always love meeting thoughtful engineers and 3D designers.
              </p>
            </div>
          </div>

          <div className="card-glass" style={{ padding: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={19} color="var(--accent)" />
              <h3 style={{ margin: 0, fontSize: 18 }}>Pitch Your Craft</h3>
            </div>
            <p style={{ margin: 0, fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.65 }}>
              Do you build standout interactive tools, spatial typography, or motion systems? Send a short note with your portfolio to connect for future opportunities.
            </p>
            <div>
              <a
                href="mailto:career@patra.media?subject=Portfolio%20%2F%20Open%20Application"
                className="btn btn-primary"
              >
                <Mail size={15} /> Email Portfolio to career@patra.media
              </a>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
