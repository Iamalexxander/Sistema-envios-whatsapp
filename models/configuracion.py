"""
Modelo para manejar configuraciones del sistema
"""
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class Configuracion:
    """Modelo para configuraciones del sistema sin base de datos"""
    
    def __init__(self):
        self.archivo_config = 'data/configuracion.json'
        self.archivo_whatsapp = 'data/whatsapp_session.json'
        self._configuracion = self._cargar_configuracion()
        self._sesion_whatsapp = self._cargar_sesion_whatsapp()
    
    def _cargar_configuracion(self) -> Dict[str, Any]:
        """Cargar configuración desde archivo JSON"""
        try:
            if os.path.exists(self.archivo_config):
                with open(self.archivo_config, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error cargando configuración: {e}")
        
        return {
            'empresa': {
                'nombre': 'Mi Empresa'
            },
            'whatsapp': {
                'conectado': False,
                'numero': '',
                'navegador': '',
                'sesion_activa': False
            },
            'auditoria': [],
            'creado_en': datetime.now().isoformat(),
            'actualizado_en': datetime.now().isoformat()
        }
    
    def _cargar_sesion_whatsapp(self) -> Dict[str, Any]:
        """Cargar sesión de WhatsApp"""
        try:
            if os.path.exists(self.archivo_whatsapp):
                with open(self.archivo_whatsapp, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error cargando sesión WhatsApp: {e}")
        
        return {
            'activa': False,
            'numero': '',
            'navegador': '',
            'conectado_desde': None,
            'cookies_guardadas': False
        }
    
    def guardar(self):
        """Guardar configuración a archivo"""
        try:
            os.makedirs(os.path.dirname(self.archivo_config), exist_ok=True)
            self._configuracion['actualizado_en'] = datetime.now().isoformat()
            
            with open(self.archivo_config, 'w', encoding='utf-8') as f:
                json.dump(self._configuracion, f, indent=2, ensure_ascii=False)
            
            logger.info("Configuración guardada exitosamente")
            return True
        except Exception as e:
            logger.error(f"Error guardando configuración: {e}")
            return False
    
    def guardar_sesion_whatsapp(self):
        """Guardar sesión de WhatsApp"""
        try:
            os.makedirs(os.path.dirname(self.archivo_whatsapp), exist_ok=True)
            
            with open(self.archivo_whatsapp, 'w', encoding='utf-8') as f:
                json.dump(self._sesion_whatsapp, f, indent=2, ensure_ascii=False)
            
            return True
        except Exception as e:
            logger.error(f"Error guardando sesión WhatsApp: {e}")
            return False
    
    def obtener(self, clave: str, defecto=None):
        """Obtener valor de configuración"""
        keys = clave.split('.')
        valor = self._configuracion
        
        for key in keys:
            if isinstance(valor, dict) and key in valor:
                valor = valor[key]
            else:
                return defecto
        return valor
    
    def establecer(self, clave: str, valor: Any):
        """Establecer valor de configuración"""
        keys = clave.split('.')
        config = self._configuracion
        
        for key in keys[:-1]:
            if key not in config:
                config[key] = {}
            config = config[key]
        
        config[keys[-1]] = valor
        return self.guardar()
    
    def obtener_numero_whatsapp(self) -> str:
        """Obtener número de WhatsApp configurado"""
        return self.obtener('whatsapp.numero', '')
    
    def establecer_numero_whatsapp(self, numero: str) -> bool:
        """Establecer número de WhatsApp"""
        if not self._validar_numero_ecuatoriano(numero):
            return False
        return self.establecer('whatsapp.numero', numero)
    
    def esta_whatsapp_conectado(self) -> bool:
        """Verificar si WhatsApp está conectado"""
        return self._sesion_whatsapp.get('activa', False)
    
    def conectar_whatsapp(self, numero: str, navegador: str) -> bool:
        """Conectar WhatsApp (sesión persistente)"""
        try:
            if not self._validar_numero_ecuatoriano(numero):
                return False
            
            self._sesion_whatsapp.update({
                'activa': True,
                'numero': numero,
                'navegador': navegador,
                'conectado_desde': datetime.now().isoformat(),
                'cookies_guardadas': True
            })
            
            self.establecer('whatsapp.conectado', True)
            self.establecer('whatsapp.numero', numero)
            self.establecer('whatsapp.navegador', navegador)
            self.establecer('whatsapp.ultima_conexion', datetime.now().isoformat())
            self.establecer('whatsapp.sesion_activa', True)
            
            self.agregar_auditoria('sistema', 'WhatsApp Conectado', 
                                 f'Conexión establecida para {numero} en {navegador}', 'success')
            
            return self.guardar_sesion_whatsapp()
        except Exception as e:
            logger.error(f"Error conectando WhatsApp: {e}")
            return False
    
    def desconectar_whatsapp(self) -> bool:
        """Desconectar WhatsApp"""
        try:
            numero = self._sesion_whatsapp.get('numero', '')
            
            self._sesion_whatsapp = {
                'activa': False,
                'numero': '',
                'navegador': '',
                'conectado_desde': None,
                'cookies_guardadas': False
            }
            
            self.establecer('whatsapp.conectado', False)
            self.establecer('whatsapp.sesion_activa', False)
            self.agregar_auditoria('usuario principal', 'WhatsApp Desconectado', 
                                 f'Sesión desconectada para {numero}', 'warning')
            
            return self.guardar_sesion_whatsapp()
        except Exception as e:
            logger.error(f"Error desconectando WhatsApp: {e}")
            return False
    
    def obtener_info_sesion_whatsapp(self) -> Dict[str, Any]:
        """Obtener información de la sesión de WhatsApp"""
        return {
            'conectado': self._sesion_whatsapp.get('activa', False),
            'numero': self._sesion_whatsapp.get('numero', ''),
            'navegador': self._sesion_whatsapp.get('navegador', ''),
            'conectado_desde': self._sesion_whatsapp.get('conectado_desde'),
            'cookies_guardadas': self._sesion_whatsapp.get('cookies_guardadas', False)
        }
    
    def _validar_numero_ecuatoriano(self, numero: str) -> bool:
        """Validar formato de número ecuatoriano"""
        import re
        numero_limpio = re.sub(r'[^\d+]', '', numero)
        patron = r'^\+5939\d{8}$'
        
        if re.match(patron, numero_limpio):
            return True
        if numero_limpio.startswith('5939') and len(numero_limpio) == 12:
            return True
        return False
    
    def formatear_numero_ecuatoriano(self, numero: str) -> str:
        """Formatear número a formato ecuatoriano estándar"""
        import re
        numero_limpio = re.sub(r'[^\d]', '', numero)
        
        if numero_limpio.startswith('5939') and len(numero_limpio) == 12:
            return f"+{numero_limpio}"
        elif numero_limpio.startswith('9') and len(numero_limpio) == 9:
            return f"+593{numero_limpio}"
        return numero
    
    def agregar_auditoria(self, usuario: str, accion: str, detalles: str, estado: str = 'info'):
        """Agregar entrada de auditoría"""
        entrada = {
            'timestamp': datetime.now().isoformat(),
            'usuario': usuario,
            'accion': accion,
            'detalles': detalles,
            'estado': estado
        }
        
        if 'auditoria' not in self._configuracion:
            self._configuracion['auditoria'] = []
        
        self._configuracion['auditoria'].insert(0, entrada)
        self._configuracion['auditoria'] = self._configuracion['auditoria'][:100]
        self.guardar()
    
    def obtener_auditoria(self, limite: int = 50) -> list:
        """Obtener registros de auditoría"""
        return self._configuracion.get('auditoria', [])[:limite]
    
    def obtener_estadisticas_sistema(self) -> Dict[str, Any]:
        """Obtener estadísticas del sistema"""
        return {
            'whatsapp': {
                'status': 'healthy' if self.esta_whatsapp_conectado() else 'warning',
                'lastCheck': datetime.now().isoformat(),
                'details': 'Conexión estable' if self.esta_whatsapp_conectado() else 'Desconectado'
            },
            'storage': {
                'status': 'healthy',
                'lastCheck': datetime.now().isoformat(),
                'details': 'Almacenamiento disponible'
            },
            'memory': {
                'status': 'healthy',
                'lastCheck': datetime.now().isoformat(),
                'details': 'Uso de memoria normal'
            }
        }

configuracion_global = Configuracion()