export type TodoStatus = 'pending' | 'in_progress' | 'completed'
export type TodoPriority = 'high' | 'medium' | 'low'

export type TodoItem = {
  id: string
  content: string
  status: TodoStatus
  priority: TodoPriority
  activeForm?: string
}

function asTodoStatus(value: unknown): TodoStatus {
  if (value === 'completed') return 'completed'
  if (value === 'in_progress') return 'in_progress'
  return 'pending'
}

function asTodoPriority(value: unknown): TodoPriority {
  if (value === 'high') return 'high'
  if (value === 'low') return 'low'
  return 'medium'
}

/**
 * Extract the latest TodoWrite snapshot from a session's messages.
 *
 * Notes:
 * - Different Claude Code versions may put the list under `input.todos` or `input.newTodos`.
 * - Items may omit `id`/`priority` (we default them).
 */
export function extractLatestTodoWriteTodos(messages: unknown): TodoItem[] | null {
  if (!Array.isArray(messages) || messages.length < 1) return null

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i] as any
    if (!m || typeof m !== 'object') continue
    if (m.role !== 'tool') continue

    const tool = m.tool
    const toolName = typeof tool?.name === 'string' ? tool.name : ''
    if (!toolName || !toolName.toLowerCase().includes('todowrite')) continue

    const input = tool?.input
    if (!input || typeof input !== 'object') continue

    const rawTodos = (input as any).todos ?? (input as any).newTodos ?? null
    if (!Array.isArray(rawTodos)) continue

    const out: TodoItem[] = []
    for (const t of rawTodos) {
      if (!t || typeof t !== 'object') continue

      const idRaw = (t as any).id
      const id = typeof idRaw === 'string' ? idRaw : ''

      const contentRaw = (t as any).content ?? (t as any).title ?? (t as any).text
      const content = typeof contentRaw === 'string' ? contentRaw : ''

      const status = asTodoStatus((t as any).status)
      const priority = asTodoPriority((t as any).priority)

      const activeFormRaw = (t as any).activeForm
      const activeForm = typeof activeFormRaw === 'string' ? activeFormRaw : undefined

      out.push({
        id: id || String(out.length + 1),
        content,
        status,
        priority,
        activeForm,
      })
    }

    return out
  }

  return null
}

