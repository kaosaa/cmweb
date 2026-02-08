import { memo, useMemo, type Dispatch, type SetStateAction } from 'react'
import { Bot, ShieldAlert, Sparkles, CircleUser, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import type { ChatMessage, ThinkingBlock } from '@/types/chat'
import type { InterleavedBlock, ThinkingOpenById } from '@/types/chat-ui'
import { formatSeconds, inferLegacyToolOffset, parseApiError } from '@/utils/chat'
import { ChatMarkdown } from './ChatMarkdown'
import { ChatToolCard } from './ChatToolCard'
import type { ChatMessageListProps } from './ChatMessageList.types'

// ─── 消息组类型 ──────────────────────────────────────────

type AssistantGroup = {
  kind: 'assistant'
  message: ChatMessage
  tools: ChatMessage[]
}

type UserGroup = {
  kind: 'user'
  message: ChatMessage
}

type OrphanToolGroup = {
  kind: 'orphan-tool'
  message: ChatMessage
}

type MessageGroup = AssistantGroup | UserGroup | OrphanToolGroup

// ─── 消息预处理：将 messages 分组 ─────────────────────────

function buildMessageGroups(messages: ChatMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = []

  for (let i = 0; i < messages.length; i += 1) {
    const m = messages[i]

    // 跳过已被后续 assistant 消息关联的 tool 消息
    if (m.role === 'tool') {
      let j = i + 1
      while (j < messages.length && messages[j].role === 'tool') j += 1
      if (j < messages.length && messages[j].role === 'assistant') {
        const nextAssistantId = messages[j].id
        if (m.assistantMessageId == null || m.assistantMessageId === nextAssistantId) continue
      }
    }

    if (m.role === 'assistant') {
      // 收集关联的 tool 消息
      const tools: ChatMessage[] = []
      for (let j = i - 1; j >= 0; j -= 1) {
        if (messages[j].role !== 'tool') break
        tools.unshift(messages[j])
      }
      groups.push({ kind: 'assistant', message: m, tools })
      continue
    }

    if (m.role === 'tool') {
      groups.push({ kind: 'orphan-tool', message: m })
      continue
    }

    // user message
    groups.push({ kind: 'user', message: m })
  }

  return groups
}

// ─── 主组件 ──────────────────────────────────────────────

export const ChatMessageList = memo(function ChatMessageList({
  messages,
  busy,
  streamingAssistantId,
  thinkingEnabled,
  thinkingOpenById,
  setThinkingOpenById,
  cwd,
  onPreviewImage,
}: ChatMessageListProps) {
  const groups = useMemo(() => buildMessageGroups(messages), [messages])

  return (
    <div className="flex flex-col pb-8">
      {groups.map((g) => {
        switch (g.kind) {
          case 'assistant':
            return (
              <AssistantMessageBlock
                key={g.message.id}
                message={g.message}
                tools={g.tools}
                busy={busy}
                streamingAssistantId={streamingAssistantId}
                thinkingEnabled={thinkingEnabled}
                thinkingOpenById={thinkingOpenById}
                setThinkingOpenById={setThinkingOpenById}
                cwd={cwd}
              />
            )
          case 'user':
            return (
              <UserMessageBlock
                key={g.message.id}
                message={g.message}
                onPreviewImage={onPreviewImage}
              />
            )
          case 'orphan-tool':
            return (
              <OrphanToolBlock
                key={g.message.id}
                message={g.message}
                cwd={cwd}
              />
            )
        }
      })}
    </div>
  )
})

// ─── AssistantMessageBlock ───────────────────────────────

type AssistantMessageBlockProps = {
  message: ChatMessage
  tools: ChatMessage[]
  busy: boolean
  streamingAssistantId: string | null
  thinkingEnabled: boolean
  thinkingOpenById: ThinkingOpenById
  setThinkingOpenById: Dispatch<SetStateAction<ThinkingOpenById>>
  cwd?: string | null
}

const AssistantMessageBlock = memo(function AssistantMessageBlock({
  message: m,
  tools,
  busy,
  streamingAssistantId,
  thinkingEnabled,
  thinkingOpenById,
  setThinkingOpenById,
  cwd,
}: AssistantMessageBlockProps) {
  const isStreamingAssistant = busy && m.id === streamingAssistantId

  const thinkingForRender: ThinkingBlock[] = useMemo(() => {
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
      .map((s, index) => ({ index, text: s.trim(), startCharOffset: 0, durationMs: null }))
      .filter((b) => Boolean(b.text))
  }, [m.thinkingBlocks, m.thinking, isStreamingAssistant, thinkingEnabled])

  const content = m.content ?? ''

  const { interleavedBlocks, legacyTools } = useMemo(() => {
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

    const blocks: InterleavedBlock[] = []
    for (let idx = 0; idx < thinkingForRender.length; idx++) {
      const tb = thinkingForRender[idx]
      blocks.push({
        type: 'thinking',
        block: tb,
        blockIdx: idx,
        offset: tb.startCharOffset ?? 0,
        globalIndex: tb.globalIndex ?? null,
      })
    }
    for (const t of toolItems) {
      if (t.offset != null) {
        blocks.push({
          type: 'tool',
          msg: t.msg,
          offset: t.offset,
          globalIndex: t.msg.tool?.globalIndex ?? null,
        })
      }
    }
    blocks.sort((a, b) => {
      if (a.globalIndex != null && b.globalIndex != null) return a.globalIndex - b.globalIndex
      if (a.globalIndex != null && b.globalIndex == null) return -1
      if (a.globalIndex == null && b.globalIndex != null) return 1
      if (a.offset !== b.offset) return a.offset - b.offset
      if (a.type === 'thinking' && b.type === 'tool') return -1
      if (a.type === 'tool' && b.type === 'thinking') return 1
      return 0
    })

    return {
      interleavedBlocks: blocks,
      legacyTools: toolItems.filter((t) => t.offset == null).map((t) => t.msg),
    }
  }, [content, tools, thinkingForRender, m.id])

  // 构建交错节点
  const interleavedNodes = useMemo(() => {
    const nodes: React.JSX.Element[] = []
    const apiError = parseApiError(content)

    if (apiError.isError) {
      nodes.push(
        <div key={`error-${m.id}`} className="rounded-2xl bg-red-50/80 dark:bg-red-500/10 backdrop-blur-sm shadow-lg ring-1 ring-red-300/40 dark:ring-transparent p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100/80 dark:bg-red-500/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">{apiError.errorType}</span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed break-words">{apiError.message}</p>
              {apiError.details && apiError.details !== apiError.message ? (
                <details className="mt-2">
                  <summary className="text-xs text-gray-700 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
                    查看详细信息
                  </summary>
                  <pre className="mt-2 p-2 rounded-lg bg-white/50 dark:bg-white/10 text-xs font-mono whitespace-pre-wrap break-all overflow-x-auto text-gray-800 dark:text-gray-300">
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
            nodes.push(
              <div key={`md-${m.id}-${textCursor}`} className="rounded-2xl bg-white/70 dark:bg-black/75 backdrop-blur-sm shadow-lg ring-1 ring-gray-200/50 dark:ring-transparent p-5">
                <div className="prose-sm md:prose-base dark:prose-invert text-gray-800 dark:text-gray-300 max-w-none break-words overflow-wrap-anywhere">
                  <ChatMarkdown markdown={textChunk} />
                </div>
              </div>,
            )
          }
          textCursor = targetOffset
        }
        if (block.type === 'thinking') {
          const tb = block.block
          const blockIdx = block.blockIdx
          const blockKey = `${m.id}_thinking_${blockIdx}`
          const isLatestBlock = blockIdx === thinkingForRender.length - 1
          const isActive = tb.durationMs == null
          const blockOpen = thinkingOpenById[blockKey] ?? (isActive ? isLatestBlock : false)
          nodes.push(
            <ThinkingBlockNode
              key={blockKey}
              blockKey={blockKey}
              block={tb}
              isActive={isActive}
              blockOpen={blockOpen}
              setThinkingOpenById={setThinkingOpenById}
            />,
          )
        } else if (block.type === 'tool') {
          nodes.push(
            <div key={`tool-${block.msg.id}`} className="w-full">
              <ChatToolCard message={block.msg} cwd={cwd} />
            </div>,
          )
        }
      }
      if (textCursor < content.length) {
        const tail = content.slice(textCursor)
        if (tail) {
          nodes.push(
            <div key={`md-${m.id}-tail`} className="rounded-2xl bg-white/70 dark:bg-black/75 backdrop-blur-sm shadow-lg ring-1 ring-gray-200/50 dark:ring-transparent p-5">
              <div className="prose-sm md:prose-base dark:prose-invert text-gray-800 dark:text-gray-300 max-w-none break-words overflow-wrap-anywhere">
                <ChatMarkdown markdown={tail} />
              </div>
            </div>,
          )
        }
      }
    }

    // 仅在 streaming 且无内容无 thinking 时显示 spinner
    const hasThinking = thinkingForRender.length > 0
    if (!content && !hasThinking && isStreamingAssistant) {
      nodes.push(
        <div key="spinner" className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container-high/20 border border-transparent">
          <Spinner className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">CM 正在思考...</span>
        </div>,
      )
    }

    return nodes
  }, [content, m.id, interleavedBlocks, thinkingForRender, thinkingOpenById, setThinkingOpenById, cwd, isStreamingAssistant])

  return (
    <div key={m.id} className="flex gap-4 w-full max-w-5xl mx-auto py-4">
      {/* Avatar */}
      <div className="shrink-0 flex flex-col items-center">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/10">
          <Bot className="w-6 h-6" />
        </div>
      </div>
      {/* Content */}
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
    </div>
  )
})

// ─── ThinkingBlockNode ───────────────────────────────────

type ThinkingBlockNodeProps = {
  blockKey: string
  block: ThinkingBlock
  isActive: boolean
  blockOpen: boolean
  setThinkingOpenById: Dispatch<SetStateAction<ThinkingOpenById>>
}

const ThinkingBlockNode = memo(function ThinkingBlockNode({
  blockKey,
  block: tb,
  isActive,
  blockOpen,
  setThinkingOpenById,
}: ThinkingBlockNodeProps) {
  return (
    <div className="w-full">
      <details
        className="group rounded-2xl bg-white/70 dark:bg-black/75 backdrop-blur-sm shadow-lg ring-1 ring-gray-200/50 dark:ring-transparent text-xs transition-all duration-200"
        open={blockOpen}
        onToggle={(e) => {
          const open = (e.currentTarget as HTMLDetailsElement | null)?.open ?? false
          setThinkingOpenById((prev) => ({ ...prev, [blockKey]: open }))
        }}
      >
        <summary className="cursor-pointer select-none font-medium flex items-center justify-between p-4 text-gray-800 dark:text-gray-300 hover:bg-gray-100/40 dark:hover:bg-white/10 rounded-t-2xl group-[&:not([open])]:rounded-2xl transition-colors outline-none [&::-webkit-details-marker]:hidden list-none">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>
              {isActive ? '正在思考...' : `思考过程 (${formatSeconds(tb.durationMs)})`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isActive && <Spinner className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />}
            <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180 text-gray-500 dark:text-gray-400" />
          </div>
        </summary>
        <div className="p-4 pt-0 border-t border-gray-200/60 dark:border-transparent">
          <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-gray-700 dark:text-gray-400">
            {tb.text || '...'}
          </pre>
        </div>
      </details>
    </div>
  )
})

// ─── UserMessageBlock ────────────────────────────────────

type UserMessageBlockProps = {
  message: ChatMessage
  onPreviewImage: (src: string, alt?: string) => void
}

const UserMessageBlock = memo(function UserMessageBlock({
  message: m,
  onPreviewImage,
}: UserMessageBlockProps) {
  return (
    <div className="flex flex-col items-end py-6 max-w-5xl mx-auto w-full">
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
    </div>
  )
})

// ─── OrphanToolBlock ─────────────────────────────────────

type OrphanToolBlockProps = {
  message: ChatMessage
  cwd?: string | null
}

const OrphanToolBlock = memo(function OrphanToolBlock({
  message: m,
  cwd,
}: OrphanToolBlockProps) {
  return (
    <div className="flex justify-start py-2 max-w-5xl mx-auto w-full pl-14">
      <ChatToolCard message={m} cwd={cwd} />
    </div>
  )
})
