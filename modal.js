/**
 * ================================================================
 * MODAL.JS — RECEIPT-VAULT | Motor Central de Facturas v3.0
 * ================================================================
 */

/* ── Copiar al portapapeles ────────────────────────────────────── */
window.copiarAlPortapapelesFactura = function(texto, btnElement) {
    const darFeedback = () => {
        // Toast INTERNO al modal (no usa Swal para no cerrar la factura)
        const t = document.getElementById('rv-inline-toast');
        if (t) {
            t.style.opacity = '1';
            t.style.transform = 'translateY(0)';
            clearTimeout(t._rv_timer);
            t._rv_timer = setTimeout(() => {
                t.style.opacity = '0';
                t.style.transform = 'translateY(6px)';
            }, 1400);
        }
        if (!btnElement) return;
        const isMaster = btnElement.id === 'rv-btn-copiar-todo';
        if (isMaster) {
            const orig = btnElement.innerHTML;
            btnElement.innerHTML = `<i class="material-icons-round" style="font-size:1rem;vertical-align:middle;">check_circle</i> ¡COPIADO!`;
            clearTimeout(btnElement._rv_t);
            btnElement._rv_t = setTimeout(() => { btnElement.innerHTML = orig; }, 1500);
        } else {
            const ic = btnElement.querySelector('.rv-copy-icon') || btnElement;
            const orig = ic.textContent;
            ic.textContent = 'check';
            ic.style.color = 'var(--success, #10b981)';
            clearTimeout(ic._rv_t);
            ic._rv_t = setTimeout(() => { ic.textContent = orig; ic.style.color = ''; }, 1200);
        }
    };

    if (navigator.clipboard) {
        navigator.clipboard.writeText(texto).then(darFeedback).catch(() => darFeedback());
    } else {
        const ta = Object.assign(document.createElement('textarea'), { value: texto });
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch(_) {}
        document.body.removeChild(ta);
        darFeedback();
    }
};

/* ── Delegación de eventos global ─────────────────────────────── */
document.addEventListener('click', e => {
    const master = e.target.closest('#rv-btn-copiar-todo');
    if (master) {
        e.stopPropagation();
        const t = master.dataset.textoFull;
        if (t) window.copiarAlPortapapelesFactura(decodeURIComponent(t), master);
        return;
    }
    const acc = e.target.closest('.rv-acc-row');
    if (acc) {
        e.stopPropagation();
        const t = acc.dataset.copy;
        if (t) window.copiarAlPortapapelesFactura(t, acc.querySelector('.rv-copy-icon-wrap'));
        return;
    }
    const grp = e.target.closest('.rv-copy-group');
    if (grp) {
        e.stopPropagation();
        const t = grp.dataset.copy;
        if (t) window.copiarAlPortapapelesFactura(decodeURIComponent(t), grp);
        return;
    }
});

/* ── Pantalla de carga ─────────────────────────────────────────── */
function _mostrarCarga() {
    const isDark = document.body.classList.contains('dark-mode');
    const bg  = isDark ? '#0d1117' : '#ffffff';
    const col = isDark ? '#e2e8f0' : '#1e293b';
    const sub = isDark ? 'rgba(226,232,240,.4)' : 'rgba(30,41,59,.4)';
    Swal.fire({
        html: `
          <div style="padding:40px 30px;text-align:center;background:${bg};border-radius:18px;">
            <div style="position:relative;width:88px;height:88px;margin:0 auto 22px;">
              <div style="position:absolute;inset:0;border-radius:50%;border:3px solid var(--accent-glow,rgba(124,58,237,.2));"></div>
              <div style="position:absolute;inset:0;border-radius:50%;border:3px solid transparent;border-top-color:var(--accent,#7c3aed);animation:rv-spin 0.9s linear infinite;"></div>
              <i class="material-icons-round" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:2.2rem;color:var(--accent,#7c3aed);">receipt_long</i>
            </div>
            <p style="margin:0 0 5px;color:${col};font-size:.95rem;font-weight:700;">Cargando Factura</p>
            <p style="margin:0;color:${sub};font-size:.75rem;letter-spacing:1.5px;text-transform:uppercase;">Conexión segura…</p>
            <style>@keyframes rv-spin{to{transform:rotate(360deg)}}</style>
          </div>`,
        background: 'transparent',
        showConfirmButton: false,
        allowOutsideClick: false,
        customClass: { popup: 'rv-loading-popup' },
        didOpen: () => {
            const pop = Swal.getPopup();
            if (pop) Object.assign(pop.style, { background:'transparent', boxShadow:'none', padding:'0' });
        }
    });
}

