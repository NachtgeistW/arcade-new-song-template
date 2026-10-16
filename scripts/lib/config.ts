import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export interface GameConfig {
  id: string;
  name: string;
  aliases: string[];
  company: string;
  event?: boolean;
  logo: string | null;
  logoOnDark?: boolean;
  logoOnLight?: boolean;
  section: string[];
  accent: string;
  voice?: string | null;
}

export interface GlobalConfig {
  workDir: string;
  fps: number;
  width: number;
  height: number;
  theme: string;
  title: string;
  notice: string[];
  categories: { key: string; label: string }[];
  credits: { heading: string; lines: string[] }[];
  sectionSfx: string | null;
  transitionFrames: number;
  audio: { loudnorm: boolean; fadeInSec: number; fadeOutSec: number };
  ytdlp: { args: string[] };
}

const readJson = <T>(file: string): T =>
  JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8')) as T;

export const loadGlobal = () => readJson<GlobalConfig>('config/global.json');
export const loadGames = () => readJson<GameConfig[]>('config/games.json');

export const expandEnv = (p: string) =>
  p.replace(/%([^%]+)%/g, (_, name: string) => process.env[name] ?? `%${name}%`);

export const parseMonthArg = (arg: string | undefined) => {
  const m = arg?.match(/^(\d{4})-(\d{1,2})$/);
  if (!m) {
    throw new Error(`请指定月份，格式为 YYYY-MM，例如：npm run prepare-month -- 2025-02（收到：${arg ?? '空'}）`);
  }
  const year = Number(m[1]);
  const month = Number(m[2]);
  return { year, month, key: `${year}-${String(month).padStart(2, '0')}` };
};

export const monthPaths = (key: string, global: GlobalConfig) => {
  const workDir = path.resolve(expandEnv(global.workDir));
  const monthDir = path.join(ROOT, 'months', key);
  const buildDir = path.join(workDir, 'build', key);
  return {
    workDir,
    monthDir,
    xlsx: path.join(monthDir, '新曲.xlsx'),
    assetsDir: path.join(monthDir, '素材'),
    cacheDir: path.join(workDir, 'cache'),
    buildDir,
    publicDir: path.join(buildDir, 'public'),
    propsFile: path.join(buildDir, 'props.json'),
    outDir: path.join(workDir, 'out'),
  };
};

export const findGame = (games: GameConfig[], name: string) => {
  const n = name.trim().toLowerCase();
  return games.find(
    (g) => g.id.toLowerCase() === n || g.name.toLowerCase() === n || g.aliases.some((a) => a.toLowerCase() === n),
  );
};
