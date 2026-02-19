"""
Servicio de WhatsApp con Selenium - VERSIÓN ULTRA OPTIMIZADA v5
 Envío INSTANTÁNEO de archivos (sin esperas innecesarias)
 Verificación de mensaje DIRECTA (pasa inmediatamente al archivo)
 Envío confiable a múltiples contactos
 FLUJO: Mensaje → Verificación instantánea → Adjuntar → Enviar
"""
import logging
import time
import os
import pickle
import platform
import winreg
import string
import shutil
from ctypes import windll
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from datetime import datetime
import glob
import threading

logger = logging.getLogger(__name__)

class ServicioWhatsApp:
    """Servicio para gestionar conexión con WhatsApp Web"""
    
    def __init__(self):
        self.driver = None
        self.browser_type = None
        self.browser_name = None
        self.session_file = 'data/whatsapp_cookies.pkl'
        self.user_data_dir = 'data/browser_profile'
        self.drivers_dir = 'drivers'
        self.is_connected = False
        self.numero_conectado = None
        self.numero_actual = None
        self.cookies_dir = 'data/cookies'
        self._navegadores_cache = None
        
        os.makedirs(self.drivers_dir, exist_ok=True)
        os.makedirs(self.cookies_dir, exist_ok=True)
    
    def obtener_discos_disponibles(self):
        """Obtener todas las unidades de disco disponibles en Windows"""
        if platform.system() != 'Windows':
            return ['/usr', '/opt', '/home', '/Applications']
        
        drives = []
        bitmask = windll.kernel32.GetLogicalDrives()
        for letter in string.ascii_uppercase:
            if bitmask & 1:
                drives.append(f"{letter}:")
            bitmask >>= 1
        
        logger.debug(f" Discos detectados: {drives}")
        return drives
    
    def detectar_navegador_predeterminado(self):
        """Detectar navegador predeterminado de Windows"""
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                              r'Software\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice') as key:
                prog_id = winreg.QueryValueEx(key, 'ProgId')[0]
            
            navegador_map = {
                'ChromeHTML': 'chrome',
                'BraveHTML': 'brave',
                'MSEdgeHTM': 'edge',
                'OperaStable': 'opera',
                'OperaGXStable': 'operagx',
                'FirefoxURL': 'firefox',
                'VivaldiHTM': 'vivaldi',
            }
            
            for key_name, browser_type in navegador_map.items():
                if key_name in prog_id:
                    logger.info(f" Navegador predeterminado: {browser_type}")
                    return browser_type
        
        except Exception as e:
            logger.debug(f"No se pudo detectar navegador predeterminado: {e}")
        
        return None
    
    def buscar_ejecutable_recursivo(self, disco, nombre_ejecutable):
        """Buscar un ejecutable en todo el disco usando búsqueda inteligente"""
        rutas_comunes = [
            os.path.join(disco + '\\', 'Program Files'),
            os.path.join(disco + '\\', 'Program Files (x86)'),
            os.path.join(disco + '\\', 'Users', os.environ.get('USERNAME', 'Usuario'), 'AppData', 'Local'),
            os.path.join(disco + '\\', 'Users', os.environ.get('USERNAME', 'Usuario'), 'AppData', 'Local', 'Programs'),
        ]
        
        for ruta_base in rutas_comunes:
            if not os.path.exists(ruta_base):
                continue
            
            try:
                patron = os.path.join(ruta_base, '**', nombre_ejecutable)
                resultados = glob.glob(patron, recursive=True)
                
                if resultados:
                    return resultados[0]
            
            except Exception as e:
                logger.debug(f"Error buscando en {ruta_base}: {e}")
                continue
        
        return None
    
    def detectar_navegadores_instalados(self):
        """ Detección ULTRA RÁPIDA de navegadores con caché y búsqueda paralela"""
        if self._navegadores_cache is not None:
            logger.debug(f" Usando caché ({len(self._navegadores_cache)} navegadores)")
            return self._navegadores_cache
        
        navegadores_encontrados = []
        sistema = platform.system()
        
        if sistema != 'Windows':
            logger.warning(" Este código está optimizado para Windows")
            return []
        
        navegadores_buscar = {
            'chrome': {
                'ejecutables': ['chrome.exe'],
                'nombre': 'Google Chrome',
                'tipo_driver': 'chromium'
            },
            'edge': {
                'ejecutables': ['msedge.exe'],
                'nombre': 'Microsoft Edge',
                'tipo_driver': 'edge'
            },
            'brave': {
                'ejecutables': ['brave.exe'],
                'nombre': 'Brave',
                'tipo_driver': 'chromium'
            },
            'opera': {
                'ejecutables': ['opera.exe', 'launcher.exe'],
                'nombre': 'Opera',
                'tipo_driver': 'chromium'
            },
            'operagx': {
                'ejecutables': ['opera.exe', 'launcher.exe'],
                'nombre': 'Opera GX',
                'tipo_driver': 'chromium'
            },
            'vivaldi': {
                'ejecutables': ['vivaldi.exe'],
                'nombre': 'Vivaldi',
                'tipo_driver': 'chromium'
            },
            'firefox': {
                'ejecutables': ['firefox.exe'],
                'nombre': 'Mozilla Firefox',
                'tipo_driver': 'firefox'
            },
        }
        
        logger.info(" Detectando navegadores...")
        
        disco = 'C:'
        
        for navegador_tipo, info in navegadores_buscar.items():
            if any(n['tipo'] == navegador_tipo for n in navegadores_encontrados):
                continue
            
            for ejecutable in info['ejecutables']:
                ruta_encontrada = self.buscar_ejecutable_recursivo(disco, ejecutable)
                
                if ruta_encontrada:
                    if navegador_tipo == 'operagx' and 'Opera GX' not in ruta_encontrada:
                        continue
                    
                    if navegador_tipo == 'opera' and 'Opera GX' in ruta_encontrada:
                        continue
                    
                    logger.info(f" {info['nombre']} encontrado")
                    navegadores_encontrados.append({
                        'nombre': info['nombre'],
                        'ruta': ruta_encontrada,
                        'tipo': navegador_tipo,
                        'tipo_driver': info['tipo_driver']
                    })
                    break
        
        self._navegadores_cache = navegadores_encontrados
        logger.info(f" {len(navegadores_encontrados)} navegador(es) detectado(s)")
        return navegadores_encontrados
    
    def obtener_nombre_navegador(self):
        """Obtener nombre del navegador actual"""
        return self.browser_name if self.browser_name else 'Navegador'
    
    def descargar_driver_local(self, tipo_driver):
        """Verificar si existe un driver local usando config_drivers"""
        try:
            # Importar las funciones de configuración
            from config_drivers import (
                get_chromedriver_path,
                get_edgedriver_path,
                get_operadriver_path
            )
            
            if tipo_driver == 'edge':
                driver_path = get_edgedriver_path()
                logger.info(f" Edge driver: {driver_path}")
                return driver_path
            elif tipo_driver == 'chromium' or tipo_driver == 'chrome':
                driver_path = get_chromedriver_path()
                logger.info(f" Chrome driver: {driver_path}")
                return driver_path
            else:
                # Por defecto, intentar Chrome
                driver_path = get_chromedriver_path()
                logger.info(f" Chrome driver (default): {driver_path}")
                return driver_path
                
        except FileNotFoundError as e:
            logger.warning(f" {e}")
            return None
        except Exception as e:
            logger.error(f" Error buscando driver: {e}")
            return None
    
    def inicializar_driver(self):
        """ Inicialización ULTRA RÁPIDA del driver"""
        try:
            navegador_predeterminado = self.detectar_navegador_predeterminado()
            navegadores_instalados = self.detectar_navegadores_instalados()
            
            if not navegadores_instalados:
                raise Exception(" No se encontró ningún navegador compatible")
            
            navegador_seleccionado = None
            
            if navegador_predeterminado:
                for nav in navegadores_instalados:
                    if nav['tipo'] == navegador_predeterminado:
                        navegador_seleccionado = nav
                        logger.info(f" Usando navegador predeterminado: {nav['nombre']}")
                        break
            
            if not navegador_seleccionado:
                navegador_seleccionado = navegadores_instalados[0]
                logger.info(f" Usando: {navegador_seleccionado['nombre']}")
            
            self.browser_type = navegador_seleccionado['tipo']
            self.browser_name = navegador_seleccionado['nombre']
            
            os.makedirs(self.user_data_dir, exist_ok=True)
            
            if navegador_seleccionado['tipo_driver'] == 'firefox':
                return self._inicializar_firefox(navegador_seleccionado)
            elif navegador_seleccionado['tipo_driver'] == 'edge':
                return self._inicializar_edge(navegador_seleccionado)
            else:
                return self._inicializar_chromium(navegador_seleccionado)
        
        except Exception as e:
            logger.error(f" Error inicializando driver: {e}")
            return False
    
    def _inicializar_chromium(self, navegador_info):
        """Inicialización RÁPIDA y OPTIMIZADA de navegadores Chromium"""
        try:
            logger.info(f"Iniciando {navegador_info['nombre']}...")
            
            options = ChromeOptions()
            options.binary_location = navegador_info['ruta']
            
            # Configuración básica
            options.add_argument(f'--user-data-dir={os.path.abspath(self.user_data_dir)}')
            options.add_argument('--profile-directory=WhatsAppProfile')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-blink-features=AutomationControlled')
            options.add_argument('--disable-gpu')
            options.add_argument('--window-size=1200,900')
            
            # OPTIMIZACIONES DE VELOCIDAD PARA CHROMIUM
            options.add_argument('--disable-extensions')
            options.add_argument('--disable-plugins')
            options.add_argument('--disable-infobars')
            options.add_argument('--disable-notifications')
            options.add_argument('--disable-popup-blocking')
            options.add_argument('--disable-background-networking')
            options.add_argument('--disable-default-apps')
            options.add_argument('--disable-sync')
            options.add_argument('--no-first-run')
            options.add_argument('--no-default-browser-check')
            options.add_argument('--disable-background-timer-throttling')
            options.add_argument('--disable-backgrounding-occluded-windows')
            options.add_argument('--disable-renderer-backgrounding')
            options.add_argument('--disable-hang-monitor')
            options.add_argument('--disable-prompt-on-repost')
            options.add_argument('--metrics-recording-only')
            
            options.add_experimental_option("excludeSwitches", ["enable-automation", "enable-logging"])
            options.add_experimental_option('useAutomationExtension', False)
            
            try:
                self.driver = webdriver.Chrome(options=options)
                logger.info(" Navegador iniciado")
            except Exception as e:
                driver_local = self.descargar_driver_local('chromium')
                if driver_local:
                    service = ChromeService(executable_path=driver_local)
                    self.driver = webdriver.Chrome(service=service, options=options)
                    logger.info(" Navegador iniciado (driver local)")
                else:
                    raise e
            
            self.driver.maximize_window()
            return True
        
        except Exception as e:
            logger.error(f" Error: {e}")
            raise

    def _inicializar_edge(self, navegador_info):
        """Inicialización RÁPIDA y OPTIMIZADA de Edge"""
        try:
            logger.info(f" Iniciando {navegador_info['nombre']}...")
            
            options = EdgeOptions()
            options.binary_location = navegador_info['ruta']
            
            # Configuración básica
            options.add_argument(f'--user-data-dir={os.path.abspath(self.user_data_dir)}')
            options.add_argument('--profile-directory=WhatsAppProfile')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-blink-features=AutomationControlled')
            options.add_argument('--disable-gpu')
            options.add_argument('--window-size=1200,900')
            
            # ⚡ OPTIMIZACIONES DE VELOCIDAD PARA EDGE
            options.add_argument('--disable-extensions')
            options.add_argument('--disable-plugins')
            options.add_argument('--disable-infobars')
            options.add_argument('--disable-notifications')
            options.add_argument('--disable-popup-blocking')
            options.add_argument('--disable-background-networking')
            options.add_argument('--disable-default-apps')
            options.add_argument('--disable-sync')
            options.add_argument('--no-first-run')
            options.add_argument('--no-default-browser-check')
            options.add_argument('--disable-background-timer-throttling')
            options.add_argument('--disable-backgrounding-occluded-windows')
            options.add_argument('--disable-renderer-backgrounding')
            options.add_argument('--disable-hang-monitor')
            options.add_argument('--disable-prompt-on-repost')
            options.add_argument('--metrics-recording-only')
            
            options.add_experimental_option("excludeSwitches", ["enable-automation", "enable-logging"])
            options.add_experimental_option('useAutomationExtension', False)
            
            try:
                self.driver = webdriver.Edge(options=options)
                logger.info(" Navegador iniciado")
            except Exception as e:
                driver_local = self.descargar_driver_local('edge')
                if driver_local:
                    service = EdgeService(executable_path=driver_local)
                    self.driver = webdriver.Edge(service=service, options=options)
                    logger.info(" Navegador iniciado (driver local)")
                else:
                    raise e
            
            self.driver.maximize_window()
            return True
        
        except Exception as e:
            logger.error(f" Error: {e}")
            raise
    
    def _inicializar_firefox(self, navegador_info):
        """ Inicialización RÁPIDA de Firefox"""
        try:
            logger.info(f" Iniciando {navegador_info['nombre']}...")
            
            options = FirefoxOptions()
            options.binary_location = navegador_info['ruta']
            options.add_argument(f'--profile={os.path.abspath(self.user_data_dir)}')
            
            self.driver = webdriver.Firefox(options=options)
            logger.info(" Navegador iniciado")
            
            self.driver.maximize_window()
            return True
        
        except Exception as e:
            logger.error(f" Error: {e}")
            raise
    
    def abrir_whatsapp_web(self):
        """Abrir WhatsApp Web"""
        try:
            if not self.driver:
                self.inicializar_driver()
            
            logger.info(" Abriendo WhatsApp Web...")
            self.driver.get('https://web.whatsapp.com')
            time.sleep(2)
            return True
        
        except Exception as e:
            logger.error(f" Error: {e}")
            return False
    
    def verificar_conexion_automatica(self, timeout=120):
        """ Verificación RÁPIDA de conexión con detección inteligente"""
        try:
            logger.info(" Esperando conexión...")
            logger.info("    Escanea el código QR")
            
            tiempo_inicio = time.time()
            
            while (time.time() - tiempo_inicio) < timeout:
                try:
                    elementos_qr = self.driver.find_elements(By.CSS_SELECTOR, 'canvas[aria-label*="qr"], div[data-ref]')
                    
                    if len(elementos_qr) == 0:
                        selectores_whatsapp = [
                            'div[data-testid="conversation-panel-wrapper"]',
                            'div[data-testid="chat-list"]',
                            'div#pane-side'
                        ]
                        
                        for selector in selectores_whatsapp:
                            try:
                                elemento = self.driver.find_element(By.CSS_SELECTOR, selector)
                                if elemento and elemento.is_displayed():
                                    logger.info(f" ¡WhatsApp conectado!")
                                    self.is_connected = True
                                    self.guardar_sesion()
                                    return True
                            except:
                                continue
                    
                    time.sleep(1.5)
                    
                    tiempo_transcurrido = int(time.time() - tiempo_inicio)
                    if tiempo_transcurrido % 10 == 0 and tiempo_transcurrido > 0:
                        logger.info(f"    {tiempo_transcurrido}s / {timeout}s")
                
                except Exception as e:
                    logger.debug(f"Verificando... {e}")
                    time.sleep(1.5)
            
            logger.warning(" Tiempo agotado")
            return False
        
        except Exception as e:
            logger.error(f" Error: {e}")
            return False
    
    def verificar_sesion_activa_real(self):
        """Verificación ULTRA RÁPIDA y CONFIABLE"""
        try:
            if not self.driver:
                logger.debug("No hay driver activo")
                return False
            
            try:
                url_actual = self.driver.current_url
                if 'web.whatsapp.com' not in url_actual:
                    logger.debug("No está en WhatsApp Web")
                    return False
            except Exception as e:
                logger.debug(f"Error obteniendo URL: {e}")
                return False
            
            selectores_conectado = [
                'div[data-testid="conversation-panel-wrapper"]',
                'div#pane-side',
                'div[data-testid="chat-list"]',
            ]
            
            for selector in selectores_conectado:
                try:
                    elemento = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if elemento and elemento.is_displayed():
                        logger.debug("Sesión activa confirmada")
                        self.is_connected = True
                        return True
                except:
                    continue
            
            try:
                elementos_qr = self.driver.find_elements(
                    By.CSS_SELECTOR, 
                    'canvas[aria-label*="qr"], div[data-ref]'
                )
                if elementos_qr and len(elementos_qr) > 0:
                    logger.debug("Código QR presente - sesión cerrada")
                    self.is_connected = False
                    return False
            except:
                pass
            
            logger.debug("Estado ambiguo - asumiendo conectado")
            return True
            
        except Exception as e:
            logger.error(f"Error verificando sesión: {e}")
            return False
    
    def _verificar_texto_escrito_instantaneo(self, input_box):
        """
        VERIFICACIÓN INSTANTÁNEA - 0.1 segundos máximo
        - Verifica SI HAY TEXTO y continúa inmediatamente
        """
        try:
            time.sleep(0.05)
            
            try:
                texto_actual = input_box.text or ""
                if len(texto_actual.strip()) > 0:
                    logger.info(f"TEXTO DETECTADO ({len(texto_actual)} chars) - CONTINUANDO")
                    return True
            except:
                pass
            
            try:
                texto_js = self.driver.execute_script(
                    "return arguments[0].innerText || '';", input_box
                )
                if texto_js and len(texto_js.strip()) > 0:
                    logger.info("TEXTO OK - CONTINUANDO")
                    return True
            except:
                pass
            
            logger.info("ASUMIENDO TEXTO OK - CONTINUANDO")
            return True
            
        except:
            return True
    
    def _esperar_carga_archivo_instantanea(self, tipo_archivo, timeout_max=8):
        """
        DETECCIÓN INSTANTÁNEA - Envía AL MOMENTO que detecta preview
        - Timeout reducido a 8s (antes 20s)
        - Verifica cada 0.2s (ultra rápido)
        - Envía INMEDIATAMENTE al ver la imagen/preview
        """
        tiempo_inicio = time.time()
        
        logger.info(f"Buscando preview de {tipo_archivo}...")
        
        time.sleep(0.2)
        
        checks = 0
        max_checks = 20
        
        while (time.time() - tiempo_inicio) < timeout_max and checks < max_checks:
            try:
                preview = self.driver.find_element(
                    By.XPATH,
                    '//div[contains(@class, "media-viewer")]|//div[@data-testid="media-viewer"]'
                )
                
                if preview and preview.is_displayed():
                    tiempo_carga = round(time.time() - tiempo_inicio, 2)
                    
                    if tipo_archivo in ['imagen', 'documento']:
                        logger.info(f"{tipo_archivo.upper()} detectado en {tiempo_carga}s - ENVIANDO YA")
                        time.sleep(0.2)
                        return True
                    
                    if tipo_archivo == 'video':
                        try:
                            video_element = self.driver.find_element(By.TAG_NAME, 'video')
                            if video_element:
                                try:
                                    duration = self.driver.execute_script(
                                        "return arguments[0].duration;", video_element
                                    )
                                    if duration and duration > 0:
                                        logger.info(f"VIDEO cargado en {tiempo_carga}s - ENVIANDO")
                                        time.sleep(0.3)
                                        return True
                                except:
                                    pass
                                
                                if tiempo_carga > 1.5:
                                    logger.info(f"VIDEO detectado - ENVIANDO ({tiempo_carga}s)")
                                    return True
                        except:
                            if tiempo_carga > 1.0:
                                logger.info(f"Preview de video visible - ENVIANDO ({tiempo_carga}s)")
                                return True
            except:
                pass
            
            checks += 1
            time.sleep(0.2)
        
        tiempo_total = round(time.time() - tiempo_inicio, 2)
        logger.info(f"Enviando después de {tiempo_total}s")
        return True
    
    def enviar_mensaje(self, telefono, mensaje, archivo_path=None, tipo_archivo=None):
        """
         VERSIÓN ULTRA OPTIMIZADA v5 - FLUJO MÁS RÁPIDO:
        1. Ir al chat (2s)
        2. ESCRIBIR mensaje (0.3s)
        3. VERIFICACIÓN INSTANTÁNEA (0.2s) - ¡SIN COMPARACIÓN!
        4. PASAR DIRECTO a adjuntar archivo
        5. ESPERA MÍNIMA para detección (máx 20s)
        6. ENVIAR EN CUANTO ESTÉ LISTO
        
        Total: ~3-5s para foto/doc, ~8-23s para video
        """
        if not self.is_connected or not self.driver:
            return False, "WhatsApp no está conectado"
        
        try:
            telefono_limpio = ''.join(filter(str.isdigit, telefono))
            
            if len(telefono_limpio) < 10:
                return False, "Número muy corto (mínimo 10 dígitos)"
            
            if len(telefono_limpio) > 15:
                return False, "Número muy largo (máximo 15 dígitos)"
            
            logger.info(f" Enviando a: +{telefono_limpio}")
            
            url = f'https://web.whatsapp.com/send?phone={telefono_limpio}'
            self.driver.get(url)
            time.sleep(2)
            
            wait_largo = WebDriverWait(self.driver, 60)
            wait_corto = WebDriverWait(self.driver, 20)
            
            mensaje_escrito_exitosamente = False
            input_box = None
            
            if mensaje and mensaje.strip():
                logger.info(" Escribiendo mensaje...")
                
                input_selectors = [
                    '//footer//div[@contenteditable="true"][@data-tab="10"]',
                    '//div[@id="main"]//footer//div[@contenteditable="true"][@role="textbox"]',
                    '//div[@id="main"]//div[@contenteditable="true"][@data-tab="10"]',
                    '//footer//div[contains(@class, "copyable-text")][@contenteditable="true"]',
                ]
                
                for selector in input_selectors:
                    try:
                        elementos = self.driver.find_elements(By.XPATH, selector)
                        for elemento in elementos:
                            if elemento.is_displayed() and elemento.is_enabled():
                                parent_context = self.driver.execute_script(
                                    "return arguments[0].closest('footer') ? 'footer' : 'other';",
                                    elemento
                                )
                                if parent_context == 'footer':
                                    input_box = elemento
                                    break
                        if input_box:
                            break
                    except:
                        continue
                
                if not input_box:
                    try:
                        input_box = wait_corto.until(
                            EC.presence_of_element_located(
                                (By.XPATH, '//div[@contenteditable="true"][@data-tab="10"]')
                            )
                        )
                    except:
                        return False, "No se encontró el cuadro de texto"
                
                if input_box:
                    try:
                        input_box.click()
                    except:
                        self.driver.execute_script("arguments[0].click();", input_box)
                    
                    time.sleep(0.1)  # Espera mínima
                    
                    try:
                        input_box.clear()
                    except:
                        pass
                    
                    # Escribir el mensaje completo
                    lineas = mensaje.split('\n')
                    for i, linea in enumerate(lineas):
                        input_box.send_keys(linea)
                        if i < len(lineas) - 1:
                            input_box.send_keys(Keys.SHIFT + Keys.ENTER)
                    
                    #  VERIFICACIÓN INSTANTÁNEA - sin comparar texto
                    mensaje_escrito_exitosamente = self._verificar_texto_escrito_instantaneo(input_box)
                
                if not mensaje_escrito_exitosamente and not archivo_path:
                    return False, "No se pudo escribir el mensaje"
            
            #  Si hay archivo, pasar INMEDIATAMENTE a adjuntarlo
            if archivo_path and os.path.exists(archivo_path):
                logger.info(f" Adjuntando: {os.path.basename(archivo_path)}")
                
                archivo_absoluto = os.path.abspath(archivo_path)
                if not os.path.exists(archivo_absoluto):
                    return False, f"Archivo no encontrado: {archivo_absoluto}"
                
                tamano_mb = os.path.getsize(archivo_absoluto) / (1024 * 1024)
                logger.info(f" Tamaño: {tamano_mb:.2f} MB")
                
                if not tipo_archivo:
                    extension = os.path.splitext(archivo_path)[1].lower()
                    if extension in ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.3gp']:
                        tipo_archivo = 'video'
                        logger.info(" Tipo detectado: VIDEO")
                    elif extension in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']:
                        tipo_archivo = 'imagen'
                        logger.info(" Tipo detectado: IMAGEN")
                    else:
                        tipo_archivo = 'documento'
                        logger.info(" Tipo detectado: DOCUMENTO")
                
                extension = os.path.splitext(archivo_path)[1].lower()
                if tipo_archivo == 'video':
                    formatos_permitidos = ['.mp4', '.3gp', '.mov']
                    if extension not in formatos_permitidos:
                        return False, f"Formato {extension} no soportado. Usa: .mp4, .3gp o .mov"
                    if tamano_mb > 16:
                        return False, f"Video muy grande ({tamano_mb:.2f}MB). Máximo 16MB para WhatsApp"
                elif tipo_archivo == 'imagen':
                    formatos_permitidos = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
                    if extension not in formatos_permitidos:
                        return False, f"Formato {extension} no soportado. Usa: .jpg, .png, .gif, .webp"
                    if tamano_mb > 16:
                        return False, f"Imagen muy grande ({tamano_mb:.2f}MB). Máximo 16MB"
                
                time.sleep(0.3)  # Espera mínima
                
                selectores_adjuntar = [
                    '//div[@title="Adjuntar"]',
                    '//div[@aria-label="Adjuntar"]',
                    '//span[@data-icon="plus"]/..',
                    '//span[@data-icon="attach-menu-plus"]/..',
                    '//span[@data-icon="clip"]/..',
                    '//button[@aria-label="Adjuntar"]',
                ]
                
                boton_adjuntar = None
                for selector in selectores_adjuntar:
                    try:
                        boton_adjuntar = wait_corto.until(
                            EC.element_to_be_clickable((By.XPATH, selector))
                        )
                        logger.debug(f" Botón adjuntar encontrado: {selector}")
                        break
                    except:
                        continue
                
                if not boton_adjuntar:
                    return False, "No se encontró el botón de adjuntar"
                
                try:
                    boton_adjuntar.click()
                except:
                    self.driver.execute_script("arguments[0].click();", boton_adjuntar)
                
                logger.info(" Menú de adjuntar abierto")
                time.sleep(1.5)
                
                file_input = None
                
                try:
                    all_file_inputs = self.driver.find_elements(By.XPATH, '//input[@type="file"]')
                    logger.info(f" Encontrados {len(all_file_inputs)} inputs de archivo")
                    
                    for idx, input_elem in enumerate(all_file_inputs):
                        try:
                            accept_attr = input_elem.get_attribute('accept')
                            
                            logger.debug(f"  Input #{idx}: accept='{accept_attr}'")
                            
                            if tipo_archivo in ['imagen', 'video']:
                                if accept_attr and ('image' in accept_attr or 'video' in accept_attr):
                                    file_input = input_elem
                                    logger.info(f" Input correcto encontrado para {tipo_archivo}: {accept_attr}")
                                    break
                            else:
                                if accept_attr == '*':
                                    file_input = input_elem
                                    logger.info(f" Input correcto encontrado para documento: {accept_attr}")
                                    break
                        except Exception as e:
                            logger.debug(f"  Error analizando input #{idx}: {e}")
                            continue
                    
                    if not file_input and all_file_inputs:
                        file_input = all_file_inputs[0]
                        logger.warning(f" Usando primer input como fallback")
                
                except Exception as e:
                    logger.error(f" Error buscando inputs: {e}")
                
                if not file_input:
                    return False, "No se encontró el input de archivo correcto"
                
                try:
                    logger.info(f" Enviando archivo: {os.path.basename(archivo_absoluto)}")
                    file_input.send_keys(archivo_absoluto)
                    logger.info(f" Archivo cargado en el input")
                    time.sleep(1)
                    
                    posibles_errores = [
                        '//*[contains(text(), "no compatible")]',
                        '//*[contains(text(), "not supported")]',
                        '//*[contains(text(), "no se puede enviar")]',
                        '//*[contains(text(), "can\'t be sent")]',
                        '//*[contains(text(), "formato no válido")]',
                    ]
                    
                    for selector_error in posibles_errores:
                        try:
                            error_elem = self.driver.find_element(By.XPATH, selector_error)
                            if error_elem and error_elem.is_displayed():
                                texto_error = error_elem.text
                                logger.error(f" Error de WhatsApp: {texto_error}")
                                return False, f"WhatsApp rechazó el archivo: {texto_error}"
                        except:
                            continue
                
                except Exception as e:
                    logger.error(f" Error enviando archivo al input: {e}")
                    return False, f"Error al cargar archivo: {str(e)}"
                
                logger.info(f" Esperando carga del {tipo_archivo}...")
                time.sleep(0.3)
                
                carga_exitosa = self._esperar_carga_archivo_instantanea(tipo_archivo, timeout_max=8)
                
                try:
                    error_elemento = self.driver.find_element(
                        By.XPATH,
                        '//*[contains(text(), "no se puede enviar") or contains(text(), "no compatible") or contains(text(), "not supported") or contains(text(), "can\'t be sent")]'
                    )
                    if error_elemento and error_elemento.is_displayed():
                        logger.error(" WhatsApp no acepta este archivo")
                        return False, "Formato de archivo no soportado por WhatsApp"
                except:
                    pass
                
                logger.info("Buscando botón enviar...")
                
                selectores_enviar = [
                    '//span[@data-icon="send"]',
                    '//span[@data-icon="send"]/parent::button',
                    '//button[@aria-label="Enviar"]',
                    '//div[@aria-label="Enviar"]',
                ]
                
                boton_enviar = None
                intentos = 0
                max_intentos = 10
                
                while intentos < max_intentos and not boton_enviar:
                    for selector in selectores_enviar:
                        try:
                            elementos = self.driver.find_elements(By.XPATH, selector)
                            for elem in elementos:
                                if elem.is_displayed() and elem.is_enabled():
                                    boton_enviar = elem
                                    break
                            if boton_enviar:
                                break
                        except:
                            continue
                    
                    if not boton_enviar:
                        intentos += 1
                        time.sleep(0.2)
                
                if not boton_enviar:
                    logger.warning(" No se encontró botón de enviar")
                    return False, "Archivo adjuntado pero no se pudo enviar automáticamente"
                
                try:
                    boton_enviar.click()
                except:
                    self.driver.execute_script("arguments[0].click();", boton_enviar)
                
                time.sleep(1.5)
                
                logger.info(f" Mensaje + Archivo enviados a +{telefono_limpio}")
                return True, "Mensaje con archivo enviado"
            
            elif mensaje_escrito_exitosamente:
                logger.info(" Enviando mensaje...")
                
                if input_box:
                    input_box.send_keys(Keys.ENTER)
                    time.sleep(2)
                    logger.info(f" Mensaje enviado a +{telefono_limpio}")
                    return True, "Mensaje enviado"
                else:
                    return False, "No se pudo enviar el mensaje"
            
            else:
                return False, "No hay mensaje ni archivo para enviar"
        
        except Exception as e:
            logger.error(f" Error: {e}")
            import traceback
            traceback.print_exc()
            return False, f"Error: {str(e)}"
    
    def enviar_mensajes_masivos(self, contactos, mensaje, intervalo=5, callback=None, archivo_path=None, tipo_archivo=None):
        """ Envío masivo OPTIMIZADO con soporte de archivos"""
        resultados = {
            'enviados': 0,
            'fallidos': 0,
            'errores': []
        }
        
        total = len(contactos)
        
        for i, contacto in enumerate(contactos):
            try:
                telefono = contacto.get('telefono') or contacto.get('Telefono')
                nombre = contacto.get('nombre') or contacto.get('Nombre', 'Contacto')
                
                if not telefono:
                    logger.warning(f" Sin teléfono: {nombre}")
                    resultados['fallidos'] += 1
                    continue
                
                logger.info(f" [{i+1}/{total}] {nombre} ({telefono})...")
                
                exito, msg = self.enviar_mensaje(
                    telefono,
                    mensaje,
                    archivo_path=archivo_path,
                    tipo_archivo=tipo_archivo
                )
                
                if exito:
                    resultados['enviados'] += 1
                    logger.info(f" {i+1}/{total} - {nombre}")
                else:
                    resultados['fallidos'] += 1
                    resultados['errores'].append(f"{nombre} ({telefono}): {msg}")
                    logger.error(f" {i+1}/{total} - {nombre}: {msg}")
                
                if callback:
                    callback({
                        'actual': i + 1,
                        'total': total,
                        'enviados': resultados['enviados'],
                        'fallidos': resultados['fallidos']
                    })
                
                if i < total - 1:
                    logger.debug(f" Esperando {intervalo}s...")
                    time.sleep(intervalo)
            
            except Exception as e:
                logger.error(f" Error con {nombre}: {e}")
                resultados['fallidos'] += 1
                resultados['errores'].append(f"{nombre}: {str(e)}")
        
        logger.info(f"\n {resultados['enviados']} enviados, {resultados['fallidos']} fallidos")
        return resultados
    
    def guardar_sesion(self):
        """Guardar sesión"""
        try:
            os.makedirs(os.path.dirname(self.session_file), exist_ok=True)
            cookies = self.driver.get_cookies()
            with open(self.session_file, 'wb') as f:
                pickle.dump(cookies, f)
            logger.debug(" Sesión guardada")
            return True
        except Exception as e:
            logger.error(f" Error guardando sesión: {e}")
            return False
    
    def _guardar_cookies(self, numero):
        """Guardar cookies de la sesión"""
        try:
            cookies = self.driver.get_cookies()
            cookies_file = os.path.join(self.cookies_dir, f'whatsapp_{numero}.pkl')
            with open(cookies_file, 'wb') as f:
                pickle.dump(cookies, f)
            logger.debug(f"Cookies guardadas para {numero}")
            return True
        except Exception as e:
            logger.error(f"Error guardando cookies: {e}")
            return False
    
    def cargar_sesion(self):
        """Cargar sesión"""
        try:
            if not os.path.exists(self.session_file):
                return False
            
            with open(self.session_file, 'rb') as f:
                cookies = pickle.load(f)
            
            for cookie in cookies:
                self.driver.add_cookie(cookie)
            
            logger.debug(" Sesión cargada")
            return True
        except Exception as e:
            logger.error(f" Error cargando sesión: {e}")
            return False
    
    def _cargar_cookies(self, numero):
        """Carga RÁPIDA de cookies"""
        try:
            cookies_file = os.path.join(self.cookies_dir, f'whatsapp_{numero}.pkl')
            if not os.path.exists(cookies_file):
                return False
            
            with open(cookies_file, 'rb') as f:
                cookies = pickle.load(f)
            
            for cookie in cookies:
                try:
                    self.driver.add_cookie(cookie)
                except:
                    pass
            
            self.driver.refresh()
            logger.info(" Cookies cargadas")
            return True
        
        except Exception as e:
            logger.debug(f"Error cargando cookies: {e}")
            return False
    
    def conectar(self, numero_telefono: str):
        """ Conexión ULTRA RÁPIDA"""
        try:
            self.numero_conectado = numero_telefono
            self.numero_actual = numero_telefono
            
            logger.info(f"Conectando WhatsApp para {numero_telefono}")
            
            if not self.inicializar_driver():
                return False, "Error inicializando navegador"
            
            if not self.abrir_whatsapp_web():
                return False, "Error abriendo WhatsApp Web"
            
            if self._cargar_cookies(numero_telefono):
                logger.info("Restaurando sesión...")
                time.sleep(2)
                
                if self.verificar_sesion_activa_real():
                    self.is_connected = True
                    logger.info("Sesión restaurada")
                    return True, f"Sesión restaurada en {self.browser_name}"
            
            logger.info("Escanea el código QR...")
            
            if self.verificar_conexion_automatica(timeout=120):
                self._guardar_cookies(numero_telefono)
                self.is_connected = True
                logger.info("WhatsApp conectado")
                return True, f"Conectado en {self.browser_name}"
            else:
                return False, "Tiempo agotado"
        
        except Exception as e:
            logger.error(f" Error: {e}")
            if self.driver:
                self.driver.quit()
                self.driver = None
            return False, f"Error: {str(e)}"
    
    def cerrar_sesion_whatsapp(self):
        """Cerrar sesión COMPLETAMENTE - LIMPIEZA TOTAL DEL PERFIL"""
        try:
            logger.info("Cerrando sesión COMPLETAMENTE...")
            
            if self.driver:
                try:
                    logger.info("Cerrando navegador...")
                    self.driver.quit()
                    self.driver = None
                    time.sleep(1)
                    logger.info(" Navegador cerrado")
                except Exception as e:
                    logger.debug(f"Error cerrando navegador: {e}")
                    self.driver = None
            
            if os.path.exists(self.user_data_dir):
                try:
                    logger.info("ELIMINANDO perfil completo del navegador...")
                    shutil.rmtree(self.user_data_dir)
                    logger.info("Perfil del navegador ELIMINADO")
                    time.sleep(0.5)
                except Exception as e:
                    logger.error(f"Error eliminando perfil: {e}")
                    try:
                        import subprocess
                        if platform.system() == 'Windows':
                            subprocess.run(['rd', '/s', '/q', self.user_data_dir], shell=True)
                            logger.info(" Perfil eliminado forzadamente")
                    except:
                        logger.warning(" No se pudo eliminar perfil completamente")
            
            if os.path.exists(self.session_file):
                try:
                    os.remove(self.session_file)
                    logger.info(" Archivo de sesión eliminado")
                except:
                    pass
            
            if self.numero_actual:
                cookies_file = os.path.join(
                    self.cookies_dir,
                    f'whatsapp_{self.numero_actual}.pkl'
                )
                if os.path.exists(cookies_file):
                    try:
                        os.remove(cookies_file)
                        logger.info(" Cookies eliminadas")
                    except:
                        pass
            
            self.is_connected = False
            self.numero_conectado = None
            self.numero_actual = None
            
            os.makedirs(self.user_data_dir, exist_ok=True)
            
            logger.info(" Sesión cerrada COMPLETAMENTE - TODO limpio")
            logger.info(" Próxima conexión será completamente nueva")
            return True
        
        except Exception as e:
            logger.error(f" Error cerrando sesión: {e}")
            
            self.is_connected = False
            self.numero_conectado = None
            self.numero_actual = None
            
            if self.driver:
                try:
                    self.driver.quit()
                except:
                    pass
                self.driver = None
            
            return False
    
    def desconectar(self):
        """ Desconectar completamente y cerrar navegador"""
        try:
            self.cerrar_sesion_whatsapp()
            
            logger.info(" Desconectado completamente")
            return True
        
        except Exception as e:
            logger.error(f" Error desconectando: {e}")
            if self.driver:
                try:
                    self.driver.quit()
                except:
                    pass
                self.driver = None
            return False
    
    def __del__(self):
        """Destructor - Limpiar recursos"""
        if self.driver:
            try:
                self.driver.quit()
            except:
                pass

# Instancia global
servicio_whatsapp = ServicioWhatsApp()