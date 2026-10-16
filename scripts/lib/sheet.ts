import ExcelJS from 'exceljs';
import { THEMES } from '../../src/types.ts';

export const SONG_SHEET = '曲目';
export const PREVIEW_SHEET = '下月预告';
export const SETTINGS_SHEET = '设置';
export const LISTS_SHEET = '_lists';

export const SONG_COLUMNS = [
  { key: 'order', header: '序号', width: 6, note: '播放顺序。留空则按表格行顺序。' },
  { key: 'section', header: '分段', width: 16, note: '分段标题卡上显示的文字，换行用 Alt+Enter 或 |。留空则使用游戏的默认分段名。连续相同的分段只出一张标题卡。' },
  { key: 'game', header: '游戏', width: 26, note: '从下拉菜单选择，或填写 config/games.json 里的名字/别名。多机种活动的曲目选「BEMANI多机种活动」等。' },
  { key: 'participants', header: '参与机种', width: 30, note: '仅「多机种活动」需要填：参与活动的机种，用 | 或 Alt+Enter 分隔，例如 jubeat|DDR|SDVX。分段卡和信息卡会轮播这些机种的 logo。' },
  { key: 'title', header: '曲名', width: 30 },
  { key: 'artist', header: '作曲者', width: 30, note: '作曲者名义（照官方写法）。' },
  { key: 'genre', header: '曲目类型', width: 12, note: '显示在信息卡上，如：本社原创 / 原创 / VARIETY / 版权。' },
  { key: 'category', header: '统计分类', width: 12, note: '片头统计用的大分类，从下拉菜单选择。' },
  { key: 'date', header: '实装日期', width: 12, note: '例如 2025/2/14。' },
  { key: 'unlock', header: '解锁方式', width: 34, note: '信息卡右侧的说明文字，可留空。' },
  { key: 'url', header: '视频链接', width: 40, note: 'B站或 YouTube 链接（也可以填 素材/ 文件夹里的本地视频文件名）。和 封面+音源 二选一。' },
  { key: 'cover', header: '封面', width: 18, note: '素材/ 文件夹里的图片文件名。' },
  { key: 'audio', header: '音源', width: 18, note: '素材/ 文件夹里的音频文件名。' },
  { key: 'start', header: '选段开始', width: 10, note: '分:秒，例如 1:23 或 1:23.5。留空表示从头开始。' },
  { key: 'end', header: '选段结束', width: 10, note: '分:秒。留空表示到结尾。' },
  { key: 'memo', header: '备注', width: 20, note: '自己看的备注，不会出现在视频里。' },
] as const;

export type SongColumnKey = (typeof SONG_COLUMNS)[number]['key'];

export const PREVIEW_COLUMNS = [
  { key: 'game', header: '游戏', width: 26 },
  { key: 'date', header: '实装日期', width: 12 },
  { key: 'title', header: '曲名', width: 34 },
  { key: 'artist', header: '作曲者', width: 34 },
] as const;

export const SETTINGS_KEYS = [
  { key: '版式', note: `${THEMES.join(' / ')}，留空使用 config/global.json 的默认值` },
  { key: '标题', note: '留空使用默认标题' },
  { key: '协力', note: '片尾「协力」名单，用逗号分隔' },
] as const;

export const cellText = (v: ExcelJS.CellValue): string => {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    if ('richText' in v) return v.richText.map((r) => r.text).join('').trim();
    if ('text' in v && typeof v.text === 'string') return v.text.trim();
    if ('hyperlink' in v && typeof v.hyperlink === 'string') return v.hyperlink.trim();
    if ('result' in v) return cellText(v.result as ExcelJS.CellValue);
  }
  return String(v).trim();
};

export const readHeaderMap = (ws: ExcelJS.Worksheet) => {
  const map = new Map<string, number>();
  ws.getRow(1).eachCell((cell, col) => map.set(cellText(cell.value), col));
  return map;
};
