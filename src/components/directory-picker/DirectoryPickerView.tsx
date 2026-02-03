import {
  Files,
  FolderContent,
  FolderItem,
  FolderTrigger,
  SubFiles,
} from '@/components/animate-ui/components/radix/files'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/Modal'
import { FolderPlus } from 'lucide-react'
import type { DirectoryEntryDto } from '@/api/types'
import type { DirectoryPickerViewProps } from './DirectoryPickerView.types'

export function DirectoryPickerView({
  value,
  onChange,
  disabled,
  open,
  setOpen,
  pickingSystem,
  pickSystemDirectory,
  drives,
  loadListing,
  listing,
  loading,
  error,
  pathInput,
  setPathInput,
  selectDirectory,
  childrenByPath,
  nodeLoadingByPath,
  nodeErrorByPath,
  canSelect,
  confirmSelection,
  // New folder creation
  newFolderDialogOpen,
  setNewFolderDialogOpen,
  newFolderName,
  setNewFolderName,
  creatingFolder,
  createFolderError,
  createFolder,
}: DirectoryPickerViewProps) {
  const closeModal = () => setOpen(false)

  const renderDirectory = (dir: DirectoryEntryDto) => {
    const children = childrenByPath[dir.fullPath]
    const nodeLoading = Boolean(nodeLoadingByPath[dir.fullPath])
    const nodeError = nodeErrorByPath[dir.fullPath]

    return (
      <FolderItem key={dir.fullPath} value={dir.fullPath}>
        <FolderTrigger
          onClick={(e) => {
            e.stopPropagation()
            selectDirectory(dir.fullPath)
          }}
        >
          {dir.name}
        </FolderTrigger>

        <FolderContent>
          {nodeError ? <div className="px-2 py-2 text-sm text-red-600 dark:text-red-400">{nodeError}</div> : null}

          {nodeLoading ? <div className="px-2 py-2 text-sm text-gray-600 dark:text-zinc-500">加载中…</div> : null}

          {!nodeLoading && children && children.length === 0 ? (
            <div className="px-2 py-2 text-sm text-gray-600 dark:text-zinc-500">暂无子目录</div>
          ) : null}

          {children?.length ? <SubFiles>{children.map(renderDirectory)}</SubFiles> : null}
        </FolderContent>
      </FolderItem>
    )
  }

  return (
    <div className="flex gap-2">
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="选择工作空间目录" disabled={disabled} />
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title="打开目录选择器"
      >
        浏览
      </Button>

      <Modal open={open} title="选择工作空间目录" onClose={closeModal} className="max-w-3xl">
        <div className="space-y-3">
          {/* Current path indicator */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100/80 dark:bg-zinc-800/50 border border-gray-300/60 dark:border-zinc-700/50">
            <span className="text-xs text-gray-600 dark:text-zinc-400 shrink-0">当前目录：</span>
            <code className="text-xs font-mono text-gray-800 dark:text-zinc-200 truncate flex-1" title={listing?.currentPath || pathInput}>
              {listing?.currentPath || pathInput || '未选择'}
            </code>
          </div>

          <div className="flex flex-wrap gap-2">
            {drives.map((d) => (
              <Button key={d.rootPath} type="button" variant="outline" size="sm" onClick={() => void loadListing(d.rootPath)}>
                {d.name}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input value={pathInput} onChange={(e) => setPathInput(e.target.value)} className="flex-1" />
            <Button type="button" variant="outline" onClick={() => void loadListing(pathInput)}>
              进入
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => listing?.parentPath && void loadListing(listing.parentPath)}
              disabled={!listing?.parentPath}
            >
              上一级
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNewFolderName('')
                setNewFolderDialogOpen(true)
              }}
              disabled={!listing?.currentPath}
              title="新建文件夹"
            >
              <FolderPlus className="w-4 h-4" />
            </Button>
          </div>

          {error && <div className="rounded-md border border-red-300/50 dark:border-destructive/40 bg-red-50/80 dark:bg-destructive/10 p-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

          <div className="rounded-lg border border-gray-300/60 dark:border-zinc-700/50 bg-gray-50/60 dark:bg-zinc-900/30">
            <div className="border-b border-gray-300/60 dark:border-zinc-700/50 px-3 py-2 text-xs text-gray-600 dark:text-zinc-400 flex items-center justify-between">
              <span>目录列表 {loading ? '（加载中…）' : ''}</span>
            </div>
            {listing ? (
              listing.directories.length ? (
                <Files className="max-h-[360px]">{listing.directories.map(renderDirectory)}</Files>
              ) : (
                <div className="px-2 py-6 text-sm text-gray-600 dark:text-zinc-500">暂无子目录</div>
              )
            ) : (
              <div className="px-2 py-6 text-sm text-gray-600 dark:text-zinc-500">{loading ? '加载中…' : '请选择一个目录'}</div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              取消
            </Button>
            <Button type="button" onClick={confirmSelection} disabled={!canSelect}>
              选择此目录
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Folder Dialog */}
      <Modal
        open={newFolderDialogOpen}
        title="新建文件夹"
        onClose={() => setNewFolderDialogOpen(false)}
        className="max-w-sm"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800 dark:text-white">文件夹名称</label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="输入文件夹名称"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newFolderName.trim()) {
                  createFolder()
                }
              }}
            />
            <p className="text-xs text-gray-600 dark:text-zinc-400">
              将在 <code className="bg-gray-100/80 dark:bg-zinc-800/50 px-1 py-0.5 rounded text-[10px]">{listing?.currentPath}</code> 下创建
            </p>
          </div>

          {createFolderError && (
            <div className="rounded-md border border-red-300/50 dark:border-red-500/40 bg-red-50/80 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
              {createFolderError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setNewFolderDialogOpen(false)} disabled={creatingFolder}>
              取消
            </Button>
            <Button type="button" onClick={createFolder} disabled={!newFolderName.trim() || creatingFolder}>
              {creatingFolder ? '创建中…' : '创建'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
