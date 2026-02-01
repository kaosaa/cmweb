import type { ChatSessionSummary } from '@/types/chat'

export type ChatSidebarProps = {
  sessions: ChatSessionSummary[]
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onRequestDelete: (id: string, title: string) => void
  onOpenNewChat: () => void
  onOpenSettings: () => void
}

