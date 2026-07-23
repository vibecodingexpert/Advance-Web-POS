@echo off
echo Starting MySQL...
start /B "" "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --datadir="C:\Users\Amir\AppData\Local\Temp\mysql-data" --port=3306
timeout /t 8 /nobreak >nul
echo Starting Backend Server...
start /B "" "node" "C:\Users\Amir\Documents\New OpenCode Project\advance-web-pos\backend\server.js"
echo.
echo ===========================================
echo  POS System is running!
echo.
echo  Frontend: https://frontend-six-rho-rwhnsim9w4.vercel.app
echo  Backend:  http://localhost:5000
echo.
echo  Admin:   http://localhost:3000/secure/login
echo  Client:  http://localhost:3000/portal/login
echo.
echo  Login:   admin@pos.com / Admin@12345
echo ===========================================
echo.
pause
