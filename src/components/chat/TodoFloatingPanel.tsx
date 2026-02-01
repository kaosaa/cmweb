import { CheckCircle2, Circle, ListTodo, Loader2, ChevronsRight, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { TodoItem } from '@/utils/todos'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

export type TodoFloatingPanelProps = {
  todos: TodoItem[] | null
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function TodoFloatingPanel({ todos, open, onOpenChange }: TodoFloatingPanelProps) {
  if (!todos || todos.length < 1) return null

  const total = todos.length
  const completed = todos.filter((t) => t.status === 'completed').length
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0

  const containerRef = useRef<HTMLDivElement | null>(null)
  const pillRef = useRef<HTMLButtonElement | null>(null)
  const suppressNextClickRef = useRef(false)

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
        'border-outline-variant/30 text-on-surface-variant',
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
      <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-high/85 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              className={cn(
                'shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-lg',
                'text-muted-foreground/70 hover:bg-surface-container-highest/40',
                'cursor-grab active:cursor-grabbing',
              )}
              onPointerDown={(e) => startDrag(e, containerRef.current)}
              title="拖动移动"
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <ListTodo className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-on-surface truncate">Todos</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {completed}/{total}
                </span>
                <span className="text-[10px] text-muted-foreground/80 shrink-0">{progressPct}%</span>
              </div>
              <div className="h-1.5 mt-1 rounded-full bg-outline-variant/20 overflow-hidden">
                <div className="h-full bg-primary/70" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-surface-container-highest"
            onClick={() => onOpenChange(false)}
            title="最小化"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-2 py-2">
          <div className="space-y-1">
            {todos.map((t) => {
              const StatusIcon =
                t.status === 'completed' ? CheckCircle2 : t.status === 'in_progress' ? Loader2 : Circle

              return (
                <div
                  key={t.id}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-xs transition-colors',
                    'border-outline-variant/20 bg-surface/50 hover:bg-surface-container-highest/40',
                  )}
                >
                <div className="flex items-start gap-2">
                    <StatusIcon
                      className={cn(
                        'w-4 h-4 mt-0.5 shrink-0',
                        t.status === 'completed'
                          ? 'text-green-600 dark:text-green-400'
                          : t.status === 'in_progress'
                            ? 'text-tertiary animate-spin'
                            : 'text-muted-foreground',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          'text-on-surface break-words leading-relaxed',
                          t.status === 'completed' && 'line-through text-muted-foreground',
                        )}
                      >
                        {t.content || '(空)'}
                      </div>
                      {t.activeForm ? (
                        <div className="mt-1 text-[11px] text-muted-foreground truncate" title={t.activeForm}>
                          {t.activeForm}
                        </div>
                      ) : null}
                    </div>
                    <div
                      className={cn(
                        'shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                        t.status === 'completed'
                          ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
                          : t.status === 'in_progress'
                            ? 'bg-tertiary/10 text-tertiary border-tertiary/20'
                            : 'bg-surface-container-highest/40 text-muted-foreground border-outline-variant/30',
                      )}
                      title={`status=${t.status}`}
                    >
                      {t.status === 'completed' ? '完成' : t.status === 'in_progress' ? '进行中' : '待办'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

    </div>
  )
}
