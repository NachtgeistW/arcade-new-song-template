import { previewLineCount } from './components/IntroOutro';
import type { LogoRef, MonthProps, Song } from './types';

export type TimelineItem =
  | { kind: 'title' | 'notice' | 'games' | 'stats' | 'lead' | 'credits' | 'preview'; frames: number }
  | {
      kind: 'section';
      frames: number;
      lines: string[];
      logos: LogoRef[];
      accent: string | null;
      showNext: boolean;
    }
  | { kind: 'song'; frames: number; song: Song; index: number };

const sectionKey = (s: Song) => s.section.join('\n');

const sectionLogos = (group: Song[]): LogoRef[] => {
  const first = group[0];
  if (!group.every((s) => s.gameId === first.gameId)) return [];
  if (!first.participants?.length) {
    return first.logo ? [{ name: first.gameName, logo: first.logo, onDark: first.logoOnDark, onLight: first.logoOnLight }] : [];
  }
  const logos: LogoRef[] = [];
  for (const p of group.flatMap((s) => s.participants)) if (!logos.some((l) => l.name === p.name)) logos.push(p);
  return logos;
};

export const buildTimeline = (p: MonthProps, fps: number): TimelineItem[] => {
  const sec = (s: number) => Math.round(s * fps);
  const minFrames = p.transitionFrames * 2 + 1;
  const items: TimelineItem[] = [{ kind: 'title', frames: sec(4) }];
  if (p.notice.length) items.push({ kind: 'notice', frames: sec(8) });
  if (p.songs.length) {
    items.push({ kind: 'games', frames: sec(6) }, { kind: 'stats', frames: sec(7) }, { kind: 'lead', frames: sec(2.5) });
  }

  let prevKey: string | null = null;
  p.songs.forEach((song, i) => {
    const key = sectionKey(song);
    if (key !== prevKey) {
      const group: Song[] = [];
      for (let j = i; j < p.songs.length && sectionKey(p.songs[j]) === key; j++) group.push(p.songs[j]);
      const single = group.every((s) => s.gameId === song.gameId);
      items.push({
        kind: 'section',
        frames: sec(3),
        lines: song.section,
        logos: sectionLogos(group),
        accent: single ? song.accent : null,
        showNext: prevKey !== null,
      });
      prevKey = key;
    }
    items.push({ kind: 'song', frames: Math.max(minFrames, sec(song.durationSec)), song, index: i + 1 });
  });

  if (p.previews.length) items.push({ kind: 'preview', frames: sec(Math.max(7, previewLineCount(p) * 0.45 + 4)) });
  items.push({ kind: 'credits', frames: sec(7) });
  return items;
};

export const totalFrames = (items: TimelineItem[], transitionFrames: number) =>
  items.reduce((n, it) => n + it.frames, 0) - Math.max(0, items.length - 1) * transitionFrames;
