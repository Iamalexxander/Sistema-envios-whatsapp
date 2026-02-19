"""
Convertir PNG a ICO para PyInstaller
"""
from PIL import Image
import os

def convertir_png_a_ico():
    """Convertir logo.png a logo.ico"""
    
    png_path = 'static/imagenes/logo.png'
    ico_path = 'static/imagenes/logo.ico'
    
    if not os.path.exists(png_path):
        print(f"❌ Error: {png_path} no encontrado")
        return False
    
    try:
        # Abrir la imagen PNG
        img = Image.open(png_path)
        
        # Convertir a RGBA si es necesario
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Redimensionar a 256x256 (tamaño estándar para ICO)
        img = img.resize((256, 256), Image.Resampling.LANCZOS)
        
        # Guardar como ICO
        img.save(ico_path, 'ICO')
        
        print(f"✅ Icono creado exitosamente: {ico_path}")
        print(f"📊 Tamaño: {os.path.getsize(ico_path) / 1024:.1f} KB")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == '__main__':
    print("🎨 Convertidor PNG a ICO")
    print("=" * 50)
    convertir_png_a_ico()