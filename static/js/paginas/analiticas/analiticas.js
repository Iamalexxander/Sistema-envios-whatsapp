// analiticas.js - Script principal para analíticas conectado a APIs reales
console.log('📊 Cargando analiticas.js...');

// Variables globales de Analíticas
window.AnaliticasApp = {
    // Datos de estadísticas
    estadisticas: {
        mensajesEnviados: 0,
        tasaEntrega: 0,
        mensajesFallidos: 0,
        tiempoRespuesta: 0
    },
    
    // Período seleccionado
    periodoActual: '7',
    
    // Estado de inicialización
    inicializado: false,
    
    // Estado de carga
    cargando: false,
    
    // Datos de gráficos
    datosGraficos: {
        tendencias: {
            labels: [],
            valores: []
        },
        distribucion: {
            entregados: 0,
            fallidos: 0,
            pendientes: 0
        }
    },
    
    // Datos de campañas
    datosCampanas: []
};

// ==========================================
// FUNCIONES DE API
// ==========================================

async function cargarDatosResumen(periodo) {
    try {
        console.log(`📊 Cargando resumen para período: ${periodo} días`);
        
        const response = await fetch(`/analiticas/api/analytics/summary/${periodo}`);
        const data = await response.json();
        
        if (data.success) {
            const app = window.AnaliticasApp;
            app.estadisticas = {
                mensajesEnviados: data.data.mensajes_enviados,
                tasaEntrega: data.data.tasa_entrega,
                mensajesFallidos: data.data.mensajes_fallidos,
                tiempoRespuesta: data.data.tiempo_respuesta
            };
            
            // Actualizar KPIs en la interfaz
            if (window.PanelAnalisis && window.PanelAnalisis.actualizarDatos) {
                window.PanelAnalisis.actualizarDatos(app.estadisticas);
            }
            
            console.log('✅ Resumen cargado:', data.data);
            return data.data;
        } else {
            throw new Error(data.error || 'Error al cargar resumen');
        }
        
    } catch (error) {
        console.error('❌ Error al cargar resumen:', error);
        mostrarNotificacion('Error al cargar estadísticas', 'error');
        throw error;
    }
}

async function cargarDatosTendencias(periodo) {
    try {
        console.log(`📈 Cargando tendencias para período: ${periodo} días`);
        
        const response = await fetch(`/analiticas/api/analytics/trends/${periodo}`);
        const data = await response.json();
        
        if (data.success) {
            const app = window.AnaliticasApp;
            app.datosGraficos.tendencias = data.data;
            
            // Actualizar gráfico de tendencias
            if (window.TendenciasEntrega && window.TendenciasEntrega.actualizarConDatos) {
                window.TendenciasEntrega.actualizarConDatos(data.data);
            }
            
            console.log('✅ Tendencias cargadas:', data.data);
            return data.data;
        } else {
            throw new Error(data.error || 'Error al cargar tendencias');
        }
        
    } catch (error) {
        console.error('❌ Error al cargar tendencias:', error);
        mostrarNotificacion('Error al cargar gráfico de tendencias', 'error');
        throw error;
    }
}

async function cargarDatosDistribucion(periodo) {
    try {
        console.log(`🍩 Cargando distribución para período: ${periodo} días`);
        
        const response = await fetch(`/analiticas/api/analytics/distribution/${periodo}`);
        const data = await response.json();
        
        if (data.success) {
            const app = window.AnaliticasApp;
            app.datosGraficos.distribucion = data.data;
            
            // Actualizar gráfico de distribución
            if (window.DistribucionEntregas && window.DistribucionEntregas.actualizarConDatos) {
                window.DistribucionEntregas.actualizarConDatos(data.data);
            }
            
            console.log('✅ Distribución cargada:', data.data);
            return data.data;
        } else {
            throw new Error(data.error || 'Error al cargar distribución');
        }
        
    } catch (error) {
        console.error('❌ Error al cargar distribución:', error);
        mostrarNotificacion('Error al cargar gráfico de distribución', 'error');
        throw error;
    }
}

async function cargarDatosCampanas(periodo) {
    try {
        console.log(`📋 Cargando campañas para período: ${periodo} días`);
        
        const response = await fetch(`/analiticas/api/analytics/campaigns/${periodo}`);
        const data = await response.json();
        
        if (data.success) {
            const app = window.AnaliticasApp;
            app.datosCampanas = data.data;
            
            // Actualizar tabla de campañas
            if (window.RendimientoCampanas && window.RendimientoCampanas.actualizarConDatos) {
                window.RendimientoCampanas.actualizarConDatos(data.data);
            }
            
            console.log('✅ Campañas cargadas:', data.data);
            return data.data;
        } else {
            throw new Error(data.error || 'Error al cargar campañas');
        }
        
    } catch (error) {
        console.error('❌ Error al cargar campañas:', error);
        mostrarNotificacion('Error al cargar tabla de campañas', 'error');
        throw error;
    }
}

