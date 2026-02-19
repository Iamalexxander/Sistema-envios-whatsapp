"""
Modelo para los contactos de WhatsApp con almacenamiento local JSON
"""
from datetime import datetime, timedelta
import uuid
import json
import os
import re


class BaseDatos:
    """Manejo de almacenamiento local con archivos JSON"""
    
    def __init__(self):
        self.data_dir = 'data'
        self._inicializar_directorio()
    
    def _inicializar_directorio(self):
        """Crear directorio de datos si no existe"""
        if not os.path.exists(self.data_dir):
            try:
                os.makedirs(self.data_dir)
                print(f"Directorio {self.data_dir} creado exitosamente")
            except OSError as e:
                print(f"Error creando directorio {self.data_dir}: {e}")
    
    def cargar_datos(self, nombre_archivo):
        """Cargar datos desde archivo JSON"""
        filepath = os.path.join(self.data_dir, f'{nombre_archivo}.json')
        
        if not os.path.exists(filepath):
            return []
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                datos = json.load(f)
                return datos if isinstance(datos, list) else []
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error cargando {filepath}: {e}")
            return []
    
    def guardar_datos(self, nombre_archivo, datos):
        """Guardar datos en archivo JSON"""
        filepath = os.path.join(self.data_dir, f'{nombre_archivo}.json')
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(datos, f, ensure_ascii=False, indent=2)
            return True
        except IOError as e:
            print(f"Error guardando {filepath}: {e}")
            return False


# Instancia global de la base de datos
db = BaseDatos()


