// vista_previa.js - Componente vista previa de plantillas
console.log('👁️ Cargando vista_previa.js...');

window.VistaPrevia = {
    inicializado: false,

    init() {
        if (this.inicializado) return;
        
        console.log('🚀 Inicializando Vista Previa...');
        
        this.actualizarHora();
        
        // Actualizar hora cada minuto
        setInterval(() => this.actualizarHora(), 60000);
        
        this.inicializado = true;
        console.log('✅ Vista Previa inicializada');
    },

    actualizar(contenido = '') {
        this.actualizarContenido(contenido);
        this.actualizarEstadisticas(contenido);
    },

    actualizarContenido(contenido) {
        const messageContent = document.getElementById('previewMessageContent');
        if (!messageContent) return;

        if (!contenido.trim()) {
            messageContent.textContent = 'Escribe un mensaje para ver la vista previa';
            messageContent.className = 'message-content placeholder';
            return;
        }

        // Reemplazar variables con valores de ejemplo
        const contenidoConVariables = window.reemplazarVariables(contenido);
        
        // Crear HTML con variables resaltadas
        const contenidoHTML = this.resaltarVariables(contenidoConVariables, contenido);
        
        messageContent.innerHTML = contenidoHTML;
        messageContent.className = 'message-content';
    },

    resaltarVariables(contenidoFinal, contenidoOriginal) {
        // Encontrar variables en el contenido original
        const variables = window.extraerVariables(contenidoOriginal);
        let resultado = contenidoFinal;

        // Mapeo de variables a valores
        const valoresVariables = {
            'NAME': 'María González',
            'PRODUCTO': 'Servicio Premium',
            'EMPRESA': 'WhatsApp Sender',
            'ENLACE': 'https://ejemplo.com',
            'PRECIO': '$99.99',
            'FECHA': new Date().toLocaleDateString('es-ES'),
            'HORA': new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            'TELEFONO': '+593 99 123 4567'
        };

        // Resaltar cada variable reemplazada
        variables.forEach(variable => {
            const valor = valoresVariables[variable];
            if (valor) {
                const regex = new RegExp(this.escapeRegExp(valor), 'g');
                resultado = resultado.replace(regex, `<span class="variable">${valor}</span>`);
            }
        });

        // Convertir saltos de línea a <br>
        resultado = resultado.replace(/\n/g, '<br>');

        return resultado;
    },

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    actualizarEstadisticas(contenido) {
        const charCount = contenido.length;
        const varCount = window.contarVariables(contenido);
        const msgCount = this.calcularNumeroMensajes(charCount);

        // Actualizar contadores
        const charCountEl = document.getElementById('previewCharCount');
        const varCountEl = document.getElementById('previewVarCount');
        const msgCountEl = document.getElementById('previewMsgCount');

        if (charCountEl) {
            charCountEl.textContent = charCount;
            
            // Aplicar colores según el límite
            if (charCount > 1600) {
                charCountEl.className = 'stat-value high';
            } else if (charCount > 320) {
                charCountEl.className = 'stat-value medium';
            } else {
                charCountEl.className = 'stat-value low';
            }
        }

        if (varCountEl) {
            varCountEl.textContent = varCount;
        }

        if (msgCountEl) {
            msgCountEl.textContent = msgCount;
            
            // Aplicar colores según número de mensajes
            if (msgCount > 3) {
                msgCountEl.className = 'stat-value high';
            } else if (msgCount > 1) {
                msgCountEl.className = 'stat-value medium';
            } else {
                msgCountEl.className = 'stat-value low';
            }
        }
    },

    calcularNumeroMensajes(charCount) {
        if (charCount === 0) return 1;
        
        // WhatsApp tiene límite de ~4096 caracteres por mensaje
        // pero para SMS tradicional son ~160
        // Usamos 160 como referencia
        return Math.ceil(charCount / 160);
    },

    actualizarHora() {
        const timeElement = document.getElementById('previewMessageTime');
        if (timeElement) {
            const now = new Date();
            const time = now.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            timeElement.textContent = time;
        }
    },

    simularAnimacionEscritura(contenido) {
        const messageContent = document.getElementById('previewMessageContent');
        if (!messageContent) return;

        let i = 0;
        const velocidad = 30; // ms por carácter
        
        messageContent.textContent = '';
        
        const escribir = () => {
            if (i < contenido.length) {
                messageContent.textContent += contenido.charAt(i);
                i++;
                setTimeout(escribir, velocidad);
            } else {
                // Después de terminar, actualizar con formato completo
                this.actualizarContenido(contenido);
            }
        };
        
        escribir();
    },

    // Método para previsualizar con datos específicos
    previsualizarConDatos(contenido, datos = {}) {
        let resultado = contenido;
        
        // Reemplazar variables con datos específicos si están disponibles
        const datosDefecto = {
            '_NAME_': datos.nombre || 'María González',
            '_PRODUCTO_': datos.producto || 'Servicio Premium',
            '_EMPRESA_': datos.empresa || 'WhatsApp Sender',
            '_ENLACE_': datos.enlace || 'https://ejemplo.com',
            '_PRECIO_': datos.precio || '$99.99',
            '_FECHA_': datos.fecha || new Date().toLocaleDateString('es-ES'),
            '_HORA_': datos.hora || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            '_TELEFONO_': datos.telefono || '+593 99 123 4567'
        };

        for (const [variable, valor] of Object.entries(datosDefecto)) {
            resultado = resultado.replace(new RegExp(variable, 'g'), valor);
        }

        this.actualizarContenido(resultado);
        return resultado;
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.VistaPrevia.init();
    }, 150);
});

console.log('✅ vista_previa.js cargado');