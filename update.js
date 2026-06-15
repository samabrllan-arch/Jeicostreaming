/* update.js */
// Historial amigable para el cliente final.
// La primera de la lista (índice 0) siempre será la que se muestre en el botón principal.
const historicoVersiones = [
    {
        version: "V.2.3.0",
        fecha: "15/06/2026",
        tipo: "🚀 Cartelera Inteligente & UI",
        cambios: [
            "🎬 Nueva Cartelera Cinemática: Rediseñamos por completo el sistema de recomendaciones. Ahora los pósters lucen increíbles con tipografías en bloque 3D (Righteous), viñetas oscuras y glow dinámico según el color de la plataforma.",
            "⚡ Carga Instantánea (Caché Inteligente): Tu dispositivo ahora recuerda la cartelera por 24 horas. ¡Entras al panel y las recomendaciones cargan en 0.1 segundos sin gastar megas extras!",
            "🛠️ Panel de Gestión Pro: El administrador ahora cuenta con un editor premium, con ventanas 'glassmorphism' y selectores de color visuales para añadir o modificar la cartelera fácilmente.",
            "🤖 Generador de IA: Añadimos un botón mágico que recopila tu cartelera actual y te crea un 'Prompt' listo para que la Inteligencia Artificial te arme contenido nuevo sin repetir lo que ya tienes.",
            "🎨 Refinamientos de Interfaz: Mejoras en las sombras, espaciados y renderizado 3D para una experiencia de usuario mucho más fluida."
        ]
    },
    {
        version: "V.2.2.0",
        fecha: "09/06/2026",
        tipo: "🪙 Tokens & Cashback",
        cambios: [
            "🪙 ¡Llegan los Tokens! Cada compra que hagas te da de vuelta una parte en tokens que puedes usar para conseguir tus próximas cuentas totalmente gratis. ¡Compra más, ahorra más!",
            "💰 Tu saldo siempre a mano: Ahora en el menú lateral puedes ver de un vistazo tu saldo en pesos Y tus tokens disponibles, bien separados y con su propio diseño.",
            "🛒 Paga como quieras: En la tienda aparece un botón para cambiar entre pagar con dinero 💵 o pagar con tus tokens 🪙. ¡Tú decides!",
            "⚡ Compra directa con tokens: Cuando activas el modo tokens, cada producto muestra su precio en TK y puedes comprarlo con un solo clic, sin pasar por el carrito.",
            "📊 Mis Tokens — Tu propio panel: Tienes una sección dedicada donde puedes ver cuántos tokens has ganado, cuántos has usado y todo tu historial de movimientos con iconos y colores.",
            "🎁 Tokens al instante: En cuanto compras con dinero, ¡pum! tus tokens caen automáticamente a tu saldo. Los verás reflejados de inmediato sin tener que recargar la página.",
            "🔒 Totalmente seguro: El sistema de tokens está protegido en el servidor. Nadie puede inventarse tokens desde afuera — cada saldo es verificado en tiempo real antes de cualquier canje."
        ]
    },
    {
        version: "V.2.1.0",
        fecha: "17/05/2026",
        tipo: "Personalización Total",
        cambios: [
            "🏠 Nuevo inicio personalizado: Ahora al entrar ves tu nombre y tu saldo disponible de un solo vistazo, con accesos rápidos a la Tienda, tus Credenciales y el Centro de Ayuda.",
            "🎨 Elige tu estilo: Añadimos 4 temas de colores (Fuego, Tecnología, Océano y Esmeralda) para que personalices toda la plataforma a tu gusto. ¡Tu elección se guarda para siempre!",
            "🖌️ Mezcla tus propios colores: ¿No te convence ninguno? Ahora puedes crear tu propia combinación personalizada eligiendo hasta 3 colores con un selector visual. Experimenta y haz la plataforma tuya.",
            "🚀 Bienvenida inteligente: La primera vez que entras, la plataforma te recibe en la pantalla de Inicio para que conozcas todo. A partir de la segunda vez, vas directo a la Tienda para comprar más rápido.",
            "💰 Saldo siempre visible: Corregimos un problema donde el nombre y el saldo no aparecían en la pantalla de inicio. Ahora se actualizan al instante cada vez que navegas.",
            "📋 Botón de copiar arreglado: Solucionamos un error donde el botón de 'Copiar' en tus pedidos y billetera se quedaba en verde y no volvía a la normalidad después de usarlo.",
            "👋 Toque de bienvenida: Añadimos una animación de saludo junto a tu nombre en el inicio para que te sientas como en casa cada vez que entres.",
            "🔐 Seguridad reforzada: Tu sesión ahora se cuenta con una capa mas de seguridad."
        ]
    },
    {
        version: "V.2.0.0",
        fecha: "10/05/2026",
        tipo: "Rediseño Premium",
        cambios: [
            "🎨 Nuevo look de bienvenida: Cambiamos la cara del inicio de sesión. Ahora tiene un diseño mucho más moderno y animado para darte una experiencia VIP desde que entras.",
            "🌗 Modo oscuro 100% pulido: Ahora sí, el tema que elijas (claro u oscuro) te acompaña perfecto por toda la plataforma sin desconfigurarse.",
            "🔒 Acceso directo y sin trabas: Arreglamos ese molesto detalle donde la pantalla se quedaba 'pegada' después de poner tus datos. Ahora entras de una a lo que importa.",
            "⚡ Tienda en modo flash: Le metimos turbo al sistema para que el catálogo de cuentas te cargue en un abrir y cerrar de ojos."
        ]
    },
    {
        version: "V.1.9.0",
        fecha: "24/04/2026",
        tipo: "Soporte Visual Premium",
        cambios: [
            "📸 Evidencia fotográfica en Soporte: Ahora los administradores pueden adjuntar capturas de pantalla y evidencias directamente en las respuestas de tus tickets.",
            "🚀 Visor de Imágenes Nativo: Al hacer clic en la foto de un ticket, esta se expandirá en pantalla completa sin forzar descargas en tu dispositivo. ¡Rápido y limpio!"
        ]
    },
    {
        version: "V.1.8.0",
        fecha: "13/04/2026",
        tipo: "Máxima Velocidad y Blindaje",
        cambios: [
            "⚡ Compras múltiples al instante: Rediseñamos el motor del carrito. Ahora puedes llevarte 10 o 50 cuentas en un solo clic, sin tiempos de carga interminables. ¡Tu compra vuela!",
            "🛡️ Billetera impenetrable: Añadimos una nueva capa de seguridad de nivel corporativo a tus recargas automáticas para proteger cada centavo de tu saldo con precisión absoluta.",
            "🛒 Inventario 100% garantizado: Mejoramos el sistema de asignación de la tienda. Si el sistema te deja agregarlo al carrito, la entrega está garantizada sin errores de stock.",
            "🔒 Privacidad absoluta: Elevamos los estándares de seguridad de la plataforma, garantizando que tus transacciones sean totalmente privadas y a prueba de manipulaciones.",
            "🚀 Sistema de alto rendimiento: Optimizamos el cerebro de la tienda para procesar cientos de pedidos simultáneos de toda la comunidad sin que la web se ponga lenta."
        ]
    },
    {
        version: "V.1.7.0",
        fecha: "10/04/2026",
        tipo: "Velocidad y Seguridad",
        cambios: [
            "¡Búsquedas relámpago en Códigos! El buscador de correos ahora escanea múltiples redes al mismo tiempo, entregándote tu código de acceso en tiempo récord.",
            "Bandeja de entrada blindada: Reforzamos la seguridad del sistema al visualizar los correos originales de las plataformas, protegiendo tu dispositivo y tu cuenta en todo momento.",
            "Sincronización horaria perfecta: Corregimos un detalle visual donde las compras y recargas hechas en la noche aparecían con la fecha del día siguiente. ¡Ahora todo cuadra exacto!"
        ]
    },
    {
        version: "V.1.6.0",
        fecha: "05/04/2026",
        tipo: "Motor Mejorado",
        cambios: [
            "Filtros de Fechas Inteligentes: La Billetera y el Historial de Compras ahora ordenan tus movimientos a la perfección, sin importar de qué mes o año sean.",
            "Facturas Consolidadas: Tus compras antiguas ahora se agrupan en bloques por fecha bajo el formato 'Sin Orden' para que tu historial luzca mucho más ordenado y fácil de leer.",
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

// ===============================================================
// MODAL DE ACTUALIZACIONES
// ===============================================================
function abrirModalUpdates() {
    const overlay = document.getElementById('update-overlay');
    const modal = document.getElementById('update-modal');
    const timeline = document.getElementById('update-timeline');
    if (!overlay || !modal || !timeline) return;

    timeline.innerHTML = historicoVersiones.map((v, index) => {
        const isLatest = index === 0;
        const dotColor = isLatest ? 'var(--success)' : 'var(--accent)';
        const badgeStyle = isLatest
            ? 'background:rgba(16,185,129,0.1); color:#10b981; border:1px solid rgba(16,185,129,0.3);'
            : 'background:var(--accent-glow); color:var(--accent-text); border:1px solid var(--accent);';

        const listHTML = v.cambios
            .map(c => `<li><span class="material-icons-round">chevron_right</span> ${c}</li>`)
            .join('');

        return `
            <div class="timeline-item">
                <div class="timeline-dot" style="box-shadow:0 0 10px ${dotColor}; background:${dotColor};"></div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <h3>${v.version} <span class="version-badge-tag" style="${badgeStyle}">${v.tipo}</span></h3>
                        <span class="timeline-date">${v.fecha}</span>
                    </div>
                    <ul class="timeline-list">${listHTML}</ul>
                </div>
            </div>`;
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
// ESTILOS DEL MODAL Y DEL BADGE (Adaptable Light/Dark)
// ===============================================================
const updateStyles = `
    /* BADGE FLOTANTE */
    .version-badge {
        position: fixed;
        top: 25px;
        right: 30px;
        background: var(--bg-card);
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
        background: #121214;
        border: 1px solid #27272a;
        box-shadow: 0 5px 20px rgba(0,0,0,0.5);
    }
    .version-badge:hover {
        border-color: var(--accent);
        transform: translateY(-3px);
        box-shadow: 0 8px 25px var(--accent-glow);
    }
    .v-num {
        color: var(--text-white);
        font-family: 'Righteous', cursive;
        font-size: 1.2rem;
        letter-spacing: 2px;
        line-height: 1.2;
    }
    .v-date {
        color: var(--text-gray);
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 700;
        line-height: 1;
        margin-top: 4px;
    }
    @media (max-width: 768px) {
        .version-badge { top: 15px; right: 15px; padding: 8px 16px; }
    }

    /* MODAL */
    .update-modal {
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%) scale(0.9);
        width: 90%;
        max-width: 600px;
        background: var(--bg-dark);
        border: 1px solid var(--border-color);
        border-radius: 20px;
        z-index: 11000;
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
        background: var(--bg-card);
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
    .update-header-title h2 {
        font-size: 1.1rem; margin: 0;
        font-weight: 800; letter-spacing: 1px;
        color: var(--text-white);
    }
    .btn-close-update {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-gray);
        width: 32px; height: 32px;
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        transition: 0.3s;
    }
    .btn-close-update:hover {
        background: var(--danger); color: #fff;
        border-color: var(--danger); transform: scale(1.1);
    }
    .update-body { padding: 30px 25px; overflow-y: auto; }
    .update-body::-webkit-scrollbar { width: 6px; }
    .update-body::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
    .update-body::-webkit-scrollbar-thumb:hover { background: var(--text-gray); }

    /* TIMELINE */
    .timeline-item {
        position: relative;
        padding-left: 30px;
        margin-bottom: 30px;
        border-left: 2px solid var(--border-color);
    }
    .timeline-item:last-child { margin-bottom: 0; border-left-color: transparent; }
    .timeline-dot {
        position: absolute;
        left: -6px; top: 0;
        width: 10px; height: 10px;
        border-radius: 50%;
    }
    .timeline-content {
        background: var(--bg-card);
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
        display: flex; align-items: center; gap: 10px;
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
    .timeline-list { list-style: none; padding: 0; margin: 0; }
    .timeline-list li {
        color: var(--text-gray);
        font-size: 0.85rem;
        margin-bottom: 8px;
        display: flex; align-items: flex-start;
        gap: 5px; line-height: 1.5;
    }
    body.dark-mode .timeline-list li { color: #aaa; }
    .timeline-list li .material-icons-round { font-size: 1.1rem; color: var(--accent); }
    .timeline-list li:last-child { margin-bottom: 0; }
`;

const styleSheetUpdate = document.createElement('style');
styleSheetUpdate.innerText = updateStyles;
document.head.appendChild(styleSheetUpdate);

// ===============================================================
// INICIALIZACIÓN DEL BADGE
// ---------------------------------------------------------------
// El badge vive DENTRO de #sec-inicio en el HTML.
// Cuando esa sección tiene clase 'hidden', el badge también se oculta
// automáticamente porque está anidado dentro.
// El JS solo rellena el texto — no mueve el elemento.
// ===============================================================
document.addEventListener('DOMContentLoaded', () => {
    const ultimaVersion = historicoVersiones[0];
    const numEl = document.getElementById('badge-v-num');
    const dateEl = document.getElementById('badge-v-date');
    if (numEl) numEl.innerText = ultimaVersion.version;
    if (dateEl) dateEl.innerText = `ÚLTIMA ACT. ${ultimaVersion.fecha}`;
    // ⚠️ NO mover el badge al body — debe quedarse dentro de #sec-inicio
    // para que se oculte automáticamente junto con esa sección.
});
