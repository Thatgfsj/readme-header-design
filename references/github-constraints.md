# GitHub README 渲染硬约束

> 核实日期 2026-10-16。来源：GitHub 官方文档仓库 `github/docs`、GitHub 渲染管线开源库 `github/html-pipeline` 源码、以及直接抓取线上仓库页面 HTML 实测。

## 一句话

GitHub 把 README.md 当**受限富文本**渲染：先按白名单过滤 HTML，再套上自己的 CSS。设计表头前必须知道哪些标签和属性能活下来。

## 元素白名单

来自 `github/html-pipeline` 的 `SanitizationFilter::WHITELIST`（`lib/html/pipeline/sanitization_filter.rb`），这是渲染管线的默认白名单：

```text
h1 h2 h3 h4 h5 h6 h7 h8 br b i strong em a pre code img tt
div ins del sup sub p ol ul table thead tbody tfoot blockquote
dl dt dd kbd q samp var hr ruby rt rp li tr td th s strike summary details
```

会被剥掉（多数只留文本内容，`script` 连内容一起删）：`style`、`class`、`id`、`script`、`iframe`、`video`、`audio`、`canvas`、`form`、`input`、`button`、`marquee`、`center`、**内联 `<svg>`**。

可直接用的结论：

- **内联 SVG 不能用。** 要画图就把 SVG 存成文件，用 `<img src="...">` 引用。
- **`<center>` 不能用**，居中一律用 `<p align="center">` / `<div align="center">`。
- **`<details>` / `<summary>` 可用** → 把长内容折叠起来，保持表头短。
- **`<kbd>` 可用** → 包快捷键、命令行提示。
- **`<table>` 可用** → 但它不能带 `class`，所以做不了花哨样式。
- `h7`/`h8` 意外在白名单里，非标准，不要使用。

## 属性白名单

所有允许元素通用的属性：

```text
abbr accept accept-charset accesskey action align alt axis border cellpadding
cellspacing char charoff charset checked clear cols colspan color compact coords
datetime dir disabled enctype for frame headers height hreflang hspace ismap label
lang maxlength media method multiple name nohref noshade nowrap open prompt readonly
rel rev rows rowspan rules scope selected shape size span start summary tabindex
target title type usemap valign value vspace width itemprop
```

元素专属属性：`a`→`href`；`img`→`src longdesc`；`div`→`itemscope itemtype`；`blockquote`/`del`/`ins`/`q`→`cite`。

**关键：`style`、`class`、`id` 都不在白名单里。** 行内 `style="..."` 被剥离。（你在 GitHub 页面上看到的 `<img style="max-width:100%">` 是 GitHub 自己加的，不是你写的。）所以：

- 布局只能用 `align`（left/center/right）、`width`、`height`、`border`、`hspace`、`vspace`
- 不能写 CSS、不能做响应式微调、不能做 hover、不能自定义字体
- 想做精细排版，唯一出路是**把设计画进图片里**（SVG/PNG），而不是靠 HTML+CSS

链接协议只允许 `http`、`https`、`mailto` 和相对路径。

## 图片的三个自动行为

源码 `image_max_width_filter.rb` / `camo_filter.rb`：

1. **自动补 `max-width:100%;`**（仅当图片没有 style 属性）→ 图片不会撑破窄屏，但你也无法自己控制最大宽度，只能靠 `width` 属性。
2. **未包链接的图片会被自动包一层 `<a href="图片地址" target="_blank">`** → "点图看大图"是 GitHub 的默认行为，不用自己写。
3. **外部图片走 camo 代理**（`camo.githubusercontent.com`）并缓存 → 第三方徽章/图床挂了或更新了，GitHub 页面都会滞后。

## 暗色模式：`<picture>` 是官方方案

GitHub 官方文档 `github/docs` 的 `quickstart-for-writing-on-github.md` 明确要求用 `<picture>` + `prefers-color-scheme` 给 README 顶部做响应式横幅，官方示例：

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="YOUR-DARKMODE-IMAGE">
  <source media="(prefers-color-scheme: light)" srcset="YOUR-LIGHTMODE-IMAGE">
  <img alt="YOUR-ALT-TEXT" src="YOUR-DEFAULT-IMAGE">
</picture>
```

三种方案对比：

| 方案 | 写法 | 状态 | 建议 |
|---|---|---|---|
| `<picture>` + `prefers-color-scheme` | 见上 | 官方文档收录；实测 vite / tailwindcss / rust 线上页面均保留并生效 | **默认方案** |
| URL fragment hack | `x.png#gh-dark-mode-only` / `#gh-light-mode-only` | 未文档化；`github/docs` 全库搜索 0 命中；supabase 等老项目仍在用，线上 fragment 被保留 | 新代码不要用 |
| 单图中性配色 | 一张对比度足够的图 | 永远有效 | 不想维护两份素材时的兜底 |

注意：`picture` / `source` 并不在 html-pipeline 的默认白名单里，但 GitHub 生产环境用扩展白名单——官方教程已经把它当标准写法，加上线上实测，可以放心使用。

## 相对路径 vs 绝对 URL

- GitHub 自己渲染 README 时会正确解析仓库相对路径。
- 但 npm / PyPI / crates.io / NuGet / VS Code Marketplace 等**镜像站只拿 Markdown 文本**，相对路径会 404。
- 所以：素材放仓库里（推荐 `.github/assets/`），引用时用绝对 URL：
  `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/.github/assets/banner-light.svg`
- 绝对 URL 要带分支名（`main`/`master`）。带 commit SHA 最稳，但素材更新后要改链接。

## 其它会咬人的行为

- **表格结构**：`tr/td/th/thead/tbody/tfoot` 必须在 `<table>` 内，否则被拆标签。
- **顶层 `<li>`**：不在 `ol/ul` 里的 li 会被去掉标签只留内容。
- **HTML 块与 Markdown 混排**：`<div>` 内要解析 Markdown 需要空行分隔；最稳的做法是 HTML 块内只写 HTML。
- **HTML 注释**：GitHub 会隐藏注释内容（官方文档确认），适合放给维护者看的说明，如 Best-README-Template 的 `<!-- PROJECT SHIELDS -->`。
- **图片体积**：单张 >1MB 会明显拖慢首屏；截图压到 200KB 内。GIF 尤其重，能用短循环 GIF 就别用长录屏（`<video>` 不在白名单，视频不能内嵌）。
- **首屏内容**：README 顶部在 GitHub 上大约只有 700–900px 高度的可视区，表头应该在这个范围内把"是什么 + 能干什么"说完。

## 复盘：这份文档里的结论怎么来的

| 结论 | 证据 |
|---|---|
| 元素/属性/协议白名单、table 与 li 的 transformer | 抓取 `github/html-pipeline` 源码文件（2026-10-16） |
| `<picture>` 是官方推荐 | `github/docs` 的 `picture-element-example.md`、`quickstart-for-writing-on-github.md` |
| `<picture>` 在线上确实生效 | 抓取 github.com/vitejs/vite、/tailwindlabs/tailwindcss、/rust-lang/rust 页面 HTML，`<picture>`/`prefers-color-scheme` 均保留 |
| `#gh-dark-mode-only` 仍被页面保留但无官方文档 | 抓取 github.com/supabase/supabase、/sindresorhus/got；`gh api search/code repo:github/docs` 返回 0 |
| 自动 max-width / 自动包链 / camo | `image_max_width_filter.rb`、`camo_filter.rb` 源码 |
