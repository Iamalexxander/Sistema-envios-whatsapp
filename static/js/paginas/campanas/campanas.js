// campanas.js - Script principal con soporte de archivos
console.log('📋 Cargando campanas.js...');

window.CampanasApp = {
    estadisticas: {
        total: 0,
        enviados: 0,
        recibidos: 0,
        fallidos: 0,
        tasaExito: 100
    },
    campanaActiva: false,
    campanaActualId: null,
    intervaloEnvio: null,
    conectado: true,
    contactosReales: [],
    plantillas: {},
    inicializado: false,
    archivoSeleccionado: null
};

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

window.actualizarEstadisticas = function() {
    const app = window.CampanasApp;
    
    const totalElement = document.getElementById('total-destinatarios');
    const enviadosElement = document.getElementById('enviados-count');
    const recibidosElement = document.getElementById('recibidos-count');
    const tasaElement = document.getElementById('tasa-exito');
    const fallidosElement = document.getElementById('fallidos-count');
    
    if (totalElement) totalElement.textContent = formatearNumero(app.estadisticas.total);
    if (enviadosElement) enviadosElement.textContent = formatearNumero(app.estadisticas.enviados);
    if (recibidosElement) recibidosElement.textContent = formatearNumero(app.estadisticas.recibidos);
    if (tasaElement) tasaElement.textContent = `${app.estadisticas.tasaExito}%`;
    if (fallidosElement) fallidosElement.textContent = formatearNumero(app.estadisticas.fallidos);
    
    const progreso = app.estadisticas.total > 0 ? (app.estadisticas.enviados / app.estadisticas.total) * 100 : 0;
    const progressPercent = document.getElementById('progress-percent');
    const progressFill = document.getElementById('progress-fill');
    
    if (progressPercent) progressPercent.textContent = `${Math.round(progreso)}%`;
    if (progressFill) {
        progressFill.style.transition = 'width 0.5s ease-in-out';
        progressFill.style.width = `${progreso}%`;
    }
    
    const btnIniciar = document.getElementById('btn-iniciar');
    if (btnIniciar) {
        btnIniciar.disabled = app.estadisticas.total === 0;
        if (app.estadisticas.total === 0) {
            btnIniciar.innerHTML = '<i class="fas fa-users"></i> Sin Contactos';
        } else if (!app.campanaActiva) {
            btnIniciar.innerHTML = '<i class="fas fa-paper-plane"></i> Iniciar Campaña';
        }
    }
};

window.calcularDuracion = function() {
    const app = window.CampanasApp;
    const intervaloRange = document.getElementById('intervalo-range');
    const duracionElement = document.getElementById('duracion-estimada');
    
    if (!intervaloRange || !duracionElement) return;
    
    const intervalo = parseInt(intervaloRange.value) || 5;
    const total = app.estadisticas.total;
    
    if (total === 0) {
        duracionElement.textContent = '0 min';
        return;
    }
    
    const segundosTotales = total * intervalo;
    const minutos = Math.ceil(segundosTotales / 60);
    
    let duracionTexto;
    if (minutos > 60) {
        const horas = Math.floor(minutos / 60);
        const minutosRestantes = minutos % 60;
        duracionTexto = `${horas}h ${minutosRestantes}min`;
    } else {
        duracionTexto = `${minutos} min`;
    }
    
    duracionElement.textContent = duracionTexto;
};

window.actualizarEstadoConexion = async function() {
    const app = window.CampanasApp;
    const indicator = document.getElementById('status-indicator');
    
    if (!indicator) return;
    
    try {
        const response = await fetch('/configuracion/api/whatsapp/estado');
        const data = await response.json();
        
        if (data.success && data.data) {
            app.conectado = data.data.conectado;
        } else {
            app.conectado = false;
        }
    } catch (error) {
        console.error('Error verificando conexión WhatsApp:', error);
        app.conectado = false;
    }
    
    if (app.conectado) {
        indicator.className = 'status-indicator status-connected';
        indicator.innerHTML = '<span class="status-dot"></span><span>Conectado</span>';
    } else {
        indicator.className = 'status-indicator status-disconnected';
        indicator.innerHTML = '<span class="status-dot"></span><span>Desconectado</span>';
    }
};

window.formatearNumero = function(numero) {
    return new Intl.NumberFormat('es-ES').format(numero);
};

