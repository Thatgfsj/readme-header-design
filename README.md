<a name="readme-top"></a>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Thatgfsj/readme-header-design/main/.github/assets/banner-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Thatgfsj/readme-header-design/main/.github/assets/banner-light.svg">
    <img alt="readme-header-design — 为项目设计、生成并校验一个优秀的 README 表头" src="https://raw.githubusercontent.com/Thatgfsj/readme-header-design/main/.github/assets/banner-light.svg" width="100%">
  </picture>
</p>

<h1 align="center">readme-header-design</h1>

<p align="center">
  把"让 README 的表头好看"从审美问题，变成一条可验证的流水线。
</p>

<p align="center">
  <a href="https://github.com/Thatgfsj/readme-header-design/blob/main/LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square"></a>
  <a href="https://github.com/Thatgfsj/readme-header-design"><img alt="GitHub stars" src="https://img.shields.io/github/stars/Thatgfsj/readme-header-design?style=flat-square"></a>
  <img alt="零运行时依赖" src="https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square">
  <img alt="适用于 DeepSeek Harness" src="https://img.shields.io/badge/agent%20skill-DeepSeek%20Harness-6d5efc?style=flat-square">
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> ·
  <a href="#它检查什么">检查项</a> ·
  <a href="#设计依据">设计依据</a> ·
  <a href="#三条铁律">三条铁律</a> ·
  <a href="#目录结构">目录结构</a>
</p>

---

## 这是什么

一个 DeepSeek Harness 技能：给你的 AI 装上"README 表头设计师"的能力，外加两个零依赖脚本——一个**生成**横幅，一个**校验**表头。

**表头 = README 里第一个 `##` 之前的一切**，是项目封面。读者只看这里 3 秒，然后决定继续读还是关掉页面。

这个技能把这件事拆成五步：**收集事实 → 选型 → 造素材 → 落地 → 校验**，每一步都有明确判据，最后能跑脚本验证。

### 它解决三个具体问题

| 问题 | 一般做法 | 这个技能的做法 |
|---|---|---|
| 不知道选哪种表头 | 抄一个看着顺眼的模板 | 按"项目类型 × 受众 × 分发渠道"查决策表，八种场景各有对应范式 |
| 写完不知道行不行 | 凭感觉 | `lint_header.mjs` 用 20 条规则检查，区分 error / warn / info，可进 CI |
| 想做视觉设计却没有素材 | 挂第三方装饰服务 | `gen_banner.mjs` 生成自己的 SVG 横幅（含暗色变体），零外部依赖 |

## 快速开始

### 1. 安装技能

```bash
git clone https://github.com/Thatgfsj/readme-header-design.git
cp -r readme-header-design ~/.dsh/skills/readme-header-design
```

安装后重启会话，技能出现在可用列表里，之后说"帮我设计这个项目的 README 表头"就会自动加载。

### 2. 校验已有的 README 表头

```bash
node scripts/lint_header.mjs README.md
```

```text
检查文件: README.md
表头区: 第 1..38 行（第一个二级标题在第 39 行）
统计: 6 张图片，其中徽章 4 枚

WARN  [W03] 表头有 6 枚徽章（建议 <= 5）
        建议: 砍到一行放得下；次要信号移到 README 中部
INFO  [I01] 第 1 行 没有 <a name="readme-top"></a> 锚点
        建议: 长 README 建议加，方便"回到顶部"

结果: 0 个 error, 1 个 warn, 1 个 info
```

加 `--json` 输出机器可读结果，加 `--check-links` 逐个请求图片地址，把失效徽章也揪出来。

### 3. 生成横幅

```bash
node scripts/gen_banner.mjs \
  --name "你的项目名" \
  --tagline "一句话说清给谁、解决什么" \
  --accent "#6d5efc" \
  --out .github/assets/banner.svg \
  --monogram
```

```text
生成 .github/assets/banner-light.svg  (2468 bytes)
生成 .github/assets/banner-dark.svg   (2469 bytes)
```

两个文件配合 `<picture>` 使用，GitHub 会按访客的明暗主题自动切换：

```html
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".../banner-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset=".../banner-light.svg">
    <img alt="项目名 — 一句话定位" src=".../banner-light.svg" width="100%">
  </picture>
</p>
```

生成器会按项目名长度自动缩字号、按主色自动派生副色、按背景自动选文字色并保证对比度 ≥ 4.5:1。

## 它检查什么

`lint_header.mjs` 的规则分三级：**error** = 在 GitHub 上一定出问题；**warn** = 取决于场景；**info** = 建议。

