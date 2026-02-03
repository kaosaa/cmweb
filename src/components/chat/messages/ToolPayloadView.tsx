import { cn } from '@/lib/utils'
import { getJsonSummary, tryParseJson } from '@/utils/tool-payload'
import type { ToolPayloadViewProps } from './ToolPayloadView.types'
import { ChevronDown } from 'lucide-react'

const MAX_ITEMS = 50

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function ToolPrimitive({ value }: { value: string }) {
  const isMultiLine = value.includes('\n')
  const isLong = value.length > 120

  if (isMultiLine || isLong) {
    return (
      <pre className="max-h-[300px] overflow-auto rounded-xl bg-gray-50/60 dark:bg-white/10 backdrop-blur-sm p-4 text-gray-800 dark:text-gray-300 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words shadow-sm ring-1 ring-gray-200/50 dark:ring-transparent">
        {value}
      </pre>
    )
  }
  return (
    <code className="rounded-lg bg-gray-100/60 dark:bg-white/10 backdrop-blur-sm px-3 py-1.5 font-mono text-[13px] text-gray-800 dark:text-gray-300 break-all">
      {value}
    </code>
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
    <div className="space-y-4">
      <div className="space-y-4">
        {shown.map(([key, val]) => (
          <div key={key} className="flex items-start gap-2">
            <div className="w-28 shrink-0 text-[11px] font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wide truncate">
              {key}
            </div>
            <div className="flex-1 min-w-0">
              <ToolPayloadView value={val} maxDepth={maxDepth - 1} />
            </div>
          </div>
        ))}
      </div>
      {remaining > 0 ? (
        <div className="text-[12px] text-gray-700 dark:text-gray-400">… 还有 {remaining} 项未展示</div>
      ) : null}
    </div>
  )
}

export function ToolPayloadView({ value, maxDepth = 2 }: ToolPayloadViewProps) {
  if (value == null) return <span className="text-gray-500 dark:text-gray-500">—</span>

  if (typeof value === 'string') {
    const parsed = tryParseJson(value)
    if (parsed != null) {
      return <ToolPayloadView value={parsed} maxDepth={maxDepth} />
    }
    return <ToolPrimitive value={value} />
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return <code className="rounded-lg bg-gray-100/60 dark:bg-white/10 backdrop-blur-sm px-3 py-1.5 font-mono text-[13px] text-gray-800 dark:text-gray-300">{String(value)}</code>
  }

  if (typeof value === 'object') {
    const summary = getJsonSummary(value)

    if (maxDepth <= 0) {
      return (
        <details className="rounded-xl bg-gray-50/60 dark:bg-white/10 backdrop-blur-sm p-3 ring-1 ring-gray-200/50 dark:ring-transparent group">
          <summary className="cursor-pointer select-none text-[12px] font-medium text-gray-800 dark:text-gray-300 flex items-center justify-between [&::-webkit-details-marker]:hidden list-none">
            <span>{summary ?? '对象'}（展开查看）</span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 transition-transform group-open:rotate-180 text-gray-500 dark:text-gray-400" />
          </summary>
          <pre className="mt-2 max-h-[300px] overflow-auto rounded-lg bg-white/50 dark:bg-white/5 p-3 text-[12px] font-mono whitespace-pre-wrap break-words text-gray-800 dark:text-gray-300">
            {JSON.stringify(value, null, 2)}
          </pre>
        </details>
      )
    }

    if (Array.isArray(value)) {
      const entries: Array<[string, unknown]> = value.map((v, idx) => [String(idx), v])
      return (
        <details className="rounded-xl bg-gray-50/60 dark:bg-white/10 backdrop-blur-sm p-3 ring-1 ring-gray-200/50 dark:ring-transparent group">
          <summary className="cursor-pointer select-none text-[12px] font-medium text-gray-800 dark:text-gray-300 flex items-center justify-between [&::-webkit-details-marker]:hidden list-none">
            <span>{summary ?? '数组'}（展开查看）</span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 transition-transform group-open:rotate-180 text-gray-500 dark:text-gray-400" />
          </summary>
          <div className="mt-2">
            <ToolKeyValueList entries={entries} maxDepth={maxDepth} />
          </div>
        </details>
      )
    }

    if (isRecord(value)) {
      const entries = Object.entries(value)
      if (!entries.length) return <span className="text-gray-500 dark:text-gray-500">（空对象）</span>
      return (
        <details className="rounded-xl bg-gray-50/60 dark:bg-white/10 backdrop-blur-sm p-3 ring-1 ring-gray-200/50 dark:ring-transparent group" open>
          <summary className={cn('cursor-pointer select-none text-[12px] font-medium text-gray-800 dark:text-gray-300 flex items-center justify-between [&::-webkit-details-marker]:hidden list-none')}>
            <span>{summary ?? '对象'}</span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 transition-transform group-open:rotate-180 text-gray-500 dark:text-gray-400" />
          </summary>
          <div className="mt-2">
            <ToolKeyValueList entries={entries} maxDepth={maxDepth} />
          </div>
        </details>
      )
    }
  }

  return <code className="rounded-lg bg-gray-100/60 dark:bg-white/10 backdrop-blur-sm px-3 py-1.5 font-mono text-[13px] text-gray-800 dark:text-gray-300">{String(value)}</code>
}

