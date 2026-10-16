import React from 'react';
import { Composition } from 'remotion';
import { Monthly, SingleCard } from './Monthly';
import { buildTimeline, totalFrames } from './timeline';
import type { MonthProps } from './types';

const FPS = 60;

const emptyProps: MonthProps = {
  year: 2025,
  month: 1,
  theme: 'classic',
  title: '街机音游新曲回顾',
  notice: [],
  companies: [],
  total: 0,
  categories: [],
  previews: [],
  credits: [],
  songs: [],
  sectionSfx: null,
  transitionFrames: 15,
  fadeInSec: 0.3,
  fadeOutSec: 0.8,
};

export const Root: React.FC = () => (
  <>
    <Composition
      id="Monthly"
      component={Monthly}
      width={1920}
      height={1080}
      fps={FPS}
      durationInFrames={FPS}
      defaultProps={emptyProps}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.max(1, totalFrames(buildTimeline(props, FPS), props.transitionFrames)),
      })}
    />
    <Composition
      id="Card"
      component={SingleCard}
      width={1920}
      height={1080}
      fps={FPS}
      durationInFrames={FPS}
      defaultProps={{ ...emptyProps, songIndex: 0 }}
      calculateMetadata={({ props }) => {
        const song = props.songs[props.songIndex] ?? props.songs[0];
        return { durationInFrames: Math.max(1, Math.round((song?.durationSec ?? 1) * FPS)) };
      }}
    />
  </>
);
