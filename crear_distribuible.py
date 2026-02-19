"""
Crear paquete distribuible de WhatsApp Sender
Incluye todo lo necesario para funcionar sin Python
"""
import os
import shutil
import zipfile
from datetime import datetime

def crear_estructura_distribuible():
    """Crear carpeta con todo lo necesario para distribuir"""
    
    print("📦 Creando paquete distribuible de WhatsApp Sender\n")
    
    # Nombre del paquete
    fecha = datetime.now().strftime("%Y%m%d_%H%M")
    nombre_carpeta = f"WhatsAppSender_Portable_{fecha}"
    
    # Verificar que existe el ejecutable compilado
    exe_origen = "dist/WhatsAppSender.exe"
    if not os.path.exists(exe_origen):
        print("❌ ERROR: No se encontró el ejecutable compilado")
        print("   Ejecuta primero: python build_exe.py")
        return None
    
    # Crear carpeta temporal
    if os.path.exists(nombre_carpeta):
        shutil.rmtree(nombre_carpeta)
    os.makedirs(nombre_carpeta)
    
    print("1️⃣ Copiando ejecutable...")
    shutil.copy2(exe_origen, nombre_carpeta)
    
    # Copiar carpetas necesarias si existen en dist
    carpetas_necesarias = ['templates', 'static', 'drivers', '_internal']
    
    for carpeta in carpetas_necesarias:
        origen = f"dist/{carpeta}"
        destino = f"{nombre_carpeta}/{carpeta}"
        
        if os.path.exists(origen):
            print(f"2️⃣ Copiando carpeta {carpeta}/...")
            shutil.copytree(origen, destino)
        else:
            # Si no existe en dist, copiar desde raíz (para templates y static)
            if carpeta in ['templates', 'static'] and os.path.exists(carpeta):
                print(f"2️⃣ Copiando carpeta {carpeta}/ desde raíz...")
                shutil.copytree(carpeta, destino)
    
    # Verificar drivers
    drivers_destino = f"{nombre_carpeta}/drivers"
    if not os.path.exists(drivers_destino):
        os.makedirs(drivers_destino)
        print("⚠️  IMPORTANTE: Debes copiar manualmente chromedriver.exe a:")
        print(f"   {drivers_destino}/")
    
    # Crear carpetas vacías necesarias
    print("3️⃣ Creando carpetas de datos...")
    os.makedirs(f"{nombre_carpeta}/data", exist_ok=True)
    os.makedirs(f"{nombre_carpeta}/uploads", exist_ok=True)
    
    # Crear README con instrucciones
    print("4️⃣ Creando instrucciones...")
    crear_readme(nombre_carpeta)
    
    # Crear script de verificación
    crear_verificador(nombre_carpeta)
    
    # Calcular tamaño
    tamaño_total = calcular_tamaño(nombre_carpeta)
    
    print(f"\n✅ Carpeta portable creada: {nombre_carpeta}/")
    print(f"📊 Tamaño total: {tamaño_total:.1f} MB\n")
    
    return nombre_carpeta

def crear_readme(carpeta):
    """Crear archivo README con instrucciones"""
    
    readme_content = """
╔══════════════════════════════════════════════════════════════╗
║           WhatsApp Sender - Aplicación Portable             ║
║                     Versión 1.0.0                            ║
╚══════════════════════════════════════════════════════════════╝

📋 REQUISITOS MÍNIMOS:
  ✅ Windows 10/11 (64-bit)
  ✅ Google Chrome o Microsoft Edge instalado
  ✅ Conexión a Internet
  ✅ 4 GB RAM mínimo
  ✅ 500 MB de espacio en disco

🚀 INSTRUCCIONES DE USO:

1️⃣ PRIMERA VEZ:
   - Extrae TODA la carpeta en un lugar permanente
     (Ej: C:\\Programas\\WhatsAppSender\\)
   
   - NO muevas solo el .exe, mueve TODA la carpeta

2️⃣ INICIAR LA APLICACIÓN:
   - Doble clic en: WhatsAppSender.exe
   
   - Espera 10-30 segundos la primera vez
   
   - Se abrirá la ventana de la aplicación

3️⃣ CONECTAR WHATSAPP:
   - Ve a la pestaña "Configuración"
   
   - Haz clic en "Conectar WhatsApp"
   
   - Escanea el código QR con tu teléfono
   
   - ¡Listo! Ya puedes enviar mensajes

📁 ESTRUCTURA DE ARCHIVOS:

WhatsAppSender/
├── WhatsAppSender.exe  ← Ejecutable principal
├── drivers/
│   └── chromedriver.exe  ← Driver del navegador
├── templates/          ← Plantillas HTML (NO BORRAR)
├── static/             ← Estilos y JavaScript (NO BORRAR)
├── data/               ← Datos y configuración
│   ├── whatsapp_cookies.pkl
│   └── browser_profile/
└── uploads/            ← Archivos Excel subidos

⚠️ IMPORTANTE:
  • NO borres ninguna carpeta
  • NO muevas el .exe fuera de esta carpeta
  • Mantén todo junto en la misma ubicación

🐛 SOLUCIÓN DE PROBLEMAS:

Problema: "No se puede abrir WhatsApp Web"
Solución: 
  - Verifica que Chrome/Edge esté instalado
  - Verifica que drivers/chromedriver.exe exista
  - Actualiza Chrome a la última versión

Problema: "La aplicación tarda mucho en abrir"
Solución:
  - Es normal la primera vez (10-30 segundos)
  - Las siguientes veces será más rápido
  - Si tarda más de 1 minuto, reinicia el .exe

Problema: Windows Defender lo marca como amenaza
Solución:
  - Es un falso positivo
  - Agrega excepción en Windows Defender
  - El .exe NO es un virus

Problema: "No se pueden enviar mensajes"
Solución:
  - Reconecta WhatsApp en Configuración
  - Verifica tu conexión a Internet
  - Cierra otras instancias de WhatsApp Web

📞 SOPORTE:
  - Email: [tu_email@ejemplo.com]
  - Telegram: @tu_usuario
  - GitHub: [tu_repositorio]

📜 LICENCIA:
  Este software es de uso personal/comercial.
  Desarrollado por [Tu Nombre/Empresa]
  
═══════════════════════════════════════════════════════════════

🎉 ¡Gracias por usar WhatsApp Sender!

═══════════════════════════════════════════════════════════════
"""
    
    with open(f"{carpeta}/LEEME.txt", "w", encoding="utf-8") as f:
        f.write(readme_content)

