import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

class Config:
    """Configuración de la aplicación Flask"""
    
    # Configuración básica de Flask
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'whatsapp-sender-clave-secreta-2025'
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    # Configuración de base de datos
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///whatsapp_sender.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configuración de archivos
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB máximo
    UPLOAD_FOLDER = 'static/uploads'
    ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'csv', 'png', 'jpg', 'jpeg', 'gif'}
    
    # Configuración de email (para notificaciones)
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp.gmail.com'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    
    # Configuración de la aplicación
    TIMEZONE = 'America/Guayaquil'  # Cambiado a Ecuador
    ITEMS_PER_PAGE = 50
    
    # Configuración de envío por defecto
    DEFAULT_SEND_SPEED = 'medium'  # slow, medium, fast
    DEFAULT_RETRY_ATTEMPTS = 2
    DEFAULT_RETRY_DELAY = 5  # minutos
    
    # Configuración de seguridad
    SESSION_TIMEOUT = 30  # minutos
    REQUIRE_HTTPS = False
    ENABLE_CORS = False
    
    @staticmethod
    def init_app(app):
        """Inicializar configuración específica de la aplicación"""
        pass

class ConfiguracionDesarrollo(Config):
    """Configuración para ambiente de desarrollo"""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or 'sqlite:///dev_whatsapp_sender.db'

class ConfiguracionProduccion(Config):
    """Configuración para ambiente de producción"""
    DEBUG = False
    REQUIRE_HTTPS = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    
    @classmethod
    def init_app(cls, app):
        Config.init_app(app)
        
        # Log a syslog en producción
        import logging
        from logging.handlers import SysLogHandler
        syslog_handler = SysLogHandler()
        syslog_handler.setLevel(logging.WARNING)
        app.logger.addHandler(syslog_handler)

class ConfiguracionPruebas(Config):
    """Configuración para pruebas"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

# Configuraciones disponibles
configuraciones = {
    'desarrollo': ConfiguracionDesarrollo,
    'produccion': ConfiguracionProduccion,
    'pruebas': ConfiguracionPruebas,
    'default': ConfiguracionDesarrollo
}