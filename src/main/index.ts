import { app, BrowserWindow, ipcMain, shell, session, dialog } from 'electron'
import { join } from 'path'
import { checkLicense, activateToken, getActivationToken } from './license'
import { registerClientesIpc } from './ipc/clientes'
import { registerFornecedoresIpc } from './ipc/fornecedores'
import { registerFuncionariosIpc } from './ipc/funcionarios'
import { registerProdutosIpc } from './ipc/produtos'
import { registerEstoqueIpc } from './ipc/estoque'
import { registerVendasIpc } from './ipc/vendas'
import { registerFinanceiroIpc } from './ipc/financeiro'
import { registerRelatoriosIpc } from './ipc/relatorios'
import { registerBackupIpc } from './ipc/backup'
import { checkForUpdates, initUpdater, getVersion, getLatestRelease } from './updater'
import log from 'electron-log'

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
ipcMain.handle('license:activate', (_, token: string) => activateToken(token))
ipcMain.handle('license:token', () => getActivationToken())

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

// Version IPC
ipcMain.handle('app:version', () => getVersion())
ipcMain.handle('app:info', () => ({
  version: getVersion(),
  name: 'ConstruPro ERP',
  platform: process.platform
}))

// Updater IPC
ipcMain.handle('update:check', () => checkForUpdates(false))
ipcMain.handle('update:check-silent', () => checkForUpdates(true))
ipcMain.handle('update:latest', () => getLatestRelease())

// Print IPC
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

app.whenReady().then(async () => {
  app.setAppUserModelId('com.msdos.construpro')

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://wa.me https://*.whatsapp.com https://construpro-updater.vercel.app"
        ]
      }
    })
  })

  createWindow()

  // Verificar licença na inicialização
  const licStatus = await checkLicense()

  if (!licStatus.valid) {
    // Licença inválida → tela de ativação
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('license:blocked', licStatus)
    })
  } else {
    // Licença válida → verificar expiração
    if (licStatus.daysLeft <= 30 && licStatus.daysLeft > 0) {
      setTimeout(() => {
        dialog.showMessageBox({
          type: 'warning',
          title: 'Licença',
          message: licStatus.message,
          buttons: ['OK']
        })
      }, 3000)
    }

    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('license:ok', licStatus)
    })
  }

  // Aplicar atualização pendente
  initUpdater()

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
