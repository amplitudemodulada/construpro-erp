import { ipcMain } from 'electron'
import { getDb, encrypt, decrypt } from '../db'

export function registerVendasIpc() {
  const db = () => getDb()

  ipcMain.handle('vendas:listar', (_, filtros?: { status?: string; dataInicio?: string; dataFim?: string }) => {
    let sql = `SELECT v.*, c.nome as cliente_nome FROM vendas v
      LEFT JOIN clientes c ON v.cliente_id = c.id WHERE 1=1`
    const params: any[] = []

    if (filtros?.status) { sql += ' AND v.status = ?'; params.push(filtros.status) }
    if (filtros?.dataInicio) { sql += ' AND DATE(v.criado_em) >= ?'; params.push(filtros.dataInicio) }
    if (filtros?.dataFim) { sql += ' AND DATE(v.criado_em) <= ?'; params.push(filtros.dataFim) }

    sql += ' ORDER BY v.criado_em DESC LIMIT 500'
    const rows = db().prepare(sql).all(...params) as any[]
    return rows.map(r => ({
      ...r,
      observacoes: r.observacoes?.startsWith('ENC:') ? decrypt(r.observacoes.substring(4)) : r.observacoes
    }))
  })

  ipcMain.handle('vendas:buscarPorId', (_, id: number) => {
    const venda = db().prepare(`SELECT v.*, c.nome as cliente_nome FROM vendas v
      LEFT JOIN clientes c ON v.cliente_id = c.id WHERE v.id = ?`).get(id) as any
    if (!venda) return null
    if (venda.observacoes?.startsWith('ENC:')) {
      venda.observacoes = decrypt(venda.observacoes.substring(4))
    }
    venda.itens = db().prepare(`SELECT vi.*, p.nome as produto_nome, p.unidade FROM venda_itens vi
      JOIN produtos p ON vi.produto_id = p.id WHERE vi.venda_id = ?`).all(id)
    return venda
  })

  ipcMain.handle('vendas:criar', (_, data: { venda: any; itens: any[] }) => {
    const d = getDb()
    let vendaId: number

    d.transaction(() => {
      const seq = d.prepare("UPDATE sequencias SET valor = valor + 1 WHERE nome = 'vendas'")
      seq.run()
      const numero = (d.prepare("SELECT valor FROM sequencias WHERE nome = 'vendas'").get() as any).valor

      const vendaData = { ...data.venda }
      if (vendaData.observacoes) {
        vendaData.observacoes = 'ENC:' + encrypt(vendaData.observacoes)
      }

      const res = d.prepare(`INSERT INTO vendas (numero, tipo, status, cliente_id, funcionario_id,
        subtotal, desconto, total, forma_pagamento, parcelas, observacoes)
        VALUES (@numero, @tipo, @status, @cliente_id, @funcionario_id,
        @subtotal, @desconto, @total, @forma_pagamento, @parcelas, @observacoes)`)
        .run({ numero, ...vendaData })
      vendaId = Number(res.lastInsertRowid)

      for (const item of data.itens) {
        d.prepare(`INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, desconto, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)`).run(vendaId, item.produto_id, item.quantidade, item.preco_unitario, item.desconto || 0, item.subtotal)

        const prod = d.prepare('SELECT estoque_atual FROM produtos WHERE id = ?').get(item.produto_id) as any
        const novoEstoque = (prod?.estoque_atual || 0) - item.quantidade
        d.prepare('UPDATE produtos SET estoque_atual = ? WHERE id = ?').run(novoEstoque, item.produto_id)
        d.prepare(`INSERT INTO movimentacoes (produto_id, tipo, quantidade, saldo_anterior, saldo_atual, motivo, referencia_tipo, referencia_id)
          VALUES (?, 'SAIDA', ?, ?, ?, 'Venda', 'VENDA', ?)`).run(item.produto_id, item.quantidade, prod?.estoque_atual || 0, novoEstoque, vendaId)
      }

      if (data.venda.status === 'CONFIRMADA') {
        d.prepare(`INSERT INTO caixa (tipo, descricao, valor, categoria, referencia_tipo, referencia_id)
          VALUES ('RECEITA', 'Venda #' || ?, ?, 'Vendas', 'VENDA', ?)`).run(numero, data.venda.total, vendaId)
      }
    })()

    const result = d.prepare(`SELECT v.*, c.nome as cliente_nome FROM vendas v
      LEFT JOIN clientes c ON v.cliente_id = c.id WHERE v.id = ?`).get(vendaId!) as any
    if (result?.observacoes?.startsWith('ENC:')) {
      result.observacoes = decrypt(result.observacoes.substring(4))
    }
    return result
  })

  ipcMain.handle('vendas:cancelar', (_, id: number) => {
    const d = getDb()
    d.transaction(() => {
      const itens = d.prepare('SELECT * FROM venda_itens WHERE venda_id = ?').all(id) as any[]
      for (const item of itens) {
        const prod = d.prepare('SELECT estoque_atual FROM produtos WHERE id = ?').get(item.produto_id) as any
        const novoEstoque = (prod?.estoque_atual || 0) + item.quantidade
        d.prepare('UPDATE produtos SET estoque_atual = ? WHERE id = ?').run(novoEstoque, item.produto_id)
        d.prepare(`INSERT INTO movimentacoes (produto_id, tipo, quantidade, saldo_anterior, saldo_atual, motivo, referencia_tipo, referencia_id)
          VALUES (?, 'ENTRADA', ?, ?, ?, 'Cancelamento de venda', 'VENDA', ?)`).run(item.produto_id, item.quantidade, prod?.estoque_atual || 0, novoEstoque, id)
      }
      d.prepare("UPDATE vendas SET status = 'CANCELADA' WHERE id = ?").run(id)
    })()
    return { ok: true }
  })
}
