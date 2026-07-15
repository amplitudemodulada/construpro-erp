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
type token.json | findstr "validade"
echo.

:: Solicitar nova data
set /p NOVA_DATA="Nova data de validade (AAAA-MM-DD): "

if "%NOVA_DATA%"=="" (
    echo  Data invalida!
    pause
    exit /b 1
)

:: Atualizar token.json usando PowerShell
powershell -Command "$t = Get-Content 'token.json' -Raw | ConvertFrom-Json; $t.validade = '%NOVA_DATA%'; $t | ConvertTo-Json | Set-Content 'token.json'"

echo.
echo  Token atualizado:
type token.json | findstr "validade"
echo.

:: Perguntar se quer publicar
set /p PUBLICAR="Publicar no GitHub? (S/N): "
if /I "%PUBLICAR%"=="S" (
    echo.
    echo  Publicando no GitHub...
    git add token.json
    git commit -m "chore: renovar licenca ate %NOVA_DATA%"
    git push
    echo.
    echo  GitHub publicado!
    echo.
    echo  Atualizando servidor de atualizacoes (Vercel)...

    :: Buscar última release do GitHub
    echo  Buscando info da ultima release...
    for /f "tokens=*" %%i in ('gh release list --repo amplitudemodulada/construpro-erp --limit 1 --json tagName --jq ".[0].tagName"') do set TAG=%%i
    for /f "tokens=*" %%i in ('gh release view %TAG% --repo amplitudemodulada/construpro-erp --json assets --jq ".assets[0].browser_download_url"') do set DOWNLOAD=%%i
    for /f "tokens=*" %%i in ('gh release view %TAG% --repo amplitudemodulada/construpro-erp --json assets --jq ".assets[0].name"') do set FILENAME=%%i

    echo  Versao: %TAG%

    :: Reescrever index.js do Vercel com a nova versão
    cd /d "C:\projetos\OPENCODE\construpro-updater"
    (
    echo export default async function handler(req, res^) {
    echo   res.setHeader('Access-Control-Allow-Origin', '*'^)
    echo   res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'^)
    echo   if (req.method === 'OPTIONS'^) return res.status(200^).end(^)
    echo   return res.status(200^).json({
    echo     version: '%TAG%',
    echo     name: 'ConstruPro ERP %TAG%',
    echo     date: new Date(^).toISOString(^),
    echo     downloadUrl: '%DOWNLOAD%',
    echo     fileName: '%FILENAME%',
    echo     releaseNotes: 'Atualizacao automatica'
    echo   }^)
    echo }
    ) > "api\update\index.js"

    :: Deploy no Vercel
    vercel --yes --prod
    cd /d "%~dp0"
    echo.
    echo  Pronto! GitHub + Vercel atualizados.
)

echo.
pause
