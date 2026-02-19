(function() {
    'use strict';
    
    console.log('📌 Inicializando indicador de estado WhatsApp...');
    
    // Estado global
    window.WhatsAppStatus = {
        conectado: false,
        intervalo: null,
        inicializado: false,
        callbacks: [],
        alertaActiva: null
    };
    
    /**
     * Mostrar alerta de WhatsApp desconectado
     */
    window.mostrarAlertaWhatsApp = function(config = {}) {
        // Si ya hay una alerta activa, no mostrar otra
        if (window.WhatsAppStatus.alertaActiva) {
            return;
        }
        
        const defaults = {
            tipo: 'error', // error, warning, info
            titulo: 'WhatsApp Desconectado',
            mensaje: 'Necesitas conectar WhatsApp para realizar esta acción',
            mostrarBotonConectar: true,
            autoCerrar: 5000
        };
        
        const opciones = { ...defaults, ...config };
        
        // Crear elemento de alerta
        const alerta = document.createElement('div');
        alerta.className = `whatsapp-alert ${opciones.tipo}`;
        alerta.innerHTML = `
            <div class="whatsapp-alert-icon">
                <i class="fas ${opciones.tipo === 'error' ? 'fa-exclamation-circle' : opciones.tipo === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            </div>
            <div class="whatsapp-alert-content">
                <h4 class="whatsapp-alert-title">${opciones.titulo}</h4>
                <p class="whatsapp-alert-message">${opciones.mensaje}</p>
                ${opciones.mostrarBotonConectar ? `
                    <div class="whatsapp-alert-actions">
                        <button class="whatsapp-alert-btn primary" onclick="window.location.href='/configuracion'">
                            <i class="fas fa-link"></i> Ir a Configuración
                        </button>
                        <button class="whatsapp-alert-btn secondary" onclick="window.cerrarAlertaWhatsApp()">
                            Cerrar
                        </button>
                    </div>
                ` : ''}
            </div>
            <button class="whatsapp-alert-close" onclick="window.cerrarAlertaWhatsApp()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(alerta);
        window.WhatsAppStatus.alertaActiva = alerta;
        
        // Auto cerrar
        if (opciones.autoCerrar) {
            setTimeout(() => {
                window.cerrarAlertaWhatsApp();
            }, opciones.autoCerrar);
        }
    };
    
    /**
     * Cerrar alerta activa
     */
    window.cerrarAlertaWhatsApp = function() {
        if (!window.WhatsAppStatus.alertaActiva) return;
        
        const alerta = window.WhatsAppStatus.alertaActiva;
        alerta.classList.add('hiding');
        
        setTimeout(() => {
            if (alerta.parentNode) {
                alerta.parentNode.removeChild(alerta);
            }
            window.WhatsAppStatus.alertaActiva = null;
        }, 300);
    };
    
    /**
     * Verificar estado antes de ejecutar acción
     */
    window.verificarWhatsAppConectado = function(callback, mensajePersonalizado = null) {
        if (window.WhatsAppStatus.conectado) {
            // WhatsApp conectado, ejecutar acción
            if (typeof callback === 'function') {
                callback();
            }
            return true;
        } else {
            // WhatsApp desconectado, mostrar alerta
            window.mostrarAlertaWhatsApp({
                mensaje: mensajePersonalizado || 'Necesitas conectar WhatsApp para realizar esta acción'
            });
            return false;
        }
    };
    
    /**
     * Actualizar estado desde el servidor
     */
    async function actualizarEstado() {
        try {
            const response = await fetch('/configuracion/api/whatsapp/estado');
            const data = await response.json();
            
            if (data.success) {
                const info = data.data;
                const estadoAnterior = window.WhatsAppStatus.conectado;
                const badge = document.getElementById('statusBadgeGlobal');
                
                // Actualizar estado global
                window.WhatsAppStatus.conectado = info.conectado;
                
                // Actualizar badge
                if (badge) {
                    badge.classList.remove('connected', 'disconnected');
                    badge.classList.add(info.conectado ? 'connected' : 'disconnected');
                    
                    const statusText = badge.querySelector('.status-text');
                    if (statusText) {
                        statusText.innerHTML = info.conectado 
                            ? '<i class="fas fa-check-circle"></i> Conectado'
                            : '<i class="fas fa-times-circle"></i> Desconectado';
                    }
                    
                    // Hacer el badge clickeable cuando está desconectado
                    badge.style.cursor = info.conectado ? 'default' : 'pointer';
                    badge.onclick = info.conectado ? null : function() {
                        window.location.href = '/configuracion';
                    };
                    
                    // Agregar título descriptivo
                    badge.title = info.conectado 
                        ? 'WhatsApp conectado correctamente' 
                        : 'Click para ir a configuración y conectar WhatsApp';
                }
                
                // Ejecutar callbacks si cambió
                if (estadoAnterior !== info.conectado) {
                    ejecutarCallbacks(info.conectado);
                }
                
                console.log('✅ Estado actualizado:', info.conectado ? 'conectado' : 'desconectado');
            }
        } catch (error) {
            console.error('❌ Error actualizando estado:', error);
        }
    }
    
    /**
     * Ejecutar callbacks
     */
    function ejecutarCallbacks(conectado) {
        window.WhatsAppStatus.callbacks.forEach(callback => {
            try {
                callback(conectado);
            } catch (error) {
                console.error('Error ejecutando callback:', error);
            }
        });
    }
    
    /**
     * Registrar callback para cambios de estado
     */
    window.onWhatsAppStatusChange = function(callback) {
        if (typeof callback === 'function') {
            window.WhatsAppStatus.callbacks.push(callback);
        }
    };
    
    /**
     * Inicializar indicador
     */
    function inicializar() {
        if (window.WhatsAppStatus.inicializado) return;
        
        console.log('🚀 Inicializando indicador...');
        
        // Actualizar cada 30 segundos
        actualizarEstado();
        window.WhatsAppStatus.intervalo = setInterval(actualizarEstado, 30000);
        
        window.WhatsAppStatus.inicializado = true;
        console.log('✅ Indicador inicializado');
    }
    
    /**
     * Función pública para forzar actualización
     */
    window.actualizarEstadoWhatsApp = actualizarEstado;
    
    // Inicializar cuando DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        inicializar();
    }
    
    // Limpiar al cerrar
    window.addEventListener('beforeunload', function() {
        if (window.WhatsAppStatus.intervalo) {
            clearInterval(window.WhatsAppStatus.intervalo);
        }
    });
    
})();