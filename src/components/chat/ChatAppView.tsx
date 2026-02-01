import { useEffect, useMemo, useState } from 'react'
import { MessageSquarePlus, FolderOpen, Type } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/Modal'
import { DirectoryPicker } from '@/components/DirectoryPicker'
import { ToolAuthModal } from '@/components/ToolAuthModal'
import { FontSettingsControl } from '@/components/FontSettingsControl'
import { ImageViewer } from '@/components/ImageViewer'
import { DEFAULT_FONT_SETTINGS } from '@/hooks/use-font-settings'
import { extractLatestTodoWriteTodos } from '@/utils/todos'
import type { ChatAppViewProps } from './ChatAppView.types'
import { ChatSidebar } from './ChatSidebar'
import { ChatComposer } from './ChatComposer'
import { TodoFloatingPanel } from './TodoFloatingPanel'
import { ChatMessagesPanel } from './messages/ChatMessagesPanel'
import { ChatPermissionControl } from './ChatPermissionControl'

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

  const todos = useMemo(() => extractLatestTodoWriteTodos(activeSession?.messages), [activeSession?.messages])

  useEffect(() => {
    setTodoPanelOpen(true)
  }, [activeSession?.id])

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans selection:bg-primary/20 selection:text-primary">
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => setActiveSessionId(id)}
        onRequestDelete={(id, title) => setDeleteConfirm({ id, title })}
        onOpenNewChat={openNewChat}
        onOpenSettings={openSettings}
      />

      <main className="flex-1 flex flex-col relative bg-background min-w-0">
        <TodoFloatingPanel todos={todos} open={todoPanelOpen} onOpenChange={setTodoPanelOpen} />

        <header className="absolute top-0 inset-x-0 z-10 h-20 flex items-center justify-between px-6 bg-gradient-to-b from-background via-background/80 to-transparent pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 max-w-[60%]">
            <div className="md:hidden mr-2">
              <Button variant="ghost" size="icon" onClick={() => {}}>
                <MessageSquarePlus className="w-5 h-5" />
              </Button>
            </div>
                        <div className="flex flex-col">
                          <h2 className="text-base font-semibold text-on-surface truncate">{activeSession?.title ?? 'CM 助手'}</h2>
                          {activeSession && (
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <span className={cn('w-1.5 h-1.5 rounded-full', thinking ? 'bg-tertiary' : 'bg-primary')} />
                                {activeModel}
                              </div>
                              {activeSession.cwd && (
                                <div className="flex items-center gap-1 truncate" title={activeSession.cwd}>
                                  <FolderOpen className="w-3 h-3 shrink-0" />
                                  <span className="truncate max-w-[200px]">{activeSession.cwd}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
            
                      <div className="pointer-events-auto flex items-center gap-2">
                        {activeSession ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 rounded-full text-xs"
                            onClick={() => void compactActiveSession()}
                            disabled={!activeSessionId || busy}
                            title="压缩历史（保留最近几轮对话）"
                          >
                            压缩
                          </Button>
                        ) : null}
                        {activeSession && (
                          <ChatPermissionControl
                            value={activeSession.permissionMode ?? 'dangerous_only'}
                            onChange={(mode) => void updateActiveSession({ permissionMode: mode })}
                            disabled={!activeSessionId || busy}
                          />
                        )}
                      </div>
                    </header>
            
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
                    <div className="absolute bottom-0 inset-x-0 p-4 md:p-6 bg-gradient-to-t from-background via-background/95 to-transparent z-20">
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
                      />
            
                      <div className="text-center mt-3 text-[10px] text-muted-foreground/60 font-medium tracking-wide">
                        由 Claude Code CLI & CM 驱动
                      </div>
        </div>
      </main>

      <Modal
        open={newChatOpen}
        title="开始新对话"
        onClose={() => setNewChatOpen(false)}
        className="max-w-xl p-0 overflow-hidden rounded-[28px]"
      >
        <div className="bg-surface-container p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-on-surface ml-1 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-muted-foreground" />
                工作目录（CWD）
              </label>
              <DirectoryPicker value={newChatCwd} onChange={onChangeNewChatCwd} />
              <p className="text-xs text-muted-foreground ml-1">AI 将可以读取该目录中的文件。</p>
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
        <div className="bg-surface-container p-6">
          <div className="text-sm text-on-surface-variant leading-relaxed mb-6">
            确定要删除 <span className="font-semibold text-on-surface">"{deleteConfirm?.title ?? ''}"</span> 吗？此操作无法撤销。
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
            <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
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
