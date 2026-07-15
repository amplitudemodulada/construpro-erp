@echo off
title ConstruPro ERP - Gerar Instalador
cd /d "%~dp0"

echo.
echo  ============================================
echo   ConstruPro ERP - Gerar Instalador
echo  ============================================
echo.

:: Compila
echo  [1/2] Compilando...
call npm run build 2>nul
if errorlevel 1 ( echo  ERRO no build! & pause & exit /b 1 )

:: Gera token.dat criptografado
echo  [2/2] Gerando token criptografado e instalador...
npx tsx scripts/gerar-token.ts

:: Gera instalador NSIS
call npx electron-builder --win --publish never
if errorlevel 1 ( echo  ERRO no instalador! & pause & exit /b 1 )

echo.
echo  ============================================
echo   PRONTO!
echo  ============================================
echo.
echo  Instalador em: dist\ConstruPro ERP-Setup-1.1.0.exe
echo.
echo  PARA INSTALAR NO CLIENTE:
echo    1. Copie o .exe para o pendrive
echo    2. No cliente, execute o .exe
echo    3. Escolha a pasta de instalação
echo    4. Pronto! Atalho no desktop e menu iniciar
echo.
echo  ATUALIZACAO AUTOMATICA:
echo    O sistema detecta updates automaticamente
echo    via GitHub Releases.
echo  ============================================
echo.
pause
