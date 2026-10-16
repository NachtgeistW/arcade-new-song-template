import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import React from 'react';
import { useVideoConfig } from 'remotion';
import { CreditsPage, GamesPage, LeadPage, NoticePage, PreviewPage, StatsPage, TitlePage } from './components/IntroOutro';
import { SectionCard } from './components/SectionCard';
import { SongCard } from './components/SongCard';
import { ensureFonts } from './fonts';
import { buildTimeline, type TimelineItem } from './timeline';
import type { MonthProps } from './types';

ensureFonts();

const renderItem = (it: TimelineItem, p: MonthProps) => {
  switch (it.kind) {
    case 'title':
      return <TitlePage p={p} />;
    case 'notice':
      return <NoticePage p={p} />;
    case 'games':
      return <GamesPage p={p} />;
    case 'stats':
      return <StatsPage p={p} />;
    case 'lead':
      return <LeadPage p={p} />;
    case 'preview':
      return <PreviewPage p={p} durationInFrames={it.frames} />;
    case 'credits':
      return <CreditsPage p={p} />;
    case 'section':
      return <SectionCard theme={p.theme} lines={it.lines} logos={it.logos} accent={it.accent} showNext={it.showNext} sfx={p.sectionSfx} />;
    case 'song':
      return (
        <SongCard
          theme={p.theme}
          song={it.song}
          songs={p.songs}
          year={p.year}
          month={p.month}
          index={it.index}
          total={p.total}
          durationInFrames={it.frames}
          fadeInSec={p.fadeInSec}
          fadeOutSec={p.fadeOutSec}
        />
      );
  }
};

export const Monthly: React.FC<MonthProps> = (p) => {
  const { fps } = useVideoConfig();
  const items = buildTimeline(p, fps);
  return (
    <TransitionSeries>
      {items.flatMap((it, i) => {
        const seq = (
          <TransitionSeries.Sequence key={`s${i}`} durationInFrames={it.frames} premountFor={fps}>
            {renderItem(it, p)}
          </TransitionSeries.Sequence>
        );
        return i === 0
          ? [seq]
          : [
              <TransitionSeries.Transition key={`t${i}`} presentation={fade()} timing={linearTiming({ durationInFrames: p.transitionFrames })} />,
              seq,
            ];
      })}
    </TransitionSeries>
  );
};

export const SingleCard: React.FC<MonthProps & { songIndex: number }> = ({ songIndex, ...p }) => {
  const { durationInFrames } = useVideoConfig();
  const song = p.songs[songIndex] ?? p.songs[0];
  if (!song) return null;
  return (
    <SongCard
      theme={p.theme}
      song={song}
      songs={p.songs}
      year={p.year}
      month={p.month}
      index={songIndex + 1}
      total={p.total}
      durationInFrames={durationInFrames}
      fadeInSec={p.fadeInSec}
      fadeOutSec={p.fadeOutSec}
    />
  );
};
