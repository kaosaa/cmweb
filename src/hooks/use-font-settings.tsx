import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'claudix:fontSettings'

export type FontSettings = {
  fontSize: number     // 12-24, default 16
  fontWeight: number   // 300-600, default 450
}

export const DEFAULT_FONT_SETTINGS: FontSettings = {
  fontSize: 16,
  fontWeight: 450,
}

// Apply font settings to CSS variables
export function applyFontSettings(settings: FontSettings) {
  const root = document.documentElement
  root.style.setProperty('--font-size-base', `${settings.fontSize}px`)
  root.style.setProperty('--font-weight-normal', String(settings.fontWeight))
  root.style.setProperty('--font-weight-medium', String(Math.min(700, settings.fontWeight + 100)))
  root.style.setProperty('--font-weight-bold', String(Math.min(800, settings.fontWeight + 200)))
}

// Load saved settings from localStorage
export function loadFontSettings(): FontSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<FontSettings>
      return {
        fontSize: parsed.fontSize ?? DEFAULT_FONT_SETTINGS.fontSize,
        fontWeight: parsed.fontWeight ?? DEFAULT_FONT_SETTINGS.fontWeight,
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_FONT_SETTINGS
}

// Save settings to localStorage
export function saveFontSettings(settings: FontSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

export function useFontSettings() {
  const [settings, setSettings] = useState<FontSettings>(loadFontSettings)

  // Apply settings to CSS variables on mount and when settings change
  useEffect(() => {
    applyFontSettings(settings)
  }, [settings])

  // Persist settings when they change
  useEffect(() => {
    saveFontSettings(settings)
  }, [settings])

  const updateSettings = useCallback((newSettings: FontSettings) => {
    setSettings({
      fontSize: Math.max(12, Math.min(24, newSettings.fontSize)),
      fontWeight: Math.max(300, Math.min(600, newSettings.fontWeight)),
    })
  }, [])

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_FONT_SETTINGS)
  }, [])

  return {
    settings,
    updateSettings,
    resetToDefaults,
  }
}
