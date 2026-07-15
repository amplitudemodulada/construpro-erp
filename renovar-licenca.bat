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
    cd /d "C:\projetos\OPENCODE\construpro-updater"
    vercel --yes --prod
    cd /d "%~dp0"
    echo.
    echo  Pronto! Cliente recebera automaticamente.
)

echo.
pause
