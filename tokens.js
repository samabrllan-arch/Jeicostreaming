/* =================================================================================
   ARCHIVO: tokens.js (LADO CLIENTE - Jeicostreaming)
   Módulo: Mis Tokens — Saldo, Historial y Canje  ✨ PREMIUM UX
================================================================================= */

let tkClienteIniciado = false;
let tkClienteDatos    = null;

// ─── Gancho de navegación ────────────────────────────────────────────────────
document.addEventListener('moduloCargado', async (e) => {
    if (e.detail?.modulo === 'tokens') {
        await inicializarModuloTokens();
    }
});

document.addEventListener('moduloCargado', async (e) => {
    if (e.detail?.modulo === 'tienda' || e.detail?.modulo === 'inicio') {
        const tkCache = parseInt(localStorage.getItem('dw_token_saldo')) || 0;
        if (tkCache > 0) actualizarBadgeTokensSidebar(tkCache);
    }
});

// ─── Init ───────────────────────────────────────────────────────────────────
async function inicializarModuloTokens() {
    const sec = document.getElementById('sec-tokens');
    if (!sec) return;

    sec.innerHTML = `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Righteous&display=swap');

        /* ── Hero cards (Glassmorphism FreeFrontend Style) ── */
        .tkc-hero { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:20px; margin-bottom:32px; perspective: 1000px; }

        .tkc-hero-card {
            background: var(--bg-card); /* Fallback */
            background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid var(--border-color);
            border-radius: 20px; 
            padding: 25px 20px; 
            text-align: center;
            position: relative; 
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        body.dark-mode .tkc-hero-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .tkc-hero-card::before {
            content:''; position:absolute; inset:0;
            background: radial-gradient(circle at 80% 20%, var(--accent-glow, rgba(245,158,11,.1)), transparent 60%);
            opacity: 0.5;
            transition: opacity 0.4s ease;
        }
        
        .tkc-hero-card:hover { 
            transform: translateY(-8px) scale(1.02); 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
            border-color: #f59e0b;
        }
        body.dark-mode .tkc-hero-card:hover {
            box-shadow: 0 20px 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(245,158,11,0.05);
        }
        .tkc-hero-card:hover::before { opacity: 1; }

        .tkc-hero-icon {
            width: 56px; height: 56px; 
            border-radius: 16px; 
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 16px; font-size: 1.8rem;
            box-shadow: inset 0 2px 5px rgba(255,255,255,0.1);
        }
        .tkc-hero-val {
            font-size: 2.2rem; font-weight: 900; font-family: 'Righteous', cursive;
            margin: 0 0 6px; line-height: 1;
            background: linear-gradient(135deg, #f59e0b, #fbbf24);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            position: relative; z-index: 2;
        }
        .tkc-hero-val.green  { background:linear-gradient(135deg,#10b981,#34d399); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .tkc-hero-val.purple { background:linear-gradient(135deg,#8b5cf6,#a78bfa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .tkc-hero-lbl { font-size: 0.75rem; color: var(--text-gray); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; position: relative; z-index: 2; }

        /* ── Progress bar de tokens ── */
        .tkc-progress-wrap { margin-bottom:30px; }
        .tkc-progress-label { display:flex; justify-content:space-between; font-size:.8rem; font-weight:800; margin-bottom:10px; color:var(--text-gray); }
        .tkc-progress-bar-bg { height:10px; border-radius:99px; background: var(--bg-dark); border: 1px solid var(--border-color); overflow:hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); }
        .tkc-progress-bar-fill { height:100%; border-radius:99px; background:linear-gradient(90deg,#f59e0b,#fbbf24); transition:width 1s cubic-bezier(.4,0,.2,1); box-shadow: 0 0 10px rgba(245,158,11,0.5); }

        /* ── Info banner (Modern Glow) ── */
        .tkc-info-banner {
            background: var(--bg-card);
            border: 1px solid rgba(245,158,11,.3); 
            border-left: 4px solid #f59e0b;
            border-radius: 12px; padding: 18px 24px;
            margin-bottom: 30px; font-size: 0.9rem; color: var(--text-gray); line-height: 1.6;
            position: relative; overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        body.dark-mode .tkc-info-banner {
            background: rgba(245,158,11,.03);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .tkc-info-banner::after {
            content:'🪙'; position:absolute; right: -10px; top: 50%; transform: translateY(-50%);
            font-size: 5rem; opacity: 0.05; pointer-events: none;
        }
        .tkc-info-banner b { color: #f59e0b; font-weight: 800; }

        /* ── History Box ── */
        .tkc-history-box {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 20px; padding: 25px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.05);
        }
        body.dark-mode .tkc-history-box {
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
        .tkc-history-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:25px; flex-wrap:wrap; gap:10px; border-bottom: 1px solid var(--border-color); padding-bottom: 15px; }
        .tkc-history-title { margin:0; font-size:1.1rem; font-weight:900; display:flex; align-items:center; gap:8px; color: var(--text-white); text-transform: uppercase; letter-spacing: 0.5px; }

        .tkc-btn-reload {
            background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white);
            padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 800; font-size: 0.8rem;
            display: flex; align-items: center; gap: 6px; transition: 0.3s;
        }
        .tkc-btn-reload:hover { background: rgba(245,158,11,.1); border-color: #f59e0b; color: #f59e0b; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(245,158,11,.2); }

        /* ── Estilos removidos por usar mov-table global de billetera ── */

        /* ── Empty ── */
        .tkc-empty { text-align:center; padding:60px 20px; color:var(--text-gray); }
        .tkc-empty-icon { font-size:4rem; margin-bottom:15px; animation:tkc-bounce 2s ease-in-out infinite; opacity: 0.8; }
        @keyframes tkc-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-15px)} }

        /* ── Spinner ── */
        .tkc-spinner { width:40px; height:40px; border:4px solid rgba(245,158,11,.1); border-top-color:#f59e0b; border-radius:50%; animation:tkc-spin .8s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite; margin:40px auto; }
        @keyframes tkc-spin { to{transform:rotate(360deg)} }
    </style>

    <div class="page-header-premium">
        <h1 class="page-title" style="display:flex; align-items:center; gap:10px;">
            <span style="background:linear-gradient(135deg,#f59e0b,#d97706); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
                🪙 MIS TOKENS
            </span>
        </h1>
        <p class="page-subtitle">Cashback Gamificado — Gana tokens con cada compra</p>
    </div>

    <!-- Info banner -->
    <div class="tkc-info-banner">
        <b>¿Cómo funcionan los tokens?</b><br>
        Cada compra te otorga tokens de cashback. Acumúlalos y úsalos como <b>método de pago alternativo</b> en la tienda.<br>
        Los tokens vencen en 6 meses — ¡no los dejes perder!
    </div>

    <!-- Cards resumen -->
    <div class="tkc-hero" id="tkc-hero">
        <div class="tkc-hero-card">
            <div class="tkc-hero-icon" style="background:rgba(245,158,11,.12);">🪙</div>
            <div class="tkc-hero-val" id="tkc-saldo-activo">—</div>
            <div class="tkc-hero-lbl">Tokens disponibles</div>
        </div>
        <div class="tkc-hero-card">
            <div class="tkc-hero-icon" style="background:rgba(16,185,129,.12);">🎁</div>
            <div class="tkc-hero-val green" id="tkc-total-ganados">—</div>
            <div class="tkc-hero-lbl">Total ganados</div>
        </div>
        <div class="tkc-hero-card">
            <div class="tkc-hero-icon" style="background:rgba(129,140,248,.12);">🛒</div>
            <div class="tkc-hero-val purple" id="tkc-total-canjeados">—</div>
            <div class="tkc-hero-lbl">Total canjeados</div>
        </div>
    </div>

    <!-- Barra de progreso -->
    <div class="tkc-progress-wrap" id="tkc-progress-wrap" style="display:none;">
        <div class="tkc-progress-label">
            <span>Tokens usados</span>
            <span id="tkc-progress-pct">0%</span>
        </div>
        <div class="tkc-progress-bar-bg">
            <div class="tkc-progress-bar-fill" id="tkc-progress-fill" style="width:0%"></div>
        </div>
    </div>

    <!-- Historial -->
    <div class="premium-table-container" style="background: var(--bg-card); border: 1px solid var(--border-color); box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-top: 15px;">
        <div class="tkc-history-header" style="padding: 20px 25px; border-bottom: 1px solid var(--border-color); margin-bottom: 0;">
            <h3 class="tkc-history-title" style="margin:0; font-size:1.1rem; font-weight:900; display:flex; align-items:center; gap:8px; color: var(--text-white); text-transform: uppercase;">
                <i class="material-icons-round" style="color:#f59e0b; font-size:1.2rem;">history</i>
                Historial de Tokens
            </h3>
            <button class="tkc-btn-reload" onclick="cargarTokensCliente()" id="tkc-btn-reload">
                <i class="material-icons-round" style="font-size:1rem;">refresh</i> Actualizar
            </button>
        </div>
        <table class="mov-table" id="tabla-mis-tokens">
            <thead>
                <tr>
                    <th style="text-align: left;">Fecha y Hora</th>
                    <th style="text-align: left;">Tipo</th>
                    <th style="text-align: left;">Detalle de Operación</th>
                    <th style="text-align: right;">Monto (TK)</th>
                </tr>
            </thead>
            <tbody id="tkc-historial-list">
                <tr><td colspan="4" style="text-align:center; padding:60px;"><div class="tkc-spinner"></div></td></tr>
            </tbody>
        </table>
    </div>`;

    await cargarTokensCliente();
}

