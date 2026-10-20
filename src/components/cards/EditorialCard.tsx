import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { FONT_JP, FONT_SC, FONT_SERIF } from '../../fonts';
import { PALETTES } from '../../palette';
import { FitText } from '../FitText';
import { MediaBox } from '../MediaBox';
import { GameLogo, dottedDate, pad2, useEnter, type CardProps } from './shared';

const P = PALETTES.editorial;
const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.07 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

const Rule: React.FC<{ top: number; left?: number; width: number; progress: number; weight?: number }> = ({ top, left = 80, width, progress, weight = 2 }) => (
  <div style={{ position: 'absolute', left, top, width, height: weight, background: P.fg, transform: `scaleX(${progress})`, transformOrigin: 'left' }} />
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: FONT_JP, fontSize: 18, fontWeight: 800, letterSpacing: 5, color: P.muted, textTransform: 'uppercase' }}>{children}</div>
);

export const EditorialCard: React.FC<CardProps> = ({ song, year, month, index, total, durationInFrames, fadeInSec, fadeOutSec }) => {
  const rules = useEnter(0, 26);
  const photo = useEnter(4, 22);
  const side = useEnter(10);
  const title = useEnter(14, 22);
  const meta = useEnter(20);
  const reveal = interpolate(photo, [0, 1], [100, 0]);

  return (
    <AbsoluteFill style={{ background: P.bgGradient, color: P.fg, fontFamily: FONT_SERIF, overflow: 'hidden' }}>
      <AbsoluteFill style={{ backgroundImage: GRAIN, opacity: 0.9 }} />

      <div style={{ position: 'absolute', left: 80, top: 48, right: 120, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', opacity: rules }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
          <span style={{ fontSize: 34, fontWeight: 900, letterSpacing: 4 }}>街机音游新曲回顾</span>
          <span style={{ fontFamily: FONT_JP, fontSize: 18, fontWeight: 700, letterSpacing: 6, color: P.muted }}>MONTHLY ARCADE RHYTHM REVIEW</span>
        </div>
        <span style={{ fontFamily: FONT_JP, fontSize: 20, fontWeight: 700, letterSpacing: 4 }}>
          VOL. {year}.{pad2(month)} — No.{pad2(index)}
        </span>
      </div>
      <Rule top={106} width={1720} progress={rules} weight={3} />
      <Rule top={114} width={1720} progress={rules} weight={1} />

      <div
        style={{
          position: 'absolute',
          left: 100,
          top: 176,
          width: 1180,
          height: 664,
          background: song.accent,
          opacity: 0.9 * photo,
          transform: `translate(${interpolate(photo, [0, 1], [0, 18])}px, ${interpolate(photo, [0, 1], [0, 18])}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 80,
          top: 156,
          width: 1180,
          height: 664,
          border: `2px solid ${P.fg}`,
          boxSizing: 'border-box',
          overflow: 'hidden',
          clipPath: `inset(0 0 ${reveal}% 0)`,
          background: '#000',
        }}
      >
        <MediaBox media={song.media} durationInFrames={durationInFrames} fadeInSec={fadeInSec} fadeOutSec={fadeOutSec} />
      </div>
      <div style={{ position: 'absolute', left: 80, top: 846, fontSize: 22, fontStyle: 'italic', color: P.muted, opacity: photo }}>
        Fig. {pad2(index)} ― <span style={{ fontFamily: FONT_JP, fontStyle: 'normal', fontWeight: 600 }}>{song.gameName}</span>
      </div>

      <div style={{ position: 'absolute', left: 80, top: 890, width: 1180, opacity: title, transform: `translateY(${interpolate(title, [0, 1], [30, 0])}px)` }}>
        <div style={{ height: 110 }}>
          <FitText text={song.title} maxSize={100} minSize={24} style={{ fontWeight: 900, letterSpacing: 2 }} />
        </div>
        <div style={{ height: 50, display: 'flex', alignItems: 'center', gap: 16, color: P.muted }}>
          <span style={{ fontStyle: 'italic', fontSize: 28 }}>by</span>
          <div style={{ flex: 1, minWidth: 0, height: 50, color: P.fg }}>
            <FitText text={song.artist} maxSize={34} minSize={18} style={{ fontWeight: 600 }} />
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 1330, top: 140, width: 470, opacity: side, transform: `translateY(${interpolate(side, [0, 1], [24, 0])}px)` }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          <span style={{ fontSize: 250, fontWeight: 900, lineHeight: 0.92, fontVariantNumeric: 'tabular-nums' }}>{pad2(index)}</span>
          <span style={{ fontSize: 40, fontWeight: 500, color: P.muted, marginBottom: 20 }}>/{total}</span>
        </div>
        <div style={{ width: 120 * side, height: 12, background: song.accent, margin: '18px 0 28px' }} />
        <div style={{ height: 190, background: song.logoOnDark ? P.fg : P.panel, border: `2px solid ${P.fg}`, padding: 26, boxSizing: 'border-box' }}>
          <GameLogo song={song} color={P.fg} />
        </div>
        {song.unlock ? (
          <div style={{ marginTop: 34 }}>
            <Label>Unlock —</Label>
            <div style={{ height: 150, marginTop: 10 }}>
              <FitText text={song.unlock} maxSize={32} minSize={18} multiline style={{ fontFamily: '"Noto Serif SC", "Noto Serif JP", serif', fontWeight: 700 }} />
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ position: 'absolute', left: 1330, top: 880, width: 470, opacity: meta }}>
        <Rule top={0} left={0} width={470} progress={meta} weight={2} />
        <div style={{ display: 'flex', paddingTop: 18 }}>
          <div style={{ flex: 1 }}>
            <Label>Genre</Label>
            <div style={{ fontFamily: FONT_SC, fontSize: 36, fontWeight: 800, marginTop: 8, color: song.accent }}>{song.genre || '—'}</div>
          </div>
          <div style={{ width: 2, background: P.fg, margin: '0 26px' }} />
          <div style={{ flex: 1.2 }}>
            <Label>Release</Label>
            <div style={{ fontSize: 40, fontWeight: 900, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{dottedDate(song.date)}</div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 34,
          top: 150,
          writingMode: 'vertical-rl',
          fontFamily: FONT_SC,
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: 8,
          color: P.muted,
          opacity: rules,
        }}
      >
        {year}年{month}月 · 街机音游新曲回顾 · TRACK {pad2(index)}
      </div>
    </AbsoluteFill>
  );
};
