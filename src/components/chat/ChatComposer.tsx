import { useRef } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown, Cpu, ImagePlus, MessageSquarePlus, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { ChatComposerProps } from './ChatComposer.types'

export function ChatComposer({
  activeSessionId,
  hasActiveSession,
  busy,
  composerText,
  onComposerTextChange,
  draftImages,
  onRemoveDraftImage,
  onPickImages,
  models,
  defaultModel,
  activeModel,
  onModelChange,
  thinking,
  onThinkingChange,
  onOpenNewChat,
  canSend,
  onSend,
  onCancel,
}: ChatComposerProps) {
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const pickImages = () => {
    if (busy || !activeSessionId) return
    imageInputRef.current?.click()
  }

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-3xl relative transition-all duration-300',
        'bg-surface-container rounded-[28px] shadow-lg border border-outline-variant/30',
        'focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-xl focus-within:bg-surface-container-high',
        busy && 'opacity-80 grayscale-[0.2]',
      )}
    >
      {draftImages.length ? (
        <div className="px-4 pt-3 pb-1">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {draftImages.map((d) => (
              <div
                key={d.clientId}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-outline-variant/40 bg-surface-container-highest shadow-sm"
                title={d.status === 'error' && d.error ? d.error : d.file.name}
              >
                <img src={d.uploaded?.url ?? d.localUrl} alt={d.file.name} className="h-full w-full object-cover" />
                {d.status === 'uploading' ? (
                  <div className="absolute inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center">
                    <Spinner className="w-5 h-5 text-primary" />
                  </div>
                ) : null}
                {d.status === 'error' ? (
                  <div className="absolute inset-0 bg-error/20 flex items-center justify-center px-1 text-center text-[10px] font-semibold text-error">
                    失败
                  </div>
                ) : null}
                <button
                  type="button"
                  className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-background/80 hover:bg-background text-on-surface flex items-center justify-center shadow-sm"
                  onClick={() => onRemoveDraftImage(d.clientId)}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          {draftImages.some((d) => d.status === 'error') ? (
            <div className="mt-1 text-[11px] text-error">部分图片上传失败，请移除后重试。</div>
          ) : null}
        </div>
      ) : null}

      <div className="px-4 pt-3 pb-2">
        <Textarea
          value={composerText}
          onChange={(e) => onComposerTextChange(e.target.value)}
          placeholder={hasActiveSession ? '给 CM 发消息…' : '请先选择一个对话…'}
          className="bg-transparent border-none shadow-none resize-none min-h-[56px] max-h-[240px] text-base px-1 py-1 focus-visible:ring-0 placeholder:text-muted-foreground/70"
          disabled={!activeSessionId || busy}
          onPaste={(e) => {
            if (busy || !activeSessionId) return
            const clipboard = e.clipboardData
            if (!clipboard) return

            const items = Array.from(clipboard.items ?? [])
            if (!items.length) return

            const files = items
              .filter((it) => it.kind === 'file')
              .map((it) => it.getAsFile())
              .filter((f): f is File => Boolean(f))
              .filter((f) => {
                if (f.type.startsWith('image/')) return true
                return /\.(png|jpe?g|gif|webp|bmp|tiff?|avif|heic|heif)$/i.test(f.name || '')
              })

            if (!files.length) return
            e.preventDefault()

            const dt = new DataTransfer()
            for (const f of files) dt.items.add(f)
            void onPickImages(dt.files)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void onSend()
            }
          }}
        />
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void onPickImages(e.currentTarget.files)
          e.currentTarget.value = ''
        }}
      />

      <div className="flex items-center justify-between px-3 pb-3">
        <div className="flex items-center gap-2">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild disabled={!activeSessionId || busy}>
              <button
                className={cn(
                  'group flex items-center gap-2 h-9 pl-3 pr-2.5 rounded-full text-xs font-medium transition-all outline-none select-none',
                  'bg-surface-container-highest/30 hover:bg-surface-container-highest/60 text-on-surface-variant hover:text-on-surface',
                  'border border-outline-variant/30 hover:border-outline-variant/50 focus-visible:ring-2 focus-visible:ring-primary/30',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                <Cpu className="w-3.5 h-3.5 text-primary/80" />
                <span className="truncate max-w-[140px]">{activeModel || defaultModel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-on-surface transition-colors opacity-70" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="start"
                sideOffset={8}
                className={cn(
                  'z-50 min-w-[220px] max-w-[300px] overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-high/95 p-1 text-on-surface shadow-lg backdrop-blur-md',
                  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                )}
              >
                <DropdownMenu.Label className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Select Model
                </DropdownMenu.Label>
                <DropdownMenu.RadioGroup value={activeModel || defaultModel} onValueChange={onModelChange}>
                  {models.map((m) => (
                    <DropdownMenu.RadioItem
                      key={m}
                      value={m}
                      className={cn(
                        'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-2.5 pr-8 text-xs outline-none transition-colors',
                        'focus:bg-primary/10 focus:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                        'hover:bg-primary/5 hover:text-primary',
                      )}
                    >
                      <span className="flex-1 truncate font-medium">{m}</span>
                      <DropdownMenu.ItemIndicator className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                  ))}
                </DropdownMenu.RadioGroup>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <div
            className="flex items-center gap-2 px-3 h-8 rounded-full bg-surface-container-highest/30 hover:bg-surface-container-highest/50 transition-colors cursor-pointer"
            onClick={() => {
              if (!busy && activeSessionId) onThinkingChange(!thinking)
            }}
          >
            <span className="text-xs font-medium text-on-surface-variant">思考</span>
            <Switch
              checked={Boolean(thinking)}
              onCheckedChange={onThinkingChange}
              disabled={!activeSessionId || busy}
              className="scale-75 origin-center"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-surface-container-highest"
            onClick={pickImages}
            disabled={!activeSessionId || busy}
            title="上传图片"
          >
            <ImagePlus className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-surface-container-highest"
            onClick={onOpenNewChat}
            title="新对话"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {busy && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 rounded-full text-xs text-error hover:bg-error/10 hover:text-error"
            >
              停止
            </Button>
          )}
          <Button
            type="button"
            disabled={!canSend}
            onClick={() => void onSend()}
            className={cn(
              'h-10 w-10 rounded-full p-0 shadow-md transition-all active:scale-95',
              busy
                ? 'bg-surface-container-highest text-muted-foreground'
                : 'bg-primary text-on-primary hover:bg-primary/90',
            )}
          >
            {busy ? <Spinner className="w-5 h-5" /> : <Send className="w-5 h-5 ml-0.5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

