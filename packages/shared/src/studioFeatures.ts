import {
  AtmosphereConfig,
  AtmosphereParticleId,
  CutoutFilter,
  CutoutPlacement,
  CutoutShape,
  EnvelopeLinerPattern,
  GardenConfig,
  GardenStyleId,
  PhotoCutoutConfig,
  ProjectConfig,
  TimeOfDayId,
  UserProfile,
  WaxCoverStyle,
  WaxCrestId,
  WaxRibbonStyle,
  WaxSealConfig,
} from './types';

export interface SwatchOption {
  id: string;
  name: string;
  hex: string;
}

export const ENVELOPE_COLORS: SwatchOption[] = [
  { id: 'cream_cotton', name: 'Cream Cotton', hex: '#F6EFE2' },
  { id: 'blush_parchment', name: 'Blush Parchment', hex: '#F2DCE0' },
  { id: 'sage_linen', name: 'Sage Linen', hex: '#DCE5D7' },
  { id: 'obsidian_velvet', name: 'Midnight Linen', hex: '#23202A' },
  { id: 'terracotta_clay', name: 'Terracotta Clay', hex: '#C86D52' },
  { id: 'royal_navy', name: 'Royal Navy', hex: '#1E2D4C' },
];

export const WAX_SEAL_COLORS: SwatchOption[] = [
  { id: 'vermilion', name: 'Royal Vermilion', hex: '#A41E22' },
  { id: 'antique_gold', name: 'Antique Gold', hex: '#C69334' },
  { id: 'champagne_rose', name: 'Dusty Rose', hex: '#C27482' },
  { id: 'emerald_forest', name: 'Emerald Jade', hex: '#1E5B45' },
  { id: 'obsidian_bronze', name: 'Espresso Bronze', hex: '#5A3A28' },
  { id: 'amethyst', name: 'Royal Plum', hex: '#5E2B57' },
];

export const LINER_PATTERNS: { id: EnvelopeLinerPattern; name: string; subtitle: string }[] = [
  { id: 'floral_foil', name: 'Floral Foil', subtitle: 'Botanical gold linework' },
  { id: 'gold_stripes', name: 'Heritage Stripes', subtitle: 'Fine metallic pinstripe' },
  { id: 'starry', name: 'Starlight Foil', subtitle: 'Night sky speckles' },
  { id: 'solid', name: 'Solid Matte', subtitle: 'Clean textured cardstock' },
];

export const WAX_CRESTS: { id: WaxCrestId; name: string; symbol: string }[] = [
  { id: 'monogram', name: 'Monogram', symbol: 'M' },
  { id: 'lotus', name: 'Sacred Lotus', symbol: '✿' },
  { id: 'rings', name: 'Twin Rings', symbol: '◎' },
  { id: 'crown', name: 'Royal Crown', symbol: '♛' },
  { id: 'olive', name: 'Olive Wreath', symbol: '❦' },
  { id: 'star', name: 'Celestial Star', symbol: '✦' },
];

export const WAX_RIBBON_STYLES: { id: WaxRibbonStyle; name: string }[] = [
  { id: 'silk_band', name: 'Silk Belly Band' },
  { id: 'gold_cord', name: 'Twisted Gold Cord' },
  { id: 'none', name: 'No Ribbon' },
];

export const WAX_COVER_STYLES: {
  id: WaxCoverStyle;
  name: string;
  subtitle: string;
  accentHex: string;
  badge: string;
}[] = [
  {
    id: 'marigold_house',
    name: 'Marigold Garland House',
    subtitle: 'Hand-illustrated pitched house gatefold with orange marigold toran & rosettes',
    accentHex: '#D96426',
    badge: 'Indian',
  },
  {
    id: 'rose_arch_card',
    name: 'Blush Rose Villa Arch',
    subtitle: 'Scalloped European floral arch doors with trailing roses & gold crest clasp',
    accentHex: '#B83354',
    badge: 'Global',
  },
  {
    id: 'sakura_gate_card',
    name: 'Kyoto Blossom Gatefold',
    subtitle: 'Curved shrine eave doors with cherry blossom branch swag & crimson stamp',
    accentHex: '#C25978',
    badge: 'East Asian',
  },
  {
    id: 'olive_villa_card',
    name: 'Mediterranean Olive Crest',
    subtitle: 'Botanical olive & lemon wreath gatefold card with brass wax medallion',
    accentHex: '#4E6B42',
    badge: 'Botanical',
  },
  {
    id: 'wax_envelope',
    name: 'Classic Cotton Envelope',
    subtitle: 'Foil-lined pointed cotton envelope with silk ribbon & molten wax seal',
    accentHex: '#A41E22',
    badge: 'Envelope',
  },
];

