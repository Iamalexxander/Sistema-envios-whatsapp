console.log('📊 Cargando footer_estadisticas.js...');

window.FooterEstadisticas = {
    inicializado: false,
    
    init() {
        if (this.inicializado) return;
        
        console.log('🔧 Configurando componente FooterEstadisticas...');
        this.inicializado = true;
        
        console.log('✅ FooterEstadisticas inicializado');
    }
};

// Función global para actualizar estadísticas
window.actualizarEstadisticas = function(estadisticas) {
    try {
        if (!estadisticas) {
            // Calcular estadísticas desde los contactos cargados
            const app = window.ContactosApp;
            if (!app || !app.contactos) {
                console.log('📊 No hay contactos para calcular estadísticas');
                return;
            }
            
            const activos = app.contactos.filter(c => c.estado === 'activo').length;
            const bloqueados = app.contactos.filter(c => c.estado === 'bloqueado').length;
            const inactivos = app.contactos.filter(c => c.estado === 'inactivo').length;
            
            // Calcular nuevos (últimos 7 días)
            const hace7Dias = new Date();
            hace7Dias.setDate(hace7Dias.getDate() - 7);
            
            const nuevos = app.contactos.filter(c => {
                if (!c.creado_en) return false;
                try {
                    const fechaCreacion = new Date(c.creado_en);
                    return fechaCreacion >= hace7Dias;
                } catch (e) {
                    return false;
                }
            }).length;
            
            estadisticas = {
                total: app.contactos.length,
                activos: activos,
                bloqueados: bloqueados,
                inactivos: inactivos,
                nuevos_7_dias: nuevos,
                tasa_activos: app.contactos.length > 0 ? Math.round((activos / app.contactos.length) * 100) : 0
            };
        }
        
        // Actualizar elementos en el DOM
        const elementos = {
            validContactsCount: estadisticas.activos || 0,
            invalidContactsCount: (estadisticas.bloqueados || 0) + (estadisticas.inactivos || 0),
            pendingValidationCount: estadisticas.nuevos_7_dias || 0,
            totalContactsFooter: estadisticas.total || 0
        };
        
        Object.entries(elementos).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = valor;
            }
        });
        
        // Actualizar título de la tabla con el total
        const tableHeader = document.querySelector('.table-header h3');
        if (tableHeader) {
            tableHeader.textContent = `Contactos (${estadisticas.total || 0})`;
        }
        
        console.log('📊 Estadísticas actualizadas:', estadisticas);
        
    } catch (error) {
        console.error('❌ Error actualizando estadísticas:', error);
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.FooterEstadisticas.init();
    }, 50);
});

console.log('✅ footer_estadisticas.js cargado');