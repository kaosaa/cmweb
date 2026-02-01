import type { PermissionMode } from '@/types/permissions'

export type ModelsResponse = {
  defaultModel?: string
  models?: string[]
}

export type ToolInfo = {
  name: string
  input: unknown
  output: string | null
  isError: boolean
  thinkingBlockIndex?: number | null
  globalIndex?: number | null
}

export type ThinkingBlock = {
  index: number
  text: string
  startCharOffset: number
  durationMs: number | null
  globalIndex?: number | null
}

export type ClaudeUsage = {
  input_tokens: number
  output_tokens?: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
  service_tier?: string
}

export type ChatImage = {
  id: string
  url: string
  fileName: string
  contentType: string
  sizeBytes: number
}

export type DraftImage = {
  clientId: string
  file: File
  localUrl: string
  status: 'uploading' | 'ready' | 'error'
  error: string | null
  uploaded: ChatImage | null
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'tool'
  createdAtUtc: string
  content: string
  images?: ChatImage[] | null
  thinking?: string | null
  thinkingBlocks?: ThinkingBlock[] | null
  thinkingDurationMs?: number | null
  usage?: ClaudeUsage | null
  tool?: ToolInfo | null
  assistantMessageId?: string | null
  assistantCharOffset?: number | null
}

export type ChatSessionSummary = {
  id: string
  folderId: string | null
  title: string
  cwd: string
  model: string
  thinking: boolean
  permissionMode: PermissionMode
  createdAtUtc: string
  updatedAtUtc: string
  lastMessageAtUtc: string | null
  preview: string | null
}

export type ChatSession = {
  id: string
  folderId: string | null
  title: string
  cwd: string
  model: string
  thinking: boolean
  permissionMode: PermissionMode
  createdAtUtc: string
  updatedAtUtc: string
  messages: ChatMessage[]
}

export type StreamEvent =
  | {
      type: 'meta'
      model: string
      thinking: boolean
      maxThinkingTokens: number
      cwd: string
      claude: string
      source: string
    }
  | { type: 'ids'; sessionId: string; userMessageId: string; assistantMessageId: string }
  | { type: 'thinking'; delta: string }
  | { type: 'text'; delta: string }
  | { type: 'usage'; usage: ClaudeUsage }
  | { type: 'microcompact'; preTokens: number; tokensSaved: number; trigger: string }
  | { type: 'compact'; preTokens: number; trigger: string }
  | { type: 'tool_call'; id?: string | null; name: string; input: unknown; isError?: boolean }
  | { type: 'tool_output'; id?: string | null; name: string; output: string; isError?: boolean }
  | {
      type: 'assistant_end'
      assistantMessageId: string
      thinkingDurationMs: number | null
      thinkingBlocks?: ThinkingBlock[] | null
    }
  | { type: 'error'; message: string }
  | { type: 'done' }
  | { type: 'permission_request'; request_id: string; tool_name: string; tool_input: unknown }
  | { type: 'terminated'; reason: string; tool_name?: string; message?: string }

export type ApiErrorParseResult = {
  isError: boolean
  errorType?: string
  message?: string
  details?: string
}
