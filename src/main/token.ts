import fs from 'fs'
import path from 'path'
import { app, dialog, BrowserWindow } from 'electron'

interface TokenData {
  token: string
  validade: string
  empresa: string
  mensagem: string
}

const TOKEN_FILE = 'token.json'

function getTokenPath(): string {
  const exePath = app.getPath('exe')
  const tokenPath = path.join(path.dirname(exePath), TOKEN_FILE)
  if (fs.existsSync(tokenPath)) return tokenPath

  const appPath = path.join(path.dirname(exePath), '..', TOKEN_FILE)
  if (fs.existsSync(appPath)) return appPath

  const rootPath = path.join(process.cwd(), TOKEN_FILE)
  if (fs.existsSync(rootPath)) return rootPath

  return tokenPath
}

export function loadToken(): TokenData | null {
  try {
    const tokenPath = getTokenPath()
    if (!fs.existsSync(tokenPath)) return null
    const data = fs.readFileSync(tokenPath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function saveToken(data: TokenData): void {
  const tokenPath = getTokenPath()
  fs.writeFileSync(tokenPath, JSON.stringify(data, null, 2))
}

export function isTokenValid(): { valid: boolean; message: string; daysLeft?: number } {
  const token = loadToken()

  if (!token) {
    return { valid: false, message: 'Arquivo de licença não encontrado.' }
  }

  if (!token.token || !token.validade) {
    return { valid: false, message: 'Licença inválida.' }
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const validade = new Date(token.validade + 'T23:59:59')

  if (hoje > validade) {
    return {
      valid: false,
      message: `Licença expirada em ${token.validade}.\nEntre em contato com ${token.empresa}.`
    }
  }

  const diffMs = validade.getTime() - hoje.getTime()
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (daysLeft <= 30) {
    return {
      valid: true,
      message: `Sua licença expira em ${daysLeft} dia(s) (${token.validade}).\nEntre em contato com ${token.empresa} para renovação.`,
      daysLeft
    }
  }

  return {
    valid: true,
    message: token.mensagem || 'Licença válida.',
    daysLeft
  }
}

export function getTokenInfo(): { token: string; validade: string; empresa: string; diasRestantes: number } | null {
  const token = loadToken()
  if (!token) return null

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const validade = new Date(token.validade + 'T23:59:59')
  const diffMs = validade.getTime() - hoje.getTime()
  const diasRestantes = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

  return {
    token: token.token,
    validade: token.validade,
    empresa: token.empresa,
    diasRestantes
  }
}
