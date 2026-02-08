/**
 * 平台检测模块
 *
 * 判断当前运行环境是 Tauri 桌面端还是 Web 浏览器，
 * 并据此导出 API 基础地址等平台相关常量。
 * 同时在 Tauri 环境下给 document.documentElement 添加 'tauri' class，
 * 供 CSS 做平台差异化样式。
 */

/** 是否运行在 Tauri 桌面端环境 */
export const isTauri: boolean = '__TAURI_INTERNALS__' in window

/**
 * API 基础地址：
 * - Web 模式：空字符串（依赖 Vite proxy 或同源部署）
 * - Tauri 模式：直连后端地址（桌面端无代理层）
 */
export const API_BASE: string = isTauri ? 'http://127.0.0.1:2778' : ''

/** 当前操作系统是否为 macOS */
export const isMacOS: boolean = navigator.platform.toUpperCase().includes('MAC')

// 桌面端标记：为 CSS 提供平台选择器 (.tauri)
if (isTauri) {
  document.documentElement.classList.add('tauri')
}
