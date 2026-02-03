import type { ChatMessage } from '@/types/chat'
import { cn } from '@/lib/utils'
import { getInputPreview, getToolMeta } from '@/utils/tool-auth'
import { getToolOutputPreview } from '@/utils/tool-payload'
import { ChatDiffView } from './ChatDiffView'
import { ToolPayloadView } from './ToolPayloadView'

type ChatToolCardProps = {
  message: ChatMessage
  cwd?: string | null
}

/** Convert an absolute path to relative path based on cwd */
function toRelativePath(absPath: string, cwd?: string | null): string {
  if (!cwd || !absPath) return absPath

  // Normalize MSYS/Git Bash style paths like /d/foo to D:/foo
  const normalizeMsysPath = (p: string): string => {
    // Match /c/ or /d/ etc at the start (MSYS style)
    const msysMatch = p.match(/^\/([a-zA-Z])\/(.*)$/)
    if (msysMatch) {
      return `${msysMatch[1].toUpperCase()}:/${msysMatch[2]}`
    }
    return p
  }

  // Normalize separators to forward slashes and handle MSYS paths
  const normPath = normalizeMsysPath(absPath.replace(/\\/g, '/'))
  const normCwd = normalizeMsysPath(cwd.replace(/\\/g, '/')).replace(/\/$/, '') // Remove trailing slash

  // Check if path starts with cwd (case-insensitive for Windows)
  if (normPath.toLowerCase().startsWith(normCwd.toLowerCase())) {
    const relative = normPath.slice(normCwd.length)
    // Remove leading slash if present
    return relative.startsWith('/') ? `.${relative}` : `./${relative}`
  }

  // If no match, still try to show a cleaner path
  // Convert back MSYS-normalized path for display
  return normPath
}

export function ChatToolCard({ message, cwd }: ChatToolCardProps) {
  const tool = message.tool
  if (!tool) return null

  const hasInput = tool.input != null
  const hasOutput = tool.output != null
  const isError = tool.isError

  // Check if the output indicates user refusal (regardless of isError flag)
  const isRefused = typeof tool.output === 'string' && (
    tool.output.includes('User denied permission') ||
    tool.output.includes('用户拒绝') ||
    tool.output.includes('Permission denied')
  )

  const meta = getToolMeta(tool.name)
  const Icon = meta.icon

  const isEditTool = tool.name === 'Edit' && hasInput && typeof tool.input === 'object'
  const editInput = isEditTool ? (tool.input as { file_path?: string; old_string?: string; new_string?: string }) : null

  const statusBadge = (() => {
    if (isRefused) {
      return (
        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground font-medium border border-border">
          已拒绝
        </span>
      )
    }
    if (isError) {
      return (
        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-destructive/10 text-destructive font-medium">
          失败
        </span>
      )
    }
    if (hasOutput) {
      return (
        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
          完成
        </span>
      )
    }
    if (hasInput && !hasOutput) {
      return (
        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-medium">
          调用
        </span>
      )
    }
    return null
  })()

  const editSummary = (() => {
    if (!isEditTool || !editInput) return null
    const filePath = editInput.file_path || ''
    // Show relative path with full filename
    return toRelativePath(filePath, cwd)
  })()

  const inputPreview = (() => {
    if (!hasInput) return null
    const rawPreview = getInputPreview(tool.name, tool.input)
    if (!rawPreview) return null

    // For file-based tools, convert to relative path
    const lower = tool.name.toLowerCase()
    if (lower.includes('write') || lower.includes('edit') || lower.includes('read')) {
      return toRelativePath(rawPreview, cwd)
    }
    return rawPreview
  })()

  const outputPreview = isEditTool && editSummary ? editSummary : getToolOutputPreview(tool.output)

  return (
    <details className="rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-xl shadow-lg ring-1 ring-white/20 p-4 text-xs mb-2 transition-all open:ring-2 open:ring-white/30">
      <summary className="cursor-pointer select-none font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <span className="font-semibold">{meta.label}</span>
          <code className="px-1.5 py-0.5 rounded bg-white/30 dark:bg-white/10 text-[10px] font-mono text-gray-600 dark:text-gray-400">
            {tool.name}
          </code>
          {statusBadge}
        </div>
        {inputPreview ? (
          <span className="text-gray-600 dark:text-gray-400 font-mono text-[11px] flex-1 min-w-0 break-words" title={inputPreview}>
            {inputPreview}
          </span>
        ) : null}
        {outputPreview && !isError ? (
          <span className="text-gray-600 dark:text-gray-400 flex-1 min-w-0 break-words max-w-[180px]" title={tool.output || ''}>
            → {outputPreview}
          </span>
        ) : null}
      </summary>
      <div className="mt-3 space-y-3 pl-3 border-l-2 border-white/20 dark:border-white/10 ml-1">
        {isEditTool && editInput?.old_string != null && editInput?.new_string != null ? (
          <div>
            {editInput.file_path ? (
              <div className="mb-2 text-[10px] font-semibold text-gray-600 dark:text-gray-400 font-mono">{toRelativePath(editInput.file_path, cwd)}</div>
            ) : null}
            <ChatDiffView oldStr={editInput.old_string} newStr={editInput.new_string} />
          </div>
        ) : hasInput ? (
          <div>
            <div className="mb-1 text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">参数</div>
            <ToolPayloadView value={tool.input} />
          </div>
        ) : null}
        {hasOutput ? (
          <div>
            <div className="mb-1 text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
              结果
              {isRefused ? (
                <span className="text-gray-500 dark:text-gray-500">(已拒绝)</span>
              ) : isError ? (
                <span className="text-red-500 dark:text-red-400">(错误)</span>
              ) : null}
            </div>
            <div
              className={cn(
                'rounded-lg p-2.5 backdrop-blur-sm',
                isRefused
                  ? 'bg-white/20 dark:bg-white/5 text-gray-600 dark:text-gray-400 ring-1 ring-white/20'
                  : isError
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20'
                    : 'bg-white/30 dark:bg-white/10 text-gray-700 dark:text-gray-300 ring-1 ring-white/20',
              )}
            >
              <ToolPayloadView value={tool.output} />
            </div>
          </div>
        ) : null}
      </div>
    </details>
  )
}
