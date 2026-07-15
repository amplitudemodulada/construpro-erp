import crypto from 'crypto'
import { execSync } from 'child_process'

const ALGO = 'aes-256-gcm'
const TAG_LEN = 16
const IV_LEN = 12

function getDeviceKey(): Buffer {
  try {
    const serial = execSync('wmic diskdrive get serialnumber', { timeout: 3000 })
      .toString().split('\n').map(l => l.trim()).filter(l => l && l !== 'SerialNumber')[0] || 'DEFAULT'
    return crypto.createHash('sha256').update('ConstruPro-' + serial).digest()
  } catch {
    return crypto.createHash('sha256').update('ConstruPro-DEFAULT-KEY').digest()
  }
}

let cachedKey: Buffer | null = null

function getKey(): Buffer {
  if (!cachedKey) cachedKey = getDeviceKey()
  return cachedKey
}

export function encrypt(text: string | null): string | null {
  if (!text) return text
  try {
    const key = getKey()
    const iv = crypto.randomBytes(IV_LEN)
    const cipher = crypto.createCipheriv(ALGO, key, iv)
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return Buffer.concat([iv, tag, encrypted]).toString('base64')
  } catch {
    return text
  }
}

export function decrypt(data: string | null): string | null {
  if (!data) return data
  try {
    const buf = Buffer.from(data, 'base64')
    if (buf.length < IV_LEN + TAG_LEN + 1) return data
    const iv = buf.subarray(0, IV_LEN)
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN)
    const encrypted = buf.subarray(IV_LEN + TAG_LEN)
    const key = getKey()
    const decipher = crypto.createDecipheriv(ALGO, key, iv)
    decipher.setAuthTag(tag)
    return decipher.update(encrypted) + decipher.final('utf8')
  } catch {
    return data
  }
}

export function isEncrypted(data: string): boolean {
  if (!data) return false
  try {
    const buf = Buffer.from(data, 'base64')
    return buf.length >= IV_LEN + TAG_LEN + 1
  } catch {
    return false
  }
}
