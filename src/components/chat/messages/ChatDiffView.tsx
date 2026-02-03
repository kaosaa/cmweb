import { cn } from '@/lib/utils'

export function ChatDiffView({ oldStr, newStr }: { oldStr: string; newStr: string }) {
  const oldLines = oldStr.split('\n')
  const newLines = newStr.split('\n')

  const diffLines: {
    type: 'remove' | 'add' | 'context'
    text: string
    oldLineNum?: number
    newLineNum?: number
  }[] = []

  let prefixLen = 0
  let suffixLen = 0
  const minLen = Math.min(oldLines.length, newLines.length)

  while (prefixLen < minLen && oldLines[prefixLen] === newLines[prefixLen]) {
    prefixLen++
  }

  while (
    suffixLen < minLen - prefixLen &&
    oldLines[oldLines.length - 1 - suffixLen] === newLines[newLines.length - 1 - suffixLen]
  ) {
    suffixLen++
  }

  const contextBefore = Math.max(0, prefixLen - 2)
  for (let i = contextBefore; i < prefixLen; i++) {
    diffLines.push({ type: 'context', text: oldLines[i], oldLineNum: i + 1, newLineNum: i + 1 })
  }

  for (let i = prefixLen; i < oldLines.length - suffixLen; i++) {
    diffLines.push({ type: 'remove', text: oldLines[i], oldLineNum: i + 1 })
  }

  for (let i = prefixLen; i < newLines.length - suffixLen; i++) {
    diffLines.push({ type: 'add', text: newLines[i], newLineNum: i + 1 })
  }

  const contextAfter = Math.min(suffixLen, 2)
  for (let i = 0; i < contextAfter; i++) {
    const lineIdx = oldLines.length - suffixLen + i
    diffLines.push({ type: 'context', text: oldLines[lineIdx], oldLineNum: lineIdx + 1, newLineNum: lineIdx + 1 })
  }

  return (
    <div className="rounded-lg bg-surface overflow-hidden border border-outline-variant/20">
      <div className="flex text-xs border-b border-outline-variant/15 bg-surface-container-highest/30">
        <div className="flex-1 px-3 py-2 bg-red-500/10 text-red-600 dark:text-red-400 font-medium">
          - {oldLines.length - prefixLen - suffixLen} 行删除
        </div>
        <div className="flex-1 px-3 py-2 bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
          + {newLines.length - prefixLen - suffixLen} 行添加
        </div>
      </div>
      <pre className="p-3 text-sm font-mono max-h-[600px] overflow-auto">
        {diffLines.map((line, idx) => {
          const lineNum = line.oldLineNum ?? line.newLineNum ?? ''

          return (
            <div
              key={idx}
              className={cn(
                'flex items-start gap-2 px-2 py-0.5 -mx-2 rounded',
                line.type === 'remove' && 'bg-red-500/10 text-red-700 dark:text-red-300',
                line.type === 'add' && 'bg-green-500/10 text-green-700 dark:text-green-300',
                line.type === 'context' && 'text-muted-foreground',
              )}
            >
              <span className="inline-flex items-center shrink-0 select-none">
                <span className="inline-block w-8 text-right opacity-50 text-xs tabular-nums mr-1">{lineNum}</span>
                <span
                  className={cn(
                    'inline-block w-5 text-center font-bold',
                    line.type === 'remove' && 'text-red-500',
                    line.type === 'add' && 'text-green-500',
                    line.type === 'context' && 'opacity-30',
                  )}
                >
                  {line.type === 'remove' ? '-' : line.type === 'add' ? '+' : ' '}
                </span>
              </span>
              <span className="flex-1 whitespace-pre-wrap break-all">{line.text || ' '}</span>
            </div>
          )
        })}
      </pre>
    </div>
  )
}

