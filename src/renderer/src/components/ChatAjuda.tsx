import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react'

const BASE = [
  // ─── DASHBOARD ───────────────────────────────────────
  {
    palavras: ['dashboard', 'inicio', 'início', 'resumo', 'visão geral', 'tela inicial', 'home', 'painel'],
    titulo: 'Dashboard',
    respostas: [
      'O Dashboard é a tela inicial do ConstruPro e exibe um resumo financeiro do mês atual.',
      'Os 5 cards no topo mostram: Receitas do mês, Despesas do mês, Saldo (receita - despesa), Quantidade de Vendas e Total a Receber.',
      'Abaixo dos cards, a tabela "Alertas de Estoque" lista todos os produtos cujo estoque atual está abaixo do estoque mínimo configurado — revise as quantidades em Produtos.',
      'Use o Dashboard para tomar decisões rápidas: identifique se o mês está positivo (saldo verde) ou negativo (saldo vermelho), e se há produtos para repor.',
    ]
  },

  // ─── CLIENTES ────────────────────────────────────────
  {
    palavras: ['cliente', 'clientes', 'cadastrar cliente', 'novo cliente', 'cpf', 'cnpj', 'pessoa física', 'pessoa juridica', 'pf', 'pj', 'cadastro de cliente'],
    titulo: 'Clientes',
    respostas: [
      'Acesse o menu Clientes (F2) para listar, cadastrar e gerenciar todos os clientes.',
      'CADASTRAR: Clique em "Novo Cliente" e preencha os campos obrigatórios: Nome, Tipo (PF ou PJ), CPF/CNPJ. Campos opcionais: RG/IE, Endereço, Número, Bairro, Cidade, Estado (sigla UF), CEP, Telefone, Celular, E-mail e Observações.',
      'BUSCAR: Use a barra de busca no topo da listagem para filtrar por nome, CPF/CNPJ ou telefone em tempo real.',
      'EDITAR: Clique no ícone de lápis (✏️) na linha do cliente desejado para abrir o formulário com os dados preenchidos.',
      'DESATIVAR: Clique no ícone de lixeira (🗑️) — o cliente não é apagado do banco, apenas desativado. Clientes desativados deixam de aparecer nas listagens e nas telas de seleção.',
      'HISTÓRICO: Na listagem, clique no ícone de olho (👁️) para ver o histórico de compras do cliente, incluindo todas as vendas vinculadas.',
      'DICA: Pessoas Jurídicas (PJ) geralmente têm prazo de pagamento — use o campo "Observações" para registrar combinações como "Pagamento em 30 dias".',
    ]
  },

  // ─── FORNECEDORES ────────────────────────────────────
  {
    palavras: ['fornecedor', 'fornecedores', 'novo fornecedor', 'razão social', 'razao social', 'representante', 'compras', 'fornecedor cadastrar'],
    titulo: 'Fornecedores',
    respostas: [
      'Acesse o menu Fornecedores (F3) para gerenciar seus fornecedores.',
      'CADASTRAR: Clique em "Novo Fornecedor" e preencha: Razão Social (obrigatório), Nome Fantasia, CNPJ, IE, Endereço, Número, Bairro, Cidade, Estado, CEP, Telefone, E-mail, Contato (nome do representante/comprador) e Observações.',
      'EDITAR/DESATIVAR: Use os ícones de lápis e lixeira na listagem, igual ao módulo de Clientes.',
      'VINCULAÇÃO: Fornecedores cadastrados aparecem na tela de Financeiro → Contas a Pagar para vincular despesas a fornecedores específicos.',
      'DICA: O campo "Contato" é útil para registrar o nome da pessoa que atende na empresa (ex: "Sr. Roberto — Depto. Comercial").',
    ]
  },

  // ─── FUNCIONÁRIOS ────────────────────────────────────
  {
    palavras: ['funcionário', 'funcionarios', 'funcionário', 'cargo', 'salário', 'salario', 'admissão', 'admissao', 'vendedor', 'equipe', 'colaborador'],
    titulo: 'Funcionários',
    respostas: [
      'Acesse o menu Funcionários (F4) para gerenciar sua equipe.',
      'CADASTRAR: Clique em "Novo Funcionário" e preencha: Nome (obrigatório), Cargo, Salário, CPF, RG, Data de Nascimento, Telefone, E-mail, Endereço e Data de Admissão.',
      'VINCULAÇÃO A VENDAS: Funcionários cadastrados podem ser vinculados como "Vendedor" ao criar uma nova venda — isso permite identificar quem realizou cada venda.',
      'DESATIVAR: Funcionários desativados deixam de aparecer nas listagens de seleção de vendedores, mas o histórico de vendas é preservado.',
      'DICA: Use o campo "Cargo" para identificar funções como "Vendedor", "Caixa", "Gerente", "Estoquista", etc.',
    ]
  },

  // ─── PRODUTOS ────────────────────────────────────────
  {
    palavras: ['produto', 'produtos', 'cadastrar produto', 'preço', 'preco', 'categoria', 'unidade', 'medida', 'custo', 'venda', 'código de barras', 'estoque mínimo'],
    titulo: 'Produtos',
    respostas: [
      'Acesse Produtos (F5) para visualizar e gerenciar o catálogo completo de mercadorias.',
      'CADASTRAR: Clique em "Novo Produto" e preencha: Nome (obrigatório), Categoria (selecione na lista), Unidade de Medida (UN, KG, GL, SC, RL, CX, PR, PCT, BA, M3, MIL), Preço de Custo, Preço de Venda, Estoque Mínimo e Código de Barras.',
      'CATEGORIAS: O sistema já vem com 12 categorias pré-cadastradas: Cimento e Argamassa, Areia e Pedra, Tijolos e Blocos, Tintas, Ferragens, Tubos e Conexões, Telhas e Coberturas, Ferramentas, Elétrico, Hidráulico, Madeiras, Pisos e Revestimentos.',
      'ESTOQUE MÍNIMO: O campo "Estoque Mínimo" define o limite para alertas automáticos — quando o estoque cai abaixo desse valor, o produto aparece no Dashboard na tabela de alertas.',
      'CÓDIGO DE BARRAS: Preencha o campo "Código de Barras" com o EAN-13, EAN-8, Code 128 ou qualquer padrão. Isso permite usar o leitor de código de barras no Estoque e nas Vendas.',
      'CORES DA COLUNA ESTOQUE: Na listagem, a coluna Estoque fica AMARELA quando o estoque está baixo (próximo ao mínimo) e VERMELHA quando está zerado.',
      'EDITAR PREÇOS: Clique no lápis para alterar preços — somente os campos de preço podem ser alterados aqui; para movimentar estoque, use o módulo Estoque.',
      'O sistema já vem com mais de 50 produtos de construção pré-cadastrados para você começar imediatamente.',
    ]
  },

  // ─── ESTOQUE ─────────────────────────────────────────
  {
    palavras: ['estoque', 'entrada', 'saída', 'saida', 'ajuste', 'inventário', 'inventario', 'posição', 'posicao', 'saldo', 'quantidade', 'movimentação', 'movimentacao', 'baixa'],
    titulo: 'Estoque',
    respostas: [
      'Acesse Estoque (F6) para controlar a posição e todas as movimentações dos produtos.',
      'ABA POSIÇÃO DE ESTOQUE: Lista todos os produtos com nome, categoria, unidade e saldo atual. Use a busca para filtrar por nome.',
      'ABA HISTÓRICO: Exibe todas as movimentações registradas (entradas, saídas, ajustes e vendas) com data, tipo, quantidade e saldo.',
      'AJUSTE MANUAL: Clique em "Ajuste Manual" para registrar movimentações sem o leitor de código de barras:',
      '  • ENTRADA: adiciona quantidade ao estoque (ex: recebimento de mercadoria do fornecedor).',
      '  • SAÍDA: retira quantidade do estoque (ex: quebra, devolução, uso interno).',
      '  • AJUSTE: define a quantidade exata do produto (ex: após inventário físico — o sistema calcula automaticamente a diferença).',
      'LEITOR DE CÓDIGO DE BARRAS: No Estoque, o campo do leitor já está em foco automaticamente. Aponte e escaneie — o produto é identificado e o modal de entrada abre com o produto pré-preenchido.',
      'VENDAS: As vendas confirmadas baixam o estoque automaticamente. O cancelamento de uma venda devolve todos os itens ao estoque.',
      'MOVIMENTAÇÃO: Cada movimentação é registrada com: produto, tipo, quantidade, saldo anterior, saldo atual, motivo e data/hora.',
    ]
  },

  // ─── LEITOR DE CÓDIGO DE BARRAS ──────────────────────
  {
    palavras: ['código de barras', 'codigo de barras', 'barras', 'leitor', 'scanner', 'escaner', 'escanear', 'bluetooth', 'ean', 'usb', 'lê código', 'leitor cod'],
    titulo: 'Leitor de Código de Barras',
    respostas: [
      'COMPATIBILIDADE: O sistema é compatível com qualquer leitor de código de barras USB ou Bluetooth (Zebra, Honeywell, Datalogic, etc.).',
      'COMO FUNCIONA: O leitor funciona como teclado (HID) — nenhum driver ou instalação especial é necessário. Basta conectar e usar.',
      'CONECTAR: Para USB, plugue o cabo. Para Bluetooth, emparelhe o leitor com o computador primeiro pelas configurações do Windows.',
      'USO NO ESTOQUE (entrada de mercadoria):',
      '  1. Acesse o menu Estoque — o campo do leitor já estará em foco.',
      '  2. Aponte o leitor para o código de barras do produto e escaneie.',
      '  3. O produto é identificado e o modal de entrada abre automaticamente.',
      '  4. Digite a quantidade recebida e pressione Enter para confirmar.',
      '  5. O foco retorna ao campo do leitor para o próximo produto.',
      '  6. Se o código não for encontrado, uma mensagem de erro é exibida.',
      'USO NAS VENDAS (PDV):',
      '  1. Abra uma Nova Venda.',
      '  2. Escaneie o código de barras — o produto é adicionado ao carrinho instantaneamente.',
      '  3. Escanear o mesmo produto novamente incrementa a quantidade em +1.',
      '  4. Você também pode buscar produtos por nome no campo de busca abaixo.',
      'PRÉ-REQUISITO: O código de barras deve estar cadastrado no produto. Acesse Produtos → editar → campo "Código de Barras".',
    ]
  },

  // ─── VENDAS ──────────────────────────────────────────
  {
    palavras: ['venda', 'vendas', 'nova venda', 'orçamento', 'orcamento', 'confirmar', 'cancelar', 'carrinho', 'pedido', 'pdv', 'ponto de venda', 'pagamento', 'desconto', 'cliente na venda', 'vendedor'],
    titulo: 'Vendas',
    respostas: [
      'Acesse Vendas (F7) para registrar e consultar todas as vendas e orçamentos.',
      'NOVA VENDA: Clique em "Nova Venda" para abrir o formulário de PDV.',
      'TIPO: Selecione "Venda" (confirma e baixa estoque automaticamente) ou "Orçamento" (apenas registra, sem baixar estoque).',
      'CLIENTE (opcional): Selecione um cliente na lista suspensa para vincular à venda.',
      'VENDEDOR (opcional): Selecione um funcionário como vendedor responsável.',
      'ADICIONAR PRODUTOS: Use o campo de busca para digitar o nome do produto e clicar para adicionar ao carrinho, ou escaneie o código de barras.',
      'CARRINHO: Na tabela de itens, ajuste a Quantidade e o Preço Unitário diretamente nas células. O subtotal é calculado automaticamente.',
      'DESCONTO: Informe um desconto geral (em R$ ou %) no campo indicado antes de confirmar.',
      'FORMA DE PAGAMENTO: Selecione: Dinheiro, Cartão de Crédito, Cartão de Débito, PIX, Boleto ou Transferência.',
      'CONFIRMAR: Clique em "Confirmar Venda" — o estoque é baixado automaticamente e a venda é lançada no caixa como Receita.',
      'CANCELAR: Na listagem, clique no X (❌) de uma venda confirmada para cancelar — o estoque retorna automaticamente e o lançamento no caixa é removido.',
      'FILTROS: Use os botões de status (Confirmada, Orçamento, Cancelada) para filtrar a listagem.',
    ]
  },

  // ─── IMPRESSÃO E COMPARTILHAMENTO ────────────────────
  {
    palavras: ['imprimir', 'impressão', 'impressao', 'pdf', 'cupom', 'a4', 'whatsapp', 'compartilhar', 'enviar', 'recibo', 'nota', 'documento'],
    titulo: 'Impressão e Compartilhamento',
    respostas: [
      'Na listagem de Vendas, clique no ícone de olho (👁️) para visualizar os detalhes de uma venda.',
      'CUPOM 80mm: Imprime em impressora térmica de 80mm ou salva como PDF no formato de cupom fiscal. Ideal para impressoras como Bemateph, Elgin, Epson TM-T20.',
      'IMPRIMIR A4: Gera um documento formal em formato A4 com cabeçalho da empresa, dados do cliente, tabela de itens com colunas (Produto, Qtd, Preço, Subtotal), total, forma de pagamento e linha de assinatura.',
      'WHATSAPP: Abre o WhatsApp Web com o resumo da venda formatado e pronto para enviar ao cliente. Inclui: número da venda, data, itens, total e forma de pagamento.',
      'DICA: Para usar o WhatsApp, certifique-se de estar logado no WhatsApp Web no navegador padrão do sistema.',
    ]
  },

  // ─── FINANCEIRO ──────────────────────────────────────
  {
    palavras: ['financeiro', 'caixa', 'pagar', 'receber', 'conta', 'contas', 'despesa', 'receita', 'extrato', 'vencimento', 'fluxo de caixa', 'fatura', 'boleto'],
    titulo: 'Financeiro',
    respostas: [
      'Acesse Financeiro (F8) para gerenciar todo o fluxo financeiro da loja.',
      'PERÍODO: Selecione o período desejado (data início e data fim) no topo da tela — todos os dados são filtrados por esse período.',
      'CARDS RESUMO: Os 3 cards no topo exibem: Total de Receitas, Total de Despesas e Saldo do período.',
      'ABA CAIXA: Mostra o extrato cronológico de todas as entradas (Receitas) e saídas (Despesas) no período. Cada linha indica: data, descrição, tipo, valor e categoria.',
      'ABA CONTAS A PAGAR:',
      '  • Clique em "Nova Conta a Pagar" para lançar uma despesa futura: selecione fornecedor, informe descrição, valor, vencimento e observações.',
      '  • Clique em "Pagar" na linha da conta para registrar o pagamento — o valor é lançado no caixa automaticamente como Despesa.',
      '  • Contas VENCIDAS aparecem destacadas em VERMELHO automaticamente.',
      'ABA CONTAS A RECEBER:',
      '  • Clique em "Nova Conta a Receber" para lançar um recebimento futuro: selecione cliente, informe descrição, valor, vencimento.',
      '  • Clique em "Receber" para confirmar o recebimento — o valor é lançado no caixa como Receita.',
      'VINCULAÇÃO AUTOMÁTICA: As vendas confirmadas são lançadas automaticamente no caixa como Receita, sem necessidade de lançamento manual.',
      'ADICIONAR LANÇAMENTO: Use o botão "Novo Lançamento no Caixa" para registrar entradas ou saídas avulsas (ex: aluguel, pagamento de funcionário).',
    ]
  },

  // ─── RELATÓRIOS ──────────────────────────────────────
  {
    palavras: ['relatório', 'relatorio', 'relatorios', 'gráfico', 'grafico', 'lucro', 'mais vendido', 'ticket médio', 'ticket medio', 'margem', 'análise', 'analise', 'desempenho'],
    titulo: 'Relatórios',
    respostas: [
      'Acesse Relatórios (F9) para análises detalhadas do desempenho do negócio.',
      'PERÍODO: Selecione o período desejado (data início e data fim) no topo da tela.',
      'ABA VENDAS POR DIA: Exibe um gráfico de barras com o valor total de vendas para cada dia do período selecionado. Ideal para identificar dias de maior movimento.',
      'ABA PRODUTOS MAIS VENDIDOS: Lista os produtos ordenados por quantidade vendida no período. Mostra: nome do produto, quantidade total vendida e valor total. Use o botão "Exportar CSV" para baixar a lista.',
      'ABA LUCRO BRUTO: Exibe uma tabela com: Receita (preço de venda × quantidade), Custo (preço de custo × quantidade) e Margem (%) de cada produto vendido. Ideal para identificar os produtos mais rentáveis.',
      'ABA POSIÇÃO DE ESTOQUE: Lista todos os produtos com estoque atual, estoque mínimo, preço de custo e preço de venda. O campo "Situação" indica se está OK, Baixo ou Zerado.',
      'DICA: Compare o lucro bruto dos produtos para ajustar preços de venda e maximizar a margem.',
    ]
  },

  // ─── BACKUP ──────────────────────────────────────────
  {
    palavras: ['backup', 'cópia', 'copia', 'restaurar', 'restore', 'segurança', 'seguranca', 'dados', 'banco', 'banco de dados', 'proteger', 'arquivo'],
    titulo: 'Backup',
    respostas: [
      'Acesse o menu Backup para proteger os dados do sistema contra perdas.',
      'FAZER BACKUP: Clique em "Fazer Backup Agora" e escolha onde salvar o arquivo (.db). O backup contém todos os dados: clientes, produtos, vendas, financeiro, etc.',
      'FREQUÊNCIA: Recomenda-se fazer backup DIARIAMENTE ao final do expediente.',
      'RESTAURAR: Clique em "Restaurar de Arquivo..." e selecione um arquivo de backup anterior (.db).',
      'BACKUP AUTOMÁTICO: Antes de restaurar, o sistema cria automaticamente um backup do banco atual na pasta de dados como segurança.',
      'APÓS RESTAURAÇÃO: O sistema reinicia automaticamente para aplicar os dados restaurados.',
      'ARMAZENAMENTO: Guarde backups em pen drive ou HD externo, fora do computador principal. Se possível, mantenha uma cópia em nuvem (Google Drive, OneDrive).',
      'CAMINHO DO BANCO: O banco de dados está localizado na pasta de dados do usuário: %APPDATA%/construpro/construpro.db',
    ]
  },

  // ─── ATALHOS DE TECLADO ──────────────────────────────
  {
    palavras: ['atalho', 'atalhos', 'teclado', 'atalho teclado', 'atalho de teclado', 'atalhos teclado', 'atajos'],
    titulo: 'Atalhos de Teclado',
    respostas: [
      'O ConstruPro possui atalhos de teclado para navegação rápida (não funcionam quando o foco está em um campo de texto):',
      '  F1 → Dashboard (tela inicial)',
      '  F2 → Clientes',
      '  F3 → Fornecedores',
      '  F4 → Funcionários',
      '  F5 → Produtos',
      '  F6 → Estoque',
      '  F7 → Vendas',
      '  F8 → Financeiro',
      '  F9 → Relatórios',
      '  F10 → Backup',
      '  F11 → Ajuda',
      'ATALHOS DE AÇÃO (dentro das telas):',
      '  Insert → Abrir formulário de novo registro',
      '  Ctrl+S → Salvar/Confirmar o formulário atual',
      '  Ctrl+B → Focar no campo de busca',
      '  Esc → Fechar modal ou formulário',
      '  Enter → Confirmar diálogo',
      'Clique no botão "Atalhos do teclado" no rodapé da sidebar para ver o painel completo.',
    ]
  },

  // ─── CATEGORIAS ──────────────────────────────────────
  {
    palavras: ['categoria', 'categorias', 'grupo', 'grupos', 'classificação', 'classificacao', 'tipos de produto'],
    titulo: 'Categorias de Produtos',
    respostas: [
      'O sistema já vem com 12 categorias pré-cadastradas para materiais de construção:',
      '  1. Cimento e Argamassa — cimentos Portland, argamassas (AC-I, AC-II, reboco)',
      '  2. Areia e Pedra — areia fina, areia grossa, brita nº 1 e nº 2',
      '  3. Tijolos e Blocos — tijolos cerâmicos, blocos de concreto (14x19x39 e 09x19x39)',
      '  4. Tintas — látex PVA, acrílica, esmalte, massa corrida, fundo preparador',
      '  5. Ferragens — pregos, parafusos, buchas, dobradiças,铁铁s',
      '  6. Tubos e Conexões — PVC esgoto (100mm, 50mm), PVC água, joelhos, tês',
      '  7. Telhas e Coberturas — fibrocimento, cerâmica francesa, calhas',
      '  8. Ferramentas — colher de pedreiro, enxada, carrinho de mão, Furadeira/Parafusadeira',
      '  9. Elétrico — fios (1,5mm² e 2,5mm²), disjuntores, tomadas, interruptores',
      ' 10. Hidráulico — tubos e conexões para água',
      ' 11. Madeiras — caibros, ripas, portas',
      ' 12. Pisos e Revestimentos — pisos cerâmicos, revestimentos, rejunte',
      'Cada categoria agrupa os produtos para facilitar a busca e a organização do catálogo.',
    ]
  },

  // ─── UNIDADES DE MEDIDA ──────────────────────────────
  {
    palavras: ['unidade', 'unidades', 'medida', 'medidas', 'kg', 'un', 'gl', 'sc', 'rl', 'cx', 'pr', 'pct', 'ba', 'm3', 'mil', 'litro', 'kilogramo', 'saco', 'rolo', 'caixa'],
    titulo: 'Unidades de Medida',
    respostas: [
      'O ConstruPro suporta as seguintes unidades de medida para produtos:',
      '  UN → Unidade (ex: furadeira, nível, porta)',
      '  KG → Quilograma (ex: pregos, parafusos)',
      '  GL → Galão (ex: tintas líquidas)',
      '  SC → Saco (ex: cimento, argamassa — 50kg)',
      '  RL → Rolo (ex: fios elétricos)',
      '  CX → Caixa (ex: massa corrida, pisos cerâmicos)',
      '  PR → Par (ex: dobradiças)',
      '  PCT → Pacote (ex: buchas nylon)',
      '  BA → Barra (ex: tubos PVC de 6m)',
      '  M3 → Metro Cúbico (ex: areia, brita)',
      '  MIL → Milheiro (ex: tijolos cerâmicos)',
      'Ao cadastrar um produto, selecione a unidade que melhor se adequa ao item.',
    ]
  },

  // ─── CÓDIGO DE BARRAS DETALHADO ──────────────────────
  {
    palavras: ['cadastrar código', 'código barras', 'ean-13', 'ean-8', 'code 128', 'código produto', 'etiqueta'],
    titulo: 'Cadastrar Código de Barras',
    respostas: [
      'Para cadastrar o código de barras de um produto:',
      '  1. Acesse Produtos (F5)',
      '  2. Clique no lápis (✏️) para editar o produto desejado',
      '  3. Preencha o campo "Código de Barras" com o código do produto',
      '  4. Clique em Salvar',
      'FORMATOS ACEITOS: EAN-13 (13 dígitos), EAN-8 (8 dígitos), Code 128, Code 39, ou qualquer padrão que o leitor de código de barras consiga ler.',
      'DICA: Se o produto não possui código de barras fabricado, você pode gerar um gratuitamente em sites como brasil.cogex.com ou barras.gerenciated.com.br e imprimir uma etiqueta.',
      'APÓS CADASTRAR: O código será reconhecido automaticamente pelo leitor tanto no Estoque (entrada) quanto nas Vendas (PDV).',
    ]
  },

  // ─── FORMAS DE PAGAMENTO ─────────────────────────────
  {
    palavras: ['pagamento', 'forma de pagamento', 'dinheiro', 'cartão', 'crédito', 'credito', 'débito', 'debito', 'pix', 'boleto', 'transferência', 'transferencia', 'parcela', 'parcelas'],
    titulo: 'Formas de Pagamento',
    respostas: [
      'O ConstruPro suporta as seguintes formas de pagamento nas vendas:',
      '  • Dinheiro — pagamento à vista em espécie',
      '  • Cartão de Crédito — pagamento no cartão de crédito (informe o número de parcelas)',
      '  • Cartão de Débito — pagamento no cartão de débito',
      '  • PIX — pagamento instantâneo via PIX',
      '  • Boleto — pagamento via boleto bancário',
      '  • Transferência — transferência bancária (TED/DOC)',
      'Ao criar uma venda, selecione a forma de pagamento antes de confirmar. O campo "Parcelas" é útil para vendas no cartão de crédito (ex: 3x de R$ 100,00).',
      'A forma de pagamento é registrada na venda e aparece nos relatórios e no histórico.',
    ]
  },

  // ─── DESCONTOS ───────────────────────────────────────
  {
    palavras: ['desconto', 'descontos', 'promoção', 'promocao', 'abater', 'redução', 'reducao'],
    titulo: 'Descontos',
    respostas: [
      'DESCONTO NA VENDA: Ao criar uma venda, informe o desconto geral no campo indicado. O desconto pode ser informado em Reais (R$) ou Percentual (%).',
      'O desconto é aplicado sobre o subtotal da venda (soma de todos os itens) antes de calcular o total.',
      'O desconto aparece discriminado no cupom/impresso e no WhatsApp.',
      'DICA: Para descontos em itens individuais (ex: promoção em um produto específico), ajuste o preço unitário diretamente na tabela de itens do carrinho.',
    ]
  },

  // ─── ESTOQUE MÍNIMO ──────────────────────────────────
  {
    palavras: ['estoque mínimo', 'estoque minimo', 'repôr', 'repor', 'reabastecer', 'alerta estoque', 'produto acabando', 'estoque baixo'],
    titulo: 'Estoque Mínimo e Reabastecimento',
    respostas: [
      'O ESTOQUE MÍNIMO é um valor configurado em cada produto que define o limite para alertas automáticos.',
      'QUANDO O ESTOQUE CAI ABAIXO DO MÍNIMO:',
      '  • O produto aparece na tabela de alertas do Dashboard',
      '  • Na listagem de Produtos, a coluna Estoque fica AMARELA (baixo) ou VERMELHA (zerado)',
      'COMO CONFIGURAR:',
      '  1. Acesse Produtos → clique no lápis para editar',
      '  2. Defina o campo "Estoque Mínimo" (ex: 10, 20, 50)',
      '  3. Salve',
      'COMO REABASTECER:',
      '  1. Acesse Estoque (F6)',
      '  2. Clique em "Ajuste Manual"',
      '  3. Selecione o produto, escolha "ENTRADA" e informe a quantidade recebida',
      '  4. Confirme — o estoque é atualizado e a movimentação registrada',
      'DICA: Revise os estoques mínimos periodicamente com base na velocidade de vendas de cada produto.',
    ]
  },

  // ─── CANCELAR VENDA ──────────────────────────────────
  {
    palavras: ['cancelar venda', 'cancelamento', 'devolver', 'devolução', 'devolucao', 'estornar', 'estorno'],
    titulo: 'Cancelar Vendas',
    respostas: [
      'Para cancelar uma venda confirmada:',
      '  1. Acesse Vendas (F7)',
      '  2. Na listagem, localize a venda que deseja cancelar',
      '  3. Clique no ícone X (❌) na linha da venda',
      '  4. Confirme o cancelamento',
      'O QUE ACONTECE AO CANCELAR:',
      '  • O estoque de todos os itens é DEVOLVIDO automaticamente',
      '  • O lançamento no Caixa (Receita) é REMOVIDO automaticamente',
      '  • O status da venda muda para "CANCELADA"',
      '  • A venda cancelada continua aparecendo na listagem com status "CANCELADA" para consulta',
      'IMPORTANTE: Somente vendas com status "CONFIRMADA" podem ser canceladas. Orçamentos podem ser simplesmente excluídos.',
    ]
  },

  // ─── ORÇAMENTO ───────────────────────────────────────
  {
    palavras: ['orçamento', 'orcamento', 'orçar', 'orcar', 'cotação', 'cotacao', 'proposta'],
    titulo: 'Orçamentos',
    respostas: [
      'UM ORÇAMENTO é uma venda que NÃO baixa estoque e NÃO é lançada no caixa.',
      'PARA CRIAR UM ORÇAMENTO:',
      '  1. Acesse Vendas → Nova Venda',
      '  2. Selecione o Tipo: "Orçamento"',
      '  3. Adicione os produtos ao carrinho',
      '  4. Confirme',
      'DIFERENÇA ENTRE VENDA E ORÇAMENTO:',
      '  • Venda: baixa estoque, lança no caixa, muda status para "CONFIRMADA"',
      '  • Orçamento: NÃO baixa estoque, NÃO lança no caixa, fica como "ORÇAMENTO"',
      'QUANDO USAR:',
      '  • Para enviar preços ao cliente antes de fechar o negócio',
      '  • Para cotações que ainda não foram aprovadas',
      '  • Para registrar propostas pendentes',
      'Se o cliente aprovar o orçamento, você pode cancelá-lo e criá-lo novamente como Venda.',
    ]
  },

  // ─── INVENTÁRIO ──────────────────────────────────────
  {
    palavras: ['inventário', 'inventario', 'contagem física', 'contagem fisica', 'balanço', 'balanco', 'conferência', 'conferencia'],
    titulo: 'Inventário Físico',
    respostas: [
      'Para fazer o inventário físico (conferência do estoque real vs. estoque do sistema):',
      '  1. Acesse Estoque (F6)',
      '  2. Compare a coluna "Estoque Atual" com a contagem física dos produtos',
      '  3. Para cada produto com divergência, clique em "Ajuste Manual"',
      '  4. Selecione o tipo "AJUSTE" e informe a quantidade EXATA contada fisicamente',
      '  5. O sistema calcula automaticamente a diferença e registra a movimentação',
      'EXEMPLO: Se o sistema mostra 47 unidades e você contou 50, faça um AJUSTE para 50. O sistema registrará uma ENTRADA de 3 unidades.',
      'DICA: Recomende-se fazer inventário mensal ou trimestral para manter a confiabilidade dos dados.',
    ]
  },

  // ─── TEMA / APARÊNCIA ────────────────────────────────
  {
    palavras: ['tema', 'aparência', 'aparencia', 'cor', 'cores', 'dark', 'claro', 'escuro', 'visual'],
    titulo: 'Aparência do Sistema',
    respostas: [
      'O ConstruPro utiliza um design moderno com tema claro (fundo branco/cinza).',
      'A sidebar lateral é escura (slate-900) com destaque laranja para o item selecionado.',
      'O layout é responsivo com largura mínima de 1024px — funciona melhor em telas de 1280px ou maiores.',
      'Se precisar de ajustes visuais, entre em contato com a Msdos Informatica.',
    ]
  },

  // ─── EMPRESA / SOBRE ─────────────────────────────────
  {
    palavras: ['empresa', 'sobre', 'quem', 'desenvolvedor', 'criador', 'msdos', 'informatica', 'versão', 'versao', 'sistema'],
    titulo: 'Sobre o Sistema',
    respostas: [
      'ConstruPro ERP é um sistema de gestão desenvolvido pela Msdos Informatica.',
      'VERSÃO: 1.0.0',
      'FINALIDADE: Gestão completa para lojas de materiais de construção.',
      'MÓDULOS: Dashboard, Clientes, Fornecedores, Funcionários, Produtos, Estoque, Vendas (PDV), Financeiro, Relatórios e Backup.',
      'TECNOLOGIAS: Electron, React, TypeScript, SQLite, Tailwind CSS.',
      'BANCO DE DADOS: SQLite local (sem necessidade de servidor) — arquivo: construpro.db',
      'SUPORTE: Para dúvidas, suporte técnico ou sugestões, entre em contato com a Msdos Informatica.',
    ]
  },

  // ─── DÚVIDAS GERAIS ──────────────────────────────────
  {
    palavras: ['como', 'onde', 'o que', 'quais', 'por que', 'ajuda', 'dúvida', 'duvida', 'tutorial', 'aprender', 'usar', 'utilizar'],
    titulo: 'Dúvidas Gerais',
    respostas: [
      'Posso ajudar! Aqui estão os principais tópicos do sistema:',
      '  📊 Dashboard — Resumo financeiro e alertas',
      '  👥 Clientes — Cadastro e consulta (F2)',
      '  🏭 Fornecedores — Cadastro (F3)',
      '  👷 Funcionários — Cadastro (F4)',
      '  📦 Produtos — Catálogo e preços (F5)',
      '  📊 Estoque — Posição e movimentações (F6)',
      '  🛒 Vendas — PDV e orçamentos (F7)',
      '  💰 Financeiro — Caixa, pagar e receber (F8)',
      '  📈 Relatórios — Análises e gráficos (F9)',
      '  💾 Backup — Cópias de segurança (F10)',
      '  ❓ Ajuda — Guia completo (F11)',
      'Digite sua pergunta sobre qualquer um desses módulos!',
    ]
  },

  // ─── PRIMEIROS PASSOS ────────────────────────────────
  {
    palavras: ['primeiros passos', 'começar', 'comecar', 'começo', 'comeco', 'iniciar', 'início', 'instalação', 'instalacao', 'configurar', 'configuração', 'configuracao', 'setup'],
    titulo: 'Primeiros Passos',
    respostas: [
      'BEM-VINDO AO CONSTRUPRO! Siga estes passos para começar:',
      'PASSO 1 — DADOS DA EMPRESA: Configure os dados da sua loja (nome, endereço, telefone) que aparecerão nos relatórios e impressos.',
      'PASSO 2 — CADASTRE FORNECEDORES: Acesse Fornecedores (F3) e cadastre seus principais fornecedores.',
      'PASSO 3 — REVISE PRODUTOS: O sistema já vem com 50+ produtos pré-cadastrados. Acesse Produtos (F5), revise preços e estoques conforme sua realidade.',
      'PASSO 4 — CADASTRE CLIENTES: Acesse Clientes (F2) e cadastre seus clientes conforme forem aparecendo.',
      'PASSO 5 — COMECE A VENDER: Acesse Vendas (F7), clique em "Nova Venda" e faça sua primeira venda!',
      'PASSO 6 — FAÇA BACKUP: Ao final do dia, acesse Backup (F10) e salve uma cópia de segurança.',
      'DICA: Os produtos já cadastrados são apenas exemplos — edite nomes, preços e quantidades conforme os produtos da sua loja.',
    ]
  },

  // ─── MULTI-USUÁRIO ───────────────────────────────────
  {
    palavras: ['usuário', 'usuario', 'senha', 'senha', 'login', 'acesso', 'permissão', 'permissao', 'admin', 'administrador', 'bloquear', 'restrito'],
    titulo: 'Controle de Acesso',
    respostas: [
      'O ConstruPro ERP atualmente é um sistema single-user (um usuário por vez).',
      'Não há controle de acesso por senha ou perfis de usuário — qualquer pessoa com acesso ao computador pode usar o sistema.',
      'DICA: Para proteger o acesso, use a proteção de senha do próprio Windows (bloqueio de tela).',
      'Se precisar de controle de acesso multi-usuário, entre em contato com a Msdos Informatica para uma versão personalizada.',
    ]
  },

  // ─── ERROS E SOLUÇÕES ────────────────────────────────
  {
    palavras: ['erro', 'erro', 'problema', 'travou', 'travar', 'não funciona', 'nao funciona', 'bug', 'falha', 'crash'],
    titulo: 'Erros e Soluções',
    respostas: [
      'Se o sistema apresentou um erro, experimente estas soluções:',
      '  1. Feche e abra novamente o sistema (botão "Sair" na sidebar)',
      '  2. Se o erro persistir, faça um backup antes de qualquer ação',
      '  3. Verifique se o arquivo de banco de dados não está corrompido (restaure um backup anterior)',
      'PROBLEMAS COMUNS:',
      '  • "Banco de dados bloqueado" — Feche outras instâncias do ConstruPro abertas',
      '  • "Estoque negativo" — Verifique se há vendas duplicadas ou ajustes incorretos',
      '  • "Impressora não encontrada" — Verifique se a impressora está conectada e configurada no Windows',
      '  • "Leitor de código de barras não responde" — Verifique a conexão USB/Bluetooth',
      'Se o problema continuar, entre em contato com o suporte da Msdos Informatica.',
    ]
  },

  // ─── WHATSAPP ────────────────────────────────────────
  {
    palavras: ['whatsapp', 'whats', 'enviar whatsapp', 'compartilhar whatsapp', 'mensagem'],
    titulo: 'Enviar via WhatsApp',
    respostas: [
      'Para enviar os detalhes de uma venda pelo WhatsApp:',
      '  1. Acesse Vendas (F7)',
      '  2. Clique no ícone de olho (👁️) na venda desejada',
      '  3. Clique no botão "WhatsApp"',
      '  4. O WhatsApp Web abre automaticamente com a mensagem formatada',
      '  5. Selecione o contato do cliente e envie',
      'A mensagem inclui: número da venda, data, lista de itens (produto, quantidade, preço), total e forma de pagamento.',
      'PRÉ-REQUISITO: É necessário estar logado no WhatsApp Web (web.whatsapp.com) no navegador padrão do sistema.',
    ]
  },

  // ─── EXPORTAR CSV ────────────────────────────────────
  {
    palavras: ['csv', 'exportar', 'exportação', 'exportacao', 'excel', 'planilha', 'download'],
    titulo: 'Exportar Dados',
    respostas: [
      'O ConstruPro permite exportar dados em formato CSV (compatível com Excel, Google Sheets, LibreOffice).',
      'ONDE EXPORTAR:',
      '  • Relatórios → Produtos Mais Vendidos → botão "Exportar CSV"',
      'O arquivo CSV é salvo na pasta escolhida pelo usuário.',
      'DICA: Para exportar outros dados (clientes, produtos, etc.), entre em contato com a Msdos Informatica para personalização.',
    ]
  },
]

