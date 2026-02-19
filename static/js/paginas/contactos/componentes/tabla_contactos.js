console.log('📊 Cargando tabla_contactos.js...');

window.TablaContactos = {
    inicializado: false,
    contactosSeleccionados: new Set(), // Mantener IDs seleccionados entre páginas
    
    init() {
        if (this.inicializado) return;
        
        console.log('🔧 Configurando componente TablaContactos...');
        
        this.configurarEventos();
        this.inicializado = true;
        
        console.log('✅ TablaContactos inicializado');
    },
    
    configurarEventos() {
        // Checkbox "Seleccionar todo"
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                this.seleccionarTodos(e.target.checked);
            });
        }
        
        // Botón de actualizar tabla
        const btnRefresh = document.getElementById('btnRefreshTable');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', () => {
                this.actualizarTabla();
            });
        }
        
        // Botón de eliminar seleccionados
        const btnDeleteSelected = document.getElementById('btnDeleteSelected');
        if (btnDeleteSelected) {
            btnDeleteSelected.addEventListener('click', () => {
                this.eliminarSeleccionados();
            });
        }
        
        // Delegación de eventos para botones de acción y checkboxes
        const tbody = document.getElementById('contactsTableBody');
        if (tbody) {
            // Detectar clics en botones de editar/eliminar
            tbody.addEventListener('click', (e) => {
                const target = e.target.closest('.edit-btn, .delete-btn');
                if (!target) return;
                
                const id = target.getAttribute('data-id');
                
                if (target.classList.contains('edit-btn')) {
                    this.editarContacto(id);
                } else if (target.classList.contains('delete-btn')) {
                    this.eliminarContacto(id);
                }
            });
            
            // Detectar cambios en checkboxes individuales
            tbody.addEventListener('change', (e) => {
                if (e.target.classList.contains('contact-checkbox')) {
                    const id = e.target.getAttribute('data-id');
                    
                    if (e.target.checked) {
                        this.contactosSeleccionados.add(id);
                    } else {
                        this.contactosSeleccionados.delete(id);
                    }
                    
                    this.actualizarBotonEliminar();
                }
            });
        }
        
        // Paginación
        const btnPrev = document.getElementById('btnPrevPage');
        const btnNext = document.getElementById('btnNextPage');
        
        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                this.cambiarPagina(window.ContactosApp.paginaActual - 1);
            });
        }
        
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                this.cambiarPagina(window.ContactosApp.paginaActual + 1);
            });
        }
    },
    
    seleccionarTodos(seleccionar) {
        const checkboxes = document.querySelectorAll('.contact-checkbox');
        
        if (seleccionar) {
            // Agregar todos los contactos visibles
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
                this.contactosSeleccionados.add(checkbox.getAttribute('data-id'));
            });
        } else {
            // Remover solo los visibles
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
                this.contactosSeleccionados.delete(checkbox.getAttribute('data-id'));
            });
        }
        
        this.actualizarBotonEliminar();
        console.log(`${seleccionar ? 'Seleccionados' : 'Deseleccionados'} contactos en página actual`);
    },
    
    actualizarBotonEliminar() {
        const btnDeleteSelected = document.getElementById('btnDeleteSelected');
        const selectedCount = document.getElementById('selectedCount');
        
        if (this.contactosSeleccionados.size > 0) {
            if (btnDeleteSelected) btnDeleteSelected.style.display = 'inline-flex';
            if (selectedCount) selectedCount.textContent = this.contactosSeleccionados.size;
        } else {
            if (btnDeleteSelected) btnDeleteSelected.style.display = 'none';
        }
        
        // Actualizar checkbox "Seleccionar todos"
        const selectAll = document.getElementById('selectAll');
        const checkboxes = document.querySelectorAll('.contact-checkbox');
        const visibleChecked = Array.from(checkboxes).filter(cb => cb.checked).length;
        
        if (selectAll && checkboxes.length > 0) {
            selectAll.checked = visibleChecked === checkboxes.length && checkboxes.length > 0;
        }
    },
    
    async eliminarSeleccionados() {
        if (this.contactosSeleccionados.size === 0) {
            mostrarNotificacion('No hay contactos seleccionados', 'warning');
            return;
        }
        
        const ids = Array.from(this.contactosSeleccionados);
        
        // CORREGIDO: Usar window.mostrarConfirmacion en lugar de confirmarAccion
        const confirmar = await window.mostrarConfirmacion({
            titulo: 'Eliminar contactos',
            mensaje: `¿Estás seguro de eliminar ${ids.length} contacto(s) seleccionado(s)? Esta acción no se puede deshacer.`,
            tipo: 'danger',
            textoConfirmar: 'Eliminar',
            textoCancelar: 'Cancelar'
        });
        
        if (!confirmar) {
            console.log('Usuario canceló la eliminación masiva');
            return;
        }
        
        const btnDeleteSelected = document.getElementById('btnDeleteSelected');
        if (btnDeleteSelected) {
            btnDeleteSelected.disabled = true;
            btnDeleteSelected.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        }
        
        let eliminados = 0;
        let errores = 0;
        
        for (const id of ids) {
            try {
                const response = await fetch(`/contactos/api/${id}`, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    eliminados++;
                    this.contactosSeleccionados.delete(id);
                } else {
                    errores++;
                }
            } catch (error) {
                console.error(`Error eliminando contacto ${id}:`, error);
                errores++;
            }
        }
        
        if (eliminados > 0) {
            mostrarNotificacion(`${eliminados} contacto(s) eliminado(s) exitosamente`, 'success');
        }
        
        if (errores > 0) {
            mostrarNotificacion(`${errores} contacto(s) no pudieron ser eliminados`, 'error');
        }
        
        await cargarContactos();
        
        const selectAll = document.getElementById('selectAll');
        if (selectAll) selectAll.checked = false;
        
        this.actualizarBotonEliminar();
        
        if (btnDeleteSelected) {
            btnDeleteSelected.disabled = false;
            btnDeleteSelected.innerHTML = '<i class="fas fa-trash-alt"></i> Eliminar Seleccionados (<span id="selectedCount">0</span>)';
        }
    },
    
    editarContacto(id) {
        const app = window.ContactosApp;
        const contacto = app.contactos.find(c => c.id === id);
        
        if (contacto && typeof abrirModal === 'function') {
            abrirModal(contacto);
        }
    },
    
    async eliminarContacto(id) {
        const app = window.ContactosApp;
        const contacto = app.contactos.find(c => c.id === id);
        const nombreContacto = contacto ? contacto.nombre : 'este contacto';
        
        // CORREGIDO: Usar window.mostrarConfirmacion en lugar de confirmarAccion
        const confirmar = await window.mostrarConfirmacion({
            titulo: 'Eliminar contacto',
            mensaje: `¿Estás seguro de eliminar a ${nombreContacto}? Esta acción no se puede deshacer.`,
            tipo: 'danger',
            textoConfirmar: 'Eliminar',
            textoCancelar: 'Cancelar'
        });
        
        if (!confirmar) {
            console.log('Usuario canceló la eliminación individual');
            return;
        }
        
        if (typeof eliminarContacto === 'function') {
            await eliminarContacto(id);
            // Remover de seleccionados si estaba
            this.contactosSeleccionados.delete(id);
            this.actualizarBotonEliminar();
        }
    },
    
    actualizarTabla() {
        if (typeof cargarContactos === 'function') {
            cargarContactos();
            mostrarNotificacion('Tabla actualizada', 'success');
        }
    },
    
    cambiarPagina(nuevaPagina) {
        const app = window.ContactosApp;
        const totalPaginas = Math.ceil(app.contactosFiltrados.length / app.contactosPorPagina);
        
        if (nuevaPagina < 1 || nuevaPagina > totalPaginas) {
            return;
        }
        
        app.paginaActual = nuevaPagina;
        this.renderizarTabla();
        this.actualizarPaginacion();
    },
    
    renderizarTabla() {
        const app = window.ContactosApp;
        const tbody = document.getElementById('contactsTableBody');
        
        if (!tbody) return;
        
        const inicio = (app.paginaActual - 1) * app.contactosPorPagina;
        const fin = inicio + app.contactosPorPagina;
        const contactosPagina = app.contactosFiltrados.slice(inicio, fin);
        
        tbody.innerHTML = '';
        
        if (contactosPagina.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <div class="empty-content">
                            <i class="fas fa-users"></i>
                            <h4>No se encontraron contactos</h4>
                            <p>Agrega tu primer contacto o ajusta los filtros de búsqueda</p>
                            <button class="btn-primary" onclick="window.abrirModal()">
                                <i class="fas fa-plus"></i> Agregar Contacto
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        contactosPagina.forEach(contacto => {
            const fila = this.crearFilaContacto(contacto);
            tbody.appendChild(fila);
            
            // Restaurar estado de selección
            const checkbox = fila.querySelector('.contact-checkbox');
            if (checkbox && this.contactosSeleccionados.has(contacto.id)) {
                checkbox.checked = true;
            }
        });
        
        this.actualizarInfoPaginacion();
        this.actualizarBotonEliminar();
    },
    
    crearFilaContacto(contacto) {
        const fila = document.createElement('tr');
        fila.setAttribute('data-id', contacto.id);
        
        // Iniciales para avatar
        let iniciales = '?';
        if (contacto.nombre) {
            const palabras = contacto.nombre.split(' ');
            if (palabras.length >= 2) {
                iniciales = palabras[0][0].toUpperCase() + palabras[palabras.length - 1][0].toUpperCase();
            } else {
                iniciales = contacto.nombre[0].toUpperCase();
            }
        }
        
        // Formatear fecha
        let fechaCreacion = 'N/A';
        if (contacto.creado_en) {
            try {
                const fecha = new Date(contacto.creado_en);
                fechaCreacion = fecha.toLocaleDateString('es-ES');
            } catch (e) {
                fechaCreacion = contacto.creado_en.toString().substring(0, 10);
            }
        }
        
        fila.innerHTML = `
            <td>
                <input type="checkbox" class="contact-checkbox" data-id="${contacto.id}">
            </td>
            <td class="contact-name">
                <div class="name-container">
                    <div class="avatar">${iniciales}</div>
                    <span class="name">${contacto.nombre || 'Sin nombre'}</span>
                </div>
            </td>
            <td class="contact-phone">
                <span class="phone">${contacto.telefono || 'N/A'}</span>
            </td>
            <td class="contact-date">${fechaCreacion}</td>
            <td class="contact-campaigns">${contacto.total_mensajes_enviados || 0}</td>
            <td class="contact-actions">
                <button class="btn-action edit-btn" data-id="${contacto.id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete-btn" data-id="${contacto.id}" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        return fila;
    },
    
    actualizarPaginacion() {
        const app = window.ContactosApp;
        const totalPaginas = Math.ceil(app.contactosFiltrados.length / app.contactosPorPagina);
        
        const btnPrev = document.getElementById('btnPrevPage');
        const btnNext = document.getElementById('btnNextPage');
        
        if (btnPrev) {
            btnPrev.disabled = app.paginaActual <= 1;
        }
        
        if (btnNext) {
            btnNext.disabled = app.paginaActual >= totalPaginas;
        }
        
        this.actualizarInfoPaginacion();
    },
    
    actualizarInfoPaginacion() {
        const app = window.ContactosApp;
        const total = app.contactosFiltrados.length;
        
        if (total === 0) {
            const startSpan = document.getElementById('showingStart');
            const endSpan = document.getElementById('showingEnd');
            const totalSpan = document.getElementById('totalContacts');
            
            if (startSpan) startSpan.textContent = '0';
            if (endSpan) endSpan.textContent = '0';
            if (totalSpan) totalSpan.textContent = '0';
            return;
        }
        
        const inicio = (app.paginaActual - 1) * app.contactosPorPagina + 1;
        const fin = Math.min(app.paginaActual * app.contactosPorPagina, total);
        
        const startSpan = document.getElementById('showingStart');
        const endSpan = document.getElementById('showingEnd');
        const totalSpan = document.getElementById('totalContacts');
        
        if (startSpan) startSpan.textContent = inicio;
        if (endSpan) endSpan.textContent = fin;
        if (totalSpan) totalSpan.textContent = total;
    }
};

// Función global para actualizar tabla
window.actualizarTabla = function() {
    if (window.TablaContactos && window.TablaContactos.renderizarTabla) {
        window.TablaContactos.renderizarTabla();
        window.TablaContactos.actualizarPaginacion();
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.TablaContactos.init();
    }, 50);
});

console.log('✅ tabla_contactos.js cargado');