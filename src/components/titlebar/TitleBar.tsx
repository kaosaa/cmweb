import React, { useCallback, useEffect, useState } from 'react'
import { Minus, Square, X, Copy } from 'lucide-react'
import { isTauri, isMacOS } from '@/lib/platform'

/**
 * 自定义标题栏组件（仅桌面端渲染）
 *
 * - Windows：右侧显示最小化/最大化/关闭按钮
 * - macOS：左侧显示红绿灯风格按钮
 * - 支持拖拽移动窗口
 * - 玻璃态背景，遵循 UI 设计规范
 */

/** 窗口控制按钮的通用样式 */
const btnBase =
  'inline-flex items-center justify-center w-[46px] h-full transition-colors duration-150'

/** macOS 红绿灯按钮样式 */
const macBtnBase =
  'inline-flex items-center justify-center w-3 h-3 rounded-full transition-opacity duration-150'

const TitleBar = React.memo(function TitleBar() {
  const [maximized, setMaximized] = useState(false)

  // 动态导入 Tauri window API，避免 Web 端加载 Tauri 模块
  const getWindow = useCallback(async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    return getCurrentWindow()
  }, [])

  // 监听窗口最大化状态变化
  useEffect(() => {
    let unlisten: (() => void) | undefined

    const setup = async () => {
      const win = await getWindow()
      setMaximized(await win.isMaximized())
      unlisten = await win.onResized(async () => {
        setMaximized(await win.isMaximized())
      })
    }

    setup()
    return () => { unlisten?.() }
  }, [getWindow])

  const handleMinimize = useCallback(async () => {
    const win = await getWindow()
    await win.minimize()
  }, [getWindow])

  const handleToggleMaximize = useCallback(async () => {
    const win = await getWindow()
    await win.toggleMaximize()
  }, [getWindow])

  const handleClose = useCallback(async () => {
    const win = await getWindow()
    await win.close()
  }, [getWindow])

  if (isMacOS) {
    return (
      <header
        data-tauri-drag-region
        className="absolute top-0 left-0 right-0 z-[9999] flex h-9 select-none items-center bg-black/20 backdrop-blur-xl"
      >
        {/* macOS 红绿灯按钮 - 左侧 */}
        <div className="flex items-center gap-2 pl-3">
          <button
            type="button"
            onClick={handleClose}
            className={`${macBtnBase} bg-[#ff5f57] hover:opacity-80`}
            aria-label="关闭"
          />
          <button
            type="button"
            onClick={handleMinimize}
            className={`${macBtnBase} bg-[#febc2e] hover:opacity-80`}
            aria-label="最小化"
          />
          <button
            type="button"
            onClick={handleToggleMaximize}
            className={`${macBtnBase} bg-[#28c840] hover:opacity-80`}
            aria-label={maximized ? '还原' : '最大化'}
          />
        </div>

        <span
          data-tauri-drag-region
          className="flex-1 text-center text-xs font-medium text-white/60"
        >
          CM
        </span>
      </header>
    )
  }

  // Windows 布局：按钮在右侧
  return (
    <header
      data-tauri-drag-region
      className="absolute top-0 left-0 right-0 z-[9999] flex h-9 select-none items-center bg-black/20 backdrop-blur-xl"
    >
      <span
        data-tauri-drag-region
        className="flex-1 pl-3 text-xs font-medium text-white/60"
      >
        CM
      </span>

      {/* Windows 窗口控制按钮 - 右侧 */}
      <div className="flex h-full items-center">
        <button
          type="button"
          onClick={handleMinimize}
          className={`${btnBase} hover:bg-white/10`}
          aria-label="最小化"
        >
          <Minus className="h-4 w-4 text-white/70" />
        </button>
        <button
          type="button"
          onClick={handleToggleMaximize}
          className={`${btnBase} hover:bg-white/10`}
          aria-label={maximized ? '还原' : '最大化'}
        >
          {maximized ? (
            <Copy className="h-3.5 w-3.5 text-white/70" />
          ) : (
            <Square className="h-3.5 w-3.5 text-white/70" />
          )}
        </button>
        <button
          type="button"
          onClick={handleClose}
          className={`${btnBase} hover:bg-red-500/90`}
          aria-label="关闭"
        >
          <X className="h-4 w-4 text-white/70" />
        </button>
      </div>
    </header>
  )
})

/**
 * 条件渲染包装：仅在 Tauri 桌面端环境下渲染标题栏。
 * Web 端调用此组件返回 null，零开销。
 */
export default function TitleBarWrapper() {
  if (!isTauri) return null
  return <TitleBar />
}
