/* =================================================================================
   ARCHIVO: billetera.js (LADO CLIENTE)
   Lógica: Historial de movimientos, renderizado optimizado y facturas externas.
================================================================================= */

let misMovsRaw = [];              
let misMovsAgrupados = [];        
let misMovsInicializado = false; 

let misMovPaginaActual = 1;
let misMovTotalPaginas = 1;
let misMovLimitePagina = 10; 

// 🔥 Modificado para que ordene por fecha de mayor a menor por default
let misMovColumnaOrden = 'fecha';
let misMovDireccionOrden = 'desc';

// --- FUNCIÓN GLOBAL DE SANITIZACIÓN (MITIGACIÓN XSS) ---
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==========================================
// 1. GANCHOS DE NAVEGACIÓN
// ==========================================
document.addEventListener('moduloCargado', (e) => {
    if (e.detail.modulo === 'billetera') {
        inicializarModuloMisMovimientos();
        cargarMisMovimientosBase();
    }
});

// ==========================================
// 2. INTERFAZ ULTRA-PREMIUM
// ==========================================
function inicializarModuloMisMovimientos() {
    if (misMovsInicializado) return; 
    misMovsInicializado = true;

    const seccionHistorial = document.querySelector('.history-container-premium');
    if (!seccionHistorial) return;

    seccionHistorial.innerHTML = `
        <div class="stats-dashboard">
            <div class="stat-card-glass">
                <div class="stat-icon-circle bg-recarga"><i class="material-icons-round">account_balance</i></div>
                <div class="stat-info">
                    <span class="stat-label">(Recargas Ingresadas)</span>
                    <span class="stat-value" id="tot-recargas">$ 0</span>
                </div>
            </div>
            <div class="stat-card-glass">
                <div class="stat-icon-circle bg-compra"><i class="material-icons-round">shopping_cart</i></div>
                <div class="stat-info">
                    <span class="stat-label">(Compras en Tienda)</span>
                    <span class="stat-value" id="tot-compras">$ 0</span>
                </div>
            </div>
            <div class="stat-card-glass">
                <div class="stat-icon-circle bg-descuento"><i class="material-icons-round">money_off</i></div>
                <div class="stat-info">
                    <span class="stat-label">(Descuentos de Admin)</span>
                    <span class="stat-value" id="tot-descuentos">$ 0</span>
                </div>
            </div>
        </div>

        <div class="mis-movs-header-actions">
            <h2 class="header-title-premium">
                <i class="material-icons-round" style="color:var(--accent-text);">history_toggle_off</i> MI ACTIVIDAD
            </h2>
            <button class="btn-export-csv" onclick="exportarMisMovimientosCSV()">
                <i class="material-icons-round">file_download</i> DESCARGAR HISTORIAL
            </button>
        </div>

        <div class="mis-movs-filters-box">
            <div class="filter-input-group" style="flex: 2;">
                <label>Buscador Rápido</label>
                <div style="position:relative;">
                    <i class="material-icons-round" style="position:absolute; left:10px; top:12px; color:var(--text-muted); font-size:1.1rem;">search</i>
                    <input type="text" id="mismovs-buscar" placeholder="Buscar concepto o referencia..." style="padding-left:35px;">
                </div>
            </div>
            <div class="filter-input-group">
                <label>Desde Fecha</label>
                <input type="date" id="mismovs-inicio">
            </div>
            <div class="filter-input-group">
                <label>Hasta Fecha</label>
                <input type="date" id="mismovs-fin">
            </div>
            <div class="filter-input-group">
                <label>Ver Registros</label>
                <select id="mismovs-limite">
                    <option value="10" selected>10 a la vez</option>
                    <option value="20">20 a la vez</option>
                    <option value="50">50 a la vez</option>
                </select>
            </div>
        </div>
        
        <div id="alerta-filtro-mes" class="alerta-mes-movimientos"></div>

        <div class="premium-table-container">
            <table class="mov-table" id="tabla-mis-movs">
                <thead>
                    <tr>
                        <th class="sortable-th" onclick="ordenarMisMovimientos('fecha')" style="text-align: left;">Fecha y Hora <span class="sort-icon-mov" data-col="fecha" style="color:var(--accent-text);">▼</span></th>
                        <th class="sortable-th" onclick="ordenarMisMovimientos('orderId')" style="text-align: left;">Referencia <span class="sort-icon-mov" data-col="orderId">↕</span></th>
                        <th style="text-align: left;">Detalle de Operación</th>
                        <th class="sortable-th" onclick="ordenarMisMovimientos('monto')" style="text-align: right;">Monto Total <span class="sort-icon-mov" data-col="monto">↕</span></th>
                        <th class="sortable-th" onclick="ordenarMisMovimientos('saldoNuevo')" style="text-align: right;">Saldo Restante <span class="sort-icon-mov" data-col="saldoNuevo">↕</span></th>
                        <th style="text-align:center;">Acción</th>
                    </tr>
                </thead>
                <tbody id="mis-movs-body">
                    <tr><td colspan="6" style="text-align:center; padding:60px;"><div class="spinner" style="margin: 0 auto;"></div></td></tr>
                </tbody>
            </table>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 25px; flex-wrap: wrap; gap: 15px; background: var(--bg-card); padding: 15px 20px; border-radius: 12px; border: 1px solid var(--border-color);">
            <div id="mis-movs-info" style="color:var(--text-gray); font-size:0.85rem; font-weight:600; letter-spacing:0.5px;"></div>
            <div id="mis-movs-pagination" class="pagination-container"></div>
        </div>
    `;

    bindEventosMisMovimientos();
}

