import { ipcMain } from 'electron'
import { getDb } from '../db'

export function registerProdutosIpc() {
  const db = () => getDb()

  ipcMain.handle('produtos:listar', (_, filtro?: string) => {
    const base = `SELECT p.*, c.nome as categoria_nome FROM produtos p
      LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.ativo = 1`
    if (filtro) {
      return db().prepare(`${base} AND (p.nome LIKE ? OR c.nome LIKE ? OR p.codigo_barras LIKE ?)
        ORDER BY p.nome`).all(`%${filtro}%`, `%${filtro}%`, `%${filtro}%`)
    }
    return db().prepare(`${base} ORDER BY p.nome`).all()
  })

  ipcMain.handle('produtos:buscarPorId', (_, id: number) =>
    db().prepare(`SELECT p.*, c.nome as categoria_nome FROM produtos p
      LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.id = ?`).get(id)
  )

  ipcMain.handle('produtos:estoqueMinimo', () =>
    db().prepare(`SELECT p.*, c.nome as categoria_nome FROM produtos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.ativo = 1 AND p.estoque_atual <= p.estoque_minimo
      ORDER BY (p.estoque_minimo - p.estoque_atual) DESC`).all()
  )

  ipcMain.handle('produtos:categorias', () =>
    db().prepare('SELECT * FROM categorias ORDER BY nome').all()
  )

  ipcMain.handle('produtos:criar', (_, data: any) => {
    const stmt = db().prepare(`INSERT INTO produtos
      (nome, categoria_id, unidade, preco_custo, preco_venda, estoque_atual, estoque_minimo, codigo_barras)
      VALUES (@nome, @categoria_id, @unidade, @preco_custo, @preco_venda, @estoque_atual, @estoque_minimo, @codigo_barras)`)
    const result = stmt.run(data)
    return db().prepare('SELECT * FROM produtos WHERE id = ?').get(result.lastInsertRowid)
  })

  ipcMain.handle('produtos:atualizar', (_, id: number, data: any) => {
    db().prepare(`UPDATE produtos SET nome=@nome, categoria_id=@categoria_id, unidade=@unidade,
      preco_custo=@preco_custo, preco_venda=@preco_venda, estoque_minimo=@estoque_minimo,
      codigo_barras=@codigo_barras WHERE id=@id`).run({ ...data, id })
    return db().prepare('SELECT * FROM produtos WHERE id = ?').get(id)
  })

  ipcMain.handle('produtos:buscarPorBarras', (_, codigo: string) =>
    db().prepare(`SELECT p.*, c.nome as categoria_nome FROM produtos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.ativo = 1 AND p.codigo_barras = ?`).get(codigo) || null
  )

  ipcMain.handle('produtos:excluir', (_, id: number) => {
    db().prepare('UPDATE produtos SET ativo = 0 WHERE id = ?').run(id)
    return { ok: true }
  })
}
