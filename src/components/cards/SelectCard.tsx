import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT_JP, FONT_SC } from '../../fonts';
import { PALETTES, withAlpha } from '../../palette';
import type { Song } from '../../types';
import { FitText } from '../FitText';
import { MediaBox } from '../MediaBox';
import { useAudioViz } from '../useAudioViz';
import { GameLogo, pad2, useEnter, type CardProps } from './shared';

const P = PALETTES.select;
const CHAMFER = 'polygon(34px 0, 100% 0, 100% calc(100% - 34px), calc(100% - 34px) 100%, 0 100%, 0 34px)';
const ROW = 118;
const CURRENT_H = 172;

const WheelPlate: React.FC<{ song: Song; offset: number; current: boolean; number: number }> = ({ song, offset, current, number }) => {
  const dist = Math.abs(offset);
  const gap = (CURRENT_H - ROW) / 2 + 10;
  const y = offset * ROW + Math.sign(offset) * Math.min(1, dist) * gap;
  const width = current ? 640 : 560 - Math.min(dist, 3) * 18;
  return (
    <div
      style={{
        position: 'absolute',
        left: current ? 30 : 60 + dist * 14,
        top: 540 + y - (current ? CURRENT_H : ROW - 16) / 2,
        width,
        height: current ? CURRENT_H : ROW - 16,
        transform: 'skewX(-12deg)',
        opacity: current ? 1 : interpolate(dist, [0, 1, 4], [1, 0.75, 0], { extrapolateRight: 'clamp' }),
        background: current
          ? `linear-gradient(100deg, ${withAlpha(song.accent, 0.95)} 0%, ${withAlpha(song.accent, 0.55)} 60%, rgba(20,35,90,0.85) 100%)`
          : 'linear-gradient(100deg, rgba(40,60,140,0.75), rgba(15,25,70,0.75))',
        border: current ? '3px solid #fff' : `1px solid ${P.line}`,
        boxShadow: current ? `0 0 40px ${withAlpha(song.accent, 0.7)}, 0 0 0 6px ${withAlpha(song.accent, 0.25)}` : 'none',
        overflow: 'hidden',
      }}
    >
      <div style={{ transform: 'skewX(12deg)', height: '100%', display: 'flex', alignItems: 'center', padding: current ? '0 36px 0 44px' : '0 28px 0 36px', gap: 22 }}>
        <div
          style={{
            fontSize: current ? 40 : 26,
            fontWeight: 900,
            fontVariantNumeric: 'tabular-nums',
            color: current ? '#fff' : P.muted,
            width: current ? 66 : 44,
            flexShrink: 0,
          }}
        >
          {pad2(number)}
        </div>
        {!current ? <div style={{ width: 6, height: 54, background: song.accent, borderRadius: 3, flexShrink: 0 }} /> : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ height: current ? 70 : 44 }}>
            <FitText text={song.title} maxSize={current ? 54 : 32} minSize={18} style={{ fontWeight: 800, color: '#fff' }} />
          </div>
          <div style={{ height: current ? 40 : 28, color: current ? 'rgba(255,255,255,0.88)' : P.muted }}>
            <FitText text={song.artist} maxSize={current ? 28 : 20} minSize={14} style={{ fontWeight: 500 }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoPlate: React.FC<{ label: string; children: React.ReactNode; bg: string; color: string; width?: number; delay: number }> = ({
  label,
  children,
  bg,
  color,
  width,
  delay,
}) => {
  const e = useEnter(delay);
  return (
    <div
      style={{
        ...(width ? { width, flexShrink: 0 } : { flex: 1, minWidth: 0 }),
        height: 170,
        transform: `skewX(-12deg) translateY(${interpolate(e, [0, 1], [40, 0])}px)`,
        opacity: e,
        background: bg,
        color,
        border: '2px solid rgba(255,255,255,0.35)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ transform: 'skewX(12deg)', padding: '16px 34px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 5, opacity: 0.75 }}>{label}</div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center' }}>{children}</div>
      </div>
    </div>
  );
};

export const SelectCard: React.FC<CardProps> = ({ song, songs, year, month, index, total, durationInFrames, fadeInSec, fadeOutSec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scroll = useEnter(0, 16);
  const media = useEnter(6, 20);
  const { spectrum } = useAudioViz(song.viz, 64);
  const bars = spectrum(frame);
  const remaining = Math.max(0, Math.ceil((durationInFrames - frame) / fps));
  const shift = interpolate(scroll, [0, 1], [1, 0]);

  const wheel: { s: Song; k: number }[] = [];
  for (let k = -4; k <= 4; k++) {
    const s = songs[index - 1 + k];
    if (s) wheel.push({ s, k });
  }

  return (
    <AbsoluteFill style={{ background: P.bgGradient, fontFamily: FONT_JP, color: P.fg, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          backgroundImage: 'repeating-linear-gradient(135deg, rgba(120,170,255,0.06) 0 2px, transparent 2px 44px)',
          backgroundPosition: `${frame * 0.8}px 0`,
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(45% 50% at 72% 42%, ${withAlpha(song.accent, 0.28)} 0%, transparent 70%)` }} />

      <div style={{ position: 'absolute', left: -30, top: 0, height: 92, width: 640, transform: 'skewX(-20deg)', background: P.accent, boxShadow: `0 0 30px ${withAlpha(P.accent, 0.5)}` }} />
      <div style={{ position: 'absolute', left: 50, top: 0, height: 92, display: 'flex', alignItems: 'center', gap: 22, color: '#05071a' }}>
        <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: 3 }}>NEW SONGS</span>
        <span style={{ fontSize: 30, fontWeight: 800 }}>
          {year}.{pad2(month)}
        </span>
      </div>
      <div style={{ position: 'absolute', right: 60, top: 18, display: 'flex', alignItems: 'center', gap: 26 }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: P.muted, letterSpacing: 3 }}>
          TRACK <span style={{ color: '#fff', fontSize: 34 }}>{pad2(index)}</span> / {total}
        </span>
        <div style={{ border: `3px solid ${P.accent}`, padding: '2px 16px', display: 'flex', alignItems: 'baseline', gap: 10, background: 'rgba(5,7,26,0.7)' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: P.accent, letterSpacing: 3 }}>TIME</span>
          <span style={{ fontSize: 46, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: remaining <= 3 ? '#ff5b7a' : '#fff' }}>{pad2(remaining)}</span>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 0, top: 0, width: 700, height: 1080, transform: `translateY(${shift * (ROW + 30)}px)` }}>
        {wheel.map(({ s, k }) => (
          <WheelPlate key={s.order} song={s} offset={k} current={k === 0} number={index + k} />
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 700, height: 1080, background: 'linear-gradient(180deg, #05071a 0%, transparent 18%, transparent 82%, #05071a 100%)', pointerEvents: 'none' }} />

      <div
        style={{
          position: 'absolute',
          left: 704,
          top: 126,
          width: 1168,
          height: 660,
          clipPath: CHAMFER,
          background: `linear-gradient(135deg, #fff, ${song.accent})`,
          opacity: media,
          transform: `translateX(${interpolate(media, [0, 1], [60, 0])}px)`,
        }}
      >
        <div style={{ position: 'absolute', inset: 4, clipPath: CHAMFER, overflow: 'hidden' }}>
          <MediaBox media={song.media} durationInFrames={durationInFrames} fadeInSec={fadeInSec} fadeOutSec={fadeOutSec} />
        </div>
      </div>

      <div style={{ position: 'absolute', left: 708, top: 796, width: 1160, height: 34, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
        {bars.slice(0, 48).map((v, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${Math.max(6, Math.min(1, Math.sqrt(v) * 1.3) * 100)}%`,
              background: `linear-gradient(0deg, ${P.accent}, ${song.accent})`,
              opacity: 0.85,
            }}
          />
        ))}
      </div>

      <div style={{ position: 'absolute', left: 720, top: 852, right: 50, display: 'flex', gap: 26 }}>
        <InfoPlate label="GAME" bg="rgba(5,7,26,0.85)" color="#fff" width={300} delay={10}>
          <div style={{ width: '100%', height: 110 }}>
            <GameLogo song={song} color="#fff" onDark />
          </div>
        </InfoPlate>
        <InfoPlate label="GENRE" bg={song.accent} color="#fff" width={240} delay={13}>
          <FitText text={song.genre || '—'} maxSize={40} minSize={18} style={{ fontFamily: FONT_SC, fontWeight: 900 }} />
        </InfoPlate>
        <InfoPlate label="RELEASE" bg="#f2f6ff" color="#0b1033" width={270} delay={16}>
          <span style={{ fontSize: 40, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{song.date}</span>
        </InfoPlate>
        <InfoPlate label="UNLOCK" bg="rgba(20,35,90,0.85)" color="#fff" delay={19}>
          <FitText text={song.unlock || '—'} maxSize={30} minSize={15} multiline style={{ fontFamily: FONT_SC, fontWeight: 700 }} />
        </InfoPlate>
      </div>
    </AbsoluteFill>
  );
};
