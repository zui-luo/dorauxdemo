# Dora Mobile 新 UX 视觉规范

本规范用于指导 AI 生成或修改 `uxdemo/dora-mobile-newux` 项目中的 UI。规范只约束配色、填充、圆角、阴影、图表色、状态色和视觉质感，不约束页面布局。

## 1. 整体风格

页面应保持清爽、轻量、智能感和业务数据感。整体使用浅色背景、白色卡片、蓝紫主色，以及少量绿色、橙色、红色状态色。

避免：

- 大面积深色背景
- 高饱和撞色
- 过重阴影
- 复杂纹理背景
- 暖色系主导页面
- 大面积纯紫或纯蓝背景

## 2. 页面背景

页面底色使用极浅冷色，不使用纯白作为整页背景。

```css
--page-bg: #f6f8ff;
--page-bg-soft: #f7f9ff;
```

推荐：

```css
background: #f6f8ff;
```

需要弱氛围感时，可使用非常轻的蓝紫渐变：

```css
background: linear-gradient(180deg, #f7f9ff 0%, #f4f7ff 100%);
```

## 3. 主色

主品牌色使用蓝紫色，不使用纯蓝或纯紫单色主导页面。

```css
--color-primary: #5268ff;
--color-primary-hover: #3f56f6;
--color-primary-active: #354be8;
--color-primary-light: #eef2ff;
```

适用场景：

- 导航选中态
- 主按钮
- 重点标题
- 图表主序列
- 强调数字
- 当前步骤或当前状态

## 4. 卡片填充

普通内容卡片使用白色或近白色填充。

```css
--card-bg: #ffffff;
--card-bg-soft: #f8fbff;
```

普通卡片：

```css
background: #ffffff;
```

图表或预览类容器可使用浅蓝灰渐变：

```css
background: linear-gradient(180deg, #f8fbff 0%, #f3f7ff 100%);
```

指标卡可使用浅色渐变，增强层次但保持克制：

```css
background: linear-gradient(135deg, #eef4ff 0%, #ffffff 100%);
```

绿色强调卡：

```css
background: linear-gradient(135deg, #e7fff7 0%, #ffffff 100%);
```

蓝色强调卡：

```css
background: linear-gradient(135deg, #eaf7ff 0%, #ffffff 100%);
```

## 5. 强调渐变

主强调区域可使用蓝色到蓝紫的渐变。

```css
--gradient-primary: linear-gradient(135deg, #4aa3ff 0%, #5268ff 100%);
```

图标背景可小面积使用渐变，不要大面积铺满页面。

蓝紫图标：

```css
background: linear-gradient(135deg, #8b6cff 0%, #5268ff 100%);
```

绿色图标：

```css
background: linear-gradient(135deg, #6df2a2 0%, #28d7a3 100%);
```

橙色图标：

```css
background: linear-gradient(135deg, #ffc978 0%, #ff9f37 100%);
```

蓝色图标：

```css
background: linear-gradient(135deg, #20b9ff 0%, #2878ff 100%);
```

## 6. 文字颜色

正文文本需要清晰，不使用过浅灰色承载主要信息。

```css
--text-primary: #111827;
--text-secondary: #4b5563;
--text-tertiary: #8a94a6;
--text-inverse: #ffffff;
--text-primary-blue: #2548d8;
```

使用规则：

- 页面标题、卡片标题：`#111827`
- 模块标题、强调标题：`#2548d8`
- 辅助说明：`#4b5563`
- 弱信息、表头、坐标轴：`#8a94a6`
- 深色或渐变背景上的文字：`#ffffff`

## 7. 状态色

状态色只用于涨跌、标签、提示和轻量反馈，不作为页面主色。

```css
--color-success: #20c997;
--color-success-bg: #defaf0;

--color-danger: #ff4d6d;
--color-danger-bg: #ffe8ee;

--color-warning: #ffb020;
--color-warning-bg: #fff3d8;

--color-info: #5268ff;
--color-info-bg: #eef2ff;
```

使用规则：

- 上升、完成、成功：绿色
- 下降、异常、延期：红色
- 预警、待处理：橙色
- 正常、默认状态：蓝紫色

