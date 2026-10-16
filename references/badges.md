# 徽章（Badges）

## 徽章的角色：可信度信号，不是装饰

每个徽章都在声明"这条信息有人在自动化维护"。所以：

- 只放**能自动更新**的：CI 状态、版本、下载量、覆盖率、许可
- 只放**读者真会看**的：能不能跑、够不够新、能不能商用
- 不放自己给自己发的奖杯、访问计数器、社交关注数、"Powered by X"、随机名言

## 预算与风格

- 表头徽章 **≤5 个**，且必须一行放得下（GitHub 内容区约 880px 宽）
- 全项目统一 `style`：默认 `flat-square`（锐利、信息密度高）；要柔和用 `flat`
- `for-the-badge`（大号大写）只在 Profile README 或纯展示型项目用，且 ≤3 个
- 顺序 = 读者关心程度：**能不能用（CI）→ 什么版本 → 怎么装（包/下载量）→ 能不能商用（许可）→ 质量（覆盖率）**

## shields.io 语法

静态徽章：

```text
https://img.shields.io/badge/<LABEL>-<MESSAGE>-<COLOR>?style=flat-square&logo=<slug>&logoColor=white
```

- 连字符转义成 `--`，下划线转义成 `__`，空格用 `_` 或 `%20`
- 颜色支持 hex（不带 `#`）、`rgb/rgba/hsl/hsla`、CSS 颜色名
- `logo` 取 [simple-icons](https://simpleicons.org) 的图标 slug，如 `react`、`python`、`docker`
- `labelColor` 控制左半背景；`cacheSeconds` 覆盖默认缓存时长（有下限）
- `logoSize=auto` 让宽图标自适应

## 常用动态徽章端点

| 用途 | URL |
|---|---|
| npm 版本 / 下载量 | `https://img.shields.io/npm/v/<pkg>` · `.../npm/dm/<pkg>` |
| PyPI 版本 | `https://img.shields.io/pypi/v/<pkg>` |
| crates.io | `https://img.shields.io/crates/v/<crate>` |
| GitHub Release | `https://img.shields.io/github/v/release/<owner>/<repo>?sort=semver` |
| 许可 | `https://img.shields.io/github/license/<owner>/<repo>` |
| Stars（社交风格） | `https://img.shields.io/github/stars/<owner>/<repo>?style=social` |
| 最后提交 | `https://img.shields.io/github/last-commit/<owner>/<repo>` |
| 覆盖率 | `https://codecov.io/gh/<owner>/<repo>/graph/badge.svg` |
| Discord | `https://img.shields.io/discord/<server-id>?logo=discord&logoColor=white` |

GitHub Actions 原生徽章（不经过 shields.io）：

```text
https://github.com/<owner>/<repo>/actions/workflows/<file>.yml/badge.svg?branch=main
```

优点：GitHub 自托管、几乎不会挂。缺点：样式不可调、只反映这一个 workflow。

## 两种写法：内联 vs 参考式

内联（够用、直观）：

```markdown
[![npm version](https://img.shields.io/npm/v/vite.svg)](https://npmjs.com/package/vite)
```

参考式（Best-README-Template 的做法，表头更干净、链接集中维护）：

```markdown
[![CI][ci-shield]][ci-url]
[![License][license-shield]][license-url]

[ci-shield]: https://img.shields.io/github/actions/workflow/status/o/r/ci.yml?branch=main
[ci-url]: https://github.com/o/r/actions
[license-shield]: https://img.shields.io/github/license/o/r
[license-url]: ./LICENSE
```

徽章超过 4 个、或同一个仓库里多处引用时，用参考式。

## 三件必做的事

1. **每个徽章都要可点**，且指向能解释这个信号的地方（CI 徽章 → Actions 页，版本徽章 → 包主页）
2. **`alt` 写清楚**：`alt="CI status"`，不要写 `alt="badge"`（图挂了也能读懂）
3. **逐个点开验证**。出现 `unknown`、`invalid`、`not found` 的徽章**宁可删掉**——一个灰徽章能让整排徽章失去可信度

## 缓存与时效

- shields.io 按徽章类型推断默认缓存，`cacheSeconds` 可覆盖但受下限限制
- GitHub 的 camo 代理还会再缓存一层 → 徽章不是实时的，别指望刚 push 的构建立刻变色
- CI 徽章加 `?branch=main`（原生徽章）或 `?event=push`（shields.io）收窄，避免出现"最近一次随机 workflow 失败"的误导

## 暗色模式下的徽章

- shields.io 徽章自带灰白底，在 GitHub 暗色主题下依然可读，通常无需特殊处理
- 避免 `color=white` / `labelColor=white` 这类只在浅色背景好看的取值
- `color=black` / 深色底徽章在暗色模式下的边界会消失，慎用

## 反例清单

| 反例 | 为什么糟 |
|---|---|
| 10+ 枚徽章堆成三行 | 首屏被信号噪音占满，真正的 tagline 被挤下去 |
| 混用 `flat`、`for-the-badge`、`social` 三种风格 | 视觉上像不同项目拼在一起 |
| "Visitors"、"Profile views"、"Trophy" | 无信息量，且暴露这是模板抄来的 |
| 徽章指向不存在的包 | 显示 `unknown`，比不放还差 |
| 静态徽章写死版本号 | 三个月后就过期了，用动态端点 |
