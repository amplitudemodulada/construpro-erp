import { ipcMain } from 'electron'
import { getDb } from '../db'

export function registerEstoqueIpc() {
  const db = () => getDb()

  ipcMain.handle('estoque:movimentacoes', (_, produtoId?: number) => {
    if (produtoId) {
      return db().prepare(`SELECT m.*, p.nome as produto_nome FROM movimentacoes m
        JOIN produtos p ON m.produto_id = p.id WHERE m.produto_id = ?
        ORDER BY m.criado_em DESC LIMIT 200`).all(produtoId)
    }
    return db().prepare(`SELECT m.*, p.nome as produto_nome FROM movimentacoes m
      JOIN produtos p ON m.produto_id = p.id
      ORDER BY m.criado_em DESC LIMIT 200`).all()
  })

  ipcMain.handle('estoque:ajustar', (_, data: { produto_id: number; tipo: string; quantidade: number; motivo: string }) => {
    const produto = db().prepare('SELECT * FROM produtos WHERE id = ?').get(data.produto_id) as any
    if (!produto) throw new Error('Produto não encontrado')

    const saldoAnterior = produto.estoque_atual
    let saldoAtual: number

    if (data.tipo === 'ENTRADA') {
      saldoAtual = saldoAnterior + data.quantidade
    } else if (data.tipo === 'SAIDA') {
      if (saldoAnterior < data.quantidade) throw new Error('Estoque insuficiente')
      saldoAtual = saldoAnterior - data.quantidade
    } else {
      saldoAtual = data.quantidade
    }

    db().transaction(() => {
      db().prepare('UPDATE produtos SET estoque_atual = ? WHERE id = ?').run(saldoAtual, data.produto_id)
      db().prepare(`INSERT INTO movimentacoes (produto_id, tipo, quantidade, saldo_anterior, saldo_atual, motivo, referencia_tipo)
        VALUES (?, ?, ?, ?, ?, ?, 'AJUSTE')`).run(data.produto_id, data.tipo, data.quantidade, saldoAnterior, saldoAtual, data.motivo)
    })()

    return { ok: true, saldoAtual }
  })
}
