export type CategoryId =
  | 'wedding'
  | 'haldi'
  | 'reception'
  | 'birthday'
  | 'parties'
  | 'baby_shower'
  | 'engagement'
  | 'housewarming'
  | 'festivals';

export type WallStyleId =
  | 'classic_gable'
  | 'arched_windows'
  | 'draped_curtains'
  | 'scalloped_palace'
  | 'modern_minimal'
  | 'jharokha_lattice'
  | 'botanical_relief'
  | 'shoji_screen'
  | 'parisian_paneling';

export type GarlandId =
  | 'marigold'
  | 'fairy_lights'
  | 'floral_drape'
  | 'balloons'
  | 'bunting'
  | 'toran'
  | 'lanterns'
  | 'origami_cranes'
  | 'sakura_branches'
  | 'ivy_edison_bulbs'
  | 'none';

export type CenterpieceId =
  | 'mandap'
  | 'haldi_swing'
  | 'tiered_cake'
  | 'floral_arch'
  | 'chapel_altar'
  | 'balloon_cake'
  | 'party_dj_bar'
  | 'nursery_crib'
  | 'ring_gazebo'
  | 'cozy_sofa'
  | 'diwali_rangoli'
  | 'christmas_fireplace'
  | 'eid_arch'
  | 'origami_crane_canopy'
  | 'lotus_pond_pavilion'
  | 'celestial_moon_arch'
  | 'peacock_royal_throne'
  | 'floating_lantern_pagoda'
  | 'tuscan_vineyard_arbor'
  | 'paris_champagne_fountain'
  | 'cathedral_stained_rose'
  | 'alpine_chalet_hearth'
  | 'hampton_garden_pergola'
  | 'kyoto_torii_bridge'
  | 'hanok_courtyard_tea'
  | 'cherry_blossom_shrine'
  | 'lunar_dragon_arch'
  | 'zen_bamboo_pavilion';

export type SidePropId =
  | 'banana_leaves'
  | 'turmeric_bowls'
  | 'gift_boxes'
  | 'dining_table'
  | 'floor_cushions'
  | 'balloons_cluster'
  | 'potted_palms'
  | 'diya_lamps'
  | 'champagne_tower'
  | 'teddy_blocks'
  | 'candles';

export type FloorPatternId =
  | 'rangoli_petal'
  | 'checkered_marble'
  | 'woven_rug'
  | 'confetti_dots'
  | 'wood_parquet'
  | 'starry_tile';

export type FontStyleId =
  | 'royal_serif'
  | 'handwritten'
  | 'botanical'
  | 'playful_hand'
  | 'modern_sans'
  | 'festive_script';

export interface FontStyleOption {
  id: FontStyleId;
  name: string;
  vibe: string;
  titleFont: string;
  bodyFont: string;
}

export type AspectRatio = '9:16' | '1:1' | '16:9';

export type CurrencyCode = 'INR' | 'USD';

export type PlanId = 'SINGLE_PASS' | 'MONTHLY_CREATOR' | 'YEARLY_ALL_ACCESS';

export interface ColorPalette {
  id: string;
  name: string;
  paperBase: string;
  wallTint: string;
  inkColor: string;
  accentPrimary: string;
  accentSecondary: string;
  floorColor: string;
  backdropColor: string;
}

export interface RoomSignage {
  eventTitle: string;
  hostLine: string;
  dateText: string;
  timeText: string;
  venueText: string;
  noteText: string;
}

export interface CustomTextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  scale?: number;
  color?: string;
  fontStyle?: FontStyleId;
}

export type WaxCrestId = 'monogram' | 'lotus' | 'rings' | 'crown' | 'olive' | 'star';

export type WaxCoverStyle =
  | 'wax_envelope'
  | 'marigold_house'
  | 'rose_arch_card'
  | 'sakura_gate_card'
  | 'olive_villa_card';

export type WaxRibbonStyle = 'none' | 'silk_band' | 'gold_cord';

export type EnvelopeLinerPattern = 'solid' | 'floral_foil' | 'gold_stripes' | 'starry';

