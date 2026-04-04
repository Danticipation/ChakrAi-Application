@echo off
echo Creating Chakrai Database Tables...
cd /d "C:\8-14-Chakrai-App"
echo Current directory: %CD%
echo.
echo Running database migration...
npm run db:push
echo.
echo Migration completed. Press any key to exit...
pause
