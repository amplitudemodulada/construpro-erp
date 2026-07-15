import { app, dialog, shell, BrowserWindow } from 'electron'
import { exec } from 'child_process'
import https from 'https'
import fs from 'fs'
import path from 'path'

const REPO = 'amplitudemodulada/construpro-erp'
const CURRENT_VERSION = '1.0.0'
const UPDATE_SERVER = 'https://construpro-updater.vercel.app/api/update'

function getVersion(): string {
  // Procura version.json na pasta do executável e na pasta do app
  const exeDir = path.dirname(app.getPath('exe'))
  const appDir = path.dirname(exeDir)

  const paths = [
    path.join(exeDir, 'version.json'),
    path.join(appDir, 'version.json'),
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

interface UpdateInfo {
  version: string
  name: string
  date: string
  downloadUrl: string | null
  fileName: string | null
  fileSize: number
  releaseNotes: string
}

function getLatestRelease(): Promise<{ release: UpdateInfo | null; error?: string }> {
  return new Promise((resolve) => {
    const url = new URL(UPDATE_SERVER)
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      headers: { 'User-Agent': 'ConstruPro-ERP-Updater' },
      timeout: 15000
    }

    const req = https.get(options, (res) => {
      if (res.statusCode !== 200) {
        resolve({ release: null, error: `Servidor retornou status ${res.statusCode}` })
        return
      }
      let data = ''
      res.on('data', (chunk: string) => { data += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) {
            resolve({ release: null, error: parsed.error })
          } else {
            resolve({ release: parsed })
          }
        } catch {
          resolve({ release: null, error: 'Resposta do servidor inválida.' })
        }
      })
    })

    req.on('timeout', () => {
      req.destroy()
      resolve({ release: null, error: 'Tempo esgotado ao verificar atualização.' })
    })

    req.on('error', (err) => {
      resolve({ release: null, error: `Erro de rede: ${err.message}` })
    })
  })
}

function downloadFile(url: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(dest)
    https.get(url, { headers: { 'User-Agent': 'ConstruPro-ERP-Updater' } }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location!, { headers: { 'User-Agent': 'ConstruPro-ERP-Updater' } }, (res2) => {
          res2.pipe(file)
          file.on('finish', () => { file.close(); resolve(true) })
        }).on('error', () => { fs.unlink(dest, () => {}); resolve(false) })
        return
      }
      response.pipe(file)
      file.on('finish', () => { file.close(); resolve(true) })
    }).on('error', () => { fs.unlink(dest, () => {}); resolve(false) })
  })
}

function extractZip(zipPath: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    const cmd = `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${dest}' -Force"`
    exec(cmd, (error) => {
      if (error) {
        console.error('Erro ao extrair zip:', error)
        resolve(false)
        return
      }
      resolve(true)
    })
  })
}

function runUpdateScript(updateDir: string): void {
  const exeDir = path.dirname(app.getPath('exe'))
  const batContent = `@echo off
echo Aguardando fechamento do ConstruPro ERP...
timeout /t 3 /nobreak > nul
echo Copiando atualizacao...
xcopy /E /Y /I "${updateDir}\\out" "${exeDir}\\out"
copy /Y "${updateDir}\\version.json" "${exeDir}\\version.json"
copy /Y "${updateDir}\\token.json" "${exeDir}\\token.json"
echo Limpeza...
rmdir /S /Q "${updateDir}"
echo Iniciando ConstruPro ERP...
start "" "${app.getPath('exe')}"
del "%~f0"
`

  const batPath = path.join(app.getPath('temp'), 'construpro-update.bat')
  fs.writeFileSync(batPath, batContent)
  exec(`cmd /c "${batPath}"`)
}

export async function checkForUpdates(silent: boolean = false): Promise<boolean> {
  try {
    const currentVersion = getVersion()
    const { release, error } = await getLatestRelease()

    if (!release) {
      const msg = error || 'Não foi possível verificar atualizações.\nVerifique sua conexão com a internet.'
      if (!silent) {
        dialog.showMessageBox({
          type: 'info',
          title: 'Verificação de Atualização',
          message: msg,
          buttons: ['OK']
        })
      }
      return false
    }

    const latestVersion = release.version

    if (latestVersion === currentVersion) {
      if (!silent) {
        dialog.showMessageBox({
          type: 'info',
          title: 'Verificação de Atualização',
          message: `Você já está usando a versão mais recente (${currentVersion}).`,
          buttons: ['OK']
        })
      }
      return false
    }

    const response = await dialog.showMessageBox({
      type: 'info',
      title: 'Atualização Disponível',
      message: `Nova versão disponível: ${latestVersion}\nSua versão: ${currentVersion}\n\nDeseja atualizar agora?`,
      buttons: ['Sim, Atualizar', 'Mais Tarde'],
      defaultId: 0
    })

    if (response.response !== 0) return false

    if (!release.downloadUrl) {
      dialog.showErrorBox('Erro', 'Nenhum arquivo de atualização encontrado.')
      return false
    }

    const tempDir = path.join(app.getPath('temp'), 'construpro-update-temp')
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

    const zipPath = path.join(tempDir, 'update.zip')

    const progressWin = new BrowserWindow({
      width: 400, height: 150,
      frame: false,
      resizable: false,
      webPreferences: { nodeIntegration: true }
    })

    progressWin.loadURL(`data:text/html,<html><body style="background:#111;color:#22c55e;font-family:Arial;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h2 style="margin:0 0 10px 0">Atualizando...</h2><p id="status">Baixando atualização...</p></div></body></html>`)

    const downloaded = await downloadFile(release.downloadUrl, zipPath)

    if (!downloaded) {
      progressWin.close()
      dialog.showErrorBox('Erro', 'Falha ao baixar a atualização.')
      return false
    }

    progressWin.webContents.executeJavaScript('document.getElementById("status").textContent = "Extraindo arquivos..."')

    const extracted = await extractZip(zipPath, tempDir)

    if (!extracted) {
      progressWin.close()
      dialog.showErrorBox('Erro', 'Falha ao extrair a atualização.')
      fs.rmSync(tempDir, { recursive: true, force: true })
      return false
    }

    progressWin.webContents.executeJavaScript('document.getElementById("status").textContent = "Instalando..."')

    fs.rmSync(zipPath, { force: true })

    runUpdateScript(tempDir)
    progressWin.close()

    app.quit()
    return true

  } catch (error) {
    console.error('Erro ao verificar atualização:', error)
    if (!silent) {
      dialog.showErrorBox('Erro', 'Erro ao verificar atualização.')
    }
    return false
  }
}
