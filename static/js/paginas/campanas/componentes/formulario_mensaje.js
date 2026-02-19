// formulario_mensaje.js - Componente específico para el formulario de mensaje
console.log('📝 Cargando formulario_mensaje.js...');

// ✅ Variable global para rastrear plantilla cargada
let plantillaActualId = null;

// ✅ LÍMITE MÁXIMO DE PALABRAS
const MAX_PALABRAS = 30;

window.FormularioMensaje = {
    inicializado: false,
    archivoSeleccionado: null,
    
    init() {
        if (this.inicializado) return;
        
        console.log('🔧 Configurando componente FormularioMensaje...');
        
        this.configurarEventos();
        this.inicializado = true;
        
        console.log('✅ FormularioMensaje inicializado con límite de', MAX_PALABRAS, 'palabras');
    },
    
    cargarPlantilla(plantillaId) {
        const app = window.CampanasApp;
        const textarea = document.getElementById('mensaje-textarea');
        const plantillaActions = document.getElementById('plantilla-actions');
        const nombrePlantilla = document.getElementById('nombre-plantilla-actual');
        const btnIniciar = document.getElementById('btn-iniciar');
        
        if (!textarea) return;
        
        if (plantillaId && app.plantillas[plantillaId]) {
            const contenido = app.plantillas[plantillaId];
            
            // ✅ Validar límite de palabras antes de cargar
            const palabras = this.contarPalabras(contenido);
            
            if (palabras > MAX_PALABRAS) {
                window.mostrarNotificacion(`Esta plantilla tiene ${palabras} palabras. El límite es ${MAX_PALABRAS} palabras.`, 'error');
                textarea.value = '';
                textarea.setAttribute('readonly', true);
                return;
            }
            
            textarea.value = contenido;
            textarea.removeAttribute('readonly');
            
            // ✅ Guardar referencia de la plantilla actual
            plantillaActualId = plantillaId;
            
            // ✅ Mostrar botón de guardar
            if (plantillaActions) plantillaActions.style.display = 'flex';
            
            // ✅ Mostrar nombre de plantilla
            const plantillaOption = document.querySelector(`#plantilla-select option[value="${plantillaId}"]`);
            if (nombrePlantilla && plantillaOption) {
                nombrePlantilla.textContent = plantillaOption.textContent;
            }
            
            // Actualizar info del mensaje
            this.actualizarMensajeInfo();
            
            // Habilitar el botón
            if (btnIniciar) btnIniciar.disabled = false;
            
            // Actualizar preview de WhatsApp
            if (window.PrevisualizacionWhatsApp && window.PrevisualizacionWhatsApp.inicializado) {
                window.PrevisualizacionWhatsApp.actualizarTextoPreview();
            }
            
            window.mostrarNotificacion('Plantilla cargada correctamente', 'success');
        } else {
            // ✅ Volver a bloquear el textarea cuando no hay plantilla seleccionada
            textarea.value = '';
            textarea.setAttribute('readonly', true);
            textarea.placeholder = 'Selecciona una plantilla arriba...';
            plantillaActualId = null;
            
            if (plantillaActions) plantillaActions.style.display = 'none';
            
            // Actualizar info del mensaje
            this.actualizarMensajeInfo();
            
            // Deshabilitar el botón
            if (btnIniciar) btnIniciar.disabled = true;
            
            // Actualizar preview de WhatsApp
            if (window.PrevisualizacionWhatsApp && window.PrevisualizacionWhatsApp.inicializado) {
                window.PrevisualizacionWhatsApp.actualizarTextoPreview();
            }
        }
    },

    // ✅ Método para contar palabras
    contarPalabras(texto) {
        if (!texto || texto.trim() === '') return 0;
        
        // Eliminar espacios múltiples y contar palabras
        return texto.trim().split(/\s+/).length;
    },

    // ✅ Método para truncar texto a máximo de palabras
    truncarAPalabras(texto, maxPalabras) {
        const palabras = texto.trim().split(/\s+/);
        
        if (palabras.length <= maxPalabras) {
            return texto;
        }
        
        return palabras.slice(0, maxPalabras).join(' ');
    },

    // ✅ Método para aplicar límite de palabras
    aplicarLimitePalabras(textarea) {
        const contenido = textarea.value;
        const palabras = this.contarPalabras(contenido);
        
        if (palabras > MAX_PALABRAS) {
            // Truncar al límite
            const textoTruncado = this.truncarAPalabras(contenido, MAX_PALABRAS);
            textarea.value = textoTruncado;
            
            // Mostrar advertencia
            window.mostrarNotificacion(`Límite alcanzado: máximo ${MAX_PALABRAS} palabras`, 'warning');
            
            // Actualizar info
            this.actualizarMensajeInfo();
            
            // Actualizar preview
            if (window.PrevisualizacionWhatsApp && window.PrevisualizacionWhatsApp.inicializado) {
                window.PrevisualizacionWhatsApp.actualizarTextoPreview();
            }
        }
    },

    // ✅ Método para guardar cambios en la plantilla
    async guardarCambiosPlantilla() {
        if (!plantillaActualId) {
            window.mostrarNotificacion('No hay plantilla seleccionada', 'error');
            return;
        }
        
        const textarea = document.getElementById('mensaje-textarea');
        const nuevoContenido = textarea.value.trim();
        
        if (!nuevoContenido) {
            window.mostrarNotificacion('El contenido no puede estar vacío', 'error');
            return;
        }
        
        // ✅ Validar límite antes de guardar
        const palabras = this.contarPalabras(nuevoContenido);
        if (palabras > MAX_PALABRAS) {
            window.mostrarNotificacion(`El contenido tiene ${palabras} palabras. El límite es ${MAX_PALABRAS}.`, 'error');
            return;
        }
        
        // Confirmar acción
        if (!confirm('¿Deseas guardar estos cambios en la plantilla? Esto afectará a futuras campañas que usen esta plantilla.')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/plantillas/${plantillaActualId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contenido: nuevoContenido
                })
            });
            
            if (response.ok) {
                // ✅ Actualizar cache local
                window.CampanasApp.plantillas[plantillaActualId] = nuevoContenido;
                
                window.mostrarNotificacion('Plantilla actualizada correctamente', 'success');
            } else {
                throw new Error('Error al guardar');
            }
        } catch (error) {
            console.error('Error:', error);
            window.mostrarNotificacion('Error al guardar los cambios', 'error');
        }
    },

    configurarEventos() {
        // Selector de plantilla
        const plantillaSelect = document.getElementById('plantilla-select');
        if (plantillaSelect) {
            plantillaSelect.addEventListener('change', (e) => {
                this.cargarPlantilla(e.target.value);
            });
        }
        
        // Textarea del mensaje
        const mensajeTextarea = document.getElementById('mensaje-textarea');
        if (mensajeTextarea) {
            // ✅ EVENTO INPUT: validar mientras escribe
            mensajeTextarea.addEventListener('input', () => {
                this.aplicarLimitePalabras(mensajeTextarea);
                this.actualizarMensajeInfo();
            });
            
            // ✅ EVENTO PASTE: validar al pegar
            mensajeTextarea.addEventListener('paste', (e) => {
                // Pequeño delay para que se pegue primero
                setTimeout(() => {
                    this.aplicarLimitePalabras(mensajeTextarea);
                    this.actualizarMensajeInfo();
                }, 10);
            });
            
            // Actualizar info inicial
            this.actualizarMensajeInfo();
        }
        
        // Opciones de archivos
        this.configurarSelectorArchivos();
        
        // Botón eliminar archivo
        const eliminarBtn = document.getElementById('eliminar-archivo');
        if (eliminarBtn) {
            eliminarBtn.addEventListener('click', () => {
                this.eliminarArchivo();
            });
        }
        
        // Botón cambiar archivo
        const cambiarBtn = document.getElementById('cambiar-archivo');
        if (cambiarBtn) {
            cambiarBtn.addEventListener('click', () => {
                this.cambiarArchivo();
            });
        }

        // Botón guardar plantilla
        const btnGuardarPlantilla = document.getElementById('btn-guardar-plantilla');
        if (btnGuardarPlantilla) {
            btnGuardarPlantilla.addEventListener('click', () => {
                this.guardarCambiosPlantilla();
            });
        }
    },
    
    configurarSelectorArchivos() {
        // Configurar clicks en las opciones de archivo
        const opcionImagen = document.getElementById('option-imagen');
        const opcionVideo = document.getElementById('option-video');
        const opcionDocumento = document.getElementById('option-documento');
        
        if (opcionImagen) {
            opcionImagen.addEventListener('click', (e) => {
                e.preventDefault();
                this.abrirSelectorArchivo('imagen');
            });
        }
        
        if (opcionVideo) {
            opcionVideo.addEventListener('click', (e) => {
                e.preventDefault();
                this.abrirSelectorArchivo('video');
            });
        }
        
        if (opcionDocumento) {
            opcionDocumento.addEventListener('click', (e) => {
                e.preventDefault();
                this.abrirSelectorArchivo('documento');
            });
        }
        
        // Configurar el input file
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    const archivo = e.target.files[0];
                    const tipo = fileInput.dataset.tipo || 'documento';
                    this.procesarArchivoSeleccionado(archivo, tipo);
                }
            });
        }
    },
    
    abrirSelectorArchivo(tipo) {
        console.log('🗂️ Abriendo selector para tipo:', tipo);
        
        const fileInput = document.getElementById('file-input');
        if (!fileInput) return;
        
        // Limpiar input anterior
        fileInput.value = '';
        fileInput.dataset.tipo = tipo;
        
        // Configurar tipos de archivo aceptados
        switch(tipo) {
            case 'imagen':
                fileInput.accept = 'image/*';
                break;
            case 'video':
                fileInput.accept = 'video/*';
                break;
            case 'documento':
                fileInput.accept = '.pdf,.doc,.docx,.txt,.xlsx,.pptx,.zip,.rar';
                break;
            default:
                fileInput.accept = '*/*';
        }
        
        // Abrir selector
        fileInput.click();
    },
    
    procesarArchivoSeleccionado(archivo, tipo) {
        console.log('📁 Procesando archivo:', archivo.name, 'Tipo:', tipo);
        
        // Validar tamaño (máximo 100MB)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (archivo.size > maxSize) {
            window.mostrarNotificacion('El archivo es demasiado grande. Máximo 100MB.', 'error');
            return;
        }
        
        // Validar tipo de archivo
        if (!this.validarTipoArchivo(archivo, tipo)) {
            window.mostrarNotificacion('Tipo de archivo no válido para la categoría seleccionada.', 'error');
            return;
        }
        
        // Guardar referencia del archivo
        this.archivoSeleccionado = { file: archivo, tipo: tipo };
        
        // Mostrar preview en el formulario
        this.mostrarPreviewArchivo(archivo, tipo);
        
        // Marcar radio button correspondiente
        this.marcarOpcionArchivo(tipo);
        
        // Mostrar en la previsualización de WhatsApp
        if (window.PrevisualizacionWhatsApp && window.PrevisualizacionWhatsApp.inicializado) {
            window.PrevisualizacionWhatsApp.mostrarArchivoEnPreview(archivo, tipo);
        }
        
        window.mostrarNotificacion(`Archivo ${archivo.name} seleccionado`, 'success');
    },
    
    validarTipoArchivo(archivo, tipoEsperado) {
        const tipoArchivo = archivo.type.toLowerCase();
        
        switch(tipoEsperado) {
            case 'imagen':
                return tipoArchivo.startsWith('image/');
            case 'video':
                return tipoArchivo.startsWith('video/');
            case 'documento':
                const tiposDocumento = [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'text/plain',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-powerpoint',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'application/zip',
                    'application/x-rar-compressed'
                ];
                return tiposDocumento.includes(tipoArchivo) || tipoArchivo === '';
            default:
                return true;
        }
    },
    
    marcarOpcionArchivo(tipo) {
        // Limpiar todas las selecciones
        const opciones = document.querySelectorAll('input[name="archivo"]');
        opciones.forEach(opcion => {
            opcion.checked = false;
        });
        
        // Marcar la opción correspondiente
        const opcionCorrecta = document.querySelector(`input[name="archivo"][value="${tipo}"]`);
        if (opcionCorrecta) {
            opcionCorrecta.checked = true;
        }
    },
    
    actualizarMensajeInfo() {
        const contenido = document.getElementById('mensaje-textarea')?.value || '';
        const infoElement = document.getElementById('mensaje-info');
        
        if (!infoElement) return;
        
        if (!contenido.trim()) {
            infoElement.textContent = '0 palabras • 0 caracteres';
            infoElement.style.color = '#64748b';
            return;
        }
        
        const palabras = this.contarPalabras(contenido);
        const caracteres = contenido.length;
        
        // ✅ Cambiar color si está cerca o en el límite
        if (palabras >= MAX_PALABRAS) {
            infoElement.style.color = '#ef4444'; // rojo
            infoElement.textContent = `${palabras}/${MAX_PALABRAS} palabras • ${caracteres} caracteres (LÍMITE ALCANZADO)`;
        } else if (palabras >= MAX_PALABRAS - 5) {
            infoElement.style.color = '#f59e0b'; // naranja
            infoElement.textContent = `${palabras}/${MAX_PALABRAS} palabras • ${caracteres} caracteres`;
        } else {
            infoElement.style.color = '#10b981'; // verde
            infoElement.textContent = `${palabras}/${MAX_PALABRAS} palabras • ${caracteres} caracteres`;
        }
    },
    
    mostrarPreviewArchivo(archivo, tipo) {
        // Obtener elementos del preview
        const preview = document.getElementById('archivo-preview');
        const previewNombre = document.getElementById('preview-nombre');
        const previewSize = document.getElementById('preview-size');
        const previewTipo = document.getElementById('preview-tipo');
        const previewIcon = document.getElementById('preview-icon');
        const previewIconContainer = previewIcon?.parentElement;
        
        if (!preview) return;
        
        // Actualizar información del archivo
        if (previewNombre) previewNombre.textContent = archivo.name;
        if (previewSize) previewSize.textContent = this.formatearTamano(archivo.size);
        if (previewTipo) previewTipo.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
        
        // Actualizar icono según el tipo
        if (previewIcon && previewIconContainer) {
            // Limpiar clases anteriores
            previewIconContainer.classList.remove('imagen', 'video', 'documento');
            
            // Agregar clase del tipo actual
            previewIconContainer.classList.add(tipo);
            
            // Cambiar icono
            switch(tipo) {
                case 'imagen':
                    previewIcon.className = 'fas fa-image';
                    break;
                case 'video':
                    previewIcon.className = 'fas fa-video';
                    break;
                case 'documento':
                    previewIcon.className = 'fas fa-file-alt';
                    break;
                default:
                    previewIcon.className = 'fas fa-file';
            }
        }
        
        // Mostrar preview con animación
        preview.style.display = 'block';
        setTimeout(() => {
            preview.classList.add('show');
        }, 10);
    },
    
    eliminarArchivo() {
        const preview = document.getElementById('archivo-preview');
        
        if (!preview) return;
        
        // Animación de salida
        preview.classList.remove('show');
        
        setTimeout(() => {
            preview.style.display = 'none';
            
            // Limpiar selección de radio buttons
            const archivoOptions = document.querySelectorAll('input[name="archivo"]');
            archivoOptions.forEach(option => {
                option.checked = false;
            });
            
            // Limpiar referencia del archivo
            this.archivoSeleccionado = null;
            
            // Ocultar en previsualización de WhatsApp
            if (window.PrevisualizacionWhatsApp && window.PrevisualizacionWhatsApp.inicializado) {
                window.PrevisualizacionWhatsApp.ocultarArchivoEnPreview();
            }
            
            window.mostrarNotificacion('Archivo eliminado', 'info');
            console.log('🗑️ Archivo eliminado');
            
        }, 300);
    },
    
    cambiarArchivo() {
        if (!this.archivoSeleccionado) return;
        
        // Abrir selector para el mismo tipo
        this.abrirSelectorArchivo(this.archivoSeleccionado.tipo);
    },
    
    formatearTamano(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const tamaños = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + tamaños[i];
    },
    
    // Función pública para obtener el archivo seleccionado
    getArchivoSeleccionado() {
        return this.archivoSeleccionado;
    },
    
    // Función para validar si hay archivo seleccionado
    tieneArchivo() {
        return this.archivoSeleccionado !== null;
    },
    
    // Función para limpiar todo el formulario
    limpiarFormulario() {
        // Limpiar plantilla
        const plantillaSelect = document.getElementById('plantilla-select');
        if (plantillaSelect) plantillaSelect.value = '';
        
        // Limpiar mensaje
        const mensajeTextarea = document.getElementById('mensaje-textarea');
        if (mensajeTextarea) {
            mensajeTextarea.value = '';
            
            // Actualizar preview de WhatsApp
            if (window.PrevisualizacionWhatsApp && window.PrevisualizacionWhatsApp.inicializado) {
                window.PrevisualizacionWhatsApp.actualizarTextoPreview();
            }
        }
        
        // Limpiar archivo si existe
        if (this.archivoSeleccionado) {
            this.eliminarArchivo();
        }
        
        // Actualizar info del mensaje
        this.actualizarMensajeInfo();
        
        // Limpiar referencia de plantilla
        plantillaActualId = null;
        
        window.mostrarNotificacion('Formulario limpiado', 'info');
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar un poco para que se cargue el archivo principal
    setTimeout(() => {
        window.FormularioMensaje.init();
    }, 50);
});

console.log('✅ formulario_mensaje.js cargado');