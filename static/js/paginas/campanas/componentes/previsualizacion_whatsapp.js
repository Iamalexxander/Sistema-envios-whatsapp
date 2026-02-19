// previsualizacion_whatsapp.js - Componente para previsualización de WhatsApp
console.log('📱 Cargando previsualizacion_whatsapp.js...');

window.PrevisualizacionWhatsApp = {
    inicializado: false,
    
    init() {
        if (this.inicializado) return;
        
        console.log('🔧 Configurando componente PrevisualizacionWhatsApp...');
        
        this.configurarEventos();
        this.inicializado = true;
        
        console.log('✅ PrevisualizacionWhatsApp inicializado');
    },
    
    configurarEventos() {
        // Escuchar cambios en el textarea del mensaje
        const mensajeTextarea = document.getElementById('mensaje-textarea');
        if (mensajeTextarea) {
            mensajeTextarea.addEventListener('input', () => {
                this.actualizarTextoPreview();
            });
        }
        
        // Configurar inicialmente
        this.actualizarTextoPreview();
    },
    
    actualizarTextoPreview() {
        const mensajeTextarea = document.getElementById('mensaje-textarea');
        const previewText = document.getElementById('preview-text');
        
        if (!mensajeTextarea || !previewText) return;
        
        const texto = mensajeTextarea.value.trim();
        
        if (texto) {
            previewText.textContent = texto;
            previewText.style.color = '#303030';
        } else {
            previewText.textContent = 'Selecciona una plantilla o escribe tu mensaje...';
            previewText.style.color = '#999';
            previewText.style.fontStyle = 'italic';
        }
    },
    
    mostrarArchivoEnPreview(archivo, tipo) {
        const previewAttachment = document.getElementById('preview-attachment');
        
        if (!previewAttachment) return;
        
        // Limpiar contenido anterior
        previewAttachment.innerHTML = '';
        previewAttachment.style.display = 'block';
        
        if (tipo === 'imagen') {
            this.mostrarImagenPreview(archivo, previewAttachment);
        } else {
            this.mostrarArchivoGenericoPreview(archivo, tipo, previewAttachment);
        }
        
        console.log('📁 Archivo mostrado en preview:', archivo.name);
    },
    
    mostrarImagenPreview(archivo, contenedor) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = archivo.name;
            contenedor.appendChild(img);
        };
        
        reader.readAsDataURL(archivo);
    },
    
    mostrarArchivoGenericoPreview(archivo, tipo, contenedor) {
        const filePreview = document.createElement('div');
        filePreview.className = 'file-preview';
        
        // Icono según tipo
        let iconClass = 'fas fa-file';
        let iconClassExtra = '';
        
        switch(tipo) {
            case 'video':
                iconClass = 'fas fa-play-circle';
                iconClassExtra = 'video';
                break;
            case 'documento':
                iconClass = 'fas fa-file-alt';
                iconClassExtra = 'document';
                break;
        }
        
        filePreview.innerHTML = `
            <div class="file-icon ${iconClassExtra}">
                <i class="${iconClass}"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${archivo.name}</div>
                <div class="file-size">${this.formatearTamano(archivo.size)}</div>
            </div>
        `;
        
        contenedor.appendChild(filePreview);
    },
    
    ocultarArchivoEnPreview() {
        const previewAttachment = document.getElementById('preview-attachment');
        
        if (previewAttachment) {
            previewAttachment.style.display = 'none';
            previewAttachment.innerHTML = '';
        }
        
        console.log('📁 Archivo ocultado del preview');
    },
    
    formatearTamano(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const tamaños = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + tamaños[i];
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.PrevisualizacionWhatsApp.init();
    }, 50);
});

console.log('previsualizacion_whatsapp.js cargado');