// ==========================================
// 3. LOGICA DE PROCESAMIENTO (DATA ENGINE)
// ==========================================
function procesarDataHistorica(datos, totalesServidor, mensajeAlertaServidor) {
    let agrupados = [];
    let mapa = {};

    const divAlerta = document.getElementById('alerta-filtro-mes');
    if (divAlerta && mensajeAlertaServidor) {
        divAlerta.innerHTML = `<i class="material-icons-round">info</i> ${escapeHTML(mensajeAlertaServidor)}`;
        divAlerta.style.display = 'flex';
    }

    datos.forEach(mov => {
        const montoNum = parseFloat(mov.monto) || 0;
        const ref = (mov.orderId || '').trim();

        if (ref.startsWith('ORD-') || ref.startsWith('REN-')) {
            if (!mapa[ref]) {
                mapa[ref] = {
                    ...mov,
                    orderId: ref,
                    monto_agrupado: montoNum,
                    saldo_final_pedido: parseFloat(mov.saldoNuevo) || 0,
                    conteo: 1
                };
                agrupados.push(mapa[ref]);
            } else {
                mapa[ref].monto_agrupado += montoNum;
                mapa[ref].conteo++;
                const currentSaldo = parseFloat(mov.saldoNuevo) || 0;
                if (currentSaldo < mapa[ref].saldo_final_pedido) {
                    mapa[ref].saldo_final_pedido = currentSaldo;
                }
            }
        } else {
            agrupados.push({
                ...mov,
                orderId: ref, 
                monto_agrupado: montoNum,
                saldo_final_pedido: parseFloat(mov.saldoNuevo) || 0,
                conteo: 1
            });
        }
    });

    agrupados.forEach(item => {
        if (item.conteo > 1) {
            item.motivo = `Compra Múltiple (${item.conteo} servicios en tienda)`;
        }
    });

    misMovsAgrupados = agrupados;

    const recargas = totalesServidor?.recargas ? parseFloat(totalesServidor.recargas) : 0;
    const compras = totalesServidor?.compras ? parseFloat(totalesServidor.compras) : 0;
    const descuentos = totalesServidor?.descuentos ? parseFloat(totalesServidor.descuentos) : 0;

    const f = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    document.getElementById('tot-recargas').innerText = `$ ${f.format(recargas)}`;
    document.getElementById('tot-compras').innerText = `$ ${f.format(compras)}`;
    document.getElementById('tot-descuentos').innerText = `$ ${f.format(descuentos)}`;

    renderizarHistoricoPremium();
}

