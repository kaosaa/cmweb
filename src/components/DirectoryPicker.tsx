import type { DirectoryPickerProps } from '@/components/directory-picker/DirectoryPicker.types'
import { DirectoryPickerView } from '@/components/directory-picker/DirectoryPickerView'
import { useDirectoryPicker } from '@/hooks/use-directory-picker'

export function DirectoryPicker(props: DirectoryPickerProps) {
  const state = useDirectoryPicker(props)

  return (
    <DirectoryPickerView
      value={props.value}
      onChange={props.onChange}
      disabled={props.disabled}
      open={state.open}
      setOpen={state.setOpen}
      pickingSystem={state.pickingSystem}
      pickSystemDirectory={() => void state.pickSystemDirectory()}
      drives={state.drives}
      loadListing={(path) => void state.loadListing(path)}
      listing={state.listing}
      loading={state.loading}
      error={state.error}
      pathInput={state.pathInput}
      setPathInput={state.setPathInput}
      selectDirectory={(path) => void state.selectDirectory(path)}
      childrenByPath={state.childrenByPath}
      nodeLoadingByPath={state.nodeLoadingByPath}
      nodeErrorByPath={state.nodeErrorByPath}
      canSelect={state.canSelect}
      confirmSelection={state.confirmSelection}
      // New folder creation
      newFolderDialogOpen={state.newFolderDialogOpen}
      setNewFolderDialogOpen={state.setNewFolderDialogOpen}
      newFolderName={state.newFolderName}
      setNewFolderName={state.setNewFolderName}
      creatingFolder={state.creatingFolder}
      createFolderError={state.createFolderError}
      createFolder={() => void state.createFolder()}
    />
  )
}
