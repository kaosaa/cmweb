import type { ChatSessionSummary, ChatSession } from '@/types/chat'

export type ChatSidebarProps = {
  sessions: ChatSessionSummary[]
  activeSessionId: string | null
  activeSession: ChatSession | null
  activeModel: string
  busy: boolean
  onSelectSession: (id: string) => void
  onRequestDelete: (id: string, title: string) => void
  onOpenNewChat: () => void
  onOpenSettings: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

