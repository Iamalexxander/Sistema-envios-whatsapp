"""
WhatsApp Sender - Lanzador CORREGIDO v2.0
Manejo correcto de paths para PyInstaller --onefile
"""
import sys
import os
import logging
import time
import socket
import threading
from werkzeug.serving import make_server

# ═══ CONFIGURACIÓN DE PATHS PARA PYINSTALLER ═══
if getattr(sys, 'frozen', False):
    # Cuando está compilado con PyInstaller
    application_path = sys._MEIPASS  # ← Carpeta temporal con archivos
    executable_dir = os.path.dirname(sys.executable)  # ← Donde está el .exe
else:
    # Cuando se ejecuta como script Python
    application_path = os.path.dirname(os.path.abspath(__file__))
    executable_dir = application_path

# Cambiar al directorio del ejecutable para carpetas persistentes
os.chdir(executable_dir)

# Agregar path temporal al sys.path
sys.path.insert(0, application_path)

# ═══ CONFIGURAR LOGGING ═══
log_file = os.path.join(executable_dir, 'whatsapp_sender.log')
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# ═══ IMPORTAR MÓDULOS ═══
try:
    logger.info("📦 Importando módulos...")
    logger.info(f"   sys._MEIPASS: {getattr(sys, '_MEIPASS', 'N/A')}")
    logger.info(f"   application_path: {application_path}")
    logger.info(f"   executable_dir: {executable_dir}")
    logger.info(f"   sys.path[0]: {sys.path[0]}")
    
    import webview
    from app import app
    
    logger.info("✅ Módulos importados correctamente")
except ImportError as e:
    logger.error(f"❌ Error al importar módulos: {e}")
    logger.error(f"   Directorio de trabajo: {os.getcwd()}")
    logger.error(f"   sys.path: {sys.path}")
    logger.error(f"   Contenido de application_path:")
    
    try:
        for item in os.listdir(application_path):
            logger.error(f"     - {item}")
    except Exception as list_error:
        logger.error(f"   Error listando: {list_error}")
    
    import traceback
    traceback.print_exc()
    time.sleep(10)
    sys.exit(1)


class ServerThread(threading.Thread):
    """Thread para el servidor Flask"""
    
    def __init__(self, app, host='127.0.0.1', port=5000):
        super().__init__(daemon=True)
        self.app = app
        self.host = host
        self.port = port
        self.server = None
        self.is_ready = threading.Event()
        self.error = None
        
    def run(self):
        """Ejecutar servidor Flask"""
        try:
            logger.info(f"🚀 Iniciando servidor Flask en {self.host}:{self.port}...")
            
            # Crear servidor werkzeug
            self.server = make_server(
                self.host, 
                self.port, 
                self.app,
                threaded=True
            )
            
            # Marcar como listo
            self.is_ready.set()
            logger.info(f"✅ Servidor Flask listo en http://{self.host}:{self.port}")
            
            # Servir peticiones
            self.server.serve_forever()
            
        except Exception as e:
            logger.error(f"❌ Error en servidor Flask: {e}")
            import traceback
            traceback.print_exc()
            self.error = str(e)
            self.is_ready.set()
    
    def shutdown(self):
        """Detener servidor"""
        if self.server:
            logger.info("🔴 Deteniendo servidor Flask...")
            self.server.shutdown()


