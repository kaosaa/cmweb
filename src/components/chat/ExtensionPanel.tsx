import React, { memo, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { isTauri } from '@/lib/platform'
import { api } from '@/api/client'
import { useFileExplorer, type DirCache } from '@/hooks/use-file-explorer'
import {
  Files,
  FolderItem,
  FolderTrigger,
  FolderContent,
  FileItem,
} from '@/components/animate-ui/components/radix/files'
import {
  PanelRightClose,
  PanelRightOpen,
  FolderOpen,
  RefreshCw,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { motion } from 'motion/react'
import type { ChatSession } from '@/types/chat'

export type ExtensionPanelProps = {
  activeSession: ChatSession | null
  activeModel: string
  thinking: boolean
  isOpen: boolean
  onToggle: () => void
}

/** 面板展开/折叠的宽度常量 */
const PANEL_WIDTH_OPEN = 280
const PANEL_WIDTH_CLOSED = 40

// ─── Context token 计算 ─────────────────────────────────

const CONTEXT_HEADROOM_TOKENS = 10_000
const DEFAULT_CONTEXT_WINDOW_TOKENS = 200_000

function getContextBudgetTokens(model: string | null | undefined): number | null {
  const m = (model || '').trim()
  if (!m) return null
  return Math.max(1, DEFAULT_CONTEXT_WINDOW_TOKENS - CONTEXT_HEADROOM_TOKENS)
}

function formatNumber(n: number): string {
  try {
    return n.toLocaleString()
  } catch {
    return String(n)
  }
}

/** 右侧扩展面板：显示当前会话信息 + 文件浏览器 + context 用量 */
export const ExtensionPanel = memo(function ExtensionPanel({
  activeSession,
  activeModel,
  thinking,
  isOpen,
  onToggle,
}: ExtensionPanelProps) {
  const cwd = activeSession?.cwd
  const { cache, loading, openFolders, onOpenChange, error, refresh } =
    useFileExplorer(cwd)

  const handleRevealInExplorer = useCallback(() => {
    if (cwd) void api.fs.revealInExplorer(cwd)
  }, [cwd])

  const handleRefreshRoot = useCallback(() => {
    if (cwd) refresh(cwd)
  }, [cwd, refresh])

  /** 从最近一条 assistant 消息的 usage 中推导 context 用量 */
  const contextInfo = useMemo(() => {
    const messages = activeSession?.messages
    if (!Array.isArray(messages) || messages.length < 1) return null
    const budget = getContextBudgetTokens(activeSession?.model)
    if (!budget) return null

    let usage: any = null
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m: any = messages[i]
      if (!m || typeof m !== 'object') continue
      if (m.role !== 'assistant') continue
      if (m.usage && typeof m.usage === 'object' && typeof m.usage.input_tokens === 'number') {
        usage = m.usage
        break
      }
    }
    if (!usage) return null

    const contextSize =
      (usage.input_tokens || 0) +
      (usage.cache_creation_input_tokens || 0) +
      (usage.cache_read_input_tokens || 0)

    const percentLeftRaw = 100 - (contextSize / budget) * 100
    const percentLeft = Math.round(Math.max(0, Math.min(100, percentLeftRaw)))

    return { contextSize, budget, percentLeft }
  }, [activeSession?.messages, activeSession?.model])

  const rootEntry = cwd ? cache.get(cwd) : undefined
  // 从 cwd 中提取最后一级文件夹名
  const cwdName = cwd ? cwd.split(/[/\\]/).filter(Boolean).pop() || cwd : ''

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? PANEL_WIDTH_OPEN : PANEL_WIDTH_CLOSED }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'fixed right-0 z-20 overflow-hidden',
        isTauri ? 'top-9 bottom-2' : 'top-0 bottom-0',
        'flex flex-col',
        'bg-white/80 dark:bg-black/75 backdrop-blur-xl',
        'border-l border-gray-200/50 dark:border-white/10',
      )}
    >
      {/* 折叠态：仅显示展开按钮 */}
      {!isOpen && (
        <div className="flex flex-col items-center pt-4 w-[40px]">
          <button
            type="button"
            onClick={onToggle}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-200/50 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800/50 transition-colors"
            title="展开面板"
          >
            <PanelRightOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 展开态：完整面板内容 */}
      {isOpen && (
        <div className="flex flex-col h-full" style={{ width: PANEL_WIDTH_OPEN }}>
          {/* 面板头部：会话信息 */}
          <div className="shrink-0 px-4 pt-4 pb-3 border-b border-gray-200/50 dark:border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h2
                className="text-sm font-semibold text-gray-800 dark:text-white truncate flex-1 mr-2"
                title={activeSession?.title || '无会话'}
              >
                {activeSession?.title || '无活跃会话'}
              </h2>
              <button
                type="button"
                onClick={onToggle}
                className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-200/50 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800/50 transition-colors"
                title="折叠面板"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>

            {/* 模型 + thinking 状态 */}
            {activeModel && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 mb-2">
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    thinking ? 'bg-tertiary animate-pulse' : 'bg-primary',
                  )}
                />
                <span className="truncate">{activeModel}</span>
              </div>
            )}

            {/* 工作目录 */}
            {cwd && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400">
                <FolderOpen className="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                <span className="truncate flex-1" title={cwd}>
                  {cwdName}
                </span>
                <button
                  type="button"
                  onClick={handleRevealInExplorer}
                  className="shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                  title="在资源管理器中打开"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleRefreshRoot}
                  className="shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                  title="刷新"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* 文件树区域 */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {!activeSession && (
              <div className="px-4 py-8 text-center text-xs text-gray-400 dark:text-zinc-600">
                选择一个会话以查看文件
              </div>
            )}

            {activeSession && !rootEntry && loading.has(cwd!) && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-zinc-500" />
              </div>
            )}

            {error && (
              <div className="px-4 py-4 text-xs text-red-500 dark:text-red-400">
                {error}
              </div>
            )}

            {rootEntry && (
              <Files
                open={openFolders}
                onOpenChange={onOpenChange}
                className="text-gray-700 dark:text-zinc-300"
              >
                <DirectoryContents
                  directories={rootEntry.directories}
                  files={rootEntry.files}
                  cache={cache}
                  loading={loading}
                />
              </Files>
            )}
          </div>

          {/* Context 用量指示器 — 玻璃质感，固定在面板底部 */}
          {contextInfo ? (
            <div className="shrink-0 px-4 py-3 flex justify-center">
              <div
                className={cn(
                  'rounded-full px-3 py-1.5 text-[11px] font-medium text-center',
                  'backdrop-blur-md shadow-sm',
                  contextInfo.percentLeft <= 5
                    ? 'bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                    : contextInfo.percentLeft <= 10
                      ? 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                      : 'bg-gray-200/40 text-gray-600 dark:bg-white/10 dark:text-zinc-400',
                )}
                title={`context ${contextInfo.contextSize} / ${contextInfo.budget} tokens`}
              >
                {formatNumber(contextInfo.contextSize)} / {formatNumber(contextInfo.budget)} tokens · 剩余 {contextInfo.percentLeft}%
              </div>
            </div>
          ) : null}
        </div>
      )}
    </motion.aside>
  )
})

