@echo off
title ConstruPro ERP - Gerenciar Licencas
cd /d "C:\projetos\OPENCODE\construpro-updater"

echo.
echo  ============================================
echo   Gerenciar Licencas - ConstruPro ERP
echo  ============================================
echo.
echo  [1] Renovar / Cadastrar licenca
echo  [2] Bloquear cliente
echo  [3] Sair
echo.
set /p OPCAO="Opcao: "

if "%OPCAO%"=="1" goto RENOVAR
if "%OPCAO%"=="2" goto BLOQUEAR
exit /b 0

:RENOVAR
echo.
echo  Informe os dados do cliente:
set /p HW="Hardware ID: "
if "%HW%"=="" ( echo  ID invalido! & pause & goto FIM )
set /p DATA="Data de validade (AAAA-MM-DD): "
if "%DATA%"=="" ( echo  Data invalida! & pause & goto FIM )
set /p EMPRESA="Nome da empresa: "
if "%EMPRESA%"=="" set EMPRESA=Cliente

echo.
echo  [1/2] Atualizando licenca...
powershell -Command "$f='api\license\index.js'; $c=Get-Content $f -Raw; $novo=\"  '%HW%': { expires: '%DATA%', status: 'active', company: '%EMPRESA%' },`n\"; $c=$c -replace 'const LICENSES = \{', ('const LICENSES = {' + [char]10 + $novo); Set-Content $f $c -NoNewline -Encoding UTF8"

echo  [2/2] Publicando no Vercel...
call vercel --yes --prod

echo.
echo  ============================================
echo   Licenca renovada com sucesso!
echo  ============================================
echo  Hardware: %HW%
echo  Validade: %DATA%
echo  Empresa:  %EMPRESA%
echo  ============================================
pause
goto FIM

:BLOQUEAR
echo.
set /p HW="Hardware ID para bloquear: "
if "%HW%=="" goto FIM

powershell -Command "$f='api\license\index.js'; $c=Get-Content $f -Raw; $c=$c -replace ('''%HW%'':.*?},'), ('''%HW%'': { expires: '1970-01-01', status: 'blocked', company: 'Bloqueado' },'); Set-Content $f $c -NoNewline -Encoding UTF8"

call vercel --yes --prod
echo  Cliente bloqueado!
pause

:FIM