## 8. 边框与分割线

边框应轻，不使用深色描边。

```css
--border-light: #edf1f7;
--border-default: #e5eaf3;
```

表格、图表网格线、卡片内部分隔线使用浅灰蓝：

```css
border-color: #edf1f7;
```

## 9. 阴影

阴影应轻柔，用于制造轻微悬浮感。普通卡片可以无阴影，仅依靠白色填充和页面背景区分层级。

普通浮层或卡片：

```css
box-shadow: 0 8px 24px rgba(82, 104, 255, 0.08);
```

强调卡片：

```css
box-shadow: 0 10px 28px rgba(82, 104, 255, 0.18);
```

避免：

- 黑色重阴影
- 多层复杂投影
- 过强的玻璃拟态阴影

## 10. 圆角

整体圆角偏柔和，但不要过度胶囊化。

```css
--radius-card: 12px;
--radius-control: 8px;
--radius-tag: 999px;
```

使用规则：

- 卡片：`12px`
- 按钮、输入框、选择器：`8px`
- 状态标签、chip：`999px`

## 11. 图表配色

图表使用清爽的蓝紫和绿色作为主要序列色。

```css
--chart-blue: #5268ff;
--chart-green: #20c997;
--chart-purple: #7b61ff;
--chart-cyan: #2db7f5;
--chart-orange: #ffb020;
--chart-grid: #e8edf5;
```

地图填色使用浅蓝到蓝紫渐变。

```css
--map-light: #dfe8ff;
--map-mid: #9fb6ff;
--map-strong: #5268ff;
```

避免：

- 图表颜色过多
- 红绿大面积同时出现
- 高饱和纯色柱状图
- 黑色坐标轴
- 超过 5 个高饱和序列色

## 12. 表格样式

表头使用极浅蓝灰背景。

```css
background: #f4f7ff;
color: #8a94a6;
```

表格分割线：

```css
border-color: #edf1f7;
```

表格正文：

```css
color: #111827;
```

## 13. AI 分析区

AI 分析、建议、洞察类区域可使用浅蓝紫渐变，体现智能感，但保持克制。

```css
background: linear-gradient(135deg, #eef7ff 0%, #f8f2ff 100%);
border: 1px solid rgba(82, 104, 255, 0.12);
```

内部内容区可使用白色或半透明白色：

```css
background: rgba(255, 255, 255, 0.75);
```

重点文字：

- 蓝色强调：`#5268ff`
- 红色负向：`#ff4d6d`
- 绿色正向：`#20c997`

## 14. 按钮样式

主按钮使用蓝紫渐变或主色填充。

```css
background: linear-gradient(135deg, #5268ff 0%, #6c5cff 100%);
color: #ffffff;
box-shadow: 0 6px 16px rgba(82, 104, 255, 0.24);
```

次级按钮使用白底浅描边。

```css
background: #ffffff;
border: 1px solid #e5eaf3;
color: #4b5563;
```

危险操作按钮只在必要时使用红色，不大面积铺色：

```css
color: #ff4d6d;
background: #ffe8ee;
```

## 15. 移动端输入区质感

Sender、搜索框、底部 Sheet 输入区应保持轻量、柔和、可触达。

输入容器：

```css
background: rgba(255, 255, 255, 0.92);
border: 1px solid #e5eaf3;
box-shadow: 0 8px 24px rgba(82, 104, 255, 0.08);
```

底部固定区域可使用轻微背景模糊和渐变过渡：

```css
background: linear-gradient(180deg, rgba(246, 248, 255, 0) 0%, #f6f8ff 32%, #f6f8ff 100%);
```

## 16. 禁止事项

AI 生成页面时应避免：

- 使用大面积纯紫、纯蓝、纯黑背景
- 使用厚重黑色阴影
- 使用强烈玻璃拟态或复杂毛玻璃
- 使用高饱和红色作为大面积背景
- 使用过多渐变色堆叠
- 使用深色边框
- 使用暖色作为主视觉基调
- 使用超过 5 个高饱和图表颜色
- 使用明显偏营销页的装饰性视觉
- 为了装饰添加与业务无关的大面积插画或背景图

