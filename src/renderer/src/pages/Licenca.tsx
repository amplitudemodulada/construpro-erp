import { useEffect, useState } from 'react'
import { Key, Shield, CheckCircle, AlertCircle, Monitor } from 'lucide-react'

interface Props {
  onActivate: () => void
}

export default function Licenca({ onActivate }: Props) {
  const [chave, setChave] = useState('')
  const [info, setInfo] = useState<any>(null)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.api.license.info().then(setInfo)
  }, [])

  function formatarChave(v: string) {
    const clean = v.replace(/[^A-Fa-f0-9]/g, '').toUpperCase().slice(0, 16)
    return clean.match(/.{1,4}/g)?.join('-') || clean
  }

  async function ativar() {
    if (chave.replace(/-/g, '').length !== 16) {
      setErro(true); setMsg('Digite uma chave completa no formato XXXX-XXXX-XXXX-XXXX'); return
    }
    setLoading(true)
    const res = await window.api.license.activate(chave)
    setLoading(false)
    setErro(!res.valid)
    setMsg(res.message)
    if (res.valid) {
      setInfo(await window.api.license.info())
      setTimeout(onActivate, 1500)
    }
  }

  const isFirstTime = !info?.chave

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500 rounded-2xl mb-4 shadow-lg">
            <span className="text-4xl">🏗️</span>
          </div>
          <h1 className="text-3xl font-bold text-white">ConstruPro ERP</h1>
          <p className="text-slate-400 mt-1">Sistema de Gestão para Loja de Construção</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Key className="text-orange-500" size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">
                {isFirstTime ? 'Ativar Licença' : 'Gerenciar Licença'}
              </h2>
              <p className="text-sm text-slate-500">
                {isFirstTime ? 'Insira sua chave para continuar' : 'Informações da licença ativa'}
              </p>
            </div>
          </div>

          {/* Hardware ID */}
          {info?.hardwareId && (
            <div className="bg-slate-50 rounded-lg p-3 mb-5 flex items-start gap-2">
              <Monitor size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-600 mb-0.5">ID do Computador</div>
                <div className="text-xs text-slate-500 font-mono break-all">{info.hardwareId}</div>
                <div className="text-xs text-slate-400 mt-1">Informe este ID ao solicitar sua licença</div>
              </div>
            </div>
          )}

          {/* Licença atual */}
          {info?.chave && (
            <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Shield size={14} className="text-green-600" />
                <span className="text-sm font-semibold text-green-700">Licença Ativa</span>
              </div>
              <div className="text-xs text-slate-600 font-mono">{info.chave}</div>
              {info.validade && (
                <div className="text-xs text-slate-500 mt-1">Válida até: {info.validade}</div>
              )}
            </div>
          )}

          {/* Input chave */}
          <div className="mb-4">
            <label className="label">Chave de Licença</label>
            <input
              type="text"
              className="input font-mono text-center tracking-widest text-lg"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={chave}
              maxLength={19}
              onChange={e => setChave(formatarChave(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && ativar()}
            />
          </div>

          {msg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${erro ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {erro ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              {msg}
            </div>
          )}

          <button
            onClick={ativar}
            disabled={loading}
            className="btn btn-primary w-full justify-center text-base py-3"
          >
            {loading ? 'Validando...' : isFirstTime ? 'Ativar Sistema' : 'Reativar Licença'}
          </button>

          <p className="text-center text-xs text-slate-400 mt-4">
            Para adquirir uma licença, entre em contato com a Msdos Informatica
          </p>
        </div>
      </div>
    </div>
  )
}
