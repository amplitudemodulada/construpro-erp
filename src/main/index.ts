import { app, BrowserWindow, ipcMain, shell, session, PrintToPDFOptions } from 'electron'
import { join } from 'path'
import { checkLicense, activateLicense, getLicenseInfo } from './license'
import { isTokenValid, getTokenInfo, saveToken } from './token'
import { registerClientesIpc } from './ipc/clientes'
import { registerFornecedoresIpc } from './ipc/fornecedores'
import { registerFuncionariosIpc } from './ipc/funcionarios'
import { registerProdutosIpc } from './ipc/produtos'
import { registerEstoqueIpc } from './ipc/estoque'
import { registerVendasIpc } from './ipc/vendas'
import { registerFinanceiroIpc } from './ipc/financeiro'
import { registerRelatoriosIpc } from './ipc/relatorios'
import { registerBackupIpc } from './ipc/backup'
import { checkForUpdates } from './updater'

const isDev = process.defaultApp === true || process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    title: 'ConstruPro ERP',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  // Bloqueia DevTools e menu de contexto em produção
  if (!isDev) {
    mainWindow.webContents.on('before-input-event', (_, input) => {
      if (
        (input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i' ||
        input.key === 'F12'
      ) {
        mainWindow.webContents.closeDevTools()
      }
    })
    mainWindow.webContents.on('context-menu', e => e.preventDefault())
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// License IPC
ipcMain.handle('license:check', () => checkLicense())
ipcMain.handle('license:activate', (_, key: string) => activateLicense(key))
ipcMain.handle('license:info', () => getLicenseInfo())

// Token IPC
ipcMain.handle('token:validate', () => isTokenValid())
ipcMain.handle('token:info', () => getTokenInfo())

// Register all module IPC handlers
registerClientesIpc()
registerFornecedoresIpc()
registerFuncionariosIpc()
registerProdutosIpc()
registerEstoqueIpc()
registerVendasIpc()
registerFinanceiroIpc()
registerRelatoriosIpc()
registerBackupIpc()

// Updater IPC
ipcMain.handle('update:check', () => checkForUpdates(false))
ipcMain.handle('update:check-silent', () => checkForUpdates(true))

// Print IPC — abre janela oculta e imprime via Electron (sem depender do Windows Print)
ipcMain.handle('print:direct', async (_, html: string, options?: { silent?: boolean; printerName?: string; landscape?: boolean }) => {
  const printWindow = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: { offscreen: true }
  })

  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

  const printerList = printWindow.webContents.getPrintersAsync()
  const printers = await printerList

  let printerName = options?.printerName
  if (!printerName && printers.length > 0) {
    const defaultPrinter = printers.find(p => p.isDefault)
    printerName = defaultPrinter?.name || printers[0].name
  }

  return new Promise<{ success: boolean; error?: string }>((resolve) => {
    printWindow.webContents.print(
      {
        silent: options?.silent ?? true,
        deviceName: printerName || '',
        landscape: options?.landscape ?? false,
        printBackground: true,
        margins: { marginType: 'custom', top: 0, bottom: 0, left: 0, right: 0 }
      },
      (success, failureReason) => {
        printWindow.close()
        if (!success) {
          resolve({ success: false, error: failureReason })
        } else {
          resolve({ success: true })
        }
      }
    )
  })
})

app.whenReady().then(() => {
  app.setAppUserModelId('com.msdos.construpro')

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://wa.me https://*.whatsapp.com https://api.github.com https://github.com"
        ]
      }
    })
  })

  createWindow()

  // Verificar token de licença na inicialização
  const tokenStatus = isTokenValid()
  if (!tokenStatus.valid) {
    dialog.showErrorBox('Licença', tokenStatus.message)
    app.quit()
    return
  }

  // Aviso se faltar pouco para expirar
  if (tokenStatus.daysLeft && tokenStatus.daysLeft <= 30) {
    setTimeout(() => {
      dialog.showMessageBox({
        type: 'warning',
        title: 'Licença',
        message: tokenStatus.message,
        buttons: ['OK']
      })
    }, 3000)
  }

  // Verificar atualização automaticamente após 10 segundos
  setTimeout(() => {
    if (!isDev) checkForUpdates(true)
  }, 10000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
