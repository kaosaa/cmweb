import { cn } from '@/lib/utils'
import { Minus, Plus, RotateCcw, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DEFAULT_FONT_SETTINGS } from '@/hooks/use-font-settings'

type FontSettingsControlProps = {
  fontSize: number
  fontWeight: number
  onFontSizeChange: (size: number) => void
  onFontWeightChange: (weight: number) => void
  onReset: () => void
  disabled?: boolean
}

const WEIGHT_LABELS: Record<number, string> = {
  300: '细',
  350: '较细',
  400: '正常',
  450: '较粗',
  500: '粗',
  550: '加粗',
  600: '特粗',
}

export function FontSettingsControl({
  fontSize,
  fontWeight,
  onFontSizeChange,
  onFontWeightChange,
  onReset,
  disabled = false,
}: FontSettingsControlProps) {
  return (
    <div className="space-y-4">
      {/* Font Size Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-on-surface flex items-center gap-2">
            <Type className="w-4 h-4 text-muted-foreground" />
            字体大小
          </label>
          <span className="text-sm text-muted-foreground">{fontSize}px</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => onFontSizeChange(fontSize - 1)}
            disabled={disabled || fontSize <= 12}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <input
            type="range"
            min={12}
            max={24}
            step={1}
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            disabled={disabled}
            className={cn(
              'flex-1 h-2 rounded-full appearance-none cursor-pointer',
              'bg-surface-container-highest',
              '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
              '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary',
              '[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer',
              '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full',
              '[&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => onFontSizeChange(fontSize + 1)}
            disabled={disabled || fontSize >= 24}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground px-10">
          <span>小</span>
          <span>默认</span>
          <span>大</span>
        </div>
      </div>

      {/* Font Weight Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-on-surface">
            字体粗细
          </label>
          <span className="text-sm text-muted-foreground">
            {WEIGHT_LABELS[fontWeight] || fontWeight}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => onFontWeightChange(fontWeight - 50)}
            disabled={disabled || fontWeight <= 300}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <input
            type="range"
            min={300}
            max={600}
            step={50}
            value={fontWeight}
            onChange={(e) => onFontWeightChange(Number(e.target.value))}
            disabled={disabled}
            className={cn(
              'flex-1 h-2 rounded-full appearance-none cursor-pointer',
              'bg-surface-container-highest',
              '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
              '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary',
              '[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer',
              '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full',
              '[&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => onFontWeightChange(fontWeight + 50)}
            disabled={disabled || fontWeight >= 600}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground px-10">
          <span>细</span>
          <span>默认</span>
          <span>粗</span>
        </div>
      </div>

      {/* Preview - uses inline styles to show preview without affecting global */}
      <div className="mt-4 p-4 rounded-2xl bg-surface-container-highest/50 border border-outline-variant/30">
        <div className="text-xs text-muted-foreground mb-2">预览效果</div>
        <p
          className="leading-relaxed"
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: fontWeight,
            lineHeight: 1.65
          }}
        >
          这是一段预览文字，用于展示当前字体设置的效果。
          <strong style={{ fontWeight: Math.min(800, fontWeight + 200) }}>加粗文字</strong>会根据您的设置自动调整。
        </p>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={disabled || (fontSize === DEFAULT_FONT_SETTINGS.fontSize && fontWeight === DEFAULT_FONT_SETTINGS.fontWeight)}
          className="text-xs gap-1.5"
        >
          <RotateCcw className="w-3 h-3" />
          恢复默认
        </Button>
      </div>
    </div>
  )
}
