import { useEffect, useRef, useState } from 'react'
import { Plus, Search, Edit2, Trash2, User, ShoppingBag } from 'lucide-react'
import Modal from '../components/Modal'
import { useAtalho } from '../hooks/useAtalho'

const EMPTY = { nome: '', tipo: 'PF', cpf_cnpj: '', rg_ie: '', endereco: '', numero: '', bairro: '', cidade: '', estado: 'RJ', cep: '', telefone: '', celular: '', email: '', observacoes: '' }

export default function Clientes() {
  const [lista, setLista] = useState<any[]>([])
  const [filtro, setFiltro] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [editId, setEditId] = useState<number | null>(null)
  const [historico, setHistorico] = useState<any>(null)
  const buscaRef = useRef<HTMLInputElement>(null)

  useAtalho({
    'Insert': () => { if (!modal && !historico) abrirNovo() },
    'ctrl+s': () => { if (modal) salvar() },
    'ctrl+b': () => buscaRef.current?.focus(),
    'Escape': () => { setModal(false); setHistorico(null) },
  })

  const carregar = () => window.api.clientes.listar(filtro || undefined).then(setLista)
  useEffect(() => { carregar() }, [filtro])

  function abrirNovo() { setForm(EMPTY); setEditId(null); setModal(true) }
  function abrirEditar(c: any) { setForm({ ...c }); setEditId(c.id); setModal(true) }

  async function salvar() {
    if (!form.nome.trim()) return alert('Nome é obrigatório')
    if (editId) await window.api.clientes.atualizar(editId, form)
    else await window.api.clientes.criar(form)
    setModal(false); carregar()
  }

  async function excluir(id: number) {
    if (!confirm('Excluir este cliente?')) return
    await window.api.clientes.excluir(id); carregar()
  }

  async function verHistorico(c: any) {
    const h = await window.api.clientes.historico(c.id)
    setHistorico({ cliente: c, ...h })
  }

  const f = (k: string) => (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Clientes</h1>
        <button className="btn btn-primary" onClick={abrirNovo}><Plus size={16} /> Novo Cliente</button>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Search size={16} className="text-slate-400" />
          <input ref={buscaRef} className="input max-w-xs" placeholder="Buscar por nome, CPF/CNPJ... (Ctrl+B)" value={filtro} onChange={e => setFiltro(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>Nome</th><th>Tipo</th><th>CPF/CNPJ</th><th>Telefone</th><th>Cidade</th><th>Ações</th></tr></thead>
            <tbody>
              {lista.length === 0 && <tr><td colSpan={6} className="text-center text-slate-400 py-8">Nenhum cliente cadastrado</td></tr>}
              {lista.map(c => (
                <tr key={c.id}>
                  <td className="font-medium"><User size={14} className="inline mr-1 text-slate-400" />{c.nome}</td>
                  <td><span className={`badge ${c.tipo === 'PJ' ? 'badge-blue' : 'badge-gray'}`}>{c.tipo}</span></td>
                  <td className="font-mono text-xs">{c.cpf_cnpj || '-'}</td>
                  <td>{c.telefone || c.celular || '-'}</td>
                  <td>{c.cidade || '-'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-secondary btn-sm" onClick={() => verHistorico(c)} title="Histórico"><ShoppingBag size={12} /></button>
                      <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(c)}><Edit2 size={12} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => excluir(c.id)}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!historico} title={`Histórico — ${historico?.cliente?.nome || ''}`} onClose={() => setHistorico(null)} size="lg">
        {historico && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                <div className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-1">Total de Compras</div>
                <div className="text-2xl font-bold text-orange-700">{historico.total_compras}</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <div className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Total Gasto</div>
                <div className="text-2xl font-bold text-green-700">{historico.total_gasto?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>Nº</th><th>Data</th><th>Itens</th><th>Total</th><th>Pagamento</th></tr></thead>
                <tbody>
                  {historico.vendas?.length === 0 && <tr><td colSpan={5} className="text-center text-slate-400 py-6">Nenhuma compra registrada</td></tr>}
                  {historico.vendas?.map((v: any) => (
                    <tr key={v.id}>
                      <td className="font-mono font-bold">#{String(v.numero).padStart(4, '0')}</td>
                      <td className="text-xs">{new Date(v.criado_em).toLocaleDateString('pt-BR')}</td>
                      <td>{v.qtd_itens} item(s)</td>
                      <td className="font-bold text-green-700">{v.total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td>{v.forma_pagamento}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={modal} title={editId ? 'Editar Cliente' : 'Novo Cliente'} onClose={() => setModal(false)} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nome / Razão Social *</label>
            <input className="input" value={form.nome} onChange={f('nome')} />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={form.tipo} onChange={f('tipo')}>
              <option value="PF">Pessoa Física</option>
              <option value="PJ">Pessoa Jurídica</option>
            </select>
          </div>
          <div>
            <label className="label">{form.tipo === 'PJ' ? 'CNPJ' : 'CPF'}</label>
            <input className="input font-mono" value={form.cpf_cnpj} onChange={f('cpf_cnpj')} />
          </div>
          <div>
            <label className="label">{form.tipo === 'PJ' ? 'IE' : 'RG'}</label>
            <input className="input" value={form.rg_ie} onChange={f('rg_ie')} />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input" value={form.telefone} onChange={f('telefone')} />
          </div>
          <div>
            <label className="label">Celular</label>
            <input className="input" value={form.celular} onChange={f('celular')} />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" value={form.email} onChange={f('email')} />
          </div>
          <div className="col-span-2">
            <label className="label">Endereço</label>
            <input className="input" value={form.endereco} onChange={f('endereco')} />
          </div>
          <div>
            <label className="label">Número</label>
            <input className="input" value={form.numero} onChange={f('numero')} />
          </div>
          <div>
            <label className="label">Bairro</label>
            <input className="input" value={form.bairro} onChange={f('bairro')} />
          </div>
          <div>
            <label className="label">Cidade</label>
            <input className="input" value={form.cidade} onChange={f('cidade')} />
          </div>
          <div>
            <label className="label">Estado</label>
            <input className="input" value={form.estado} onChange={f('estado')} maxLength={2} />
          </div>
          <div className="col-span-2">
            <label className="label">Observações</label>
            <textarea className="input" rows={2} value={form.observacoes} onChange={f('observacoes')} />
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
