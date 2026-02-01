import type { DirectoryEntryDto, DriveDto, ListDirectoriesResponse } from '@/api/types'

export type DirectoryPickerViewProps = {
  value: string
  onChange: (path: string) => void
  disabled?: boolean

  open: boolean
  setOpen: (open: boolean) => void

  pickingSystem: boolean
  pickSystemDirectory: () => void

  drives: DriveDto[]
  loadListing: (path: string) => void

  listing: ListDirectoriesResponse | null
  loading: boolean
  error: string | null

  pathInput: string
  setPathInput: (path: string) => void
  selectDirectory: (path: string) => void

  childrenByPath: Record<string, DirectoryEntryDto[]>
  nodeLoadingByPath: Record<string, boolean>
  nodeErrorByPath: Record<string, string | null>

  canSelect: boolean
  confirmSelection: () => void

  // New folder creation
  newFolderDialogOpen: boolean
  setNewFolderDialogOpen: (open: boolean) => void
  newFolderName: string
  setNewFolderName: (name: string) => void
  creatingFolder: boolean
  createFolderError: string | null
  createFolder: () => void
}
