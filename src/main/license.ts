import https from 'https'
import log from 'electron-log'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

const LICENSE_SERVER = 'https://construpro-updater.vercel.app/api/license'
const TOKEN_FILE = 'activation.dat'

function getTokenPath(): string {
  return path.join(app.getPath('userData'), TOKEN_FILE)
}

function loadLocalToken(): string | null {
  try {
    return fs.readFileSync(getTokenPath(), 'utf-8').trim()
  } catch {
    return null
  }
}

function saveLocalToken(token: string): void {
  try {
    fs.writeFileSync(getTokenPath(), token, 'utf-8')
  } catch {}
}

function validateWithServer(token: string): Promise<any> {
  return new Promise((resolve) => {
    const url = new URL(LICENSE_SERVER + '?token=' + encodeURIComponent(token))
    const req = https.get({
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: { 'User-Agent': 'ConstruPro-ERP-License' },
      timeout: 10000
    }, (res) => {
      if (res.statusCode !== 200) { resolve(null); return }
      let data = ''
      res.on('data', (chunk: string) => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch { resolve(null) }
      })
    })
    req.on('timeout', () => { req.destroy(); resolve(null) })
    req.on('error', () => { resolve(null) })
  })
}

export interface LicenseStatus {
  valid: boolean
  status: string
  expires: string
  daysLeft: number
  message: string
  company?: string
}

export async function checkLicense(): Promise<LicenseStatus> {
  const token = loadLocalToken()

  // Sem token → precisa ativar
  if (!token) {
    return {
      valid: false,
      status: 'no_token',
      expires: '',
      daysLeft: 0,
      message: 'Sistema não ativado. Digite seu token de ativação.'
    }
  }

  // Validar com servidor
  const remote = await validateWithServer(token)

  if (remote) {
    return {
      valid: remote.valid,
      status: remote.status,
      expires: remote.expires || '',
      daysLeft: remote.daysLeft || 0,
      message: remote.message,
      company: remote.company
    }
  }

  // Offline → permitir uso se token existe (cache local)
  return {
    valid: true,
    status: 'offline',
    expires: '9999-12-31',
    daysLeft: 99999,
    message: 'Sem conexão. Verificação pendente.'
  }
}

export function activateToken(token: string): boolean {
  saveLocalToken(token.toUpperCase())
  return true
}

export function getActivationToken(): string | null {
  return loadLocalToken()
}
