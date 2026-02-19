// modal_categorias.js - Componente modal de gestión de categorías
console.log('📝 Cargando modal_categorias.js...');

window.ModalCategorias = {
    inicializado: false,
    categorias: [],

    init() {
        if (this.inicializado) return;
        
        console.log('🚀 Inicializando Modal de Categorías...');
        
        this.configurarEventListeners();
        
        this.inicializado = true;
        console.log('✅ Modal de Categorías inicializado');
    },

    configurarEventListeners() {
        // Botón cerrar modal
        const closeBtn = document.getElementById('closeCategoriaModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.cerrar());
        }

        // Cerrar al hacer clic fuera del modal
        const overlay = document.getElementById('modalCategorias');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.cerrar();
                }
            });
        }

        // Botón agregar categoría
        const addBtn = document.getElementById('addCategoryBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.agregarCategoria());
        }

        // Enter en el input para agregar
        const nameInput = document.getElementById('newCategoryName');
        if (nameInput) {
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.agregarCategoria();
                }
            });
        }

        // Escapar para cerrar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.estaAbierto()) {
                this.cerrar();
            }
        });
    },

    async abrir() {
        const modal = document.getElementById('modalCategorias');
        if (!modal) return;

        await this.cargarCategorias();
        modal.classList.remove('hidden');
        
        // Focus en el input de nombre
        const nameInput = document.getElementById('newCategoryName');
        if (nameInput) {
            setTimeout(() => nameInput.focus(), 100);
        }
    },

    cerrar() {
        const modal = document.getElementById('modalCategorias');
        if (modal) {
            modal.classList.add('hidden');
        }

        // Limpiar formulario
        this.limpiarFormulario();
    },

    estaAbierto() {
        const modal = document.getElementById('modalCategorias');
        return modal && !modal.classList.contains('hidden');
    },

    async cargarCategorias() {
        try {
            const response = await window.PlantillasAPI.obtenerCategorias();
            
            if (response.success) {
                this.categorias = response.data;
                this.renderizarCategorias();
            } else {
                this.mostrarErrorCategorias('Error al cargar categorías');
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
            this.mostrarErrorCategorias('Error de conexión');
        }
    },

    renderizarCategorias() {
        const lista = document.getElementById('categoriesList');
        if (!lista) return;

        if (this.categorias.length === 0) {
            this.mostrarVacioCategorias();
            return;
        }

        lista.innerHTML = '';

        this.categorias.forEach(categoria => {
            const item = this.crearItemCategoria(categoria);
            lista.appendChild(item);
        });
    },

    crearItemCategoria(categoria) {
        const item = document.createElement('div');
        item.className = 'category-item';
        
        item.innerHTML = `
            <div class="category-info">
                <div class="category-color" style="background-color: ${categoria.color}"></div>
                <span class="category-name">${categoria.nombre}</span>
            </div>
            <div class="category-actions">
                <button class="btn-small btn-danger" onclick="window.ModalCategorias.eliminarCategoria(${categoria.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Eliminar
                </button>
            </div>
        `;

        return item;
    },

    async agregarCategoria() {
        const nameInput = document.getElementById('newCategoryName');
        const colorInput = document.getElementById('newCategoryColor');

        if (!nameInput || !colorInput) return;

        const nombre = nameInput.value.trim();
        const color = colorInput.value;

        if (!nombre) {
            window.mostrarNotificacion('El nombre de la categoría es requerido', 'error');
            nameInput.focus();
            return;
        }

        // Verificar si ya existe
        if (this.categorias.some(c => c.nombre.toLowerCase() === nombre.toLowerCase())) {
            window.mostrarNotificacion('Ya existe una categoría con ese nombre', 'error');
            nameInput.focus();
            return;
        }

        try {
            const response = await window.PlantillasAPI.crearCategoria({ nombre, color });

            if (response.success) {
                window.mostrarNotificacion('Categoría creada exitosamente', 'success');
                
                this.limpiarFormulario();
                await this.cargarCategorias();
                
                // Actualizar selector en el editor
                if (window.EditorPlantillas) {
                    await window.EditorPlantillas.cargarCategorias();
                }
            } else {
                window.mostrarNotificacion(response.error, 'error');
            }
        } catch (error) {
            console.error('Error creando categoría:', error);
            window.mostrarNotificacion('Error al crear categoría', 'error');
        }
    },

    async eliminarCategoria(categoriaId) {
        const categoria = this.categorias.find(c => c.id === categoriaId);
        if (!categoria) return;

        if (!confirm(`¿Estás seguro de que deseas eliminar la categoría "${categoria.nombre}"?`)) {
            return;
        }

        try {
            const response = await window.PlantillasAPI.eliminarCategoria(categoriaId);

            if (response.success) {
                window.mostrarNotificacion('Categoría eliminada exitosamente', 'success');
                
                await this.cargarCategorias();
                
                // Actualizar selector en el editor
                if (window.EditorPlantillas) {
                    await window.EditorPlantillas.cargarCategorias();
                }
            } else {
                window.mostrarNotificacion(response.error, 'error');
            }
        } catch (error) {
            console.error('Error eliminando categoría:', error);
            window.mostrarNotificacion('Error al eliminar categoría', 'error');
        }
    },

    limpiarFormulario() {
        const nameInput = document.getElementById('newCategoryName');
        const colorInput = document.getElementById('newCategoryColor');

        if (nameInput) nameInput.value = '';
        if (colorInput) colorInput.value = '#25d366';
    },

    mostrarVacioCategorias() {
        const lista = document.getElementById('categoriesList');
        if (!lista) return;

        lista.innerHTML = `
            <div class="categories-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
                <h4>Sin categorías</h4>
                <p>Agrega tu primera categoría usando el formulario de arriba</p>
            </div>
        `;
    },

    mostrarErrorCategorias(mensaje) {
        const lista = document.getElementById('categoriesList');
        if (!lista) return;

        lista.innerHTML = `
            <div class="categories-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <h4>Error</h4>
                <p>${mensaje}</p>
            </div>
        `;
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.ModalCategorias.init();
    }, 200);
});

console.log('✅ modal_categorias.js cargado');