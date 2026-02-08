# CM 桌面端架构说明

## 概述

CM 桌面端基于 **Tauri v2** 构建，使用 Rust 内核 + 系统原生 WebView 渲染前端界面。与 Web 端共享同一份 React 源码，通过平台检测模块 (`src/lib/platform.ts`) 实现差异化行为。

## 为什么选择 Tauri v2

| 指标 | Tauri v2 | Electron |
|------|----------|----------|
| 内存占用 | ~30-50MB | ~150-300MB |
| 安装包大小 | ~8-12MB | ~150MB+ |
| 渲染引擎 | 系统原生 WebView | 内置 Chromium |
| 后端语言 | Rust | Node.js |
| 启动速度 | 极快 | 较慢 |

## 架构设计

```
┌─────────────────────────────────────────────┐
│              Tauri 窗口容器                    │
│  ┌─────────────────────────────────────────┐ │
│  │         自定义标题栏 (TitleBar)           │ │
│  ├─────────────────────────────────────────┤ │
│  │                                         │ │
│  │         React 应用（共享源码）             │ │
│  │                                         │ │
│  │    fetch ──→ http://127.0.0.1:2778      │ │
│  │                                         │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  Rust 壳（tauri-plugin-updater, shell）       │
└─────────────────────────────────────────────┘
         │
         │ HTTP / WebSocket
         ▼
┌─────────────────────┐
│   CM 后端服务        │
│  (127.0.0.1:2778)   │
│   独立运行           │
└─────────────────────┘
```

## 关键模块

### 平台检测 (`src/lib/platform.ts`)

- `isTauri`: 检测 `window.__TAURI_INTERNALS__` 判断运行环境
- `API_BASE`: Web 模式为空（走 Vite proxy），Tauri 模式为 `http://127.0.0.1:2778`
- `isMacOS`: 区分操作系统，用于标题栏按钮布局
- 自动给 `<html>` 添加 `.tauri` class，供 CSS 做平台差异化样式

### 自定义标题栏 (`src/components/titlebar/TitleBar.tsx`)

- 仅在 `isTauri === true` 时渲染，Web 端零开销
- `data-tauri-drag-region` 实现窗口拖拽
- 调用 `@tauri-apps/api/window` 控制最小化/最大化/关闭
- macOS：左侧红绿灯风格按钮
- Windows：右侧标准按钮（最小化/最大化/关闭）
- 玻璃态背景 `bg-black/20 backdrop-blur-xl`
- `React.memo` 优化，避免不必要重渲染

### 自动更新 (`src/hooks/useAutoUpdate.ts`)

- 仅 Tauri 环境激活
- 使用 `@tauri-apps/plugin-updater` 检查更新
- 启动时检查一次，之后每 4 小时定时检查
- 提供 `downloadAndInstallUpdate()` 函数执行更新并重启

### API 层适配

- `src/api/client.ts`: `API_BASE` 从 `platform.ts` 导入
- `src/services/chat-api.ts`: 所有 `fetch` 调用加入 `API_BASE` 前缀
- 逻辑不变，仅 URL 来源不同

## Tauri 配置 (`src-tauri/`)

### `tauri.conf.json`

- `build.devUrl`: `http://localhost:5173`（复用 Vite dev server）
- `build.frontendDist`: `../dist`（复用 Vite 构建产物）
- `app.windows[0].decorations`: `false`（隐藏系统标题栏）
- `app.security.csp`: 允许连接 `127.0.0.1:2778`
- `bundle`: Windows (NSIS) + macOS (DMG) 打包配置
- `plugins.updater`: 自动更新端点（需配置后生效）

### `capabilities/default.json`

声明桌面端所需权限：
- 窗口控制（关闭、最小化、最大化、拖拽）
- 自动更新（检查、下载安装）
- Shell（打开外部链接）

### Rust 入口 (`src/lib.rs`)

初始化 Tauri 运行时，注册 updater 和 shell 插件，启动主窗口。

## 开发工作流

| 命令 | 说明 |
|------|------|
| `npm run dev` | Web 开发（Vite dev server） |
| `npm run tauri:dev` | 桌面端开发（Vite + Tauri 窗口，热重载） |
| `npm run build` | Web 生产构建 → `dist/` |
| `npm run tauri:build` | 桌面端生产构建 → `src-tauri/target/release/bundle/` |

## 构建前提

### Windows
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)（Windows 10/11 通常已预装）
- [Rust](https://rustup.rs/)
- Visual Studio C++ Build Tools

### macOS
- Xcode Command Line Tools
- [Rust](https://rustup.rs/)

## 自动更新配置

1. 在 `src-tauri/tauri.conf.json` 的 `plugins.updater` 中配置：
   - `endpoints`: 更新检查 URL 列表
   - `pubkey`: 用于验证更新包签名的公钥
2. 使用 `tauri signer generate` 生成签名密钥对
3. 构建时使用 `TAURI_SIGNING_PRIVATE_KEY` 环境变量签名

## 注意事项

- 桌面端后端服务需独立启动，应用本身不管理后端生命周期
- 图标文件位于 `src-tauri/icons/`，可替换 `app-icon.png` 后重新运行 `npx @tauri-apps/cli icon` 生成
- macOS 上 WKWebView 对 Monaco Editor 的支持需 Monaco 0.45+ 版本（当前使用 0.55.1，兼容）
