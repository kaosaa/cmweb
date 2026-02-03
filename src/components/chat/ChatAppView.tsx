import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/Modal'
import { DirectoryPicker } from '@/components/DirectoryPicker'
import { ToolAuthModal } from '@/components/ToolAuthModal'
import { FontSettingsControl } from '@/components/FontSettingsControl'
import { ImageViewer } from '@/components/ImageViewer'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { DEFAULT_FONT_SETTINGS } from '@/hooks/use-font-settings'
import { extractLatestTodoWriteTodos } from '@/utils/todos'
import type { ChatAppViewProps } from './ChatAppView.types'
import { ChatSidebar } from './ChatSidebar'
import { ChatComposer } from './ChatComposer'
import { TodoFloatingPanel } from './TodoFloatingPanel'
import { ChatMessagesPanel } from './messages/ChatMessagesPanel'
import { FolderOpen, Type, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export function ChatAppView({
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
  canSend,
  send,
  cancel,
  streamingAssistantId,
  error,
  setError,
  thinkingOpenById,
  setThinkingOpenById,
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
  clearCompactNotice,
  compactActiveSession,
  settingsOpen,
  openSettings,
  confirmSettings,
  cancelSettings,
  tempFontSettings,
  setTempFontSettings,
}: ChatAppViewProps) {
  const activeModel = activeSession?.model ?? defaultModel
  const thinking = Boolean(activeSession?.thinking)
  const [previewImage, setPreviewImage] = useState<{ src: string; alt?: string } | null>(null)
  const [todoPanelOpen, setTodoPanelOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [immersiveMode, setImmersiveMode] = useState(false)

  const todos = useMemo(() => extractLatestTodoWriteTodos(activeSession?.messages), [activeSession?.messages])

  useEffect(() => {
    setTodoPanelOpen(true)
  }, [activeSession?.id])

  return (
    <div className="h-screen w-full bg-background text-foreground overflow-hidden font-sans selection:bg-primary/20 selection:text-primary">
      {/* 侧边栏 - 固定定位，完全脱离文档流 */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        activeSession={activeSession}
        activeModel={activeModel}
        busy={busy}
        onSelectSession={(id) => setActiveSessionId(id)}
        onRequestDelete={(id, title) => setDeleteConfirm({ id, title })}
        onOpenNewChat={openNewChat}
        onOpenSettings={openSettings}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* 主内容区域 - 固定宽度，添加左侧 padding 避免被侧边栏遮挡 */}
      <AuroraBackground className="h-full w-full pl-[80px] flex flex-col" showRadialGradient={false}>
        <TodoFloatingPanel
          todos={todos}
          open={todoPanelOpen}
          onOpenChange={setTodoPanelOpen}
          activeSession={activeSession}
          activeModel={activeModel}
          thinking={thinking}
        />

        <ChatMessagesPanel
          activeSession={activeSession}
          busy={busy}
          streamingAssistantId={streamingAssistantId}
          thinkingOpenById={thinkingOpenById}
          setThinkingOpenById={setThinkingOpenById}
          error={error}
          onClearError={() => setError(null)}
          onPreviewImage={(src, alt) => setPreviewImage({ src, alt })}
          compactNotice={compactNotice}
          onClearCompactNotice={clearCompactNotice}
          onCompactSession={() => void compactActiveSession()}
        />

        {/* 沉浸式模式切换按钮 - 固定在右下角 */}
        <motion.button
          onClick={() => setImmersiveMode(!immersiveMode)}
          className={cn(
            'fixed bottom-6 right-6 z-30',
            'h-12 w-12 rounded-full',
            'bg-black/40 backdrop-blur-xl',
            'border border-white/10',
            'shadow-2xl shadow-black/30',
            'flex items-center justify-center',
            'text-white/70 hover:text-white/90',
            'transition-all duration-300',
            'hover:scale-110 active:scale-95',
            'group'
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title={immersiveMode ? '显示输入框' : '沉浸式阅读'}
        >
          <AnimatePresence mode="wait">
            {immersiveMode ? (
              <motion.div
                key="eye"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.2 }}
              >
                <Eye className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div
                key="eye-off"
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: -180 }}
                transition={{ duration: 0.2 }}
              >
                <EyeOff className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* 输入框和底部文字 - 可隐藏 */}
        <AnimatePresence>
          {!immersiveMode && (
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-0 left-0 right-4 p-4 md:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none z-20"
            >
              <div className="pointer-events-auto">
                <ChatComposer
                  activeSessionId={activeSessionId}
                  hasActiveSession={Boolean(activeSession)}
                  busy={busy}
                  composerText={composerText}
                  onComposerTextChange={(text) => setComposerText(text)}
                  draftImages={draftImages}
                  onRemoveDraftImage={removeDraftImage}
                  onPickImages={onPickImages}
                  models={models}
                  defaultModel={defaultModel}
                  activeModel={activeModel}
                  onModelChange={(val) => void updateActiveSession({ model: val })}
                  thinking={thinking}
                  onThinkingChange={(v) => void updateActiveSession({ thinking: v })}
                  onOpenNewChat={openNewChat}
                  canSend={canSend}
                  onSend={send}
                  onCancel={cancel}
                  permissionMode={activeSession?.permissionMode ?? 'dangerous_only'}
                  onPermissionModeChange={(mode) => void updateActiveSession({ permissionMode: mode })}
                  onCompactSession={() => void compactActiveSession()}
                />

                <div className="text-center mt-3 text-[10px] text-muted-foreground/60 font-medium tracking-wide">
                  由 Claude Code CLI & CM 驱动
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AuroraBackground>

      <Modal
        open={newChatOpen}
        title="开始新对话"
        onClose={() => setNewChatOpen(false)}
        className="max-w-xl p-0 overflow-hidden rounded-[28px]"
      >
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white ml-1 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-zinc-400" />
                工作目录（CWD）
              </label>
              <DirectoryPicker value={newChatCwd} onChange={onChangeNewChatCwd} />
              <p className="text-xs text-zinc-400 ml-1">AI 将可以读取该目录中的文件。</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setNewChatOpen(false)} className="rounded-full px-6">
              取消
            </Button>
            <Button
              type="button"
              onClick={() => void createChat()}
              disabled={!newChatCwd.trim()}
              className="rounded-full px-6 bg-primary text-white font-bold hover:bg-primary/90"
            >
              开始
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteConfirm)}
        title="删除对话"
        onClose={() => setDeleteConfirm(null)}
        className="max-w-sm p-0 overflow-hidden rounded-[28px]"
      >
        <div className="p-6">
          <div className="text-sm text-zinc-300 leading-relaxed mb-6">
            确定要删除 <span className="font-semibold text-white">"{deleteConfirm?.title ?? ''}"</span> 吗？此操作无法撤销。
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setDeleteConfirm(null)} className="rounded-full">
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full px-6 font-bold text-white shadow-sm"
              onClick={() => deleteConfirm && void deleteChat(deleteConfirm.id)}
            >
              删除
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={settingsOpen} title="设置" onClose={cancelSettings} className="max-w-lg p-0 overflow-hidden rounded-[28px]">
        <div className="bg-surface-container p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/12">
              <div className="w-10 h-10 rounded-2xl bg-tertiary/10 flex items-center justify-center">
                <Type className="w-5 h-5 text-tertiary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-on-surface">显示设置</h3>
                <p className="text-xs text-muted-foreground">调整字体大小和粗细（仅预览区生效，确认后全局应用）</p>
              </div>
            </div>
            <FontSettingsControl
              fontSize={tempFontSettings.fontSize}
              fontWeight={tempFontSettings.fontWeight}
              onFontSizeChange={(size) =>
                setTempFontSettings((prev) => ({ ...prev, fontSize: Math.max(12, Math.min(24, size)) }))
              }
              onFontWeightChange={(weight) =>
                setTempFontSettings((prev) => ({ ...prev, fontWeight: Math.max(300, Math.min(600, weight)) }))
              }
              onReset={() => setTempFontSettings(DEFAULT_FONT_SETTINGS)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={cancelSettings} className="rounded-full px-6">
              取消
            </Button>
            <Button
              type="button"
              onClick={confirmSettings}
              className="rounded-full px-6 bg-primary text-white font-bold hover:bg-primary/90"
            >
              确认
            </Button>
          </div>
        </div>
      </Modal>

      {pendingPermission && (
        <ToolAuthModal
          request={pendingPermission}
          onApprove={handlePermissionApprove}
          onReject={handlePermissionReject}
          onClose={() => void handlePermissionReject(pendingPermission.id)}
        />
      )}

      {previewImage && (
        <ImageViewer
          src={previewImage.src}
          alt={previewImage.alt}
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  )
}
