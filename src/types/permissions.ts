export type PermissionRequest = {
  id: string
  toolName: string
  input: unknown
  sessionId: string
}

export type PermissionMode = 'always_ask' | 'dangerous_only' | 'auto_approve'

