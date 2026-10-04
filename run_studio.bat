@echo off
title Scratch AI Studio
cd /d "%~dp0"
set USE_LOCAL_FILES=1
"C:\Program Files\nodejs\node.exe" "%~dp0node_modules\electron\cli.js" "%~dp0." %*
