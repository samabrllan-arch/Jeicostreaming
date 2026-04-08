/* =================================================================================
   ARCHIVO: ranking.js (LADO CLIENTE)
   Lógica: Obtención de líderes y caché inteligente (Reinicio a las 12:00 AM Local)
================================================================================= */

let cargandoRanking = false;

/**
 * 1. FUNCIÓN PRINCIPAL: Cargar datos del Ranking
 */
async function cargarRanking() {
    if (cargandoRanking) return;
    cargandoRanking = true;

    // --- PREPARAR CONTENEDOR ---
    const mainSection = document.getElementById('sec-ranking');
    let container = document.getElementById('ranking-content');
    
    if (!container && mainSection) {
        mainSection.innerHTML = '<div id="ranking-content" class="ranking-wrapper"></div>';
        container = document.getElementById('ranking-content');
    }
    
    if (!container) {
        cargandoRanking = false;
        return; 
    }

    // =========================================================================
    // 🧠 SISTEMA DE CACHÉ DIARIO (Corregido para Zona Horaria Local)
    // =========================================================================
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const fechaHoy = `${year}-${month}-${day}`; // Ej: "2026-04-04" Hora Local exacta
    
    const cacheFecha = localStorage.getItem('dw_ranking_date_v3');
    const cacheDataRaw = localStorage.getItem('dw_ranking_data_v3');

    if (cacheFecha === fechaHoy && cacheDataRaw) {
        try {
            const cacheData = JSON.parse(cacheDataRaw);
            console.log("⚡ Cargando Ranking desde Caché Local (Día actual)");
            renderRankingUI(container, cacheData.top10, cacheData.miRanking, true);
            cargandoRanking = false;
            return; // Detenemos la función para no gastar recursos del servidor
        } catch (e) {
            console.error("Error leyendo caché, forzando recarga...", e);
        }
    }

    // --- MOSTRAR CARGANDO (Si no hay caché válido) ---
    container.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:300px;">
            <div class="spinner" style="margin: 0 auto;"></div>
            <p style="color:var(--text-gray); margin-top:20px; font-family: 'Righteous', sans-serif; letter-spacing: 2px;">ACTUALIZANDO CLASIFICACIÓN...</p>
        </div>
    `;

    try {
        const u = localStorage.getItem('dw_user');
        const t = localStorage.getItem('dw_token');

        if (!u || !t) {
            container.innerHTML = `<p style="text-align:center; color:var(--danger); font-weight: bold;">Sesión no válida.</p>`;
            cargandoRanking = false;
            return;
        }

        const res = await apiCall({ 
            accion: 'getRanking', 
            usuario: u, 
            token: t,
            _nocache: Date.now() 
        });

        if (res && res.success) {
            // Guardamos los datos frescos y la fecha en el localStorage
            localStorage.setItem('dw_ranking_date_v3', fechaHoy);
            localStorage.setItem('dw_ranking_data_v3', JSON.stringify({ top10: res.top10, miRanking: res.miRanking }));
            
            renderRankingUI(container, res.top10, res.miRanking, false);
        } else {
            container.innerHTML = `<p style="text-align:center; color:var(--danger); font-weight: bold;">Error del servidor: ${res.msg}</p>`;
        }

    } catch (error) {
        console.error("Error de red en Ranking:", error);
        container.innerHTML = `<p style="text-align:center; color:var(--danger); font-weight: bold;">Fallo de conexión al cargar el ranking.</p>`;
    } finally {
        cargandoRanking = false;
    }
}

/**
 * 2. RENDERIZADO UI: Construir la interfaz épica
 */
function renderRankingUI(container, top10, miData, desdeCache) {
    container.innerHTML = "";
    
    // Si no viene miData, evitamos errores creando un objeto vacío
    if (!miData) miData = { posicion: 0, gastado: 0, usuario: localStorage.getItem('dw_user') };

    const fmt = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    // --- A. TARJETA DEL USUARIO ACTUAL (MI ESTADÍSTICA) ---
    const divMiStats = document.createElement('div');
    divMiStats.className = 'my-stats-card';
    
    // Determinar mensaje según posición
    let mensajeAnimo = "¡Invierte más para subir en el top!";
    let iconoPosicion = "trending_up";
    let clasePosicion = "";

    if (miData.posicion == 1) { 
        mensajeAnimo = "¡ERES EL REY DE LA BÓVEDA! 👑"; 
        iconoPosicion = "emoji_events";
        clasePosicion = "rank-1-text";
    } else if (miData.posicion > 0 && miData.posicion <= 3) {
        mensajeAnimo = "¡Estás en el podio! Mantén el ritmo.";
        iconoPosicion = "military_tech";
    } else if (miData.posicion > 0 && miData.posicion <= 10) {
        mensajeAnimo = "¡Eres un Top Buyer! Estás en la élite.";
        iconoPosicion = "star";
    } else if (miData.posicion <= 0) {
        mensajeAnimo = "Realiza compras en la tienda para entrar al Ranking.";
    }

    // Leemos 'gastado' obligando a que sea numérico
    const miGastoTotal = Number(miData.gastado) || 0;

    divMiStats.innerHTML = `
        <div class="my-stats-header">
            <span class="material-icons-round" style="color:var(--accent-text);">account_circle</span>
            <span>TU RENDIMIENTO</span>
        </div>
        <div class="my-stats-grid">
            <div class="stat-item">
                <div class="stat-label">POSICIÓN GLOBAL</div>
                <div class="stat-value ${clasePosicion}">#${miData.posicion > 0 ? miData.posicion : '-'}</div>
            </div>
            <div class="stat-item border-left">
                <div class="stat-label">INVERSIÓN TOTAL</div>
                <div class="stat-value text-accent" style="font-size: 1.8rem;">$ ${fmt.format(miGastoTotal)}</div>
            </div>
        </div>
        <div class="my-stats-footer">
            <span class="material-icons-round">${iconoPosicion}</span> ${mensajeAnimo}
        </div>
    `;
    container.appendChild(divMiStats);

    // --- B. LISTA DEL TOP 10 ---
    const divLeaderboard = document.createElement('div');
    divLeaderboard.className = 'leaderboard-container';
    
    let htmlList = `<h3 class="leaderboard-title">🏆 TOP 10 LÍDERES</h3><div class="leaderboard-list">`;

    if(!top10 || top10.length === 0) {
        htmlList += `<p style="text-align:center; padding:20px; color:var(--text-gray);">Aún no hay datos registrados.</p>`;
    } else {
        top10.forEach((user, index) => {
            const rank = index + 1;
            let rankClass = "rank-item";
            let iconHtml = `<span class="rank-number">#${rank}</span>`;
            
            // Estilos especiales para el podio
            if (rank === 1) {
                rankClass += " rank-gold";
                iconHtml = `<span class="material-icons-round medal-icon gold">emoji_events</span>`;
            } else if (rank === 2) {
                rankClass += " rank-silver";
                iconHtml = `<span class="material-icons-round medal-icon silver">military_tech</span>`;
            } else if (rank === 3) {
                rankClass += " rank-bronze";
                iconHtml = `<span class="material-icons-round medal-icon bronze">military_tech</span>`;
            }

            // Resaltar si soy yo
            if (user.usuario === miData.usuario) {
                rankClass += " its-me";
            }

            // Gasto de la persona 
            const gastoRanking = Number(user.gastado) || 0;
            const delay = index * 0.08;

            htmlList += `
                <div class="${rankClass}" style="animation-delay: ${delay}s;">
                    <div class="rank-left">
                        ${iconHtml}
                        <span class="rank-name">${user.usuario}</span>
                    </div>
                    <div class="rank-right">
                        <span class="rank-score" style="color: var(--success);">${fmt.format(gastoRanking)}</span>
                        <span class="rank-label">Cuentas Compradas</span>
                    </div>
                </div>
            `;
        });
    }

    htmlList += `</div>`;
    divLeaderboard.innerHTML = htmlList;
    container.appendChild(divLeaderboard);

    // --- C. DISCLAIMER DINÁMICO ---
    const divDisclaimer = document.createElement('div');
    divDisclaimer.className = 'ranking-disclaimer';
    
    if (desdeCache) {
        divDisclaimer.innerHTML = `
            <span class="material-icons-round" style="font-size: 1.1rem; color: var(--success);">check_circle</span>
            <span>Clasificación actualizada: <strong>Día de hoy</strong>. (Sincronizado)</span>
        `;
    } else {
        divDisclaimer.innerHTML = `
            <span class="material-icons-round" style="font-size: 1.1rem; color: var(--accent-text);">sync</span>
            <span>Los resultados se actualizan a las 12.00am todos los días.</span>
        `;
    }
    
    container.appendChild(divDisclaimer);
}

