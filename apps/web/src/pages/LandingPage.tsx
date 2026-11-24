import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Box,
  ChevronDown,
  Flower2,
  Pause,
  Play,
  RotateCw,
  Square,
  Trees,
} from 'lucide-react';
import {
  CATEGORIES,
  CategoryId,
  PREMIUM_TEMPLATES,
  ProjectConfig,
  STRUCTURES,
  StructureId,
  TEMPLATES,
  TemplatePreset,
  TemplateRegionId,
  getProjectTotalSeconds,
  getStructureById,
} from '@patra/shared';
import { buildShowcaseProject } from '../lib/showcaseProject';
import {
  AtmosphereOrbitDiorama3D,
  FloralGatefoldDiorama3D,
  GardenPavilionDiorama3D,
} from '../components/AnimatedFeatureDioramas';
import { HalftoneCanvas } from '../components/HalftoneCanvas';
import { HeroDiagramCanvas } from '../components/HeroDiagramCanvas';
import { LandingCardsShowcase } from '../components/LandingCardsShowcase';
import { MarketingLayout } from '../components/MarketingLayout';
import { StudioStage, StudioStageHandle } from '../components/StudioStage';
import { useAuth } from '../context/AuthContext';

type ShowcaseAct = 'tour' | 'garden' | 'seal' | 'stage';

const SHOWCASE_TEMPLATES: TemplatePreset[] = (['indian', 'western', 'east_asian'] as TemplateRegionId[]).flatMap(
  (region) => PREMIUM_TEMPLATES.filter((t) => t.region === region).slice(0, 2)
);

const REGION_LABEL: Record<TemplateRegionId, string> = {
  indian: 'Indian',
  western: 'Western',
  east_asian: 'East Asian',
};

const MARQUEE_ITEMS = [
  'Eight Folding 3D Architectures',
  'Illustrated Floral Gatefold Seals',
  '24 Single-Page Invitation Cards',
  '3D Estate Gardens & Archways',
  '30 Global Heritage Templates',
  'Dual 3D Photo Standees',
  'Day/Night Atmosphere & Petals',
  'Custom Section Timestamps',
];

