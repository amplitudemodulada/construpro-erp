import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, UserCheck } from 'lucide-react'
import Modal from '../components/Modal'

const EMPTY = { nome: '', cargo: '', salario: '', cpf: '', rg: '', data_nascimento: '', telefone: '', email: '', endereco: '', data_admissao: '' }

export default function Funcionarios() {
  const [lista, setLista] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [editId, setEditId] = useState<number | null>(null)

  const carregar = () => window.api.funcionarios.listar().then(setLista)
  useEffect(() => { carregar() }, [])

  function abrirNovo() { setForm(EMPTY); setEditId(null); setModal(true) }
  function abrirEditar(f: any) { setForm({ ...f, salario: String(f.salario || '') }); setEditId(f.id); setModal(true) }

  async function salvar() {
    if (!form.nome.trim()) return alert('Nome é obrigatório')
    const data = { ...form, salario: parseFloat(form.salario) || 0 }
    if (editId) await window.api.funcionarios.atualizar(editId, data)
    else await window.api.funcionarios.criar(data)
    setModal(false); carregar()
  }

  async function excluir(id: number) {
    if (!confirm('Excluir este funcionário?')) return
    await window.api.funcionarios.excluir(id); carregar()
  }

  const fld = (k: string) => (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value }))
  const fmt = (v: number) => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Funcionários</h1>
        <button className="btn btn-primary" onClick={abrirNovo}><Plus size={16} /> Novo Funcionário</button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>Nome</th><th>Cargo</th><th>Salário</th><th>Telefone</th><th>Admissão</th><th>Ações</th></tr></thead>
            <tbody>
              {lista.length === 0 && <tr><td colSpan={6} className="text-center text-slate-400 py-8">Nenhum funcionário cadastrado</td></tr>}
              {lista.map(f => (
                <tr key={f.id}>
                  <td className="font-medium"><UserCheck size={14} className="inline mr-1 text-slate-400" />{f.nome}</td>
                  <td>{f.cargo || '-'}</td>
                  <td>{fmt(f.salario)}</td>
                  <td>{f.telefone || '-'}</td>
                  <td>{f.data_admissao ? new Date(f.data_admissao + 'T00:00').toLocaleDateString('pt-BR') : '-'}</td>
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

      <Modal open={modal} title={editId ? 'Editar Funcionário' : 'Novo Funcionário'} onClose={() => setModal(false)} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nome Completo *</label>
            <input className="input" value={form.nome} onChange={fld('nome')} />
          </div>
          <div>
            <label className="label">Cargo</label>
            <input className="input" value={form.cargo} onChange={fld('cargo')} />
          </div>
          <div>
            <label className="label">Salário (R$)</label>
            <input className="input" type="number" step="0.01" value={form.salario} onChange={fld('salario')} />
          </div>
          <div>
            <label className="label">CPF</label>
            <input className="input font-mono" value={form.cpf} onChange={fld('cpf')} />
          </div>
          <div>
            <label className="label">RG</label>
            <input className="input" value={form.rg} onChange={fld('rg')} />
          </div>
          <div>
            <label className="label">Data de Nascimento</label>
            <input className="input" type="date" value={form.data_nascimento} onChange={fld('data_nascimento')} />
          </div>
          <div>
            <label className="label">Data de Admissão</label>
            <input className="input" type="date" value={form.data_admissao} onChange={fld('data_admissao')} />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input" value={form.telefone} onChange={fld('telefone')} />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" value={form.email} onChange={fld('email')} />
          </div>
          <div className="col-span-2">
            <label className="label">Endereço</label>
            <input className="input" value={form.endereco} onChange={fld('endereco')} />
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
