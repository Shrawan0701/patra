import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Box,
  Flower2,
  Globe,
  Image as ImageIcon,
  Layers,
  MailOpen,
  Play,
  Sparkles,
  Square,
  Sun,
  Trees,
} from 'lucide-react';
import {
  CARD_TEMPLATES,
  CATEGORIES,
  CategoryId,
  DEFAULT_WAX_SEAL,
  PREMIUM_TEMPLATES,
  ProjectConfig,
  TEMPLATES,
  TemplatePreset,
  TemplateRegionId,
  WaxCoverStyle,
  drawInvitationCard,
  getCardPixelSize,
  getDefaultGardenForProject,
  getProjectTotalSeconds,
  getStructureById,
} from '@patra/shared';
import { AppLayout } from '../components/AppLayout';
import { StudioStage, StudioStageHandle } from '../components/StudioStage';
import { useAuth } from '../context/AuthContext';

type HeroMode = 'tour' | 'garden' | 'seal' | 'stage';

const SAMPLE_CARD_IDS = [
  'card_jaipur_marigold_house',
  'card_milestone_birthday_studio',
  'card_cotswolds_rose_arch',
  'card_kyoto_sakura_branch',
  'card_manhattan_art_deco',
];

function buildHeroShowcaseProject(tpl: TemplatePreset): ProjectConfig {
  const cloned = structuredClone(tpl.project) as ProjectConfig;
  const garden = getDefaultGardenForProject(cloned);
  const firstSignage = cloned.rooms[0]?.signage;

  let fallbackCoverStyle: WaxCoverStyle = 'marigold_house';
  if (tpl.region === 'east_asian') fallbackCoverStyle = 'sakura_gate_card';
  else if (tpl.region === 'western') fallbackCoverStyle = 'rose_arch_card';

  const dateVenueFallback = firstSignage?.dateText
    ? `${firstSignage.dateText} · ${firstSignage.venueText || 'grand estate'}`
    : '11 feb - 13 feb · udaipur';

  return {
    ...cloned,
    garden: {
      ...garden,
      enabled: true,
      hasEntranceArch: true,
      entranceDurationSeconds: garden.entranceDurationSeconds ?? 3,
    },
    waxSeal: {
      ...DEFAULT_WAX_SEAL,
      ...(cloned.waxSeal ?? {}),
      enabled: true,
      coverStyle: cloned.waxSeal?.coverStyle ?? fallbackCoverStyle,
      coverSubtitle:
        cloned.waxSeal?.coverSubtitle ??
        (firstSignage?.hostLine?.trim() ? firstSignage.hostLine : 'together with their families'),
      coverDateVenue: cloned.waxSeal?.coverDateVenue ?? dateVenueFallback,
      durationSeconds: cloned.waxSeal?.durationSeconds ?? 4,
    },
  };
}