export function LandingPage() {
  const { user } = useAuth();
  const stageRef = useRef<StudioStageHandle | null>(null);

  const initialTpl = SHOWCASE_TEMPLATES[0] ?? PREMIUM_TEMPLATES[0] ?? TEMPLATES[0];
  const [heroTplId, setHeroTplId] = useState(initialTpl.id);
  const [heroStructure, setHeroStructure] = useState<StructureId>(
    initialTpl.project.structure ?? 'palace_dome'
  );
  const [heroCorners, setHeroCorners] = useState<2 | 3 | 4>(initialTpl.project.cornersCount ?? 4);
  const [act, setAct] = useState<ShowcaseAct>('tour');
  const [stageReady, setStageReady] = useState(false);
  const [tourPlaying, setTourPlaying] = useState(false);
  const [tourProgress, setTourProgress] = useState({ elapsed: 0, total: 0 });
  const tourTimerRef = useRef<number | null>(null);
  const [dioramasPaused, setDioramasPaused] = useState(false);

  const [activeCategory, setActiveCategory] = useState<CategoryId>('wedding');

  const heroTpl = useMemo(
    () => SHOWCASE_TEMPLATES.find((t) => t.id === heroTplId) ?? initialTpl,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [heroTplId]
  );

  const stageProject: ProjectConfig = useMemo(() => {
    const base = buildShowcaseProject(heroTpl);
    base.structure = heroStructure;
    base.cornersCount = heroCorners;
    if (base.rooms.length > heroCorners) {
      base.rooms = base.rooms.slice(0, heroCorners);
    }
    return base;
  }, [heroTpl, heroStructure, heroCorners]);

  const totalSecs = useMemo(() => getProjectTotalSeconds(stageProject), [stageProject]);

  const clearTourTimer = () => {
    if (tourTimerRef.current !== null) {
      window.clearTimeout(tourTimerRef.current);
      tourTimerRef.current = null;
    }
  };

  // Auto-play the full Garden -> Seal -> Inside tour on load and whenever the template changes.
  useEffect(() => {
    if (!stageReady) return;
    clearTourTimer();
    setAct('tour');
    setTourProgress({ elapsed: 0, total: totalSecs });
    tourTimerRef.current = window.setTimeout(() => {
      setTourPlaying(true);
      stageRef.current?.sendCommand('SET_VIEW_MODE', 'stage');
      stageRef.current?.sendCommand('START_PREVIEW');
    }, 260);
    return clearTourTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageReady, heroTplId]);

  const switchAct = (next: ShowcaseAct) => {
    clearTourTimer();
    setAct(next);
    if (next === 'tour') {
      setTourPlaying(true);
      setTourProgress({ elapsed: 0, total: totalSecs });
      stageRef.current?.sendCommand('SET_VIEW_MODE', 'stage');
      stageRef.current?.sendCommand('START_PREVIEW');
      return;
    }
    setTourPlaying(false);
    stageRef.current?.sendCommand('STOP_PREVIEW');
    if (next === 'garden') {
      stageRef.current?.sendCommand('SET_VIEW_MODE', 'garden_entrance');
    } else if (next === 'seal') {
      stageRef.current?.sendCommand('PLAY_WAX_OPENING');
    } else {
      stageRef.current?.sendCommand('SET_VIEW_MODE', 'stage');
      stageRef.current?.sendCommand('PLAY_UNFOLD');
    }
  };

  const changeLayout = (structure: StructureId, corners: 2 | 3 | 4) => {
    clearTourTimer();
    setHeroStructure(structure);
    setHeroCorners(corners);
    setTourPlaying(false);
    setAct('stage');
    stageRef.current?.sendCommand('STOP_PREVIEW');
    stageRef.current?.sendCommand('SET_VIEW_MODE', 'stage');
  };

  const tourPct = tourProgress.total > 0 ? Math.min(1, tourProgress.elapsed / tourProgress.total) : 0;

  const categoryTemplates = useMemo(() => {
    const list = TEMPLATES.filter((t) => t.category === activeCategory);
    if (activeCategory === 'wedding') {
      return [...list].reverse();
    }
    return list;
  }, [activeCategory]);

  return (
    <MarketingLayout>
      {/* 1. ATMOSPHERIC HALFTONE HERO */}
      <section className="ol-hero">
        <HalftoneCanvas variant="hero" />

        <div className="container" style={{ width: '100%' }}>
          <div className="ol-hero-content">
            <div>
              <h1 className="ol-hero-title">
                Invitations crafted like living architecture.
              </h1>
              <p className="ol-hero-sub">
                Patra turns multi-room event invitations into folding sculptural stories with custom typography and music ready to share.
              </p>
            </div>

            <div className="ol-hero-diagram">
              <HeroDiagramCanvas />
            </div>
          </div>

          <div className="ol-hero-actions">
            <Link to={user ? '/app' : '/register'} className="btn btn-periwinkle btn-lg">
              Get Started
            </Link>
            <Link to="/templates" className="btn btn-dark btn-lg">
              Explore Templates
            </Link>
          </div>
        </div>
      </section>

      {/* 2. AUTO-SLIDING MONOCHROME EDITORIAL TICKER */}
      <section className="ol-marquee-bar" aria-label="Platform highlights">
        <div className="ol-marquee-track">
          {[0, 1].map((dup) => (
            <div key={dup} className="ol-marquee-group" aria-hidden={dup === 1}>
              {MARQUEE_ITEMS.map((item) => (
                <React.Fragment key={`${dup}-${item}`}>
                  <span>{item}</span>
                  <span className="ol-marquee-dot" />
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* 3. LIVE AUTO-PLAYING 3D SHOWCASE (Garden -> Floral Seal -> Inside) */}
      <section className="section">
        <div className="container">
          <div className="ol-split-header">
            <div>
              <span className="showcase-eyebrow">
                <span className={`showcase-live-dot ${tourPlaying ? 'is-live' : ''}`} />
                Live 3D Showcase
              </span>
              <h2 className="section-title" style={{ marginBottom: 0 }}>
                Walk in, unseal, step inside.
              </h2>
            </div>
            <p className="section-desc">
              Guests stroll through a flowering estate garden, pop open an illustrated floral seal, then step inside a pavilion that unfolds around them. Pick a template, jump to any moment, or reshape the corners yourself.
            </p>
          </div>

          <div className="monument-stage showcase-stage">
            {/* Template picker */}
            <div className="showcase-tpl-strip" role="group" aria-label="Choose a showcase template">
              {SHOWCASE_TEMPLATES.map((t) => {
                const active = t.id === heroTplId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`showcase-tpl ${active ? 'active' : ''}`}
                    onClick={() => {
                      if (t.id === heroTplId) {
                        switchAct('tour');
                        return;
                      }
                      setHeroTplId(t.id);
                      setHeroStructure(t.project.structure ?? 'palace_dome');
                      setHeroCorners(t.project.cornersCount ?? 4);
                    }}
                  >
                    <span
                      className="showcase-tpl-swatch"
                      style={{
                        background: `linear-gradient(135deg, ${t.previewGradient[0]}, ${t.previewGradient[1]})`,
                      }}
                    />
                    <span className="showcase-tpl-text">
                      <strong>{t.name}</strong>
                      <small>{t.region ? REGION_LABEL[t.region] : t.vibeTag}</small>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="stage-viewport showcase-viewport">
              <StudioStage
                ref={stageRef}
                lazy
                project={stageProject}
                viewMode={act === 'garden' ? 'garden_entrance' : act === 'seal' ? 'wax_envelope' : 'stage'}
                onReady={() => setStageReady(true)}
                onPreviewProgress={(elapsed, total) => {
                  setTourPlaying(true);
                  setTourProgress({ elapsed: Math.round(elapsed), total: Math.round(total) });
                }}
                onPreviewDone={() => {
                  setTourPlaying(false);
                  setAct('stage');
                }}
                title="Patra Live 3D Showcase"
              />

              {/* Top overlay: status + play/stop */}
              <div className="showcase-overlay-top">
                <span className="showcase-status">
                  <span className={`showcase-live-dot ${tourPlaying ? 'is-live' : ''}`} />
                  {tourPlaying
                    ? `Playing full tour · ${tourProgress.elapsed}s / ${tourProgress.total || totalSecs}s`
                    : 'Drag to spin · scroll to zoom'}
                </span>
                <button
                  type="button"
                  className="showcase-round-btn"
                  onClick={() => switchAct(tourPlaying ? 'stage' : 'tour')}
                >
                  {tourPlaying ? <Square size={13} /> : <Play size={13} />}
                  <span>{tourPlaying ? 'Stop tour' : 'Play tour'}</span>
                </button>
              </div>

              {/* Bottom overlay: template info card */}
              <div className="showcase-info-card">
                <span className="showcase-info-tag">{heroTpl.vibeTag}</span>
                <h3>{heroTpl.name}</h3>
                <p>{heroTpl.subtitle}</p>
                <div className="showcase-info-meta">
                  <span>{getStructureById(heroStructure).name}</span>
                  <span>{heroCorners} {heroCorners === 2 ? 'Wings' : 'Corners'}</span>
                  <span>{totalSecs}s video</span>
                </div>
                <Link
                  to={user ? `/app/editor/tpl:${heroTpl.id}` : '/register'}
                  className="btn btn-sm btn-periwinkle"
                >
                  Customize this invite <ArrowRight size={13} />
                </Link>
              </div>

              {/* Tour progress bar */}
              <div className="showcase-progress" aria-hidden="true">
                <div
                  className="showcase-progress-fill"
                  style={{ transform: `scaleX(${tourPlaying ? tourPct : act === 'stage' ? 1 : 0})` }}
                />
              </div>
            </div>

            {/* Act switcher */}
            <div className="showcase-acts" role="group" aria-label="Jump to a moment">
              {(
                [
                  { id: 'tour' as ShowcaseAct, label: 'Full Tour', sub: `${totalSecs}s cinematic`, icon: <Play size={15} /> },
                  { id: 'garden' as ShowcaseAct, label: 'Garden Entrance', sub: 'Archway & flower walk', icon: <Trees size={15} /> },
                  { id: 'seal' as ShowcaseAct, label: 'Floral Seal', sub: 'Gatefold doors open', icon: <Flower2 size={15} /> },
                  { id: 'stage' as ShowcaseAct, label: 'Inside 3D', sub: 'Unfold & drag to spin', icon: <Box size={15} /> },
                ]
              ).map((a, idx) => (
                <button
                  key={a.id}
                  type="button"
                  className={`showcase-act ${act === a.id ? 'active' : ''}`}
                  onClick={() => switchAct(a.id)}
                >
                  <span className="showcase-act-num">{idx === 0 ? <RotateCw size={12} /> : idx}</span>
                  <span className="showcase-act-icon">{a.icon}</span>
                  <span className="showcase-act-text">
                    <strong>{a.label}</strong>
                    <small>{a.sub}</small>
                  </span>
                </button>
              ))}
            </div>

            {/* Layout controls */}
            <div className="showcase-layout-row">
              <div className="showcase-layout-group">
                <span className="showcase-layout-label">Architecture</span>
                <div className="chip-row">
                  {STRUCTURES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      className={`chip-btn ${heroStructure === st.id ? 'active' : ''}`}
                      onClick={() => changeLayout(st.id, heroCorners)}
                    >
                      {st.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="showcase-layout-group">
                <span className="showcase-layout-label">Corners</span>
                <div className="chip-row">
                  {([2, 3, 4] as const).map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      className={`chip-btn ${heroCorners === cnt ? 'active' : ''}`}
                      onClick={() => changeLayout(heroStructure, cnt)}
                    >
                      {cnt} {cnt === 2 ? 'Wings' : 'Corners'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THREE-COLUMN LIVE MOVING 3D DIORAMA GRID */}
      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container">
          <div className="ol-split-header" style={{ marginBottom: 32, alignItems: 'flex-end' }}>
            <div>
              <h2 className="section-title" style={{ marginBottom: 8 }}>
                Beyond flat digital cards.
              </h2>
              <p className="section-desc">
                Every invitation opens like a miniature living 3D world with estate gardens, illustrated floral seals, and glowing twilight depth.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setDioramasPaused((p) => !p)}
              >
                {dioramasPaused ? <Play size={13} /> : <Pause size={13} />}
                {dioramasPaused ? 'Play Motion' : 'Pause Motion'}
              </button>
            </div>
          </div>

          <div className={`hairline-grid-3 ${dioramasPaused ? 'diorama-paused' : ''}`}>
            <div className="hairline-cell reveal-card">
              <div className="hairline-figure-box">
                <GardenPavilionDiorama3D />
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 600 }}>
                  Eight folding architectures &amp; 3D gardens
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                  Sweep through floral garden archways and terracotta planters into Palace Dome, Book Stage, or Torii pavilions across 2, 3, or 4 corners.
                </p>
              </div>
            </div>

            <div className="hairline-cell reveal-card">
              <div className="hairline-figure-box">
                <FloralGatefoldDiorama3D />
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 600 }}>
                  Floral gatefolds &amp; molten wax seals
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                  Pop open embossed wax clasps on illustrated marigold house cards, European rose arches, and sakura doors with editable foil liners.
                </p>
              </div>
            </div>

            <div className="hairline-cell reveal-card">
              <div className="hairline-figure-box">
                <AtmosphereOrbitDiorama3D />
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 600 }}>
                  Twilight atmospheres, dual photos &amp; timing
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                  Add two die-cut photo standees per room, shift sky lighting from sunlit gold to starlit petals, and dial timestamps per section.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 1-PAGE INVITATION CARDS FANNED SHOWCASE */}
      <LandingCardsShowcase isAuthenticated={Boolean(user)} />

      {/* 6. CURATED CELEBRATION COLLECTION */}
      <section className="section" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
            <div>
              <h2 className="section-title" style={{ marginBottom: 6 }}>Curated for every gathering.</h2>
              <p className="section-desc">
                Weddings, Receptions, Milestone Birthdays, Private Dinners, and Seasonal Gatherings.
              </p>
            </div>
            <Link to="/templates" className="btn">
              View All Templates <ArrowRight size={14} />
            </Link>
          </div>

          <div className="chip-row" style={{ marginBottom: 24 }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`chip-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="bento-grid">
            {categoryTemplates.map((tpl) => {
              const struct = getStructureById(tpl.project.structure);
              return (
                <div key={tpl.id} className="card-glass reveal-card" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div
                      className="tpl-thumb"
                      style={{
                        background: `linear-gradient(135deg, ${tpl.previewGradient[0]}, ${tpl.previewGradient[1]})`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.9)', padding: '3px 8px', borderRadius: 4 }}>
                          {tpl.vibeTag}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, background: 'rgba(16,20,26,0.82)', color: '#fff', padding: '3px 8px', borderRadius: 4 }}>
                          {tpl.project.cornersCount ?? 4} Corners
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{struct.name}</div>
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>{tpl.name}</h3>
                      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-soft)' }}>{tpl.subtitle}</p>
                    </div>
                  </div>
                  <Link to={user ? `/app/editor/tpl:${tpl.id}` : '/register'} className="btn btn-sm">
                    Customize Template <ArrowRight size={13} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. MINIMAL EDITORIAL FAQ */}
      <section className="section" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div className="ol-faq-grid">
            <div>
              <h2 className="section-title">Common Questions</h2>
              <p className="section-desc">
                Everything hosts and planners ask before sharing their first invitation video.
              </p>
            </div>

            <div className="faq-list">
              {[
                [
                  'How many rooms and corners can I include in one invitation?',
                  'You can configure 2, 3, or 4 folding corners and add multiple rooms to tell the full story of your event from welcome drinks to the main ceremony.',
                ],
                [
                  'Can I customize the architecture and unfolding motion?',
                  'Yes. Switch between five architectural structures including Book Stage, Palace Dome, Garden Pergola, Modern Gallery, and Gable House, each with its own opening animation.',
                ],
                [
                  'Can I place custom text anywhere on the wall?',
                  'Yes. In the Text tab, enter any custom line, adjust size or color, and drag it into place directly on the invitation wall.',
                ],
                [
                  'Can I also create 1-page printable or WhatsApp invitation cards?',
                  'Yes. Choose from 24 single-page Indian, Western, and East Asian stationery styles, upload and crop up to two photos, and download high-resolution PNG or JPG cards.',
                ],
                [
                  'Do my drafts and downloads stay synced across devices?',
                  'Yes. Sign in with the same account on desktop or mobile to continue editing your saved invitations from anywhere.',
                ],
              ].map(([q, a]) => (
                <details key={q} className="faq-item">
                  <summary>
                    <span>{q}</span>
                    <ChevronDown size={17} color="var(--muted)" />
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. OBSIDIAN CLOSING CTA (FLOWS DIRECTLY INTO FOOTER HORIZON) */}
      <section className="ol-obsidian-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <HalftoneCanvas variant="horizon" />
        <div className="container ol-closing-cta">
          <h2 className="ol-closing-title">
            Give your guests an invitation they will replay.
          </h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to={user ? '/app' : '/register'} className="btn btn-periwinkle btn-lg">
              Start Designing
            </Link>
            <Link to="/templates" className="btn btn-dark btn-lg">
              Browse Templates
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
