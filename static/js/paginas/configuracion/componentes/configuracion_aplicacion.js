/**
 * Configuración de Aplicación - Gestión de configuraciones específicas de la app
 */

class ConfiguracionAplicacionManager {
    constructor() {
        this.configuration = {
            companyName: 'Mi Empresa'
        };
        this.hasUnsavedChanges = false;
        this.initializeEventListeners();
        this.loadConfiguration();
    }

    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const saveBtn = document.getElementById('saveAppConfigBtn');

            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.saveConfiguration());
            }

            this.setupConfigurationListeners();
        });
    }

    setupConfigurationListeners() {
        const companyNameInput = document.getElementById('companyName');
        
        if (companyNameInput) {
            companyNameInput.addEventListener('input', () => {
                this.handleConfigChange('companyName', companyNameInput.value);
            });
            
            companyNameInput.addEventListener('blur', () => {
                this.validateInput('companyName', companyNameInput.value);
            });
        }
    }

    handleConfigChange(key, value) {
        const oldValue = this.configuration[key];
        
        if (oldValue !== value) {
            this.configuration[key] = value;
            this.markUnsavedChanges(true);
            
            this.dispatchEvent('app-config-changed', {
                setting: key,
                oldValue,
                newValue: value,
                allConfiguration: { ...this.configuration }
            });

            console.log(`📱 Configuración de app cambiada: ${key} = ${value}`);
        }
    }

    validateInput(key, value) {
        const element = document.getElementById(key);
        if (!element) return;

        let isValid = true;
        let errorMessage = '';

        if (key === 'companyName') {
            isValid = value.trim().length >= 2 && value.trim().length <= 50;
            errorMessage = 'El nombre de la empresa debe tener entre 2 y 50 caracteres';
        }

        this.showInputValidation(element, isValid, errorMessage);
        
        return isValid;
    }

    showInputValidation(element, isValid, errorMessage) {
        const existingError = element.parentNode.querySelector('.input-error-message');
        if (existingError) {
            existingError.remove();
        }

        element.classList.remove('input-valid', 'input-error');

        if (isValid) {
            element.classList.add('input-valid');
        } else {
            element.classList.add('input-error');
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'input-error-message';
            errorDiv.textContent = errorMessage;
            element.parentNode.appendChild(errorDiv);

            this.addValidationStyles();
        }
    }

    addValidationStyles() {
        if (!document.getElementById('validation-styles')) {
            const styles = document.createElement('style');
            styles.id = 'validation-styles';
            styles.innerHTML = `
                .input-valid {
                    border-color: #10B981 !important;
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
                }
                
                .input-error {
                    border-color: #EF4444 !important;
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
                }
                
                .input-error-message {
                    color: #EF4444;
                    font-size: 0.75rem;
                    margin-top: 4px;
                    animation: slideDown 0.2s ease-out;
                }
                
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(styles);
        }
    }

    async loadConfiguration() {
        try {
            const response = await fetch('/configuracion/api/configuracion/aplicacion');
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.configuration = { ...this.configuration, ...data.data };
                }
            } else {
                this.loadFromLocalStorage();
            }
            
            this.updateConfigurationUI();
            console.log('📱 Configuración de app cargada:', this.configuration);
            
        } catch (error) {
            console.error('❌ Error cargando configuración de app:', error);
            this.loadFromLocalStorage();
            this.updateConfigurationUI();
        }
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('app_configuration');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.configuration = { ...this.configuration, ...parsed };
            }
        } catch (error) {
            console.error('❌ Error cargando configuración desde localStorage:', error);
        }
    }

    updateConfigurationUI() {
        const companyNameInput = document.getElementById('companyName');

        if (companyNameInput) {
            companyNameInput.value = this.configuration.companyName || this.configuration.nombre_empresa || 'Mi Empresa';
        }
    }

    async saveConfiguration(silent = false) {
        const saveBtn = document.getElementById('saveAppConfigBtn');
        
        if (!silent && saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        }

        try {
            const isValid = this.validateInput('companyName', this.configuration.companyName);

            if (!isValid) {
                throw new Error('Por favor corrige los errores de validación');
            }

            const response = await fetch('/configuracion/api/configuracion/aplicacion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nombre_empresa: this.configuration.companyName
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Configuración de app guardada en servidor:', data);
            } else {
                throw new Error('Error guardando en servidor');
            }

        } catch (error) {
            console.error('⚠️ Error guardando en servidor, usando localStorage:', error);
            localStorage.setItem('app_configuration', JSON.stringify(this.configuration));
        }

        this.markUnsavedChanges(false);

        if (!silent) {
            await this.delay(800);

            this.dispatchEvent('app-config-saved', {
                configuration: { ...this.configuration },
                timestamp: new Date().toISOString()
            });

            this.showNotification('Configuración de aplicación guardada', 'success');

            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Configuración';
            }
        }
    }

    markUnsavedChanges(hasChanges) {
        this.hasUnsavedChanges = hasChanges;
        
        this.dispatchEvent('app-config-changed', {
            hasUnsavedChanges: hasChanges,
            configuration: { ...this.configuration }
        });
    }

    getConfiguration(key) {
        return this.configuration[key];
    }

    setConfiguration(key, value) {
        this.handleConfigChange(key, value);
        
        const element = document.getElementById(key);
        if (element) {
            element.value = value;
        }
    }

    getAllConfiguration() {
        return { ...this.configuration };
    }

    hasChanges() {
        return this.hasUnsavedChanges;
    }

    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    showNotification(message, type = 'info') {
        if (window.configuracionManager) {
            window.configuracionManager.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Inicializando ConfiguracionAplicacionManager...');
    window.configuracionAplicacionManager = new ConfiguracionAplicacionManager();
});

window.ConfiguracionAplicacionManager = ConfiguracionAplicacionManager;