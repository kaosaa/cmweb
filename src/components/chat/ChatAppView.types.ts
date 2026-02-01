import type { Dispatch, SetStateAction } from 'react'
import type { FontSettings } from '@/hooks/use-font-settings'
import type { ChatSession, ChatSessionSummary, DraftImage } from '@/types/chat'
import type { DeleteConfirmState, ThinkingOpenById } from '@/types/chat-ui'
import type { PermissionRequest } from '@/types/permissions'

export type ChatAppViewProps = {
  models: string[]
  defaultModel: string

  sessions: ChatSessionSummary[]
  activeSessionId: string | null
  setActiveSessionId: Dispatch<SetStateAction<string | null>>
  activeSession: ChatSession | null

  composerText: string
  setComposerText: Dispatch<SetStateAction<string>>
  draftImages: DraftImage[]
  removeDraftImage: (clientId: string) => void
  onPickImages: (files: FileList | null) => Promise<void>

  busy: boolean
  canSend: boolean
  send: () => Promise<void>
  cancel: () => void
  streamingAssistantId: string | null
  streamingStats: {
    textChars: number
    thinkingChars: number
    toolCalls: number
    startTime: number | null
  } | null

  error: string | null
  setError: Dispatch<SetStateAction<string | null>>

  thinkingOpenById: ThinkingOpenById
  setThinkingOpenById: Dispatch<SetStateAction<ThinkingOpenById>>

  newChatOpen: boolean
  setNewChatOpen: Dispatch<SetStateAction<boolean>>
  newChatCwd: string
  openNewChat: () => void
  onChangeNewChatCwd: (path: string) => void
  createChat: () => Promise<void>

  deleteConfirm: DeleteConfirmState
  setDeleteConfirm: Dispatch<SetStateAction<DeleteConfirmState>>
  deleteChat: (id: string) => Promise<void>

  updateActiveSession: (
    patch: Partial<Pick<ChatSession, 'model' | 'thinking' | 'cwd' | 'permissionMode'>>,
  ) => Promise<void>

  pendingPermission: PermissionRequest | null
  handlePermissionApprove: (id: string) => Promise<void>
  handlePermissionReject: (id: string, reason?: string) => Promise<void>

  compactNotice:
    | { type: 'microcompact'; preTokens: number; tokensSaved: number; trigger: string; createdAt: number }
    | { type: 'compact'; preTokens: number; trigger: string; createdAt: number }
    | null
  clearCompactNotice: () => void
  compactActiveSession: (keepTurns?: number) => Promise<void>

  settingsOpen: boolean
  openSettings: () => void
  confirmSettings: () => void
  cancelSettings: () => void
  tempFontSettings: FontSettings
  setTempFontSettings: Dispatch<SetStateAction<FontSettings>>
}
