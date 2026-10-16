import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { FONT_JP, FONT_SC } from '../../fonts';
import { PALETTES, withAlpha } from '../../palette';
import { FitText } from '../FitText';
import { MediaBox } from '../MediaBox';
import { GameLogo, dottedDate, pad2, useEnter, type CardProps } from './shared';

const P = PALETTES.stage;
const CUT = 'polygon(0 0, 100% 0, 92% 100%, 0 100%)';

export const StageCard: React.FC<CardProps> = ({ song, index, total, durationInFrames, fadeInSec, fadeOutSec }) => {
  const media = useEnter(0, 22);
  const side = useEnter(8);
  const title = useEnter(12, 20);
  const meta = useEnter(18);
  const wipe = interpolate(media, [0, 1], [100, 0]);

  return (
    <AbsoluteFill style={{ background: P.bgGradient, fontFamily: FONT_JP, color: P.fg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ background: `radial-gradient(60% 60% at 90% 15%, ${withAlpha(song.accent, 0.35)} 0%, transparent 70%)` }} />

      <div
        style={{
          position: 'absolute',
          right: 30,
          bottom: -70,
          fontSize: 420,
          fontWeight: 900,
          lineHeight: 1,
          color: 'transparent',
          WebkitTextStroke: `3px ${withAlpha(song.accent, 0.22)}`,
          fontVariantNumeric: 'tabular-nums',
          opacity: side,
        }}
      >
        {pad2(index)}
      </div>

      <div style={{ position: 'absolute', left: 0, top: 0, width: 1460, height: 822, clipPath: CUT, background: song.accent, opacity: 0.9 }} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1440,
          height: 810,
          clipPath: CUT,
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${wipe}% 0 0)` }}>
          <MediaBox media={song.media} durationInFrames={durationInFrames} fadeInSec={fadeInSec} fadeOutSec={fadeOutSec} />
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 1480,
          top: 60,
          width: 390,
          display: 'flex',
          flexDirection: 'column',
          opacity: side,
          transform: `translateX(${interpolate(side, [0, 1], [40, 0])}px)`,
        }}
      >
        <div style={{ height: 230 }}>
          <GameLogo song={song} color={P.fg} onDark style={{ filter: `drop-shadow(0 0 24px ${withAlpha(song.accent, 0.5)})` }} />
        </div>
        {song.unlock ? (
          <div style={{ marginTop: 50, paddingLeft: 22, borderLeft: `5px solid ${song.accent}` }}>
            <div style={{ fontFamily: FONT_SC, fontSize: 22, letterSpacing: 6, color: P.muted, marginBottom: 12 }}>UNLOCK</div>
            <div style={{ height: Math.min(250, 60 + Math.ceil(song.unlock.length / 9) * 52) }}>
              <FitText text={song.unlock} maxSize={38} minSize={20} multiline style={{ fontFamily: FONT_SC, fontWeight: 700 }} />
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ position: 'absolute', left: 72, top: 842, width: 1330, height: 190 }}>
        <div style={{ height: 116, clipPath: `inset(0 ${interpolate(title, [0, 1], [100, 0])}% 0 0)` }}>
          <FitText text={song.title} maxSize={100} minSize={40} style={{ fontWeight: 900, letterSpacing: 1 }} />
        </div>
        <div style={{ height: 6, width: interpolate(title, [0, 1], [0, 220]), background: song.accent, margin: '14px 0 10px' }} />
        <div style={{ height: 52, color: P.muted, opacity: meta }}>
          <FitText text={song.artist} maxSize={38} minSize={18} style={{ fontWeight: 500 }} />
        </div>
      </div>

      <div style={{ position: 'absolute', left: 1480, top: 860, width: 390, opacity: meta }}>
        {song.genre ? (
          <div style={{ fontFamily: FONT_SC, fontSize: 30, fontWeight: 800, letterSpacing: 4, color: song.accent }}>{song.genre}</div>
        ) : null}
        <div style={{ fontSize: 56, fontWeight: 800, fontVariantNumeric: 'tabular-nums', marginTop: 6 }}>{dottedDate(song.date)}</div>
        <div style={{ fontSize: 22, color: P.muted, letterSpacing: 3, marginTop: 6 }}>
          TRACK {pad2(index)} / {total}
        </div>
      </div>
    </AbsoluteFill>
  );
};
