PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  categoria_id INTEGER REFERENCES categorias(id),
  unidade TEXT NOT NULL DEFAULT 'UN',
  preco_custo REAL NOT NULL DEFAULT 0,
  preco_venda REAL NOT NULL DEFAULT 0,
  estoque_atual REAL NOT NULL DEFAULT 0,
  estoque_minimo REAL NOT NULL DEFAULT 0,
  codigo_barras TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'PF',
  cpf_cnpj TEXT,
  rg_ie TEXT,
  endereco TEXT,
  numero TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT DEFAULT 'RJ',
  cep TEXT,
  telefone TEXT,
  celular TEXT,
  email TEXT,
  observacoes TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS fornecedores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT,
  ie TEXT,
  endereco TEXT,
  numero TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT DEFAULT 'RJ',
  cep TEXT,
  telefone TEXT,
  email TEXT,
  contato TEXT,
  observacoes TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS funcionarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  cargo TEXT,
  salario REAL DEFAULT 0,
  cpf TEXT,
  rg TEXT,
  data_nascimento TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  data_admissao TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS vendas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero INTEGER NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'VENDA',
  status TEXT NOT NULL DEFAULT 'CONFIRMADA',
  cliente_id INTEGER REFERENCES clientes(id),
  funcionario_id INTEGER REFERENCES funcionarios(id),
  subtotal REAL NOT NULL DEFAULT 0,
  desconto REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  forma_pagamento TEXT,
  parcelas INTEGER DEFAULT 1,
  observacoes TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS venda_itens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venda_id INTEGER NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id INTEGER NOT NULL REFERENCES produtos(id),
  quantidade REAL NOT NULL,
  preco_unitario REAL NOT NULL,
  desconto REAL NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS movimentacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id INTEGER NOT NULL REFERENCES produtos(id),
  tipo TEXT NOT NULL,
  quantidade REAL NOT NULL,
  saldo_anterior REAL NOT NULL DEFAULT 0,
  saldo_atual REAL NOT NULL DEFAULT 0,
  motivo TEXT,
  referencia_tipo TEXT,
  referencia_id INTEGER,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS contas_pagar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fornecedor_id INTEGER REFERENCES fornecedores(id),
  descricao TEXT NOT NULL,
  valor REAL NOT NULL,
  vencimento TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ABERTA',
  pago_em TEXT,
  valor_pago REAL,
  forma_pagamento TEXT,
  observacoes TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS contas_receber (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER REFERENCES clientes(id),
  venda_id INTEGER REFERENCES vendas(id),
  descricao TEXT NOT NULL,
  valor REAL NOT NULL,
  vencimento TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ABERTA',
  recebido_em TEXT,
  valor_recebido REAL,
  forma_pagamento TEXT,
  observacoes TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS caixa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor REAL NOT NULL,
  categoria TEXT,
  referencia_tipo TEXT,
  referencia_id INTEGER,
  data TEXT NOT NULL DEFAULT (date('now','localtime')),
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS licenca (
  id INTEGER PRIMARY KEY DEFAULT 1,
  chave TEXT NOT NULL,
  hardware_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  validade TEXT,
  ultima_validacao TEXT,
  proxima_validacao TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS sequencias (
  nome TEXT PRIMARY KEY,
  valor INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO sequencias VALUES ('vendas', 0);
