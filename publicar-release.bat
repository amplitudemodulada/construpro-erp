@echo off
setlocal
title ConstruPro ERP - Publicar Release
cd /d "%~dp0"

echo.
echo  ============================================
echo   ConstruPro ERP - Publicar Release
echo  ============================================
echo.

:: Ler versao atual do package.json
for /f %%i in ('node -p "require('./package.json').version"') do set VERSION=%%i
echo  Versao atual: %VERSION%
echo.

:: Perguntar se quer incrementar versao
set /p INCREMENTAR="Incrementar versao patch? (S/N): "
if /I "%INCREMENTAR%"=="S" (
    for /f "usebackq" %%i in (`powershell -Command "$v = '%VERSION%' -split '\.'; $v[2] = [int]$v[2] + 1; $v -join '.'"`) do set VERSION=%%i

    :: Atualizar version.json e package.json
    powershell -Command "$v = Get-Content 'version.json' -Raw | ConvertFrom-Json; $v.version = '%VERSION%'; $v | ConvertTo-Json | Set-Content 'version.json'"
    powershell -Command "$p = Get-Content 'package.json' -Raw | ConvertFrom-Json; $p.version = '%VERSION%'; $p | ConvertTo-Json | Set-Content 'package.json'"

    echo  Nova versao: %VERSION%
    echo.
)

:: Build do instalador
echo  [1/5] Gerando instalador v%VERSION%...
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
git commit -m "chore: release v%VERSION%"
git push

:: Copiar instalador para o Vercel (pasta public)
echo  [3/5] Preparando para Vercel...
copy /Y "dist\ConstruPro-ERP-%VERSION%-Setup.exe" "C:\projetos\OPENCODE\construpro-updater\public\ConstruPro-ERP-Setup.exe"

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
echo     version: '%VERSION%',
echo     name: 'ConstruPro ERP v%VERSION%',
echo     date: new Date(^).toISOString(^),
echo     downloadUrl: 'https://construpro-updater.vercel.app/ConstruPro-ERP-Setup.exe',
echo     fileName: 'ConstruPro-ERP-Setup.exe',
echo     releaseNotes: 'Atualizacao v%VERSION%'
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
echo   PRONTO! Release v%VERSION% publicada!
echo  ============================================
echo.
echo  Vercel: API + instalador atualizados
echo  Cliente: detecta e baixa automaticamente
echo  ============================================
echo.
pause
