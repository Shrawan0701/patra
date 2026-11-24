import { Router } from 'express';
import {
  CATEGORIES,
  CENTERPIECES,
  COLOR_PALETTES,
  FLOOR_PATTERNS,
  GARLANDS,
  MUSIC_TRACKS,
  SIDE_PROPS,
  TEMPLATES,
  WALL_STYLES,
} from '@patra/shared';

export const templatesRouter = Router();

templatesRouter.get('/', (_req, res) => {
  res.json({
    categories: CATEGORIES,
    templates: TEMPLATES,
    palettes: COLOR_PALETTES,
    musicTracks: MUSIC_TRACKS,
    props: {
      wallStyles: WALL_STYLES,
      garlands: GARLANDS,
      centerpieces: CENTERPIECES,
      sideProps: SIDE_PROPS,
      floorPatterns: FLOOR_PATTERNS,
    },
  });
});
