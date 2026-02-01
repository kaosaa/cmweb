import { useEffect, useState } from 'react'
import { Loader2, Zap, Brain, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StreamingStatsProps = {
  stats: {
    textChars: number
    thinkingChars: number
    toolCalls: number
    startTime: number | null
  } | null
  busy: boolean
}

export function StreamingStats({ stats, busy }: StreamingStatsProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Update elapsed time every second when busy
  useEffect(() => {
    if (!busy || !stats?.startTime) {
      setElapsedSeconds(0)
      return
    }

    // Calculate initial elapsed time
    setElapsedSeconds(Math.floor((Date.now() - stats.startTime) / 1000))

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - stats.startTime!) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [busy, stats?.startTime])

  if (!stats || !busy) return null

  const totalChars = stats.textChars + stats.thinkingChars

  return (
    <div className="flex items-center justify-center gap-4 py-2 px-4 text-xs text-muted-foreground animate-in fade-in-0 duration-300 mb-2">
      <div className="flex items-center gap-1.5">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
        <span className="font-medium text-on-surface-variant">生成中</span>
      </div>

      <div className="flex items-center gap-3">
        {stats.thinkingChars > 0 && (
          <div className="flex items-center gap-1" title="思维链字符数">
            <Brain className={cn('w-3.5 h-3.5', 'text-tertiary')} />
            <span>{formatNumber(stats.thinkingChars)}</span>
          </div>
        )}

        <div className="flex items-center gap-1" title="输出字符数">
          <Zap className={cn('w-3.5 h-3.5', stats.textChars > 0 ? 'text-primary' : 'text-muted-foreground')} />
          <span>{formatNumber(stats.textChars)}</span>
        </div>

        {stats.toolCalls > 0 && (
          <div className="flex items-center gap-1" title="工具调用次数">
            <Wrench className="w-3.5 h-3.5 text-secondary" />
            <span>{stats.toolCalls}</span>
          </div>
        )}

        <div className="text-muted-foreground/70 border-l border-outline-variant/30 pl-3">
          {totalChars > 0 && (
            <span className="mr-2">{formatNumber(totalChars)} 字符</span>
          )}
          <span>{elapsedSeconds}s</span>
        </div>
      </div>
    </div>
  )
}

function formatNumber(n: number): string {
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1) + 'M'
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(1) + 'K'
  }
  return n.toString()
}
