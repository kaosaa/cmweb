import { useState, memo } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as Tooltip from '@radix-ui/react-tooltip'
import { motion, AnimatePresence } from 'motion/react'

interface CodeBlockProps {
  children: React.ReactNode
  language?: string
  code: string
  className?: string
}

/**
 * 代码块组件
 * 提供代码高亮显示、复制功能和语言标签
 * 使用深色玻璃态效果，提供精致的视觉体验
 */
export const CodeBlock = memo(function CodeBlock({ children, language, code, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <div
      className={cn(
        'group relative my-5 overflow-hidden rounded-2xl',
        // 深色玻璃态背景
        'bg-black/40 dark:bg-black/60',
        'backdrop-blur-xl',
        // 精致阴影
        'shadow-2xl shadow-black/20',
        // 微妙的内发光效果
        'ring-1 ring-white/10',
        className
      )}
    >
      {/* 顶部工具栏 - 深色玻璃效果 */}
      <div className="flex items-center justify-between bg-black/20 backdrop-blur-sm px-5 py-3">
        {/* 语言标签 */}
        <div className="flex items-center gap-3">
          {/* macOS 风格的三个圆点 */}
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80 shadow-sm" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80 shadow-sm" />
            <div className="h-3 w-3 rounded-full bg-green-500/80 shadow-sm" />
          </div>

          {language && (
            <span className="rounded-lg bg-white/10 px-3 py-1 text-sm font-medium text-white/90 backdrop-blur-sm">
              {language}
            </span>
          )}
        </div>

        {/* 复制按钮 */}
        <Tooltip.Provider delayDuration={300}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <motion.button
                onClick={handleCopy}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium',
                  'bg-white/5 text-white/70 backdrop-blur-sm',
                  'transition-all duration-200',
                  'hover:bg-white/10 hover:text-white/90',
                  'active:scale-95'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.2, type: 'spring' }}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-4 w-4 text-green-400" />
                      <span className="text-green-400">已复制</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span>复制代码</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="z-50 rounded-xl bg-black/90 px-3 py-2 text-sm text-white backdrop-blur-xl shadow-2xl ring-1 ring-white/10"
                sideOffset={5}
              >
                {copied ? '已复制到剪贴板' : '点击复制代码'}
                <Tooltip.Arrow className="fill-black/90" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>

      {/* 代码内容区域 - 深色背景 */}
      <div className="overflow-auto bg-black/30">
        {children}
      </div>
    </div>
  )
})
