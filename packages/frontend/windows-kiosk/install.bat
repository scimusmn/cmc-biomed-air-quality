# This installation script will place and configure the launch files inside the Windows startup folder

# Copy launch-kiosk.bat to startup folder
copy /Y "C:\Users\exhibits\Documents\SMM\Dev\cmc-biomed-air-quality\packages\frontend\windows-kiosk\launch-kiosk.bat" "C:\Users\exhibits\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\launch-kiosk.bat"

# Copy startup.bat to startup folder
copy /Y "C:\Users\exhibits\Documents\SMM\Dev\cmc-biomed-air-quality\packages\frontend\windows-kiosk\startup.bat" "C:\Users\exhibits\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\startup.bat"

# Open the Startup folder to confirm startup files are in the correct location
explorer "C:\Users\exhibits\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup"
