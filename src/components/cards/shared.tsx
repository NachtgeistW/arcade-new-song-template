import React from 'react';
import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { LogoRef, Song } from '../../types';

export interface CardProps {
  song: Song;
  songs: Song[];
  year: number;
  month: number;
  index: number;
  total: number;
  durationInFrames: number;
  fadeInSec: number;
  fadeOutSec: number;
}

export const useEnter = (delayFrames = 0, damping = 18) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delayFrames, fps, config: { damping, mass: 0.8 } });
};

export const pad2 = (n: number) => String(n).padStart(2, '0');

export const dottedDate = (date: string) => {
  const m = date.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  return m ? `${m[1]}.${pad2(Number(m[2]))}.${pad2(Number(m[3]))}` : date;
};

const cycleOpacity = (frame: number, i: number, n: number, hold: number, fade: number) => {
  const period = n * hold;
  const local = (((frame - i * hold) % period) + period) % period;
  if (local < hold - fade) return 1;
  if (local < hold) return (hold - local) / fade;
  if (local >= period - fade) return (local - (period - fade)) / fade;
  return 0;
};

export const LogoCycle: React.FC<{ logos: LogoRef[]; holdSec: number; render: (logo: LogoRef) => React.ReactNode }> = ({ logos, holdSec, render }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (logos.length <= 1) return <>{logos[0] ? render(logos[0]) : null}</>;
  const hold = Math.max(2, Math.round(holdSec * fps));
  const fade = Math.min(Math.round(fps * 0.25), Math.floor(hold / 2));
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {logos.map((l, i) => (
        <div key={l.name} style={{ position: 'absolute', inset: 0, opacity: cycleOpacity(frame, i, logos.length, hold, fade) }}>
          {render(l)}
        </div>
      ))}
    </div>
  );
};

const LogoName: React.FC<{ name: string; color: string; style?: React.CSSProperties }> = ({ name, color, style }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      fontWeight: 800,
      fontSize: 44,
      lineHeight: 1.15,
      color,
      ...style,
    }}
  >
    {name}
  </div>
);

const PlatedLogo: React.FC<{ logo: LogoRef; color: string; onDark?: boolean; style?: React.CSSProperties }> = ({ logo, color, onDark, style }) => {
  if (!logo.logo) return <LogoName name={logo.name} color={color} style={style} />;
  const plate = onDark ? (logo.onLight ? 'rgba(255,255,255,0.92)' : null) : logo.onDark ? '#2e2620' : null;
  const img = <Img src={staticFile(logo.logo)} style={{ width: '100%', height: '100%', objectFit: 'contain', ...(plate ? {} : style) }} />;
  return plate ? (
    <div style={{ width: '100%', height: '100%', background: plate, borderRadius: 14, padding: '8%', boxSizing: 'border-box' }}>{img}</div>
  ) : (
    img
  );
};

export const GameLogo: React.FC<{ song: Song; color: string; onDark?: boolean; style?: React.CSSProperties }> = ({ song, color, onDark, style }) =>
  song.participants?.length ? (
    <LogoCycle logos={song.participants} holdSec={1.5} render={(l) => <PlatedLogo logo={l} color={color} onDark={onDark} style={style} />} />
  ) : song.logo ? (
    onDark && song.logoOnLight ? (
      <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.92)', borderRadius: 14, padding: '8%', boxSizing: 'border-box' }}>
        <Img src={staticFile(song.logo)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
    ) : (
      <Img src={staticFile(song.logo)} style={{ width: '100%', height: '100%', objectFit: 'contain', ...style }} />
    )
  ) : (
    <LogoName name={song.gameName} color={color} style={style} />
  );
