import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import {
  CATEGORIES,
  COLOR_PALETTES,
  CategoryId,
  ProjectConfig,
  STRUCTURES,
  StructureId,
  TEMPLATES,
  getStructureById,
} from '@patra/shared';
import { AppLayout } from '../components/AppLayout';
import { api } from '../lib/api';

export function StudioPage() {
  const navigate = useNavigate();
  const [cat, setCat] = useState<CategoryId>('wedding');
  const [roomCount, setRoomCount] = useState(2);
  const [cornersCount, setCornersCount] = useState<2 | 3 | 4>(3);
  const [structure, setStructure] = useState<StructureId>('palace_dome');
  const [paletteId, setPaletteId] = useState(COLOR_PALETTES[0].id);

  const [drafts, setDrafts] = useState<(ProjectConfig & { updatedAt: string })[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);

  const loadDrafts = async () => {
    setLoadingDrafts(true);
    try {
      const res = await api.listProjects();
      setDrafts(res.projects);
    } catch {
      setDrafts([]);
    } finally {
      setLoadingDrafts(false);
    }
  };

  useEffect(() => {
    void loadDrafts();
  }, []);

  const launchCustomBuilder = () => {
    navigate(
      `/app/editor/custom:${cat}:${Math.min(roomCount, cornersCount)}:${paletteId}?structure=${structure}&corners=${cornersCount}`
    );
  };

  const handleDeleteDraft = async (id: string) => {
    await api.deleteProject(id);
    setDrafts((prev) => prev.filter((p) => p.id !== id));
  };

  const catTemplates = TEMPLATES.filter((t) => t.category === cat);

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div>
          <span className="badge-pill">Patra Studio</span>
          <h1 style={{ margin: '10px 0 4px', fontSize: 30, fontWeight: 800 }}>
            Build from Scratch or Continue Drafts
          </h1>
          <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5 }}>
            Pick your structure, corner count, room count, and color palette, or resume any cloud draft synced with your phone.
          </p>
        </div>

        {/* Custom Studio Builder */}
        <div className="card-glass" style={{ padding: 26, gap: 18 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Custom 3D Invitation Builder</h2>

          <div className="field-group">
            <span className="field-label">1. Event Category</span>
            <div className="chip-row">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip-btn ${cat === c.id ? 'active' : ''}`}
                  onClick={() => setCat(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <span className="field-label">2. Architectural 3D Structure & Unfold</span>
            <div className="chip-row">
              {STRUCTURES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  className={`chip-btn ${structure === st.id ? 'active' : ''}`}
                  onClick={() => setStructure(st.id)}
                >
                  {st.name} · {st.unfoldLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="bento-2">
            <div className="field-group">
              <span className="field-label">3. Carousel Corners</span>
              <div className="chip-row">
                {([2, 3, 4] as const).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    className={`chip-btn ${cornersCount === cnt ? 'active' : ''}`}
                    onClick={() => {
                      setCornersCount(cnt);
                      if (roomCount > cnt) setRoomCount(cnt);
                    }}
                  >
                    {cnt} {cnt === 2 ? 'Wings' : 'Corners'}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-group">
              <span className="field-label">4. Folding Rooms</span>
              <div className="chip-row">
                {[1, 2, 3, 4].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    className={`chip-btn ${roomCount === cnt ? 'active' : ''}`}
                    onClick={() => {
                      setRoomCount(cnt);
                      if (cnt > cornersCount) setCornersCount(Math.min(4, Math.max(2, cnt)) as 2 | 3 | 4);
                    }}
                  >
                    {cnt} {cnt === 1 ? 'Room' : 'Rooms'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="field-group">
            <span className="field-label">5. Starting Paper Palette</span>
            <div className="chip-row">
              {COLOR_PALETTES.slice(0, 12).map((pal) => (
                <button
                  key={pal.id}
                  type="button"
                  title={pal.name}
                  className={`chip-btn ${paletteId === pal.id ? 'active' : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  onClick={() => setPaletteId(pal.id)}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      background: pal.accentPrimary,
                      border: '1px solid rgba(0,0,0,0.2)',
                    }}
                  />
                  {pal.name}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="btn btn-primary btn-lg" style={{ width: 'fit-content' }} onClick={launchCustomBuilder}>
            <Plus size={17} /> Launch Custom 3D Studio
          </button>
        </div>

        {/* Category Presets */}
        <div>
          <h2 style={{ margin: '0 0 14px', fontSize: 20 }}>
            Ready Templates for {CATEGORIES.find((c) => c.id === cat)?.name}
          </h2>
          <div className="bento-grid">
            {catTemplates.map((tpl) => (
              <div key={tpl.id} className="card-glass">
                <div
                  className="tpl-thumb"
                  style={{
                    height: 92,
                    background: `linear-gradient(135deg, ${tpl.previewGradient[0]}, ${tpl.previewGradient[1]})`,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 800, width: 'fit-content', background: 'rgba(255,255,255,0.88)', padding: '3px 8px', borderRadius: 999 }}>
                    {getStructureById(tpl.project.structure).name} · {tpl.project.cornersCount ?? 4}C
                  </span>
                  <strong>{tpl.name}</strong>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)' }}>{tpl.subtitle}</p>
                <Link to={`/app/editor/tpl:${tpl.id}`} className="btn btn-sm btn-primary">
                  Customize Template <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Cloud Drafts */}
        <div>
          <h2 style={{ margin: '0 0 14px', fontSize: 20 }}>Saved Cloud Drafts ({drafts.length})</h2>
          {loadingDrafts ? (
            <p style={{ color: 'var(--muted)' }}>Loading your saved drafts...</p>
          ) : drafts.length === 0 ? (
            <div className="card-glass">
              <p style={{ margin: 0, color: 'var(--ink-soft)' }}>
                No saved drafts yet. Open any template or custom card above and click Save Draft to sync it across web and mobile.
              </p>
            </div>
          ) : (
            <div className="bento-grid">
              {drafts.map((d) => (
                <div key={d.id} className="card-glass" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 17 }}>{d.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
                      {d.rooms.length} room(s) · {getStructureById(d.structure).name} · {d.aspectRatio}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/app/editor/${d.id}`} className="btn btn-sm btn-primary" style={{ flex: 1 }}>
                      Continue Editing
                    </Link>
                    {d.id && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        aria-label="Delete draft"
                        onClick={() => void handleDeleteDraft(d.id!)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
