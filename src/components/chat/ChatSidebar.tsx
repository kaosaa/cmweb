import { ThemeTogglerButton } from '@animate-ui/components-buttons-theme-toggler'
import { MessageSquarePlus, Settings, Sparkles, Trash2, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar'
import { motion } from 'motion/react'
import type { ChatSidebarProps } from './ChatSidebar.types'

export function ChatSidebar({
  sessions,
  activeSessionId,
  activeSession,
  activeModel,
  busy,
  onSelectSession,
  onRequestDelete,
  onOpenNewChat,
  onOpenSettings,
  isCollapsed = false,
  onToggleCollapse,
}: ChatSidebarProps) {
  const thinking = Boolean(activeSession?.thinking)

  return (
    <Sidebar open={isCollapsed} setOpen={(open) => {
      // 只在新状态与当前状态不同时才切换
      if (open !== isCollapsed) {
        onToggleCollapse?.()
      }
    }} animate={true}>
      <SidebarBody className="justify-between gap-10 bg-white/80 dark:bg-black/75 backdrop-blur-xl">
        {/* 上半部分：品牌标识 + 新建对话按钮 + 会话列表 */}
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {/* 品牌标识 */}
          <div className="relative z-20 py-2">
            {isCollapsed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex items-center justify-center"
              >
                <span className="text-3xl font-black bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.6)] tracking-tight">
                  CM
                </span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative px-2 py-1 flex justify-center"
              >
                <div className="relative">
                  {/* 背景光晕效果 */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 blur-lg rounded-lg" />

                  {/* 主标题 */}
                  <h1 className="relative text-xl font-black tracking-tight leading-none text-center">
                    <span className="bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto] drop-shadow-[0_0_20px_rgba(168,85,247,0.5)] font-serif italic">
                      Claude Manager
                    </span>
                  </h1>

                  {/* 装饰性下划线 */}
                  <div className="mt-1 h-0.5 w-full bg-gradient-to-r from-transparent via-purple-400/50 to-transparent rounded-full" />
                </div>
              </motion.div>
            )}
          </div>

          {/* 新建对话按钮 */}
          <div className="mt-8">
            <button
              onClick={onOpenNewChat}
              className={cn(
                "group relative flex items-center justify-center gap-3 bg-primary-container text-on-primary-container hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all rounded-2xl h-12 font-medium overflow-hidden mx-auto",
                isCollapsed ? "w-12" : "w-full"
              )}
              title="新建对话"
            >
              <div className="absolute inset-0 bg-on-primary-container/0 group-hover:bg-on-primary-container/5 transition-colors" />
              <MessageSquarePlus className="w-5 h-5 shrink-0" />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm tracking-wide whitespace-pre"
                >
                  新建对话
                </motion.span>
              )}
            </button>
          </div>

          {/* 会话列表 */}
          <div className="mt-8 flex flex-col gap-2">
            {!isCollapsed && (
              <div className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-zinc-500 uppercase tracking-wider">
                最近对话
              </div>
            )}
            {sessions.map((s) => {
              const cwdName = s.cwd ? s.cwd.split(/[/\\]/).filter(Boolean).pop() || s.cwd : null

              if (isCollapsed) {
                return (
                  <div
                    key={s.id}
                    onClick={() => onSelectSession(s.id)}
                    className={cn(
                      'group relative flex items-center justify-center w-12 h-12 cursor-pointer rounded-lg transition-all mx-auto overflow-hidden',
                      activeSessionId === s.id
                        ? 'bg-primary-container text-on-primary-container shadow-md'
                        : 'bg-surface-container-high/50 text-gray-600 dark:text-zinc-400 hover:bg-surface-container-high hover:text-on-surface-variant hover:shadow-sm',
                    )}
                    title={s.title || '未命名对话'}
                  >
                    <div className="absolute inset-0 bg-on-primary-container/0 group-hover:bg-on-primary-container/5 transition-colors" />
                    <Sparkles className="h-5 w-5 shrink-0 relative z-10" />
                  </div>
                )
              }

              return (
                <div
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  className={cn(
                    'group relative flex flex-col gap-1 px-3 py-2 cursor-pointer rounded-lg transition-all overflow-hidden',
                    activeSessionId === s.id
                      ? 'bg-primary-container text-on-primary-container shadow-md'
                      : 'bg-surface-container-high/50 text-gray-600 dark:text-zinc-400 hover:bg-surface-container-high hover:text-on-surface-variant hover:shadow-sm',
                  )}
                >
                  <div className="absolute inset-0 bg-on-primary-container/0 group-hover:bg-on-primary-container/5 transition-colors" />
                  <div className="flex items-center gap-2 relative z-10">
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm truncate flex-1 whitespace-pre"
                    >
                      {s.title || '未命名对话'}
                    </motion.span>
                    <button
                      className={cn(
                        'opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-on-primary-container/10 hover:text-red-500 dark:hover:text-red-400 shrink-0',
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onRequestDelete(s.id, s.title)
                      }}
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {cwdName && (
                    <div className={cn(
                      "flex items-center gap-1.5 text-xs ml-6 relative z-10",
                      activeSessionId === s.id ? "text-on-primary-container/70" : "text-gray-500 dark:text-zinc-500"
                    )}>
                      <FolderOpen className="w-3 h-3 shrink-0" />
                      <span className="truncate" title={s.cwd}>{cwdName}</span>
                    </div>
                  )}
                </div>
              )
            })}

            {!sessions.length && !isCollapsed && (
              <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-zinc-500 italic">
                暂无对话。
              </div>
            )}
          </div>
        </div>

        {/* 下半部分：设置和主题切换 */}
        <div className="flex flex-col gap-2">
          {/* 设置按钮 */}
          <div
            className={cn(
              "flex items-center gap-2 py-2 cursor-pointer transition-colors rounded-lg",
              isCollapsed ? "justify-center hover:bg-gray-200/40 dark:hover:bg-zinc-700/40" : "justify-start hover:bg-gray-200/40 dark:hover:bg-zinc-700/40"
            )}
            onClick={onOpenSettings}
          >
            <div className="w-10 h-10 rounded-full hover:bg-gray-300/50 dark:hover:bg-zinc-600/50 flex items-center justify-center shrink-0 transition-colors">
              <Settings className="h-5 w-5 text-gray-600 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 transition-colors" />
            </div>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-600 dark:text-zinc-400 whitespace-pre"
              >
                设置
              </motion.span>
            )}
          </div>

          {/* 主题切换 */}
          <div className={cn(
            "flex items-center gap-2 py-2 transition-colors rounded-lg",
            isCollapsed ? "justify-center hover:bg-gray-200/40 dark:hover:bg-zinc-700/40" : "justify-start hover:bg-gray-200/40 dark:hover:bg-zinc-700/40"
          )}>
            <ThemeTogglerButton className="rounded-full hover:bg-gray-300/50 dark:hover:bg-zinc-600/50 w-10 h-10 shrink-0" />
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-600 dark:text-zinc-400 whitespace-pre"
              >
                主题
              </motion.span>
            )}
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  )
}
