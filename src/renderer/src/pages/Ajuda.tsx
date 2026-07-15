import { useState } from 'react'
import {
  LayoutDashboard, Users, Truck, UserCheck, Package,
  Layers, ShoppingCart, DollarSign, Database,
  ChevronDown, ChevronRight, HelpCircle, Barcode, RefreshCw
} from 'lucide-react'

const topicos = [
  {
    icon: LayoutDashboard,
    titulo: 'Dashboard — Visão Geral',
    cor: 'text-blue-600',
    bg: 'bg-blue-50',
    passos: [
      'Ao abrir o sistema, o Dashboard exibe um resumo financeiro do mês atual.',
      'Os cards mostram: Receitas, Despesas, Saldo do mês, Qtd. de Vendas, Contas a Vencer em 7 dias e Total a Receber.',
      'A tabela de alertas lista produtos com estoque abaixo do mínimo configurado.',
      'Use o Dashboard para identificar rapidamente a situação financeira e de estoque.',
    ]
  },
  {
    icon: Users,
    titulo: 'Clientes — Cadastro e Consulta',
    cor: 'text-green-600',
    bg: 'bg-green-50',
    passos: [
      'Acesse o menu Clientes para listar todos os clientes cadastrados.',
      'Use a barra de busca para filtrar por nome, CPF/CNPJ ou telefone.',
      'Clique em "Novo Cliente" para abrir o formulário de cadastro.',
      'Preencha os dados: nome, tipo (PF ou PJ), CPF/CNPJ, endereço, telefone e e-mail.',
      'Clique em "Salvar" para confirmar o cadastro.',
      'Para editar, clique no ícone de lápis na linha do cliente.',
      'Para excluir (desativar), clique no ícone de lixeira — o cliente não é apagado, apenas desativado.',
    ]
  },
  {
    icon: Truck,
    titulo: 'Fornecedores — Cadastro e Consulta',
    cor: 'text-purple-600',
    bg: 'bg-purple-50',
    passos: [
      'Acesse o menu Fornecedores para gerenciar seus fornecedores.',
      'Clique em "Novo Fornecedor" para cadastrar um novo.',
      'Preencha razão social, CNPJ, dados de contato e endereço.',
      'O campo "Contato" serve para o nome do representante ou comprador.',
      'Fornecedores cadastrados aparecem nas telas de Contas a Pagar para vinculação.',
    ]
  },
  {
    icon: UserCheck,
    titulo: 'Funcionários — Cadastro e Salários',
    cor: 'text-orange-600',
    bg: 'bg-orange-50',
    passos: [
      'Acesse o menu Funcionários para gerenciar a equipe.',
      'Clique em "Novo Funcionário" e preencha nome, cargo e salário.',
      'Informe data de admissão para controle de tempo de empresa.',
      'Funcionários cadastrados podem ser vinculados às vendas como vendedor responsável.',
      'Ao desativar um funcionário, ele deixa de aparecer nas listas de seleção.',
    ]
  },
  {
    icon: Package,
    titulo: 'Produtos — Cadastro e Preços',
    cor: 'text-yellow-600',
    bg: 'bg-yellow-50',
    passos: [
      'Acesse Produtos para visualizar e gerenciar o catálogo de mercadorias.',
      'Clique em "Novo Produto" para cadastrar um item.',
      'Informe: nome, categoria, unidade de medida, preço de custo e preço de venda.',
      'O campo "Estoque Mínimo" define o limite para alertas automáticos no Dashboard.',
      'O sistema já vem com 12 categorias e mais de 50 produtos de construção pré-cadastrados.',
      'A coluna Estoque fica em amarelo (baixo) ou vermelho (zerado) automaticamente.',
      'Para alterar preços, clique no lápis e edite os valores — o estoque não é alterado aqui.',
    ]
  },
  {
    icon: Layers,
    titulo: 'Estoque — Entradas, Saídas e Histórico',
    cor: 'text-teal-600',
    bg: 'bg-teal-50',
    passos: [
      'Acesse Estoque para controlar a posição e movimentações dos produtos.',
      'A aba "Posição de Estoque" lista todos os produtos com saldo atual.',
      'A aba "Histórico" exibe todas as movimentações registradas.',
      'Clique em "Ajuste Manual" para registrar uma movimentação sem o leitor:',
      '  • ENTRADA: adiciona quantidade ao estoque (ex: recebimento de mercadoria).',
      '  • SAÍDA: retira quantidade do estoque (ex: quebra, uso interno).',
      '  • AJUSTE: define a quantidade exata (ex: após inventário físico).',
      'As vendas registradas baixam o estoque automaticamente.',
      'O cancelamento de uma venda devolve os itens ao estoque automaticamente.',
    ]
  },
  {
    icon: Barcode,
    titulo: 'Leitor de Código de Barras — Estoque e Vendas',
    cor: 'text-cyan-600',
    bg: 'bg-cyan-50',
    passos: [
      'O sistema é compatível com qualquer leitor de código de barras USB ou Bluetooth.',
      'O leitor funciona como teclado — nenhum driver especial é necessário.',
      'Conecte o leitor ao computador (USB) ou emparelhe via Bluetooth antes de usar.',
      '',
      'USO NO ESTOQUE (entrada de mercadoria):',
      '  • Acesse o menu Estoque — o campo do leitor já estará em foco automaticamente.',
      '  • Aponte o leitor para o código de barras do produto e escaneie.',
      '  • O produto é identificado e o modal de entrada abre com o produto já preenchido.',
      '  • Digite a quantidade recebida e pressione Enter para confirmar.',
      '  • O foco retorna ao leitor automaticamente para o próximo produto.',
      '  • Se o código não for encontrado, uma mensagem em vermelho é exibida.',
      '',
      'USO NAS VENDAS (PDV):',
      '  • Abra uma Nova Venda — o campo do leitor aparece no topo do formulário.',
      '  • Escaneie o produto — ele é adicionado ao carrinho instantaneamente.',
      '  • Escanear o mesmo produto novamente incrementa a quantidade em +1.',
      '  • Você ainda pode buscar produtos por nome no campo abaixo.',
      '',
      'PRÉ-REQUISITO: o código de barras deve estar cadastrado no produto.',
      '  • Acesse Produtos → clique no lápis para editar → preencha "Código de Barras".',
      '  • O código pode ser EAN-13, EAN-8, Code 128 ou qualquer padrão suportado pelo leitor.',
    ]
  },
  {
    icon: ShoppingCart,
    titulo: 'Vendas — Orçamentos e Vendas',
    cor: 'text-indigo-600',
    bg: 'bg-indigo-50',
    passos: [
      'Acesse Vendas para registrar e consultar todas as vendas e orçamentos.',
      'Clique em "Nova Venda" para abrir o formulário.',
      'Selecione o Tipo: "Venda" (confirma e baixa estoque) ou "Orçamento" (não baixa estoque).',
      'Opcionalmente vincule um Cliente e um Vendedor.',
      'Na busca de produtos, digite o nome para localizar e clique para adicionar ao carrinho.',
      'Ajuste quantidade e preço unitário diretamente na tabela de itens.',
      'Informe a forma de pagamento e desconto geral se houver.',
      'Clique em "Confirmar Venda" — o estoque é baixado automaticamente.',
      'Para cancelar uma venda, clique no X na listagem — o estoque retorna automaticamente.',
      'Use os filtros de status (Confirmada, Orçamento, Cancelada) para consultar.',
    ]
  },
  {
    icon: DollarSign,
    titulo: 'Financeiro — Caixa, Contas a Pagar e Receber',
    cor: 'text-emerald-600',
    bg: 'bg-emerald-50',
    passos: [
      'Selecione o período desejado no topo da tela (data início e data fim).',
      'Os 3 cards resumem Receitas, Despesas e Saldo do período.',
      'Aba "Caixa": mostra o extrato de todas as entradas e saídas no período.',
      'Aba "Contas a Pagar":',
      '  • Clique em "Nova Conta a Pagar" para lançar uma despesa futura.',
      '  • Clique em "Pagar" para registrar o pagamento e lançar no caixa.',
      '  • Contas vencidas aparecem em vermelho automaticamente.',
      'Aba "Contas a Receber":',
      '  • Clique em "Nova Conta a Receber" para lançar um recebimento futuro.',
      '  • Clique em "Receber" para confirmar o recebimento e lançar no caixa.',
      'As vendas confirmadas são lançadas no caixa como Receita automaticamente.',
    ]
  },
  {
    icon: Database,
    titulo: 'Backup — Cópias de Segurança',
    cor: 'text-rose-600',
    bg: 'bg-rose-50',
    passos: [
      'Acesse o menu Backup para proteger os dados do sistema.',
      'Clique em "Fazer Backup Agora" — escolha onde salvar o arquivo (.db).',
      'Recomenda-se fazer backup diariamente ao final do expediente.',
      'Para restaurar: clique em "Restaurar de Arquivo..." e selecione o arquivo de backup.',
      'Antes de restaurar, um backup automático do banco atual é criado na pasta de dados.',
      'Após a restauração, o sistema reinicia automaticamente para aplicar as alterações.',
      'Guarde backups em pen drive ou HD externo, fora do computador do sistema.',
    ]
  },
]

