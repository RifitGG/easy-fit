@echo off
chcp 65001 >nul 2>&1
title EasyFit — Запуск всех сервисов
color 0B

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║         EasyFit — Проверка и запуск          ║
echo  ╚══════════════════════════════════════════════╝
echo.

set "ROOT=%~dp0"
set "HAS_ERROR=0"

:: ============================================================
:: 1. Проверка Node.js
:: ============================================================
echo  [1/5] Проверка Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo         ✗ Node.js не найден! Установите: https://nodejs.org
    set "HAS_ERROR=1"
    goto :checks_done
) else (
    for /f "tokens=*" %%v in ('node -v') do echo         ✓ Node.js %%v
)

:: ============================================================
:: 2. Проверка зависимостей приложения (Expo)
:: ============================================================
echo  [2/5] Проверка зависимостей Expo...
if not exist "%ROOT%node_modules\" (
    color 0E
    echo         ✗ Зависимости Expo не установлены!
    echo           Выполните: cd "%ROOT%" ^&^& npm install
    set "HAS_ERROR=1"
) else (
    echo         ✓ node_modules найден
)

:: ============================================================
:: 3. Проверка зависимостей backend
:: ============================================================
echo  [3/5] Проверка зависимостей Backend...
if not exist "%ROOT%backend\node_modules\" (
    color 0E
    echo         ✗ Зависимости Backend не установлены!
    echo           Выполните: cd "%ROOT%backend" ^&^& npm install
    set "HAS_ERROR=1"
) else (
    echo         ✓ backend/node_modules найден
)

:: ============================================================
:: 4. Проверка .env
:: ============================================================
echo  [4/5] Проверка конфигурации...
if not exist "%ROOT%backend\.env" (
    color 0E
    echo         ✗ Файл backend\.env не найден!
    set "HAS_ERROR=1"
) else (
    echo         ✓ backend\.env найден
)

:: ============================================================
:: 5. Проверка БД PostgreSQL
:: ============================================================
echo  [5/5] Проверка PostgreSQL (БД fitapp)...
node -e "require('dotenv').config({override:true,path:'%ROOT%backend\\.env'});const {Pool}=require('%ROOT%backend\\node_modules\\pg');const p=new Pool({host:process.env.DB_HOST,port:parseInt(process.env.DB_PORT),database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});p.query('SELECT 1').then(()=>{console.log('        ✓ БД fitapp доступна (порт '+process.env.DB_PORT+')');process.exit(0)}).catch(e=>{console.log('        ✗ БД недоступна: '+e.message);process.exit(1)}).finally(()=>p.end())" 2>nul
if %errorlevel% neq 0 (
    color 0E
    echo           Убедитесь что PostgreSQL запущен и БД fitapp создана
    echo           psql -U postgres -p 4000 -c "CREATE DATABASE fitapp;"
    echo           Затем: cd backend ^&^& npm run db:create ^&^& npm run db:seed
    set "HAS_ERROR=1"
)

:checks_done
echo.

:: Если есть ошибки — спросить продолжать ли
if "%HAS_ERROR%"=="1" (
    color 0E
    echo  ⚠  Обнаружены проблемы (см. выше).
    echo.
    set /p CONTINUE="  Продолжить запуск? (y/n): "
    if /i not "%CONTINUE%"=="y" (
        echo  Отменено.
        pause
        exit /b 1
    )
    color 0B
)

echo  ╔══════════════════════════════════════════════╗
echo  ║            Запуск всех сервисов...           ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: ============================================================
:: Убиваем старые процессы на нужных портах
:: ============================================================
echo  Освобождаю порты 3000, 5500, 8081...
for %%P in (3000 5500 8081) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%P ^| findstr LISTENING 2^>nul') do (
        if %%a neq 0 (
            taskkill /PID %%a /F >nul 2>&1
        )
    )
)
timeout /t 1 /nobreak >nul

:: ============================================================
:: Запуск Backend (порт 3000)
:: ============================================================
echo  [1/3] Запуск Backend API (порт 3000)...
start "EasyFit Backend" /min cmd /k "cd /d "%ROOT%backend" && title EasyFit Backend && color 0A && node src/index.js"
timeout /t 2 /nobreak >nul

:: ============================================================
:: Запуск Landing Page (порт 5500)
:: ============================================================
echo  [2/3] Запуск Landing Page (порт 5500)...
start "EasyFit Landing" /min cmd /k "cd /d "%ROOT%landing" && title EasyFit Landing && color 0D && npx serve -l 5500 -s . --no-clipboard 2>nul || (echo Установка serve... && npm i -g serve && serve -l 5500 -s . --no-clipboard)"
timeout /t 1 /nobreak >nul

:: ============================================================
:: Запуск Expo (порт 8081)
:: ============================================================
echo  [3/3] Запуск Expo Dev Server...
start "EasyFit Expo" cmd /k "cd /d "%ROOT%" && title EasyFit Expo && color 0E && npx expo start --go"

:: ============================================================
:: Готово
:: ============================================================
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║            ✓ Все сервисы запущены!           ║
echo  ╠══════════════════════════════════════════════╣
echo  ║  Backend API:  http://localhost:3000/api     ║
echo  ║  Landing Page: http://localhost:5500         ║
echo  ║  Expo:         Сканируйте QR в окне Expo    ║
echo  ╠══════════════════════════════════════════════╣
echo  ║  Закройте это окно чтобы завершить всё       ║
echo  ╚══════════════════════════════════════════════╝
echo.
pause

:: При закрытии — убиваем дочерние окна
taskkill /FI "WINDOWTITLE eq EasyFit Backend" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq EasyFit Landing" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq EasyFit Expo" /F >nul 2>&1
