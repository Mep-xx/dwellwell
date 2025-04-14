@echo off
setlocal

:: Change this to your actual folder path if needed
set PROJECT_DIR=%~dp0DwellWell
set OUTPUT_ZIP=%~dp0DwellWell-clean.zip

:: Delete old zip if it exists
if exist "%OUTPUT_ZIP%" del "%OUTPUT_ZIP%"

echo Creating zip archive without node_modules and other excluded folders...

powershell -Command ^
  "Compress-Archive -Path (Get-ChildItem '%PROJECT_DIR%' -Recurse -Force | Where-Object {
    $_.FullName -notmatch '\\node_modules\\' -and
    $_.FullName -notmatch '\\\.git\\' -and
    $_.FullName -notmatch '\\dist\\' -and
    $_.FullName -notmatch '\\build\\' -and
    $_.FullName -notmatch '\\\.next\\' -and
    $_.FullName -notmatch '\\\.turbo\\' -and
    $_.FullName -notmatch '\\coverage\\' -and
    $_.Name -notmatch '\.log$' -and
    $_.Name -notmatch '\.tmp$'
  } | Select-Object -ExpandProperty FullName) ^
  -DestinationPath '%OUTPUT_ZIP%' -Force"

echo Done! Created: %OUTPUT_ZIP%
pause
