// seleccion_destinatarios.js - Componente específico para selección de destinatarios
console.log('📊 Cargando seleccion_destinatarios.js...');

window.SeleccionDestinatarios = {
    inicializado: false,
    
    init() {
        if (this.inicializado) return;
        
        console.log('🔧 Configurando componente SeleccionDestinatarios...');
        
        this.configurarEventos();
        this.inicializado = true;
        
        console.log('✅ SeleccionDestinatarios inicializado');
    },
    
    configurarEventos() {
        // Selector de destinatarios
        const destinatariosSelect = document.getElementById('destinatarios-select');
        if (destinatariosSelect) {
            destinatariosSelect.addEventListener('change', (e) => {
                this.actualizarDestinatarios(e.target.value);
            });
        }
    },
    
    actualizarDestinatarios(valor) {
        const app = window.CampanasApp;
        if (!app || !app.contactosReales) return;
        
        let contactosSeleccionados = [];
        
        switch(valor) {
            case 'activos':
                contactosSeleccionados = app.contactosReales.filter(c => c.estado === 'activo');
                break;
            case 'todos':
                contactosSeleccionados = app.contactosReales;
                break;
            case 'grupo':
                // Por ahora usar activos para grupos específicos
                contactosSeleccionados = app.contactosReales.filter(c => c.estado === 'activo');
                break;
            default:
                contactosSeleccionados = app.contactosReales.filter(c => c.estado === 'activo');
        }
        
        const total = contactosSeleccionados.length;
        
        // Actualizar estadísticas globales solo si no hay campaña activa
        if (!app.campanaActiva) {
            app.estadisticas.total = total;
            app.estadisticas.recibidos = total;
            app.estadisticas.enviados = 0;
            app.estadisticas.fallidos = 0;
            app.estadisticas.tasaExito = 100;
        }
        
        // Actualizar estadísticas en la interfaz
        if (typeof window.actualizarEstadisticas === 'function') {
            window.actualizarEstadisticas();
        }
        
        // Calcular duración
        if (typeof window.calcularDuracion === 'function') {
            window.calcularDuracion();
        }
        
        console.log(`📊 Destinatarios actualizados: ${total} contactos (${valor})`);
        
        // Mostrar notificación informativa
        if (typeof window.mostrarNotificacion === 'function') {
            const mensaje = total > 0 
                ? `${total} contactos seleccionados para la campaña`
                : 'No hay contactos disponibles';
            window.mostrarNotificacion(mensaje, total > 0 ? 'info' : 'warning');
        }
    },
    
    // Función para actualizar el selector cuando cambien los contactos
    actualizarSelector() {
        const app = window.CampanasApp;
        const selector = document.getElementById('destinatarios-select');
        
        if (!selector || !app.contactosReales) return;
        
        const totalContactos = app.contactosReales.length;
        const contactosActivos = app.contactosReales.filter(c => c.estado === 'activo').length;
        const contactosInactivos = totalContactos - contactosActivos;
        
        selector.innerHTML = `
            <option value="activos">Contactos Activos (${contactosActivos})</option>
            <option value="todos">Todos los Contactos (${totalContactos})</option>
            <option value="grupo">Grupo Específico</option>
        `;
        
        // Trigger change para actualizar estadísticas
        this.actualizarDestinatarios(selector.value);
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar un poco para que se cargue el archivo principal
    setTimeout(() => {
        window.SeleccionDestinatarios.init();
    }, 50);
});

console.log('✅ seleccion_destinatarios.js cargado');