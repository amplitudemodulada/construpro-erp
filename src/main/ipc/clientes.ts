import { ipcMain } from 'electron'
import { getDb, encryptRow, decryptRow, decryptRows } from '../db'

export function registerClientesIpc() {
  const db = () => getDb()

  ipcMain.handle('clientes:listar', (_, filtro?: string) => {
    let rows: any[]
    if (filtro) {
      rows = db().prepare(`SELECT c.*, cat.nome as categoria_nome FROM clientes c
        WHERE c.ativo = 1 AND (c.nome LIKE ? OR c.cpf_cnpj LIKE ? OR c.telefone LIKE ?)
        ORDER BY c.nome`).all(`%${filtro}%`, `%${filtro}%`, `%${filtro}%`) as any[]
    } else {
      rows = db().prepare('SELECT * FROM clientes WHERE ativo = 1 ORDER BY nome').all() as any[]
    }
    return decryptRows('clientes', rows)
  })

  ipcMain.handle('clientes:buscarPorId', (_, id: number) => {
    const row = db().prepare('SELECT * FROM clientes WHERE id = ?').get(id) as any
    return decryptRow('clientes', row)
  })

  ipcMain.handle('clientes:criar', (_, data: any) => {
    const enc = encryptRow('clientes', data)
    const stmt = db().prepare(`INSERT INTO clientes
      (nome, tipo, cpf_cnpj, rg_ie, endereco, numero, bairro, cidade, estado, cep, telefone, celular, email, observacoes)
      VALUES (@nome, @tipo, @cpf_cnpj, @rg_ie, @endereco, @numero, @bairro, @cidade, @estado, @cep, @telefone, @celular, @email, @observacoes)`)
    const result = stmt.run(enc)
    const row = db().prepare('SELECT * FROM clientes WHERE id = ?').get(result.lastInsertRowid) as any
    return decryptRow('clientes', row)
  })

  ipcMain.handle('clientes:atualizar', (_, id: number, data: any) => {
    const enc = encryptRow('clientes', data)
    db().prepare(`UPDATE clientes SET nome=@nome, tipo=@tipo, cpf_cnpj=@cpf_cnpj, rg_ie=@rg_ie,
      endereco=@endereco, numero=@numero, bairro=@bairro, cidade=@cidade, estado=@estado,
      cep=@cep, telefone=@telefone, celular=@celular, email=@email, observacoes=@observacoes
      WHERE id=@id`).run({ ...enc, id })
    const row = db().prepare('SELECT * FROM clientes WHERE id = ?').get(id) as any
    return decryptRow('clientes', row)
  })

  ipcMain.handle('clientes:excluir', (_, id: number) => {
    db().prepare('UPDATE clientes SET ativo = 0 WHERE id = ?').run(id)
    return { ok: true }
  })

  ipcMain.handle('clientes:historico', (_, id: number) => {
    const vendas = db().prepare(`SELECT v.*,
      (SELECT COUNT(*) FROM venda_itens WHERE venda_id = v.id) as qtd_itens
      FROM vendas v WHERE v.cliente_id = ? AND v.status = 'CONFIRMADA'
      ORDER BY v.criado_em DESC`).all(id)
    const resumo = db().prepare(`SELECT COUNT(*) as total_compras, COALESCE(SUM(total),0) as total_gasto
      FROM vendas WHERE cliente_id = ? AND status = 'CONFIRMADA'`).get(id) as any
    return { vendas, ...resumo }
  })
}
