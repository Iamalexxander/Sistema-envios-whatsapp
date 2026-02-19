// editor_plantillas.js - Componente editor de plantillas
console.log('✏️ Cargando editor_plantillas.js...');

window.EditorPlantillas = {
    inicializado: false,
    modoEdicion: false,
    plantillaActual: null,

    init() {
        if (this.inicializado) return;
        
        console.log('🚀 Inicializando Editor de Plantillas...');
        
        this.configurarEventListeners();
        this.cargarCategorias();
        
        this.inicializado = true;
        console.log('✅ Editor de Plantillas inicializado');
    },

    configurarEventListeners() {
        // Botones de modo
        const editBtn = document.getElementById('editTemplateBtn');
        const viewBtn = document.getElementById('viewTemplateBtn');
        const cancelBtn = document.getElementById('cancelEditBtn');

        if (editBtn) {
            editBtn.addEventListener('click', () => this.activarModoEdicion());
        }

        if (viewBtn) {
            viewBtn.addEventListener('click', () => this.activarModoVista());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelarEdicion());
        }

        // Botón guardar
        const saveBtn = document.getElementById('saveTemplateBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.guardarPlantilla());
        }

        // Botones de acción
        const copyBtn = document.getElementById('copyTemplateBtn');
        const deleteBtn = document.getElementById('deleteTemplateBtn');

        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copiarPlantilla());
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.eliminarPlantilla());
        }

        // Variables rápidas
        const variableBtns = document.querySelectorAll('.variable-btn');
        variableBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.insertarVariable(e.target.dataset.variable);
            });
        });

        // Contador de caracteres en tiempo real
        const contentInput = document.getElementById('templateContentInput');
        if (contentInput) {
            contentInput.addEventListener('input', () => {
                this.actualizarContadores();
                this.actualizarVistaPrevia();
            });
        }

        // Botón gestionar categorías
        const btnCategorias = document.getElementById('btnManageCategorias');
        if (btnCategorias) {
            btnCategorias.addEventListener('click', () => {
                if (window.ModalCategorias) {
                    window.ModalCategorias.abrir();
                }
            });
        }
    },

    async cargarCategorias() {
        try {
            const response = await window.PlantillasAPI.obtenerCategorias();
            
            if (response.success) {
                window.PlantillasApp.categorias = response.data;
                this.actualizarSelectorCategorias(response.data);
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
        }
    },

    actualizarSelectorCategorias(categorias) {
        const selector = document.getElementById('templateCategorySelect');
        if (!selector) return;

        // Mantener valor seleccionado
        const valorActual = selector.value;

        selector.innerHTML = '<option value="">Selecciona una categoría</option>';
        
        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.nombre;
            option.textContent = categoria.nombre;
            selector.appendChild(option);
        });

        // Restaurar valor si existe
        if (valorActual) {
            selector.value = valorActual;
        }
    },

    mostrarPlantilla(plantilla) {
        this.plantillaActual = plantilla;
        
        // Actualizar modo vista
        document.getElementById('templateTitle').textContent = plantilla.nombre || 'Nueva Plantilla';
        document.getElementById('templateCreatedDate').textContent = `Creado ${plantilla.fecha_creacion}`;
        document.getElementById('templateUsageCount').textContent = `${plantilla.usos} usos`;
        
        // Contenido
        document.getElementById('templateContentDisplay').textContent = plantilla.contenido || 'Sin contenido';
        
        // Estadísticas
        const charCount = plantilla.contenido.length;
        const varCount = window.contarVariables(plantilla.contenido);
        
        document.getElementById('templateCharCount').textContent = `${charCount} caracteres`;
        document.getElementById('templateVarCount').textContent = `${varCount} variables`;
        
        // Información adicional
        const categoryBadge = document.getElementById('templateCategoryBadge');
        categoryBadge.textContent = plantilla.categoria || 'Sin categoría';
        categoryBadge.className = `template-category-badge ${(plantilla.categoria || '').toLowerCase()}`;
        
        document.getElementById('templateCreationDate').textContent = plantilla.fecha_creacion;
        document.getElementById('templateUsageNumber').textContent = plantilla.usos;
        
        // Prellenar campos de edición
        document.getElementById('templateNameInput').value = plantilla.nombre || '';
        document.getElementById('templateCategorySelect').value = plantilla.categoria || '';
        document.getElementById('templateContentInput').value = plantilla.contenido || '';
        
        // Activar modo vista
        this.activarModoVista();
    },

    activarModoEdicion() {
        this.modoEdicion = true;
        document.getElementById('templateViewMode').classList.add('hidden');
        document.getElementById('templateEditMode').classList.remove('hidden');
        this.actualizarContadores();
        
        // Focus en nombre si es plantilla nueva
        if (!this.plantillaActual || this.plantillaActual.id === 'nuevo') {
            const nameInput = document.getElementById('templateNameInput');
            if (nameInput) {
                nameInput.focus();
            }
        }
    },

    activarModoVista() {
        this.modoEdicion = false;
        document.getElementById('templateEditMode').classList.add('hidden');
        document.getElementById('templateViewMode').classList.remove('hidden');
    },

    cancelarEdicion() {
        if (this.plantillaActual && this.plantillaActual.id === 'nuevo') {
            // Si es plantilla nueva, volver al estado vacío
            document.getElementById('templateWorkspace').classList.add('hidden');
            document.getElementById('emptyState').classList.remove('hidden');
            window.PlantillasApp.plantillaSeleccionada = null;
        } else {
            // Si es edición, restaurar datos originales
            this.mostrarPlantilla(this.plantillaActual);
        }
    },

    async guardarPlantilla() {
        const nombre = document.getElementById('templateNameInput').value.trim();
        const categoria = document.getElementById('templateCategorySelect').value;
        const contenido = document.getElementById('templateContentInput').value.trim();
        
        if (!nombre) {
            window.mostrarNotificacion('El nombre es requerido', 'error');
            return;
        }

        if (!contenido) {
            window.mostrarNotificacion('El contenido es requerido', 'error');
            return;
        }

        try {
            const datos = { nombre, categoria, contenido };
            let response;

            if (this.plantillaActual && this.plantillaActual.id !== 'nuevo') {
                // Actualizar plantilla existente
                response = await window.PlantillasAPI.actualizar(this.plantillaActual.id, datos);
            } else {
                // Crear nueva plantilla
                response = await window.PlantillasAPI.crear(datos);
            }

            if (response.success) {
                window.mostrarNotificacion(response.message, 'success');
                
                // Actualizar estado
                this.plantillaActual = response.data;
                window.PlantillasApp.plantillaSeleccionada = response.data;
                
                // Actualizar interfaz
                this.mostrarPlantilla(response.data);
                
                // Recargar biblioteca
                if (window.BibliotecaPlantillas) {
                    await window.BibliotecaPlantillas.recargar();
                    window.BibliotecaPlantillas.marcarSeleccionada(response.data.id);
                }
            } else {
                window.mostrarNotificacion(response.error, 'error');
            }
        } catch (error) {
            console.error('Error guardando plantilla:', error);
            window.mostrarNotificacion('Error al guardar plantilla', 'error');
        }
    },

    async copiarPlantilla() {
        if (!this.plantillaActual) return;

        const datos = {
            nombre: `${this.plantillaActual.nombre} (Copia)`,
            categoria: this.plantillaActual.categoria,
            contenido: this.plantillaActual.contenido
        };

        try {
            const response = await window.PlantillasAPI.crear(datos);

            if (response.success) {
                window.mostrarNotificacion('Plantilla copiada exitosamente', 'success');
                
                // Recargar biblioteca
                if (window.BibliotecaPlantillas) {
                    await window.BibliotecaPlantillas.recargar();
                }
                
                // Seleccionar nueva plantilla
                window.seleccionarPlantilla(response.data);
            } else {
                window.mostrarNotificacion(response.error, 'error');
            }
        } catch (error) {
            console.error('Error copiando plantilla:', error);
            window.mostrarNotificacion('Error al copiar plantilla', 'error');
        }
    },

