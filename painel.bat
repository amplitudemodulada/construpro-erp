@echo off
setlocal enabledelayedexpansion
title ConstruPro ERP - Painel de Controle
cd /d "%~dp0"

:MENU
cls
echo.
echo  ============================================
echo   ConstruPro ERP - Painel de Controle
echo  ============================================
echo.
echo  [1] Publicar nova versao (build + deploy)
echo  [2] Ver versao atual
echo  [3] Alterar versao
echo  [4] Gerenciar licencas (abrir painel web)
echo  [5] Verificar status do Vercel
echo  [6] Sair
echo.
set /p OPCAO="Escolha uma opcao: "

if "%OPCAO%"=="1" goto PUBLICAR
if "%OPCAO%"=="2" goto VER_VERSAO
if "%OPCAO%"=="3" goto ALT_VERSAO
if "%OPCAO%"=="4" goto LICENCAS
if "%OPCAO%"=="5" goto STATUS
if "%OPCAO%"=="6" goto SAIR
goto MENU

:: ============================================
:: OPCAO 1 - PUBLICAR NOVA VERSAO
:: ============================================
:PUBLICAR
cls
echo.
echo  ============================================
echo   Publicar Nova Versao
echo  ============================================
echo.

:: Ler versao atual
for /f %%i in ('node -p "require('./package.json').version"') do set VERSION=%%i
echo  Versao atual: %VERSION%
echo.

:: Opcoes de incremento
echo  Tipo de incremento:
echo    [1] Patch  (ex: %VERSION% -> incrementa ultimo numero)
echo    [2] Minor  (ex: x.y.0 -> x.(y+1).0)
echo    [3] Major  (ex: x.y.z -> (x+1).0.0)
echo    [4] Manter versao atual
echo.
set /p INC_OP="Escolha: "

if "%INC_OP%"=="1" (
    for /f "usebackq" %%i in (`powershell -Command "$v = '%VERSION%' -split '\.'; $v[2] = [int]$v[2] + 1; $v -join '.'"`) do set VERSION=%%i
)
if "%INC_OP%"=="2" (
    for /f "usebackq" %%i in (`powershell -Command "$v = '%VERSION%' -split '\.'; $v[1] = [int]$v[1] + 1; $v[2] = 0; $v -join '.'"`) do set VERSION=%%i
)
if "%INC_OP%"=="3" (
    for /f "usebackq" %%i in (`powershell -Command "$v = '%VERSION%' -split '\.'; $v[0] = [int]$v[0] + 1; $v[1] = 0; $v[2] = 0; $v -join '.'"`) do set VERSION=%%i
)

:: Notas de release
echo.
set /p NOTES="Notas da release (Enter para padrao): "
if "%NOTES%"=="" set NOTES=Atualizacao v%VERSION%

:: Confirmar
echo.
echo  ============================================
echo   Resumo:
echo   Versao: %VERSION%
echo   Notas: %NOTES%
echo  ============================================
echo.
set /p CONFIRMAR="Confirmar publicacao? (S/N): "
if /I not "%CONFIRMAR%"=="S" goto MENU

:: Atualizar version.json
echo.
echo  [1/6] Atualizando versao...
powershell -Command "$v = Get-Content 'version.json' -Raw | ConvertFrom-Json; $v.version = '%VERSION%'; $v | ConvertTo-Json | Set-Content 'version.json'"

:: Atualizar package.json
powershell -Command "$p = Get-Content 'package.json' -Raw | ConvertFrom-Json; $p.version = '%VERSION%'; $p | ConvertTo-Json | Set-Content 'package.json'"

echo  OK: Versao atualizada para %VERSION%

:: Build
echo.
echo  [2/6] Gerando instalador v%VERSION%...
set CSC_IDENTITY_AUTO_DISCOVERY=false
set WIN_CSC_LINK=
call npm run dist
if errorlevel 1 (
    echo  ERRO no build!
    pause
    goto MENU
)
echo  OK: Instalador gerado

:: Git commit
echo.
echo  [3/6] Publicando no GitHub...
git add -A
git commit -m "chore: release v%VERSION% - %NOTES%"
git push
echo  OK: GitHub atualizado

:: Copiar instalador para Vercel
echo.
echo  [4/6] Copiando instalador...
copy /Y "dist\ConstruPro-ERP-%VERSION%-Setup.exe" "C:\projetos\OPENCODE\construpro-updater\public\ConstruPro-ERP-Setup.exe"
echo  OK: Instalador copiado

