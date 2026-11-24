import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Crown, Globe, MailOpen, Play, RotateCw, Sparkles, Square } from 'lucide-react';
import {
  PREMIUM_TEMPLATES,
  TemplatePreset,
  TemplateRegionId,
  getStructureById,
} from '@patra/shared';
import { AppLayout } from '../components/AppLayout';
import { StudioStage, StudioStageHandle } from '../components/StudioStage';

const REGION_TABS: { id: 'all' | TemplateRegionId; label: string; count: number; subtitle: string }[] = [
  { id: 'all', label: 'All Collections', count: 30, subtitle: 'Global handcrafted architectural scenes' },
  { id: 'indian', label: 'Indian Heritage', count: 10, subtitle: 'Havelis, jharokhas, lotus stages & sangeet galas' },
  { id: 'western', label: 'Western & European', count: 10, subtitle: 'Tuscan vineyards, Paris salons & alpine hearths' },
  { id: 'east_asian', label: 'East Asian Atelier', count: 10, subtitle: 'Kyoto torii bridges, hanok courtyards & sakura' },
];

export function PremiumTemplatesPage() {
  const stageRef = useRef<StudioStageHandle | null>(null);
  const [region, setRegion] = useState<'all' | TemplateRegionId>('all');
  const [featured, setFeatured] = useState<TemplatePreset>(PREMIUM_TEMPLATES[0]);
  const [viewMode, setViewMode] = useState<'stage' | 'wax_envelope'>('stage');
  const [previewing, setPreviewing] = useState(false);

  const visibleTemplates = useMemo(
    () => (region === 'all' ? PREMIUM_TEMPLATES : PREMIUM_TEMPLATES.filter((t) => t.region === region)),
    [region]
  );

  const activeRegionMeta = REGION_TABS.find((r) => r.id === region) ?? REGION_TABS[0];

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="page-header">
          <div>
            <h1>Signature Global 3D Templates</h1>
            <p className="subtitle">
              30 bespoke handcrafted 3D architectural invitations across Indian, Western &amp; European, and East Asian traditions.
            </p>
          </div>
        </div>

        {/* Regional Collection Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="chip-row">
            {REGION_TABS.map((rt) => (
              <button
                key={rt.id}
                type="button"
                className={`chip-btn ${region === rt.id ? 'active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}
                onClick={() => {
                  setRegion(rt.id);
                  const firstMatch =
                    rt.id === 'all'
                      ? PREMIUM_TEMPLATES[0]
                      : PREMIUM_TEMPLATES.find((t) => t.region === rt.id);
                  if (firstMatch) {
                    setFeatured(firstMatch);
                    setViewMode('stage');
                  }
                }}
              >
                <Globe size={13} />
                <span>{rt.label}</span>
                <span style={{ opacity: 0.72, fontSize: 11.5 }}>({rt.count})</span>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{activeRegionMeta.subtitle}</div>
        </div>

        {/* Interactive 3D Spotlight Preview Stage */}
        <div className="ol-hero-content" style={{ gap: 24 }}>
          <div className="monument-stage">
            <div className="stage-viewport" style={{ aspectRatio: '16 / 10' }}>
              <StudioStage
                ref={stageRef}
                project={featured.project}
                viewMode={viewMode}
                onPreviewDone={() => setPreviewing(false)}
                title="Premium Signature 3D Preview"
              />
            </div>
            <div className="stage-toolbar">
              <span style={{ fontWeight: 600, fontSize: 13.5 }}>
                {featured.name} · {getStructureById(featured.project.structure).name}
              </span>
              <div className="chip-row">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    setViewMode('stage');
                    stageRef.current?.sendCommand('PLAY_UNFOLD');
                  }}
                >
                  <RotateCw size={13} /> Unfold
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    setViewMode('wax_envelope');
                    stageRef.current?.sendCommand('PLAY_WAX_OPENING');
                  }}
                >
                  <MailOpen size={13} /> Unseal Envelope
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    if (previewing) {
                      stageRef.current?.sendCommand('STOP_PREVIEW');
                      setPreviewing(false);
                    } else {
                      setPreviewing(true);
                      stageRef.current?.sendCommand('START_PREVIEW');
                    }
                  }}
                >
                  {previewing ? <Square size={12} /> : <Play size={12} />}
                  {previewing ? 'Stop' : 'Full Preview'}
                </button>
              </div>
            </div>
          </div>

          <div className="card-glass" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className="badge-pill" style={{ width: 'fit-content' }}>
                <Sparkles size={12} /> {featured.vibeTag}
              </span>
              <h2 style={{ margin: 0, fontSize: 24 }}>{featured.name}</h2>
              <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14 }}>{featured.subtitle}</p>
              <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                <span>Architecture: {getStructureById(featured.project.structure).name}</span>
                <span>Rooms: {featured.project.rooms.map((r) => r.label).join(' / ')}</span>
                <span>Includes Wax Seal, Atmosphere &amp; Dual Photo Cutouts</span>
              </div>
            </div>

            <Link to={`/app/editor/tpl:${featured.id}`} className="btn btn-primary btn-lg">
              Customize in Studio <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Regional Handcrafted Templates Grid */}
        <div className="premium-grid">
          {visibleTemplates.map((tpl) => {
            const isSelected = tpl.id === featured.id;
            return (
              <div
                key={tpl.id}
                className="premium-card"
                style={{
                  borderColor: isSelected ? 'var(--accent)' : undefined,
                  borderWidth: isSelected ? 2 : 1,
                }}
              >
                <div
                  className="premium-card-art"
                  style={{
                    background: `linear-gradient(135deg, ${tpl.previewGradient[0]}, ${tpl.previewGradient[1]})`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 9px',
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.2)',
                      }}
                    >
                      {tpl.vibeTag}
                    </span>
                    <Crown size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{tpl.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>
                      {getStructureById(tpl.project.structure).name} · {tpl.project.cornersCount ?? 4} Corners
                    </div>
                  </div>
                </div>

                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, flex: 1, justifyContent: 'space-between' }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                    {tpl.subtitle}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setFeatured(tpl);
                        setViewMode('stage');
                      }}
                    >
                      Preview 3D
                    </button>
                    <Link
                      to={`/app/editor/tpl:${tpl.id}`}
                      className="btn btn-sm btn-primary"
                      style={{ flex: 1 }}
                    >
                      Edit Studio
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
