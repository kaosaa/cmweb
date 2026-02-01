import { useCallback, useState } from 'react'
import { ChatAppView } from '@/components/chat/ChatAppView'
import { useChatController } from '@/hooks/use-chat-controller'
import { useFontSettings, type FontSettings } from '@/hooks/use-font-settings'

export default function ChatAppContainer() {
  const chat = useChatController()

  const { settings: fontSettings, updateSettings: applyFontSettings } = useFontSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tempFontSettings, setTempFontSettings] = useState<FontSettings>(fontSettings)

  const openSettings = useCallback(() => {
    setTempFontSettings(fontSettings)
    setSettingsOpen(true)
  }, [fontSettings])

  const confirmSettings = useCallback(() => {
    applyFontSettings(tempFontSettings)
    setSettingsOpen(false)
  }, [applyFontSettings, tempFontSettings])

  const cancelSettings = useCallback(() => {
    setTempFontSettings(fontSettings)
    setSettingsOpen(false)
  }, [fontSettings])

  return (
    <ChatAppView
      {...chat}
      settingsOpen={settingsOpen}
      openSettings={openSettings}
      confirmSettings={confirmSettings}
      cancelSettings={cancelSettings}
      tempFontSettings={tempFontSettings}
      setTempFontSettings={setTempFontSettings}
    />
  )
}

