@echo off
title ConstruPro ERP - Renovar Licenca
cd /d "%~dp0"

echo.
echo  ============================================
echo   Renovar Licenca do Sistema
echo  ============================================
echo.

:: Data atual do token
echo  Token atual:
type token.json
echo.

:: Solicitar nova data
set /p NOVA_DATA="Nova data de validade (AAAA-MM-DD): "

if "%NOVA_DATA%"=="" (
    echo  Data invalida!
    pause
    exit /b 1
)

:: Atualizar token.json
echo  Atualizando token...
powershell -Command "$t = Get-Content 'token.json' -Raw | ConvertFrom-Json; $t.validade = '%NOVA_DATA%'; $t | ConvertTo-Json | Set-Content 'token.json'"

:: Gerar token.dat criptografado
echo  Gerando token criptografado...
call npx tsx scripts/gerar-token.ts
if errorlevel 1 (
    echo  ERRO ao gerar token.dat!
    pause
    exit /b 1
)

:: Incrementar versao patch
echo  Incrementando versao...
for /f %%i in ('node -p "require('./package.json').version"') do set OLD_VER=%%i
for /f "usebackq" %%i in (`powershell -Command "$v = '%OLD_VER%' -split '\.'; $v[2] = [int]$v[2] + 1; $v -join '.'"`) do set NEW_VER=%%i

:: Atualizar version.json e package.json
powershell -Command "$v = Get-Content 'version.json' -Raw | ConvertFrom-Json; $v.version = '%NEW_VER%'; $v | ConvertTo-Json | Set-Content 'version.json'"
powershell -Command "$p = Get-Content 'package.json' -Raw | ConvertFrom-Json; $p.version = '%NEW_VER%'; $p | ConvertTo-Json | Set-Content 'package.json'"

echo  Versao: %OLD_VER% ^> %NEW_VER%
echo.

:: Perguntar se quer publicar
set /p PUBLICAR="Publicar no Vercel? (S/N): "
if /I not "%PUBLICAR%"=="S" (
    echo  Publicacao cancelada.
    pause
    exit /b 0
)

:: Build do instalador
echo  [1/5] Gerando instalador v%NEW_VER%...
set CSC_IDENTITY_AUTO_DISCOVERY=false
set WIN_CSC_LINK=
call npm run dist
if errorlevel 1 (
    echo  ERRO no build!
    pause
    exit /b 1
)

:: Commit e push
echo  [2/5] Publicando no GitHub...
git add -A
git commit -m "chore: renovar licenca ate %NOVA_DATA% - v%NEW_VER%"
git push

:: Copiar instalador para o Vercel
echo  [3/5] Preparando para Vercel...
copy /Y "dist\ConstruPro-ERP-%NEW_VER%-Setup.exe" "C:\projetos\OPENCODE\construpro-updater\public\ConstruPro-ERP-Setup.exe"

:: Atualizar API do Vercel
echo  [4/5] Atualizando API...
(
echo export default async function handler(req, res^) {
echo   res.setHeader('Access-Control-Allow-Origin', '*'^)
echo   res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'^)
echo   res.setHeader('Access-Control-Allow-Headers', 'Content-Type'^)
echo   res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'^)
echo   if (req.method === 'OPTIONS'^) return res.status(200^).end(^)
echo   const data = {
echo     version: '%NEW_VER%',
echo     name: 'ConstruPro ERP v%NEW_VER%',
echo     date: new Date(^).toISOString(^),
echo     downloadUrl: 'https://construpro-updater.vercel.app/ConstruPro-ERP-Setup.exe',
echo     fileName: 'ConstruPro-ERP-Setup.exe',
echo     releaseNotes: 'Renovacao de licenca - validade: %NOVA_DATA%'
echo   }
echo   return res.status(200^).json(data^)
echo }
) > "C:\projetos\OPENCODE\construpro-updater\api\update\index.js"

:: Publicar no Vercel
echo  [5/5] Publicando no Vercel...
cd /d "C:\projetos\OPENCODE\construpro-updater"
call vercel --yes --prod
cd /d "%~dp0"

echo.
echo  ============================================
echo   PRONTO! Tudo atualizado!
echo  ============================================
echo.
echo  Versao: %NEW_VER%
echo  Licenca valida ate: %NOVA_DATA%
echo  Vercel: API + instalador atualizados
echo  Cliente: detecta atualizacao automaticamente
echo  ============================================
echo.
pause
