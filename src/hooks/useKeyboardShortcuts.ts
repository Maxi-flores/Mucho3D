import { useEffect } from 'react'

type KeyboardHandler = (event: KeyboardEvent) => void

interface ShortcutConfig {
  key: string
  handler: KeyboardHandler
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  preventDefault?: boolean
}

/**
 * Hook for managing keyboard shortcuts
 * Supports modifier keys (Ctrl, Meta/Cmd, Shift, Alt)
 *
 * @example
 * useKeyboardShortcuts([
 *   { key: 'k', meta: true, handler: openCommandPalette },
 *   { key: 'Escape', handler: closeModal },
 * ])
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatches =
          event.key.toLowerCase() === shortcut.key.toLowerCase()

        const ctrlMatches = shortcut.ctrl ? event.ctrlKey : true
        const metaMatches = shortcut.meta ? event.metaKey : true
        const shiftMatches = shortcut.shift ? event.shiftKey : true
        const altMatches = shortcut.alt ? event.altKey : true

        // Check if modifier is required but not pressed
        const ctrlRequired = shortcut.ctrl && !event.ctrlKey
        const metaRequired = shortcut.meta && !event.metaKey
        const shiftRequired = shortcut.shift && !event.shiftKey
        const altRequired = shortcut.alt && !event.altKey

        if (
          keyMatches &&
          ctrlMatches &&
          metaMatches &&
          shiftMatches &&
          altMatches &&
          !ctrlRequired &&
          !metaRequired &&
          !shiftRequired &&
          !altRequired
        ) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault()
          }
          shortcut.handler(event)
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts])
}
