"""
Script para crear ejecutable de WhatsApp Sender
VERSIÓN CORREGIDA v5.0 - PILLOW + REPORTLAB FUNCIONAL
"""
import PyInstaller.__main__
import os
import shutil
import sys

def limpiar_completamente():
    """Limpiar TODO antes de compilar"""
    print("🧹 Limpieza profunda del proyecto...")
    
    carpetas_eliminar = [
        'build', 
        'dist', 
        '__pycache__',
    ]
    
    for carpeta in carpetas_eliminar:
        if os.path.exists(carpeta):
            shutil.rmtree(carpeta)
            print(f"   ✅ {carpeta}/ eliminado")
    
    for archivo in os.listdir('.'):
        if archivo.endswith('.spec'):
            os.remove(archivo)
            print(f"   ✅ {archivo} eliminado")
    
    for root, dirs, files in os.walk('.'):
        if '__pycache__' in dirs:
            shutil.rmtree(os.path.join(root, '__pycache__'))
        for file in files:
            if file.endswith('.pyc'):
                os.remove(os.path.join(root, file))

def verificar_archivos_criticos():
    """Verificar que existan archivos necesarios"""
    print("\n🔍 Verificando archivos críticos...")
    
    archivos_requeridos = {
        'launcher.py': 'Punto de entrada',
        'app.py': 'Aplicación Flask',
        'templates': 'Plantillas HTML',
        'static': 'Archivos estáticos',
        'models': 'Modelos de datos',
        'routes': 'Rutas de la aplicación',
        'utils': 'Utilidades',
        '.env': 'Configuración',
        'config_drivers.py': 'Configuración de drivers'
    }
    
    faltantes = []
    for archivo, descripcion in archivos_requeridos.items():
        if os.path.exists(archivo):
            print(f"   ✅ {archivo} - {descripcion}")
        else:
            print(f"   ❌ {archivo} - {descripcion} FALTANTE")
            faltantes.append(archivo)
    
    if faltantes:
        print(f"\n❌ ERROR: Faltan archivos críticos: {', '.join(faltantes)}")
        sys.exit(1)
    
    return True

def obtener_ruta_reportlab():
    """Obtener ruta de instalación de ReportLab"""
    try:
        import reportlab
        ruta = os.path.dirname(reportlab.__file__)
        print(f"   📍 ReportLab encontrado en: {ruta}")
        return ruta
    except ImportError:
        print("   ❌ ReportLab NO está instalado")
        return None

def obtener_ruta_pillow():
    """Obtener ruta de instalación de Pillow"""
    try:
        import PIL
        ruta = os.path.dirname(PIL.__file__)
        print(f"   📍 Pillow encontrado en: {ruta}")
        return ruta
    except ImportError:
        print("   ❌ Pillow NO está instalado")
        return None