// ─── Cargar datos del servidor ────────────────────────────────────────────────
window.cargarTokensCliente = async function() {
    const listEl = document.getElementById('tkc-historial-list');
    const btn    = document.getElementById('tkc-btn-reload');
    if (btn) btn.style.opacity = '.5';

    try {
        const usuario = localStorage.getItem('dw_user');
        const token   = localStorage.getItem('dw_token');
        if (!usuario || !token) return;

        if (listEl) listEl.innerHTML = '<div class="tkc-spinner"></div>';

        const data = await apiCall({ accion: 'getTokensUsuario', usuario, token });

        if (!data.success) {
            if (listEl) listEl.innerHTML = `<div class="tkc-empty"><div class="tkc-empty-icon">⚠️</div><p>${data.msg}</p></div>`;
            return;
        }

        tkClienteDatos = data;
        renderTokensCliente(data);
        actualizarBadgeTokensSidebar(data.saldo_activo);
        localStorage.setItem('dw_token_saldo', data.saldo_activo);

    } catch(e) {
        if (listEl) listEl.innerHTML = `<div class="tkc-empty"><div class="tkc-empty-icon">📡</div><p>Error de conexión. Intenta de nuevo.</p></div>`;
    } finally {
        if (btn) btn.style.opacity = '1';
    }
};

