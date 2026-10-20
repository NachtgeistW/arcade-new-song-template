export const THEMES = ['classic', 'glass', 'stage', 'select', 'editorial', 'highway'] as const;
export type ThemeName = (typeof THEMES)[number];

export type SongMedia =
  | { kind: 'video'; src: string; width?: number; height?: number }
  | { kind: 'cover'; cover: string; audio: string };

export interface LogoRef {
  name: string;
  logo: string | null;
  onDark: boolean;
  onLight: boolean;
}

export interface Song {
  order: number;
  section: string[];
  gameId: string;
  gameName: string;
  logo: string | null;
  logoOnDark: boolean;
  logoOnLight: boolean;
  /** 多机种活动的参与机种；普通机种为空数组 */
  participants: LogoRef[];
  accent: string;
  title: string;
  artist: string;
  genre: string;
  category: string;
  date: string;
  unlock: string;
  media: SongMedia;
  viz: string;
  durationSec: number;
}

export interface PreviewGroup {
  game: string;
  dates: { date: string; items: { title: string; artist: string }[] }[];
}

export interface CreditBlock {
  heading: string;
  lines: string[];
}

export interface MonthProps {
  year: number;
  month: number;
  theme: ThemeName;
  title: string;
  notice: string[];
  companies: { name: string; games: string[] }[];
  total: number;
  categories: { label: string; count: number }[];
  previews: PreviewGroup[];
  credits: CreditBlock[];
  songs: Song[];
  sectionSfx: string | null;
  transitionFrames: number;
  fadeInSec: number;
  fadeOutSec: number;
  [key: string]: unknown;
}
