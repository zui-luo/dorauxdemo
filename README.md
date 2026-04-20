# Dora UX Demo

交互原型集合，用于设计评审。每个原型为自包含的单 HTML 文件，双击即可在浏览器打开，无需任何构建环境。

**在线预览：** https://zui-luo.github.io/dorauxdemo/

---

## 原型列表

| 原型 | 描述 | 文件 |
|------|------|------|
| 自定义技能入口 · 跳转方案 | 前后台通过页面覆盖切换 | `custom-skill-entry/prototype.html` |
| 自定义技能入口 · 新 Tab 方案 | 前后台通过模拟浏览器 Tab 切换 | `custom-skill-entry/prototype-newtab.html` |

---

## 目录结构

```
uxdemo/
├── index.html                       # 原型导航主页
├── CLAUDE.md                        # AI 协作工作区指南
├── README.md                        # 本文件
└── custom-skill-entry/
    ├── prototype.html               # 跳转方案原型
    ├── prototype-newtab.html        # 新 Tab 方案原型
    └── interaction-spec.md          # 交互逻辑文档
```

---

## 本地查看

直接双击任意 `.html` 文件，或用浏览器打开：

```bash
open uxdemo/index.html
```

---

## 部署到 GitHub Pages

仓库地址：`git@github.com:zui-luo/dorauxdemo.git`

```bash
# 首次设置（已完成，无需重复）
git init
git remote add origin git@github.com:zui-luo/dorauxdemo.git

# 日常推送
git add .
git commit -m "描述本次变更"
git push
```

GitHub Pages 从 `main` 分支根目录部署，推送后约 1–2 分钟生效。

启用方式：仓库 Settings → Pages → Source 选 `Deploy from a branch`，Branch 选 `main / (root)`。

---

## 新增原型

1. 在 `uxdemo/` 下新建文件夹，命名规则：`feature-name`（小写连字符）
2. 在文件夹内创建 `prototype.html` 和 `interaction-spec.md`
3. **同步更新 `index.html`**，在 `#protoList` 中追加对应的卡片条目
4. 推送到 GitHub

详见 `CLAUDE.md` 中的完整工作流规范。
