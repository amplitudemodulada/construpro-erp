import { app, dialog } from 'electron'
import { exec } from 'child_process'
import https from 'https'
import fs from 'fs'
import path from 'path'

const CURRENT_VERSION = '1.0.0'
const UPDATE_SERVER = 'https://construpro-updater.vercel.app/api/update'

interface UpdateInfo {
  version: string
  name: string
  date: string
  downloadUrl: string | null
  fileName: string | null
  fileSize: number
  releaseNotes: string
}

function getVersion(): string {
  const exeDir = path.dirname(app.getPath('exe'))
  const paths = [
    path.join(exeDir, 'version.json'),
    path.join(process.cwd(), 'version.json'),
    path.join(__dirname, '..', '..', 'version.json'),
  ]
  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf-8'))
        return data.version || CURRENT_VERSION
      } catch {}
    }
  }
  return CURRENT_VERSION
}

function getUpdateDir(): string {
  return path.join(app.getPath('temp'), 'construpro-update')
}

function isUpdatePending(): boolean {
  return fs.existsSync(path.join(getUpdateDir(), 'out'))
}

function applyPendingUpdate(): boolean {
  const updateDir = getUpdateDir()
  const exeDir = path.dirname(app.getPath('exe'))
  const logFile = path.join(app.getPath('temp'), 'construpro-apply.log')

  const log = (msg: string) => {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`)
  }

  fs.writeFileSync(logFile, `=== Aplicando atualização ===\n`)
  log(`Update dir: ${updateDir}`)
  log(`Exe dir: ${exeDir}`)

  const outDir = path.join(updateDir, 'out')
  if (!fs.existsSync(outDir)) {
    log('ERRO: pasta out/ não encontrada no update')
    return false
  }

  try {
    log('Conteúdo da pasta out:')
    fs.readdirSync(outDir).forEach(f => log(`  - ${f}`))

    const destOut = path.join(exeDir, 'out')
    log(`Copiando para: ${destOut}`)

    const copyDir = (src: string, dest: string) => {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
      for (const item of fs.readdirSync(src)) {
        const s = path.join(src, item)
        const d = path.join(dest, item)
        if (fs.statSync(s).isDirectory()) {
          copyDir(s, d)
        } else {
          fs.copyFileSync(s, d)
          log(`  Copiado: ${path.relative(updateDir, s)}`)
        }
      }
    }

    copyDir(outDir, destOut)

    const vSrc = path.join(updateDir, 'version.json')
    const tSrc = path.join(updateDir, 'token.json')
    if (fs.existsSync(vSrc)) {
      fs.copyFileSync(vSrc, path.join(exeDir, 'version.json'))
      log('version.json copiado')
    }
    if (fs.existsSync(tSrc)) {
      fs.copyFileSync(tSrc, path.join(exeDir, 'token.json'))
      log('token.json copiado')
    }

    // Verificar se a versão foi atualizada
    const vDest = path.join(exeDir, 'version.json')
    if (fs.existsSync(vDest)) {
      const vData = JSON.parse(fs.readFileSync(vDest, 'utf-8'))
      log(`Versão após cópia: ${vData.version}`)
    }

    fs.rmSync(updateDir, { recursive: true, force: true })
    log('Pasta de update removida')
    log('Sucesso!')
    return true
  } catch (err: any) {
    log(`ERRO: ${err.message}`)
    return false
  }
}

function getLatestRelease(): Promise<{ release: UpdateInfo | null; error?: string }> {
  return new Promise((resolve) => {
    const url = new URL(UPDATE_SERVER)
    const req = https.get({
      hostname: url.hostname,
      path: url.pathname,
      headers: { 'User-Agent': 'ConstruPro-ERP-Updater' },
      timeout: 15000
    }, (res) => {
      if (res.statusCode !== 200) {
        resolve({ release: null, error: `Servidor retornou status ${res.statusCode}` })
        return
      }
      let data = ''
      res.on('data', (chunk: string) => { data += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) resolve({ release: null, error: parsed.error })
          else resolve({ release: parsed })
        } catch {
          resolve({ release: null, error: 'Resposta inválida do servidor.' })
        }
      })
    })
    req.on('timeout', () => { req.destroy(); resolve({ release: null, error: 'Tempo esgotado.' }) })
    req.on('error', (err) => { resolve({ release: null, error: `Erro de rede: ${err.message}` }) })
  })
}

function downloadFile(url: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(dest)
    const doDownload = (downloadUrl: string) => {
      https.get(downloadUrl, { headers: { 'User-Agent': 'ConstruPro-ERP-Updater' } }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          doDownload(response.headers.location!)
          return
        }
        response.pipe(file)
        file.on('finish', () => { file.close(); resolve(true) })
      }).on('error', () => { fs.unlink(dest, () => {}); resolve(false) })
    }
    doDownload(url)
  })
}

function extractZip(zipPath: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${dest}' -Force"`, (error) => {
      resolve(!error)
    })
  })
}

export async function checkAndApplyUpdates(): Promise<void> {
  if (!isUpdatePending()) return

  const applied = applyPendingUpdate()
  if (applied) {
    setTimeout(() => {
      dialog.showMessageBox({
        type: 'info',
        title: 'Atualização Aplicada',
        message: 'Sistema atualizado com sucesso! A nova versão já está ativa.',
        buttons: ['OK']
      })
    }, 2000)
  }
}

export async function checkForUpdates(silent: boolean = false): Promise<boolean> {
  try {
    const currentVersion = getVersion()
    const { release, error } = await getLatestRelease()

    if (!release) {
      if (!silent) {
        dialog.showMessageBox({
          type: 'info',
          title: 'Verificação de Atualização',
          message: error || 'Não foi possível verificar atualizações.',
          buttons: ['OK']
        })
      }
      return false
    }

    if (release.version === currentVersion) {
      if (!silent) {
        dialog.showMessageBox({
          type: 'info',
          title: 'Verificação de Atualização',
          message: `Versão atual: ${currentVersion}\nNenhuma atualização disponível.`,
          buttons: ['OK']
        })
      }
      return false
    }

    const response = await dialog.showMessageBox({
      type: 'info',
      title: 'Atualização Disponível',
      message: `Nova versão: ${release.version}\nSua versão: ${currentVersion}\n\nDeseja baixar a atualização?`,
      buttons: ['Sim, Baixar', 'Mais Tarde'],
      defaultId: 0
    })

    if (response.response !== 0) return false

    if (!release.downloadUrl) {
      dialog.showErrorBox('Erro', 'Arquivo de atualização não encontrado.')
      return false
    }

    const updateDir = getUpdateDir()
    if (fs.existsSync(updateDir)) fs.rmSync(updateDir, { recursive: true, force: true })
    fs.mkdirSync(updateDir, { recursive: true })

    const zipPath = path.join(updateDir, 'update.zip')

    const downloaded = await downloadFile(release.downloadUrl, zipPath)
    if (!downloaded) {
      dialog.showErrorBox('Erro', 'Falha ao baixar atualização.')
      return false
    }

    const extracted = await extractZip(zipPath, updateDir)
    if (!extracted) {
      dialog.showErrorBox('Erro', 'Falha ao extrair atualização.')
      return false
    }

    try { fs.unlinkSync(zipPath) } catch {}

    await dialog.showMessageBox({
      type: 'info',
      title: 'Atualização Baixada',
      message: 'Atualização pronta!\n\nReinicie o sistema para aplicar.',
      buttons: ['OK']
    })

    return true
  } catch (err) {
    if (!silent) {
      dialog.showErrorBox('Erro', `Erro ao verificar atualização: ${err}`)
    }
    return false
  }
}