window.cargarContactosReales = async function() {
    try {
        console.log('📊 Cargando contactos reales desde API...');
        
        const response = await fetch('/contactos/api');
        const data = await response.json();
        
        if (data.success) {
            const app = window.CampanasApp;
            
            app.contactosReales = data.data || [];
            const contactosActivos = app.contactosReales.filter(c => c.telefono && c.nombre);
            
            app.estadisticas.total = contactosActivos.length;
            app.estadisticas.recibidos = contactosActivos.length;
            
            if (!app.campanaActiva) {
                app.estadisticas.enviados = 0;
                app.estadisticas.fallidos = 0;
                app.estadisticas.tasaExito = 100;
            }
            
            actualizarEstadisticas();
            calcularDuracion();
            actualizarSelectorDestinatarios(contactosActivos.length, app.contactosReales.length);
            
            console.log(`✅ Contactos cargados: ${app.contactosReales.length} total, ${contactosActivos.length} activos`);
        } else {
            console.error('❌ Error en respuesta de API:', data.error);
            mostrarNotificacion('Error al cargar contactos', 'error');
        }
    } catch (error) {
        console.error('❌ Error al cargar contactos:', error);
        mostrarNotificacion('Error de conexión con API', 'error');
        
        const app = window.CampanasApp;
        app.estadisticas.total = 0;
        app.estadisticas.recibidos = 0;
        actualizarEstadisticas();
    }
};

function actualizarSelectorDestinatarios(activos, total) {
    const selector = document.getElementById('destinatarios-select');
    if (selector) {
        selector.innerHTML = `
            <option value="todos">Todos los Contactos (${total})</option>
            <option value="especificos">Personas Específicas</option>
        `;
        
        selector.addEventListener('change', function() {
            if (this.value === 'especificos') {
                if (window.ModalSeleccionContactos) {
                    window.ModalSeleccionContactos.abrir();
                }
            } else {
                window.CampanasApp.estadisticas.total = total;
                window.CampanasApp.estadisticas.recibidos = total;
                window.CampanasApp.contactosEspecificos = null;
                actualizarEstadisticas();
                calcularDuracion();
            }
        });
    }
}

window.iniciarCampana = async function() {
    const app = window.CampanasApp;
    
    if (!app.conectado) {
        if (window.verificarWhatsAppConectado) {
            const puedeEnviar = window.verificarWhatsAppConectado(
                null,
                'Debes conectar WhatsApp antes de enviar la campaña'
            );
            if (!puedeEnviar) return;
        } else {
            mostrarNotificacion('WhatsApp no está conectado', 'error');
            return;
        }
    }

    if (app.estadisticas.total === 0) {
        mostrarNotificacion('No hay contactos disponibles para la campaña', 'error');
        return;
    }

    if (app.campanaActiva) {
        detenerCampana();
        return;
    }
    
    const mensaje = document.getElementById('mensaje-textarea');
    if (!mensaje || !mensaje.value.trim()) {
        mostrarNotificacion('Debe escribir un mensaje', 'error');
        return;
    }
    
    const fechaActual = new Date();
    const nombreCampana = `Campaña ${fechaActual.toLocaleDateString('es-ES')} ${fechaActual.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}`;
    
    const dataCampana = {
        content: mensaje.value.trim(),
        nombre: nombreCampana,
        interval: parseInt(document.getElementById('intervalo-range')?.value || 5),
        recipients_origin: 'activos'
    };
    
    let tieneArchivo = false;
    let formData = null;
    
    if (window.FormularioMensaje && window.FormularioMensaje.tieneArchivo()) {
        const archivoData = window.FormularioMensaje.getArchivoSeleccionado();
        if (archivoData && archivoData.file) {
            tieneArchivo = true;
            formData = new FormData();
            formData.append('archivo', archivoData.file);
            formData.append('tipo_archivo', archivoData.tipo);
            formData.append('content', dataCampana.content);
            formData.append('nombre', dataCampana.nombre);
            formData.append('interval', dataCampana.interval);
            formData.append('recipients_origin', dataCampana.recipients_origin);
            console.log('📎 Archivo adjunto:', archivoData.file.name, 'Tipo:', archivoData.tipo);
        }
    }
    
    try {
        let response;
        
        if (tieneArchivo && formData) {
            response = await fetch('/campanas/api', {
                method: 'POST',
                body: formData
            });
        } else {
            response = await fetch('/campanas/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataCampana)
            });
        }
        
        const result = await response.json();
        
        if (!result.success) {
            mostrarNotificacion(result.error || 'Error creando campaña', 'error');
            return;
        }
        
        app.campanaActualId = result.data.id;
        console.log('✅ Campaña creada:', result.data.id);
        
        console.log('⏳ Esperando 1.5s antes de iniciar envío...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log('🔍 Verificando conexión de WhatsApp...');
        const estadoResponse = await fetch('/configuracion/api/whatsapp/estado');
        const estadoData = await estadoResponse.json();
        
        if (!estadoData.success || !estadoData.data.conectado) {
            app.campanaActiva = false;
            mostrarNotificacion('WhatsApp se desconectó. Verifica la conexión.', 'error');
            return;
        }
        
        console.log('✅ WhatsApp conectado, iniciando envío...');
        
        app.campanaActiva = true;
        
        const btnIniciar = document.getElementById('btn-iniciar');
        if (btnIniciar) {
            btnIniciar.innerHTML = '<i class="fas fa-stop"></i> Detener Campaña';
            btnIniciar.style.background = '#ef4444';
        }
        
        mostrarNotificacion(`Campaña iniciada: ${nombreCampana}`, 'success');
        
        await iniciarEnvioReal(result.data.id);
        
    } catch (error) {
        console.error('Error iniciando campaña:', error);
        mostrarNotificacion('Error de conexión', 'error');
        app.campanaActiva = false;
        
        const btnIniciar = document.getElementById('btn-iniciar');
        if (btnIniciar) {
            btnIniciar.innerHTML = '<i class="fas fa-paper-plane"></i> Iniciar Campaña';
            btnIniciar.style.background = '#22c55e';
        }
    }
};

