import {
  DEFAULT_WAX_SEAL,
  ProjectConfig,
  TemplatePreset,
  WaxCoverStyle,
  getDefaultGardenForProject,
} from '@patra/shared';

/**
 * Builds a showcase-ready project so the full 3-act tour always plays:
 * Garden Entrance -> Floral Gatefold Seal -> Inside 3D pavilion.
 */
export function buildShowcaseProject(tpl: TemplatePreset): ProjectConfig {
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
