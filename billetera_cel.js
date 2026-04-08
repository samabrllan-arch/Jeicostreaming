function renderizarBilleteraMovil(pagina, total, pagActual, totalPags) {
    const container = document.querySelector('.premium-table-container');
    if (!container) return;

    // 1. Inyectar CSS exclusivo para las tarjetas de la billetera móvil
    if (!document.getElementById('css-billetera-movil')) {
        const style = document.createElement('style');
        style.id = 'css-billetera-movil';
        style.innerHTML = `
            .mob-billetera-card {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 16px;
                padding: 18px;
                margin-bottom: 15px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .mob-bill-header {
                display: flex; justify-content: space-between; align-items: flex-start;
                border-bottom: 1px solid var(--border-color); padding-bottom: 12px;
            }
            .mob-bill-date {
                display: flex; flex-direction: column;
            }
            .mob-bill-date-main { font-weight: 800; font-size: 0.85rem; color: var(--text-white); }
            .mob-bill-date-sub { font-size: 0.75rem; color: var(--text-gray); }
            
            .mob-bill-ref { text-align: right; }
            
            .mob-bill-body {
                display: flex; flex-direction: column; gap: 10px;
            }
            .mob-bill-detail {
                color: var(--text-white); font-size: 0.9rem; font-weight: 500;
                background: var(--bg-dark); padding: 10px; border-radius: 8px; border: 1px dashed var(--border-color);
            }
            .mob-bill-amounts {
                display: flex; justify-content: space-between; align-items: center;
            }
            .mob-bill-monto { font-size: 1.25rem; font-weight: 900; font-family: monospace; }
            .mob-bill-saldo { font-size: 0.95rem; font-weight: 800; color: var(--text-gray); font-family: monospace; text-align: right;}
            
            .mob-bill-footer { margin-top: 5px; }
            .btn-mob-action {
                width: 100%; border: none; padding: 12px; border-radius: 10px; font-weight: 800; font-size: 0.9rem;
                display: flex; justify-content: center; align-items: center; gap: 8px; cursor: pointer; transition: 0.2s;
            }
            .btn-mob-action:active { transform: scale(0.98); }
            
            .mob-pagination { display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); padding: 15px; border-radius: 12px; border: 1px solid var(--border-color); margin-top: 15px;}
            .btn-mob-page { background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); width: 40px; height: 40px; border-radius: 10px; display: flex; justify-content: center; align-items: center; cursor: pointer; }
            .btn-mob-page:disabled { opacity: 0.3; }
        `;
        document.head.appendChild(style);
    }

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

    // 4. Dibujar las tarjetas
    const fmt = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    let cardsContainer = document.createElement('div');

    pagina.forEach(mov => {
        const monto = mov.monto_agrupado;
        const isIngreso = monto > 0;
        const colorColor = isIngreso ? 'var(--success)' : 'var(--danger)';
        const signo = isIngreso ? '+' : '-';
        const montoAbs = Math.abs(monto);
        
        let fFormat1 = mov.fecha;
        let fFormat2 = '';
        try {
            const fObj = new Date(mov.fecha);
            if(!isNaN(fObj)) {
                fFormat1 = fObj.toLocaleDateString('es-CO', {day:'2-digit', month:'short', year:'numeric'});
                fFormat2 = fObj.toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'});
            }
        } catch(e){}

        // Generar Badge Móvil según Referencia
        let ref = mov.orderId || '';
        let badgeHTML = '';
        let borderLeft = '';
        
        if (ref.startsWith('ORD-') || ref.startsWith('REN-')) {
            badgeHTML = `<span class="id-badge-premium orden">${ref}</span>`;
            borderLeft = '4px solid var(--accent-text)';
        } else if (ref.startsWith('REC-')) {
            badgeHTML = `<span class="id-badge-premium recarga">${ref}</span>`;
            borderLeft = '4px solid var(--success)';
        } else if (ref.startsWith('DES-')) {
            badgeHTML = `<span class="id-badge-premium descuento">${ref}</span>`;
            borderLeft = '4px solid #f59e0b';
        } else if (ref !== '') {
            badgeHTML = `<span class="id-badge-premium nulo">${ref}</span>`; 
            borderLeft = '4px solid var(--border-color)';
        } else {
            badgeHTML = `<span class="id-badge-premium nulo">S/N</span>`; 
            borderLeft = '4px solid var(--border-color)';
        }

        // El botón de acción adaptado a móvil
        let btnAccion = '';
        const mot = encodeURIComponent(mov.motivo || 'Operación manual');
        
        if (ref.startsWith('ORD-') || ref.startsWith('REN-')) {
            btnAccion = `
                <button class="btn-mob-action" style="background: var(--accent-text); color: #fff; box-shadow: 0 4px 12px var(--accent-glow);" onclick="abrirFacturaGlobal('${ref}')">
                    <i class="material-icons-round">receipt_long</i> VER FACTURA
                </button>
            `;
        } else {
            let displayRef = ref === '' ? 'S/N' : ref;
            btnAccion = `
                <button class="btn-mob-action" style="background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3);" onclick="verMotivoFinanciero('${displayRef}', decodeURIComponent('${mot}'))">
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
                    <span class="mob-bill-date-sub">${fFormat2}</span>
                </div>
                <div class="mob-bill-ref">
                    ${badgeHTML}
                </div>
            </div>
            
            <div class="mob-bill-body">
                <div class="mob-bill-detail">
                    ${mov.motivo}
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

    // 5. Limpiar el contenedor y agregar las tarjetas
    container.innerHTML = '';
    container.style.background = 'transparent';
    container.style.border = 'none';
    container.style.boxShadow = 'none';
    container.style.padding = '0';
    container.appendChild(cardsContainer);

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
    
    if (esMovil) {
        if (document.getElementById('css-force-wallet')) return; // Evitar duplicados

        const style = document.createElement('style');
        style.id = 'css-force-wallet';
        style.innerHTML = `
            /* 1. CAMISA DE FUERZA: PROHIBIR ZOOM OUT Y DESBORDAMIENTO HORIZONTAL */
            /* 1. CAMISA DE FUERZA: PROHIBIR DESBORDAMIENTO HORIZONTAL */
            html, body {
                max-width: 100vw !important;
                overflow-x: hidden !important;
            }
            .main-content {
                max-width: 100vw !important;
                overflow-x: hidden !important;
                box-sizing: border-box !important;
                padding: 15px 10px !important;
            }

            /* 2. TU IDEA: APILAR CABECERA Y BOTÓN DE DESCARGA HACIA ABAJO */
            .mis-movs-header-actions {
                display: flex !important;
                flex-direction: column !important; /* <-- Hacia abajo */
                align-items: stretch !important;
                gap: 15px !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
            .header-title-premium {
                justify-content: center !important;
                font-size: 1.2rem !important;
            }
            .btn-export-csv {
                width: 100% !important;
                justify-content: center !important;
                padding: 12px !important;
            }

            /* 3. TU IDEA: APILAR LOS FILTROS HACIA ABAJO (UNO POR LÍNEA) */
            .mis-movs-filters-box {
                display: flex !important;
                flex-direction: column !important; /* <-- Hacia abajo */
                gap: 12px !important;
                padding: 15px !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
            .filter-input-group {
                width: 100% !important;
                min-width: 100% !important; /* Ocupa todo el ancho disponible */
            }

            /* 4. APLASTAR TARJETA DE SALDO */
            div.wallet-card {
                padding: 15px !important;
                min-height: auto !important;
                margin-bottom: 15px !important;
                border-radius: 12px !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
            div.wallet-label {
                font-size: 0.75rem !important;
                margin-bottom: 5px !important;
            }
            div.wallet-amount#wallet-balance-big {
                font-size: 2.2rem !important; 
                margin: 0 !important;
                line-height: 1.2 !important;
            }
            div.wallet-actions { margin-top: 10px !important; }
            button.btn-wallet-action {
                padding: 10px !important;
                font-size: 0.85rem !important;
                height: auto !important;
                width: 100% !important;
                justify-content: center !important;
            }

            /* 5. CARRUSEL DE ESTADÍSTICAS */
            .stats-dashboard {
                display: flex !important;
                flex-direction: column !important; /* <-- Magia aquí: Apilar hacia abajo */
                gap: 12px !important;
                margin-bottom: 15px !important;
                width: 100% !important;
                box-sizing: border-box !important;
                /* Eliminamos el overflow-x y el nowrap para que no intente irse de lado */
            }
            .stat-card-glass {
                width: 100% !important; /* Cada tarjeta ocupa el 100% del ancho */
                flex: 1 1 auto !important;
                padding: 15px !important;
                gap: 15px !important;
                box-sizing: border-box !important;
            }
            .stat-icon-circle { width: 45px !important; height: 45px !important; font-size: 1.3rem !important; }
            .stat-value { font-size: 1.25rem !important; }
            .stat-label { font-size: 0.75rem !important; }
                min-width: 220px !important;
                flex: 0 0 auto !important;
                scroll-snap-align: start !important;
                padding: 12px 15px !important;
                gap: 10px !important;
            }
            .stat-icon-circle { width: 40px !important; height: 40px !important; font-size: 1.2rem !important; }
            .stat-value { font-size: 1.15rem !important; }
            .stat-label { font-size: 0.65rem !important; }

            /* 6. ESTRUCTURA PRINCIPAL EN COLUMNA */
            .wallet-layout {
                display: flex !important;
                flex-direction: column !important;
                gap: 15px !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
        `;
        document.head.appendChild(style);
    } else {
        // Restaurar a PC
        const forceStyle = document.getElementById('css-force-wallet');
        if (forceStyle) forceStyle.remove();
    }
}

// Escuchadores para la inyección forzada de CSS
document.addEventListener('DOMContentLoaded', forzarEstiloTarjetaSaldo);
window.addEventListener('resize', forzarEstiloTarjetaSaldo);

// En caso de que se navegue por la app (SPA) sin recargar:
document.addEventListener('moduloCargado', (e) => {
    if (e.detail.modulo === 'billetera') {
        forzarEstiloTarjetaSaldo();
    }
});
