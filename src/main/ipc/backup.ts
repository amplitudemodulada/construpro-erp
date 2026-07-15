import { ipcMain, dialog, app } from 'electron'
import { copyFileSync, existsSync } from 'fs'
import { join } from 'path'

export function registerBackupIpc() {
  const dbPath = () => join(app.getPath('userData'), 'construpro.db')

  ipcMain.handle('backup:exportar', async () => {
    const agora = new Date()
    const ts = agora.toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const nomeArquivo = `construpro_backup_${ts}.db`

    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Salvar Backup',
      defaultPath: nomeArquivo,
      filters: [{ name: 'Banco de Dados', extensions: ['db'] }]
    })

    if (canceled || !filePath) return { ok: false, msg: 'Cancelado' }

    try {
      copyFileSync(dbPath(), filePath)
      return { ok: true, msg: `Backup salvo em:\n${filePath}` }
    } catch (e: any) {
      return { ok: false, msg: `Erro ao salvar backup: ${e.message}` }
    }
  })

  ipcMain.handle('backup:restaurar', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Selecionar Backup para Restaurar',
      filters: [{ name: 'Banco de Dados', extensions: ['db'] }],
      properties: ['openFile']
    })

    if (canceled || !filePaths[0]) return { ok: false, msg: 'Cancelado' }

    if (!existsSync(filePaths[0])) return { ok: false, msg: 'Arquivo não encontrado' }

    try {
      // Faz backup do banco atual antes de restaurar
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const backupAuto = join(app.getPath('userData'), `construpro_antes_restore_${ts}.db`)
      copyFileSync(dbPath(), backupAuto)

      copyFileSync(filePaths[0], dbPath())
      return {
        ok: true,
        msg: 'Backup restaurado com sucesso!\nO sistema será reiniciado para aplicar as alterações.',
        reiniciar: true
      }
    } catch (e: any) {
      return { ok: false, msg: `Erro ao restaurar: ${e.message}` }
    }
  })

  ipcMain.handle('backup:caminhoBanco', () => {
    return { path: dbPath(), userData: app.getPath('userData') }
  })

  ipcMain.handle('app:sair', () => {
    app.quit()
  })

  ipcMain.handle('app:reiniciar', () => {
    app.relaunch()
    app.quit()
  })
}