class Contacto:
    """Modelo de contacto de WhatsApp"""
    
    def __init__(self, nombre, telefono, email=None, empresa=None):
        self.id = str(uuid.uuid4())
        self.nombre = self._limpiar_texto(nombre)
        self.telefono = self._limpiar_telefono(telefono)
        self.email = self._validar_email(email)
        self.empresa = self._limpiar_texto(empresa)
        
        # Estado del contacto
        self.estado = 'activo'
        
        # Información de mensajería
        self.ultimo_mensaje_fecha = None
        self.total_mensajes_enviados = 0
        self.total_mensajes_entregados = 0
        self.total_mensajes_leidos = 0
        
        # Metadatos
        self.notas = None
        self.etiquetas = []
        self.origen = 'manual'
        
        # Fechas
        self.creado_en = datetime.now()
        self.actualizado_en = datetime.now()
    
    def _limpiar_texto(self, texto):
        """Limpiar y validar texto"""
        if not texto:
            return None
        return texto.strip() if texto.strip() else None
    
    def _limpiar_telefono(self, telefono):
        """Limpiar y formatear el número de teléfono"""
        if not telefono:
            raise ValueError("El teléfono es requerido")
        
        # Remover caracteres no numéricos excepto el +
        telefono_limpio = ''.join(c for c in str(telefono) if c.isdigit() or c == '+')
        
        # Si no empieza con +, agregar +593
        if not telefono_limpio.startswith('+'):
            telefono_limpio = '+593' + telefono_limpio
        
        # Validar formato específico: +593 seguido de 9 dígitos que empiecen con 9
        if not re.match(r'^\+5939\d{8}$', telefono_limpio):
            raise ValueError(f"Formato de teléfono inválido: {telefono_limpio}. Debe ser +593 seguido de 9 dígitos que empiecen con 9 (ej: +5939XXXXXXXX)")
        
        return telefono_limpio
    
    def _validar_email(self, email):
        """Validar formato de email"""
        if not email:
            return None
        
        email = email.strip().lower()
        patron_email = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        if re.match(patron_email, email):
            return email
        else:
            raise ValueError("Formato de email inválido")
    
    @property
    def iniciales(self):
        """Obtener iniciales del nombre"""
        if not self.nombre:
            return "?"
        
        palabras = self.nombre.split()
        if len(palabras) >= 2:
            return f"{palabras[0][0]}{palabras[-1][0]}".upper()
        return self.nombre[0].upper()
    
    @property
    def tasa_entrega(self):
        """Calcular tasa de entrega"""
        if self.total_mensajes_enviados == 0:
            return 0
        return round((self.total_mensajes_entregados / self.total_mensajes_enviados) * 100, 1)
    
    @property
    def tasa_lectura(self):
        """Calcular tasa de lectura"""
        if self.total_mensajes_entregados == 0:
            return 0
        return round((self.total_mensajes_leidos / self.total_mensajes_entregados) * 100, 1)
    
    def to_dict(self):
        """Convierte el contacto a diccionario para JSON"""
        return {
            'id': self.id,
            'nombre': self.nombre,
            'telefono': self.telefono,
            'email': self.email,
            'empresa': self.empresa,
            'estado': self.estado,
            'ultimo_mensaje_fecha': self.ultimo_mensaje_fecha.isoformat() if self.ultimo_mensaje_fecha else None,
            'total_mensajes_enviados': self.total_mensajes_enviados,
            'total_mensajes_entregados': self.total_mensajes_entregados,
            'total_mensajes_leidos': self.total_mensajes_leidos,
            'notas': self.notas,
            'etiquetas': self.etiquetas,
            'origen': self.origen,
            'creado_en': self.creado_en.isoformat(),
            'actualizado_en': self.actualizado_en.isoformat(),
            'iniciales': self.iniciales,
            'tasa_entrega': self.tasa_entrega,
            'tasa_lectura': self.tasa_lectura
        }
    
    @classmethod
    def from_dict(cls, data):
        """Crea un contacto desde un diccionario"""
        try:
            contacto = cls(
                nombre=data['nombre'],
                telefono=data['telefono'],
                email=data.get('email'),
                empresa=data.get('empresa')
            )
            
            # Asignar valores existentes
            contacto.id = data['id']
            contacto.estado = data.get('estado', 'activo')
            contacto.total_mensajes_enviados = data.get('total_mensajes_enviados', 0)
            contacto.total_mensajes_entregados = data.get('total_mensajes_entregados', 0)
            contacto.total_mensajes_leidos = data.get('total_mensajes_leidos', 0)
            contacto.notas = data.get('notas')
            contacto.etiquetas = data.get('etiquetas', [])
            contacto.origen = data.get('origen', 'manual')
            
            # Fechas
            if data.get('ultimo_mensaje_fecha'):
                contacto.ultimo_mensaje_fecha = datetime.fromisoformat(data['ultimo_mensaje_fecha'])
            if 'creado_en' in data:
                contacto.creado_en = datetime.fromisoformat(data['creado_en'])
            if 'actualizado_en' in data:
                contacto.actualizado_en = datetime.fromisoformat(data['actualizado_en'])
            
            return contacto
        
        except (KeyError, ValueError, TypeError) as e:
            print(f"Error creando contacto desde diccionario (será eliminado): {e}")
            print(f"Datos problemáticos: {data}")
            return None
    
    def guardar(self):
        """Guarda el contacto en el sistema"""
        contactos = self.obtener_todos_dict()
        
        # Buscar si ya existe
        for i, contacto_data in enumerate(contactos):
            if contacto_data['id'] == self.id:
                contactos[i] = self.to_dict()
                break
        else:
            contactos.append(self.to_dict())
        
        return db.guardar_datos('contactos', contactos)
    
    def actualizar(self, **kwargs):
        """Actualiza los campos del contacto"""
        campos_permitidos = {'nombre', 'email', 'empresa', 'estado', 'notas', 'etiquetas'}
        
        for key, value in kwargs.items():
            if key in campos_permitidos and hasattr(self, key):
                if key == 'nombre' and value:
                    setattr(self, key, self._limpiar_texto(value))
                elif key == 'email':
                    setattr(self, key, self._validar_email(value))
                else:
                    setattr(self, key, value)
        
        self.actualizado_en = datetime.now()
        return self
    
    def actualizar_estadisticas_mensaje(self, entregado=False, leido=False):
        """Actualizar estadísticas de mensajes"""
        self.total_mensajes_enviados += 1
        self.ultimo_mensaje_fecha = datetime.now()
        self.actualizado_en = datetime.now()
        
        if entregado:
            self.total_mensajes_entregados += 1
        
        if leido:
            self.total_mensajes_leidos += 1
        
        return self.guardar()
    
    def cambiar_estado(self, nuevo_estado):
        """Cambiar estado del contacto"""
        estados_validos = {'activo', 'bloqueado', 'inactivo'}
        
        if nuevo_estado not in estados_validos:
            raise ValueError(f"Estado inválido. Debe ser uno de: {estados_validos}")
        
        self.estado = nuevo_estado
        self.actualizado_en = datetime.now()
        return self.guardar()
    
    def eliminar(self):
        """Eliminar contacto del sistema"""
        contactos = self.obtener_todos_dict()
        contactos_filtrados = [c for c in contactos if c['id'] != self.id]
        return db.guardar_datos('contactos', contactos_filtrados)
    
    # Métodos estáticos
    @staticmethod
    def obtener_todos_dict():
        """Obtiene todos los contactos como diccionarios"""
        return db.cargar_datos('contactos')
    
    @staticmethod
    def obtener_todos():
        """Obtiene todos los contactos como objetos Contacto válidos"""
        contactos_data = Contacto.obtener_todos_dict()
        contactos_validos = []
        contactos_invalidos = []
        
        for data in contactos_data:
            contacto = Contacto.from_dict(data)
            if contacto:
                contactos_validos.append(contacto)
            else:
                contactos_invalidos.append(data)
        
        # Si hay contactos inválidos, limpiar la base de datos
        if contactos_invalidos:
            print(f"Eliminando {len(contactos_invalidos)} contactos inválidos...")
            for invalid in contactos_invalidos:
                telefono_invalid = invalid.get('telefono', 'desconocido')
                nombre_invalid = invalid.get('nombre', 'desconocido')
                print(f"- Contacto inválido eliminado: {nombre_invalid} ({telefono_invalid})")
            
            # Guardar solo los contactos válidos
            contactos_validos_dict = [c.to_dict() for c in contactos_validos]
            db.guardar_datos('contactos', contactos_validos_dict)
        
        return contactos_validos
    
    @staticmethod
    def obtener_por_id(contacto_id):
        """Obtiene un contacto por ID"""
        contactos = Contacto.obtener_todos()
        
        for contacto in contactos:
            if contacto.id == contacto_id:
                return contacto
        
        return None
    
    @staticmethod
    def obtener_por_telefono(telefono):
        """Obtener contacto por número de teléfono"""
        try:
            # Limpiar teléfono para comparación
            telefono_limpio = Contacto._limpiar_telefono_estatico(telefono)
            contactos = Contacto.obtener_todos()
            
            for contacto in contactos:
                if contacto.telefono == telefono_limpio:
                    return contacto
            
            return None
        except ValueError:
            return None
    
    @staticmethod
    def _limpiar_telefono_estatico(telefono):
        """Versión estática de limpiar teléfono"""
        if not telefono:
            raise ValueError("El teléfono es requerido")
        
        telefono_limpio = ''.join(c for c in str(telefono) if c.isdigit() or c == '+')
        
        if not telefono_limpio.startswith('+'):
            telefono_limpio = '+593' + telefono_limpio
        
        # Validar formato específico: +593 seguido de 9 dígitos que empiecen con 9
        if not re.match(r'^\+5939\d{8}$', telefono_limpio):
            raise ValueError(f"Formato de teléfono inválido: {telefono_limpio}. Debe ser +593 seguido de 9 dígitos que empiecen con 9")
        
        return telefono_limpio
    
    @staticmethod
    def buscar(termino):
        """Buscar contactos por nombre, teléfono o email"""
        if not termino or not termino.strip():
            return []
        
        contactos = Contacto.obtener_todos()
        termino_lower = termino.lower().strip()
        resultados = []
        
        for contacto in contactos:
            if contacto.estado == 'inactivo':
                continue
            
            # Buscar en nombre, teléfono y email
            coincide = (
                (contacto.nombre and termino_lower in contacto.nombre.lower()) or
                (contacto.telefono and termino in contacto.telefono) or
                (contacto.email and termino_lower in contacto.email.lower())
            )
            
            if coincide:
                resultados.append(contacto)
        
        return resultados
    
    @staticmethod
    def obtener_por_estado(estado):
        """Obtener contactos por estado"""
        contactos = Contacto.obtener_todos()
        return [c for c in contactos if c.estado == estado]
    
    @staticmethod
    def obtener_activos():
        """Obtener contactos activos"""
        return Contacto.obtener_por_estado('activo')
    
    @staticmethod
    def estadisticas():
        """Obtener estadísticas generales de contactos"""
        contactos = Contacto.obtener_todos()  # Usa obtener_todos() que ya limpia los inválidos
        total = len(contactos)
        
        if total == 0:
            return {
                'total': 0,
                'activos': 0,
                'bloqueados': 0,
                'inactivos': 0,
                'nuevos_7_dias': 0,
                'tasa_activos': 0
            }
        
        activos = len([c for c in contactos if c.estado == 'activo'])
        bloqueados = len([c for c in contactos if c.estado == 'bloqueado'])
        inactivos = len([c for c in contactos if c.estado == 'inactivo'])
        
        # Nuevos en los últimos 7 días
        hace_7_dias = datetime.now() - timedelta(days=7)
        nuevos = len([c for c in contactos if c.creado_en >= hace_7_dias])
        
        return {
            'total': total,
            'activos': activos,
            'bloqueados': bloqueados,
            'inactivos': inactivos,
            'nuevos_7_dias': nuevos,
            'tasa_activos': round((activos / total * 100), 1) if total > 0 else 0
        }
    
    @staticmethod
    def crear(nombre, telefono, email=None, empresa=None, notas=None, origen='manual'):
        """Crear un nuevo contacto"""
        # Verificar si ya existe el teléfono
        if Contacto.obtener_por_telefono(telefono):
            raise ValueError(f"Ya existe un contacto con el teléfono {telefono}")
        
        contacto = Contacto(
            nombre=nombre,
            telefono=telefono,
            email=email,
            empresa=empresa
        )
        
        contacto.notas = notas
        contacto.origen = origen
        
        if contacto.guardar():
            return contacto
        else:
            raise Exception("Error guardando el contacto")
    
    @staticmethod
    def limpiar_contactos_invalidos():
        """Método para limpiar manualmente contactos inválidos"""
        contactos_data = Contacto.obtener_todos_dict()
        contactos_validos = []
        contactos_invalidos = []
        
        for data in contactos_data:
            try:
                # Intentar validar el teléfono
                telefono = data.get('telefono', '')
                if telefono:
                    Contacto._limpiar_telefono_estatico(telefono)
                    contactos_validos.append(data)
                else:
                    contactos_invalidos.append(data)
            except ValueError:
                contactos_invalidos.append(data)
        
        if contactos_invalidos:
            print(f"Encontrados {len(contactos_invalidos)} contactos inválidos:")
            for invalid in contactos_invalidos:
                print(f"- {invalid.get('nombre', 'Sin nombre')} ({invalid.get('telefono', 'Sin teléfono')})")
            
            # Guardar solo los válidos
            db.guardar_datos('contactos', contactos_validos)
            print(f"Contactos inválidos eliminados. Quedaron {len(contactos_validos)} contactos válidos.")
            
            return len(contactos_invalidos)
        else:
            print("No se encontraron contactos inválidos.")
            return 0