export function ExplorePage() {
  const { user } = useAuth();
  const stageRef = useRef<StudioStageHandle | null>(null);
  const occasionStageRef = useRef<StudioStageHandle | null>(null);
  const cardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tourTimerRef = useRef<number | null>(null);

  const defaultHero = useMemo(
    () =>
      PREMIUM_TEMPLATES.find((t) => t.id === 'prem_udaipur_haveli') ??
      PREMIUM_TEMPLATES[0] ??
      TEMPLATES[0],
    []
  );

  const [heroTemplate, setHeroTemplate] = useState<TemplatePreset>(defaultHero);
  const [heroMode, setHeroMode] = useState<HeroMode>('tour');
  const [stageReady, setStageReady] = useState(false);
  const [tourPlaying, setTourPlaying] = useState(false);
  const [tourProgress, setTourProgress] = useState({ elapsed: 0, total: 0 });

  // Category showcase state (defaults to Birthday Bash)
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('birthday');
  const [selectedOccasionTplId, setSelectedOccasionTplId] = useState<string>('bday_pastel_cake');
  const [occasionMode, setOccasionMode] = useState<HeroMode>('seal');
  const [occasionPlaying, setOccasionPlaying] = useState(false);
  const [occasionProgress, setOccasionProgress] = useState({ elapsed: 0, total: 0 });
  const [occasionStageReady, setOccasionStageReady] = useState(false);

  // Sample 1-Page Card preview state
  const sampleCards = useMemo(() => {
    const picked = SAMPLE_CARD_IDS.map((id) => CARD_TEMPLATES.find((c) => c.id === id)).filter(
      (c): c is NonNullable<typeof c> => Boolean(c)
    );
    return picked.length > 0 ? picked : CARD_TEMPLATES.slice(0, 5);
  }, []);
  const [sampleCardId, setSampleCardId] = useState<string>(sampleCards[0]?.id ?? '');

  const activeSampleCard = useMemo(
    () => sampleCards.find((c) => c.id === sampleCardId) ?? sampleCards[0],
    [sampleCards, sampleCardId]
  );

  const showcaseProject = useMemo(
    () => buildHeroShowcaseProject(heroTemplate),
    [heroTemplate]
  );

  const totalSecs = useMemo(
    () => getProjectTotalSeconds(showcaseProject),
    [showcaseProject]
  );

  const featuredHighlights = useMemo(() => {
    const pickByRegion = (r: TemplateRegionId) =>
      PREMIUM_TEMPLATES.filter((t) => t.region === r).slice(0, 2);
    return [
      ...pickByRegion('indian'),
      ...pickByRegion('western'),
      ...pickByRegion('east_asian'),
    ];
  }, []);

  const categoryTemplates = useMemo(() => {
    return [
      ...TEMPLATES.filter((t) => t.category === selectedCategory),
      ...PREMIUM_TEMPLATES.filter((t) => t.category === selectedCategory),
    ];
  }, [selectedCategory]);

  const activeCategoryMeta = useMemo(
    () => CATEGORIES.find((c) => c.id === selectedCategory) ?? CATEGORIES[0],
    [selectedCategory]
  );

  const occasionTemplate = useMemo(
    () =>
      categoryTemplates.find((t) => t.id === selectedOccasionTplId) ??
      categoryTemplates[0] ??
      TEMPLATES[0],
    [categoryTemplates, selectedOccasionTplId]
  );

  const occasionShowcaseProject = useMemo(
    () => buildHeroShowcaseProject(occasionTemplate),
    [occasionTemplate]
  );

  const occasionTotalSecs = useMemo(
    () => getProjectTotalSeconds(occasionShowcaseProject),
    [occasionShowcaseProject]
  );

  useEffect(() => {
    if (categoryTemplates.length > 0 && !categoryTemplates.some((t) => t.id === selectedOccasionTplId)) {
      setSelectedOccasionTplId(categoryTemplates[0].id);
    }
  }, [categoryTemplates, selectedOccasionTplId]);

  // Hero auto-tour on mount / template switch
  useEffect(() => {
    if (!stageReady) return;
    if (tourTimerRef.current !== null) {
      window.clearTimeout(tourTimerRef.current);
      tourTimerRef.current = null;
    }

    setHeroMode('tour');
    setTourProgress({ elapsed: 0, total: totalSecs });

    tourTimerRef.current = window.setTimeout(() => {
      setTourPlaying(true);
      stageRef.current?.sendCommand('SET_VIEW_MODE', 'stage');
      stageRef.current?.sendCommand('START_PREVIEW');
    }, 220);

    return () => {
      if (tourTimerRef.current !== null) {
        window.clearTimeout(tourTimerRef.current);
        tourTimerRef.current = null;
      }
    };
  }, [stageReady, heroTemplate.id, totalSecs]);

  // Render live 1-Page Card sample onto canvas
  useEffect(() => {
    const canvas = cardCanvasRef.current;
    if (!canvas || !activeSampleCard) return;
    const { width, height } = getCardPixelSize(activeSampleCard.config.aspectRatio);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawInvitationCard(ctx, width, height, activeSampleCard.config);
  }, [activeSampleCard]);

  const switchHeroAct = (mode: HeroMode) => {
    if (tourTimerRef.current !== null) {
      window.clearTimeout(tourTimerRef.current);
      tourTimerRef.current = null;
    }
    setHeroMode(mode);

    if (mode === 'tour') {
      setTourPlaying(true);
      setTourProgress({ elapsed: 0, total: totalSecs });
      stageRef.current?.sendCommand('SET_VIEW_MODE', 'stage');
      stageRef.current?.sendCommand('START_PREVIEW');
    } else if (mode === 'garden') {
      setTourPlaying(false);
      stageRef.current?.sendCommand('STOP_PREVIEW');
      stageRef.current?.sendCommand('SET_VIEW_MODE', 'garden_entrance');
    } else if (mode === 'seal') {
      setTourPlaying(false);
      stageRef.current?.sendCommand('STOP_PREVIEW');
      stageRef.current?.sendCommand('PLAY_WAX_OPENING');
    } else {
      setTourPlaying(false);
      stageRef.current?.sendCommand('STOP_PREVIEW');
      stageRef.current?.sendCommand('SET_VIEW_MODE', 'stage');
      stageRef.current?.sendCommand('PLAY_UNFOLD');
    }
  };

  const switchOccasionAct = (mode: HeroMode) => {
    setOccasionMode(mode);
    if (!occasionStageReady) return;
    if (mode === 'tour') {
      setOccasionPlaying(true);
      setOccasionProgress({ elapsed: 0, total: occasionTotalSecs });
      occasionStageRef.current?.sendCommand('SET_VIEW_MODE', 'stage');
      occasionStageRef.current?.sendCommand('START_PREVIEW');
    } else if (mode === 'garden') {
      setOccasionPlaying(false);
      occasionStageRef.current?.sendCommand('STOP_PREVIEW');
      occasionStageRef.current?.sendCommand('SET_VIEW_MODE', 'garden_entrance');
    } else if (mode === 'seal') {
      setOccasionPlaying(false);
      occasionStageRef.current?.sendCommand('STOP_PREVIEW');
      occasionStageRef.current?.sendCommand('PLAY_WAX_OPENING');
    } else {
      setOccasionPlaying(false);
      occasionStageRef.current?.sendCommand('STOP_PREVIEW');
      occasionStageRef.current?.sendCommand('SET_VIEW_MODE', 'stage');
      occasionStageRef.current?.sendCommand('PLAY_UNFOLD');
    }
  };

  const selectTemplateForHero = (tpl: TemplatePreset) => {
    setHeroTemplate(tpl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const heroStruct = getStructureById(heroTemplate.project.structure);
  const occasionStruct = getStructureById(occasionTemplate.project.structure);

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          <div>
            <span className="badge-pill">
              <Sparkles size={13} /> Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </span>
            <h1 style={{ margin: '10px 0 4px', fontSize: 30, fontWeight: 700 }}>
              Explore 3D Signature Invitations
            </h1>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5 }}>
              Walk the estate garden, unseal illustrated garlands, step inside 3D rooms, or design 1-page cards.
            </p>
          </div>
          <div className="chip-row">
            <Link to="/app/cards" className="btn">
              <ImageIcon size={15} /> 1-Page Cards
            </Link>
            <Link to="/app/premium-templates" className="btn">
              <Globe size={15} /> Global 30 Collection
            </Link>
            <Link to="/app/editor/custom:birthday" className="btn btn-primary">
              Create Custom Room <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Auto-Running Live 3D Signature Showcase */}
        <div className="ol-hero-content" style={{ gap: 24 }}>
          <div className="monument-stage">
            <div className="stage-viewport" style={{ aspectRatio: '16 / 10', position: 'relative' }}>
              <StudioStage
                ref={stageRef}
                project={showcaseProject}
                viewMode={
                  heroMode === 'garden'
                    ? 'garden_entrance'
                    : heroMode === 'seal'
                    ? 'wax_envelope'
                    : 'stage'
                }
                onReady={() => setStageReady(true)}
                onPreviewProgress={(elapsed, total) => {
                  setTourPlaying(true);
                  setTourProgress({
                    elapsed: Math.round(elapsed),
                    total: Math.round(total),
                  });
                }}
                onPreviewDone={() => {
                  setTourPlaying(false);
                  setHeroMode('stage');
                }}
                title="Explore Live 3D Tour"
              />

              {/* Floating Live Status Overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  right: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(16, 20, 18, 0.74)',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.16)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: tourPlaying ? '#4ADE80' : '#FBBF24',
                    }}
                  />
                  {tourPlaying
                    ? `Full Tour · ${tourProgress.elapsed}s/${tourProgress.total || totalSecs}s`
                    : 'Live 3D · Drag to Spin'}
                </div>

                <button
                  type="button"
                  title={tourPlaying ? 'Stop Tour' : 'Play Full Tour'}
                  onClick={() => switchHeroAct(tourPlaying ? 'stage' : 'tour')}
                  style={{
                    pointerEvents: 'auto',
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(16, 20, 18, 0.78)',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {tourPlaying ? <Square size={14} /> : <Play size={14} />}
                </button>
              </div>
            </div>

            {/* 4-Step Interactive Act Switcher */}
            <div className="stage-toolbar" style={{ flexWrap: 'wrap', gap: 10 }}>
              <div className="chip-row" style={{ gap: 6 }}>
                {(
                  [
                    { id: 'tour' as HeroMode, label: 'Full Tour', icon: <Play size={13} /> },
                    { id: 'garden' as HeroMode, label: 'Garden', icon: <Trees size={13} /> },
                    { id: 'seal' as HeroMode, label: 'Floral Seal', icon: <Flower2 size={13} /> },
                    { id: 'stage' as HeroMode, label: 'Inside 3D', icon: <Box size={13} /> },
                  ]
                ).map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    className={`btn btn-sm ${heroMode === act.id ? 'btn-primary' : ''}`}
                    onClick={() => switchHeroAct(act.id)}
                  >
                    {act.icon} {act.label}
                  </button>
                ))}
              </div>

              <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600 }}>
                {heroTemplate.name} · {heroStruct.name} · {heroTemplate.project.cornersCount ?? 4} Corners
              </span>
            </div>
          </div>

          {/* Right Showcase Info Panel */}
          <div className="card-glass" style={{ justifyContent: 'space-between', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge-pill">{heroTemplate.vibeTag}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' }}>
                  Garden · Floral Seal · {heroTemplate.project.rooms.length}{' '}
                  {heroTemplate.project.rooms.length === 1 ? 'Room' : 'Rooms'} · {totalSecs}s
                </span>
              </div>

              <h2 style={{ margin: '4px 0 0', fontSize: 24 }}>{heroTemplate.name}</h2>
              <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14 }}>
                {heroTemplate.subtitle}
              </p>

              <div
                style={{
                  fontSize: 13,
                  color: 'var(--muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  marginTop: 4,
                }}
              >
                <span>Rooms: {heroTemplate.project.rooms.map((r) => r.label).join(' / ')}</span>
                <span>Structure: {heroStruct.name}</span>
                <span>Fold Geometry: {heroTemplate.project.cornersCount ?? 4} Corners</span>
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 6 }}>
                  QUICK-SWITCH GLOBAL SIGNATURES
                </div>
                <div className="chip-row" style={{ gap: 6 }}>
                  {featuredHighlights.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`chip-btn ${heroTemplate.id === item.id ? 'active' : ''}`}
                      style={{ padding: '6px 10px', fontSize: 11.5 }}
                      onClick={() => selectTemplateForHero(item)}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Link to={`/app/editor/tpl:${heroTemplate.id}`} className="btn btn-primary btn-lg">
              Customize &amp; Download Video <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Craft Every Layer in 3D Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Craft Every Layer in 3D</h2>
            <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
              Jump into any customizer or preview live in the stage above
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
            }}
          >
            <button
              type="button"
              className="card-glass"
              style={{ textAlign: 'left', cursor: 'pointer', gap: 8 }}
              onClick={() => {
                switchHeroAct('garden');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
                <Trees size={18} style={{ color: 'var(--accent)' }} /> Estate Gardens
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                5 themed courtyards, entrance floral arch, side flower pots &amp; sweep timestamps.
              </div>
            </button>

            <Link to="/app/wax-seal" className="card-glass" style={{ textDecoration: 'none', color: 'inherit', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
                <MailOpen size={18} style={{ color: 'var(--accent)' }} /> Floral Gatefold Seals
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                Marigold house cards, European rose arches, sakura gates &amp; embossed wax clasps.
              </div>
            </Link>

            <Link to="/app/atmosphere" className="card-glass" style={{ textDecoration: 'none', color: 'inherit', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
                <Sun size={18} style={{ color: 'var(--accent)' }} /> Day/Night Atmosphere
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                Morning sun, twilight diyas, falling marigold or sakura petals &amp; dual photo standees.
              </div>
            </Link>

            <Link to="/app/premium-templates" className="card-glass" style={{ textDecoration: 'none', color: 'inherit', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
                <Globe size={18} style={{ color: 'var(--accent)' }} /> 30 Global Scenes
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                Indian Heritage, Western &amp; European, and East Asian architectural stages.
              </div>
            </Link>
          </div>
        </div>

        {/* 1. Occasion Categories + Live Birthday Bash / Category 3D + Seal Example */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <span className="badge-pill">
                <Layers size={13} /> Every Celebration Covered
              </span>
              <h2 style={{ margin: '8px 0 4px', fontSize: 22, fontWeight: 700 }}>
                Explore by Occasion · 3D Invitations &amp; Opening Seal
              </h2>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-soft)' }}>
                Switch categories to preview live 3D rooms, opening floral seal reveals, or build a custom invitation.
              </p>
            </div>
            <Link to="/app/studio" className="btn btn-sm">
              All Categories &amp; Drafts <ArrowRight size={14} />
            </Link>
          </div>

          <div className="chip-row">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip-btn ${selectedCategory === c.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(c.id);
                  setOccasionMode('seal');
                }}
              >
                {c.shortName}
              </button>
            ))}
          </div>

          <div className="ol-hero-content" style={{ gap: 22 }}>
            <div className="monument-stage">
              <div className="stage-viewport" style={{ aspectRatio: '16 / 10', position: 'relative' }}>
                <StudioStage
                  ref={occasionStageRef}
                  lazy
                  project={occasionShowcaseProject}
                  viewMode={
                    occasionMode === 'garden'
                      ? 'garden_entrance'
                      : occasionMode === 'seal'
                      ? 'wax_envelope'
                      : 'stage'
                  }
                  onReady={() => setOccasionStageReady(true)}
                  onPreviewProgress={(elapsed, total) => {
                    setOccasionPlaying(true);
                    setOccasionProgress({
                      elapsed: Math.round(elapsed),
                      total: Math.round(total),
                    });
                  }}
                  onPreviewDone={() => {
                    setOccasionPlaying(false);
                    setOccasionMode('stage');
                  }}
                  title="Occasion 3D + Seal Example"
                />

                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(16, 20, 18, 0.74)',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    pointerEvents: 'none',
                  }}
                >
                  {occasionPlaying
                    ? `Playing Tour · ${occasionProgress.elapsed}s/${occasionProgress.total || occasionTotalSecs}s`
                    : `${activeCategoryMeta.shortName} · ${occasionMode === 'seal' ? 'Opening Seal Reveal' : occasionMode === 'garden' ? 'Estate Garden' : '3D Room'}`}
                </div>
              </div>

              <div className="stage-toolbar" style={{ flexWrap: 'wrap', gap: 10 }}>
                <div className="chip-row" style={{ gap: 6 }}>
                  {(
                    [
                      { id: 'seal' as HeroMode, label: 'Opening Seal', icon: <MailOpen size={13} /> },
                      { id: 'tour' as HeroMode, label: 'Play 3D Tour', icon: <Play size={13} /> },
                      { id: 'garden' as HeroMode, label: 'Garden', icon: <Trees size={13} /> },
                      { id: 'stage' as HeroMode, label: 'Inside 3D', icon: <Box size={13} /> },
                    ]
                  ).map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      className={`btn btn-sm ${occasionMode === act.id ? 'btn-primary' : ''}`}
                      onClick={() => switchOccasionAct(act.id)}
                    >
                      {act.icon} {act.label}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600 }}>
                  {occasionTemplate.name} · {occasionStruct.name}
                </span>
              </div>
            </div>

            <div className="card-glass" style={{ justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span className="badge-pill">{activeCategoryMeta.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' }}>
                    {occasionTemplate.project.rooms.length}R · {occasionTotalSecs}s
                  </span>
                </div>

                <h3 style={{ margin: '2px 0 0', fontSize: 22 }}>{occasionTemplate.name}</h3>
                <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 13.5 }}>
                  {occasionTemplate.subtitle}. Includes animated opening seal cover, estate courtyard &amp; multi-corner 3D room reveal.
                </p>

                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 6 }}>
                    {activeCategoryMeta.shortName.toUpperCase()} 3D EXAMPLES ({categoryTemplates.length})
                  </div>
                  <div className="chip-row" style={{ gap: 6 }}>
                    {categoryTemplates.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        className={`chip-btn ${occasionTemplate.id === tpl.id ? 'active' : ''}`}
                        style={{ padding: '6px 10px', fontSize: 11.5 }}
                        onClick={() => setSelectedOccasionTplId(tpl.id)}
                      >
                        {tpl.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link to={`/app/editor/tpl:${occasionTemplate.id}`} className="btn btn-primary btn-lg">
                  Customize {occasionTemplate.name} <ArrowRight size={16} />
                </Link>
                <Link to={`/app/editor/custom:${selectedCategory}`} className="btn">
                  Build Custom {activeCategoryMeta.shortName} Invitation <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 1-Page Invitation Cards Live Sample Showcase */}
        {activeSampleCard && (
          <div className="card-glass" style={{ padding: 24, gap: 20 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 24,
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div
                  style={{
                    width: '100%',
                    maxWidth: 250,
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    boxShadow: '0 16px 36px rgba(15, 23, 42, 0.14)',
                    background: '#111418',
                  }}
                >
                  <canvas
                    ref={cardCanvasRef}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <span className="badge-pill">
                    <ImageIcon size={13} /> 1-Page Invitation Cards · 24 Styles
                  </span>
                  <h2 style={{ margin: '10px 0 6px', fontSize: 24, fontWeight: 700 }}>
                    {activeSampleCard.name}
                  </h2>
                  <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.55 }}>
                    {activeSampleCard.subtitle}. Craft printable &amp; WhatsApp-ready single-page cards across Indian, Western &amp; East Asian styles, add up to 2 cropped photos, and download in HD PNG or JPG.
                  </p>
                </div>

                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 6 }}>
                    PREVIEW SAMPLE CARDS
                  </div>
                  <div className="chip-row" style={{ gap: 6 }}>
                    {sampleCards.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        className={`chip-btn ${activeSampleCard.id === card.id ? 'active' : ''}`}
                        style={{ padding: '6px 10px', fontSize: 12 }}
                        onClick={() => setSampleCardId(card.id)}
                      >
                        {card.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="chip-row" style={{ marginTop: 4 }}>
                  <Link to="/app/cards" className="btn btn-primary btn-lg">
                    Open 1-Page Cards Studio <ArrowRight size={16} />
                  </Link>
                  <Link to="/app/premium-templates" className="btn">
                    Browse 30 Global 3D Scenes
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
