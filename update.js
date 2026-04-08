/* update.js */
// Historial amigable para el cliente final. 
// La primera de la lista (índice 0) siempre será la que se muestre en el botón principal.
const historicoVersiones = [
    {
        version: "V.1.6.0",
        fecha: "05/04/2026",
        tipo: "Motor Mejorado",
        cambios: [
            "Filtros de Fechas Inteligentes: La Billetera y el Historial de Compras ahora ordenan tus movimientos a la perfección, sin importar de qué mes o año sean.",
            "Facturas Consilidadas: Tus compras antiguas ahora se agrupan en bloques por fecha bajo el formato 'Sin Orden' para que tu historial luzca mucho más ordenado y fácil de leer.",
            "Billetera en Tiempo Real: Tu lista de movimientos ahora cargará siempre desde la compra más reciente hasta la más antigua por defecto.",
            "Visualización del Mes Actual: El sistema de Movimientos ahora se enfoca en mostrarte tus gastos del mes en curso, dándote un total de compras mucho más exacto."
        ]
    },
    {
        version: "V.1.5.0",
        fecha: "03/04/2026",
        tipo: "Mejoras Generales",
        cambios: [
            "Escudo de Seguridad Activo: Se han implementado nuevas capas de cifrado en el inicio de sesión para garantizar la máxima protección de tus datos.",
            "Carga de Imágenes Ultra-Rápida: Optimizamos el motor de renderizado. Los logos de los servicios y los banners ahora cargan al instante, consumiendo menos datos.",
            "Mejoras de estabilidad en la conexión con la base de datos de la tienda para evitar errores en horas pico."
        ]
    },
    {
        version: "V.1.4.0",
        fecha: "24/03/2026",
        tipo: "Nueva Función",
        cambios: [
            "Nuevo Portal de Accesos: Visualiza el correo original de la plataforma (Disney+, HBO, etc.) directamente en pantalla.",
            "Mejoras de seguridad y lectura en códigos de verificación.",
            "Historial de Billetera ahora incluye exportación de contabilidad en formato Excel (CSV)."
        ]
    },
    {
        version: "V.1.3.0",
        fecha: "17/03/2026",
        tipo: "Nueva Función",
        cambios: [
            "Centro de Recargas Ultra-Premium: Nuevo diseño más intuitivo y elegante.",
            "Video Tutorial Integrado: Ahora puedes ver cómo recargar paso a paso sin salir de la plataforma.",
            "Agente IA de Verificación: Sistema inteligente de doble intento para validar tus pagos de Bancolombia más rápido.",
            "Historial de Recargas rediseñado con alertas dinámicas y estado en tiempo real."
        ]
    },
    {
        version: "V.1.2.1",
        fecha: "11/03/2026",
        tipo: "Nueva Mejora",
        cambios: [
            "Buscador ultrarrápido: Encuentra tus pedidos al instante sin tiempos de carga.",
            "Nuevos filtros: Ahora puedes ordenar tus compras por servicio o por fecha exacta.",
            "Tus cuentas más recientes siempre aparecerán de primeras.",
            "Paginación mejorada: Elige si quieres ver 5, 10 o 25 pedidos a la vez."
        ]
    },
    {
        version: "V.1.2.0",
        fecha: "05/03/2026",
        tipo: "Rediseño Total",
        cambios: [
            "Nueva interfaz 'Premium Goth': Más moderna, oscura y elegante.",
            "Tu billetera ahora es más fácil de leer y muestra tus movimientos detallados.",
            "Mejoramos el sistema de recargas automáticas para transferencias bancarias."
        ]
    },
    {
        version: "V.1.1.0",
        fecha: "20/02/2026",
        tipo: "Nuevas Funciones",
        cambios: [
            "Lanzamiento del 'Centro de Ayuda' para resolver tus dudas rápidamente.",
            "Nuevo sistema de soporte técnico para reportar fallas y garantías.",
            "Portal integrado para obtener códigos de acceso de forma segura."
        ]
    },
    {
        version: "V.1.0.0",
        fecha: "10/01/2026",
        tipo: "Lanzamiento",
        cambios: [
            "¡Lanzamiento oficial de la plataforma Jeico Streaming!",
            "Integración de tienda automática, carrito de compras y tu bóveda personal de cuentas."
        ]
    }
];