// ─── Render ───────────────────────────────────────────────────────────────────
function renderTokensCliente(data) {
    const fmt = (n) => new Intl.NumberFormat('es-CO').format(parseInt(n) || 0);

    const setEl = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = v; };
    setEl('tkc-saldo-activo',    fmt(data.saldo_activo)    + ' TK');
    setEl('tkc-total-ganados',   fmt(data.total_ganados)   + ' TK');
    setEl('tkc-total-canjeados', fmt(data.total_canjeados) + ' TK');

    // Barra de progreso
    const total = data.total_ganados || 0;
    const canjeados = data.total_canjeados || 0;
    if (total > 0) {
        const pct = Math.min(100, Math.round((canjeados / total) * 100));
        const wrap = document.getElementById('tkc-progress-wrap');
        const fill = document.getElementById('tkc-progress-fill');
        const pctEl = document.getElementById('tkc-progress-pct');
        if (wrap) wrap.style.display = 'block';
        if (pctEl) pctEl.textContent = pct + '%';
        setTimeout(() => { if (fill) fill.style.width = pct + '%'; }, 100);
    }

    // Historial
    const listEl = document.getElementById('tkc-historial-list');
    if (!listEl) return;

    const hist = data.historial || [];
    if (!hist.length) {
        listEl.innerHTML = `
            <tr><td colspan="4" style="text-align:center; padding: 60px;">
                <div class="tkc-empty" style="padding: 0;">
                    <div class="tkc-empty-icon">🪙</div>
                    <p style="margin:0;">Aún no tienes movimientos de tokens.<br>
                    <b>¡Compra en la tienda y empieza a ganar!</b></p>
                </div>
            </td></tr>`;
        return;
    }

    listEl.innerHTML = hist.map(t => {
        const cantidad  = parseInt(t.cantidad);
        const vencido   = parseInt(t.vencido) === 1;
        const esPos     = cantidad > 0;
        const signo     = esPos ? '+' : '';
        const colorClass = esPos ? 'amount-positive' : 'amount-negative';

        let fechaPrimary = (t.fecha || '').split(' ')[0];
        let fechaSecondary = (t.fecha || '').includes(' ') ? t.fecha.split(' ')[1] : '';
        
        try {
            let fPura = fechaPrimary;
            let fObj = new Date();
            if (fPura.includes('-')) {
                let [y, m, d] = fPura.split('-');
                fObj = new Date(y, m-1, d);
            } else if (fPura.includes('/')) {
                let [d, m, y] = fPura.split('/');
                fObj = new Date(y, m-1, d);
            }
            if(!isNaN(fObj.getTime())) {
                fechaPrimary = fObj.toLocaleDateString('es-CO', {day:'2-digit', month:'short', year:'numeric'});
            }
        } catch(e){}

        let badgeHTML = '';
        if (vencido || t.tipo === 'expirado') {
            badgeHTML = `<span class="id-badge-premium nulo" style="color: #ef4444; border-color: rgba(239,68,68,0.3);">VENCIDO</span>`;
        } else if (t.tipo === 'ganado') {
            badgeHTML = `<span class="id-badge-premium recarga">GANADO</span>`;
        } else if (t.tipo === 'canjeado') {
            badgeHTML = `<span class="id-badge-premium descuento">CANJEADO</span>`;
        } else if (t.tipo === 'bono') {
            badgeHTML = `<span class="id-badge-premium" style="background: rgba(139,92,246,0.1); color: #a78bfa; border: 1px solid rgba(139,92,246,0.3);">BONO</span>`;
        } else {
            badgeHTML = `<span class="id-badge-premium nulo">AJUSTE</span>`;
        }

        const expStr = t.fecha_expiracion && !vencido && esPos ? t.fecha_expiracion.split(' ')[0] : '';
        const detalleAdicional = expStr ? `<br><span style="font-size: 0.7rem; color: #f59e0b;">Vence el ${expStr}</span>` : '';

        return `
        <tr class="mov-row ${vencido ? 'tkc-expired' : ''}">
            <td data-label="Fecha" style="text-align: left;">
                <div class="date-block">
                    <span class="date-primary">${fechaPrimary}</span>
                    <span class="date-secondary">${fechaSecondary}</span>
                </div>
            </td>
            <td data-label="Tipo" style="text-align: left;">${badgeHTML}</td>
            <td data-label="Detalle" style="font-weight:500; color:var(--text-white); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${t.motivo}">${t.motivo || 'Transacción de tokens'}${detalleAdicional}</td>
            <td data-label="Monto" style="text-align: right; font-weight: 900;" class="${colorClass}">
                ${signo}${fmt(Math.abs(cantidad))} TK
            </td>
        </tr>`;
    }).join('');
}

