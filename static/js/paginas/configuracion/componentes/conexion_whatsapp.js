/**
 * Conexión WhatsApp - CON DETECCIÓN DE CIERRE AUTOMÁTICO
 * Detecta cuando la sesión fue cerrada desde el celular
 */

(function() {
    'use strict';

    class ConexionWhatsAppManager {
        constructor() {
            this.isConnected = false;
            this.phoneNumber = '';
            this.browserName = '';
            this.modalCreated = false;
            this.checkInterval = null; // Intervalo para verificar estado
            
            console.log('🔧 ConexionWhatsAppManager: Inicializando...');
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init());
            } else {
                this.init();
            }
        }

        init() {
            console.log('✅ ConexionWhatsAppManager: DOM listo');
            
            setTimeout(() => {
                this.initializeEventListeners();
                this.loadConnectionState();
                this.checkConnectionStatus();
                
                // Iniciar verificación automática cada 5 segundos
                this.startAutoCheck();
            }, 500);
        }

        /**
         * NUEVO: Iniciar verificación automática del estado
         */
        startAutoCheck() {
            // Verificar estado cada 5 segundos
            this.checkInterval = setInterval(() => {
                this.checkConnectionStatus();
            }, 5000);
            
            console.log('🔄 Verificación automática de estado iniciada');
        }

        /**
         * NUEVO: Detener verificación automática
         */
        stopAutoCheck() {
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
                console.log('⏹️ Verificación automática detenida');
            }
        }

        initializeEventListeners() {
            console.log('🎯 Configurando event listeners...');
            
            const disconnectBtn = document.getElementById('disconnectBtn');
            if (disconnectBtn) {
                disconnectBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.disconnectWhatsApp();
                });
            }

            const connectBtn = document.getElementById('connectWhatsAppBtn');
            if (connectBtn) {
                connectBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showPhoneInput();
                });
            }
        }

        async checkConnectionStatus() {
            try {
                const response = await fetch('/configuracion/api/whatsapp/estado');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        const wasConnected = this.isConnected;
                        this.isConnected = data.data.conectado;
                        this.phoneNumber = data.data.numero || '';
                        this.browserName = data.data.navegador || '';
                        
                        // Detectar si la sesión fue cerrada
                        if (wasConnected && !this.isConnected) {
                            console.log('⚠️ Sesión cerrada desde el celular detectada');
                            this.showNotification('La sesión de WhatsApp fue cerrada', 'warning');
                        }
                        
                        this.updateConnectionUI();
                    }
                }
            } catch (error) {
                console.error('❌ Error verificando estado:', error);
            }
        }

        /**
         * NUEVO: Mostrar notificaciones
         */
        showNotification(message, type = 'info') {
            // Usar el sistema de notificaciones del ConfiguracionManager si está disponible
            if (window.configuracionManager) {
                window.configuracionManager.showNotification(message, type);
            } else {
                // Fallback simple
                alert(message);
            }
        }

        showPhoneInput() {
            console.log('📱 Mostrando modal...');
            
            let modal = document.getElementById('phoneInputModal');
            
            if (!modal) {
                this.createPhoneInputModal();
                modal = document.getElementById('phoneInputModal');
            }
            
            if (modal) {
                modal.style.display = 'flex';
                
                setTimeout(() => {
                    const phoneInput = document.getElementById('phoneNumberInput');
                    if (phoneInput) phoneInput.focus();
                }, 200);
            }
        }

        createPhoneInputModal() {
            this.addPhoneModalStyles();
            
            const modal = document.createElement('div');
            modal.id = 'phoneInputModal';
            modal.className = 'phone-modal-overlay';
            modal.style.display = 'none';
            
            modal.innerHTML = `
                <div class="phone-modal">
                    <div class="phone-modal-header">
                        <h3><i class="fas fa-mobile-alt"></i> Conectar WhatsApp</h3>
                        <button class="close-modal" type="button">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="phone-modal-content">
                        <div id="phoneStep" class="modal-step active">
                            <div class="instruction-box">
                                <i class="fas fa-info-circle"></i>
                                <p>Ingresa tu número de teléfono ecuatoriano registrado en WhatsApp</p>
                            </div>
                            
                            <div class="phone-input-group">
                                <div class="country-prefix">
                                    <span class="flag">🇪🇨</span>
                                    <span>+593</span>
                                </div>
                                <input type="tel" id="phoneNumberInput" 
                                       placeholder="9XXXXXXXX" 
                                       maxlength="9" 
                                       pattern="9[0-9]{8}"
                                       autocomplete="off">
                            </div>
                            <div class="phone-validation" id="phoneValidation"></div>
                            
                            <div class="info-note">
                                <i class="fas fa-lightbulb"></i>
                                <small>El número debe empezar con 9 y tener 9 dígitos</small>
                            </div>
                            
                            <button id="connectBtn" type="button" class="btn btn-success full-width" disabled>
                                <i class="fas fa-qrcode"></i>
                                Conectar WhatsApp
                            </button>
                        </div>
                        
                        <div id="connectingStep" class="modal-step">
                            <div class="qr-instructions">
                                <h4>📱 Sigue estos pasos:</h4>
                                <ol>
                                    <li><strong>El navegador se abrirá automáticamente</strong> con WhatsApp Web</li>
                                    <li>Verás un <strong>código QR</strong> en pantalla</li>
                                    <li>Abre <strong>WhatsApp en tu teléfono</strong></li>
                                    <li>Ve a: <strong>⚙️ Configuración → Dispositivos vinculados</strong></li>
                                    <li>Toca <strong>"Vincular un dispositivo"</strong></li>
                                    <li><strong>Escanea el código QR</strong> que aparece en el navegador</li>
                                    <li>¡Listo! La conexión se detectará automáticamente</li>
                                </ol>
                            </div>
                            
                            <div class="qr-status" id="qrStatus">
                                <i class="fas fa-spinner fa-spin"></i>
                                <p>Abriendo navegador y esperando conexión...</p>
                                <small>Esto puede tardar 1-2 minutos dependiendo de tu navegador</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.setupPhoneModalListeners();
            this.modalCreated = true;
        }

        addPhoneModalStyles() {
            if (document.getElementById('phone-modal-styles')) return;
            
            const styles = document.createElement('style');
            styles.id = 'phone-modal-styles';
            styles.innerHTML = `
                .phone-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease-out;
                }

                .phone-modal {
                    background: white;
                    border-radius: 16px;
                    width: 90%;
                    max-width: 500px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: slideUp 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .phone-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 24px;
                    border-bottom: 1px solid #F3F4F6;
                }

                .phone-modal-header h3 {
                    margin: 0;
                    color: #111827;
                    font-size: 1.25rem;
                    font-weight: 600;
                }

                .phone-modal-header h3 i {
                    color: #25D366;
                    margin-right: 8px;
                }

                .close-modal {
                    background: none;
                    border: none;
                    font-size: 1.25rem;
                    color: #6B7280;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }

                .close-modal:hover {
                    background: #F3F4F6;
                    color: #374151;
                }

                .phone-modal-content {
                    padding: 24px;
                }

                .modal-step {
                    display: none;
                }

                .modal-step.active {
                    display: block;
                    animation: fadeIn 0.3s ease-out;
                }

                .instruction-box {
                    background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 24px;
                    display: flex;
                    gap: 12px;
                    align-items: start;
                }

                .instruction-box i {
                    color: #2E7D32;
                    font-size: 1.25rem;
                    margin-top: 2px;
                }

                .instruction-box p {
                    margin: 0;
                    color: #1B5E20;
                    line-height: 1.5;
                }

                .phone-input-group {
                    display: flex;
                    margin-bottom: 16px;
                    border: 2px solid #E5E7EB;
                    border-radius: 8px;
                    overflow: hidden;
                    transition: border-color 0.2s;
                }

                .phone-input-group:focus-within {
                    border-color: #25D366;
                    box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.1);
                }

                .country-prefix {
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                    background: #F9FAFB;
                    border-right: 1px solid #E5E7EB;
                    gap: 8px;
                    font-weight: 500;
                    color: #374151;
                }

                .country-prefix .flag {
                    font-size: 1.5rem;
                }

                #phoneNumberInput {
                    flex: 1;
                    padding: 12px 16px;
                    border: none;
                    outline: none;
                    font-size: 1.125rem;
                    font-family: 'SF Mono', 'Consolas', monospace;
                }

                .phone-validation {
                    margin-bottom: 16px;
                    font-size: 0.875rem;
                    min-height: 20px;
                }

                .validation-success {
                    color: #059669;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .validation-error {
                    color: #DC2626;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .info-note {
                    background: #FEF3C7;
                    padding: 12px;
                    border-radius: 6px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .info-note i {
                    color: #D97706;
                }

                .info-note small {
                    color: #92400E;
                }

                .qr-instructions {
                    background: #F9FAFB;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 24px;
                }

                .qr-instructions h4 {
                    margin: 0 0 12px 0;
                    color: #111827;
                    font-size: 1rem;
                }

                .qr-instructions ol {
                    margin: 0;
                    padding-left: 20px;
                    color: #374151;
                }

                .qr-instructions li {
                    margin-bottom: 8px;
                    line-height: 1.5;
                }

                .qr-status {
                    text-align: center;
                    padding: 32px;
                    background: #F9FAFB;
                    border-radius: 8px;
                    margin-bottom: 16px;
                }

                .qr-status i {
                    font-size: 2rem;
                    color: #25D366;
                    margin-bottom: 12px;
                    display: block;
                }

                .qr-status p {
                    margin: 0 0 8px 0;
                    color: #374151;
                    font-weight: 500;
                }

                .qr-status small {
                    color: #6B7280;
                    font-size: 0.875rem;
                }

                .btn-success {
                    background: #10B981 !important;
                    color: white !important;
                }

                .btn-success:hover:not(:disabled) {
                    background: #059669 !important;
                }

                .full-width {
                    width: 100%;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(60px) scale(0.95); 
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0) scale(1); 
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        setupPhoneModalListeners() {
            const closeBtn = document.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const modal = document.getElementById('phoneInputModal');
                    if (modal) modal.style.display = 'none';
                });
            }

            const phoneInput = document.getElementById('phoneNumberInput');
            if (phoneInput) {
                phoneInput.addEventListener('input', () => this.validatePhoneNumber());
                phoneInput.addEventListener('keypress', (e) => {
                    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
                        e.preventDefault();
                    }
                    
                    if (e.key === 'Enter' && !document.getElementById('connectBtn').disabled) {
                        this.conectarWhatsApp();
                    }
                });
            }

            const connectBtn = document.getElementById('connectBtn');
            if (connectBtn) {
                connectBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.conectarWhatsApp();
                });
            }
        }

        validatePhoneNumber() {
            const phoneInput = document.getElementById('phoneNumberInput');
            const connectBtn = document.getElementById('connectBtn');
            const validation = document.getElementById('phoneValidation');
            
            if (!phoneInput || !connectBtn || !validation) return;

            const phone = phoneInput.value.trim();
            const isValid = /^9[0-9]{8}$/.test(phone);
            
            if (phone.length === 0) {
                validation.textContent = '';
                validation.className = 'phone-validation';
                connectBtn.disabled = true;
            } else if (!isValid) {
                validation.innerHTML = '<i class="fas fa-times-circle"></i> Debe empezar con 9 y tener 9 dígitos';
                validation.className = 'phone-validation validation-error';
                connectBtn.disabled = true;
            } else {
                validation.innerHTML = '<i class="fas fa-check-circle"></i> Número válido';
                validation.className = 'phone-validation validation-success';
                connectBtn.disabled = false;
                this.phoneNumber = `+593${phone}`;
            }
        }

        async conectarWhatsApp() {
            const connectBtn = document.getElementById('connectBtn');
            const phoneStep = document.getElementById('phoneStep');
            const connectingStep = document.getElementById('connectingStep');
            const phoneInput = document.getElementById('phoneNumberInput');
            
            connectBtn.disabled = true;
            connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';

            try {
                // IMPORTANTE: Construir el número completo aquí
                const phoneNumber = phoneInput.value.trim();
                const fullNumber = `+593${phoneNumber}`;
                
                console.log('📱 Enviando número:', fullNumber); // Debug
                
                if (phoneStep) phoneStep.classList.remove('active');
                if (connectingStep) connectingStep.classList.add('active');

                const response = await fetch('/configuracion/api/whatsapp/abrir-whatsapp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        numero: fullNumber  // ← Asegurar que se envía
                    })
                });

                const data = await response.json();
                
                console.log('📥 Respuesta del servidor:', data); // Debug

                if (data.success) {
                    console.log('✅ WhatsApp conectado:', data);
                    
                    const qrStatus = document.getElementById('qrStatus');
                    if (qrStatus) {
                        qrStatus.innerHTML = `
                            <i class="fas fa-check-circle" style="color: #10B981;"></i>
                            <p style="color: #10B981;">¡Conexión exitosa!</p>
                            <small>${data.message || 'WhatsApp conectado correctamente'}</small>
                        `;
                    }
                    
                    setTimeout(() => {
                        const modal = document.getElementById('phoneInputModal');
                        if (modal) modal.style.display = 'none';
                        
                        window.location.reload();
                    }, 2000);
                    
                } else {
                    throw new Error(data.error || 'Error conectando WhatsApp');
                }

            } catch (error) {
                console.error('❌ Error:', error);
                
                const qrStatus = document.getElementById('qrStatus');
                if (qrStatus) {
                    qrStatus.innerHTML = `
                        <i class="fas fa-times-circle" style="color: #EF4444;"></i>
                        <p style="color: #EF4444;">Error de conexión</p>
                        <small>${error.message}</small>
                    `;
                }
                
                setTimeout(() => {
                    if (connectingStep) connectingStep.classList.remove('active');
                    if (phoneStep) phoneStep.classList.add('active');
                    
                    connectBtn.disabled = false;
                    connectBtn.innerHTML = '<i class="fas fa-qrcode"></i> Conectar WhatsApp';
                }, 3000);
            }
        }

        updateConnectionUI() {
            const statusBadge = document.getElementById('whatsappStatus');
            const connectedDiv = document.getElementById('whatsappConnected');
            const disconnectedDiv = document.getElementById('whatsappDisconnected');
            const phoneNumberSpan = document.getElementById('phoneNumber');
            const browserNameSpan = document.getElementById('browserName');

            if (this.isConnected) {
                if (statusBadge) {
                    statusBadge.className = 'status-badge connected';
                    statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Conectado';
                }

                if (connectedDiv) connectedDiv.style.display = 'block';
                if (disconnectedDiv) disconnectedDiv.style.display = 'none';

                if (phoneNumberSpan) phoneNumberSpan.textContent = this.phoneNumber;
                if (browserNameSpan) browserNameSpan.textContent = this.browserName || 'Navegador';

            } else {
                if (statusBadge) {
                    statusBadge.className = 'status-badge disconnected';
                    statusBadge.innerHTML = '<i class="fas fa-times-circle"></i> Desconectado';
                }

                if (connectedDiv) connectedDiv.style.display = 'none';
                if (disconnectedDiv) disconnectedDiv.style.display = 'block';
                
                if (phoneNumberSpan) phoneNumberSpan.textContent = '-';
                if (browserNameSpan) browserNameSpan.textContent = '-';
            }
        }

        async disconnectWhatsApp() {
            if (!confirm('¿Estás seguro de que quieres cerrar la sesión de WhatsApp?')) return;

            const disconnectBtn = document.getElementById('disconnectBtn');
            const originalText = disconnectBtn ? disconnectBtn.innerHTML : '';

            try {
                if (disconnectBtn) {
                    disconnectBtn.disabled = true;
                    disconnectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cerrando sesión...';
                }

                const response = await fetch('/configuracion/api/whatsapp/desconectar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();

                if (data.success || response.ok) {
                    this.isConnected = false;
                    this.phoneNumber = '';
                    this.browserName = '';

                    this.updateConnectionUI();
                    this.showNotification('Sesión de WhatsApp cerrada correctamente', 'success');
                    
                    // Recargar después de 1 segundo
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    throw new Error(data.error || 'Error cerrando sesión');
                }

            } catch (error) {
                console.error('❌ Error:', error);
                this.showNotification('Error cerrando sesión de WhatsApp', 'error');
                
                if (disconnectBtn) {
                    disconnectBtn.disabled = false;
                    disconnectBtn.innerHTML = originalText;
                }
            }
        }

        loadConnectionState() {
            console.log('💾 Cargando estado guardado...');
        }
        
        /**
         * NUEVO: Cleanup al destruir
         */
        destroy() {
            this.stopAutoCheck();
        }
    }

    window.conexionWhatsAppManager = new ConexionWhatsAppManager();

})();