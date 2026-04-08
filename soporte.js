let soporteInicializado = false;

// ==========================================
// 1. GANCHOS DE NAVEGACIÓN
// ==========================================
document.addEventListener('moduloCargado', (e) => {
    if (e.detail.modulo === 'soporte') {
        inicializarModuloSoporte();
    }
});

// Observador para la primera carga o clics en el menú
document.addEventListener('DOMContentLoaded', () => {
    const secSoporte = document.getElementById('sec-soporte');
    if (secSoporte) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class' && !secSoporte.classList.contains('hidden')) {
                    inicializarModuloSoporte();
                }
            });
        });
        observer.observe(secSoporte, { attributes: true });
    }
});

// ==========================================
// 2. INICIALIZACIÓN DEL MÓDULO Y HTML/CSS
// ==========================================
function inicializarModuloSoporte() {
    if (soporteInicializado) return;
    soporteInicializado = true;

    const container = document.getElementById('sec-soporte');
    if (!container) return;

    container.innerHTML = `
        <style>
            .support-wrapper-premium {
                max-width: 1100px;
                margin: 0 auto;
                padding: 20px 0;
            }

            .support-header-main {
                text-align: center;
                margin-bottom: 50px;
            }
            .support-header-main h1 {
                font-family: 'Righteous', cursive;
                font-size: 2.5rem;
                color: var(--text-white);
                margin-bottom: 10px;
                letter-spacing: 1px;
            }
            .support-header-main p {
                color: var(--text-gray);
                font-size: 1rem;
                font-weight: 500;
            }

            .support-grid-premium {
                display: grid;
                grid-template-columns: 1fr 1.2fr;
                gap: 40px;
                align-items: flex-start;
            }

            /* --- COLUMNA IZQUIERDA: TARJETA DE SOPORTE --- */
            .support-card-elite {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 20px;
                padding: 40px 30px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            }

            .support-icon-top {
                background: rgba(124, 58, 237, 0.1);
                color: var(--accent-text);
                width: 70px;
                height: 70px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 20px;
                font-size: 2.5rem;
                margin: 0 auto 20px auto;
                box-shadow: 0 0 20px var(--accent-glow);
            }

            .support-card-elite h2 {
                color: var(--text-white);
                font-family: 'Righteous', cursive;
                letter-spacing: 1px;
                margin-bottom: 10px;
                font-size: 1.5rem;
            }
            
            .support-card-elite p {
                color: var(--text-gray);
                font-size: 0.85rem;
                margin-bottom: 30px;
                line-height: 1.5;
            }

            .support-btn-action {
                width: 100%;
                background: var(--bg-dark);
                border: 1px solid var(--border-color);
                color: var(--text-white);
                padding: 16px 20px;
                border-radius: 12px;
                font-weight: 800;
                font-size: 0.85rem;
                letter-spacing: 1px;
                text-transform: uppercase;
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 15px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .support-btn-action i {
                color: var(--accent-text);
                font-size: 1.3rem;
                transition: transform 0.3s;
            }

            .support-btn-action:hover {
                border-color: var(--accent-text);
                background: rgba(124, 58, 237, 0.05);
                box-shadow: 0 4px 15px var(--accent-glow);
            }
            
            .support-btn-action:hover i {
                transform: scale(1.1);
            }

            .support-guarantee-box {
                margin-top: 20px;
                background: rgba(16, 185, 129, 0.05);
                border: 1px solid rgba(16, 185, 129, 0.2);
                border-radius: 12px;
                padding: 15px;
                display: flex;
                align-items: center;
                gap: 15px;
                text-align: left;
            }

            .support-guarantee-box i {
                color: var(--success);
                font-size: 2rem;
            }

            .support-guarantee-box p {
                margin: 0;
                color: var(--text-main);
                font-size: 0.8rem;
                line-height: 1.4;
            }

            /* --- COLUMNA DERECHA: FAQ --- */
            .faq-container {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .faq-header-title {
                color: var(--text-white);
                font-family: 'Righteous', cursive;
                letter-spacing: 1px;
                font-size: 1.3rem;
                margin-bottom: 15px;
                text-transform: uppercase;
            }

            .faq-item {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                overflow: hidden;
                transition: all 0.3s ease;
            }

            .faq-question {
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
                font-weight: 700;
                font-size: 0.95rem;
                color: var(--text-white);
                user-select: none;
                transition: background 0.3s;
            }

            .faq-question:hover {
                background: var(--bg-dark);
            }

            .faq-arrow {
                color: var(--accent-text);
                transition: transform 0.3s ease;
            }

            .faq-answer {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.4s ease-out, padding 0.4s ease;
                background: var(--bg-dark);
                color: var(--text-gray);
                font-size: 0.9rem;
                line-height: 1.6;
                padding: 0 20px;
            }

            .faq-item.active {
                border-color: var(--accent-text);
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }

            .faq-item.active .faq-arrow {
                transform: rotate(180deg);
            }

            .faq-item.active .faq-answer {
                max-height: 200px; /* Suficiente para el texto */
                padding: 0 20px 20px 20px;
                border-top: 1px solid var(--border-color);
            }

            @media (max-width: 900px) {
                .support-grid-premium {
                    grid-template-columns: 1fr;
                }
                .support-header-main h1 { font-size: 2rem; }
            }
        </style>

        <div class="support-wrapper-premium">
            <div class="support-header-main">
                <h1>CENTRO DE AYUDA</h1>
                <p>Resolvemos tus dudas y garantizamos tu entretenimiento.</p>
            </div>

            <div class="support-grid-premium">
                <div class="support-card-elite">
                    <div class="support-icon-top">
                        <i class="material-icons-round">support_agent</i>
                    </div>
                    <h2>SOPORTE TÉCNICO</h2>
                    <p>Atención prioritaria 24/7 para tus solicitudes.</p>

                    <button class="support-btn-action" onclick="abrirModalCrearTicket('Falla de Acceso')">
                        <i class="material-icons-round">gpp_bad</i> REPORTAR FALLA DE ACCESO
                    </button>
                    <button class="support-btn-action" onclick="abrirModalCrearTicket('Renovación')">
                        <i class="material-icons-round">autorenew</i> SOLICITAR RENOVACIÓN
                    </button>
                    <button class="support-btn-action" onclick="abrirModalCrearTicket('Otra Consulta')">
                        <i class="material-icons-round">help_outline</i> OTRA CONSULTA
                    </button>

                    <div class="support-guarantee-box">
                        <i class="material-icons-round">verified</i>
                        <p>¿Tienes algún inconveniente? Cuentas con nuestro <strong style="color:var(--success);">respaldo y atención</strong>.</p>
                    </div>
                </div>

                <div class="faq-container">
                    <h3 class="faq-header-title">PREGUNTAS FRECUENTES</h3>
                    
                    <div class="faq-item" onclick="toggleFaq(this)">
                        <div class="faq-question">
                            <span>¿Cuánto tarda en entregarse una cuenta?</span>
                            <i class="material-icons-round faq-arrow">expand_more</i>
                        </div>
                        <div class="faq-answer">
                            <br>El proceso de entrega es 100% automatizado. Inmediatamente después de confirmar tu pago, el sistema despacha los accesos a tu sección de "Mis Pedidos" sin esperas.
                        </div>
                    </div>

                    <div class="faq-item" onclick="toggleFaq(this)">
                        <div class="faq-question">
                            <span>¿Qué hago si alguien cambió la contraseña?</span>
                            <i class="material-icons-round faq-arrow">expand_more</i>
                        </div>
                        <div class="faq-answer">
                            <br>Utiliza la opción "Reportar Falla de Acceso" en este mismo panel. Nuestro equipo verificará la cuenta y te asignará una nueva clave o un reemplazo en tiempo récord para que no pierdas tus días.
                        </div>
                    </div>

                    <div class="faq-item" onclick="toggleFaq(this)">
                        <div class="faq-question">
                            <span>¿Puedo modificar los perfiles?</span>
                            <i class="material-icons-round faq-arrow">expand_more</i>
                        </div>
                        <div class="faq-answer">
                            <br>Depende del tipo de cuenta adquirida. Si compraste una cuenta completa, tienes control total. Si adquiriste un "Perfil", está estrictamente prohibido alterar contraseñas o nombres de otros perfiles, ya que esto anula tu garantía.
                        </div>
                    </div>

                    <div class="faq-item" onclick="toggleFaq(this)">
                        <div class="faq-question">
                            <span>¿En cuántos dispositivos puedo ver?</span>
                            <i class="material-icons-round faq-arrow">expand_more</i>
                        </div>
                        <div class="faq-answer">
                            <br>Cada perfil es válido para usar en 1 dispositivo simultáneamente a menos que la descripción del producto indique lo contrario en la Tienda.
                        </div>
                    </div>

                    <div class="faq-item" onclick="toggleFaq(this)">
                        <div class="faq-question">
                            <span>¿Cómo renuevo mi suscripción?</span>
                            <i class="material-icons-round faq-arrow">expand_more</i>
                        </div>
                        <div class="faq-answer">
                            <br>Para conservar tu historial y favoritos, usa el botón "Solicitar Renovación". Envía el número de tu pedido anterior y aplicaremos el tiempo a la misma cuenta si es posible, o te daremos una migración rápida.
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `;
}

