import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  CARD_TEMPLATES,
  CardTemplatePreset,
  drawInvitationCard,
  getCardPixelSize,
} from '@patra/shared';

const SHOWCASE_CARD_IDS = [
  'card_jaipur_marigold_house',
  'card_kanjeevaram_temple',
  'card_cotswolds_rose_arch',
  'card_kyoto_sakura_branch',
  'card_manhattan_art_deco',
  'card_milestone_birthday_studio',
];

function LiveCardCanvas({ card }: { card: CardTemplatePreset }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = getCardPixelSize(card.config.aspectRatio);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawInvitationCard(ctx, width, height, card.config);
  }, [card]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={card.name}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    />
  );
}

interface LandingCardsShowcaseProps {
  isAuthenticated: boolean;
}

export function LandingCardsShowcase({ isAuthenticated }: LandingCardsShowcaseProps) {
  const cards = useMemo(() => {
    const picked = SHOWCASE_CARD_IDS.map((id) => CARD_TEMPLATES.find((c) => c.id === id)).filter(
      (c): c is CardTemplatePreset => Boolean(c)
    );
    return picked.length >= 3 ? picked : CARD_TEMPLATES.slice(0, 6);
  }, []);

  const [activeIdx, setActiveIdx] = useState(0);
  const count = cards.length;
  const activeCard = cards[activeIdx] ?? cards[0];
  const prevIdx = (activeIdx - 1 + count) % count;
  const nextIdx = (activeIdx + 1) % count;
  const prevCard = cards[prevIdx];
  const nextCard = cards[nextIdx];

  return (
    <section className="section" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="container">
        <div className="landing-cards-grid">
          {/* Left: Sculptural 3-Card Fanned Tabletop Spread */}
          <div className="landing-cards-stage">
            <div className="landing-cards-fan">
              {prevCard && (
                <button
                  type="button"
                  className="landing-card-slot landing-card-slot--prev"
                  onClick={() => setActiveIdx(prevIdx)}
                  aria-label={`Preview ${prevCard.name}`}
                >
                  <LiveCardCanvas card={prevCard} />
                </button>
              )}

              {activeCard && (
                <div className="landing-card-slot landing-card-slot--active">
                  <LiveCardCanvas card={activeCard} />
                </div>
              )}

              {nextCard && (
                <button
                  type="button"
                  className="landing-card-slot landing-card-slot--next"
                  onClick={() => setActiveIdx(nextIdx)}
                  aria-label={`Preview ${nextCard.name}`}
                >
                  <LiveCardCanvas card={nextCard} />
                </button>
              )}
            </div>

            <div className="landing-cards-stage-caption">
              <span>{activeCard.name}</span>
              <span>Click side cards to bring forward</span>
            </div>
          </div>

          {/* Right: Editorial Copy, 6-Style Swatch Picker & Studio Specs */}
          <div className="landing-cards-copy">
            <div>
              <span className="landing-cards-kicker">SINGLE-PAGE STATIONERY · 24 STYLES</span>
              <h2 className="section-title" style={{ marginTop: 8, marginBottom: 10 }}>
                Also crafted for one crisp page.
              </h2>
              <p className="section-desc" style={{ margin: 0 }}>
                Alongside folding 3D pavilions, design luxury single-page cards across Indian, Western, and East Asian traditions. Upload up to two croppable photos, tune foil typography, and download high-resolution PNG or JPG files ready for print or WhatsApp.
              </p>
            </div>

            <div>
              <div className="landing-cards-picker-label">SIGNATURE CARD EDITIONS</div>
              <div className="landing-cards-picker">
                {cards.map((card, idx) => {
                  const isActive = idx === activeIdx;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      className={`landing-card-swatch-btn ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveIdx(idx)}
                    >
                      <span
                        className="landing-card-swatch-dot"
                        style={{
                          background: card.config.paperColor,
                          borderColor: card.config.accentColor,
                        }}
                      />
                      <span className="landing-card-swatch-meta">
                        <strong>{card.name}</strong>
                        <small>{card.vibeTag}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="landing-cards-specs">
              <div>
                <strong>9:16 · 4:5 · 1:1</strong>
                <span>Story, Invite &amp; Square</span>
              </div>
              <div>
                <strong>Dual Photo Crop</strong>
                <span>Move, scale &amp; frame</span>
              </div>
              <div>
                <strong>HD PNG &amp; JPG</strong>
                <span>Print &amp; share ready</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link
                to={isAuthenticated ? '/app/cards' : '/register'}
                className="btn btn-primary btn-lg"
              >
                Open 1-Page Cards Studio <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
