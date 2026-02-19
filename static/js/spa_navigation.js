console.log('🚀 Cargando SPA Navigation...');

window.SPANavigation = {
    currentPage: null,
    cache: {},
    
    init() {
        console.log('🔧 Inicializando navegación SPA...');
        this.setupNavigationListeners();
        this.loadInitialPage();
    },
    
    setupNavigationListeners() {
        // Interceptar clicks en el sidebar
        document.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const url = link.getAttribute('href');
                const pageName = link.textContent.trim().toLowerCase();
                
                this.loadPage(url, pageName);
                
                // Actualizar nav activo
                document.querySelectorAll('.nav-item').forEach(item => {
                    item.classList.remove('activo');
                });
                link.classList.add('activo');
            });
        });
        
        // Manejar botón atrás/adelante del navegador
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.url) {
                this.loadPage(e.state.url, e.state.page, false);
            }
        });
    },
    
    async loadPage(url, pageName, pushState = true) {
        console.log(`📄 Cargando página: ${pageName}`);
        
        const appContent = document.getElementById('app-content');
        
        // Mostrar loading
        appContent.innerHTML = `
            <div class="loading-container">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Cargando ${pageName}...</p>
            </div>
        `;
        
        try {
            // Verificar si está en caché
            if (this.cache[url]) {
                console.log('✅ Cargando desde caché');
                this.renderPage(this.cache[url], pageName);
                if (pushState) {
                    history.pushState({ url, page: pageName }, '', url);
                }
                return;
            }
            
            // Hacer fetch de la página
            const response = await fetch(url, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const html = await response.text();
            
            // Guardar en caché
            this.cache[url] = html;
            
            // Renderizar
            this.renderPage(html, pageName);
            
            // Actualizar URL sin recargar
            if (pushState) {
                history.pushState({ url, page: pageName }, '', url);
            }
            
            this.currentPage = pageName;
            
        } catch (error) {
            console.error('❌ Error cargando página:', error);
            appContent.innerHTML = `
                <div class="error-container">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error al cargar la página</h3>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" class="btn-primary">
                        Recargar página
                    </button>
                </div>
            `;
        }
    },
    
    renderPage(html, pageName) {
        const appContent = document.getElementById('app-content');
        
        // Extraer solo el contenido principal
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const mainContent = doc.querySelector('.main-content');
        
        if (mainContent) {
            appContent.innerHTML = `<div class="app-layout"><div class="main-content">${mainContent.innerHTML}</div></div>`;
        } else {
            appContent.innerHTML = html;
        }
        
        // Actualizar título
        document.getElementById('page-title').textContent = `${pageName.charAt(0).toUpperCase() + pageName.slice(1)} - WhatsApp Sender`;
        
        // Cargar scripts específicos de la página
        this.loadPageScripts(pageName);
        
        // Scroll al top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log(`✅ Página ${pageName} renderizada`);
    },
    
    loadPageScripts(pageName) {
        // Mapeo de scripts por página
        const scriptsMap = {
            'contactos': [
                '/static/js/paginas/contactos/contactos.js',
                '/static/js/paginas/contactos/componentes/subir_archivo.js',
                '/static/js/paginas/contactos/componentes/tabla_contactos.js',
                '/static/js/paginas/contactos/componentes/modal_contacto.js',
                '/static/js/paginas/contactos/componentes/footer_estadisticas.js'
            ],
            'campañas': [
                '/static/js/paginas/campanas/campanas.js',
                '/static/js/paginas/campanas/componentes/formulario_mensaje.js',
                '/static/js/paginas/campanas/componentes/configuracion_envio.js',
                '/static/js/paginas/campanas/componentes/progreso_campana.js',
                '/static/js/paginas/campanas/componentes/seleccion_destinatarios.js',
                '/static/js/paginas/campanas/componentes/previsualizacion_whatsapp.js',
                '/static/js/paginas/campanas/componentes/modal_seleccion_contactos.js'
            ],
            'configuración': [
                '/static/js/paginas/configuracion/configuracion.js',
                '/static/js/paginas/configuracion/componentes/conexion_whatsapp.js',
                '/static/js/paginas/configuracion/componentes/configuracion_aplicacion.js'
            ],
            'analíticas': [
                'https://cdn.jsdelivr.net/npm/chart.js',
                '/static/js/paginas/analiticas/analiticas.js',
                '/static/js/paginas/analiticas/componentes/panel_analisis.js',
                '/static/js/paginas/analiticas/componentes/tendencias_entrega.js',
                '/static/js/paginas/analiticas/componentes/distribucion_entregas.js',
                '/static/js/paginas/analiticas/componentes/rendimiento_campanas.js'
            ]
        };
        
        const scripts = scriptsMap[pageName] || [];
        
        scripts.forEach(src => {
            // Verificar si ya está cargado
            if (!document.querySelector(`script[src="${src}"]`)) {
                const script = document.createElement('script');
                script.src = src;
                script.async = false;
                document.body.appendChild(script);
                console.log(`📜 Script cargado: ${src}`);
            }
        });
    },
    
    loadInitialPage() {
        const path = window.location.pathname;
        let pageName = 'campañas';
        
        if (path.includes('contactos')) pageName = 'contactos';
        else if (path.includes('configuracion')) pageName = 'configuración';
        else if (path.includes('analiticas')) pageName = 'analíticas';
        else if (path.includes('plantillas')) pageName = 'plantillas';
        
        this.loadPage(path, pageName, false);
    },
    
    clearCache() {
        this.cache = {};
        console.log('🗑️ Caché limpiada');
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.SPANavigation.init();
});

console.log('✅ SPA Navigation cargado');