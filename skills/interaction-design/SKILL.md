---
name: interaction-design
description: Use when designing, reviewing, or revising UX flows, prototypes, interaction specs, information architecture, entry placement, state expression, or user task flows in `uxdemo/`. Helps decide object ownership, UI entry level, interaction weight, primary path, and whether a design creates the right user mental model before modifying prototypes or specs.
---

# Interaction Design

用于 `uxdemo/` 原型设计前的**快速交互判断**。默认只做简短判断，不展开长篇方法论。

## 核心原则

> UI 入口的位置会定义用户对对象作用范围的理解；入口放错层级，即使功能可用，心智也是错的。

## 快速判断

改原型前只问 4 个问题：

- **对象是什么**：资产 / 运行态 / 配置态 / 命令 / 一次性操作？
- **属于哪一层**：全局 / 用户 / 工作区 / Agent / 会话 / 消息 / 当前操作？
- **主路径是什么**：当前页面最重要的用户任务是什么？
- **UI 要多重**：弱提示、按钮、弹窗、抽屉、页面，哪一个足够？

## 常用判断

- **归属先于可达**：先判断对象属于哪里，再决定哪里需要入口。
- **位置暗示范围**：用户会用入口位置判断对象作用范围。
- **资产不等于运行态**：资产放归属入口，当前生效状态放任务附近轻量表达。
- **主路径优先**：低频管理能力不要压过当前任务。
- **轻重匹配**：能用 chip / 弹窗解决的，不先做成整页或常驻面板。

## 入口层级速查

| 对象归属 | 推荐入口 |
| --- | --- |
| 用户资产 | 用户入口 / 前台壳层 / 个人库 |
| Agent 能力或配置 | Agent 详情 / Agent 配置 |
| 当前会话运行态 | 会话区 / 输入框附近弱提示 |
| 消息级动作 | 消息卡片 / 消息工具栏 |
| 当前操作 | 行内控件 / 局部工具栏 |

## 输出要求

除非用户要求复盘，输出和行动保持简洁：

- 先用 1-3 句话说明判断结论。
- 然后直接修改原型和 `interaction-spec.md`。
- `interaction-spec.md` 只写当前设计结果，不写“原来 / 不再 / 改为”等变更历史。

## 沉淀规则

- 只有当用户明确要求，或同类错误反复出现时，才更新本 skill。
- 原则写进本 skill；项目规则写进 `uxdemo/AGENTS.md` 或具体 `interaction-spec.md`。
