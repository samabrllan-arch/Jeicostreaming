function renderizarPedidosMovil(respuestaServidor) {
    const container = document.getElementById('orders-container');
    container.innerHTML = "";

    datosPedidosGlobal = respuestaServidor.datos || [];
    
    const pagActual = parseInt(respuestaServidor.paginaActual) || 1;
    const totalPags = parseInt(respuestaServidor.totalPaginas) || 1;
    const filtroUsado = respuestaServidor.filtroUsado || "";

    // Inyectar CSS exclusivo para las tarjetas móviles (solo se inyecta una vez)
    if (!document.getElementById('css-pedidos-movil')) {
        const style = document.createElement('style');
        style.id = 'css-pedidos-movil';
        style.innerHTML = `
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

            /* 2. CABECERA: TÍTULO Y BUSCADOR APILADOS */
            .page-header-premium {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                text-align: center !important;
                margin-bottom: 15px !important;
            }
            .search-premium-container {
                display: flex !important;
                flex-direction: column !important; /* Apilamos el buscador y el botón */
                gap: 10px !important;
                padding: 15px !important;
                width: 100% !important;
                box-sizing: border-box !important;
                border-radius: 12px !important;
            }
            .search-premium-container input {
                width: 100% !important;
                text-align: center !important;
            }
            .btn-search-action {
                width: 100% !important;
                padding: 12px !important;
                margin: 0 !important;
            }

            /* 3. BARRA SUPERIOR DE LOS PEDIDOS (BOTONES DE DESCARGA) */
            .mobile-orders-header {
                display: flex !important; 
                flex-direction: column !important; /* Hacia abajo */
                gap: 15px !important; 
                margin-bottom: 20px !important;
                background: var(--bg-card) !important; 
                padding: 15px !important; 
                border-radius: 12px !important; 
                border: 1px solid var(--border-color) !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
            .mobile-orders-header > div:last-child {
                flex-direction: column !important; /* Apilamos los botones TXT y CSV */
                gap: 10px !important;
            }

            /* 4. TARJETAS DE PEDIDOS */
            .mobile-order-card {
                background: var(--bg-card) !important;
                border: 1px solid var(--border-color) !important;
                border-radius: 16px !important;
                padding: 15px !important; /* Un poco menos de relleno */
                margin-bottom: 15px !important;
                box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important;
                position: relative !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 12px !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
            
            .mobile-order-header {
                display: flex !important; justify-content: space-between !important; align-items: flex-start !important;
                border-bottom: 1px solid var(--border-color) !important; padding-bottom: 12px !important;
            }
            .mobile-order-id {
                font-family: 'Righteous', sans-serif !important; font-size: 1.05rem !important; color: var(--text-main) !important;
                display: flex !important; align-items: center !important; gap: 6px !important;
            }
            .mobile-order-date {
                display: flex !important; flex-direction: column !important; text-align: right !important;
            }
            .mobile-date-main { font-weight: 800 !important; font-size: 0.85rem !important; color: var(--text-main) !important; }
            .mobile-date-sub { font-size: 0.75rem !important; color: var(--text-gray) !important; }
            
            .mobile-order-body {
                display: flex !important; justify-content: space-between !important; align-items: center !important;
            }
            .mobile-order-detail { display: flex !important; flex-direction: column !important; gap: 5px !important; }
            
            .mobile-qty-badge {
                background: rgba(37, 99, 235, 0.1) !important; color: var(--accent-text) !important;
                padding: 4px 10px !important; border-radius: 8px !important; font-size: 0.8rem !important; font-weight: 800 !important; display: inline-block !important;
            }
            .mobile-price-total {
                font-size: 1.25rem !important; font-weight: 900 !important; color: var(--accent-text) !important; font-family: monospace !important;
            }
            
            .mobile-order-footer { margin-top: 5px !important; }
            .btn-mobile-factura {
                width: 100% !important; background: var(--accent-text) !important; color: #fff !important; border: none !important;
                padding: 12px !important; border-radius: 10px !important; font-weight: 800 !important; font-size: 0.9rem !important;
                display: flex !important; justify-content: center !important; align-items: center !important; gap: 8px !important;
                box-shadow: 0 4px 12px var(--accent-glow) !important; cursor: pointer !important; transition: 0.2s !important;
            }
            .btn-mobile-factura:active { transform: scale(0.98) !important; }
            
            /* Badges de estado */
            .mob-badge-garantia { background: rgba(139, 92, 246, 0.1) !important; color: #8b5cf6 !important; padding: 4px 8px !important; border-radius: 6px !important; font-size: 0.7rem !important; font-weight: bold !important; border: 1px solid rgba(139, 92, 246, 0.3) !important; display: inline-flex !important; align-items: center !important; gap: 4px !important; }
            .mob-badge-vencida { background: rgba(255, 255, 255, 0.05) !important; color: var(--text-gray) !important; padding: 4px 8px !important; border-radius: 6px !important; font-size: 0.7rem !important; font-weight: bold !important; border: 1px dashed var(--border-color) !important; display: inline-flex !important; align-items: center !important; gap: 4px !important; }
            
            /* Paginador Móvil */
            .mob-pagination { display: flex !important; justify-content: space-between !important; align-items: center !important; background: var(--bg-card) !important; padding: 15px !important; border-radius: 12px !important; border: 1px solid var(--border-color) !important; margin-top: 10px !important; width: 100% !important; box-sizing: border-box !important;}
            .btn-mob-page { background: var(--bg-dark) !important; border: 1px solid var(--border-color) !important; color: var(--text-main) !important; width: 40px !important; height: 40px !important; border-radius: 10px !important; display: flex !important; justify-content: center !important; align-items: center !important; cursor: pointer !important; }
            .btn-mob-page:disabled { opacity: 0.3 !important; }
        `;
        document.head.appendChild(style);
    }

    // --- CONTENEDOR SI ESTÁ VACÍO ---
    if (!datosPedidosGlobal || datosPedidosGlobal.length === 0) {
        const msgVacio = filtroUsado !== "" 
            ? `No encontramos "${filtroUsado}" en tu bóveda.` 
            : `Aún no tienes compras registradas.`;

        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: 16px; border: 1px dashed var(--border-color);">
                <span class="material-icons-round" style="font-size:4rem; color:var(--border-color); margin-bottom:15px;">search_off</span>
                <h3 style="color:var(--text-main); margin:0; font-family:'Righteous', sans-serif;">SIN RESULTADOS</h3>
                <p style="color: var(--text-gray); font-size: 0.9rem; margin-top: 10px;">${msgVacio}</p>
            </div>`;
        return;
    }

    // --- BARRA SUPERIOR MÓVIL ---
    const headerHtml = `
        <div class="mobile-orders-header">
            <div style="color: var(--text-gray); font-size: 0.85rem; font-weight: 700; text-transform: uppercase; text-align: center;">
                Página ${pagActual} de ${totalPags}
            </div>
            <div style="display: flex; gap: 10px;">
                <button onclick="descargarHistorialCompleto('txt')" style="flex:1; background: rgba(37, 99, 235, 0.1); color: var(--accent-text); border: 1px solid rgba(37, 99, 235, 0.3); padding: 10px; border-radius: 8px; font-weight: bold; font-size: 0.75rem; display: flex; justify-content: center; align-items: center; gap: 5px;">
                    <i class="material-icons-round" style="font-size:1.1rem;">description</i> TXT
                </button>
                <button onclick="descargarHistorialCompleto('csv')" style="flex:1; background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); padding: 10px; border-radius: 8px; font-weight: bold; font-size: 0.75rem; display: flex; justify-content: center; align-items: center; gap: 5px;">
                    <i class="material-icons-round" style="font-size:1.1rem;">table_view</i> CSV
                </button>
            </div>
        </div>
    `;
    container.innerHTML += headerHtml;

    // --- PROCESAR Y AGRUPAR LOS PEDIDOS ---
    // (Utiliza la función global agruparPorOrderId que ya existe en pedidos.js)
    const pedidosAgrupados = agruparPorOrderId(datosPedidosGlobal);
    const arrayPedidos = Object.values(pedidosAgrupados).sort((a, b) => {
        const timeA = a.fechaReal ? a.fechaReal.getTime() : 0;
        const timeB = b.fechaReal ? b.fechaReal.getTime() : 0;
        return timeB - timeA;
    });

    // --- DIBUJAR TARJETAS MÓVILES ---
    let cardsContainer = document.createElement('div');
    
    arrayPedidos.forEach((pedido) => {
        let totalPedido = 0;
        let hasGarantia = false;
        let allVencidas = true;
        let isRenovacion = pedido.orderId.startsWith('REN-');
        
        pedido.cuentas.forEach(cuenta => {
            totalPedido += (cuenta.precio || 0);
            const est = cuenta.estado ? cuenta.estado.toLowerCase() : 'si';
            if (est === 'garantia') hasGarantia = true;
            if (est !== 'vencida' && est !== 'reemplazada') allVencidas = false; 
        });

        // Diseño condicional del borde izquierdo según estado
        let borderLeft = '4px solid var(--accent-text)';
        let badgeEstado = '';

        if (isRenovacion) {
            borderLeft = '4px solid var(--success)';
        } else if (hasGarantia) {
            borderLeft = '4px solid #8b5cf6';
            badgeEstado = `<div class="mob-badge-garantia"><i class="material-icons-round" style="font-size:0.9rem;">health_and_safety</i> Garantía Aplicada</div>`;
        } else if (allVencidas) {
            borderLeft = '4px solid var(--border-color)';
            badgeEstado = `<div class="mob-badge-vencida"><i class="material-icons-round" style="font-size:0.9rem;">history</i> Expirado</div>`;
        }

        const card = document.createElement('div');
        card.className = 'mobile-order-card';
        card.style.borderLeft = borderLeft;
        
        card.innerHTML = `
            <div class="mobile-order-header">
                <div>
                    <div class="mobile-order-id">
                        <i class="material-icons-round" style="color: var(--accent-text); font-size: 1.2rem;">receipt_long</i> 
                        ${pedido.orderId}
                    </div>
                    ${badgeEstado ? `<div style="margin-top: 6px;">${badgeEstado}</div>` : ''}
                </div>
                <div class="mobile-order-date">
                    <span class="mobile-date-main">${pedido.fechaFormateada}</span>
                    <span class="mobile-date-sub">${pedido.horaFormateada}</span>
                </div>
            </div>
            
            <div class="mobile-order-body">
                <div class="mobile-order-detail">
                    <span style="color: var(--text-gray); font-size: 0.75rem; font-weight: 800; text-transform: uppercase;">Servicios Adquiridos</span>
                    <span class="mobile-qty-badge">${pedido.cuentas.length} Ítem(s)</span>
                </div>
                <div style="text-align: right;">
                    <span style="color: var(--text-gray); font-size: 0.75rem; font-weight: 800; text-transform: uppercase; display: block;">Total Pago</span>
                    <span class="mobile-price-total">${totalPedido > 0 ? '$ ' + new Intl.NumberFormat('es-CO').format(totalPedido) : '---'}</span>
                </div>
            </div>
            
            <div class="mobile-order-footer">
                <button class="btn-mobile-factura" onclick="invocarModalFacturaExterna('${pedido.orderId}')">
                    <i class="material-icons-round">open_in_new</i> ABRIR FACTURA
                </button>
            </div>
        `;
        cardsContainer.appendChild(card);
    });

    container.appendChild(cardsContainer);

    // --- PAGINADOR ESPECÍFICO PARA MÓVIL (MÁS COMPACTO Y FÁCIL DE TOCAR) ---
    if (totalPags > 1) {
        const paginacionDiv = document.createElement('div');
        paginacionDiv.className = 'mob-pagination';
        
        paginacionDiv.innerHTML = `
            <button class="btn-mob-page" onclick="cargarPedidos(${pagActual - 1})" ${pagActual <= 1 ? 'disabled' : ''}>
                <i class="material-icons-round">chevron_left</i>
            </button>
            
            <div style="font-weight: 800; color: var(--text-main); font-size: 0.9rem;">
                Página <span style="color: var(--accent-text);">${pagActual}</span> de ${totalPags}
            </div>
            
            <button class="btn-mob-page" onclick="cargarPedidos(${pagActual + 1})" ${pagActual >= totalPags ? 'disabled' : ''}>
                <i class="material-icons-round">chevron_right</i>
            </button>
        `;
        container.appendChild(paginacionDiv);
    }
}
