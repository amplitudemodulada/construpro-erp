@echo off
cd /d "%~dp0"
if not exist "out\main\index.js" ( echo Sistema nao compilado! & pause & exit /b 1 )
if not exist "node_modules\.bin\electron.cmd" ( echo Dependencias nao instaladas! & pause & exit /b 1 )
set NODE_ENV=production
start "" "node_modules\.bin\electron.cmd" .
