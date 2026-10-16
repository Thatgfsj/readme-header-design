# 六种表头范式

> 下面的统计来自 2026-10-16 对 45 个高星仓库 README 的抓取分析（脚本按"第一个以 `##` 开头的行之前"切出表头区）。原始样本分析口径：表头区 = 首个 H2 之前的全部内容。

## 表头的六个槽位

```text
槽 1  锚点     <a name="readme-top"></a>                       固定在文档最前面
槽 2  视觉     logo / 图形横幅（含 <picture> 暗色变体）        可选，但展示型项目必需
槽 3  身份     H1 项目名 + 一句话定位                          唯一必需项
槽 4  信号     徽章行（CI / 版本 / 下载 / 许可 / 覆盖率）      ≤5 个，一行
槽 5  导航     Docs · Quick Start · Examples · 语言切换        读者"下一步去哪"
槽 6  证据     截图 / GIF / 终端录屏 / 在线 Demo               GUI 与 CLI 项目必需
```

任何表头都是这六个槽位的取舍组合。缺槽 3 一定失败；槽 4/5/6 按项目类型决定。

## 实测分布（45 个仓库）

| 指标 | 比例 | 解读 |
|---|---|---|
| 表头使用居中容器（`<div align="center">` 等） | 53% | 居中已是主流，但不是唯一正确答案 |
| 表头区含 H1 | 44% | 很多项目把 H1 放在徽章之后，或用 `<h1>` 手写 |
| 表头区含 shields.io 徽章 | 58% | 徽章几乎成了标配 |
| 表头区含一句话定位（粗体/斜体/引用） | 36% | **最容易被漏掉、也最影响 3 秒测试的槽位** |
| 表头区含 `<picture>` 暗色适配 | 20% | 先进做法，但尚未普及 |
| 表头区含站内导航锚点 | 18% | 长 README 才需要 |
| 表头区出现第三方装饰组件 | 3 个仓库 | 全是 Profile / 工具类项目，**没有一个严肃项目用** |

**最有价值的一条结论**：第三方装饰组件（capsule-render、typing-svg、统计卡）只出现在个人 Profile 和"给 profile 用的工具"仓库里；facebook/react、denoland/deno、cli/cli、nodejs/node、rust-lang/rust 这类项目一律走极简路线。

## P1 · 徽章居中标准版（最通用）

**适用**：npm / PyPI / crates 库、SDK、有包管理分发的工具。
**结构**：居中容器 + logo + H1 + 定位句 + 3–5 徽章 + 一行导航。

```html
<a name="readme-top"></a>

<div align="center">

<img src="https://raw.githubusercontent.com/OWNER/REPO/main/.github/assets/logo.svg" alt="项目名 logo" width="120" />

# 项目名

一句话说清"给谁、解决什么问题"，不超过 120 字符。

[![CI][ci-shield]][ci-url]
[![npm version][ver-shield]][ver-url]
[![Downloads][dl-shield]][dl-url]
[![License][lic-shield]][lic-url]

[文档][docs-url] · [快速开始](#quick-start) · [示例](#examples) · [English](./README.md) · [中文](./README.zh-CN.md)

</div>

---

[ci-shield]: https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg?branch=main
[ci-url]: https://github.com/OWNER/REPO/actions/workflows/ci.yml
```

**真实案例**：`sharkdp/bat`（`<p align="center">` + logo SVG + 徽章 + 斜体定位句 + 语言切换行）、`ant-design/ant-design`（`<div align="center">` + 180px logo + H1 + 定位句 + 两行徽章 + `·` 分隔导航）。
**注意**：居中容器内的 Markdown 与 HTML 标签之间**必须留空行**，否则 Markdown 不会被解析。

## P2 · 极简文本版（大项目与严肃项目的默认答案）

**适用**：基础设施、语言运行时、大型开源项目、早期实验。
**结构**：`# 项目名` + 一段定位 + 0–3 徽章。

```markdown
# Deno

一句话定位。

[![版本][ver-shield]][ver-url] [![Discord][dc-shield]][dc-url]

<img align="right" src="logo.svg" height="150" alt="项目名">

正文从这里开始……
```

**真实案例**：`cli/cli`（H1 + 一段话 + 一张终端截图，零装饰）、`nodejs/node`、`golang/go`、`denoland/deno`（唯一花活是 `align="right"` 的侧栏 logo）。
**注意**：极简不等于信息少——它省掉的是装饰，不是定位句。
**变体 P4 侧栏版**：把 logo 用 `<img align="right" height="150">` 放在标题右侧，窄屏下 GitHub 会自动换行（deno 的做法）。

