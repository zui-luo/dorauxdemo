# uxdemo 工作区指南

本目录用于存放**原型 HTML 文件**及其配套的**交互逻辑文档**，服务于设计评审。
每个原型是一个独立的子文件夹，包含且仅包含两个文件。
一个原型文件内可以包含**多个方案**，方案之间通过顶部切换栏进行对比。

---

## 目录结构约定

```
uxdemo/
├── CLAUDE.md                        # 本文件
├── {feature-name}/
│   ├── prototype.html               # 原型页面（自包含）
│   └── interaction-spec.md          # 交互逻辑文档
└── ...
```

命名规则：`feature-name` 用小写连字符，体现功能而非日期，例如 `skill-upload`、`agent-config-flow`。

---

## 每次制作原型的工作流

### Step 1 — 获取上下文（按需选择，不强制读源码）

目标是理解**当前状态**和**本次涉及的数据字段**，选最快的方式：

- **有截图/设计稿**：以截图作为视觉基准，无需读源码
- **需要了解现有交互逻辑**：只读与设计点直接相关的 1–2 个组件文件，不做全文件树探索
- **需要 token/颜色**：只读 `palette.constant.ts` 等 token 文件，一次拿齐后复用
- **需要数据结构**：只读对应的 `types.ts` 或 store 文件

> 原则：**够用就停**。拿到「界面长什么样」和「有哪些交互状态」这两个信息后即可动手，不需要理解完整实现。

### Step 2 — 复刻为自包含 HTML

将相关界面写入 `prototype.html`，要求：
- **单文件自包含**：所有样式和脚本内联，无外部依赖，双击即可在浏览器打开
- **交互逻辑准确，视觉够用即可**：颜色/间距使用已有 token，不追求像素级还原；重点是状态切换逻辑正确
- **聚焦范围**：只包含与本次设计目标直接相关的界面，上下文参考区域可以简化处理
- **状态可切换**：用 JS 模拟关键的交互状态（hover、loading、error、empty 等）
- **数据 Mock**：用真实感的硬编码数据，不写占位符文案
- **多方案切换栏**：页面最顶部必须有方案切换栏（即使只有一个方案也要保留）

### Step 3 — 同步撰写交互逻辑文档

**每次修改 `prototype.html`，必须在同一次回复中同步更新 `interaction-spec.md`，无需用户提醒。**
两个文件的交互逻辑**必须始终保持一致**，以 `interaction-spec.md` 为权威描述。

**更新方式：增量还是全量？**

根据本次变更的性质选择：

- **小改动（新增一条交互、修改某个操作反馈）**：定点修改对应章节，不动其他部分
- **大改动（结构重组、多个流程联动、旧交互被替代）**：全量重写，以当前原型的实际行为为准，确保文档可独立用于评审，不含任何「历史叠加」的残留描述

> 判断标准：读完文档能否独立复现原型所有交互？如果需要结合历史版本才能理解，说明文档需要全量刷新。

---

## interaction-spec.md 结构规范

> **原则**：交互评审和视觉评审是分开的。本文档**只记录操作流程、操作反馈和交互逻辑**，不涉及颜色、间距、圆角、阴影等视觉细节。

结构固定如下：

```markdown
# {功能名称} 交互逻辑

> **原型文件**：prototype.html  
> **设计目标**：一句话说明这个原型要验证什么

---

## 一、设计背景

<!-- 现有交互的问题是什么，为什么要改 -->

## 二、操作流程

<!-- Mermaid 流程图，节点只描述用户操作和系统跳转，不涉及视觉 -->

```mermaid
flowchart TD
    ...
```

## 三、交互规格

<!-- 用表格或列表描述每个操作节点的触发条件和系统反馈 -->

### {子功能或触发点}

| 用户操作 | 系统反馈 |
|----------|----------|
| ...      | ...      |

<!-- 有需要时补充状态机 -->

## 四、待讨论问题

- [ ] 问题描述
```