export interface WaxSealConfig {
  enabled: boolean;
  coverStyle?: WaxCoverStyle;
  envelopeColor: string;
  linerColor: string;
  linerPattern: EnvelopeLinerPattern;
  waxColor: string;
  crest: WaxCrestId;
  monogram: string;
  headline: string;
  coverSubtitle?: string;
  coverDateVenue?: string;
  ribbonStyle: WaxRibbonStyle;
  ribbonColor: string;
  openSpeed: 'slow' | 'normal' | 'brisk';
  durationSeconds?: number;
}

export type CutoutPlacement = 'floor_standee' | 'wall_frame' | 'floating_easel';

export type CutoutShape = 'arch' | 'polaroid' | 'oval' | 'scallop' | 'circle';

export type CutoutFilter = 'vintage_warm' | 'natural' | 'sepia_editorial' | 'monochrome_noir';

export interface PhotoCutoutConfig {
  enabled: boolean;
  imageDataUrl: string;
  placement: CutoutPlacement;
  shape: CutoutShape;
  filter: CutoutFilter;
  paperBorderColor: string;
  caption: string;
  scale: number;
  offsetX: number;
  offsetZ: number;
  cropZoom?: number;
  cropX?: number;
  cropY?: number;
  rotationY?: number;
}

export type TimeOfDayId =
  | 'morning_sun'
  | 'golden_hour'
  | 'rose_dusk'
  | 'candlelit_twilight'
  | 'starlit_midnight';

export type AtmosphereParticleId =
  | 'none'
  | 'marigold_petals'
  | 'rose_petals'
  | 'sakura_blossoms'
  | 'golden_fireflies'
  | 'champagne_sparkles'
  | 'soft_snow';

export interface AtmosphereConfig {
  timeOfDay: TimeOfDayId;
  particles: AtmosphereParticleId;
  particleDensity: 'subtle' | 'lush' | 'festive';
  lampGlow: number;
  cameraMotion: 'steady' | 'gentle_orbit' | 'cinematic_push';
}

export interface RoomConfig {
  id: string;
  label: string;
  category: CategoryId;
  paletteId: string;
  wallStyle: WallStyleId;
  garland: GarlandId;
  centerpiece: CenterpieceId;
  sideProps: SidePropId[];
  floorPattern: FloorPatternId;
  fontStyle?: FontStyleId;
  durationSeconds?: number;
  signage: RoomSignage;
  customTexts?: CustomTextOverlay[];
  photoCutout?: PhotoCutoutConfig;
  photoCutout2?: PhotoCutoutConfig;
  atmosphere?: AtmosphereConfig;
}

export type StructureId =
  | 'carousel_gable'
  | 'palace_dome'
  | 'tri_stage'
  | 'hex_gazebo'
  | 'modern_gallery'
  | 'torii_pavilion'
  | 'chateau_conservatory'
  | 'scandi_atrium';

export interface StructureOption {
  id: StructureId;
  name: string;
  subtitle: string;
  unfoldLabel: string;
}

export type GardenStyleId =
  | 'royal_marigold_courtyard'
  | 'tuscan_olive_estate'
  | 'kyoto_sakura_garden'
  | 'english_botanical_lawn'
  | 'starlit_oasis_terrace';

export interface GardenConfig {
  enabled: boolean;
  style: GardenStyleId;
  hasEntranceArch: boolean;
  potDensity: 'minimal' | 'balanced' | 'lush';
  entranceDurationSeconds?: number;
}

export interface ProjectConfig {
  id?: string;
  title: string;
  category: CategoryId;
  aspectRatio: AspectRatio;
  musicId: string;
  structure?: StructureId;
  cornersCount?: 2 | 3 | 4;
  rooms: RoomConfig[];
  waxSeal?: WaxSealConfig;
  garden?: GardenConfig;
  isPremiumTemplate?: boolean;
}

export interface CategoryMeta {
  id: CategoryId;
  name: string;
  shortName: string;
  tagline: string;
  accent: string;
  badge: string;
}

