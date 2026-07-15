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
set /p PUBLICAR="Publicar no GitHub + Vercel? (S/N): "
if /I not "%PUBLICAR%"=="S" (
    echo  Publicacao cancelada.
    pause
    exit /b 0
)

:: Build do instalador
echo  [1/4] Gerando instalador v%NEW_VER%...
call npm run dist
if errorlevel 1 (
    echo  ERRO no build!
    pause
    exit /b 1
)

:: Publicar no GitHub
echo  [2/4] Publicando no GitHub...
git add token.json token.dat version.json package.json
git commit -m "chore: renovar licenca ate %NOVA_DATA% - v%NEW_VER%"
git push
git tag v%NEW_VER%
git push origin v%NEW_VER%

:: Criar release com o instalador
echo  [3/4] Criando release v%NEW_VER%...
gh release create v%NEW_VER% "dist\ConstruPro-ERP-%NEW_VER%-Setup.exe" --title "ConstruPro ERP v%NEW_VER%" --notes "Renovacao de licenca - validade: %NOVA_DATA%" --clobber

:: Atualizar API do Vercel
echo  [4/4] Atualizando servidor de atualizacoes...
cd /d "C:\projetos\OPENCODE\construpro-updater"
(
echo export default async function handler(req, res^) {
echo   res.setHeader('Access-Control-Allow-Origin', '*'^)
echo   res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'^)
echo   if (req.method === 'OPTIONS'^) return res.status(200^).end(^)
echo   return res.status(200^).json({
echo     version: '%NEW_VER%',
echo     name: 'ConstruPro ERP %NEW_VER%',
echo     date: new Date(^).toISOString(^),
echo     downloadUrl: 'https://github.com/amplitudemodulada/construpro-erp/releases/download/v%NEW_VER%/ConstruPro-ERP-%NEW_VER%-Setup.exe',
echo     fileName: 'ConstruPro-ERP-%NEW_VER%-Setup.exe',
echo     releaseNotes: 'Renovacao de licenca'
echo   }^)
echo }
) > "api\update\index.js"

call vercel --yes --prod
cd /d "%~dp0"

echo.
echo  ============================================
echo   PRONTO! Tudo atualizado!
echo  ============================================
echo.
echo  Versao: %NEW_VER%
echo  Licenca valida ate: %NOVA_DATA%
echo  GitHub: release criada
echo  Vercel: API atualizada
echo.
echo  O cliente detecta a atualizacao automaticamente!
echo  ============================================
echo.
pause
