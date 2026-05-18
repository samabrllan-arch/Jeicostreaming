/**
 * ===============================================================
 * PEDIDOS.JS - VERSIÓN TABLA ULTRA PREMIUM (SWR + FILTROS AVANZADOS)
 * ===============================================================
 */

const STORE_CACHE_KEY_REF = "dw_store_cache"; 
const PEDIDOS_CACHE_KEY = "dw_pedidos_cache_v1"; // Llave para guardar la DB local

// Variables de Estado
let pedidosGlobalesBrutos = []; // Base de datos descargada cruda
let pedidosAgrupadosGlobal = []; // Base de datos agrupada por OrderId
let paginaActualPedidos = 1; 
let limitePedidosActual = 20; // 🔥 MEJORA: Paginación ajustada a 20 registros por defecto
let uiFiltrosInyectada = false;

// Variables para el ordenamiento de la tabla
window.pedColumnaOrden = 'fecha'; 
window.pedDireccionOrden = 'desc';

/**
 * 1. FUNCIÓN PRINCIPAL DE CARGA (SWR - Stale-While-Revalidate)
 */
async function cargarPedidos() {
    const container = document.getElementById('orders-container');
    
    // Obtenemos credenciales (soporta ambos nombres de variables según tu sistema)
    const u = localStorage.getItem('dw_user') || localStorage.getItem('jeico_user');
    const t = localStorage.getItem('dw_token') || localStorage.getItem('jeico_token');

    // 1. Inyectar la barra de filtros múltiples si no existe
    if (!uiFiltrosInyectada) {
        // Buscamos el contenedor donde solía estar el buscador viejo (o lo creamos antes del container)
        let searchContainer = document.querySelector('.search-premium-container') || document.getElementById('pedidos-filter-area');
        
        const htmlFiltros = `
            <div class="advanced-filters-premium">
                <div class="filter-group">
                    <span class="material-icons-round search-icon">search</span>
                    <input type="text" id="filtro-texto-pedidos" placeholder="Buscar cuenta, ID, servicio..." oninput="aplicarFiltrosPedidos(1)">
                </div>
                <div class="filter-group">
                    <span class="material-icons-round search-icon">category</span>
                    <select id="filtro-servicio-pedidos" onchange="aplicarFiltrosPedidos(1)">
                        <option value="">Todos los Servicios</option>
                    </select>
                </div>
                <div class="filter-group date-range-group">
                    <div class="date-input-wrapper">
                        <label>Desde</label>
                        <input type="date" id="filtro-fecha-desde" onchange="aplicarFiltrosPedidos(1)">
                    </div>
                    <span class="date-separator">-</span>
                    <div class="date-input-wrapper">
                        <label>Hasta</label>
                        <input type="date" id="filtro-fecha-hasta" onchange="aplicarFiltrosPedidos(1)">
                    </div>
                </div>
            </div>
        `;

        if (searchContainer) {
            searchContainer.outerHTML = htmlFiltros;
        } else {
            container.insertAdjacentHTML('beforebegin', htmlFiltros);
        }
        uiFiltrosInyectada = true;
    }

    // 2. CARGA INSTANTÁNEA DESDE CACHÉ
    let cachedPedidosStr = localStorage.getItem(PEDIDOS_CACHE_KEY);
    
    if (cachedPedidosStr) {
        try {
            pedidosGlobalesBrutos = JSON.parse(cachedPedidosStr);
            pedidosAgrupadosGlobal = Object.values(agruparPorOrderId(pedidosGlobalesBrutos));
            prepararYRenderizar(false); 
        } catch(e) {
            mostrarCargador(container);
        }
    } else {
        mostrarCargador(container);
    }

    // 3. SINCRONIZACIÓN EN SEGUNDO PLANO
    try {
        // Pedimos TODO el historial (límite 5000) para filtrar en el cliente a la velocidad de la luz
        const res = await apiCall({ 
            accion: 'getPedidos', 
            usuario: u, 
            token: t, 
            pagina: 1,
            limite: 5000, 
            filtro: "" 
        });

        if (res.success && res.datos) {
            const newPedidosStr = JSON.stringify(res.datos);
            
            if (cachedPedidosStr !== newPedidosStr) {
                pedidosGlobalesBrutos = res.datos;
                pedidosAgrupadosGlobal = Object.values(agruparPorOrderId(pedidosGlobalesBrutos));
                localStorage.setItem(PEDIDOS_CACHE_KEY, newPedidosStr);
                prepararYRenderizar(true); 
            }
        } else if (res.msg === "Sesión inválida") {
            if (typeof logout === 'function') logout();
        } else {
            if(!cachedPedidosStr) container.innerHTML = `<div class="no-orders-container"><span class="material-icons-round" style="font-size:4rem; color:var(--border-color); margin-bottom:20px;">history_toggle_off</span><p style="color:var(--text-gray); text-transform:uppercase; letter-spacing:2px; font-weight:800;">SIN COMPRAS</p></div>`;
        }
    } catch (error) {
        console.error("Error en pedidos:", error);
        if(!cachedPedidosStr) container.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--danger);">Error de conexión con el servidor.</p>`;
    }
}

