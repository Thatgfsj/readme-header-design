#!/usr/bin/env node
/**
 * lint_header.mjs — 校验 README 表头是否符合 GitHub 渲染约束与信息要求。
 *
 * 用法:
 *   node scripts/lint_header.mjs README.md
 *   node scripts/lint_header.mjs README.md --json
 *   node scripts/lint_header.mjs README.md --check-links
 *   node scripts/lint_header.mjs README.md --max-badges 5 --max-header-lines 40
 *
 * 退出码: 0 = 无 error；1 = 存在 error；2 = 用法/读取错误。
 */
import { readFileSync } from 'node:fs';

/* ---------- 参数 ---------- */
const argv = process.argv.slice(2);
const opts = { json: false, checkLinks: false, maxBadges: 5, maxHeaderLines: 40, file: '' };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--json') opts.json = true;
  else if (a === '--check-links') opts.checkLinks = true;
  else if (a === '--max-badges') opts.maxBadges = parseInt(argv[++i], 10);
  else if (a === '--max-header-lines') opts.maxHeaderLines = parseInt(argv[++i], 10);
  else if (a === '--help' || a === '-h') { console.log('见脚本头部注释'); process.exit(0); }
  else if (a.startsWith('--')) { console.error('未知参数: ' + a); process.exit(2); }
  else opts.file = a;
}
if (!opts.file) { console.error('用法: node scripts/lint_header.mjs <README 路径> [--json] [--check-links]'); process.exit(2); }

let raw;
try { raw = readFileSync(opts.file, 'utf8'); }
catch (e) { console.error('无法读取 ' + opts.file + ': ' + e.message); process.exit(2); }

const lines = raw.split(/\r?\n/);

/* ---------- 标记代码块，避免把示例当正文 ---------- */
const inFence = new Array(lines.length).fill(false);
let fence = null;
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^\s*(\x60{3,}|~{3,})/);
  if (m) {
    if (!fence) { fence = m[1][0]; inFence[i] = true; continue; }
    if (m[1][0] === fence) { inFence[i] = true; fence = null; continue; }
  }
  inFence[i] = !!fence;
}

/* ---------- 剥离行内代码：反引号里的内容是在举例，不是真实标签/图片 ---------- */
const scanLines = lines.map(function (line, i) {
  if (inFence[i]) return '';
  return line.replace(/\x60[^\x60]*\x60/g, function (m) { return m.replace(/[^\n]/g, ' '); });
});

