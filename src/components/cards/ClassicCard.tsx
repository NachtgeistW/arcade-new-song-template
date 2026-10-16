import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { FONT_JP, FONT_SC } from '../../fonts';
import { PALETTES, withAlpha } from '../../palette';
import { FitText } from '../FitText';
import { MediaBox } from '../MediaBox';
import { GameLogo, pad2, useEnter, type CardProps } from './shared';

const P = PALETTES.classic;

export const ClassicCard: React.FC<CardProps> = ({ song, index, total, durationInFrames, fadeInSec, fadeOutSec }) => {
  const media = useEnter(0);
  const side = useEnter(6);
  const title = useEnter(10);
  const meta = useEnter(16);
  const rise = (p: number, d = 30) => ({ opacity: p, transform: `translateY(${interpolate(p, [0, 1], [d, 0])}px)` });

  return (
    <AbsoluteFill style={{ background: P.bgGradient, fontFamily: FONT_JP, color: P.fg }}>
      <div
        style={{
          position: 'absolute',
          left: 64,
          top: 64,
          width: 1312,
          height: 738,
          borderRadius: 22,
          overflow: 'hidden',
          boxShadow: '0 30px 70px rgba(70,45,20,0.28), 0 0 0 1px rgba(70,45,20,0.08)',
          ...rise(media, 40),
        }}
      >
        <MediaBox media={song.media} durationInFrames={durationInFrames} fadeInSec={fadeInSec} fadeOutSec={fadeOutSec} />
      </div>

      <div style={{ position: 'absolute', left: 1424, top: 64, width: 432, height: 738, display: 'flex', flexDirection: 'column', ...rise(side) }}>
        <div
          style={{
            height: 250,
            borderRadius: 22,
            background: song.logoOnDark ? '#2e2620' : P.panel,
            borderTop: `6px solid ${song.accent}`,
            boxShadow: '0 12px 30px rgba(70,45,20,0.12)',
            padding: 28,
            boxSizing: 'border-box',
          }}
        >
          <GameLogo song={song} color={P.fg} />
        </div>
        {song.unlock ? (
          <>
            <div style={{ marginTop: 44, fontFamily: FONT_SC, fontSize: 24, letterSpacing: 6, color: song.accent, fontWeight: 700 }}>解锁方式</div>
            <div style={{ height: 2, background: P.line, margin: '14px 0 18px' }} />
            <div style={{ height: 260 }}>
              <FitText text={song.unlock} maxSize={40} minSize={22} multiline style={{ fontWeight: 600, fontFamily: FONT_SC }} />
            </div>
          </>
        ) : null}
        <div style={{ marginTop: 'auto', alignSelf: 'flex-end', display: 'flex', alignItems: 'baseline', gap: 10, color: P.muted }}>
          <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: 2 }}>No.</span>
          <span style={{ fontSize: 64, fontWeight: 800, color: P.fg, fontVariantNumeric: 'tabular-nums' }}>{pad2(index)}</span>
          <span style={{ fontSize: 30, fontWeight: 600 }}>/ {total}</span>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 64, top: 846, width: 1312, height: 170, display: 'flex', gap: 30 }}>
        <div style={{ width: 10, borderRadius: 5, background: song.accent, transform: `scaleY(${title})`, transformOrigin: 'top' }} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ height: 104, ...rise(title, 24) }}>
            <FitText text={song.title} maxSize={84} minSize={36} style={{ fontWeight: 800, letterSpacing: 1 }} />
          </div>
          <div style={{ height: 58, color: P.muted, ...rise(meta, 18) }}>
            <FitText text={song.artist} maxSize={40} minSize={20} style={{ fontWeight: 500 }} />
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 1424, top: 846, width: 432, height: 170, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, ...rise(meta, 18) }}>
        {song.genre ? (
          <div
            style={{
              alignSelf: 'flex-start',
              padding: '8px 26px',
              borderRadius: 999,
              background: song.accent,
              color: '#fff',
              fontFamily: FONT_SC,
              fontWeight: 700,
              fontSize: 32,
              boxShadow: `0 8px 20px ${withAlpha(song.accent, 0.35)}`,
            }}
          >
            {song.genre}
          </div>
        ) : null}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <span style={{ fontFamily: FONT_SC, fontSize: 24, color: P.muted, letterSpacing: 4 }}>实装</span>
          <span style={{ fontSize: 50, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{song.date}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