export type TemplateRegionId = 'indian' | 'western' | 'east_asian';

export interface TemplatePreset {
  id: string;
  category: CategoryId;
  region?: TemplateRegionId;
  name: string;
  subtitle: string;
  vibeTag: string;
  previewGradient: [string, string];
  isPremium?: boolean;
  project: Omit<ProjectConfig, 'id'>;
}

export interface PropOption<T extends string = string> {
  id: T;
  name: string;
  categoryHint: string;
}

export type MusicTimbre =
  | 'shehnai'
  | 'santoor'
  | 'harp'
  | 'celesta'
  | 'rhodes'
  | 'flute'
  | 'sitar'
  | 'bells';

export interface MusicTrack {
  id: string;
  name: string;
  mood: string;
  categoryHint: string;
  bpm: number;
  timbre: MusicTimbre;
  chords: number[][];
  notes: number[];
  waveform: 'sine' | 'triangle';
}

export interface PricingPlan {
  id: PlanId;
  name: string;
  badge?: string;
  description: string;
  priceInr: number;
  priceUsd: number;
  billingCycle: 'one_time' | 'monthly' | 'yearly';
  exportQuota: number;
  features: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  exportCredits: number;
  planTier: 'NONE' | 'MONTHLY_CREATOR' | 'YEARLY_ALL_ACCESS';
  planExportsRemaining: number;
  planRenewsAt: string | null;
  autoRenewCancelled?: boolean;
  createdAt: string;
}

export interface ExportRecord {
  id: string;
  projectId: string | null;
  projectTitle: string;
  aspectRatio: AspectRatio;
  resolution: '1080p' | '4K';
  createdAt: string;
}

export type CardAspectRatio = '9:16' | '4:5' | '1:1';

export type CardFrameStyle =
  | 'house_gable'
  | 'mughal_arch'
  | 'villa_arch'
  | 'scalloped'
  | 'double_hairline'
  | 'ornate_corner'
  | 'art_deco';

export type CardMotifId =
  | 'marigold_toran'
  | 'temple_bells'
  | 'rose_swag'
  | 'olive_citrus'
  | 'sakura_branch'
  | 'double_happiness'
  | 'alpona_lotus'
  | 'crescent_stars'
  | 'art_deco_fan'
  | 'mizuhiki_knot'
  | 'none';

export type CardPhotoShape = 'arch' | 'oval' | 'circle' | 'polaroid';

export interface InvitationCardConfig {
  templateId: string;
  title: string;
  category: CategoryId;
  aspectRatio: CardAspectRatio;
  fontStyle: FontStyleId;
  paperColor: string;
  secondaryPaperColor: string;
  inkColor: string;
  accentColor: string;
  secondaryAccentColor: string;
  frameStyle: CardFrameStyle;
  motif: CardMotifId;
  foilShimmer: boolean;
  cornerRosettes: boolean;
  waxSealEnabled: boolean;
  waxColor: string;
  monogram: string;
  topBlessing: string;
  coupleOrHeadline: string;
  hostsLine: string;
  dateText: string;
  timeText: string;
  venueText: string;
  footerNote: string;
  textScale: number;
  photoEnabled: boolean;
  photoDataUrl: string;
  photoShape: CardPhotoShape;
  photoSize?: number;
  photoPosX?: number;
  photoPosY?: number;
  photoZoom: number;
  photoPanX: number;
  photoPanY: number;
  photo2Enabled?: boolean;
  photo2DataUrl?: string;
  photo2Shape?: CardPhotoShape;
  photo2Size?: number;
  photo2PosX?: number;
  photo2PosY?: number;
  photo2Zoom?: number;
  photo2PanX?: number;
  photo2PanY?: number;
}

export interface CardTemplatePreset {
  id: string;
  name: string;
  subtitle: string;
  region: TemplateRegionId;
  category: CategoryId;
  vibeTag: string;
  previewGradient: [string, string];
  config: InvitationCardConfig;
}
