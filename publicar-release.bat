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
call npm run dist
if errorlevel 1 (
    echo  ERRO no build!
    pause
    exit /b 1
)

:: Verificar se o instalador foi gerado
if not exist "dist\ConstruPro-ERP-%VERSION%-Setup.exe" (
    echo  ERRO: Instalador nao encontrado em dist\
    dir dist\*.exe 2>nul
    pause
    exit /b 1
)

:: Commit e push
echo  [2/5] Publicando no GitHub...
git add -A
git commit -m "chore: release v%VERSION%"
git push

:: Tag
echo  [3/5] Criando tag v%VERSION%...
git tag v%VERSION%
git push origin v%VERSION%

:: Criar release no GitHub
echo  [4/5] Criando release v%VERSION%...
gh release create "v%VERSION%" "dist\ConstruPro-ERP-%VERSION%-Setup.exe" --title "ConstruPro ERP v%VERSION%" --notes "Atualizacao do sistema ConstruPro ERP v%VERSION%" --clobber

if %errorlevel% neq 0 (
    echo  ERRO ao criar release!
    pause
    exit /b 1
)

:: Atualizar API do Vercel
echo  [5/5] Atualizando servidor de atualizacoes...
cd /d "C:\projetos\OPENCODE\construpro-updater"
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
echo     downloadUrl: 'https://github.com/amplitudemodulada/construpro-erp/releases/download/v%VERSION%/ConstruPro-ERP-%VERSION%-Setup.exe',
echo     fileName: 'ConstruPro-ERP-%VERSION%-Setup.exe',
echo     releaseNotes: 'Atualizacao do sistema ConstruPro ERP v%VERSION%'
echo   }
echo   return res.status(200^).json(data^)
echo }
) > "api\update\index.js"

call vercel --yes --prod
cd /d "%~dp0"

echo.
echo  ============================================
echo   PRONTO! Release v%VERSION% publicada!
echo  ============================================
echo.
echo  GitHub: release criada com instalador
echo  Vercel: API de atualizacao atualizada
echo  Cliente: detecta atualizacao automaticamente
echo  ============================================
echo.
pause
