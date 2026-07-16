import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  license: {
    check: () => ipcRenderer.invoke('license:check'),
    activate: (token: string) => ipcRenderer.invoke('license:activate', token),
    token: () => ipcRenderer.invoke('license:token'),
    onBlocked: (callback: (status: any) => void) => {
      ipcRenderer.on('license:blocked', (_, status) => callback(status))
    },
    onOk: (callback: (status: any) => void) => {
      ipcRenderer.on('license:ok', (_, status) => callback(status))
    },
  },
  clientes: {
    listar: (filtro?: string) => ipcRenderer.invoke('clientes:listar', filtro),
    buscarPorId: (id: number) => ipcRenderer.invoke('clientes:buscarPorId', id),
    criar: (data: any) => ipcRenderer.invoke('clientes:criar', data),
    atualizar: (id: number, data: any) => ipcRenderer.invoke('clientes:atualizar', id, data),
    excluir: (id: number) => ipcRenderer.invoke('clientes:excluir', id),
    historico: (id: number) => ipcRenderer.invoke('clientes:historico', id),
  },
  fornecedores: {
    listar: (filtro?: string) => ipcRenderer.invoke('fornecedores:listar', filtro),
    buscarPorId: (id: number) => ipcRenderer.invoke('fornecedores:buscarPorId', id),
    criar: (data: any) => ipcRenderer.invoke('fornecedores:criar', data),
    atualizar: (id: number, data: any) => ipcRenderer.invoke('fornecedores:atualizar', id, data),
    excluir: (id: number) => ipcRenderer.invoke('fornecedores:excluir', id),
  },
  funcionarios: {
    listar: () => ipcRenderer.invoke('funcionarios:listar'),
    buscarPorId: (id: number) => ipcRenderer.invoke('funcionarios:buscarPorId', id),
    criar: (data: any) => ipcRenderer.invoke('funcionarios:criar', data),
    atualizar: (id: number, data: any) => ipcRenderer.invoke('funcionarios:atualizar', id, data),
    excluir: (id: number) => ipcRenderer.invoke('funcionarios:excluir', id),
  },
  produtos: {
    listar: (filtro?: string) => ipcRenderer.invoke('produtos:listar', filtro),
    buscarPorId: (id: number) => ipcRenderer.invoke('produtos:buscarPorId', id),
    estoqueMinimo: () => ipcRenderer.invoke('produtos:estoqueMinimo'),
    categorias: () => ipcRenderer.invoke('produtos:categorias'),
    criar: (data: any) => ipcRenderer.invoke('produtos:criar', data),
    atualizar: (id: number, data: any) => ipcRenderer.invoke('produtos:atualizar', id, data),
    excluir: (id: number) => ipcRenderer.invoke('produtos:excluir', id),
    buscarPorBarras: (codigo: string) => ipcRenderer.invoke('produtos:buscarPorBarras', codigo),
  },
  estoque: {
    movimentacoes: (produtoId?: number) => ipcRenderer.invoke('estoque:movimentacoes', produtoId),
    ajustar: (data: any) => ipcRenderer.invoke('estoque:ajustar', data),
  },
  vendas: {
    listar: (filtros?: any) => ipcRenderer.invoke('vendas:listar', filtros),
    buscarPorId: (id: number) => ipcRenderer.invoke('vendas:buscarPorId', id),
    criar: (data: any) => ipcRenderer.invoke('vendas:criar', data),
    cancelar: (id: number) => ipcRenderer.invoke('vendas:cancelar', id),
  },
  financeiro: {
    contasPagar: (filtros?: any) => ipcRenderer.invoke('financeiro:contasPagar', filtros),
    criarContaPagar: (data: any) => ipcRenderer.invoke('financeiro:criarContaPagar', data),
    pagarConta: (id: number, data: any) => ipcRenderer.invoke('financeiro:pagarConta', id, data),
    contasReceber: (filtros?: any) => ipcRenderer.invoke('financeiro:contasReceber', filtros),
    criarContaReceber: (data: any) => ipcRenderer.invoke('financeiro:criarContaReceber', data),
    receberConta: (id: number, data: any) => ipcRenderer.invoke('financeiro:receberConta', id, data),
    caixa: (periodo: any) => ipcRenderer.invoke('financeiro:caixa', periodo),
    resumo: (periodo: any) => ipcRenderer.invoke('financeiro:resumo', periodo),
    adicionarCaixa: (data: any) => ipcRenderer.invoke('financeiro:adicionarCaixa', data),
  },
  relatorios: {
    vendasPorPeriodo: (inicio: string, fim: string) => ipcRenderer.invoke('relatorios:vendasPorPeriodo', inicio, fim),
    produtosMaisVendidos: (inicio: string, fim: string) => ipcRenderer.invoke('relatorios:produtosMaisVendidos', inicio, fim),
    estoque: () => ipcRenderer.invoke('relatorios:estoque'),
    lucroBruto: (inicio: string, fim: string) => ipcRenderer.invoke('relatorios:lucroBruto', inicio, fim),
  },
  backup: {
    exportar: () => ipcRenderer.invoke('backup:exportar'),
    restaurar: () => ipcRenderer.invoke('backup:restaurar'),
    caminhoBanco: () => ipcRenderer.invoke('backup:caminhoBanco'),
  },
  app: {
    sair: () => ipcRenderer.invoke('app:sair'),
    reiniciar: () => ipcRenderer.invoke('app:reiniciar'),
    version: () => ipcRenderer.invoke('app:version'),
    info: () => ipcRenderer.invoke('app:info'),
  },
  update: {
    check: () => ipcRenderer.invoke('update:check'),
    checkSilent: () => ipcRenderer.invoke('update:check-silent'),
    latest: () => ipcRenderer.invoke('update:latest'),
  },
  print: {
    direct: (html: string, options?: { silent?: boolean; printerName?: string; landscape?: boolean }) =>
      ipcRenderer.invoke('print:direct', html, options),
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
