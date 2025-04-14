@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "ZIP_FILE=%PROJECT_DIR%DwellWell-clean.zip"

echo Zipping contents of: %PROJECT_DIR%
echo Excluding node_modules, .git, build, dist, log/tmp...

:: Remove previous zip if it exists
if exist "%ZIP_FILE%" (
  del "%ZIP_FILE%"
)

powershell -NoProfile -Command ^
  "$files = Get-ChildItem -Path '%PROJECT_DIR%' -Recurse -File | Where-Object { $_.FullName -notmatch 'node_modules|\\build|\\dist|\\.git|\\.next|\\.turbo|\\.vercel|\\.idea|\\.log$|\\.tmp$' }; Compress-Archive -Path $files.FullName -DestinationPath '%ZIP_FILE%' -Force"

if exist "%ZIP_FILE%" (
  echo.
  echo ✅ Zip created at: %ZIP_FILE%
) else (
  echo ❌ Failed to create zip file.
)

pause