async function iniciarEnvioReal(campanaId) {
    const app = window.CampanasApp;
    
    try {
        const response = await fetch(`/campanas/api/${campanaId}/iniciar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarNotificacion('Enviando mensajes por WhatsApp...', 'info');
            iniciarPollingProgreso(campanaId);
        } else {
            throw new Error(result.error || 'Error iniciando envío');
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error iniciando envío: ' + error.message, 'error');
        app.campanaActiva = false;
        
        const btnIniciar = document.getElementById('btn-iniciar');
        if (btnIniciar) {
            btnIniciar.innerHTML = '<i class="fas fa-paper-plane"></i> Iniciar Campaña';
            btnIniciar.style.background = '#22c55e';
        }
    }
}

function iniciarPollingProgreso(campanaId) {
    const app = window.CampanasApp;
    
    if (app.intervaloEnvio) {
        clearInterval(app.intervaloEnvio);
    }
    
    app.intervaloEnvio = setInterval(async () => {
        try {
            const response = await fetch(`/campanas/api/${campanaId}/progreso`);
            const data = await response.json();
            
            if (data.success) {
                const progreso = data.data;
                
                app.estadisticas.enviados = progreso.enviados;
                app.estadisticas.fallidos = progreso.fallidos;
                
                const exitosos = progreso.exitosos || (progreso.enviados - progreso.fallidos);
                app.estadisticas.tasaExito = progreso.enviados > 0 
                    ? ((exitosos / progreso.enviados) * 100).toFixed(1)
                    : 100;
                
                actualizarEstadisticas();
                
                if (progreso.estado === 'completado' || progreso.estado === 'detenido') {
                    clearInterval(app.intervaloEnvio);
                    app.intervaloEnvio = null;
                    app.campanaActiva = false;
                    
                    const btnIniciar = document.getElementById('btn-iniciar');
                    if (btnIniciar) {
                        btnIniciar.innerHTML = '<i class="fas fa-paper-plane"></i> Iniciar Campaña';
                        btnIniciar.style.background = '#22c55e';
                    }
                    
                    const mensaje = progreso.estado === 'completado' 
                        ? '✅ Campaña completada exitosamente'
                        : '⚠️ Campaña detenida';
                    
                    const tipo = progreso.estado === 'completado' ? 'success' : 'warning';
                    mostrarNotificacion(mensaje, tipo);
                    
                    mostrarResumenCampana(progreso);
                }
            }
            
        } catch (error) {
            console.error('Error obteniendo progreso:', error);
        }
        
    }, 2000);
}

function mostrarResumenCampana(datos) {
    const exitosos = datos.exitosos || (datos.enviados - datos.fallidos);
    const progresoPorcentaje = datos.progreso || ((datos.enviados / window.CampanasApp.estadisticas.total) * 100);
    
    const mensaje = `
        📊 Resumen de Campaña:
        ✅ Enviados: ${datos.enviados}
        ❌ Fallidos: ${datos.fallidos}
        🎯 Exitosos: ${exitosos}
        📈 Tasa de éxito: ${progresoPorcentaje.toFixed(1)}%
    `;
    
    console.log(mensaje);
    mostrarNotificacion(`Campaña finalizada: ${exitosos} mensajes exitosos de ${datos.enviados} enviados`, 'success');
}

window.detenerCampana = async function() {
    const app = window.CampanasApp;
    
    app.campanaActiva = false;
    
    if (app.intervaloEnvio) {
        clearInterval(app.intervaloEnvio);
        app.intervaloEnvio = null;
    }
    
    const esCompletado = app.estadisticas.enviados >= app.estadisticas.total;
    const endpoint = esCompletado ? 'completar' : 'detener';
    
    if (app.campanaActualId) {
        try {
            await fetch(`/campanas/api/${app.campanaActualId}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enviados: app.estadisticas.enviados,
                    fallidos: app.estadisticas.fallidos
                })
            });
            
            console.log(`✅ Campaña ${esCompletado ? 'COMPLETADA' : 'DETENIDA'}`);
        } catch (error) {
            console.error('Error actualizando estado de campaña:', error);
        }
    }
    
    const btnIniciar = document.getElementById('btn-iniciar');
    if (btnIniciar) {
        btnIniciar.innerHTML = '<i class="fas fa-paper-plane"></i> Iniciar Campaña';
        btnIniciar.style.background = '#22c55e';
    }
    
    const mensaje = esCompletado ? 'Campaña completada' : 'Campaña detenida';
    const tipo = esCompletado ? 'success' : 'warning';
    mostrarNotificacion(mensaje, tipo);
};

