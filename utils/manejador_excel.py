import pandas as pd
import re
from models.contacto import Contacto

def validar_telefono(telefono):
    """Valida formato de teléfono ecuatoriano - ESTRICTO"""
    if not telefono:
        return False
    
    # Limpiar espacios y caracteres especiales excepto +
    telefono_limpio = re.sub(r'[^\d+]', '', str(telefono))
    
    # Validar formato ESTRICTO: +593 seguido de 9 dígitos que empiecen con 9
    patron = r'^\+5939\d{8}$'
    resultado = bool(re.match(patron, telefono_limpio))
    
    # Debug para teléfonos inválidos
    if not resultado:
        print(f"Teléfono inválido detectado: '{telefono}' -> '{telefono_limpio}'")
        if telefono_limpio.startswith('+5938'):
            print(f"   ERROR: Empieza con +5938 (debe ser +5939)")
        elif not telefono_limpio.startswith('+593'):
            print(f"   ERROR: No empieza con +593")
        elif len(telefono_limpio) != 13:
            print(f"   ERROR: Longitud incorrecta {len(telefono_limpio)} (debe ser 13)")
    
    return resultado

def limpiar_telefono(telefono):
    """Limpia y formatea el teléfono"""
    if not telefono:
        return None
    
    # Convertir notación científica si existe
    telefono_str = str(telefono)
    if 'E+' in telefono_str.upper() or 'e+' in telefono_str:
        try:
            # Convertir notación científica a número entero
            telefono_num = int(float(telefono_str))
            telefono_str = str(telefono_num)
        except:
            return None
    
    # Remover espacios y caracteres especiales excepto +
    telefono_limpio = re.sub(r'[^\d+]', '', telefono_str)
    
    # Si no tiene +593, intentar agregarlo
    if telefono_limpio.startswith('593') and len(telefono_limpio) == 12:
        telefono_limpio = '+' + telefono_limpio
    elif telefono_limpio.startswith('0') and len(telefono_limpio) == 10:
        # Formato 09XXXXXXXX -> +593XXXXXXXXX
        telefono_limpio = '+593' + telefono_limpio[1:]
    elif len(telefono_limpio) == 9 and telefono_limpio.startswith('9'):
        # Formato 9XXXXXXXX -> +5939XXXXXXXX
        telefono_limpio = '+593' + telefono_limpio
    elif len(telefono_limpio) == 12 and telefono_limpio.startswith('593'):
        # Formato 5939XXXXXXXX -> +5939XXXXXXXX
        telefono_limpio = '+' + telefono_limpio
    
    return telefono_limpio if validar_telefono(telefono_limpio) else None

def buscar_columnas_nombres(df):
    """Busca y combina columnas de nombres y apellidos"""
    columnas_df = [col.strip() for col in df.columns]
    
    # Buscar columnas de nombre
    col_nombre = None
    col_apellido = None
    
    # Patrones para nombre
    patrones_nombre = ['nombre', 'nombres', 'name', 'contacto', 'first_name']
    # Patrones para apellido
    patrones_apellido = ['apellido', 'apellidos', 'lastname', 'last_name', 'surname']
    
    # Buscar nombre
    for col in columnas_df:
        col_lower = col.lower()
        if any(patron in col_lower for patron in patrones_nombre):
            col_nombre = col
            break
    
    # Buscar apellido
    for col in columnas_df:
        col_lower = col.lower()
        if any(patron in col_lower for patron in patrones_apellido):
            col_apellido = col
            break
    
    # Si encontramos ambas columnas, crear una columna combinada
    if col_nombre and col_apellido:
        print(f"Combinando columnas: '{col_nombre}' + '{col_apellido}'")
        
        # Crear nueva columna combinada
        def combinar_nombres(row):
            nombre = str(row[col_nombre]).strip() if pd.notna(row[col_nombre]) else ''
            apellido = str(row[col_apellido]).strip() if pd.notna(row[col_apellido]) else ''
            
            # Combinar nombres
            nombre_completo = f"{nombre} {apellido}".strip()
            return nombre_completo if nombre_completo else None
        
        df['Nombre_Completo'] = df.apply(combinar_nombres, axis=1)
        return 'Nombre_Completo'
    
    # Si solo encontramos una columna de nombre, usarla
    if col_nombre:
        return col_nombre
    
    # Buscar columna general de nombre
    for col in columnas_df:
        if col.lower() in ['nombre', 'name', 'nombres', 'contacto']:
            return col
    
    return None

def buscar_columna_telefono(columnas_df):
    """Busca columna de teléfono con múltiples variantes"""
    patrones_telefono = [
        'telefono', 'teléfono', 'phone', 'numero', 'número', 
        'celular', 'telefonos', 'teléfonos', 'celulares',
        'movil', 'móvil', 'whatsapp', 'tel', 'cell'
    ]
    
    for col in columnas_df:
        col_lower = col.lower()
        if any(patron in col_lower for patron in patrones_telefono):
            return col
    
    return None

