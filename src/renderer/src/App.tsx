import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { ToastProvider } from './components/Toast'
import Ativacao from './pages/Ativacao'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Fornecedores from './pages/Fornecedores'
import Funcionarios from './pages/Funcionarios'
import Produtos from './pages/Produtos'
import Estoque from './pages/Estoque'
import Vendas from './pages/Vendas'
import Financeiro from './pages/Financeiro'
import Backup from './pages/Backup'
import Ajuda from './pages/Ajuda'
import Relatorios from './pages/Relatorios'

declare global {
  interface Window {
    api: any
  }
}

export default function App() {
  const [licensed, setLicensed] = useState<boolean | null>(null)
  const [licenseStatus, setLicenseStatus] = useState<any>(null)

  useEffect(() => {
    // Verificar licença ao carregar
    window.api.license.check().then((status: any) => {
      setLicenseStatus(status)
      setLicensed(status.valid)
    }).catch(() => {
      // Erro de conexão → permitir uso (offline)
      setLicensed(true)
    })

    // Escutar bloqueio remoto
    window.api.license.onBlocked((status: any) => {
      setLicenseStatus(status)
      setLicensed(false)
    })

    // Escutar licença OK
    window.api.license.onOk((status: any) => {
      setLicenseStatus(status)
      setLicensed(true)
    })
  }, [])

  // Carregando
  if (licensed === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    )
  }

  // Sem licença → tela de ativação
  if (!licensed) {
    return (
      <ToastProvider>
        <Ativacao onActivate={() => {
          window.api.license.check().then((status: any) => {
            setLicenseStatus(status)
            setLicensed(status.valid)
          })
        }} />
      </ToastProvider>
    )
  }

  // Licenciado → sistema normal
  return (
    <ToastProvider>
      <HashRouter>
        <Layout licenseStatus={licenseStatus}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/fornecedores" element={<Fornecedores />} />
            <Route path="/funcionarios" element={<Funcionarios />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/backup" element={<Backup />} />
            <Route path="/ajuda" element={<Ajuda />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </HashRouter>
    </ToastProvider>
  )
}
