import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'

const EMPTY = { razao_social: '', nome_fantasia: '', cnpj: '', ie: '', endereco: '', numero: '', bairro: '', cidade: '', estado: 'RJ', cep: '', telefone: '', email: '', contato: '', observacoes: '' }

export default function Fornecedores() {
  const [lista, setLista] = useState<any[]>([])
  const [filtro, setFiltro] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [editId, setEditId] = useState<number | null>(null)

  const carregar = () => window.api.fornecedores.listar(filtro || undefined).then(setLista)
  useEffect(() => { carregar() }, [filtro])

  function abrirNovo() { setForm(EMPTY); setEditId(null); setModal(true) }
  function abrirEditar(f: any) { setForm({ ...f }); setEditId(f.id); setModal(true) }

  async function salvar() {
    if (!form.razao_social.trim()) return alert('Razão Social é obrigatória')
    if (editId) await window.api.fornecedores.atualizar(editId, form)
    else await window.api.fornecedores.criar(form)
    setModal(false); carregar()
  }

  async function excluir(id: number) {
    if (!confirm('Excluir este fornecedor?')) return
    await window.api.fornecedores.excluir(id); carregar()
  }

  const fld = (k: string) => (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Fornecedores</h1>
        <button className="btn btn-primary" onClick={abrirNovo}><Plus size={16} /> Novo Fornecedor</button>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Search size={16} className="text-slate-400" />
          <input className="input max-w-xs" placeholder="Buscar por razão social, CNPJ..." value={filtro} onChange={e => setFiltro(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>Razão Social</th><th>Nome Fantasia</th><th>CNPJ</th><th>Telefone</th><th>Contato</th><th>Ações</th></tr></thead>
            <tbody>
              {lista.length === 0 && <tr><td colSpan={6} className="text-center text-slate-400 py-8">Nenhum fornecedor cadastrado</td></tr>}
              {lista.map(f => (
                <tr key={f.id}>
                  <td className="font-medium">{f.razao_social}</td>
                  <td>{f.nome_fantasia || '-'}</td>
                  <td className="font-mono text-xs">{f.cnpj || '-'}</td>
                  <td>{f.telefone || '-'}</td>
                  <td>{f.contato || '-'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(f)}><Edit2 size={12} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => excluir(f.id)}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} title={editId ? 'Editar Fornecedor' : 'Novo Fornecedor'} onClose={() => setModal(false)} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Razão Social *</label>
            <input className="input" value={form.razao_social} onChange={fld('razao_social')} />
          </div>
          <div>
            <label className="label">Nome Fantasia</label>
            <input className="input" value={form.nome_fantasia} onChange={fld('nome_fantasia')} />
          </div>
          <div>
            <label className="label">CNPJ</label>
            <input className="input font-mono" value={form.cnpj} onChange={fld('cnpj')} />
          </div>
          <div>
            <label className="label">Inscrição Estadual</label>
            <input className="input" value={form.ie} onChange={fld('ie')} />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input" value={form.telefone} onChange={fld('telefone')} />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" value={form.email} onChange={fld('email')} />
          </div>
          <div>
            <label className="label">Contato</label>
            <input className="input" value={form.contato} onChange={fld('contato')} />
          </div>
          <div className="col-span-2">
            <label className="label">Endereço</label>
            <input className="input" value={form.endereco} onChange={fld('endereco')} />
          </div>
          <div>
            <label className="label">Cidade</label>
            <input className="input" value={form.cidade} onChange={fld('cidade')} />
          </div>
          <div>
            <label className="label">Estado</label>
            <input className="input" value={form.estado} onChange={fld('estado')} maxLength={2} />
          </div>
          <div className="col-span-2">
            <label className="label">Observações</label>
            <textarea className="input" rows={2} value={form.observacoes} onChange={fld('observacoes')} />
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
