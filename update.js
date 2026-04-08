/* =================================================================================
   ARCHIVO: update.js - LANZAMIENTO OFICIAL
   LOG: Solo información comercial y de funciones para el cliente.
================================================================================= */

const historicoVersiones = [
    {
        version: "V.1.10.0",
        fecha: "08/04/2026",
        tipo: "Gran Lanzamiento",
        cambios: [
            "¡Bienvenidos a CHAYONET!: Hoy abrimos oficialmente las puertas de nuestra nueva plataforma diseñada para tu entretenimiento.",
            "Experiencia Ultra-Premium: Disfruta de una interfaz moderna, rápida y elegante, optimizada para que encuentres tus servicios favoritos al instante.",
            "Tienda Automática 24/7: Ahora puedes realizar tus pedidos y gestionar tus cuentas en cualquier momento del día, sin esperas.",
            "Seguridad Reforzada: Hemos blindado tu acceso y tus datos para que tu única preocupación sea qué película ver hoy.",
            "Navegación Fluida: El sistema ha sido ajustado para consumir menos datos y cargar las imágenes de tus servicios a máxima velocidad."
        ]
    }
];

function abrirModalUpdates() {
    const overlay = document.getElementById('update-overlay');
    const modal = document.getElementById('update-modal');
    const timeline = document.getElementById('update-timeline');
    
    if (!overlay || !modal || !timeline) return;

    timeline.innerHTML = historicoVersiones.map((v, index) => {
        let isLatest = index === 0;
        let dotColor = isLatest ? "var(--success)" : "var(--accent)";
        let badgeStyle = isLatest 
            ? "background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);" 
            : "background: var(--accent-glow); color: var(--accent-text); border: 1px solid var(--accent);";
        
        let listHTML = v.cambios.map(c => `<li><span class="material-icons-round">star</span> ${c}</li>`).join('');

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
// INYECCIÓN DE ESTILOS DEL MODAL Y EL BADGE (Se mantienen intactos)
// ===============================================================
const updateStyles = `
    .version-badge {
        position: fixed; top: 25px; right: 30px;
        background: var(--bg-card); backdrop-filter: blur(10px);
        border: 1px solid var(--border-color); padding: 10px 22px;
        border-radius: 50px; display: flex; flex-direction: column;
        align-items: center; justify-content: center; cursor: pointer;
        z-index: 5000; box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); user-select: none;
    }
    body.dark-mode .version-badge { background: #121214; border: 1px solid #27272a; box-shadow: 0 5px 20px rgba(0,0,0,0.5); }
    .version-badge:hover { border-color: var(--accent); transform: translateY(-3px); box-shadow: 0 8px 25px var(--accent-glow); }
    .v-num { color: var(--text-white); font-family: 'Righteous', cursive; font-size: 1.2rem; letter-spacing: 2px; line-height: 1.2; }
    .v-date { color: var(--text-gray); font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; line-height: 1; margin-top: 4px; }
    @media (max-width: 768px) { .version-badge { top: 15px; right: 15px; padding: 8px 16px; } }
    .update-modal {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.9);
        width: 90%; max-width: 600px; background: var(--bg-dark); border: 1px solid var(--border-color);
        border-radius: 20px; z-index: 11000; opacity: 0; pointer-events: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; max-height: 85vh;
    }
    body.dark-mode .update-modal { box-shadow: 0 25px 50px rgba(0,0,0,0.9), 0 0 30px var(--accent-glow); }
    .update-modal.active { opacity: 1; pointer-events: auto; transform: translate(-50%, -50%) scale(1); }
    .update-header { background: var(--bg-card); padding: 20px 25px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); border-radius: 20px 20px 0 0; }
    .update-header-title { display: flex; align-items: center; gap: 12px; color: var(--text-white); }
    .update-header-title span { color: var(--accent); font-size: 1.6rem; }
    .update-header-title h2 { font-size: 1.1rem; margin: 0; font-weight: 800; letter-spacing: 1px; color: var(--text-white); }
    .btn-close-update { background: transparent; border: 1px solid var(--border-color); color: var(--text-gray); width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; }
    .btn-close-update:hover { background: var(--danger); color: #fff; border-color: var(--danger); transform: scale(1.1); }
    .update-body { padding: 30px 25px; overflow-y: auto; }
    .timeline-item { position: relative; padding-left: 30px; margin-bottom: 30px; border-left: 2px solid var(--border-color); }
    .timeline-dot { position: absolute; left: -6px; top: 0; width: 10px; height: 10px; border-radius: 50%; }
    .timeline-content { background: var(--bg-card); border: 1px solid var(--border-color); padding: 15px 20px; border-radius: 12px; top: -15px; position: relative; }
    .timeline-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .version-badge-tag { font-size: 0.6rem; padding: 4px 8px; border-radius: 20px; text-transform: uppercase; font-weight: 800; }
    .timeline-list { list-style: none; padding: 0; margin: 0; }
    .timeline-list li { color: var(--text-gray); font-size: 0.85rem; margin-bottom: 10px; display: flex; align-items: flex-start; gap: 8px; line-height: 1.4; }
    .timeline-list li .material-icons-round { font-size: 1.1rem; color: var(--accent); }
`;

const styleSheetUpdate = document.createElement("style");
styleSheetUpdate.innerText = updateStyles;
document.head.appendChild(styleSheetUpdate);

// ===============================================================
// LÓGICA DE INICIALIZACIÓN
// ===============================================================
document.addEventListener("DOMContentLoaded", () => {
    const ultimaVersion = historicoVersiones[0];
    const badge = document.getElementById("version-badge");
    
    if (badge) {
        const numEl = document.getElementById("badge-v-num");
        const dateEl = document.getElementById("badge-v-date");
        if (numEl) numEl.innerText = ultimaVersion.version;
        if (dateEl) dateEl.innerText = `LANZAMIENTO: ${ultimaVersion.fecha}`;
        document.body.appendChild(badge);
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
        
        // Mostrar si ya estamos dentro de una sección válida
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.style.display !== 'none') badge.style.display = 'flex';
    }
});