def construir_ejecutable():
    """Construir el ejecutable con configuración correcta"""
    print("\n" + "=" * 70)
    print("🔨 Construyendo ejecutable de WhatsApp Sender Pro")
    print("=" * 70 + "\n")
    
    ico_path = 'static/imagenes/logo.ico'
    tiene_icono = os.path.exists(ico_path)
    
    if not tiene_icono:
        print("⚠️  Icono no encontrado, continuando sin icono...")
    
    # Obtener rutas de ReportLab y Pillow
    ruta_reportlab = obtener_ruta_reportlab()
    ruta_pillow = obtener_ruta_pillow()
    
    if not ruta_reportlab:
        print("\n❌ ERROR CRÍTICO: ReportLab no está instalado")
        print("   Instala con: pip install reportlab")
        return False
    
    if not ruta_pillow:
        print("\n❌ ERROR CRÍTICO: Pillow no está instalado")
        print("   Instala con: pip install Pillow")
        return False
    
    # CONFIGURACIÓN COMPLETA CON PILLOW + REPORTLAB
    opciones = [
        'launcher.py',
        '--name=WhatsAppSender',
        '--onefile',
        '--windowed',
        '--clean',
        '--noconfirm',
        
        # ═══ DATOS - PATHS CORREGIDOS ═══
        '--add-data=templates;templates',
        '--add-data=static;static',
        '--add-data=models;models',
        '--add-data=routes;routes',
        '--add-data=utils;utils',
        '--add-data=.env;.',
        '--add-data=config_drivers.py;.',
        '--add-data=configuracion.py;.',
        
        # ═══ REPORTLAB Y PILLOW - INCLUIR PAQUETES COMPLETOS ═══
        f'--add-data={ruta_reportlab};reportlab',
        f'--add-data={ruta_pillow};PIL',
        
        # ═══ IMPORTS OCULTOS CRÍTICOS ═══
        '--hidden-import=flask',
        '--hidden-import=flask_socketio',
        '--hidden-import=selenium',
        '--hidden-import=selenium.webdriver',
        '--hidden-import=selenium.webdriver.chrome',
        '--hidden-import=selenium.webdriver.chrome.service',
        '--hidden-import=selenium.webdriver.chrome.options',
        '--hidden-import=selenium.webdriver.edge',
        '--hidden-import=selenium.webdriver.edge.service',
        '--hidden-import=selenium.webdriver.edge.options',
        
        # ═══ PANDAS Y NUMPY ═══
        '--hidden-import=pandas',
        '--hidden-import=pandas.core',
        '--hidden-import=pandas.io',
        '--hidden-import=pandas.io.excel',
        '--hidden-import=pandas.io.excel._openpyxl',
        '--hidden-import=numpy',
        '--hidden-import=numpy.core',
        '--hidden-import=numpy.core.multiarray',
        '--hidden-import=numpy.core._methods',
        '--hidden-import=numpy.lib',
        '--hidden-import=numpy.lib.format',
        '--hidden-import=openpyxl',
        '--hidden-import=openpyxl.cell',
        '--hidden-import=openpyxl.styles',
        '--hidden-import=openpyxl.worksheet',
        '--hidden-import=openpyxl.workbook',
        
        # ═══ PILLOW (PIL) - TODOS LOS SUBMÓDULOS ═══
        '--hidden-import=PIL',
        '--hidden-import=PIL.Image',
        '--hidden-import=PIL.ImageDraw',
        '--hidden-import=PIL.ImageFont',
        '--hidden-import=PIL.ImageColor',
        '--hidden-import=PIL.ImageFilter',
        '--hidden-import=PIL.ImageOps',
        '--hidden-import=PIL._imaging',
        '--hidden-import=PIL._imagingft',
        '--hidden-import=PIL._imagingtk',
        '--hidden-import=PIL._webp',
        
        # ═══ REPORTLAB - TODOS LOS SUBMÓDULOS ═══
        '--hidden-import=reportlab',
        '--hidden-import=reportlab.pdfgen',
        '--hidden-import=reportlab.pdfgen.canvas',
        '--hidden-import=reportlab.lib',
        '--hidden-import=reportlab.lib.pagesizes',
        '--hidden-import=reportlab.lib.units',
        '--hidden-import=reportlab.lib.colors',
        '--hidden-import=reportlab.lib.styles',
        '--hidden-import=reportlab.lib.enums',
        '--hidden-import=reportlab.platypus',
        '--hidden-import=reportlab.platypus.paragraph',
        '--hidden-import=reportlab.platypus.tables',
        '--hidden-import=reportlab.platypus.doctemplate',
        '--hidden-import=reportlab.platypus.frames',
        '--hidden-import=reportlab.pdfbase',
        '--hidden-import=reportlab.pdfbase.pdfmetrics',
        '--hidden-import=reportlab.pdfbase._fontdata',
        '--hidden-import=reportlab.pdfbase.ttfonts',
        '--hidden-import=reportlab.rl_config',
        
        # ═══ RESTO DE IMPORTS ═══
        '--hidden-import=webview',
        '--hidden-import=pywebview',
        '--hidden-import=engineio',
        '--hidden-import=engineio.async_drivers',
        '--hidden-import=engineio.async_drivers.threading',
        '--hidden-import=socketio',
        '--hidden-import=phonenumbers',
        '--hidden-import=requests',
        '--hidden-import=jinja2',
        '--hidden-import=werkzeug',
        '--hidden-import=werkzeug.security',
        '--hidden-import=werkzeug.routing',
        '--hidden-import=werkzeug.serving',
        '--hidden-import=dotenv',
        '--hidden-import=config_drivers',
        '--hidden-import=configuracion',
        
        # ═══ IMPORTS DE TUS MÓDULOS ═══
        '--hidden-import=models.contacto',
        '--hidden-import=models.configuracion',
        '--hidden-import=routes.principales',
        '--hidden-import=routes.campanas',
        '--hidden-import=routes.contactos',
        '--hidden-import=routes.plantillas',
        '--hidden-import=routes.analiticas',
        '--hidden-import=routes.configuraciones',
        '--hidden-import=utils.whatsapp_status_manager',
        
        # ═══ COLECCIONAR PAQUETES COMPLETOS ═══
        '--collect-all=reportlab',
        '--copy-metadata=reportlab',
        '--collect-all=PIL',
        '--collect-all=Pillow',
        '--copy-metadata=Pillow',
        '--collect-all=webview',
        '--collect-all=flask',
        '--collect-all=flask_socketio',
        '--collect-all=jinja2',
        '--collect-all=werkzeug',
        '--collect-all=pandas',
        '--collect-all=numpy',
        '--collect-all=openpyxl',
        
        # ═══ EXCLUIR SOLO LO INNECESARIO ═══
        '--exclude-module=matplotlib',
        '--exclude-module=scipy',
        '--exclude-module=tkinter',
    ]
    
    if tiene_icono:
        opciones.insert(4, f'--icon={ico_path}')
    
    try:
        print("⏳ Compilando... (esto puede tardar 5-10 minutos)\n")
        PyInstaller.__main__.run(opciones)
        
        print("\n" + "=" * 70)
        print("✅ ¡EJECUTABLE CREADO EXITOSAMENTE!")
        print("=" * 70)
        
        if os.path.exists('dist/WhatsAppSender.exe'):
            tamaño = os.path.getsize('dist/WhatsAppSender.exe') / (1024*1024)
            print(f"\n📦 Ubicación: {os.path.abspath('dist/WhatsAppSender.exe')}")
            print(f"📊 Tamaño: {tamaño:.2f} MB")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR AL COMPILAR: {e}")
        import traceback
        traceback.print_exc()
        return False