// Función principal para cargar todos los datos
async function cargarTodosLosDatos(periodo) {
    const app = window.AnaliticasApp;
    
    if (app.cargando) {
        console.log('⏳ Ya hay una carga en progreso...');
        return;
    }
    
    app.cargando = true;
    
    try {
        mostrarCargando('Cargando datos de analíticas...');
        
        // Cargar todos los datos en paralelo
        await Promise.all([
            cargarDatosResumen(periodo),
            cargarDatosTendencias(periodo),
            cargarDatosDistribucion(periodo),
            cargarDatosCampanas(periodo)
        ]);
        
        ocultarCargando();
        mostrarNotificacion(`Datos actualizados para últimos ${periodo} días`, 'success');
        
    } catch (error) {
        console.error('❌ Error al cargar datos:', error);
        ocultarCargando();
        mostrarNotificacion('Error al cargar algunos datos', 'error');
    } finally {
        app.cargando = false;
    }
}

// ==========================================
// FUNCIONES DE UI
// ==========================================

function mostrarCargando(mensaje = 'Cargando...') {
    const existente = document.getElementById('loading-indicator');
    if (existente) {
        existente.remove();
    }
    
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.className = 'loading-overlay';
    
    loadingDiv.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner">
                <div class="spinner"></div>
            </div>
            <div class="loading-text">${mensaje}</div>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        }
        
        .loading-content {
            background: white;
            padding: 32px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        
        .loading-spinner {
            margin-bottom: 16px;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f4f6;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-text {
            color: #374151;
            font-weight: 500;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(loadingDiv);
}

function ocultarCargando() {
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Función para actualizar período
window.actualizarPeriodo = async function(periodo) {
    const app = window.AnaliticasApp;
    app.periodoActual = periodo;
    
    console.log(`📅 Período cambiado a: ${periodo} días`);
    
    // Cargar nuevos datos desde la API
    await cargarTodosLosDatos(periodo);
};

// Función para exportar datos
window.exportarDatos = async function(formato = 'excel') {
    try {
        mostrarCargando('Preparando exportación...');
        
        const app = window.AnaliticasApp;
        const response = await fetch('/analiticas/api/exportar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                formato: formato,
                periodo: parseInt(app.periodoActual)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            ocultarCargando();
            mostrarNotificacion(data.message, 'success');
            console.log('📄 Datos exportados:', data.data);
        } else {
            throw new Error(data.error || 'Error en la exportación');
        }
        
    } catch (error) {
        console.error('❌ Error al exportar:', error);
        ocultarCargando();
        mostrarNotificacion('Error al exportar datos', 'error');
    }
};

// Función para mostrar notificaciones
window.mostrarNotificacion = function(mensaje, tipo = 'info') {
    const existente = document.querySelector('.notificacion');
    if (existente) {
        existente.remove();
    }
    
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
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
};

// ==========================================
// INICIALIZACIÓN PRINCIPAL
// ==========================================

function inicializarAnaliticas() {
    const app = window.AnaliticasApp;
    
    if (app.inicializado) return;
    
    console.log('🚀 Inicializando aplicación de analíticas...');
    
    // Configurar event listeners
    const periodoSelector = document.getElementById('periodo-selector');
    if (periodoSelector) {
        periodoSelector.addEventListener('change', (e) => {
            actualizarPeriodo(e.target.value);
        });
    }
    
    const btnExportar = document.getElementById('btn-exportar');
    if (btnExportar) {
        btnExportar.addEventListener('click', () => {
            exportarDatos('excel');
        });
    }
    
    // Cargar datos iniciales
    cargarTodosLosDatos(app.periodoActual);
    
    app.inicializado = true;
    console.log('✅ Aplicación de analíticas inicializada correctamente');
}

// Evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando analíticas...');
    
    setTimeout(() => {
        inicializarAnaliticas();
        
        // Verificar componentes cargados
        const componentesRequeridos = [
            'PanelAnalisis',
            'TendenciasEntrega',
            'DistribucionEntregas',
            'RendimientoCampanas'
        ];
        
        componentesRequeridos.forEach(componente => {
            if (window[componente]) {
                console.log(`✅ Componente ${componente} encontrado`);
            } else {
                console.warn(`⚠️ Componente ${componente} no encontrado`);
            }
        });
        
    }, 100);
});

console.log('📊 analiticas.js cargado completamente');