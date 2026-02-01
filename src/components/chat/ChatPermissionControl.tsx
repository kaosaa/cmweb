import { ShieldAlert, ShieldCheck, Zap, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PermissionMode } from '@/types/permissions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const MODES: { value: PermissionMode; label: string; description: string; icon: typeof ShieldAlert; color: string }[] = [
  {
    value: 'dangerous_only',
    label: '仅危险操作',
    description: '标准防护',
    icon: ShieldCheck,
    color: 'text-green-600 dark:text-green-400',
  },
  {
    value: 'always_ask',
    label: '总是询问',
    description: '严格模式',
    icon: ShieldAlert,
    color: 'text-amber-600 dark:text-amber-400',
  },
  {
    value: 'auto_approve',
    label: '自动批准',
    description: '不推荐',
    icon: Zap,
    color: 'text-red-600 dark:text-red-400',
  },
]

export function ChatPermissionControl({
  value,
  onChange,
  disabled,
}: {
  value: PermissionMode
  onChange: (mode: PermissionMode) => void
  disabled?: boolean
}) {
  const currentMode = MODES.find((m) => m.value === value) ?? MODES[0]
  const Icon = currentMode.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn(
            "h-8 gap-2 rounded-full border bg-background/50 backdrop-blur-sm pl-2.5 pr-3 shadow-none transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            disabled && "opacity-50"
          )}
        >
          <Icon className={cn("w-3.5 h-3.5", currentMode.color)} />
          <span className="text-xs font-medium text-muted-foreground">{currentMode.label}</span>
          <ChevronDown className="w-3 h-3 opacity-50 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1 rounded-xl">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1.5">
          安全设置 (当前会话)
        </DropdownMenuLabel>
        {MODES.map((mode) => {
          const MIcon = mode.icon
          const isSelected = value === mode.value
          return (
            <DropdownMenuItem
              key={mode.value}
              onClick={() => onChange(mode.value)}
              className={cn(
                "flex items-center gap-2.5 px-2 py-2 cursor-pointer rounded-lg",
                isSelected && "bg-accent text-accent-foreground"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-md bg-background border border-input shadow-sm",
                  isSelected && "border-primary/20 bg-primary/5"
                )}
              >
                <MIcon className={cn("w-3.5 h-3.5", mode.color)} />
              </div>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-xs font-medium leading-none">{mode.label}</span>
                <span className="text-[10px] text-muted-foreground leading-none">{mode.description}</span>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator className="my-1" />
        <div className="px-2 py-1.5 text-[10px] text-muted-foreground leading-relaxed">
          {currentMode.value === 'always_ask' && '所有工具调用都需要您的确认。'}
          {currentMode.value === 'dangerous_only' && '文件写入和命令执行需要确认，读取类工具自动放行。'}
          {currentMode.value === 'auto_approve' && '所有工具将自动执行。请仅在完全信任的环境下使用。'}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
