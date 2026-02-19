@echo off
chcp 65001 >nul
cls
echo ════════════════════════════════════════════════════════════
echo   WhatsApp Sender - Verificador de Compilación
echo ════════════════════════════════════════════════════════════
echo.

set ERROR=0

echo [1/6] Verificando ejecutable...
if exist "dist\WhatsAppSender.exe" (
    echo ✅ WhatsAppSender.exe encontrado
    for %%A in ("dist\WhatsAppSender.exe") do echo    Tamaño: %%~zA bytes
) else (
    echo ❌ WhatsAppSender.exe NO encontrado
    set ERROR=1
)

echo.
echo [2/6] Verificando carpetas de datos...
if exist "dist\data" (
    echo ✅ Carpeta data/ existe
) else (
    echo ❌ Carpeta data/ falta
    set ERROR=1
)

if exist "dist\uploads" (
    echo ✅ Carpeta uploads/ existe
) else (
    echo ❌ Carpeta uploads/ falta
    set ERROR=1
)

if exist "dist\drivers" (
    echo ✅ Carpeta drivers/ existe
) else (
    echo ❌ Carpeta drivers/ falta
    set ERROR=1
)

echo.
echo [3/6] Verificando archivos internos...
if exist "dist\_internal" (
    echo ✅ Carpeta _internal/ existe
    dir /b "dist\_internal" | find /c /v "" > nul
    if errorlevel 1 (
        echo ⚠️  _internal/ está vacía
        set ERROR=1
    ) else (
        echo    Contiene archivos empaquetados
    )
) else (
    echo ❌ Carpeta _internal/ NO existe
    set ERROR=1
)

echo.
echo [4/6] Verificando chromedriver...
if exist "dist\drivers\chromedriver.exe" (
    echo ✅ chromedriver.exe encontrado
) else (
    echo ⚠️  chromedriver.exe NO encontrado
    echo    Descárgalo de: https://chromedriver.chromium.org/
)

echo.
echo [5/6] Verificando README...
if exist "dist\README.txt" (
    echo ✅ README.txt encontrado
) else (
    echo ⚠️  README.txt no encontrado
)

echo.
echo [6/6] Comprobando tamaño total...
for /f "tokens=3" %%a in ('dir /s /-c "dist" ^| find "bytes"') do set SIZE=%%a
if defined SIZE (
    echo ✅ Tamaño total de dist/: %SIZE% bytes
) else (
    echo ⚠️  No se pudo calcular el tamaño
)

echo.
echo ════════════════════════════════════════════════════════════
if %ERROR%==0 (
    echo ✅ COMPILACIÓN CORRECTA - Puedes probar el ejecutable
    echo.
    echo Ejecuta: cd dist ^&^& WhatsAppSender.exe
) else (
    echo ❌ HAY PROBLEMAS - Revisa los errores arriba
    echo.
    echo Ejecuta: python build_exe.py
)
echo ════════════════════════════════════════════════════════════
echo.
pause