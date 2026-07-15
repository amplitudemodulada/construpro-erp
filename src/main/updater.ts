import { autoUpdater } from 'electron-updater'
import { app, dialog } from 'electron'
import log from 'electron-log'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'

const CURRENT_VERSION = '1.1.1'
const UPDATE_SERVER = 'https://construpro-updater.vercel.app/api/update'

function parseSemver(v: string): [number, number, number] {
  const match = v.replace(/[^0-9.]/g, '').split('.')
  return [
    parseInt(match[0] || '0', 10),
    parseInt(match[1] || '0', 10),
    parseInt(match[2] || '0', 10)
  ]
}

function isNewerVersion(remote: string, local: string): boolean {
  const [rMajor, rMinor, rPatch] = parseSemver(remote)
  const [lMajor, lMinor, lPatch] = parseSemver(local)
  if (rMajor !== lMajor) return rMajor > lMajor
  if (rMinor !== lMinor) return rMinor > lMinor
  return rPatch > lPatch
}

export function getVersion(): string {
  const appPath = app.getAppPath()
  const paths = [
    path.join(appPath, 'version.json'),
    path.join(app.getPath('exe'), '..', 'version.json'),
    path.join(process.cwd(), 'version.json'),
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

export function getLatestRelease(): Promise<{ version: string; downloadUrl: string; fileName: string } | null> {
  return new Promise((resolve) => {
    const url = new URL(UPDATE_SERVER)
    const req = https.get({
      hostname: url.hostname,
      path: url.pathname,
      headers: { 'User-Agent': 'ConstruPro-ERP-Updater' },
      timeout: 15000
    }, (res) => {
      if (res.statusCode !== 200) {
        resolve(null)
        return
      }
      let data = ''
      res.on('data', (chunk: string) => { data += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.version && parsed.downloadUrl) {
            resolve(parsed)
          } else {
            resolve(null)
          }
        } catch {
          resolve(null)
        }
      })
    })
    req.on('timeout', () => { req.destroy(); resolve(null) })
    req.on('error', () => { resolve(null) })
  })
}

function downloadFile(url: string, dest: string, onProgress?: (percent: number) => void): Promise<boolean> {
  return new Promise((resolve) => {
    const doDownload = (downloadUrl: string) => {
      https.get(downloadUrl, { headers: { 'User-Agent': 'ConstruPro-ERP-Updater' } }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          doDownload(response.headers.location!)
          return
        }
        if (response.statusCode !== 200) {
          resolve(false)
          return
        }
        const totalSize = parseInt(response.headers['content-length'] || '0', 10)
        let downloadedSize = 0

        const file = fs.createWriteStream(dest)
        response.pipe(file)

        response.on('data', (chunk: Buffer) => {
          downloadedSize += chunk.length
          if (totalSize > 0 && onProgress) {
            onProgress(Math.round((downloadedSize / totalSize) * 100))
          }
        })

        file.on('finish', () => { file.close(); resolve(true) })
      }).on('error', () => { resolve(false) })
    }
    doDownload(url)
  })
}

function getTempDir(): string {
  const dir = path.join(app.getPath('temp'), 'construpro-update')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function applyUpdate(exePath: string): void {
  const logFile = path.join(app.getPath('temp'), 'construpro-apply.log')
  const log = (msg: string) => fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`)

  fs.writeFileSync(logFile, `=== Aplicando atualização ===\n`)
  log(`Installer: ${exePath}`)

  dialog.showMessageBox({
    type: 'info',
    title: 'Atualização Baixada',
    message: 'Atualização pronta!\n\nO instalador será aberto. Siga os passos para atualizar.\n\nO sistema será fechado.',
    buttons: ['OK']
  }).then(() => {
    exec(`start "" "${exePath}"`, () => {
      app.quit()
    })
  })
}

export function initUpdater(): void {
  log.info('Updater inicializado')
}

export async function checkForUpdates(silent: boolean = false): Promise<boolean> {
  try {
    const currentVersion = getVersion()
    log.info(`Versão atual: ${currentVersion}`)

    const release = await getLatestRelease()
    if (!release) {
      if (!silent) {
        dialog.showMessageBox({
          type: 'info',
          title: 'Verificação de Atualização',
          message: 'Nenhuma atualização disponível.',
          buttons: ['OK']
        })
      }
      return false
    }

    log.info(`Versão remota: ${release.version}`)

    if (!isNewerVersion(release.version, currentVersion)) {
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

    const updateDir = getTempDir()
    const installerPath = path.join(updateDir, release.fileName || 'ConstruPro-ERP-Setup.exe')

    const progressWin = new (require('electron').BrowserWindow)({
      width: 400, height: 150, show: false, resizable: false,
      title: 'Baixando atualização...',
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true
    })

    progressWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
      <html><body style="font-family:Arial;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1e293b;color:white;">
        <div style="text-align:center;">
          <p>Baixando atualização...</p>
          <div style="background:#334155;border-radius:8px;height:20px;width:300px;overflow:hidden;">
            <div id="bar" style="background:#3b82f6;height:100%;width:0%;transition:width 0.3s;"></div>
          </div>
          <p id="pct" style="margin-top:8px;">0%</p>
        </div>
      </body></html>
    `)}`)
    progressWin.once('ready-to-show', () => progressWin.show())

    let lastPercent = 0
    const downloaded = await downloadFile(release.downloadUrl, installerPath, (percent) => {
      if (percent !== lastPercent) {
        lastPercent = percent
        progressWin.webContents.executeJavaScript(`document.getElementById('bar').style.width='${percent}%';document.getElementById('pct').textContent='${percent}%';`)
      }
    })

    progressWin.close()

    if (!downloaded) {
      dialog.showErrorBox('Erro', 'Falha ao baixar atualização.')
      return false
    }

    log.info('Download completo, aplicando...')
    applyUpdate(installerPath)
    return true
  } catch (err) {
    log.error('Erro na atualização:', err)
    if (!silent) {
      dialog.showErrorBox('Erro', `Erro ao verificar atualização: ${err}`)
    }
    return false
  }
}

export function checkAndApplyUpdates(): void {
  // Not used in manual updater mode
}
