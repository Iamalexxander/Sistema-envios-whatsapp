/**
 * Configuración Principal - JavaScript
 * Controlador global que coordina todos los componentes de configuración
 */

class ConfiguracionManager {
    constructor() {
        this.components = {};
        this.isLoading = false;
        this.notificationContainer = null;
        this.initializeComponents();
        this.initializeEventListeners();
        this.createNotificationContainer();
    }

    /**
     * Inicializar componentes
     */
    initializeComponents() {
        document.addEventListener('DOMContentLoaded', () => {
            // Esperar a que todos los componentes estén disponibles
            setTimeout(() => {
                this.components.whatsapp = window.conexionWhatsAppManager;
                this.components.settings = window.configuracionPredeterminadaManager;
                this.components.app = window.configuracionAplicacionManager;
                this.components.system = window.estadoSistemaManager;
                
                console.log('🎛️ Componentes de configuración inicializados:', this.components);
            }, 200);
        });
    }

    /**
     * Inicializar event listeners globales
     */
    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Botón de actualizar estado global
            const refreshBtn = document.getElementById('refreshStatusBtn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => this.refreshAllComponents());
            }

            // Escuchar eventos personalizados de componentes
            this.setupCustomEventListeners();
        });
    }

    /**
     * Configurar listeners de eventos personalizados
     */
    setupCustomEventListeners() {
        // Eventos de WhatsApp
        document.addEventListener('whatsapp-status-changed', (e) => {
            this.handleWhatsAppStatusChange(e.detail);
        });

        // Eventos de configuración
        document.addEventListener('settings-changed', (e) => {
            this.handleSettingsChange(e.detail);
        });

        // Eventos de sistema
        document.addEventListener('system-health-updated', (e) => {
            this.handleSystemHealthUpdate(e.detail);
        });

        // Eventos de aplicación
        document.addEventListener('app-config-changed', (e) => {
            this.handleAppConfigChange(e.detail);
        });
    }

    /**
     * Actualizar todos los componentes
     */
    async refreshAllComponents() {
        if (this.isLoading) return;
        
        this.showGlobalLoading(true);
        
        try {
            const promises = [];
            
            // Actualizar WhatsApp
            if (this.components.whatsapp) {
                promises.push(this.components.whatsapp.checkConnection());
            }
            
            // Actualizar sistema
            if (this.components.system) {
                promises.push(this.components.system.updateAllHealth());
            }
            
            // Actualizar configuraciones
            if (this.components.settings) {
                promises.push(this.components.settings.loadSettings());
            }
            
            if (this.components.app) {
                promises.push(this.components.app.loadConfiguration());
            }
            
            await Promise.all(promises);
            
            this.showNotification('Estado del sistema actualizado correctamente', 'success');
            
        } catch (error) {
            console.error('❌ Error actualizando componentes:', error);
            this.showNotification('Error actualizando el estado del sistema', 'error');
        } finally {
            this.showGlobalLoading(false);
        }
    }

    /**
     * Manejar cambio de estado de WhatsApp
     */
    handleWhatsAppStatusChange(data) {
        console.log('📱 Estado de WhatsApp cambió:', data);
        
        // Actualizar estado del sistema
        if (this.components.system) {
            this.components.system.updateWhatsAppHealth(data.connected, data);
        }

        // Mostrar notificación apropiada
        if (data.connected) {
            this.showNotification(`WhatsApp conectado desde ${data.deviceInfo || 'dispositivo'}`, 'success');
        } else {
            this.showNotification('WhatsApp desconectado', 'warning');
        }
    }

    /**
     * Manejar cambios en configuración predeterminada
     */
    handleSettingsChange(data) {
        console.log('⚙️ Configuración cambió:', data);
        this.markUnsavedChanges(true, 'settings');
    }

    /**
     * Manejar cambios en configuración de aplicación
     */
    handleAppConfigChange(data) {
        console.log('📱 Configuración de app cambió:', data);
        this.markUnsavedChanges(true, 'app');
    }

    /**
     * Manejar actualización de salud del sistema
     */
    handleSystemHealthUpdate(data) {
        console.log('🏥 Salud del sistema actualizada:', data);
        
        // Verificar si hay alertas críticas
        if (data.criticalAlerts && data.criticalAlerts.length > 0) {
            data.criticalAlerts.forEach(alert => {
                this.showNotification(alert.message, 'error');
            });
        }
    }

    /**
     * Marcar cambios no guardados
     */
    markUnsavedChanges(hasChanges, component = 'all') {
        const selectors = {
            all: '[id$="SaveBtn"], [id$="saveBtn"]',
            settings: '#saveSettingsBtn',
            app: '#saveAppConfigBtn'
        };

        const buttons = document.querySelectorAll(selectors[component] || selectors.all);
        
        buttons.forEach(btn => {
            if (hasChanges) {
                btn.classList.add('has-changes');
                btn.style.backgroundColor = '#F59E0B';
                btn.style.borderColor = '#F59E0B';
                
                // Agregar indicador visual
                if (!btn.querySelector('.unsaved-indicator')) {
                    const indicator = document.createElement('span');
                    indicator.className = 'unsaved-indicator';
                    indicator.innerHTML = ' •';
                    indicator.style.color = '#FFF';
                    btn.appendChild(indicator);
                }
            } else {
                btn.classList.remove('has-changes');
                btn.style.backgroundColor = '';
                btn.style.borderColor = '';
                
                // Remover indicador
                const indicator = btn.querySelector('.unsaved-indicator');
                if (indicator) {
                    indicator.remove();
                }
            }
        });
    }

    /**
     * Mostrar loading global
     */
    showGlobalLoading(show) {
        this.isLoading = show;
        const overlay = document.getElementById('loadingOverlay');
        
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
        
        // Actualizar botón de refresh
        const refreshBtn = document.getElementById('refreshStatusBtn');
        if (refreshBtn) {
            refreshBtn.disabled = show;
            
            if (show) {
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
            } else {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar Estado';
            }
        }
    }

    /**
     * Crear contenedor de notificaciones
     */
    createNotificationContainer() {
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.innerHTML = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1001;
                    min-width: 350px;
                    max-width: 500px;
                    padding: 16px 20px;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                    animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .notification-success { 
                    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                    color: white;
                }
                
                .notification-error { 
                    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
                    color: white;
                }
                
                .notification-warning { 
                    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
                    color: white;
                }
                
                .notification-info { 
                    background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
                    color: white;
                }
                
                .notification-content { 
                    display: flex; 
                    align-items: center; 
                    gap: 12px; 
                    font-weight: 500;
                }
                
                .notification-content i {
                    font-size: 1.2rem;
                }
                
                .notification-close { 
                    background: rgba(255, 255, 255, 0.2); 
                    border: none; 
                    cursor: pointer; 
                    padding: 4px 8px; 
                    border-radius: 4px;
                    color: white;
                    transition: background-color 0.2s;
                }
                
                .notification-close:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
                
                @keyframes slideInRight { 
                    from { 
                        transform: translateX(100%) scale(0.8); 
                        opacity: 0; 
                    } 
                    to { 
                        transform: translateX(0) scale(1); 
                        opacity: 1; 
                    } 
                }
            `;
            document.head.appendChild(styles);
        }
    }

    /**
     * Mostrar notificación
     */
    showNotification(message, type = 'info', duration = 5000) {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remover después del tiempo especificado
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideInRight 0.3s reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }

    /**
     * Obtener icono de notificación
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    }

    /**
     * Obtener instancia de componente
     */
    getComponent(name) {
        return this.components[name];
    }

    /**
     * Verificar si todos los componentes están listos
     */
    areComponentsReady() {
        const requiredComponents = ['whatsapp', 'settings', 'app', 'system'];
        return requiredComponents.every(name => this.components[name]);
    }

    /**
     * Ejecutar cuando todos los componentes estén listos
     */
    onComponentsReady(callback) {
        const checkReady = () => {
            if (this.areComponentsReady()) {
                callback();
            } else {
                setTimeout(checkReady, 100);
            }
        };
        checkReady();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎛️ Inicializando ConfiguracionManager...');
    window.configuracionManager = new ConfiguracionManager();
});

// Exportar para uso global
window.ConfiguracionManager = ConfiguracionManager;