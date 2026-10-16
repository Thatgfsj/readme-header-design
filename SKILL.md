---
name: readme-header-design
description: 设计、生成并校验 README 的"表头"（第一个二级标题之前的页首区域）。涵盖 GitHub 渲染硬约束（HTML 白名单、<picture> 暗色模式、图片代理）、六种表头范式与选型决策树、shields.io 徽章规范、自绘 SVG 横幅生成器与表头校验脚本。当需要新建/改写/美化 README 开头、设计 banner 或 hero 头图、加徽章、做暗色模式适配、评审已有 README 表头时使用。
---

# README 表头设计

**表头 = README 里第一个 `##` 之前的一切。** 它是项目封面：读者在 3 秒内决定继续读还是关掉页面。

本技能把"把表头做好看"变成一条可验证的流水线：**收集事实 → 选型 → 造素材 → 落地 → 校验**。

## 交付物（四项缺一不可）

1. 可直接粘贴的 README 表头区块（Markdown + 白名单内的 HTML）
2. 其中引用的图片素材（优先仓库内本地文件，不依赖第三方服务）
3. `node scripts/lint_header.mjs <README 路径>` 无 error
4. 明亮 / 暗色两种模式都确认过，且表头与仓库 About 描述一致

## 三条铁律

1. **不编造事实。** 项目名、一句话定位、安装命令、版本号、许可、仓库 URL 必须从仓库里读出来（`package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod` / `LICENSE` / `git remote -v` / 真的能跑的命令）。拿不到就留占位符并告诉用户，**绝不写看起来像真的假徽章和假命令**。
2. **3 秒测试。** 读者只看表头，能否答出四问：这是什么？给谁用？现在能用吗？从哪开始？四问缺一，表头不合格——补内容，不是补装饰。
3. **GitHub 是画布，不是浏览器。** `<style>`、`class`、`id`、行内 `style` 会被剥离，只有白名单元素与属性生效。用网页思维设计的表头到 GitHub 上会塌成纯文本。白名单见 `references/github-constraints.md`。

## 工作流

### 第 1 步 — 收集事实

先读仓库再动笔。最少要拿到：

| 事实 | 来源 |
|---|---|
| 项目名 / 官方写法（大小写、连字符） | 包清单的 `name` 字段 |
| 一句话定位（≤120 字符，含"给谁/解决什么"） | 自己提炼；不要照抄 About |
| 版本、许可、包名 | 包清单 + `LICENSE` |
| 安装/运行命令 | 实际验证过能跑的命令 |
| 仓库 URL、文档站、Demo | `git remote -v`、包清单的 homepage |
| 现有 logo / 截图 / GIF | `ls`、`find . -name "*.svg" -o -name "*.png"` |
| 语言构成（配色依据） | 主要语言 |

**配色从项目自身取**：logo 主色 → 用作 SVG 横幅渐变色与徽章色；没有 logo 就从语言/品牌色取。不要凭空选一个"好看"的紫色。

### 第 2 步 — 选型（先定范式，再动手）

按"项目类型 × 受众 × 分发渠道"查表。范式全文与真实案例见 `references/patterns.md`。

| 场景 | 范式 | Logo | 一句话 | 徽章数 | 导航行 | 视觉证据 |
|---|---|---|---|---|---|---|
| npm / PyPI / crates 库 | P1 徽章居中 | 有则放 | 必需 | 3–5 | 可选 | API 代码片段 |
| CLI 工具 | P6 截图为王 | 可选 | 必需 | 3–4 | 推荐 | 终端截图/GIF **必需** |
| 全栈 Web 应用 | P3 图形横幅 + P6 | **必需** | 必需 | 3–5 | 推荐 | 产品截图必需 + Demo 链接 |
| 后端 API / 服务 | P2 极简文本 | 可选 | 必需 | 3–4 | 推荐 | 一次请求示例 |
| 基础设施 / 大项目 | P2 极简文本 | 不要 | 必需 | 0–3 | 推荐 | 无 |
| 数据集 / 模型 | P1 | 可选 | 必需 | 2–4 | 可选 | 样例输出 |
| 个人 Profile | P5 装饰版 | 可选 | 必需 | ≤3 | **必需** | 统计卡 |
| 早期实验 | P2 | 不要 | 必需 | 0–1 | 不要 | 无 |

