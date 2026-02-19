console.log('📋 Cargando contactos.js...');

// ===============================================
// INTEGRACIÓN CON WHATSAPP STATUS
// ===============================================
// El bloqueo/desbloqueo de funcionalidades se maneja automáticamente
// mediante whatsapp_feature_lock.js basado en el estado de conexión.
// No es necesario código adicional aquí.
// ===============================================

// Variables globales para el módulo de contactos
window.ContactosApp = {
    contactos: [],
    contactosFiltrados: [],
    contactosPorPagina: 10,
    paginaActual: 1,
    contactoSeleccionado: null,
    inicializado: false
};

// Funciones de utilidad
function mostrarNotificacion(mensaje, tipo = 'info') {
    const existente = document.querySelector('.notificacion-contactos');
    if (existente) {
        existente.remove();
    }
    
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion-contactos notificacion-${tipo}`;
    notificacion.textContent = mensaje;
    
    Object.assign(notificacion.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '6px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        maxWidth: '300px'
    });
    
    const colores = {
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    notificacion.style.background = colores[tipo] || colores.info;
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.remove();
        }
    }, 3000);
    
    notificacion.addEventListener('click', () => {
        notificacion.remove();
    });
}

// Cargar contactos desde el servidor
async function cargarContactos() {
    try {
        const response = await fetch('/contactos/api');
        const data = await response.json();
        
        if (data.success) {
            window.ContactosApp.contactos = data.data || [];
            window.ContactosApp.contactosFiltrados = [...window.ContactosApp.contactos];
            
            if (typeof actualizarTabla === 'function') {
                actualizarTabla();
            }
            
            if (typeof actualizarEstadisticas === 'function') {
                actualizarEstadisticas(data.estadisticas);
            }
            
            console.log('✅ Contactos cargados:', window.ContactosApp.contactos.length);
        } else {
            throw new Error(data.message || 'Error cargando contactos');
        }
    } catch (error) {
        console.error('❌ Error cargando contactos:', error);
        mostrarNotificacion('Error cargando contactos', 'error');
    }
}

// Crear nuevo contacto
async function crearContacto(datos) {
    try {
        const response = await fetch('/contactos/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarNotificacion('Contacto creado exitosamente', 'success');
            await cargarContactos();
            return true;
        } else {
            mostrarNotificacion(result.message || 'Error creando contacto', 'error');
            return false;
        }
    } catch (error) {
        console.error('❌ Error creando contacto:', error);
        mostrarNotificacion('Error interno del servidor', 'error');
        return false;
    }
}

// Editar contacto existente
async function editarContacto(id, datos) {
    try {
        const response = await fetch(`/contactos/api/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarNotificacion('Contacto actualizado exitosamente', 'success');
            await cargarContactos();
            return true;
        } else {
            mostrarNotificacion(result.message || 'Error editando contacto', 'error');
            return false;
        }
    } catch (error) {
        console.error('❌ Error editando contacto:', error);
        mostrarNotificacion('Error interno del servidor', 'error');
        return false;
    }
}

// Eliminar contacto - VERSIÓN CORREGIDA
async function eliminarContacto(id) {
    try {
        // Verificar si existe el modal de confirmación global
        const tieneModalGlobal = typeof window.mostrarConfirmacion === 'function';
        
        let confirmar;
        
        if (tieneModalGlobal) {
            // Usar modal personalizado
            confirmar = await window.mostrarConfirmacion({
                titulo: 'Eliminar contacto',
                mensaje: '¿Estás seguro de que quieres eliminar este contacto? Esta acción no se puede deshacer.',
                tipo: 'danger',
                textoConfirmar: 'Eliminar',
                textoCancelar: 'Cancelar'
            });
        } else {
            // Fallback a confirm nativo
            confirmar = confirm('¿Estás seguro de que quieres eliminar este contacto?');
        }
        
        if (!confirmar) {
            console.log('Usuario canceló la eliminación');
            return false;
        }
        
        console.log('Eliminando contacto:', id);
        
        const response = await fetch(`/contactos/api/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarNotificacion('Contacto eliminado exitosamente', 'success');
            await cargarContactos();
            return true;
        } else {
            mostrarNotificacion(result.message || 'Error eliminando contacto', 'error');
            return false;
        }
    } catch (error) {
        console.error('❌ Error eliminando contacto:', error);
        mostrarNotificacion('Error interno del servidor', 'error');
        return false;
    }
}

// Filtrar contactos
function filtrarContactos() {
    const app = window.ContactosApp;
    const busqueda = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    app.contactosFiltrados = app.contactos.filter(contacto => {
        const coincideBusqueda = !busqueda || 
            (contacto.nombre && contacto.nombre.toLowerCase().includes(busqueda)) ||
            (contacto.telefono && contacto.telefono.toLowerCase().includes(busqueda)) ||
            (contacto.email && contacto.email.toLowerCase().includes(busqueda));
        
        return coincideBusqueda;
    });
    
    app.paginaActual = 1;
    
    if (typeof actualizarTabla === 'function') {
        actualizarTabla();
    }
}

// Inicialización del módulo
function inicializarContactos() {
    const app = window.ContactosApp;
    
    if (app.inicializado) return;
    
    console.log('🚀 Inicializando módulo de contactos...');
    
    // Configurar eventos de búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filtrarContactos);
    }
    
    // Configurar botón de agregar contacto
    const btnAgregar = document.getElementById('btnAgregarContacto');
    if (btnAgregar) {
        btnAgregar.addEventListener('click', () => {
            if (typeof abrirModal === 'function') {
                abrirModal();
            }
        });
    }
    
    // Configurar botón de descargar plantilla
    const btnDownload = document.getElementById('btnDownloadTemplate');
    if (btnDownload) {
        btnDownload.addEventListener('click', descargarPlantilla);
    }
    
    // Cargar datos iniciales
    cargarContactos();
    
    app.inicializado = true;
    console.log('✅ Módulo de contactos inicializado correctamente');
}

// Event listeners principales
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado, inicializando contactos...');
    
    setTimeout(() => {
        inicializarContactos();
        
        // Verificar componentes
        const componentesRequeridos = [
            'TablaContactos',
            'ModalContacto',
            'SubirArchivo'
        ];
        
        componentesRequeridos.forEach(componente => {
            if (window[componente] && window[componente].inicializado) {
                console.log(`✅ Componente ${componente} cargado`);
            } else {
                console.warn(`⚠️ Componente ${componente} no encontrado`);
            }
        });
        
    }, 100);
});

// Exportar funciones globales
window.crearContacto = crearContacto;
window.editarContacto = editarContacto;
window.eliminarContacto = eliminarContacto;
window.filtrarContactos = filtrarContactos;
window.cargarContactos = cargarContactos;
window.mostrarNotificacion = mostrarNotificacion;

console.log('✅ contactos.js cargado completamente');