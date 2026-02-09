import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChatImage, ChatMessage, ChatSession, ChatSessionSummary, DraftImage, ModelsResponse, StreamEvent, ThinkingBlock } from '@/types/chat'
import type { DeleteConfirmState, ThinkingOpenById } from '@/types/chat-ui'
import type { PermissionRequest } from '@/types/permissions'
import {
  compactChatSession,
  createChatSession,
  deleteChatSession,
  getChatSession,
  getModels,
  listChatSessions,
  openChatStream,
  sendPermissionDecision,
  updateChatSession,
  uploadImageFile,
} from '@/services/chat-api'
import { localId } from '@/utils/chat'

type CompactNotice =
  | {
      type: 'microcompact'
      preTokens: number
      tokensSaved: number
      trigger: string
      createdAt: number
    }
  | {
      type: 'compact'
      preTokens: number
      trigger: string
      createdAt: number
    }

const FALLBACK_MODELS = [
  'claude-opus-4-5-20251101',
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-5-20250929',
]

const FALLBACK_DEFAULT_MODEL = 'claude-sonnet-4-5-20250929'
const LAST_CWD_STORAGE_KEY = 'claudix:lastCwd'
const ACTIVE_SESSION_STORAGE_KEY = 'claudix:activeSessionId'

export function useChatController() {
  const [models, setModels] = useState<string[]>(FALLBACK_MODELS)
  const [defaultModel, setDefaultModel] = useState<string>(FALLBACK_DEFAULT_MODEL)

  const [sessions, setSessions] = useState<ChatSessionSummary[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)

  const [composerText, setComposerText] = useState('')
  const [draftImages, setDraftImages] = useState<DraftImage[]>([])

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [thinkingOpenById, setThinkingOpenById] = useState<ThinkingOpenById>({})

  // Streaming progress stats
  const [streamingStats, setStreamingStats] = useState<{
    textChars: number
    thinkingChars: number
    toolCalls: number
    startTime: number | null
  } | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const streamingAssistantIdRef = useRef<string | null>(null)
  const streamingUserIdRef = useRef<string | null>(null)
  const activeSessionIdRef = useRef<string | null>(null)
  const toolCallMsgIdsRef = useRef<Map<string, string>>(new Map())
  const streamingStatsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [newChatOpen, setNewChatOpen] = useState(false)
  const [newChatCwd, setNewChatCwd] = useState(() => {
    try {
      return localStorage.getItem(LAST_CWD_STORAGE_KEY) ?? ''
    } catch {
      return ''
    }
  })

  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>(null)

  const [pendingPermission, setPendingPermission] = useState<PermissionRequest | null>(null)

  const [compactNotice, setCompactNotice] = useState<CompactNotice | null>(null)

  useEffect(() => {
    let canceled = false
    void (async () => {
      try {
        const data: ModelsResponse = await getModels()
        const nextModels = Array.isArray(data.models) ? data.models : FALLBACK_MODELS
        const nextDefault = (data.defaultModel || nextModels[0] || FALLBACK_DEFAULT_MODEL).trim()
        if (canceled) return
        setModels(nextModels)
        setDefaultModel(nextDefault)
      } catch {
        // ignore - fallback models are already set
      }
    })()

    return () => {
      canceled = true
    }
  }, [])

  const loadSessions = useCallback(async () => {
    const data = await listChatSessions()
    const list = Array.isArray(data) ? data : []
    setSessions(list)
    return list
  }, [])

  const loadSession = useCallback(async (id: string) => {
    const data = await getChatSession(id)
    setActiveSession(data)
    return data
  }, [])

  useEffect(() => {
    let canceled = false
    void (async () => {
      try {
        const raw = await listChatSessions()
        if (canceled) return
        const s = Array.isArray(raw) ? raw : []
        setSessions(s)

        let initialId: string | null = null
        try {
          const stored = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY)
          if (stored && s.some((x) => x.id === stored)) initialId = stored
        } catch {
          // ignore
        }
        if (!initialId) initialId = s[0]?.id ?? null
        setActiveSessionId(initialId)
        if (initialId) {
          await loadSession(initialId)
        } else {
          setActiveSession(null)
          setNewChatOpen(true)
        }
      } catch (e) {
        if (canceled) return
        setError((e as Error).message || String(e))
      }
    })()

    return () => {
      canceled = true
    }
  }, [loadSession])

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId
  }, [activeSessionId])

  useEffect(() => {
    setThinkingOpenById({})
    // 切换会话时清除旧的 streamingStats 延时
    if (streamingStatsTimeoutRef.current) {
      clearTimeout(streamingStatsTimeoutRef.current)
      streamingStatsTimeoutRef.current = null
    }
    setStreamingStats(null)
  }, [activeSessionId])

  useEffect(() => {
    setCompactNotice(null)
  }, [activeSessionId])

  useEffect(() => {
    if (!activeSessionId) return
    // 切换会话时立即释放旧数据，减少内存峰值
    setActiveSession(null)
    // 中止正在进行的流式请求
    abortRef.current?.abort()
    try {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, activeSessionId)
    } catch {
      // ignore
    }
    void loadSession(activeSessionId)
  }, [activeSessionId, loadSession])

  const canSend = useMemo(() => {
    if (busy) return false
    if (!activeSessionId) return false
    const hasText = Boolean(composerText.trim())
    const hasReadyImages = draftImages.some((d) => d.status === 'ready' && d.uploaded != null)
    if (!hasText && !hasReadyImages) return false
    if (draftImages.some((d) => d.status === 'uploading')) return false
    return true
  }, [activeSessionId, busy, composerText, draftImages])

  const removeDraftImage = useCallback((clientId: string) => {
    setDraftImages((prev) => {
      const found = prev.find((d) => d.clientId === clientId)
      if (found?.localUrl) {
        try {
          URL.revokeObjectURL(found.localUrl)
        } catch {
          // ignore
        }
      }
      return prev.filter((d) => d.clientId !== clientId)
    })
  }, [])

  const onPickImages = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length < 1) return

      const max = 8
      const remaining = Math.max(0, max - draftImages.length)
      if (remaining <= 0) {
        setError(`图片数量过多（最多 ${max} 张）。`)
        return
      }

      const selected = Array.from(files).slice(0, remaining)
      if (selected.length < files.length) {
        setError(`图片数量过多（最多 ${max} 张）。`)
      }

      const additions: DraftImage[] = selected.map((file) => ({
        clientId: localId('img'),
        file,
        localUrl: URL.createObjectURL(file),
        status: 'uploading',
        error: null,
        uploaded: null,
      }))

      setDraftImages((prev) => [...prev, ...additions])

      await Promise.all(
        additions.map(async (draft) => {
          try {
            const uploaded = await uploadImageFile(draft.file)
            setDraftImages((prev) =>
              prev.map((d) =>
                d.clientId === draft.clientId ? { ...d, status: 'ready', uploaded, error: null } : d,
              ),
            )
          } catch (e) {
            setDraftImages((prev) =>
              prev.map((d) =>
                d.clientId === draft.clientId
                  ? { ...d, status: 'error', uploaded: null, error: (e as Error).message || String(e) }
                  : d,
              ),
            )
          }
        }),
      )
    },
    [draftImages.length],
  )

  const send = useCallback(async () => {
    if (!canSend) return

    setBusy(true)
    setError(null)
    toolCallMsgIdsRef.current.clear()
    // Initialize streaming stats
    setStreamingStats({
      textChars: 0,
      thinkingChars: 0,
      toolCalls: 0,
      startTime: Date.now(),
    })

    const controller = new AbortController()
    abortRef.current = controller

    const prompt = composerText
    setComposerText('')

    const imagesToSend: ChatImage[] = draftImages
      .filter((d) => d.status === 'ready' && d.uploaded != null)
      .map((d) => d.uploaded!)
    const imageIds = imagesToSend.map((img) => img.id)

    const localUrls = draftImages.map((d) => d.localUrl)
    setDraftImages([])
    for (const url of localUrls) {
      try {
        URL.revokeObjectURL(url)
      } catch {
        // ignore
      }
    }

    const tmpUserId = localId('user')
    const tmpAssistantId = localId('assistant')
    streamingAssistantIdRef.current = tmpAssistantId
    streamingUserIdRef.current = tmpUserId

    let assistantTextLen = 0
    let globalIndexCounter = 0

    setActiveSession((prev) => {
      if (!prev || prev.id !== activeSessionId) return prev
      const now = new Date().toISOString()
      const nextMessages: ChatMessage[] = [
        ...prev.messages,
        {
          id: tmpUserId,
          role: 'user',
          createdAtUtc: now,
          content: prompt,
          images: imagesToSend.length ? imagesToSend : null,
        },
        {
          id: tmpAssistantId,
          role: 'assistant',
          createdAtUtc: now,
          content: '',
          thinking: '',
          thinkingBlocks: [],
          thinkingDurationMs: null,
        },
      ]
      return { ...prev, messages: nextMessages }
    })

    try {
      const res = await openChatStream(activeSessionId!, { prompt, imageIds }, controller.signal)

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `${res.status} ${res.statusText}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        while (true) {
          const nl = buffer.indexOf('\n')
          if (nl < 0) break

          const line = buffer.slice(0, nl).trim()
          buffer = buffer.slice(nl + 1)
          if (!line) continue

          let ev: StreamEvent | null = null
          try {
            ev = JSON.parse(line) as StreamEvent
          } catch {
            ev = null
          }
          if (!ev) continue

          if (ev.type === 'meta') {
            // ignore (too noisy for UI)
          } else if (ev.type === 'thinking') {
            const id = streamingAssistantIdRef.current
            if (!id) continue
            // Update streaming stats
            setStreamingStats((prev) =>
              prev ? { ...prev, thinkingChars: prev.thinkingChars + (ev.delta?.length || 0) } : prev,
            )
            setThinkingOpenById((prev) => (id in prev ? prev : { ...prev, [id]: true }))
            setActiveSession((prev) => {
              if (!prev || prev.id !== activeSessionId) return prev
              const idx = prev.messages.findIndex((m) => m.id === id)
              if (idx < 0) return prev
              const cur = prev.messages[idx]
              if (cur.role !== 'assistant') return prev

              const THINKING_BREAK = '<<<THINKING_BREAK>>>'
              const blocks: ThinkingBlock[] = Array.isArray(cur.thinkingBlocks)
                ? cur.thinkingBlocks.map((b) => ({ ...b }))
                : []

              const ensureBlock = () => {
                if (blocks.length > 0) return
                blocks.push({
                  index: 0,
                  text: '',
                  startCharOffset: assistantTextLen,
                  durationMs: null,
                  globalIndex: globalIndexCounter++,
                })
              }

              const startNewBlock = () => {
                blocks.push({
                  index: blocks.length,
                  text: '',
                  startCharOffset: assistantTextLen,
                  durationMs: null,
                  globalIndex: globalIndexCounter++,
                })
              }

              const appendToCurrent = (text: string) => {
                ensureBlock()
                const last = blocks[blocks.length - 1]
                if (!last) return
                last.text = (last.text ?? '') + text
              }

              const delta = ev.delta || ''
              if (delta.includes(THINKING_BREAK)) {
                const parts = delta.split(THINKING_BREAK)
                for (let i = 0; i < parts.length; i += 1) {
                  const part = parts[i] ?? ''
                  if (part.trim()) appendToCurrent(part)
                  if (i < parts.length - 1) startNewBlock()
                }
              } else {
                appendToCurrent(delta)
              }
              const next = [...prev.messages]
              next[idx] = {
                ...cur,
                thinking: (cur.thinking ?? '') + ev.delta,
                thinkingBlocks: blocks,
              }
              return { ...prev, messages: next }
            })
          } else if (ev.type === 'text') {
            assistantTextLen += ev.delta.length
            const id = streamingAssistantIdRef.current
            if (!id) continue
            // Update streaming stats
            setStreamingStats((prev) =>
              prev ? { ...prev, textChars: prev.textChars + (ev.delta?.length || 0) } : prev,
            )
            setActiveSession((prev) => {
              if (!prev || prev.id !== activeSessionId) return prev
              const idx = prev.messages.findIndex((m) => m.id === id)
              if (idx < 0) return prev
              const cur = prev.messages[idx]
              if (cur.role !== 'assistant') return prev
              const next = [...prev.messages]
              next[idx] = { ...cur, content: cur.content + ev.delta }
              return { ...prev, messages: next }
            })
          } else if (ev.type === 'usage') {
            const id = streamingAssistantIdRef.current
            if (!id) continue
            setActiveSession((prev) => {
              if (!prev || prev.id !== activeSessionId) return prev
              const idx = prev.messages.findIndex((m) => m.id === id)
              if (idx < 0) return prev
              const cur = prev.messages[idx]
              if (cur.role !== 'assistant') return prev
              const next = [...prev.messages]
              next[idx] = { ...cur, usage: ev.usage }
              return { ...prev, messages: next }
            })
          } else if (ev.type === 'microcompact') {
            setCompactNotice({ ...ev, createdAt: Date.now() })
          } else if (ev.type === 'compact') {
            setCompactNotice({ ...ev, createdAt: Date.now() })
          } else if (ev.type === 'ids') {
            const tmpA = streamingAssistantIdRef.current
            const tmpU = streamingUserIdRef.current
            streamingAssistantIdRef.current = ev.assistantMessageId
            streamingUserIdRef.current = ev.userMessageId
            if (tmpA) {
              setThinkingOpenById((prev) => {
                if (!(tmpA in prev)) return prev
                const { [tmpA]: v, ...rest } = prev
                return { ...rest, [ev.assistantMessageId]: v }
              })
            }
            setActiveSession((prev) => {
              if (!prev || prev.id !== activeSessionId) return prev
              const next = prev.messages.map((m) => {
                if (tmpU && m.id === tmpU) return { ...m, id: ev.userMessageId }
                if (tmpA && m.id === tmpA) return { ...m, id: ev.assistantMessageId }
                if (tmpA && m.role === 'tool' && m.assistantMessageId === tmpA) {
                  return { ...m, assistantMessageId: ev.assistantMessageId }
                }
                return m
              })
              return { ...prev, messages: next }
            })
          } else if (ev.type === 'tool_call') {
            const assistantId = streamingAssistantIdRef.current
            if (!assistantId) continue

            // Update streaming stats
            setStreamingStats((prev) =>
              prev ? { ...prev, toolCalls: prev.toolCalls + 1 } : prev,
            )

            const toolMsgId = localId('tool')
            const toolUseId = ev.id

            console.log('[tool_call] received:', {
              toolUseId,
              toolMsgId,
              name: ev.name,
              inputKeys: ev.input ? Object.keys(ev.input) : null,
            })

            if (toolUseId) {
              toolCallMsgIdsRef.current.set(toolUseId, toolMsgId)
            }

            const toolGlobalIndex = globalIndexCounter++
            setActiveSession((prev) => {
              if (!prev || prev.id !== activeSessionId) return prev
              const idx = prev.messages.findIndex((m) => m.id === assistantId)
              const toolMsg: ChatMessage = {
                id: toolMsgId,
                role: 'tool',
                createdAtUtc: new Date().toISOString(),
                content: '',
                assistantMessageId: assistantId,
                assistantCharOffset: assistantTextLen,
                tool: {
                  name: ev.name,
                  input: ev.input,
                  output: null,
                  isError: Boolean(ev.isError),
                  globalIndex: toolGlobalIndex,
                },
              }
              const next = [...prev.messages]
              if (idx >= 0) next.splice(idx, 0, toolMsg)
              else next.push(toolMsg)
              return { ...prev, messages: next }
            })
          } else if (ev.type === 'tool_output') {
            const assistantId = streamingAssistantIdRef.current
            if (!assistantId) continue
            const toolUseId = ev.id
            const existingMsgId = toolUseId ? toolCallMsgIdsRef.current.get(toolUseId) : null

            console.log('[tool_output] received:', {
              toolUseId,
              existingMsgId,
              name: ev.name,
              outputLen: ev.output?.length,
              isError: ev.isError,
              toolCallMsgIds: Array.from(toolCallMsgIdsRef.current.entries()),
            })

            setActiveSession((prev) => {
              if (!prev || prev.id !== activeSessionId) return prev

              if (existingMsgId) {
                const toolMsgIdx = prev.messages.findIndex((m) => m.id === existingMsgId)
                if (toolMsgIdx >= 0) {
                  const existingMsg = prev.messages[toolMsgIdx]
                  if (existingMsg.role === 'tool' && existingMsg.tool) {
                    const next = [...prev.messages]
                    next[toolMsgIdx] = {
                      ...existingMsg,
                      tool: {
                        ...existingMsg.tool,
                        output: ev.output,
                        isError: Boolean(ev.isError),
                      },
                    }
                    return { ...prev, messages: next }
                  }
                }
              }

              // Best-effort merge when tool_use_id isn't available or didn't match:
              // update the latest pending tool_call (same name, no output yet) instead of creating a new card.
              const pendingIdx = (() => {
                for (let k = prev.messages.length - 1; k >= 0; k -= 1) {
                  const msg = prev.messages[k]
                  if (msg.role !== 'tool' || !msg.tool) continue
                  if (msg.tool.output != null) continue
                  if (msg.tool.name !== ev.name) continue
                  if (msg.assistantMessageId != null && msg.assistantMessageId !== assistantId) continue
                  return k
                }
                return -1
              })()

              if (pendingIdx >= 0) {
                const existingMsg = prev.messages[pendingIdx]
                if (existingMsg.role === 'tool' && existingMsg.tool) {
                  const next = [...prev.messages]
                  next[pendingIdx] = {
                    ...existingMsg,
                    tool: {
                      ...existingMsg.tool,
                      output: ev.output,
                      isError: Boolean(ev.isError),
                    },
                  }
                  return { ...prev, messages: next }
                }
              }

              const idx = prev.messages.findIndex((m) => m.id === assistantId)
              const toolMsg: ChatMessage = {
                id: localId('tool'),
                role: 'tool',
                createdAtUtc: new Date().toISOString(),
                content: '',
                assistantMessageId: assistantId,
                assistantCharOffset: assistantTextLen,
                tool: {
                  name: ev.name,
                  input: null,
                  output: ev.output,
                  isError: Boolean(ev.isError),
                },
              }
              const next = [...prev.messages]
              if (idx >= 0) next.splice(idx, 0, toolMsg)
              else next.push(toolMsg)
              return { ...prev, messages: next }
            })
          } else if (ev.type === 'assistant_end') {
            const id = ev.assistantMessageId
            setThinkingOpenById((prev) => {
              const next = { ...prev }
              for (const key of Object.keys(next)) {
                if (key === id || key.startsWith(`${id}_thinking_`)) {
                  next[key] = false
                }
              }
              return next
            })
            setActiveSession((prev) => {
              if (!prev || prev.id !== activeSessionId) return prev
              const idx = prev.messages.findIndex((m) => m.id === id)
              if (idx < 0) return prev
              const cur = prev.messages[idx]
              if (cur.role !== 'assistant') return prev
              const next = [...prev.messages]
              next[idx] = {
                ...cur,
                thinkingDurationMs: ev.thinkingDurationMs,
                thinkingBlocks: ev.thinkingBlocks ?? cur.thinkingBlocks,
              }
              return { ...prev, messages: next }
            })
          } else if (ev.type === 'permission_request') {
            setPendingPermission({
              id: ev.request_id,
              toolName: ev.tool_name,
              input: ev.tool_input,
              sessionId: activeSessionId!,
            })
          } else if (ev.type === 'terminated') {
            const toolName = ev.tool_name || ''
            setError(`工具调用被拒绝${toolName ? `（${toolName}）` : ''}，对话已终止。`)
          } else if (ev.type === 'error') {
            setError(ev.message || '未知错误。')
          }
        }
      }
      await loadSessions()
      if (activeSessionIdRef.current === activeSessionId) {
        await loadSession(activeSessionId!)
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        setError('已取消。')
      } else {
        setError((e as Error).message || String(e))
      }
    } finally {
      abortRef.current = null
      streamingAssistantIdRef.current = null
      streamingUserIdRef.current = null
      toolCallMsgIdsRef.current.clear()
      setBusy(false)
      // Clear streaming stats after a short delay so user can see final count
      if (streamingStatsTimeoutRef.current) clearTimeout(streamingStatsTimeoutRef.current)
      streamingStatsTimeoutRef.current = setTimeout(() => setStreamingStats(null), 3000)
    }
  }, [activeSessionId, canSend, composerText, draftImages, loadSession, loadSessions])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const createChat = useCallback(async () => {
    setError(null)
    try {
      const cwd = newChatCwd.trim()
      const session = await createChatSession(cwd || undefined)
      setNewChatOpen(false)
      try {
        if (cwd) localStorage.setItem(LAST_CWD_STORAGE_KEY, cwd)
      } catch {
        // ignore
      }

      await loadSessions()
      setActiveSessionId(session.id)
      await loadSession(session.id)
    } catch (e) {
      setError((e as Error).message || String(e))
    }
  }, [loadSession, loadSessions, newChatCwd])

  const deleteChat = useCallback(
    async (id: string) => {
      setError(null)
      try {
        await deleteChatSession(id)
        setDeleteConfirm(null)
        const next = await loadSessions()
        if (activeSessionId === id) {
          const nextId = next[0]?.id ?? null
          setActiveSessionId(nextId)
          if (nextId) await loadSession(nextId)
          else setActiveSession(null)
        }
      } catch (e) {
        setError((e as Error).message || String(e))
      }
    },
    [activeSessionId, loadSession, loadSessions],
  )

  const updateActiveSession = useCallback(
    async (patch: Partial<Pick<ChatSession, 'model' | 'thinking' | 'cwd' | 'permissionMode'>>) => {
      if (!activeSessionId) return
      try {
        const updated = await updateChatSession(activeSessionId, patch)
        setActiveSession(updated)
        await loadSessions()
      } catch (e) {
        setError((e as Error).message || String(e))
      }
    },
    [activeSessionId, loadSessions],
  )

  const compactActiveSession = useCallback(
    async (keepTurns?: number) => {
      if (!activeSessionId) return
      if (busy) return
      setError(null)
      try {
        await compactChatSession(activeSessionId, typeof keepTurns === 'number' ? { keepTurns } : undefined)
        setCompactNotice(null)
        await loadSessions()
        if (activeSessionIdRef.current === activeSessionId) {
          await loadSession(activeSessionId)
        }
      } catch (e) {
        setError((e as Error).message || String(e))
      }
    },
    [activeSessionId, busy, loadSession, loadSessions],
  )

  const handlePermissionApprove = useCallback(
    async (id: string) => {
      if (pendingPermission?.id === id) {
        try {
          await sendPermissionDecision(id, 'allow')
        } catch (e) {
          console.error('Failed to send permission approval:', e)
        }
        setPendingPermission(null)
      }
    },
    [pendingPermission],
  )

  const handlePermissionReject = useCallback(
    async (id: string, reason?: string) => {
      if (pendingPermission?.id === id) {
        try {
          await sendPermissionDecision(id, 'deny', reason || 'User denied permission')
        } catch (e) {
          console.error('Failed to send permission rejection:', e)
        }
        setPendingPermission(null)
      }
    },
    [pendingPermission],
  )

  const openNewChat = useCallback(() => {
    try {
      const remembered = localStorage.getItem(LAST_CWD_STORAGE_KEY) ?? ''
      const next = (remembered || activeSession?.cwd || '').trim()
      if (next) setNewChatCwd(next)
    } catch {
      // ignore
    }
    setNewChatOpen(true)
  }, [activeSession?.cwd])

  const onChangeNewChatCwd = useCallback((path: string) => {
    setNewChatCwd(path)
    try {
      const v = (path || '').trim()
      if (v) localStorage.setItem(LAST_CWD_STORAGE_KEY, v)
    } catch {
      // ignore
    }
  }, [])

  return {
    models,
    defaultModel,
    sessions,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    composerText,
    setComposerText,
    draftImages,
    removeDraftImage,
    onPickImages,
    busy,
    error,
    setError,
    thinkingOpenById,
    setThinkingOpenById,
    canSend,
    send,
    cancel,
    streamingAssistantId: streamingAssistantIdRef.current,
    streamingStats,
    newChatOpen,
    setNewChatOpen,
    newChatCwd,
    openNewChat,
    onChangeNewChatCwd,
    createChat,
    deleteConfirm,
    setDeleteConfirm,
    deleteChat,
    updateActiveSession,
    pendingPermission,
    handlePermissionApprove,
    handlePermissionReject,
    compactNotice,
    clearCompactNotice: () => setCompactNotice(null),
    compactActiveSession,
  }
}
