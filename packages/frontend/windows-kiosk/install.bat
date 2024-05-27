@echo off
cd /d "%~dp0"

REM Create shortcut for stele-start.bat in the Startup folder with minimized window
powershell -command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\stele-start.lnk'); $s.TargetPath='%~dp0stele-start.bat'; $s.WindowStyle=7; $s.Save()"

REM Create shortcut for startup.bat in the Startup folder with minimized window
powershell -command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\startup.lnk'); $s.TargetPath='%~dp0startup.bat'; $s.WindowStyle=7; $s.Save()"

REM Open the Startup folder to confirm shortcuts are in the correct location
explorer "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
