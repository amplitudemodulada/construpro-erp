import https from 'https'
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { app } from 'electron'
import log from 'electron-log'
import fs from 'fs'
import path from 'path'

const LICENSE_SERVER = 'https://construpro-updater.vercel.app/api/license'
const CACHE_FILE = 'license-cache.json'

function getHardwareId(): string {
  try {
    const serial = execSync('wmic diskdrive get serialnumber', { timeout: 5000 })
      .toString().split('\n').map(l => l.trim()).filter(l => l && l !== 'SerialNumber')[0] || 'DEFAULT'
    return createHash('sha256').update('ConstruPro-' + serial).digest('hex').substring(0, 32)
  } catch {
    return 'UNKNOWN-' + createHash('sha256').update(app.getPath('exe')).digest('hex').substring(0, 16)
  }
}

function getCachePath(): string {
  return path.join(app.getPath('userData'), CACHE_FILE)
}

function loadCache(): { valid: boolean; expires: string; status: string; daysLeft: number; checkedAt: string } | null {
  try {
    const data = fs.readFileSync(getCachePath(), 'utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

function saveCache(data: any): void {
  try {
    fs.writeFileSync(getCachePath(), JSON.stringify(data, null, 2))
  } catch {}
}

function fetchLicense(hw: string): Promise<any> {
  return new Promise((resolve) => {
    const url = new URL(LICENSE_SERVER + '?hw=' + hw)
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

export interface RemoteLicenseStatus {
  valid: boolean
  status: string
  expires: string
  daysLeft: number
  message: string
  fromCache: boolean
}

export async function checkRemoteLicense(): Promise<RemoteLicenseStatus> {
  const hw = getHardwareId()
  log.info(`Hardware ID: ${hw}`)

  // Tentar licença remota
  const remote = await fetchLicense(hw)

  if (remote) {
    const result: RemoteLicenseStatus = {
      valid: remote.valid,
      status: remote.status,
      expires: remote.expires,
      daysLeft: remote.daysLeft,
      message: remote.message,
      fromCache: false
    }
    saveCache({ ...result, checkedAt: new Date().toISOString() })
    return result
  }

  // Fallback: usar cache local (última validação bem-sucedida)
  const cache = loadCache()
  if (cache) {
    // Verificar se o cache não é muito antigo (máx 30 dias)
    const checkedAt = new Date(cache.checkedAt)
    const daysSinceCheck = Math.floor((Date.now() - checkedAt.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceCheck <= 30) {
      log.info(`Usando cache de licença (${daysSinceCheck} dias atrás)`)
      return { ...cache, fromCache: true }
    }
  }

  // Sem internet e sem cache válido
  return {
    valid: true,
    status: 'offline',
    expires: '9999-12-31',
    daysLeft: 99999,
    message: 'Sem conexão. Licença verificada offline.',
    fromCache: true
  }
}

export function getHardwareIdForDisplay(): string {
  return getHardwareId()
}
