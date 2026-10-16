import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { THEMES, type MonthProps } from '../src/types.ts';
import { buildTimeline } from '../src/timeline.ts';
import { ROOT, loadGlobal, monthPaths, parseMonthArg } from './lib/config.ts';

const CLI = path.join(ROOT, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');

const remotion = (args: string[]) => {
  const res = spawnSync(process.execPath, [CLI, ...args], { cwd: ROOT, stdio: 'inherit' });
  if (res.status !== 0) process.exit(res.status ?? 1);
};

const main = async () => {
  const flags = process.argv.slice(2).filter((a) => a.startsWith('--'));
  const positional = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const { key } = parseMonthArg(positional[0]);
  const global = loadGlobal();
  const paths = monthPaths(key, global);
  if (!fs.existsSync(paths.propsFile)) {
    throw new Error(`还没有准备素材，请先运行：npm run prepare-month -- ${key}`);
  }
  const common = [`--props=${paths.propsFile}`, `--public-dir=${paths.publicDir}`];

  if (flags.includes('--studio')) {
    remotion(['studio', ...common]);
    return;
  }

  const only = flags.find((f) => f.startsWith('--themes='))?.slice('--themes='.length).split(',');
  const themes = THEMES.filter((t) => !only || only.includes(t));

  if (flags.includes('--previews')) {
    const props = JSON.parse(fs.readFileSync(paths.propsFile, 'utf8')) as MonthProps;
    const songIndex = Number(positional[1] ?? 1) - 1;
    const dir = path.join(paths.outDir, 'previews', key);
    fs.mkdirSync(dir, { recursive: true });
    console.log('打包中...');
    const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src', 'index.ts'), publicDir: paths.publicDir });
    for (const theme of themes) {
      const inputProps = { ...props, theme, songIndex };
      const composition = await selectComposition({ serveUrl, id: 'Card', inputProps });
      const output = path.join(dir, `${theme}.mp4`);
      await renderMedia({
        serveUrl,
        composition,
        inputProps,
        codec: 'h264',
        crf: 20,
        outputLocation: output,
        frameRange: [0, Math.min(composition.durationInFrames, global.fps * 7) - 1],
      });
      console.log(`  ${output}`);
    }
    return;
  }

  if (flags.includes('--stills')) {
    const props = JSON.parse(fs.readFileSync(paths.propsFile, 'utf8')) as MonthProps;
    const songIndex = Number(positional[1] ?? 1) - 1;
    const stillsDir = path.join(paths.outDir, 'stills', key);
    fs.mkdirSync(stillsDir, { recursive: true });
    console.log('打包中...');
    const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src', 'index.ts'), publicDir: paths.publicDir });
    const still = async (id: string, inputProps: Record<string, unknown>, frame: number, name: string) => {
      const composition = await selectComposition({ serveUrl, id, inputProps });
      const output = path.join(stillsDir, name);
      await renderStill({ serveUrl, composition, inputProps, frame: Math.min(frame, composition.durationInFrames - 1), output });
      console.log(`  ${name}`);
    };
    for (const theme of themes) {
      const themed = { ...props, theme };
      await still('Card', { ...themed, songIndex }, 120, `card-${theme}.png`);
      let start = 0;
      const wanted = new Set(['title', 'games', 'stats', 'section', 'preview', 'credits']);
      for (const it of buildTimeline(themed, global.fps)) {
        if (wanted.has(it.kind)) {
          wanted.delete(it.kind);
          await still('Monthly', themed, start + Math.min(it.frames - 1, global.fps * 2), `${theme}-${it.kind}.png`);
        }
        start += it.frames - props.transitionFrames;
      }
    }
    console.log(`\n截图已保存到：${stillsDir}`);
    return;
  }

  fs.mkdirSync(paths.outDir, { recursive: true });
  const out = path.join(paths.outDir, `${key}.mp4`);
  remotion(['render', 'Monthly', out, ...common]);
  console.log(`\n成片：${out}`);
};

main().catch((e: Error) => {
  console.error(e.message);
  process.exit(1);
});
