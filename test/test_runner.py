import requests
import json
import time
import random
from datetime import datetime

class ContactosTestRunner:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.created_contacts = []
        self.test_results = []
        
    def log(self, test_name, status, details=""):
        """Log de resultados de pruebas"""
        result = {
            'timestamp': datetime.now().isoformat(),
            'test': test_name,
            'status': status,
            'details': details
        }
        self.test_results.append(result)
        status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_icon} [{status}] {test_name}: {details}")
    
    def test_crear_contacto_exitoso(self):
        """Test: Crear contacto válido con campos permitidos"""
        data = {
            "nombre": f"Test User {random.randint(1000, 9999)}",
            "telefono": f"+5939{random.randint(10000000, 99999999)}",
            "estado": "activo"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/contactos/api", json=data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.created_contacts.append(result['data']['id'])
                    self.log("crear_contacto_exitoso", "PASS", f"Contacto creado: {data['nombre']}")
                    return True
                else:
                    self.log("crear_contacto_exitoso", "FAIL", f"Error en respuesta: {result.get('message')}")
            else:
                self.log("crear_contacto_exitoso", "FAIL", f"Status code: {response.status_code}")
                
        except Exception as e:
            self.log("crear_contacto_exitoso", "ERROR", str(e))
        
        return False
    
    def test_crear_contacto_sin_nombre(self):
        """Test: Crear contacto sin nombre (debe fallar)"""
        data = {
            "telefono": f"+5939{random.randint(10000000, 99999999)}"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/contactos/api", json=data)
            
            if response.status_code == 400:
                self.log("crear_contacto_sin_nombre", "PASS", "Error 400 como esperado")
                return True
            else:
                self.log("crear_contacto_sin_nombre", "FAIL", f"Status code inesperado: {response.status_code}")
                
        except Exception as e:
            self.log("crear_contacto_sin_nombre", "ERROR", str(e))
        
        return False
    
    def test_crear_contacto_sin_telefono(self):
        """Test: Crear contacto sin teléfono (debe fallar)"""
        data = {
            "nombre": "Test User Sin Telefono"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/contactos/api", json=data)
            
            if response.status_code == 400:
                self.log("crear_contacto_sin_telefono", "PASS", "Error 400 como esperado")
                return True
            else:
                self.log("crear_contacto_sin_telefono", "FAIL", f"Status code: {response.status_code}")
                
        except Exception as e:
            self.log("crear_contacto_sin_telefono", "ERROR", str(e))
        
        return False
    
    def test_crear_contacto_telefono_invalido(self):
        """Test: Crear contacto con teléfono inválido"""
        casos_invalidos = [
            "+593812345678",  # No empieza con 9
            "+5949123456789", # País incorrecto  
            "+593912345",     # Muy corto
            "+5939123456789", # Muy largo
            "987654321",      # Sin prefijo
            "+593 987654321"  # Con espacios
        ]
        
        for telefono in casos_invalidos:
            data = {
                "nombre": "Test User",
                "telefono": telefono
            }
            
            try:
                response = self.session.post(f"{self.base_url}/contactos/api", json=data)
                
                if response.status_code == 400:
                    self.log("crear_contacto_telefono_invalido", "PASS", f"Rechazado correctamente: {telefono}")
                else:
                    self.log("crear_contacto_telefono_invalido", "FAIL", f"Aceptó teléfono inválido: {telefono}")
                    return False
                    
            except Exception as e:
                self.log("crear_contacto_telefono_invalido", "ERROR", f"Error con {telefono}: {str(e)}")
                return False
        
        return True
    
    def test_crear_contacto_campos_no_permitidos(self):
        """Test: Crear contacto con campos no permitidos (debe fallar)"""
        data = {
            "nombre": "Test User",
            "telefono": f"+5939{random.randint(10000000, 99999999)}",
            "email": "test@email.com",  # Campo no permitido
            "empresa": "Test Corp",     # Campo no permitido
            "notas": "Test notes"       # Campo no permitido
        }
        
        try:
            response = self.session.post(f"{self.base_url}/contactos/api", json=data)
            
            if response.status_code == 400:
                self.log("crear_contacto_campos_no_permitidos", "PASS", "Rechazó campos no permitidos")
                return True
            else:
                self.log("crear_contacto_campos_no_permitidos", "FAIL", f"Aceptó campos no permitidos: {response.status_code}")
                
        except Exception as e:
            self.log("crear_contacto_campos_no_permitidos", "ERROR", str(e))
        
        return False
    
    def test_crear_contacto_estado_invalido(self):
        """Test: Crear contacto con estado inválido"""
        data = {
            "nombre": "Test User",
            "telefono": f"+5939{random.randint(10000000, 99999999)}",
            "estado": "estado_invalido"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/contactos/api", json=data)
            
            if response.status_code == 400:
                self.log("crear_contacto_estado_invalido", "PASS", "Rechazó estado inválido")
                return True
            else:
                self.log("crear_contacto_estado_invalido", "FAIL", f"Aceptó estado inválido: {response.status_code}")
                
        except Exception as e:
            self.log("crear_contacto_estado_invalido", "ERROR", str(e))
        
        return False
    
    def test_crear_contacto_nombre_invalido(self):
        """Test: Crear contacto con nombre inválido"""
        casos_invalidos = [
            "",               # Nombre vacío
            "A",             # Muy corto
            "Juan123",       # Con números
            "Test@User",     # Con símbolos
            "   ",           # Solo espacios
        ]
        
        for nombre in casos_invalidos:
            data = {
                "nombre": nombre,
                "telefono": f"+5939{random.randint(10000000, 99999999)}"
            }
            
            try:
                response = self.session.post(f"{self.base_url}/contactos/api", json=data)
                
                if response.status_code == 400:
                    self.log("crear_contacto_nombre_invalido", "PASS", f"Rechazó nombre inválido: '{nombre}'")
                else:
                    self.log("crear_contacto_nombre_invalido", "FAIL", f"Aceptó nombre inválido: '{nombre}'")
                    return False
                    
            except Exception as e:
                self.log("crear_contacto_nombre_invalido", "ERROR", f"Error con nombre '{nombre}': {str(e)}")
                return False
        
        return True
    
    def test_obtener_contactos(self):
        """Test: Obtener lista de contactos"""
        try:
            response = self.session.get(f"{self.base_url}/contactos/api")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    contactos = result.get('data', [])
                    self.log("obtener_contactos", "PASS", f"Obtenidos {len(contactos)} contactos")
                    return True
                else:
                    self.log("obtener_contactos", "FAIL", "success = false en respuesta")
            else:
                self.log("obtener_contactos", "FAIL", f"Status code: {response.status_code}")
                
        except Exception as e:
            self.log("obtener_contactos", "ERROR", str(e))
        
        return False
    
    def test_actualizar_contacto(self):
        """Test: Actualizar contacto existente"""
        if not self.created_contacts:
            self.log("actualizar_contacto", "SKIP", "No hay contactos creados para actualizar")
            return False
            
        contacto_id = self.created_contacts[0]
        data = {
            "nombre": "Nombre Actualizado",
            "telefono": f"+5939{random.randint(10000000, 99999999)}",
            "estado": "inactivo"
        }
        
        try:
            response = self.session.put(f"{self.base_url}/contactos/api/{contacto_id}", json=data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.log("actualizar_contacto", "PASS", "Contacto actualizado correctamente")
                    return True
                else:
                    self.log("actualizar_contacto", "FAIL", f"Error: {result.get('message')}")
            else:
                self.log("actualizar_contacto", "FAIL", f"Status code: {response.status_code}")
                
        except Exception as e:
            self.log("actualizar_contacto", "ERROR", str(e))
        
        return False
    
    def test_eliminar_contacto(self):
        """Test: Eliminar contacto"""
        if not self.created_contacts:
            self.log("eliminar_contacto", "SKIP", "No hay contactos para eliminar")
            return False
            
        contacto_id = self.created_contacts.pop()
        
        try:
            response = self.session.delete(f"{self.base_url}/contactos/api/{contacto_id}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.log("eliminar_contacto", "PASS", "Contacto eliminado correctamente")
                    return True
                else:
                    self.log("eliminar_contacto", "FAIL", f"Error: {result.get('message')}")
            else:
                self.log("eliminar_contacto", "FAIL", f"Status code: {response.status_code}")
                
        except Exception as e:
            self.log("eliminar_contacto", "ERROR", str(e))
        
        return False
    
    def test_buscar_contactos(self):
        """Test: Buscar contactos"""
        try:
            response = self.session.get(f"{self.base_url}/contactos/api/buscar?q=Test")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    resultados = result.get('data', [])
                    self.log("buscar_contactos", "PASS", f"Búsqueda retornó {len(resultados)} resultados")
                    return True
                else:
                    self.log("buscar_contactos", "FAIL", "success = false en respuesta")
            else:
                self.log("buscar_contactos", "FAIL", f"Status code: {response.status_code}")
                
        except Exception as e:
            self.log("buscar_contactos", "ERROR", str(e))
        
        return False
    
    def test_estadisticas(self):
        """Test: Obtener estadísticas"""
        try:
            response = self.session.get(f"{self.base_url}/contactos/api/estadisticas")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    stats = result.get('data', {})
                    self.log("estadisticas", "PASS", f"Total: {stats.get('total', 0)}, Activos: {stats.get('activos', 0)}")
                    return True
                else:
                    self.log("estadisticas", "FAIL", "success = false en respuesta")
            else:
                self.log("estadisticas", "FAIL", f"Status code: {response.status_code}")
                
        except Exception as e:
            self.log("estadisticas", "ERROR", str(e))
        
        return False
    
    def test_crear_contacto_duplicado(self):
        """Test: Crear contacto con teléfono duplicado"""
        if not self.created_contacts:
            # Crear un contacto primero
            if not self.test_crear_contacto_exitoso():
                self.log("crear_contacto_duplicado", "SKIP", "No se pudo crear contacto inicial")
                return False
        
        # Obtener el teléfono del primer contacto
        try:
            contacto_id = self.created_contacts[0]
            response = self.session.get(f"{self.base_url}/contactos/api/{contacto_id}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    telefono_existente = result['data']['telefono']
                    
                    # Intentar crear con el mismo teléfono
                    data_duplicado = {
                        "nombre": "Usuario Duplicado",
                        "telefono": telefono_existente
                    }
                    
                    response_dup = self.session.post(f"{self.base_url}/contactos/api", json=data_duplicado)
                    
                    if response_dup.status_code == 400:
                        self.log("crear_contacto_duplicado", "PASS", "Rechazó teléfono duplicado")
                        return True
                    else:
                        self.log("crear_contacto_duplicado", "FAIL", f"Permitió teléfono duplicado: {response_dup.status_code}")
                        return False
                        
        except Exception as e:
            self.log("crear_contacto_duplicado", "ERROR", str(e))
        
        return False
    
    def cleanup_created_contacts(self):
        """Limpiar contactos creados durante las pruebas"""
        print(f"\n🧹 Limpiando {len(self.created_contacts)} contactos de prueba...")
        
        for contacto_id in self.created_contacts:
            try:
                response = self.session.delete(f"{self.base_url}/contactos/api/{contacto_id}")
                if response.status_code == 200:
                    print(f"   ✅ Eliminado contacto {contacto_id}")
                else:
                    print(f"   ⚠️ No se pudo eliminar contacto {contacto_id}")
            except Exception as e:
                print(f"   ❌ Error eliminando contacto {contacto_id}: {str(e)}")
        
        self.created_contacts.clear()
    
    def run_all_tests(self):
        """Ejecutar todas las pruebas"""
        print("=" * 60)
        print("🧪 INICIANDO PRUEBAS DE CONTACTOS API")
        print("=" * 60)
        print()
        
        tests = [
            ("Obtener contactos", self.test_obtener_contactos),
            ("Estadísticas", self.test_estadisticas),
            ("Crear contacto exitoso", self.test_crear_contacto_exitoso),
            ("Crear segundo contacto", self.test_crear_contacto_exitoso),
            ("Crear sin nombre", self.test_crear_contacto_sin_nombre),
            ("Crear sin teléfono", self.test_crear_contacto_sin_telefono),
            ("Teléfonos inválidos", self.test_crear_contacto_telefono_invalido),
            ("Nombres inválidos", self.test_crear_contacto_nombre_invalido),
            ("Campos no permitidos", self.test_crear_contacto_campos_no_permitidos),
            ("Estado inválido", self.test_crear_contacto_estado_invalido),
            ("Teléfono duplicado", self.test_crear_contacto_duplicado),
            ("Buscar contactos", self.test_buscar_contactos),
            ("Actualizar contacto", self.test_actualizar_contacto),
            ("Eliminar contacto", self.test_eliminar_contacto),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"🔍 Ejecutando: {test_name}")
            try:
                if test_func():
                    passed += 1
            except Exception as e:
                self.log(test_name, "ERROR", f"Excepción no capturada: {str(e)}")
            
            time.sleep(0.3)  # Pausa entre pruebas
            print()
        
        print("=" * 60)
        print("📊 RESUMEN DE RESULTADOS")
        print("=" * 60)
        print(f"Pruebas ejecutadas: {total}")
        print(f"Pruebas exitosas: {passed}")
        print(f"Pruebas fallidas: {total - passed}")
        print(f"Tasa de éxito: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("🎉 ¡TODAS LAS PRUEBAS PASARON!")
        else:
            print(f"⚠️ {total - passed} pruebas fallaron")
        
        # Limpiar contactos de prueba
        self.cleanup_created_contacts()
        
        # Guardar log detallado
        try:
            import os
            if not os.path.exists('tests'):
                os.makedirs('tests')
                
            with open('tests/test_results.json', 'w', encoding='utf-8') as f:
                json.dump({
                    'summary': {
                        'total': total,
                        'passed': passed,
                        'failed': total - passed,
                        'success_rate': f"{(passed/total)*100:.1f}%",
                        'timestamp': datetime.now().isoformat()
                    },
                    'results': self.test_results
                }, f, indent=2, ensure_ascii=False)
            
            print(f"\n📝 Log detallado guardado en: tests/test_results.json")
            
        except Exception as e:
            print(f"⚠️ No se pudo guardar el log: {str(e)}")
        
        return passed == total

if __name__ == "__main__":
    print("🚀 Iniciando Test Runner para Contactos API\n")
    
    runner = ContactosTestRunner()
    success = runner.run_all_tests()
    
    print(f"\n{'🎯 Proceso completado exitosamente' if success else '💥 Proceso completado con errores'}")
    exit(0 if success else 1)