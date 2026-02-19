// panel_analisis.js - Componente de KPIs principales conectado a API
console.log('📈 Cargando panel_analisis.js...');

window.PanelAnalisis = {
    inicializado: false,
    
    // Datos iniciales (se actualizarán desde la API)
    estadisticas: {
        mensajesEnviados: 0,
        tasaEntrega: 0,
        mensajesFallidos: 0,
        tiempoRespuesta: 0
    },
    
    init() {
        if (this.inicializado) return;
        
        console.log('🔧 Configurando componente PanelAnalisis...');
        
        this.configurarEventos();
        this.inicializado = true;
        
        console.log('✅ PanelAnalisis inicializado');
    },
    
    configurarEventos() {
        // Agregar eventos de hover a las tarjetas KPI
        const kpiCards = document.querySelectorAll('.kpi-card');
        kpiCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                this.animarKPI(card);
            });
            
            card.addEventListener('mouseleave', () => {
                this.restaurarKPI(card);
            });
        });
        
        // Evento de redimensionamiento para responsive
        window.addEventListener('resize', () => {
            this.ajustarResponsivo();
        });
    },
    
    // Nueva función para actualizar datos desde la API
    actualizarDatos(nuevosStats) {
        this.estadisticas = { ...this.estadisticas, ...nuevosStats };
        this.actualizarKPIs();
        console.log('📥 Datos KPI actualizados desde API:', nuevosStats);
    },
    
    actualizarKPIs() {
        const stats = this.estadisticas;
        
        // Actualizar valores en la interfaz
        const mensajesEnviados = document.getElementById('mensajes-enviados');
        const tasaEntrega = document.getElementById('tasa-entrega');
        const mensajesFallidos = document.getElementById('mensajes-fallidos');
        const tiempoRespuesta = document.getElementById('tiempo-respuesta');
        
        if (mensajesEnviados) {
            this.animarContador(mensajesEnviados, stats.mensajesEnviados);
        }
        
        if (tasaEntrega) {
            this.animarContador(tasaEntrega, stats.tasaEntrega, '%');
        }
        
        if (mensajesFallidos) {
            this.animarContador(mensajesFallidos, stats.mensajesFallidos);
        }
        
        if (tiempoRespuesta) {
            this.animarContador(tiempoRespuesta, stats.tiempoRespuesta, 's');
        }
        
        console.log('📊 KPIs actualizados:', stats);
    },
    
    animarContador(elemento, valorFinal, sufijo = '') {
        const valorInicial = parseFloat(elemento.textContent.replace(/[^\d.-]/g, '')) || 0;
        const duracion = 1000; // 1 segundo
        const pasos = 60; // 60 FPS
        const incrementoPorPaso = (valorFinal - valorInicial) / pasos;
        
        let valorActual = valorInicial;
        let paso = 0;
        
        const timer = setInterval(() => {
            paso++;
            valorActual += incrementoPorPaso;
            
            if (paso >= pasos) {
                valorActual = valorFinal;
                clearInterval(timer);
            }
            
            // Formatear según el tipo de dato
            let valorMostrado;
            if (sufijo === '%') {
                valorMostrado = valorActual.toFixed(1) + sufijo;
            } else if (sufijo === 's') {
                valorMostrado = valorActual.toFixed(1) + sufijo;
            } else {
                valorMostrado = Math.round(valorActual).toLocaleString('es-ES');
            }
            
            elemento.textContent = valorMostrado;
        }, duracion / pasos);
    },
    
    animarKPI(card) {
        // Efecto visual al hacer hover
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
        card.style.borderColor = '#cbd5e1';
    },
    
    restaurarKPI(card) {
        // Restaurar estado original
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
        card.style.borderColor = '#e2e8f0';
    },
    
    ajustarResponsivo() {
        const cards = document.querySelectorAll('.kpi-card');
        const width = window.innerWidth;
        
        if (width <= 640) {
            cards.forEach(card => {
                card.style.minHeight = '100px';
            });
        } else {
            cards.forEach(card => {
                card.style.minHeight = '120px';
            });
        }
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.PanelAnalisis.init();
    }, 100);
});

console.log('✅ panel_analisis.js cargado correctamente');