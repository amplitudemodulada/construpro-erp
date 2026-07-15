import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { encrypt, decrypt } from './crypto'
export { encrypt, decrypt }

const SCHEMA = `
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS categorias (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL UNIQUE);

CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, categoria_id INTEGER REFERENCES categorias(id),
  unidade TEXT NOT NULL DEFAULT 'UN', preco_custo REAL NOT NULL DEFAULT 0, preco_venda REAL NOT NULL DEFAULT 0,
  estoque_atual REAL NOT NULL DEFAULT 0, estoque_minimo REAL NOT NULL DEFAULT 0, codigo_barras TEXT,
  ativo INTEGER NOT NULL DEFAULT 1, criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, tipo TEXT NOT NULL DEFAULT 'PF',
  cpf_cnpj TEXT, rg_ie TEXT, endereco TEXT, numero TEXT, bairro TEXT, cidade TEXT,
  estado TEXT DEFAULT 'RJ', cep TEXT, telefone TEXT, celular TEXT, email TEXT, observacoes TEXT,
  ativo INTEGER NOT NULL DEFAULT 1, criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS fornecedores (
  id INTEGER PRIMARY KEY AUTOINCREMENT, razao_social TEXT NOT NULL, nome_fantasia TEXT, cnpj TEXT, ie TEXT,
  endereco TEXT, numero TEXT, bairro TEXT, cidade TEXT, estado TEXT DEFAULT 'RJ', cep TEXT,
  telefone TEXT, email TEXT, contato TEXT, observacoes TEXT,
  ativo INTEGER NOT NULL DEFAULT 1, criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS funcionarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, cargo TEXT, salario REAL DEFAULT 0,
  cpf TEXT, rg TEXT, data_nascimento TEXT, telefone TEXT, email TEXT, endereco TEXT, data_admissao TEXT,
  ativo INTEGER NOT NULL DEFAULT 1, criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS vendas (
  id INTEGER PRIMARY KEY AUTOINCREMENT, numero INTEGER NOT NULL, tipo TEXT NOT NULL DEFAULT 'VENDA',
  status TEXT NOT NULL DEFAULT 'CONFIRMADA', cliente_id INTEGER REFERENCES clientes(id),
  funcionario_id INTEGER REFERENCES funcionarios(id), subtotal REAL NOT NULL DEFAULT 0,
  desconto REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0, forma_pagamento TEXT,
  parcelas INTEGER DEFAULT 1, observacoes TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS venda_itens (
  id INTEGER PRIMARY KEY AUTOINCREMENT, venda_id INTEGER NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id INTEGER NOT NULL REFERENCES produtos(id), quantidade REAL NOT NULL,
  preco_unitario REAL NOT NULL, desconto REAL NOT NULL DEFAULT 0, subtotal REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS movimentacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, produto_id INTEGER NOT NULL REFERENCES produtos(id),
  tipo TEXT NOT NULL, quantidade REAL NOT NULL, saldo_anterior REAL NOT NULL DEFAULT 0,
  saldo_atual REAL NOT NULL DEFAULT 0, motivo TEXT, referencia_tipo TEXT, referencia_id INTEGER,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS contas_pagar (
  id INTEGER PRIMARY KEY AUTOINCREMENT, fornecedor_id INTEGER REFERENCES fornecedores(id),
  descricao TEXT NOT NULL, valor REAL NOT NULL, vencimento TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ABERTA', pago_em TEXT, valor_pago REAL, forma_pagamento TEXT, observacoes TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS contas_receber (
  id INTEGER PRIMARY KEY AUTOINCREMENT, cliente_id INTEGER REFERENCES clientes(id),
  venda_id INTEGER REFERENCES vendas(id), descricao TEXT NOT NULL, valor REAL NOT NULL,
  vencimento TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ABERTA',
  recebido_em TEXT, valor_recebido REAL, forma_pagamento TEXT, observacoes TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS caixa (
  id INTEGER PRIMARY KEY AUTOINCREMENT, tipo TEXT NOT NULL, descricao TEXT NOT NULL, valor REAL NOT NULL,
  categoria TEXT, referencia_tipo TEXT, referencia_id INTEGER,
  data TEXT NOT NULL DEFAULT (date('now','localtime')),
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS licenca (
  id INTEGER PRIMARY KEY DEFAULT 1, chave TEXT NOT NULL, hardware_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDENTE', validade TEXT, ultima_validacao TEXT, proxima_validacao TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS sequencias (nome TEXT PRIMARY KEY, valor INTEGER NOT NULL DEFAULT 0);
INSERT OR IGNORE INTO sequencias VALUES ('vendas', 0);
`

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = join(app.getPath('userData'), 'construpro.db')
    db = new Database(dbPath)
    db.exec(SCHEMA)
    runSeed(db)
  }
  return db
}

