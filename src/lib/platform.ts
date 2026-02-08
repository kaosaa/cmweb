/**
 * 平台检测模块
 *
 * 判断当前运行环境是 Tauri 桌面端还是 Web 浏览器，
 * 并据此导出 API 基础地址等平台相关常量。
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