function mostrarCargador(container) {
    container.innerHTML = `
        <div style="width: 100%; text-align:center; padding:80px;">
            <div class="spinner"></div>
            <p style="color:var(--text-gray); margin-top:20px; letter-spacing:3px; font-size:0.8rem; text-transform:uppercase; font-weight:800;">
                SINCRONIZANDO BÓVEDA...
            </p>
        </div>`;
}

function prepararYRenderizar(esActualizacionFondo) {
    const selectServicio = document.getElementById('filtro-servicio-pedidos');
    if (selectServicio) {
        const valorActual = selectServicio.value; 
        
        // Extraemos los servicios únicos de la base de datos bruta
        const serviciosUnicos = [...new Set(pedidosGlobalesBrutos.map(p => p.servicio))].filter(Boolean).sort();
        selectServicio.innerHTML = '<option value="">Todos los Servicios</option>' + 
            serviciosUnicos.map(s => `<option value="${s}">${s}</option>`).join('');
            
        if (serviciosUnicos.includes(valorActual)) {
            selectServicio.value = valorActual;
        }
    }
    aplicarFiltrosPedidos(paginaActualPedidos);
}

/**
 * 2. MOTOR DE FILTRADO Y ORDENAMIENTO EN TIEMPO REAL
 */
window.cambiarLimitePedidos = function(nuevoLimite) {
    limitePedidosActual = parseInt(nuevoLimite);
    aplicarFiltrosPedidos(1);
}

window.ordenarTablaPedidos = function(columna) {
    if (window.pedColumnaOrden === columna) {
        window.pedDireccionOrden = window.pedDireccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
        window.pedColumnaOrden = columna;
        window.pedDireccionOrden = 'desc'; 
    }
    aplicarFiltrosPedidos(paginaActualPedidos);
};

