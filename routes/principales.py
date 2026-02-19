from flask import Blueprint, render_template, redirect, url_for

# Crear blueprint para rutas principales
principales_bp = Blueprint('principales', __name__)

# Comentamos esta ruta para que no intercepte la ruta raíz
# @principales_bp.route('/')
# def inicio():
#     """Ruta principal - redirige a la función index del aplicacion.py"""
#     return redirect(url_for('index'))

@principales_bp.route('/inicio')  # Cambiamos a /inicio en lugar de /
def inicio():
    """Ruta de inicio específica"""
    return redirect(url_for('index'))

@principales_bp.route('/salud')
def salud():
    """Endpoint de salud para verificar que la aplicación funciona"""
    return {
        'status': 'ok',
        'mensaje': 'WhatsApp Sender funcionando correctamente',
        'version': '1.0.0'
    }

@principales_bp.route('/acerca')
def acerca():
    """Información sobre la aplicación"""
    return {
        'nombre': 'WhatsApp Sender',
        'version': '1.0.0',
        'descripcion': 'Sistema de envío masivo de mensajes de WhatsApp',
        'desarrollado_por': 'Tu Empresa',
        'tecnologias': ['Flask', 'SQLAlchemy', 'WhatsApp Business API']
    }