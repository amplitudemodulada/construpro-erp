@echo off
title ConstruPro ERP - Gerenciar Licencas
cd /d "C:\projetos\OPENCODE\construpro-updater"

echo.
echo  ============================================
echo   Gerenciar Licencas - ConstruPro ERP
echo  ============================================
echo.
echo  [1] Criar / Renovar token
echo  [2] Listar tokens
echo  [3] Sair
echo.
set /p OPCAO="Opcao: "

if "%OPCAO%"=="1" goto CRIAR
if "%OPCAO%"=="2" goto LISTAR
exit /b 0

:CRIAR
echo.
set /p TOKEN="Token de ativacao (ex: CONSTRUPRO-2026-ABC123): "
if "%TOKEN%"=="" ( echo  Token invalido! & pause & goto FIM )
set /p DATA="Data de validade (AAAA-MM-DD): "
if "%DATA%"=="" ( echo  Data invalida! & pause & goto FIM )
set /p EMPRESA="Nome da empresa: "
if "%EMPRESA%"=="" set EMPRESA=Cliente

echo.
echo  [1/2] Atualizando token...

:: Criar novaconstante LICENSES com o token
powershell -Command ^
  "$f='api\license\index.js';" ^
  "$c=Get-Content $f -Raw;" ^
  "$token='%TOKEN%'.ToUpper();" ^
  "$expires='%DATA%';" ^
  "$company='%EMPRESA%';" ^
  "$novo = '  '' + $token + ''': { expires: '' + $expires + '', company: '' + $company + '' },';" ^
  "$c=$c -replace 'const LICENSES = \{', ('const LICENSES = {' + [char]10 + $novo);" ^
  "Set-Content $f $c -NoNewline -Encoding UTF8"

echo  [2/2] Publicando no Vercel...
call vercel --yes --prod

echo.
echo  ============================================
echo   Token criado com sucesso!
echo  ============================================
echo  Token:    %TOKEN%
echo  Validade: %DATA%
echo  Empresa:  %EMPRESA%
echo  ============================================
echo.
echo  Envie este token ao cliente para ativar.
echo.
pause
goto FIM

:LISTAR
echo.
echo  Tokens cadastrados:
echo  -------------------
powershell -Command "Get-Content 'api\license\index.js' | Select-String -Pattern 'expires|company' | ForEach-Object { $_.Line.Trim() }"
echo.
pause

:FIM