---

## 多方案对比规范

### prototype.html 顶部切换栏

每个 `prototype.html` 最顶部必须有一条固定的方案切换栏，样式与业务内容隔离（不影响业务区域布局）。

**切换栏要求：**
- 固定在页面顶部，不随内容滚动
- 显示所有方案的标签（方案 A / 方案 B / …，或更具语义的名称如「下拉菜单」/「侧边抽屉」）
- 高亮当前选中方案
- 切换时整个业务区域内容替换，切换栏本身保持不变

**切换栏 HTML 模板（复制使用）：**

```html
<!-- 方案切换栏：固定顶部，不属于业务区域 -->
<div id="variant-bar" style="
  position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
  height: 40px; background: #1a1a2e; display: flex; align-items: center;
  gap: 4px; padding: 0 16px; font-family: -apple-system, sans-serif;
">
  <span style="color:#888; font-size:12px; margin-right:8px;">方案对比：</span>
  <button class="v-tab active" onclick="switchVariant('a', this)">方案 A</button>
  <button class="v-tab" onclick="switchVariant('b', this)">方案 B</button>
</div>
<style>
  body { padding-top: 40px; } /* 为切换栏留出空间 */
  .v-tab {
    padding: 4px 14px; border-radius: 4px; border: none; cursor: pointer;
    font-size: 12px; background: transparent; color: #aaa;
  }
  .v-tab.active { background: #0047FD; color: #fff; }
  .v-tab:hover:not(.active) { background: rgba(255,255,255,0.1); color: #fff; }
  .variant { display: none; }
  .variant.active { display: contents; }
</style>
<script>
  function switchVariant(id, el) {
    document.querySelectorAll('.variant').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.v-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('variant-' + id).classList.add('active');
    el.classList.add('active');
  }
</script>

<!-- 方案 A 的业务内容 -->
<div id="variant-a" class="variant active">
  <!-- ... -->
</div>

<!-- 方案 B 的业务内容 -->
<div id="variant-b" class="variant">
  <!-- ... -->
</div>
```

### interaction-spec.md 多方案写法

有多个方案时，在「二、操作流程」和「三、交互规格」中按方案分节描述差异；
背景和待讨论问题仍写在共同区域。

```markdown
## 二、操作流程

### 方案 A — {方案名称}
<!-- 方案 A 的流程图 -->

### 方案 B — {方案名称}
<!-- 方案 B 的流程图 -->

## 三、交互规格

### 方案 A — {触发点}
| 用户操作 | 系统反馈 |
...

### 方案 B — {触发点}
| 用户操作 | 系统反馈 |
...

## 方案差异对比

| 维度 | 方案 A | 方案 B |
|------|--------|--------|
| ...  | ...    | ...    |
```

---

**不应该出现在本文档中的内容（放到视觉稿/设计稿）：**
- 颜色值、色号
- 具体像素、尺寸、间距
- 字体、字重、字号
- 阴影、圆角等视觉属性
- 动效曲线和时长（除非是关键的交互反馈时机）

---

## 制作原型的硬性约定

1. **上下文够用就动手**：有截图直接用截图，不强制读源码；确实需要了解现有逻辑时，只读最相关的文件
2. **文档先行**：在修改 HTML 之前，先在 `interaction-spec.md` 中更新对应规格，再实现
3. **不引入外部资源**：不使用 CDN 链接，图标用内联 SVG，字体用系统字体栈
4. **不污染主项目**：uxdemo 里的所有文件不得被主项目的任何 `import` 引用
5. **一个文件夹一个设计点**：不在同一个 prototype.html 里堆砌多个不相关的设计尝试
6. **新增原型必须同步更新主页**：每次新建一个原型文件夹，必须在同一次回复中在 `index.html` 的 `#protoList` 中追加对应的 `.card` 条目，包含原型名称、描述和方案标签（`badge`），无需用户提醒。
