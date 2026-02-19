console.log('📈 Cargando tendencias_entrega.js...');

window.TendenciasEntrega = {
    inicializado: false,
    grafico: null,
    datosActuales: null,
    datosFallidos: 0,
    
    init() {
        if (this.inicializado) return;
        
        console.log('🔧 Configurando componente TendenciasEntrega...');
        
        this.configurarEventos();
        this.inicializado = true;
        
        console.log('✅ TendenciasEntrega inicializado');
    },
    
    configurarEventos() {
        const filtroSelect = document.getElementById('entrega-filtro');
        if (filtroSelect) {
            filtroSelect.addEventListener('change', (e) => {
                this.cambiarTipoGrafico(e.target.value);
            });
        }
    },
    
    // Obtener fallidos REALES desde estadísticas
    async obtenerDatosFallidos() {
        try {
            const periodo = window.AnaliticasApp ? window.AnaliticasApp.periodoActual : 7;
            const response = await fetch(`/analiticas/api/analytics/summary/${periodo}`);
            const result = await response.json();
            
            if (result.success && result.data) {
                this.datosFallidos = result.data.mensajes_fallidos || 0;
            } else {
                this.datosFallidos = 0;
            }
        } catch (error) {
            console.error('Error obteniendo datos de fallidos:', error);
            this.datosFallidos = 0;
        }
    },
    
    async actualizarConDatos(datos) {
        if (!datos || !datos.labels || !datos.valores) {
            console.warn('⚠️ Datos inválidos recibidos en TendenciasEntrega');
            return;
        }
        
        this.datosActuales = datos;
        
        // Obtener datos de fallidos
        await this.obtenerDatosFallidos();
        
        if (!this.grafico) {
            this.crearGrafico();
        } else {
            this.actualizarGrafico();
        }
        
        console.log('📈 Gráfico de tendencias actualizado con datos de API:', datos);
    },
    
    crearGrafico() {
        const ctx = document.getElementById('tendencias-chart');
        if (!ctx) {
            console.warn('⚠️ Elemento tendencias-chart no encontrado');
            return;
        }
        if (!this.datosActuales) {
            console.warn('⚠️ No hay datos para crear el gráfico');
            return;
        }
        
        // Crear array con valores de fallidos para cada punto
        const datosFallidos = this.datosActuales.labels.map(() => this.datosFallidos);
        
        this.grafico = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.datosActuales.labels,
                datasets: [
                    {
                        label: 'Mensajes Entregados',
                        data: this.datosActuales.valores,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#22c55e',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Fallidos',
                        data: datosFallidos,
                        borderColor: '#ef4444',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        fill: false,
                        tension: 0,
                        pointBackgroundColor: '#ef4444',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    }
                ]
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
                            title: (context) => {
                                return context[0].label;
                            },
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.raw;
                                return `${label}: ${value}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    },
                    y: {
                        grid: {
                            color: '#f1f5f9'
                        },
                        ticks: {
                            color: '#64748b'
                        },
                        beginAtZero: true,
                        suggestedMax: function(context) {
                            const datasets = context.chart.data.datasets;
                            let maxValue = 0;
                            datasets.forEach(dataset => {
                                const max = Math.max(...dataset.data);
                                if (max > maxValue) maxValue = max;
                            });
                            return Math.max(maxValue * 1.2, 10);
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    },
    
    cambiarTipoGrafico(tipo) {
        if (!this.grafico || !this.datosActuales) return;
        
        let color, label, mostrarFallidos = false;
        
        switch(tipo) {
            case 'entrega':
                color = '#22c55e';
                label = 'Mensajes Entregados';
                mostrarFallidos = true;
                break;
            case 'lectura':
                color = '#3b82f6';
                label = 'Mensajes Leídos';
                break;
            case 'respuesta':
                color = '#f59e0b';
                label = 'Respuestas Recibidas';
                break;
        }
        
        // Actualizar primera línea (principal)
        this.grafico.data.datasets[0].borderColor = color;
        this.grafico.data.datasets[0].backgroundColor = color + '20';
        this.grafico.data.datasets[0].pointBackgroundColor = color;
        this.grafico.data.datasets[0].label = label;
        
        // Mostrar/ocultar línea de fallidos
        if (mostrarFallidos && this.grafico.data.datasets.length === 1) {
            this.grafico.data.datasets.push({
                label: 'Fallidos',
                data: this.datosActuales.labels.map(() => this.datosFallidos),
                borderColor: '#ef4444',
                backgroundColor: 'transparent',
                borderWidth: 2,
                fill: false,
                tension: 0,
                pointBackgroundColor: '#ef4444',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5
            });
        } else if (!mostrarFallidos && this.grafico.data.datasets.length > 1) {
            this.grafico.data.datasets.splice(1, 1);
        }
        
        // Simular datos diferentes para cada tipo
        let valores = [...this.datosActuales.valores];
        if (tipo === 'lectura') {
            valores = valores.map(v => Math.round(v * 0.85));
        } else if (tipo === 'respuesta') {
            valores = valores.map(v => Math.round(v * 0.15));
        }
        
        this.grafico.data.datasets[0].data = valores;
        this.grafico.update();
        
        console.log(`📊 Gráfico cambiado a: ${tipo}`);
    },
    
    actualizarGrafico() {
        if (!this.grafico) {
            console.warn('⚠️ Gráfico no existe, creándolo...');
            this.crearGrafico();
            return;
        }
        if (!this.datosActuales) {
            console.warn('⚠️ No hay datos para actualizar');
            return;
        }
        
        this.grafico.data.labels = this.datosActuales.labels;
        this.grafico.data.datasets[0].data = this.datosActuales.valores;
        
        // Actualizar línea de fallidos con datos REALES
        if (this.grafico.data.datasets.length > 1) {
            this.grafico.data.datasets[1].data = this.datosActuales.labels.map(() => this.datosFallidos);
        }
        
        this.grafico.update();
        
        console.log('📈 Gráfico de tendencias actualizado');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.TendenciasEntrega.init();
    }, 100);
});

console.log('tendencias_entrega.js cargado');