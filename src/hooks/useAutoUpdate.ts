import { useEffect, useRef } from 'react'
import { isTauri } from '@/lib/platform'

/**
 * 自动更新 Hook（仅桌面端生效）
 *
 * - 应用启动时检查一次更新
 * - 之后每隔 checkIntervalHours 小时检查一次
 * - 发现新版本时调用 onUpdateAvailable 回调通知上层
 */

interface UpdateInfo {
  version: string
  body?: string
}

interface UseAutoUpdateOptions {
  /** 检查间隔（小时），默认 4 小时 */
  checkIntervalHours?: number
  /** 发现新版本时的回调 */
  onUpdateAvailable?: (info: UpdateInfo) => void
  /** 更新出错时的回调 */
  onError?: (error: Error) => void
}

export function useAutoUpdate(options: UseAutoUpdateOptions = {}) {
  const { checkIntervalHours = 4, onUpdateAvailable, onError } = options
  const checkingRef = useRef(false)

  useEffect(() => {
    // Web 端直接跳过，零开销
    if (!isTauri) return

    const checkUpdate = async () => {
      if (checkingRef.current) return
      checkingRef.current = true

      try {
        const { check } = await import('@tauri-apps/plugin-updater')
        const update = await check()

        if (update) {
          onUpdateAvailable?.({
            version: update.version,
            body: update.body ?? undefined,
          })
        }
      } catch (err) {
        onError?.(err instanceof Error ? err : new Error(String(err)))
      } finally {
        checkingRef.current = false
      }
    }

    // 启动后首次检查
    checkUpdate()

    // 定时检查
    const intervalMs = checkIntervalHours * 60 * 60 * 1000
    const timer = setInterval(checkUpdate, intervalMs)

    return () => clearInterval(timer)
  }, [checkIntervalHours, onUpdateAvailable, onError])
}

/**
 * 执行更新下载并安装（需用户确认后调用）
 */
export async function downloadAndInstallUpdate(): Promise<void> {
  const { check } = await import('@tauri-apps/plugin-updater')
  const update = await check()
  if (update) {
    await update.downloadAndInstall()
    // 安装完成后需要重启应用
    const { relaunch } = await import('@tauri-apps/plugin-process')
    await relaunch()
  }
}
