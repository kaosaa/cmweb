import type { ReactNode } from 'react'
import { Bot, ShieldAlert, Sparkles, User, CircleUser } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import type { ChatMessage, ThinkingBlock } from '@/types/chat'
import type { InterleavedBlock } from '@/types/chat-ui'
import { formatSeconds, inferLegacyToolOffset, parseApiError } from '@/utils/chat'
import { ChatMarkdown } from './ChatMarkdown'
import { ChatToolCard } from './ChatToolCard'
import type { ChatMessageListProps } from './ChatMessageList.types'

export function ChatMessageList({
  messages,
  busy,
  streamingAssistantId,
  thinkingEnabled,
  thinkingOpenById,
  setThinkingOpenById,
  cwd,
  onPreviewImage,
}: ChatMessageListProps) {
  const out: ReactNode[] = []

  for (let i = 0; i < messages.length; i += 1) {
    const m = messages[i]

    // Skip tool messages that are already handled by the subsequent assistant message
    if (m.role === 'tool') {
      let j = i + 1
      while (j < messages.length && messages[j].role === 'tool') j += 1
      if (j < messages.length && messages[j].role === 'assistant') {
        const nextAssistantId = messages[j].id
        if (m.assistantMessageId == null || m.assistantMessageId === nextAssistantId) continue
      }
    }

    if (m.role === 'assistant') {
      // --- ASSISTANT MESSAGE ---
      const tools: ChatMessage[] = []
      for (let j = i - 1; j >= 0; j -= 1) {
        const prev = messages[j]
        if (prev.role !== 'tool') break
        tools.unshift(prev)
      }

      const isStreamingAssistant = busy && m.id === streamingAssistantId
      const thinkingForRender: ThinkingBlock[] = (() => {
        if (Array.isArray(m.thinkingBlocks) && m.thinkingBlocks.length) {
          return m.thinkingBlocks
        }

        const raw = (m.thinking ?? '').trim()
        if (!raw) {
          if (isStreamingAssistant && Boolean(thinkingEnabled)) {
            return [{ index: 0, text: '', startCharOffset: 0, durationMs: null }]
          }
          return []
        }

        const THINKING_BREAK = '<<<THINKING_BREAK>>>'
        return raw
          .split(THINKING_BREAK)
          .map((s, index) => ({
            index,
            text: s.trim(),
            startCharOffset: 0,
            durationMs: null,
          }))
          .filter((b) => Boolean(b.text))
      })()

      const content = m.content ?? ''
      const inferredLegacyOffset = inferLegacyToolOffset(content)
      const toolItems = tools
        .map((t, order) => {
          const rawOffset = t.assistantCharOffset
          const offset = typeof rawOffset === 'number' && Number.isFinite(rawOffset) ? rawOffset : inferredLegacyOffset
          return { msg: t, order, offset }
        })
        .filter((t) => {
          if (t.msg.assistantMessageId != null && t.msg.assistantMessageId !== m.id) return false
          return true
        })

      const interleavedBlocks: InterleavedBlock[] = []

      for (let idx = 0; idx < thinkingForRender.length; idx++) {
        const tb = thinkingForRender[idx]
        interleavedBlocks.push({
          type: 'thinking',
          block: tb,
          blockIdx: idx,
          offset: tb.startCharOffset ?? 0,
          globalIndex: tb.globalIndex ?? null,
        })
      }

      for (const t of toolItems) {
        if (t.offset != null) {
          interleavedBlocks.push({
            type: 'tool',
            msg: t.msg,
            offset: t.offset,
            globalIndex: t.msg.tool?.globalIndex ?? null,
          })
        }
      }

      interleavedBlocks.sort((a, b) => {
        if (a.globalIndex != null && b.globalIndex != null) {
          return a.globalIndex - b.globalIndex
        }
        if (a.globalIndex != null && b.globalIndex == null) return -1
        if (a.globalIndex == null && b.globalIndex != null) return 1
        if (a.offset !== b.offset) return a.offset - b.offset
        if (a.type === 'thinking' && b.type === 'tool') return -1
        if (a.type === 'tool' && b.type === 'thinking') return 1
        return 0
      })

      const legacyTools = toolItems.filter((t) => t.offset == null).map((t) => t.msg)

      const renderThinkingBlockNode = (tb: ThinkingBlock, blockIdx: number) => {
        const blockKey = `${m.id}_thinking_${blockIdx}`
        const isLatestBlock = blockIdx === thinkingForRender.length - 1
        // If it's the latest block and still thinking (durationMs is null), force it open initially if not set.
        // But the user might want to collapse it.
        // Actually, let's keep the existing logic: open by default if thinking.
        const isActive = tb.durationMs == null
        const blockOpen = thinkingOpenById[blockKey] ?? (isActive ? isLatestBlock : false)

        return (
          <div key={blockKey} className="w-full">
            <details
              className="group rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-xl shadow-lg ring-1 ring-white/20 text-xs transition-all duration-200"
              open={blockOpen}
              onToggle={(e) => {
                const open = (e.currentTarget as HTMLDetailsElement | null)?.open ?? false
                setThinkingOpenById((prev) => ({ ...prev, [blockKey]: open }))
              }}
            >
              <summary className="cursor-pointer select-none font-medium flex items-center justify-between p-4 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-white/10 rounded-t-2xl group-[&:not([open])]:rounded-2xl transition-colors outline-none">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isActive ? '正在思考...' : `思考过程 (${formatSeconds(tb.durationMs)})`}
                  </span>
                </div>
                {isActive && <Spinner className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />}
              </summary>
              <div className="p-4 pt-0 border-t border-white/20 dark:border-white/10">
                <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-gray-600 dark:text-gray-400">
                  {tb.text || '...'}
                </pre>
              </div>
            </details>
          </div>
        )
      }

      const interleavedNodes: ReactNode[] = []
      const apiError = parseApiError(content)
      if (apiError.isError) {
        interleavedNodes.push(
          <div key={`error-${m.id}`} className="rounded-2xl bg-red-500/10 backdrop-blur-xl shadow-lg ring-1 ring-red-500/20 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-red-500 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">{apiError.errorType}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">{apiError.message}</p>
                {apiError.details && apiError.details !== apiError.message ? (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                      查看详细信息
                    </summary>
                    <pre className="mt-2 p-2 rounded-lg bg-white/30 dark:bg-white/10 backdrop-blur-sm text-xs font-mono whitespace-pre-wrap break-all overflow-x-auto">
                      {apiError.details}
                    </pre>
                  </details>
                ) : null}
              </div>
            </div>
          </div>,
        )
      } else {
        let textCursor = 0

        for (const block of interleavedBlocks) {
          const targetOffset = Math.max(0, Math.min(block.offset, content.length))

          if (targetOffset > textCursor) {
            const textChunk = content.slice(textCursor, targetOffset)
            if (textChunk) {
              interleavedNodes.push(
                <div
                  key={`md-${m.id}-${textCursor}`}
                  className="rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-xl shadow-lg ring-1 ring-white/20 p-5"
                >
                  <div className="prose-sm md:prose-base dark:prose-invert text-gray-700 dark:text-gray-300 max-w-none break-words overflow-wrap-anywhere">
                    <ChatMarkdown markdown={textChunk} />
                  </div>
                </div>,
              )
            }
            textCursor = targetOffset
          }

          if (block.type === 'thinking') {
            interleavedNodes.push(renderThinkingBlockNode(block.block, block.blockIdx))
          } else if (block.type === 'tool') {
            interleavedNodes.push(
              <div key={`tool-${block.msg.id}`} className="w-full">
                <ChatToolCard message={block.msg} cwd={cwd} />
              </div>,
            )
          }
        }

        if (textCursor < content.length) {
          const tail = content.slice(textCursor)
          if (tail) {
            interleavedNodes.push(
              <div
                key={`md-${m.id}-tail`}
                className="rounded-2xl border border-outline-variant/15 glass-card p-5 shadow-sm"
              >
                <div className="prose-sm md:prose-base dark:prose-invert text-on-surface max-w-none break-words overflow-wrap-anywhere">
                  <ChatMarkdown markdown={tail} />
                </div>
              </div>,
            )
          }
        }
      }

      // Only show standalone spinner if we are streaming AND have no content AND no thinking blocks
      // This prevents the "double spinner" issue where thinking block has a spinner AND this one shows up.
      const hasThinking = thinkingForRender.length > 0
      if (!content && !hasThinking && isStreamingAssistant) {
        interleavedNodes.push(
          <div key="spinner" className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container-high/20 border border-transparent">
             <Spinner className="w-5 h-5 text-primary" />
             <span className="text-sm text-muted-foreground">CM 正在思考...</span>
          </div>,
        )
      }

      // Render the Assistant "Workflow" Block
      out.push(
        <div key={m.id} className="flex gap-4 w-full max-w-5xl mx-auto py-4 animate-fade-in-up">
           {/* Avatar Column */}
           <div className="shrink-0 flex flex-col items-center">
             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/10">
               <Bot className="w-6 h-6" />
             </div>
             {/* Line connector if needed, for now just empty space */}
           </div>

           {/* Content Column */}
           <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 h-10 mb-2">
                <span className="text-sm font-semibold text-on-surface">CM</span>
                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-surface-container-highest">AI Agent</span>
             </div>
             
             <div className="flex flex-col gap-4 max-w-[90%] md:max-w-[85%]">
               {interleavedNodes}

               {legacyTools.length ? (
                  <div className="space-y-4">
                    {legacyTools.map((t) => (
                      <div key={t.id}>
                        <ChatToolCard message={t} cwd={cwd} />
                      </div>
                    ))}
                  </div>
                ) : null}
             </div>
           </div>
        </div>,
      )
      continue
    }

    // --- USER MESSAGE ---
    if (m.role === 'tool') {
      // Standalone tool outputs (rare/orphan)
      out.push(
        <div key={m.id} className="flex justify-start py-2 animate-fade-in-up max-w-5xl mx-auto w-full pl-14">
           <ChatToolCard message={m} cwd={cwd} />
        </div>,
      )
      continue
    }

    out.push(
      <div key={m.id} className="flex flex-col items-end py-6 animate-fade-in-up max-w-5xl mx-auto w-full">
         <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-semibold text-on-surface">You</span>
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary-foreground border border-secondary/10">
               <CircleUser className="w-5 h-5" />
            </div>
         </div>
         
        <div
          className={cn(
            'relative px-5 py-4 text-sm md:text-base shadow-sm',
            'glass-card-inverse text-on-surface border border-outline-variant/15',
            'rounded-2xl',
            'max-w-[90%] md:max-w-[70%]',
          )}
        >
          {m.images?.length ? (
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {m.images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => onPreviewImage(img.url, img.fileName)}
                  className="block overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-highest/40 transition-transform hover:scale-[1.02] outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  title={img.fileName}
                >
                  <img src={img.url} alt={img.fileName} className="h-28 w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
          {m.content ? <div className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</div> : null}
        </div>
      </div>,
    )
  }

  return <div className="flex flex-col pb-8">{out}</div>
}