window.aplicarFiltrosPedidos = function(paginaPedida = 1) {
    paginaActualPedidos = paginaPedida;
    
    // Capturar inputs
    const txtFiltro = (document.getElementById('filtro-texto-pedidos')?.value || "").toLowerCase().trim();
    const srvFiltro = document.getElementById('filtro-servicio-pedidos')?.value || "";
    const dateDesde = document.getElementById('filtro-fecha-desde')?.value || "";
    const dateHasta = document.getElementById('filtro-fecha-hasta')?.value || "";

    // 1. FILTRAR
    let pedidosFiltrados = pedidosAgrupadosGlobal.filter(p => {
        let matchTxt = true;
        let matchSrv = true;
        let matchDate = true;

        if (txtFiltro) {
            matchTxt = p.orderId.toLowerCase().includes(txtFiltro) || 
                       p.cuentas.some(c => c.cuenta.toLowerCase().includes(txtFiltro) || c.servicio.toLowerCase().includes(txtFiltro));
        }

        if (srvFiltro) {
            matchSrv = p.cuentas.some(c => c.servicio === srvFiltro);
        }

        if (dateDesde || dateHasta) {
            const timeOrden = p.fechaReal ? p.fechaReal.getTime() : 0;
            if (timeOrden === 0) {
                matchDate = false;
            } else {
                if (dateDesde) {
                    const [y, m, d] = dateDesde.split('-');
                    const timeDesde = new Date(y, m - 1, d, 0, 0, 0).getTime();
                    if (timeOrden < timeDesde) matchDate = false;
                }
                if (dateHasta) {
                    const [y, m, d] = dateHasta.split('-');
                    const timeHasta = new Date(y, m - 1, d, 23, 59, 59).getTime();
                    if (timeOrden > timeHasta) matchDate = false;
                }
            }
        }

        return matchTxt && matchSrv && matchDate;
    });

    // 2. ORDENAR
    pedidosFiltrados.sort((a, b) => {
        let valA, valB;
        switch (window.pedColumnaOrden) {
            case 'id':
                valA = a.orderId.toLowerCase(); valB = b.orderId.toLowerCase(); break;
            case 'fecha':
                valA = a.fechaReal ? a.fechaReal.getTime() : 0; valB = b.fechaReal ? b.fechaReal.getTime() : 0; break;
            case 'detalles':
                valA = a.cuentas.length; valB = b.cuentas.length; break;
            case 'total':
                valA = a.totalPrecio; valB = b.totalPrecio; break;
            default:
                valA = a.fechaReal ? a.fechaReal.getTime() : 0; valB = b.fechaReal ? b.fechaReal.getTime() : 0;
        }

        if (valA < valB) return window.pedDireccionOrden === 'asc' ? -1 : 1;
        if (valA > valB) return window.pedDireccionOrden === 'asc' ? 1 : -1;
        
        // Desempate por ID si son iguales
        return b.orderId.localeCompare(a.orderId);
    });

    // 3. PAGINAR
    const totalItems = pedidosFiltrados.length;
    const totalPags = Math.ceil(totalItems / limitePedidosActual) || 1;
    if (paginaActualPedidos > totalPags) paginaActualPedidos = totalPags;
    if (paginaActualPedidos < 1) paginaActualPedidos = 1;

    const offset = (paginaActualPedidos - 1) * limitePedidosActual;
    const paginaDatos = pedidosFiltrados.slice(offset, offset + limitePedidosActual);

    // Si pasamos de página y no estamos en celular, subimos el scroll suavemente
    if (paginaActualPedidos > 1) {
        const filtersTop = document.querySelector('.advanced-filters-premium');
        if(filtersTop) filtersTop.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    renderizarTablaPremium(paginaDatos, totalItems, totalPags, txtFiltro);
}

/**
 * 3. DIBUJAR LA TABLA Y PAGINACIÓN
 */
function renderizarTablaPremium(arrayPedidos, totalItems, totalPags, filtroUsado) {
    const container = document.getElementById('orders-container');
    container.innerHTML = "";

    // --- BARRA SUPERIOR DE DESCARGA Y CONTEO ---
    const headerDiv = document.createElement('div');
    headerDiv.className = 'orders-top-bar';
    // 🔥 MEJORA: Mostrar el CONTEO TOTAL usando la cantidad real de registros descargados
    headerDiv.innerHTML = `
        <div class="results-count">
            Mostrando página ${paginaActualPedidos} de ${totalPags} 
            <span style="color:var(--accent-text); font-size:0.8rem; margin-left:15px; font-weight:900; background:var(--bg-dark); padding:4px 10px; border-radius:20px; border:1px solid var(--border-color);">
                <i class="material-icons-round" style="font-size:0.9rem; vertical-align:middle; margin-right:3px;">analytics</i> CONTEO TOTAL: ${pedidosGlobalesBrutos.length}
            </span>
        </div>
        <div class="download-actions">
            <button class="btn-download-all txt" onclick="descargarHistorialActivo('txt')">
                <span class="material-icons-round">description</span> DESCARGAR TXT
            </button>
            <button class="btn-download-all csv" onclick="descargarHistorialActivo('csv')">
                <span class="material-icons-round">table_view</span> DESCARGAR CSV
            </button>
        </div>
    `;
    container.appendChild(headerDiv);

    if (arrayPedidos.length === 0) {
        const noData = document.createElement('div');
        noData.innerHTML = `
            <div class="no-orders-container">
                <span class="material-icons-round" style="font-size:4rem; color:var(--border-color); margin-bottom:20px;">search_off</span>
                <p style="color:var(--text-gray); text-transform:uppercase; letter-spacing:2px; font-weight:800;">SIN RESULTADOS</p>
                <small style="color: var(--text-muted); display: block; margin-top: 10px;">Ajusta los filtros o las fechas para encontrar tu pedido.</small>
            </div>`;
        container.appendChild(noData);
        return;
    }

    const getIcon = (col) => {
        if (window.pedColumnaOrden !== col) return '<span style="color:var(--text-muted); font-size:0.8rem; margin-left:5px;">↕</span>';
        return window.pedDireccionOrden === 'asc'
            ? '<span style="color:var(--accent); font-size:0.8rem; margin-left:5px;">▲</span>'
            : '<span style="color:var(--accent); font-size:0.8rem; margin-left:5px;">▼</span>';
    };

    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'table-responsive-wrapper shadow-light';
    
    let tableHtml = `
        <table class="premium-table orders-table">
            <thead>
                <tr>
                    <th style="text-align:left; cursor:pointer; user-select:none;" onclick="ordenarTablaPedidos('id')">ID DEL PEDIDO ${getIcon('id')}</th>
                    <th style="text-align:center; cursor:pointer; user-select:none;" onclick="ordenarTablaPedidos('fecha')">FECHA Y HORA ${getIcon('fecha')}</th>
                    <th style="text-align:center; cursor:pointer; user-select:none;" onclick="ordenarTablaPedidos('detalles')">DETALLES ${getIcon('detalles')}</th>
                    <th style="text-align:center; cursor:pointer; user-select:none;" onclick="ordenarTablaPedidos('total')">TOTAL EST. ${getIcon('total')}</th>
                    <th style="text-align:center;">ACCIÓN</th>
                </tr>
            </thead>
            <tbody>
    `;

    arrayPedidos.forEach((pedido, index) => {
        let hasGarantia = false;
        let allVencidas = true;
        let isRenovacion = pedido.orderId.startsWith('REN-');
        let isSinOrden = pedido.orderId.startsWith('Sin Orden');
        
        pedido.cuentas.forEach(cuenta => {
            const est = cuenta.estado ? cuenta.estado.toLowerCase() : 'si';
            if (est === 'garantia' || est === 'garantía') hasGarantia = true;
            if (est !== 'vencida' && est !== 'reemplazada') allVencidas = false; 
        });

        let borderStyle = '';
        let badgeEstado = '';

        if (isRenovacion) {
            borderStyle = 'border-left: 4px solid #10b981;';
        } else if (hasGarantia) {
            borderStyle = 'border-left: 4px solid #8b5cf6;';
            badgeEstado = `<div style="margin-top: 8px;"><span style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6; padding: 4px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; border: 1px solid rgba(139, 92, 246, 0.3);"><i class="material-icons-round" style="font-size:0.8rem; vertical-align:middle;">health_and_safety</i> Garantía Aplicada</span></div>`;
        } else if (allVencidas) {
            borderStyle = 'border-left: 4px solid #64748b;';
            badgeEstado = `<div style="margin-top: 8px;"><span style="background: rgba(255, 255, 255, 0.05); color: var(--text-gray); padding: 4px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; border: 1px dashed var(--border-color);"><i class="material-icons-round" style="font-size:0.8rem; vertical-align:middle;">history</i> Expirado</span></div>`;
        } else if (isSinOrden) {
            borderStyle = 'border-left: 4px solid #f59e0b;'; 
        } else {
            borderStyle = 'border-left: 4px solid #38bdf8;'; 
        }

        let idBadgeDesign = isSinOrden 
            ? `<span class="material-icons-round" style="color:#f59e0b;">history</span> <span style="color:#f59e0b;">${pedido.orderId}</span>`
            : `<span class="material-icons-round">receipt_long</span> ${pedido.orderId}`;

        let esElMasReciente = (paginaActualPedidos === 1 && index === 0 && filtroUsado === '' && window.pedColumnaOrden === 'fecha' && window.pedDireccionOrden === 'desc');
        let claseFilaExtra = esElMasReciente ? 'fila-mas-reciente' : '';
        let badgeReciente = esElMasReciente ? `<span class="badge-nuevo-sutil">RECIENTE</span>` : '';

        tableHtml += `
            <tr class="wallet-row-premium ${claseFilaExtra}" style="animation-delay: ${index * 0.03}s;">
                <td style="padding:18px 15px; text-align:left; min-width: 180px; ${borderStyle}">
                    <div class="order-id-badge" style="${isSinOrden ? 'border-color: rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.05);' : ''}">
                        ${idBadgeDesign} ${badgeReciente}
                    </div>
                    ${badgeEstado}
                </td>
                <td style="padding:18px 15px; text-align:center; min-width: 140px;">
                    <div class="text-bold-dark">${pedido.fechaFormateada}</div>
                    <div class="text-subtle-gray">${pedido.horaFormateada || '--:--'}</div>
                </td>
                <td style="padding:18px 15px; text-align:center; min-width: 120px;">
                    <div class="qty-badge">${pedido.cuentas.length} Servicios</div>
                </td>
                <td style="padding:18px 15px; text-align:center; min-width: 120px;">
                    <span class="price-accent">
                        ${pedido.totalPrecio > 0 ? '$ ' + new Intl.NumberFormat('es-CO').format(pedido.totalPrecio) : '---'}
                    </span>
                </td>
                <td style="padding:18px 15px; text-align:center; min-width: 160px;">
                    <button class="btn-view-order" onclick="abrirFacturaGlobal('${pedido.orderId}', pedidosGlobalesBrutos)">
                        VER DETALLE <span class="material-icons-round" style="font-size:1.1rem;">open_in_new</span>
                    </button>
                </td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    tableWrapper.innerHTML = tableHtml;
    container.appendChild(tableWrapper);

    // --- PAGINACIÓN CON LÍMITE DINÁMICO ---
    if (totalItems > 0) {
        const paginacionDiv = document.createElement('div');
        paginacionDiv.className = 'pagination-premium-container';
        paginacionDiv.style.marginTop = "25px";
        
        let htmlPaginacion = `<div class="pag-buttons-group">`;
        
        htmlPaginacion += `
            <button type="button" class="btn-page icon-only" onclick="aplicarFiltrosPedidos(1)" ${paginaActualPedidos <= 1 ? 'disabled' : ''} title="Primera">
                <span class="material-icons-round">first_page</span>
            </button>
            <button type="button" class="btn-page icon-only" onclick="aplicarFiltrosPedidos(${paginaActualPedidos - 1})" ${paginaActualPedidos <= 1 ? 'disabled' : ''} title="Anterior">
                <span class="material-icons-round">chevron_left</span>
            </button>
            <div class="page-numbers-container">
        `;

        let startPage = Math.max(1, paginaActualPedidos - 1);
        let endPage = Math.min(totalPags, startPage + 2);
        if (endPage - startPage < 2 && startPage > 1) {
            startPage = Math.max(1, endPage - 2);
        }

        for (let i = startPage; i <= endPage; i++) {
            if (i === paginaActualPedidos) {
                htmlPaginacion += `<button type="button" class="btn-page number active">${i}</button>`;
            } else {
                htmlPaginacion += `<button type="button" class="btn-page number" onclick="aplicarFiltrosPedidos(${i})">${i}</button>`;
            }
        }

        htmlPaginacion += `
            </div>
            <button type="button" class="btn-page icon-only" onclick="aplicarFiltrosPedidos(${paginaActualPedidos + 1})" ${paginaActualPedidos >= totalPags ? 'disabled' : ''} title="Siguiente">
                <span class="material-icons-round">chevron_right</span>
            </button>
            <button type="button" class="btn-page icon-only" onclick="aplicarFiltrosPedidos(${totalPags})" ${paginaActualPedidos >= totalPags ? 'disabled' : ''} title="Última">
                <span class="material-icons-round">last_page</span>
            </button>
        </div>`;
        
        // Selector de Límite (Ajustado para 20 por defecto)
        htmlPaginacion += `
            <div class="limit-selector-group">
                <span class="limit-label">Mostrar:</span>
                <select class="limit-select" onchange="cambiarLimitePedidos(this.value)">
                    <option value="20" ${limitePedidosActual === 20 ? 'selected' : ''}>20</option>
                    <option value="50" ${limitePedidosActual === 50 ? 'selected' : ''}>50</option>
                    <option value="100" ${limitePedidosActual === 100 ? 'selected' : ''}>100</option>
                </select>
            </div>
        `;
        
        paginacionDiv.innerHTML = htmlPaginacion;
        container.appendChild(paginacionDiv);
    }
}

/**
 * 4. AGRUPADOR (LÓGICA CENTRAL)
 */
function agruparPorOrderId(datosBrutos) {
    const agrupado = {};
    
    datosBrutos.forEach(row => {
        let fechaObj = new Date();
        let fechaStrFormateada = "Desconocida";
        
        if (row.fecha) {
            let fStr = row.fecha.split(' ')[0]; 
            if (fStr.includes('-')) {
                let [y, m, d] = fStr.split('-');
                fechaObj = new Date(y, m - 1, d, 0, 0, 0);
                fechaStrFormateada = `${d}/${m}/${y}`; 
            } else if (fStr.includes('/')) {
                let [d, m, y] = fStr.split('/');
                fechaObj = new Date(y, m - 1, d, 0, 0, 0);
                fechaStrFormateada = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
            }
        }

        let oId = row.orderId || row.order_id;
        if (!oId || oId.trim() === '') {
            oId = `Sin Orden - ${fechaStrFormateada}`;
        }
        
        if (!agrupado[oId]) {
            agrupado[oId] = {
                orderId: oId,
                fechaReal: fechaObj,
                fechaFormateada: fechaStrFormateada !== "Desconocida" ? fechaStrFormateada : 'N/A',
                horaFormateada: row.fecha && row.fecha.includes(' ') ? row.fecha.split(' ')[1] : '',
                cuentas: [],
                resumen: {},
                totalPrecio: 0 
            };
        }
        
        const precioUnitarioDB = Number(row.precio) || 0;
        agrupado[oId].totalPrecio += precioUnitarioDB; 

        agrupado[oId].cuentas.push({
            servicio: row.servicio,
            cuenta: row.cuenta,
            clave: row.clave, // Aseguramos traer la clave si existe en la db
            precio: precioUnitarioDB,
            estado: row.estado || 'Si',
            notas: row.notas || '' 
        });

        let srv = row.servicio;
        if (!agrupado[oId].resumen[srv]) {
            agrupado[oId].resumen[srv] = { cantidad: 0, precioUnitario: precioUnitarioDB };
        }
        agrupado[oId].resumen[srv].cantidad++;
    });
    
    return agrupado;
}

/**
 * 5. MODAL FACTURA EXTERNA (SWEETALERT)
 */


/**
 * 6. DESCARGA TXT / CSV (Rápida desde Memoria RAM)
 */
window.descargarHistorialActivo = function(formato) {
    if (!pedidosGlobalesBrutos || pedidosGlobalesBrutos.length === 0) {
        if (typeof mostrarToast === 'function') mostrarToast("No hay datos para descargar.", "error");
        return;
    }

    let contenido = "";
    let nombreArchivo = `Reporte_Pedidos_${new Date().toISOString().split('T')[0]}`;

    if (formato === 'csv') {
        contenido += "ID Pedido,Servicio,Cuenta,Clave,Fecha,Precio,Estado,Notas\n";
        
        pedidosGlobalesBrutos.forEach(p => {
            let ord = p.orderId || p.order_id || '';
            let srv = p.servicio || '';
            let cta = p.cuenta ? p.cuenta.replace(/"/g, '""') : ''; 
            let cla = p.clave ? p.clave.replace(/"/g, '""') : ''; 
            let fec = p.fecha || '';
            let pre = p.precio || 0;
            let est = p.estado || '';
            let not = p.notas ? p.notas.replace(/"/g, '""').replace(/\n/g, ' ') : ''; 
            
            contenido += `"${ord}","${srv}","${cta}","${cla}","${fec}","${pre}","${est}","${not}"\n`;
        });
        nombreArchivo += ".csv";

    } else if (formato === 'txt') {
        contenido += "🌟 HISTORIAL DE COMPRAS 🌟\n\n";

        const pedidosAgrupadosDescarga = agruparPorOrderId(pedidosGlobalesBrutos);
        const arrayPedidosDescarga = Object.values(pedidosAgrupadosDescarga).sort((a, b) => {
            const timeA = a.fechaReal ? a.fechaReal.getTime() : 0;
            const timeB = b.fechaReal ? b.fechaReal.getTime() : 0;
            return timeB - timeA;
        });

        const fmt = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

        arrayPedidosDescarga.forEach(pedido => {
            contenido += `PEDIDO: ${pedido.orderId}\n`;
            contenido += `FECHA: ${pedido.fechaFormateada} ${pedido.horaFormateada}\n`;
            
            let agrupacionServicios = {};
            let totalGeneral = 0;

            pedido.cuentas.forEach(cuenta => {
                if (!agrupacionServicios[cuenta.servicio]) {
                    agrupacionServicios[cuenta.servicio] = { cuentas: [], precioUnitario: parseFloat(cuenta.precio) || 0 };
                }
                agrupacionServicios[cuenta.servicio].cuentas.push(cuenta);
            });

            for (const srv in agrupacionServicios) {
                const dataSrv = agrupacionServicios[srv];
                const cantidad = dataSrv.cuentas.length;
                const subtotal = cantidad * dataSrv.precioUnitario;
                totalGeneral += subtotal;

                contenido += `========================\n📌 SERVICIO: ${srv}\n`;
                dataSrv.cuentas.forEach((cData, idx) => {
                    contenido += `Cuenta ${idx + 1}: ${cData.cuenta}\n`;
                    if(cData.clave) contenido += `Clave: ${cData.clave}\n`;
                    if (cData.notas) contenido += `Notas: ${cData.notas}\n`;
                });
                contenido += `------------------------\nValor individual: $ ${fmt.format(dataSrv.precioUnitario)}\nSubtotal del bloque: $ ${fmt.format(subtotal)}\n========================\n`;
            }
            
            contenido += `\n💰 TOTAL GENERAL: $ ${fmt.format(totalGeneral)}\n¡Gracias por tu preferencia!\n\n`;
            contenido += `----------------------------------------------------\n\n`;
        });
        nombreArchivo += ".txt";
    }

    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (typeof mostrarToast === 'function') mostrarToast(`Archivo ${formato.toUpperCase()} descargado.`, "success");
};

/**
 * 7. INYECCIÓN DE ESTILOS CSS CONSOLIDADOS
 */
const pedidosRefinedStyles = `
    #orders-container {
        display: flex !important;
        flex-direction: column !important;
        width: 100% !important;
        gap: 20px !important;
    }

    /* --- BARRA DE FILTROS AVANZADA --- */
    .advanced-filters-premium {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 15px;
        margin-bottom: 20px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        width: 100%;
        box-sizing: border-box;
    }
    .filter-group {
        flex: 1;
        min-width: 180px;
        display: flex;
        align-items: center;
        background: var(--bg-dark);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 8px 15px;
        transition: 0.3s;
        position: relative;
    }
    .filter-group:focus-within {
        border-color: var(--accent-text);
        box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
    }
    .filter-group .search-icon { color: var(--text-gray); font-size: 1.2rem; margin-right: 10px; transition: 0.3s; }
    .filter-group:focus-within .search-icon { color: var(--accent-text); }
    
    .filter-group input, .filter-group select {
        flex-grow: 1;
        background: transparent;
        border: none;
        color: var(--text-main);
        font-size: 0.85rem;
        outline: none;
        font-family: 'Inter', sans-serif;
        padding: 4px 0;
        width: 100%;
    }
    .filter-group select option { background: var(--bg-dark); color: var(--text-main); }
    
    /* Input Date con Inversión de Color según Tema */
    .filter-group input[type="date"]::-webkit-calendar-picker-indicator { 
        filter: var(--calendar-filter, invert(1)); /* Por defecto invert(1) para modo oscuro */
        cursor: pointer; 
    }

    /* Especial para Rango de Fechas */
    .date-range-group {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 15px !important;
    }
    .date-input-wrapper {
        display: flex;
        flex-direction: column;
        flex: 1;
    }
    .date-input-wrapper label {
        font-size: 0.65rem;
        color: var(--text-gray);
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 2px;
    }
    .date-separator {
        color: var(--text-gray);
        font-weight: bold;
        margin: 0 5px;
        margin-top: 10px; /* Alineación con el input */
    }

    /* --- BARRA SUPERIOR Y TABLA --- */
    .orders-top-bar {
        width: 100% !important; display: flex !important; justify-content: space-between !important; align-items: center !important;
        background: var(--bg-card) !important; border: 1px solid var(--border-color) !important; padding: 15px 20px !important;
        border-radius: 12px !important; box-shadow: 0 4px 6px rgba(0,0,0,0.02) !important; box-sizing: border-box !important;
    }
    .results-count { color: var(--text-gray) !important; font-size: 0.85rem !important; font-weight: 700 !important; letter-spacing: 1px !important; text-transform: uppercase !important; display: flex; align-items: center; flex-wrap: wrap; gap: 5px; }
    .download-actions { display: flex !important; gap: 12px !important; }
    .btn-download-all { border: 1px solid transparent !important; padding: 10px 18px !important; border-radius: 8px !important; font-weight: 800 !important; font-size: 0.75rem !important; letter-spacing: 1px !important; cursor: pointer !important; display: flex !important; align-items: center !important; gap: 8px !important; transition: all 0.3s ease !important; }
    .btn-download-all.txt { background: rgba(37, 99, 235, 0.1) !important; color: #2563eb !important; border-color: rgba(37, 99, 235, 0.3) !important; }
    .btn-download-all.txt:hover { background: #2563eb !important; color: #fff !important; transform: translateY(-2px); }
    .btn-download-all.csv { background: rgba(16, 185, 129, 0.1) !important; color: #10b981 !important; border-color: rgba(16, 185, 129, 0.3) !important; }
    .btn-download-all.csv:hover { background: #10b981 !important; color: #fff !important; transform: translateY(-2px); }

    .table-responsive-wrapper { width: 100% !important; max-height: 600px !important; overflow-x: auto !important; overflow-y: auto !important; border-radius: 12px !important; border: 1px solid var(--border-color) !important; background: var(--bg-card) !important; box-sizing: border-box !important; }
    .premium-table { width: 100% !important; min-width: 800px !important; border-collapse: collapse !important; }
    .premium-table thead th { position: sticky !important; top: 0 !important; z-index: 2 !important; background: var(--bg-dark) !important; color: var(--text-gray) !important; font-size: 0.75rem !important; text-transform: uppercase !important; letter-spacing: 2px !important; padding: 18px 15px !important; border-bottom: 2px solid var(--border-color); transition: background 0.2s; }
    .premium-table thead th:hover { background: rgba(255,255,255,0.02) !important; }
    .wallet-row-premium { border-bottom: 1px solid var(--border-color) !important; background: var(--bg-card) !important; transition: 0.3s !important; }
    .wallet-row-premium:hover { background: var(--bg-dark) !important; }

    .order-id-badge { display: inline-flex !important; align-items: center !important; gap: 8px !important; background: var(--bg-dark) !important; color: var(--text-main) !important; padding: 8px 12px !important; border-radius: 8px !important; font-family: 'Inter', monospace !important; font-weight: 700 !important; font-size: 0.85rem !important; border: 1px solid var(--border-color) !important; }
    .order-id-badge .material-icons-round { font-size: 1.1rem !important; color: var(--accent-text) !important; }

    .text-bold-dark { font-weight: 800 !important; color: var(--text-main) !important; font-size: 0.9rem !important; }
    .text-subtle-gray { font-size: 0.75rem !important; color: var(--text-gray) !important; margin-top: 4px !important; font-family: monospace !important; }
    
    .qty-badge { display: inline-block !important; background: rgba(16, 185, 129, 0.1) !important; color: var(--success) !important; border: 1px solid rgba(16, 185, 129, 0.3) !important; padding: 6px 12px !important; border-radius: 20px !important; font-size: 0.75rem !important; font-weight: 800 !important; }

    .price-accent { color: var(--accent-text) !important; font-weight: 800 !important; font-size: 1rem !important; }

    .btn-view-order { background: transparent !important; border: 1px solid var(--border-color) !important; color: var(--text-gray) !important; padding: 10px 18px !important; border-radius: 8px !important; font-weight: 800 !important; font-size: 0.75rem !important; cursor: pointer !important; transition: all 0.3s ease !important; display: inline-flex !important; align-items: center !important; gap: 6px !important; }
    .btn-view-order:hover { background: rgba(56, 189, 248, 0.1) !important; border-color: var(--accent-text) !important; color: var(--accent-text) !important; }

    /* PAGINACIÓN DINÁMICA CON LÍMITE */
    .pagination-premium-container { grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; padding: 15px 20px; background: var(--bg-card) !important; border-radius: 12px; border: 1px solid var(--border-color) !important; box-sizing: border-box !important;}
    .pag-buttons-group { display: flex; gap: 8px; align-items: center; }
    .page-numbers-container { display: flex !important; gap: 8px !important; }
    
    .btn-page { display: flex !important; align-items: center !important; justify-content: center !important; background: transparent !important; color: var(--text-gray) !important; border: 1px solid var(--border-color) !important; border-radius: 8px !important; cursor: pointer !important; font-weight: 700 !important; transition: 0.3s !important; }
    .btn-page.icon-only { padding: 8px !important; }
    .btn-page.number { width: 36px !important; height: 36px !important; font-size: 0.9rem !important; }
    .btn-page:hover:not(:disabled) { background: var(--bg-dark) !important; color: var(--text-main) !important; border-color: var(--text-gray) !important; }
    .btn-page.active { background: var(--accent-text) !important; color: #fff !important; border-color: var(--accent-text) !important; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3) !important; }
    .btn-page:disabled { opacity: 0.5 !important; cursor: not-allowed !important; background: transparent !important; }
    
    .limit-selector-group { display: flex; align-items: center; gap: 10px; }
    .limit-label { color: var(--text-gray); font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .limit-select { background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-main); padding: 6px 12px; border-radius: 8px; outline: none; font-weight: bold; cursor: pointer; font-family: 'Inter', sans-serif; transition: 0.3s; }
    .limit-select:focus, .limit-select:hover { border-color: var(--accent-text); box-shadow: 0 0 10px rgba(56, 189, 248, 0.2); }

    .no-orders-container { width: 100% !important; text-align: center !important; padding: 80px 20px !important; border: 1px dashed var(--border-color) !important; border-radius: 20px !important; background: var(--bg-card) !important; box-sizing: border-box !important;}
    
    @media (max-width: 768px) {
        .orders-top-bar { flex-direction: column !important; gap: 15px !important; }
        .download-actions { width: 100% !important; display: grid !important; grid-template-columns: 1fr 1fr !important; }
        .btn-download-all { justify-content: center !important; }
        .pagination-premium-container { flex-direction: column; justify-content: center; gap: 15px; }
        .advanced-filters-premium { flex-direction: column; }
        .filter-group { width: 100%; }
    }
`;

const styleSheetPedidos = document.createElement("style");
styleSheetPedidos.innerText = pedidosRefinedStyles;
document.head.appendChild(styleSheetPedidos);
