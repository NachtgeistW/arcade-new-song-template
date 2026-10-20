import React, { useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { SongMedia } from '../types';

interface Props {
  media: SongMedia;
  durationInFrames: number;
  fadeInSec: number;
  fadeOutSec: number;
  blurFill?: boolean;
  style?: React.CSSProperties;
}

const useFadeVolume = (durationInFrames: number, fadeInSec: number, fadeOutSec: number) => {
  const { fps } = useVideoConfig();
  const fadeIn = Math.max(1, fadeInSec * fps);
  const fadeOut = Math.max(1, fadeOutSec * fps);
  return (f: number) =>
    interpolate(f, [0, fadeIn, durationInFrames - fadeOut, durationInFrames], [0, 1, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
};

const useBoxAspect = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (el.clientWidth && el.clientHeight) setAspect(el.clientWidth / el.clientHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, aspect] as const;
};

export const MediaBox: React.FC<Props> = ({ media, durationInFrames, fadeInSec, fadeOutSec, blurFill = true, style }) => {
  const frame = useCurrentFrame();
  const volume = useFadeVolume(durationInFrames, fadeInSec, fadeOutSec);
  const [boxRef, boxAspect] = useBoxAspect();
  const blurLayer: React.CSSProperties = {
    position: 'absolute',
    inset: -60,
    width: 'calc(100% + 120px)',
    height: 'calc(100% + 120px)',
    objectFit: 'cover',
    filter: 'blur(36px) brightness(0.7) saturate(1.2)',
  };

  if (media.kind === 'video') {
    const src = staticFile(media.src);
    // The blurred copy is expensive to render, so drop it when the video already (nearly) fills the box.
    const fills = !!media.width && !!media.height && !!boxAspect && Math.abs(media.width / media.height / boxAspect - 1) < 0.01;
    return (
      <AbsoluteFill ref={boxRef} style={{ overflow: 'hidden', background: '#000', ...style }}>
        {blurFill && !fills ? <OffthreadVideo src={src} muted style={blurLayer} /> : null}
        <OffthreadVideo src={src} volume={volume} style={{ width: '100%', height: '100%', objectFit: fills ? 'cover' : 'contain', position: 'relative' }} />
      </AbsoluteFill>
    );
  }

  const cover = staticFile(media.cover);
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.06]);
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#000', ...style }}>
      <Img src={cover} style={blurLayer} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Img
          src={cover}
          style={{
            height: '100%',
            width: '100%',
            objectFit: 'contain',
            transform: `scale(${zoom})`,
            filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.45))',
          }}
        />
      </AbsoluteFill>
      <Audio src={staticFile(media.audio)} volume={volume} />
    </AbsoluteFill>
  );
};
