@echo off
cd /d "%~dp0"

REM Copy launch-kiosk.bat to startup folder
copy /Y "launch-kiosk.bat" "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\launch-kiosk.bat"

REM Copy startup.bat to startup folder
copy /Y "startup.bat" "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\startup.bat"

REM Open the Startup folder to confirm startup files are in the correct location
explorer "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