def crear_estructura_limpia():
    """Crear carpetas vacías para el ejecutable"""
    print("\n📁 Creando estructura de carpetas...")
    
    carpetas = [
        'dist/data',
        'dist/uploads',
        'dist/drivers'
    ]
    
    for carpeta in carpetas:
        os.makedirs(carpeta, exist_ok=True)
        print(f"   ✅ {carpeta}/ creada")

def copiar_drivers():
    """Copiar carpeta drivers a dist/"""
    print("\n🚗 Copiando drivers de Selenium...")
    
    if not os.path.exists('drivers'):
        print("   ⚠️  Carpeta 'drivers/' no existe - créala y descarga chromedriver.exe")
        os.makedirs('dist/drivers', exist_ok=True)
        return False
    
    os.makedirs('dist/drivers', exist_ok=True)
    
    drivers_copiados = 0
    for archivo in os.listdir('drivers'):
        if archivo.endswith('.exe'):
            origen = os.path.join('drivers', archivo)
            destino = os.path.join('dist/drivers', archivo)
            
            try:
                shutil.copy2(origen, destino)
                tamaño = os.path.getsize(destino) / (1024*1024)
                print(f"   ✅ {archivo} copiado ({tamaño:.2f} MB)")
                drivers_copiados += 1
            except Exception as e:
                print(f"   ❌ Error copiando {archivo}: {e}")
    
    if drivers_copiados == 0:
        print("   ⚠️  No se copiaron drivers - descarga chromedriver.exe manualmente")
        return False
    
    print(f"   ✅ Total: {drivers_copiados} driver(s) copiado(s)")
    return True

