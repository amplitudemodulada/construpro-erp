import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto'

interface TokenData {
  token: string
  validade: string
  empresa: string
  mensagem: string
}

const TOKEN_FILE = 'token.dat'
const SECRET = 'ConstruPro#2026!Msdos'

function getTokenPaths(): string[] {
  const exeDir = path.dirname(app.getPath('exe'))
  const userData = app.getPath('userData')
  const appPath = app.getAppPath()

  return [
    path.join(userData, TOKEN_FILE),
    path.join(exeDir, TOKEN_FILE),
    path.join(appPath, TOKEN_FILE),
    path.join(process.cwd(), TOKEN_FILE),
    path.join(__dirname, '..', '..', TOKEN_FILE),
  ]
}

function encrypt(data: string): string {
  const iv = randomBytes(16)
  const key = createHash('sha256').update(SECRET).digest()
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(data, 'utf-8', 'hex')
  encrypted += cipher.final('hex')
  const checksum = createHash('md5').update(data).digest('hex')
  return iv.toString('hex') + ':' + encrypted + ':' + checksum
}

function decrypt(encryptedData: string): string | null {
  try {
    const parts = encryptedData.split(':')
    if (parts.length !== 3) return null
    const [ivHex, encrypted, checksum] = parts
    const key = createHash('sha256').update(SECRET).digest()
    const decipher = createDecipheriv('aes-256-cbc', key, Buffer.from(ivHex, 'hex'))
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8')
    decrypted += decipher.final('utf-8')
    const verifyChecksum = createHash('md5').update(decrypted).digest('hex')
    if (verifyChecksum !== checksum) return null
    return decrypted
  } catch {
    return null
  }
}

export function loadToken(): TokenData | null {
  try {
    const paths = getTokenPaths()
    for (const tokenPath of paths) {
      if (fs.existsSync(tokenPath)) {
        const raw = fs.readFileSync(tokenPath, 'utf-8').trim()
        const json = decrypt(raw)
        if (json) {
          const data = JSON.parse(json)
          if (data.token && data.validade) {
            const userData = app.getPath('userData')
            const destPath = path.join(userData, TOKEN_FILE)
            if (tokenPath !== destPath) {
              try {
                fs.copyFileSync(tokenPath, destPath)
              } catch {}
            }
            return data
          }
        }
      }
    }
    return null
  } catch {
    return null
  }
}

export function isTokenValid(): { valid: boolean; message: string; daysLeft?: number } {
  const token = loadToken()

  if (!token) {
    return { valid: false, message: 'Arquivo de licença não encontrado ou corrompido.' }
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
