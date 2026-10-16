import fs from 'node:fs';
import ExcelJS from 'exceljs';
import { loadGames, loadGlobal, monthPaths, parseMonthArg } from './lib/config.ts';
import {
  LISTS_SHEET,
  PREVIEW_COLUMNS,
  PREVIEW_SHEET,
  SETTINGS_KEYS,
  SETTINGS_SHEET,
  SONG_COLUMNS,
  SONG_SHEET,
} from './lib/sheet.ts';

const MAX_ROWS = 300;

const styleHeader = (ws: ExcelJS.Worksheet) => {
  const row = ws.getRow(1);
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5B4A3A' } };
  row.alignment = { vertical: 'middle' };
  row.height = 22;
  ws.views = [{ state: 'frozen', ySplit: 1 }];
};

export const createWorkbook = () => {
  const global = loadGlobal();
  const games = loadGames();
  const wb = new ExcelJS.Workbook();

  const songs = wb.addWorksheet(SONG_SHEET);
  songs.columns = SONG_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width, style: { numFmt: '@' } }));
  SONG_COLUMNS.forEach((c, i) => {
    if ('note' in c) songs.getRow(1).getCell(i + 1).note = c.note;
  });
  styleHeader(songs);

  const previews = wb.addWorksheet(PREVIEW_SHEET);
  previews.columns = PREVIEW_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width, style: { numFmt: '@' } }));
  styleHeader(previews);

  const settings = wb.addWorksheet(SETTINGS_SHEET);
  settings.columns = [
    { header: '项目', key: 'k', width: 10 },
    { header: '内容', key: 'v', width: 50, style: { numFmt: '@' } },
    { header: '说明', key: 'n', width: 60 },
  ];
  SETTINGS_KEYS.forEach((s) => settings.addRow({ k: s.key, v: '', n: s.note }));
  styleHeader(settings);

  const lists = wb.addWorksheet(LISTS_SHEET, { state: 'hidden' });
  games.forEach((g, i) => (lists.getCell(i + 1, 1).value = g.name));
  global.categories.forEach((c, i) => (lists.getCell(i + 1, 2).value = c.key));

  const col = (key: string) => songs.getColumn(key).letter;
  const gameList = `${LISTS_SHEET}!$A$1:$A$${games.length}`;
  const catList = `${LISTS_SHEET}!$B$1:$B$${global.categories.length}`;
  for (let r = 2; r <= MAX_ROWS; r++) {
    songs.getCell(`${col('game')}${r}`).dataValidation = { type: 'list', allowBlank: true, formulae: [gameList] };
    songs.getCell(`${col('category')}${r}`).dataValidation = { type: 'list', allowBlank: true, formulae: [catList] };
    previews.getCell(`A${r}`).dataValidation = { type: 'list', allowBlank: true, formulae: [gameList] };
  }
  return wb;
};

const main = async () => {
  const { key } = parseMonthArg(process.argv[2]);
  const paths = monthPaths(key, loadGlobal());
  if (fs.existsSync(paths.xlsx)) {
    throw new Error(`${paths.xlsx} 已存在，不会覆盖。`);
  }
  fs.mkdirSync(paths.assetsDir, { recursive: true });
  await createWorkbook().xlsx.writeFile(paths.xlsx);
  console.log(`已创建：${paths.xlsx}`);
  console.log(`本地封面/音源请放到：${paths.assetsDir}`);
};

if (process.argv[1]?.endsWith('new-month.ts')) {
  main().catch((e: Error) => {
    console.error(e.message);
    process.exit(1);
  });
}
