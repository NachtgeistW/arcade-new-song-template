import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ExcelJS from 'exceljs';
import { ROOT, findGame, loadGames, loadGlobal } from '../lib/config.ts';
import { LISTS_SHEET, PREVIEW_SHEET, SONG_COLUMNS, SONG_SHEET } from '../lib/sheet.ts';
import { createWorkbook } from '../new-month.ts';

const games = loadGames();
const stableNames: Record<string, string> = {
  iidx: 'beatmania IIDX', sdvx: 'SOUND VOLTEX', popn: "pop'n music", jubeat: 'jubeat',
  gitadora: 'GITADORA', ddr: 'DanceDanceRevolution', nostalgia: 'ノスタルジア',
  polariscord: 'ポラリスコード', dancerush: 'DANCERUSH STARDOM', dancearound: 'DANCE aROUND',
  reflec: 'REFLEC BEAT', maimai: 'maimai でらっくす', chunithm: 'CHUNITHM',
  ongeki: 'オンゲキ', taiko: '太鼓の達人', musicdiver: 'MUSIC DIVER', 'jubeat-cn': '音乐魔方',
};

test('tracked games have stable names and default sections', () => {
  for (const [id, name] of Object.entries(stableNames)) {
    const game = findGame(games, id);
    assert.ok(game, id);
    assert.equal(game.name, name);
    assert.deepEqual(game.section, [name]);
    assert.ok(!game.event);
  }
  for (const id of ['bemani-event', 'sega-event']) assert.equal(findGame(games, id)?.event, true);
});

test('IDs, names and aliases resolve unambiguously, including legacy versions', () => {
  assert.equal(new Set(games.map((g) => g.id)).size, games.length);
  const owners = new Map<string, string>();
  for (const game of games) {
    for (const key of [game.id, game.name, ...game.aliases]) {
      const normalized = key.trim().toLowerCase();
      assert.ok(!owners.has(normalized) || owners.get(normalized) === game.id, `Conflicting alias: ${key}`);
      owners.set(normalized, game.id);
      assert.equal(findGame(games, ` ${key.toUpperCase()} `)?.id, game.id);
    }
  }
  const legacy: Record<string, string> = {
    'SOUND VOLTEX EXCEED GEAR': 'sdvx', "pop'n music Jam&Fizz": 'popn',
    'jubeat beyond the Ave.': 'jubeat', 'GITADORA GALAXY WAVE': 'gitadora',
    'DanceDanceRevolution WORLD': 'ddr', 'DDR WORLD': 'ddr', 'ノスタルジア Op.3': 'nostalgia',
    'maimai でらっくす PRiSM': 'maimai', 'CHUNITHM VERSE': 'chunithm',
    'オンゲキ bright MEMORY': 'ongeki', '太鼓の達人 虹色版': 'taiko',
  };
  for (const [name, id] of Object.entries(legacy)) assert.equal(findGame(games, name)?.id, id);
});

test('GuitarFreaks and DrumMania share GITADORA; mainland jubeat remains separate', () => {
  const gitadora = findGame(games, 'GITADORA');
  for (const alias of ['GuitarFreaks', 'DrumMania', 'GITADORA GuitarFreaks', 'GITADORA DrumMania', '吉他', '鼓']) {
    assert.equal(findGame(games, alias), gitadora);
  }
  assert.equal(games.filter((g) => g.id === 'gitadora').length, 1);
  assert.equal(findGame(games, 'jubeat')?.id, 'jubeat');
  assert.equal(findGame(games, '音乐魔方')?.id, 'jubeat-cn');
  assert.equal(findGame(games, 'jubeat 音乐魔方')?.id, 'jubeat-cn');
  for (const id of ['dancerush', 'dancearound', 'reflec', 'jubeat-cn']) assert.equal(findGame(games, id)?.logo, null);
});

