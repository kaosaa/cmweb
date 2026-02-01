import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/api/client'
import type { DirectoryEntryDto, DriveDto, ListDirectoriesResponse } from '@/api/types'
import type { DirectoryPickerProps } from '@/components/directory-picker/DirectoryPicker.types'

export type DirectoryPickerState = {
  open: boolean
  setOpen: (open: boolean) => void

  pickingSystem: boolean
  pickSystemDirectory: () => Promise<void>

  drives: DriveDto[]
  loadingDrives: boolean

  listing: ListDirectoriesResponse | null
  loadingListing: boolean
  error: string | null

  pathInput: string
  setPathInput: (path: string) => void

  selectedPath: string
  setSelectedPath: (path: string) => void

  loadListing: (path: string) => Promise<void>
  selectDirectory: (path: string) => Promise<void>

  childrenByPath: Record<string, DirectoryEntryDto[]>
  nodeLoadingByPath: Record<string, boolean>
  nodeErrorByPath: Record<string, string | null>

  loading: boolean
  canSelect: boolean
  confirmSelection: () => void

  // New folder creation
  newFolderDialogOpen: boolean
  setNewFolderDialogOpen: (open: boolean) => void
  newFolderName: string
  setNewFolderName: (name: string) => void
  creatingFolder: boolean
  createFolderError: string | null
  createFolder: () => Promise<void>
}

export function useDirectoryPicker({ value, onChange, disabled }: DirectoryPickerProps): DirectoryPickerState {
  const [open, setOpen] = useState(false)
  const [pickingSystem, setPickingSystem] = useState(false)
  const [drives, setDrives] = useState<DriveDto[]>([])
  const [loadingDrives, setLoadingDrives] = useState(false)
  const [loadingListing, setLoadingListing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [pathInput, setPathInput] = useState(value)
  const [selectedPath, setSelectedPath] = useState(value)
  const [listing, setListing] = useState<ListDirectoriesResponse | null>(null)

  const openModal = useCallback(() => {
    if (disabled) return
    setPathInput(value)
    setSelectedPath(value)
    setOpen(true)
  }, [disabled, value])

  const pickSystemDirectory = useCallback(async () => {
    if (disabled) return
    if (pickingSystem) return
    setError(null)
    setPickingSystem(true)
    try {
      const res = await api.fs.pickDirectory(value || null)
      if (res?.path) {
        onChange(res.path)
      }
    } catch {
      openModal()
    } finally {
      setPickingSystem(false)
    }
  }, [disabled, onChange, openModal, pickingSystem, value])

  const inFlightRef = useRef<Set<string>>(new Set())
  const [childrenByPath, setChildrenByPath] = useState<Record<string, DirectoryEntryDto[]>>({})
  const [nodeLoadingByPath, setNodeLoadingByPath] = useState<Record<string, boolean>>({})
  const [nodeErrorByPath, setNodeErrorByPath] = useState<Record<string, string | null>>({})

  const loadDrives = useCallback(async () => {
    setLoadingDrives(true)
    try {
      const data = await api.fs.drives()
      setDrives(data)
      return data
    } finally {
      setLoadingDrives(false)
    }
  }, [])

  const loadListing = useCallback(async (path: string) => {
    setLoadingListing(true)
    setError(null)
    setChildrenByPath({})
    setNodeLoadingByPath({})
    setNodeErrorByPath({})
    inFlightRef.current.clear()
    try {
      const data = await api.fs.listDirectories(path)
      setListing(data)
      setPathInput(data.currentPath)
      setSelectedPath(data.currentPath)
    } catch (e) {
      setError((e as Error).message)
      setListing(null)
    } finally {
      setLoadingListing(false)
    }
  }, [])

  const ensureChildren = useCallback(
    async (path: string) => {
      if (childrenByPath[path]) return
      if (inFlightRef.current.has(path)) return

      inFlightRef.current.add(path)
      setNodeLoadingByPath((s) => ({ ...s, [path]: true }))
      setNodeErrorByPath((s) => ({ ...s, [path]: null }))
      try {
        const data = await api.fs.listDirectories(path)
        setChildrenByPath((s) => ({ ...s, [data.currentPath]: data.directories }))
      } catch (e) {
        setNodeErrorByPath((s) => ({ ...s, [path]: (e as Error).message }))
      } finally {
        inFlightRef.current.delete(path)
        setNodeLoadingByPath((s) => ({ ...s, [path]: false }))
      }
    },
    [childrenByPath],
  )

  const selectDirectory = useCallback(
    async (path: string) => {
      setSelectedPath(path)
      setPathInput(path)
      await ensureChildren(path)
    },
    [ensureChildren],
  )

  const confirmSelection = useCallback(() => {
    if (!selectedPath.trim()) return
    onChange(selectedPath)
    setOpen(false)
  }, [onChange, selectedPath])

  // New folder creation state
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [createFolderError, setCreateFolderError] = useState<string | null>(null)

  const createFolder = useCallback(async () => {
    const parentPath = listing?.currentPath || selectedPath
    if (!parentPath || !newFolderName.trim()) return

    setCreatingFolder(true)
    setCreateFolderError(null)
    try {
      const result = await api.fs.createEntry({
        parentPath,
        name: newFolderName.trim(),
        kind: 'directory',
      })
      // Close dialog and refresh listing
      setNewFolderDialogOpen(false)
      setNewFolderName('')
      // Reload the current listing to show the new folder
      await loadListing(parentPath)
      // Select the newly created folder
      setSelectedPath(result.fullPath)
      setPathInput(result.fullPath)
    } catch (e) {
      setCreateFolderError((e as Error).message)
    } finally {
      setCreatingFolder(false)
    }
  }, [listing?.currentPath, selectedPath, newFolderName, loadListing])

  useEffect(() => {
    if (!open) return
    setError(null)
    setListing(null)
    setChildrenByPath({})
    setNodeLoadingByPath({})
    setNodeErrorByPath({})
    inFlightRef.current.clear()

    const run = async () => {
      try {
        const data = await loadDrives()
        const initial = value.trim() || data[0]?.rootPath
        if (initial) {
          await loadListing(initial)
        }
      } catch (e) {
        setError((e as Error).message)
      }
    }

    void run()
  }, [open, value, loadDrives, loadListing])

  const loading = loadingDrives || loadingListing
  const canSelect = useMemo(() => Boolean(selectedPath.trim()), [selectedPath])

  return {
    open,
    setOpen,
    pickingSystem,
    pickSystemDirectory,
    drives,
    loadingDrives,
    listing,
    loadingListing,
    error,
    pathInput,
    setPathInput,
    selectedPath,
    setSelectedPath,
    loadListing,
    selectDirectory,
    childrenByPath,
    nodeLoadingByPath,
    nodeErrorByPath,
    loading,
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
  }
}

