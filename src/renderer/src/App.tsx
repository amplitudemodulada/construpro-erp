import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { ToastProvider } from './components/Toast'
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
  return (
    <ToastProvider>
      <HashRouter>
        <Layout>
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
