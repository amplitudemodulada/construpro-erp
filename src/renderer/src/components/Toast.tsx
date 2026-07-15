import { useEffect, useState, createContext, useContext, ReactNode } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
interface ToastMsg { id: number; texto: string; tipo: ToastType }

const ToastCtx = createContext<(texto: string, tipo?: ToastType) => void>(() => {})

export function useToast() { return useContext(ToastCtx) }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msgs, setMsgs] = useState<ToastMsg[]>([])
  let nextId = 0

  function add(texto: string, tipo: ToastType = 'success') {
    const id = ++nextId
    setMsgs(p => [...p, { id, texto, tipo }])
    setTimeout(() => setMsgs(p => p.filter(m => m.id !== id)), 3500)
  }

  const icons = { success: CheckCircle, error: AlertCircle, info: Info }
  const cores = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {msgs.map(m => {
          const Icon = icons[m.tipo]
          return (
            <div key={m.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium pointer-events-auto animate-fade-in ${cores[m.tipo]}`}>
              <Icon size={16} className="shrink-0" />
              <span>{m.texto}</span>
              <button className="ml-2 opacity-50 hover:opacity-100" onClick={() => setMsgs(p => p.filter(x => x.id !== m.id))}><X size={12} /></button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}
