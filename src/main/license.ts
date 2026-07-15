// Licenciamento removido — sistema agora é gratuito e aberto.
// Todas as funções retornam licença válida permanentemente.

export interface LicenseStatus {
  valid: boolean
  message: string
  validade?: string
  diasRestantes?: number
  hardwareId?: string
}

export function validateKey(_key: string): LicenseStatus {
  return {
    valid: true,
    message: 'Licença válida',
    validade: '31/12/2099',
    diasRestantes: 99999
  }
}

export function checkLicense(): LicenseStatus {
  return {
    valid: true,
    message: 'Sistema licenciado — versão gratuita',
    validade: '31/12/2099',
    diasRestantes: 99999,
    hardwareId: 'FREE-VERSION'
  }
}

export function activateLicense(_key: string): LicenseStatus {
  return {
    valid: true,
    message: 'Sistema ativado com sucesso!',
    validade: '31/12/2099',
    diasRestantes: 99999,
    hardwareId: 'FREE-VERSION'
  }
}

export function getLicenseInfo(): any {
  return {
    id: 1,
    chave: 'FREE-VERSION',
    hardware_id: 'FREE-VERSION',
    status: 'ATIVA',
    validade: '31/12/2099',
    ultima_validacao: new Date().toISOString(),
    proxima_validacao: '2099-12-31',
    hardwareId: 'FREE-VERSION'
  }
}
