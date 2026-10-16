import type ExcelJS from 'exceljs';
import { cellText } from './sheet.ts';

export const parseTime = (v: ExcelJS.CellValue): number | null => {
  if (v == null || v === '') return null;
  if (v instanceof Date) {
    // Excel 把「1:23」当成 1 小时 23 分：秒数为 0 时按「分:秒」理解
    const h = v.getUTCHours();
    const m = v.getUTCMinutes();
    const s = v.getUTCSeconds() + v.getUTCMilliseconds() / 1000;
    return s === 0 ? h * 60 + m : h * 3600 + m * 60 + s;
  }
  if (typeof v === 'number') {
    return v < 1 ? Math.round(v * 86400 * 1000) / 1000 : v;
  }
  const text = cellText(v).replace('：', ':');
  if (!text) return null;
  const parts = text.split(':').map(Number);
  if (parts.some((p) => Number.isNaN(p))) throw new Error(`无法识别的时间「${text}」，请写成 1:23 或 1:23.5`);
  return parts.reduce((acc, p) => acc * 60 + p, 0);
};

export const parseDate = (v: ExcelJS.CellValue): string => {
  if (v instanceof Date) return `${v.getUTCFullYear()}/${v.getUTCMonth() + 1}/${v.getUTCDate()}`;
  const text = cellText(v);
  const m = text.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?$/);
  return m ? `${Number(m[1])}/${Number(m[2])}/${Number(m[3])}` : text;
};

export const splitLines = (text: string) =>
  text
    .split(/\r?\n|\|/)
    .map((s) => s.trim())
    .filter(Boolean);
