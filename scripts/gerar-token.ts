import fs from 'fs'
import path from 'path'
import { createHash, createCipheriv, randomBytes } from 'crypto'

const SECRET = 'ConstruPro#2026!Msdos'
const TOKEN_FILE = 'token.dat'

interface TokenData {
  token: string
  validade: string
  empresa: string
  mensagem: string
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

const tokenPath = path.join(__dirname, '..', 'token.json')
if (!fs.existsSync(tokenPath)) {
  console.error('token.json não encontrado')
  process.exit(1)
}

const token: TokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'))
const json = JSON.stringify(token)
const encrypted = encrypt(json)
const outPath = path.join(__dirname, '..', TOKEN_FILE)
fs.writeFileSync(outPath, encrypted, 'utf-8')
console.log('token.dat gerado com sucesso')
