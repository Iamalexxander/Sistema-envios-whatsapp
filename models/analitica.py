"""
Modelo para analíticas de WhatsApp - Sin base de datos
"""
from datetime import datetime, timedelta
import json
import os

class Analitica:
    """Modelo para gestionar analíticas y métricas"""
    
    ARCHIVO_DATOS = 'data/analiticas.json'
    
    def __init__(self):
        self.id = None
        self.fecha = datetime.now()
        self.mensajes_enviados = 0
        self.mensajes_entregados = 0
        self.mensajes_fallidos = 0
        self.tiempo_respuesta_promedio = 0.0
        self.campana_id = None
        self.creado_en = datetime.now()
    
    @staticmethod
    def _cargar_datos():
        """Carga analíticas desde archivo JSON"""
        os.makedirs('data', exist_ok=True)
        
        if not os.path.exists(Analitica.ARCHIVO_DATOS):
            return []
        
        try:
            with open(Analitica.ARCHIVO_DATOS, 'r', encoding='utf-8') as f:
                datos = json.load(f)
                return datos if isinstance(datos, list) else []
        except (json.JSONDecodeError, IOError):
            return []
    
    @staticmethod
    def _guardar_datos(datos):
        """Guarda analíticas en archivo JSON"""
        os.makedirs('data', exist_ok=True)
        
        try:
            with open(Analitica.ARCHIVO_DATOS, 'w', encoding='utf-8') as f:
                json.dump(datos, f, ensure_ascii=False, indent=2)
            return True
        except IOError:
            return False
    
    def to_dict(self):
        """Convierte la analítica a diccionario"""
        return {
            'id': self.id,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'mensajes_enviados': self.mensajes_enviados,
            'mensajes_entregados': self.mensajes_entregados,
            'mensajes_fallidos': self.mensajes_fallidos,
            'tiempo_respuesta_promedio': self.tiempo_respuesta_promedio,
            'campana_id': self.campana_id,
            'creado_en': self.creado_en.isoformat() if self.creado_en else None
        }
    
    @classmethod
    def from_dict(cls, data):
        """Crea una analítica desde un diccionario"""
        analitica = cls()
        
        analitica.id = data.get('id')
        analitica.mensajes_enviados = data.get('mensajes_enviados', 0)
        analitica.mensajes_entregados = data.get('mensajes_entregados', 0)
        analitica.mensajes_fallidos = data.get('mensajes_fallidos', 0)
        analitica.tiempo_respuesta_promedio = data.get('tiempo_respuesta_promedio', 0.0)
        analitica.campana_id = data.get('campana_id')
        
        if 'fecha' in data and data['fecha']:
            analitica.fecha = datetime.fromisoformat(data['fecha'])
        if 'creado_en' in data and data['creado_en']:
            analitica.creado_en = datetime.fromisoformat(data['creado_en'])
            
        return analitica
    
    def save(self):
        """Guarda la analítica"""
        analiticas = self._cargar_datos()
        
        if self.id:
            for i, analitica_data in enumerate(analiticas):
                if analitica_data.get('id') == self.id:
                    analiticas[i] = self.to_dict()
                    break
        else:
            self.id = f"analitica_{len(analiticas) + 1}_{int(datetime.now().timestamp())}"
            analiticas.append(self.to_dict())
        
        return self._guardar_datos(analiticas)
    
    @staticmethod
    def get_all():
        """Obtiene todas las analíticas"""
        return Analitica._cargar_datos()
    
    @staticmethod
    def get_by_periodo(dias):
        """Obtiene analíticas por período de días"""
        analiticas = Analitica.get_all()
        fecha_limite = datetime.now() - timedelta(days=dias)
        
        analiticas_filtradas = []
        for analitica_data in analiticas:
            if 'fecha' in analitica_data and analitica_data['fecha']:
                fecha_analitica = datetime.fromisoformat(analitica_data['fecha'])
                if fecha_analitica >= fecha_limite:
                    analiticas_filtradas.append(Analitica.from_dict(analitica_data))
        
        return analiticas_filtradas
    
    @staticmethod
    def get_by_campana(campana_id):
        """Obtiene analíticas por campaña"""
        analiticas = Analitica.get_all()
        return [
            Analitica.from_dict(data) 
            for data in analiticas 
            if data.get('campana_id') == campana_id
        ]
    
    @staticmethod
    def calcular_metricas_periodo(dias):
        """Calcula métricas agregadas para un período"""
        analiticas = Analitica.get_by_periodo(dias)
        
        if not analiticas:
            return {
                'total_enviados': 0,
                'total_entregados': 0,
                'total_fallidos': 0,
                'tasa_entrega': 0.0,
                'tiempo_respuesta_promedio': 0.0
            }
        
        total_enviados = sum(a.mensajes_enviados for a in analiticas)
        total_entregados = sum(a.mensajes_entregados for a in analiticas)
        total_fallidos = sum(a.mensajes_fallidos for a in analiticas)
        
        tasa_entrega = (total_entregados / total_enviados * 100) if total_enviados > 0 else 0
        tiempo_promedio = sum(a.tiempo_respuesta_promedio for a in analiticas) / len(analiticas)
        
        return {
            'total_enviados': total_enviados,
            'total_entregados': total_entregados,
            'total_fallidos': total_fallidos,
            'tasa_entrega': round(tasa_entrega, 2),
            'tiempo_respuesta_promedio': round(tiempo_promedio, 2)
        }
    
    @staticmethod
    def generar_reporte_campanas(periodo_dias=7):
        """Genera reporte de rendimiento de campañas"""
        campanas = [
            {
                'nombre': 'Promoción de Fiestas',
                'enviados': 2450,
                'entregados': 2331,
                'tasa_exito': 95.1,
                'respuestas': 234,
                'ingresos': 12450
            },
            {
                'nombre': 'Alerta de Oferta Flash',
                'enviados': 1820,
                'entregados': 1698,
                'tasa_exito': 93.3,
                'respuestas': 156,
                'ingresos': 8920
            }
        ]
        
        return campanas