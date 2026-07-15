import { useEffect, useRef, useState } from 'react'
import { Plus, Search, History, ArrowUp, ArrowDown, Barcode, AlertCircle, CheckCircle } from 'lucide-react'
import Modal from '../components/Modal'
import { useAtalho } from '../hooks/useAtalho'

export default function Estoque() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [movs, setMovs] = useState<any[]>([])
  const [filtro, setFiltro] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ produto_id: '', tipo: 'ENTRADA', quantidade: '', motivo: '' })
  const [abaProdutos, setAbaProdutos] = useState(true)

  // Leitor de código de barras
  const [codigoBarras, setCodigoBarras] = useState('')
  const [produtoLido, setProdutoLido] = useState<any>(null)
  const [msgBarras, setMsgBarras] = useState<{ texto: string; erro: boolean } | null>(null)
  const barrasRef = useRef<HTMLInputElement>(null)
  const qtdRef = useRef<HTMLInputElement>(null)

  useAtalho({
    'Insert': () => { if (!modal) abrirManual() },
    'ctrl+s': () => { if (modal) ajustar() },
    'ctrl+b': () => barrasRef.current?.focus(),
    'Escape': () => { setModal(false); setProdutoLido(null); setTimeout(() => barrasRef.current?.focus(), 100) },
  })

  const carregar = () => {
    window.api.produtos.listar(filtro || undefined).then(setProdutos)
    window.api.estoque.movimentacoes().then(setMovs)
  }
  useEffect(() => { carregar() }, [filtro])

  // Ao identificar produto via barras, abre modal de entrada pré-preenchido
  async function lerCodigoBarras(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const codigo = codigoBarras.trim()
    if (!codigo) return
    setCodigoBarras('')

    const produto = await window.api.produtos.buscarPorBarras(codigo)
    if (!produto) {
      setMsgBarras({ texto: `Código "${codigo}" não encontrado no cadastro.`, erro: true })
      setTimeout(() => setMsgBarras(null), 3000)
      return
    }

    setProdutoLido(produto)
    setForm({ produto_id: String(produto.id), tipo: 'ENTRADA', quantidade: '', motivo: 'Recebimento de mercadoria' })
    setModal(true)
    setTimeout(() => qtdRef.current?.focus(), 100)
  }

  async function ajustar() {
    if (!form.produto_id) return alert('Selecione um produto')
    if (!form.quantidade || parseFloat(form.quantidade) <= 0) return alert('Quantidade inválida')
    await window.api.estoque.ajustar({
      produto_id: Number(form.produto_id),
      tipo: form.tipo,
      quantidade: parseFloat(form.quantidade),
      motivo: form.motivo
    })
    setModal(false)
    setProdutoLido(null)
    setForm({ produto_id: '', tipo: 'ENTRADA', quantidade: '', motivo: '' })
    setMsgBarras({ texto: `Estoque atualizado com sucesso!`, erro: false })
    setTimeout(() => { setMsgBarras(null); barrasRef.current?.focus() }, 2500)
    carregar()
  }

  function abrirManual() {
    setProdutoLido(null)
    setForm({ produto_id: '', tipo: 'ENTRADA', quantidade: '', motivo: '' })
    setModal(true)
  }

  const fmt = (v: number) => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Controle de Estoque</h1>
        <button className="btn btn-primary" onClick={abrirManual}><Plus size={16} /> Ajuste Manual</button>
      </div>

      {/* Campo leitor de código de barras */}
      <div className="card py-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
            <Barcode size={20} className="text-orange-500" />
          </div>
          <div className="flex-1">
            <label className="label mb-1">Entrada por Código de Barras</label>
            <div className="flex items-center gap-3">
              <input
                ref={barrasRef}
                className="input max-w-xs font-mono"
                placeholder="Escaneie ou digite o código..."
                value={codigoBarras}
                onChange={e => setCodigoBarras(e.target.value)}
                onKeyDown={lerCodigoBarras}
                autoFocus
              />
              {msgBarras && (
                <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${msgBarras.erro ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {msgBarras.erro ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                  {msgBarras.texto}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Aponte o leitor aqui e escaneie — o produto é identificado e o modal de entrada abre automaticamente
            </p>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-2">
        <button className={`btn ${abaProdutos ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAbaProdutos(true)}>
          Posição de Estoque
        </button>
        <button className={`btn ${!abaProdutos ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAbaProdutos(false)}>
          <History size={16} /> Histórico
        </button>
      </div>

      {abaProdutos ? (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Search size={16} className="text-slate-400" />
            <input className="input max-w-xs" placeholder="Filtrar produtos..." value={filtro} onChange={e => setFiltro(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Un.</th>
                  <th>Estoque Atual</th>
                  <th>Mínimo</th>
                  <th>Valor Estoque</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map(p => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.nome}</td>
                    <td>{p.categoria_nome}</td>
                    <td>{p.unidade}</td>
                    <td className="font-bold">{p.estoque_atual}</td>
                    <td>{p.estoque_minimo}</td>
                    <td>{fmt(p.preco_venda * p.estoque_atual)}</td>
                    <td>
                      <span className={`badge ${p.estoque_atual <= 0 ? 'badge-red' : p.estoque_atual <= p.estoque_minimo ? 'badge-yellow' : 'badge-green'}`}>
                        {p.estoque_atual <= 0 ? 'Sem estoque' : p.estoque_atual <= p.estoque_minimo ? 'Estoque baixo' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>Saldo Anterior</th>
                  <th>Saldo Atual</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {movs.length === 0 && <tr><td colSpan={7} className="text-center text-slate-400 py-8">Nenhuma movimentação registrada</td></tr>}
                {movs.map(m => (
                  <tr key={m.id}>
                    <td className="text-xs">{new Date(m.criado_em).toLocaleString('pt-BR')}</td>
                    <td>{m.produto_nome}</td>
                    <td>
                      <span className={`badge ${m.tipo === 'ENTRADA' ? 'badge-green' : m.tipo === 'SAIDA' ? 'badge-red' : 'badge-blue'}`}>
                        {m.tipo === 'ENTRADA' ? <ArrowUp size={10} className="inline" /> : m.tipo === 'SAIDA' ? <ArrowDown size={10} className="inline" /> : null}
                        {' '}{m.tipo}
                      </span>
                    </td>
                    <td className="font-bold">{m.quantidade}</td>
                    <td>{m.saldo_anterior}</td>
                    <td>{m.saldo_atual}</td>
                    <td className="text-sm text-slate-500">{m.motivo || m.referencia_tipo || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Ajuste */}
      <Modal
        open={modal}
        title={produtoLido ? `Entrada — ${produtoLido.nome}` : 'Ajuste de Estoque'}
        onClose={() => { setModal(false); setProdutoLido(null); setTimeout(() => barrasRef.current?.focus(), 100) }}
      >
        <div className="space-y-4">

          {/* Card do produto identificado via barras */}
          {produtoLido && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-3">
              <Barcode size={18} className="text-orange-500 shrink-0" />
              <div className="text-sm">
                <div className="font-bold text-slate-800">{produtoLido.nome}</div>
                <div className="text-slate-500">
                  Estoque atual: <strong>{produtoLido.estoque_atual} {produtoLido.unidade}</strong>
                  {' · '}{produtoLido.categoria_nome}
                </div>
              </div>
            </div>
          )}

          {/* Seleção manual (quando aberto sem barras) */}
          {!produtoLido && (
            <div>
              <label className="label">Produto *</label>
              <select className="input" value={form.produto_id} onChange={e => setForm(p => ({ ...p, produto_id: e.target.value }))}>
                <option value="">Selecionar produto...</option>
                {produtos.map(p => <option key={p.id} value={p.id}>{p.nome} (atual: {p.estoque_atual} {p.unidade})</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="label">Tipo de Movimentação *</label>
            <select className="input" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
              <option value="ENTRADA">Entrada (adicionar ao estoque)</option>
              <option value="SAIDA">Saída (retirar do estoque)</option>
              <option value="AJUSTE">Ajuste (definir quantidade exata)</option>
            </select>
          </div>

          <div>
            <label className="label">Quantidade *</label>
            <input
              ref={qtdRef}
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={form.quantidade}
              onChange={e => setForm(p => ({ ...p, quantidade: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && ajustar()}
            />
          </div>

          <div>
            <label className="label">Motivo / Observação</label>
            <input
              className="input"
              value={form.motivo}
              onChange={e => setForm(p => ({ ...p, motivo: e.target.value }))}
              placeholder="Ex: Recebimento fornecedor, Inventário..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button className="btn btn-secondary" onClick={() => { setModal(false); setProdutoLido(null); setTimeout(() => barrasRef.current?.focus(), 100) }}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={ajustar}>
            Confirmar {form.tipo === 'ENTRADA' ? 'Entrada' : form.tipo === 'SAIDA' ? 'Saída' : 'Ajuste'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
