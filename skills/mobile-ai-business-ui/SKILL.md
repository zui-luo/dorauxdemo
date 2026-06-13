---
name: mobile-ai-business-ui
description: Use when designing or revising mobile UI prototypes for enterprise AI assistants, Dora-style super agents, business dashboards, resource libraries, and multi-agent business workflows in uxdemo. Applies a modern blue-cyan enterprise AI visual style with compact data cards, AI insight modules, bottom business navigation, and simple user paths for sales, operations, and leadership users.
---

# Mobile AI Business UI

Use this skill for mobile prototypes that should feel like a modern enterprise AI app rather than a traditional admin app. It is especially suited for Dora as a super-agent, resource-library browsing, business dashboards, sales/operations insights, and AI-generated reports.

## Product Mindset

- Treat **Dora as the primary enterprise AI入口**: users ask Dora, Dora coordinates experts and context.
- Treat **资源库 as the second core入口**: users find dashboards, reports, documents, PPTs, forecast systems, and reusable outputs.
- Treat **expert agents as capabilities behind Dora**, not always as a primary navigation equal to Dora.
- Optimize for business users: first-line sales, operations managers, and leadership should understand the screen without learning Agent architecture.

## Visual Direction

Reference mood: cloud-operation cockpit, small-screen executive dashboard, Dora insight card.

- Use a clean white or very light blue-gray app base.
- Use high-saturation blue as the primary brand color, with cyan/teal as AI/data accent.
- Use soft blue gradients for hero/Dora insight areas, not dark sci-fi surfaces.
- Cards should feel airy, rounded, and business-grade; prefer subtle borders and soft shadows.
- Make key AI/Dora modules visually more vivid than ordinary data cards.
- Use compact KPI cards, mini charts, progress bars, segmented controls, and list rows.
- Avoid old mobile admin patterns: heavy top nav, dense tables, gray list-only screens, many equal-weight tabs.

## Recommended App IA

Prefer this hierarchy for enterprise Dora mobile:

1. **Dora**: primary ask/task entry, voice input, recent tasks, AI insight.
2. **资源库**: dashboards, documents, generated reports, PPT, forecast systems.
3. Optional **工作台 / 我的**: running tasks, notifications, personal outputs.

Only expose **专家 / 能力** as a major tab if the user explicitly needs direct expert discovery. Otherwise:

- Put experts under “Dora 的业务能力”.
- Support `@智能问数` / `@智能报告` inside Sender.
- Show “Dora 正在调用智能报告 / 财务助手” during execution.

## Page Patterns

### Dora Home

Use a cockpit-like first screen:

- Header: logo/name + notification/settings if needed.
- Greeting: personalized and business-contextual, e.g. “早上好，王总”.
- KPI strip: 3-4 compact business metrics, each with trend.
- Dora insight card: prominent gradient/AI card with today’s suggested insight.
- Business capability grid: 2-column cards for common tasks, e.g. 招商管理、经营分析、会员运营.
- Reminder/task list: alerts, expiring contracts, anomalies.
- Bottom nav: simple business destinations.

Do not lead with a generic empty chat page unless the product is purely conversational.

### Dora Insight / Analysis Page

Use a centered mobile report flow:

- Page title: “Dora AI 智能洞察” or current analysis title.
- Hero card: Dora/robot avatar + analysis title + update time.
- Stacked insight cards: 客流趋势、营收预测、异常预警.
- Each card should combine text and a small visual: line chart, percentage, warning chip.
- Suggestions: one or two CTA buttons, e.g. “查看详细客流报告”, “生成能耗优化方案”.
- Sender at bottom: “向 Dora 提问...” with microphone/send.
- Optional horizontal chips for analysis categories.

### Resource Detail

When previewing an artifact such as dashboard/report/forecast system:

- Header should be minimal: back, title, save/download.
- Avoid secondary text under title unless essential.
- Main content should look like the artifact itself, not a generic placeholder.
- For business dashboards: include summary hero, KPI grid, trend chart, breakdown section, risks/actions.
- Put “去问 Dora” as a vivid bottom CTA that opens a drawer; do not keep chat permanently embedded in the content.

### Resource Library

Use “find business assets” rather than file-manager aesthetics:

- Search by name, source conversation, owner/agent.
- Filter chips: 仪表盘、报告、PPT、文档、预测系统.
- Cards should show artifact type, business title, source, last update, and a small visual/icon.
- Prioritize recent/frequently used business assets.

## Component Rules

- KPI cards: small title, large value, trend line; 2-column grid on phone.
- AI insight card: gradient background, Dora/avatar, concise insight, one CTA.
- Business module card: colored icon tile + module name + 1-line scope.
- Alert row: status dot/icon, business title, urgency label, time.
- Charts: simple line/bar/donut mockups; avoid decorative charts that do not map to business meaning.
- Bottom nav: 3-4 items max. Use labels that match business tasks, not internal system nouns.
- Voice input: use a microphone icon, not a music/audio icon.
- Drawer triggers: use upward arrow or “展开” affordance when a bottom drawer will open.

## Visual Tokens

Use as guidance, not mandatory exact values:

- Brand blue: `#0B63FF`, deep blue `#0047FD`
- Cyan/teal: `#12C8C8`, green `#18A982`
- Warning orange: `#FF8A2A`, danger red `#F5483B`
- Background: `#F6F9FF` / `#F7F8FA`
- Card: white with `#E6ECF5` border and soft shadow
- Hero gradient: blue to cyan/teal, with subtle translucent highlight
- Radius: cards 14-20px; CTA pill 999px

Avoid one-note palettes. Blue can dominate, but pair it with cyan/green/orange status colors.

## Interaction Rules

- Keep main paths simple: ask Dora, open resource, view task/result.
- Avoid asking users to choose an expert first unless they already know what they want.
- Use drawers for secondary flows: file list, asset picker, artifact chat, agent switch.
- Drawer height should remain stable when switching tabs inside it.
- Do not let prototype control bars overlay or occupy the phone mock screen; put review controls outside the device frame.
- For business users, show generated outputs as concrete artifacts: report, PPT, dashboard, forecast system.

## When Revising Existing Mobile Prototype

1. Identify whether the screen is Dora-first, resource-first, or task/workbench-first.
2. Remove low-value structural UI that makes it feel like old admin software.
3. Increase business meaning: replace placeholders with realistic KPIs, forecasts, rules, alerts, and actions.
4. Make Dora visually present as an AI insight/coordinator, not only a nav label.
5. Preserve simple operations: ask, search, open, save, download, share, continue with Dora.

## Quality Check

Before finishing, verify:

- First screen communicates what the business user can do in 5 seconds.
- Dora and resource library feel like the two strongest user paths.
- Expert agents are discoverable but not overexposed.
- Key data cards and AI cards use meaningful business content.
- Voice icon is a microphone.
- Bottom drawer triggers have clear affordance.
- The page looks like a modern AI business app, not a gray mobile admin panel.
