console.log('📤 Cargando subir_archivo.js...');

window.SubirArchivo = {
    inicializado: false,
    
    init() {
        if (this.inicializado) return;
        
        console.log('🔧 Configurando componente SubirArchivo...');
        this.configurarEventos();
        this.inicializado = true;
        console.log('✅ SubirArchivo inicializado');
    },
    
    configurarEventos() {
        // 1. Botón descargar plantilla
        const btnDownload = document.getElementById('btnDownloadTemplate');
        if (btnDownload) {
            btnDownload.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.descargarPlantilla();
            };
        }
        
        // 2. Botón elegir archivo (abre el explorador)
        const btnUpload = document.getElementById('btnUpload');
        const fileInput = document.getElementById('fileInput');
        
        if (btnUpload && fileInput) {
            btnUpload.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Click en elegir archivo');
                fileInput.click();
            };
        }
        
        // 3. Input de archivo (cuando se selecciona)
        if (fileInput) {
            fileInput.onchange = (e) => {
                console.log('📁 Archivo seleccionado del input');
                this.manejarSeleccionArchivo(e);
            };
        }
        
        // 4. Botón procesar archivo
        const btnProcessFile = document.getElementById('btnProcessFile');
        if (btnProcessFile) {
            btnProcessFile.onclick = () => {
                this.procesarArchivo();
            };
        }
        
        // 5. Botón quitar archivo
        const btnRemoveFile = document.getElementById('btnRemoveFile');
        if (btnRemoveFile) {
            btnRemoveFile.onclick = () => {
                this.quitarArchivo();
            };
        }
        
        // 6. Drag & Drop
        const uploadContainer = document.getElementById('uploadContainer');
        if (uploadContainer) {
            uploadContainer.ondragover = (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadContainer.classList.add('drag-over');
            };
            
            uploadContainer.ondragleave = (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadContainer.classList.remove('drag-over');
            };
            
            uploadContainer.ondrop = (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadContainer.classList.remove('drag-over');
                
                console.log('📥 Archivo dropeado');
                const files = e.dataTransfer.files;
                
                if (files.length > 0 && fileInput) {
                    console.log('📄 Archivo detectado:', files[0].name);
                    fileInput.files = files;
                    this.manejarSeleccionArchivo({ target: { files } });
                }
            };
        }
        
        // Prevenir comportamiento por defecto
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.body.addEventListener(eventName, (e) => {
                if (!e.target.closest('#uploadContainer')) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, false);
        });
    },
    
    async descargarPlantilla() {
        try {
            console.log('📥 Descargando plantilla Excel...');
            
            const btnDownload = document.getElementById('btnDownloadTemplate');
            const originalHTML = btnDownload ? btnDownload.innerHTML : '';
            
            if (btnDownload) {
                btnDownload.disabled = true;
                btnDownload.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Descargando...';
            }
            
            // Usar la ruta correcta del blueprint
            const response = await fetch('/contactos/api/plantilla-excel', {
                method: 'GET'
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'plantilla_contactos.xlsx';
            
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
            
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('Plantilla descargada exitosamente', 'success');
            }
            console.log('✅ Plantilla descargada correctamente');
            
        } catch (error) {
            console.error('❌ Error descargando plantilla:', error);
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion(`Error al descargar plantilla: ${error.message}`, 'error');
            } else {
                alert(`Error al descargar plantilla: ${error.message}`);
            }
        } finally {
            const btnDownload = document.getElementById('btnDownloadTemplate');
            if (btnDownload) {
                btnDownload.disabled = false;
                btnDownload.innerHTML = originalHTML || '<i class="fas fa-download"></i> Descargar Plantilla';
            }
        }
    },
    
    manejarSeleccionArchivo(e) {
        const files = e.target.files;
        
        if (!files || files.length === 0) {
            console.log('⚠️ No se seleccionó ningún archivo');
            return;
        }
        
        const file = files[0];
        console.log('📄 Archivo seleccionado:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
        
        // Validar extensión
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const fileName = file.name.toLowerCase();
        const isValid = validExtensions.some(ext => fileName.endsWith(ext));
        
        if (!isValid) {
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('Solo se permiten archivos .xlsx, .xls o .csv', 'error');
            }
            this.limpiarInput();
            return;
        }
        
        // Validar tamaño (máximo 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('El archivo es demasiado grande (máximo 10MB)', 'error');
            }
            this.limpiarInput();
            return;
        }
        
        // Mostrar archivo seleccionado
        this.mostrarArchivoSeleccionado(file);
    },
    
    mostrarArchivoSeleccionado(file) {
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        const fileRows = document.getElementById('fileRows');
        const fileStatus = document.getElementById('fileStatus');
        const uploadContainer = document.getElementById('uploadContainer');
        const btnProcessFile = document.getElementById('btnProcessFile');
        
        if (fileName) {
            fileName.textContent = file.name;
        }
        
        if (fileSize) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            fileSize.textContent = `${sizeMB} MB`;
        }
        
        if (fileRows) {
            fileRows.textContent = 'Listo para procesar';
        }
        
        if (fileStatus) {
            fileStatus.style.display = 'block';
        }
        
        if (uploadContainer) {
            uploadContainer.style.display = 'none';
        }
        
        if (btnProcessFile) {
            btnProcessFile.disabled = false;
        }
        
        console.log('✅ Archivo mostrado en interfaz');
    },
    
    quitarArchivo() {
        this.limpiarInput();
        
        const fileStatus = document.getElementById('fileStatus');
        const uploadContainer = document.getElementById('uploadContainer');
        const btnProcessFile = document.getElementById('btnProcessFile');
        
        if (fileStatus) {
            fileStatus.style.display = 'none';
        }
        
        if (uploadContainer) {
            uploadContainer.style.display = 'block';
        }
        
        if (btnProcessFile) {
            btnProcessFile.disabled = true;
        }
        
        console.log('🗑️ Archivo removido');
    },
    
    limpiarInput() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }
    },
    
    async procesarArchivo() {
        const fileInput = document.getElementById('fileInput');
        
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('Seleccione un archivo primero', 'warning');
            }
            return;
        }
        
        const file = fileInput.files[0];
        
        const btnProcessFile = document.getElementById('btnProcessFile');
        const uploadProgress = document.getElementById('uploadProgress');
        const fileStatus = document.getElementById('fileStatus');
        
        if (btnProcessFile) {
            btnProcessFile.disabled = true;
            btnProcessFile.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        }
        
        if (uploadProgress) {
            uploadProgress.style.display = 'block';
        }
        
        try {
            const formData = new FormData();
            formData.append('archivo', file);
            
            console.log('📤 Enviando archivo al servidor...');
            
            const response = await fetch('/contactos/api/importar', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                const stats = result.data.estadisticas;
                
                let mensaje = `✅ Importación completada:\n`;
                mensaje += `• ${stats.procesados} contactos importados correctamente\n`;
                
                if (stats.errores > 0 || stats.duplicados > 0 || stats.telefonos_invalidos > 0 || stats.nombres_repetidos > 0) {
                    mensaje += `\n⚠️ Alertas:\n`;
                    if (stats.duplicados > 0) {
                        mensaje += `• ${stats.duplicados} teléfonos duplicados rechazados\n`;
                    }
                    if (stats.nombres_repetidos > 0) {
                        mensaje += `• ${stats.nombres_repetidos} nombres duplicados rechazados\n`;
                    }
                    if (stats.telefonos_invalidos > 0) {
                        mensaje += `• ${stats.telefonos_invalidos} teléfonos inválidos rechazados\n`;
                    }
                    if (stats.errores > 0) {
                        mensaje += `• ${stats.errores} errores adicionales\n`;
                    }
                }
                
                if (typeof mostrarNotificacion === 'function') {
                    mostrarNotificacion(mensaje, 'success');
                }
                
                // Mostrar errores detallados con contador de exitosos
                if (stats.detalles_errores && stats.detalles_errores.length > 0) {
                    this.mostrarDetallesErrores(stats.detalles_errores, stats.procesados);
                }
                
                // Recargar contactos
                if (typeof cargarContactos === 'function') {
                    await cargarContactos();
                }
                
                // Limpiar
                this.quitarArchivo();
                
            } else {
                throw new Error(result.message || 'Error procesando archivo');
            }
            
        } catch (error) {
            console.error('❌ Error procesando archivo:', error);
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion(`Error: ${error.message}`, 'error');
            }
            
        } finally {
            if (btnProcessFile) {
                btnProcessFile.disabled = false;
                btnProcessFile.innerHTML = '<i class="fas fa-cogs"></i> Procesar Archivo';
            }
            
            if (uploadProgress) {
                uploadProgress.style.display = 'none';
            }
        }
    },
    
    mostrarDetallesErrores(errores, exitosos = 0) {
        console.log('📋 Detalles de errores:', errores);
        
        // Agrupar errores por tipo
        const errorsPorTipo = {
            duplicados: [],
            invalidos: [],
            otros: []
        };
        
        errores.forEach(error => {
            const errorLower = error.toLowerCase();
            if (errorLower.includes('ya existe') || errorLower.includes('duplicado')) {
                errorsPorTipo.duplicados.push(error);
            } else if (errorLower.includes('inválido') || errorLower.includes('invalido') || errorLower.includes('debe empezar')) {
                errorsPorTipo.invalidos.push(error);
            } else {
                errorsPorTipo.otros.push(error);
            }
        });
        
        // Construir contenido del modal
        let contenidoErrores = '';
        const maxMostrar = 3;
        
        // ✅ MOSTRAR RESUMEN DE ÉXITOS
        if (exitosos > 0) {
            contenidoErrores += `<div style="margin-bottom: 20px; padding: 16px; background: #dcfce7; border-left: 4px solid #16a34a; border-radius: 8px;">
                <strong style="color: #15803d; font-size: 15px;">
                    <i class="fas fa-check-circle"></i> ${exitosos} contacto(s) importado(s) exitosamente
                </strong>
            </div>`;
        }
        
        // Mostrar duplicados
        if (errorsPorTipo.duplicados.length > 0) {
            contenidoErrores += `<div style="margin-bottom: 16px;">
                <strong style="color: #dc2626;">📛 Nombres/Teléfonos Duplicados (${errorsPorTipo.duplicados.length}):</strong>
                <div style="margin-top: 8px; padding-left: 12px;">`;
            
            // Mostrar solo los primeros 3
            errorsPorTipo.duplicados.slice(0, maxMostrar).forEach(err => {
                contenidoErrores += `<div style="margin-bottom: 4px; font-size: 13px;">• ${err}</div>`;
            });
            
            // Si hay más, mostrar contador
            if (errorsPorTipo.duplicados.length > maxMostrar) {
                const restantes = errorsPorTipo.duplicados.length - maxMostrar;
                contenidoErrores += `<div style="margin-top: 8px; color: #666; font-style: italic;">
                    ... y ${restantes} duplicado(s) más
                </div>`;
            }
            
            contenidoErrores += `</div></div>`;
        }
        
        // Mostrar teléfonos inválidos
        if (errorsPorTipo.invalidos.length > 0) {
            contenidoErrores += `<div style="margin-bottom: 16px;">
                <strong style="color: #dc2626;">📵 Teléfonos Inválidos (${errorsPorTipo.invalidos.length}):</strong>
                <div style="margin-top: 8px; padding-left: 12px;">`;
            
            // Mostrar solo los primeros 3
            errorsPorTipo.invalidos.slice(0, maxMostrar).forEach(err => {
                contenidoErrores += `<div style="margin-bottom: 4px; font-size: 13px;">• ${err}</div>`;
            });
            
            // Si hay más, mostrar contador
            if (errorsPorTipo.invalidos.length > maxMostrar) {
                const restantes = errorsPorTipo.invalidos.length - maxMostrar;
                contenidoErrores += `<div style="margin-top: 8px; color: #666; font-style: italic;">
                    ... y ${restantes} teléfono(s) inválido(s) más (formato debe ser +593XXXXXXXXX)
                </div>`;
            }
            
            contenidoErrores += `</div></div>`;
        }
        
        // Mostrar otros errores
        if (errorsPorTipo.otros.length > 0) {
            contenidoErrores += `<div style="margin-bottom: 16px;">
                <strong style="color: #dc2626;">⚠️ Otros Errores (${errorsPorTipo.otros.length}):</strong>
                <div style="margin-top: 8px; padding-left: 12px;">`;
            
            // Mostrar solo los primeros 3
            errorsPorTipo.otros.slice(0, maxMostrar).forEach(err => {
                contenidoErrores += `<div style="margin-bottom: 4px; font-size: 13px;">• ${err}</div>`;
            });
            
            // Si hay más, mostrar contador
            if (errorsPorTipo.otros.length > maxMostrar) {
                const restantes = errorsPorTipo.otros.length - maxMostrar;
                contenidoErrores += `<div style="margin-top: 8px; color: #666; font-style: italic;">
                    ... y ${restantes} error(es) más
                </div>`;
            }
            
            contenidoErrores += `</div></div>`;
        }
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 24px;
            border-radius: 12px;
            max-width: 650px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        `;
        
        content.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: #dc2626;">
                <i class="fas fa-exclamation-triangle"></i> Resumen de importación
            </h3>
            <div style="font-size: 14px; color: #666; margin-bottom: 16px;">
                Total de errores detectados: <strong>${errores.length}</strong>
            </div>
            <div style="background: #fef2f2; border-left: 3px solid #dc2626; padding: 16px; border-radius: 4px; max-height: 400px; overflow-y: auto;">
                ${contenidoErrores}
            </div>
            <div style="margin-top: 16px; padding: 12px; background: #f3f4f6; border-radius: 6px; font-size: 13px; color: #666;">
                💡 <strong>Recuerda:</strong> Los teléfonos deben tener el formato <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 3px;">+593XXXXXXXXX</code> 
                donde los 9 dígitos siguientes deben empezar con 9.
            </div>
            <button id="cerrarErrores" style="
                margin-top: 20px;
                width: 100%;
                padding: 12px;
                background: #dc2626;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                font-size: 14px;
            ">
                Cerrar
            </button>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        const btnCerrar = content.querySelector('#cerrarErrores');
        btnCerrar.onclick = () => {
            modal.remove();
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 DOM cargado - Inicializando SubirArchivo');
        setTimeout(() => {
            window.SubirArchivo.init();
        }, 100);
    });
} else {
    console.log('🚀 DOM ya listo - Inicializando SubirArchivo inmediatamente');
    setTimeout(() => {
        window.SubirArchivo.init();
    }, 100);
}

console.log('✅ subir_archivo.js cargado');