function abrirModalUpdates() {
    const overlay = document.getElementById('update-overlay');
    const modal = document.getElementById('update-modal');
    const timeline = document.getElementById('update-timeline');
    
    if (!overlay || !modal || !timeline) return;

    // Renderizar la línea de tiempo dinámica
    timeline.innerHTML = historicoVersiones.map((v, index) => {
        let isLatest = index === 0;
        let dotColor = isLatest ? "var(--success)" : "var(--accent)";
        let badgeStyle = isLatest 
            ? "background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);" 
            : "background: var(--accent-glow); color: var(--accent-text); border: 1px solid var(--accent);";
        
        let listHTML = v.cambios.map(c => `<li><span class="material-icons-round">chevron_right</span> ${c}</li>`).join('');

        return `
            <div class="timeline-item">
                <div class="timeline-dot" style="box-shadow: 0 0 10px ${dotColor}; background: ${dotColor};"></div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <h3>${v.version} <span class="version-badge-tag" style="${badgeStyle}">${v.tipo}</span></h3>
                        <span class="timeline-date">${v.fecha}</span>
                    </div>
                    <ul class="timeline-list">
                        ${listHTML}
                    </ul>
                </div>
            </div>
        `;
    }).join('');

    overlay.classList.remove('hidden');
    modal.classList.add('active');
}

function cerrarModalUpdates() {
    const overlay = document.getElementById('update-overlay');
    const modal = document.getElementById('update-modal');
    if (overlay) overlay.classList.add('hidden');
    if (modal) modal.classList.remove('active');
}

// ===============================================================
// INYECCIÓN DE ESTILOS DEL MODAL Y EL BADGE (Adaptable Light/Dark)
// ===============================================================
const updateStyles = `
    /* BADGE FLOTANTE */
    .version-badge {
        position: fixed; 
        top: 25px;
        right: 30px;
        background: var(--bg-card); /* Adaptable a claro/oscuro */
        backdrop-filter: blur(10px);
        border: 1px solid var(--border-color);
        padding: 10px 22px;
        border-radius: 50px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 5000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
    }
    body.dark-mode .version-badge {
        background: #121214; /* Gris ultra oscuro, casi negro, limpio */
        border: 1px solid #27272a;
        box-shadow: 0 5px 20px rgba(0,0,0,0.5);
    }
    .version-badge:hover {
        border-color: var(--accent);
        transform: translateY(-3px);
        box-shadow: 0 8px 25px var(--accent-glow);
    }
    .v-num {
        color: var(--text-white); /* 🔥 Negro en Claro, Blanco en Oscuro 🔥 */
        font-family: 'Righteous', cursive;
        font-size: 1.2rem;
        letter-spacing: 2px;
        line-height: 1.2;
        text-shadow: none; 
    }
    .v-date {
        color: var(--text-gray); /* Color uniforme para texto y fecha */
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 700;
        line-height: 1;
        margin-top: 4px;
    }

    @media (max-width: 768px) {
        .version-badge {
            top: 15px; 
            right: 15px;
            padding: 8px 16px;
        }
    }

    /* MODAL DE ACTUALIZACIONES */
    .update-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.9);
        width: 90%;
        max-width: 600px;
        background: var(--bg-dark); /* Adaptable */
        border: 1px solid var(--border-color);
        border-radius: 20px;
        z-index: 11000; /* Superposición máxima */
        box-shadow: 0 25px 50px rgba(0,0,0,0.2);
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        max-height: 85vh;
    }
    body.dark-mode .update-modal {
        box-shadow: 0 25px 50px rgba(0,0,0,0.9), 0 0 30px var(--accent-glow);
    }
    .update-modal.active {
        opacity: 1;
        pointer-events: auto;
        transform: translate(-50%, -50%) scale(1);
    }
    .update-header {
        background: var(--bg-card); /* Adaptable */
        padding: 20px 25px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border-color);
        border-radius: 20px 20px 0 0;
    }
    .update-header-title {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--text-white);
    }
    .update-header-title span { color: var(--accent); font-size: 1.6rem; }
    .update-header-title h2 { font-size: 1.1rem; margin: 0; font-weight: 800; letter-spacing: 1px; color: var(--text-white); }
    .btn-close-update {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-gray);
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: 0.3s;
    }
    .btn-close-update:hover { background: var(--danger); color: #fff; border-color: var(--danger); transform: scale(1.1); }
    
    .update-body {
        padding: 30px 25px;
        overflow-y: auto;
    }
    .update-body::-webkit-scrollbar { width: 6px; }
    .update-body::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
    .update-body::-webkit-scrollbar-thumb:hover { background: var(--text-gray); }

    /* TIMELINE (LÍNEA DE TIEMPO) */
    .timeline-item {
        position: relative;
        padding-left: 30px;
        margin-bottom: 30px;
        border-left: 2px solid var(--border-color);
    }
    .timeline-item:last-child { margin-bottom: 0; border-left-color: transparent; }
    .timeline-dot {
        position: absolute;
        left: -6px;
        top: 0;
        width: 10px;
        height: 10px;
        border-radius: 50%;
    }
    .timeline-content {
        background: var(--bg-card); /* Adaptable */
        border: 1px solid var(--border-color);
        padding: 15px 20px;
        border-radius: 12px;
        top: -15px;
        position: relative;
    }
    .timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        flex-wrap: wrap;
        gap: 10px;
    }
    .timeline-header h3 {
        margin: 0;
        color: var(--text-white);
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .version-badge-tag {
        font-size: 0.6rem;
        padding: 4px 8px;
        border-radius: 20px;
        text-transform: uppercase;
        font-weight: 800;
        letter-spacing: 0.5px;
    }
    .timeline-date {
        color: var(--text-gray);
        font-size: 0.75rem;
        font-family: monospace;
        font-weight: 600;
    }
    .timeline-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .timeline-list li {
        color: var(--text-gray);
        font-size: 0.85rem;
        margin-bottom: 8px;
        display: flex;
        align-items: flex-start;
        gap: 5px;
        line-height: 1.5;
    }
    body.dark-mode .timeline-list li {
        color: #aaa;
    }
    .timeline-list li .material-icons-round {
        font-size: 1.1rem;
        color: var(--accent);
        margin-top: 0px;
    }
    .timeline-list li:last-child { margin-bottom: 0; }
`;

