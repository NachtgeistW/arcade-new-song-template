import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { FONT_JP, FONT_SC } from '../../fonts';
import { PALETTES, withAlpha } from '../../palette';
import { FitText } from '../FitText';
import { MediaBox } from '../MediaBox';
import { useAudioViz } from '../useAudioViz';
import { GameLogo, dottedDate, pad2, useEnter, type CardProps } from './shared';

const P = PALETTES.highway;
const LANES = 4;
const PLANE_W = 760;
const PLANE_H = 1150;
const HIT_Y = PLANE_H - 110;
const LOOKAHEAD = 72;
const STEP = 3;
const SPEED = HIT_Y / LOOKAHEAD;

const laneOf = (t: number) => (Math.imul(t, 0x9e3779b1) >>> 0) % LANES;

const computeNotes = (frame: number, bass: (f: number) => number) => {
  const cache = new Map<number, number>();
  const e = (t: number) => {
    let v = cache.get(t);
    if (v === undefined) cache.set(t, (v = bass(t)));
    return v;
  };
  const start = Math.floor((frame - 18) / STEP) * STEP;
  const ts: number[] = [];
  for (let t = start; t <= frame + LOOKAHEAD; t += STEP) if (t >= STEP * 2) ts.push(t);
  const mean = ts.reduce((n, t) => n + e(t), 0) / Math.max(1, ts.length);
  return ts
    .filter((t) => {
      const v = e(t);
      return v > 0.04 && v > mean * 1.15 && v >= e(t - STEP) && v > e(t + STEP) && v > e(t - STEP * 2) * 1.08;
    })
    .map((t) => ({ t, lane: laneOf(t), v: e(t) }));
};

