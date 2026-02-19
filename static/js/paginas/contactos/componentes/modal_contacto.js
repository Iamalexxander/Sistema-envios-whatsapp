console.log('📝 Cargando modal_contacto.js...');

window.ModalContacto = {
    inicializado: false,
    
    init() {
        if (this.inicializado) return;
        
        console.log('🔧 Configurando componente ModalContacto...');
        
        this.configurarEventos();
        this.configurarValidaciones();
        this.inicializado = true;
        
        console.log('✅ ModalContacto inicializado');
    },
    
    configurarEventos() {
        const modal = document.getElementById('modalContacto');
        const form = document.getElementById('formContacto');
        const btnCancelar = document.getElementById('btnCancelar');
        const closeModal = document.getElementById('closeModal');
        
        // Conectar botón "Agregar Contacto"
        const btnAgregarContacto = document.getElementById('btnAgregarContacto');
        if (btnAgregarContacto) {
            btnAgregarContacto.addEventListener('click', () => {
                console.log('📝 Abriendo modal para crear contacto');
                this.abrirModal();
            });
        }
        
        // Cerrar modal
        if (btnCancelar) {
            btnCancelar.addEventListener('click', (e) => {
                e.preventDefault();
                this.cerrarModal();
            });
        }
        
        if (closeModal) {
            closeModal.addEventListener('click', (e) => {
                e.preventDefault();
                this.cerrarModal();
            });
        }
        
        // Cerrar al hacer clic fuera del modal
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.cerrarModal();
                }
            });
        }
        
        // Envío del formulario
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarContacto();
            });
        }
        
        // Tecla ESC para cerrar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.style.display === 'block') {
                this.cerrarModal();
            }
        });
    },
    
    configurarValidaciones() {
        const numeroInput = document.getElementById('contactoNumero');
        const nombreInput = document.getElementById('contactoNombre');
        
        // Validación y formato automático del teléfono
        if (numeroInput) {
            numeroInput.addEventListener('focus', () => {
                if (!numeroInput.value.startsWith('+5939')) {
                    numeroInput.value = '+5939';
                }
                setTimeout(() => {
                    numeroInput.setSelectionRange(numeroInput.value.length, numeroInput.value.length);
                }, 0);
            });
            
            numeroInput.addEventListener('keydown', (e) => {
                // No permitir borrar el prefijo +5939
                if (numeroInput.selectionStart <= 5 && ['Backspace', 'Delete'].includes(e.key)) {
                    e.preventDefault();
                }
                
                // Solo permitir números después del prefijo +5939
                if (numeroInput.value.length >= 5) {
                    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
                    if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) {
                        e.preventDefault();
                    }
                }
            });
            
            numeroInput.addEventListener('input', () => {
                let valor = numeroInput.value;
                let prefijo = '+5939';
                
                // Asegurar que siempre empiece con +5939
                if (!valor.startsWith(prefijo)) {
                    valor = prefijo;
                }
                
                // Extraer solo los dígitos después del prefijo y limitar a 8 dígitos
                let resto = valor.slice(prefijo.length).replace(/\D/g, '').slice(0, 8);
                numeroInput.value = prefijo + resto;
                
                this.validarCampo('telefono');
            });
        }
        
        // Validación en tiempo real para nombre
        if (nombreInput) {
            nombreInput.addEventListener('input', () => {
                this.validarCampo('nombre');
            });
        }
    },
    
    validarCampo(campo) {
        const campos = {
            nombre: document.getElementById('contactoNombre'),
            telefono: document.getElementById('contactoNumero')
        };
        
        const input = campos[campo];
        if (!input) return true;
        
        const errorSpan = input.parentElement.querySelector('.error-message');
        let esValido = true;
        let mensaje = '';
        
        switch (campo) {
            case 'nombre':
                const nombre = input.value.trim();
                if (!nombre) {
                    esValido = false;
                    mensaje = 'El nombre es obligatorio';
                } else if (nombre.length < 2) {
                    esValido = false;
                    mensaje = 'El nombre debe tener al menos 2 caracteres';
                } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre)) {
                    esValido = false;
                    mensaje = 'El nombre solo puede contener letras y espacios';
                }
                break;
                
            case 'telefono':
                const telefono = input.value.trim();
                if (!telefono) {
                    esValido = false;
                    mensaje = 'El teléfono es obligatorio';
                } else if (!/^\+5939\d{8}$/.test(telefono)) {
                    esValido = false;
                    mensaje = 'Formato inválido. Debe ser +5939 seguido de 8 dígitos';
                }
                break;
        }
        
        // Mostrar/ocultar error
        if (esValido) {
            input.classList.remove('input-error');
            if (errorSpan) errorSpan.textContent = '';
        } else {
            input.classList.add('input-error');
            if (errorSpan) errorSpan.textContent = mensaje;
        }
        
        return esValido;
    },
    
    validarFormulario() {
        const campos = ['nombre', 'telefono'];
        let formularioValido = true;
        
        campos.forEach(campo => {
            if (!this.validarCampo(campo)) {
                formularioValido = false;
            }
        });
        
        return formularioValido;
    },
    
    async guardarContacto() {
        if (!this.validarFormulario()) {
            console.log('❌ Formulario inválido');
            return;
        }
        
        const contactoId = document.getElementById('contactoId')?.value;
        
        // Solo los campos esenciales para WhatsApp
        const datos = {
            nombre: document.getElementById('contactoNombre').value.trim(),
            telefono: document.getElementById('contactoNumero').value.trim()
        };
        
        console.log('💾 Guardando contacto:', datos);
        
        // Deshabilitar botón mientras se guarda
        const btnGuardar = document.getElementById('btnGuardar');
        if (btnGuardar) {
            btnGuardar.disabled = true;
            btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        }
        
        try {
            let exito = false;
            
            if (contactoId) {
                // Editar contacto existente
                exito = await window.editarContacto(contactoId, datos);
            } else {
                // Crear nuevo contacto
                exito = await window.crearContacto(datos);
            }
            
            if (exito) {
                console.log('✅ Contacto guardado exitosamente');
                this.cerrarModal();
            }
            
        } catch (error) {
            console.error('❌ Error al guardar contacto:', error);
            this.mostrarNotificacion('Error de conexión al servidor', 'error');
        } finally {
            // Rehabilitar botón
            if (btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar';
            }
        }
    },
    
    limpiarFormulario() {
        const form = document.getElementById('formContacto');
        if (form) {
            form.reset();
        }
        
        // Limpiar errores visuales
        document.querySelectorAll('.input-error').forEach(el => {
            el.classList.remove('input-error');
        });
        
        document.querySelectorAll('.error-message').forEach(span => {
            span.textContent = '';
        });
        
        // Limpiar campo oculto de ID
        const contactoId = document.getElementById('contactoId');
        if (contactoId) contactoId.value = '';
        
        // Restablecer prefijo del teléfono
        const numeroInput = document.getElementById('contactoNumero');
        if (numeroInput) {
            numeroInput.value = '+5939';
        }
    },
    
    abrirModal(contacto = null) {
        console.log('📝 Abriendo modal:', contacto ? 'editar' : 'crear');
        
        const modal = document.getElementById('modalContacto');
        const modalTitle = document.getElementById('modalTitle');
        
        if (!modal) {
            console.error('❌ Modal no encontrado');
            return;
        }
        
        // Limpiar formulario primero
        this.limpiarFormulario();
        
        if (contacto) {
            // Modo edición
            if (modalTitle) modalTitle.textContent = 'Editar Contacto';
            
            const contactoId = document.getElementById('contactoId');
            const contactoNombre = document.getElementById('contactoNombre');
            const contactoNumero = document.getElementById('contactoNumero');
            
            if (contactoId) contactoId.value = contacto.id || '';
            if (contactoNombre) contactoNombre.value = contacto.nombre || '';
            if (contactoNumero) contactoNumero.value = contacto.telefono || '+5939';
        } else {
            // Modo creación
            if (modalTitle) modalTitle.textContent = 'Agregar Contacto';
        }
        
        modal.style.display = 'block';
        
        // Enfocar el primer campo
        setTimeout(() => {
            const nombreInput = document.getElementById('contactoNombre');
            if (nombreInput) {
                nombreInput.focus();
            }
        }, 100);
    },
    
    cerrarModal() {
        const modal = document.getElementById('modalContacto');
        if (modal) {
            modal.style.display = 'none';
        }
        
        this.limpiarFormulario();
        
        // Restaurar título
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Agregar Contacto';
        }
        
        console.log('📝 Modal cerrado');
    },

    mostrarNotificacion(mensaje, tipo = 'success') {
        // Usar la función global si existe
        if (typeof window.mostrarNotificacion === 'function') {
            window.mostrarNotificacion(mensaje, tipo);
            return;
        }
        
        // Fallback local simple
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion notificacion-${tipo}`;
        notificacion.innerHTML = `
            <div class="notificacion-content">
                <i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${mensaje}</span>
            </div>
        `;
        
        // Estilos inline para notificación
         Object.assign(notificacion.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            zIndex: '10000',
            background: tipo === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            maxWidth: '400px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            animation: 'slideIn 0.3s ease-out'
        });
        
        document.body.appendChild(notificacion);
        
        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.remove();
            }
        }, 4000);
    }
};

// Función global para abrir modal desde cualquier parte
window.abrirModal = function(contacto = null) {
    if (window.ModalContacto) {
        window.ModalContacto.abrirModal(contacto);
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.ModalContacto.init();
    }, 100);
});

console.log('✅ modal_contacto.js cargado');