// ─── 文件树递归渲染 ───────────────────────────────────────

type DirectoryContentsProps = {
  directories: { name: string; fullPath: string }[]
  files: { name: string; fullPath: string }[]
  cache: DirCache
  loading: Set<string>
}

/** 渲染一层目录内容（文件夹 + 文件），文件夹内部递归 */
const DirectoryContents = memo(function DirectoryContents({
  directories,
  files,
  cache,
  loading,
}: DirectoryContentsProps) {
  return (
    <>
      {directories.map((dir) => (
        <LazyFolder
          key={dir.fullPath}
          name={dir.name}
          fullPath={dir.fullPath}
          cache={cache}
          loading={loading}
        />
      ))}
      {files.map((file) => (
        <FileItem key={file.fullPath} className="text-xs">
          {file.name}
        </FileItem>
      ))}
    </>
  )
})

type LazyFolderProps = {
  name: string
  fullPath: string
  cache: DirCache
  loading: Set<string>
}

/** 单个文件夹节点，展开时从 cache 中读取子内容或显示 loading */
const LazyFolder = memo(function LazyFolder({
  name,
  fullPath,
  cache,
  loading,
}: LazyFolderProps) {
  const entry = cache.get(fullPath)
  const isLoading = loading.has(fullPath)

  return (
    <FolderItem value={fullPath}>
      <FolderTrigger className="text-xs">{name}</FolderTrigger>
      <FolderContent>
        {isLoading && !entry && (
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 dark:text-zinc-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>加载中…</span>
          </div>
        )}
        {entry && (
          <DirectoryContents
            directories={entry.directories}
            files={entry.files}
            cache={cache}
            loading={loading}
          />
        )}
        {!isLoading && !entry && (
          <div className="px-2 py-1.5 text-xs text-gray-400 dark:text-zinc-500">
            空文件夹
          </div>
        )}
      </FolderContent>
    </FolderItem>
  )
})