export const HighwayCard: React.FC<CardProps> = ({ song, year, month, index, total, durationInFrames, fadeInSec, fadeOutSec }) => {
  const frame = useCurrentFrame();
  const screen = useEnter(0, 20);
  const road = useEnter(6, 22);
  const left = useEnter(12);
  const right = useEnter(16);
  const { spectrum, bass } = useAudioViz(song.viz, 64);
  const bars = spectrum(frame);
  const pulse = Math.min(1, Math.sqrt(bass(frame)) * 1.3);
  const notes = computeNotes(frame, bass);
  const accent = song.accent;
  const laneW = PLANE_W / LANES;

  return (
    <AbsoluteFill style={{ background: P.bgGradient, fontFamily: FONT_JP, color: P.fg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 260, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '0 20px', opacity: 0.35 }}>
        {[...bars.slice(0, 40)].reverse().concat(bars.slice(0, 40)).map((v, i) => (
          <div key={i} style={{ flex: 1, height: `${Math.min(1, Math.sqrt(v) * 1.2) * 100}%`, background: `linear-gradient(0deg, ${withAlpha(accent, 0.9)}, transparent)` }} />
        ))}
      </div>

      <div style={{ position: 'absolute', left: 580, top: 560, width: PLANE_W, height: 520, perspective: 620, perspectiveOrigin: '50% -10%', opacity: road }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: -40,
            width: PLANE_W,
            height: PLANE_H,
            transform: `rotateX(${interpolate(road, [0, 1], [80, 60])}deg)`,
            transformOrigin: '50% 100%',
            background: `linear-gradient(180deg, transparent 0%, ${withAlpha(accent, 0.1)} 55%, ${withAlpha(accent, 0.28)} 100%)`,
            overflow: 'hidden',
          }}
        >
          {Array.from({ length: 14 }, (_, k) => {
            const y = (((frame * SPEED + k * 90) % (PLANE_H + 90)) + PLANE_H + 90) % (PLANE_H + 90) - 90;
            return <div key={`b${k}`} style={{ position: 'absolute', left: 0, right: 0, top: y, height: 2, background: 'rgba(255,255,255,0.12)' }} />;
          })}
          {Array.from({ length: LANES + 1 }, (_, i) => (
            <div
              key={`l${i}`}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: i * laneW - (i === 0 || i === LANES ? 3 : 1),
                width: i === 0 || i === LANES ? 6 : 2,
                background: i === 0 || i === LANES ? accent : 'rgba(255,255,255,0.18)',
                boxShadow: i === 0 || i === LANES ? `0 0 24px ${accent}` : 'none',
              }}
            />
          ))}
          {notes.map(({ t, lane, v }) => {
            const dt = t - frame;
            if (dt < 0) {
              const life = interpolate(-dt, [0, 14], [1, 0], { extrapolateRight: 'clamp' });
              return (
                <div
                  key={t}
                  style={{
                    position: 'absolute',
                    left: lane * laneW,
                    width: laneW,
                    top: HIT_Y - 240,
                    height: 240,
                    background: `linear-gradient(0deg, ${withAlpha('#ffffff', 0.55 * life)}, transparent)`,
                  }}
                />
              );
            }
            return (
              <div
                key={t}
                style={{
                  position: 'absolute',
                  left: lane * laneW + 10,
                  width: laneW - 20,
                  top: HIT_Y - dt * SPEED - 18,
                  height: 36,
                  borderRadius: 8,
                  background: v > 0.3 ? '#ffffff' : accent,
                  boxShadow: `0 0 22px ${accent}`,
                }}
              />
            );
          })}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: HIT_Y - 4,
              height: 8,
              background: '#fff',
              boxShadow: `0 0 ${20 + pulse * 50}px ${accent}, 0 0 ${8 + pulse * 20}px #fff`,
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 400,
          top: 34,
          width: 1120,
          height: 630,
          borderRadius: 14,
          overflow: 'hidden',
          border: `2px solid ${withAlpha(accent, 0.8)}`,
          boxShadow: `0 0 ${40 + pulse * 70}px ${withAlpha(accent, 0.35 + pulse * 0.35)}, 0 30px 80px rgba(0,0,0,0.6)`,
          opacity: screen,
          transform: `scale(${interpolate(screen, [0, 1], [0.9, 1])})`,
        }}
      >
        <MediaBox media={song.media} durationInFrames={durationInFrames} fadeInSec={fadeInSec} fadeOutSec={fadeOutSec} />
      </div>

      <div style={{ position: 'absolute', left: 64, top: 48, opacity: screen }}>
        <div style={{ fontSize: 22, letterSpacing: 6, color: P.muted, fontWeight: 700 }}>TRACK</div>
        <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{pad2(index)}</div>
        <div style={{ fontSize: 26, color: P.muted, fontWeight: 700 }}>/ {total}</div>
      </div>
      <div style={{ position: 'absolute', right: 64, top: 52, textAlign: 'right', opacity: screen }}>
        <div style={{ fontSize: 22, letterSpacing: 6, color: P.muted, fontWeight: 700 }}>NEW ARRIVAL</div>
        <div style={{ fontSize: 44, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
          {year}.{pad2(month)}
        </div>
      </div>

      <div style={{ position: 'absolute', left: 64, top: 720, width: 500, opacity: left, transform: `translateX(${interpolate(left, [0, 1], [-50, 0])}px)` }}>
        <div style={{ fontSize: 22, letterSpacing: 6, color: accent, fontWeight: 800 }}>NOW PLAYING</div>
        <div style={{ height: 190, marginTop: 10 }}>
          <FitText text={song.title} maxSize={72} minSize={28} multiline style={{ fontWeight: 900 }} />
        </div>
        <div style={{ height: 3, width: 120, background: accent, margin: '14px 0' }} />
        <div style={{ height: 80, color: P.muted }}>
          <FitText text={song.artist} maxSize={32} minSize={16} multiline style={{ fontWeight: 600 }} />
        </div>
      </div>

      <div style={{ position: 'absolute', left: 1370, top: 712, width: 490, opacity: right, transform: `translateX(${interpolate(right, [0, 1], [50, 0])}px)` }}>
        <div style={{ height: 140 }}>
          <GameLogo song={song} color="#fff" onDark style={{ filter: `drop-shadow(0 0 18px ${withAlpha(accent, 0.6)})` }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 22 }}>
          {song.genre ? (
            <span style={{ padding: '6px 18px', border: `2px solid ${accent}`, color: accent, fontFamily: FONT_SC, fontWeight: 800, fontSize: 26, borderRadius: 6 }}>
              {song.genre}
            </span>
          ) : null}
          <span style={{ fontSize: 38, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{dottedDate(song.date)}</span>
        </div>
        {song.unlock ? (
          <div style={{ height: 96, marginTop: 16, color: P.muted }}>
            <FitText text={song.unlock} maxSize={26} minSize={15} multiline style={{ fontFamily: FONT_SC, fontWeight: 600 }} />
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
