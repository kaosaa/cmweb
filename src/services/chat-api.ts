import type { ModelsResponse, ChatImage, ChatSession, ChatSessionSummary } from '@/types/chat'
import { API_BASE } from '@/lib/platform'

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })

  const text = await res.text().catch(() => '')
  let payload: unknown = null
  try {
    payload = text ? (JSON.parse(text) as unknown) : null
  } catch {
    payload = null
  }

  if (!res.ok) {
    const msg =
      payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message?: unknown }).message ?? '')
        : ''
    throw new Error(msg || text || `${res.status} ${res.statusText}`)
  }

  return payload as T
}

export async function getModels(): Promise<ModelsResponse> {
  return fetchJson<ModelsResponse>('/api/models', { method: 'GET' })
}

export async function listChatSessions(): Promise<ChatSessionSummary[]> {
  return fetchJson<ChatSessionSummary[]>('/api/chat/sessions', { method: 'GET' })
}

export async function getChatSession(id: string): Promise<ChatSession> {
  return fetchJson<ChatSession>(`/api/chat/sessions/${encodeURIComponent(id)}`, { method: 'GET' })
}

export async function createChatSession(cwd?: string): Promise<ChatSession> {
  return fetchJson<ChatSession>('/api/chat/sessions', {
    method: 'POST',
    body: JSON.stringify({
      cwd: cwd?.trim() ? cwd.trim() : undefined,
    }),
  })
}

export async function deleteChatSession(id: string): Promise<{ ok: boolean }> {
  return fetchJson<{ ok: boolean }>(`/api/chat/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function updateChatSession(
  id: string,
  patch: Partial<Pick<ChatSession, 'model' | 'thinking' | 'cwd' | 'permissionMode'>>,
): Promise<ChatSession> {
  return fetchJson<ChatSession>(`/api/chat/sessions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
}

export async function compactChatSession(id: string, body?: { keepTurns?: number }): Promise<ChatSession> {
  return fetchJson<ChatSession>(`/api/chat/sessions/${encodeURIComponent(id)}/compact`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  })
}

export async function openChatStream(
  id: string,
  body: { prompt: string; imageIds: string[] },
  signal: AbortSignal,
): Promise<Response> {
  return fetch(`${API_BASE}/api/chat/sessions/${encodeURIComponent(id)}/stream`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
}

export async function sendPermissionDecision(
  id: string,
  decision: 'allow' | 'deny',
  reason?: string,
): Promise<unknown> {
  return fetchJson(`/api/permission-response/${encodeURIComponent(id)}`, {
    method: 'POST',
    body: JSON.stringify(decision === 'deny' ? { decision, reason } : { decision }),
  })
}

export async function uploadImageFile(file: File): Promise<ChatImage> {
  const fd = new FormData()
  fd.append('files', file, file.name)

  const res = await fetch(`${API_BASE}/api/media/images`, { method: 'POST', body: fd })
  const text = await res.text().catch(() => '')
  if (!res.ok) {
    let message = text || `${res.status} ${res.statusText}`
    try {
      const parsed = text ? (JSON.parse(text) as unknown) : null
      if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>
        if (typeof obj.message === 'string' && obj.message.trim()) message = obj.message
        else if (typeof obj.detail === 'string' && obj.detail.trim()) message = obj.detail
      }
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  let payload: unknown = null
  try {
    payload = text ? (JSON.parse(text) as unknown) : null
  } catch {
    payload = null
  }
  if (!Array.isArray(payload) || payload.length < 1) throw new Error('上传失败。')
  return payload[0] as ChatImage
}