// ==========================================
// 3. LÓGICA DEL ACORDEÓN (FAQ)
// ==========================================
window.toggleFaq = function(element) {
    // Si ya está activo, lo cerramos
    if (element.classList.contains('active')) {
        element.classList.remove('active');
        return;
    }
    // Cerramos todos los demás
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    // Abrimos el actual
    element.classList.add('active');
};

// ==========================================
// 4. LÓGICA DE CREACIÓN DE TICKETS
// ==========================================
window.abrirModalCrearTicket = function(tipoFalla) {
    const isDark = document.body.classList.contains('dark-mode');
    const u = localStorage.getItem('dw_user');

    if (!u || u === 'null') {
        return Swal.fire({
            icon: 'error', title: 'Sesión no válida', 
            text: 'Debes iniciar sesión para crear un ticket.',
            background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#fff' : '#000'
        });
    }

    // Adaptamos el placeholder y el icono basado en el tipo
    let icon = 'support_agent';
    let placeholder = 'Describe tu consulta aquí...';
    let titleColor = 'var(--accent-text)';

    if (tipoFalla === 'Falla de Acceso') {
        icon = 'gpp_bad'; placeholder = 'Ej: La cuenta de Netflix (ID ORD-123) dice contraseña incorrecta.'; titleColor = '#ef4444';
    } else if (tipoFalla === 'Renovación') {
        icon = 'autorenew'; placeholder = 'Ej: Deseo renovar el pedido ORD-456 por 30 días más.'; titleColor = '#10b981';
    }

    Swal.fire({
        title: `
            <div style="display:flex; align-items:center; gap:10px; justify-content:center; color:${titleColor}; font-family:'Righteous', cursive; letter-spacing:1px; font-size: 1.4rem;">
                <i class="material-icons-round">${icon}</i>
                ${tipoFalla.toUpperCase()}
            </div>
        `,
        html: `
            <div style="text-align: left; margin-top: 10px;">
                <p style="color: var(--text-gray); font-size: 0.85rem; margin-bottom: 15px;">Por favor, detalla tu solicitud. Si es sobre una cuenta específica, incluye el número de pedido <strong>(Ej. ORD-12345)</strong> para agilizar la solución.</p>
                <textarea id="ticket-context" rows="5" style="width: 100%; box-sizing: border-box; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-main); padding: 15px; border-radius: 12px; font-family: 'Inter', sans-serif; font-size: 0.95rem; outline: none; transition: 0.3s; resize: vertical;" placeholder="${placeholder}"></textarea>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="material-icons-round" style="vertical-align:middle; font-size:1.2rem;">send</i> ENVIAR REPORTE',
        cancelButtonText: 'CANCELAR',
        confirmButtonColor: 'var(--accent-text)',
        cancelButtonColor: 'var(--bg-dark)',
        background: isDark ? '#1e293b' : '#ffffff',
        customClass: { 
            popup: 'premium-modal-radius',
            cancelButton: 'swal-cancel-btn-premium'
        },
        didOpen: () => {
            const txt = document.getElementById('ticket-context');
            txt.addEventListener('focus', () => txt.style.borderColor = 'var(--accent-text)');
            txt.addEventListener('blur', () => txt.style.borderColor = 'var(--border-color)');
        },
        preConfirm: async () => {
            const contexto = document.getElementById('ticket-context').value.trim();
            if (!contexto) {
                Swal.showValidationMessage('El mensaje no puede estar vacío');
                return false;
            }

            const t = localStorage.getItem('dw_token');
            
            try {
                // LLAMADA REAL A LA API PARA CREAR TICKET
                const res = await apiCall({
                    accion: 'crearTicket',
                    usuario: u,
                    token: t,
                    tipo: tipoFalla,
                    contexto: contexto
                });

                if (!res.success) {
                    Swal.showValidationMessage(res.msg || 'Fallo interno al crear el ticket.');
                    return false;
                }
                return true;
            } catch (error) {
                Swal.showValidationMessage('Error de red.');
                return false;
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: '¡TICKET ENVIADO!',
                text: 'Nuestro equipo ha recibido tu solicitud. Revisa el estado en la sección "Mis Tickets".',
                icon: 'success',
                background: isDark ? '#1e293b' : '#ffffff',
                color: isDark ? '#ffffff' : '#0f172a',
                confirmButtonColor: 'var(--accent-text)',
                confirmButtonText: 'VER MIS TICKETS'
            }).then(() => {
                // Redirigir a "Mis Tickets" automáticamente
                const itemMenuTickets = document.querySelector('.submenu-item[onclick*=\'mistickets\']');
                if(itemMenuTickets) {
                    nav('mistickets', itemMenuTickets);
                } else {
                    document.getElementById('sec-soporte').classList.add('hidden');
                    document.getElementById('sec-mistickets').classList.remove('hidden');
                    cargarMisTickets(); // Llamada a mistickets.js
                }
            });
        }
    });
};