## P3 · 图形横幅版（全栈应用、产品、SaaS）

**适用**：有品牌形象的 Web/桌面应用、模板项目、展示型仓库。
**结构**：全宽 SVG 横幅（含暗色变体）+ H1 + 定位 + 徽章 + 截图 + Demo 链接。

```html
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/OWNER/REPO/main/.github/assets/banner-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/OWNER/REPO/main/.github/assets/banner-light.svg">
    <img alt="项目名 — 一句话定位" src="https://raw.githubusercontent.com/OWNER/REPO/main/.github/assets/banner-light.svg" width="100%">
  </picture>
</p>

# 项目名

一句话定位。

[![CI][ci-shield]][ci-url]
[![License][lic-shield]][lic-url]
[![Demo][demo-shield]][demo-url]

[在线 Demo][demo-url] · [文档][docs-url] · [快速开始](#quick-start)

![产品截图](https://raw.githubusercontent.com/OWNER/REPO/main/.github/assets/screenshot.png)
```

**素材从哪来**：优先用 `scripts/gen_banner.mjs` 自绘（见 `svg-banner.md`），品牌化程度最高、零外部依赖。
**注意**：横幅宽度写 `width="100%"`，让 GitHub 的 `max-width:100%` 接管；横幅内文字要小到在 880px 宽度下依然清晰（详情见 svg-banner）。

## P5 · 装饰版（只给个人 Profile 和小玩具用）

**适用**：GitHub Profile README（`<username>/<username>`）、个人项目、学习仓库。
**结构**：capsule-render 波浪横幅 + typing SVG + 统计卡 + 技术栈图标。

```html
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=auto&height=200&section=header&text=Hi%20there&fontSize=60" alt="横幅" />
</p>
```

**真实案例**：`abhisheknaiidu/awesome-github-profile-readme`、`rzashakeri/beautify-github-profile`、`kyechan99/capsule-render` 自身。
**什么时候不要用**：任何会被别人依赖的项目。capsule-render 官方 README 自己写着 "provided on a best-effort basis and may be unstable"，生产项目把门面挂在别人的免费服务上不划算。
**替代**：把装饰效果用 `gen_banner.mjs` 画成自己的 SVG，提交进仓库。

## P6 · 截图为王版（有界面的东西一律适用）

**适用**：GUI 应用、TUI 工具、浏览器扩展、编辑器插件。
**结构**：在 P1/P2/P3 之上，**把截图提到 H1 之后、徽章之前**。

```markdown
# 项目名

![终端里的效果](https://raw.githubusercontent.com/OWNER/REPO/main/.github/assets/demo.gif)

一句话定位 + 一条最小可运行命令。
```

**真实案例**：`cli/cli`（`gh pr status` 截图紧跟标题）、`sharkdp/bat`（语法高亮截图）、`supabase/supabase`（`<kbd>` 包住 GIF）、`AUTOMATIC1111/stable-diffusion-webui`。
**为什么有效**：界面的说服力远大于形容词。一张 800px 宽的截图胜过三行 tagline。
**注意**：GIF 压到 1MB 以内；优先用 800–1200px 宽的静态截图 + 一个短 GIF。

## 选型决策树

```text
这个表头是给谁看的？
├─ 个人 Profile ─────────────────────────────► P5（可装饰），必须有一行导航
└─ 项目
   ├─ 有图形界面 / 终端 UI？ ────── 是 ─────► P6，截图是表头的主体
   └─ 否
      ├─ 读者主要是"用 API / 装包"的开发者？
      │  ├─ 有包管理分发（npm/PyPI/crates）──► P1（3–5 徽章）
      │  └─ 无分发 / 基础设施 / 语言运行时 ──► P2（0–3 徽章），logos 侧栏（P4）
      └─ 读者主要是"用产品"的用户？
         ├─ 有品牌视觉 / 是产品/SaaS ────────► P3（自绘横幅 + 截图）
         └─ 早期实验 / 脚本 ────────────────► P2（一句话 + 一条命令）
```

## 组合规则

- P3 与 P6 可以叠加：横幅（视觉）+ 截图（证据）= 展示型项目的完整表头
- P1 的居中容器里不要塞表格和长列表，会破坏居中和混排
- P2 永远是最安全的选择：**不确定的时候选 P2**，等有素材了再升级到 P1/P3
