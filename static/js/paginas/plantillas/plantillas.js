// plantillas.js - Controlador principal de plantillas
console.log('📋 Cargando plantillas.js...');

// Estado global de plantillas
window.PlantillasApp = {
    plantillaSeleccionada: null,
    modoEdicion: false,
    plantillas: [],
    categorias: [],
    inicializado: false
};

// Funciones globales
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

// API Functions
window.PlantillasAPI = {
    async obtenerTodas() {
        try {
            const response = await fetch('/plantillas/api');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error obteniendo plantillas:', error);
            throw error;
        }
    },

    async obtenerPorId(id) {
        try {
            const response = await fetch(`/plantillas/api/${id}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error obteniendo plantilla:', error);
            throw error;
        }
    },

    async crear(plantilla) {
        try {
            const response = await fetch('/plantillas/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(plantilla)
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error creando plantilla:', error);
            throw error;
        }
    },

    async actualizar(id, plantilla) {
        try {
            const response = await fetch(`/plantillas/api/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(plantilla)
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error actualizando plantilla:', error);
            throw error;
        }
    },

    async eliminar(id) {
        try {
            const response = await fetch(`/plantillas/api/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error eliminando plantilla:', error);
            throw error;
        }
    },

    async buscar(termino) {
        try {
            const response = await fetch(`/plantillas/api/buscar?q=${encodeURIComponent(termino)}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error buscando plantillas:', error);
            throw error;
        }
    },

    async obtenerCategorias() {
        try {
            const response = await fetch('/plantillas/categorias/api');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error obteniendo categorías:', error);
            throw error;
        }
    },

    async crearCategoria(categoria) {
        try {
            const response = await fetch('/plantillas/categorias/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(categoria)
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error creando categoría:', error);
            throw error;
        }
    },

    async eliminarCategoria(id) {
        try {
            const response = await fetch(`/plantillas/categorias/api/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error eliminando categoría:', error);
            throw error;
        }
    }
};

// Funciones utilitarias
window.contarVariables = function(contenido) {
    const regex = /_[A-Z_]+_/g;
    const matches = contenido.match(regex);
    return matches ? new Set(matches).size : 0;
};

window.extraerVariables = function(contenido) {
    const regex = /_([A-Z_]+)_/g;
    const variables = [];
    let match;
    while ((match = regex.exec(contenido)) !== null) {
        variables.push(match[1]);
    }
    return [...new Set(variables)];
};

window.reemplazarVariables = function(contenido) {
    const variables = {
        '_NAME_': 'María González',
        '_PRODUCTO_': 'Servicio Premium',
        '_EMPRESA_': 'WhatsApp Sender',
        '_ENLACE_': 'https://ejemplo.com',
        '_PRECIO_': '$99.99',
        '_FECHA_': new Date().toLocaleDateString('es-ES'),
        '_HORA_': new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        '_TELEFONO_': '+593 99 123 4567'
    };
    
    let resultado = contenido;
    for (const [variable, valor] of Object.entries(variables)) {
        resultado = resultado.replace(new RegExp(variable, 'g'), valor);
    }
    
    return resultado;
};

// Seleccionar plantilla
window.seleccionarPlantilla = function(plantilla) {
    const app = window.PlantillasApp;
    
    app.plantillaSeleccionada = plantilla;
    
    // Ocultar empty state y mostrar workspace
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('templateWorkspace').classList.remove('hidden');
    
    // Actualizar biblioteca para mostrar selección
    if (window.BibliotecaPlantillas) {
        window.BibliotecaPlantillas.marcarSeleccionada(plantilla.id);
    }
    
    // Actualizar editor
    if (window.EditorPlantillas) {
        window.EditorPlantillas.mostrarPlantilla(plantilla);
    }
    
    // Actualizar vista previa
    if (window.VistaPrevia) {
        window.VistaPrevia.actualizar(plantilla.contenido);
    }
    
    console.log('Plantilla seleccionada:', plantilla.nombre);
};

// Crear nueva plantilla
window.crearNuevaPlantilla = function() {
    const nuevaPlantilla = {
        id: 'nuevo',
        nombre: '',
        categoria: '',
        contenido: '',
        variables: [],
        usos: 0,
        fecha_creacion: new Date().toLocaleDateString('es-ES'),
        fecha_modificacion: new Date().toLocaleDateString('es-ES')
    };
    
    seleccionarPlantilla(nuevaPlantilla);
    
    if (window.EditorPlantillas) {
        window.EditorPlantillas.activarModoEdicion();
    }
};

// Cargar plantillas para campañas
window.cargarPlantillasParaCampanas = async function() {
    try {
        const response = await window.PlantillasAPI.obtenerTodas();
        
        if (response.success) {
            const selector = document.getElementById('plantilla-select');
            if (selector) {
                selector.innerHTML = '<option value="">Selecciona una plantilla</option>';
                
                response.data.forEach(plantilla => {
                    const option = document.createElement('option');
                    option.value = plantilla.id;
                    option.textContent = plantilla.nombre;
                    option.dataset.contenido = plantilla.contenido;
                    selector.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error cargando plantillas para campañas:', error);
    }
};

// Inicialización
function inicializarPlantillas() {
    const app = window.PlantillasApp;
    
    if (app.inicializado) return;
    
    console.log('🚀 Inicializando aplicación de plantillas...');
    
    // Configurar botón nueva plantilla
    const btnNueva = document.getElementById('btnNuevaPlantilla');
    if (btnNueva) {
        btnNueva.addEventListener('click', crearNuevaPlantilla);
    }
    
    // Marcar como inicializado
    app.inicializado = true;
    
    console.log('✅ Aplicación de plantillas inicializada');
}

// Event listeners principales
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando plantillas...');
    
    setTimeout(() => {
        inicializarPlantillas();
        
        // Verificar componentes
        const componentes = [
            'BibliotecaPlantillas',
            'EditorPlantillas',
            'VistaPrevia',
            'ModalCategorias'
        ];
        
        componentes.forEach(componente => {
            if (window[componente] && window[componente].inicializado) {
                console.log(`✅ Componente ${componente} cargado`);
            } else {
                console.warn(`⚠️ Componente ${componente} no encontrado`);
            }
        });
    }, 100);
});

// Cargar plantillas en campañas si estamos en esa página
if (window.location.pathname.includes('campanas')) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(cargarPlantillasParaCampanas, 200);
    });
}

// ===============================================
// VERIFICACIÓN WHATSAPP ANTES DE USAR PLANTILLAS
// ===============================================

// Sobrescribir la función de usar plantilla en campaña
const seleccionarPlantillaOriginal = window.seleccionarPlantilla;

window.seleccionarPlantilla = function(plantilla) {
    // Permitir ver y editar plantillas sin restricción
    seleccionarPlantillaOriginal(plantilla);
    
    // La verificación solo ocurre al enviar desde campañas
    console.log('Plantilla seleccionada:', plantilla.nombre);
};

// Interceptar cuando se use plantilla en selector de campaña
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const plantillaSelect = document.getElementById('plantilla-select');
        if (plantillaSelect && window.location.pathname.includes('campanas')) {
            // No bloquear selección, solo advertir
            plantillaSelect.addEventListener('change', function() {
                if (this.value && !window.WhatsAppStatus?.conectado) {
                    window.mostrarAlertaWhatsApp({
                        tipo: 'warning',
                        titulo: 'WhatsApp Desconectado',
                        mensaje: 'Recuerda conectar WhatsApp antes de enviar la campaña',
                        mostrarBotonConectar: true,
                        autoCerrar: 5000
                    });
                }
            });
        }
    }, 500);
});

console.log('✅ Plantillas.js cargado completamente');