export const DEFAULT_WAX_SEAL: WaxSealConfig = {
  enabled: false,
  coverStyle: 'marigold_house',
  envelopeColor: '#F6EFE2',
  linerColor: '#DFC79A',
  linerPattern: 'floral_foil',
  waxColor: '#A41E22',
  crest: 'monogram',
  monogram: 'A&M',
  headline: 'You Are Warmly Invited',
  coverSubtitle: 'together with their families',
  coverDateVenue: '11 feb - 13 feb · jaipur',
  ribbonStyle: 'silk_band',
  ribbonColor: '#D6AD5B',
  openSpeed: 'normal',
  durationSeconds: 4,
};

export const GARDEN_STYLES: {
  id: GardenStyleId;
  name: string;
  subtitle: string;
  lawnHex: string;
  accentHex: string;
}[] = [
  {
    id: 'royal_marigold_courtyard',
    name: 'Royal Marigold Courtyard',
    subtitle: 'Sandstone stepped path, terracotta marigold pots & glowing lotus lanterns',
    lawnHex: '#7A9A58',
    accentHex: '#E8741E',
  },
  {
    id: 'english_botanical_lawn',
    name: 'Estate Rose Lawn',
    subtitle: 'Manicured turf, white boxwood planters, blush rose bushes & garden lights',
    lawnHex: '#6F9354',
    accentHex: '#D86C84',
  },
  {
    id: 'tuscan_olive_estate',
    name: 'Tuscan Olive Villa',
    subtitle: 'Travertine flagstones, sculpted cypress trees & olive-citrus urn pots',
    lawnHex: '#8C9B60',
    accentHex: '#C59B38',
  },
  {
    id: 'kyoto_sakura_garden',
    name: 'Kyoto Sakura Pond',
    subtitle: 'Zen moss lawn, timber bridge walkway, weeping cherry trees & stone lanterns',
    lawnHex: '#6A8E59',
    accentHex: '#F39BB4',
  },
  {
    id: 'starlit_oasis_terrace',
    name: 'Twilight Terrace Oasis',
    subtitle: 'Warm travertine courtyard, palms, brass pillar lamps & champagne blooms',
    lawnHex: '#4F6349',
    accentHex: '#E5B452',
  },
];

export const DEFAULT_GARDEN: GardenConfig = {
  enabled: true,
  style: 'royal_marigold_courtyard',
  hasEntranceArch: true,
  potDensity: 'balanced',
  entranceDurationSeconds: 3,
};

/** Picks a harmonious default estate garden style when a project omits `garden`. */
export function getDefaultGardenForProject(project?: ProjectConfig | null): GardenConfig {
  if (project?.garden) {
    return {
      ...DEFAULT_GARDEN,
      ...project.garden,
    };
  }
  const title = (project?.title ?? '').toLowerCase();
  const structure = project?.structure;
  const cat = project?.category;
  const firstAtmos = project?.rooms?.[0]?.atmosphere?.timeOfDay;

  let style: GardenStyleId = 'english_botanical_lawn';
  if (
    structure === 'torii_pavilion' ||
    title.includes('sakura') ||
    title.includes('kyoto') ||
    title.includes('hanok') ||
    title.includes('origami') ||
    title.includes('lantern') ||
    title.includes('chuseok')
  ) {
    style = 'kyoto_sakura_garden';
  } else if (
    firstAtmos === 'candlelit_twilight' ||
    firstAtmos === 'starlit_midnight' ||
    title.includes('starlit') ||
    title.includes('midnight') ||
    title.includes('soiree') ||
    title.includes('diwali') ||
    title.includes('eid')
  ) {
    style = 'starlit_oasis_terrace';
  } else if (
    structure === 'chateau_conservatory' ||
    title.includes('tuscan') ||
    title.includes('amalfi') ||
    title.includes('vineyard') ||
    title.includes('villa') ||
    title.includes('santorini')
  ) {
    style = 'tuscan_olive_estate';
  } else if (
    structure === 'palace_dome' ||
    cat === 'wedding' ||
    cat === 'haldi' ||
    cat === 'festivals' ||
    cat === 'housewarming' ||
    title.includes('marigold') ||
    title.includes('mandap') ||
    title.includes('haveli') ||
    title.includes('baraat') ||
    title.includes('haldi') ||
    title.includes('lotus')
  ) {
    style = 'royal_marigold_courtyard';
  }

  return {
    ...DEFAULT_GARDEN,
    style,
  };
}

