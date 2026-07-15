import { ipcMain } from 'electron'
import { getDb, encrypt, decrypt } from '../db'

export function registerFinanceiroIpc() {
  const db = () => getDb()

  ipcMain.handle('financeiro:contasPagar', (_, filtros?: any) => {
    let sql = `SELECT cp.*, f.razao_social as fornecedor_nome FROM contas_pagar cp
      LEFT JOIN fornecedores f ON cp.fornecedor_id = f.id WHERE 1=1`
    const params: any[] = []
    if (filtros?.status) { sql += ' AND cp.status = ?'; params.push(filtros.status) }
    const rows = db().prepare(sql + ' ORDER BY cp.vencimento').all(...params) as any[]
    return rows.map(r => ({
      ...r,
      observacoes: r.observacoes?.startsWith('ENC:') ? decrypt(r.observacoes.substring(4)) : r.observacoes
    }))
  })

  ipcMain.handle('financeiro:criarContaPagar', (_, data: any) => {
    const encData = { ...data }
    if (encData.observacoes) encData.observacoes = 'ENC:' + encrypt(encData.observacoes)
    const res = db().prepare(`INSERT INTO contas_pagar
      (fornecedor_id, descricao, valor, vencimento, observacoes)
      VALUES (@fornecedor_id, @descricao, @valor, @vencimento, @observacoes)`).run(encData)
    const row = db().prepare('SELECT * FROM contas_pagar WHERE id = ?').get(res.lastInsertRowid) as any
    if (row.observacoes?.startsWith('ENC:')) row.observacoes = decrypt(row.observacoes.substring(4))
    return row
  })

  ipcMain.handle('financeiro:pagarConta', (_, id: number, data: { valor_pago: number; forma_pagamento: string }) => {
    db().transaction(() => {
      db().prepare(`UPDATE contas_pagar SET status = 'PAGA', pago_em = datetime('now','localtime'),
        valor_pago = ?, forma_pagamento = ? WHERE id = ?`)
        .run(data.valor_pago, data.forma_pagamento, id)
      const conta = db().prepare('SELECT * FROM contas_pagar WHERE id = ?').get(id) as any
      db().prepare(`INSERT INTO caixa (tipo, descricao, valor, categoria, referencia_tipo, referencia_id)
        VALUES ('DESPESA', ?, ?, 'Contas a Pagar', 'CONTA_PAGAR', ?)`)
        .run(conta.descricao, data.valor_pago, id)
    })()
    return { ok: true }
  })

  ipcMain.handle('financeiro:contasReceber', (_, filtros?: any) => {
    let sql = `SELECT cr.*, c.nome as cliente_nome FROM contas_receber cr
      LEFT JOIN clientes c ON cr.cliente_id = c.id WHERE 1=1`
    const params: any[] = []
    if (filtros?.status) { sql += ' AND cr.status = ?'; params.push(filtros.status) }
    const rows = db().prepare(sql + ' ORDER BY cr.vencimento').all(...params) as any[]
    return rows.map(r => ({
      ...r,
      observacoes: r.observacoes?.startsWith('ENC:') ? decrypt(r.observacoes.substring(4)) : r.observacoes
    }))
  })

  ipcMain.handle('financeiro:criarContaReceber', (_, data: any) => {
    const encData = { ...data }
    if (encData.observacoes) encData.observacoes = 'ENC:' + encrypt(encData.observacoes)
    const res = db().prepare(`INSERT INTO contas_receber
      (cliente_id, venda_id, descricao, valor, vencimento, observacoes)
      VALUES (@cliente_id, @venda_id, @descricao, @valor, @vencimento, @observacoes)`).run(encData)
    const row = db().prepare('SELECT * FROM contas_receber WHERE id = ?').get(res.lastInsertRowid) as any
    if (row.observacoes?.startsWith('ENC:')) row.observacoes = decrypt(row.observacoes.substring(4))
    return row
  })

  ipcMain.handle('financeiro:receberConta', (_, id: number, data: { valor_recebido: number; forma_pagamento: string }) => {
    db().transaction(() => {
      db().prepare(`UPDATE contas_receber SET status = 'RECEBIDA', recebido_em = datetime('now','localtime'),
        valor_recebido = ?, forma_pagamento = ? WHERE id = ?`)
        .run(data.valor_recebido, data.forma_pagamento, id)
      const conta = db().prepare('SELECT * FROM contas_receber WHERE id = ?').get(id) as any
      db().prepare(`INSERT INTO caixa (tipo, descricao, valor, categoria, referencia_tipo, referencia_id)
        VALUES ('RECEITA', ?, ?, 'Contas a Receber', 'CONTA_RECEBER', ?)`)
        .run(conta.descricao, data.valor_recebido, id)
    })()
    return { ok: true }
  })

  ipcMain.handle('financeiro:caixa', (_, periodo: { inicio: string; fim: string }) => {
    return db().prepare(`SELECT * FROM caixa WHERE data >= ? AND data <= ? ORDER BY criado_em DESC`)
      .all(periodo.inicio, periodo.fim)
  })

  ipcMain.handle('financeiro:resumo', (_, periodo: { inicio: string; fim: string }) => {
    const receitas = (db().prepare(`SELECT COALESCE(SUM(valor), 0) as total FROM caixa
      WHERE tipo = 'RECEITA' AND data >= ? AND data <= ?`).get(periodo.inicio, periodo.fim) as any).total
    const despesas = (db().prepare(`SELECT COALESCE(SUM(valor), 0) as total FROM caixa
      WHERE tipo = 'DESPESA' AND data >= ? AND data <= ?`).get(periodo.inicio, periodo.fim) as any).total
    const vendasMes = (db().prepare(`SELECT COUNT(*) as total FROM vendas
      WHERE status = 'CONFIRMADA' AND DATE(criado_em) >= ? AND DATE(criado_em) <= ?`)
      .get(periodo.inicio, periodo.fim) as any).total
    const aVencer = (db().prepare(`SELECT COALESCE(SUM(valor), 0) as total FROM contas_pagar
      WHERE status = 'ABERTA' AND vencimento <= date('now','localtime','+7 days')`).get() as any).total
    const aReceber = (db().prepare(`SELECT COALESCE(SUM(valor), 0) as total FROM contas_receber
      WHERE status = 'ABERTA'`).get() as any).total

    return { receitas, despesas, saldo: receitas - despesas, vendasMes, aVencer, aReceber }
  })

  ipcMain.handle('financeiro:adicionarCaixa', (_, data: { tipo: string; descricao: string; valor: number; categoria: string }) => {
    db().prepare(`INSERT INTO caixa (tipo, descricao, valor, categoria)
      VALUES (@tipo, @descricao, @valor, @categoria)`).run(data)
    return { ok: true }
  })
}
