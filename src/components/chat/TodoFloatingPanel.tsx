import { CheckCircle2, Circle, ListTodo, Loader2, ChevronsRight, GripVertical, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { GlowingEffect } from '@/components/ui/glowing-effect'
import type { TodoItem } from '@/utils/todos'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

export type TodoFloatingPanelProps = {
  todos: TodoItem[] | null
  open: boolean
  onOpenChange: (open: boolean) => void
  activeSession?: {
    title: string
    cwd?: string
  } | null
  activeModel?: string
  thinking?: boolean
}

type FloatPos = { x: number; y: number }

const POS_STORAGE_KEY = 'claudix:todoPanelPos'
const DEFAULT_POS: FloatPos = { x: 24, y: 96 }
const DRAG_MARGIN_PX = 12
const DRAG_THRESHOLD_PX = 4

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function loadStoredPos(): FloatPos | null {
  try {
    const raw = localStorage.getItem(POS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const x = (parsed as any).x
    const y = (parsed as any).y
    if (typeof x !== 'number' || typeof y !== 'number') return null
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null
    return { x, y }
  } catch {
    return null
  }
}

function storePos(pos: FloatPos) {
  try {
    localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(pos))
  } catch {
    // ignore
  }
}

function getDefaultPosForViewport(): FloatPos {
  // Place near top-right by default.
  const width = 360
  const x = Math.max(DRAG_MARGIN_PX, window.innerWidth - width - 24)
  return { x, y: DEFAULT_POS.y }
}

export function TodoFloatingPanel({ todos, open, onOpenChange, activeSession, activeModel, thinking }: TodoFloatingPanelProps) {
  if (!todos || todos.length < 1) return null

  const total = todos.length
  const completed = todos.filter((t) => t.status === 'completed').length
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0

  const containerRef = useRef<HTMLDivElement | null>(null)
  const pillRef = useRef<HTMLButtonElement | null>(null)
  const suppressNextClickRef = useRef(false)
  const [sessionInfoCollapsed, setSessionInfoCollapsed] = useState(false)

  const [pos, setPos] = useState<FloatPos>(() => {
    if (typeof window === 'undefined') return DEFAULT_POS
    return loadStoredPos() ?? getDefaultPosForViewport()
  })
  const posRef = useRef<FloatPos>(pos)
  useEffect(() => {
    posRef.current = pos
  }, [pos])

  const draggingRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
    width: number
    height: number
    didDrag: boolean
  } | null>(null)

  const applyClampedPos = (next: FloatPos, size: { width: number; height: number }) => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const maxX = Math.max(DRAG_MARGIN_PX, vw - size.width - DRAG_MARGIN_PX)
    const maxY = Math.max(DRAG_MARGIN_PX, vh - size.height - DRAG_MARGIN_PX)
    const clamped: FloatPos = {
      x: clamp(next.x, DRAG_MARGIN_PX, maxX),
      y: clamp(next.y, DRAG_MARGIN_PX, maxY),
    }
    posRef.current = clamped
    setPos(clamped)
  }

  const startDrag = (e: ReactPointerEvent, element: HTMLElement | null) => {
    if (!element) return
    if (e.button !== 0) return
    try {
      element.setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }
    const rect = element.getBoundingClientRect()
    draggingRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: posRef.current.x,
      originY: posRef.current.y,
      width: rect.width,
      height: rect.height,
      didDrag: false,
    }
  }

  const onDragMove = (e: ReactPointerEvent) => {
    const d = draggingRef.current
    if (!d) return
    if (e.pointerId !== d.pointerId) return

    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.didDrag && Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) d.didDrag = true

    const next: FloatPos = { x: d.originX + dx, y: d.originY + dy }
    applyClampedPos(next, { width: d.width, height: d.height })
  }

  const onDragEnd = (e: ReactPointerEvent) => {
    const d = draggingRef.current
    if (!d) return
    if (e.pointerId !== d.pointerId) return
    if (d.didDrag) suppressNextClickRef.current = true
    storePos(posRef.current)
    draggingRef.current = null
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onResize = () => {
      // Clamp to viewport on resize.
      const node = (open ? containerRef.current : pillRef.current) as HTMLElement | null
      const rect = node?.getBoundingClientRect()
      const size = rect ? { width: rect.width, height: rect.height } : { width: 360, height: 200 }
      applyClampedPos(posRef.current, size)
      storePos(posRef.current)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [open])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handle = window.requestAnimationFrame(() => {
      const node = (open ? containerRef.current : pillRef.current) as HTMLElement | null
      const rect = node?.getBoundingClientRect()
      const size = rect ? { width: rect.width, height: rect.height } : { width: 360, height: 200 }
      applyClampedPos(posRef.current, size)
      storePos(posRef.current)
    })
    return () => window.cancelAnimationFrame(handle)
  }, [open])

  const Pill = (
    <button
      type="button"
      ref={pillRef}
      onClick={() => {
        if (suppressNextClickRef.current) {
          suppressNextClickRef.current = false
          return
        }
        onOpenChange(true)
      }}
      onPointerDown={(e) => startDrag(e, pillRef.current)}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
      className={cn(
        'flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-sm transition-all',
        'bg-surface-container-high/80 backdrop-blur-md hover:bg-surface-container-highest/80',
        'border-outline-variant/15 text-on-surface-variant',
      )}
      title="打开任务列表"
    >
      <ListTodo className="w-4 h-4 text-primary" />
      <span>Todos</span>
      <span className="text-muted-foreground">
        {completed}/{total}
      </span>
    </button>
  )

  if (!open) {
    return (
      <div
        className="hidden lg:block fixed z-30 pointer-events-auto"
        style={{ left: pos.x, top: pos.y }}
      >
        {Pill}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="hidden lg:block fixed z-30 pointer-events-auto w-[360px]"
      style={{ left: pos.x, top: pos.y }}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
    >
      <div className="relative rounded-2xl border-0 bg-black shadow-2xl">
        <GlowingEffect
          disabled={false}
          proximity={64}
          spread={80}
          blur={0}
          borderWidth={3}
          glow={true}
          inactiveZone={0.01}
        />
        <div className="relative z-10 rounded-2xl overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 cursor-grab active:cursor-grabbing select-none backdrop-blur-sm"
            onPointerDown={(e) => {
              // 如果点击的是关闭按钮，不触发拖拽
              if ((e.target as HTMLElement).closest('button[title="最小化"]')) return
              startDrag(e, containerRef.current)
            }}
            title="拖拽移动面板"
          >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={cn(
                'shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-lg',
                'text-zinc-500',
              )}
            >
              <GripVertical className="w-4 h-4" />
            </div>
            <ListTodo className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white truncate">Todos</span>
                <span className="text-xs text-zinc-400 shrink-0">
                  {completed}/{total}
                </span>
                <span className="text-[10px] text-zinc-500 shrink-0">{progressPct}%</span>
              </div>
              <div className="h-1.5 mt-1 rounded-full bg-zinc-800/50 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-300" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            onClick={() => onOpenChange(false)}
            title="最小化"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-3 py-3">
          <div className="space-y-2">
            {todos.map((t) => {
              const StatusIcon =
                t.status === 'completed' ? CheckCircle2 : t.status === 'in_progress' ? Loader2 : Circle

              return (
                <div
                  key={t.id}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-xs transition-all duration-200',
                    'border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm hover:bg-zinc-800/50 hover:border-zinc-700/50',
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <StatusIcon
                      className={cn(
                        'w-4 h-4 mt-0.5 shrink-0',
                        t.status === 'completed'
                          ? 'text-green-500'
                          : t.status === 'in_progress'
                            ? 'text-primary animate-spin'
                            : 'text-zinc-600',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          'text-white break-words leading-relaxed',
                          t.status === 'completed' && 'line-through text-zinc-500',
                        )}
                      >
                        {t.content || '(空)'}
                      </div>
                      {t.activeForm ? (
                        <div className="mt-1.5 text-[11px] text-zinc-500 truncate" title={t.activeForm}>
                          {t.activeForm}
                        </div>
                      ) : null}
                    </div>
                    <div
                      className={cn(
                        'shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                        t.status === 'completed'
                          ? 'bg-green-500/10 text-green-400 border-green-500/30'
                          : t.status === 'in_progress'
                            ? 'bg-primary/10 text-primary border-primary/30'
                            : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50',
                      )}
                      title={`status=${t.status}`}
                    >
                      {t.status === 'completed' ? '完成' : t.status === 'in_progress' ? '进行中' : '待办'}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* 当前会话信息 */}
            {activeSession && (
              <div
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-xs transition-all duration-200',
                  'border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm hover:bg-zinc-800/50 hover:border-zinc-700/50',
                )}
              >
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSessionInfoCollapsed(!sessionInfoCollapsed)}
                    className="shrink-0 mt-0.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {sessionInfoCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-white break-words leading-relaxed font-semibold">
                      当前会话
                    </div>
                    {!sessionInfoCollapsed && (
                      <div className="mt-2 space-y-1.5">
                        <div className="text-zinc-300 truncate" title={activeSession.title}>
                          {activeSession.title}
                        </div>
                        <div className="flex items-center gap-2.5 text-[10px] text-zinc-400">
                          {activeModel && (
                            <div className="flex items-center gap-1">
                              <span className={cn('w-1 h-1 rounded-full', thinking ? 'bg-tertiary' : 'bg-primary')} />
                              <span className="truncate">{activeModel}</span>
                            </div>
                          )}
                          {activeSession.cwd && (
                            <div className="flex items-center gap-1 truncate" title={activeSession.cwd}>
                              <FolderOpen className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{activeSession.cwd}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div
                    className={cn(
                      'shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                      'bg-blue-500/10 text-blue-400 border-blue-500/30',
                    )}
                  >
                    会话
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

    </div>
  )
}
