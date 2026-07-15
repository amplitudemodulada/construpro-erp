import { useEffect, useRef, useState } from 'react'
import { Plus, Eye, X, Search, ShoppingCart, Barcode, AlertCircle, Printer, FileText, Download } from 'lucide-react'
import Modal from '../components/Modal'
import { imprimirVenda, imprimirA4, compartilharWhatsApp, gerarPdfCupom, gerarPdfA4 } from '../utils/imprimir'
import { useAtalho } from '../hooks/useAtalho'

const EMPTY_VENDA = { tipo: 'VENDA', status: 'CONFIRMADA', cliente_id: '', funcionario_id: '', desconto: '0', forma_pagamento: 'DINHEIRO', parcelas: '1', observacoes: '' }
const FORMAS = ['DINHEIRO', 'CARTÃO DÉBITO', 'CARTÃO CRÉDITO', 'PIX', 'BOLETO', 'PRAZO']

export default function Vendas() {
  const [vendas, setVendas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [modalVer, setModalVer] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY_VENDA)
  const [itens, setItens] = useState<any[]>([])
  const [buscaProd, setBuscaProd] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [codigoBarras, setCodigoBarras] = useState('')
  const [msgBarras, setMsgBarras] = useState<{ texto: string; erro: boolean } | null>(null)
  const [vendaCriada, setVendaCriada] = useState<any>(null)
  const barrasRef = useRef<HTMLInputElement>(null)
  const buscaProdRef = useRef<HTMLInputElement>(null)

  useAtalho({
    'Insert': () => { if (!modal) abrirNova() },
    'ctrl+s': () => { if (modal) confirmar() },
    'Escape': () => { setVendaCriada(null); setModal(false); setModalVer(null) },
    'ctrl+n': () => { if (!modal) abrirNova() },
    'F2': () => { if (modal) barrasRef.current?.focus() },
    'F3': () => { if (modal) buscaProdRef.current?.focus() },
    'ctrl+delete': () => { if (modal && itens.length > 0) removeItem(itens.length - 1) },
  })

  const carregar = () => window.api.vendas.listar(filtroStatus ? { status: filtroStatus } : {}).then(setVendas)
  useEffect(() => { carregar() }, [filtroStatus])
  useEffect(() => {
    window.api.clientes.listar().then(setClientes)
    window.api.funcionarios.listar().then(setFuncionarios)
    window.api.produtos.listar().then(setProdutos)
  }, [])

  function abrirNova() {
    setForm(EMPTY_VENDA)
    setItens([])
    setCodigoBarras('')
    setMsgBarras(null)
    setModal(true)
    setTimeout(() => barrasRef.current?.focus(), 100)
  }

  async function lerCodigoBarras(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const codigo = codigoBarras.trim()
    if (!codigo) return

    const produto = await window.api.produtos.buscarPorBarras(codigo)
    setCodigoBarras('')

    if (!produto) {
      setMsgBarras({ texto: `Código "${codigo}" não encontrado no cadastro.`, erro: true })
      setTimeout(() => setMsgBarras(null), 3000)
      return
    }

    addItem(produto)
    setMsgBarras({ texto: `${produto.nome} adicionado!`, erro: false })
    setTimeout(() => setMsgBarras(null), 2000)
    barrasRef.current?.focus()
  }

  function addItem(p: any) {
    const existente = itens.find(i => i.produto_id === p.id)
    if (existente) {
      setItens(prev => prev.map(i => i.produto_id === p.id ? { ...i, quantidade: i.quantidade + 1, subtotal: (i.quantidade + 1) * i.preco_unitario } : i))
    } else {
      setItens(prev => [...prev, { produto_id: p.id, nome: p.nome, unidade: p.unidade, quantidade: 1, preco_unitario: p.preco_venda, desconto: 0, subtotal: p.preco_venda }])
    }
    setBuscaProd('')
  }

  function removeItem(idx: number) { setItens(prev => prev.filter((_, i) => i !== idx)) }

  function updateItem(idx: number, field: string, value: number) {
    setItens(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: value }
      updated.subtotal = updated.quantidade * updated.preco_unitario - (updated.desconto || 0)
      return updated
    }))
  }

  const subtotal = itens.reduce((s, i) => s + i.subtotal, 0)
  const desconto = parseFloat(form.desconto) || 0
  const total = Math.max(0, subtotal - desconto)

  async function confirmar() {
    if (itens.length === 0) return alert('Adicione pelo menos um produto')
    const res = await window.api.vendas.criar({
      venda: { ...form, subtotal, desconto, total, cliente_id: Number(form.cliente_id) || null, funcionario_id: Number(form.funcionario_id) || null, parcelas: Number(form.parcelas) || 1 },
      itens
    })
    setModal(false)
    carregar()
    if (res && res.id) {
      const vendaCompleta = await window.api.vendas.buscarPorId(res.id)
      setVendaCriada(vendaCompleta)
    }
  }

  async function cancelar(id: number) {
    if (!confirm('Cancelar esta venda? O estoque será devolvido.')) return
    await window.api.vendas.cancelar(id); carregar()
  }

  async function verVenda(id: number) {
    const v = await window.api.vendas.buscarPorId(id)
    setModalVer(v)
  }

  const fmt = (v: number) => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'
  const flt = buscaProd ? produtos.filter(p => p.nome.toLowerCase().includes(buscaProd.toLowerCase())) : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Vendas</h1>
        <button className="btn btn-primary" onClick={abrirNova}><Plus size={16} /> Nova Venda</button>
      </div>

      <div className="card">
        <div className="flex gap-2 mb-4">
          {['', 'CONFIRMADA', 'ORCAMENTO', 'CANCELADA'].map(s => (
            <button key={s} className={`btn btn-sm ${filtroStatus === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFiltroStatus(s)}>
              {s || 'Todas'}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>Nº</th><th>Tipo</th><th>Cliente</th><th>Total</th><th>Forma Pag.</th><th>Data</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {vendas.length === 0 && <tr><td colSpan={8} className="text-center text-slate-400 py-8">Nenhuma venda encontrada</td></tr>}
              {vendas.map(v => (
                <tr key={v.id}>
                  <td className="font-mono font-bold">#{String(v.numero).padStart(4, '0')}</td>
                  <td><span className="badge badge-blue">{v.tipo}</span></td>
                  <td>{v.cliente_nome || 'Consumidor'}</td>
                  <td className="font-bold text-green-700">{fmt(v.total)}</td>
                  <td>{v.forma_pagamento}</td>
                  <td className="text-xs">{new Date(v.criado_em).toLocaleString('pt-BR')}</td>
                  <td>
                    <span className={`badge ${v.status === 'CONFIRMADA' ? 'badge-green' : v.status === 'CANCELADA' ? 'badge-red' : 'badge-yellow'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-secondary btn-sm" onClick={() => verVenda(v.id)}><Eye size={12} /></button>
                      <button className="btn btn-secondary btn-sm" onClick={async () => { const d = await window.api.vendas.buscarPorId(v.id); imprimirVenda(d) }} title="Imprimir"><Printer size={12} /></button>
                      {v.status !== 'CANCELADA' && <button className="btn btn-danger btn-sm" onClick={() => cancelar(v.id)}><X size={12} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Venda */}
      <Modal open={modal} title="Nova Venda" onClose={() => setModal(false)} size="xl">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={form.tipo} onChange={e => setForm((p: any) => ({ ...p, tipo: e.target.value }))}>
              <option value="VENDA">Venda</option>
              <option value="ORCAMENTO">Orçamento</option>
            </select>
          </div>
          <div>
            <label className="label">Cliente</label>
            <select className="input" value={form.cliente_id} onChange={e => setForm((p: any) => ({ ...p, cliente_id: e.target.value }))}>
              <option value="">Consumidor Final</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Vendedor</label>
            <select className="input" value={form.funcionario_id} onChange={e => setForm((p: any) => ({ ...p, funcionario_id: e.target.value }))}>
              <option value="">Selecionar...</option>
              {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>
        </div>

        {/* Campo leitor de código de barras */}
        <div className="mb-4">
          <label className="label flex items-center gap-1">
            <Barcode size={13} /> Leitor de Código de Barras
          </label>
          <div className="flex gap-2 items-center">
            <input
              ref={barrasRef}
              className="input font-mono max-w-xs"
              placeholder="Aponte o leitor aqui e escaneie..."
              value={codigoBarras}
              onChange={e => setCodigoBarras(e.target.value)}
              onKeyDown={lerCodigoBarras}
            />
            {msgBarras && (
              <div className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg ${msgBarras.erro ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {msgBarras.erro && <AlertCircle size={14} />}
                {msgBarras.texto}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">O produto é adicionado automaticamente ao escanear</p>
        </div>

        {/* Busca de produto */}
        <div className="relative mb-4">
          <label className="label">Adicionar Produto por Nome</label>
          <div className="flex gap-2">
            <Search size={16} className="absolute left-3 top-9 text-slate-400" />
            <input ref={buscaProdRef} className="input pl-8" placeholder="Digite o nome do produto..." value={buscaProd} onChange={e => setBuscaProd(e.target.value)} />
          </div>
          {flt.length > 0 && (
            <div className="absolute z-10 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 w-full max-h-48 overflow-y-auto">
              {flt.slice(0, 10).map(p => (
                <button key={p.id} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex justify-between items-center" onClick={() => addItem(p)}>
                  <span>{p.nome}</span>
                  <span className="text-sm text-orange-600 font-medium">{fmt(p.preco_venda)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Itens */}
        {itens.length > 0 && (
          <div className="mb-4 border border-slate-200 rounded-lg overflow-hidden">
            <table>
              <thead><tr><th>Produto</th><th>Qtd</th><th>Un.</th><th>Preço Unit.</th><th>Desconto</th><th>Subtotal</th><th></th></tr></thead>
              <tbody>
                {itens.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.nome}</td>
                    <td><input type="number" className="input w-20" min="0.01" step="0.01" value={item.quantidade} onChange={e => updateItem(idx, 'quantidade', parseFloat(e.target.value) || 0)} /></td>
                    <td>{item.unidade}</td>
                    <td><input type="number" className="input w-24" step="0.01" value={item.preco_unitario} onChange={e => updateItem(idx, 'preco_unitario', parseFloat(e.target.value) || 0)} /></td>
                    <td><input type="number" className="input w-20" step="0.01" min="0" value={item.desconto} onChange={e => updateItem(idx, 'desconto', parseFloat(e.target.value) || 0)} /></td>
                    <td className="font-bold text-green-700">{fmt(item.subtotal)}</td>
                    <td><button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700"><X size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {itens.length === 0 && (
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-400 mb-4">
            <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Busque e adicione produtos acima</p>
          </div>
        )}

        {/* Totais e pagamento */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
          <div>
            <label className="label">Forma de Pagamento</label>
            <select className="input" value={form.forma_pagamento} onChange={e => setForm((p: any) => ({ ...p, forma_pagamento: e.target.value }))}>
              {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Desconto Geral (R$)</label>
            <input className="input" type="number" step="0.01" min="0" value={form.desconto} onChange={e => setForm((p: any) => ({ ...p, desconto: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="label">Observações</label>
            <input className="input" value={form.observacoes} onChange={e => setForm((p: any) => ({ ...p, observacoes: e.target.value }))} />
          </div>
          <div className="col-span-2 text-right border-t border-slate-200 pt-3">
            <div className="text-sm text-slate-500">Subtotal: {fmt(subtotal)}</div>
            <div className="text-sm text-slate-500">Desconto: -{fmt(desconto)}</div>
            <div className="text-2xl font-bold text-green-700">Total: {fmt(total)}</div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={confirmar}>Confirmar Venda</button>
        </div>
      </Modal>

      {/* Modal Ver Venda */}
      <Modal open={!!modalVer} title={`Venda #${String(modalVer?.numero || '').padStart(4, '0')}`} onClose={() => setModalVer(null)} size="lg">
        {modalVer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Cliente:</span> {modalVer.cliente_nome || 'Consumidor Final'}</div>
              <div><span className="text-slate-500">Status:</span> <span className={`badge ${modalVer.status === 'CONFIRMADA' ? 'badge-green' : 'badge-red'}`}>{modalVer.status}</span></div>
              <div><span className="text-slate-500">Forma Pag.:</span> {modalVer.forma_pagamento}</div>
              <div><span className="text-slate-500">Data:</span> {new Date(modalVer.criado_em).toLocaleString('pt-BR')}</div>
            </div>
            <table>
              <thead><tr><th>Produto</th><th>Qtd</th><th>Un.</th><th>Preço</th><th>Subtotal</th></tr></thead>
              <tbody>
                {modalVer.itens?.map((i: any) => (
                  <tr key={i.id}>
                    <td>{i.produto_nome}</td>
                    <td>{i.quantidade}</td>
                    <td>{i.unidade}</td>
                    <td>{fmt(i.preco_unitario)}</td>
                    <td className="font-bold">{fmt(i.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right font-bold text-xl text-green-700">Total: {fmt(modalVer.total)}</div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button className="btn btn-secondary flex items-center gap-2" onClick={() => imprimirVenda(modalVer)}>
                <Printer size={15} /> Cupom 80mm
              </button>
              <button className="btn btn-secondary flex items-center gap-2" onClick={() => imprimirA4(modalVer)}>
                <Printer size={15} /> Imprimir A4
              </button>
              <button className="btn flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white" onClick={() => compartilharWhatsApp(modalVer)}>
                <span style={{fontSize:15}}>📱</span> WhatsApp
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Pós-Venda — Impressão */}
      <Modal open={!!vendaCriada} title={vendaCriada?.tipo === 'ORCAMENTO' ? 'Orçamento Registrado!' : 'Venda Confirmada!'} onClose={() => setVendaCriada(null)} size="md">
        {vendaCriada && (
          <div className="space-y-4">
            <div className="text-center py-2">
              <div className="text-3xl mb-2">{vendaCriada.tipo === 'ORCAMENTO' ? '📋' : '✅'}</div>
              <div className="text-lg font-bold text-slate-800">
                {vendaCriada.tipo === 'ORCAMENTO' ? 'Orçamento' : 'Venda'} #{String(vendaCriada.numero).padStart(4, '0')}
              </div>
              <div className="text-2xl font-bold text-green-600 mt-1">{fmt(vendaCriada.total)}</div>
              <div className="text-sm text-slate-500 mt-1">{vendaCriada.cliente_nome || 'Consumidor Final'}</div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm font-semibold text-slate-700 mb-3 text-center">
                Deseja imprimir o {vendaCriada.tipo === 'ORCAMENTO' ? 'orçamento' : 'comprovante'}?
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Imprimir direto na impressora</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="btn btn-primary flex items-center justify-center gap-2 py-3"
                    onClick={() => { imprimirVenda(vendaCriada); setVendaCriada(null) }}
                  >
                    <Printer size={16} /> Cupom 80mm
                  </button>
                  <button
                    className="btn btn-primary flex items-center justify-center gap-2 py-3"
                    onClick={() => { imprimirA4(vendaCriada); setVendaCriada(null) }}
                  >
                    <Printer size={16} /> Página A4
                  </button>
                </div>

                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-3">Salvar como PDF</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="btn btn-secondary flex items-center justify-center gap-2 py-3"
                    onClick={() => { gerarPdfCupom(vendaCriada); setVendaCriada(null) }}
                  >
                    <FileText size={16} /> PDF Cupom
                  </button>
                  <button
                    className="btn btn-secondary flex items-center justify-center gap-2 py-3"
                    onClick={() => { gerarPdfA4(vendaCriada); setVendaCriada(null) }}
                  >
                    <Download size={16} /> PDF A4
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                className="btn btn-secondary"
                onClick={() => setVendaCriada(null)}
              >
                Não imprimir — Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
