import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { MarketingLayout } from '../components/MarketingLayout';

export function AboutPage() {
  return (
    <MarketingLayout>
      <section className="ol-hero" style={{ minHeight: 'auto', padding: '132px 0 56px' }}>
        <div className="container" style={{ maxWidth: 880 }}>
          <span className="badge-pill">Our Studio</span>
          <h1 className="ol-hero-title" style={{ marginTop: 14 }}>
            Physical paper craft reimagined as living cinema.
          </h1>
          <p className="ol-hero-sub" style={{ maxWidth: 680 }}>
            Patra was created so digital event invitations carry the depth, warmth, and architectural surprise of handmade pop-up stationery.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 880 }}>
          <div className="bento-2">
            <div className="card-glass">
              <h2 style={{ margin: 0, fontSize: 20 }}>Sculptural Storytelling</h2>
              <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5, lineHeight: 1.65 }}>
                Instead of flat slides or generic posters, Patra builds interactive multi-room pavilions with tailored wall silhouettes, garlands, lighting, and custom typography.
              </p>
            </div>
            <div className="card-glass">
              <h2 style={{ margin: 0, fontSize: 20 }}>Seamless Across Devices</h2>
              <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5, lineHeight: 1.65 }}>
                Start an invitation on desktop, refine guest details from your phone, and download crystal-clear videos ready to share across any messenger or social feed.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 36, display: 'flex', gap: 12 }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Try Patra <ArrowRight size={15} />
            </Link>
            <Link to="/contact" className="btn btn-lg">
              Contact Our Team
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
