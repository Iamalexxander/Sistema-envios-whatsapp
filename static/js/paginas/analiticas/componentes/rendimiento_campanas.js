// rendimiento_campanas.js - CON EXPORTACIÓN PDF MEJORADA
console.log('📋 Cargando rendimiento_campanas.js...');

window.RendimientoCampanas = {
    inicializado: false,
    datosCampanas: [],
    
    init() {
        if (this.inicializado) return;
        
        console.log('🔧 Configurando componente RendimientoCampanas...');
        
        this.configurarEventos();
        this.inicializado = true;
        
        console.log('✅ RendimientoCampanas inicializado');
    },
    
    configurarEventos() {
        const btnExportarPdf = document.getElementById('btn-exportar-pdf');
        if (btnExportarPdf) {
            btnExportarPdf.addEventListener('click', () => {
                this.exportarPDFDetallado();
            });
        }
        
        this.configurarHoverTabla();
    },
    
    configurarHoverTabla() {
        const tabla = document.querySelector('.tabla-rendimiento tbody');
        if (!tabla) return;
        
        tabla.addEventListener('mouseover', (e) => {
            const fila = e.target.closest('tr');
            if (fila && !fila.classList.contains('loading-row')) {
                this.destacarFila(fila);
            }
        });
        
        tabla.addEventListener('mouseout', (e) => {
            const fila = e.target.closest('tr');
            if (fila && !fila.classList.contains('loading-row')) {
                this.restaurarFila(fila);
            }
        });
    },
    
    destacarFila(fila) {
        fila.style.backgroundColor = '#f8fafc';
        fila.style.transform = 'scale(1.01)';
        fila.style.transition = 'all 0.2s ease';
    },
    
    restaurarFila(fila) {
        fila.style.backgroundColor = '';
        fila.style.transform = '';
    },
    
    actualizarConDatos(datos) {
        this.datosCampanas = datos;
        this.actualizarTabla();
        console.log('📋 Tabla actualizada con datos de API:', datos);
    },
    
    actualizarTabla() {
        const tbody = document.getElementById('tabla-campanas-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (this.datosCampanas.length === 0) {
            const filaVacia = document.createElement('tr');
            filaVacia.innerHTML = `
                <td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">
                    No hay campañas disponibles
                </td>
            `;
            tbody.appendChild(filaVacia);
            return;
        }
        
        this.datosCampanas.forEach(campana => {
            const fila = this.crearFilaCampana(campana);
            tbody.appendChild(fila);
        });
        
        console.log('📋 Tabla de campañas actualizada');
    },
    
    crearFilaCampana(campana) {
        const fila = document.createElement('tr');
        
        const tasaClass = campana.tasa_exito >= 95 ? 'high' : 
                         campana.tasa_exito >= 90 ? 'medium' : 'low';
        
        let iconoAccion = '';
        const estado = campana.estado.toLowerCase();
        
        if (estado === 'detenido') {
            iconoAccion = `
                <button class="btn-accion-campana btn-reanudar" 
                        onclick="window.RendimientoCampanas.reanudarCampana('${campana.id}')" 
                        title="Reanudar campaña"
                        style="background: #22c55e; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-left: 8px;">
                    <i class="fas fa-play"></i>
                </button>
            `;
        }
        
        fila.innerHTML = `
            <td>${campana.nombre || 'Campaña sin nombre'}</td>
            <td>${campana.enviados.toLocaleString()}</td>
            <td>${campana.entregados.toLocaleString()}</td>
            <td><span class="tasa-exito ${tasaClass}">${campana.tasa_exito}%</span></td>
            <td>${campana.respuestas.toLocaleString()}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="estado ${estado}">${campana.estado}</span>
                    ${iconoAccion}
                </div>
            </td>
        `;
        
        return fila;
    },
    
    async reanudarCampana(campanaId) {
        if (!confirm('¿Deseas reanudar esta campaña?')) {
            return;
        }
        
        try {
            console.log('▶️ Reanudando campaña:', campanaId);
            
            const response = await fetch(`/campanas/api/${campanaId}/iniciar`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                if (window.mostrarNotificacion) {
                    window.mostrarNotificacion('Campaña reanudada exitosamente', 'success');
                }
                
                if (window.cargarTodosLosDatos && window.AnaliticasApp) {
                    await window.cargarTodosLosDatos(window.AnaliticasApp.periodoActual);
                }
            } else {
                throw new Error(result.message || 'Error reanudando campaña');
            }
        } catch (error) {
            console.error('Error reanudando campaña:', error);
            if (window.mostrarNotificacion) {
                window.mostrarNotificacion('Error al reanudar campaña', 'error');
            }
        }
    },
    
    async exportarPDFDetallado() {
        console.log('📄 Generando PDF detallado con gráficas...');
        
        if (window.mostrarCargando) {
            window.mostrarCargando('Generando PDF detallado...');
        }
        
        try {
            // Obtener datos completos
            const periodo = window.AnaliticasApp ? window.AnaliticasApp.periodoActual : 7;
            
            // Capturar gráficas como imágenes
            const graficaTendencias = await this.capturarGrafica('tendencias-chart');
            const graficaDistribucion = await this.capturarGrafica('distribucion-chart');
            
            // Preparar datos para enviar al backend
            const datosPDF = {
                periodo: parseInt(periodo),
                estadisticas: window.AnaliticasApp.estadisticas,
                campanas: this.datosCampanas,
                graficas: {
                    tendencias: graficaTendencias,
                    distribucion: graficaDistribucion
                },
                fecha_generacion: new Date().toISOString()
            };
            
            // Enviar al backend para generar PDF
            const response = await fetch('/analiticas/api/exportar/pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosPDF)
            });
            
            if (response.ok) {
                // Descargar el PDF
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Reporte_Analiticas_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                if (window.ocultarCargando) {
                    window.ocultarCargando();
                }
                
                if (window.mostrarNotificacion) {
                    window.mostrarNotificacion('PDF generado exitosamente con gráficas', 'success');
                }
            } else {
                throw new Error('Error al generar PDF');
            }
            
        } catch (error) {
            console.error('Error generando PDF:', error);
            
            if (window.ocultarCargando) {
                window.ocultarCargando();
            }
            
            if (window.mostrarNotificacion) {
                window.mostrarNotificacion('Error al generar PDF', 'error');
            }
        }
    },
    
    async capturarGrafica(chartId) {
        return new Promise((resolve) => {
            const canvas = document.getElementById(chartId);
            if (canvas) {
                // Convertir canvas a base64
                const imagenBase64 = canvas.toDataURL('image/png');
                resolve(imagenBase64);
            } else {
                resolve(null);
            }
        });
    },
    
    generarResumen() {
        if (this.datosCampanas.length === 0) return {};
        
        const totalEnviados = this.datosCampanas.reduce((sum, c) => sum + c.enviados, 0);
        const totalEntregados = this.datosCampanas.reduce((sum, c) => sum + c.entregados, 0);
        const totalRespuestas = this.datosCampanas.reduce((sum, c) => sum + c.respuestas, 0);
        
        return {
            totalEnviados,
            totalEntregados,
            totalRespuestas,
            tasaExitoPromedio: ((totalEntregados / totalEnviados) * 100).toFixed(1),
            numeroCampanas: this.datosCampanas.length
        };
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.RendimientoCampanas.init();
    }, 200);
});

console.log('✅ rendimiento_campanas.js cargado');