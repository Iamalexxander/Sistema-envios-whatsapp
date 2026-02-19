console.log('🍩 Cargando distribucion_entregas.js...');

window.DistribucionEntregas = {
    inicializado: false,
    grafico: null,
    datosActuales: null,
    
    init() {
        if (this.inicializado) return;
        
        console.log('🔧 Configurando componente DistribucionEntregas...');
        this.inicializado = true;
        console.log('✅ DistribucionEntregas inicializado');
    },
    
    actualizarConDatos(datos) {
        if (!datos) {
            console.warn('Datos invalidos recibidos en DistribucionEntregas');
            return;
        }
        
        this.datosActuales = datos;
        
        if (!this.grafico) {
            this.crearGrafico();
        } else {
            this.actualizarGrafico();
        }
        
        this.actualizarEstadisticas();
        console.log('Grafico de distribucion actualizado con datos de API:', datos);
    },
    
    crearGrafico() {
        const ctx = document.getElementById('distribucion-chart');
        if (!ctx) {
            console.warn('Elemento distribucion-chart no encontrado');
            return;
        }
        
        if (!this.datosActuales) {
            console.warn('No hay datos para crear el grafico');
            return;
        }
        
        const datos = this.datosActuales;
        
        this.grafico = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Entregados', 'Fallidos', 'Pendientes'],
                datasets: [{
                    data: [
                        datos.entregados || 0, 
                        datos.fallidos || 0, 
                        datos.pendientes || 0
                    ],
                    backgroundColor: [
                        '#22c55e',
                        '#ef4444',
                        '#f59e0b'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    cutout: '60%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label;
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        cornerRadius: 8,
                        padding: 12
                    }
                },
                layout: {
                    padding: 10
                }
            }
        });
        
        console.log('Grafico de distribucion creado correctamente');
    },
    
    actualizarEstadisticas() {
        if (!this.datosActuales) return;
        
        const datos = this.datosActuales;
        
        const statEntregados = document.getElementById('stat-entregados');
        const statFallidos = document.getElementById('stat-fallidos');
        const statPendientes = document.getElementById('stat-pendientes');
        
        if (statEntregados) {
            this.animarContador(statEntregados, datos.entregados || 0);
        }
        
        if (statFallidos) {
            this.animarContador(statFallidos, datos.fallidos || 0);
        }
        
        if (statPendientes) {
            this.animarContador(statPendientes, datos.pendientes || 0);
        }
        
        console.log('Estadisticas de distribucion actualizadas');
    },
    
    animarContador(elemento, valorFinal) {
        const valorInicial = parseInt(elemento.textContent.replace(/,/g, '')) || 0;
        const duracion = 1000;
        const incremento = (valorFinal - valorInicial) / (duracion / 16);
        
        let valorActual = valorInicial;
        
        const timer = setInterval(() => {
            valorActual += incremento;
            
            if ((incremento > 0 && valorActual >= valorFinal) || 
                (incremento < 0 && valorActual <= valorFinal)) {
                valorActual = valorFinal;
                clearInterval(timer);
            }
            
            elemento.textContent = Math.round(valorActual).toLocaleString();
        }, 16);
    },
    
    actualizarGrafico() {
        if (!this.grafico) {
            console.warn('Grafico no existe, creandolo...');
            this.crearGrafico();
            return;
        }
        
        if (!this.datosActuales) {
            console.warn('No hay datos para actualizar');
            return;
        }
        
        const datos = this.datosActuales;
        
        this.grafico.data.datasets[0].data = [
            datos.entregados || 0,
            datos.fallidos || 0,
            datos.pendientes || 0
        ];
        
        this.grafico.update('active');
        
        console.log('Grafico de distribucion actualizado');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.DistribucionEntregas.init();
    }, 150);
});

console.log('distribucion_entregas.js cargado');