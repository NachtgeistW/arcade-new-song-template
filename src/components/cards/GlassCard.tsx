import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile } from 'remotion';
import { FONT_JP, FONT_SC } from '../../fonts';
import { PALETTES, withAlpha } from '../../palette';
import { FitText } from '../FitText';
import { MediaBox } from '../MediaBox';
import { GameLogo, pad2, useEnter, type CardProps } from './shared';

const P = PALETTES.glass;

const Backdrop: React.FC<{ song: CardProps['song'] }> = ({ song }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    inset: -120,
    width: 'calc(100% + 240px)',
    height: 'calc(100% + 240px)',
    objectFit: 'cover',
    filter: 'blur(60px) saturate(1.4) brightness(0.55)',
  };
  return song.media.kind === 'video' ? (
    <OffthreadVideo src={staticFile(song.media.src)} muted style={style} />
  ) : (
    <Img src={staticFile(song.media.cover)} style={style} />
  );
};

const Divider = () => <div style={{ width: 1, alignSelf: 'stretch', margin: '28px 0', background: P.line }} />;

export const GlassCard: React.FC<CardProps> = ({ song, index, total, durationInFrames, fadeInSec, fadeOutSec }) => {
  const media = useEnter(0, 20);
  const bar = useEnter(8, 20);
  const text = useEnter(14);
  const scale = interpolate(media, [0, 1], [0.94, 1]);

  return (
    <AbsoluteFill style={{ background: P.bg, fontFamily: FONT_JP, color: P.fg }}>
      <Backdrop song={song} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(10,12,20,0.15) 0%, rgba(10,12,20,0.55) 100%)` }} />

      <div
        style={{
          position: 'absolute',
          left: 285,
          top: 44,
          width: 1350,
          height: 760,
          borderRadius: 26,
          overflow: 'hidden',
          boxShadow: '0 40px 90px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.18)',
          opacity: media,
          transform: `scale(${scale})`,
        }}
      >
        <MediaBox media={song.media} durationInFrames={durationInFrames} fadeInSec={fadeInSec} fadeOutSec={fadeOutSec} blurFill={false} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 64,
          top: 52,
          padding: '8px 18px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(20px)',
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: 2,
          fontVariantNumeric: 'tabular-nums',
          opacity: media,
        }}
      >
        {pad2(index)} <span style={{ color: P.muted }}>/ {total}</span>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 64,
          right: 64,
          top: 836,
          height: 196,
          borderRadius: 30,
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(30px) saturate(1.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          opacity: bar,
          transform: `translateY(${interpolate(bar, [0, 1], [60, 0])}px)`,
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, background: song.accent }} />
        <div style={{ width: 330, height: 150, padding: '0 34px 0 44px', boxSizing: 'border-box', flexShrink: 0 }}>
          <GameLogo song={song} color={P.fg} onDark style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.35))' }} />
        </div>
        <Divider />
        <div style={{ flex: 1, minWidth: 0, padding: '0 40px', opacity: text, transform: `translateX(${interpolate(text, [0, 1], [-20, 0])}px)` }}>
          <div style={{ height: 88 }}>
            <FitText text={song.title} maxSize={70} minSize={32} style={{ fontWeight: 800 }} />
          </div>
          <div style={{ height: 50, color: P.muted }}>
            <FitText text={song.artist} maxSize={34} minSize={18} style={{ fontWeight: 500 }} />
          </div>
        </div>
        <Divider />
        <div style={{ width: 460, flexShrink: 0, padding: '0 40px', boxSizing: 'border-box', opacity: text }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {song.genre ? (
              <span
                style={{
                  padding: '6px 20px',
                  borderRadius: 999,
                  background: withAlpha(song.accent, 0.85),
                  fontFamily: FONT_SC,
                  fontWeight: 700,
                  fontSize: 26,
                }}
              >
                {song.genre}
              </span>
            ) : null}
            <span style={{ fontSize: 34, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{song.date}</span>
          </div>
          {song.unlock ? (
            <div style={{ height: 78, marginTop: 14, color: P.muted }}>
              <FitText text={song.unlock} maxSize={26} minSize={16} multiline style={{ fontFamily: FONT_SC, fontWeight: 500 }} />
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
