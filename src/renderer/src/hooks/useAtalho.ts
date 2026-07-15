import { useEffect } from 'react'

type Atalhos = Partial<Record<string, () => void>>

export function useAtalho(atalhos: Atalhos) {
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      const emInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)

      for (const [combo, fn] of Object.entries(atalhos)) {
        const partes = combo.toLowerCase().split('+')
        const tecla = partes[partes.length - 1]
        const ctrl = partes.includes('ctrl')
        const alt = partes.includes('alt')
        const shift = partes.includes('shift')
        const isFn = tecla.startsWith('f') && !isNaN(Number(tecla.slice(1)))

        if (emInput && !isFn && !ctrl) continue

        const match =
          e.key.toLowerCase() === tecla &&
          !!e.ctrlKey === ctrl &&
          !!e.altKey === alt &&
          !!e.shiftKey === shift

        if (match) {
          e.preventDefault()
          fn?.()
          break
        }
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [JSON.stringify(Object.keys(atalhos))])
}
