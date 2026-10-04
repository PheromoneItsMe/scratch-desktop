@echo off
title Scratch AI Studio
cd /d "%~dp0"
set USE_LOCAL_FILES=1
set PATH=C:\Program Files\nodejs;%PATH%
if "%~1"=="" (
    start "" wscript.exe "%~dp0run_studio.vbs"
) else (
    "C:\Program Files\nodejs\node.exe" "%~dp0node_modules\electron\cli.js" "%~dp0." "%~1"
)
