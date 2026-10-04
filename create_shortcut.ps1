$WshShell = New-Object -ComObject WScript.Shell
$desktopPath = [System.Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktopPath "Scratch AI Studio.lnk"
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = "c:\Projects\Work\Scratch_AI_Studio\run_studio.bat"
$Shortcut.WorkingDirectory = "c:\Projects\Work\Scratch_AI_Studio"
$Shortcut.IconLocation = "c:\Projects\Work\Scratch_AI_Studio\src\icon\ScratchDesktop.ico"
$Shortcut.Description = "Scratch AI Studio with Live AI Co-Pilot (by Pheromone)"
$Shortcut.Save()
Write-Output "Shortcut updated at: $shortcutPath"
