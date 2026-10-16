import type { ThemeName } from './types';

export interface Palette {
  bg: string;
  bgGradient: string;
  fg: string;
  muted: string;
  line: string;
  panel: string;
  accent: string;
}

export const PALETTES: Record<ThemeName, Palette> = {
  classic: {
    bg: '#e9dfd0',
    bgGradient: 'radial-gradient(120% 90% at 20% 10%, #f3ebdf 0%, #e6d9c6 55%, #d9c8b0 100%)',
    fg: '#2e2620',
    muted: '#7a6a5a',
    line: 'rgba(46,38,32,0.18)',
    panel: 'rgba(255,255,255,0.45)',
    accent: '#a5774a',
  },
  glass: {
    bg: '#14161d',
    bgGradient: 'radial-gradient(100% 80% at 15% 0%, #2b3150 0%, #161925 55%, #0c0d13 100%)',
    fg: '#f4f5fa',
    muted: 'rgba(244,245,250,0.62)',
    line: 'rgba(255,255,255,0.18)',
    panel: 'rgba(255,255,255,0.10)',
    accent: '#8fb4ff',
  },
  stage: {
    bg: '#0b0c10',
    bgGradient: 'radial-gradient(90% 70% at 85% 100%, #24113a 0%, #0f0f17 55%, #08080b 100%)',
    fg: '#ffffff',
    muted: 'rgba(255,255,255,0.55)',
    line: 'rgba(255,255,255,0.14)',
    panel: 'rgba(255,255,255,0.05)',
    accent: '#ff4fa3',
  },
  select: {
    bg: '#070b1f',
    bgGradient: 'radial-gradient(80% 70% at 70% 30%, #1b2a6b 0%, #0b1033 50%, #05071a 100%)',
    fg: '#ffffff',
    muted: 'rgba(200,215,255,0.65)',
    line: 'rgba(120,170,255,0.25)',
    panel: 'rgba(20,35,90,0.6)',
    accent: '#3ee8ff',
  },
  editorial: {
    bg: '#f3efe6',
    bgGradient: 'linear-gradient(180deg, #f6f2ea 0%, #efe9dd 100%)',
    fg: '#151311',
    muted: '#6d655b',
    line: 'rgba(21,19,17,0.85)',
    panel: '#ffffff',
    accent: '#d6402b',
  },
  highway: {
    bg: '#030305',
    bgGradient: 'radial-gradient(70% 55% at 50% 100%, #1a0f2e 0%, #07060c 60%, #020203 100%)',
    fg: '#ffffff',
    muted: 'rgba(255,255,255,0.58)',
    line: 'rgba(255,255,255,0.14)',
    panel: 'rgba(255,255,255,0.06)',
    accent: '#b46bff',
  },
};

export const withAlpha = (hex: string, alpha: number) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};
