@echo off
title Scratch AI Studio
cd /d "%~dp0"
set USE_LOCAL_FILES=1
start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0." %*
