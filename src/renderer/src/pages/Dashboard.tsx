import { useEffect, useState } from 'react'
import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp, TrendingDown, Package } from 'lucide-react'

export default function Dashboard() {
  const [resumo, setResumo] = useState<any>(null)
  const [alertas, setAlertas] = useState<any[]>([])

  const hoje = new Date().toISOString().split('T')[0]
  const inicioMes = hoje.slice(0, 8) + '01'

  useEffect(() => {
    window.api.financeiro.resumo({ inicio: inicioMes, fim: hoje }).then(setResumo)
    window.api.produtos.estoqueMinimo().then(setAlertas)
  }, [])

  const fmt = (v: number) => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'

  const cards = resumo ? [
    { label: 'Receitas do Mês', value: fmt(resumo.receitas), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Despesas do Mês', value: fmt(resumo.despesas), icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Saldo do Mês', value: fmt(resumo.saldo), icon: DollarSign, color: resumo.saldo >= 0 ? 'text-blue-600' : 'text-red-600', bg: resumo.saldo >= 0 ? 'bg-blue-50' : 'bg-red-50' },
    { label: 'Vendas do Mês', value: resumo.vendasMes, icon: ShoppingCart, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'A Vencer (7 dias)', value: fmt(resumo.aVencer), icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'A Receber', value: fmt(resumo.aReceber), icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
  ] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Resumo de {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
              </div>
              <div className={`${bg} p-2 rounded-lg`}>
                <Icon size={20} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alertas de estoque */}
      {alertas.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Package size={18} className="text-orange-500" />
            <h2 className="font-semibold text-slate-800">Alerta de Estoque Mínimo ({alertas.length} produtos)</h2>
          </div>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Atual</th>
                  <th>Mínimo</th>
                  <th>Diferença</th>
                </tr>
              </thead>
              <tbody>
                {alertas.slice(0, 10).map((p: any) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.nome}</td>
                    <td>{p.categoria_nome}</td>
                    <td>
                      <span className={`badge ${p.estoque_atual <= 0 ? 'badge-red' : 'badge-yellow'}`}>
                        {p.estoque_atual} {p.unidade}
                      </span>
                    </td>
                    <td>{p.estoque_minimo} {p.unidade}</td>
                    <td className="text-red-600 font-medium">
                      -{(p.estoque_minimo - p.estoque_atual).toFixed(2)} {p.unidade}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {alertas.length === 0 && resumo && (
        <div className="card text-center py-8 text-slate-400">
          <Package size={40} className="mx-auto mb-2 opacity-30" />
          <p>Todos os produtos estão acima do estoque mínimo</p>
        </div>
      )}
    </div>
  )
}
