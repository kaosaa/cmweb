/**
 * 平台检测模块
 *
 * 判断当前运行环境是 Tauri 桌面端还是 Web 浏览器，
 * 并据此导出 API 基础地址、fetch 函数等平台相关常量。
 * 同时在 Tauri 环境下给 document.documentElement 添加 'tauri' class，
 * 供 CSS 做平台差异化样式。
 */

/** 是否运行在 Tauri 桌面端环境 */
export const isTauri: boolean = '__TAURI_INTERNALS__' in window

/**
 * 是否为 Tauri dev 模式（前端由 Vite dev server 提供）。
 * dev 模式下 hostname 为 'localhost'（http://localhost:5173），
 * 生产模式下 hostname 为 'tauri.localhost'（http://tauri.localhost）。
 * 注意：Windows 上 Tauri 生产模式也使用 http: 协议，不能用 protocol 区分。
 */
const isTauriDevMode: boolean = isTauri && window.location.hostname === 'localhost'

/** 是否需要通过 Tauri HTTP 插件发请求（生产模式下绕过 CORS） */
export const useTauriHttp: boolean = isTauri && !isTauriDevMode

/**
 * API 基础地址：
 * - Web 模式 / Tauri dev 模式：空字符串（走 Vite proxy）
 * - Tauri 生产模式：直连后端地址（无代理层）
 */
export const API_BASE: string = useTauriHttp ? 'http://127.0.0.1:2778' : ''

/**
 * 平台适配的 fetch 函数：
 * - Web / Tauri dev：使用浏览器原生 fetch（走 Vite proxy）
 * - Tauri 生产模式：使用 Tauri HTTP 插件的 fetch（Rust 层发请求，绕过 CORS）
 *
 * 延迟加载 Tauri HTTP 插件，避免在 Web 模式下引入不必要的依赖。
 */
export const platformFetch: typeof globalThis.fetch = useTauriHttp
  ? (async (...args: Parameters<typeof globalThis.fetch>) => {
      const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http')
      return tauriFetch(...args)
    }) as typeof globalThis.fetch
  : globalThis.fetch.bind(globalThis)

/** 当前操作系统是否为 macOS */
export const isMacOS: boolean = navigator.platform.toUpperCase().includes('MAC')

// 桌面端标记：为 CSS 提供平台选择器 (.tauri)
if (isTauri) {
  document.documentElement.classList.add('tauri')
}
