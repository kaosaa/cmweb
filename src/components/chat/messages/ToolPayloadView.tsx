import { cn } from '@/lib/utils'
import { getJsonSummary, tryParseJson } from '@/utils/tool-payload'
import type { ToolPayloadViewProps } from './ToolPayloadView.types'

const MAX_ITEMS = 50

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function ToolPrimitive({ value }: { value: string }) {
  const isMultiLine = value.includes('\n')
  const isLong = value.length > 120
  if (isMultiLine || isLong) {
    return (
      <pre className="max-h-[240px] overflow-auto rounded-lg bg-surface p-2.5 text-on-surface font-mono text-[11px] whitespace-pre-wrap break-words">
        {value}
      </pre>
    )
  }
  return (
    <code className="rounded-md bg-surface px-2 py-1 font-mono text-[11px] text-on-surface break-all">{value}</code>
  )
}

function ToolKeyValueList({
  entries,
  maxDepth,
}: {
  entries: Array<[string, unknown]>
  maxDepth: number
}) {
  const shown = entries.slice(0, MAX_ITEMS)
  const remaining = Math.max(0, entries.length - shown.length)

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {shown.map(([key, val]) => (
          <div key={key} className="flex items-start gap-2">
            <div className="w-28 shrink-0 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
              {key}
            </div>
            <div className="flex-1 min-w-0">
              <ToolPayloadView value={val} maxDepth={maxDepth - 1} />
            </div>
          </div>
        ))}
      </div>
      {remaining > 0 ? (
        <div className="text-[11px] text-muted-foreground">… 还有 {remaining} 项未展示</div>
      ) : null}
    </div>
  )
}

export function ToolPayloadView({ value, maxDepth = 2 }: ToolPayloadViewProps) {
  if (value == null) return <span className="text-muted-foreground">—</span>

  if (typeof value === 'string') {
    const parsed = tryParseJson(value)
    if (parsed != null) {
      return <ToolPayloadView value={parsed} maxDepth={maxDepth} />
    }
    return <ToolPrimitive value={value} />
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return <code className="rounded-md bg-surface px-2 py-1 font-mono text-[11px] text-on-surface">{String(value)}</code>
  }

  if (typeof value === 'object') {
    const summary = getJsonSummary(value)

    if (maxDepth <= 0) {
      return (
        <details className="rounded-lg border border-outline-variant/30 bg-surface p-2">
          <summary className="cursor-pointer select-none text-[11px] font-medium text-on-surface-variant">
            {summary ?? '对象'}（展开查看）
          </summary>
          <pre className="mt-2 max-h-[240px] overflow-auto rounded-lg bg-surface-container-highest/30 p-2 text-[11px] font-mono whitespace-pre-wrap break-words text-on-surface">
            {JSON.stringify(value, null, 2)}
          </pre>
        </details>
      )
    }

    if (Array.isArray(value)) {
      const entries: Array<[string, unknown]> = value.map((v, idx) => [String(idx), v])
      return (
        <details className="rounded-lg border border-outline-variant/30 bg-surface p-2">
          <summary className="cursor-pointer select-none text-[11px] font-medium text-on-surface-variant">
            {summary ?? '数组'}（展开查看）
          </summary>
          <div className="mt-2">
            <ToolKeyValueList entries={entries} maxDepth={maxDepth} />
          </div>
        </details>
      )
    }

    if (isRecord(value)) {
      const entries = Object.entries(value)
      if (!entries.length) return <span className="text-muted-foreground">（空对象）</span>
      return (
        <details className="rounded-lg border border-outline-variant/30 bg-surface p-2" open>
          <summary className={cn('cursor-pointer select-none text-[11px] font-medium text-on-surface-variant')}>
            {summary ?? '对象'}
          </summary>
          <div className="mt-2">
            <ToolKeyValueList entries={entries} maxDepth={maxDepth} />
          </div>
        </details>
      )
    }
  }

  return <code className="rounded-md bg-surface px-2 py-1 font-mono text-[11px] text-on-surface">{String(value)}</code>
}