/* ---------- 切表头区：第一个 H2 之前 ---------- */
let h2Index = -1;
for (let i = 0; i < scanLines.length; i++) {
  if (/^##\s+\S/.test(scanLines[i])) { h2Index = i; break; }
}
const headerEnd = h2Index === -1 ? Math.min(lines.length, opts.maxHeaderLines * 2) : h2Index;
const headerLines = scanLines.slice(0, headerEnd);
const headerText = headerLines.join('\n');

const issues = [];
const add = (level, code, line, message, hint) => issues.push({ level, code, line, message, hint });

/* ---------- 收集事实 ---------- */
const h1Markdown = [];
const h1Html = [];
for (let i = 0; i < scanLines.length; i++) {
  if (/^#\s+\S/.test(scanLines[i])) h1Markdown.push(i + 1);
  if (/<h1[\s>]/i.test(scanLines[i])) h1Html.push(i + 1);
}
const headerH1 = h1Markdown.filter(n => n <= headerEnd).concat(h1Html.filter(n => n <= headerEnd));

const mdImages = [];
const htmlImages = [];
{ let offset = 0;
  for (let i = 0; i < headerLines.length; i++) { offset += headerLines[i].length + 1; }
  const mdRe = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m; while ((m = mdRe.exec(headerText))) mdImages.push({ alt: m[1], src: m[2] });
  const imgRe = /<img\b[^>]*>/gi; let g;
  while ((g = imgRe.exec(headerText))) {
    const tag = g[0];
    const src = (tag.match(/src\s*=\s*["']([^"']+)["']/i) || [])[1] || '';
    const alt = (tag.match(/alt\s*=\s*["']([^"']*)["']/i) || [])[1];
    htmlImages.push({ alt: alt === undefined ? null : alt, src });
  }
}
const allImages = mdImages.concat(htmlImages);
const badgeRe = /(img\.shields\.io|badge\.svg|\/badge\b|badgen\.net|badge\.fury)/i;
const badges = allImages.filter(function (im) { return badgeRe.test(im.src); });

/* ---------- 规则 ---------- */
// E01 表头必须有 H1
if (headerH1.length === 0) add('error', 'E01', 1, '表头区没有 H1 项目名', '首个标题应为 # 项目名');
// E02 全文 H1 唯一
if (h1Markdown.length + h1Html.length > 1) add('error', 'E02', headerH1[1] || 1, '全文出现多个 H1（' + (h1Markdown.length + h1Html.length) + ' 个）', 'README 只应有一个 H1');
// E03 被剥离的 HTML
const forbidden = [
  [/<style[\s>]/i, '<style> 会被 GitHub 剥离'],
  [/<script[\s>]/i, '<script> 会被 GitHub 剥离且内容被删除'],
  [/<iframe[\s>]/i, '<iframe> 不在白名单'],
  [/<video[\s>]/i, '<video> 不在白名单（视频不能内嵌）'],
  [/<canvas[\s>]/i, '<canvas> 不在白名单'],
  [/<center[\s>]/i, '<center> 不在白名单，用 <p align="center">'],
  [/<marquee[\s>]/i, '<marquee> 不在白名单'],
  [/<svg[\s>]/i, '内联 <svg> 不在白名单，请存成文件用 <img> 引用'],
];
for (let i = 0; i < headerLines.length; i++) {
  if (inFence[i]) continue;
  for (const f of forbidden) {
    if (f[0].test(headerLines[i])) add('error', 'E03', i + 1, f[1], '见 references/github-constraints.md');
  }
}
// E04 行内 style/class/id 属性
for (let i = 0; i < headerLines.length; i++) {
  if (inFence[i]) continue;
  const line = headerLines[i];
  if (/<[a-z][^>]*\sstyle\s*=/i.test(line)) add('error', 'E04', i + 1, 'HTML 行内 style 属性会被剥离', '改用 align/width/height 属性，或把设计做进图片');
  if (/<[a-z][^>]*\sclass\s*=/i.test(line)) add('error', 'E04', i + 1, 'HTML class 属性会被剥离', 'GitHub 不支持自定义 class');
  if (/<[a-z][^>]*\sid\s*=\s*["'][^"']+["']/i.test(line) && !/<a\s+name=/i.test(line)) add('warn', 'W01', i + 1, 'id 属性通常会被剥离（锚点请用 <a name="...">）', '<a name="readme-top"></a>');
}
// E05 已弃用的暗色 hack
for (let i = 0; i < headerLines.length; i++) {
  if (/gh-(dark|light)-mode-only/.test(headerLines[i])) add('error', 'E05', i + 1, '使用未文档化的 #gh-dark-mode-only hack', '改用 <picture> + prefers-color-scheme');
}
// E06 图片缺少 alt
for (const im of allImages) {
  if (im.alt === null || im.alt === undefined || im.alt.trim() === '') add('error', 'E06', 0, '图片缺少 alt：' + (im.src || '(无 src)').slice(0, 60), 'alt 描述图片内容或信号名');
}
// E07 图片相对路径
for (const im of allImages) {
  if (im.src && !/^(https?:|data:)/i.test(im.src)) add('warn', 'W02', 0, '图片使用相对路径：' + im.src.slice(0, 60), '要发布到 npm/PyPI 请改用 raw.githubusercontent.com 绝对地址');
}
// E08/I04 标签平衡（全文、跨行、忽略 HTML 注释与代码块；可隐式闭合的标签不参与）
{
  const VOID = ['img', 'br', 'hr', 'source', 'input', 'meta', 'link', 'area', 'base', 'col',
    'embed', 'param', 'track', 'wbr', 'p', 'li', 'td', 'th', 'tr', 'option', 'dt', 'dd'];
  const stripped = scanLines.join('\n').replace(/<!--[\s\S]*?-->/g, function (m) { return m.replace(/[^\n]/g, ' '); });
  const sLines = stripped.split(/\r?\n/);
  let joined = '';
  const offsets = [];
  for (let i = 0; i < sLines.length; i++) {
    offsets.push(joined.length);
    joined += sLines[i] + '\n';
  }
  const lineOf = function (pos) {
    let lo = 0, hi = offsets.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (offsets[mid] <= pos) lo = mid; else hi = mid - 1; }
    return lo + 1;
  };
  const stack = [];
  const tagRe = /<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi; let t;
  while ((t = tagRe.exec(joined))) {
    const closing = t[1] === '/';
    const name = t[2].toLowerCase();
    if (VOID.indexOf(name) >= 0) continue;
    if (/\/\s*>$/.test(t[0])) continue;
    if (!closing) stack.push({ name: name, line: lineOf(t.index) });
    else {
      const names = stack.map(function (s) { return s.name; });
      const idx = names.lastIndexOf(name);
      if (idx === -1) add('error', 'E08', lineOf(t.index), '多余的闭合标签 </' + name + '>', '检查 HTML 结构');
      else stack.length = idx;
    }
  }
  for (const s of stack) add('info', 'I04', s.line, '<' + s.name + '> 在全文里没有闭合', 'GitHub 会自动闭合，但显式闭合更安全');
}
// W03 徽章数量
if (badges.length > opts.maxBadges) add('warn', 'W03', 0, '表头有 ' + badges.length + ' 枚徽章（建议 <= ' + opts.maxBadges + '）', '砍到一行放得下；次要信号移到 README 中部');
// W04 徽章风格混用
{
  const styles = new Set();
  for (const b of badges) {
    const m = b.src.match(/[?&]style=([a-z-]+)/i);
    styles.add(m ? m[1].toLowerCase() : 'flat');
  }
  if (styles.size > 1) add('warn', 'W04', 0, '徽章样式混用: ' + Array.from(styles).join(', '), '统一 style，默认 flat-square');
}
// W05 缺少定位句
{
  let found = false;
  for (let i = 0; i < headerLines.length; i++) {
    if (inFence[i]) continue;
    const line = headerLines[i];
    if (!line.trim() || line.trim().startsWith('<!--')) continue;
    if (/^#{1,6}\s/.test(line) || /<h[1-6][\s>]/i.test(line)) continue;
    if (/<img/i.test(line) || !line.replace(/<[^>]+>/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').trim()) continue;
    const plain = line
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[#*_>\-\s|]/g, '');
    if (plain.length >= 20) { found = true; break; }
  }
  if (!found) add('warn', 'W05', 1, '表头区没有一句话定位（>=20 字的说明文字）', 'H1 后补一句"给谁 + 解决什么"，这是 3 秒测试的核心');
}
// W06 表头过长
if (h2Index === -1) add('warn', 'W06', 0, '前 ' + headerEnd + ' 行内没有二级标题', '表头过长会挤掉正文首屏');
else if (h2Index > opts.maxHeaderLines) add('warn', 'W06', h2Index + 1, '表头区有 ' + h2Index + ' 行（建议 <= ' + opts.maxHeaderLines + '）', '把细节下移');
// W07 缺 readme-top 锚点
if (!/<a\s+name=["']readme-top["']/i.test(headerText)) add('info', 'I01', 1, '没有 <a name="readme-top"></a> 锚点', '长 README 建议加，方便"回到顶部"');
// W08 缺导航
if (!/\[[^\]]+\]\(#[^)]+\)/.test(headerText) && !/<a\s+[^>]*href\s*=\s*["']#[^"']+["']/i.test(headerText)) add('info', 'I02', 0, '表头没有站内导航链接', '长 README 建议加 [文档] · [快速开始] 一行（HTML 锚点也算）');
// I03 暗色模式
{
  const hasPicture = /<picture[\s>]/i.test(headerText);
  const hasBannerish = allImages.some(function (im) { return /\.(svg|png)(\?|$)/i.test(im.src) && !badgeRe.test(im.src); });
  if (hasBannerish && !hasPicture) add('info', 'I03', 0, '表头有图片但没有 <picture> 暗色适配', '跨明暗主题的项目建议用 <picture> + prefers-color-scheme');
}
// I04 picture 内缺少 source
if (/<picture[\s>]/i.test(headerText) && !/<source\b[^>]*prefers-color-scheme/i.test(headerText)) add('warn', 'W09', 0, '<picture> 里没有 prefers-color-scheme 的 <source>', '暗色适配需要两条 source');
// I05 markdown 与 HTML 混排没有空行
for (let i = 0; i < headerLines.length - 1; i++) {
  if (inFence[i]) continue;
  const next = headerLines[i + 1].trim();
  if (/^<(div|p|h1|h2|h3)\b[^>]*>\s*$/i.test(headerLines[i]) && next !== '' && !/^</.test(next) && /[*_\[\]#]/.test(next)) {
    add('warn', 'W10', i + 2, 'HTML 块后紧跟 Markdown 语法且没有空行，Markdown 可能不被解析', '在 HTML 标签与 Markdown 之间留一个空行');
  }
}

/* ---------- 可选：检查图片链接可达性 ---------- */
async function checkLinks() {
  const urls = Array.from(new Set(allImages.map(function (im) { return im.src; }).filter(function (s) { return /^https?:/i.test(s); })));
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < urls.length) {
      const u = urls[idx++];
      try {
        const ctl = new AbortController();
        const timer = setTimeout(function () { ctl.abort(); }, 12000);
        let res = await fetch(u, { method: 'HEAD', redirect: 'follow', signal: ctl.signal, headers: { 'user-agent': 'readme-header-lint' } });
        if (res.status === 405 || res.status === 501) res = await fetch(u, { method: 'GET', redirect: 'follow', signal: ctl.signal, headers: { 'user-agent': 'readme-header-lint' } });
        clearTimeout(timer);
        results.push([u, res.status]);
      } catch (e) { results.push([u, 0]); }
    }
  }
  await Promise.all([worker(), worker(), worker(), worker(), worker()]);
  for (const r of results) {
    if (r[1] === 0) add('error', 'E09', 0, '图片无法访问: ' + r[0].slice(0, 80), '检查 URL 或服务是否可用');
    else if (r[1] >= 400) add('error', 'E09', 0, '图片返回 HTTP ' + r[1] + ': ' + r[0].slice(0, 80), '删掉失效徽章或修正 URL');
  }
}

await (opts.checkLinks ? checkLinks() : Promise.resolve());

/* ---------- 输出 ---------- */
issues.sort(function (a, b) {
  const rank = { error: 0, warn: 1, info: 2 };
  if (rank[a.level] !== rank[b.level]) return rank[a.level] - rank[b.level];
  return a.line - b.line;
});
const counts = { error: 0, warn: 0, info: 0 };
for (const it of issues) counts[it.level]++;

if (opts.json) {
  console.log(JSON.stringify({ file: opts.file, headerLines: headerEnd, h2Index: h2Index + 1, badges: badges.length, images: allImages.length, counts: counts, issues: issues }, null, 2));
} else {
  const label = { error: 'ERROR', warn: 'WARN ', info: 'INFO ' };
  console.log('检查文件: ' + opts.file);
  console.log('表头区: 第 1..' + headerEnd + ' 行（第一个二级标题在' + (h2Index === -1 ? '未找到' : '第 ' + (h2Index + 1) + ' 行') + '）');
  console.log('统计: ' + allImages.length + ' 张图片，其中徽章 ' + badges.length + ' 枚');
  console.log('');
  if (!issues.length) console.log('没有发现问题。');
  for (const it of issues) {
    console.log(label[it.level] + ' [' + it.code + ']' + (it.line ? ' 第 ' + it.line + ' 行' : '') + ' ' + it.message);
    if (it.hint) console.log('        建议: ' + it.hint);
  }
  console.log('');
  console.log('结果: ' + counts.error + ' 个 error, ' + counts.warn + ' 个 warn, ' + counts.info + ' 个 info');
}
process.exit(counts.error > 0 ? 1 : 0);
