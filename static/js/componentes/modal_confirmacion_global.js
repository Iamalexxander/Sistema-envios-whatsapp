// Modal de Confirmación Global
(function() {
    'use strict';
    
    console.log('🔔 Inicializando sistema de modales de confirmación...');
    
    // Crear el modal en el DOM si no existe
    function crearModalHTML() {
        if (document.getElementById('modalConfirmacionGlobal')) {
            return;
        }
        
        const modalHTML = `
            <div class="modal-confirmacion-overlay" id="modalConfirmacionGlobal">
                <div class="modal-confirmacion-container">
                    <div class="modal-confirmacion-header">
                        <div class="modal-confirmacion-icon warning" id="modalConfirmacionIcono">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="modal-confirmacion-text">
                            <h3 class="modal-confirmacion-title" id="modalConfirmacionTitulo">
                                Confirmar acción
                            </h3>
                            <p class="modal-confirmacion-message" id="modalConfirmacionMensaje">
                                ¿Estás seguro de realizar esta acción?
                            </p>
                        </div>
                    </div>
                    <div class="modal-confirmacion-footer">
                        <button class="modal-confirmacion-btn cancelar" id="modalConfirmacionCancelar">
                            Cancelar
                        </button>
                        <button class="modal-confirmacion-btn confirmar" id="modalConfirmacionConfirmar">
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Sistema de confirmación personalizado
    window.mostrarConfirmacion = function(opciones = {}) {
        return new Promise((resolve) => {
            crearModalHTML();
            
            const defaults = {
                titulo: 'Confirmar acción',
                mensaje: '¿Estás seguro de realizar esta acción?',
                tipo: 'warning',
                textoConfirmar: 'Confirmar',
                textoCancelar: 'Cancelar',
                estiloConfirmar: 'danger'
            };
            
            const config = { ...defaults, ...opciones };
            
            const modal = document.getElementById('modalConfirmacionGlobal');
            const titulo = document.getElementById('modalConfirmacionTitulo');
            const mensaje = document.getElementById('modalConfirmacionMensaje');
            const icono = document.getElementById('modalConfirmacionIcono');
            const btnConfirmar = document.getElementById('modalConfirmacionConfirmar');
            const btnCancelar = document.getElementById('modalConfirmacionCancelar');
            
            // Configurar contenido
            titulo.textContent = config.titulo;
            mensaje.textContent = config.mensaje;
            btnConfirmar.textContent = config.textoConfirmar;
            btnCancelar.textContent = config.textoCancelar;
            
            // Configurar icono según tipo
            icono.className = `modal-confirmacion-icon ${config.tipo}`;
            const iconos = {
                warning: 'fa-exclamation-triangle',
                danger: 'fa-exclamation-circle',
                info: 'fa-info-circle'
            };
            const iconElement = icono.querySelector('i');
            if (iconElement) {
                iconElement.className = `fas ${iconos[config.tipo]}`;
            }
            
            // Configurar estilo botón confirmar
            btnConfirmar.className = `modal-confirmacion-btn confirmar ${config.estiloConfirmar}`;
            
            // Mostrar modal con pequeño delay para la animación
            setTimeout(() => modal.classList.add('active'), 10);
            
            // Event listeners con limpieza previa
            const nuevoConfirmar = btnConfirmar.cloneNode(true);
            const nuevoCancelar = btnCancelar.cloneNode(true);
            btnConfirmar.parentNode.replaceChild(nuevoConfirmar, btnConfirmar);
            btnCancelar.parentNode.replaceChild(nuevoCancelar, btnCancelar);
            
            function cerrarModal(resultado) {
                modal.classList.remove('active');
                setTimeout(() => {
                    console.log('Modal cerrado con resultado:', resultado);
                    resolve(resultado);
                }, 300);
            }
            
            nuevoConfirmar.addEventListener('click', () => {
                console.log('Click en Confirmar');
                cerrarModal(true);
            });
            
            nuevoCancelar.addEventListener('click', () => {
                console.log('Click en Cancelar');
                cerrarModal(false);
            });
            
            modal.onclick = function(e) {
                if (e.target === modal) {
                    console.log('Click en overlay');
                    cerrarModal(false);
                }
            };
        });
    };
    
    console.log('✅ Sistema de modales de confirmación inicializado');
})();