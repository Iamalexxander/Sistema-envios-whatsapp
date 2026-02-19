import json
import os
from datetime import datetime
from typing import List, Dict, Optional

class PlantillaModel:
    def __init__(self):
        self.archivo_plantillas = 'data/plantillas.json'
        self.archivo_categorias = 'data/categorias.json'
        self._asegurar_archivos()
    
    def _asegurar_archivos(self):
        """Asegura que existan los archivos de datos"""
        os.makedirs('data', exist_ok=True)
        
        if not os.path.exists(self.archivo_plantillas):
            with open(self.archivo_plantillas, 'w', encoding='utf-8') as f:
                json.dump([], f)
        
        if not os.path.exists(self.archivo_categorias):
            categorias_default = [
                {"id": 1, "nombre": "Marketing", "color": "#25d366"},
                {"id": 2, "nombre": "Transaccional", "color": "#3b82f6"},
                {"id": 3, "nombre": "Eventos", "color": "#f59e0b"},
                {"id": 4, "nombre": "Soporte", "color": "#ef4444"}
            ]
            with open(self.archivo_categorias, 'w', encoding='utf-8') as f:
                json.dump(categorias_default, f, ensure_ascii=False, indent=2)
    
    def _cargar_plantillas(self) -> List[Dict]:
        """Carga plantillas desde el archivo"""
        try:
            with open(self.archivo_plantillas, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    
    def _guardar_plantillas(self, plantillas: List[Dict]):
        """Guarda plantillas en el archivo"""
        with open(self.archivo_plantillas, 'w', encoding='utf-8') as f:
            json.dump(plantillas, f, ensure_ascii=False, indent=2)
    
    def _cargar_categorias(self) -> List[Dict]:
        """Carga categorías desde el archivo"""
        try:
            with open(self.archivo_categorias, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    
    def _guardar_categorias(self, categorias: List[Dict]):
        """Guarda categorías en el archivo"""
        with open(self.archivo_categorias, 'w', encoding='utf-8') as f:
            json.dump(categorias, f, ensure_ascii=False, indent=2)
    
    def obtener_todas(self) -> List[Dict]:
        """Obtiene todas las plantillas"""
        return self._cargar_plantillas()
    
    def obtener_por_id(self, plantilla_id: int) -> Optional[Dict]:
        """Obtiene una plantilla por ID"""
        plantillas = self._cargar_plantillas()
        return next((p for p in plantillas if p['id'] == plantilla_id), None)
    
    def crear(self, datos: Dict) -> Dict:
        """Crea una nueva plantilla"""
        plantillas = self._cargar_plantillas()
        
        # Generar nuevo ID
        nuevo_id = max([p['id'] for p in plantillas], default=0) + 1
        
        nueva_plantilla = {
            'id': nuevo_id,
            'nombre': datos['nombre'],
            'categoria': datos['categoria'],
            'contenido': datos['contenido'],
            'variables': self._extraer_variables(datos['contenido']),
            'usos': 0,
            'fecha_creacion': datetime.now().strftime('%d/%m/%Y'),
            'fecha_modificacion': datetime.now().strftime('%d/%m/%Y %H:%M')
        }
        
        plantillas.append(nueva_plantilla)
        self._guardar_plantillas(plantillas)
        
        return nueva_plantilla
    
    def actualizar(self, plantilla_id: int, datos: Dict) -> Optional[Dict]:
        """Actualiza una plantilla existente"""
        plantillas = self._cargar_plantillas()
        
        for i, plantilla in enumerate(plantillas):
            if plantilla['id'] == plantilla_id:
                plantillas[i].update({
                    'nombre': datos['nombre'],
                    'categoria': datos['categoria'],
                    'contenido': datos['contenido'],
                    'variables': self._extraer_variables(datos['contenido']),
                    'fecha_modificacion': datetime.now().strftime('%d/%m/%Y %H:%M')
                })
                
                self._guardar_plantillas(plantillas)
                return plantillas[i]
        
        return None
    
    def eliminar(self, plantilla_id: int) -> bool:
        """Elimina una plantilla"""
        plantillas = self._cargar_plantillas()
        plantillas_filtradas = [p for p in plantillas if p['id'] != plantilla_id]
        
        if len(plantillas_filtradas) < len(plantillas):
            self._guardar_plantillas(plantillas_filtradas)
            return True
        
        return False
    
    def incrementar_uso(self, plantilla_id: int):
        """Incrementa el contador de usos de una plantilla"""
        plantillas = self._cargar_plantillas()
        
        for plantilla in plantillas:
            if plantilla['id'] == plantilla_id:
                plantilla['usos'] = plantilla.get('usos', 0) + 1
                break
        
        self._guardar_plantillas(plantillas)
    
    def _extraer_variables(self, contenido: str) -> List[str]:
        """Extrae variables del contenido"""
        import re
        variables = re.findall(r'_([A-Z_]+)_', contenido)
        return list(set(variables))
    
    # Métodos para categorías
    def obtener_categorias(self) -> List[Dict]:
        """Obtiene todas las categorías"""
        return self._cargar_categorias()
    
    def crear_categoria(self, nombre: str, color: str = "#25d366") -> Dict:
        """Crea una nueva categoría"""
        categorias = self._cargar_categorias()
        
        nuevo_id = max([c['id'] for c in categorias], default=0) + 1
        
        nueva_categoria = {
            'id': nuevo_id,
            'nombre': nombre,
            'color': color
        }
        
        categorias.append(nueva_categoria)
        self._guardar_categorias(categorias)
        
        return nueva_categoria
    
    def eliminar_categoria(self, categoria_id: int) -> bool:
        """Elimina una categoría"""
        categorias = self._cargar_categorias()
        categorias_filtradas = [c for c in categorias if c['id'] != categoria_id]
        
        if len(categorias_filtradas) < len(categorias):
            self._guardar_categorias(categorias_filtradas)
            return True
        
        return False
    
    def buscar(self, termino: str) -> List[Dict]:
        """Busca plantillas por término"""
        plantillas = self._cargar_plantillas()
        termino_lower = termino.lower()
        
        return [
            p for p in plantillas
            if termino_lower in p['nombre'].lower() or
               termino_lower in p['categoria'].lower() or
               termino_lower in p['contenido'].lower()
        ]