test('new workbook dropdowns contain canonical names and retain the template structure', () => {
  const workbook = createWorkbook();
  const lists = workbook.getWorksheet(LISTS_SHEET)!;
  assert.equal(lists.state, 'hidden');
  assert.deepEqual(games.map((_, i) => lists.getCell(i + 1, 1).value), games.map((g) => g.name));
  const songs = workbook.getWorksheet(SONG_SHEET)!;
  assert.deepEqual(SONG_COLUMNS.map((_, i) => songs.getCell(1, i + 1).value), SONG_COLUMNS.map((c) => c.header));
  assert.equal(songs.getCell('C2').dataValidation.formulae?.[0], `${LISTS_SHEET}!$A$1:$A$${games.length}`);
  assert.equal(workbook.getWorksheet(PREVIEW_SHEET)!.getCell('A2').dataValidation.formulae?.[0], `${LISTS_SHEET}!$A$1:$A$${games.length}`);
});

test('generator and --check accept all mappings without fetching or rendering media', async () => {
  // Keep synthetic data out of real month directories. This ignored fixture is always removed.
  const tempRoot = path.join(ROOT, 'tmp');
  fs.mkdirSync(tempRoot, { recursive: true });
  const fixture = fs.mkdtempSync(path.join(tempRoot, 'game-config-test-'));
  const month = '2099-01';
  const xlsx = path.join(fixture, 'months', month, '新曲.xlsx');
  const cli = (script: string, ...args: string[]) => spawnSync(process.execPath,
    ['--import', 'tsx', path.join(fixture, 'scripts', script), month, ...args],
    { cwd: fixture, encoding: 'utf8', timeout: 30_000 });
  try {
    for (const relative of ['package.json', 'config/games.json', 'src/types.ts', 'scripts/new-month.ts',
      'scripts/prepare.ts', 'scripts/lib/config.ts', 'scripts/lib/media.ts', 'scripts/lib/sheet.ts', 'scripts/lib/values.ts']) {
      const destination = path.join(fixture, relative);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(path.join(ROOT, relative), destination);
    }
    fs.writeFileSync(path.join(fixture, 'config/global.json'), JSON.stringify({ ...loadGlobal(), workDir: path.join(fixture, 'work') }));
    const generated = cli('new-month.ts');
    assert.equal(generated.status, 0, generated.error?.message ?? generated.stderr);
    assert.ok(fs.existsSync(xlsx));
    const original = fs.readFileSync(xlsx);
    const duplicate = cli('new-month.ts');
    assert.equal(duplicate.status, 1);
    assert.match(duplicate.stderr, /已存在，不会覆盖/);
    assert.deepEqual(fs.readFileSync(xlsx), original);
    const empty = cli('prepare.ts', '--check');
    assert.equal(empty.status, 1);
    assert.match(empty.stderr, /表是空的/);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(xlsx);
    const songs = workbook.getWorksheet(SONG_SHEET)!;
    let row = 2;
    for (const game of games) {
      for (const key of new Set([game.id, game.name, ...game.aliases])) {
        const values: Record<string, string> = {
          game: key, title: `CONFIG TEST ONLY ${row}`, category: 'ORIGINAL', date: '2099/1/1',
          url: 'https://example.invalid/config-test-only',
          participants: game.event ? (game.id === 'sega-event' ? 'CHUNITHM|maimai|オンゲキ' : 'GuitarFreaks|DrumMania|DRS|DaR|RB') : '',
        };
        SONG_COLUMNS.forEach((column, i) => { songs.getCell(row, i + 1).value = values[column.key] ?? ''; });
        row++;
      }
    }
    await workbook.xlsx.writeFile(xlsx);
    const checked = cli('prepare.ts', '--check');
    assert.equal(checked.status, 0, checked.error?.message ?? checked.stderr);
    assert.match(checked.stdout, new RegExp(`表格检查通过：${row - 2} 首`));
    assert.equal(fs.existsSync(path.join(fixture, 'work')), false);
    assert.deepEqual(fs.readdirSync(path.join(fixture, 'months', month, '素材')), []);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
