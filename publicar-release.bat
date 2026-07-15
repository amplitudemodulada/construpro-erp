@echo off
setlocal

echo ===================================
echo  ConstruPro ERP - Criar Release
echo ===================================
echo.

:: Solicitar versão
set /p VERSION="Digite a versao (ex: 1.1.0): "
if "%VERSION%"=="" (
    echo Versao invalida!
    exit /b 1
)

:: Build
echo.
echo [1/4] Buildando o projeto...
call npm run build
if %errorlevel% neq 0 (
    echo Erro no build!
    exit /b 1
)

:: Copiar arquivos para pasta temporária
echo.
echo [2/4] Preparando arquivos...
if exist "%TEMP%\construpro-release" rmdir /S /Q "%TEMP%\construpro-release"
mkdir "%TEMP%\construpro-release"
xcopy /E /Y /I out "%TEMP%\construpro-release\out"
copy /Y version.json "%TEMP%\construpro-release\"
copy /Y package.json "%TEMP%\construpro-release\"

:: Criar zip
echo.
echo [3/4] Criando pacote...
powershell -Command "Compress-Archive -Path '%TEMP%\construpro-release\*' -DestinationPath '%TEMP%\ConstruPro-ERP-v%VERSION%.zip' -Force"

:: Criar release no GitHub
echo.
echo [4/4] Publicando release v%VERSION%...
gh release create "v%VERSION%" "%TEMP%\ConstruPro-ERP-v%VERSION%.zip" --title "ConstruPro ERP v%VERSION%" --notes "Atualização do sistema ConstruPro ERP" --latest

if %errorlevel% equ 0 (
    echo.
    echo ===================================
    echo  Release v%VERSION% criada com sucesso!
    echo ===================================
) else (
    echo.
    echo Erro ao criar release!
)

:: Limpar
rmdir /S /Q "%TEMP%\construpro-release"
del "%TEMP%\ConstruPro-ERP-v%VERSION%.zip" 2>nul

pause
