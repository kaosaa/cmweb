import { ThemeTogglerButton } from '@animate-ui/components-buttons-theme-toggler'
import { MessageSquarePlus, Settings, Sparkles, Trash2, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatSidebarProps } from './ChatSidebar.types'

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onRequestDelete,
  onOpenNewChat,
  onOpenSettings,
}: ChatSidebarProps) {
  return (
    <aside className="hidden md:flex w-[320px] shrink-0 flex-col bg-surface-container-low border-r border-outline-variant/10 transition-all duration-300">
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
            <img src="/cm-logo.svg" alt="CM" className="w-full h-full object-cover" />
          </div>
          <span className="text-lg font-bold tracking-tight text-on-surface">CM</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSettings}
            className="rounded-full hover:bg-surface-container-high w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-on-surface transition-colors"
            title="设置"
          >
            <Settings className="w-4 h-4" />
          </button>
          <ThemeTogglerButton className="rounded-full hover:bg-surface-container-high w-10 h-10" />
        </div>
      </div>

      <div className="px-4 pb-6">
        <button
          onClick={onOpenNewChat}
          className="group relative w-full flex items-center justify-center gap-3 bg-primary-container text-on-primary-container hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all rounded-2xl h-14 px-4 font-medium overflow-hidden"
        >
          <div className="absolute inset-0 bg-on-primary-container/0 group-hover:bg-on-primary-container/5 transition-colors" />
          <MessageSquarePlus className="w-5 h-5" />
          <span className="text-sm tracking-wide">新建对话</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">最近对话</div>
        {sessions.map((s) => {
          // Extract folder name from cwd path
          const cwdName = s.cwd ? s.cwd.split(/[/\\]/).filter(Boolean).pop() || s.cwd : null

          return (
            <div
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              className={cn(
                'group flex flex-col gap-1 rounded-2xl px-4 py-3 cursor-pointer transition-all duration-200 border border-transparent',
                activeSessionId === s.id
                  ? 'bg-secondary-container text-on-secondary-container font-medium border-secondary-container/50 shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:border-outline-variant/20',
              )}
            >
              <div className="flex items-center gap-2">
                <div className="truncate flex-1 text-sm">{s.title || '未命名对话'}</div>
                <button
                  className={cn(
                    'opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-surface-dim hover:text-error shrink-0',
                    activeSessionId === s.id &&
                      'text-on-secondary-container/70 hover:bg-on-secondary-container/10 hover:text-on-secondary-container',
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    onRequestDelete(s.id, s.title)
                  }}
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {cwdName && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate" title={s.cwd}>{cwdName}</span>
                </div>
              )}
            </div>
          )
        })}

        {!sessions.length && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground italic">暂无对话。</div>
        )}
      </div>
    </aside>
  )
}

