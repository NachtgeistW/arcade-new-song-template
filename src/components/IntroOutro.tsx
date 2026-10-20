import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT_JP, FONT_SC } from '../fonts';
import { PALETTES, withAlpha } from '../palette';
import type { MonthProps } from '../types';
import { useEnter } from './cards/shared';
import { FitText } from './FitText';

type PageProps = { p: MonthProps };

const Page: React.FC<{ p: MonthProps; children: React.ReactNode; style?: React.CSSProperties }> = ({ p, children, style }) => {
  const P = PALETTES[p.theme];
  return (
    <AbsoluteFill style={{ background: P.bgGradient, color: P.fg, fontFamily: FONT_SC, padding: '120px 160px', ...style }}>
      {children}
    </AbsoluteFill>
  );
};

const Stagger: React.FC<{ i: number; children: React.ReactNode; style?: React.CSSProperties; step?: number }> = ({ i, children, style, step = 4 }) => {
  const e = useEnter(6 + i * step);
  return <div style={{ opacity: e, transform: `translateY(${interpolate(e, [0, 1], [24, 0])}px)`, ...style }}>{children}</div>;
};

export const TitlePage: React.FC<PageProps> = ({ p }) => {
  const P = PALETTES[p.theme];
  const line = useEnter(0, 26);
  return (
    <Page p={p} style={{ justifyContent: 'center' }}>
      <Stagger i={0}>
        <div style={{ fontSize: 64, fontWeight: 700, color: P.muted, letterSpacing: 4 }}>
          {p.year}年{p.month}月
        </div>
      </Stagger>
      <div style={{ width: 760 * line, height: 6, background: P.accent, margin: '30px 0 36px' }} />
      <Stagger i={2}>
        <div style={{ height: 380 }}>
          <FitText text={p.title} maxSize={132} minSize={48} multiline style={{ fontWeight: 900, letterSpacing: 10 }} />
        </div>
      </Stagger>
      <Stagger i={4}>
        <div style={{ fontSize: 40, color: P.muted, marginTop: 30, letterSpacing: 6 }}>
          共收录 {p.total} 首新曲 · {p.companies.reduce((n, c) => n + c.games.length, 0)} 款游戏
        </div>
      </Stagger>
    </Page>
  );
};

export const NoticePage: React.FC<PageProps> = ({ p }) => (
  <Page p={p} style={{ justifyContent: 'center' }}>
    {p.notice.map((line, i) => (
      <Stagger key={i} i={i} step={3}>
        <div style={{ fontSize: i === 0 ? 52 : 44, fontWeight: i === 0 ? 800 : 500, lineHeight: 1.7, minHeight: 36 }}>{line}</div>
      </Stagger>
    ))}
  </Page>
);

export const GamesPage: React.FC<PageProps> = ({ p }) => {
  const P = PALETTES[p.theme];
  return (
    <Page p={p}>
      <Stagger i={0}>
        <div style={{ fontSize: 56, fontWeight: 800, marginBottom: 50 }}>本期收录的音乐游戏</div>
      </Stagger>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '50px 120px', alignContent: 'flex-start' }}>
        {p.companies.map((c, ci) => (
          <Stagger key={c.name} i={ci + 1} step={6} style={{ minWidth: 640 }}>
            <div style={{ fontSize: 34, fontWeight: 800, color: P.accent, letterSpacing: 4, marginBottom: 12 }}>{c.name}</div>
            {c.games.map((g) => (
              <div key={g} style={{ fontFamily: FONT_JP, fontSize: 42, lineHeight: 1.55, fontWeight: 500 }}>
                {g}
              </div>
            ))}
          </Stagger>
        ))}
      </div>
    </Page>
  );
};

