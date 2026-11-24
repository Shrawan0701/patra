import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES, CategoryId, TEMPLATES, getStructureById } from '@patra/shared';
import { MarketingLayout } from '../components/MarketingLayout';
import { useAuth } from '../context/AuthContext';

export function TemplatesPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const initialCat = (params.get('cat') as CategoryId | 'all') || 'all';
  const [selectedCat, setSelectedCat] = useState<CategoryId | 'all'>(initialCat);

  const filtered = useMemo(() => {
    const base = selectedCat === 'all' ? TEMPLATES : TEMPLATES.filter((t) => t.category === selectedCat);
    if (selectedCat === 'all') {
      return [...base].sort((a, b) => (a.id === 'wed_candle_chapel' ? -1 : b.id === 'wed_candle_chapel' ? 1 : 0));
    }
    if (selectedCat === 'wedding') {
      return [...base].reverse();
    }
    return base;
  }, [selectedCat]);

  return (
    <MarketingLayout>
      <section className="ol-hero" style={{ minHeight: 'auto', padding: '132px 0 48px' }}>
        <div className="container">
          <span className="badge-pill">Curated Collection</span>
          <h1 className="ol-hero-title" style={{ marginTop: 14 }}>Invitation Templates</h1>
          <p className="ol-hero-sub" style={{ maxWidth: 640 }}>
            Every design includes tailored wall signage, coordinated palettes, music loops, and configurable corners ready to personalize.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container">
          <div className="chip-row" style={{ marginBottom: 28 }}>
            <button
              type="button"
              className={`chip-btn ${selectedCat === 'all' ? 'active' : ''}`}
              onClick={() => {
                setSelectedCat('all');
                setParams({});
              }}
            >
              All Templates
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`chip-btn ${selectedCat === cat.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCat(cat.id);
                  setParams({ cat: cat.id });
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="bento-grid">
            {filtered.map((tpl) => {
              const struct = getStructureById(tpl.project.structure);
              return (
                <div key={tpl.id} className="card-glass reveal-card" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                          {tpl.project.rooms.length}R · {tpl.project.cornersCount ?? 4}C
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{struct.name}</div>
                    </div>

                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>{tpl.name}</h3>
                      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-soft)' }}>{tpl.subtitle}</p>
                    </div>
                  </div>

                  <Link
                    to={user ? `/app/editor/tpl:${tpl.id}` : '/register'}
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: 6 }}
                  >
                    Open in Studio <ArrowRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