class ListaContactos:
    """Modelo para listas de contactos"""
    
    def __init__(self, nombre, descripcion=None):
        self.id = str(uuid.uuid4())
        self.nombre = nombre.strip() if nombre else ""
        self.descripcion = descripcion.strip() if descripcion else None
        self.contactos_ids = []
        self.creado_en = datetime.now()
        self.actualizado_en = datetime.now()
    
    def to_dict(self):
        """Convierte la lista a diccionario"""
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'contactos_ids': self.contactos_ids,
            'cantidad_contactos': len(self.contactos_ids),
            'creado_en': self.creado_en.isoformat(),
            'actualizado_en': self.actualizado_en.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data):
        """Crea una lista desde un diccionario"""
        try:
            lista = cls(nombre=data['nombre'], descripcion=data.get('descripcion'))
            lista.id = data['id']
            lista.contactos_ids = data.get('contactos_ids', [])
            
            if 'creado_en' in data:
                lista.creado_en = datetime.fromisoformat(data['creado_en'])
            if 'actualizado_en' in data:
                lista.actualizado_en = datetime.fromisoformat(data['actualizado_en'])
            
            return lista
        except (KeyError, ValueError, TypeError) as e:
            print(f"Error creando lista desde diccionario: {e}")
            return None
    
    def guardar(self):
        """Guarda la lista"""
        listas = self.obtener_todas_dict()
        
        # Buscar si ya existe
        for i, lista_data in enumerate(listas):
            if lista_data['id'] == self.id:
                listas[i] = self.to_dict()
                break
        else:
            listas.append(self.to_dict())
        
        return db.guardar_datos('listas_contactos', listas)
    
    @property
    def cantidad_contactos(self):
        """Obtener cantidad de contactos en la lista"""
        return len(self.contactos_ids)
    
    def agregar_contacto(self, contacto_id):
        """Agregar contacto a la lista"""
        if contacto_id not in self.contactos_ids:
            self.contactos_ids.append(contacto_id)
            self.actualizado_en = datetime.now()
            self.guardar()
    
    def remover_contacto(self, contacto_id):
        """Remover contacto de la lista"""
        if contacto_id in self.contactos_ids:
            self.contactos_ids.remove(contacto_id)
            self.actualizado_en = datetime.now()
            self.guardar()
    
    def obtener_contactos(self):
        """Obtener objetos de contactos de la lista"""
        contactos = []
        for contacto_id in self.contactos_ids:
            contacto = Contacto.obtener_por_id(contacto_id)
            if contacto and contacto.estado == 'activo':
                contactos.append(contacto)
        return contactos
    
    @staticmethod
    def obtener_todas_dict():
        """Obtiene todas las listas como diccionarios"""
        return db.cargar_datos('listas_contactos')
    
    @staticmethod
    def obtener_todas():
        """Obtiene todas las listas como objetos"""
        listas_data = ListaContactos.obtener_todas_dict()
        listas = []
        
        for data in listas_data:
            lista = ListaContactos.from_dict(data)
            if lista:
                listas.append(lista)
        
        return listas
    
    @staticmethod
    def obtener_por_id(lista_id):
        """Obtiene una lista por ID"""
        listas = ListaContactos.obtener_todas_dict()
        
        for lista_data in listas:
            if lista_data['id'] == lista_id:
                return ListaContactos.from_dict(lista_data)
        
        return None
    
    @staticmethod
    def crear(nombre, descripcion='', contactos_ids=None):
        """Crear una nueva lista"""
        if not nombre or not nombre.strip():
            raise ValueError("El nombre de la lista es requerido")
        
        lista = ListaContactos(nombre=nombre, descripcion=descripcion)
        if contactos_ids:
            lista.contactos_ids = contactos_ids
        
        if lista.guardar():
            return lista
        else:
            raise Exception("Error guardando la lista")