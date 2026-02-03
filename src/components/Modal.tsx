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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="button"
        tabIndex={-1}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={cn(
            'w-full max-w-2xl max-h-[calc(100vh-2rem)] rounded-2xl border shadow-2xl flex flex-col',
            'bg-gradient-to-br from-gray-50/98 via-white/95 to-gray-100/98 backdrop-blur-xl border-gray-300/60',
            'dark:bg-none dark:bg-black/75 dark:backdrop-blur-xl dark:border-white/8',
            className,
          )}
        >
          <div className="flex shrink-0 items-center justify-between border-b px-4 py-3 border-gray-300/60 dark:border-white/8">
            <div className="text-sm font-semibold text-gray-800 dark:text-white">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-200/60 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-700/50 dark:hover:text-white transition-colors"
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
