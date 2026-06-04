---
name: interaction-design
description: Use when designing, reviewing, or revising UX flows, prototypes, interaction specs, information architecture, entry placement, state expression, or user task flows in `uxdemo/`. Helps decide object ownership, UI entry level, interaction weight, primary path, and whether a design creates the right user mental model before modifying prototypes or specs. Covers two sedimentation layers — design principles (judgment-shaping) in `references/example-principles.md` and execution conventions (toast / error / confirmation patterns) in `references/conventions.md`.
---

# Interaction Design

用于 `uxdemo/` 原型设计前的**快速交互判断**。默认只做简短判断，不展开长篇方法论。

## 核心原则

> UI 入口的位置会定义用户对对象作用范围的理解；入口放错层级，即使功能可用，心智也是错的。

## 快速判断

改原型前只问 4 个问题：

- **对象是什么**：资产 / 运行态 / 配置态 / 命令 / 一次性操作？
- **属于哪一层**：全局 / 组织 / 空间 / 页面 / 模块 / 局部操作？
- **主路径是什么**：当前页面最重要的用户任务是什么？
- **UI 要多重**：弱提示、按钮、弹窗、抽屉、页面，哪一个足够？

在动手前，还必须补 4 个页面级判断：

- **页面类型是什么**：这是列表页 / 配置页 / 详情页 / 工作台 / 说明页中的哪一种？
- **主任务是什么**：用户进来是查看、配置、分配、管理，还是阅读说明？
- **主对象是什么**：当前要管理的是人、角色、资源、规则、记录，还是权限项？
- **套什么成熟模型**：优先套用列表管理、左列表右详情、配置面板、向导流程等成熟界面模型。

如果这 4 项还没想清楚，不要直接进入高保真实现。

## 常用判断

- **归属先于可达**：先判断对象属于哪里，再决定哪里需要入口。
- **位置暗示范围**：用户会用入口位置判断对象作用范围。
- **资产不等于运行态**：对象归属入口与当前生效状态应分开表达，不要混在同一个入口里。
- **主路径优先**：低频管理能力不要压过当前任务。
- **轻重匹配**：能用 chip / 弹窗解决的，不先做成整页或常驻面板。
- **先定骨架再补细节**：先确定页面结构与主任务，再补数据、文案、状态、交互说明。
- **文档不是页面**：产品文档、权限说明、规则表默认是页面设计依据，不应直接照搬成页面主体。
- **典型场景优先复用成熟模型**：遇到管理、配置、分配、审批、检索这类常见场景时，默认先套成熟心智模型，不先自由发挥成说明页或概念页。

## 交互说明标注

原型默认使用“交互说明开关 + 目标容器边框高亮 + hover 说明气泡”表达评审说明。

- **标关键变化**：只标入口位置、流程分支、状态切换、异常处理、方案差异、视角差异。
- **不标视觉微调**：不要标颜色、圆角、阴影、间距、字号等纯视觉细节。
- **浮层不占位**：方案切换栏、交互说明入口和演示控件必须是 fixed 浮层，不得通过 `body padding`、业务容器 margin、sticky top 偏移等方式为说明控件让位。
- **控件靠入口**：场景跳转、状态切换等演示控件应以 popover 形式悬浮在“交互说明”入口附近，不进入主内容区。
- **高亮对象**：小图标高亮可点击热区，大模块高亮语义容器，让评审者直接建立“说明 ↔ UI”的对应关系。
- **避免外置标号**：不要把小圆点、数字标记放到容器外侧，避免被 `overflow`、滚动区、弹窗或卡片边界裁切。
- **一句话说明**：tooltip 使用结果态短句，说明“这里当前是什么设计”，避免写实现细节。
- **气泡走顶层**：tooltip 必须渲染到页面顶层浮层，而不是作为局部容器的子节点直接展开；不能被 `overflow`、`transform` 或局部 `z-index` 裁切。
- **不干扰体验**：开启或关闭“交互说明”都不得改变业务页面原始布局、滚动位置、sticky/fixed 定位和可视区域；关闭后所有高亮、说明气泡和演示控件必须不可见。
- **复用模板**：实现优先复制 `uxdemo/templates/interaction-annotations.html`，不要每次重新发明样式。

## 输出要求

除非用户要求复盘，输出和行动保持简洁：

- 先用 1-3 句话说明判断结论，至少包含页面类型、主任务、主对象。
- 如果结构还不稳定，先给低保真方向，再继续实现。
- 然后再修改原型和 `interaction-spec.md`。
- `interaction-spec.md` 只写当前设计结果，不写“原来 / 不再 / 改为”等变更历史。

## 沉淀规则

设计判断按三层组织，写入路径不同：

- **原则层**（`references/example-principles.md`）：帮助*判断*的元规则。仅在用户发起「提炼回合」时更新，不主动改写。
- **规范层**（`references/conventions.md`）：直接*执行*的交互套路。用户口述成熟套路即可直接写入，无需经过案例沉淀。
- **决策层**（各原型文件夹下的 `decision-log.md`）：案例级判断留痕。**仅当**用户使用触发短语「记进决策手册」「提炼这个决策」时按 `templates/decision-log-template.md` 追加。

完整协议（包括三层之间的关系、提炼回合流程）见 `uxdemo/AGENTS.md` 的「决策沉淀协议」章节。

工作区规则写进 `uxdemo/AGENTS.md` 或具体 `interaction-spec.md`，不进本 skill。
