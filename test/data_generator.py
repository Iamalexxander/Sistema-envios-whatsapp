import json
import random
from faker import Faker

fake = Faker('es_ES')

def generar_contactos_prueba(cantidad=20):
    """Generar contactos de prueba con solo campos válidos"""
    contactos = []
    
    for i in range(cantidad):
        contacto = {
            "nombre": fake.name(),
            "telefono": f"+5939{random.randint(10000000, 99999999)}",
            "estado": random.choice(['activo', 'inactivo', 'bloqueado'])
        }
        contactos.append(contacto)
    
    return contactos

def generar_casos_prueba_validacion():
    """Generar casos de prueba para validación"""
    casos_validos = [
        {
            "nombre": "Juan Pérez",
            "telefono": "+593987654321"
        },
        {
            "nombre": "María García",
            "telefono": "+593912345678",
            "estado": "activo"
        },
        {
            "nombre": "Carlos López",
            "telefono": "+593923456789",
            "estado": "inactivo"
        }
    ]
    
    casos_invalidos = [
        {
            "descripcion": "Sin nombre",
            "data": {"telefono": "+593987654321"},
            "error_esperado": "nombre requerido"
        },
        {
            "descripcion": "Sin teléfono",
            "data": {"nombre": "Test User"},
            "error_esperado": "teléfono requerido"
        },
        {
            "descripcion": "Teléfono sin prefijo +5939",
            "data": {"nombre": "Test User", "telefono": "+593812345678"},
            "error_esperado": "formato inválido"
        },
        {
            "descripcion": "Teléfono muy corto",
            "data": {"nombre": "Test User", "telefono": "+5939123"},
            "error_esperado": "formato inválido"
        },
        {
            "descripcion": "Teléfono muy largo",
            "data": {"nombre": "Test User", "telefono": "+5939123456789"},
            "error_esperado": "formato inválido"
        },
        {
            "descripcion": "Estado inválido",
            "data": {"nombre": "Test User", "telefono": "+593987654321", "estado": "invalido"},
            "error_esperado": "estado inválido"
        },
        {
            "descripcion": "Campos no permitidos",
            "data": {
                "nombre": "Test User", 
                "telefono": "+593987654321",
                "email": "test@email.com",
                "empresa": "Test Corp",
                "notas": "Nota de prueba"
            },
            "error_esperado": "campos no permitidos"
        },
        {
            "descripcion": "Nombre vacío",
            "data": {"nombre": "", "telefono": "+593987654321"},
            "error_esperado": "nombre vacío"
        },
        {
            "descripcion": "Nombre muy corto",
            "data": {"nombre": "A", "telefono": "+593987654321"},
            "error_esperado": "nombre muy corto"
        },
        {
            "descripcion": "Nombre con números",
            "data": {"nombre": "Juan123", "telefono": "+593987654321"},
            "error_esperado": "nombre con caracteres inválidos"
        }
    ]
    
    return casos_validos, casos_invalidos

def generar_casos_telefono_especificos():
    """Casos específicos para validación de teléfonos"""
    casos_telefono = [
        # Válidos
        {"telefono": "+593987654321", "valido": True},
        {"telefono": "+593912345678", "valido": True},
        {"telefono": "+593923456789", "valido": True},
        {"telefono": "+593934567890", "valido": True},
        {"telefono": "+593945678901", "valido": True},
        {"telefono": "+593956789012", "valido": True},
        {"telefono": "+593967890123", "valido": True},
        {"telefono": "+593978901234", "valido": True},
        {"telefono": "+593989012345", "valido": True},
        {"telefono": "+593990123456", "valido": True},
        
        # Inválidos
        {"telefono": "+593812345678", "valido": False, "razon": "no empieza con 9"},
        {"telefono": "+593712345678", "valido": False, "razon": "no empieza con 9"},
        {"telefono": "+5949123456789", "valido": False, "razon": "país incorrecto"},
        {"telefono": "+593912345", "valido": False, "razon": "muy corto"},
        {"telefono": "+5939123456789", "valido": False, "razon": "muy largo"},
        {"telefono": "987654321", "valido": False, "razon": "sin prefijo"},
        {"telefono": "+593 987654321", "valido": False, "razon": "con espacios"},
        {"telefono": "+593-987654321", "valido": False, "razon": "con guiones"},
        {"telefono": "+593(9)87654321", "valido": False, "razon": "con paréntesis"},
        {"telefono": "+593987abc321", "valido": False, "razon": "con letras"}
    ]
    
    return casos_telefono

if __name__ == "__main__":
    # Crear directorio de tests si no existe
    import os
    if not os.path.exists('tests'):
        os.makedirs('tests')
    
    # Generar archivos de datos de prueba
    contactos = generar_contactos_prueba(50)
    
    with open('tests/contactos_prueba.json', 'w', encoding='utf-8') as f:
        json.dump(contactos, f, indent=2, ensure_ascii=False)
    
    validos, invalidos = generar_casos_prueba_validacion()
    
    with open('tests/casos_validacion.json', 'w', encoding='utf-8') as f:
        json.dump({
            'casos_validos': validos,
            'casos_invalidos': invalidos
        }, f, indent=2, ensure_ascii=False)
    
    casos_telefono = generar_casos_telefono_especificos()
    
    with open('tests/casos_telefono.json', 'w', encoding='utf-8') as f:
        json.dump(casos_telefono, f, indent=2, ensure_ascii=False)
    
    print("Archivos de datos de prueba generados:")
    print("- tests/contactos_prueba.json")
    print("- tests/casos_validacion.json")
    print("- tests/casos_telefono.json")