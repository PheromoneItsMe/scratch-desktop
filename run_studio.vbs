Set WshShell = CreateObject("WScript.Shell")
Set WshEnv = WshShell.Environment("PROCESS")
WshEnv("USE_LOCAL_FILES") = "1"
WshEnv("PATH") = "C:\Program Files\nodejs;" & WshEnv("PATH")
WshShell.CurrentDirectory = "C:\Projects\Work\Scratch_AI_Studio"
WshShell.Run """C:\Program Files\nodejs\node.exe"" ""C:\Projects\Work\Scratch_AI_Studio\node_modules\electron\cli.js"" ""C:\Projects\Work\Scratch_AI_Studio""", 0, False