def procesar_archivo_contactos(archivo):
    """
    Procesa archivo Excel/CSV y retorna estadísticas de importación + contactos
    """
    try:
        # Leer archivo según extensión
        if archivo.filename.lower().endswith('.csv'):
            df = pd.read_csv(archivo)
        else:
            df = pd.read_excel(archivo)
        
        # Validar que el DataFrame no esté vacío
        if df.empty:
            raise ValueError("El archivo está vacío")
        
        # Limpiar nombres de columnas (quitar espacios)
        df.columns = df.columns.str.strip()
        columnas_df = [col.strip() for col in df.columns]
        
        print(f"Columnas encontradas: {columnas_df}")
        
        # Buscar columna de nombre (puede combinar nombre + apellido)
        col_nombre = buscar_columnas_nombres(df)
        
        # Buscar columna de teléfono
        col_telefono = buscar_columna_telefono(columnas_df)
        
        print(f"Columna nombre detectada: {col_nombre}")
        print(f"Columna teléfono detectada: {col_telefono}")
        
        if not col_nombre:
            raise ValueError("Columna de NOMBRE no encontrada. Nombres válidos: 'Nombre', 'Nombres', 'Name', 'Contacto'")
        
        if not col_telefono:
            raise ValueError("Columna de TELÉFONO no encontrada. Nombres válidos: 'Telefono', 'Teléfono', 'Phone', 'Numero', 'Celular', etc.")
        
        # Buscar columna Estado
        col_estado = None
        for col in columnas_df:
            if col.lower() in ['estado', 'status', 'situacion', 'situación']:
                col_estado = col
                break
        
        # Estadísticas
        estadisticas = {
            'total_filas': len(df),
            'procesados': 0,
            'errores': 0,
            'duplicados': 0,
            'telefonos_invalidos': 0,
            'nombres_repetidos': 0,
            'detalles_errores': []
        }
        
        contactos_procesados = []
        telefonos_vistos = set()
        nombres_vistos = set()
        
        # Obtener todos los contactos existentes
        contactos_existentes = Contacto.obtener_todos()
        telefonos_existentes = {c.telefono for c in contactos_existentes}
        nombres_existentes = {c.nombre.lower() for c in contactos_existentes}
        
        print(f"Procesando {len(df)} filas...")
        
        for index, fila in df.iterrows():
            try:
                # Extraer datos básicos
                nombre = str(fila[col_nombre]).strip() if pd.notna(fila[col_nombre]) else ''
                telefono_raw = fila[col_telefono] if pd.notna(fila[col_telefono]) else ''
                
                print(f"  Fila {index + 2}: Nombre='{nombre}', Teléfono='{telefono_raw}'")
                
                # Validar nombre
                if not nombre or nombre.lower() in ['nan', 'null', ''] or len(nombre.strip()) == 0:
                    estadisticas['errores'] += 1
                    error_msg = f"Fila {index + 2}: Nombre vacío o inválido - RECHAZADO"
                    estadisticas['detalles_errores'].append(error_msg)
                    print(f"    {error_msg}")
                    continue
                
                # Verificar nombre duplicado
                nombre_lower = nombre.lower()
                if nombre_lower in nombres_existentes or nombre_lower in nombres_vistos:
                    estadisticas['nombres_repetidos'] += 1
                    error_msg = f"Fila {index + 2}: Nombre '{nombre}' ya existe - RECHAZADO"
                    estadisticas['detalles_errores'].append(error_msg)
                    print(f"    {error_msg}")
                    continue
                
                # Validar y limpiar teléfono
                telefono = limpiar_telefono(telefono_raw)
                if not telefono:
                    estadisticas['telefonos_invalidos'] += 1
                    # Detectar específicamente +5938
                    telefono_str = str(telefono_raw)
                    if '+5938' in telefono_str:
                        error_msg = f"Fila {index + 2}: Teléfono '{telefono_raw}' INVÁLIDO - NO puede empezar con +5938, debe ser +5939XXXXXXXX - RECHAZADO"
                    else:
                        error_msg = f"Fila {index + 2}: Teléfono '{telefono_raw}' INVÁLIDO - debe ser +593 seguido de 9 dígitos que empiecen con 9 - RECHAZADO"
                    estadisticas['detalles_errores'].append(error_msg)
                    print(f"    {error_msg}")
                    continue
                
                # Verificar teléfono duplicado
                if telefono in telefonos_existentes or telefono in telefonos_vistos:
                    estadisticas['duplicados'] += 1
                    error_msg = f"Fila {index + 2}: Teléfono {telefono} ya existe - RECHAZADO"
                    estadisticas['detalles_errores'].append(error_msg)
                    print(f"    {error_msg}")
                    continue
                
                # Estado (por defecto activo)
                estado = 'activo'
                if col_estado and pd.notna(fila[col_estado]):
                    estado_raw = str(fila[col_estado]).strip().lower()
                    if estado_raw in ['activo', 'inactivo', 'bloqueado']:
                        estado = estado_raw
                
                # Crear contacto
                contacto = Contacto.crear(
                    nombre=nombre,
                    telefono=telefono,
                    origen='excel'
                )
                
                # Actualizar estado si es diferente de activo
                if estado != 'activo':
                    contacto.estado = estado
                    contacto.guardar()
                
                contactos_procesados.append(contacto)
                estadisticas['procesados'] += 1
                
                # Agregar a conjuntos para evitar duplicados en el mismo archivo
                telefonos_vistos.add(telefono)
                nombres_vistos.add(nombre_lower)
                
                print(f"    Contacto creado: {nombre} - {telefono}")
                
            except Exception as e:
                estadisticas['errores'] += 1
                error_msg = f"Fila {index + 2}: Error inesperado - {str(e)} - RECHAZADO"
                estadisticas['detalles_errores'].append(error_msg)
                print(f"    {error_msg}")
                continue
        
        # Limitar errores mostrados
        if len(estadisticas['detalles_errores']) > 25:
            extra = len(estadisticas['detalles_errores']) - 25
            estadisticas['detalles_errores'] = estadisticas['detalles_errores'][:25]
            estadisticas['detalles_errores'].append(f"... y {extra} errores más")
        
        # Devolver también los contactos en formato dict
        contactos_dicts = [c.to_dict() for c in contactos_procesados]
        estadisticas["contactos"] = contactos_dicts
        
        print(f"RESUMEN: {estadisticas['procesados']} procesados, {estadisticas['errores']} errores")
        
        return estadisticas
        
    except Exception as e:
        raise ValueError(f"Error procesando archivo: {str(e)}")