import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const VIDEO_EXTS = ['.mp4', '.mkv', '.webm', '.flv', '.mov'];

const run = (cmd: string, args: string[], opts: { quiet?: boolean } = {}) => {
  const res = spawnSync(cmd, args, {
    encoding: 'utf8',
    stdio: opts.quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.error) throw new Error(`无法运行 ${cmd}：${res.error.message}`);
  if (res.status !== 0) {
    throw new Error(`${cmd} 执行失败（退出码 ${res.status}）${res.stderr ? `\n${res.stderr.slice(-2000)}` : ''}`);
  }
  return res.stdout ?? '';
};

export const isUrl = (s: string) => /^https?:\/\//i.test(s);

const shortHash = (s: string) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);

export const cacheIdForUrl = (url: string) => {
  const u = new URL(url);
  const host = u.hostname.replace(/^www\.|^m\./, '');
  if (host === 'youtu.be') return `yt_${u.pathname.slice(1)}`;
  if (host.endsWith('youtube.com')) {
    const id = u.searchParams.get('v') ?? u.pathname.match(/\/(?:shorts|live|embed)\/([\w-]+)/)?.[1];
    if (id) return `yt_${id}`;
  }
  if (host.endsWith('bilibili.com') || host === 'b23.tv') {
    const bv = url.match(/BV[0-9A-Za-z]{10}/)?.[0] ?? url.match(/av\d+/i)?.[0];
    if (bv) {
      const p = Number(u.searchParams.get('p') ?? '1');
      return p > 1 ? `${bv}_p${p}` : bv;
    }
  }
  return `url_${shortHash(url)}`;
};

const findCached = (cacheDir: string, id: string) => {
  if (!fs.existsSync(cacheDir)) return null;
  const hit = fs
    .readdirSync(cacheDir)
    .find((f) => f.startsWith(`${id}.`) && VIDEO_EXTS.includes(path.extname(f).toLowerCase()));
  return hit ? path.join(cacheDir, hit) : null;
};

export const ensureDownloaded = (url: string, cacheDir: string, extraArgs: string[]) => {
  const id = cacheIdForUrl(url);
  const cached = findCached(cacheDir, id);
  if (cached) return { file: cached, downloaded: false };
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log(`  下载中：${url}`);
  run('yt-dlp', [
    '--no-playlist',
    '-f',
    'bv*[height<=1080]+ba/b[height<=1080]/bv*+ba/b',
    '--merge-output-format',
    'mp4',
    '-o',
    path.join(cacheDir, `${id}.%(ext)s`),
    ...extraArgs,
    url,
  ]);
  const file = findCached(cacheDir, id);
  if (!file) throw new Error(`yt-dlp 运行结束，但没有在 ${cacheDir} 找到 ${id} 的视频文件`);
  return { file, downloaded: true };
};

export const probeDuration = (file: string) => {
  const out = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], {
    quiet: true,
  });
  const d = Number(out.trim());
  if (!Number.isFinite(d)) throw new Error(`无法读取时长：${file}`);
  return d;
};

export const probeVideoSize = (file: string) => {
  const out = run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file], {
    quiet: true,
  });
  const [width, height] = out.trim().split(',').map(Number);
  if (!width || !height) throw new Error(`无法读取画面尺寸：${file}`);
  return { width, height };
};

const hasAudio = (file: string) =>
  run('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', file], {
    quiet: true,
  }).trim().length > 0;

const audioArgs = (loudnorm: boolean) => [
  ...(loudnorm ? ['-af', 'loudnorm=I=-14:TP=-1.5:LRA=11'] : []),
  '-ar',
  '48000',
  '-c:a',
  'aac',
  '-b:a',
  '320k',
];

export interface TrimJob {
  kind: 'video' | 'audio';
  src: string;
  start: number;
  duration: number;
  loudnorm: boolean;
  outDir: string;
  baseName: string;
}

export const trimmedName = (job: TrimJob) => {
  const stat = fs.statSync(job.src);
  const key = [job.src, stat.size, stat.mtimeMs, job.start, job.duration, job.loudnorm, job.kind].join('|');
  return `${job.baseName}-${shortHash(key)}.${job.kind === 'video' ? 'mp4' : 'm4a'}`;
};

export const trim = (job: TrimJob) => {
  const name = trimmedName(job);
  const out = path.join(job.outDir, name);
  if (fs.existsSync(out)) return { name, created: false };
  fs.mkdirSync(job.outDir, { recursive: true });
  const tmp = `${out}.part.${job.kind === 'video' ? 'mp4' : 'm4a'}`;
  const common = ['-v', 'error', '-y', '-ss', String(job.start), '-i', job.src, '-t', String(job.duration)];
  if (job.kind === 'video') {
    run(
      'ffmpeg',
      [
        ...common,
        '-map',
        '0:v:0',
        ...(hasAudio(job.src) ? ['-map', '0:a:0'] : []),
        '-vf',
        "scale='min(1920,iw)':-2:flags=lanczos",
        '-fps_mode',
        'cfr',
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '17',
        '-pix_fmt',
        'yuv420p',
        ...audioArgs(job.loudnorm),
        '-movflags',
        '+faststart',
        tmp,
      ],
      { quiet: true },
    );
  } else {
    run('ffmpeg', [...common, '-vn', ...audioArgs(job.loudnorm), tmp], { quiet: true });
  }
  fs.renameSync(tmp, out);
  return { name, created: true };
};

export const extractViz = (trimmedFile: string) => {
  const name = `${path.basename(trimmedFile, path.extname(trimmedFile))}-viz.wav`;
  const out = path.join(path.dirname(trimmedFile), name);
  if (fs.existsSync(out)) return name;
  if (!hasAudio(trimmedFile)) {
    run('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=11025:cl=mono', '-t', '1', out], { quiet: true });
    return name;
  }
  run('ffmpeg', ['-v', 'error', '-y', '-i', trimmedFile, '-vn', '-ac', '1', '-ar', '11025', '-c:a', 'pcm_s16le', out], { quiet: true });
  return name;
};

export const copyIfChanged = (src: string, dest: string) => {
  if (fs.existsSync(dest)) {
    const a = fs.statSync(src);
    const b = fs.statSync(dest);
    if (a.size === b.size && a.mtimeMs <= b.mtimeMs) return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
};

export const copyDirIfChanged = (src: string, dest: string) => {
  if (!fs.existsSync(src)) return;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirIfChanged(s, d);
    else copyIfChanged(s, d);
  }
};
