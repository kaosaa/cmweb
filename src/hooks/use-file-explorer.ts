import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/api/client'
import type { DirectoryEntryDto, FileEntryDto } from '@/api/types'

/** 单个目录的加载结果 */
export type DirEntry = {
  directories: DirectoryEntryDto[]
  files: FileEntryDto[]
}

/** 目录内容缓存，key 为目录绝对路径 */
export type DirCache = Map<string, DirEntry>

export type UseFileExplorerReturn = {
  /** 已加载的目录内容缓存 */
  cache: DirCache
  /** 正在加载的目录路径集合 */
  loading: Set<string>
  /** 当前展开的文件夹路径数组（供 Files 组件 open prop） */
  openFolders: string[]
  /** 展开/折叠变化回调（传给 Files 的 onOpenChange） */
  onOpenChange: (open: string[]) => void
  /** 加载失败的错误信息 */
  error: string | null
  /** 手动刷新某个目录 */
  refresh: (path: string) => void
}

/**
 * 加载目录内容，优先使用 listEntries（含文件），
 * 失败时回退到 listDirectories（仅文件夹）。
 */
async function fetchDirEntries(dirPath: string): Promise<DirEntry> {
  try {
    const res = await api.fs.listEntries(dirPath)
    return { directories: res.directories, files: res.files }
  } catch {
    // listEntries 不可用时回退到 listDirectories
    const res = await api.fs.listDirectories(dirPath)
    return { directories: res.directories, files: [] }
  }
}

/**
 * 管理文件树的懒加载状态。
 * rootPath 变化时自动重置并加载根目录；
 * 文件夹展开时自动加载子目录内容。
 */
export function useFileExplorer(rootPath: string | undefined): UseFileExplorerReturn {
  const [cache, setCache] = useState<DirCache>(new Map())
  const [loading, setLoading] = useState<Set<string>>(new Set())
  const [openFolders, setOpenFolders] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // 用 ref 跟踪当前 rootPath，避免异步回调中使用过期值
  const rootRef = useRef(rootPath)
  rootRef.current = rootPath

  // 用 ref 跟踪当前 cache，避免在 onOpenChange 中嵌套 setState
  const cacheRef = useRef(cache)
  cacheRef.current = cache

  /** 加载指定目录的内容并写入缓存 */
  const loadDir = useCallback(async (dirPath: string) => {
    setLoading((prev) => {
      const next = new Set(prev)
      next.add(dirPath)
      return next
    })
    setError(null)

    try {
      const entry = await fetchDirEntries(dirPath)
      // 如果 rootPath 已经切换，丢弃过期结果
      if (rootRef.current !== rootPath) return

      setCache((prev) => {
        const next = new Map(prev)
        next.set(dirPath, entry)
        return next
      })
    } catch (e) {
      if (rootRef.current !== rootPath) return
      setError(e instanceof Error ? e.message : '加载目录失败')
    } finally {
      setLoading((prev) => {
        const next = new Set(prev)
        next.delete(dirPath)
        return next
      })
    }
  }, [rootPath])

  // rootPath 变化时重置状态并加载根目录
  useEffect(() => {
    setCache(new Map())
    setOpenFolders([])
    setLoading(new Set())
    setError(null)

    if (rootPath) {
      void loadDir(rootPath)
    }
  }, [rootPath, loadDir])

  /** 文件夹展开/折叠变化：找出新展开的文件夹并加载 */
  const onOpenChange = useCallback(
    (nextOpen: string[]) => {
      setOpenFolders((prev) => {
        const prevSet = new Set(prev)
        for (const path of nextOpen) {
          // 新展开且未缓存的文件夹，触发加载
          if (!prevSet.has(path) && !cacheRef.current.has(path)) {
            void loadDir(path)
          }
        }
        return nextOpen
      })
    },
    [loadDir],
  )

  /** 手动刷新某个目录 */
  const refresh = useCallback(
    (path: string) => {
      void loadDir(path)
    },
    [loadDir],
  )

  return { cache, loading, openFolders, onOpenChange, error, refresh }
}
