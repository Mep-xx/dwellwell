@echo off
setlocal

:: =========================
:: Settings
:: =========================
set "PROJECT_DIR=%~dp0"
set "EXCLUDE_LIST=%~dp07zip-exclude.txt"

:: Choose archive format: zip or 7z
set "ARCHIVE_FORMAT=7z"   :: change to zip for .zip archives

set "ARCHIVE_BASENAME=DwellWell-clean"
set "ARCHIVE_FILE=%PROJECT_DIR%%ARCHIVE_BASENAME%.%ARCHIVE_FORMAT%"

echo Archiving: %PROJECT_DIR%
echo.

:: =========================
:: Locate 7-Zip
:: =========================
set "SEVENZIP=%ProgramFiles%\7-Zip\7z.exe"
if not exist "%SEVENZIP%" set "SEVENZIP=%ProgramFiles(x86)%\7-Zip\7z.exe"
if not exist "%SEVENZIP%" set "SEVENZIP=7z.exe"
if not exist "%SEVENZIP%" (
  echo ❌ Could not find 7z.exe. Add 7-Zip to PATH or adjust script.
  pause
  exit /b 1
)

:: =========================
:: Cleanup old archive
:: =========================
if exist "%ARCHIVE_FILE%" del /f /q "%ARCHIVE_FILE%" >nul 2>&1

:: =========================
:: Build exclude options (no delayed expansion -> safe to use -x!)
:: =========================
set "EXCLUDES="

if exist "%EXCLUDE_LIST%" (
  echo Using exclude file: %EXCLUDE_LIST%
  rem IMPORTANT: use -xr@ to apply patterns recursively
  set "EXCLUDES=-xr@%EXCLUDE_LIST%"
) else (
  echo No zip-exclude.txt found; using default folder excludes.
  set "EXCLUDES=-xr!node_modules -xr!.git -xr!build -xr!dist -xr!log -xr!tmp"
)

:: Always exclude the output archive and this script
set "EXCLUDES=%EXCLUDES% -x!%ARCHIVE_BASENAME%.zip -x!%ARCHIVE_BASENAME%.7z -x!%~nx0"

:: =========================
:: Archive
:: =========================
pushd "%PROJECT_DIR%"
if /i "%ARCHIVE_FORMAT%"=="zip" (
  "%SEVENZIP%" a -tzip -mx=9 -r -spf2 "%ARCHIVE_FILE%" * %EXCLUDES%
) else (
  "%SEVENZIP%" a -t7z  -mx=9 -r -spf2 "%ARCHIVE_FILE%" * %EXCLUDES%
)
set "ERR=%ERRORLEVEL%"
popd

echo.

:: =========================
:: Result
:: =========================
if "%ERR%"=="0" (
  if exist "%ARCHIVE_FILE%" (
    echo ✅ Archive created: %ARCHIVE_FILE%
  ) else (
    echo ❌ Archive not found at: %ARCHIVE_FILE%
  )
) else (
  echo ❌ 7-Zip failed with errorlevel %ERR%.
)

pause
