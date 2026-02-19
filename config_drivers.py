"""
Configuración de rutas para drivers (Selenium)
Soporta Chrome, Edge y Opera
Funciona tanto en desarrollo como en .exe
"""
import os
import sys

def get_drivers_path():
    """
    Obtener la ruta correcta de la carpeta drivers
    Funciona en desarrollo y en .exe
    """
    
    # Si está compilado como .exe
    if getattr(sys, 'frozen', False):
        # El .exe está en dist/
        base_path = os.path.dirname(sys.executable)
    else:
        # En desarrollo
        base_path = os.path.dirname(os.path.abspath(__file__))
    
    drivers_path = os.path.join(base_path, 'drivers')
    
    return drivers_path

def get_chromedriver_path():
    """Obtener ruta completa a chromedriver.exe"""
    drivers_path = get_drivers_path()
    chromedriver = os.path.join(drivers_path, 'chromedriver.exe')
    
    if not os.path.exists(chromedriver):
        raise FileNotFoundError(
            f"❌ chromedriver.exe no encontrado en: {chromedriver}\n"
            f"   Descárgalo desde: https://chromedriver.chromium.org/downloads"
        )
    
    return chromedriver

def get_edgedriver_path():
    """Obtener ruta a msedgedriver.exe"""
    drivers_path = get_drivers_path()
    edgedriver = os.path.join(drivers_path, 'msedgedriver.exe')
    
    if not os.path.exists(edgedriver):
        raise FileNotFoundError(
            f"❌ msedgedriver.exe no encontrado en: {edgedriver}\n"
            f"   Descárgalo desde: https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/"
        )
    
    return edgedriver

def get_operadriver_path():
    """Obtener ruta a operadriver.exe"""
    drivers_path = get_drivers_path()
    operadriver = os.path.join(drivers_path, 'operadriver.exe')
    
    if not os.path.exists(operadriver):
        raise FileNotFoundError(
            f"❌ operadriver.exe no encontrado en: {operadriver}\n"
            f"   Descárgalo desde: https://github.com/operadriver/operadriver/releases"
        )
    
    return operadriver

def get_available_drivers():
    """
    Obtener lista de drivers disponibles
    Retorna: {'chrome': True, 'edge': False, 'opera': False}
    """
    drivers_path = get_drivers_path()
    
    available = {
        'chrome': os.path.exists(os.path.join(drivers_path, 'chromedriver.exe')),
        'edge': os.path.exists(os.path.join(drivers_path, 'msedgedriver.exe')),
        'opera': os.path.exists(os.path.join(drivers_path, 'operadriver.exe'))
    }
    
    return available

def get_first_available_driver():
    """
    Obtener el primer driver disponible (orden: Chrome > Edge > Opera)
    Retorna tupla: (tipo, ruta) o (None, None) si no hay ninguno
    """
    drivers = get_available_drivers()
    
    if drivers['chrome']:
        return ('chrome', get_chromedriver_path())
    elif drivers['edge']:
        return ('edge', get_edgedriver_path())
    elif drivers['opera']:
        return ('opera', get_operadriver_path())
    else:
        raise FileNotFoundError(
            f"❌ No se encontró ningún driver disponible en: {get_drivers_path()}\n"
            f"   Descarga al menos uno de estos:\n"
            f"   - Chrome: https://chromedriver.chromium.org/\n"
            f"   - Edge: https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/\n"
            f"   - Opera: https://github.com/operadriver/operadriver/releases"
        )

def print_drivers_status():
    """Mostrar estado de los drivers disponibles"""
    print("\n" + "="*60)
    print("📊 ESTADO DE DRIVERS DISPONIBLES")
    print("="*60)
    
    available = get_available_drivers()
    drivers_path = get_drivers_path()
    
    print(f"\n📁 Ubicación: {drivers_path}\n")
    
    if available['chrome']:
        print("✅ Chrome: chromedriver.exe disponible")
    else:
        print("❌ Chrome: chromedriver.exe NO encontrado")
    
    if available['edge']:
        print("✅ Edge: msedgedriver.exe disponible")
    else:
        print("❌ Edge: msedgedriver.exe NO encontrado")
    
    if available['opera']:
        print("✅ Opera: operadriver.exe disponible")
    else:
        print("❌ Opera: operadriver.exe NO encontrado")
    
    print("\n" + "="*60 + "\n")
    
    if not any(available.values()):
        print("⚠️  Ningún driver disponible. Por favor descarga al menos uno.\n")
        return False
    
    return True

# Ejemplo de uso:
if __name__ == '__main__':
    print_drivers_status()
    
    try:
        tipo, ruta = get_first_available_driver()
        print(f"✅ Primer driver disponible: {tipo} -> {ruta}\n")
    except FileNotFoundError as e:
        print(f"Error: {e}\n")