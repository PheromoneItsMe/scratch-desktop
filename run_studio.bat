@echo off
cd /d "c:\Projects\Work\Scratch_AI_Studio"
set USE_LOCAL_FILES=1
start "Scratch AI Studio" "C:\Program Files\nodejs\node.exe" "c:\Projects\Work\Scratch_AI_Studio\node_modules\electron\cli.js" "."
exit