// ─── Badge en sidebar ─────────────────────────────────────────────────────────
function actualizarBadgeTokensSidebar(saldo) {
    const fmt = (n) => new Intl.NumberFormat('es-CO').format(parseInt(n) || 0);
    const s = saldo ?? (tkClienteDatos?.saldo_activo ?? null);
    if (s === null) return;

    const badge  = document.getElementById('nav-token-badge');
    const tkDisp = document.getElementById('display-token-balance');
    const tkAmt  = document.getElementById('display-token-amount');

    if (badge)  { badge.textContent = fmt(s) + ' TK'; badge.style.display = parseInt(s) > 0 ? 'inline' : 'none'; }
    if (tkDisp) tkDisp.style.display = parseInt(s) > 0 ? 'flex' : 'none';
    if (tkAmt)  tkAmt.textContent = fmt(s);
}

// ─── Exponer helpers para tienda.js ──────────────────────────────────────────
window.obtenerTokenSaldoActivo = function() {
    return tkClienteDatos?.saldo_activo ?? parseInt(localStorage.getItem('dw_token_saldo')) ?? 0;
};

window.actualizarTokenSaldoLocal = function(nuevoSaldo) {
    if (tkClienteDatos) tkClienteDatos.saldo_activo = nuevoSaldo;
    actualizarBadgeTokensSidebar(nuevoSaldo);
    localStorage.setItem('dw_token_saldo', nuevoSaldo);
};