/** Computes total video/preview duration (Garden Entrance + Cover Seal + Rooms). */
export function getProjectTotalSeconds(project?: ProjectConfig | null): number {
  if (!project) return 0;
  const garden = getDefaultGardenForProject(project);
  const gardenSecs = garden.enabled ? Math.max(0, Math.min(8, garden.entranceDurationSeconds ?? 3)) : 0;
  const waxEnabled = Boolean(project.waxSeal?.enabled);
  const defaultWaxSecs =
    project.waxSeal?.openSpeed === 'slow' ? 5 : project.waxSeal?.openSpeed === 'brisk' ? 3 : 4;
  const waxSecs = waxEnabled ? Math.max(2, Math.min(8, project.waxSeal?.durationSeconds ?? defaultWaxSecs)) : 0;
  const roomsSecs = project.rooms.reduce(
    (sum, r) => sum + Math.max(4, Math.min(25, r.durationSeconds ?? 8)),
    0
  );
  return Math.max(4, Math.round(gardenSecs + waxSecs + roomsSecs));
}

export const CUTOUT_PLACEMENTS: { id: CutoutPlacement; name: string; subtitle: string }[] = [
  { id: 'floor_standee', name: '3D Floor Standee', subtitle: 'Standing photo card with wooden easel base' },
  { id: 'wall_frame', name: 'Framed Wall Portrait', subtitle: 'Mounted on the focal arch wall above the stage' },
  { id: 'floating_easel', name: 'Craft Easel Frame', subtitle: 'Angled tabletop portrait display on an easel' },
];

export const CUTOUT_SHAPES: { id: CutoutShape; name: string; badge: string }[] = [
  { id: 'arch', name: 'Mughal Arch', badge: 'Arch' },
  { id: 'polaroid', name: 'Polaroid Print', badge: 'Frame' },
  { id: 'oval', name: 'Heirloom Oval', badge: 'Oval' },
  { id: 'scallop', name: 'Scallop Card', badge: 'Die-Cut' },
  { id: 'circle', name: 'Round Medallion', badge: 'Round' },
];

export const CUTOUT_FILTERS: { id: CutoutFilter; name: string }[] = [
  { id: 'vintage_warm', name: 'Warm Film' },
  { id: 'natural', name: 'True Color' },
  { id: 'sepia_editorial', name: 'Editorial Sepia' },
  { id: 'monochrome_noir', name: 'Classic B&W' },
];

export const DEFAULT_PHOTO_CUTOUT: PhotoCutoutConfig = {
  enabled: false,
  imageDataUrl: '',
  placement: 'floor_standee',
  shape: 'arch',
  filter: 'vintage_warm',
  paperBorderColor: '#FFF8EE',
  caption: 'Together Forever',
  scale: 1,
  offsetX: -0.78,
  offsetZ: 0.72,
  cropZoom: 1,
  cropX: 0,
  cropY: 0,
  rotationY: 0.2,
};

export const DEFAULT_PHOTO_CUTOUT_2: PhotoCutoutConfig = {
  enabled: false,
  imageDataUrl: '',
  placement: 'floating_easel',
  shape: 'polaroid',
  filter: 'natural',
  paperBorderColor: '#FFF8EE',
  caption: 'Our Story',
  scale: 0.95,
  offsetX: 0.78,
  offsetZ: 0.72,
  cropZoom: 1,
  cropX: 0,
  cropY: 0,
  rotationY: -0.22,
};

export interface TimeOfDayPreset {
  id: TimeOfDayId;
  name: string;
  subtitle: string;
  skyTop: string;
  skyBottom: string;
  ambientHex: string;
  ambientIntensity: number;
  hemiSkyHex: string;
  hemiGroundHex: string;
  hemiIntensity: number;
  keyHex: string;
  keyIntensity: number;
  keyPosition: [number, number, number];
  fillHex: string;
  fillIntensity: number;
  warmLampHex: string;
  exposure: number;
}

