#!/usr/bin/env node
/**
 * gen_banner.mjs — 为 README 表头生成横幅 SVG（明亮 / 暗色两版）。
 * 零依赖。生成后请用 PNG 目视确认，再提交进仓库。
 *
 * 用法:
 *   node scripts/gen_banner.mjs --name "Acme" --tagline "..." --accent "#6d5efc" --out .github/assets/banner.svg
 * 参数:
 *   --name <text>      项目名（必需）
 *   --tagline <text>   一句话定位
 *   --accent <hex>     主色，默认 #6d5efc
 *   --accent2 <hex>    副色，默认由主色色相 +42 度派生
 *   --out <path>       输出路径（明亮版），默认 banner.svg
 *   --theme <t>        light | dark | both（默认 both）
 *   --width <n>        画布宽，默认 1280
 *   --height <n>       画布高，默认 320
 *   --monogram         画圆形首字母徽标（--align center 时忽略）
 *   --align <a>        left | center（默认 left）
 *   --font <family>    覆盖字体栈
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/* ---------- 参数 ---------- */
function parseArgs(argv) {
  const out = { theme: 'both', width: 1280, height: 320, accent: '#6d5efc', monogram: false, align: 'left' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--monogram') { out.monogram = true; continue; }
    if (a === '--help' || a === '-h') { out.help = true; continue; }
    const key = a.replace(/^--/, '');
    const val = argv[++i];
    if (val === undefined) { console.error('缺少参数值: ' + a); process.exit(2); }
    if (key === 'width' || key === 'height') out[key] = parseInt(val, 10);
    else out[key] = val;
  }
  return out;
}

/* ---------- 颜色 ---------- */
function hex2rgb(h) {
  let s = String(h).trim().replace(/^#/, '');
  if (s.length === 3) s = s.split('').map(function (c) { return c + c; }).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(s)) throw new Error('非法 hex 颜色: ' + h);
  return [0, 2, 4].map(function (i) { return parseInt(s.slice(i, i + 2), 16); });
}
function rgb2hex(rgb) {
  return '#' + rgb.map(function (v) {
    const x = Math.max(0, Math.min(255, Math.round(v)));
    return x.toString(16).padStart(2, '0');
  }).join('');
}
function mix(a, b, t) { return a.map(function (v, i) { return v + (b[i] - v) * t; }); }
function relLum(rgb) {
  const f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
}
function contrast(a, b) {
  const l = [relLum(a), relLum(b)].sort(function (x, y) { return y - x; });
  return (l[0] + 0.05) / (l[1] + 0.05);
}
function rgb2hsl(rgb) {
  const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0; const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, s, l];
}
function hsl2rgb(hsl) {
  const h = ((hsl[0] % 360) + 360) % 360, s = hsl[1], l = hsl[2];
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let t;
  if (h < 60) t = [c, x, 0]; else if (h < 120) t = [x, c, 0];
  else if (h < 180) t = [0, c, x]; else if (h < 240) t = [0, x, c];
  else if (h < 300) t = [x, 0, c]; else t = [c, 0, x];
  return t.map(function (v) { return (v + m) * 255; });
}
function rotateHue(rgb, deg) { const h = rgb2hsl(rgb); return hsl2rgb([h[0] + deg, h[1], h[2]]); }

