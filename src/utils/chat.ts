import type { ApiErrorParseResult } from '@/types/chat'

export function localId(prefix: string): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return `${prefix}-${crypto.randomUUID()}`
    }
  } catch {
    // ignore
  }
  return `${prefix}-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`
}

export function formatSeconds(ms: number | null | undefined): string {
  if (ms == null) return '—'
  if (!Number.isFinite(ms)) return '—'
  const s = Math.max(0, ms) / 1000
  if (s < 10) return `${s.toFixed(1)}s`
  return `${Math.round(s)}s`
}

export function inferLegacyToolOffset(text: string): number | null {
  const s = text ?? ''
  const first = s.search(/\S/)
  if (first < 0) return null
  const idx = s.indexOf('\n\n', first)
  if (idx < 0) return null
  return idx + 2
}

export function parseApiError(content: string): ApiErrorParseResult {
  if (!content) return { isError: false }

  const apiErrorMatch = content.match(/^API Error:\s*(\d+)\s*(\{.*\})/s)
  if (apiErrorMatch) {
    try {
      const errorJson = JSON.parse(apiErrorMatch[2])
      const errorObj = errorJson.error || errorJson
      return {
        isError: true,
        errorType: `API Error ${apiErrorMatch[1]}`,
        message: errorObj.message || errorObj.type || 'Unknown API error',
        details: content,
      }
    } catch {
      return {
        isError: true,
        errorType: `API Error ${apiErrorMatch[1]}`,
        message: content,
      }
    }
  }

  if (
    content.startsWith('Error:') ||
    content.includes('Claude CLI timeout') ||
    content.includes('exited unexpectedly')
  ) {
    return {
      isError: true,
      errorType: 'Error',
      message: content,
    }
  }

  return { isError: false }
}

