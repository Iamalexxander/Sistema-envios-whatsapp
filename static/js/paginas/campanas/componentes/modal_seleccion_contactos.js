console.log('Cargando modal_seleccion_contactos.js...');

window.ModalSeleccionContactos = {
    inicializado: false,
    contactosSeleccionados: new Set(),
    todosLosContactos: [],
    contactosFiltrados: [],
    
    init() {
        if (this.inicializado) return;
        
        console.log('Configurando ModalSeleccionContactos...');
        this.configurarEventos();
        this.inicializado = true;
        console.log('ModalSeleccionContactos inicializado');
    },
    
    configurarEventos() {
        const btnCerrar = document.getElementById('closeModalSeleccion');
        const btnCancelar = document.getElementById('btnCancelarSeleccion');
        const btnConfirmar = document.getElementById('btnConfirmarSeleccion');
        const overlay = document.querySelector('.modal-seleccion-overlay');
        const busqueda = document.getElementById('busquedaModalContactos');
        const selectAll = document.getElementById('selectAllModal');
        
        if (btnCerrar) {
            btnCerrar.addEventListener('click', () => this.cerrar());
        }
        
        if (btnCancelar) {
            btnCancelar.addEventListener('click', () => this.cerrar());
        }
        
        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', () => this.confirmarSeleccion());
        }
        
        if (overlay) {
            overlay.addEventListener('click', () => this.cerrar());
        }
        
        if (busqueda) {
            busqueda.addEventListener('input', (e) => this.filtrarContactos(e.target.value));
        }
        
        if (selectAll) {
            selectAll.addEventListener('change', (e) => this.seleccionarTodos(e.target.checked));
        }
        
        // Delegación de eventos para checkboxes
        const tbody = document.getElementById('contactosModalBody');
        if (tbody) {
            tbody.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox') {
                    const id = e.target.getAttribute('data-id');
                    if (e.target.checked) {
                        this.contactosSeleccionados.add(id);
                    } else {
                        this.contactosSeleccionados.delete(id);
                    }
                    this.actualizarContador();
                }
            });
            
            // Clic en fila para seleccionar
            tbody.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                if (row && e.target.type !== 'checkbox') {
                    const checkbox = row.querySelector('input[type="checkbox"]');
                    if (checkbox) {
                        checkbox.checked = !checkbox.checked;
                        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            });
        }
        
        // ESC para cerrar
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('modalSeleccionContactos');
            if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
                this.cerrar();
            }
        });
    },
    
    async abrir() {
        try {
            // Cargar contactos desde la API
            const response = await fetch('/contactos/api');
            const data = await response.json();
            
            if (data.success) {
                this.todosLosContactos = data.data || [];
                this.contactosFiltrados = [...this.todosLosContactos];
                this.contactosSeleccionados.clear();
                
                this.renderizarContactos();
                
                const modal = document.getElementById('modalSeleccionContactos');
                if (modal) {
                    modal.style.display = 'flex';
                }
                
                // Limpiar búsqueda
                const busqueda = document.getElementById('busquedaModalContactos');
                if (busqueda) busqueda.value = '';
                
                this.actualizarContador();
            }
        } catch (error) {
            console.error('Error cargando contactos:', error);
            mostrarNotificacion('Error cargando contactos', 'error');
        }
    },
    
    cerrar() {
        const modal = document.getElementById('modalSeleccionContactos');
        if (modal) {
            modal.style.display = 'none';
        }
        this.contactosSeleccionados.clear();
    },
    
    filtrarContactos(termino) {
        const terminoLower = termino.toLowerCase().trim();
        
        if (!terminoLower) {
            this.contactosFiltrados = [...this.todosLosContactos];
        } else {
            this.contactosFiltrados = this.todosLosContactos.filter(c => 
                (c.nombre && c.nombre.toLowerCase().includes(terminoLower)) ||
                (c.telefono && c.telefono.includes(terminoLower))
            );
        }
        
        this.renderizarContactos();
    },
    
    renderizarContactos() {
        const tbody = document.getElementById('contactosModalBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (this.contactosFiltrados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 2rem; color: #6b7280;">
                        No se encontraron contactos
                    </td>
                </tr>
            `;
            return;
        }
        
        this.contactosFiltrados.forEach(contacto => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>
                    <input type="checkbox" data-id="${contacto.id}" ${this.contactosSeleccionados.has(contacto.id) ? 'checked' : ''}>
                </td>
                <td>${contacto.nombre || 'Sin nombre'}</td>
                <td style="font-family: monospace;">${contacto.telefono || 'N/A'}</td>
            `;
            tbody.appendChild(fila);
        });
        
        this.actualizarCheckboxTodos();
    },
    
    seleccionarTodos(seleccionar) {
        this.contactosFiltrados.forEach(contacto => {
            if (seleccionar) {
                this.contactosSeleccionados.add(contacto.id);
            } else {
                this.contactosSeleccionados.delete(contacto.id);
            }
        });
        
        this.renderizarContactos();
        this.actualizarContador();
    },
    
    actualizarCheckboxTodos() {
        const selectAll = document.getElementById('selectAllModal');
        if (!selectAll) return;
        
        const todosSeleccionados = this.contactosFiltrados.every(c => 
            this.contactosSeleccionados.has(c.id)
        );
        
        selectAll.checked = todosSeleccionados && this.contactosFiltrados.length > 0;
    },
    
    actualizarContador() {
        const seleccionadosModal = document.getElementById('seleccionadosModal');
        const totalSeleccionados = document.getElementById('totalSeleccionados');
        
        if (seleccionadosModal) {
            seleccionadosModal.textContent = this.contactosSeleccionados.size;
        }
        
        if (totalSeleccionados) {
            totalSeleccionados.textContent = this.contactosSeleccionados.size;
        }
    },
    
    confirmarSeleccion() {
        if (this.contactosSeleccionados.size === 0) {
            mostrarNotificacion('Debes seleccionar al menos un contacto', 'warning');
            return;
        }
        
        // Actualizar estadísticas en campañas
        if (window.CampanasApp) {
            window.CampanasApp.estadisticas.total = this.contactosSeleccionados.size;
            window.CampanasApp.estadisticas.recibidos = this.contactosSeleccionados.size;
            window.CampanasApp.estadisticas.enviados = 0;
            window.CampanasApp.estadisticas.fallidos = 0;
            
            // Guardar IDs seleccionados
            window.CampanasApp.contactosEspecificos = Array.from(this.contactosSeleccionados);
            
            window.actualizarEstadisticas();
            window.calcularDuracion();
        }
        
        mostrarNotificacion(`${this.contactosSeleccionados.size} persona(s) seleccionada(s)`, 'success');
        this.cerrar();
    }
};

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.ModalSeleccionContactos.init();
    }, 100);
});

console.log('modal_seleccion_contactos.js cargado');