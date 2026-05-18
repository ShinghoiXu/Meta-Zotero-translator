[English](README.md) | [简体中文](README.zh-CN.md)

# Meta Store 翻译器（Zotero 插件）

一个 [Zotero](https://www.zotero.org/) 网页翻译器，用于从 **Meta 体验页面**（[`https://www.meta.com/experiences/`](https://www.meta.com/experiences/) 上的 VR/AR/XR 游戏和软件）提取引用元数据。

当你访问 Meta Store 产品页面时，Zotero Connector 图标会亮起，显示一个"computerProgram"条目。一键即可保存所有关键元数据。

---

## 提取的字段

| 字段 | 数据来源 |
|---|---|
| **标题** | `document.title` → `h1` → URL slug → JSON‑LD/meta 后备 |
| **URL** | 当前页面 URL |
| **开发商** | DOM span-scan → JSON‑LD 后备 |
| **发行商** | DOM span-scan → JSON‑LD 后备 |
| **发布日期** | DOM span-scan → JSON‑LD 后备 |
| **版本** | DOM span-scan → JSON‑LD 后备 |

- **条目类型:** `computerProgram`
- **目录来源:** `Meta Store`
- 标题自动裁剪 — `"Gorilla Tag on Meta Quest | Quest VR Games"` → `"Gorilla Tag"`
- **摘要/描述有意不提取** — Zotero Connector 在 SPA 导航时会缓存 `<head>` 元数据，导致跨页串数据。

---

## 支持的 URL

任何匹配 `https?://(www.)?meta.com/experiences/*` 的链接，例如：

- `https://www.meta.com/experiences/gorilla-tag/4979055762136823/`
- `https://www.meta.com/experiences/wall-town-wonders/6103056399797843/`
- `https://www.meta.com/experiences/i-am-cat/6061406827268889/`

---

## 安装方法

1. **下载** [`Meta Store.js`](Meta%20Store.js) 文件。
2. 打开 Zotero，进入 **编辑 → 设置 → 高级 → 文件和文件夹**，点击 **打开数据文件夹**。
3. 打开 `translators` 文件夹，将 `Meta Store.js` 放入其中。
4. 在浏览器中右键点击 Zotero Connector 图标 → **选项** → **Advanced → Translators** → 点击 **Update Translators**。

---

## 工作原理

```
detectWeb()  →  URL 匹配 /experiences/ ?  "computerProgram" : false

doWeb()  →  scrape(doc, url)

scrape():
  1. 标题       — document.title（在 SPA 中始终是最新的）
                   → 裁剪 " on " / " | " 后缀
                   ↓ h1 元素
                   ↓ URL slug → 单词首字母大写
                   ↓ JSON‑LD / og:title meta（最后手段）

  2. 描述       — JSON‑LD @graph → ItemPage → description
                   → 匹配已知标签（Developer、Publisher 等）
                   → 向上遍历 DOM 找到行容器
                      → developer / publisher / release date / version

  4. JSON‑LD   — IdMap 查找表解析 @id 引用
                   → 补充 DOM 提取中缺失的字段
```

本翻译器遵循 [Zotero 编码规范](https://www.zot
注意：翻译器有意不提取摘要/描述，因为 Meta Store 是 React SPA —— 使用 Zotero Connector 时，缓存的 `<head>` 元数据（JSON‑LD 描述、`<meta>` 标签）会在页面跳转时串页。- 使用 `attr()` 辅助函数提取 meta 标签（优先于原始 querySelector）
- 使用 `ZU.cleanAuthor()` 解析作者名
- 使用 `Z.debug()` 输出诊断日志
- JSON‑LD `@graph` 始终作为 DOM 提取的补充进行遍历

---

## 真实测试数据（截至 2026-05-18）

### Gorilla Tag

| 字段 | 值 |
|---|---|
| 标题 | Gorilla Tag |
| 开发商 | Another Axiom Inc |
| 发行商 | Another Axiom |
| 发布日期 | December 15, 2022 |
| 版本 | 1.1.137 |
| URL | `https://www.meta.com/experiences/gorilla-tag/4979055762136823/` |

### Wall Town Wonders

| 字段 | 值 |
|---|---|
| 标题 | Wall Town Wonders |
| 开发商 | Cyborn BVBA |
| 发行商 | Cyborn BV |
| 发布日期 | November 21, 2024 |
| 版本 | 1.10 |
| URL | `https://www.meta.com/experiences/wall-town-wonders/6103056399797843/` |

### I Am Cat

| 字段 | 值 |
|---|---|
| 标题 | I Am Cat |
| 开发商 | NEW FOLDER GAMES LTD |
| 发行商 | NEW FOLDER GAMES LTD |
| 发布日期 | December 5, 2024 |
| 版本 | 1.4.0.0 |
| URL | `https://www.meta.com/experiences/i-am-cat/6061406827268889/` |

---

## 故障排查

- **标题显示为上一页的内容？** 这是已知的 Zotero Connector SPA 缓存问题。翻译器现已改用 `document.title`（React 在每次路由切换时都会更新）作为标题的主要数据来源，而非缓存的 `<head>` 元数据。若问题仍然存在，请确认使用的是最新版翻译器。作为变通方法，你可以复制网址并在新标签页中打开——Connector 将识别到全新的页面加载，从而获取正确的元数据。
- **详情字段未提取？** Meta 可能已更改页面布局。翻译器会扫描所有 `<span>` 元素来匹配已知标签（Developer、Publisher 等），并沿 DOM 树向上查找对应的值。若 Meta 更改了标签文本或行结构，需要相应更新提取逻辑。
- **调试方法：** 打开 Zotero 的调试输出（帮助 → Debug Output Logging），查找以 `Meta Store:` 开头的日志行。

---

## 兼容性

- Zotero 5.0 及以上版本
- 支持翻译器的浏览器插件（Chrome、Firefox、Edge、Safari）

---

由 **Chengkai Xu** 维护。最后更新：2026-05-18。
