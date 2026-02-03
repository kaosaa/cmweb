# CM Web UI 设计规范

> 本文档记录了 CM (Claude Manager) Web 界面的 UI 设计偏好和开发注意事项

## 📋 目录

- [核心设计理念](#核心设计理念)
- [玻璃态设计系统](#玻璃态设计系统)
- [组件样式规范](#组件样式规范)
- [字体规范](#字体规范)
- [性能优化原则](#性能优化原则)
- [开发注意事项](#开发注意事项)

---

## 核心设计理念

### 1. 玻璃态优先
- **禁止使用硬边框**：不使用 `border` 线条勾勒轮廓
- **使用半透明背景**：采用 `bg-white/40` 或 `bg-white/5` 等半透明背景
- **磨砂玻璃效果**：必须添加 `backdrop-blur-xl` 实现毛玻璃效果
- **柔和边框**：使用 `ring-1 ring-white/20` 替代硬边框

### 2. 深色调为主
- 代码块使用深色背景（`bg-black/40 dark:bg-black/60`）
- 其他组件使用白灰色玻璃质感
- 保持整体视觉的统一性和精致感

### 3. 无闪烁原则
- 所有组件必须使用 `React.memo` 优化
- 避免不必要的重新渲染
- 侧边栏等动画不应影响主内容区域

---

## 玻璃态设计系统

### 浅色模式配色

```css
/* 主容器背景 */
bg-white/40              /* 40% 透明度白色 */
backdrop-blur-xl         /* 磨砂玻璃效果 */
shadow-lg                /* 柔和阴影 */
ring-1 ring-white/20     /* 半透明白色环形边框 */

/* 文字颜色 */
text-gray-700            /* 主要文字 */
text-gray-600            /* 次要文字 */
text-gray-500            /* 禁用/占位文字 */
```

### 深色模式配色

```css
/* 主容器背景 */
bg-white/5               /* 5% 透明度白色 */
dark:bg-white/5
backdrop-blur-xl

/* 文字颜色 */
text-gray-300            /* 主要文字 */
text-gray-400            /* 次要文字 */
text-gray-500            /* 禁用/占位文字 */
```

### 特殊场景配色

#### 代码块（深色调）
```css
bg-black/40 dark:bg-black/60
backdrop-blur-xl
ring-1 ring-white/10
```

#### 错误提示
```css
bg-red-500/10
backdrop-blur-xl
ring-1 ring-red-500/20
```

#### Bash 命令终端
```css
bg-gradient-to-br from-gray-900 to-gray-800
text-green-400           /* 终端绿色文字 */
```

---

## 组件样式规范

### 1. 代码块 (CodeBlock)

```tsx
// 主容器
className="rounded-2xl bg-black/40 dark:bg-black/60 backdrop-blur-xl shadow-2xl ring-1 ring-white/10"

// 顶部工具栏
className="bg-black/20 backdrop-blur-sm px-5 py-3"

// macOS 风格圆点
<div className="h-3 w-3 rounded-full bg-red-500/80" />
<div className="h-3 w-3 rounded-full bg-yellow-500/80" />
<div className="h-3 w-3 rounded-full bg-green-500/80" />

// 语言标签
className="rounded-lg bg-white/10 px-3 py-1 text-sm font-medium text-white/90"

// 代码内容
className="overflow-auto bg-black/30"
```

**字体大小**：`text-[17px]`（代码内容）

### 2. 思考过程栏目 (ThinkingBlock)

```tsx
// 主容器
className="rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-xl shadow-lg ring-1 ring-white/20"

// 标题
className="text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-white/10"

// 内容
className="text-gray-600 dark:text-gray-400"

// 分隔线
className="border-white/20 dark:border-white/10"
```

### 3. 工具调用卡片 (ChatToolCard)

```tsx
// 主容器
className="rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-xl shadow-lg ring-1 ring-white/20"

// 展开状态
className="open:ring-2 open:ring-white/30"

// 代码标签
className="bg-white/30 dark:bg-white/10 text-gray-600 dark:text-gray-400"

// 左侧分隔线
className="border-l-2 border-white/20 dark:border-white/10"
```

### 4. Bash 命令显示 (ToolPayloadView)

```tsx
// 终端样式容器
className="rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 p-4 shadow-xl ring-1 ring-white/10"

// 终端图标背景
className="w-8 h-8 rounded-lg bg-green-500/20 backdrop-blur-sm"

// 命令文字
className="font-mono text-[17px] text-green-400 leading-relaxed"
```

**命令检测规则**：
- 以 `cd`、`ls`、`git`、`npm`、`python` 开头
- 包含 `&&` 或 `|` 符号
- 长度小于 200 字符且不包含换行

### 5. 消息内容卡片 (Message Card)

```tsx
// 主容器
className="rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-xl shadow-lg ring-1 ring-white/20 p-5"

// 文字内容
className="text-gray-700 dark:text-gray-300"
```

### 6. 错误提示卡片 (Error Message)

```tsx
// 主容器
className="rounded-2xl bg-red-500/10 backdrop-blur-xl shadow-lg ring-1 ring-red-500/20 p-4"

// 图标背景
className="w-10 h-10 rounded-full bg-red-500/20 backdrop-blur-sm"

// 错误文字
className="text-red-600 dark:text-red-400"

// 详情区域
className="rounded-lg bg-white/30 dark:bg-white/10 backdrop-blur-sm"
```

---

## 字体规范

### 字体大小对照表

| 元素类型 | 字体大小 | 用途 |
|---------|---------|------|
| 代码块内容 | `text-[17px]` | 代码高亮显示 |
| Bash 命令 | `text-[17px]` | 终端命令显示 |
| 普通代码 | `text-[13px]` | 行内代码、短代码 |
| 多行文本 | `text-[13px]` | 长文本、输出结果 |
| JSON 数据 | `text-[12px]` | 结构化数据 |
| 标签/标题 | `text-[10px]` - `text-sm` | 小标签、次要信息 |

### 字体家族

```css
/* 等宽字体（代码） */
font-mono

/* 无衬线字体（正文） */
font-sans
```

### 行高规范

```css
leading-relaxed          /* 代码和长文本 */
leading-7                /* 段落文字 */
leading-tight            /* 标题 */
```

---

## 性能优化原则

### 1. 防止组件闪烁

#### 问题根源
- 父组件重新渲染导致子组件不必要的重新渲染
- 每次渲染创建新的对象/函数引用
- 动画触发布局重排

#### 解决方案

**使用 React.memo**
```tsx
export const CodeBlock = memo(function CodeBlock({ ... }) {
  // 组件实现
})

export const ShikiCode = memo(function ShikiCode({ ... }) {
  // 组件实现
})

export const ChatMarkdown = memo(function ChatMarkdown({ ... }) {
  // 组件实现
})
```

**提取稳定引用**
```tsx
// ❌ 错误：每次渲染创建新对象
function Component() {
  return <ReactMarkdown components={{
    p: ({ children }) => <p>{children}</p>
  }} />
}

// ✅ 正确：提取到组件外部
const markdownComponents = {
  p: ({ children }: any) => <p>{children}</p>
}

export const Component = memo(function Component() {
  return <ReactMarkdown components={markdownComponents} />
})
```

**移除初始动画**
```tsx
// ❌ 错误：每次渲染都触发动画
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
>

// ✅ 正确：使用普通 div
<div>
```

### 2. 侧边栏动画优化

#### 布局方案
```tsx
// 主容器
<div className="h-screen w-full relative">

  {/* 侧边栏 - 固定定位，脱离文档流 */}
  <Sidebar className="fixed left-0 top-0 bottom-0 z-40" />

  {/* 主内容 - 固定左侧 padding */}
  <main className="h-full w-full pl-[80px]">
    {/* 内容宽度不变，不受侧边栏影响 */}
  </main>
</div>
```

#### 关键点
- 侧边栏使用 `fixed` 定位
- 主内容使用固定 `padding-left`
- 侧边栏展开时覆盖在主内容上方
- 主内容宽度始终不变

### 3. 对话框优化

```tsx
// 禁用背景渐变动画
<BackgroundGradient animate={false}>

// 只对透明度做过渡
className="transition-opacity duration-300"  // ✅
className="transition-all duration-300"      // ❌
```

---

## 开发注意事项

### 1. 快捷键规范

```tsx
// Ctrl+Enter / Cmd+Enter: 换行
if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
  return // 允许默认换行
}

// Enter: 发送消息
if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
  e.preventDefault()
  handleSubmit()
}
```

### 2. 主题切换

#### 使用 next-themes
```tsx
import { useTheme } from 'next-themes'

const { theme, resolvedTheme, setTheme } = useTheme()
```

#### 主题配置
```tsx
<ThemeProvider
  attribute="class"           // 通过 class 切换
  defaultTheme="dark"         // 默认深色
  enableSystem                // 支持系统主题
  disableTransitionOnChange   // 禁用切换动画
>
```

#### 支持的主题
- `light` - 浅色模式
- `dark` - 深色模式
- `system` - 跟随系统

### 3. 沉浸式阅读模式

#### 功能
- 隐藏输入框和底部文字
- 提供更大的阅读空间
- 使用悬浮按钮切换

#### 实现
```tsx
const [immersiveMode, setImmersiveMode] = useState(false)

// 切换按钮（右下角）
<motion.button
  className="fixed bottom-6 right-6 z-30 h-12 w-12 rounded-full bg-black/40 backdrop-blur-xl"
  onClick={() => setImmersiveMode(!immersiveMode)}
>
  {immersiveMode ? <Eye /> : <EyeOff />}
</motion.button>

// 可隐藏的输入框
<AnimatePresence>
  {!immersiveMode && (
    <motion.div exit={{ opacity: 0, y: 20 }}>
      <ChatComposer />
    </motion.div>
  )}
</AnimatePresence>
```

### 4. 侧边栏行为

#### 默认状态
- 缩进（80px 宽度）
- 只显示图标和简称

#### 悬浮展开
- 鼠标悬浮时展开（320px 宽度）
- 显示完整内容
- 覆盖在主内容上方

#### 实现逻辑
```tsx
// sidebar.tsx
animate={{
  width: animate ? (open ? "80px" : "320px") : "320px"
}}
onMouseEnter={() => setOpen(false)}  // 展开
onMouseLeave={() => setOpen(true)}   // 缩进
```

### 5. 代码块复制功能

#### 功能特点
- 一键复制代码
- 复制成功显示绿色勾选
- 2 秒后自动恢复
- 流畅的动画反馈

#### 实现
```tsx
const [copied, setCopied] = useState(false)

const handleCopy = async () => {
  await navigator.clipboard.writeText(code)
  setCopied(true)
  setTimeout(() => setCopied(false), 2000)
}

<AnimatePresence mode="wait">
  {copied ? (
    <motion.div
      key="check"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 180 }}
    >
      <Check className="text-green-400" />
    </motion.div>
  ) : (
    <motion.div key="copy">
      <Copy />
    </motion.div>
  )}
</AnimatePresence>
```

---

## 设计原则总结

### ✅ 应该做的

1. **使用玻璃态设计**
   - 半透明背景 + 磨砂玻璃效果
   - 柔和的 ring 边框
   - 精致的阴影

2. **优化性能**
   - 使用 `React.memo`
   - 提取稳定引用
   - 避免不必要的动画

3. **保持一致性**
   - 统一的配色方案
   - 统一的圆角大小（`rounded-2xl`）
   - 统一的间距规范

4. **注重可读性**
   - 足够大的字体（代码 17px）
   - 合适的行高（`leading-relaxed`）
   - 清晰的颜色对比

### ❌ 不应该做的

1. **不使用硬边框**
   - 避免 `border` 线条
   - 不使用 `border-outline-variant`

2. **不引入闪烁**
   - 不在每次渲染时创建新对象
   - 不使用会触发重排的动画
   - 不让侧边栏影响主内容宽度

3. **不过度设计**
   - 不添加不必要的动画
   - 不使用过于复杂的渐变
   - 保持简洁优雅

4. **不忽视细节**
   - 不使用过小的字体
   - 不忽略深色模式适配
   - 不忘记添加 hover 状态

---

## 技术栈

- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS 4** - 样式系统
- **Motion** - 动画库
- **next-themes** - 主题管理
- **Shiki** - 代码高亮
- **Radix UI** - 无障碍组件

---

## 更新日志

- **2024-01** - 初始版本，建立玻璃态设计系统
- **2024-01** - 优化代码块字体大小（17px）
- **2024-01** - 添加 Bash 命令终端样式
- **2024-01** - 统一所有组件为玻璃质感
- **2024-01** - 修复侧边栏闪烁问题
- **2024-01** - 添加沉浸式阅读模式

---

**维护者**: CM 开发团队
**最后更新**: 2024-01