def crear_verificador(carpeta):
    """Crear script de verificación de archivos"""
    
    verificador = """@echo off
chcp 65001 >nul
echo ════════════════════════════════════════════
echo   WhatsApp Sender - Verificador de Archivos
echo ════════════════════════════════════════════
echo.

set ERROR=0

echo [1/5] Verificando ejecutable principal...
if exist "WhatsAppSender.exe" (
    echo ✅ WhatsAppSender.exe encontrado
) else (
    echo ❌ WhatsAppSender.exe NO encontrado
    set ERROR=1
)

echo.
echo [2/5] Verificando carpeta templates...
if exist "templates" (
    echo ✅ Carpeta templates/ encontrada
) else (
    echo ❌ Carpeta templates/ NO encontrada
    set ERROR=1
)

echo.
echo [3/5] Verificando carpeta static...
if exist "static" (
    echo ✅ Carpeta static/ encontrada
) else (
    echo ❌ Carpeta static/ NO encontrada
    set ERROR=1
)

echo.
echo [4/5] Verificando carpeta drivers...
if exist "drivers" (
    echo ✅ Carpeta drivers/ encontrada
    if exist "drivers\\chromedriver.exe" (
        echo ✅ chromedriver.exe encontrado
    ) else (
        echo ⚠️  chromedriver.exe NO encontrado
        echo    Descárgalo de: https://chromedriver.chromium.org/
        set ERROR=1
    )
) else (
    echo ❌ Carpeta drivers/ NO encontrada
    set ERROR=1
)

echo.
echo [5/5] Verificando carpetas de datos...
if exist "data" (
    echo ✅ Carpeta data/ encontrada
) else (
    mkdir data
    echo ✅ Carpeta data/ creada
)

if exist "uploads" (
    echo ✅ Carpeta uploads/ encontrada
) else (
    mkdir uploads
    echo ✅ Carpeta uploads/ creada
)

echo.
echo ════════════════════════════════════════════
if %ERROR%==0 (
    echo ✅ ¡TODO CORRECTO! Puedes ejecutar WhatsAppSender.exe
) else (
    echo ❌ FALTAN ARCHIVOS - Revisa el archivo LEEME.txt
)
echo ════════════════════════════════════════════
echo.
pause
"""
    
    with open(f"{carpeta}/verificar.bat", "w", encoding="utf-8") as f:
        f.write(verificador)

def crear_zip(carpeta):
    """Crear archivo ZIP del paquete"""
    
    print("5️⃣ Creando archivo ZIP...")
    
    nombre_zip = f"{carpeta}.zip"
    
    with zipfile.ZipFile(nombre_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(carpeta):
            for file in files:
                archivo_completo = os.path.join(root, file)
                archivo_relativo = os.path.relpath(archivo_completo, carpeta)
                zipf.write(archivo_completo, os.path.join(os.path.basename(carpeta), archivo_relativo))
    
    tamaño_zip = os.path.getsize(nombre_zip) / 1024 / 1024
    
    print(f"✅ ZIP creado: {nombre_zip}")
    print(f"📊 Tamaño comprimido: {tamaño_zip:.1f} MB\n")
    
    return nombre_zip

def calcular_tamaño(carpeta):
    """Calcular tamaño total de una carpeta en MB"""
    total = 0
    for dirpath, dirnames, filenames in os.walk(carpeta):
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            total += os.path.getsize(filepath)
    return total / 1024 / 1024

def main():
    """Proceso principal"""
    
    # Crear carpeta portable
    carpeta = crear_estructura_distribuible()
    
    if not carpeta:
        return
    
    # Preguntar si crear ZIP
    print("¿Deseas crear también un archivo ZIP? (s/n): ", end="")
    respuesta = input().lower()
    
    if respuesta == 's':
        nombre_zip = crear_zip(carpeta)
        print("\n" + "="*60)
        print("✅ PAQUETE DISTRIBUIBLE COMPLETADO")
        print("="*60)
        print(f"\n📁 Carpeta: {carpeta}/")
        print(f"📦 ZIP: {nombre_zip}")
        print("\n📋 PARA DISTRIBUIR:")
        print(f"   Opción 1: Comparte el ZIP: {nombre_zip}")
        print(f"   Opción 2: Comparte la carpeta: {carpeta}/")
    else:
        print("\n" + "="*60)
        print("✅ PAQUETE DISTRIBUIBLE COMPLETADO")
        print("="*60)
        print(f"\n📁 Carpeta: {carpeta}/")
        print("\n📋 PARA DISTRIBUIR:")
        print(f"   Comparte toda la carpeta: {carpeta}/")
    
    print("\n⚠️  NO OLVIDES:")
    print("   1. Copiar chromedriver.exe a la carpeta drivers/")
    print("   2. Probar el ejecutable antes de distribuir")
    print("   3. Incluir el archivo LEEME.txt\n")

if __name__ == "__main__":
    main()