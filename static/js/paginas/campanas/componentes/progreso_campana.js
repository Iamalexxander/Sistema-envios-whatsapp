// progreso_campana.js - Componente específico para progreso de campaña
console.log('📊 Cargando progreso_campana.js...');

window.ProgresoCampana = {
    inicializado: false,
    
    init() {
        if (this.inicializado) return;
        
        console.log('🔧 Configurando componente ProgresoCampana...');
        
        this.configurarEventos();
        this.inicializarBarraProgreso();
        this.inicializarEstadisticas();
        this.inicializado = true;
        
        console.log('✅ ProgresoCampana inicializado');
    },
    
    configurarEventos() {
        // ⭐ NO configurar eventos del botón aquí
        // El botón se configura en campanas.js para evitar conflictos
        console.log('⚠️ Eventos del botón manejados por campanas.js');
        
        // Solo configurar otros eventos si los hubiera (por ahora ninguno)
    },
    
    inicializarBarraProgreso() {
        const progressFill = document.getElementById('progress-fill');
        const progressPercent = document.getElementById('progress-percent');
        
        if (progressFill && progressPercent) {
            // Inicializar en 0%
            progressFill.style.width = '0%';
            progressPercent.textContent = '0%';
            
            console.log('📊 Barra de progreso inicializada');
        } else {
            console.warn('⚠️ Elementos de barra de progreso no encontrados');
        }
    },
    
    inicializarEstadisticas() {
        // Inicializar todos los contadores en 0
        const elementos = {
            'enviados-count': 0,
            'recibidos-count': 0,
            'tasa-exito': '100%',
            'fallidos-count': 0
        };
        
        Object.keys(elementos).forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = elementos[id];
            }
        });
        
        console.log('📈 Estadísticas inicializadas');
    },
    
    // Función para actualizar el progreso específicamente
    actualizarProgreso(porcentaje) {
        const progressFill = document.getElementById('progress-fill');
        const progressPercent = document.getElementById('progress-percent');
        
        if (progressFill && progressPercent) {
            // Validar que el porcentaje esté entre 0 y 100
            const porcentajeValido = Math.min(100, Math.max(0, porcentaje));
            
            progressFill.style.width = `${porcentajeValido}%`;
            progressPercent.textContent = `${Math.round(porcentajeValido)}%`;
            
            // Animación suave
            progressFill.style.transition = 'width 0.3s ease';
            
            // Cambiar color según progreso
            if (porcentajeValido === 100) {
                progressFill.style.background = '#22c55e'; // Verde cuando está completo
            } else {
                progressFill.style.background = '#3b82f6'; // Azul en progreso
            }
        }
    },
    
    // Función para actualizar estadísticas
    actualizarEstadisticas(datos) {
        if (!datos) return;
        
        const {enviados, recibidos, fallidos, tasaExito, total} = datos;
        
        // Actualizar contadores
        if (enviados !== undefined) {
            const elem = document.getElementById('enviados-count');
            if (elem) elem.textContent = this.formatearNumero(enviados);
        }
        
        if (recibidos !== undefined) {
            const elem = document.getElementById('recibidos-count');
            if (elem) elem.textContent = this.formatearNumero(recibidos);
        }
        
        if (fallidos !== undefined) {
            const elem = document.getElementById('fallidos-count');
            if (elem) elem.textContent = this.formatearNumero(fallidos);
        }
        
        if (tasaExito !== undefined) {
            const elem = document.getElementById('tasa-exito');
            if (elem) elem.textContent = `${tasaExito}%`;
        }
        
        // Actualizar progreso si tenemos total y enviados
        if (total !== undefined && enviados !== undefined && total > 0) {
            const porcentaje = (enviados / total) * 100;
            this.actualizarProgreso(porcentaje);
        }
    },
    
    // Función para actualizar el estado del botón
    actualizarBoton(estado) {
        const btnIniciar = document.getElementById('btn-iniciar');
        if (!btnIniciar) return;
        
        switch(estado) {
            case 'iniciando':
                btnIniciar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';
                btnIniciar.disabled = true;
                btnIniciar.style.background = '#94a3b8';
                break;
                
            case 'activo':
                btnIniciar.innerHTML = '<i class="fas fa-stop"></i> Detener Campaña';
                btnIniciar.disabled = false;
                btnIniciar.style.background = '#ef4444';
                break;
                
            case 'deteniendo':
                btnIniciar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deteniendo...';
                btnIniciar.disabled = true;
                btnIniciar.style.background = '#94a3b8';
                break;
                
            case 'inactivo':
                btnIniciar.innerHTML = '<i class="fas fa-paper-plane"></i> Iniciar Campaña';
                btnIniciar.disabled = false;
                btnIniciar.style.background = '#22c55e';
                break;
                
            case 'sin-contactos':
                btnIniciar.innerHTML = '<i class="fas fa-users"></i> Sin Contactos';
                btnIniciar.disabled = true;
                btnIniciar.style.background = '#94a3b8';
                break;
                
            default:
                console.warn('⚠️ Estado de botón desconocido:', estado);
        }
    },
    
    // Función para resetear el progreso
    resetearProgreso() {
        this.actualizarProgreso(0);
        this.inicializarEstadisticas();
        this.actualizarBoton('inactivo');
        console.log('🔄 Progreso reseteado');
    },
    
    // Función helper para formatear números
    formatearNumero(numero) {
        return new Intl.NumberFormat('es-ES').format(numero);
    },
    
    // Función para mostrar animación de completado
    mostrarCompletado() {
        this.actualizarProgreso(100);
        
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            // Efecto de pulso
            progressFill.style.animation = 'pulso 1s ease-in-out 3';
        }
        
        console.log('🎉 Campaña completada - Animación mostrada');
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.ProgresoCampana.init();
    }, 50);
});

console.log('✅ progreso_campana.js cargado');