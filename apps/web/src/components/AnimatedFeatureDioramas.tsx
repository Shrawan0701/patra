import React from 'react';

/**
 * 1. Continuous 3D unfolding courtyard pavilion framed by estate flower pots & glowing dome arch.
 * Uses pure GPU-composited transform/opacity keyframes with prefers-reduced-motion safety.
 */
export function GardenPavilionDiorama3D() {
  return (
    <div className="diorama-stage diorama-stage-garden" aria-hidden="true">
      <div className="diorama-glow diorama-glow-warm" />
      <div className="diorama-court">
        {/* Sandstone & turf perimeter base */}
        <div className="diorama-lawn-ring" />
        <div className="diorama-plinth-disc" />

        {/* Entrance stepping walkway */}
        <div className="diorama-walkway" />

        {/* Corner potted marigold planters */}
        <div className="diorama-pot diorama-pot-tl"><span /><i /></div>
        <div className="diorama-pot diorama-pot-tr"><span /><i /></div>
        <div className="diorama-pot diorama-pot-bl"><span /><i /></div>
        <div className="diorama-pot diorama-pot-br"><span /><i /></div>

        {/* Hinged 3D folding invitation walls */}
        <div className="diorama-wall diorama-wall-left">
          <div className="diorama-wall-arch" />
        </div>
        <div className="diorama-wall diorama-wall-right">
          <div className="diorama-signage-card">
            <i className="line-short" />
            <i className="line-wide" />
            <i className="line-mid" />
          </div>
        </div>

        {/* Rising pop-up mandap/chapel canopy inside */}
        <div className="diorama-popup-arch">
          <div className="diorama-arch-crown" />
          <div className="diorama-arch-pillar left" />
          <div className="diorama-arch-pillar right" />
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Hand-illustrated Marigold House Gatefold with swinging twin doors,
 * popping molten wax medallion clasp, and rising embossed inner card.
 */
export function FloralGatefoldDiorama3D() {
  return (
    <div className="diorama-stage diorama-stage-floral" aria-hidden="true">
      <div className="diorama-glow diorama-glow-crimson" />
      <div className="diorama-gatefold">
        {/* Back foil inner sleeve + rising invitation plaque */}
        <div className="diorama-card-back">
          <div className="diorama-inner-invite">
            <span className="diorama-inner-crest" />
            <i className="line-wide" />
            <i className="line-mid" />
          </div>
        </div>

        {/* Twin hinged illustrated doors (left & right halves) */}
        <div className="diorama-door diorama-door-left">
          <div className="diorama-door-border" />
          <div className="diorama-swag-dots left">
            <b /><b /><b /><b />
          </div>
          <span className="diorama-corner-flower left" />
        </div>
        <div className="diorama-door diorama-door-right">
          <div className="diorama-door-border" />
          <div className="diorama-swag-dots right">
            <b /><b /><b /><b />
          </div>
          <span className="diorama-corner-flower right" />
        </div>

        {/* Sculpted wax clasp popping out before doors open */}
        <div className="diorama-wax-clasp">
          <span>A&amp;M</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Twilight 3D Atmosphere stage with glowing moon halo, bobbing dual photo standees,
 * floating marigold/sakura petals, and a synchronized 3-act timeline bar.
 */
export function AtmosphereOrbitDiorama3D() {
  return (
    <div className="diorama-stage diorama-stage-atmo" aria-hidden="true">
      <div className="diorama-atmo-halo" />

      {/* Drifting 3D petals & golden fireflies */}
      <span className="diorama-petal p1" />
      <span className="diorama-petal p2" />
      <span className="diorama-petal p3" />
      <span className="diorama-petal p4" />
      <span className="diorama-petal p5" />
      <span className="diorama-petal p6" />

      <div className="diorama-atmo-deck">
        <div className="diorama-standee s-left">
          <div className="diorama-standee-photo" />
          <span className="diorama-standee-caption" />
        </div>
        <div className="diorama-standee s-right">
          <div className="diorama-standee-photo alt" />
          <span className="diorama-standee-caption" />
        </div>
      </div>

      {/* Live 3-Act Timeline Indicator */}
      <div className="diorama-timeline-pill">
        <div className="diorama-timeline-labels">
          <span>Garden</span>
          <span>Seal</span>
          <span>Rooms</span>
        </div>
        <div className="diorama-timeline-track">
          <div className="diorama-timeline-fill" />
        </div>
      </div>
    </div>
  );
}