async eliminarPlantilla() {
    if (!this.plantillaActual || this.plantillaActual.id === 'nuevo') return;

    const confirmar = await window.mostrarConfirmacion({
        titulo: 'Eliminar plantilla',
        mensaje: '¿Estás seguro de que deseas eliminar esta plantilla? Esta acción no se puede deshacer.',
        tipo: 'danger',
        textoConfirmar: 'Eliminar',
        textoCancelar: 'Cancelar'
    });

    if (!confirmar) {
        return;
    }

    try {
        const response = await window.PlantillasAPI.eliminar(this.plantillaActual.id);

        if (response.success) {
            window.mostrarNotificacion('Plantilla eliminada exitosamente', 'success');
            
            // Volver al estado vacío
            document.getElementById('templateWorkspace').classList.add('hidden');
            document.getElementById('emptyState').classList.remove('hidden');
            window.PlantillasApp.plantillaSeleccionada = null;
            
            // Recargar biblioteca
            if (window.BibliotecaPlantillas) {
                await window.BibliotecaPlantillas.recargar();
            }
        } else {
            window.mostrarNotificacion(response.error, 'error');
        }
    } catch (error) {
        console.error('Error eliminando plantilla:', error);
        window.mostrarNotificacion('Error al eliminar plantilla', 'error');
    }
},

insertarVariable(variable) {
    const textarea = document.getElementById('templateContentInput');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const newText = text.substring(0, start) + variable + text.substring(end);
    textarea.value = newText;
    
    // Mover cursor después de la variable insertada
    const newCursorPos = start + variable.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();
    
    this.actualizarContadores();
    this.actualizarVistaPrevia();
},

actualizarContadores() {
    const contenido = document.getElementById('templateContentInput').value;
    const charCount = contenido.length;
    
    const counter = document.getElementById('charCounter');
    if (counter) {
        counter.textContent = `${charCount} caracteres`;
    }
},

actualizarVistaPrevia() {
    if (!window.VistaPrevia) return;

    const contenido = document.getElementById('templateContentInput').value;
    window.VistaPrevia.actualizar(contenido);
}
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.EditorPlantillas.init();
    }, 100);
});

console.log('✅ editor_plantillas.js cargado');