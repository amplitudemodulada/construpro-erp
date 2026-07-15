import { app, dialog, shell, BrowserWindow } from 'electron'
import { exec } from 'child_process'
import https from 'https'
import fs from 'fs'
import path from 'path'

const REPO = 'amplitudemodulada/construpro-erp'
const CURRENT_VERSION = '1.0.0'

interface GitHubRelease {
  tag_name: string
  name: string
  assets: {
    name: string
    browser_download_url: string
    size: number
  }[]
}

function getVersion(): string {
  const vPath = path.join(app.getPath('exe'), '..', '..', 'version.json')
  if (fs.existsSync(vPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(vPath, 'utf-8'))
      return data.version || CURRENT_VERSION
    } catch { return CURRENT_VERSION }
  }
  return CURRENT_VERSION
}

function getLatestRelease(): Promise<GitHubRelease | null> {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO}/releases/latest`,
      headers: { 'User-Agent': 'ConstruPro-ERP-Updater' }
    }

    https.get(options, (res) => {
      if (res.statusCode !== 200) {
        resolve(null)
        return
      }
      let data = ''
      res.on('data', (chunk: string) => { data += chunk })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          resolve(null)
        }
      })
    }).on('error', () => resolve(null))
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
  const batContent = `@echo off
echo Aguardando fechamento do ConstruPro ERP...
timeout /t 3 /nobreak > nul
echo Copiando atualizacao...
xcopy /E /Y /I "${updateDir}\\out" "${path.join(app.getPath('exe'), '..', '..', 'out')}"
xcopy /E /Y /I "${updateDir}\\version.json" "${path.join(app.getPath('exe'), '..', '..', 'version.json')}"
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
    const release = await getLatestRelease()

    if (!release) {
      if (!silent) {
        dialog.showMessageBox({
          type: 'info',
          title: 'Verificação de Atualização',
          message: 'Não foi possível verificar atualizations.\nVerifique sua conexão com a internet.',
          buttons: ['OK']
        })
      }
      return false
    }

    const latestVersion = release.tag_name.replace('v', '')

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

    const asset = release.assets.find((a: any) => a.name.endsWith('.zip'))
    if (!asset) {
      dialog.showErrorBox('Erro', 'Nenhum arquivo de atualização encontrado no GitHub.')
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

    const downloaded = await downloadFile(asset.browser_download_url, zipPath)

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