window.limpiarCampanasDuplicadas = async function() {
    if (!confirm('¿Deseas eliminar campañas duplicadas y sin nombre válido?')) {
        return;
    }
    
    try {
        if (window.mostrarCargando) {
            window.mostrarCargando('Limpiando campañas...');
        } else {
            mostrarNotificacion('Limpiando campañas...', 'info');
        }
        
        const response = await fetch('/campanas/api/limpiar_duplicadas', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (window.ocultarCargando) {
                window.ocultarCargando();
            }
            mostrarNotificacion(data.message, 'success');
            
            if (window.cargarTodosLosDatos && window.AnaliticasApp) {
                await window.cargarTodosLosDatos(window.AnaliticasApp.periodoActual);
            }
            
            console.log('Campañas limpiadas:', data);
        } else {
            throw new Error(data.error || 'Error al limpiar campañas');
        }
        
    } catch (error) {
        console.error('Error al limpiar campañas:', error);
        if (window.ocultarCargando) {
            window.ocultarCargando();
        }
        mostrarNotificacion('Error al limpiar campañas', 'error');
    }
};

window.cargarPlantillasEnCampanas = async function() {
    try {
        console.log('📄 Cargando plantillas desde API...');
        
        const response = await fetch('/plantillas/api');
        const data = await response.json();
        
        if (data.success) {
            const app = window.CampanasApp;
            const selector = document.getElementById('plantilla-select');
            
            if (selector) {
                selector.innerHTML = '<option value="">Selecciona una plantilla</option>';
                app.plantillas = {};
                
                data.data.forEach(plantilla => {
                    const option = document.createElement('option');
                    option.value = plantilla.id;
                    option.textContent = plantilla.nombre;
                    option.dataset.contenido = plantilla.contenido;
                    selector.appendChild(option);
                    
                    app.plantillas[plantilla.id] = plantilla.contenido;
                });
                
                selector.addEventListener('change', function() {
                    const selectedOption = this.options[this.selectedIndex];
                    const contenido = selectedOption.dataset.contenido;
                    const mensajeTextarea = document.getElementById('mensaje-textarea');
                    
                    if (mensajeTextarea && contenido) {
                        mensajeTextarea.value = contenido;
                        
                        const charCount = document.getElementById('char-count');
                        if (charCount) {
                            charCount.textContent = contenido.length;
                        }
                        
                        if (window.FormularioMensaje && window.FormularioMensaje.actualizarVistaPrevia) {
                            window.FormularioMensaje.actualizarVistaPrevia();
                        }
                        
                        mostrarNotificacion('Plantilla cargada correctamente', 'success');
                    }
                });
                
                console.log(`✅ Plantillas cargadas: ${data.data.length}`);
            }
        } else {
            console.log('ℹ️ No hay plantillas disponibles');
        }
    } catch (error) {
        console.error('❌ Error cargando plantillas:', error);
    }
};

function inicializarCampanas() {
    const app = window.CampanasApp;
    
    if (app.inicializado) return;
    
    console.log('🚀 Inicializando aplicación de campañas...');
    
    cargarContactosReales();
    cargarPlantillasEnCampanas();
    actualizarEstadoConexion();
    
    setInterval(() => {
        actualizarEstadoConexion();
        if (!app.campanaActiva) {
            cargarContactosReales();
        }
    }, 30000);
    
    app.inicializado = true;
    console.log('✅ Aplicación de campañas inicializada');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando campañas...');
    
    setTimeout(() => {
        inicializarCampanas();
        
        const componentesRequeridos = [
            'FormularioMensaje',
            'ConfiguracionEnvio', 
            'SeleccionDestinatarios',
            'ProgresoCampana'
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

if (window.location.pathname.includes('campanas') || window.location.pathname === '/') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(cargarPlantillasEnCampanas, 200);
    });
}

console.log('✅ Campanas.js cargado completamente');