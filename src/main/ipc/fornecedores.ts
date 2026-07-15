import { ipcMain } from 'electron'
import { getDb, encryptRow, decryptRow, decryptRows } from '../db'

export function registerFornecedoresIpc() {
  const db = () => getDb()

  ipcMain.handle('fornecedores:listar', (_, filtro?: string) => {
    let rows: any[]
    if (filtro) {
      rows = db().prepare(`SELECT * FROM fornecedores WHERE ativo = 1
        AND (razao_social LIKE ? OR cnpj LIKE ? OR nome_fantasia LIKE ?)
        ORDER BY razao_social`).all(`%${filtro}%`, `%${filtro}%`, `%${filtro}%`) as any[]
    } else {
      rows = db().prepare('SELECT * FROM fornecedores WHERE ativo = 1 ORDER BY razao_social').all() as any[]
    }
    return decryptRows('fornecedores', rows)
  })

  ipcMain.handle('fornecedores:buscarPorId', (_, id: number) => {
    const row = db().prepare('SELECT * FROM fornecedores WHERE id = ?').get(id) as any
    return decryptRow('fornecedores', row)
  })

  ipcMain.handle('fornecedores:criar', (_, data: any) => {
    const enc = encryptRow('fornecedores', data)
    const stmt = db().prepare(`INSERT INTO fornecedores
      (razao_social, nome_fantasia, cnpj, ie, endereco, numero, bairro, cidade, estado, cep, telefone, email, contato, observacoes)
      VALUES (@razao_social, @nome_fantasia, @cnpj, @ie, @endereco, @numero, @bairro, @cidade, @estado, @cep, @telefone, @email, @contato, @observacoes)`)
    const result = stmt.run(enc)
    const row = db().prepare('SELECT * FROM fornecedores WHERE id = ?').get(result.lastInsertRowid) as any
    return decryptRow('fornecedores', row)
  })

  ipcMain.handle('fornecedores:atualizar', (_, id: number, data: any) => {
    const enc = encryptRow('fornecedores', data)
    db().prepare(`UPDATE fornecedores SET razao_social=@razao_social, nome_fantasia=@nome_fantasia,
      cnpj=@cnpj, ie=@ie, endereco=@endereco, numero=@numero, bairro=@bairro,
      cidade=@cidade, estado=@estado, cep=@cep, telefone=@telefone, email=@email,
      contato=@contato, observacoes=@observacoes WHERE id=@id`).run({ ...enc, id })
    const row = db().prepare('SELECT * FROM fornecedores WHERE id = ?').get(id) as any
    return decryptRow('fornecedores', row)
  })

  ipcMain.handle('fornecedores:excluir', (_, id: number) => {
    db().prepare('UPDATE fornecedores SET ativo = 0 WHERE id = ?').run(id)
    return { ok: true }
  })
}