class WhatsAppSenderDesktop:
    """Aplicación de escritorio con servidor Flask embebido"""
    
    def __init__(self):
        self.server_thread = None
        self.window = None
        self.port = 5000
        self.host = '127.0.0.1'
        
    def verificar_puerto_disponible(self):
        """Verificar si el puerto está libre"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind((self.host, self.port))
                logger.info(f"✅ Puerto {self.port} disponible")
                return True
        except OSError:
            logger.warning(f"⚠️  Puerto {self.port} ocupado, buscando alternativo...")
            for port in range(5001, 5010):
                try:
                    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                        s.bind((self.host, port))
                        self.port = port
                        logger.info(f"✅ Usando puerto alternativo: {port}")
                        return True
                except OSError:
                    continue
            return False
    
    def esperar_servidor_listo(self, timeout=30):
        """Esperar a que el servidor esté listo"""
        logger.info("⏳ Esperando a que el servidor esté listo...")
        
        tiempo_inicio = time.time()
        
        if not self.server_thread.is_ready.wait(timeout=timeout):
            logger.error("❌ Timeout esperando servidor")
            return False
        
        if self.server_thread.error:
            logger.error(f"❌ Error en servidor: {self.server_thread.error}")
            return False
        
        # Verificar que responde
        import requests
        for i in range(10):
            try:
                response = requests.get(
                    f'http://{self.host}:{self.port}/',
                    timeout=2
                )
                if response.status_code in [200, 302, 404]:
                    tiempo_total = round(time.time() - tiempo_inicio, 1)
                    logger.info(f"✅ Servidor respondiendo ({tiempo_total}s)")
                    return True
            except requests.exceptions.RequestException:
                time.sleep(0.5)
                continue
        
        logger.warning("⚠️  Servidor no responde pero continuando...")
        return True
    
    def start_flask_server(self):
        """Iniciar servidor Flask"""
        try:
            if not self.verificar_puerto_disponible():
                logger.error("❌ No hay puertos disponibles")
                return False
            
            self.server_thread = ServerThread(app, self.host, self.port)
            self.server_thread.start()
            
            if not self.esperar_servidor_listo():
                logger.error("❌ Servidor no se pudo iniciar")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error iniciando servidor: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def on_closing(self):
        """Manejar cierre"""
        logger.info("🔴 Cerrando aplicación...")
        
        if self.server_thread:
            self.server_thread.shutdown()
        
        time.sleep(0.5)
        sys.exit(0)
    
    def create_window(self):
        """Crear ventana"""
        logger.info("🖥️ Creando ventana...")
        
        try:
            self.window = webview.create_window(
                title='WhatsApp Sender Pro',
                url=f'http://{self.host}:{self.port}',
                width=1400,
                height=900,
                resizable=True,
                fullscreen=False,
                min_size=(1000, 700),
                confirm_close=True,
                background_color='#1E1E1E'
            )
            
            logger.info("✅ Ventana creada")
            
        except Exception as e:
            logger.error(f"❌ Error creando ventana: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def run(self):
        """Ejecutar aplicación"""
        try:
            logger.info("=" * 70)
            logger.info("🚀 WhatsApp Sender Pro - Iniciando")
            logger.info("=" * 70)
            logger.info(f"📁 Directorio ejecutable: {executable_dir}")
            logger.info(f"📁 Directorio temporal: {application_path}")
            logger.info(f"🐍 Python: {sys.version}")
            logger.info(f"📦 Frozen: {getattr(sys, 'frozen', False)}")
            logger.info("")
            
            if not self.start_flask_server():
                logger.error("❌ No se pudo iniciar servidor")
                time.sleep(10)
                sys.exit(1)
            
            self.create_window()
            
            logger.info("🎉 Aplicación lista - Iniciando interfaz...")
            webview.start(debug=False)
            
            self.on_closing()
            
        except KeyboardInterrupt:
            logger.info("⚠️ Interrupción por teclado")
            self.on_closing()
        except Exception as e:
            logger.error(f"❌ Error fatal: {e}")
            import traceback
            traceback.print_exc()
            time.sleep(10)
            sys.exit(1)


def main():
    """Punto de entrada"""
    
    # Crear carpetas persistentes (en ubicación del .exe)
    for carpeta in ['data', 'uploads', 'drivers']:
        ruta = os.path.join(executable_dir, carpeta)
        if not os.path.exists(ruta):
            os.makedirs(ruta)
            logger.info(f"📁 Carpeta creada: {carpeta}/")
    
    # Iniciar aplicación
    desktop_app = WhatsAppSenderDesktop()
    desktop_app.run()


if __name__ == '__main__':
    main()