import { ShieldAlert, ShieldCheck, Zap, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PermissionMode } from '@/types/permissions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field'

const MODES: { value: PermissionMode; label: string; description: string; icon: typeof ShieldAlert; color: string }[] = [
  {
    value: 'dangerous_only',
    label: '仅危险操作',
    description: '文件写入和命令执行需要确认，读取类工具自动放行。',
    icon: ShieldCheck,
    color: 'text-green-600 dark:text-green-400',
  },
  {
    value: 'always_ask',
    label: '总是询问',
    description: '所有工具调用都需要您的确认。',
    icon: ShieldAlert,
    color: 'text-amber-600 dark:text-amber-400',
  },
  {
    value: 'auto_approve',
    label: '自动批准',
    description: '所有工具将自动执行。请仅在完全信任的环境下使用。',
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
      <DropdownMenuContent align="end" className="w-80 p-4 rounded-xl bg-gradient-to-br from-gray-50/98 via-white/95 to-gray-100/98 backdrop-blur-xl shadow-2xl border-gray-300/60 dark:bg-none dark:bg-black dark:border-zinc-800 dark:backdrop-blur-0 dark:shadow-none">
        <DropdownMenuLabel className="text-xs font-normal px-0 pb-3 text-gray-600 dark:text-muted-foreground">
          安全设置 (当前会话)
        </DropdownMenuLabel>
        <RadioGroup value={value} onValueChange={onChange} className="w-full">
          {MODES.map((mode) => {
            const MIcon = mode.icon
            return (
              <FieldLabel key={mode.value} htmlFor={`permission-${mode.value}`}>
                <Field orientation="horizontal">
                  <FieldContent>
                    <div className="flex items-center gap-2">
                      <MIcon className={cn("w-4 h-4", mode.color)} />
                      <FieldTitle>{mode.label}</FieldTitle>
                    </div>
                    <FieldDescription>
                      {mode.description}
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value={mode.value} id={`permission-${mode.value}`} />
                </Field>
              </FieldLabel>
            )
          })}
        </RadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
