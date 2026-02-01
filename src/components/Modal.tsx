import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export function Modal({
  open,
  title,
  onClose,
  children,
  className,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        role="button"
        tabIndex={-1}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={cn(
            'w-full max-w-2xl max-h-[calc(100vh-2rem)] rounded-lg border bg-card shadow-lg flex flex-col',
            className,
          )}
        >
          <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
            <div className="text-sm font-semibold">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm hover:bg-accent"
            >
              关闭
            </button>
          </div>
          <div className="p-4 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
