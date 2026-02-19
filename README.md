# 📲 WhatsApp Sender Flask

Aplicación en **Flask** para el envío automatizado de mensajes de WhatsApp, con soporte para manejo de datos en Excel y validación de números telefónicos.

---

## 🐍 Requisitos

- **Python 3.12** (obligatorio para evitar errores con `pandas` y librerías nativas)  
- **Windows 10/11**  
- **PowerShell** o terminal compatible  
- **Microsoft C++ Build Tools** (para compilar `pandas` y otras dependencias nativas)  
- **Google Chrome** instalado en el sistema

---

## ⚡ Instalación paso a paso (Windows)

### 1. Abrir PowerShell en la raíz del proyecto

```powershell
cd D:\Videos\python\whatsapp_sender_flask
```

### 2. Eliminar cualquier entorno virtual anterior (si existe)

```powershell
Remove-Item -Recurse -Force venv
```

### 3. Crear un nuevo entorno virtual usando Python 3.12

```powershell
py -3.12 -m venv venv
```

⚠️ **Nota**: cada vez que muevas el proyecto a otra carpeta, el entorno virtual antiguo no funcionará. Debes eliminarlo y crear uno nuevo.

### 4. Activar el entorno virtual

```powershell
# Si da error de política de ejecución:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Activar venv
.\venv\Scripts\Activate.ps1
```

### 5. Instalar las dependencias

```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

### 6. Verificar instalación de Google Chrome

La aplicación requiere **Google Chrome** instalado. Para verificar:

1. Abre Chrome y ve a: `chrome://version/`
2. Busca la línea **"Google Chrome"** y verifica la versión instalada

**Si NO tienes Chrome instalado:**
- 📥 **Descarga Chrome**: [https://www.google.com/chrome/](https://www.google.com/chrome/)

### 7. Configuración de ChromeDriver (si hay problemas)

La librería `webdriver-manager` descarga automáticamente el driver correcto. **Si aparece un error relacionado con ChromeDriver**, sigue estos pasos:

#### Opción A: Actualizar webdriver-manager

```powershell
pip install --upgrade webdriver-manager
```

#### Opción B: Descarga manual de ChromeDriver (recomendada)

1. **Descarga ChromeDriver** compatible con tu versión de Chrome:
   - 📥 **Descarga directa**: [https://googlechromelabs.github.io/chrome-for-testing/](https://googlechromelabs.github.io/chrome-for-testing/)
   - Enlace alternativo: [https://chromedriver.chromium.org/downloads](https://chromedriver.chromium.org/downloads)

2. **Extrae el archivo** `chromedriver.exe`

3. **Coloca el archivo en** `C:\chromedriver.exe` (directamente en C:\, no en una carpeta)

4. **Reinicia PowerShell** completamente y ejecuta nuevamente la aplicación

### 8. Configurar la variable de entorno para Flask

```powershell
$env:FLASK_APP="app.py"
```

### 9. Ejecutar la aplicación Flask

```powershell
flask run
```

La aplicación estará disponible en:  
👉 **http://127.0.0.1:5000**

---

## 📦 Dependencias del proyecto

```txt
# Flask y componentes core
Flask==3.0.0
Jinja2==3.1.2
Werkzeug==3.0.1
python-dotenv==1.0.0

# Manejo de datos y Excel
pandas==2.2.2
openpyxl==3.1.2

# WhatsApp y automatización web
selenium==4.15.2
webdriver-manager==4.0.1

# Utilidades
phonenumbers==8.13.26
requests==2.31.0

# Assets y compilación
Flask-Assets==2.1.0

# Adicionales recomendados para producción
gunicorn==21.2.0
python-dateutil==2.8.2
pytz==2024.1
```

---

## 🆘 Solución de errores comunes

- **`ModuleNotFoundError: No module named 'pandas'`**  
  Ejecuta: `pip install -r requirements.txt`

- **`SessionNotCreatedException` (Selenium)**  
  1. Actualiza Chrome  
  2. Ejecuta: `pip install --upgrade webdriver-manager`  
  3. Si persiste, descarga ChromeDriver manualmente

- **`ChromeDriver not found`**  
  Descarga manual y coloca en `C:\chromedriver.exe`

- **Error de política de ejecución PowerShell**  
  Ejecuta: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

- **`Microsoft Visual C++ 14.0 is required`**  
  Instala Microsoft C++ Build Tools desde: [https://visualstudio.microsoft.com/visual-cpp-build-tools/](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

---

## 📝 Notas importantes

- **Python 3.12 obligatorio**: versiones diferentes pueden causar errores al instalar `pandas`
- **Microsoft C++ Build Tools**: requerido para compilar librerías nativas como `pandas`
- **Entorno virtual (venv)**: aísla las librerías únicamente para este proyecto
- **Google Chrome**: debe estar instalado y actualizado
- **ChromeDriver**: se descarga automáticamente con `webdriver-manager`, pero si falla, usa la descarga manual
- **Para desactivar el entorno virtual**: ejecuta `deactivate` en PowerShell
- **Si mueves el proyecto a otra carpeta**: borra y recrea el venv completo

---

## 🔄 Comandos rápidos de referencia

```powershell
# Activar entorno virtual
.\venv\Scripts\Activate.ps1

# Desactivar entorno virtual
deactivate

# Instalar dependencias
pip install -r requirements.txt

# Actualizar pip
pip install --upgrade pip

# Ejecutar aplicación
flask run

# Recrear entorno virtual desde cero
Remove-Item -Recurse -Force venv
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 📧 Soporte

Si encuentras algún problema no listado aquí, verifica:
1. Que Python 3.12 esté instalado correctamente
2. Que Chrome esté actualizado a la última versión
3. Que todas las dependencias se hayan instalado sin errores
4. Los logs de error en la consola para más detalles