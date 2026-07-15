@echo off
title ConstruPro ERP - Gerar Distribuicao
cd /d "%~dp0"

echo.
echo  ============================================
echo   ConstruPro ERP - Gerar Versao para Cliente
echo  ============================================
echo.

set DEST=dist\ConstruPro-ERP

:: Limpa pasta anterior (ignora erros de arquivos travados)
echo  [1/4] Limpando pasta anterior...
if exist "%DEST%" rmdir /s /q "%DEST%" 2>nul
mkdir "%DEST%" 2>nul

:: Compila
echo  [2/4] Compilando e ofuscando...
call npm run build 2>nul
if errorlevel 1 ( echo  ERRO no build! & pause & exit /b 1 )
call npm run obfuscate 2>nul
if errorlevel 1 ( echo  ERRO na ofuscacao! & pause & exit /b 1 )

:: Copia com robocopy (mais robusto)
echo  [3/4] Copiando arquivos...
robocopy "out" "%DEST%\out" /E /NFL /NDL /NJH /NJS /NC /NS /NP >nul 2>&1
robocopy "node_modules\electron\dist" "%DEST%" /E /NFL /NDL /NJH /NJS /NC /NS /NP >nul 2>&1
robocopy "node_modules\better-sqlite3" "%DEST%\node_modules\better-sqlite3" /E /NFL /NDL /NJH /NJS /NC /NS /NP >nul 2>&1
robocopy "node_modules\bindings" "%DEST%\node_modules\bindings" /E /NFL /NDL /NJH /NJS /NC /NS /NP >nul 2>&1
robocopy "node_modules\file-uri-to-path" "%DEST%\node_modules\file-uri-to-path" /E /NFL /NDL /NJH /NJS /NC /NS /NP >nul 2>&1
copy /y "package.json" "%DEST%\package.json" >nul
copy /y "token.json" "%DEST%\token.json" >nul

:: Cria bat de inicializacao
echo  [4/4] Criando iniciar.bat...
(
echo @echo off
echo cd /d "%%~dp0"
echo start "" "electron.exe" .
) > "%DEST%\iniciar.bat"

echo.
echo  ============================================
echo   PRONTO!
echo  ============================================
echo.
echo  Pasta: %DEST%\
echo.
echo  PARA USAR NO CLIENTE:
echo    1. Copie TUDO de "ConstruPro-ERP" para o pendrive
echo    2. No cliente, cole em C:\ConstruPro-ERP
echo    3. Duplo-clique em "iniciar.bat"
echo.
echo  Nao precisa instalar nada!
echo  Codigo ofuscado e protegido.
echo  ============================================
echo.
pause
