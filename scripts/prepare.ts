import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { THEMES, type MonthProps, type PreviewGroup, type Song, type ThemeName } from '../src/types.ts';
import { ROOT, findGame, loadGames, loadGlobal, monthPaths, parseMonthArg, type GameConfig } from './lib/config.ts';
import { copyDirIfChanged, copyIfChanged, ensureDownloaded, extractViz, isUrl, probeDuration, probeVideoSize, trim } from './lib/media.ts';
import { PREVIEW_SHEET, SETTINGS_SHEET, SONG_COLUMNS, SONG_SHEET, cellText, readHeaderMap, type SongColumnKey } from './lib/sheet.ts';
import { parseDate, parseTime, splitLines } from './lib/values.ts';

interface RawSong {
  row: number;
  cells: Record<SongColumnKey, ExcelJS.CellValue>;
  text: Record<SongColumnKey, string>;
}

const readSongs = (ws: ExcelJS.Worksheet): RawSong[] => {
  const header = readHeaderMap(ws);
  const missing = SONG_COLUMNS.filter((c) => c.key !== 'memo' && c.key !== 'participants' && !header.has(c.header));
  if (missing.length) throw new Error(`「${SONG_SHEET}」表缺少列：${missing.map((c) => c.header).join('、')}`);
  const rows: RawSong[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const cells = {} as RawSong['cells'];
    const text = {} as RawSong['text'];
    for (const c of SONG_COLUMNS) {
      const col = header.get(c.header);
      cells[c.key] = col ? row.getCell(col).value : null;
      const value = cells[c.key];
      text[c.key] =
        c.key === 'url' && value && typeof value === 'object' && 'hyperlink' in value
          ? value.hyperlink.trim()
          : cellText(value);
    }
    if (!text.title && !text.game && !text.url && !text.cover) return;
    rows.push({ row: rowNumber, cells, text });
  });
  return rows;
};

const readSettings = (ws: ExcelJS.Worksheet | undefined) => {
  const map = new Map<string, string>();
  ws?.eachRow((row, n) => {
    if (n > 1) map.set(cellText(row.getCell(1).value), cellText(row.getCell(2).value));
  });
  return map;
};

const readPreviews = (ws: ExcelJS.Worksheet | undefined, games: GameConfig[]): PreviewGroup[] => {
  const groups: PreviewGroup[] = [];
  ws?.eachRow((row, n) => {
    if (n === 1) return;
    const gameText = cellText(row.getCell(1).value);
    const title = cellText(row.getCell(3).value);
    if (!gameText || !title) return;
    const game = findGame(games, gameText)?.name ?? gameText;
    const date = parseDate(row.getCell(2).value);
    const artist = cellText(row.getCell(4).value);
    let g = groups.find((x) => x.game === game);
    if (!g) groups.push((g = { game, dates: [] }));
    let d = g.dates.find((x) => x.date === date);
    if (!d) g.dates.push((d = { date, items: [] }));
    d.items.push({ title, artist });
  });
  return groups;
};

