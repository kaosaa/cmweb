# CM (Claude Manager) - Web 界面

> Claude Code CLI 的现代化 Web 管理界面

## 项目简介

CM (Claude Manager) 是一个为 Claude Code CLI 设计的本地 Web 界面，提供了直观、现代化的聊天交互体验。通过这个界面，用户可以更便捷地与 Claude AI 进行交互，管理对话历史，查看工具调用详情等。

## 技术栈

### 核心框架
- **React 19** - 最新版本的 React 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 快速的前端构建工具

### UI 组件库
- **Tailwind CSS 4** - 实用优先的 CSS 框架
- **Radix UI** - 无样式、可访问的 UI 组件库
- **Lucide React** - 精美的图标库
- **Motion** - 流畅的动画库

### 功能特性
- **Monaco Editor** - VS Code 同款代码编辑器
- **SignalR** - 实时通信支持
- **React Markdown** - Markdown 渲染
- **Shiki** - 代码语法高亮
- **Xterm.js** - 终端模拟器

## 项目结构

```
web/
├── src/
│   ├── api/                    # API 客户端和类型定义
│   ├── components/             # React 组件
│   │   ├── animate-ui/         # 动画 UI 组件
│   │   │   ├── components/     # 组合组件
│   │   │   └── primitives/     # 基础组件
│   │   ├── chat/               # 聊天相关组件
│   │   │   └── messages/       # 消息展示组件
│   │   ├── directory-picker/   # 目录选择器
│   │   ├── tool-auth/          # 工具授权组件
│   │   └── ui/                 # 通用 UI 组件
│   ├── hooks/                  # 自定义 React Hooks
│   ├── lib/                    # 工具库
│   ├── services/               # 业务服务层
│   ├── types/                  # TypeScript 类型定义
│   ├── utils/                  # 工具函数
│   ├── ChatApp.tsx             # 主应用组件
│   └── main.tsx                # 应用入口
├── public/                     # 静态资源
├── index.html                  # HTML 入口
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TypeScript 配置
├── tailwind.config.js          # Tailwind CSS 配置
└── package.json                # 项目依赖配置
```

## 主要功能模块

### 1. 聊天界面 (`components/chat/`)
- **ChatAppView** - 主聊天视图容器
- **ChatComposer** - 消息输入编辑器
- **ChatSidebar** - 侧边栏导航
- **ChatMessageList** - 消息列表展示
- **ChatMessagesPanel** - 消息面板容器

### 2. 消息展示 (`components/chat/messages/`)
- **ChatMarkdown** - Markdown 消息渲染
- **ChatDiffView** - 代码差异对比视图
- **ChatToolCard** - 工具调用卡片
- **ToolPayloadView** - 工具参数展示

### 3. UI 组件 (`components/animate-ui/`)
- **按钮组件** - 带动画效果的按钮
- **主题切换器** - 深色/浅色模式切换
- **特效组件** - 高亮、粒子等视觉效果
- **Radix 组件** - 基于 Radix UI 的封装组件

### 4. 工具授权 (`components/tool-auth/`)
- 管理 AI 工具的权限控制
- 提供安全的工具调用授权机制

### 5. 目录选择器 (`components/directory-picker/`)
- 本地文件系统目录选择
- 工作区管理

## 样式设计

### 设计风格
- **现代简约** - 清爽的界面设计，注重内容展示
- **深色模式** - 支持深色/浅色主题切换
- **响应式布局** - 适配不同屏幕尺寸
- **流畅动画** - 使用 Motion 库实现自然的过渡效果

### 布局结构
```
┌─────────────────────────────────────────┐
│           顶部导航栏                      │
├──────────┬──────────────────────────────┤
│          │                              │
│  侧边栏   │        主聊天区域             │
│          │                              │
│  - 对话  │  ┌────────────────────────┐  │
│  - 历史  │  │                        │  │
│  - 设置  │  │    消息列表区域         │  │
│          │  │                        │  │
│          │  └────────────────────────┘  │
│          │  ┌────────────────────────┐  │
│          │  │    消息输入编辑器       │  │
│          │  └────────────────────────┘  │
└──────────┴──────────────────────────────┘
```

## 开发指南

### 安装依赖
```bash
# 使用 npm
npm install

# 或使用 pnpm（推荐）
pnpm install

# 或使用 bun
bun install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 类型检查
```bash
npm run typecheck
```

### 代码检查
```bash
npm run lint
```

### 运行测试
```bash
npm run test
```

## 特色功能

### 1. 实时通信
使用 SignalR 实现与后端的实时双向通信，确保消息即时传递。

### 2. 代码高亮
集成 Shiki 语法高亮器，支持多种编程语言的代码展示。

### 3. Markdown 支持
完整的 Markdown 渲染支持，包括 GFM（GitHub Flavored Markdown）扩展。

### 4. 代码编辑器
内置 Monaco Editor，提供与 VS Code 相同的编辑体验。

### 5. 工具调用可视化
清晰展示 AI 工具的调用过程、参数和结果。

### 6. 主题定制
支持深色/浅色主题切换，提供舒适的视觉体验。

## 浏览器支持

- Chrome/Edge (推荐)
- Firefox
- Safari

## 许可证

本项目遵循相应的开源许可证。

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**注意**: 本项目需要配合 Claude Code CLI 后端服务使用。
