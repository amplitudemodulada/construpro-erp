import { useEffect, useRef, useState } from 'react'
import { Plus, Search, Edit2, Trash2, AlertTriangle } from 'lucide-react'
import Modal from '../components/Modal'
import { useAtalho } from '../hooks/useAtalho'

const EMPTY = { nome: '', categoria_id: '', unidade: 'UN', preco_custo: '', preco_venda: '', estoque_atual: '0', estoque_minimo: '0', codigo_barras: '' }
const UNIDADES = ['UN', 'SC', 'KG', 'M3', 'M2', 'ML', 'MT', 'GL', 'CX', 'PCT', 'BA', 'RL', 'PR', 'MIL']

export default function Produtos() {
  const [lista, setLista] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [filtro, setFiltro] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [editId, setEditId] = useState<number | null>(null)
  const buscaRef = useRef<HTMLInputElement>(null)

  useAtalho({
    'Insert': () => { if (!modal) abrirNovo() },
    'ctrl+s': () => { if (modal) salvar() },
    'ctrl+b': () => buscaRef.current?.focus(),
    'Escape': () => setModal(false),
  })

  const carregar = () => {
    window.api.produtos.listar(filtro || undefined).then(setLista)
    window.api.produtos.categorias().then(setCategorias)
  }
  useEffect(() => { carregar() }, [filtro])

  function abrirNovo() { setForm({ ...EMPTY, categoria_id: categorias[0]?.id || '' }); setEditId(null); setModal(true) }
  function abrirEditar(p: any) {
    setForm({ ...p, preco_custo: String(p.preco_custo), preco_venda: String(p.preco_venda), estoque_atual: String(p.estoque_atual), estoque_minimo: String(p.estoque_minimo) })
    setEditId(p.id); setModal(true)
  }

  async function salvar() {
    if (!form.nome.trim()) return alert('Nome é obrigatório')
    if (!form.preco_venda) return alert('Preço de venda é obrigatório')
    const data = { ...form, categoria_id: Number(form.categoria_id) || null, preco_custo: parseFloat(form.preco_custo) || 0, preco_venda: parseFloat(form.preco_venda) || 0, estoque_atual: parseFloat(form.estoque_atual) || 0, estoque_minimo: parseFloat(form.estoque_minimo) || 0 }
    if (editId) await window.api.produtos.atualizar(editId, data)
    else await window.api.produtos.criar(data)
    setModal(false); carregar()
  }

  async function excluir(id: number) {
    if (!confirm('Excluir este produto?')) return
    await window.api.produtos.excluir(id); carregar()
  }

  const fld = (k: string) => (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value }))
  const fmt = (v: number) => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Produtos ({lista.length})</h1>
        <button className="btn btn-primary" onClick={abrirNovo}><Plus size={16} /> Novo Produto</button>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Search size={16} className="text-slate-400" />
          <input ref={buscaRef} className="input max-w-xs" placeholder="Buscar por nome, categoria... (Ctrl+B)" value={filtro} onChange={e => setFiltro(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>Nome</th><th>Categoria</th><th>Un.</th><th>Custo</th><th>Venda</th><th>Estoque</th><th>Ações</th></tr></thead>
            <tbody>
              {lista.length === 0 && <tr><td colSpan={7} className="text-center text-slate-400 py-8">Nenhum produto encontrado</td></tr>}
              {lista.map(p => (
                <tr key={p.id}>
                  <td className="font-medium">{p.nome}</td>
                  <td><span className="badge badge-gray">{p.categoria_nome}</span></td>
                  <td>{p.unidade}</td>
                  <td>{fmt(p.preco_custo)}</td>
                  <td className="font-semibold text-green-700">{fmt(p.preco_venda)}</td>
                  <td>
                    <span className={`badge ${p.estoque_atual <= 0 ? 'badge-red' : p.estoque_atual <= p.estoque_minimo ? 'badge-yellow' : 'badge-green'}`}>
                      {p.estoque_atual <= p.estoque_minimo && <AlertTriangle size={10} className="inline mr-1" />}
                      {p.estoque_atual} {p.unidade}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(p)}><Edit2 size={12} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => excluir(p.id)}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} title={editId ? 'Editar Produto' : 'Novo Produto'} onClose={() => setModal(false)} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nome do Produto *</label>
            <input className="input" value={form.nome} onChange={fld('nome')} />
          </div>
          <div>
            <label className="label">Categoria</label>
            <select className="input" value={form.categoria_id} onChange={fld('categoria_id')}>
              <option value="">Selecionar...</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Unidade</label>
            <select className="input" value={form.unidade} onChange={fld('unidade')}>
              {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Preço de Custo (R$)</label>
            <input className="input" type="number" step="0.01" min="0" value={form.preco_custo} onChange={fld('preco_custo')} />
          </div>
          <div>
            <label className="label">Preço de Venda (R$) *</label>
            <input className="input" type="number" step="0.01" min="0" value={form.preco_venda} onChange={fld('preco_venda')} />
          </div>
          <div>
            <label className="label">Estoque Atual</label>
            <input className="input" type="number" step="0.01" min="0" value={form.estoque_atual} onChange={fld('estoque_atual')} />
          </div>
          <div>
            <label className="label">Estoque Mínimo</label>
            <input className="input" type="number" step="0.01" min="0" value={form.estoque_minimo} onChange={fld('estoque_minimo')} />
          </div>
          <div className="col-span-2">
            <label className="label">Código de Barras</label>
            <input className="input font-mono" value={form.codigo_barras} onChange={fld('codigo_barras')} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar}>Salvar</button>
        </div>
      </Modal>
    </div>
  )
}
