import React from 'react';
import type { ThemeName } from '../types';
import { ClassicCard } from './cards/ClassicCard';
import { EditorialCard } from './cards/EditorialCard';
import { GlassCard } from './cards/GlassCard';
import { HighwayCard } from './cards/HighwayCard';
import { SelectCard } from './cards/SelectCard';
import { StageCard } from './cards/StageCard';
import type { CardProps } from './cards/shared';

const CARDS: Record<ThemeName, React.FC<CardProps>> = {
  classic: ClassicCard,
  glass: GlassCard,
  stage: StageCard,
  select: SelectCard,
  editorial: EditorialCard,
  highway: HighwayCard,
};

export const SongCard: React.FC<CardProps & { theme: ThemeName }> = ({ theme, ...props }) => {
  const Card = CARDS[theme] ?? ClassicCard;
  return <Card {...props} />;
};
