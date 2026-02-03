import type { DraftImage } from '@/types/chat'
import type { PermissionMode } from '@/types/permissions'

export type ChatComposerProps = {
  activeSessionId: string | null
  hasActiveSession: boolean
  busy: boolean
  composerText: string
  onComposerTextChange: (text: string) => void
  draftImages: DraftImage[]
  onRemoveDraftImage: (clientId: string) => void
  onPickImages: (files: FileList | null) => Promise<void>
  models: string[]
  defaultModel: string
  activeModel: string
  onModelChange: (model: string) => void
  thinking: boolean
  onThinkingChange: (thinking: boolean) => void
  onOpenNewChat: () => void
  canSend: boolean
  onSend: () => Promise<void>
  onCancel: () => void
  permissionMode: PermissionMode
  onPermissionModeChange: (mode: PermissionMode) => void
  onCompactSession: () => void
}

