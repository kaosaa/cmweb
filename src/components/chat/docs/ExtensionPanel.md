# ExtensionPanel — 右侧扩展面板

## 职责

在聊天界面右侧提供固定面板，显示当前会话信息和工作目录的文件浏览器。

## 组件结构

```
ExtensionPanel (aside, 固定定位, 280px / 折叠态 40px)
├── 面板头部
│   ├── 会话标题 (activeSession.title)
│   ├── 模型名称 + thinking 状态指示点
│   ├── 工作目录路径 + 在资源管理器中打开 / 刷新按钮
│   └── 折叠按钮
└── 文件树区域 (可滚动)
    └── Files / FolderItem / FolderTrigger / FolderContent / FileItem
        递归渲染，文件夹展开时懒加载子目录内容
```

## Props

| Prop | 类型 | 说明 |
|------|------|------|
| `activeSession` | `ChatSession \| null` | 当前活跃会话 |
| `activeModel` | `string` | 当前模型名称 |
| `thinking` | `boolean` | 是否启用 extended thinking |
| `isOpen` | `boolean` | 面板是否展开 |
| `onToggle` | `() => void` | 切换展开/折叠 |

## 依赖

- **`useFileExplorer`** (`src/hooks/use-file-explorer.ts`) — 管理文件树懒加载状态
- **`api.fs.listEntries`** (`src/api/client.ts`) — 获取目录内容
- **`api.fs.revealInExplorer`** (`src/api/client.ts`) — 在系统资源管理器中打开
- **Files 组件族** (`src/components/animate-ui/components/radix/files.tsx`) — 文件树 UI

## 内部子组件

- **`DirectoryContents`** — 渲染一层目录内容（文件夹在前，文件在后）
- **`LazyFolder`** — 单个文件夹节点，展开时从缓存读取或显示 loading

## 数据流

1. `activeSession.cwd` → `useFileExplorer(cwd)` 自动加载根目录
2. 用户展开文件夹 → `Files.onOpenChange` → `useFileExplorer.onOpenChange` → 检测新展开路径 → `api.fs.listEntries` 懒加载
3. 加载结果写入 `DirCache`，触发重渲染显示子内容
4. 切换会话 → `cwd` 变化 → 缓存清空，重新加载新根目录

## 折叠行为

- 展开态：宽 280px，显示完整面板
- 折叠态：宽 40px，仅显示展开按钮图标
- 主内容区域通过 `pr-[280px]` / `pr-[40px]` 自适应
