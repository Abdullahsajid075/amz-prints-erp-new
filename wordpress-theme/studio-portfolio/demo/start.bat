@echo off
cd /d "%~dp0"
echo.
echo   Studio Portfolio - Local Demo
echo   =============================
echo.

where node >nul 2>nul
if %ERRORLEVEL%==0 (
  echo   Starting server with Node...
  echo   Open: http://localhost:3000
  echo.
  echo   Press Ctrl+C to stop
  echo.
  npx --yes serve -l 3000 .
  goto :eof
)

where python >nul 2>nul
if %ERRORLEVEL%==0 (
  echo   Starting server with Python...
  echo   Open: http://localhost:8080
  echo.
  python -m http.server 8080
  goto :eof
)

echo   ERROR: Install Node.js from https://nodejs.org
pause
