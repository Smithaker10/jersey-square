import type { Sport } from '@/types/product';

export interface Subcategory {
  id: string;
  label: string;
}

export interface SportConfig {
  id: Sport;
  label: string;
  path: string;
  description: string;
  subcategories: Subcategory[];
}

export const SPORTS: SportConfig[] = [
  {
    id: 'football',
    label: 'Football',
    path: '/football',
    description: 'Club & national kits — fan, player, retro & more.',
    subcategories: [
      { id: 'player-version', label: 'Player Version' },
      { id: 'fan-version', label: 'Fan Version' },
      { id: 'master-version', label: 'Master Version' },
      { id: 'sublimation', label: 'Sublimation' },
      { id: 'retro', label: 'Retro' },
      { id: 'anime', label: 'Anime' },
    ],
  },
  {
    id: 'f1',
    label: 'Formula 1',
    path: '/f1',
    description: 'Team race wear inspired by the grid.',
    subcategories: [
      { id: 'player-version', label: 'Player Version' },
      { id: 'fan-version', label: 'Fan Version' },
      { id: 'master-version', label: 'Master Version' },
      { id: 'sublimation', label: 'Sublimation' },
    ],
  },
  {
    id: 'cricket',
    label: 'Cricket',
    path: '/cricket',
    description: 'IPL & international cricket jerseys.',
    subcategories: [
      { id: 'player-version', label: 'Player Version' },
      { id: 'fan-version', label: 'Fan Version' },
      { id: 'master-version', label: 'Master Version' },
      { id: 'sublimation', label: 'Sublimation' },
    ],
  },
];

export function getSportConfig(sport: Sport) {
  return SPORTS.find((s) => s.id === sport)!;
}

export function getSubcategoryLabel(sport: Sport, categoryId: string) {
  return (
    getSportConfig(sport).subcategories.find((c) => c.id === categoryId)?.label ??
    categoryId
  );
}

/** Labels shown on product cards: FOOTBALL · PLAYER VERSION */
export const CATEGORY_LABELS: Record<string, string> = {
  'player-version': 'PLAYER VERSION',
  'fan-version': 'FAN VERSION',
  'master-version': 'MASTER VERSION',
  'indian-embroidery': 'INDIAN EMBROIDERY',
  sublimation: 'SUBLIMATION',
  retro: 'RETRO',
  anime: 'ANIME',
};