/**
 * ===============================================================
 * ESTILOS CSS PREMIUM (TEMA DINÁMICO CLARO/OSCURO)
 * ===============================================================
 */
const rankingStyles = `
    .ranking-wrapper {
        padding: 10px 0;
        max-width: 800px;
        margin: 0 auto;
        animation: fadeIn 0.5s ease;
    }

    /* --- DISCLAIMER --- */
    .ranking-disclaimer {
        margin-top: 25px;
        text-align: center;
        font-size: 0.75rem;
        color: var(--text-gray);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: var(--bg-card);
        padding: 12px;
        border-radius: 12px;
        border: 1px dashed var(--border-color);
    }

    /* --- MI TARJETA --- */
    .my-stats-card {
        background: var(--bg-dark);
        border: 1px solid var(--border-color);
        border-radius: 16px;
        padding: 25px;
        margin-bottom: 30px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        position: relative;
        overflow: hidden;
    }
    
    /* Efecto de brillo superior */
    .my-stats-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; width: 100%; height: 4px;
        background: linear-gradient(90deg, var(--accent-text), var(--accent-glow));
    }

    .my-stats-header {
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: 'Righteous', sans-serif;
        color: var(--text-main);
        font-size: 1.2rem;
        margin-bottom: 25px;
        opacity: 0.9;
    }

    .my-stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
    }

    .stat-item {
        text-align: center;
    }
    
    .border-left {
        border-left: 1px solid var(--border-color);
    }

    .stat-label {
        color: var(--text-gray);
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 2px;
        margin-bottom: 8px;
    }

    .stat-value {
        font-size: 2.5rem;
        font-weight: 800;
        color: var(--text-white);
        line-height: 1;
        font-family: 'Inter', monospace;
    }
    
    .text-accent { color: var(--accent-text); text-shadow: 0 0 15px var(--accent-glow); }
    .rank-1-text { color: #f59e0b; text-shadow: 0 0 15px rgba(245, 158, 11, 0.4); }

    .my-stats-footer {
        margin-top: 25px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        padding: 12px;
        border-radius: 10px;
        text-align: center;
        font-size: 0.85rem;
        color: var(--text-gray);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-weight: 600;
    }

    /* --- LEADERBOARD --- */
    .leaderboard-container {
        background: var(--bg-card);
        border-radius: 20px;
        border: 1px solid var(--border-color);
        padding: 25px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.02);
    }

    .leaderboard-title {
        text-align: center;
        font-family: 'Righteous', sans-serif;
        color: var(--text-main);
        margin-top: 0;
        margin-bottom: 25px;
        letter-spacing: 1px;
        text-transform: uppercase;
        font-size: 1.4rem;
    }

    .leaderboard-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .rank-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--bg-dark);
        padding: 15px 20px;
        border-radius: 12px;
        border: 1px solid var(--border-color);
        transition: transform 0.3s ease, border-color 0.3s ease;
        opacity: 0;
        animation: slideInRight 0.4s ease forwards;
    }
    
    .rank-item:hover {
        transform: translateX(5px);
        border-color: var(--accent-text);
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }

    .rank-left { display: flex; align-items: center; gap: 15px; }
    .rank-right { text-align: right; display: flex; flex-direction: column; align-items: flex-end; }

    .rank-number {
        font-family: 'Righteous', sans-serif;
        color: var(--text-muted);
        font-size: 1.2rem;
        width: 30px;
        text-align: center;
    }

    .rank-name {
        font-weight: 700;
        color: var(--text-main);
        font-size: 1rem;
    }

    .rank-score {
        font-weight: 900;
        font-size: 1.15rem;
        font-family: 'Inter', monospace;
    }
    
    .rank-label {
        font-size: 0.65rem;
        color: var(--text-gray);
        text-transform: uppercase;
        font-weight: 800;
        letter-spacing: 1px;
    }

    /* --- MEDALLAS Y COLORES --- */
    .medal-icon { font-size: 1.6rem; width: 30px; text-align: center; }
    .gold { color: #f59e0b; filter: drop-shadow(0 0 8px rgba(245,158,11,0.5)); }
    .silver { color: #94a3b8; filter: drop-shadow(0 0 8px rgba(148,163,184,0.5)); }
    .bronze { color: #d97706; filter: drop-shadow(0 0 8px rgba(217,119,6,0.5)); }

    .rank-gold { background: linear-gradient(90deg, rgba(245, 158, 11, 0.05), transparent); border-color: rgba(245, 158, 11, 0.2); }
    .rank-silver { background: linear-gradient(90deg, rgba(148, 163, 184, 0.05), transparent); border-color: rgba(148, 163, 184, 0.2); }
    .rank-bronze { background: linear-gradient(90deg, rgba(217, 119, 6, 0.05), transparent); border-color: rgba(217, 119, 6, 0.2); }

    .its-me { border-color: var(--accent-text); box-shadow: inset 0 0 10px var(--accent-glow); }
    .its-me .rank-name { color: var(--accent-text); }

    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @media (max-width: 480px) {
        .stat-value { font-size: 1.8rem !important; }
    }
`;

const styleSheetRanking = document.createElement("style");
styleSheetRanking.innerText = rankingStyles;
document.head.appendChild(styleSheetRanking);

// --- OBSERVER PARA CARGAR AL ABRIR LA PESTAÑA ---
document.addEventListener('DOMContentLoaded', () => {
    const secRanking = document.getElementById('sec-ranking');
    
    if (secRanking) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    if (!secRanking.classList.contains('hidden')) {
                        cargarRanking();
                    }
                }
            });
        });
        observer.observe(secRanking, { attributes: true });
    }
});
