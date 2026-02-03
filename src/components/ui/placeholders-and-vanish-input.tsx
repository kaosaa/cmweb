import { AnimatePresence, motion } from 'framer-motion'
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import { cn } from '@/lib/utils'

export interface PlaceholdersAndVanishInputProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  placeholders?: string[]
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

export interface PlaceholdersAndVanishInputHandle {
  triggerVanish: () => void
}

export const PlaceholdersAndVanishInput = forwardRef<
  PlaceholdersAndVanishInputHandle,
  PlaceholdersAndVanishInputProps
>(({ placeholders = [], onChange, onSubmit, className, value, ...props }, ref) => {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startAnimation = () => {
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length)
    }, 3000)
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [hasValue, setHasValue] = useState(false)
  const isComposingRef = useRef(false)

  // 同步外部 value 到 textarea（仅在外部值变化时）
  useEffect(() => {
    if (textareaRef.current && value !== undefined && value !== textareaRef.current.value) {
      textareaRef.current.value = value
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      setHasValue(value.length > 0)
    }
  }, [value])

  const vanishAndSubmit = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.value = ''
      textareaRef.current.style.height = 'auto'
      setHasValue(false)
    }
  }, [])

  useImperativeHandle(ref, () => ({
    triggerVanish: vanishAndSubmit,
  }))

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // 提交前同步最新值到父组件
    if (onChange && textareaRef.current) {
      const syntheticEvent = {
        target: textareaRef.current,
        currentTarget: textareaRef.current,
      } as React.ChangeEvent<HTMLTextAreaElement>
      onChange(syntheticEvent)
    }

    onSubmit(e)
    vanishAndSubmit()
  }, [onSubmit, vanishAndSubmit, onChange])

  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget

    // 立即同步调整高度（原生性能）
    target.style.height = 'auto'
    target.style.height = `${target.scrollHeight}px`

    // 更新占位符显示状态
    const hasText = target.value.length > 0
    if (hasText !== hasValue) {
      setHasValue(hasText)
    }

    // 不调用 onChange，避免父组件重新渲染导致卡顿
    // onChange 只在提交时调用
  }, [hasValue])

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true
  }, [])

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLTextAreaElement>) => {
    isComposingRef.current = false
    // 输入法结束后也不调用 onChange，避免卡顿
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter 或 Cmd+Enter 换行
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      // 允许默认的换行行为
      return
    }

    // Enter 发送（不按 Shift、Ctrl、Cmd 时）
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !isComposingRef.current) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }, [handleSubmit])

  useEffect(() => {
    startAnimation()
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [placeholders])

  return (
    <form
      className={cn('relative w-full', className)}
      onSubmit={handleSubmit}
    >
      <textarea
        onInput={handleInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
        ref={textareaRef}
        defaultValue={value}
        rows={1}
        className={cn(
          'w-full resize-none rounded-xl bg-zinc-100 px-4 py-3 text-sm text-black',
          'border-0 shadow-none outline-none ring-0',
          'focus:border-0 focus:shadow-none focus:outline-none focus:ring-0',
          'focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0',
          'dark:bg-zinc-800 dark:text-white',
        )}
        style={{ minHeight: '48px', maxHeight: '200px', overflow: 'auto' }}
        {...props}
      />

      {!hasValue && (
        <div className="pointer-events-none absolute left-4 top-3">
          <AnimatePresence mode="wait">
            <motion.p
              initial={{ y: 5, opacity: 0 }}
              key={`current-placeholder-${currentPlaceholder}`}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'linear' }}
              className="text-sm font-normal text-neutral-500 dark:text-zinc-500"
            >
              {placeholders[currentPlaceholder]}
            </motion.p>
          </AnimatePresence>
        </div>
      )}
    </form>
  )
})