function renderizarHistoricoPremium() {
    const filtro = (document.getElementById('mismovs-buscar')?.value || '').toLowerCase().trim();
    const dIni = document.getElementById('mismovs-inicio')?.value || '';
    const dFin = document.getElementById('mismovs-fin')?.value || '';

    const parseFechaSegura = (fechaStr) => {
        if (!fechaStr) return 0;
        let soloFecha = fechaStr.split(' ')[0]; 
        let tiempoObj = new Date();
        if (soloFecha.includes('-')) {
            let [y, m, d] = soloFecha.split('-');
            tiempoObj = new Date(y, m - 1, d);
        } else if (soloFecha.includes('/')) {
            let [d, m, y] = soloFecha.split('/');
            tiempoObj = new Date(y, m - 1, d);
        }
        
        if (fechaStr.includes(' ')) {
            let horaParts = fechaStr.split(' ')[1].split(':');
            tiempoObj.setHours(horaParts[0] || 0, horaParts[1] || 0, horaParts[2] || 0);
        }
        
        return tiempoObj.getTime();
    };

    let filtrados = misMovsAgrupados.filter(mov => {
        let matchText = `${mov.motivo} ${mov.orderId || ''}`.toLowerCase().includes(filtro);
        let matchDate = true;
        if(dIni || dFin) {
            let fObj = new Date(parseFechaSegura(mov.fecha));
            if(!isNaN(fObj.getTime())) {
                const mDate = fObj.toISOString().split('T')[0]; 
                if(dIni && mDate < dIni) matchDate = false;
                if(dFin && mDate > dFin) matchDate = false;
            }
        }
        return matchText && matchDate;
    });

    filtrados.sort((a, b) => {
        let vA, vB;
        switch(misMovColumnaOrden) {
            case 'fecha': vA = parseFechaSegura(a.fecha); vB = parseFechaSegura(b.fecha); break;
            case 'orderId': vA = (a.orderId || '').toLowerCase(); vB = (b.orderId || '').toLowerCase(); break;
            case 'monto': vA = Math.abs(a.monto_agrupado); vB = Math.abs(b.monto_agrupado); break;
            case 'saldoNuevo': vA = parseFloat(a.saldo_final_pedido); vB = parseFloat(b.saldo_final_pedido); break;
            default: vA = parseFechaSegura(a.fecha); vB = parseFechaSegura(b.fecha);
        }
        return misMovDireccionOrden === 'asc' ? (vA > vB ? 1 : -1) : (vA < vB ? 1 : -1);
    });

    const total = filtrados.length;
    misMovLimitePagina = parseInt(document.getElementById('mismovs-limite')?.value || 10);
    misMovTotalPaginas = Math.ceil(total / misMovLimitePagina) || 1;
    
    if (misMovPaginaActual > misMovTotalPaginas) misMovPaginaActual = Math.max(1, misMovTotalPaginas);

    let start = (misMovPaginaActual - 1) * misMovLimitePagina;
    let pagina = filtrados.slice(start, start + misMovLimitePagina);

    const esMovil = window.matchMedia("(max-width: 768px)").matches || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (esMovil && typeof renderizarBilleteraMovil === 'function') {
        return renderizarBilleteraMovil(pagina, total, misMovPaginaActual, misMovTotalPaginas);
    }

    const tableContainer = document.querySelector('.premium-table-container');
    if (tableContainer && !document.getElementById('tabla-mis-movs')) {
        tableContainer.style.background = 'var(--bg-card)';
        tableContainer.style.border = '1px solid var(--border-color)';
        tableContainer.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
        tableContainer.style.padding = '';
        tableContainer.innerHTML = `
            <table class="mov-table" id="tabla-mis-movs">
                <thead>
                    <tr>
                        <th class="sortable-th" onclick="ordenarMisMovimientos('fecha')" style="text-align: left;">Fecha y Hora <span class="sort-icon-mov" data-col="fecha" style="color:var(--accent-text);">▼</span></th>
                        <th class="sortable-th" onclick="ordenarMisMovimientos('orderId')" style="text-align: left;">Referencia <span class="sort-icon-mov" data-col="orderId">↕</span></th>
                        <th style="text-align: left;">Detalle de Operación</th>
                        <th class="sortable-th" onclick="ordenarMisMovimientos('monto')" style="text-align: right;">Monto Total <span class="sort-icon-mov" data-col="monto">↕</span></th>
                        <th class="sortable-th" onclick="ordenarMisMovimientos('saldoNuevo')" style="text-align: right;">Saldo Restante <span class="sort-icon-mov" data-col="saldoNuevo">↕</span></th>
                        <th style="text-align:center;">Acción</th>
                    </tr>
                </thead>
                <tbody id="mis-movs-body"></tbody>
            </table>
        `;
        const infoDesk = document.getElementById('mis-movs-info');
        const pagDesk = document.getElementById('mis-movs-pagination');
        if (infoDesk) infoDesk.style.display = 'block';
        if (pagDesk) pagDesk.style.display = 'flex';
    }

    const tbody = document.getElementById('mis-movs-body');
    if (tbody) tbody.innerHTML = '';

    if (pagina.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 60px; color:var(--text-gray);">Aún no tienes movimientos registrados o ninguno coincide con la búsqueda.</td></tr>`;
        document.getElementById('mis-movs-info').innerHTML = `MOSTRANDO PÁGINA <b>0</b> DE <b>0</b>`;
        document.getElementById('mis-movs-pagination').innerHTML = '';
        return;
    }

    const fmt = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    
    // MEJORA 2: DocumentFragment para evitar repaints en bucle
    const fragment = document.createDocumentFragment();

    pagina.forEach(mov => {
        const monto = mov.monto_agrupado;
        const isIngreso = monto > 0;
        const colorClass = isIngreso ? 'amount-positive' : 'amount-negative';
        const signo = isIngreso ? '+' : '-';
        const montoAbs = Math.abs(monto);
        
        let fFormat1 = escapeHTML(mov.fecha);
        let fFormat2 = '';
        try {
            let fPura = mov.fecha.split(' ')[0];
            let fObj = new Date();
            if (fPura.includes('-')) {
                let [y, m, d] = fPura.split('-');
                fObj = new Date(y, m-1, d);
            } else if (fPura.includes('/')) {
                let [d, m, y] = fPura.split('/');
                fObj = new Date(y, m-1, d);
            }
            
            if(!isNaN(fObj.getTime())) {
                fFormat1 = fObj.toLocaleDateString('es-CO', {day:'2-digit', month:'short', year:'numeric'});
                fFormat2 = mov.fecha.includes(' ') ? mov.fecha.split(' ')[1] : '';
            }
        } catch(e){}

        // MEJORA 1: SANITIZACIÓN DE SALIDAS (XSS)
        let refSafe = escapeHTML(mov.orderId || '');
        let badgeHTML = '';

        if (refSafe.startsWith('ORD-') || refSafe.startsWith('REN-')) {
            badgeHTML = `<span class="id-badge-premium orden">${refSafe}</span>`;
        } else if (refSafe.startsWith('REC-')) {
            badgeHTML = `<span class="id-badge-premium recarga">${refSafe}</span>`;
        } else if (refSafe.startsWith('DES-')) {
            badgeHTML = `<span class="id-badge-premium descuento">${refSafe}</span>`;
        } else if (refSafe !== '') {
            badgeHTML = `<span class="id-badge-premium nulo">${refSafe}</span>`; 
        } else {
            badgeHTML = `<span class="id-badge-premium nulo">S/N</span>`; 
        }

        const tr = document.createElement('tr');
        tr.className = "mov-row";
        
        const motivoSafeTooltip = escapeHTML(mov.motivo);
        
        tr.innerHTML = `
            <td data-label="Fecha" style="text-align: left;">
                <div class="date-block">
                    <span class="date-primary">${fFormat1}</span>
                    <span class="date-secondary">${escapeHTML(fFormat2)}</span>
                </div>
            </td>
            <td data-label="Referencia" style="text-align: left;">${badgeHTML}</td>
            <td data-label="Detalle" style="font-weight:500; color:var(--text-white); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${motivoSafeTooltip}">${motivoSafeTooltip}</td>
            <td data-label="Monto" style="text-align: right;" class="${colorClass}">${signo}$ ${fmt.format(montoAbs)}</td>
            <td data-label="Saldo Nuevo" style="text-align: right;" class="saldo-text">$ ${fmt.format(mov.saldo_final_pedido)}</td>
            <td data-label="Acciones" style="text-align: center; vertical-align: middle;">
                <div style="display:flex; justify-content:flex-end;">
                    ${generarBotonAccionCliente(mov)}
                </div>
            </td>
        `;
        fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);

    const numTotal = new Intl.NumberFormat('es-CO').format(total);
    document.getElementById('mis-movs-info').innerHTML = `MOSTRANDO PÁGINA <b>${misMovPaginaActual}</b> DE <b>${misMovTotalPaginas}</b> <span style="margin-left:10px; opacity:0.6;">(Total: ${numTotal} registros)</span>`;
    renderizarPaginacionLocal();
}

// ==========================================
// 4. GENERACIÓN DE BOTONES
// ==========================================
function generarBotonAccionCliente(mov) {
    const ref = escapeHTML(mov.orderId || '');
    const mot = encodeURIComponent(mov.motivo || 'Operación manual del Administrador');
    
    if (ref.startsWith('ORD-') || ref.startsWith('REN-')) {
        return `<button class="btn-receipt-glow" onclick="abrirFacturaGlobal('${ref}')"><i class="material-icons-round" style="font-size:1.1rem;">receipt_long</i> FACTURA</button>`;
    } else {
        let displayRef = ref === '' ? 'S/N' : ref;
        return `<button class="btn-info-glow" onclick="verMotivoFinanciero('${displayRef}', decodeURIComponent('${mot}'))"><i class="material-icons-round" style="font-size:1.1rem;">info</i> INFO</button>`;
    }
}

// ==========================================
// 5. PETICIÓN A DB Y EVENTOS
// ==========================================
async function cargarMisMovimientosBase() {
    const tbody = document.getElementById('mis-movs-body');
    if(!tbody) return;

    try {
        const res = await apiCall({ 
            accion: 'getMovimientos', 
            usuario: localStorage.getItem('dw_user'), 
            token: localStorage.getItem('dw_token'),
            _timestamp: new Date().getTime() 
        });
        
        if (res.success) {
            misMovsRaw = res.datos || [];
            const totalesServer = res.totales || { recargas: 0, compras: 0, descuentos: 0 };
            procesarDataHistorica(misMovsRaw, totalesServer, res.msg_alerta);
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 60px; color:var(--danger);">Error al conectar con la base de datos.</td></tr>`;
        }
    } catch (e) { 
        console.error(e); 
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 60px; color:var(--danger);">Fallo de conexión.</td></tr>`;
    }
}

function bindEventosMisMovimientos() {
    document.getElementById('mismovs-buscar')?.addEventListener('input', () => { misMovPaginaActual = 1; renderizarHistoricoPremium(); });
    document.getElementById('mismovs-inicio')?.addEventListener('change', () => { misMovPaginaActual = 1; renderizarHistoricoPremium(); });
    document.getElementById('mismovs-fin')?.addEventListener('change', () => { misMovPaginaActual = 1; renderizarHistoricoPremium(); });
    document.getElementById('mismovs-limite')?.addEventListener('change', (e) => { 
        misMovLimitePagina = parseInt(e.target.value); 
        misMovPaginaActual = 1; 
        renderizarHistoricoPremium(); 
    });
}

// ==========================================
// 6. PAGINADOR MEJORADO
// ==========================================
function renderizarPaginacionLocal() {
    const container = document.getElementById('mis-movs-pagination');
    if (!container) return;
    if (misMovTotalPaginas <= 1) { container.innerHTML = ''; return; }

    let html = '';
    const btn = (p, text, active = false, disabled = false) => 
        `<button onclick="${disabled ? '' : `misMovPaginaActual=${p}; renderizarHistoricoPremium();`}" 
                 class="page-btn ${active ? 'active' : ''}" 
                 ${disabled ? 'disabled' : ''}>${text}</button>`;

    html += btn(1, '<i class="material-icons-round" style="font-size:1.1rem;">first_page</i>', false, misMovPaginaActual === 1);
    html += btn(misMovPaginaActual - 1, '<i class="material-icons-round" style="font-size:1.1rem;">chevron_left</i>', false, misMovPaginaActual === 1);
    
    let start = Math.max(1, misMovPaginaActual - 1);
    let end = Math.min(misMovTotalPaginas, start + 2);
    if (end - start < 2) {
        start = Math.max(1, end - 2);
    }

    for (let i = start; i <= end; i++) {
        html += btn(i, i, i === misMovPaginaActual);
    }

    html += btn(misMovPaginaActual + 1, '<i class="material-icons-round" style="font-size:1.1rem;">chevron_right</i>', false, misMovPaginaActual === misMovTotalPaginas);
    html += btn(misMovTotalPaginas, '<i class="material-icons-round" style="font-size:1.1rem;">last_page</i>', false, misMovPaginaActual === misMovTotalPaginas);

    container.innerHTML = html;
}

window.ordenarMisMovimientos = function(col) {
    if (misMovColumnaOrden === col) misMovDireccionOrden = misMovDireccionOrden === 'asc' ? 'desc' : 'asc';
    else { misMovColumnaOrden = col; misMovDireccionOrden = 'desc'; }
    
    document.querySelectorAll('.sort-icon-mov').forEach(i => { i.innerText = '↕'; i.style.color = 'var(--text-gray)'; });
    const active = document.querySelector(`.sort-icon-mov[data-col="${col}"]`);
    if(active) { active.innerText = misMovDireccionOrden === 'asc' ? '▲' : '▼'; active.style.color = 'var(--accent-text)'; }
    
    renderizarHistoricoPremium();
};

window.exportarMisMovimientosCSV = function() {
    if(misMovsAgrupados.length === 0) return;
    let csv = "\uFEFFFecha,Referencia,Motivo,Monto,Saldo\n";
    misMovsAgrupados.forEach(m => { csv += `"${m.fecha}","${m.orderId || 'S/N'}","${m.motivo.replace(/"/g,'""')}","${m.monto_agrupado}","${m.saldo_final_pedido}"\n`; });
    const b = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `${typeof NOMBRE_NEGOCIO !== 'undefined' ? NOMBRE_NEGOCIO : 'Billetera'}_Historial_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    if(typeof mostrarToast === 'function') mostrarToast("Historial exportado con éxito", "success");
};

window.verMotivoFinanciero = function(orderId, motivo) {
    const isDark = document.body.classList.contains('dark-mode');
    
    let isRecarga = orderId.startsWith('REC-');
    let isDescuento = orderId.startsWith('DES-');

    let themeColor = isRecarga ? 'var(--success)' : (isDescuento ? '#f59e0b' : 'var(--accent-text)');
    let themeBg = isRecarga ? 'rgba(16, 185, 129, 0.1)' : (isDescuento ? 'rgba(245, 158, 11, 0.1)' : 'rgba(56, 189, 248, 0.1)');
    let iconName = isRecarga ? 'account_balance_wallet' : (isDescuento ? 'money_off' : 'info');
    let titleText = isRecarga ? 'RECARGA DE SALDO' : (isDescuento ? 'DESCUENTO APLICADO' : 'DETALLE DE OPERACIÓN');
    
    Swal.fire({
        html: `
            <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 25px; text-align: left;">
                <div style="width: 55px; height: 55px; border-radius: 14px; background: ${themeBg}; display: flex; align-items: center; justify-content: center; border: 1px solid ${themeColor}; flex-shrink: 0; box-shadow: 0 0 15px ${themeBg};">
                    <i class="material-icons-round" style="color:${themeColor}; font-size: 2.2rem;">${iconName}</i>
                </div>
                <div>
                    <h2 style="margin:0; font-size: 1.25rem; font-family: 'Righteous', sans-serif; color: var(--text-white); letter-spacing: 0.5px;">${titleText}</h2>
                    <div style="background: var(--bg-dark); color: var(--text-gray); border: 1px dashed var(--border-color); padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 0.8rem; display: inline-block; margin-top: 6px; font-weight: bold;">
                        REF: <span style="color: ${themeColor};">${escapeHTML(orderId)}</span>
                    </div>
                </div>
            </div>

            <div style="background: var(--bg-dark); border: 1px solid var(--border-color); border-radius: 12px; padding: 25px; text-align: left; position: relative; overflow: hidden; box-shadow: inset 0 2px 10px rgba(0,0,0,0.05);">
                <div style="position: absolute; top: -10px; right: -10px; opacity: 0.03;">
                    <i class="material-icons-round" style="font-size: 7rem;">description</i>
                </div>
                <p style="color: var(--text-muted); font-size: 0.75rem; font-weight: 800; text-transform: uppercase; margin-top: 0; margin-bottom: 12px; letter-spacing: 1px; display: flex; align-items: center; gap: 5px;">
                    <i class="material-icons-round" style="font-size: 1.1rem;">notes</i> Concepto Registrado
                </p>
                <div style="color: var(--text-white); line-height: 1.7; font-weight: 500; font-size: 1rem; position: relative; z-index: 1; word-break: break-word;">
                    ${escapeHTML(motivo)}
                </div>
            </div>
        `,
        showConfirmButton: true,
        confirmButtonText: '<i class="material-icons-round" style="font-size: 1.2rem; vertical-align: middle; margin-right: 5px;">check_circle</i> ENTENDIDO', 
        confirmButtonColor: themeColor, 
        background: isDark ? 'var(--bg-card)' : '#ffffff',
        color: 'var(--text-main)', 
        customClass: { popup: 'premium-modal-radius' }
    });
};

window.invocarModalFacturaExterna = async function(orderId) {
    if (orderId.startsWith('REC-') || orderId.startsWith('DES-')) {
        return Swal.fire({
            icon: 'info',
            title: 'Operación Financiera',
            text: `El ID ${escapeHTML(orderId)} corresponde a un ajuste de saldo, no a una compra de servicios.`,
            background: document.body.classList.contains('dark-mode') ? 'var(--bg-card)' : '#ffffff',
            color: 'var(--text-main)',
            confirmButtonColor: 'var(--accent-text)',
            customClass: { popup: 'premium-modal-radius' }
        });
    }

    Swal.fire({
        title: 'Buscando Factura...',
        html: '<div class="spinner" style="margin: 20px auto; border-top-color: var(--accent-text);"></div>',
        showConfirmButton: false,
        allowOutsideClick: false,
        background: document.body.classList.contains('dark-mode') ? 'var(--bg-card)' : '#ffffff',
        color: 'var(--text-main)',
        customClass: { popup: 'premium-modal-radius' }
    });

    try {
        let filtroPeticion = orderId;
        if (orderId.startsWith('Sin Orden')) {
            filtroPeticion = orderId.replace('Sin Orden - ', '').trim();
        }

        const response = await apiCall({
            accion: 'getPedidos',
            usuario: localStorage.getItem('dw_user'),
            token: localStorage.getItem('dw_token'),
            filtro: filtroPeticion,
            pagina: '1'
        });

        if (response.success && response.datos && response.datos.length > 0) {
            
            let itemsFactura = [];
            if (orderId.startsWith('Sin Orden')) {
                const fechaExtract = orderId.replace('Sin Orden - ', '');
                itemsFactura = response.datos.filter(i => {
                    if (i.orderId && i.orderId.trim() !== '') return false; 
                    
                    let fStr = i.fecha ? i.fecha.split(' ')[0] : '';
                    if (fStr.includes('-')) {
                        let [y, m, d] = fStr.split('-');
                        return `${d}/${m}/${y}` === fechaExtract;
                    } else if (fStr.includes('/')) {
                        let [d, m, y] = fStr.split('/');
                        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}` === fechaExtract;
                    }
                    return false;
                });
            } else {
                itemsFactura = response.datos.filter(i => i.orderId === orderId || i.order_id === orderId);
            }

            if (itemsFactura.length === 0) {
                return Swal.fire({
                    icon: 'error',
                    title: 'No encontrado',
                    text: 'No se encontraron los detalles de este pedido en el historial.',
                    background: document.body.classList.contains('dark-mode') ? 'var(--bg-card)' : '#ffffff',
                    color: 'var(--text-main)',
                    customClass: { popup: 'premium-modal-radius' }
                });
            }

            let agrupacionServicios = {};
            let totalGeneral = 0;

            itemsFactura.forEach(item => {
                if (!agrupacionServicios[item.servicio]) {
                    agrupacionServicios[item.servicio] = { cuentas: [], precioUnitario: parseFloat(item.precio) || 0 };
                }
                agrupacionServicios[item.servicio].cuentas.push(item);
            });

            let htmlServicios = '';
            const fmt = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
            let textoFacturaCompleta = `FACTURA DE COMPRA\nPEDIDO: ${orderId}\n\n`;

            for (const srv in agrupacionServicios) {
                const dataSrv = agrupacionServicios[srv];
                const cantidad = dataSrv.cuentas.length;
                const subtotal = cantidad * dataSrv.precioUnitario;
                totalGeneral += subtotal;

                let cuentasListaHtml = '';
                let textoGrupo = `========================\n📌 SERVICIO: ${srv}\n`;

                dataSrv.cuentas.forEach((cData, indexObj) => {
                    const c = cData.cuenta;
                    textoGrupo += `Cuenta ${indexObj + 1}: ${c}\n`;
                    
                    const cuentaSafe = escapeHTML(c);
                    const btnCopySafe = cuentaSafe.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    
                    let estado = cData.estado ? cData.estado.toLowerCase() : '';
                    let notaReal = cData.notas || '';

                    const notasOcultasCliente = ['reciclada', 'archivada', 'stock'];
                    const notaMInusculas = notaReal.toLowerCase();
                    const esNotaInternaAdmin = notasOcultasCliente.some(palabra => notaMInusculas.includes(palabra));

                    if (esNotaInternaAdmin) {
                        estado = 'vencida';
                        notaReal = ''; 
                    }

                    // MEJORA 1: SANITIZACIÓN DE NOTAS EN LA FACTURA
                    let notasHTML = notaReal 
                        ? `<div style="margin-top: 4px; font-size: 0.75rem; color: #f59e0b; background: rgba(245, 158, 11, 0.1); padding: 4px 8px; border-radius: 6px; border: 1px dashed rgba(245, 158, 11, 0.3); line-height: 1.3;"><i class="material-icons-round" style="font-size:0.9rem; vertical-align:middle; margin-right:3px;">history_edu</i> ${escapeHTML(notaReal)}</div>` 
                        : '';
                    
                    let opacityAccount = '';
                    let badgeVencida = '';

                    if (estado === 'reemplazada' || estado === 'vencida') {
                        opacityAccount = 'opacity: 0.4; filter: grayscale(100%);';
                        if (!notaReal) {
                            badgeVencida = `<div style="margin-top: 4px; font-size: 0.7rem; color: var(--danger); background: rgba(239, 68, 68, 0.1); padding: 4px 8px; border-radius: 6px; border: 1px dashed rgba(239, 68, 68, 0.3); font-weight: bold;"><i class="material-icons-round" style="font-size:0.8rem; vertical-align:middle; margin-right:3px;">history</i> Cuenta Expirada/Reemplazada</div>`;
                        }
                    }

                    cuentasListaHtml += `
                        <div style="margin-bottom: 10px;">
                            <div class="copy-cuenta-btn" data-copy="${btnCopySafe}" style="background: var(--bg-dark); border: 1px solid var(--border-color); padding: 10px 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s; ${opacityAccount}">
                                <span style="word-break: break-all; color: var(--text-main); font-family: monospace; font-size: 0.9rem;">${cuentaSafe}</span>
                                <i class="material-icons-round icon-copy-feedback" style="font-size: 1.1rem; color: var(--accent-text);" title="Copiar Cuenta">content_copy</i>
                            </div>
                            ${notasHTML}
                            ${badgeVencida}
                        </div>
                    `;
                });

                textoGrupo += `------------------------\nValor individual: $ ${fmt.format(dataSrv.precioUnitario)}\nSubtotal del bloque: $ ${fmt.format(subtotal)}\n========================\n`;
                textoFacturaCompleta += textoGrupo;
                const txtGrupoSafe = encodeURIComponent(textoGrupo);

                htmlServicios += `
                    <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; margin-bottom: 15px; overflow: hidden; text-align:left;">
                        <div style="padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); background: rgba(56, 189, 248, 0.05);">
                            <h4 style="color: var(--accent-text); font-weight: 800; font-size: 0.95rem; text-transform: uppercase; margin: 0; display: flex; align-items: center; gap: 8px;">
                                ${escapeHTML(srv)}
                                <i class="material-icons-round copy-grupo-btn" data-copy="${txtGrupoSafe}" style="font-size:1.1rem; cursor:pointer; color:var(--text-gray); transition:0.2s;" title="Copiar bloque de servicio">content_copy</i>
                            </h4>
                            <span style="background: rgba(56, 189, 248, 0.2); color: var(--accent-text); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">x${cantidad}</span>
                        </div>
                        <div style="padding: 15px;">${cuentasListaHtml}</div>
                        <div style="padding: 10px 15px; border-top: 1px dashed var(--border-color); display: flex; justify-content: space-between; color: var(--text-gray); font-size: 0.8rem;">
                            <span>Unit: <strong style="color: var(--text-main);">$ ${fmt.format(dataSrv.precioUnitario)}</strong></span>
                            <span>Subtotal: <strong style="color: var(--text-main);">$ ${fmt.format(subtotal)}</strong></span>
                        </div>
                    </div>
                `;
            }

            textoFacturaCompleta += `\n💰 TOTAL GENERAL: $ ${fmt.format(totalGeneral)}\n¡Gracias por tu preferencia!`;
            const encodedTextoTodo = encodeURIComponent(textoFacturaCompleta);

            let tituloFactura = "FACTURA DE COMPRA";
            let colorFactura = "var(--accent-text)";
            let iconFactura = "local_mall";
            let bgBadge = "rgba(56, 189, 248, 0.1)";

            if (orderId.startsWith('REN-')) {
                tituloFactura = "RENOVACIÓN";
                colorFactura = "var(--success)";
                iconFactura = "autorenew";
                bgBadge = "rgba(16, 185, 129, 0.1)";
            } else if (orderId.startsWith('Sin Orden')) {
                tituloFactura = "HISTORIAL ANTIGUO";
                colorFactura = "#f59e0b";
                iconFactura = "history";
                bgBadge = "rgba(245, 158, 11, 0.1)";
            }

            const isDark = document.body.classList.contains('dark-mode');

            const modalHtml = `
                <style>
                    .premium-swal-fac .swal2-html-container { padding: 0 !important; margin: 0 !important; }
                    .copy-success-anim { color: var(--success) !important; transform: scale(1.2); transition: 0.2s ease; }
                    .copy-grupo-btn:hover { color: var(--accent-text) !important; }
                    .copy-cuenta-btn:hover { border-color: var(--accent-text) !important; }
                    
                    /* Custom Scrollbar for Modal */
                    .fac-scroll::-webkit-scrollbar { width: 6px; }
                    .fac-scroll::-webkit-scrollbar-track { background: transparent; }
                    .fac-scroll::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
                    .fac-scroll::-webkit-scrollbar-thumb:hover { background: var(--text-gray); }
                </style>
                <div style="text-align: left; padding: 25px;" id="modal-factura-container-event">
                    
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px;">
                        <div>
                            <h2 style="margin:0; font-size: 1.3rem; font-family: 'Righteous', sans-serif; color: var(--text-main); display:flex; align-items:center; gap:8px;">
                                <i class="material-icons-round" style="color: ${colorFactura};">${iconFactura}</i> ${tituloFactura}
                            </h2>
                            <div style="background: ${bgBadge}; color: ${colorFactura}; border: 1px solid ${colorFactura}; opacity: 0.8; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 0.75rem; display: inline-block; margin-top: 6px; font-weight: bold;">${escapeHTML(orderId)}</div>
                        </div>
                        <button id="btn-copiar-todo-modal" data-texto-full="${encodedTextoTodo}" style="background: rgba(56, 189, 248, 0.15); color: var(--accent-text); border: 1px solid rgba(56, 189, 248, 0.3); padding: 8px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: 0.2s;">
                            <i class="material-icons-round" style="font-size: 1.1rem;">receipt</i> COPIAR
                        </button>
                    </div>
                    
                    <div class="fac-scroll" style="max-height: 55vh; overflow-y: auto; padding-right: 5px;">
                        ${htmlServicios}
                    </div>

                    <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid var(--success); border-radius: 12px; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                        <span style="color: var(--text-gray); font-weight: 800; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">Total Pagado</span>
                        <span style="color: var(--success); font-size: 1.6rem; font-weight: 900; font-family: monospace;">$ ${fmt.format(totalGeneral)}</span>
                    </div>
                </div>
            `;

            Swal.fire({
                html: modalHtml,
                background: isDark ? 'var(--bg-card)' : '#ffffff',
                color: isDark ? 'var(--text-main)' : '#0f172a',
                showConfirmButton: false,
                showCloseButton: false, 
                width: '500px',
                allowOutsideClick: true, 
                customClass: { popup: 'premium-modal-radius premium-swal-fac' }
            });

        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un error cargando los datos de la factura.',
                background: document.body.classList.contains('dark-mode') ? 'var(--bg-card)' : '#ffffff',
                color: 'var(--text-main)',
                customClass: { popup: 'premium-modal-radius' }
            });
        }
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Fallo de Red',
            text: 'No se pudo conectar con el servidor.',
            background: document.body.classList.contains('dark-mode') ? 'var(--bg-card)' : '#ffffff',
            color: 'var(--text-main)',
            customClass: { popup: 'premium-modal-radius' }
        });
    }
};

