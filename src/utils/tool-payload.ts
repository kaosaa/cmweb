export function tryParseJson(text: string): unknown | null {
  const trimmed = (text ?? '').trim()
  if (!trimmed) return null
  const maybeJson =
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  if (!maybeJson) return null
  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return null
  }
}

export function getJsonSummary(value: unknown): string | null {
  if (value == null) return null
  if (Array.isArray(value)) return `数组（${value.length} 项）`
  if (typeof value === 'object') return `对象（${Object.keys(value as Record<string, unknown>).length} 项）`
  return null
}

export function getToolOutputPreview(output: string | null | undefined): string | null {
  if (!output) return null
  const parsed = tryParseJson(output)
  if (parsed != null) {
    return getJsonSummary(parsed) ?? 'JSON'
  }

  const firstLine = output.split('\n')[0]?.trim() ?? ''
  if (!firstLine) return null
  if (firstLine.length > 60) return firstLine.slice(0, 60) + '…'
  return firstLine
}

