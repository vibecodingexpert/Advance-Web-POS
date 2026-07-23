@echo off
echo Stopping MySQL...
taskkill /F /IM mysqld.exe >nul 2>&1
echo Stopping Backend Server...
taskkill /F /IM node.exe >nul 2>&1
echo Stopped.
pause
