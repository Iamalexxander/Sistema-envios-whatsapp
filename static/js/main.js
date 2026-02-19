// Funciones de utilidad
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function toggleVisibility(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = element.style.display === 'none' ? 'block' : 'none';
    }
}

// Cerrar modales al hacer clic fuera
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Cerrar modales con ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }
});

// Funciones para búsqueda
function filterTable(inputId, tableId) {
    const input = document.getElementById(inputId);
    const table = document.getElementById(tableId);
    
    if (!input || !table) return;
    
    input.addEventListener('input', function() {
        const filter = this.value.toLowerCase();
        const rows = table.getElementsByTagName('tr');
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.getElementsByTagName('td');
            let found = false;
            
            for (let j = 0; j < cells.length; j++) {
                if (cells[j].textContent.toLowerCase().includes(filter)) {
                    found = true;
                    break;
                }
            }
            
            row.style.display = found ? '' : 'none';
        }
    });
}

// Funciones para drag & drop
function initFileUpload(areaId, inputId, callback) {
    const area = document.getElementById(areaId);
    const input = document.getElementById(inputId);
    
    if (!area || !input) return;
    
    // Eventos de drag & drop
    area.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    
    area.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });
    
    area.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            input.files = files;
            if (callback) callback(files);
        }
    });
    
    // Click para seleccionar archivo
    area.addEventListener('click', function() {
        input.click();
    });
    
    // Cambio en input
    input.addEventListener('change', function() {
        if (this.files.length > 0 && callback) {
            callback(this.files);
        }
    });
}

// Formatear números
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Formatear fechas
function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Validación de formularios
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
    });
    
    return isValid;
}

// Mostrar notificaciones toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Estilos del toast
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: var(--radius);
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    // Colores según tipo
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#2563EB'
    };
    
    toast.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(toast);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Agregar estilos de animación para toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .form-input.error {
        border-color: var(--error);
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
`;
document.head.appendChild(style);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('WhatsApp Sender App iniciada');
    
    // Inicializar funciones específicas según la página
    const currentPage = document.body.getAttribute('data-page');
    
    switch(currentPage) {
        case 'contacts':
            initContactsPage();
            break;
        case 'templates':
            initTemplatesPage();
            break;
        case 'campaigns':
            initCampaignsPage();
            break;
        case 'analytics':
            initAnalyticsPage();
            break;
    }
});

// Funciones específicas por página
function initContactsPage() {
    // Filtrar tabla de contactos
    filterTable('contact-search', 'contacts-table');
    
    // Inicializar upload de archivo
    initFileUpload('file-upload-area', 'file-input', function(files) {
        const file = files[0];
        if (file) {
            document.getElementById('file-name').textContent = file.name;
            showToast('Archivo seleccionado: ' + file.name, 'success');
        }
    });
}

function initTemplatesPage() {
    // Selección de plantillas
    const templateCards = document.querySelectorAll('.template-card');
    templateCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remover selección anterior
            templateCards.forEach(c => c.classList.remove('selected'));
            // Agregar selección actual
            this.classList.add('selected');
            
            // Mostrar detalles de la plantilla
            const templateId = this.getAttribute('data-template-id');
            showTemplateDetails(templateId);
        });
    });
}

function showTemplateDetails(templateId) {
    // Obtener datos de la plantilla (esto vendría del servidor en una app real)
    const templates = {
        '1': {
            name: 'Promoción de Bienvenida',
            content: 'Hola {{name}}, ¡bienvenido a nuestra promoción exclusiva de {{product}}! 🎉\n\nTenemos ofertas increíbles esperándote en {{company}}. ¡No te las pierdas!\n\nHaz clic aquí para saber más: {{link}}',
            category: 'Marketing',
            usageCount: 245,
            createdDate: '15/01/2024'
        }
        // Agregar más plantillas aquí
    };
    
    const template = templates[templateId];
    if (template) {
        document.getElementById('template-details').style.display = 'block';
        document.getElementById('template-name-display').textContent = template.name;
        document.getElementById('template-content-display').textContent = template.content;
        document.getElementById('template-category-display').textContent = template.category;
        document.getElementById('template-usage-display').textContent = template.usageCount + ' usos';
        document.getElementById('template-date-display').textContent = template.createdDate;
        
        // Actualizar vista previa
        updatePreview(template.content);
    }
}

function updatePreview(content) {
    const preview = content
        .replace(/{{name}}/g, 'María González')
        .replace(/{{company}}/g, 'WhatsApp Sender')
        .replace(/{{product}}/g, 'Servicio Premium')
        .replace(/{{link}}/g, 'https://ejemplo.com');
    
    document.getElementById('message-preview').textContent = preview;
    document.getElementById('char-count').textContent = preview.length;
    document.getElementById('var-count').textContent = (content.match(/{{.*?}}/g) || []).length;
    document.getElementById('msg-count').textContent = Math.ceil(preview.length / 160);
}

function initCampaignsPage() {
    // Funcionalidad específica de campañas
    console.log('Página de campañas inicializada');
}

function initAnalyticsPage() {
    // Funcionalidad específica de analíticas
    console.log('Página de analíticas inicializada');
}