**徽章预算：表头里 ≤5 个，一行放得下。** 风格全表统一：默认 `flat-square` 或 `flat`；`for-the-badge` 只允许在 ≤3 个徽章的 Profile / 展示型项目里出现。

### 第 3 步 — 造素材

优先级从高到低，**能用仓库内文件就不要用第三方服务**：

1. **已有 logo** → 直接引用，包进 `<picture>` 做暗色适配（见下）
2. **自绘 SVG 横幅** → 用 `node scripts/gen_banner.mjs --name "…" --tagline "…" --accent "#7c3aed" --out .github/banner.svg` 生成，带暗色变体
3. **第三方装饰服务**（capsule-render / readme-typing-svg / github-readme-stats）→ 只允许 Profile 与个人玩具项目使用；生产项目用了等于把门面挂到别人随时会停的服务器上（capsule-render 自己声明 best-effort）
4. **截屏 / GIF** → 有 GUI 或 TUI 就一定要有；宽度 ≤1200px，放 `.github/assets/`

### 第 4 步 — 落地

从 `references/patterns.md` 复制对应范式骨架，填入第 1 步的事实。硬性要求：

- 首个标题是**唯一的 H1**，且就是项目名
- 每个 `<img>` 都要有 `alt`（无障碍 + 图片挂了也不瞎）
- 表头顶部放 `<a name="readme-top"></a>`，文末放 `[↑ 回到顶部](#readme-top)`
- 图片用 HTTPS 绝对地址或仓库内相对路径；**相对路径要知道 npm/PyPI 等镜像站会 404**，发布到包管理器时改用绝对 URL
- 暗色模式必须用 `<picture>` + `prefers-color-scheme`，**不要用 `#gh-dark-mode-only`**（未文档化的旧 hack，官方文档零命中）

### 第 5 步 — 校验

```bash
node scripts/lint_header.mjs README.md            # 文本层校验
node scripts/lint_header.mjs README.md --json      # 机器可读
```

然后人工过一遍（脚本查不出来的）：

1. **目视**：把表头渲染出来看——`node scripts/gen_banner.mjs … --preview` 可把 SVG 转 PNG（需要 `sharp`）
2. **双模式**：GitHub 设置里切 Light / Dark 各看一遍，横幅、logo、徽章都要能读
3. **窄屏**：浏览器窗口拖到 ~400px，横幅与徽章行不能溢出
4. **一致性**：仓库 About 的 Description = 表头的一句话定位；social preview（1280×640）与横幅视觉一致
5. **点击**：导航锚点、Demo 链接、徽章目标 URL 逐个点开，确认不是 404

## 资源导航

| 需要什么 | 读哪个 |
|---|---|
| GitHub 到底允许哪些标签/属性、暗色模式怎么做、图片怎么被代理 | `references/github-constraints.md` |
| 六种表头的完整骨架与真实案例（含 star 数与实测统计） | `references/patterns.md` |
| shields.io 语法、徽章选型、常见徽章速查 | `references/badges.md` |
| 自绘 SVG 横幅的技术细节（字体、渐变、网格、暗色变体） | `references/svg-banner.md` |
| 表头常见错误与改法 | `references/anti-patterns.md` |
| 校验表头 | `scripts/lint_header.mjs` |
| 生成横幅 | `scripts/gen_banner.mjs` |

## 常见失败（先查这里）

| 症状 | 原因 | 修法 |
|---|---|---|
| 表头在 GitHub 上变成一堆裸文字 | 用了 `<style>`/`class`/`style=` | 改用 `align`/`width`/`height` 属性，见约束文档 |
| 暗色模式下图看不清 | 只做了一张深色图或用了旧 hack | 换 `<picture>` 双 source |
| 徽章一半是灰的 / 写着 unknown | 徽章指向不存在的包名或仓库 | 逐个点开验证，删掉不成立的 |
| 图片在 npm 页面上 404 | 用了仓库相对路径 | 换成 raw.githubusercontent.com 绝对地址 |
| 表头很花但没人 star | 装饰挤掉了信息 | 回到 3 秒测试，砍掉装饰 |
