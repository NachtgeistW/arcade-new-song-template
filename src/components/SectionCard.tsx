import React from 'react';
import { AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { FONT_JP } from '../fonts';
import { PALETTES, withAlpha } from '../palette';
import type { LogoRef, ThemeName } from '../types';
import { LogoCycle, useEnter } from './cards/shared';

interface Props {
  theme: ThemeName;
  lines: string[];
  logos: LogoRef[];
  accent: string | null;
  showNext: boolean;
  sfx: string | null;
}

export const SectionCard: React.FC<Props> = ({ theme, lines, logos, accent, showNext, sfx }) => {
  const P = PALETTES[theme];
  const lightTheme = theme === 'classic' || theme === 'editorial';
  const plateFor = (l: LogoRef) => (lightTheme ? (l.onDark ? '#2e2620' : null) : l.onLight ? 'rgba(255,255,255,0.92)' : null);
  const frame = useCurrentFrame();
  const draw = useEnter(0, 26);
  const label = useEnter(6);
  const textIn = useEnter(10, 22);
  const color = accent ?? P.accent;
  const spacing = interpolate(textIn, [0, 1], [0.45, 0.16]);
  const drift = interpolate(frame, [0, 180], [0, -18]);

  return (
    <AbsoluteFill style={{ background: P.bgGradient, fontFamily: FONT_JP, color: P.fg }}>
      <AbsoluteFill style={{ background: `radial-gradient(50% 60% at 78% 55%, ${withAlpha(color, 0.18)} 0%, transparent 70%)` }} />
      {logos.some((l) => l.logo) ? (
        <div
          style={{
            position: 'absolute',
            right: 140,
            top: 300,
            width: 700,
            height: 420,
            opacity: interpolate(textIn, [0, 1], [0, 0.95]),
            transform: `translateY(${drift}px) scale(${interpolate(textIn, [0, 1], [0.92, 1])})`,
          }}
        >
          <LogoCycle
            logos={logos.filter((l) => l.logo)}
            holdSec={Math.max(0.45, Math.min(0.9, 2.7 / logos.length))}
            render={(l) => {
              const plate = plateFor(l);
              return (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    ...(plate ? { background: plate, borderRadius: 32, padding: 50, boxSizing: 'border-box', boxShadow: '0 30px 60px rgba(0,0,0,0.25)' } : {}),
                  }}
                >
                  <Img src={staticFile(l.logo!)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              );
            }}
          />
        </div>
      ) : null}

      <div style={{ position: 'absolute', left: 170, top: 690 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 4, height: 230, background: P.fg, transform: `scaleY(${draw})`, transformOrigin: 'top' }} />
        <div style={{ position: 'absolute', left: 0, top: 0, width: 140, height: 4, background: P.fg, transform: `scaleX(${draw})`, transformOrigin: 'left' }} />
        <div style={{ position: 'absolute', left: 0, top: 226, width: 280, height: 4, background: P.fg, transform: `scaleX(${draw})`, transformOrigin: 'left' }} />
        {showNext ? (
          <div
            style={{
              position: 'absolute',
              left: 160,
              top: -22,
              fontSize: 34,
              letterSpacing: '0.3em',
              color,
              fontWeight: 700,
              opacity: label,
            }}
          >
            NEXT
          </div>
        ) : null}
        <div style={{ position: 'absolute', left: 44, top: lines.length > 1 ? 40 : 76, whiteSpace: 'nowrap' }}>
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                fontSize: 74,
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: `${spacing}em`,
                opacity: interpolate(textIn, [0, 1], [0, 1]),
                transform: `translateX(${interpolate(textIn, [0, 1], [-30 - i * 20, 0])}px)`,
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
      {sfx ? <Audio src={staticFile(sfx)} /> : null}
    </AbsoluteFill>
  );
};
