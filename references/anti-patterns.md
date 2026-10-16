# 表头反模式与改法

每条都给出：**症状 → 为什么错 → 改法**。带"实测"标记的结论来自对线上仓库页面的抓取（2026-10-16）。

## 1. 用 CSS 做设计

```html
<!-- 错 -->
<div style="display:flex; gap:12px; background:linear-gradient(...)">
  <h1 style="font-size:3rem; color:#7c3aed">项目名</h1>
</div>
```

**为什么错**：`style` 属性、`<style>` 元素、`class`、`id` 全都不在 GitHub 白名单里，会被剥掉（实测：html-pipeline 的 WHITELIST 里没有 style/class/id）。你在本地预览器里看到的效果，在 GitHub 上不存在。
**改法**：能用属性解决的用属性（`align`、`width`、`height`）；要真正的视觉设计，把设计做成图片（SVG/PNG）。

## 2. 用 `#gh-dark-mode-only` 做暗色适配

```html
<!-- 错：未文档化的旧 hack -->
<img src="https://example.com/logo-dark.png#gh-dark-mode-only">
<img src="https://example.com/logo-light.png#gh-light-mode-only">
```

**为什么错**：GitHub 官方文档从未收录这个写法（`github/docs` 全库搜索 0 命中），未来可能被移除；只有老项目还带着它。
**改法**：用官方方案 `<picture>` + `prefers-color-scheme`（GitHub 官方文档的 README 教程就是教这个）。

## 3. 徽章墙

**症状**：表头 10+ 枚徽章排成三行，第一屏看不到项目是干什么的。
**为什么错**：徽章是可信度信号，信号过载等于噪音；且每个徽章都是一次外部请求，拖慢首屏。
**改法**：砍到 ≤5 个一行。保留 CI、版本、下载量、许可；把覆盖率、社区聊天、赞助商挪到 README 中部的 "Community"/"Support" 段。

## 4. 徽章风格混用

**症状**：`flat`、`for-the-badge`、`social` 三种风格并存。
**为什么错**：看起来像把不同项目的表头拼在一起，损害专业感。
**改法**：全局统一一个 `style`，默认 `flat-square`。

## 5. 徽章指向不存在的东西

**症状**：徽章显示 `unknown` / `invalid` / `package not found`。
**为什么错**：一个灰徽章会让整排徽章都显得没人维护——这比不放徽章更糟。
**改法**：发布前逐个点开。包名写错、仓库改名、CI workflow 文件路径变了都会导致这个结果。

## 6. 图片用仓库相对路径，却想发到 npm/PyPI

```markdown
<!-- 在 GitHub 上没问题，在 npm 页面上 404 -->
<img src="doc/logo.svg" alt="logo">
```

**为什么错**：镜像站只拿 Markdown 文本，不解析仓库文件。
**改法**：素材放 `.github/assets/`，用 `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/.github/assets/logo.svg` 引用。

## 7. 图片没有 alt

```markdown
![](https://img.shields.io/npm/v/pkg)
```

**为什么错**：屏幕阅读器读不出内容；图片被 camo 拦截或服务挂掉时读者什么都看不到。
**改法**：`![npm version](...)`，且徽章用 `alt` 描述信号本身而不是"badge"。

## 8. 表头里没有一句话定位

**症状**：`# projname` 之后直接是徽章和安装命令。
**为什么错**：读者知道名字但不知道它解决什么问题，必须继续读才能判断——3 秒测试失败。实测 45 个仓库里只有 36% 在表头写了定位句，这是最容易补的分数。
**改法**：补一句"给谁 + 解决什么"，≤120 字符，不用营销形容词。

## 9. 定位句写成营销口号

```markdown
<!-- 错 -->
**The world's most powerful, blazingly fast, next-generation framework!**

<!-- 对 -->
**TypeScript-first HTTP client for Node.js, with retries, hooks and typed responses.**
```

**为什么错**：形容词不可验证，读者过滤掉。具体名词（运行时、语言、核心能力）才是信息。

## 10. 依赖第三方装饰服务

**症状**：表头主视觉是 `capsule-render.vercel.app` / `readme-typing-svg.demolab.com` 的动态图。
**为什么错**：这些服务自己声明 best-effort、可能限流；一旦挂掉，你的门面变成裂图。而且动画横幅在严肃项目里会显得像模板抄的（实测：45 个仓库里没有一个严肃项目使用）。
**改法**：用 `scripts/gen_banner.mjs` 生成自己的 SVG 提交进仓库；Profile README 用也无妨，但要清楚风险。

## 11. 巨型 GIF 拖垮首屏

**症状**：表头下面是一段 8MB 的录屏 GIF。
**为什么错**：GitHub 页面首屏要等它加载；移动端和弱网直接白屏。（`<video>` 不在白名单，不能靠内嵌视频解决。）
**改法**：压到 1MB 以内，尺寸 800–1200px，只保留关键交互的 3–5 秒循环。

## 12. 模板残留

**症状**：表头里还写着 "Project Link: https://github.com/othneildrew/Best-README-Template"、`[contributors-shield]` 指向原模板仓库的贡献者图。
**为什么错**：读者立刻判断这是一个没认真改的模板仓库。
**改法**：抄结构可以，抄完逐个替换 owner/repo/包名/许可；参考式链接定义也要一起改。

## 13. 表头与仓库 About 不一致

**症状**：README 定位句说"自托管的笔记工具"，仓库 About 里写的是"my project"。
**为什么错**：About 出现在搜索结果、社交卡片、仓库列表里，是表头的"外面那一层"。两者不一致会让人怀疑项目状态。
**改法**：About 的 Description = 表头定位句；Topics 填 5–10 个检索词；Social preview 图（1280×640）用与横幅同一套视觉。

## 14. 用装饰代替结构

**症状**：一堆 emoji 标题 + 分隔线 + 引用块，但读不到安装命令。
**为什么错**：emoji 能提升扫读效率，但不能替代信息层级。3 秒测试仍然优先。
**改法**：先保证"是什么 / 怎么装 / 怎么跑"三件事在首屏，再考虑 emoji 与分隔线。

## 15. 首屏放不下关键信息

**症状**：H1 之后是 300px 高的动画横幅、5 枚徽章、赞助商列表，第一个 `##` 标题在 1200px 处。
**为什么错**：GitHub 首屏可视高度约 700–900px。超过这个高度的表头，读者要滚动才能知道项目是什么。
**改法**：把"是什么 + 怎么开始"压缩进首屏；赞助商、贡献者头像墙、统计卡全部下移。

## 快速自查

```text
[ ] 首个 H1 就是项目名，且全文只有一个 H1
[ ] H1 后 120 字符内有一句"给谁 + 解决什么"
[ ] 表头徽章 ≤5 个，一行放得下，风格统一，全部点得开
[ ] 所有图片有 alt，且没有相对路径（要发包管理器的话）
[ ] 暗色模式用 <picture>，不用 #gh-*-mode-only
[ ] 没有 style / class / id / 内联 svg
[ ] 首屏（约 800px 高）内能读完"是什么 + 怎么开始"
[ ] 表头定位句与仓库 About 描述一致
```
