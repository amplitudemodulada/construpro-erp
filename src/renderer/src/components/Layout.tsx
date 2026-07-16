import { ReactNode, useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Truck, UserCheck, Package, Layers,
  ShoppingCart, DollarSign, Database, HelpCircle,
  ChevronRight, LogOut, BarChart2, Keyboard, Download
} from 'lucide-react'
import ChatAjuda from './ChatAjuda'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, fkey: 'F1' },
  { to: '/clientes', label: 'Clientes', icon: Users, fkey: 'F2' },
  { to: '/fornecedores', label: 'Fornecedores', icon: Truck, fkey: 'F3' },
  { to: '/funcionarios', label: 'Funcionários', icon: UserCheck, fkey: 'F4' },
  { to: '/produtos', label: 'Produtos', icon: Package, fkey: 'F5' },
  { to: '/estoque', label: 'Estoque', icon: Layers, fkey: 'F6' },
  { to: '/vendas', label: 'Vendas', icon: ShoppingCart, fkey: 'F7' },
  { to: '/financeiro', label: 'Financeiro', icon: DollarSign, fkey: 'F8' },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart2, fkey: 'F9' },
  { to: '/backup', label: 'Backup', icon: Database, fkey: 'F10' },
  { to: '/ajuda', label: 'Ajuda', icon: HelpCircle, fkey: 'F11' },
]

function confirmarSair() {
  if (confirm('Deseja realmente sair do sistema?')) {
    window.api.app.sair()
  }
}

interface LayoutProps {
  children: ReactNode
  licenseStatus?: any
}

export default function Layout({ children, licenseStatus }: LayoutProps) {
  const location = useLocation()
  const current = nav.find(n => n.to === location.pathname)
  const navigate = useNavigate()
  const [mostrarAtalhos, setMostrarAtalhos] = useState(false)
  const [updateDisponivel, setUpdateDisponivel] = useState<string | null>(null)
  const [versaoAtual, setVersaoAtual] = useState('')

  useEffect(() => {
    window.api.app.version().then((v: string) => setVersaoAtual(v)).catch(() => {})
    window.api.update.latest().then((r: any) => {
      if (r?.version) {
        window.api.app.version().then((local: string) => {
          if (r.version !== local) {
            setUpdateDisponivel(r.version)
          }
        })
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const emInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement
      if (emInput) return
      switch (e.key) {
        case 'F1':  e.preventDefault(); navigate('/'); break
        case 'F2':  e.preventDefault(); navigate('/clientes'); break
        case 'F3':  e.preventDefault(); navigate('/fornecedores'); break
        case 'F4':  e.preventDefault(); navigate('/funcionarios'); break
        case 'F5':  e.preventDefault(); navigate('/produtos'); break
        case 'F6':  e.preventDefault(); navigate('/estoque'); break
        case 'F7':  e.preventDefault(); navigate('/vendas'); break
        case 'F8':  e.preventDefault(); navigate('/financeiro'); break
        case 'F9':  e.preventDefault(); navigate('/relatorios'); break
        case 'F10': e.preventDefault(); navigate('/backup'); break
        case 'F11': e.preventDefault(); navigate('/ajuda'); break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [navigate])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-700">
          <div className="text-xl font-bold text-white">ConstruPro</div>
          <div className="text-xs text-slate-400 mt-0.5">
            ERP Materiais de Construção
            {versaoAtual && <span className="ml-1 text-slate-500">v{versaoAtual}</span>}
          </div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon, fkey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {fkey && (
                <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-mono leading-none">
                  {fkey}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Botão Sair */}
        <div className="p-3 border-t border-slate-700 space-y-1">
          {updateDisponivel && (
            <button
              onClick={() => navigate('/ajuda')}
              className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-medium text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 transition-all"
            >
              <Download size={14} />
              <span className="flex-1 text-left">Atualização v{updateDisponivel}</span>
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            </button>
          )}
          <button
            onClick={() => setMostrarAtalhos(p => !p)}
            className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-all"
          >
            <Keyboard size={14} />
            Atalhos do teclado
          </button>
          <button
            onClick={confirmarSair}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-600 hover:text-white transition-all"
          >
            <LogOut size={16} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>ConstruPro ERP</span>
            <ChevronRight size={14} />
            <span className="font-semibold text-slate-800">{current?.label || 'Página'}</span>
          </div>
        </header>

        {/* Page */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        <ChatAjuda />

        {/* Rodapé */}
        <footer className="bg-white border-t border-slate-200 px-6 py-2 shrink-0 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            © {new Date().getFullYear()} <strong className="text-slate-600">Msdos Informatica</strong> — Todos os direitos reservados
          </span>
          <span className="text-xs text-slate-300">
            Ins = Novo · Ctrl+S = Salvar · Ctrl+B = Buscar · Esc = Fechar · F1–F11 = Navegação
          </span>
        </footer>
      </main>

      {/* Painel de atalhos */}
      {mostrarAtalhos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setMostrarAtalhos(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[480px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Keyboard size={18} className="text-orange-500" />
              <h2 className="font-bold text-slate-800 text-lg">Atalhos do Teclado</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
              <div className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Navegação</div>
              {nav.filter(n => n.fkey).map(n => (
                <div key={n.to} className="flex items-center justify-between">
                  <span className="text-slate-600">{n.label}</span>
                  <kbd className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-mono">{n.fkey}</kbd>
                </div>
              ))}
              <div className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wide mt-3 mb-1">Ações nas páginas</div>
              {[
                ['Novo registro', 'Insert'],
                ['Salvar / Confirmar', 'Ctrl+S'],
                ['Buscar / Filtrar', 'Ctrl+B'],
                ['Fechar modal', 'Esc'],
                ['Confirmar diálogo', 'Enter'],
              ].map(([label, key]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-slate-600">{label}</span>
                  <kbd className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-mono">{key}</kbd>
                </div>
              ))}
            </div>
            <button className="mt-5 w-full btn btn-secondary text-sm" onClick={() => setMostrarAtalhos(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  )
}
