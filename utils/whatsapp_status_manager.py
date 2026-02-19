"""
Gestor de Estado de Conexión de WhatsApp

"""
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class WhatsAppStatusManager:
    """Gestor centralizado del estado de conexión de WhatsApp"""
    
    @staticmethod
    def obtener_estado_conexion():
        """
        Obtiene el estado actual de conexión de WhatsApp
        
        Returns:
            dict: Estado de conexión con todos los detalles
        """
        try:
            from models.configuracion import configuracion_global
            
            info_sesion = configuracion_global.obtener_info_sesion_whatsapp()
            
            return {
                'conectado': info_sesion.get('conectado', False),
                'numero': info_sesion.get('numero', ''),
                'navegador': info_sesion.get('navegador', ''),
                'conectado_desde': info_sesion.get('conectado_desde', ''),
                'tiempo_conexion': WhatsAppStatusManager._calcular_tiempo_conexion(
                    info_sesion.get('conectado_desde', '')
                )
            }
        except Exception as e:
            logger.error(f"Error obteniendo estado de conexión: {e}")
            return {
                'conectado': False,
                'numero': '',
                'navegador': '',
                'conectado_desde': '',
                'tiempo_conexion': ''
            }
    
    @staticmethod
    def _calcular_tiempo_conexion(fecha_conexion):
        """
        Calcula el tiempo transcurrido desde la conexión
        
        Args:
            fecha_conexion: Fecha ISO de la conexión
            
        Returns:
            str: Texto descriptivo del tiempo transcurrido
        """
        if not fecha_conexion:
            return ''
        
        try:
            fecha = datetime.fromisoformat(fecha_conexion)
            ahora = datetime.now()
            diferencia = ahora - fecha
            
            # Calcular días, horas y minutos
            dias = diferencia.days
            segundos = diferencia.seconds
            horas = segundos // 3600
            minutos = (segundos % 3600) // 60
            
            # Retornar texto apropiado
            if dias > 0:
                return f"Hace {dias} día{'s' if dias > 1 else ''}"
            elif horas > 0:
                return f"Hace {horas} hora{'s' if horas > 1 else ''}"
            elif minutos > 0:
                return f"Hace {minutos} minuto{'s' if minutos > 1 else ''}"
            else:
                return "Recién conectado"
                
        except Exception as e:
            logger.error(f"Error calculando tiempo de conexión: {e}")
            return ''
    
    @staticmethod
    def debe_mostrar_indicador(pantalla_actual):  # ← Corrección de indentación
        """
        Determina si se debe mostrar el indicador en la pantalla actual
        
        Args:
            pantalla_actual: Nombre de la pantalla actual
            
        Returns:
            bool: True si se debe mostrar, False si no
        """
        # No mostrar solo en configuración y login
        pantallas_sin_indicador = ['configuracion', 'login', 'registro']
        return pantalla_actual not in pantallas_sin_indicador

# Instancia global para fácil importación
whatsapp_status = WhatsAppStatusManager()