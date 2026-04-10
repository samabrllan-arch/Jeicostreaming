/* =================================================================================
   ARCHIVO: billetera_cel.js (LADO CLIENTE)
   Lógica: Renderizado adaptativo exclusivo para dispositivos móviles.
================================================================================= */

function renderizarBilleteraMovil(pagina, total, pagActual, totalPags) {
    const container = document.querySelector('.premium-table-container');
    if (!container) return;

    // 1. Activar el estado móvil en el Body para que el CSS externo actúe
    document.body.classList.add('mobile-wallet-layout-active');

    // 2. Ocultar los textos de paginación de PC
    const infoDesk = document.getElementById('mis-movs-info');
    const pagDesk = document.getElementById('mis-movs-pagination');
    if (infoDesk) infoDesk.style.display = 'none';
    if (pagDesk) pagDesk.style.display = 'none';

    // 3. Estado Vacío (Si no hay resultados)
    if (pagina.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: 16px; border: 1px dashed var(--border-color);">
                <span class="material-icons-round" style="font-size:4rem; color:var(--border-color); margin-bottom:15px;">account_balance_wallet</span>
                <h3 style="color:var(--text-white); margin:0; font-family:'Righteous', sans-serif;">SIN MOVIMIENTOS</h3>
                <p style="color: var(--text-gray); font-size: 0.9rem; margin-top: 10px;">No hay registros que coincidan con la búsqueda.</p>
            </div>
        `;
        container.style.background = 'transparent';
        container.style.border = 'none';
        container.style.boxShadow = 'none';
        return;
    }

    // 4. Dibujar las tarjetas usando DocumentFragment (Mejora de Rendimiento)
    const fmt = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    
    const fragment = document.createDocumentFragment();
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'mob-billetera-cards-wrapper';

    pagina.forEach(mov => {
        const monto = mov.monto_agrupado;
        const isIngreso = monto > 0;
        const colorColor = isIngreso ? 'var(--success)' : 'var(--danger)';
        const signo = isIngreso ? '+' : '-';
        const montoAbs = Math.abs(monto);
        
        // Asume que escapeHTML está disponible globalmente por billetera.js
        let fFormat1 = escapeHTML(mov.fecha);
        let fFormat2 = '';
        try {
            const fObj = new Date(mov.fecha);
            if(!isNaN(fObj)) {
                fFormat1 = fObj.toLocaleDateString('es-CO', {day:'2-digit', month:'short', year:'numeric'});
                fFormat2 = fObj.toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'});
            }
        } catch(e){}

        // 🔥 MEJORA 1: Sanitización estricta de variables (XSS)
        let refSafe = escapeHTML(mov.orderId || '');
        let motivoSafe = escapeHTML(mov.motivo);
        
        let badgeHTML = '';
        let borderLeft = '';
        
        if (refSafe.startsWith('ORD-') || refSafe.startsWith('REN-')) {
            badgeHTML = `<span class="id-badge-premium orden">${refSafe}</span>`;
            borderLeft = '4px solid var(--accent-text)';
        } else if (refSafe.startsWith('REC-')) {
            badgeHTML = `<span class="id-badge-premium recarga">${refSafe}</span>`;
            borderLeft = '4px solid var(--success)';
        } else if (refSafe.startsWith('DES-')) {
            badgeHTML = `<span class="id-badge-premium descuento">${refSafe}</span>`;
            borderLeft = '4px solid #f59e0b';
        } else if (refSafe !== '') {
            badgeHTML = `<span class="id-badge-premium nulo">${refSafe}</span>`; 
            borderLeft = '4px solid var(--border-color)';
        } else {
            badgeHTML = `<span class="id-badge-premium nulo">S/N</span>`; 
            borderLeft = '4px solid var(--border-color)';
        }

        // El botón de acción adaptado a móvil
        let btnAccion = '';
        const motEncoded = encodeURIComponent(mov.motivo || 'Operación manual');
        
        if (refSafe.startsWith('ORD-') || refSafe.startsWith('REN-')) {
            btnAccion = `
                <button class="btn-mob-action" style="background: var(--accent-text); color: #fff; box-shadow: 0 4px 12px var(--accent-glow);" onclick="abrirFacturaGlobal('${refSafe}')">
                    <i class="material-icons-round">receipt_long</i> VER FACTURA
                </button>
            `;
        } else {
            let displayRef = refSafe === '' ? 'S/N' : refSafe;
            btnAccion = `
                <button class="btn-mob-action" style="background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3);" onclick="verMotivoFinanciero('${displayRef}', decodeURIComponent('${motEncoded}'))">
                    <i class="material-icons-round">info</i> INFO DE TRANSACCIÓN
                </button>
            `;
        }

        const card = document.createElement('div');
        card.className = 'mob-billetera-card';
        card.style.borderLeft = borderLeft;
        card.innerHTML = `
            <div class="mob-bill-header">
                <div class="mob-bill-date">
                    <span class="mob-bill-date-main">${fFormat1}</span>
                    <span class="mob-bill-date-sub">${escapeHTML(fFormat2)}</span>
                </div>
                <div class="mob-bill-ref">
                    ${badgeHTML}
                </div>
            </div>
            
            <div class="mob-bill-body">
                <div class="mob-bill-detail">
                    ${motivoSafe}
                </div>
                <div class="mob-bill-amounts">
                    <div>
                        <span style="color: var(--text-gray); font-size: 0.7rem; font-weight: 800; text-transform: uppercase; display: block;">Monto</span>
                        <span class="mob-bill-monto" style="color: ${colorColor};">${signo}$ ${fmt.format(montoAbs)}</span>
                    </div>
                    <div>
                        <span style="color: var(--text-gray); font-size: 0.7rem; font-weight: 800; text-transform: uppercase; display: block; text-align: right;">Saldo Restante</span>
                        <span class="mob-bill-saldo">$ ${fmt.format(mov.saldo_final_pedido)}</span>
                    </div>
                </div>
            </div>
            
            <div class="mob-bill-footer">
                ${btnAccion}
            </div>
        `;
        cardsContainer.appendChild(card);
    });

    fragment.appendChild(cardsContainer);

    // 5. Limpiar el contenedor y agregar las tarjetas
    container.innerHTML = '';
    container.style.background = 'transparent';
    container.style.border = 'none';
    container.style.boxShadow = 'none';
    container.style.padding = '0';
    container.appendChild(fragment);

    // 6. Añadir Paginador Móvil
    if (totalPags > 1) {
        const paginacionDiv = document.createElement('div');
        paginacionDiv.className = 'mob-pagination';
        
        paginacionDiv.innerHTML = `
            <button class="btn-mob-page" onclick="misMovPaginaActual=${pagActual - 1}; renderizarHistoricoPremium(); window.scrollTo({top:0, behavior:'smooth'});" ${pagActual <= 1 ? 'disabled' : ''}>
                <i class="material-icons-round">chevron_left</i>
            </button>
            
            <div style="font-weight: 800; color: var(--text-white); font-size: 0.9rem;">
                Página <span style="color: var(--accent-text);">${pagActual}</span> de ${totalPags}
            </div>
            
            <button class="btn-mob-page" onclick="misMovPaginaActual=${pagActual + 1}; renderizarHistoricoPremium(); window.scrollTo({top:0, behavior:'smooth'});" ${pagActual >= totalPags ? 'disabled' : ''}>
                <i class="material-icons-round">chevron_right</i>
            </button>
        `;
        container.appendChild(paginacionDiv);
    }
}

// =========================================================================
// INYECCIÓN FORZADA: APLASTAR TARJETA DE SALDO GIGANTE Y CARRUSEL EN MÓVILES
// =========================================================================
function forzarEstiloTarjetaSaldo() {
    const esMovil = window.matchMedia("(max-width: 768px)").matches || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // 🔥 MEJORA 3 Y 4: En lugar de inyectar estilos rotos, activamos una bandera CSS en el body.
    if (esMovil) {
        document.body.classList.add('mobile-wallet-layout-active');
    } else {
        document.body.classList.remove('mobile-wallet-layout-active');
    }
}

// Escuchadores para la actualización de CSS responsiva
document.addEventListener('DOMContentLoaded', forzarEstiloTarjetaSaldo);
window.addEventListener('resize', forzarEstiloTarjetaSaldo);

// En caso de que se navegue por la app (SPA) sin recargar:
document.addEventListener('moduloCargado', (e) => {
    if (e.detail.modulo === 'billetera') {
        forzarEstiloTarjetaSaldo();
    }
});
