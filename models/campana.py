"""
Modelo para las campañas de WhatsApp - Sin base de datos
"""
from datetime import datetime
import uuid
import json
import os

class Campana:
    """Modelo de campaña de WhatsApp"""
    
    ARCHIVO_DATOS = 'data/campanas.json'
    
    def __init__(self, contenido, plantilla_id=None, intervalo=5, origen_destinatarios='todos'):
        self.id = str(uuid.uuid4())
        self.nombre = ''  # AGREGADO: Campo nombre
        self.contenido = contenido
        self.plantilla_id = plantilla_id
        self.intervalo = intervalo
        self.origen_destinatarios = origen_destinatarios
        self.total_contactos = 0
        self.enviados = 0
        self.fallidos = 0
        self.estado = 'creado'
        self.creado_en = datetime.now()
        self.actualizado_en = datetime.now()
    
    @staticmethod
    def _cargar_datos():
        """Carga campañas desde archivo JSON"""
        os.makedirs('data', exist_ok=True)
        
        if not os.path.exists(Campana.ARCHIVO_DATOS):
            return []
        
        try:
            with open(Campana.ARCHIVO_DATOS, 'r', encoding='utf-8') as f:
                datos = json.load(f)
                return datos if isinstance(datos, list) else []
        except (json.JSONDecodeError, IOError):
            return []
    
    @staticmethod
    def _guardar_datos(datos):
        """Guarda campañas en archivo JSON"""
        os.makedirs('data', exist_ok=True)
        
        try:
            with open(Campana.ARCHIVO_DATOS, 'w', encoding='utf-8') as f:
                json.dump(datos, f, ensure_ascii=False, indent=2)
            return True
        except IOError:
            return False
    
    def to_dict(self):
        """Convierte la campaña a diccionario"""
        return {
            'id': self.id,
            'nombre': self.nombre,  # AGREGADO: Incluir nombre en diccionario
            'contenido': self.contenido,
            'plantilla_id': self.plantilla_id,
            'intervalo': self.intervalo,
            'origen_destinatarios': self.origen_destinatarios,
            'total_contactos': self.total_contactos,
            'enviados': self.enviados,
            'fallidos': self.fallidos,
            'estado': self.estado,
            'creado_en': self.creado_en.isoformat(),
            'actualizado_en': self.actualizado_en.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data):
        """Crea una campaña desde un diccionario"""
        campana = cls(
            contenido=data['contenido'],
            plantilla_id=data.get('plantilla_id'),
            intervalo=data.get('intervalo', 5),
            origen_destinatarios=data.get('origen_destinatarios', 'todos')
        )
        
        campana.id = data['id']
        campana.nombre = data.get('nombre', '')  # AGREGADO: Cargar nombre desde diccionario
        campana.total_contactos = data.get('total_contactos', 0)
        campana.enviados = data.get('enviados', 0)
        campana.fallidos = data.get('fallidos', 0)
        campana.estado = data.get('estado', 'creado')
        
        if 'creado_en' in data:
            campana.creado_en = datetime.fromisoformat(data['creado_en'])
        if 'actualizado_en' in data:
            campana.actualizado_en = datetime.fromisoformat(data['actualizado_en'])
            
        return campana
    
    def save(self):
        """Guarda la campaña"""
        campanas = self._cargar_datos()
        
        for i, campana_data in enumerate(campanas):
            if campana_data['id'] == self.id:
                campanas[i] = self.to_dict()
                break
        else:
            campanas.append(self.to_dict())
        
        return self._guardar_datos(campanas)
    
    def actualizar_estado(self, nuevo_estado):
        """Actualiza el estado de la campaña"""
        self.estado = nuevo_estado
        self.actualizado_en = datetime.now()
        return self.save()
    
    def incrementar_enviados(self, cantidad=1):
        """Incrementa el contador de enviados"""
        self.enviados += cantidad
        self.actualizado_en = datetime.now()
        return self.save()
    
    def incrementar_fallidos(self, cantidad=1):
        """Incrementa el contador de fallidos"""
        self.fallidos += cantidad
        self.actualizado_en = datetime.now()
        return self.save()
    
    @staticmethod
    def get_all():
        """Obtiene todas las campañas"""
        return Campana._cargar_datos()
    
    @staticmethod
    def get_by_id(campana_id):
        """Obtiene una campaña por ID"""
        campanas = Campana.get_all()
        for campana_data in campanas:
            if campana_data['id'] == campana_id:
                return Campana.from_dict(campana_data)
        return None
    
    @staticmethod
    def get_activas():
        """Obtiene campañas activas"""
        campanas = Campana.get_all()
        return [
            Campana.from_dict(data) 
            for data in campanas 
            if data['estado'] in ['enviando', 'pausado']
        ]