def crear_readme_ejecutable():
    """Crear README para el ejecutable"""
    readme = """
╔══════════════════════════════════════════════════════════════╗
║          WhatsApp Sender Pro - Versión Ejecutable           ║
╚══════════════════════════════════════════════════════════════╝

🚀 INSTRUCCIONES DE USO:

1. Ejecuta: WhatsAppSender.exe
2. Espera 15-30 segundos (primera vez tarda más)
3. La ventana de la aplicación se abrirá automáticamente

⚠️ IMPORTANTE:
• NO muevas el .exe fuera de esta carpeta
• Mantén todas las carpetas junto al .exe
• Si Windows Defender lo bloquea, agrega como excepción

📁 ESTRUCTURA:

WhatsAppSender.exe → Ejecutable principal (NO MOVER)
drivers/           → Drivers de Selenium (chromedriver.exe aquí)
data/              → Datos de la app (se crea automático)
uploads/           → Archivos subidos (se crea automático)

🐛 SOLUCIÓN DE PROBLEMAS:

Problema: "No module named 'PIL'" o "No module named 'reportlab'"
Solución:
   • Este error ya está solucionado en v5.0
   • Si persiste, reporta en GitHub

Problema: Windows Defender lo bloquea
Solución:
   • Es un falso positivo normal en ejecutables de Python
   • Agrega excepción en Windows Defender
   • El ejecutable es seguro (código open source)

Problema: No abre WhatsApp Web
Solución:
   1. Descarga chromedriver.exe compatible con tu Chrome desde:
      https://googlechromelabs.github.io/chrome-for-testing/
   2. Copia chromedriver.exe a la carpeta drivers/
   3. Reinicia la aplicación

Problema: La ventana no se abre
Solución:
   • Espera al menos 30 segundos completos
   • Verifica el archivo whatsapp_sender.log
   • Ejecuta como Administrador
   • Verifica que el puerto 5000 esté libre

📜 LOGS:

Archivo: whatsapp_sender.log (en la misma carpeta)
Contiene detalles de errores y ejecución

🔧 REQUISITOS:

• Windows 10/11 (64 bits)
• Google Chrome o Microsoft Edge instalado
• 500 MB de espacio libre
• Conexión a internet activa

═══════════════════════════════════════════════════════════════
Versión: 5.0 | Con Pillow + ReportLab + NumPy/Pandas
═══════════════════════════════════════════════════════════════
"""
    
    with open('dist/README.txt', 'w', encoding='utf-8') as f:
        f.write(readme)
    
    print("   ✅ README.txt creado")

def main():
    """Proceso principal de compilación"""
    print("=" * 70)
    print("🚀 WhatsApp Sender - Compilador v5.0 (PILLOW + REPORTLAB)")
    print("=" * 70 + "\n")
    
    # Verificar que Pillow y ReportLab estén instalados
    errores = []
    
    try:
        import reportlab
        print(f"✅ ReportLab {reportlab.Version} detectado")
    except ImportError:
        print("❌ ERROR: ReportLab no está instalado")
        errores.append("reportlab")
    
    try:
        import PIL
        print(f"✅ Pillow {PIL.__version__} detectado")
    except ImportError:
        print("❌ ERROR: Pillow no está instalado")
        errores.append("Pillow")
    
    if errores:
        print(f"\n❌ Instala las dependencias faltantes:")
        print(f"   pip install {' '.join(errores)}")
        input("\nPresiona Enter para salir...")
        sys.exit(1)
    
    print()
    
    limpiar_completamente()
    verificar_archivos_criticos()
    
    if not construir_ejecutable():
        print("\n❌ Compilación fallida")
        input("Presiona Enter para salir...")
        sys.exit(1)
    
    crear_estructura_limpia()
    drivers_copiados = copiar_drivers()
    crear_readme_ejecutable()
    
    print("\n" + "=" * 70)
    print("🎉 ¡PROCESO COMPLETADO!")
    print("=" * 70)
    print("\n📝 RESUMEN:")
    print(f"   ✅ Ejecutable: dist/WhatsAppSender.exe")
    print(f"   {'✅' if drivers_copiados else '⚠️ '} Drivers: {'Copiados' if drivers_copiados else 'Descarga chromedriver.exe manualmente'}")
    print(f"   ✅ README: dist/README.txt")
    print(f"   ✅ Estructura de carpetas creada")
    print(f"   ✅ Pillow/NumPy/Pandas/ReportLab incluidos")
    
    if not drivers_copiados:
        print("\n⚠️  ACCIÓN REQUERIDA:")
        print("   1. Ve a: https://googlechromelabs.github.io/chrome-for-testing/")
        print("   2. Descarga chromedriver.exe para tu versión de Chrome")
        print("   3. Cópialo a: dist/drivers/chromedriver.exe")
    
    print("\n✅ TODO LISTO:")
    print("   1. Ve a la carpeta dist/")
    print("   2. Ejecuta WhatsAppSender.exe")
    print("   3. Espera 30 segundos")
    print("   4. ¡Disfruta!")
    
    print("\n💡 TIP: Comparte toda la carpeta dist/ si distribuyes la app\n")

if __name__ == '__main__':
    main()