/* ── Motor principal ───────────────────────────────────────────── */
window.abrirFacturaGlobal = async function(orderId, datosPrecargados = null) {
    const isDark = document.body.classList.contains('dark-mode');

    const esc = s => s == null ? '' : String(s)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;').replace(/'/g,'&#039;');

    if (/^(REC|DES)-/.test(orderId)) {
        return Swal.fire({
            icon:'info', title:'Operación Financiera',
            text:`El ID ${esc(orderId)} es un ajuste de saldo, no una compra.`,
            background: isDark ? 'var(--bg-card,#1e293b)' : '#fff',
            color: 'var(--text-main)', confirmButtonColor: 'var(--accent)',
        });
    }

    _mostrarCarga();
    const t0 = Date.now();

    if (!datosPrecargados) {
        try {
            const filtro = orderId.startsWith('Sin Orden') ? orderId.replace('Sin Orden - ','').trim() : orderId;
            const res = await apiCall({
                accion: 'getPedidos',
                usuario: localStorage.getItem('dw_user') || localStorage.getItem('jeico_user'),
                token:   localStorage.getItem('dw_token') || localStorage.getItem('jeico_token'),
                filtro, pagina: '1'
            });
            if (res.success && res.datos?.length) datosPrecargados = res.datos;
            else return Swal.fire({ icon:'error', title:'Sin datos', text:'No se pudo cargar la factura.', background: isDark?'var(--bg-card,#1e293b)':'#fff' });
        } catch(_) {
            return Swal.fire({ icon:'error', title:'Error de red', text:'No se pudo conectar.', background: isDark?'var(--bg-card,#1e293b)':'#fff' });
        }
    }

    const elapsed = Date.now() - t0;
    if (elapsed < 1000) await new Promise(r => setTimeout(r, 1000 - elapsed));

    /* Filtrar ítems */
    let items;
    if (orderId.startsWith('Sin Orden')) {
        const dateKey = orderId.replace('Sin Orden - ','');
        items = datosPrecargados.filter(i => {
            if (i.orderId?.trim()) return false;
            const [raw] = (i.fecha||'').split(' ');
            if (raw.includes('-')) { const [y,m,d]=raw.split('-'); return `${d}/${m}/${y}`===dateKey; }
            if (raw.includes('/')) { const [d,m,y]=raw.split('/'); return `${d.padStart(2,'0')}/${m.padStart(2,'0')}/${y}`===dateKey; }
            return false;
        });
    } else {
        items = datosPrecargados.filter(i => i.orderId===orderId || i.order_id===orderId);
    }

    if (!items.length) return Swal.fire({ icon:'warning', title:'No encontrado', text:'No hay detalles para este pedido.', background: isDark?'var(--bg-card,#1e293b)':'#fff' });

    /* Agrupar por servicio */
    const grupos = {};
    items.forEach(it => {
        grupos[it.servicio] ??= { cuentas:[], precio: parseFloat(it.precio)||0 };
        grupos[it.servicio].cuentas.push(it);
    });

    /* Tipo de orden — solo REN- y Sin Orden tienen colores propios; las normales usan el tema */
    const isRen   = orderId.startsWith('REN-');
    const isSinOr = orderId.startsWith('Sin Orden');
    const typeColor = isRen ? '#10b981' : isSinOr ? '#f59e0b' : null; // null = usar var(--accent)
    const typeGlow  = isRen ? 'rgba(16,185,129,.22)' : isSinOr ? 'rgba(245,158,11,.22)' : null;
    const C  = typeColor || 'var(--accent)';
    const Ct = isRen ? '#10b981' : isSinOr ? '#f59e0b' : 'var(--accent-text)';
    const G  = typeGlow  || 'var(--accent-glow)';
    const icon  = isRen ? 'autorenew' : isSinOr ? 'history' : 'shopping_bag';
    const label = isRen ? 'RENOVACIÓN'  : isSinOr ? 'HISTORIAL ANTIGUO' : 'COMPROBANTE DE COMPRA';

    const fmt = new Intl.NumberFormat('es-CO',{minimumFractionDigits:0,maximumFractionDigits:0});
    const ahora = new Date().toLocaleString('es-CO',{dateStyle:'medium',timeStyle:'short'});

    /* Colores de fondo según modo */
    const BG  = isDark ? '#0d1117'              : '#ffffff';
    const BG2 = isDark ? '#111827'              : '#f1f5f9';
    const BD  = isDark ? 'rgba(255,255,255,.08)': 'rgba(0,0,0,.1)';
    const TX  = isDark ? '#e2e8f0'              : '#0f172a';
    const TXM = isDark ? 'rgba(226,232,240,.5)' : 'rgba(15,23,42,.5)';
    const ABX = isDark ? 'rgba(0,0,0,.25)'      : 'rgba(0,0,0,.04)';

    let totalGeneral = 0;
    let bloqueHtml   = '';
    let textoTotal   = `▶ ${label}\n  Pedido: ${orderId}\n${'─'.repeat(36)}\n\n`;

    for (const [srv, data] of Object.entries(grupos)) {
        const { cuentas, precio } = data;
        const subtotal = cuentas.length * precio;
        totalGeneral += subtotal;

        let filasHtml   = '';
        let textoBloque = `📦 ${srv.toUpperCase()}\n`;

        cuentas.forEach((cd, idx) => {
            const cuenta  = esc(cd.cuenta);
            const clave   = cd.clave ? esc(cd.clave) : null;
            const notasOcultas = ['reciclada','archivada','stock'];
            let estado = (cd.estado||'').toLowerCase();
            let nota   = cd.notas||'';
            if (notasOcultas.some(w => nota.toLowerCase().includes(w))) { estado='vencida'; nota=''; }
            const isVencida = estado==='reemplazada'||estado==='vencida';
            const dimStyle  = isVencida ? 'opacity:.35;filter:grayscale(1);pointer-events:none;' : '';
            const vencidaBadge = isVencida && !nota
                ? `<div class="rv-badge rv-badge-danger"><i class="material-icons-round">block</i> Cuenta vencida</div>` : '';
            const notaBadge = nota
                ? `<div class="rv-badge rv-badge-warn"><i class="material-icons-round">sticky_note_2</i> ${esc(nota)}</div>` : '';

            textoBloque += `  ${idx+1}. ${cd.cuenta}${cd.clave?'\n     🔑 '+cd.clave:''}\n`;

            filasHtml += `
              <div class="rv-acc-row" data-copy="${cuenta}" style="${dimStyle}">
                <div class="rv-acc-left">
                  <span class="rv-acc-num">${idx+1}</span>
                  <div class="rv-acc-info">
                    <span class="rv-acc-val">${cuenta}</span>
                    ${clave?`<span class="rv-acc-key"><i class="material-icons-round" style="font-size:.85rem;vertical-align:middle;">vpn_key</i> ${clave}</span>`:''}
                  </div>
                </div>
                <span class="rv-copy-icon-wrap"><i class="material-icons-round rv-copy-icon">content_copy</i></span>
              </div>
              ${vencidaBadge}${notaBadge}`;
        });

        textoBloque += `  Precio: $${fmt.format(precio)}  |  Subtotal: $${fmt.format(subtotal)}\n\n`;
        textoTotal  += textoBloque;
        const txtEnc = encodeURIComponent(textoBloque);

        bloqueHtml += `
          <div class="rv-srv-card">
            <div class="rv-srv-head">
              <div class="rv-srv-title">
                <span class="rv-srv-dot"></span>
                ${esc(srv)}
                <i class="material-icons-round rv-copy-group rv-copy-icon" data-copy="${txtEnc}" title="Copiar bloque">content_copy</i>
              </div>
              <span class="rv-srv-qty">×${cuentas.length}</span>
            </div>
            <div class="rv-srv-body">${filasHtml}</div>
            <div class="rv-srv-foot">
              <span>Unidad <strong>$${fmt.format(precio)}</strong></span>
              <span>Subtotal <strong>$${fmt.format(subtotal)}</strong></span>
            </div>
          </div>`;
    }

    textoTotal += `${'─'.repeat(36)}\n💰 TOTAL: $${fmt.format(totalGeneral)}\n¡Gracias por tu preferencia!`;
    const textoEnc = encodeURIComponent(textoTotal);

    const html = `
      <style>
        .rv-wrap *{box-sizing:border-box;}
        .rv-wrap :not(i){font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}
        .rv-wrap i.material-icons-round,.rv-wrap i.material-icons{font-family:'Material Icons Round','Material Icons'!important;font-weight:normal;font-style:normal;display:inline-flex;align-items:center;line-height:1;text-transform:none;letter-spacing:normal;white-space:nowrap;direction:ltr;-webkit-font-smoothing:antialiased;}

        .rv-wrap{background:${BG};border-radius:20px;overflow:hidden;color:${TX};text-align:left;position:relative;}

        /* Toast interno */
        #rv-inline-toast{position:absolute;top:14px;left:50%;transform:translateX(-50%) translateY(6px);background:var(--success,#10b981);color:#fff;font-size:.78rem;font-weight:700;padding:6px 16px;border-radius:20px;opacity:0;transition:opacity .25s,transform .25s;pointer-events:none;z-index:99;white-space:nowrap;letter-spacing:.5px;}

        /* Header */
        .rv-header{padding:22px 20px 16px;background:${BG2};border-bottom:1.5px solid ${BD};position:relative;}
        .rv-header-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:10px;}
        .rv-brand{display:flex;align-items:center;gap:10px;min-width:0;}
        .rv-brand-icon{width:40px;height:40px;border-radius:11px;background:${G};display:flex;align-items:center;justify-content:center;border:1.5px solid ${C};flex-shrink:0;}
        .rv-brand-icon i{font-size:1.35rem;color:${C};}
        .rv-brand-text{line-height:1.25;min-width:0;}
        .rv-brand-label{font-size:.65rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${TXM};}
        .rv-brand-name{font-size:.9rem;font-weight:800;color:${C};letter-spacing:.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        #rv-btn-copiar-todo{flex-shrink:0;background:${G};color:${Ct};border:1.5px solid ${C};padding:7px 12px;border-radius:10px;font-size:.72rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all .2s;white-space:nowrap;}
        #rv-btn-copiar-todo:hover{background:${C};color:#fff;}
        .rv-order-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .rv-order-pill{display:inline-flex;align-items:center;gap:6px;background:${G};border:1.5px solid ${C};border-radius:8px;padding:5px 12px;}
        .rv-order-pill i{font-size:.95rem;color:${C};}
        .rv-order-pill span{font-family:monospace;font-size:.85rem;font-weight:700;color:${C};}
        .rv-order-date{font-size:.7rem;color:${TXM};}

        /* Accent line */
        .rv-accent-line{height:3px;background:linear-gradient(90deg,transparent,${C},transparent);}

        /* Body */
        .rv-body{padding:16px 18px;max-height:50vh;overflow-y:auto;}
        .rv-body::-webkit-scrollbar{width:4px;}
        .rv-body::-webkit-scrollbar-thumb{background:${G};border-radius:99px;}

        /* Service cards */
        .rv-srv-card{background:${BG2};border:1px solid ${BD};border-radius:12px;margin-bottom:12px;overflow:hidden;transition:border-color .2s;}
        .rv-srv-card:hover{border-color:${C};}
        .rv-srv-head{padding:10px 13px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid ${BD};background:${ABX};}
        .rv-srv-title{display:flex;align-items:center;gap:7px;font-size:.8rem;font-weight:800;text-transform:uppercase;color:${TX};}
        .rv-srv-dot{width:7px;height:7px;border-radius:50%;background:${C};flex-shrink:0;}
        .rv-srv-title .rv-copy-icon{font-size:.9rem;color:${TXM};cursor:pointer;transition:color .15s;}
        .rv-srv-title .rv-copy-icon:hover{color:${C};}
        .rv-srv-qty{font-size:.7rem;font-weight:800;padding:2px 9px;border-radius:20px;border:1.5px solid ${C};color:${Ct};background:${G};}
        .rv-srv-body{padding:10px 13px;display:flex;flex-direction:column;gap:7px;}
        .rv-srv-foot{padding:8px 13px;display:flex;justify-content:space-between;font-size:.73rem;color:${TXM};border-top:1px dashed ${BD};background:${ABX};}
        .rv-srv-foot strong{color:${TX};font-family:monospace;}

        /* Account rows */
        .rv-acc-row{display:flex;align-items:center;justify-content:space-between;background:${ABX};border:1px solid ${BD};border-radius:8px;padding:9px 11px;cursor:pointer;transition:all .18s;gap:8px;}
        .rv-acc-row:hover{border-color:${C};background:${G};}
        .rv-acc-row:hover .rv-copy-icon{color:${C};}
        .rv-acc-left{display:flex;align-items:center;gap:9px;min-width:0;}
        .rv-acc-num{width:21px;height:21px;border-radius:6px;background:${G};color:${Ct};font-size:.68rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid ${C}44;}
        .rv-acc-info{display:flex;flex-direction:column;gap:2px;min-width:0;}
        .rv-acc-val{font-family:monospace;font-size:.88rem;font-weight:700;word-break:break-all;color:${TX};}
        .rv-acc-key{font-size:.72rem;color:${TXM};font-family:monospace;}
        .rv-copy-icon-wrap{flex-shrink:0;}
        .rv-copy-icon{font-size:1rem;color:${TXM};transition:color .15s;}

        /* Badges */
        .rv-badge{display:flex;align-items:center;gap:5px;font-size:.7rem;font-weight:700;padding:3px 9px;border-radius:6px;margin-top:4px;}
        .rv-badge i{font-size:.82rem;}
        .rv-badge-danger{color:#ef4444;background:rgba(239,68,68,.1);border:1px dashed rgba(239,68,68,.3);}
        .rv-badge-warn{color:#f59e0b;background:rgba(245,158,11,.1);border:1px dashed rgba(245,158,11,.3);}

        /* Footer */
        .rv-footer{padding:18px 20px;background:${BG2};border-top:1.5px solid ${BD};}
        .rv-total-row{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:4px;}
        .rv-total-label{font-size:.67rem;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${TXM};margin-bottom:3px;}
        .rv-total-amount{font-family:monospace;font-size:2.1rem;font-weight:900;line-height:1;background:var(--accent-gradient,linear-gradient(135deg,var(--accent),var(--accent-text)));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 8px ${G});}
        .rv-verified-icon{font-size:2.2rem!important;color:${G};}
        .rv-thank{text-align:center;font-size:.66rem;letter-spacing:2px;text-transform:uppercase;color:${TXM};margin-top:14px;}

        .premium-swal-rv .swal2-popup{background:transparent!important;box-shadow:none!important;padding:0!important;}
        .premium-swal-rv .swal2-html-container{margin:0!important;padding:0!important;overflow:visible!important;}
      </style>

      <div class="rv-wrap">
        <div id="rv-inline-toast">✓ ¡Copiado!</div>
        <div class="rv-accent-line"></div>

        <div class="rv-header">
          <div class="rv-header-top">
            <div class="rv-brand">
              <div class="rv-brand-icon"><i class="material-icons-round">${icon}</i></div>
              <div class="rv-brand-text">
                <div class="rv-brand-label">Comprobante oficial</div>
                <div class="rv-brand-name">${label}</div>
              </div>
            </div>
            <button id="rv-btn-copiar-todo" data-texto-full="${textoEnc}">
              <i class="material-icons-round" style="font-size:.95rem;">content_copy</i> COPIAR
            </button>
          </div>
          <div class="rv-order-row">
            <div class="rv-order-pill">
              <i class="material-icons-round">tag</i>
              <span>${esc(orderId)}</span>
            </div>
            <span class="rv-order-date">${ahora}</span>
          </div>
        </div>

        <div class="rv-body">${bloqueHtml}</div>

        <div class="rv-footer">
          <div class="rv-total-row">
            <div>
              <div class="rv-total-label">Total pagado</div>
              <div class="rv-total-amount">$${fmt.format(totalGeneral)}</div>
            </div>
            <i class="material-icons-round rv-verified-icon">verified</i>
          </div>
          <div class="rv-thank">✦ Gracias por tu preferencia ✦</div>
        </div>
      </div>`;

    Swal.fire({
        html,
        background: 'transparent',
        showConfirmButton: false,
        width: '460px',
        allowOutsideClick: true,
        backdrop: 'rgba(0,0,0,.88)',
        customClass: { popup: 'premium-swal-rv' },
        showClass:  { popup: 'animate__animated animate__zoomIn  animate__faster' },
        hideClass:  { popup: 'animate__animated animate__zoomOut animate__faster' },
    });
};

