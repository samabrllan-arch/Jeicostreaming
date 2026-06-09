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

        /* ── Hero cards ── */
        .tkc-hero { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:18px; margin-bottom:32px; }

        .tkc-hero-card {
            background: linear-gradient(135deg, var(--card-bg,#1a1a2e) 0%, rgba(30,30,60,.9) 100%);
            border: 1px solid var(--border-color,#2a2a4a);
            border-radius:18px; padding:24px 20px; text-align:center;
            position:relative; overflow:hidden;
            transition: transform .25s, box-shadow .25s;
        }
        .tkc-hero-card::before {
            content:''; position:absolute; inset:0;
            background: radial-gradient(circle at 80% 20%, rgba(245,158,11,.07), transparent 60%);
        }
        .tkc-hero-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(0,0,0,.35); }

        .tkc-hero-icon {
            width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center;
            margin:0 auto 14px; font-size:1.6rem;
        }
        .tkc-hero-val {
            font-size:2.1rem; font-weight:900; font-family:'Righteous',cursive;
            margin:0 0 4px; line-height:1;
            background: linear-gradient(135deg, #f59e0b, #fbbf24);
            -webkit-background-clip:text; -webkit-text-fill-color:transparent;
        }
        .tkc-hero-val.green  { background:linear-gradient(135deg,#10b981,#34d399); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .tkc-hero-val.purple { background:linear-gradient(135deg,#818cf8,#a78bfa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .tkc-hero-lbl { font-size:.7rem; color:var(--text-muted,#777); font-weight:700; text-transform:uppercase; letter-spacing:.9px; }

        /* ── Progress bar de tokens ── */
        .tkc-progress-wrap { margin-bottom:28px; }
        .tkc-progress-label { display:flex; justify-content:space-between; font-size:.75rem; font-weight:700; margin-bottom:8px; color:var(--text-gray,#aaa); }
        .tkc-progress-bar-bg { height:8px; border-radius:99px; background:rgba(245,158,11,.12); overflow:hidden; }
        .tkc-progress-bar-fill { height:100%; border-radius:99px; background:linear-gradient(90deg,#f59e0b,#fbbf24); transition:width .8s cubic-bezier(.4,0,.2,1); }

        /* ── Info banner ── */
        .tkc-info-banner {
            background:linear-gradient(135deg,rgba(245,158,11,.08),rgba(217,119,6,.03));
            border:1px solid rgba(245,158,11,.22); border-radius:14px; padding:16px 20px;
            margin-bottom:26px; font-size:.82rem; color:var(--text-gray,#aaa); line-height:1.75;
            position:relative; overflow:hidden;
        }
        .tkc-info-banner::after {
            content:'🪙'; position:absolute; right:16px; top:50%; transform:translateY(-50%);
            font-size:2.8rem; opacity:.12;
        }
        .tkc-info-banner b { color:#f59e0b; }

        /* ── History ── */
        .tkc-history-box {
            background:var(--card-bg,#1a1a2e);
            border:1px solid var(--border-color,#2a2a4a);
            border-radius:18px; padding:24px;
        }
        .tkc-history-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:10px; }
        .tkc-history-title { margin:0; font-size:1rem; font-weight:800; display:flex; align-items:center; gap:8px; }

        .tkc-btn-reload {
            background:rgba(245,158,11,.08); border:1px solid rgba(245,158,11,.25); color:#f59e0b;
            padding:7px 14px; border-radius:10px; cursor:pointer; font-weight:800; font-size:.78rem;
            display:flex; align-items:center; gap:6px; transition:.2s;
        }
        .tkc-btn-reload:hover { background:rgba(245,158,11,.18); transform:scale(1.04); }

        /* ── Item ── */
        .tkc-item {
            display:flex; align-items:center; gap:14px; padding:14px 0;
            border-bottom:1px solid var(--border-color,#2a2a4a);
            transition: background .15s;
        }
        .tkc-item:last-child { border-bottom:none; }
        .tkc-item:hover { background:rgba(255,255,255,.02); border-radius:10px; padding-left:8px; }
        .tkc-item.tkc-expired { opacity:.4; }

        .tkc-icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .tkc-info { flex:1; min-width:0; }
        .tkc-motivo { font-weight:700; font-size:.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .tkc-fecha  { font-size:.72rem; color:var(--text-muted,#666); margin-top:3px; display:flex; align-items:center; gap:5px; flex-wrap:wrap; }
        .tkc-amount { font-weight:900; font-size:1.05rem; white-space:nowrap; }

        .tkc-badge {
            display:inline-flex; align-items:center; gap:3px; padding:2px 7px; border-radius:6px;
            font-size:.65rem; font-weight:800; text-transform:uppercase; letter-spacing:.5px;
        }
        .tkc-badge-vencido { background:rgba(239,68,68,.15); color:#f87171; }
        .tkc-badge-bono    { background:rgba(139,92,246,.15); color:#a78bfa; }

        /* ── Empty ── */
        .tkc-empty { text-align:center; padding:60px 20px; color:var(--text-muted,#666); }
        .tkc-empty-icon { font-size:4rem; margin-bottom:14px; animation:tkc-bounce 2s ease-in-out infinite; }
        @keyframes tkc-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }

        /* ── Spinner ── */
        .tkc-spinner { width:36px; height:36px; border:3px solid rgba(245,158,11,.2); border-top-color:#f59e0b; border-radius:50%; animation:tkc-spin .7s linear infinite; margin:40px auto; }
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
    <div class="tkc-history-box">
        <div class="tkc-history-header">
            <h3 class="tkc-history-title">
                <i class="material-icons-round" style="color:#f59e0b; font-size:1.2rem;">history</i>
                Historial de Tokens
            </h3>
            <button class="tkc-btn-reload" onclick="cargarTokensCliente()" id="tkc-btn-reload">
                <i class="material-icons-round" style="font-size:1rem;">refresh</i> Actualizar
            </button>
        </div>
        <div id="tkc-historial-list"><div class="tkc-spinner"></div></div>
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
            <div class="tkc-empty">
                <div class="tkc-empty-icon">🪙</div>
                <p>Aún no tienes movimientos de tokens.<br>
                <b>¡Compra en la tienda y empieza a ganar!</b></p>
            </div>`;
        return;
    }

    const tiposIcono = {
        ganado:   { icon:'add_circle',     bg:'rgba(16,185,129,.15)',  color:'#10b981' },
        bono:     { icon:'card_giftcard',  bg:'rgba(139,92,246,.15)', color:'#a78bfa' },
        canjeado: { icon:'shopping_cart',  bg:'rgba(239,68,68,.12)',  color:'#f87171' },
        ajuste:   { icon:'tune',           bg:'rgba(99,102,241,.15)', color:'#818cf8' },
        expirado: { icon:'timer_off',      bg:'rgba(107,114,128,.1)', color:'#9ca3af' },
    };

    listEl.innerHTML = hist.map(t => {
        const cantidad  = parseInt(t.cantidad);
        const vencido   = parseInt(t.vencido) === 1;
        const esPos     = cantidad > 0;
        const cfg       = tiposIcono[t.tipo] || tiposIcono.ajuste;
        const signo     = esPos ? '+' : '';
        const amtColor  = esPos ? '#10b981' : '#f87171';
        const fechaStr  = (t.fecha || '').split(' ')[0];
        const expStr    = t.fecha_expiracion ? t.fecha_expiracion.split(' ')[0] : '';

        const badges = [
            vencido ? `<span class="tkc-badge tkc-badge-vencido"><i class="material-icons-round" style="font-size:.65rem;">timer_off</i>Vencido</span>` : '',
            t.tipo === 'bono' ? `<span class="tkc-badge tkc-badge-bono"><i class="material-icons-round" style="font-size:.65rem;">card_giftcard</i>Bono</span>` : '',
        ].filter(Boolean).join('');

        return `
        <div class="tkc-item ${vencido ? 'tkc-expired' : ''}">
            <div class="tkc-icon" style="background:${cfg.bg}; color:${cfg.color};">
                <i class="material-icons-round" style="font-size:1.35rem;">${cfg.icon}</i>
            </div>
            <div class="tkc-info">
                <div class="tkc-motivo">${t.motivo || 'Transacción de tokens'}</div>
                <div class="tkc-fecha">
                    <i class="material-icons-round" style="font-size:.75rem; color:var(--text-muted);">calendar_today</i>
                    ${fechaStr}
                    ${expStr ? `· <span style="color:${vencido ? '#f87171':'#f59e0b'};">Vence ${expStr}</span>` : ''}
                    ${badges}
                </div>
            </div>
            <div class="tkc-amount" style="color:${amtColor};">
                ${signo}${fmt(Math.abs(cantidad))} TK
            </div>
        </div>`;
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