const main = async () => {
  const { year, month, key } = parseMonthArg(process.argv[2]);
  const global = loadGlobal();
  const games = loadGames();
  const paths = monthPaths(key, global);
  if (!fs.existsSync(paths.xlsx)) {
    throw new Error(`找不到 ${paths.xlsx}，请先运行：npm run new-month -- ${key}`);
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(paths.xlsx);
  const songSheet = wb.getWorksheet(SONG_SHEET);
  if (!songSheet) throw new Error(`表格里没有「${SONG_SHEET}」工作表`);
  const settings = readSettings(wb.getWorksheet(SETTINGS_SHEET));
  const raws = readSongs(songSheet);
  if (!raws.length) throw new Error(`「${SONG_SHEET}」表是空的`);

  const categoryKeys = global.categories.map((c) => c.key.toLowerCase());
  const errors: string[] = [];
  const err = (r: RawSong, col: string, msg: string) => errors.push(`第 ${r.row} 行「${col}」：${msg}`);

  interface Checked {
    raw: RawSong;
    game: GameConfig;
    participants: GameConfig[];
    start: number;
    end: number | null;
    source: { kind: 'url'; url: string } | { kind: 'localVideo'; file: string } | { kind: 'cover'; cover: string; audio: string };
  }
  const checked: Checked[] = [];

  for (const r of raws) {
    const t = r.text;
    const game = findGame(games, t.game);
    if (!t.game) err(r, '游戏', '不能为空');
    else if (!game) err(r, '游戏', `「${t.game}」不在 config/games.json 里`);
    const participants: GameConfig[] = [];
    const participantNames = splitLines(t.participants);
    if (game?.event) {
      if (!participantNames.length) err(r, '参与机种', `「${game.name}」需要填写参与机种`);
      for (const name of participantNames) {
        const p = findGame(games, name);
        if (!p) err(r, '参与机种', `「${name}」不在 config/games.json 里`);
        else if (p.event) err(r, '参与机种', `「${name}」本身是多机种活动，请填具体机种`);
        else if (!participants.includes(p)) participants.push(p);
      }
    } else if (game && participantNames.length) {
      err(r, '参与机种', '只有「多机种活动」才需要填，普通机种请留空');
    }
    if (!t.title) err(r, '曲名', '不能为空');
    if (t.category && !categoryKeys.includes(t.category.toLowerCase())) {
      err(r, '统计分类', `「${t.category}」不在 config/global.json 的分类列表里`);
    }

    let start = 0;
    let end: number | null = null;
    try {
      start = parseTime(r.cells.start) ?? 0;
      end = parseTime(r.cells.end);
      if (end != null && end <= start) err(r, '选段结束', '必须晚于选段开始');
    } catch (e) {
      err(r, '选段', (e as Error).message);
    }

    const hasUrl = Boolean(t.url);
    const hasCover = Boolean(t.cover || t.audio);
    let source: Checked['source'] | null = null;
    if (hasUrl && hasCover) err(r, '视频链接', '视频链接和封面+音源只能填一种');
    else if (!hasUrl && !hasCover) err(r, '视频链接', '视频链接和封面+音源至少要填一种');
    else if (hasUrl) {
      if (isUrl(t.url)) source = { kind: 'url', url: t.url };
      else {
        const file = path.join(paths.assetsDir, t.url);
        if (fs.existsSync(file)) source = { kind: 'localVideo', file };
        else err(r, '视频链接', `既不是链接，也没有在 素材/ 里找到文件「${t.url}」`);
      }
    } else {
      const cover = path.join(paths.assetsDir, t.cover);
      const audio = path.join(paths.assetsDir, t.audio);
      if (!t.cover) err(r, '封面', '填了音源就必须填封面');
      else if (!fs.existsSync(cover)) err(r, '封面', `素材/ 里没有「${t.cover}」`);
      if (!t.audio) err(r, '音源', '填了封面就必须填音源');
      else if (!fs.existsSync(audio)) err(r, '音源', `素材/ 里没有「${t.audio}」`);
      source = { kind: 'cover', cover, audio };
    }
    if (game && source) checked.push({ raw: r, game, participants, start, end, source });
  }

  const theme = (settings.get('版式') || global.theme) as ThemeName;
  if (!THEMES.includes(theme)) errors.push(`「设置」表的版式「${theme}」无效，可选：${THEMES.join(' / ')}`);

  if (errors.length) {
    console.error(`表格有 ${errors.length} 处问题：\n${errors.map((e) => `  - ${e}`).join('\n')}`);
    process.exit(1);
  }
  if (process.argv.includes('--check')) {
    console.log(`表格检查通过：${checked.length} 首`);
    return;
  }

  checked.sort((a, b) => {
    const oa = Number(a.raw.text.order) || Infinity;
    const ob = Number(b.raw.text.order) || Infinity;
    return oa === ob ? a.raw.row - b.raw.row : oa - ob;
  });

  const mediaDir = path.join(paths.publicDir, 'media');
  const usedMedia = new Set<string>();
  const songs: Song[] = [];

  for (const [i, c] of checked.entries()) {
    const t = c.raw.text;
    const n = String(i + 1).padStart(3, '0');
    console.log(`[${i + 1}/${checked.length}] ${c.game.name} - ${t.title}`);
    let media: Song['media'];
    let duration: number;
    let viz: string;
    try {
      if (c.source.kind === 'cover') {
        const total = probeDuration(c.source.audio);
        duration = (c.end ?? total) - c.start;
        const audio = trim({ kind: 'audio', src: c.source.audio, start: c.start, duration, loudnorm: global.audio.loudnorm, outDir: mediaDir, baseName: n });
        const coverName = `${n}-cover${path.extname(c.source.cover).toLowerCase()}`;
        copyIfChanged(c.source.cover, path.join(mediaDir, coverName));
        viz = extractViz(path.join(mediaDir, audio.name));
        usedMedia.add(audio.name).add(coverName).add(viz);
        media = { kind: 'cover', cover: `media/${coverName}`, audio: `media/${audio.name}` };
      } else {
        const src = c.source.kind === 'url' ? ensureDownloaded(c.source.url, paths.cacheDir, global.ytdlp.args).file : c.source.file;
        const total = probeDuration(src);
        duration = Math.min(c.end ?? total, total) - c.start;
        const video = trim({ kind: 'video', src, start: c.start, duration, loudnorm: global.audio.loudnorm, outDir: mediaDir, baseName: n });
        viz = extractViz(path.join(mediaDir, video.name));
        usedMedia.add(video.name).add(viz);
        media = { kind: 'video', src: `media/${video.name}`, ...probeVideoSize(path.join(mediaDir, video.name)) };
      }
    } catch (e) {
      throw new Error(`第 ${c.raw.row} 行（${t.title}）素材处理失败：${(e as Error).message}`);
    }
    if (duration <= 0.5) throw new Error(`第 ${c.raw.row} 行（${t.title}）选段太短或超出素材长度`);

    songs.push({
      order: i + 1,
      section: t.section ? splitLines(t.section) : c.game.section,
      gameId: c.game.id,
      gameName: c.game.name,
      logo: c.game.logo,
      logoOnDark: c.game.logoOnDark ?? false,
      logoOnLight: c.game.logoOnLight ?? false,
      participants: c.participants.map((g) => ({ name: g.name, logo: g.logo, onDark: g.logoOnDark ?? false, onLight: g.logoOnLight ?? false })),
      accent: c.game.accent,
      title: t.title,
      artist: t.artist,
      genre: t.genre,
      category: t.category,
      date: parseDate(c.raw.cells.date),
      unlock: t.unlock,
      media,
      viz: `media/${viz}`,
      durationSec: Math.round(duration * 1000) / 1000,
    });
  }

  if (fs.existsSync(mediaDir)) {
    for (const f of fs.readdirSync(mediaDir)) if (!usedMedia.has(f)) fs.rmSync(path.join(mediaDir, f), { force: true });
  }
  copyDirIfChanged(path.join(ROOT, 'public'), paths.publicDir);

  const presentGames = new Set(checked.flatMap((c) => (c.game.event ? c.participants : [c.game]).map((g) => g.id)));
  const companies: MonthProps['companies'] = [];
  for (const g of games) {
    if (g.event || !presentGames.has(g.id)) continue;
    let c = companies.find((x) => x.name === g.company);
    if (!c) companies.push((c = { name: g.company, games: [] }));
    c.games.push(g.name);
  }

  const credits = global.credits.map((c) => ({ ...c }));
  const helpers = settings.get('协力');
  if (helpers) credits.splice(Math.max(credits.length - 1, 0), 0, { heading: '协力', lines: [helpers] });

  const fill = (s: string) => s.replaceAll('{year}', String(year)).replaceAll('{month}', String(month));
  const props: MonthProps = {
    year,
    month,
    theme,
    title: settings.get('标题') || global.title,
    notice: global.notice.map(fill),
    companies,
    total: songs.length,
    categories: global.categories.map((c) => ({
      label: c.label,
      count: songs.filter((s) => s.category.toLowerCase() === c.key.toLowerCase()).length,
    })),
    previews: readPreviews(wb.getWorksheet(PREVIEW_SHEET), games),
    credits,
    songs,
    sectionSfx: global.sectionSfx,
    transitionFrames: global.transitionFrames,
    fadeInSec: global.audio.fadeInSec,
    fadeOutSec: global.audio.fadeOutSec,
  };
  fs.mkdirSync(paths.buildDir, { recursive: true });
  fs.writeFileSync(paths.propsFile, JSON.stringify(props, null, 2));

  const uncategorized = songs.filter((s) => !s.category).length;
  console.log(`\n完成：${songs.length} 首，写入 ${paths.propsFile}`);
  if (uncategorized) console.log(`提示：有 ${uncategorized} 首没有填「统计分类」，不会计入片头的分类统计。`);
};

main().catch((e: Error) => {
  console.error(e.message);
  process.exit(1);
});