/* ---------- 文本度量（保守估计） ---------- */
function charWidth(ch) {
  const cp = ch.codePointAt(0);
  if (cp >= 0x1100 && (cp <= 0x115f || cp === 0x2329 || cp === 0x232a ||
      (cp >= 0x2e80 && cp <= 0xa4cf) || (cp >= 0xac00 && cp <= 0xd7a3) ||
      (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0xfe30 && cp <= 0xfe6f) ||
      (cp >= 0xff00 && cp <= 0xff60) || (cp >= 0xffe0 && cp <= 0xffe6) ||
      (cp >= 0x1f300 && cp <= 0x1faff))) return 1.0;
  if (ch === ' ') return 0.28;
  if (/[A-Z]/.test(ch)) return 0.66;
  if (/[a-z]/.test(ch)) return 0.53;
  if (/[0-9]/.test(ch)) return 0.56;
  if (/[.,:;!|'\u2019]/.test(ch)) return 0.28;
  return 0.6;
}
function measure(text, size) {
  let w = 0;
  for (const ch of String(text)) w += charWidth(ch);
  return w * size;
}
function fitSize(text, maxWidth, start, min) {
  let s = start;
  while (s > min && measure(text, s) > maxWidth) s -= 1;
  return s;
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ---------- 调色板 ---------- */
function palette(mode, accent, accent2) {
  const acc = hex2rgb(accent), acc2 = hex2rgb(accent2);
  if (mode === 'light') {
    const bgA = [255, 255, 255];
    const bgB = mix([255, 255, 255], acc, 0.10);
    const bgC = mix([255, 255, 255], acc2, 0.08);
    const ink = [17, 18, 34];
    const sub = [82, 85, 112];
    const grid = mix([255, 255, 255], ink, 0.10);
    return { bgA: bgA, bgB: bgB, bgC: bgC, ink: ink, sub: sub, grid: grid, acc: acc, acc2: acc2, glow: acc, glowOp: 0.16, ringOp: 0.20 };
  }
  const bgA = [10, 12, 24];
  const bgB = mix([10, 12, 24], acc, 0.22);
  const bgC = mix([10, 12, 24], acc2, 0.18);
  const ink = [232, 233, 245];
  const sub = [155, 159, 190];
  const grid = mix([10, 12, 24], [255, 255, 255], 0.14);
  return { bgA: bgA, bgB: bgB, bgC: bgC, ink: ink, sub: sub, grid: grid, acc: mix(acc, [255, 255, 255], 0.08), acc2: mix(acc2, [255, 255, 255], 0.08), glow: acc, glowOp: 0.22, ringOp: 0.28 };
}

/* ---------- 生成 ---------- */
function buildSvg(opts, mode) {
  const W = opts.width, H = opts.height;
  const accent = opts.accent;
  const accent2 = opts.accent2 || rgb2hex(rotateHue(hex2rgb(accent), 42));
  const P = palette(mode, accent, accent2);
  const font = opts.font || "ui-sans-serif, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif";
  const pad = 72;

  // 确保正文文字对比度达标
  let ink = P.ink;
  if (contrast(ink, mix(P.bgA, P.bgB, 0.5)) < 4.5) ink = mode === 'light' ? [0, 0, 0] : [255, 255, 255];
  let sub = P.sub;
  if (contrast(sub, mix(P.bgA, P.bgB, 0.5)) < 4.5) sub = mix(ink, mix(P.bgA, P.bgB, 0.5), 0.35);

  const id = mode === 'light' ? 'l' : 'd';

  // 文字起点（center 模式：文字居中，装饰移到右上角，忽略 monogram）
  const center = opts.align === 'center';
  let textX = center ? Math.round(W / 2) : pad;
  const monoR = 42;
  let monogram = '';
  if (opts.monogram && !center) {
    const cx = pad + monoR, cy = H / 2;
    const initial = (String(opts.name || '?').trim()[0] || '?').toUpperCase();
    monogram = [
      '  <g>',
      '    <circle cx="' + cx + '" cy="' + cy + '" r="' + monoR + '" fill="url(#acc' + id + ')" />',
      '    <text x="' + cx + '" y="' + (cy + 17) + '" text-anchor="middle" font-family="' + esc(font) + '" font-size="44" font-weight="700" fill="#ffffff">' + esc(initial) + '</text>',
      '  </g>',
    ].join('\n');
    textX = cx + monoR + 44;
  }

  const availW = center ? (W - 2 * pad - 120) : (W - textX - pad - 90);
  const hasTagline = !!(opts.tagline && String(opts.tagline).trim());
  const nameSize = fitSize(opts.name, availW, hasTagline ? 68 : 76, 34);
  const tagSize = hasTagline ? fitSize(opts.tagline, availW, 26, 16) : 0;

  const nameY = hasTagline ? Math.round(H / 2 - 12) : Math.round(H / 2 + nameSize * 0.35);
  const tagY = nameY + Math.round(nameSize * 0.62) + 26;

  const lines = [];
  lines.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-labelledby="ttl' + id + '" preserveAspectRatio="xMidYMid meet">');
  const label = esc(opts.name) + (hasTagline ? ' — ' + esc(opts.tagline) : '');
  lines.push('  <title id="ttl' + id + '">' + label + '</title>');
  lines.push('  <defs>');
  lines.push('    <linearGradient id="bg' + id + '" x1="0" y1="0" x2="1" y2="1">');
  lines.push('      <stop offset="0" stop-color="' + rgb2hex(P.bgA) + '" />');
  lines.push('      <stop offset="0.55" stop-color="' + rgb2hex(P.bgB) + '" />');
  lines.push('      <stop offset="1" stop-color="' + rgb2hex(P.bgC) + '" />');
  lines.push('    </linearGradient>');
  lines.push('    <linearGradient id="acc' + id + '" x1="0" y1="0" x2="1" y2="1">');
  lines.push('      <stop offset="0" stop-color="' + rgb2hex(P.acc) + '" />');
  lines.push('      <stop offset="1" stop-color="' + rgb2hex(P.acc2) + '" />');
  lines.push('    </linearGradient>');
  lines.push('    <radialGradient id="gl' + id + '" cx="0.5" cy="0.5" r="0.5">');
  lines.push('      <stop offset="0" stop-color="' + rgb2hex(P.glow) + '" stop-opacity="' + P.glowOp + '" />');
  lines.push('      <stop offset="1" stop-color="' + rgb2hex(P.glow) + '" stop-opacity="0" />');
  lines.push('    </radialGradient>');
  lines.push('    <pattern id="grid' + id + '" width="32" height="32" patternUnits="userSpaceOnUse">');
  lines.push('      <path d="M32 0H0V32" fill="none" stroke="' + rgb2hex(P.grid) + '" stroke-width="1" />');
  lines.push('    </pattern>');
  lines.push('  </defs>');

  // 背景层
  lines.push('  <rect width="' + W + '" height="' + H + '" fill="url(#bg' + id + ')" />');
  lines.push('  <rect width="' + W + '" height="' + H + '" fill="url(#grid' + id + ')" opacity="0.5" />');
  lines.push('  <circle cx="' + Math.round(W * 0.86) + '" cy="' + Math.round(H * 0.28) + '" r="' + Math.round(H * 0.86) + '" fill="url(#gl' + id + ')" />');
  lines.push('  <circle cx="' + Math.round(W * 0.06) + '" cy="' + Math.round(H * 1.02) + '" r="' + Math.round(H * 0.62) + '" fill="url(#gl' + id + ')" />');

  // 右下角同心环装饰
  const rcx = center ? W - Math.round(H * 0.24) : W - Math.round(H * 0.36);
  const rcy = center ? Math.round(H * 0.26) : Math.round(H * 0.62);
  lines.push('  <g fill="none" stroke="' + rgb2hex(P.acc) + '" stroke-width="1.5">');
  lines.push('    <circle cx="' + rcx + '" cy="' + rcy + '" r="' + Math.round(H * 0.20) + '" opacity="' + P.ringOp + '" />');
  lines.push('    <circle cx="' + rcx + '" cy="' + rcy + '" r="' + Math.round(H * 0.31) + '" opacity="' + (P.ringOp * 0.6).toFixed(2) + '" />');
  lines.push('    <circle cx="' + rcx + '" cy="' + rcy + '" r="' + Math.round(H * 0.42) + '" opacity="' + (P.ringOp * 0.35).toFixed(2) + '" />');
  lines.push('  </g>');

  // 品牌色条
  lines.push('  <rect x="0" y="' + (H - 6) + '" width="' + W + '" height="6" fill="url(#acc' + id + ')" />');

  if (monogram) lines.push(monogram);

  // 文字
  const anchor = center ? ' text-anchor="middle"' : '';
  lines.push('  <text x="' + textX + '" y="' + nameY + '"' + anchor + ' font-family="' + esc(font) + '" font-size="' + nameSize + '" font-weight="650" fill="' + rgb2hex(ink) + '" letter-spacing="-0.5">' + esc(opts.name) + '</text>');
  if (hasTagline) {
    lines.push('  <text x="' + textX + '" y="' + tagY + '"' + anchor + ' font-family="' + esc(font) + '" font-size="' + tagSize + '" font-weight="400" fill="' + rgb2hex(sub) + '">' + esc(opts.tagline) + '</text>');
  }
  lines.push('</svg>');
  return lines.join('\n') + '\n';
}

/* ---------- 主流程 ---------- */
const opts = parseArgs(process.argv.slice(2));
if (opts.help) {
  console.log('gen_banner.mjs — 生成 README 表头横幅 SVG');
  console.log('用法: node scripts/gen_banner.mjs --name "项目名" [--tagline "..."] [--accent "#6d5efc"] [--out banner.svg] [--theme both] [--width 1280] [--height 320] [--monogram] [--align left|center]');
  process.exit(0);
}
if (!opts.name) { console.error('错误: 必须提供 --name'); process.exit(2); }
opts.accent2 = opts.accent2 || rgb2hex(rotateHue(hex2rgb(opts.accent), 42));

const outPath = resolve(opts.out || 'banner.svg');
const modes = opts.theme === 'both' ? ['light', 'dark'] : [opts.theme];
if (opts.theme !== 'both' && opts.theme !== 'light' && opts.theme !== 'dark') {
  console.error('错误: --theme 只能是 light | dark | both'); process.exit(2);
}
const written = [];
for (const mode of modes) {
  const target = modes.length === 1
    ? outPath
    : outPath.replace(/\.svg$/, '') + '-' + mode + '.svg';
  mkdirSync(dirname(target), { recursive: true });
  const svg = buildSvg(opts, mode);
  writeFileSync(target, svg, 'utf8');
  written.push([target, Buffer.byteLength(svg)]);
}
for (const w of written) console.log('生成 ' + w[0] + '  (' + w[1] + ' bytes)');
console.log('提示: 用 PNG 目视确认后再提交 — npx --yes sharp-cli -i ' + written[0][0] + ' -o /tmp/banner.png');
