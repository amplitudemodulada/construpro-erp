import { ipcMain } from 'electron'
import { getDb, encryptRow, decryptRow, decryptRows } from '../db'

export function registerFuncionariosIpc() {
  const db = () => getDb()

  ipcMain.handle('funcionarios:listar', () => {
    const rows = db().prepare('SELECT * FROM funcionarios WHERE ativo = 1 ORDER BY nome').all() as any[]
    return decryptRows('funcionarios', rows)
  })

  ipcMain.handle('funcionarios:buscarPorId', (_, id: number) => {
    const row = db().prepare('SELECT * FROM funcionarios WHERE id = ?').get(id) as any
    return decryptRow('funcionarios', row)
  })

  ipcMain.handle('funcionarios:criar', (_, data: any) => {
    const enc = encryptRow('funcionarios', data)
    const stmt = db().prepare(`INSERT INTO funcionarios
      (nome, cargo, salario, cpf, rg, data_nascimento, telefone, email, endereco, data_admissao)
      VALUES (@nome, @cargo, @salario, @cpf, @rg, @data_nascimento, @telefone, @email, @endereco, @data_admissao)`)
    const result = stmt.run(enc)
    const row = db().prepare('SELECT * FROM funcionarios WHERE id = ?').get(result.lastInsertRowid) as any
    return decryptRow('funcionarios', row)
  })

  ipcMain.handle('funcionarios:atualizar', (_, id: number, data: any) => {
    const enc = encryptRow('funcionarios', data)
    db().prepare(`UPDATE funcionarios SET nome=@nome, cargo=@cargo, salario=@salario,
      cpf=@cpf, rg=@rg, data_nascimento=@data_nascimento, telefone=@telefone,
      email=@email, endereco=@endereco, data_admissao=@data_admissao WHERE id=@id`)
      .run({ ...enc, id })
    const row = db().prepare('SELECT * FROM funcionarios WHERE id = ?').get(id) as any
    return decryptRow('funcionarios', row)
  })

  ipcMain.handle('funcionarios:excluir', (_, id: number) => {
    db().prepare('UPDATE funcionarios SET ativo = 0 WHERE id = ?').run(id)
    return { ok: true }
  })
}
