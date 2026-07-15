import { useEffect, useState } from 'react'
import { Plus, Check, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import Modal from '../components/Modal'

const FORMAS = ['DINHEIRO', 'CARTÃO DÉBITO', 'CARTÃO CRÉDITO', 'PIX', 'TRANSFERÊNCIA', 'BOLETO']

export default function Financeiro() {
  const hoje = new Date().toISOString().split('T')[0]
  const inicioMes = hoje.slice(0, 8) + '01'

  const [aba, setAba] = useState<'resumo' | 'pagar' | 'receber' | 'caixa'>('resumo')
  const [resumo, setResumo] = useState<any>(null)
  const [contasPagar, setContasPagar] = useState<any[]>([])
  const [contasReceber, setContasReceber] = useState<any[]>([])
  const [caixa, setCaixa] = useState<any[]>([])
  const [filtroStatus, setFiltroStatus] = useState('ABERTA')
  const [periodo, setPeriodo] = useState({ inicio: inicioMes, fim: hoje })

  const [modalPagar, setModalPagar] = useState(false)
  const [modalReceber, setModalReceber] = useState(false)
  const [modalPagarId, setModalPagarId] = useState<number | null>(null)
  const [modalReceberIdx, setModalReceberIdx] = useState<number | null>(null)
  const [formPagar, setFormPagar] = useState({ fornecedor_id: '', descricao: '', valor: '', vencimento: hoje, observacoes: '' })
  const [formReceber, setFormReceber] = useState({ cliente_id: '', descricao: '', valor: '', vencimento: hoje, observacoes: '' })
  const [formBaixa, setFormBaixa] = useState({ valor: '', forma_pagamento: 'DINHEIRO' })
  const [modalBaixaPagar, setModalBaixaPagar] = useState<any>(null)
  const [modalBaixaReceber, setModalBaixaReceber] = useState<any>(null)
  const [clientes, setClientes] = useState<any[]>([])
  const [fornecedores, setFornecedores] = useState<any[]>([])

  const carregar = async () => {
    window.api.financeiro.resumo(periodo).then(setResumo)
    window.api.financeiro.contasPagar({ status: filtroStatus }).then(setContasPagar)
    window.api.financeiro.contasReceber({ status: filtroStatus }).then(setContasReceber)
    window.api.financeiro.caixa(periodo).then(setCaixa)
  }

  useEffect(() => { carregar() }, [filtroStatus, periodo.inicio, periodo.fim])
  useEffect(() => {
    window.api.clientes.listar().then(setClientes)
    window.api.fornecedores.listar().then(setFornecedores)
  }, [])

  const fmt = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  async function criarContaPagar() {
    if (!formPagar.descricao || !formPagar.valor) return alert('Preencha descrição e valor')
    await window.api.financeiro.criarContaPagar({ ...formPagar, valor: parseFloat(formPagar.valor), fornecedor_id: Number(formPagar.fornecedor_id) || null })
    setModalPagar(false); carregar()
  }

  async function criarContaReceber() {
    if (!formReceber.descricao || !formReceber.valor) return alert('Preencha descrição e valor')
    await window.api.financeiro.criarContaReceber({ ...formReceber, valor: parseFloat(formReceber.valor), cliente_id: Number(formReceber.cliente_id) || null })
    setModalReceber(false); carregar()
  }

  async function baixarPagar() {
    if (!formBaixa.valor) return alert('Informe o valor pago')
    await window.api.financeiro.pagarConta(modalBaixaPagar.id, { valor_pago: parseFloat(formBaixa.valor), forma_pagamento: formBaixa.forma_pagamento })
    setModalBaixaPagar(null); setFormBaixa({ valor: '', forma_pagamento: 'DINHEIRO' }); carregar()
  }

  async function baixarReceber() {
    if (!formBaixa.valor) return alert('Informe o valor recebido')
    await window.api.financeiro.receberConta(modalBaixaReceber.id, { valor_recebido: parseFloat(formBaixa.valor), forma_pagamento: formBaixa.forma_pagamento })
    setModalBaixaReceber(null); setFormBaixa({ valor: '', forma_pagamento: 'DINHEIRO' }); carregar()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Financeiro</h1>
        <div className="flex gap-2">
          <input className="input w-36" type="date" value={periodo.inicio} onChange={e => setPeriodo(p => ({ ...p, inicio: e.target.value }))} />
          <span className="self-center text-slate-400">até</span>
          <input className="input w-36" type="date" value={periodo.fim} onChange={e => setPeriodo(p => ({ ...p, fim: e.target.value }))} />
        </div>
      </div>

      {/* Resumo cards */}
      {resumo && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><TrendingUp className="text-green-600" size={20} /></div>
            <div><div className="text-xs text-slate-500">Receitas</div><div className="font-bold text-green-700">{fmt(resumo.receitas)}</div></div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><TrendingDown className="text-red-600" size={20} /></div>
            <div><div className="text-xs text-slate-500">Despesas</div><div className="font-bold text-red-700">{fmt(resumo.despesas)}</div></div>
          </div>
          <div className="card flex items-center gap-3">
            <div className={`w-10 h-10 ${resumo.saldo >= 0 ? 'bg-blue-100' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
              <DollarSign className={resumo.saldo >= 0 ? 'text-blue-600' : 'text-red-600'} size={20} />
            </div>
            <div><div className="text-xs text-slate-500">Saldo</div><div className={`font-bold ${resumo.saldo >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{fmt(resumo.saldo)}</div></div>
          </div>
        </div>
      )}

      {/* Abas */}
      <div className="flex gap-2">
        {(['resumo', 'pagar', 'receber', 'caixa'] as const).map(a => (
          <button key={a} className={`btn ${aba === a ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAba(a)}>
            {a === 'resumo' ? 'Caixa' : a === 'pagar' ? 'Contas a Pagar' : a === 'receber' ? 'Contas a Receber' : 'Extrato'}
          </button>
        ))}
      </div>

      {/* Filtro status */}
      {aba !== 'resumo' && aba !== 'caixa' && (
        <div className="flex gap-2 items-center">
          {['ABERTA', 'PAGA', 'RECEBIDA', ''].map(s => (
            <button key={s} className={`btn btn-sm ${filtroStatus === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFiltroStatus(s)}>
              {s || 'Todas'}
            </button>
          ))}
          <div className="ml-auto">
            {aba === 'pagar' && <button className="btn btn-primary btn-sm" onClick={() => setModalPagar(true)}><Plus size={14} /> Nova Conta a Pagar</button>}
            {aba === 'receber' && <button className="btn btn-primary btn-sm" onClick={() => setModalReceber(true)}><Plus size={14} /> Nova Conta a Receber</button>}
          </div>
        </div>
      )}

      {/* Contas a Pagar */}
      {aba === 'pagar' && (
        <div className="card">
          <table>
            <thead><tr><th>Fornecedor</th><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {contasPagar.length === 0 && <tr><td colSpan={6} className="text-center text-slate-400 py-8">Nenhuma conta encontrada</td></tr>}
              {contasPagar.map(c => (
                <tr key={c.id}>
                  <td>{c.fornecedor_nome || '-'}</td>
                  <td>{c.descricao}</td>
                  <td className="font-bold text-red-700">{fmt(c.valor)}</td>
                  <td className={new Date(c.vencimento) < new Date() && c.status === 'ABERTA' ? 'text-red-600 font-bold' : ''}>
                    {new Date(c.vencimento + 'T00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td><span className={`badge ${c.status === 'PAGA' ? 'badge-green' : c.status === 'ABERTA' ? 'badge-yellow' : 'badge-gray'}`}>{c.status}</span></td>
                  <td>
                    {c.status === 'ABERTA' && (
                      <button className="btn btn-success btn-sm" onClick={() => { setModalBaixaPagar(c); setFormBaixa({ valor: String(c.valor), forma_pagamento: 'DINHEIRO' }) }}>
                        <Check size={12} /> Pagar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Contas a Receber */}
      {aba === 'receber' && (
        <div className="card">
          <table>
            <thead><tr><th>Cliente</th><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {contasReceber.length === 0 && <tr><td colSpan={6} className="text-center text-slate-400 py-8">Nenhuma conta encontrada</td></tr>}
              {contasReceber.map(c => (
                <tr key={c.id}>
                  <td>{c.cliente_nome || '-'}</td>
                  <td>{c.descricao}</td>
                  <td className="font-bold text-green-700">{fmt(c.valor)}</td>
                  <td>{new Date(c.vencimento + 'T00:00').toLocaleDateString('pt-BR')}</td>
                  <td><span className={`badge ${c.status === 'RECEBIDA' ? 'badge-green' : 'badge-yellow'}`}>{c.status}</span></td>
                  <td>
                    {c.status === 'ABERTA' && (
                      <button className="btn btn-success btn-sm" onClick={() => { setModalBaixaReceber(c); setFormBaixa({ valor: String(c.valor), forma_pagamento: 'DINHEIRO' }) }}>
                        <Check size={12} /> Receber
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Extrato Caixa */}
      {aba === 'caixa' && (
        <div className="card">
          <table>
            <thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead>
            <tbody>
              {caixa.length === 0 && <tr><td colSpan={5} className="text-center text-slate-400 py-8">Nenhuma movimentação no período</td></tr>}
              {caixa.map(c => (
                <tr key={c.id}>
                  <td className="text-xs">{new Date(c.criado_em).toLocaleString('pt-BR')}</td>
                  <td><span className={`badge ${c.tipo === 'RECEITA' ? 'badge-green' : 'badge-red'}`}>{c.tipo}</span></td>
                  <td>{c.descricao}</td>
                  <td>{c.categoria}</td>
                  <td className={`font-bold ${c.tipo === 'RECEITA' ? 'text-green-700' : 'text-red-700'}`}>
                    {c.tipo === 'RECEITA' ? '+' : '-'}{fmt(c.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Nova Conta Pagar */}
      <Modal open={modalPagar} title="Nova Conta a Pagar" onClose={() => setModalPagar(false)}>
        <div className="space-y-3">
          <div>
            <label className="label">Fornecedor</label>
            <select className="input" value={formPagar.fornecedor_id} onChange={e => setFormPagar(p => ({ ...p, fornecedor_id: e.target.value }))}>
              <option value="">Selecionar...</option>
              {fornecedores.map(f => <option key={f.id} value={f.id}>{f.razao_social}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Descrição *</label>
            <input className="input" value={formPagar.descricao} onChange={e => setFormPagar(p => ({ ...p, descricao: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor (R$) *</label>
              <input className="input" type="number" step="0.01" value={formPagar.valor} onChange={e => setFormPagar(p => ({ ...p, valor: e.target.value }))} />
            </div>
            <div>
              <label className="label">Vencimento *</label>
              <input className="input" type="date" value={formPagar.vencimento} onChange={e => setFormPagar(p => ({ ...p, vencimento: e.target.value }))} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn btn-secondary" onClick={() => setModalPagar(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={criarContaPagar}>Salvar</button>
        </div>
      </Modal>

      {/* Modal Nova Conta Receber */}
      <Modal open={modalReceber} title="Nova Conta a Receber" onClose={() => setModalReceber(false)}>
        <div className="space-y-3">
          <div>
            <label className="label">Cliente</label>
            <select className="input" value={formReceber.cliente_id} onChange={e => setFormReceber(p => ({ ...p, cliente_id: e.target.value }))}>
              <option value="">Selecionar...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Descrição *</label>
            <input className="input" value={formReceber.descricao} onChange={e => setFormReceber(p => ({ ...p, descricao: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor (R$) *</label>
              <input className="input" type="number" step="0.01" value={formReceber.valor} onChange={e => setFormReceber(p => ({ ...p, valor: e.target.value }))} />
            </div>
            <div>
              <label className="label">Vencimento *</label>
              <input className="input" type="date" value={formReceber.vencimento} onChange={e => setFormReceber(p => ({ ...p, vencimento: e.target.value }))} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn btn-secondary" onClick={() => setModalReceber(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={criarContaReceber}>Salvar</button>
        </div>
      </Modal>

      {/* Modal Baixa Pagar */}
      <Modal open={!!modalBaixaPagar} title="Registrar Pagamento" onClose={() => setModalBaixaPagar(null)}>
        {modalBaixaPagar && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg text-sm">
              <div className="font-semibold">{modalBaixaPagar.descricao}</div>
              <div className="text-slate-500">Valor original: {fmt(modalBaixaPagar.valor)}</div>
            </div>
            <div>
              <label className="label">Valor Pago (R$)</label>
              <input className="input" type="number" step="0.01" value={formBaixa.valor} onChange={e => setFormBaixa(p => ({ ...p, valor: e.target.value }))} />
            </div>
            <div>
              <label className="label">Forma de Pagamento</label>
              <select className="input" value={formBaixa.forma_pagamento} onChange={e => setFormBaixa(p => ({ ...p, forma_pagamento: e.target.value }))}>
                {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn btn-secondary" onClick={() => setModalBaixaPagar(null)}>Cancelar</button>
          <button className="btn btn-success" onClick={baixarPagar}>Confirmar Pagamento</button>
        </div>
      </Modal>

      {/* Modal Baixa Receber */}
      <Modal open={!!modalBaixaReceber} title="Registrar Recebimento" onClose={() => setModalBaixaReceber(null)}>
        {modalBaixaReceber && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg text-sm">
              <div className="font-semibold">{modalBaixaReceber.descricao}</div>
              <div className="text-slate-500">Valor original: {fmt(modalBaixaReceber.valor)}</div>
            </div>
            <div>
              <label className="label">Valor Recebido (R$)</label>
              <input className="input" type="number" step="0.01" value={formBaixa.valor} onChange={e => setFormBaixa(p => ({ ...p, valor: e.target.value }))} />
            </div>
            <div>
              <label className="label">Forma de Pagamento</label>
              <select className="input" value={formBaixa.forma_pagamento} onChange={e => setFormBaixa(p => ({ ...p, forma_pagamento: e.target.value }))}>
                {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn btn-secondary" onClick={() => setModalBaixaReceber(null)}>Cancelar</button>
          <button className="btn btn-success" onClick={baixarReceber}>Confirmar Recebimento</button>
        </div>
      </Modal>
    </div>
  )
}
