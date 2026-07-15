import { useEffect, useState } from 'react'
import { BarChart2, TrendingUp, Package, DollarSign, Download } from 'lucide-react'

const hoje = new Date()
const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10)

const fmt = (v: number) => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'
const fmtN = (v: number) => v?.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

// Gráfico de barras SVG simples
function BarrasSVG({ dados, cor = '#f97316' }: { dados: { label: string; valor: number }[]; cor?: string }) {
  if (!dados.length) return <div className="text-center text-slate-400 py-8 text-sm">Sem dados no período</div>
  const max = Math.max(...dados.map(d => d.valor), 1)
  const H = 140
  const W = 100 / dados.length

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 100 ${H + 30}`} className="w-full" style={{ minWidth: dados.length * 40 }}>
        {dados.map((d, i) => {
          const barH = Math.max(2, (d.valor / max) * H)
          const x = i * W + W * 0.15
          const w = W * 0.7
          const y = H - barH
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={barH} fill={cor} rx="1" opacity="0.85" />
              <text x={x + w / 2} y={H + 10} textAnchor="middle" fontSize="4" fill="#64748b">
                {d.label.length > 6 ? d.label.slice(0, 5) + '.' : d.label}
              </text>
              <text x={x + w / 2} y={y - 2} textAnchor="middle" fontSize="3.5" fill={cor} fontWeight="bold">
                {d.valor > 0 ? (d.valor >= 1000 ? `${(d.valor / 1000).toFixed(1)}k` : String(Math.round(d.valor))) : ''}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// Barra horizontal de progresso
function BarraHorizontal({ nome, valor, max, cor = '#f97316', extra = '' }: any) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-700 font-medium truncate max-w-[55%]">{nome}</span>
        <span className="text-slate-500 text-xs">{extra}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cor }} />
      </div>
    </div>
  )
}

export default function Relatorios() {
  const [inicio, setInicio] = useState(primeiroDiaMes)
  const [fim, setFim] = useState(ultimoDiaMes)
  const [vendas, setVendas] = useState<any[]>([])
  const [topProdutos, setTopProdutos] = useState<any[]>([])
  const [estoque, setEstoque] = useState<any[]>([])
  const [lucro, setLucro] = useState<any>(null)
  const [aba, setAba] = useState<'vendas' | 'produtos' | 'estoque' | 'lucro'>('vendas')

  const carregar = async () => {
    const [v, tp, e, l] = await Promise.all([
      window.api.relatorios.vendasPorPeriodo(inicio, fim),
      window.api.relatorios.produtosMaisVendidos(inicio, fim),
      window.api.relatorios.estoque(),
      window.api.relatorios.lucroBruto(inicio, fim),
    ])
    setVendas(v)
    setTopProdutos(tp)
    setEstoque(e)
    setLucro(l)
  }

  useEffect(() => { carregar() }, [inicio, fim])

  // Agrupa vendas por dia para o gráfico
  const vendasPorDia = (() => {
    const map: Record<string, number> = {}
    vendas.forEach(v => {
      const dia = new Date(v.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      map[dia] = (map[dia] || 0) + v.total
    })
    return Object.entries(map).map(([label, valor]) => ({ label, valor }))
  })()

  const totalVendas = vendas.reduce((s, v) => s + v.total, 0)
  const ticketMedio = vendas.length > 0 ? totalVendas / vendas.length : 0
  const maxTop = topProdutos[0]?.total_vendido || 1
  const valorEstoque = estoque.reduce((s, p) => s + (p.valor_venda || 0), 0)
  const semEstoque = estoque.filter(p => p.estoque_atual <= 0).length
  const estoqueMinimo = estoque.filter(p => p.estoque_atual > 0 && p.estoque_atual <= p.estoque_minimo).length

  function exportarCSV() {
    const rows = [
      ['Produto', 'Qtd Vendida', 'Total Vendido'],
      ...topProdutos.map(p => [p.nome, p.qtd_total, fmt(p.total_vendido)])
    ]
    const csv = rows.map(r => r.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_produtos_${inicio}_${fim}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Relatórios</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <label>De</label>
            <input type="date" className="input py-1 text-sm" value={inicio} onChange={e => setInicio(e.target.value)} />
            <label>até</label>
            <input type="date" className="input py-1 text-sm" value={fim} onChange={e => setFim(e.target.value)} />
          </div>
          <button className="btn btn-secondary text-sm flex items-center gap-1.5" onClick={carregar}>
            <BarChart2 size={14} /> Atualizar
          </button>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card py-3 px-4 border-l-4 border-orange-400">
          <div className="text-xs text-slate-500 mb-1">Total Vendido</div>
          <div className="text-lg font-bold text-orange-600">{fmt(totalVendas)}</div>
          <div className="text-xs text-slate-400">{vendas.length} venda(s)</div>
        </div>
        <div className="card py-3 px-4 border-l-4 border-blue-400">
          <div className="text-xs text-slate-500 mb-1">Ticket Médio</div>
          <div className="text-lg font-bold text-blue-600">{fmt(ticketMedio)}</div>
          <div className="text-xs text-slate-400">por venda</div>
        </div>
        <div className="card py-3 px-4 border-l-4 border-emerald-400">
          <div className="text-xs text-slate-500 mb-1">Lucro Bruto</div>
          <div className="text-lg font-bold text-emerald-600">{fmt(lucro?.lucro_bruto || 0)}</div>
          <div className="text-xs text-slate-400">margem {lucro?.margem || 0}%</div>
        </div>
        <div className="card py-3 px-4 border-l-4 border-rose-400">
          <div className="text-xs text-slate-500 mb-1">Valor em Estoque</div>
          <div className="text-lg font-bold text-rose-600">{fmt(valorEstoque)}</div>
          <div className="text-xs text-slate-400">{estoque.length} produto(s)</div>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-2">
        {[
          { key: 'vendas', label: 'Vendas por Dia', icon: TrendingUp },
          { key: 'produtos', label: 'Mais Vendidos', icon: Package },
          { key: 'estoque', label: 'Posição de Estoque', icon: BarChart2 },
          { key: 'lucro', label: 'Lucro Bruto', icon: DollarSign },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`btn flex items-center gap-1.5 text-sm ${aba === key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAba(key as any)}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Conteúdo por aba */}
      {aba === 'vendas' && (
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Vendas por Dia — {fmt(totalVendas)}</h2>
          {vendasPorDia.length === 0
            ? <div className="text-center text-slate-400 py-10 text-sm">Nenhuma venda no período</div>
            : <BarrasSVG dados={vendasPorDia} cor="#f97316" />
          }
          <div className="mt-4 overflow-x-auto">
            <table>
              <thead><tr><th>Nº</th><th>Data</th><th>Cliente</th><th>Total</th><th>Pagamento</th></tr></thead>
              <tbody>
                {vendas.length === 0 && <tr><td colSpan={5} className="text-center text-slate-400 py-6">Sem vendas no período</td></tr>}
                {vendas.map(v => (
                  <tr key={v.id}>
                    <td className="font-mono font-bold">#{String(v.numero).padStart(4, '0')}</td>
                    <td className="text-xs">{new Date(v.criado_em).toLocaleDateString('pt-BR')}</td>
                    <td>{v.cliente_nome || 'Consumidor Final'}</td>
                    <td className="font-bold text-green-700">{fmt(v.total)}</td>
                    <td>{v.forma_pagamento}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {aba === 'produtos' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">Produtos Mais Vendidos</h2>
            <button className="btn btn-secondary text-xs flex items-center gap-1" onClick={exportarCSV}>
              <Download size={12} /> Exportar CSV
            </button>
          </div>
          {topProdutos.length === 0
            ? <div className="text-center text-slate-400 py-10 text-sm">Nenhuma venda no período</div>
            : (
              <div className="space-y-3">
                {topProdutos.map((p, i) => (
                  <div key={i}>
                    <BarraHorizontal
                      nome={`${i + 1}. ${p.nome}`}
                      valor={p.total_vendido}
                      max={maxTop}
                      cor={i === 0 ? '#f97316' : i === 1 ? '#3b82f6' : i === 2 ? '#10b981' : '#94a3b8'}
                      extra={`${fmtN(p.qtd_total)} ${p.unidade} · ${fmt(p.total_vendido)}`}
                    />
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {aba === 'estoque' && (
        <div className="card">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="font-semibold text-slate-700 flex-1">Posição de Estoque</h2>
            <span className="badge badge-red">{semEstoque} sem estoque</span>
            <span className="badge badge-yellow">{estoqueMinimo} abaixo do mínimo</span>
          </div>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Un.</th>
                  <th>Estoque</th>
                  <th>Mín.</th>
                  <th>Vlr Custo</th>
                  <th>Vlr Venda</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {estoque.map(p => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.nome}</td>
                    <td className="text-slate-500">{p.categoria_nome}</td>
                    <td>{p.unidade}</td>
                    <td className="font-bold">{p.estoque_atual}</td>
                    <td>{p.estoque_minimo}</td>
                    <td>{fmt(p.valor_custo)}</td>
                    <td>{fmt(p.valor_venda)}</td>
                    <td>
                      <span className={`badge ${p.estoque_atual <= 0 ? 'badge-red' : p.estoque_atual <= p.estoque_minimo ? 'badge-yellow' : 'badge-green'}`}>
                        {p.estoque_atual <= 0 ? 'Zerado' : p.estoque_atual <= p.estoque_minimo ? 'Baixo' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {aba === 'lucro' && lucro && (
        <div className="card space-y-6">
          <h2 className="font-semibold text-slate-700">Demonstrativo de Lucro Bruto</h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Receita Total</div>
              <div className="text-2xl font-bold text-green-700">{fmt(lucro.receita)}</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <div className="text-xs text-red-600 font-medium uppercase tracking-wide mb-1">Custo dos Produtos</div>
              <div className="text-2xl font-bold text-red-700">{fmt(lucro.custo)}</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
              <div className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-1">Lucro Bruto</div>
              <div className="text-2xl font-bold text-orange-700">{fmt(lucro.lucro_bruto)}</div>
            </div>
          </div>

          {/* Barra de margem */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-slate-700">Margem Bruta</span>
              <span className="font-bold text-orange-600">{lucro.margem}%</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-4 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all"
                style={{ width: `${Math.min(100, parseFloat(lucro.margem))}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 space-y-1">
            <div className="flex justify-between"><span>Receita bruta das vendas:</span><span className="font-medium">{fmt(lucro.receita)}</span></div>
            <div className="flex justify-between"><span>(-) Custo dos produtos vendidos:</span><span className="font-medium text-red-600">- {fmt(lucro.custo)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 mt-2 font-bold text-base"><span>= Lucro Bruto:</span><span className="text-orange-700">{fmt(lucro.lucro_bruto)}</span></div>
          </div>

          <p className="text-xs text-slate-400">* Lucro bruto não considera despesas operacionais, salários ou impostos.</p>
        </div>
      )}
    </div>
  )
}