const CRYPTO_FIELDS: Record<string, string[]> = {
  clientes: ['cpf_cnpj', 'rg_ie', 'telefone', 'celular', 'email', 'observacoes'],
  fornecedores: ['cnpj', 'ie', 'telefone', 'email', 'contato', 'observacoes'],
  funcionarios: ['cpf', 'rg', 'telefone', 'email', 'endereco'],
  vendas: ['observacoes'],
  contas_pagar: ['observacoes'],
  contas_receber: ['observacoes'],
}

export function encryptRow(table: string, row: any): any {
  const fields = CRYPTO_FIELDS[table]
  if (!fields || !row) return row
  const out = { ...row }
  for (const f of fields) {
    if (out[f] && typeof out[f] === 'string' && !out[f].startsWith('ENC:')) {
      out[f] = 'ENC:' + encrypt(out[f])
    }
  }
  return out
}

export function decryptRow(table: string, row: any): any {
  const fields = CRYPTO_FIELDS[table]
  if (!fields || !row) return row
  const out = { ...row }
  for (const f of fields) {
    if (out[f] && typeof out[f] === 'string' && out[f].startsWith('ENC:')) {
      out[f] = decrypt(out[f].substring(4))
    }
  }
  return out
}

export function decryptRows(table: string, rows: any[]): any[] {
  return rows.map(r => decryptRow(table, r))
}

