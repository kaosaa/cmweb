import type { Dispatch, RefObject, SetStateAction } from 'react'
import type { ChatMessage } from '@/types/chat'
import type { ThinkingOpenById } from '@/types/chat-ui'

export type ChatMessageListProps = {
  messages: ChatMessage[]
  busy: boolean
  streamingAssistantId: string | null
  thinkingEnabled: boolean
  thinkingOpenById: ThinkingOpenById
  setThinkingOpenById: Dispatch<SetStateAction<ThinkingOpenById>>
  cwd?: string | null
  onPreviewImage: (src: string, alt?: string) => void
  /** 外层滚动容器 ref，供虚拟列表计算可视区域 */
  scrollContainerRef: RefObject<HTMLDivElement | null>
}

