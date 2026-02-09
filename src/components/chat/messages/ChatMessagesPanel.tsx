import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { extractLatestTodoWriteTodos } from '@/utils/todos'
import { ChatMessageList } from './ChatMessageList'
import type { ChatMessagesPanelProps } from './ChatMessagesPanel.types'

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

  // Scroll on message updates if allowed.
  // 始终使用 'auto'（瞬时跳转），避免 smooth 动画与 virtualizer 高度变化冲突导致回弹。
  useLayoutEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom('auto')
    }
  }, [activeSession?.messages, busy])

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto pt-20 pb-40 px-4 md:px-8 relative z-0"
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
            <ChatMessageList
              messages={activeSession.messages}
              busy={busy}
              streamingAssistantId={streamingAssistantId}
              thinkingEnabled={Boolean(activeSession.thinking)}
              thinkingOpenById={thinkingOpenById}
              setThinkingOpenById={setThinkingOpenById}
              cwd={activeSession.cwd}
              onPreviewImage={onPreviewImage}
              scrollContainerRef={scrollContainerRef}
            />
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