| 级别 | 规则 | 说明 |
|---|---|---|
| error | E01 / E02 | 表头没有 H1；全文出现多个 H1 |
| error | E03 / E04 | 使用了会被 GitHub 剥离的标签或属性（`<style>`、`class`、`id`、内联 `<svg>`、行内 `style`） |
| error | E05 | 使用未文档化的 `#gh-dark-mode-only` 旧写法 |
| error | E06 | 图片缺少 `alt` |
| error | E08 / E09 | HTML 标签多余闭合；图片地址不可访问（`--check-links`） |
| warn | W02 / W03 / W04 / W05 / W06 / W10 | 相对路径图片、徽章超标、徽章风格混用、缺一句话定位、表头过长、HTML 与 Markdown 之间缺空行 |
| info | I01 / I02 / I03 / I04 | 缺"回到顶部"锚点、缺站内导航、有图片但没做暗色适配、HTML 标签未闭合 |

## 设计依据

这不是把网上的"README 最佳实践"换个说法。每条结论都有出处：

**1. 45 个高星仓库的表头实测**（2026-10-16 抓取，覆盖库 / CLI / 全栈应用 / 基础设施 / Profile / 数据集）

| 指标 | 实测比例 | 结论 |
|---|---|---|
| 表头使用居中容器 | 53% | 居中已是主流，但不是唯一答案 |
| 表头含 shields.io 徽章 | 58% | 徽章接近标配 |
| 表头含一句话定位 | **36%** | 最常被漏掉、也最影响 3 秒测试 |
| 用 `<picture>` 做暗色适配 | 20% | 先进但未普及 |
| 严肃项目使用第三方装饰组件（capsule-render 等） | **0 个** | 装饰组件只出现在 Profile 和小工具仓库 |

**2. GitHub 官方渲染约束**

- HTML 白名单、属性白名单、图片自动行为：来自 GitHub 渲染管线开源库 [`github/html-pipeline`](https://github.com/github/html-pipeline) 的 `SanitizationFilter` 与 `ImageMaxWidthFilter` 源码
- 暗色模式横幅：来自官方文档 [`github/docs`](https://github.com/github/docs) 的 `quickstart-for-writing-on-github.md`，官方指定用 `<picture>` + `prefers-color-scheme`
- `#gh-dark-mode-only` 在 `github/docs` 全库搜索结果为零，属未文档化旧写法
- 线上实测：抓取 vite / tailwindcss / rust / supabase 仓库页面 HTML，确认 `<picture>` 保留、fragment hack 仍存在但无官方支持

**3. 真实坏例子**：45 份真实 README 跑校验器，命中 76 个 error、59 个 warn；`facebook/react`、`cli/cli` 这类项目零 error，`element-plus` 缺 H1、`axios` 有跨行标签问题——规则是拿真实语料调出来的，不是拍脑袋。

## 三条铁律

1. **不编造事实。** 项目名、定位、命令、版本、许可全部从仓库里读出来。拿不到就留占位符，不写看起来像真的假徽章。
2. **3 秒测试。** 读者只看表头，能否答出：这是什么？给谁用？现在能用吗？从哪开始？四问缺一，补内容而不是补装饰。
3. **GitHub 是画布，不是浏览器。** 没有 CSS、没有 class、没有响应式微调。要么用白名单内的属性，要么把设计画进图片里。

## 目录结构

```text
readme-header-design/
├── SKILL.md                          技能主体：五步工作流 + 选型决策表 + 失败排查
├── references/
│   ├── github-constraints.md         GitHub 渲染硬约束（白名单、暗色模式、图片代理）
│   ├── patterns.md                   六种表头范式 + 真实案例 + 45 仓库实测统计
│   ├── badges.md                     shields.io 语法、徽章选型、缓存与时效
│   ├── svg-banner.md                 自绘 SVG 的技术细节（字体、配色、暗色变体）
│   └── anti-patterns.md              15 条反模式：症状 → 为什么错 → 怎么改
├── scripts/
│   ├── gen_banner.mjs                生成横幅 SVG（零依赖）
│   └── lint_header.mjs               校验表头（零依赖，可进 CI）
└── .github/assets/                   本仓库自己的横幅，由 gen_banner.mjs 生成
```

## 用在 CI 里

```yaml
- name: Lint README header
  run: node scripts/lint_header.mjs README.md --check-links
```

存在 error 时退出码为 1，可以直接卡住 PR。

## 许可

[MIT](https://github.com/Thatgfsj/readme-header-design/blob/main/LICENSE)。

<br />

<p align="center">
  <sub>本仓库自己的表头就是用这套方法做的——banner 由 <code>gen_banner.mjs</code> 生成，README 通过 <code>lint_header.mjs</code> 零 error。</sub>
</p>

<p align="center"><a href="#readme-top">↑ 回到顶部</a></p>
