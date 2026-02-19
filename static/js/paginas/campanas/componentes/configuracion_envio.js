// configuracion_envio.js - Componente específico para configuración de envío
console.log('Cargando configuracion_envio.js...');

window.ConfiguracionEnvio = {
    inicializado: false,
    
    init() {
        if (this.inicializado) return;
        
        console.log('Configurando componente ConfiguracionEnvio...');
        
        this.configurarEventos();
        this.inicializarSlider();
        this.inicializado = true;
        
        console.log('ConfiguracionEnvio inicializado');
    },
    
    configurarEventos() {
        // Range slider del intervalo
        const intervaloRange = document.getElementById('intervalo-range');
        if (intervaloRange) {
            intervaloRange.addEventListener('input', (e) => {
                this.actualizarSlider(e.target);
            });
        }
    },
    
    inicializarSlider() {
        const intervaloRange = document.getElementById('intervalo-range');
        if (intervaloRange) {
            // Inicializar progreso visual
            const valorInicial = intervaloRange.value || 5;
            this.actualizarSlider(intervaloRange);
            
            // Actualizar display inicial
            const rangeDisplay = document.getElementById('range-display');
            if (rangeDisplay) {
                rangeDisplay.textContent = valorInicial;
            }
        }
    },
    
    actualizarSlider(sliderElement) {
        const valor = sliderElement.value;
        const rangeDisplay = document.getElementById('range-display');
        
        if (rangeDisplay) {
            rangeDisplay.textContent = valor;
        }
        
        // Actualizar progreso visual de la barra verde
        const min = parseFloat(sliderElement.min) || 3;
        const max = parseFloat(sliderElement.max) || 60;
        const progreso = ((valor - min) / (max - min)) * 100;
        sliderElement.style.setProperty('--progress', progreso + '%');
        
        // Calcular duración si la función existe en el contexto global
        if (typeof window.calcularDuracion === 'function') {
            window.calcularDuracion();
        }
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar un poco para que se cargue el archivo principal
    setTimeout(() => {
        window.ConfiguracionEnvio.init();
    }, 50);
});

console.log('configuracion_envio.js cargado');