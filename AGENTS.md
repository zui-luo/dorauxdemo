# uxdemo Agent Guide

本文件约束 `uxdemo/` 目录及其所有子目录内的 AI 修改行为。

---

## 工作区定位

- `uxdemo/` 是**设计评审用交互原型工作区**，不是主产品代码。
- 这里的交付物是**可直接打开的原型 HTML** 与其配套的**交互逻辑文档**。
- 目标是准确表达**交互流程、状态切换、异常分支与方案差异**，不是产出可复用的生产代码。

---

## 目录约定

- 一个设计点对应一个子文件夹，目录名使用**小写连字符**，例如 `skill-upload`、`agent-config-flow`
- 默认每个原型文件夹包含：
  - `prototype.html`
  - `interaction-spec.md`
- `templates/` 只作为模板来源，不承载具体原型内容
- 当前 `custom-skill-entry/` 属于已知例外，可保留多个原型 HTML

---

## 工作流程

- **够用就停**：优先基于需求、截图、现有原型修改；需要读源码时只读当前设计点相关文件。
- **判断前置**：涉及入口、流程、状态、页面结构时，先用 `uxdemo/skills/interaction-design/SKILL.md` 做快速判断；不要展开长篇复盘。
- **文档同步**：修改原型交互时，同步更新对应 `interaction-spec.md`；文档只写当前结果态。
- **经验沉淀**：只有用户明确要求或同类问题反复出现时，才更新 `uxdemo/skills/interaction-design/`。
- **新增原型**：新增原型文件夹时，同步更新 `uxdemo/index.html` 和 `uxdemo/README.md`。

---

## HTML 原型硬性约束

- 必须为**单文件自包含 HTML**
- 所有 CSS、JS 必须内联
- 禁止引入 CDN、外部脚本、外部样式、外部字体
- 图标优先使用内联 SVG
- 字体使用系统字体栈
- 页面顶部必须保留**方案切换栏**
- 即使只有一个方案，也保留切换栏结构
- 关键状态必须可通过原型内 JS 演示，例如 loading、error、empty、disabled、success
- Mock 数据要有真实感，禁止使用明显占位文案

---

## 演示控件约束

- 所有不属于最终用户界面的辅助按钮、状态切换器、场景跳转器等，必须添加 `class="demo-control"`
- `.demo-control` 默认隐藏，只能通过切换栏中的“交互说明”开关显示
- 不要把演示控件混入正式业务区域视觉层级

---

## interaction-spec 文档约束

- 文档只记录：
  - 操作流程
  - 状态变化
  - 系统反馈
  - 异常分支
  - 方案差异
- 文档默认面向**设计评审结果**，应直接描述“当前设计是什么”
- 除非用户明确要求保留变更说明，否则不要写“原来 / 之前 / 不再 / 改为 / 从 A 变成 B”这类变更叙述
- 评审场景下，优先使用结果态表达，例如“入口位于对话页右上角”，不要写“入口不再放在侧边栏，而是放在右上角”
- 文档不要记录：
  - 颜色值
  - 像素尺寸
  - 圆角阴影
  - 非关键动效参数
- 结构默认遵循 `uxdemo/templates/interaction-spec-template.md`
- 评审摘要放在 `## 零`
- 完整规格从 `## 一` 开始

---

## 与主项目隔离

- `uxdemo/` 内文件不得被主项目代码 `import`
- 不要把 `uxdemo/` 原型改造成 React、Vite、TypeScript 或其他构建产物
- 不要为了原型修改主项目业务代码，除非用户明确要求

---

## 修改前自检

在提交 `uxdemo/` 相关改动前，默认检查：

- 原型 HTML 是否仍为单文件可打开形式
- `prototype.html` 与 `interaction-spec.md` 是否一致
- 新增原型时 `index.html` 与 `README.md` 是否已同步
- 演示控件是否都带有 `.demo-control`
- 是否误引入了外部资源或主项目依赖

---

## 参考文档

- 工作区说明：`uxdemo/CLAUDE.md`
- 文档模板：`uxdemo/templates/interaction-spec-template.md`
- 切换栏模板：`uxdemo/templates/variant-bar.html`
