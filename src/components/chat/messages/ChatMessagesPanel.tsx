import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { extractLatestTodoWriteTodos } from '@/utils/todos'
import { ChatMessageList } from './ChatMessageList'
import type { ChatMessagesPanelProps } from './ChatMessagesPanel.types'

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

export const ChatMessagesPanel = memo(function ChatMessagesPanel({
  activeSession,
  busy,
  streamingAssistantId,
  thinkingOpenById,
  setThinkingOpenById,
  error,
  onClearError,
  compactNotice,
  onClearCompactNotice,
  onCompactSession,
  onPreviewImage,
}: ChatMessagesPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)

  const todos = useMemo(() => extractLatestTodoWriteTodos(activeSession?.messages), [activeSession?.messages])
  const [todoDetailsOpen, setTodoDetailsOpen] = useState(true)
  useEffect(() => {
    // If a new TodoWrite arrives, open the panel once for visibility.
    if (todos && todos.length) setTodoDetailsOpen(true)
  }, [todos])
  const todoStats = useMemo(() => {
    if (!todos) return null
    const total = todos.length
    const completed = todos.filter((t) => t.status === 'completed').length
    return { total, completed }
  }, [todos])

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

  // Force auto-scroll when a new turn starts (busy becomes true)
  useEffect(() => {
    if (busy) {
      shouldAutoScrollRef.current = true
      scrollToBottom('smooth')
    }
  }, [busy])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current
      scrollContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior,
      })
    }
  }, [])

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight <= 50
      shouldAutoScrollRef.current = isAtBottom
    }
  }, [])

  // Scroll on message updates if allowed
  useLayoutEffect(() => {
    if (shouldAutoScrollRef.current) {
      // Use 'auto' during heavy streaming for better performance/stickiness, 
      // or 'smooth' if prefer animation. 'auto' is safer for rapid updates.
      // But user requested "smooth". Let's try smooth. 
      // If it's too jerky, we can switch to auto for streaming updates.
      scrollToBottom(busy ? 'auto' : 'smooth')
    }
  }, [activeSession?.messages, busy])

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto pt-20 pb-40 px-4 md:px-8 scroll-smooth relative z-0"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {todos && todoStats ? (
          <details
            className="lg:hidden rounded-3xl border border-outline-variant/15 bg-surface-container-high/40 px-4 py-3 shadow-sm"
            open={todoDetailsOpen}
            onToggle={(e) => {
              const open = (e.currentTarget as HTMLDetailsElement | null)?.open ?? false
              setTodoDetailsOpen(open)
            }}
          >
            <summary className="cursor-pointer select-none font-medium flex items-center justify-between gap-3 text-on-surface-variant">
              <span className="text-sm">
                Todos <span className="text-muted-foreground">({todoStats.completed}/{todoStats.total})</span>
              </span>
              <span className="text-xs text-muted-foreground">来自 TodoWrite</span>
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
                  <tr className="border-b border-outline-variant/12">
                    <th className="py-2 pr-3 text-left font-semibold">状态</th>
                    <th className="py-2 pr-3 text-left font-semibold">内容</th>
                  </tr>
                </thead>
                <tbody>
                  {todos.map((t) => (
                    <tr key={t.id} className="border-b border-outline-variant/10 last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {t.status === 'completed' ? '完成' : t.status === 'in_progress' ? '进行中' : '待办'}
                      </td>
                      <td className="py-2 pr-3 min-w-[240px]">
                        <span className={t.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                          {t.content || '(空)'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ) : null}

        {compactNotice ? (
          <div
            className="rounded-3xl border border-outline-variant/15 bg-surface-container-high/40 px-4 py-3 text-sm text-on-surface-variant shadow-sm flex items-start justify-between gap-3 animate-fade-in-up"
            title={`trigger=${compactNotice.trigger} preTokens=${compactNotice.preTokens}`}
          >
            <div className="whitespace-pre-wrap break-words leading-relaxed">
              {compactNotice.type === 'microcompact'
                ? `Context compacted (saved ${compactNotice.tokensSaved} tokens)`
                : 'Conversation compacted'}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-full text-xs"
                onClick={onCompactSession}
                disabled={busy || !activeSession}
                title="压缩历史（保留最近几轮对话）"
              >
                压缩历史
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:bg-surface-container-highest"
                onClick={onClearCompactNotice}
                title="关闭"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-3xl border border-error/25 bg-error/10 px-4 py-3 text-sm text-error shadow-sm flex items-start justify-between gap-3 animate-fade-in-up">
            <div className="whitespace-pre-wrap break-words leading-relaxed">{error}</div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-error hover:bg-error/10"
              onClick={onClearError}
              title="关闭"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : null}

        {activeSession?.messages?.length ? (
          <>
            <ChatMessageList
              messages={activeSession.messages}
              busy={busy}
              streamingAssistantId={streamingAssistantId}
              thinkingEnabled={Boolean(activeSession.thinking)}
              thinkingOpenById={thinkingOpenById}
              setThinkingOpenById={setThinkingOpenById}
              cwd={activeSession.cwd}
              onPreviewImage={onPreviewImage}
            />

            {contextInfo ? (
              <div className="flex justify-center pt-2">
                <div
                  className={
                    'rounded-full border px-4 py-2 text-xs font-semibold ' +
                    (contextInfo.percentLeft <= 5
                      ? 'bg-error/10 text-error border-error/20'
                      : contextInfo.percentLeft <= 10
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                        : 'bg-surface-container-highest/40 text-muted-foreground border-outline-variant/15')
                  }
                  title={`context ${contextInfo.contextSize} / ${contextInfo.budget} tokens`}
                >
                  {formatNumber(contextInfo.contextSize)} / {formatNumber(contextInfo.budget)} tokens · 剩余 {contextInfo.percentLeft}%
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 animate-fade-in-up">
            <div className="w-20 h-20 rounded-[2.5rem] bg-surface-container-high flex items-center justify-center shadow-inner">
              <Sparkles className="w-10 h-10 text-primary opacity-80" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-on-surface">我能帮你做什么？</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                我可以帮你写代码、分析问题、修复 Bug 等。直接在下方输入，或先选择一个模型。
              </p>
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
})