const styleSheetUpdate = document.createElement("style");
styleSheetUpdate.innerText = updateStyles;
document.head.appendChild(styleSheetUpdate);

// ===============================================================
// INYECTAR LÓGICA DEL BOTÓN Y MANEJO DE PESTAÑAS (TIENDA E INICIO)
// ===============================================================
document.addEventListener("DOMContentLoaded", () => {
    const ultimaVersion = historicoVersiones[0];
    const badge = document.getElementById("version-badge");
    
    if (badge) {
        // Asignar los valores de versión y fecha
        const numEl = document.getElementById("badge-v-num");
        const dateEl = document.getElementById("badge-v-date");
        
        if (numEl) numEl.innerText = ultimaVersion.version;
        
        // 🔥 TEXTO SÓLIDO SIN DEGRADADO 🔥
        if (dateEl) dateEl.innerText = `ÚLTIMA ACT. ${ultimaVersion.fecha}`;

        // Mover el botón al body para que flote independientemente de la sección
        document.body.appendChild(badge);

        // Controlar visibilidad: Oculto en login, visible en tienda/inicio
        badge.style.display = 'none';

        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.innerText.toLowerCase();
                if(text.includes('inicio') || text.includes('tienda')) {
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            });
        });

        // Mostrar el badge automáticamente si NO estamos en la pantalla de login 
        // (Asumiendo que si existe el sidebar o navbar, ya pasó el login)
        const sidebarMenu = document.querySelector('.sidebar');
        const bottomNav = document.querySelector('.bottom-nav');
        if ((sidebarMenu && sidebarMenu.style.display !== 'none') || (bottomNav && bottomNav.style.display !== 'none')) {
             badge.style.display = 'flex';
        }
    }
});
