// biblioteca_plantillas.js - Componente de biblioteca de plantillas
console.log('📚 Cargando biblioteca_plantillas.js...');

window.BibliotecaPlantillas = {
    inicializado: false,
    plantillas: [],
    filtroActual: '',

    init() {
        if (this.inicializado) return;
        
        console.log('🚀 Inicializando Biblioteca de Plantillas...');
        
        this.configurarEventListeners();
        this.cargarPlantillas();
        
        this.inicializado = true;
        console.log('✅ Biblioteca de Plantillas inicializada');
    },

    configurarEventListeners() {
        // Búsqueda en tiempo real
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filtrarPlantillas(e.target.value);
            });
        }
    },

    async cargarPlantillas() {
        try {
            this.mostrarCargando();
            
            const response = await window.PlantillasAPI.obtenerTodas();
            
            if (response.success) {
                this.plantillas = response.data;
                this.renderizarPlantillas(this.plantillas);
                window.PlantillasApp.plantillas = this.plantillas;
            } else {
                this.mostrarError('Error al cargar plantillas');
            }
        } catch (error) {
            console.error('Error cargando plantillas:', error);
            this.mostrarError('Error de conexión');
        }
    },

    async filtrarPlantillas(termino) {
        this.filtroActual = termino;
        
        if (!termino.trim()) {
            this.renderizarPlantillas(this.plantillas);
            return;
        }

        try {
            const response = await window.PlantillasAPI.buscar(termino);
            
            if (response.success) {
                this.renderizarPlantillas(response.data);
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
        }
    },

    renderizarPlantillas(plantillas) {
        const grid = document.getElementById('templatesGrid');
        if (!grid) return;

        this.ocultarCargando();

        if (plantillas.length === 0) {
            this.mostrarVacio();
            return;
        }

        grid.innerHTML = '';
        
        plantillas.forEach(plantilla => {
            const card = this.crearTarjetaPlantilla(plantilla);
            grid.appendChild(card);
        });
    },

    crearTarjetaPlantilla(plantilla) {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.dataset.templateId = plantilla.id;
        
        const preview = plantilla.contenido.length > 100 
            ? plantilla.contenido.substring(0, 100) + '...'
            : plantilla.contenido;

        const variables = window.extraerVariables(plantilla.contenido);
        const variablesTags = variables.slice(0, 3).map(v => 
            `<span class="variable-tag">_${v}_</span>`
        ).join('');

        card.innerHTML = `
            <div class="template-header">
                <span class="template-category ${plantilla.categoria.toLowerCase()}">${plantilla.categoria}</span>
                <span class="template-usage">${plantilla.usos} usos</span>
            </div>
            <div class="template-info">
                <h3 class="template-name">${plantilla.nombre}</h3>
                <p class="template-preview">${preview}</p>
            </div>
            <div class="template-footer">
                <div class="template-date">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="date-icon">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>${plantilla.fecha_creacion}</span>
                </div>
                <div class="template-variables">
                    ${variablesTags}
                    ${variables.length > 3 ? `<span class="variable-tag">+${variables.length - 3}</span>` : ''}
                </div>
            </div>
        `;
        
        // Event listener para selección
        card.addEventListener('click', () => {
            this.seleccionarPlantilla(plantilla);
        });
        
        return card;
    },

    seleccionarPlantilla(plantilla) {
        // Llamar a la función global
        window.seleccionarPlantilla(plantilla);
    },

    marcarSeleccionada(plantillaId) {
        // Remover selección anterior
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Marcar nueva selección
        const card = document.querySelector(`[data-template-id="${plantillaId}"]`);
        if (card) {
            card.classList.add('selected');
        }
    },

    mostrarCargando() {
        const loadingState = document.getElementById('loadingState');
        const grid = document.getElementById('templatesGrid');
        
        if (loadingState) loadingState.classList.remove('hidden');
        if (grid) grid.style.display = 'none';
    },

    ocultarCargando() {
        const loadingState = document.getElementById('loadingState');
        const grid = document.getElementById('templatesGrid');
        
        if (loadingState) loadingState.classList.add('hidden');
        if (grid) grid.style.display = 'grid';
    },

    mostrarVacio() {
        const grid = document.getElementById('templatesGrid');
        if (!grid) return;

        const mensaje = this.filtroActual 
            ? `No se encontraron plantillas para "${this.filtroActual}"`
            : 'No hay plantillas disponibles';

        grid.innerHTML = `
            <div class="templates-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <h3>${this.filtroActual ? 'Sin resultados' : 'Sin plantillas'}</h3>
                <p>${mensaje}</p>
            </div>
        `;
    },

    mostrarError(mensaje) {
        const grid = document.getElementById('templatesGrid');
        if (!grid) return;

        this.ocultarCargando();

        grid.innerHTML = `
            <div class="templates-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <h3>Error</h3>
                <p>${mensaje}</p>
            </div>
        `;
    },

    // Recargar plantillas después de cambios
    async recargar() {
        await this.cargarPlantillas();
        
        // Mantener plantilla seleccionada si existe
        const app = window.PlantillasApp;
        if (app.plantillaSeleccionada) {
            this.marcarSeleccionada(app.plantillaSeleccionada.id);
        }
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.BibliotecaPlantillas.init();
    }, 50);
});

console.log('✅ biblioteca_plantillas.js cargado');