// =========================================================================
// SISTEMA DE COPIADO UNIVERSAL (ANTI-BLOQUEOS MÓVILES) Y RADAR GLOBAL
// =========================================================================

window.copiarTextoSeguro = function(texto, elementoIcono) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(texto)
            .then(() => animarCopia(elementoIcono))
            .catch(err => ejecutarPlanB(texto, elementoIcono));
    } else {
        ejecutarPlanB(texto, elementoIcono);
    }
};

function ejecutarPlanB(texto, elementoIcono) {
    try {
        let textArea = document.createElement("textarea");
        textArea.value = texto;
        textArea.readOnly = true;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        textArea.setSelectionRange(0, 99999);
        
        document.execCommand('copy');
        textArea.remove();
        
        animarCopia(elementoIcono);
    } catch (err) {
        console.error("Error crítico al copiar: ", err);
        if(typeof mostrarToast === 'function') mostrarToast("Tu navegador bloqueó el portapapeles", "error");
    }
}

function animarCopia(icono) {
    if (!icono) return;
    const originalClass = icono.className;
    const originalText = icono.innerText;
    
    icono.innerText = 'check';
    icono.classList.add('copy-success-anim');
    
    const btnTodo = icono.closest('#btn-copiar-todo-modal');
    if (btnTodo) {
        let oldBg = btnTodo.style.background;
        let oldColor = btnTodo.style.color;
        let oldBorder = btnTodo.style.borderColor;
        
        btnTodo.style.background = 'var(--success)';
        btnTodo.style.color = '#fff';
        btnTodo.style.borderColor = 'var(--success)';
        icono.innerText = 'check COPIADO';
        
        setTimeout(() => {
            icono.innerText = 'receipt COPIAR';
            btnTodo.style.background = oldBg;
            btnTodo.style.color = oldColor;
            btnTodo.style.borderColor = oldBorder;
            icono.classList.remove('copy-success-anim');
        }, 2000);
        return;
    }

    setTimeout(() => {
        icono.innerText = originalText;
        icono.className = originalClass;
        icono.classList.remove('copy-success-anim');
    }, 1500);
}

if (!window.radarCopiaIniciado) {
    window.radarCopiaIniciado = true;
    
    document.addEventListener('click', function(e) {
        const btnTodo = e.target.closest('#btn-copiar-todo-modal');
        if (btnTodo) {
            const txt = decodeURIComponent(btnTodo.getAttribute('data-texto-full'));
            window.copiarTextoSeguro(txt, btnTodo);
            return;
        }

        const btnGrupo = e.target.closest('.copy-grupo-btn');
        if (btnGrupo) {
            const txt = decodeURIComponent(btnGrupo.getAttribute('data-copy'));
            window.copiarTextoSeguro(txt, btnGrupo);
            return;
        }

        const btnCuenta = e.target.closest('.copy-cuenta-btn');
        if (btnCuenta) {
            const txt = btnCuenta.getAttribute('data-copy');
            const icon = btnCuenta.querySelector('.icon-copy-feedback');
            window.copiarTextoSeguro(txt, icon);
            return;
        }
    });
}
