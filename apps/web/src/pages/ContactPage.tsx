import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Mail, MessageSquare } from 'lucide-react';
import { MarketingLayout } from '../components/MarketingLayout';

export function ContactPage() {
  return (
    <MarketingLayout>
      <section className="ol-hero" style={{ minHeight: 'auto', padding: '150px 0 56px' }}>
        <div className="container" style={{ maxWidth: 880 }}>
          <span className="badge-pill">
            <MessageSquare size={13} /> Support & Studio Inquiries
          </span>
          <h1 className="ol-hero-title" style={{ marginTop: 14 }}>
            Get in touch with Patra.
          </h1>
          <p className="ol-hero-sub" style={{ maxWidth: 640 }}>
            Need help with a bespoke invitation, event planner access, or billing support? Reach our team directly by email.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 880 }}>
          <div className="bento-grid">
            <div className="card-glass">
              <Mail size={20} color="var(--accent)" />
              <h2 style={{ margin: 0, fontSize: 18 }}>Customer Support</h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)' }}>
                Account help, download guidance, and billing questions.
              </p>
              <a
                href="mailto:support@patra.media"
                style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--accent)' }}
              >
                support@patra.media
              </a>
            </div>

            <div className="card-glass">
              <MessageSquare size={20} color="var(--accent)" />
              <h2 style={{ margin: 0, fontSize: 18 }}>Planners & Studios</h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)' }}>
                Custom wedding suites, agencies, and high-volume licenses.
              </p>
              <a
                href="mailto:partners@patra.media"
                style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--accent)' }}
              >
                support@patra.media
              </a>
            </div>

            <div className="card-glass">
              <Clock size={20} color="var(--accent)" />
              <h2 style={{ margin: 0, fontSize: 18 }}>Response Hours</h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)' }}>
                Monday through Saturday, 10:00 AM to 7:00 PM UTC.
              </p>
              <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>Replies within 1 business day</span>
            </div>
          </div>

          <div style={{ marginTop: 36, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/templates" className="btn btn-primary btn-lg">
              Browse Templates <ArrowRight size={15} />
            </Link>
            <Link to="/features" className="btn btn-lg">
              Explore Features
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
