@echo off
setlocal

:: Setup paths
set "PROJECT_DIR=%~dp0"
set "TEMP_DIR=%TEMP%\dwellwell-zip"
set "ZIP_FILE=%PROJECT_DIR%DwellWell-clean.zip"

echo Zipping contents of: %PROJECT_DIR%
echo Excluding node_modules, .git, build, dist, log/tmp...

:: Clean temp and output
if exist "%TEMP_DIR%" rd /s /q "%TEMP_DIR%"
if exist "%ZIP_FILE%" del "%ZIP_FILE%"

:: Copy files (excluding folders)
xcopy "%PROJECT_DIR%*" "%TEMP_DIR%\" /s /e /i /y /exclude:%~dp0zip-exclude.txt >nul

:: Check if copy succeeded
if not exist "%TEMP_DIR%\*" (
    echo ❌ Copy failed — no files found in temp directory.
    pause
    exit /b 1
)

:: Zip the copied folder structure
powershell -NoProfile -Command ^
  "Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '%ZIP_FILE%' -Force"

:: Clean up
rd /s /q "%TEMP_DIR%"

:: Confirm result
if exist "%ZIP_FILE%" (
  echo.
  echo ✅ Zip created at: %ZIP_FILE%
) else (
  echo ❌ Failed to create zip file.
)

pause
