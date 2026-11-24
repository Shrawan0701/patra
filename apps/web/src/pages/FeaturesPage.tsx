import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Film, Layers, Move, Music, Palette, Type } from 'lucide-react';
import { FONT_STYLES, MUSIC_TRACKS, STRUCTURES } from '@patra/shared';
import { MarketingLayout } from '../components/MarketingLayout';

export function FeaturesPage() {
  return (
    <MarketingLayout>
      <section className="ol-hero" style={{ minHeight: 'auto', padding: '132px 0 64px' }}>
        <div className="container">
          <span className="badge-pill">Platform Capabilities</span>
          <h1 className="ol-hero-title" style={{ marginTop: 14, maxWidth: 780 }}>
            Every architectural detail, soundtrack, and camera glide built in.
          </h1>
          <p className="ol-hero-sub" style={{ maxWidth: 640 }}>
            Patra brings together expressive pop-up structures, customizable typography, and synchronized celebration music in one studio.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container bento-2">
          <div className="card-glass">
            <Layers size={22} color="var(--accent)" />
            <h2 style={{ margin: 0, fontSize: 20 }}>Five Folding Structures & Unfolds</h2>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5 }}>
              Select the silhouette that fits your event: {STRUCTURES.map((s) => `${s.name} (${s.unfoldLabel})`).join(', ')}. Switch dynamically between 2 Wings, 3 Corners, or 4 Corners.
            </p>
          </div>
          <div className="card-glass">
            <Move size={22} color="var(--accent)" />
            <h2 style={{ margin: 0, fontSize: 20 }}>Drag & Place Custom Text</h2>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5 }}>
              Add custom titles, dress codes, or hashtags right onto the invitation wall, drag them cleanly to any spot, and capture them in every downloaded video.
            </p>
          </div>
          <div className="card-glass">
            <Music size={22} color="var(--accent)" />
            <h2 style={{ margin: 0, fontSize: 20 }}>{MUSIC_TRACKS.length} Curated Looping Soundtracks</h2>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5 }}>
              Warm ceremonial melodies that repeat seamlessly for the exact duration of your invitation without harsh cuts.
            </p>
          </div>
          <div className="card-glass">
            <Type size={22} color="var(--accent)" />
            <h2 style={{ margin: 0, fontSize: 20 }}>{FONT_STYLES.length} Wall Typography Styles</h2>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5 }}>
              Move effortlessly between Royal Serif, Calligraphy, Editorial, Playful Hand, Modern Sans, and Festive Script without losing your colors or props.
            </p>
          </div>
          <div className="card-glass">
            <Palette size={22} color="var(--accent)" />
            <h2 style={{ margin: 0, fontSize: 20 }}>Light Botanical & Deep Evening Palettes</h2>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5 }}>
              Restyle cotton paper walls, ink outlines, brass accents, and velvet evening themes in a single tap.
            </p>
          </div>
          <div className="card-glass">
            <Clock size={22} color="var(--accent)" />
            <h2 style={{ margin: 0, fontSize: 20 }}>Per-Room Duration & Aspect Ratios</h2>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5 }}>
              Customize timestamps per ceremony room and download crisp vertical Reels, square Feed, or widescreen videos straight to your device.
            </p>
          </div>
        </div>

        <div className="container" style={{ marginTop: 42, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/templates" className="btn btn-primary btn-lg">
            Browse Templates <ArrowRight size={15} />
          </Link>
          <Link to="/register" className="btn btn-lg">
            Start Free Account
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
