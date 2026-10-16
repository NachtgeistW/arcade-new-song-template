import { useAudioData, visualizeAudio } from '@remotion/media-utils';
import { useCallback } from 'react';
import { staticFile, useVideoConfig } from 'remotion';

export const useAudioViz = (vizSrc: string, numberOfSamples = 64) => {
  const { fps } = useVideoConfig();
  const audioData = useAudioData(staticFile(vizSrc));
  const spectrum = useCallback(
    (frame: number): number[] => {
      if (!audioData || frame < 0 || frame / fps >= audioData.durationInSeconds) return new Array(numberOfSamples).fill(0);
      return visualizeAudio({ fps, frame, audioData, numberOfSamples, optimizeFor: 'speed' });
    },
    [audioData, fps, numberOfSamples],
  );
  const bass = useCallback(
    (frame: number) => {
      const s = spectrum(frame);
      return (s[0] + s[1] + s[2] + s[3]) / 4;
    },
    [spectrum],
  );
  return { ready: audioData !== null, spectrum, bass };
};