const SAUDACOES = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'hello', 'hi', 'e aí', 'eai', 'fala']
const AGRADECIMENTOS = ['obrigado', 'obrigada', 'valeu', 'thanks', 'brigado', 'brigada', 'agradeço']
const DESPEDIDAS = ['tchau', 'bye', 'até mais', 'ate mais', 'flw', 'falou', 'adeus']

function buscar(pergunta: string) {
  const q = pergunta.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  if (SAUDACOES.some(s => q.includes(s))) {
    return {
      titulo: null,
      respostas: ['Olá! Sou o assistente do ConstruPro ERP. Como posso ajudar?\n\nPode me perguntar sobre qualquer funcionalidade: Dashboard, Clientes, Fornecedores, Funcionários, Produtos, Estoque, Vendas, Financeiro, Relatórios, Backup e muito mais!']
    }
  }

  if (AGRADECIMENTOS.some(s => q.includes(s))) {
    return {
      titulo: null,
      respostas: ['De nada! Se precisar de mais alguma ajuda, é só perguntar. Estou aqui para ajudar! 😊']
    }
  }

  if (DESPEDIDAS.some(s => q.includes(s))) {
    return {
      titulo: null,
      respostas: ['Até mais! Qualquer dúvida, é só abrir o chat novamente. Bom trabalho! 👋']
    }
  }

  // Perguntas sobre como fazer algo específico
  if (q.includes('como cadastrar') || q.includes('como criar') || q.includes('como adicionar') || q.includes('como registrar')) {
    if (q.includes('cliente')) {
      const t = BASE.find(b => b.titulo === 'Clientes')
      return t || { titulo: null, respostas: ['Acesse Clientes (F2) → "Novo Cliente" → preencha os dados → Salve.'] }
    }
    if (q.includes('produto')) {
      const t = BASE.find(b => b.titulo === 'Produtos')
      return t || { titulo: null, respostas: ['Acesse Produtos (F5) → "Novo Produto" → preencha os dados → Salve.'] }
    }
    if (q.includes('venda')) {
      const t = BASE.find(b => b.titulo === 'Vendas')
      return t || { titulo: null, respostas: ['Acesse Vendas (F7) → "Nova Venda" → selecione tipo e produtos → Confirme.'] }
    }
    if (q.includes('fornecedor')) {
      const t = BASE.find(b => b.titulo === 'Fornecedores')
      return t || { titulo: null, respostas: ['Acesse Fornecedores (F3) → "Novo Fornecedor" → preencha → Salve.'] }
    }
    if (q.includes('funcionário') || q.includes('funcionario')) {
      const t = BASE.find(b => b.titulo === 'Funcionários')
      return t || { titulo: null, respostas: ['Acesse Funcionários (F4) → "Novo Funcionário" → preencha → Salve.'] }
    }
  }

  let melhor: { titulo: string | null; respostas: string[]; score: number } = { titulo: null, respostas: [], score: 0 }

  for (const topico of BASE) {
    const score = topico.palavras.reduce((acc, p) => {
      const pNorm = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const palavrasQ = q.split(/\s+/)
      let hits = 0
      if (q.includes(pNorm)) hits += pNorm.split(' ').length
      for (const pw of palavrasQ) {
        if (pw.length >= 3 && pNorm.includes(pw)) hits += 1
      }
      return acc + hits
    }, 0)
    if (score > melhor.score) melhor = { titulo: topico.titulo, respostas: topico.respostas, score }
  }

  if (melhor.score === 0) {
    return {
      titulo: null,
      respostas: [
        'Não encontrei uma resposta exata para isso. Tente perguntar sobre:\n\n' +
        '📊 Dashboard · 👥 Clientes · 🏭 Fornecedores · 👷 Funcionários\n' +
        '📦 Produtos · 📊 Estoque · 🛒 Vendas · 💰 Financeiro\n' +
        '📈 Relatórios · 💾 Backup · 📋 Categorias · 💳 Pagamento\n\n' +
        'Ou digite palavras-chave como: "como cadastrar cliente", "cancelar venda", "estoque mínimo", etc.'
      ]
    }
  }

  return melhor
}

