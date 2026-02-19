// JavaScript para el sidebar responsive mejorado

document.addEventListener('DOMContentLoaded', function() {
    inicializarSidebar();
});

function inicializarSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (!sidebarToggle || !sidebar || !overlay) {
        console.warn('Elementos del sidebar no encontrados');
        return;
    }
    
    // Toggle sidebar en móvil
    sidebarToggle.addEventListener('click', function(e) {
        e.preventDefault();
        toggleSidebar();
    });
    
    // Cerrar sidebar al hacer click en overlay
    overlay.addEventListener('click', function() {
        cerrarSidebar();
    });
    
    // Cerrar sidebar con tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('mostrar')) {
            cerrarSidebar();
        }
    });
    
    // Manejar clicks en elementos del nav
    const navItems = sidebar.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Resetear todos los elementos a blanco
            resetearTodosLosNavs();
            
            // Marcar solo este elemento como activo
            this.classList.add('activo');
            
            // Cerrar sidebar en móvil
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    cerrarSidebar();
                }, 150);
            }
            
            // Scroll al top
            scrollAlTop();
        });
    });
    
    // Manejar redimensionamiento de ventana
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            cerrarSidebar();
        }
    });
    
    // Establecer elemento activo basado en la URL
    establecerNavActivoSegunURL();
    
    // Debug inicial
    console.log('Sidebar inicializado correctamente');
}

// Función para resetear todos los navs a blanco
function resetearTodosLosNavs() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('activo');
    });
}

// Función mejorada para establecer el nav activo según la URL
function establecerNavActivoSegunURL() {
    const currentPath = window.location.pathname.toLowerCase();
    const navItems = document.querySelectorAll('.nav-item');
    
    // Primero resetear todos
    resetearTodosLosNavs();
    
    let activoEncontrado = false;
    
    // Verificar cada elemento del nav
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href) {
            const hrefLower = href.toLowerCase();
            
            // Verificar coincidencias específicas
            if ((currentPath.includes('contactos') && hrefLower.includes('contactos')) ||
                (currentPath.includes('plantillas') && hrefLower.includes('plantillas')) ||
                (currentPath.includes('analiticas') && hrefLower.includes('analiticas')) ||
                (currentPath.includes('configuracion') && hrefLower.includes('configuracion')) ||
                (currentPath.includes('campanas') && hrefLower.includes('campanas'))) {
                
                item.classList.add('activo');
                activoEncontrado = true;
                console.log('Nav activo establecido:', item.textContent.trim());
            }
        }
    });
    
    // Si no se encontró ninguna coincidencia, activar campañas por defecto
    if (!activoEncontrado) {
        const campanasNav = document.querySelector('[href*="campanas"]');
        if (campanasNav) {
            campanasNav.classList.add('activo');
            console.log('Nav activo por defecto: campañas');
        }
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    
    if (sidebar.classList.contains('mostrar')) {
        cerrarSidebar();
    } else {
        abrirSidebar();
    }
}

function abrirSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    sidebar.classList.add('mostrar');
    overlay.classList.add('activo');
    document.body.style.overflow = 'hidden';
}

function cerrarSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    sidebar.classList.remove('mostrar');
    overlay.classList.remove('activo');
    document.body.style.overflow = '';
}

// Función para marcar manualmente un elemento como activo
function marcarNavActivo(seccion) {
    // Resetear todos a blanco
    resetearTodosLosNavs();
    
    // Buscar y activar el elemento correspondiente
    const navItem = document.querySelector(`[href*="${seccion}"]`);
    if (navItem) {
        navItem.classList.add('activo');
        console.log(`Nav marcado como activo: ${seccion}`);
    }
    
    // Cerrar sidebar en móvil
    if (window.innerWidth <= 768) {
        cerrarSidebar();
    }
}

// Función para detectar la sección actual automáticamente
function detectarSeccionActual() {
    const path = window.location.pathname.toLowerCase();
    
    if (path.includes('contactos')) return 'contactos';
    if (path.includes('plantillas')) return 'plantillas';
    if (path.includes('analiticas')) return 'analiticas';
    if (path.includes('configuracion')) return 'configuracion';
    if (path.includes('campanas')) return 'campanas';
    
    return 'campanas'; // Por defecto
}

// Función para scroll suave al top
function scrollAlTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Función para agregar badge de notificación
function agregarBadgeSidebar(seccion, mostrar = true) {
    const navItem = document.querySelector(`[href*="${seccion}"]`);
    
    if (navItem) {
        if (mostrar) {
            navItem.classList.add('con-badge');
        } else {
            navItem.classList.remove('con-badge');
        }
    }
}

// Función de utilidad para obtener el elemento nav activo actual
function obtenerNavActivo() {
    return document.querySelector('.nav-item.activo');
}

// Función para debugging
function debugSidebar() {
    const navActivo = obtenerNavActivo();
    console.log('=== DEBUG SIDEBAR ===');
    console.log('URL actual:', window.location.pathname);
    console.log('Nav activo:', navActivo ? navActivo.textContent.trim() : 'Ninguno');
    console.log('Sección detectada:', detectarSeccionActual());
    console.log('====================');
}

// Función para forzar la actualización del nav activo (útil para SPA)
function actualizarNavActivo() {
    setTimeout(() => {
        establecerNavActivoSegunURL();
    }, 100);
}

// Función para inicializar desde Flask/Jinja2
function inicializarDesdeFlask(pantallaActual) {
    if (pantallaActual) {
        setTimeout(() => {
            marcarNavActivo(pantallaActual);
        }, 100);
    }
}

// Event listeners adicionales para mejor funcionalidad
document.addEventListener('DOMContentLoaded', function() {
    // Detectar cambios de URL para SPA
    let currentUrl = window.location.href;
    setInterval(() => {
        if (currentUrl !== window.location.href) {
            currentUrl = window.location.href;
            actualizarNavActivo();
        }
    }, 500);
    
    // Agregar eventos táctiles para móvil
    if ('ontouchstart' in window) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            let startX;
            
            sidebar.addEventListener('touchstart', function(e) {
                startX = e.touches[0].clientX;
            });
            
            sidebar.addEventListener('touchmove', function(e) {
                if (!startX) return;
                
                const currentX = e.touches[0].clientX;
                const diff = startX - currentX;
                
                // Si swipe hacia la izquierda y estamos en móvil
                if (diff > 50 && window.innerWidth <= 768) {
                    cerrarSidebar();
                }
            });
        }
    }
});

// Exponer funciones globalmente para uso en otros scripts
window.SidebarManager = {
    marcarActivo: marcarNavActivo,
    resetearTodos: resetearTodosLosNavs,
    agregarBadge: agregarBadgeSidebar,
    debug: debugSidebar,
    detectarSeccion: detectarSeccionActual,
    actualizar: actualizarNavActivo
};