:: Atualizar API de update
echo.
echo  [5/6] Atualizando API de versao...
(
echo export default async function handler(req, res^) {
echo   res.setHeader('Access-Control-Allow-Origin', '*'^)
echo   res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'^)
echo   res.setHeader('Access-Control-Allow-Headers', 'Content-Type'^)
echo   res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'^)
echo   if (req.method === 'OPTIONS'^) return res.status(200^).end(^)
echo   const data = {
echo     version: '%VERSION%',
echo     name: 'ConstruPro ERP v%VERSION%',
echo     date: new Date(^).toISOString(^),
echo     downloadUrl: 'https://construpro-updater.vercel.app/ConstruPro-ERP-Setup.exe',
echo     fileName: 'ConstruPro-ERP-Setup.exe',
echo     releaseNotes: '%NOTES%'
echo   }
echo   return res.status(200^).json(data^)
echo }
) > "C:\projetos\OPENCODE\construpro-updater\api\update\index.js"
echo  OK: API atualizada

:: Deploy Vercel
echo.
echo  [6/6] Publicando no Vercel...
cd /d "C:\projetos\OPENCODE\construpro-updater"
call vercel --yes --prod
cd /d "%~dp0"

echo.
echo  ============================================
echo   PUBLICADO COM SUCESSO!
echo  ============================================
echo   Versao: %VERSION%
echo   Notas: %NOTES%
echo   Vercel: API + instalador atualizados
echo   Cliente: detecta e baixa automaticamente
echo  ============================================
echo.
pause
goto MENU

:: ============================================
:: OPCAO 2 - VER VERSAO ATUAL
:: ============================================
:VER_VERSAO
cls
echo.
echo  ============================================
echo   Versao Atual
echo  ============================================
echo.
for /f %%i in ('node -p "require('./package.json').version"') do set VER=%%i
echo  package.json: v%VER%
for /f "usebackq" %%i in (`powershell -Command "(Get-Content 'version.json' -Raw | ConvertFrom-Json).version"`) do echo  version.json: v%%i
echo.
echo  Versao no Vercel:
curl -s https://construpro-updater.vercel.app/api/update 2>nul | powershell -Command "$d = $input | ConvertFrom-Json; Write-Host ('  API: v' + $d.version + ' (' + $d.releaseNotes + ')')"
echo.
pause
goto MENU

:: ============================================
:: OPCAO 3 - ALTERAR VERSAO
:: ============================================
:ALT_VERSAO
cls
echo.
echo  ============================================
echo   Alterar Versao
echo  ============================================
echo.
for /f %%i in ('node -p "require('./package.json').version"') do set VER=%%i
echo  Versao atual: %VERSION%
echo.
set /p NOVA_VER="Nova versao (ex: 1.2.0): "
if "%NOVA_VER%"=="" goto MENU

:: Confirmar
echo.
set /p CONF="Alterar de %VERSION% para %NOVA_VER%? (S/N): "
if /I not "%CONF%"=="S" goto MENU

powershell -Command "$v = Get-Content 'version.json' -Raw | ConvertFrom-Json; $v.version = '%NOVA_VER%'; $v | ConvertTo-Json | Set-Content 'version.json'"
powershell -Command "$p = Get-Content 'package.json' -Raw | ConvertFrom-Json; $p.version = '%NOVA_VER%'; $p | ConvertTo-Json | Set-Content 'package.json'"

echo.
echo  Versao alterada para %NOVA_VER%
echo  (nao publicado - use opcao 1 para publicar)
echo.
pause
goto MENU

:: ============================================
:: OPCAO 4 - GERENCIAR LICENCAS
:: ============================================
:LICENCAS
cls
echo.
echo  ============================================
echo   Gerenciar Licencas
echo  ============================================
echo.
echo  Abrindo painel no navegador...
echo.
echo  URL: https://construpro-updater.vercel.app/painel.html
echo.
echo  Chave de acesso:
echo  6318F0422501284C173B695DB1CD95F0
echo.
start https://construpro-updater.vercel.app/painel.html
pause
goto MENU

:: ============================================
:: OPCAO 5 - VERIFICAR STATUS
:: ============================================
:STATUS
cls
echo.
echo  ============================================
echo   Status do Sistema
echo  ============================================
echo.
echo  [1] Verificando API de update...
curl -s https://construpro-updater.vercel.app/api/update 2>nul | powershell -Command "$d = $input | ConvertFrom-Json; Write-Host ('  Versao: v' + $d.version); Write-Host ('  Notas: ' + $d.releaseNotes); Write-Host ('  Download: ' + $d.downloadUrl)"
echo.
echo  [2] Verificando API de licenca...
curl -s -o nul -w "  Status: %%{http_code}" "https://construpro-updater.vercel.app/api/license?token=TEST" 2>nul
echo.
echo.
echo  [3] Verificando instalador...
curl -s -o nul -w "  Status: %%{http_code}" "https://construpro-updater.vercel.app/ConstruPro-ERP-Setup.exe" 2>nul
echo.
echo.
echo  [4] Verificando painel...
curl -s -o nul -w "  Status: %%{http_code}" "https://construpro-updater.vercel.app/painel.html" 2>nul
echo.
echo.
echo  [5] Verificando GitHub...
git status --short
echo.
pause
goto MENU

:: ============================================
:: SAIR
:: ============================================
:SAIR
exit
