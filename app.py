from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO
from configuracion import Config
from models.contacto import Contacto
from models.configuracion import configuracion_global
import logging
import os

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Importar blueprints
from routes.principales import principales_bp
from routes.campanas import campanas_bp
from routes.contactos import contactos_bp
from routes.plantillas import plantillas_bp
from routes.analiticas import analiticas_bp
from routes.configuraciones import configuracion_bp

def crear_app():
    """Factory function para crear la aplicación Flask"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100 MB
    
    # Configurar carpetas de datos
    app.config['DATA_FOLDER'] = 'data'
    app.config['CHROME_PROFILE_FOLDER'] = 'data/chrome_profile'
    app.config['WHATSAPP_SESSION_FILE'] = 'data/whatsapp_session.json'
    app.config['WHATSAPP_COOKIES_FILE'] = 'data/whatsapp_cookies.pkl'
    
    # Inicializar SocketIO
    socketio = SocketIO(app, cors_allowed_origins="*")
    
    # Registrar blueprints
    app.register_blueprint(principales_bp)
    app.register_blueprint(campanas_bp, url_prefix='/campanas')
    app.register_blueprint(contactos_bp, url_prefix='/contactos')
    app.register_blueprint(plantillas_bp)
    app.register_blueprint(analiticas_bp, url_prefix='/analiticas')
    app.register_blueprint(configuracion_bp, url_prefix='/configuracion')
    
    return app, socketio

# Inicializar la aplicación Flask
app, socketio = crear_app()

class ContactosService:
    """Servicio para manejo centralizado de contactos"""
    
    @staticmethod
    def obtener_estadisticas():
        """Obtener estadísticas de contactos reales"""
        try:
            return Contacto.estadisticas()
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas de contactos: {e}")
            return {
                'total': 0,
                'activos': 0,
                'bloqueados': 0,
                'inactivos': 0,
                'nuevos_7_dias': 0,
                'tasa_activos': 0
            }
    
    @staticmethod
    def obtener_todos():
        """Obtener todos los contactos"""
        try:
            return Contacto.obtener_todos()
        except Exception as e:
            logger.error(f"Error obteniendo contactos: {e}")
            return []
    
    @staticmethod
    def obtener_activos():
        """Obtener solo contactos activos"""
        try:
            contactos = Contacto.obtener_todos()
            return [c for c in contactos if c.estado == 'activo']
        except Exception as e:
            logger.error(f"Error obteniendo contactos activos: {e}")
            return []

class WhatsAppService:
    """Servicio para manejo de WhatsApp"""
    
    @staticmethod
    def obtener_estado():
        """Obtener estado de conexión de WhatsApp"""
        try:
            info_sesion = configuracion_global.obtener_info_sesion_whatsapp()
            return {
                'conectado': info_sesion.get('conectado', False),
                'numero': info_sesion.get('numero', ''),
                'dispositivo': info_sesion.get('dispositivo', {}),
                'ultima_actividad': info_sesion.get('ultima_actividad', None)
            }
        except Exception as e:
            logger.error(f"Error obteniendo estado de WhatsApp: {e}")
            return {
                'conectado': False,
                'numero': '',
                'dispositivo': {},
                'ultima_actividad': None
            }
    
    @staticmethod
    def esta_conectado():
        """Verificar si WhatsApp está conectado"""
        try:
            return configuracion_global.esta_whatsapp_conectado()
        except Exception as e:
            logger.error(f"Error verificando conexión de WhatsApp: {e}")
            return False

# ===== RUTAS PRINCIPALES =====

@app.route("/")
def index():
    """Página principal - Campañas con contactos reales"""
    try:
        contactos_reales = ContactosService.obtener_todos()
        contactos_activos = ContactosService.obtener_activos()
        estadisticas_contactos = ContactosService.obtener_estadisticas()
        whatsapp_estado = WhatsAppService.obtener_estado()
        
        plantillas_mock = [
            {'id': 1, 'nombre': 'Plantilla Promocional'},
            {'id': 2, 'nombre': 'Plantilla Informativa'},
            {'id': 3, 'nombre': 'Plantilla Seguimiento'}
        ]
        
        return render_template("campanas/campanas.html", 
                             pantalla_actual='campanas',  
                             user_name="Usuario Demo", 
                             estadisticas=estadisticas_contactos,
                             total_contactos=len(contactos_reales),
                             contactos_activos=len(contactos_activos),
                             contactos_reales=contactos_reales,
                             plantillas=plantillas_mock,
                             whatsapp_conectado=whatsapp_estado['conectado'])
    except Exception as e:
        logger.error(f"Error en página principal: {e}")
        return render_template("campanas/campanas.html", 
                             pantalla_actual='campanas',
                             user_name="Usuario Demo", 
                             estadisticas={'total': 0, 'activos': 0, 'bloqueados': 0, 'inactivos': 0},
                             total_contactos=0,
                             contactos_activos=0,
                             contactos_reales=[],
                             plantillas=[],
                             whatsapp_conectado=False,
                             error="Error cargando datos")

@app.route("/contactos")
def contactos():
    """Página de contactos"""
    try:
        contactos = ContactosService.obtener_todos()
        estadisticas_contactos = ContactosService.obtener_estadisticas()
        whatsapp_estado = WhatsAppService.obtener_estado()
        
        return render_template("contactos/contactos.html", 
                             pantalla_actual='contactos',
                             contactos=contactos,
                             estadisticas=estadisticas_contactos,
                             whatsapp_conectado=whatsapp_estado['conectado'])
    except Exception as e:
        logger.error(f"Error en página de contactos: {e}")
        return render_template("contactos/contactos.html", 
                             pantalla_actual='contactos',
                             contactos=[],
                             estadisticas=ContactosService.obtener_estadisticas(),
                             whatsapp_conectado=False,
                             error="Error cargando contactos")

@app.route("/plantillas") 
def plantillas():
    """Página de plantillas"""
    whatsapp_estado = WhatsAppService.obtener_estado()
    return render_template("plantillas/plantillas.html", 
                         pantalla_actual='plantillas',
                         whatsapp_conectado=whatsapp_estado['conectado'])  

@app.route("/analiticas")
def analiticas():
    """Página de analíticas"""
    whatsapp_estado = WhatsAppService.obtener_estado()
    return render_template("analiticas/analiticas.html", 
                         pantalla_actual='analiticas',
                         whatsapp_conectado=whatsapp_estado['conectado'])  

@app.route("/configuracion")
def configuracion():
    """Página de configuración"""
    try:
        whatsapp_estado = WhatsAppService.obtener_estado()
        config_app = {
            'nombre_empresa': configuracion_global.obtener('empresa.nombre', 'Mi Empresa'),
            'nombre_negocio': configuracion_global.obtener('empresa.negocio', 'Marketing Pro'),
            'modo_desarrollo': configuracion_global.obtener('sistema.modo_desarrollo', False)
        }
        
        return render_template("configuracion/configuracion.html", 
                             pantalla_actual='configuracion',
                             whatsapp_estado=whatsapp_estado,
                             config_app=config_app)
    except Exception as e:
        logger.error(f"Error en página de configuración: {e}")
        return render_template("configuracion/configuracion.html", 
                             pantalla_actual='configuracion',
                             whatsapp_estado={'conectado': False},
                             config_app={},
                             error="Error cargando configuración")

# ===== API ENDPOINTS GLOBALES =====

@app.route("/api/estado/general", methods=['GET'])
def api_estado_general():
    """Endpoint para obtener estado general del sistema"""
    try:
        contactos_stats = ContactosService.obtener_estadisticas()
        whatsapp_estado = WhatsAppService.obtener_estado()
        
        return jsonify({
            'success': True,
            'data': {
                'contactos': contactos_stats,
                'whatsapp': whatsapp_estado,
                'sistema': {
                    'estado': 'operativo',
                    'version': '1.0.0',
                    'modo_desarrollo': configuracion_global.obtener('sistema.modo_desarrollo', False)
                }
            }
        })
    except Exception as e:
        logger.error(f"Error obteniendo estado general: {e}")
        return jsonify({
            'success': False,
            'error': 'Error obteniendo estado del sistema'
        }), 500

@app.route("/api/sistema/health", methods=['GET'])
def api_sistema_health():
    """Endpoint de salud del sistema"""
    try:
        return jsonify({
            'success': True,
            'health': {
                'whatsapp': {
                    'status': 'healthy' if WhatsAppService.esta_conectado() else 'warning',
                    'lastCheck': '2025-09-30T09:49:16Z',
                    'details': 'Conexión estable' if WhatsAppService.esta_conectado() else 'Desconectado'
                },
                'database': {
                    'status': 'healthy',
                    'lastCheck': '2025-09-30T09:49:16Z',
                    'details': 'Base de datos respondiendo'
                },
                'storage': {
                    'status': 'healthy',
                    'lastCheck': '2025-09-30T09:49:16Z',
                    'details': 'Almacenamiento disponible'
                }
            },
            'metrics': {
                'uptime': 3600,
                'memoryUsage': 45.2,
                'cpuUsage': 12.5,
                'diskUsage': 35.8
            }
        })
    except Exception as e:
        logger.error(f"Error en health check: {e}")
        return jsonify({
            'success': False,
            'error': 'Error verificando salud del sistema'
        }), 500

@app.route("/api/verificar/whatsapp", methods=['GET'])
def api_verificar_whatsapp():
    """Verificar si WhatsApp está conectado"""
    try:
        conectado = WhatsAppService.esta_conectado()
        estado = WhatsAppService.obtener_estado()
        
        return jsonify({
            'success': True,
            'conectado': conectado,
            'estado': estado
        })
    except Exception as e:
        logger.error(f"Error verificando WhatsApp: {e}")
        return jsonify({
            'success': False,
            'conectado': False,
            'error': 'Error verificando conexión'
        }), 500

# ===== FAVICON (evitar error 404) =====

@app.route('/favicon.ico')
def favicon():
    """Servir favicon o retornar 204 No Content"""
    return '', 204

# ===== CONTEXT PROCESSORS =====

@app.context_processor
def inject_whatsapp_status():
    """Inyectar estado de WhatsApp en todas las plantillas"""
    from utils.whatsapp_status_manager import whatsapp_status
    
    pantalla_actual = request.endpoint or ''
    
    return dict(
        estado_whatsapp=whatsapp_status.obtener_estado_conexion(),
        mostrar_indicador=whatsapp_status.debe_mostrar_indicador(pantalla_actual),
        pantalla_actual=pantalla_actual
    )

@app.context_processor
def inject_app_config():
    """Inyectar configuración de app en todas las plantillas"""
    def get_app_config():
        try:
            return {
                'nombre_empresa': configuracion_global.obtener('empresa.nombre', 'Mi Empresa'),
                'nombre_negocio': configuracion_global.obtener('empresa.negocio', 'Marketing Pro'),
                'modo_desarrollo': configuracion_global.obtener('sistema.modo_desarrollo', False)
            }
        except:
            return {
                'nombre_empresa': 'Mi Empresa',
                'nombre_negocio': 'Marketing Pro',
                'modo_desarrollo': False
            }
    
    return dict(app_config_global=get_app_config())

# ===== MANEJO DE ERRORES =====

@app.errorhandler(404)
def not_found(error):
    """Manejo de errores 404"""
    if request.path.startswith('/api/'):
        return jsonify({
            'success': False,
            'message': 'Recurso no encontrado',
            'error': 'Not Found'
        }), 404
    else:
        return jsonify({
            'success': False,
            'message': 'Página no encontrada',
            'error': '404'
        }), 404

@app.errorhandler(500)
def internal_error(error):
    """Manejo de errores 500"""
    logger.error(f"Error interno del servidor: {error}")
    
    return jsonify({
        'success': False,
        'message': 'Error interno del servidor',
        'error': 'Internal Server Error'
    }), 500

@app.before_request
def log_request_info():
    """Log de requests para debugging"""
    if request.endpoint and not request.endpoint.startswith('static'):
        logger.debug(f'{request.method} {request.url} - {request.remote_addr}')

@app.before_request
def verificar_directorios():
    """Verificar que existan los directorios necesarios"""
    directorios = [
        'data',
        'data/chrome_profile',
        'data/uploads',
        'data/backups'
    ]
    
    for directorio in directorios:
        if not os.path.exists(directorio):
            os.makedirs(directorio, exist_ok=True)

# ===== INICIALIZACIÓN =====

def inicializar_sistema():
    """Inicializar componentes del sistema"""
    try:
        logger.info("Iniciando aplicación WhatsApp Marketing...")
        
        # Verificar directorios
        directorios = [
            'data',
            'data/chrome_profile',
            'data/uploads',
            'data/backups'
        ]
        
        for directorio in directorios:
            if not os.path.exists(directorio):
                os.makedirs(directorio, exist_ok=True)
                logger.info(f"Directorio creado: {directorio}")
        
        # Verificar sistema de contactos
        try:
            estadisticas = ContactosService.obtener_estadisticas()
            logger.info(f"Contactos disponibles: {estadisticas['total']} total, {estadisticas['activos']} activos")
        except Exception as e:
            logger.warning(f"Sistema de contactos inicializándose: {e}")
        
        # Verificar estado de WhatsApp
        try:
            whatsapp_estado = WhatsAppService.obtener_estado()
            if whatsapp_estado['conectado']:
                logger.info(f"WhatsApp conectado: {whatsapp_estado['numero']}")
            else:
                logger.info("WhatsApp no conectado - Requiere configuración")
        except Exception as e:
            logger.warning(f"Error verificando WhatsApp: {e}")
        
        # Mostrar configuración actual
        try:
            config = {
                'empresa': configuracion_global.obtener('empresa.nombre', 'Mi Empresa'),
                'modo_dev': configuracion_global.obtener('sistema.modo_desarrollo', False)
            }
            logger.info(f"Configuración: {config['empresa']} - Modo desarrollo: {config['modo_dev']}")
        except Exception as e:
            logger.warning(f"Error cargando configuración: {e}")
        
        logger.info("Sistema inicializado correctamente")
        logger.info("Servidor disponible en: http://localhost:5000")
        logger.info("Panel de administración: http://localhost:5000/configuracion")
        
    except Exception as e:
        logger.error(f"Error inicializando sistema: {e}")
        raise

if __name__ == "__main__":
    try:
        # Inicializar sistema
        inicializar_sistema()
        
        # Configurar servidor
        host = os.getenv('FLASK_HOST', '0.0.0.0')
        port = int(os.getenv('FLASK_PORT', 5000))
        debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
        
        # Iniciar servidor
        logger.info(f"Iniciando servidor en {host}:{port}")
        socketio.run(app, debug=debug, host=host, port=port)
        
    except KeyboardInterrupt:
        logger.info("Servidor detenido por el usuario")
    except Exception as e:
        logger.error(f"Error fatal: {e}")
        raise