export const StatsPage: React.FC<PageProps> = ({ p }) => {
  const P = PALETTES[p.theme];
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const count = Math.round(interpolate(frame, [10, fps * 1.6], [0, p.total], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const max = Math.max(1, ...p.categories.map((c) => c.count));
  return (
    <Page p={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 120 }}>
      <div style={{ width: 620 }}>
        <Stagger i={0}>
          <div style={{ fontSize: 44, color: P.muted, fontWeight: 600 }}>
            {p.year}年{p.month}月共追加
          </div>
        </Stagger>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
          <span style={{ fontSize: 260, fontWeight: 900, lineHeight: 1.05, color: P.accent, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
          <span style={{ fontSize: 64, fontWeight: 800 }}>首</span>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {p.categories.map((c, i) => (
          <Bar key={c.label} i={i} label={c.label} count={c.count} ratio={c.count / max} theme={p} />
        ))}
      </div>
    </Page>
  );
};

const Bar: React.FC<{ i: number; label: string; count: number; ratio: number; theme: MonthProps }> = ({ i, label, count, ratio, theme }) => {
  const P = PALETTES[theme.theme];
  const e = useEnter(14 + i * 4, 20);
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 72, gap: 24, opacity: interpolate(e, [0, 1], [0, 1]) }}>
      <div style={{ width: 340, fontSize: 32, fontWeight: 600 }}>{label}</div>
      <div style={{ flex: 1, height: 26, borderRadius: 13, background: withAlpha(P.fg, 0.12), overflow: 'hidden' }}>
        <div style={{ width: `${ratio * 100 * e}%`, height: '100%', borderRadius: 13, background: P.accent }} />
      </div>
      <div style={{ width: 90, textAlign: 'right', fontSize: 40, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: count ? P.fg : P.muted }}>
        {count}
      </div>
    </div>
  );
};

export const LeadPage: React.FC<PageProps> = ({ p }) => (
  <Page p={p} style={{ justifyContent: 'center', alignItems: 'center' }}>
    <Stagger i={0}>
      <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: 8 }}>
        以下为{p.year}年{p.month}月实装的曲目
      </div>
    </Stagger>
  </Page>
);

export const previewLineCount = (p: MonthProps) =>
  p.previews.reduce((n, g) => n + 2 + g.dates.reduce((m, d) => m + 1 + d.items.length, 0), 0);

export const PreviewPage: React.FC<PageProps & { durationInFrames: number }> = ({ p, durationInFrames }) => {
  const P = PALETTES[p.theme];
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const lineH = 64;
  const contentH = previewLineCount(p) * lineH + 200;
  const travel = Math.max(0, contentH - (height - 260));
  const y = interpolate(frame, [60, durationInFrames - 60], [0, -travel], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Page p={p} style={{ padding: 0 }}>
      <div style={{ position: 'absolute', left: 160, top: 90, fontSize: 56, fontWeight: 800, zIndex: 2 }}>
        下月预告 <span style={{ fontSize: 34, color: P.muted, fontWeight: 500, marginLeft: 20 }}>已公布、将于下个月实装的曲目</span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 160,
          right: 160,
          top: 200,
          bottom: 60,
          overflow: 'hidden',
          maskImage: 'linear-gradient(180deg, transparent 0, #000 40px, #000 calc(100% - 60px), transparent 100%)',
        }}
      >
        <div style={{ transform: `translateY(${y}px)`, paddingTop: 40 }}>
          {p.previews.map((g) => (
            <div key={g.game} style={{ marginBottom: lineH }}>
              <div style={{ fontFamily: FONT_JP, fontSize: 44, fontWeight: 800, color: P.accent, height: lineH }}>{g.game}</div>
              {g.dates.map((d) => (
                <div key={d.date}>
                  <div style={{ fontSize: 34, fontWeight: 700, color: P.muted, height: lineH, display: 'flex', alignItems: 'center' }}>{d.date}</div>
                  {d.items.map((it, i) => (
                    <div key={i} style={{ fontFamily: FONT_JP, fontSize: 40, height: lineH, display: 'flex', alignItems: 'center', gap: 24 }}>
                      <span style={{ fontWeight: 700 }}>{it.title}</span>
                      {it.artist ? <span style={{ color: P.muted }}>/ {it.artist}</span> : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
};

export const CreditsPage: React.FC<PageProps> = ({ p }) => {
  const P = PALETTES[p.theme];
  return (
    <Page p={p} style={{ justifyContent: 'center' }}>
      {p.credits.map((c, i) => (
        <Stagger key={i} i={i} step={6} style={{ marginBottom: 56 }}>
          {c.heading ? <div style={{ fontSize: 32, color: P.muted, fontWeight: 600, letterSpacing: 4, marginBottom: 10 }}>{c.heading}</div> : null}
          {c.lines.map((l, j) => (
            <div key={j} style={{ fontFamily: FONT_JP, fontSize: 46, fontWeight: 600, lineHeight: 1.5 }}>
              {l}
            </div>
          ))}
        </Stagger>
      ))}
      <Stagger i={p.credits.length + 1}>
        <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: 10, marginTop: 30 }}>感谢观看</div>
      </Stagger>
    </Page>
  );
};
