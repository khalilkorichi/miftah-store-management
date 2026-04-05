@echo off
chcp 65001 > nul
title إدارة منتجات مفتاح

echo.
echo  ╔══════════════════════════════════════╗
echo  ║      إدارة منتجات مفتاح             ║
echo  ║      جاري تشغيل البرنامج...         ║
echo  ╚══════════════════════════════════════╝
echo.

:: التحقق من وجود Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [خطأ] لم يتم العثور على Node.js!
    echo  الرجاء تثبيت Node.js من https://nodejs.org/
    pause
    exit /b 1
)

:: الانتقال إلى مجلد المشروع
cd /d "%~dp0"

:: التحقق من وجود node_modules
if not exist "node_modules" (
    echo  [تنبيه] جاري تثبيت المكتبات المطلوبة، انتظر...
    npm install
    echo  [تم] تم تثبيت المكتبات بنجاح!
    echo.
)

:: فتح المتصفح بعد ثانيتين
start "" /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5173"

echo  [تشغيل] البرنامج يعمل على: http://localhost:5173
echo  [تلميح] أغلق هذه النافذة لإيقاف البرنامج
echo.

:: تشغيل الخادم
npm run dev

pause