function runSeed(db: Database.Database) {
  const count = (db.prepare('SELECT COUNT(*) as c FROM categorias').get() as any).c
  if (count > 0) return

  const insertCat = db.prepare('INSERT OR IGNORE INTO categorias (nome) VALUES (?)')
  const categorias = [
    'Cimento e Argamassa',
    'Areia e Pedra',
    'Tijolos e Blocos',
    'Tintas',
    'Ferragens',
    'Tubos e Conexões',
    'Telhas e Coberturas',
    'Ferramentas',
    'Elétrico',
    'Hidráulico',
    'Madeiras',
    'Pisos e Revestimentos'
  ]

  const insertMany = db.transaction(() => {
    for (const c of categorias) insertCat.run(c)
  })
  insertMany()

  const getCatId = (nome: string) =>
    (db.prepare('SELECT id FROM categorias WHERE nome = ?').get(nome) as any)?.id

  const insertProd = db.prepare(`
    INSERT INTO produtos (nome, categoria_id, unidade, preco_custo, preco_venda, estoque_atual, estoque_minimo)
    VALUES (@nome, @cat, @un, @custo, @venda, @est, @min)
  `)

  const produtos = [
    // Cimento e Argamassa
    { nome: 'Cimento Portland CP II 50kg', cat: 'Cimento e Argamassa', un: 'SC', custo: 32, venda: 42, est: 100, min: 20 },
    { nome: 'Cimento Portland CP IV 50kg', cat: 'Cimento e Argamassa', un: 'SC', custo: 34, venda: 45, est: 80, min: 20 },
    { nome: 'Argamassa AC-I 20kg', cat: 'Cimento e Argamassa', un: 'SC', custo: 15, venda: 22, est: 50, min: 10 },
    { nome: 'Argamassa AC-II 20kg', cat: 'Cimento e Argamassa', un: 'SC', custo: 17, venda: 25, est: 50, min: 10 },
    { nome: 'Argamassa Reboco 20kg', cat: 'Cimento e Argamassa', un: 'SC', custo: 14, venda: 20, est: 40, min: 10 },
    // Areia e Pedra
    { nome: 'Areia Fina (m³)', cat: 'Areia e Pedra', un: 'M3', custo: 80, venda: 120, est: 20, min: 5 },
    { nome: 'Areia Grossa (m³)', cat: 'Areia e Pedra', un: 'M3', custo: 75, venda: 110, est: 20, min: 5 },
    { nome: 'Brita nº 1 (m³)', cat: 'Areia e Pedra', un: 'M3', custo: 90, venda: 135, est: 15, min: 5 },
    { nome: 'Brita nº 2 (m³)', cat: 'Areia e Pedra', un: 'M3', custo: 90, venda: 135, est: 15, min: 5 },
    // Tijolos e Blocos
    { nome: 'Tijolo Cerâmico 6 Furos', cat: 'Tijolos e Blocos', un: 'MIL', custo: 380, venda: 520, est: 10, min: 2 },
    { nome: 'Bloco Concreto 14x19x39', cat: 'Tijolos e Blocos', un: 'UN', custo: 2.8, venda: 3.9, est: 500, min: 100 },
    { nome: 'Bloco Concreto 09x19x39', cat: 'Tijolos e Blocos', un: 'UN', custo: 2.2, venda: 3.2, est: 500, min: 100 },
    // Tintas
    { nome: 'Tinta Látex PVA Branco 18L', cat: 'Tintas', un: 'GL', custo: 68, venda: 98, est: 20, min: 5 },
    { nome: 'Tinta Acrílica Premium Branco 18L', cat: 'Tintas', un: 'GL', custo: 120, venda: 175, est: 15, min: 3 },
    { nome: 'Massa Corrida PVA 25kg', cat: 'Tintas', un: 'CX', custo: 35, venda: 52, est: 30, min: 5 },
    { nome: 'Fundo Preparador 18L', cat: 'Tintas', un: 'GL', custo: 55, venda: 82, est: 10, min: 3 },
    { nome: 'Tinta Esmalte Sintético Branco 900ml', cat: 'Tintas', un: 'UN', custo: 18, venda: 28, est: 24, min: 6 },
    // Ferragens
    { nome: 'Prego 17x27 com Cabeça 1kg', cat: 'Ferragens', un: 'KG', custo: 8, venda: 13, est: 50, min: 10 },
    { nome: 'Prego 18x30 com Cabeça 1kg', cat: 'Ferragens', un: 'KG', custo: 8, venda: 13, est: 50, min: 10 },
    { nome: 'Parafuso Drywall 3,5x25 (cx 500un)', cat: 'Ferragens', un: 'CX', custo: 15, venda: 25, est: 20, min: 5 },
    { nome: 'Bucha Nylon S8 (pct 50un)', cat: 'Ferragens', un: 'PCT', custo: 5, venda: 9, est: 30, min: 5 },
    { nome: 'Dobradiça 3" Cromada (par)', cat: 'Ferragens', un: 'PR', custo: 6, venda: 10, est: 40, min: 10 },
    // Tubos e Conexões
    { nome: 'Tubo PVC Esgoto 100mm 6m', cat: 'Tubos e Conexões', un: 'BA', custo: 35, venda: 55, est: 20, min: 5 },
    { nome: 'Tubo PVC Esgoto 50mm 6m', cat: 'Tubos e Conexões', un: 'BA', custo: 18, venda: 28, est: 20, min: 5 },
    { nome: 'Tubo PVC Água 25mm 6m', cat: 'Tubos e Conexões', un: 'BA', custo: 12, venda: 19, est: 30, min: 5 },
    { nome: 'Joelho 90° PVC 100mm', cat: 'Tubos e Conexões', un: 'UN', custo: 5, venda: 8, est: 50, min: 10 },
    { nome: 'Tê PVC Esgoto 100mm', cat: 'Tubos e Conexões', un: 'UN', custo: 8, venda: 13, est: 30, min: 10 },
    // Telhas
    { nome: 'Telha Fibrocimento 6mm 2,44x0,50m', cat: 'Telhas e Coberturas', un: 'UN', custo: 28, venda: 42, est: 100, min: 20 },
    { nome: 'Telha Cerâmica Francesa', cat: 'Telhas e Coberturas', un: 'UN', custo: 1.8, venda: 2.8, est: 500, min: 100 },
    { nome: 'Calha Alumínio 3m', cat: 'Telhas e Coberturas', un: 'BA', custo: 22, venda: 35, est: 20, min: 5 },
    // Ferramentas
    { nome: 'Colher de Pedreiro 10"', cat: 'Ferramentas', un: 'UN', custo: 15, venda: 25, est: 20, min: 5 },
    { nome: 'Enxada Larga com Cabo', cat: 'Ferramentas', un: 'UN', custo: 35, venda: 58, est: 15, min: 3 },
    { nome: 'Carrinho de Mão 60L', cat: 'Ferramentas', un: 'UN', custo: 120, venda: 185, est: 8, min: 2 },
    { nome: 'Nível de Bolha 60cm', cat: 'Ferramentas', un: 'UN', custo: 22, venda: 38, est: 12, min: 3 },
    { nome: 'Trena 5m Automática', cat: 'Ferramentas', un: 'UN', custo: 18, venda: 32, est: 15, min: 3 },
    { nome: 'Martelo Cabo de Madeira', cat: 'Ferramentas', un: 'UN', custo: 28, venda: 45, est: 10, min: 3 },
    { nome: 'Furadeira/Parafusadeira 12V', cat: 'Ferramentas', un: 'UN', custo: 180, venda: 280, est: 5, min: 1 },
    // Elétrico
    { nome: 'Fio Elétrico 1,5mm² rolo 100m', cat: 'Elétrico', un: 'RL', custo: 95, venda: 145, est: 10, min: 2 },
    { nome: 'Fio Elétrico 2,5mm² rolo 100m', cat: 'Elétrico', un: 'RL', custo: 145, venda: 210, est: 10, min: 2 },
    { nome: 'Disjuntor 20A Unipolar', cat: 'Elétrico', un: 'UN', custo: 12, venda: 20, est: 30, min: 5 },
    { nome: 'Tomada 2P+T 10A', cat: 'Elétrico', un: 'UN', custo: 8, venda: 14, est: 50, min: 10 },
    { nome: 'Interruptor Simples', cat: 'Elétrico', un: 'UN', custo: 7, venda: 13, est: 50, min: 10 },
    // Madeiras
    { nome: 'Caibro 7x7 3m', cat: 'Madeiras', un: 'UN', custo: 18, venda: 28, est: 50, min: 10 },
    { nome: 'Ripa 2x5 3m', cat: 'Madeiras', un: 'UN', custo: 8, venda: 13, est: 100, min: 20 },
    { nome: 'Porta Madeira Lisa 80x210cm', cat: 'Madeiras', un: 'UN', custo: 180, venda: 280, est: 8, min: 2 },
    // Pisos
    { nome: 'Piso Cerâmico 45x45 (cx 2m²)', cat: 'Pisos e Revestimentos', un: 'CX', custo: 35, venda: 55, est: 30, min: 5 },
    { nome: 'Revestimento 30x60 (cx 1,44m²)', cat: 'Pisos e Revestimentos', un: 'CX', custo: 42, venda: 65, est: 25, min: 5 },
    { nome: 'Rejunte Cinza 1kg', cat: 'Pisos e Revestimentos', un: 'UN', custo: 8, venda: 14, est: 40, min: 10 },
  ]

  const seedProd = db.transaction(() => {
    for (const p of produtos) {
      const catId = getCatId(p.cat)
      if (!catId) continue
      insertProd.run({ nome: p.nome, cat: catId, un: p.un, custo: p.custo, venda: p.venda, est: p.est, min: p.min })
    }
  })
  seedProd()

  const insertCliente = db.prepare(`INSERT INTO clientes
    (nome, tipo, cpf_cnpj, rg_ie, endereco, numero, bairro, cidade, estado, cep, telefone, celular, email, observacoes)
    VALUES (@nome, @tipo, @cpf_cnpj, @rg_ie, @endereco, @numero, @bairro, @cidade, @estado, @cep, @telefone, @celular, @email, @observacoes)`)

  const clientes = [
    { nome: 'Carlos Eduardo Mendes', tipo: 'PF', cpf_cnpj: '123.456.789-00', rg_ie: '12.345.678-9', endereco: 'Rua das Acácias', numero: '142', bairro: 'Jardim Primavera', cidade: 'Niterói', estado: 'RJ', cep: '24310-000', telefone: '(21) 2718-4500', celular: '(21) 98765-4321', email: 'carlos.mendes@email.com', observacoes: 'Cliente frequente, paga sempre à vista' },
    { nome: 'Construtora Horizonte Ltda', tipo: 'PJ', cpf_cnpj: '12.345.678/0001-90', rg_ie: '12.345.67-8', endereco: 'Av. Brasil', numero: '2500', bairro: 'Centro', cidade: 'Rio de Janeiro', estado: 'RJ', cep: '20031-000', telefone: '(21) 3300-8800', celular: '(21) 99988-7766', email: 'compras@horizonteconstrutora.com.br', observacoes: 'Pagamento em 30 dias' },
    { nome: 'Ana Paula Rodrigues', tipo: 'PF', cpf_cnpj: '987.654.321-00', rg_ie: '98.765.432-1', endereco: 'Rua São João', numero: '87', bairro: 'Vila Nova', cidade: 'São Gonçalo', estado: 'RJ', cep: '24400-000', telefone: '(21) 2741-1122', celular: '(21) 97654-3210', email: 'anapaula.r@email.com', observacoes: 'Preferência por entrega aos sábados' },
    { nome: 'Reformas & Cia Serviços', tipo: 'PJ', cpf_cnpj: '98.765.432/0001-10', rg_ie: '98.765.43-2', endereco: 'Rua do Comércio', numero: '310', bairro: 'Barreto', cidade: 'Niterói', estado: 'RJ', cep: '24110-000', telefone: '(21) 2610-5500', celular: '(21) 98877-6655', email: 'contato@reformasecia.com.br', observacoes: 'Contato: Sr. Paulo' },
    { nome: 'José Antônio da Silva', tipo: 'PF', cpf_cnpj: '456.789.123-00', rg_ie: '45.678.912-3', endereco: 'Rua Presidente Vargas', numero: '55', bairro: 'Fonseca', cidade: 'Niterói', estado: 'RJ', cep: '24130-000', telefone: '(21) 2716-3344', celular: '(21) 96543-2109', email: 'joseantonio@email.com', observacoes: '' },
    { nome: 'Engenharia Master Construções', tipo: 'PJ', cpf_cnpj: '55.443.221/0001-88', rg_ie: '55.443.22-1', endereco: 'Av. Amaral Peixoto', numero: '1200', bairro: 'Centro', cidade: 'Niterói', estado: 'RJ', cep: '24020-070', telefone: '(21) 2722-0099', celular: '(21) 99911-2233', email: 'obras@engmasterconstrucoes.com.br', observacoes: 'Crédito aprovado até R$ 50.000' },
    { nome: 'Fernanda Lima Costa', tipo: 'PF', cpf_cnpj: '321.654.987-00', rg_ie: '32.165.498-7', endereco: 'Rua Coronel Moreira César', numero: '30', bairro: 'Icaraí', cidade: 'Niterói', estado: 'RJ', cep: '24230-000', telefone: '(21) 2711-8877', celular: '(21) 99123-4567', email: 'fernanda.lima@email.com', observacoes: 'Reforma residencial em andamento' },
    { nome: 'Pedrão Construções ME', tipo: 'PJ', cpf_cnpj: '77.889.990/0001-55', rg_ie: '77.889.99-0', endereco: 'Estrada do Engenho', numero: '450', bairro: 'Pendotiba', cidade: 'Niterói', estado: 'RJ', cep: '24340-000', telefone: '(21) 2747-6600', celular: '(21) 98001-2345', email: 'pedrao.construcoes@email.com', observacoes: 'Pagamento quinzenal combinado' },
    { nome: 'Roberto Carlos Figueiredo', tipo: 'PF', cpf_cnpj: '654.321.098-00', rg_ie: '65.432.109-8', endereco: 'Rua Marquês do Paraná', numero: '700', bairro: 'Centro', cidade: 'Niterói', estado: 'RJ', cep: '24030-000', telefone: '(21) 2719-5544', celular: '(21) 97788-9900', email: 'roberto.figueiredo@email.com', observacoes: '' },
    { nome: 'Grupo Edificar Incorporações', tipo: 'PJ', cpf_cnpj: '33.221.100/0001-44', rg_ie: '33.221.10-0', endereco: 'Av. Visconde do Rio Branco', numero: '880', bairro: 'São Domingos', cidade: 'Niterói', estado: 'RJ', cep: '24210-005', telefone: '(21) 2620-4400', celular: '(21) 99700-1122', email: 'compras@grupoedificar.com.br', observacoes: 'Fatura mensal — vencimento dia 10' },
  ]

  const seedClientes = db.transaction(() => {
    for (const c of clientes) insertCliente.run(c)
  })
  seedClientes()
}
