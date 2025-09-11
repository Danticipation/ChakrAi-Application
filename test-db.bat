@echo off
echo Testing Chakrai Database Connection...
cd /d "C:\8-14-Chakrai-App"
echo Current directory: %CD%
echo.
echo Running database test...
node test-updated-db.js
echo.
echo Test completed. Press any key to exit...
pause
