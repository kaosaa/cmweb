# ChatToolCard 组件

> 用于展示 Claude 工具调用的卡片组件

## 功能概述

ChatToolCard 是一个可折叠的卡片组件，用于展示 AI 助手调用的各种工具（如 Bash、Edit、Read 等）的详细信息。组件采用玻璃态设计，支持深色/浅色主题切换。

## 核心特性

### 1. 工具类型识别
- 自动识别不同类型的工具（Bash、Edit、Write、Read 等）
- 为每种工具提供专门的图标和颜色方案
- 显示工具调用状态（调用中、完成、失败、已拒绝）

### 2. Bash 工具专门处理

#### 命令显示（Summary 区域）
- **终端风格命令卡片**：使用渐变背景（from-gray-900 to-gray-800）模拟真实终端
- **绿色终端图标**：使用 Terminal 图标和绿色背景高亮
- **命令文本**：使用 15px 等宽字体，绿色文字（text-green-400）
- **输出预览**：在命令下方显示 stdout 的简短预览（最高 200px）

#### 详细输出显示（Details 区域）
展开卡片后，根据 Bash 输出结构显示以下字段：

**stdout（标准输出）**
```tsx
- 标题: "标准输出 (stdout)"
- 样式: 浅色模式 bg-gray-50/60, 深色模式 bg-black/40
- 字体: 14px 等宽字体
- 最大高度: 500px，超出滚动
- 主题隔离: text-gray-800 dark:text-gray-200
```

**stderr（错误输出）**
```tsx
- 标题: "错误输出 (stderr)" + AlertCircle 图标
- 样式: 浅色模式 bg-red-50/60, 深色模式 bg-red-950/30
- 字体: 14px 等宽字体，红色文字
- 边框: ring-red-200/50 dark:ring-red-500/20
- 主题隔离: text-red-700 dark:text-red-300
```

**interrupted（中断标识）**
```tsx
- 警告提示: "命令被中断"
- 样式: 琥珀色背景（bg-amber-50/60 dark:bg-amber-950/30）
- 图标: AlertCircle + 琥珀色文字
```

**isImage（图像数据标识）**
```tsx
- 提示: "输出包含图像数据"
- 样式: 蓝色背景（bg-blue-50/60 dark:bg-blue-950/30）
```

### 3. Edit 工具专门处理
- 使用 `ChatDiffView` 组件显示代码差异
- 显示相对路径（相对于当前工作目录）
- 高亮显示添加/删除的行

### 4. 主题隔离
所有颜色类都严格遵循 dark: 前缀模式：
- 背景色: `bg-gray-50/60 dark:bg-white/10`
- 文字色: `text-gray-800 dark:text-gray-300`
- 边框: `ring-gray-200/50 dark:ring-transparent`
- 特殊颜色: `text-red-600 dark:text-red-400`

### 5. 玻璃态设计
- 使用 `backdrop-blur-xl` 实现毛玻璃效果
- 半透明背景（`bg-white/70` 或 `bg-white/5`）
- 柔和的 ring 边框（`ring-1 ring-gray-200/50`）
- 无硬边框设计

## 组件接口

```typescript
type ChatToolCardProps = {
  message: ChatMessage  // 包含工具调用信息的消息对象
  cwd?: string | null   // 当前工作目录，用于显示相对路径
}
```

## Bash 输出数据结构

```typescript
interface BashOutput {
  stdout: string | null    // 标准输出内容
  stderr: string | null    // 错误输出内容
  interrupted: boolean     // 是否被中断
  isImage: boolean        // 是否包含图像数据
}
```

## 设计规范

### 字体大小
- 工具名称标签: 10px
- Bash 命令: 15px
- 输出内容: 14px
- 普通代码: 13px

### 圆角规范
- 主卡片: `rounded-2xl`
- 内部容器: `rounded-xl`
- 小元素: `rounded-lg`

### 间距规范
- 卡片外边距: `mb-2`
- 内容内边距: `p-4`
- 元素间距: `space-y-4` / `space-y-5`

### 颜色语义
- 绿色: 成功、完成、终端命令
- 红色: 错误、失败、stderr
- 琥珀色: 警告、中断
- 蓝色: 信息提示
- 灰色: 中性、禁用

## 路径处理

组件包含 `toRelativePath` 工具函数，用于将绝对路径转换为相对路径：
- 支持 Windows 和 Unix 路径
- 支持 MSYS/Git Bash 风格路径（如 `/d/foo` 转换为 `D:/foo`）
- 自动添加 `./` 前缀表示相对路径

## 性能优化

- 使用条件渲染避免不必要的 DOM 创建
- 合理使用 `details/summary` 元素实现原生折叠效果
- 限制预览区域高度，避免大量内容导致性能问题

## 使用示例

```tsx
<ChatToolCard
  message={message}
  cwd="/home/user/project"
/>
```

## 依赖组件

- `ChatDiffView`: 代码差异对比显示
- `ToolPayloadView`: 工具参数/结果通用显示
- `lucide-react`: 图标库（Terminal, ChevronDown, AlertCircle）

## 更新日志

- **2025-02-05**: 增强 Bash 工具输出显示
  - 在 summary 区域添加 stdout 预览
  - 在 details 区域添加 stdout、stderr、interrupted、isImage 的专门显示
  - 确保所有样式都遵循主题隔离规范
  - 为 stderr 添加红色警告样式
  - 为中断和图像数据添加特殊提示

- **之前版本**: 基础工具卡片功能
  - 支持多种工具类型
  - Edit 工具代码差异显示
  - 状态标识（完成、失败、已拒绝）
  - 相对路径显示
