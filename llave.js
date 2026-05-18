const API_URL = `${API_BASE_URL_CLIENTE}/dw_api.php`;
let userBalance = 0;
// =======================================================================
// --- 0. DISEÑO PREMIUM DEL LOGIN (INYECCIÓN CSS + DOM) ---
// Se ejecuta inmediatamente porque el script está al final del body.
// =======================================================================
(function _setupLoginUI() {
    // ── Fuentes ──
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap';
    document.head.appendChild(link);
    // ── CSS ──
    const css = `
    /* ─── ESTRUCTURA SPLIT ─── */
    #login-view {
        display: flex !important;
        height: 100vh !important;
        min-height: 100vh !important;
        overflow: hidden !important;
        background: var(--bg-dark) !important;
        flex-direction: row !important;
        align-items: stretch !important;
        transition: background 0.4s ease !important;
    }
    /* Clase utilitaria de ocultamiento con máxima prioridad */
    #login-view.dw-oculto {
        display: none !important;
    }
    /* ─── PANEL IZQUIERDO ─── */
    #login-banner {
        flex: 1 !important;
        height: 100vh !important;
        min-height: 100vh !important;
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-end !important;
        padding: 44px 48px !important;
        overflow: hidden !important;
        background-size: cover !important;
        background-position: center top !important;
        background-repeat: no-repeat !important;
        background-blend-mode: normal !important;
    }
    /* Overlay del banner — cambia con el tema */
    .dw-banner-overlay {
        position: absolute;
        inset: 0;
        background: rgba(30, 15, 70, 0.55);
        z-index: 1;
        pointer-events: none;
        transition: background 0.5s ease;
    }
    body.dark-mode .dw-banner-overlay {
        background: rgba(4, 2, 14, 0.90);
    }
    /* Grid animado encima del overlay */
    .dw-grid-overlay {
        position: absolute;
        inset: 0;
        background-image:
            linear-gradient(rgba(124,58,237,0.09) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.09) 1px, transparent 1px);
        background-size: 48px 48px;
        animation: dw-gridPan 22s linear infinite;
        z-index: 2;
    }
    @keyframes dw-gridPan {
        from { background-position: 0 0; }
        to   { background-position: 48px 48px; }
    }
    /* Orbe principal */
    .dw-orb-main {
        position: absolute;
        top: -150px; left: -100px;
        width: 580px; height: 580px;
        background: radial-gradient(circle, rgba(124,58,237,0.28) 0%, rgba(88,28,220,0.08) 55%, transparent 70%);
        border-radius: 50%;
        animation: dw-breathe 7s ease-in-out infinite;
        z-index: 2;
    }
    .dw-orb-secondary {
        position: absolute;
        bottom: 60px; right: -80px;
        width: 360px; height: 360px;
        background: radial-gradient(circle, rgba(192,132,252,0.12) 0%, transparent 65%);
        border-radius: 50%;
        animation: dw-breathe 9s ease-in-out infinite reverse;
        z-index: 2;
    }
    @keyframes dw-breathe {
        0%, 100% { transform: scale(1); opacity: 1; }
        50%       { transform: scale(1.06); opacity: 0.75; }
    }
    /* ─── Tarjetas flotantes ─── */
    .dw-float-card {
        position: absolute;
        background: rgba(13,13,28,0.82);
        border: 1px solid rgba(124,58,237,0.22);
        border-radius: 14px;
        padding: 13px 17px;
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.75rem;
        color: #c0bbd8;
        z-index: 5;
        box-shadow: 0 4px 24px rgba(0,0,0,0.4), 0 0 30px rgba(124,58,237,0.08);
        animation: dw-floatY 4s ease-in-out infinite;
    }
    .dw-float-card strong { color: #f0eeff; font-size: 0.85rem; display: block; margin-bottom: 2px; }
    .dw-float-card small  { color: #4a4566; font-size: 0.68rem; }
    .dw-fc-a { top: 36px; left: 48px; animation-delay: 0s; }
    .dw-fc-b { top: 36px; right: 48px; animation: dw-floatYB 4s ease-in-out infinite; animation-delay: 1.2s; }
    .dw-fc-c { bottom: 220px; right: 48px; animation-delay: 2.4s; }
    @keyframes dw-floatY  {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-9px); }
    }
    @keyframes dw-floatYB {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-9px); }
    }
    .dw-dot {
        width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    }
    .dw-dot-green  { background: #10b981; box-shadow: 0 0 7px #10b981; }
    .dw-dot-purple { background: #a855f7; box-shadow: 0 0 7px #a855f7; }
    .dw-dot-amber  { background: #f59e0b; box-shadow: 0 0 7px #f59e0b; }
    /* ─── Texto hero ─── */
    .dw-hero-text {
        position: relative;
        z-index: 5;
    }
    .dw-hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(124,58,237,0.14);
        border: 1px solid rgba(124,58,237,0.3);
        border-radius: 100px;
        padding: 6px 14px;
        font-size: 0.68rem;
        font-family: 'JetBrains Mono', monospace;
        color: #c084fc;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin-bottom: 20px;
    }
    .dw-pulse {
        width: 6px; height: 6px;
        background: #c084fc;
        border-radius: 50%;
        box-shadow: 0 0 6px #c084fc;
        animation: dw-pulse 2s ease-in-out infinite;
    }
    @keyframes dw-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%       { opacity: 0.4; transform: scale(0.65); }
    }
    .dw-hero-text h1 {
        font-family: 'Syne', sans-serif !important;
        font-size: 2.8rem !important;
        font-weight: 800 !important;
        line-height: 1.1 !important;
        color: #f0eeff !important;
        margin-bottom: 16px !important;
        letter-spacing: -1px !important;
    }
    .dw-hero-text h1 em {
        font-style: normal !important;
        background: linear-gradient(130deg, #a855f7, #c084fc) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
    }
    .dw-hero-text p {
        font-family: 'Syne', sans-serif;
        color: #c9c3e0 !important;
        font-size: 0.9rem !important;
        line-height: 1.65 !important;
        max-width: 340px !important;
        margin-bottom: 32px !important;
        font-weight: 400 !important;
    }
    .dw-stats {
        display: flex;
        gap: 0;
        align-items: center;
    }
    .dw-stat {
        padding-right: 24px;
        margin-right: 24px;
        border-right: 1px solid rgba(124,58,237,0.2);
    }
    .dw-stat:last-child { border-right: none; margin-right: 0; padding-right: 0; }
    .dw-stat-n {
        font-family: 'JetBrains Mono', monospace;
        font-size: 1.6rem;
        font-weight: 500;
        color: #f0eeff;
        margin-bottom: 3px;
        line-height: 1;
    }
    .dw-stat-n span { color: #a855f7; font-size: 1rem; margin-left: 2px; }
    .dw-stat-l {
        font-size: 0.6rem;
        color: #9490b8;
        text-transform: uppercase;
        letter-spacing: 1.2px;
        font-family: 'JetBrains Mono', monospace;
    }
    /* ─── VERSION BADGE (moderno) ─── */
    .version-badge {
        position: fixed !important;
        top: 18px !important;
        right: 18px !important;
        z-index: 9999 !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 10px !important;
        background: var(--bg-card) !important;
        border: 1px solid var(--border-color) !important;
        border-radius: 100px !important;
        padding: 8px 16px 8px 12px !important;
        backdrop-filter: blur(16px) !important;
        -webkit-backdrop-filter: blur(16px) !important;
        cursor: pointer !important;
        transition: border-color 0.2s, box-shadow 0.2s !important;
        text-decoration: none !important;
        box-shadow: 0 2px 20px rgba(124,58,237,0.10) !important;
    }
    .version-badge:hover {
        border-color: rgba(168,85,247,0.55) !important;
        box-shadow: 0 4px 24px rgba(124,58,237,0.18) !important;
    }
    .version-badge::before {
        content: '';
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #a855f7;
        box-shadow: 0 0 8px #a855f7;
        flex-shrink: 0;
        animation: dw-pulse 2.5s ease-in-out infinite;
    }
    .version-badge .v-num {
        font-family: 'JetBrains Mono', monospace !important;
        font-size: 0.78rem !important;
        font-weight: 500 !important;
        color: var(--text-white) !important;
        letter-spacing: 0.5px !important;
    }
    .version-badge .v-date {
        font-family: 'JetBrains Mono', monospace !important;
        font-size: 0.58rem !important;
        color: var(--text-gray) !important;
        letter-spacing: 0.5px !important;
        text-transform: uppercase !important;
        border-left: 1px solid var(--border-color) !important;
        padding-left: 10px !important;
        margin-left: 0 !important;
    }
    /* ─── PANEL DERECHO ─── */
    #dw-right-panel {
        width: 430px;
        flex-shrink: 0;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-card);
        border-left: 1px solid var(--border-color);
        overflow: hidden;
        transition: background 0.4s ease;
    }
    /* Tinte muy sutil arriba a la derecha */
    #dw-right-panel::after {
        content: '';
        position: absolute;
        top: -160px; right: -160px;
        width: 420px; height: 420px;
        background: radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 65%);
        border-radius: 50%;
        z-index: 0;
    }
    /* Tinte sutil abajo izquierda */
    #dw-right-panel::before {
        content: '';
        position: absolute;
        bottom: -120px; left: -120px;
        width: 340px; height: 340px;
        background: radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 65%);
        border-radius: 50%;
        z-index: 0;
    }
    /* ─── CAJA DE LOGIN ─── */
    #login-box-main,
    #recover-step-1,
    #recover-step-2 {
        position: relative !important;
        z-index: 1 !important;
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
        width: 100% !important;
        max-width: 100% !important;
        padding: 40px 44px !important;
        border-radius: 0 !important;
    }
    /* Cuando están hidden, los colapsamos */
    #login-box-main.hidden,
    #recover-step-1.hidden,
    #recover-step-2.hidden {
        display: none !important;
    }
    /* ─── ENCABEZADO (marca) dentro del form ─── */
    .dw-brand {
        margin-bottom: 36px;
        text-align: center;
    }
    .dw-brand-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-bottom: 6px;
    }
    .dw-brand-icon {
        width: 34px; height: 34px;
        background: linear-gradient(135deg, #7c3aed, #a855f7);
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .dw-brand-icon .material-icons-round { font-size: 1.05rem; color: #fff; }
    .dw-brand-name {
        font-family: 'Syne', sans-serif;
        font-size: 1rem;
        font-weight: 800;
        letter-spacing: 3px;
        text-transform: uppercase;
        color: var(--text-white);
    }
    .dw-brand-sub {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.65rem;
        color: var(--text-gray);
        letter-spacing: 1px;
        text-transform: uppercase;
        text-align: center;
    }
    /* ─── TÍTULOS DEL FORM ─── */
    .vault-header {
        font-family: 'Syne', sans-serif !important;
        font-size: 1.5rem !important;
        font-weight: 800 !important;
        color: var(--text-white) !important;
        letter-spacing: -0.5px !important;
        margin-bottom: 6px !important;
        text-transform: none !important;
    }
    .verify-header, .success-header {
        font-family: 'Syne', sans-serif !important;
        font-size: 1.4rem !important;
        font-weight: 800 !important;
        color: var(--text-white) !important;
        margin-bottom: 6px !important;
        text-transform: none !important;
    }
    /* Sub del form */
    .dw-form-sub {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.72rem;
        color: var(--text-gray);
        margin-bottom: 28px;
        letter-spacing: 0.5px;
    }
    /* ─── INPUT GROUP ─── */
    #login-box-main .input-group,
    #recover-step-1 .input-group,
    #recover-step-2 .input-group {
        position: relative;
        margin-bottom: 14px;
    }
    .input-field {
        width: 100%;
        background: var(--bg-dark) !important;
        border: 1px solid var(--border-color) !important;
        border-radius: 10px !important;
        padding: 14px 44px 14px 16px !important;
        color: var(--text-white) !important;
        font-family: 'Syne', sans-serif !important;
        font-size: 0.88rem !important;
        outline: none !important;
        transition: border-color 0.2s, box-shadow 0.2s !important;
    }
    .input-field::placeholder { color: var(--text-gray) !important; }
    .input-field:focus {
        border-color: var(--accent-text) !important;
        background: var(--bg-card) !important;
        box-shadow: 0 0 0 3px rgba(124,58,237,0.10), 0 0 18px rgba(124,58,237,0.06) !important;
    }
    .eye-icon {
        position: absolute !important;
        right: 14px !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        color: var(--text-gray) !important;
        cursor: pointer !important;
        font-size: 1.1rem !important;
        transition: color 0.2s !important;
    }
    .eye-icon:hover { color: #a855f7 !important; }
    /* ─── BOTÓN LOGIN ─── */
    .btn-login {
        width: 100% !important;
        padding: 14px !important;
        background: linear-gradient(135deg, #7c3aed, #9333ea) !important;
        border: none !important;
        border-radius: 10px !important;
        color: #fff !important;
        font-family: 'Syne', sans-serif !important;
        font-size: 0.82rem !important;
        font-weight: 700 !important;
        letter-spacing: 2.5px !important;
        text-transform: uppercase !important;
        cursor: pointer !important;
        margin-top: 6px !important;
        transition: transform 0.18s, box-shadow 0.18s !important;
        box-shadow: 0 4px 20px rgba(124,58,237,0.28) !important;
    }
    .btn-login:hover:not(:disabled) {
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 28px rgba(124,58,237,0.42) !important;
    }
    .btn-login:active { transform: translateY(0) !important; }
    /* ─── OLVIDÉ CONTRASEÑA ─── */
    .forgot-password-link {
        text-align: center !important;
        margin-top: 16px !important;
        font-size: 0.72rem !important;
        color: var(--text-gray) !important;
        cursor: pointer !important;
        font-family: 'JetBrains Mono', monospace !important;
        transition: color 0.2s !important;
    }
    .forgot-password-link:hover { color: #a855f7 !important; }
    /* ─── VOLVER ─── */
    .back-container {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        color: var(--text-gray) !important;
        font-size: 0.7rem !important;
        font-family: 'JetBrains Mono', monospace !important;
        cursor: pointer !important;
        text-transform: uppercase !important;
        letter-spacing: 1px !important;
        margin-top: 14px !important;
        width: 100% !important;
        justify-content: center !important;
        transition: color 0.2s !important;
    }
    .back-container:hover { color: #a855f7 !important; }
    /* ─── TIP DE RECUPERACIÓN ─── */
    .reminder-text {
        font-family: 'JetBrains Mono', monospace !important;
        font-size: 0.7rem !important;
        color: var(--text-gray) !important;
        text-align: center !important;
        margin-bottom: 22px !important;
        background: var(--bg-dark) !important;
        border: 1px solid var(--border-color) !important;
        border-radius: 8px !important;
        padding: 10px 14px !important;
        line-height: 1.5 !important;
    }
    /* ─── PIE DE PÁGINA ─── */
    #login-box-main > div:last-child {
        font-family: 'JetBrains Mono', monospace !important;
        font-size: 0.62rem !important;
        border-top: 1px solid var(--border-color) !important;
        padding-top: 18px !important;
        margin-top: 28px !important;
    }
    /* ─── RESPONSIVE ─── */
    @media (max-width: 820px) {
        #login-banner { display: none !important; }
        #dw-right-panel { width: 100% !important; }
        #login-view { flex-direction: column !important; background: var(--bg-card) !important; }
        #login-box-main,
        #recover-step-1,
        #recover-step-2 { padding: 32px 24px !important; }
    }
    /* ─── BOTÓN FLOTANTE DE TEMA ─── */
    .dw-theme-fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 1px solid rgba(124,58,237,0.25);
        background: var(--bg-card);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s, background 0.4s, border-color 0.3s;
    }
    .dw-theme-fab:hover {
        transform: scale(1.08);
        border-color: rgba(168,85,247,0.5);
        box-shadow: 0 6px 28px rgba(124,58,237,0.22);
    }
    .dw-theme-fab:active {
        transform: scale(0.94);
    }
    .dw-theme-fab .material-icons-round {
        font-size: 1.25rem;
        color: var(--text-white);
        transition: color 0.3s, transform 0.4s;
    }
    body.dark-mode .dw-theme-fab {
        box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 18px rgba(124,58,237,0.15);
    }
    @keyframes dw-fabSpin {
        from { transform: rotate(0deg) scale(1.08); }
        to   { transform: rotate(360deg) scale(1.08); }
    }
    .dw-theme-fab.spinning .material-icons-round {
        animation: dw-fabSpin 0.4s ease-out;
    }
    `;
    const style = document.createElement('style');
    style.id = 'dw-login-premium-styles';
    style.textContent = css;
    document.head.appendChild(style);
    // ── Reestructurar el DOM ──
    const loginView = document.getElementById('login-view');
    if (!loginView) return;
    // 1. Crear el panel derecho y mover las login-box dentro
    const rightPanel = document.createElement('div');
    rightPanel.id = 'dw-right-panel';
    const boxes = [...loginView.querySelectorAll('.login-box')];
    boxes.forEach(box => rightPanel.appendChild(box));
    loginView.appendChild(rightPanel);
    // 2. Inyectar imagen del banner (sutil) en panel derecho desde caché
    try {
        const cache = localStorage.getItem('dw_branding_cache');
        if (cache) {
            const datos = JSON.parse(cache);
            if (datos.banner) rightPanel.style.setProperty('--dw-banner-url', `url('${datos.banner}')`);
        }
    } catch (e) { }
    // 3. Inyectar contenido hero dentro del #login-banner existente
    const banner = document.getElementById('login-banner');
    if (banner) {
        // ─── Eliminar estilos del .login-banner-bg que interfieren ───
        banner.style.setProperty('-webkit-mask-image', 'none');
        banner.style.setProperty('mask-image', 'none');
        banner.style.opacity = '1';
        banner.style.position = 'relative';
        banner.style.height = '100vh';
        banner.style.width = '';
        banner.style.top = '';
        banner.style.left = '';
        banner.style.zIndex = '';
        banner.style.backgroundBlendMode = 'normal';
        banner.style.backgroundColor = 'transparent';
        banner.style.overflow = 'hidden';
        banner.innerHTML = `
            <div class="dw-banner-overlay"></div>
            <div class="dw-grid-overlay"></div>
            <div class="dw-orb-main"></div>
            <div class="dw-orb-secondary"></div>
            <div class="dw-float-card dw-fc-a">
                <div class="dw-dot dw-dot-green"></div>
                <div><strong>Plataforma activa</strong><small>Sistema operando al 100%</small></div>
            </div>
            <div class="dw-float-card dw-fc-b">
                <div class="dw-dot dw-dot-purple"></div>
                <div><strong>+20 Plataformas</strong><small>Todo en un solo lugar</small></div>
            </div>
            <div class="dw-float-card dw-fc-c">
                <div class="dw-dot dw-dot-amber"></div>
                <div><strong>Entrega inmediata</strong><small></small></div>
            </div>
            <div class="dw-hero-text">
                <div class="dw-hero-badge"><div class="dw-pulse"></div>Sistema en línea</div>
                <h1>Streaming sin<br><em>límites</em></h1>
                <p>🚀 Desbloquea el mejor entretenimiento. Entrega automática, máxima seguridad y garantía total al instante. Tu única preocupación será elegir qué maratonear hoy.</p>
                <div class="dw-stats">
                    <div class="dw-stat">
                        <div class="dw-stat-n">98<span>%</span></div>
                        <div class="dw-stat-l">Disponibilidad</div>
                    </div>
                    <div class="dw-stat">
                        <div class="dw-stat-n">&lt;2<span>m</span></div>
                        <div class="dw-stat-l">Entrega</div>
                    </div>
                    <div class="dw-stat">
                        <div class="dw-stat-n">24<span>h</span></div>
                        <div class="dw-stat-l">Soporte</div>
                    </div>
                </div>
            </div>
        `;
    }
    // 4. Reemplazar el pie de página dentro de login-box-main
    const mainBox = document.getElementById('login-box-main');
    if (mainBox) {
        const footerDiv = mainBox.querySelector('div[style*="margin-top"]');
        if (footerDiv) {
            footerDiv.style.cssText = 'text-align:center; margin-top:28px; padding-top:18px; border-top:1px dashed var(--border-color); display:flex; flex-direction:column; align-items:center; gap:8px;';
            footerDiv.innerHTML = `
                <div style="font-family:'JetBrains Mono',monospace; font-size:0.62rem; color:var(--text-gray); letter-spacing:1px; text-transform:uppercase;">
                    &copy; 2026 Desarrollado por <strong style="background:linear-gradient(135deg, #7c3aed, #a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; font-weight:900; letter-spacing:2px;">BRALLAN ARIZA</strong>
                </div>
                <div style="font-family:'JetBrains Mono',monospace; font-size:0.55rem; color:var(--text-gray); opacity:0.7; letter-spacing:1.5px; text-transform:uppercase;">
                    Todos los derechos reservados
                </div>
            `;
        }
        const brand = document.createElement('div');
        brand.className = 'dw-brand';
        brand.innerHTML = `
            <div class="dw-brand-row">
                <div class="dw-brand-icon"><span class="material-icons-round">lock</span></div>
                <span class="dw-brand-name">Bóveda</span>
            </div>
            <div class="dw-brand-sub">// plataforma de acceso seguro</div>
        `;
        mainBox.insertBefore(brand, mainBox.firstChild);
        const h2 = mainBox.querySelector('.vault-header');
        if (h2) {
            const sub = document.createElement('p');
            sub.className = 'dw-form-sub';
            sub.textContent = '// Ingresa tus credenciales para continuar';
            h2.after(sub);
        }
    }
    // 5. Botón flotante de cambio de tema (abajo a la derecha)
    const themeFab = document.createElement('button');
    themeFab.className = 'dw-theme-fab';
    themeFab.title = 'Cambiar tema';
    themeFab.setAttribute('aria-label', 'Cambiar entre modo claro y oscuro');
    const fabIcon = document.createElement('span');
    fabIcon.className = 'material-icons-round';
    fabIcon.textContent = document.body.classList.contains('dark-mode') ? 'light_mode' : 'dark_mode';
    themeFab.appendChild(fabIcon);
    themeFab.addEventListener('click', () => {
        const esOscuro = !document.body.classList.contains('dark-mode');
        document.body.classList.toggle('dark-mode', esOscuro);
        localStorage.setItem('dw_theme', esOscuro ? 'dark' : 'light');
        const sidebarToggle = document.getElementById('client-theme-toggle');
        if (sidebarToggle) sidebarToggle.checked = esOscuro;
        themeFab.classList.add('spinning');
        setTimeout(() => themeFab.classList.remove('spinning'), 400);
        setTimeout(() => {
            fabIcon.textContent = esOscuro ? 'light_mode' : 'dark_mode';
        }, 180);
    });
    document.body.appendChild(themeFab);
})(); // Fin _setupLoginUI
// =======================================================================
// --- HELPER INTERNO: ocultar/mostrar #login-view superando !important ---
// El CSS del panel premium define #login-view { display: flex !important }
// lo que hace que un simple loginSection.style.display = 'none' sea ignorado
// por el navegador (el !important de la hoja de estilos gana al inline sin flag).
// La solución es usar classList con la clase .dw-oculto que lleva su propio
// !important, o bien pasar el flag 'important' al método setProperty.
// Usamos la clase porque es más legible y fácil de depurar en DevTools.
// =======================================================================
function _ocultarLogin(el) {
    if (!el) return;
    el.classList.add('dw-oculto');
    // Doble seguro con setProperty para navegadores con quirks de especificidad
    el.style.setProperty('display', 'none', 'important');
}
function _mostrarLogin(el) {
    if (!el) return;
    el.classList.remove('dw-oculto');
    el.style.removeProperty('display');
}
// =======================================================================
// --- 1. API FETCH GLOBAL ---
// =======================================================================
window.apiCall = async function (params) {
    try {
        const formData = new URLSearchParams();
        for (const key in params) {
            formData.append(key, params[key]);
        }
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        return await response.json();
    } catch (e) {
        console.error("Error API:", e);
        return { success: false, msg: "Error de conexión con el servidor" };
    }
};
// =======================================================================
// --- 1.5 MOTOR DE SEGURIDAD (COOLDOWN CON LOCALSTORAGE) ---
// =======================================================================
window.verificarBloqueoBoton = function (btnElement, storageKey, textoOriginal) {
    if (!btnElement) return false;
    const bloqueoHasta = localStorage.getItem(storageKey);
    if (bloqueoHasta) {
        const tiempoRestante = Math.ceil((parseInt(bloqueoHasta) - Date.now()) / 1000);
        if (tiempoRestante > 0) {
            btnElement.disabled = true;
            btnElement.style.opacity = '0.5';
            btnElement.style.cursor = 'not-allowed';
            if (btnElement.dataset.intervalo) clearInterval(parseInt(btnElement.dataset.intervalo));
            let segs = tiempoRestante;
            btnElement.innerHTML = `<i class="material-icons-round" style="font-size:1.2rem; vertical-align:middle; margin-right:5px;">lock_clock</i> ${segs}s`;
            const interval = setInterval(() => {
                segs--;
                if (segs <= 0) {
                    clearInterval(interval);
                    localStorage.removeItem(storageKey);
                    btnElement.disabled = false;
                    btnElement.style.opacity = '1';
                    btnElement.style.cursor = 'pointer';
                    btnElement.innerHTML = textoOriginal;
                } else {
                    btnElement.innerHTML = `<i class="material-icons-round" style="font-size:1.2rem; vertical-align:middle; margin-right:5px;">lock_clock</i> ${segs}s`;
                }
            }, 1000);
            btnElement.dataset.intervalo = interval;
            return true;
        } else {
            localStorage.removeItem(storageKey);
        }
    }
    return false;
};
window.iniciarBloqueoBoton = function (btnElement, storageKey, textoOriginal, segundos = 30) {
    localStorage.setItem(storageKey, (Date.now() + (segundos * 1000)).toString());
    window.verificarBloqueoBoton(btnElement, storageKey, textoOriginal);
};
// =======================================================================
// --- 2. NOTIFICACIONES GLOBALES ---
// =======================================================================
window.mostrarToast = function (mensaje, tipo = 'success') {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            toast: true,
            position: 'bottom-end',
            icon: tipo,
            title: mensaje,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: document.body.classList.contains('dark-mode') ? '#1e293b' : '#ffffff',
            color: document.body.classList.contains('dark-mode') ? '#ffffff' : '#0f172a'
        });
    } else {
        alert(mensaje);
    }
};
// =======================================================================
// --- 3. ARRANQUE DE MÓDULOS ---
// =======================================================================
function arrancarModulos() {
    const ejecutar = () => {
        const versionBadge = document.getElementById('version-badge');
        if (versionBadge) versionBadge.style.display = 'none';
        const cartBtn = document.getElementById('main-cart-btn');
        if (cartBtn) {
            cartBtn.classList.add('hidden');
            cartBtn.style.display = 'none';
        }
        const btnTienda = document.querySelector('.nav-item[onclick*="tienda"]');
        if (btnTienda) {
            nav('tienda', btnTienda);
        } else {
            document.querySelectorAll('.main-content > div').forEach(el => el.classList.add('hidden'));
            const secTienda = document.getElementById('sec-tienda');
            if (secTienda) secTienda.classList.remove('hidden');
            if (cartBtn) {
                cartBtn.classList.remove('hidden');
                cartBtn.style.display = '';
            }
            if (typeof cargarTienda === 'function') cargarTienda();
            document.dispatchEvent(new CustomEvent('moduloCargado', { detail: { modulo: 'tienda' } }));
        }
    };
    const delay = typeof cargarTienda === 'function' ? 100 : 500;
    setTimeout(ejecutar, delay);
}
// =======================================================================
// --- 4. LÓGICA DE SESIÓN Y RENDERIZADO INICIAL ---
// =======================================================================
document.addEventListener('DOMContentLoaded', async () => {
    const formLogin = document.getElementById('login-form');
    const loginSection = document.getElementById('login-view');
    const dashboardSection = document.getElementById('app-view');
    const userNameDisplay = document.getElementById('display-user');
    // TEMA OSCURO/CLARO
    const themeToggle = document.getElementById('client-theme-toggle');
    const aplicarTemaCliente = (esOscuro) => {
        document.body.style.transition = 'background-color 0.4s ease, color 0.4s ease';
        document.body.classList.toggle('dark-mode', esOscuro);
        if (themeToggle) themeToggle.checked = esOscuro;
        localStorage.setItem('dw_theme', esOscuro ? 'dark' : 'light');
    };
    const temaGuardado = localStorage.getItem('dw_theme');
    if (temaGuardado) aplicarTemaCliente(temaGuardado === 'dark');
    else aplicarTemaCliente(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (themeToggle) themeToggle.addEventListener('change', (e) => aplicarTemaCliente(e.target.checked));
    // VISIBILIDAD DE CONTRASEÑA
    const togglePassword = document.getElementById('togglePassword');
    const passInput = document.getElementById('pass');
    if (togglePassword && passInput) {
        togglePassword.addEventListener('click', function () {
            const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passInput.setAttribute('type', type);
            this.textContent = type === 'password' ? 'visibility_off' : 'visibility';
        });
    }
    // ─── Helper: ocultar elementos fixed que escapan al padre ───
    const ocultarElementosFlotantesEnLogin = () => {
        const cartBtn = document.getElementById('main-cart-btn');
        if (cartBtn) {
            cartBtn.classList.add('hidden');
            cartBtn.style.display = 'none';
        }
        const versionBadge = document.getElementById('version-badge');
        if (versionBadge) versionBadge.style.display = 'none';
    };
    // COMPROBAR SESIÓN ACTIVA
    const t = localStorage.getItem('dw_token');
    const u = localStorage.getItem('dw_user');
    if (t && u) {
        // ✅ FIX: usar _ocultarLogin() en lugar de .style.display = 'none'
        _ocultarLogin(loginSection);
        if (dashboardSection) dashboardSection.style.display = 'flex';
        const _fab = document.querySelector('.dw-theme-fab');
        if (_fab) _fab.style.display = 'none'; //
        if (userNameDisplay) userNameDisplay.innerText = u;
        userBalance = Number(localStorage.getItem('dw_saldo')) || 0;
        updateBalanceUI();
        sincronizarSaldo();
        arrancarModulos();
    } else {
        _mostrarLogin(loginSection);
        if (dashboardSection) dashboardSection.style.display = 'none';
        ocultarElementosFlotantesEnLogin();
    }
    // PROCESAR LOGIN Y APLICAR BLOQUEO
    if (formLogin) {
        const btnLogin = formLogin.querySelector('button[type="submit"]');
        window.verificarBloqueoBoton(btnLogin, 'dw_login_cooldown', 'ENTRAR');
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (window.verificarBloqueoBoton(btnLogin, 'dw_login_cooldown', 'ENTRAR')) return;
            const user = document.getElementById('user').value.trim();
            const pass = document.getElementById('pass').value;
            btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> VERIFICANDO...';
            btnLogin.disabled = true;
            const res = await apiCall({ accion: 'login', usuario: user, clave: pass });
            if (res.success) {
                localStorage.removeItem('dw_login_cooldown');
                localStorage.setItem('dw_token', res.token);
                localStorage.setItem('dw_user', res.usuario);
                localStorage.setItem('dw_saldo', res.saldo || 0);
                userBalance = Number(res.saldo || 0);
                _ocultarLogin(loginSection);
                if (dashboardSection) dashboardSection.style.display = 'flex';
                const _fab = document.querySelector('.dw-theme-fab');
                if (_fab) _fab.style.display = 'none'; //
                if (userNameDisplay) userNameDisplay.innerText = res.usuario;
                updateBalanceUI();
                mostrarToast(`¡Bienvenido, ${res.usuario}!`, 'success');
                arrancarModulos();
                btnLogin.innerHTML = 'ENTRAR';
                btnLogin.disabled = false;
            } else {
                mostrarToast(res.msg || "Credenciales incorrectas", "error");
                window.iniciarBloqueoBoton(btnLogin, 'dw_login_cooldown', 'ENTRAR', 30);
            }
        });
    }
});
// =======================================================================
// --- 5. SINCRONIZACIÓN DE SALDO ---
// =======================================================================
window.sincronizarSaldo = async function () {
    const u = localStorage.getItem('dw_user');
    const t = localStorage.getItem('dw_token');
    if (!u || !t) return;
    const res = await apiCall({ accion: 'getSaldo', usuario: u, token: t });
    if (res.success) {
        userBalance = Number(res.saldo);
        localStorage.setItem('dw_saldo', userBalance);
        updateBalanceUI();
    }
};
window.updateBalanceUI = function () {
    const formatted = `$ ${new Intl.NumberFormat('es-CO').format(userBalance)}`;
    const dBalance = document.getElementById('display-balance');
    const wBalance = document.getElementById('wallet-balance-big');
    const iBalance = document.getElementById('inicio-user-balance-display');
    const iName = document.getElementById('inicio-user-name-display');
    if (dBalance) dBalance.innerText = formatted;
    if (wBalance) wBalance.innerText = formatted;
    if (iBalance) iBalance.innerText = formatted;
    if (iName) iName.innerText = localStorage.getItem('dw_user') || 'Cliente';
};
// =======================================================================
// --- 6. NAVEGACIÓN (SPA) CON CONTROL DE CARRITO Y BADGE DE VERSIÓN ---
// =======================================================================
window.nav = function (targetId, element) {
    document.querySelectorAll('.nav-item, .submenu-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');
    document.querySelectorAll('.main-content > div').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById('sec-' + targetId);
    if (target) target.classList.remove('hidden');
    const cartBtn = document.getElementById('main-cart-btn');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-overlay');
    const versionBadge = document.getElementById('version-badge');
    if (targetId === 'tienda') {
        if (cartBtn) {
            cartBtn.classList.remove('hidden');
            cartBtn.style.display = '';
        }
        if (versionBadge) versionBadge.style.display = 'none';
        if (typeof cargarTienda === 'function') cargarTienda();
    } else {
        if (cartBtn) {
            cartBtn.classList.add('hidden');
            cartBtn.style.display = 'none';
        }
        if (cartDrawer) cartDrawer.classList.remove('open');
        if (cartOverlay) cartOverlay.classList.add('hidden');
        if (versionBadge) {
            versionBadge.style.display = targetId === 'inicio' ? '' : 'none';
        }
    }
    if (window.innerWidth <= 768) toggleSidebar(false);
    if (targetId === 'pedidos' && typeof cargarPedidos === 'function') cargarPedidos();
    if (targetId === 'billetera' && typeof cargarBilletera === 'function') cargarBilletera();
    if (targetId === 'recarga' && typeof cargarRecarga === 'function') cargarRecarga();
    if (targetId === 'soporte' && typeof cargarSoporte === 'function') cargarSoporte();
    if (targetId === 'codigos' && typeof cargarCodigos === 'function') cargarCodigos();
    if (targetId === 'datos' && typeof cargarDatos === 'function') cargarDatos();
    if (targetId === 'mistickets' && typeof cargarMisTickets === 'function') cargarMisTickets();
    if (targetId === 'ranking' && typeof cargarRanking === 'function') cargarRanking();
    // Sincronizar dashboard de inicio al navegar allí
    if (targetId === 'inicio' && typeof updateBalanceUI === 'function') updateBalanceUI();
    document.dispatchEvent(new CustomEvent('moduloCargado', { detail: { modulo: targetId } }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
// =======================================================================
// --- 7. CONTROLES DE INTERFAZ (SIDEBAR / SUBMENÚS) ---
// =======================================================================
window.toggleSubmenu = function (elemento) {
    const submenu = elemento.nextElementSibling;
    if (submenu && submenu.classList.contains('submenu')) {
        submenu.classList.toggle('hidden');
        elemento.classList.toggle('open');
        const icon = elemento.querySelector('.arrow-icon');
        if (icon) icon.textContent = submenu.classList.contains('hidden') ? 'expand_more' : 'expand_less';
    }
};
window.toggleSidebar = function (force) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const isOpen = typeof force === 'boolean' ? force : !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', isOpen);
    if (overlay) overlay.classList.toggle('active', isOpen);
};
window.logout = function () {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
};
