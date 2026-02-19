"""
Rutas para configuración del sistema
"""
from flask import Blueprint, render_template, request, jsonify
from models.configuracion import configuracion_global
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

configuracion_bp = Blueprint('configuracion', __name__)

@configuracion_bp.route('/')
def index():
    """Página principal de configuración"""
    return render_template('configuracion/configuracion.html',
                         pantalla_actual='configuracion')

@configuracion_bp.route('/api/whatsapp/estado', methods=['GET'])
def api_estado_whatsapp():
    """
    MEJORADO: Obtener estado REAL de WhatsApp con verificación rápida
    """
    try:
        from utils.servicio_whatsapp import servicio_whatsapp
        
        sesion_real_activa = False
        
        if servicio_whatsapp.driver:
            try:
                sesion_real_activa = servicio_whatsapp.verificar_sesion_activa_real()
                
                if not sesion_real_activa and servicio_whatsapp.is_connected:
                    logger.warning("Sesión cerrada desde el celular detectada")
                    servicio_whatsapp.is_connected = False
                    configuracion_global.desconectar_whatsapp()
                elif sesion_real_activa and not servicio_whatsapp.is_connected:
                    servicio_whatsapp.is_connected = True
            except Exception as e:
                logger.debug(f"Error verificando sesión: {e}")
                sesion_real_activa = servicio_whatsapp.is_connected
        
        info_sesion = configuracion_global.obtener_info_sesion_whatsapp()
        
        estado_conectado = sesion_real_activa if servicio_whatsapp.driver else info_sesion['conectado']
        
        return jsonify({
            'success': True,
            'data': {
                'conectado': estado_conectado,
                'numero': info_sesion['numero'],
                'navegador': info_sesion['navegador'],
                'conectado_desde': info_sesion['conectado_desde'],
                'cookies_guardadas': info_sesion['cookies_guardadas']
            }
        })
    except Exception as e:
        logger.error(f"Error obteniendo estado WhatsApp: {e}")
        return jsonify({
            'success': False,
            'error': 'Error obteniendo estado de WhatsApp'
        }), 500

@configuracion_bp.route('/api/whatsapp/abrir-whatsapp', methods=['POST'])
def abrir_whatsapp():
    """Abrir WhatsApp Web y conectar automáticamente"""
    try:
        from utils.servicio_whatsapp import servicio_whatsapp
        
        data = request.get_json()
        numero = data.get('numero')
        
        if not numero:
            return jsonify({'success': False, 'error': 'Número requerido'}), 400
        
        logger.info(f"Abriendo WhatsApp Web para {numero}")
        
        # Conectar usando navegador predeterminado
        exito, mensaje = servicio_whatsapp.conectar(numero)
        
        if exito:
            # Obtener nombre del navegador
            navegador_nombre = servicio_whatsapp.obtener_nombre_navegador()
            
            # Guardar en configuración
            configuracion_global.conectar_whatsapp(
                numero,
                navegador_nombre
            )
            
            return jsonify({
                'success': True,
                'message': mensaje,
                'navegador': navegador_nombre
            })
        else:
            return jsonify({
                'success': False,
                'error': mensaje
            }), 500
            
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@configuracion_bp.route('/api/whatsapp/desconectar', methods=['POST'])
def api_desconectar_whatsapp():
    """
    MEJORADO: Desconectar sesión de WhatsApp correctamente
    Cierra la sesión en WhatsApp Web
    """
    try:
        from utils.servicio_whatsapp import servicio_whatsapp
        
        logger.info("Iniciando proceso de desconexión...")
        
        # Cerrar sesión de WhatsApp
        if servicio_whatsapp.cerrar_sesion_whatsapp():
            configuracion_global.desconectar_whatsapp()
            logger.info("Sesión desconectada")
            return jsonify({
                'success': True,
                'message': 'Sesión de WhatsApp cerrada correctamente'
            })
        else:
            # Aunque haya fallado, limpiar el estado
            configuracion_global.desconectar_whatsapp()
            return jsonify({
                'success': False,
                'error': 'Error cerrando sesión, pero el estado fue actualizado'
            }), 500
    except Exception as e:
        logger.error(f"Error desconectando WhatsApp: {e}")
        # Limpiar estado de todos modos
        configuracion_global.desconectar_whatsapp()
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor'
        }), 500

@configuracion_bp.route('/api/configuracion/aplicacion', methods=['GET'])
def api_obtener_configuracion_aplicacion():
    """Obtener configuración de aplicación"""
    try:
        config = {
            'nombre_empresa': configuracion_global.obtener('empresa.nombre', 'Mi Empresa')
        }
        
        return jsonify({
            'success': True,
            'data': config
        })
    except Exception as e:
        logger.error(f"Error obteniendo configuración de aplicación: {e}")
        return jsonify({
            'success': False,
            'error': 'Error obteniendo configuración'
        }), 500

@configuracion_bp.route('/api/configuracion/aplicacion', methods=['POST'])
def api_guardar_configuracion_aplicacion():
    """Guardar configuración de aplicación"""
    try:
        data = request.get_json()
        
        if 'nombre_empresa' in data:
            configuracion_global.establecer('empresa.nombre', data['nombre_empresa'])
        
        configuracion_global.agregar_auditoria(
            'usuario principal',
            'Configuración de Aplicación',
            'Configuración de la aplicación actualizada',
            'success'
        )
        
        return jsonify({
            'success': True,
            'message': 'Configuración de aplicación guardada exitosamente'
        })
    except Exception as e:
        logger.error(f"Error guardando configuración de aplicación: {e}")
        return jsonify({
            'success': False,
            'error': 'Error guardando configuración'
        }), 500

@configuracion_bp.route('/api/sistema/estado', methods=['GET'])
def api_estado_sistema():
    """Obtener estado del sistema"""
    try:
        estadisticas = configuracion_global.obtener_estadisticas_sistema()
        return jsonify({
            'success': True,
            'data': estadisticas
        })
    except Exception as e:
        logger.error(f"Error obteniendo estado del sistema: {e}")
        return jsonify({
            'success': False,
            'error': 'Error obteniendo estado del sistema'
        }), 500

@configuracion_bp.route('/api/auditoria', methods=['GET'])
def api_obtener_auditoria():
    """Obtener registros de auditoría"""
    try:
        limite = request.args.get('limite', 50, type=int)
        auditoria = configuracion_global.obtener_auditoria(limite)
        
        return jsonify({
            'success': True,
            'data': auditoria,
            'total': len(auditoria)
        })
    except Exception as e:
        logger.error(f"Error obteniendo auditoría: {e}")
        return jsonify({
            'success': False,
            'error': 'Error obteniendo registros de auditoría'
        }), 500