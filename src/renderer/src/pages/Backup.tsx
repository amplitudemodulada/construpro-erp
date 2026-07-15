import { useEffect, useState } from 'react'
import { Download, Upload, Database, CheckCircle, AlertCircle, FolderOpen } from 'lucide-react'

export default function Backup() {
  const [info, setInfo] = useState<any>(null)
  const [msg, setMsg] = useState<{ texto: string; ok: boolean } | null>(null)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    window.api.backup.caminhoBanco().then(setInfo)
  }, [])

  async function exportar() {
    setCarregando(true)
    setMsg(null)
    const res = await window.api.backup.exportar()
    setCarregando(false)
    setMsg({ texto: res.msg, ok: res.ok })
  }

  async function restaurar() {
    const confirma = confirm(
      'ATENÇÃO: Restaurar um backup irá SUBSTITUIR todos os dados atuais.\n\n' +
      'Um backup automático do banco atual será feito antes da restauração.\n\n' +
      'Deseja continuar?'
    )
    if (!confirma) return

    setCarregando(true)
    setMsg(null)
    const res = await window.api.backup.restaurar()
    setCarregando(false)
    setMsg({ texto: res.msg, ok: res.ok })

    if (res.reiniciar) {
      setTimeout(() => window.api.app.reiniciar(), 2000)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Backup e Restauração</h1>
        <p className="text-slate-500 text-sm mt-1">Gerencie cópias de segurança do banco de dados do sistema</p>
      </div>

      {/* Info banco */}
      {info && (
        <div className="card flex items-start gap-3">
          <Database size={20} className="text-orange-500 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold text-slate-700 text-sm mb-1">Localização do Banco de Dados</div>
            <div className="text-xs text-slate-500 font-mono bg-slate-50 rounded px-2 py-1 break-all">{info.path}</div>
          </div>
        </div>
      )}

      {/* Mensagem */}
      {msg && (
        <div className={`flex items-start gap-3 p-4 rounded-lg ${msg.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {msg.ok ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
          <span className="text-sm whitespace-pre-line">{msg.texto}</span>
        </div>
      )}

      {/* Ações */}
      <div className="grid grid-cols-1 gap-4">

        {/* Exportar */}
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <Download size={24} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-slate-800">Fazer Backup</h2>
              <p className="text-sm text-slate-500 mt-1">
                Salva uma cópia do banco de dados em um local de sua escolha.
                Recomendado fazer diariamente ou antes de qualquer alteração importante.
              </p>
              <button
                className="btn btn-primary mt-4"
                onClick={exportar}
                disabled={carregando}
              >
                <Download size={16} />
                {carregando ? 'Salvando...' : 'Fazer Backup Agora'}
              </button>
            </div>
          </div>
        </div>

        {/* Restaurar */}
        <div className="card border-red-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
              <Upload size={24} className="text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-slate-800">Restaurar Backup</h2>
              <p className="text-sm text-slate-500 mt-1">
                Substitui o banco de dados atual por um backup salvo anteriormente.
                <span className="text-red-600 font-medium"> Todos os dados atuais serão substituídos.</span>
                <br />Um backup automático é criado antes da restauração.
              </p>
              <button
                className="btn btn-danger mt-4"
                onClick={restaurar}
                disabled={carregando}
              >
                <FolderOpen size={16} />
                {carregando ? 'Restaurando...' : 'Restaurar de Arquivo...'}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Dicas */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="font-semibold text-amber-800 text-sm mb-2">Boas práticas de backup</div>
        <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
          <li>Faça backup diariamente ao final do expediente</li>
          <li>Guarde cópias em um pen drive ou HD externo</li>
          <li>Mantenha ao menos 7 backups dos últimos 7 dias</li>
          <li>Teste a restauração periodicamente em ambiente seguro</li>
          <li>Nunca restaure sem antes fazer um backup do estado atual</li>
        </ul>
      </div>
    </div>
  )
}