export default function Ajuda() {
  const [aberto, setAberto] = useState<number | null>(0)
  const [verificando, setVerificando] = useState(false)

  const verificarAtualizacao = async () => {
    setVerificando(true)
    try {
      await window.api.update.check()
    } catch {
      alert('Erro ao verificar atualização')
    } finally {
      setVerificando(false)
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Central de Ajuda</h1>
        <p className="text-slate-500 text-sm mt-1">Guia completo de utilização do ConstruPro ERP</p>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3">
        <HelpCircle size={20} className="text-orange-500 shrink-0 mt-0.5" />
        <div className="text-sm text-orange-800">
          Clique em qualquer módulo abaixo para ver o passo a passo detalhado.
          Em caso de dúvidas, entre em contato com o suporte da <strong>Msdos Informatica</strong>.
        </div>
      </div>

      <div className="space-y-2">
        {topicos.map((t, idx) => {
          const Icon = t.icon
          const isOpen = aberto === idx
          return (
            <div key={idx} className="card p-0 overflow-hidden">
              <button
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setAberto(isOpen ? null : idx)}
              >
                <div className={`w-9 h-9 ${t.bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={t.cor} />
                </div>
                <span className="font-semibold text-slate-800 flex-1">{t.titulo}</span>
                {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  <ol className="mt-3 space-y-2">
                    {(() => {
                      let contador = 0
                      return t.passos.map((passo, i) => {
                        // Linha vazia — separador visual
                        if (passo === '') return <li key={i} className="h-2" />

                        // Título de seção (tudo maiúsculo e termina com :)
                        if (/^[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ\s]+:$/.test(passo.trim())) {
                          return (
                            <li key={i} className="pt-1">
                              <span className={`text-xs font-bold uppercase tracking-wide ${t.cor}`}>{passo}</span>
                            </li>
                          )
                        }

                        // Sub-item com bullet
                        if (passo.startsWith('  •')) {
                          return (
                            <li key={i} className="flex gap-2 pl-6 text-sm text-slate-500">
                              <span className="mt-0.5 shrink-0">•</span>
                              <span>{passo.replace('  • ', '')}</span>
                            </li>
                          )
                        }

                        // Item numerado normal
                        contador++
                        const num = contador
                        return (
                          <li key={i} className="flex gap-3 text-sm text-slate-700">
                            <span className={`w-5 h-5 ${t.bg} ${t.cor} rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5`}>
                              {num}
                            </span>
                            <span>{passo}</span>
                          </li>
                        )
                      })
                    })()}
                  </ol>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="card p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold text-slate-800">Verificar Atualizações</div>
          <div className="text-sm text-slate-500">Versão 1.0.0 — Verifique se há novas versões disponíveis</div>
        </div>
        <button
          onClick={verificarAtualizacao}
          disabled={verificando}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={16} className={verificando ? 'animate-spin' : ''} />
          {verificando ? 'Verificando...' : 'Verificar Agora'}
        </button>
      </div>

      <div className="card bg-slate-800 text-white text-center">
        <div className="font-bold text-lg">Msdos Informatica</div>
        <div className="text-slate-400 text-sm mt-1">Suporte técnico especializado</div>
        <div className="text-slate-300 text-sm mt-2">
          Para dúvidas, suporte ou sugestões de melhoria, entre em contato conosco.
        </div>
      </div>
    </div>
  )
}
