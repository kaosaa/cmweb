import type { ChatMessage, ThinkingBlock } from '@/types/chat'

export type DeleteConfirmState = { id: string; title: string } | null

export type ThinkingOpenById = Record<string, boolean>

export type InterleavedBlock =
  | {
      type: 'thinking'
      block: ThinkingBlock
      blockIdx: number
      offset: number
      globalIndex: number | null
    }
  | {
      type: 'tool'
      msg: ChatMessage
      offset: number
      globalIndex: number | null
    }