export const TIME_OF_DAY_OPTIONS: TimeOfDayPreset[] = [
  {
    id: 'morning_sun',
    name: 'Crisp Morning',
    subtitle: 'Bright sunlit paper studio',
    skyTop: '#F3EFE9',
    skyBottom: '#EAE2D5',
    ambientHex: '#fffcf7',
    ambientIntensity: 0.88,
    hemiSkyHex: '#ffffff',
    hemiGroundHex: '#efe2d2',
    hemiIntensity: 1.45,
    keyHex: '#fffaf0',
    keyIntensity: 1.15,
    keyPosition: [6, 11, 8],
    fillHex: '#fff4eb',
    fillIntensity: 0.65,
    warmLampHex: '#ffcf7d',
    exposure: 1.22,
  },
  {
    id: 'golden_hour',
    name: 'Golden Hour',
    subtitle: 'Honey sunset rays & long shadows',
    skyTop: '#F6DFC2',
    skyBottom: '#E7B98A',
    ambientHex: '#ffe7c4',
    ambientIntensity: 0.78,
    hemiSkyHex: '#ffdca8',
    hemiGroundHex: '#b8764a',
    hemiIntensity: 1.28,
    keyHex: '#ffae52',
    keyIntensity: 1.65,
    keyPosition: [-8, 5.2, 7.5],
    fillHex: '#ffd4a3',
    fillIntensity: 0.52,
    warmLampHex: '#ffba52',
    exposure: 1.18,
  },
  {
    id: 'rose_dusk',
    name: 'Rose Twilight',
    subtitle: 'Soft magenta-peach evening sky',
    skyTop: '#4A314D',
    skyBottom: '#E09A9E',
    ambientHex: '#f6d2da',
    ambientIntensity: 0.68,
    hemiSkyHex: '#f2b8c6',
    hemiGroundHex: '#59364a',
    hemiIntensity: 1.1,
    keyHex: '#ffb3a7',
    keyIntensity: 1.32,
    keyPosition: [-6.5, 6.5, 7],
    fillHex: '#a58ad6',
    fillIntensity: 0.58,
    warmLampHex: '#ffbe6b',
    exposure: 1.16,
  },
  {
    id: 'candlelit_twilight',
    name: 'Candlelit Courtyard',
    subtitle: 'Deep amber dusk with glowing diyas',
    skyTop: '#1A1525',
    skyBottom: '#392638',
    ambientHex: '#9278a8',
    ambientIntensity: 0.55,
    hemiSkyHex: '#7d6999',
    hemiGroundHex: '#2f1e18',
    hemiIntensity: 0.92,
    keyHex: '#ffba6b',
    keyIntensity: 1.18,
    keyPosition: [5, 8.5, 6],
    fillHex: '#635d96',
    fillIntensity: 0.45,
    warmLampHex: '#ff9d3b',
    exposure: 1.15,
  },
  {
    id: 'starlit_midnight',
    name: 'Starlit Midnight',
    subtitle: 'Velvet indigo night + glowing stage',
    skyTop: '#0B1020',
    skyBottom: '#1B2542',
    ambientHex: '#697eb8',
    ambientIntensity: 0.48,
    hemiSkyHex: '#7e97d9',
    hemiGroundHex: '#15192b',
    hemiIntensity: 0.84,
    keyHex: '#cad8ff',
    keyIntensity: 1.05,
    keyPosition: [4, 10, 7],
    fillHex: '#4f5d94',
    fillIntensity: 0.44,
    warmLampHex: '#ffae45',
    exposure: 1.12,
  },
];

export const ATMOSPHERE_PARTICLES: {
  id: AtmosphereParticleId;
  name: string;
  subtitle: string;
  color: string;
}[] = [
  { id: 'none', name: 'Still Air', subtitle: 'Subtle studio shimmer only', color: '#D8D2C9' },
  { id: 'marigold_petals', name: 'Marigold Petals', subtitle: 'Fluttering saffron & amber blooms', color: '#F59E0B' },
  { id: 'rose_petals', name: 'Rose Petals', subtitle: 'Soft drifting crimson petals', color: '#E11D48' },
  { id: 'sakura_blossoms', name: 'Blossom Breeze', subtitle: 'Blush cherry blossom petals', color: '#F472B6' },
  { id: 'golden_fireflies', name: 'Golden Fireflies', subtitle: 'Floating warm twilight embers', color: '#FBBF24' },
  { id: 'champagne_sparkles', name: 'Champagne Gold', subtitle: 'Celebration foil confetti sparkle', color: '#EAB308' },
  { id: 'soft_snow', name: 'Winter Snowfall', subtitle: 'Gentle crystalline drifts', color: '#93C5FD' },
];

export const DEFAULT_ATMOSPHERE: AtmosphereConfig = {
  timeOfDay: 'morning_sun',
  particles: 'none',
  particleDensity: 'lush',
  lampGlow: 0.65,
  cameraMotion: 'gentle_orbit',
};

export function hasPremiumStudioFeatures(project?: ProjectConfig | null): boolean {
  if (!project) return false;
  if (project.isPremiumTemplate) return true;
  if (project.waxSeal?.enabled) return true;
  return project.rooms.some((r) => {
    const a = r.atmosphere;
    if (!a) return false;
    return a.timeOfDay !== 'morning_sun' || a.particles !== 'none';
  });
}

export function hasActiveSubscriptionPlan(user?: UserProfile | null): boolean {
  if (!user) return false;
  if (user.planTier === 'NONE') return false;
  if (user.planRenewsAt && new Date(user.planRenewsAt) <= new Date()) return false;
  return true;
}

export function hasStudioUnlockAccess(user?: UserProfile | null): boolean {
  if (!user) return false;
  if (user.exportCredits > 0) return true;
  if (user.planTier !== 'NONE' && user.planExportsRemaining > 0) {
    if (!user.planRenewsAt || new Date(user.planRenewsAt) > new Date()) return true;
  }
  return false;
}
