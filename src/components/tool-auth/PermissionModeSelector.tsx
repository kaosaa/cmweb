import { ShieldAlert, ShieldCheck, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PermissionMode } from '@/types/permissions'

export function PermissionModeSelector({
  value,
  onChange,
  disabled,
}: {
  value: PermissionMode
  onChange: (mode: PermissionMode) => void
  disabled?: boolean
}) {
  const modes: { value: PermissionMode; label: string; description: string; icon: typeof ShieldAlert }[] = [
    {
      value: 'always_ask',
      label: '总是询问',
      description: '写入、编辑、执行等操作需确认，拒绝将终止对话',
      icon: ShieldAlert,
    },
    {
      value: 'dangerous_only',
      label: '仅危险操作',
      description: '写入、编辑、执行等操作需确认，拒绝后可继续',
      icon: ShieldCheck,
    },
    {
      value: 'auto_approve',
      label: '自动批准',
      description: '所有工具自动执行（不推荐）',
      icon: Zap,
    },
  ]

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5" />
        权限模式
      </label>
      <div className="grid gap-2">
        {modes.map((mode) => {
          const MIcon = mode.icon
          return (
            <button
              key={mode.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(mode.value)}
              className={cn(
                'w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all',
                'border hover:bg-surface-container-high',
                value === mode.value
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-outline-variant/30 bg-surface-container-highest/30',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0',
                  value === mode.value ? 'border-primary' : 'border-muted-foreground/30',
                )}
              >
                {value === mode.value && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <MIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium text-on-surface">{mode.label}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{mode.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

