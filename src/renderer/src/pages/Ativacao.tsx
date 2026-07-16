import { useState } from 'react'
import { Key, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface Props {
  onActivate: () => void
}

export default function Ativacao({ onActivate }: Props) {
  const [token, setToken] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleActivate = async () => {
    if (!token.trim()) return

    setStatus('loading')
    try {
      await window.api.license.activate(token.trim())
      const result = await window.api.license.check()

      if (result.valid) {
        setStatus('success')
        setMessage(result.message)
        setTimeout(onActivate, 1500)
      } else {
        setStatus('error')
        setMessage(result.message)
      }
    } catch {
      setStatus('error')
      setMessage('Erro ao validar token. Verifique sua conexão.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key size={32} className="text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">ConstruPro ERP</h1>
          <p className="text-slate-500 mt-2">Sistema de Gestão para Loja de Construção</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Token de Ativação
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => { setToken(e.target.value.toUpperCase()); setStatus('idle') }}
              placeholder="EXEMPLO-2026-ABC123"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center font-mono text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
              disabled={status === 'loading' || status === 'success'}
            />
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <XCircle size={16} />
              {message}
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <CheckCircle size={16} />
              {message}
            </div>
          )}

          <button
            onClick={handleActivate}
            disabled={!token.trim() || status === 'loading' || status === 'success'}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Validando...
              </>
            ) : status === 'success' ? (
              <>
                <CheckCircle size={18} />
                Ativado!
              </>
            ) : (
              'Ativar Sistema'
            )}
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          <p>Para obter seu token, entre em contato com</p>
          <p className="font-semibold text-slate-500">Msdos Informatica</p>
        </div>
      </div>
    </div>
  )
}
