import https from 'https'
import log from 'electron-log'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

const LICENSE_SERVER = 'https://construpro-updater.vercel.app/api/license'
const TOKEN_FILE = 'activation.dat'
const CHECK_INTERVAL = 60 * 60 * 1000 // 1 hora

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

function fetchLicense(token: string): Promise<any> {
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

// Cache da última validação bem-sucedida
let lastValidStatus: LicenseStatus | null = null

export async function checkLicense(): Promise<LicenseStatus> {
  const token = loadLocalToken()

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
  const remote = await fetchLicense(token)

  if (remote) {
    const result: LicenseStatus = {
      valid: remote.valid,
      status: remote.status,
      expires: remote.expires || '',
      daysLeft: remote.daysLeft || 0,
      message: remote.message,
      company: remote.company
    }

    if (result.valid) {
      lastValidStatus = result
    }

    return result
  }

  // Offline → usar último status válido (máx 24h)
  if (lastValidStatus) {
    log.info('Offline, usando último status válido')
    return { ...lastValidStatus, message: 'Sem conexão. Licença verificada anteriormente.' }
  }

  // Sem cache prévio + offline = bloquear
  return {
    valid: false,
    status: 'offline_first',
    expires: '',
    daysLeft: 0,
    message: 'Conecte-se à internet para ativar o sistema.'
  }
}

export function activateToken(token: string): boolean {
  saveLocalToken(token.toUpperCase())
  return true
}

export function getActivationToken(): string | null {
  return loadLocalToken()
}

// Verificação periódica (chamar no initUpdater)
let periodicTimer: NodeJS.Timeout | null = null

export function startPeriodicCheck(onStatusChange: (status: LicenseStatus) => void): void {
  if (periodicTimer) return

  periodicTimer = setInterval(async () => {
    const status = await checkLicense()
    if (!status.valid) {
      onStatusChange(status)
    }
  }, CHECK_INTERVAL)

  log.info('Verificação periódica de licença iniciada (1h)')
}

export function stopPeriodicCheck(): void {
  if (periodicTimer) {
    clearInterval(periodicTimer)
    periodicTimer = null
  }
}
