import type { Dispatch, SetStateAction } from 'react'
import type { ChatSession } from '@/types/chat'
import type { ThinkingOpenById } from '@/types/chat-ui'

export type ChatMessagesPanelProps = {
  activeSession: ChatSession | null
  busy: boolean
  streamingAssistantId: string | null
  thinkingOpenById: ThinkingOpenById
  setThinkingOpenById: Dispatch<SetStateAction<ThinkingOpenById>>
  error: string | null
  onClearError: () => void
  compactNotice:
    | { type: 'microcompact'; preTokens: number; tokensSaved: number; trigger: string; createdAt: number }
    | { type: 'compact'; preTokens: number; trigger: string; createdAt: number }
    | null
  onClearCompactNotice: () => void
  onCompactSession: () => void
  onPreviewImage: (src: string, alt?: string) => void
}