interface Msg { de: 'user' | 'bot'; texto: string; titulo?: string | null }

export default function ChatAjuda() {
  const [aberto, setAberto] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    { de: 'bot', texto: 'Olá! Sou o assistente do ConstruPro ERP. Pode me perguntar sobre qualquer funcionalidade do sistema.\n\nExemplos:\n• "Como cadastrar um cliente?"\n• "Como cancelar uma venda?"\n• "O que é estoque mínimo?"\n• "Como usar o leitor de código de barras?"', titulo: null }
  ])
  const [input, setInput] = useState('')
  const [sugestoes] = useState([
    'Como cadastrar produto',
    'Estoque mínimo',
    'Formas de pagamento',
    'Backup do sistema',
    'Atalhos de teclado',
  ])
  const fimRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, aberto])

  function enviar(texto?: string) {
    const q = (texto || input).trim()
    if (!q) return
    const resultado = buscar(q)
    setMsgs(p => [
      ...p,
      { de: 'user', texto: q },
      { de: 'bot', texto: resultado.respostas.join('\n\n'), titulo: resultado.titulo }
    ])
    setInput('')
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setAberto(p => !p)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        title="Assistente de Ajuda"
      >
        {aberto ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Janela do chat */}
      {aberto && (
        <div className="fixed bottom-20 right-6 z-40 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden" style={{ height: 520 }}>
          {/* Header */}
          <div className="bg-slate-900 px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="text-white text-sm font-semibold">Assistente ConstruPro</div>
              <div className="text-slate-400 text-xs flex items-center gap-1">
                <Sparkles size={10} />
                Manual interno do sistema · sempre disponível
              </div>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.de === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.de === 'bot' && (
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={12} className="text-orange-500" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.de === 'user' ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'}`}>
                  {m.de === 'bot' && m.titulo && (
                    <div className="font-bold text-orange-600 text-xs mb-1 uppercase tracking-wide">{m.titulo}</div>
                  )}
                  {m.texto.split('\n').map((l, j) => (
                    <span key={j}>{l}{j < m.texto.split('\n').length - 1 && <br />}</span>
                  ))}
                </div>
                {m.de === 'user' && (
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <User size={12} className="text-white" />
                  </div>
                )}
              </div>
            ))}
            <div ref={fimRef} />
          </div>

          {/* Sugestões (apenas se poucas mensagens) */}
          {msgs.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {sugestoes.map((s, i) => (
                <button
                  key={i}
                  onClick={() => enviar(s)}
                  className="text-xs bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-2.5 py-1 hover:bg-orange-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0">
            <input
              className="input flex-1 text-sm py-1.5"
              placeholder="Digite sua dúvida..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviar()}
              autoFocus
            />
            <button
              className="w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center shrink-0 transition-colors"
              onClick={() => enviar()}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
