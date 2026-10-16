import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

export const FONT_JP = '"Noto Sans JP", "Noto Sans SC", sans-serif';
export const FONT_SC = '"Noto Sans SC", "Noto Sans JP", sans-serif';
export const FONT_SERIF = '"Noto Serif JP", "Noto Serif SC", serif';

let started = false;

export const ensureFonts = () => {
  if (started) return;
  started = true;
  loadFont({ family: 'Noto Sans JP', url: staticFile('fonts/NotoSansJP-VF.ttf'), weight: '100 900' });
  loadFont({ family: 'Noto Sans SC', url: staticFile('fonts/NotoSansSC-VF.ttf'), weight: '100 900' });
  loadFont({ family: 'Noto Serif JP', url: staticFile('fonts/NotoSerifJP-VF.ttf'), weight: '200 900' });
  loadFont({ family: 'Noto Serif SC', url: staticFile('fonts/NotoSerifSC-VF.ttf'), weight: '200 900' });
};
