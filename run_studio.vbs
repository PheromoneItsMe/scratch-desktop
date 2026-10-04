Set w = CreateObject("WScript.Shell")
Set env = w.Environment("PROCESS")
env("USE_LOCAL_FILES") = "1"
w.CurrentDirectory = "C:\Projects\Work\Scratch_AI_Studio"
w.Run "C:\PROGRA~1\nodejs\node.exe C:\Projects\Work\Scratch_AI_Studio\node_modules\electron\cli.js .", 0, True
