import { useState, useEffect, useCallback, useMemo } from 'react'
import { Modal } from '@/components/Modal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlertTriangle, Check, ChevronDown, X } from 'lucide-react'
import type { PermissionRequest } from '@/types/permissions'
import { getInputPreview, getToolMeta, isDangerousTool } from '@/utils/tool-auth'

export function ToolAuthModal({
  request,
  onApprove,
  onReject,
  onClose,
}: {
  request: PermissionRequest
  onApprove: (id: string) => void
  onReject: (id: string, reason?: string) => void
  onClose: () => void
}) {
  const [rejectReason, setRejectReason] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [entered, setEntered] = useState(false)

  const isDangerous = isDangerousTool(request.toolName)
  const meta = getToolMeta(request.toolName)
  const preview = useMemo(() => getInputPreview(request.toolName, request.input), [request.toolName, request.input])
  const Icon = meta.icon

  useEffect(() => {
    const t = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(t)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return

      if (e.key === 'y' || e.key === 'Y' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault()
        onApprove(request.id)
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
        e.preventDefault()
        onReject(request.id, rejectReason || undefined)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [request.id, rejectReason, onApprove, onReject])

  const formatInput = useCallback((input: unknown): string => {
    if (input == null) return ''
    if (typeof input === 'string') return input
    try {
      return JSON.stringify(input, null, 2)
    } catch {
      return String(input)
    }
  }, [])

  return (
    <Modal open={true} title="" onClose={onClose} className="max-w-md p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
      <div
        className={cn(
          'transition-all duration-300 ease-out',
          entered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95',
        )}
      >
        <div
          className={cn(
            'h-1 w-full',
            isDangerous
              ? 'bg-gradient-to-r from-red-500 via-orange-400 to-amber-400'
              : 'bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-400',
          )}
        />

        <div className="px-6 pt-5 pb-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
                'ring-1 ring-inset',
                meta.bgColor,
                meta.color,
                isDangerous ? 'ring-red-500/20' : 'ring-primary/20',
              )}
            >
              <Icon className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 mb-1">
                {isDangerous && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-semibold uppercase tracking-wider">
                    <AlertTriangle className="w-3 h-3" />
                    危险
                  </span>
                )}
                <h3 className="text-base font-semibold text-on-surface">{meta.label}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{meta.description}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground/60 font-medium">工具</span>
            <code className="px-2 py-0.5 rounded-md bg-surface-container-highest/60 text-xs font-mono text-on-surface-variant">
              {request.toolName}
            </code>
          </div>
        </div>

        {preview && (
          <div className="mx-6 mb-3 px-3 py-2.5 rounded-xl bg-surface-container-highest/40 border border-outline-variant/15">
            <pre className="text-xs font-mono text-on-surface leading-relaxed whitespace-pre-wrap break-all overflow-hidden max-h-20">
              {preview}
            </pre>
          </div>
        )}

        <div className="px-6 pb-3">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className={cn(
              'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs',
              'transition-colors',
              showDetails
                ? 'bg-surface-container-highest/60 text-on-surface-variant'
                : 'bg-surface-container-highest/30 text-muted-foreground hover:bg-surface-container-highest/50',
            )}
          >
            <span className="font-medium">完整参数</span>
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', showDetails && 'rotate-180')} />
          </button>

          {showDetails && (
            <div className="mt-2 rounded-xl bg-[var(--md-sys-color-surface-container-highest)]/20 border border-outline-variant/15 overflow-hidden animate-in slide-in-from-top-1 duration-200">
              <pre className="p-3.5 text-[11px] font-mono text-on-surface-variant overflow-auto max-h-[180px] whitespace-pre-wrap break-words leading-relaxed">
                {formatInput(request.input)}
              </pre>
            </div>
          )}
        </div>

        <div className="px-6 pb-4">
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="拒绝原因（可选，按 N 拒绝）"
            className={cn(
              'w-full px-3.5 py-2 rounded-xl text-xs',
              'bg-surface-container-highest/30 border border-outline-variant/15',
              'text-on-surface placeholder:text-muted-foreground/40',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30',
              'transition-all',
            )}
          />
        </div>

        <div className={cn('px-6 py-4 flex items-center justify-between gap-3', 'border-t border-outline-variant/10 bg-surface-container/50')}>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
            <span className="flex items-center gap-1.5">
              <kbd className="inline-flex items-center justify-center w-5 h-5 rounded bg-surface-container-highest/80 text-[10px] font-mono font-semibold text-muted-foreground">
                Y
              </kbd>
              <span>允许</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="inline-flex items-center justify-center w-5 h-5 rounded bg-surface-container-highest/80 text-[10px] font-mono font-semibold text-muted-foreground">
                N
              </kbd>
              <span>拒绝</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onReject(request.id, rejectReason || undefined)}
              className="h-9 rounded-full px-4 text-xs font-medium text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors"
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              拒绝
            </Button>
            <Button
              type="button"
              onClick={() => onApprove(request.id)}
              className={cn(
                'h-9 rounded-full px-5 text-xs font-medium transition-all',
                'shadow-sm hover:shadow-md',
                isDangerous
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600',
              )}
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              允许执行
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

