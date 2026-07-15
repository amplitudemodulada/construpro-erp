import { ipcMain } from 'electron'
import { getDb } from '../db'

export function registerRelatoriosIpc() {
  const db = () => getDb()

  ipcMain.handle('relatorios:vendasPorPeriodo', (_, inicio: string, fim: string) => {
    return db().prepare(`SELECT v.*, c.nome as cliente_nome FROM vendas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.status = 'CONFIRMADA' AND DATE(v.criado_em) >= ? AND DATE(v.criado_em) <= ?
      ORDER BY v.criado_em DESC`).all(inicio, fim)
  })

  ipcMain.handle('relatorios:produtosMaisVendidos', (_, inicio: string, fim: string) => {
    return db().prepare(`SELECT p.nome, p.unidade, SUM(vi.quantidade) as qtd_total,
      SUM(vi.subtotal) as total_vendido FROM venda_itens vi
      JOIN vendas v ON vi.venda_id = v.id
      JOIN produtos p ON vi.produto_id = p.id
      WHERE v.status = 'CONFIRMADA' AND DATE(v.criado_em) >= ? AND DATE(v.criado_em) <= ?
      GROUP BY p.id ORDER BY qtd_total DESC LIMIT 20`).all(inicio, fim)
  })

  ipcMain.handle('relatorios:estoque', () => {
    return db().prepare(`SELECT p.*, c.nome as categoria_nome,
      (p.preco_custo * p.estoque_atual) as valor_custo,
      (p.preco_venda * p.estoque_atual) as valor_venda
      FROM produtos p LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.ativo = 1 ORDER BY c.nome, p.nome`).all()
  })

  ipcMain.handle('relatorios:lucroBruto', (_, inicio: string, fim: string) => {
    const vendas = db().prepare(`SELECT COALESCE(SUM(v.total), 0) as receita FROM vendas v
      WHERE v.status = 'CONFIRMADA' AND DATE(v.criado_em) >= ? AND DATE(v.criado_em) <= ?`)
      .get(inicio, fim) as any
    const custo = db().prepare(`SELECT COALESCE(SUM(vi.quantidade * p.preco_custo), 0) as custo FROM venda_itens vi
      JOIN vendas v ON vi.venda_id = v.id
      JOIN produtos p ON vi.produto_id = p.id
      WHERE v.status = 'CONFIRMADA' AND DATE(v.criado_em) >= ? AND DATE(v.criado_em) <= ?`)
      .get(inicio, fim) as any
    return {
      receita: vendas.receita,
      custo: custo.custo,
      lucro_bruto: vendas.receita - custo.custo,
      margem: vendas.receita > 0 ? ((vendas.receita - custo.custo) / vendas.receita * 100).toFixed(1) : '0'
    }
  })
}
