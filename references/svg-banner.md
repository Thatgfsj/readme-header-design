# 自绘 SVG 横幅

## 为什么自绘

第三方装饰服务（capsule-render、typing-svg、各类统计卡）的共同问题：**门面挂在别人的免费服务上**。capsule-render 官方 README 自己写着 "provided on a best-effort basis and may be unstable due to usage limits or traffic spikes"。对一个要被别人依赖的项目来说，这不是一个好赌注。

自绘 SVG 的好处：文件在仓库里，永久可用；随仓库一起被 GitHub camo 缓存；可以在任何编辑器里改；不需要任何外部请求。

## 基本规格

| 项 | 建议值 | 理由 |
|---|---|---|
| viewBox | `0 0 1280 320`（或 1600×400） | 2:1 到 4:1 之间；GitHub 内容区约 880px 宽，会被等比缩放 |
| 引用方式 | `<img src="..." width="100%">` | 交给 GitHub 的 `max-width:100%` 处理响应式 |
| 文件位置 | `.github/assets/banner-light.svg`、`banner-dark.svg` | 素材集中，不污染仓库根目录 |
| 体积 | < 40KB | 矢量图通常远小于此；别内嵌位图 |
| 安全边距 | 左右各 ≥ 64px，上下 ≥ 48px | 缩放后文字不贴边 |

## 文字是最大的坑

**SVG 通过 `<img>` 加载时不能加载外部字体**（浏览器安全策略），也拿不到页面 CSS。所以：

1. 只用通用字体栈。把这段话抄进生成的 SVG：
   ```text
   ui-sans-serif, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif
   ```
2. **同一份 SVG 在不同系统上宽度不同**（macOS 的 SF、Windows 的 Segoe、Linux 的 DejaVu 度量都不一样）。所以：
   - 不要依赖精确居中和贴边排版，留足余量
   - 生成器里的宽度估算（CJK 字宽 ≈ 1.0em，拉丁小写 ≈ 0.53em）是**保守估计**，宁可早换行也别溢出
3. 要 100% 一致的视觉效果，就把文字转成路径（`fonttools`、Inkscape 的 "Object to Path"）。代价是文字不可搜索、不可编辑、体积变大。**只在对品牌一致性要求极高的对外项目上这么做。**

## 视觉配方（gen_banner.mjs 内置）

一个耐看、不喧宾夺主的横幅由这几层叠成：

```text
1  底色渐变      对角 linearGradient：浅色版 #ffffff → accent 的 6% 提亮色
2  细网格        pattern 32×32 的 1px 线，透明度 0.35 左右
3  两处光斑      radialGradient，放在右侧与左上角，透明度 0.10–0.18
4  同心圆装饰    右下角 3 层圆，描边 accent，透明度 0.10–0.25
5  主色条        底部或左侧 4–6px 实色条，锚定品牌色
6  文字          标题（56–72px，600 字重）+ 定位句（22–26px，400 字重）
```

原则：**装饰只出现在文字的对侧**，文字区域保持干净。任何一层透明度超过 0.25 都会开始抢文字。

## 配色怎么定

不要凭空选紫。**从项目自身取色**：

1. 有 logo → 吸 logo 主色的 hex
2. 没有 logo → 用语言/生态的品牌色（TypeScript `#3178c6`、Rust `#ce422b`、Go `#00add8`、Python `#3776ab`、React `#61dafb`）
3. 全栈应用 → 用产品 UI 的主按钮色

对比度硬要求：正文文字与背景 **≥ 4.5:1**（WCAG AA）。生成器会自动挑深/浅文字色，但改了参数后仍要目视确认。

## 暗色变体的做法

不要用同一张图硬撑两种模式。生成两个文件，用 `<picture>` 切换：

```html
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/O/R/main/.github/assets/banner-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/O/R/main/.github/assets/banner-light.svg">
    <img alt="项目名 — 一句话定位" src="https://raw.githubusercontent.com/O/R/main/.github/assets/banner-light.svg" width="100%">
  </picture>
</p>
```

暗色版不是把颜色反相，而是：**深底**（`#0b1020` 一类，不要纯黑）、**降饱和的主色**、**文字换成 off-white**（`#e8e8f5`，不要纯白，纯白在深底上会发光晕）。

## 生成器用法

```bash
node scripts/gen_banner.mjs \
  --name "项目名" \
  --tagline "一句话定位，给谁、解决什么" \
  --accent "#6d5efc" \
  --out .github/assets/banner.svg \
  --theme both \
  --monogram
```

参数：

| 参数 | 说明 |
|---|---|
| `--name` | 项目名（必需），会做宽度估算自动缩字号 |
| `--tagline` | 一句话定位，可省略 |
| `--accent` | 主色 hex，默认 `#6d5efc`；副色从主色自动派生（色相 +42°） |
| `--out` | 输出路径；`--theme both` 时额外生成 `<name>-dark.svg` |
| `--theme` | `light` / `dark` / `both`（默认 both） |
| `--width` `--height` | 画布尺寸，默认 1280×320 |
| `--monogram` | 在左侧画一个圆形首字母徽标 |
| `--font` | 覆盖字体栈（只在明确知道目标环境字体时才改） |

生成后**必须**目视检查一遍：

```bash
# 任一方式把 SVG 转成 PNG 看效果
npx --yes sharp-cli -i .github/assets/banner-light.svg -o /tmp/banner-light.png
npx --yes sharp-cli -i .github/assets/banner-dark.svg -o /tmp/banner-dark.png
# 或者：rsvg-convert -o out.png in.svg / inkscape in.svg -o out.png
```

检查三点：文字有没有出界；标题与定位句有没有打架；暗色版对比度够不够。

## 手工编辑要点

生成器只是起点。手工改的时候记住：

- `<text>` 的 `x`/`y` 是基线位置，不是左上角；行高按字号的 1.2–1.4 倍算
- 多个 `<text>` 做左对齐时，统一 `x`，不要靠目测
- 用 `<g opacity="0.1">` 控制装饰层，不要给每个元素单独写 opacity
- SVG 里不要放 `<foreignObject>`、`<script>`、外链 `<image href="http...">`——前者兼容性差，后者等于又引入了一个外部依赖
- 需要在小尺寸下更清晰，就把装饰减少、字号加大，而不是加描边

## GitHub 上的渲染确认

提上去之后，打开仓库页面：

1. 右键图片 → 在新标签打开，确认返回的是 SVG 而不是 404
2. 切换 GitHub 主题（Settings → Appearance）看明亮/暗色两版
3. 把窗口拖窄到 ~400px，确认横幅等比缩放、文字仍可辨认
