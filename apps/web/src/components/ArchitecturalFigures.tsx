import React from 'react';

export function ArchitecturalPavilionFigure() {
  return (
    <svg width="176" height="148" viewBox="0 0 176 148" fill="none" aria-hidden="true">
      <defs>
        <pattern id="dots-pavilion" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.8" fill="currentColor" opacity="0.28" />
        </pattern>
      </defs>
      <circle cx="104" cy="64" r="46" fill="url(#dots-pavilion)" />
      <polygon points="22,94 88,62 154,94 88,126" fill="var(--bg-card)" stroke="currentColor" strokeWidth="1.2" />
      <polygon points="22,94 88,62 88,28 22,60" fill="var(--bg-subtle)" stroke="currentColor" strokeWidth="1.2" />
      <polygon points="88,62 154,94 154,60 88,28" fill="var(--bg-card)" stroke="currentColor" strokeWidth="1.2" />
      <rect x="64" y="64" width="48" height="30" rx="2" fill="var(--bg-card)" stroke="currentColor" strokeWidth="1.1" />
      <line x1="74" y1="75" x2="102" y2="75" stroke="currentColor" strokeWidth="1.1" opacity="0.7" />
      <line x1="78" y1="83" x2="98" y2="83" stroke="currentColor" strokeWidth="1" opacity="0.45" />
    </svg>
  );
}

export function ArchitecturalCubeFigure() {
  return (
    <svg width="176" height="148" viewBox="0 0 176 148" fill="none" aria-hidden="true">
      <polygon points="88,16 144,44 144,104 88,132 32,104 32,44" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      <line x1="88" y1="16" x2="88" y2="74" stroke="currentColor" strokeWidth="0.9" opacity="0.35" />
      <line x1="32" y1="104" x2="88" y2="74" stroke="currentColor" strokeWidth="0.9" opacity="0.35" />
      <line x1="144" y1="104" x2="88" y2="74" stroke="currentColor" strokeWidth="0.9" opacity="0.35" />
      <polygon points="88,58 122,74 88,90 54,74" fill="var(--ink)" opacity="0.72" />
      <polygon points="54,74 88,90 88,98 54,82" fill="var(--ink)" opacity="0.9" />
      <polygon points="88,90 122,74 122,82 88,98" fill="var(--ink)" opacity="0.52" />
      <line x1="32" y1="44" x2="88" y2="72" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="144" y1="44" x2="88" y2="72" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="88" y1="72" x2="88" y2="132" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

export function ArchitecturalOrbitFigure() {
  return (
    <svg width="176" height="148" viewBox="0 0 176 148" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="sphere-grad" cx="38%" cy="35%" r="65%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.58" />
        </radialGradient>
      </defs>
      <circle cx="88" cy="74" r="38" fill="url(#sphere-grad)" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
      <ellipse cx="88" cy="74" rx="64" ry="20" transform="rotate(-18 88 74)" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <ellipse cx="88" cy="74" rx="60" ry="22" transform="rotate(24 88 74)" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <circle cx="34" cy="92" r="2.8" fill="currentColor" opacity="0.75" />
      <circle cx="144" cy="56" r="2.8" fill="currentColor" opacity="0.75" />
      <circle cx="132" cy="108" r="2.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
