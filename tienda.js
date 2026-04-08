const STORE_CACHE_KEY = "dw_store_cache";
const CACHE_TTL_MS = 60 * 60 * 1000; // 🔥 1 HORA EN MILISEGUNDOS

// 🔥 Pega aquí la URL del Google Apps Script que creaste para el Webhook
const WEBHOOK_GS_COMPRAS = "https://script.google.com/macros/s/AKfycbybqRTJ1V0ppx4274KGorb7B3DSu9KF37UvegewhbMRanjD09hVADnCap_m9BAyYbO3/exec"; 

if (typeof cart === 'undefined') {
    var cart = [];
}

// Variables globales para el manejo de las pestañas
let lastProductos = []; 
let currentStoreTab = 'pantallas'; // Pestaña por defecto

// --- CONFIGURACIÓN DE NOTIFICACIONES (CON FIX DE Z-INDEX) ---
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    background: '#0a0a0a',
    color: '#fff',
    iconColor: '#7c3aed',
    // Forzamos que el contenedor de la alerta esté por encima de todo (z-index)
    customClass: {
        container: 'swal-high-priority'
    }
});

// 🔥 LA MAGIA: Función que convierte enlaces de Drive a Thumbnails ultrarrápidos
function convertirAThumbnail(url) {
    if (!url || url.trim() === "") return "";
    
    // 1. Si es link de Google Drive, lo convertimos
    if (url.includes("uc?export=view&id=")) {
        return url.replace("uc?export=view&id=", "thumbnail?id=") + "&sz=w600";
    }
    
    // 2. Si es una foto antigua del servidor local
    if (!url.startsWith("http") && !url.startsWith("data:")) {
        return `${API_BASE_URL_CLIENTE}/uploads/categorias/${url}`;
    }
    
    return url;
}

/**
 * 1. CARGA INICIAL Y SINCRONIZACIÓN MIXTA (STALE-WHILE-REVALIDATE)
 */
async function cargarTienda() {
    const container = document.getElementById('shop-container');
    if(!container) return;
    
    const cachedData = localStorage.getItem(STORE_CACHE_KEY);
    let useCachedStatic = false;
    let cachedProducts = [];
    let timestampAntiguo = new Date().getTime();

    // A. CARGA INSTANTÁNEA (EXPERIENCIA ULTRA RÁPIDA)
    if (cachedData) {
        try {
            const data = JSON.parse(cachedData);
            timestampAntiguo = data.timestamp;
            const tiempoPasado = new Date().getTime() - timestampAntiguo;

            // Si el caché tiene menos de 1 hora, activamos la bandera para reciclar datos estáticos
            if (tiempoPasado < CACHE_TTL_MS) {
                useCachedStatic = true;
                cachedProducts = data.productos;
            }
            
            // Mostramos lo que tenemos al instante para que el cliente no vea spinners
            window.userBalance = Number(localStorage.getItem('dw_saldo')) || 0;
            if (typeof updateBalanceUI === 'function') updateBalanceUI();
            renderizarTiendaPremium(data.productos, false); 
        } catch(e) {
            console.warn("Caché corrupto, ignorando.");
            container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px;"><div class="spinner"></div></div>';
        }
    } else {
        container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px;"><div class="spinner"></div></div>';
    }

    // B. ACTUALIZACIÓN SILENCIOSA (DATOS DINÁMICOS: PRECIOS Y STOCK SIEMPRE FRESCOS)
    const u = localStorage.getItem('dw_user');
    const t = localStorage.getItem('dw_token');

    try {
        const res = await apiCall({ accion: 'getTienda', usuario: u, token: t });

        if (res && res.success) {
            window.userBalance = Number(res.saldo);
            localStorage.setItem('dw_saldo', window.userBalance);
            if (typeof updateBalanceUI === 'function') updateBalanceUI();

            let finalProducts = res.productos;

            // 🔥 EL TRUCO: Si el caché estático sirve (< 1h), fusionamos lo viejo con lo nuevo
            if (useCachedStatic) {
                finalProducts = res.productos.map(freshProd => {
                    const cachedProd = cachedProducts.find(p => p.nombre === freshProd.nombre);
                    if (cachedProd) {
                        return {
                            ...freshProd, // Toma el STOCK y PRECIO frescos del servidor
                            img: cachedProd.img, // Recicla imagen cacheada
                            descripcion: cachedProd.descripcion, // Recicla T&C
                            cuenta_completa: cachedProd.cuenta_completa,
                            favorito: cachedProd.favorito,
                            minimo_compra: cachedProd.minimo_compra,
                            maximo_compra: cachedProd.maximo_compra,
                            oculto: cachedProd.oculto
                        };
                    }
                    return freshProd; // Si es un producto nuevo, lo toma completo
                });
            }

            // Guardamos la tienda combinada en el LocalStorage
            localStorage.setItem(STORE_CACHE_KEY, JSON.stringify({
                productos: finalProducts,
                // Si reciclamos estáticos, mantenemos la hora original para que caduque al cumplir 1H.
                // Si no reciclamos, reseteamos el reloj.
                timestamp: useCachedStatic ? timestampAntiguo : new Date().getTime()
            }));

            // Repintamos la tienda silenciosamente con los precios y stock actualizados
            renderizarTiendaPremium(finalProducts, false);
        } else {
            if (res && res.msg === "Sesión inválida") {
                if (typeof logout === 'function') logout();
            }
        }
    } catch (e) {
        console.error("Error de sincronización silenciosa:", e);
        // Si hay error de red, no hacemos nada. El cliente ya está viendo la versión del caché.
    }
}

/**
 * Función para cambiar entre pestañas
 */
window.switchStoreTab = function(tabId) {
    currentStoreTab = tabId;
    renderizarTiendaPremium(lastProductos, false); // Re-renderiza con la nueva pestaña activa
}

/**
 * 2. RENDERIZADOR DE TARJETAS (CATEGORÍAS, PESTAÑAS, FAVORITOS Y CANTIDADES)
 */
function renderizarTiendaPremium(productosDB, isCache) {
    const container = document.getElementById('shop-container');
    if(!container) return;
    
    container.innerHTML = "";

    if (!productosDB || productosDB.length === 0) {
        container.innerHTML = "<p style='grid-column: 1/-1; text-align:center; color:#444; padding:50px;'>Catálogo vacío actualmente.</p>";
        return;
    }

    // 🔥 FILTRO MAESTRO: Si la categoría está oculta, la eliminamos para que el cliente no la vea
    let productosValidos = productosDB.filter(p => {
        const isOculto = p.oculto && (p.oculto.toString().trim().toLowerCase() === 'si' || p.oculto.toString().trim().toLowerCase() === 'sí');
        return !isOculto;
    });

    if (productosValidos.length === 0) {
        container.innerHTML = "<p style='grid-column: 1/-1; text-align:center; color:#444; padding:50px;'>No hay servicios disponibles por el momento.</p>";
        return;
    }

    // Guardamos los productos válidos para poder cambiar de pestaña sin recargar
    lastProductos = productosValidos;

    // --- A. RENDERIZAR BOTONES DE PESTAÑAS ---
    const tabContainer = document.createElement('div');
    tabContainer.className = 'store-tabs-container';
    tabContainer.innerHTML = `
        <button class="store-tab ${currentStoreTab === 'pantallas' ? 'active' : ''}" onclick="switchStoreTab('pantallas')"><i class="material-icons-round" style="font-size:1.1rem;">devices</i> Por Pantallas</button>
        <button class="store-tab ${currentStoreTab === 'completas' ? 'active' : ''}" onclick="switchStoreTab('completas')"><i class="material-icons-round" style="font-size:1.1rem;">tv</i> Cuentas Completas</button>
    `;
    container.appendChild(tabContainer);

    // --- B. SEPARAR EN CATEGORÍAS (Cuentas completas vs Pantallas) ---
    const cuentasCompletas = [];
    const cuentasPantallas = [];

    productosValidos.forEach(p => {
        const esCompleta = p.cuenta_completa && (p.cuenta_completa.toString().trim().toLowerCase() === 'si' || p.cuenta_completa.toString().trim().toLowerCase() === 'sí');
        if (esCompleta) {
            cuentasCompletas.push(p);
        } else {
            cuentasPantallas.push(p);
        }
    });

    // Función auxiliar para ordenar los arrays: Agotados al final, luego Favoritos, luego Alfabético
    const ordenarGrupo = (grupo) => {
        return grupo.sort((a, b) => {
            const stockA = Number(a.stock) || 0;
            const minA = Number(a.minimo_compra) || 0;
            const isAgotadoA = stockA <= 0 || (minA > stockA) ? 1 : 0;

            const stockB = Number(b.stock) || 0;
            const minB = Number(b.minimo_compra) || 0;
            const isAgotadoB = stockB <= 0 || (minB > stockB) ? 1 : 0;

            // 1. Agotados al final
            if (isAgotadoA !== isAgotadoB) return isAgotadoA - isAgotadoB;

            // 2. Favoritos primero
            const aFav = (a.favorito && (a.favorito.toString().trim().toLowerCase() === 'si' || a.favorito.toString().trim().toUpperCase() === 'X')) ? 1 : 0;
            const bFav = (b.favorito && (b.favorito.toString().trim().toLowerCase() === 'si' || b.favorito.toString().trim().toUpperCase() === 'X')) ? 1 : 0;
            if (aFav !== bFav) return bFav - aFav;

            // 3. Alfabético
            return a.nombre.localeCompare(b.nombre);
        });
    };

    ordenarGrupo(cuentasCompletas);
    ordenarGrupo(cuentasPantallas);

    // --- C. RENDERIZAR GRUPO ACTIVO ---
    const renderGrupo = (grupo, titulo) => {
        
        // Creamos el contenedor de la grilla (grid) para alinear las tarjetas
        const gridContainer = document.createElement('div');
        gridContainer.className = 'store-grid-container';

        if (grupo.length === 0) {
            gridContainer.innerHTML = `<p style='grid-column: 1/-1; text-align:center; color:var(--text-gray); padding: 30px; width: 100%;'>No hay ${titulo.toLowerCase()} disponibles en este momento.</p>`;
            container.appendChild(gridContainer);
            return;
        }

        const usuarioLogueado = localStorage.getItem('dw_user');

        // Tarjetas del grupo
        grupo.forEach((p, index) => {
            // 🔥 INYECTAMOS EL THUMBNAIL ULTRARRÁPIDO
            let img = p.img ? convertirAThumbnail(p.img) : ''; 

            const stockActual = Number(p.stock) || 0;
            let precioActual = Number(p.precio) || 0;
            const precioAnterior = Number(p.precioAnt) || 0;
            const safeName = p.nombre.replace(/'/g, "\\'");
            // 🔥 EL FIX: Convertimos saltos de línea (\n) a etiquetas HTML (<br>) para que no rompan el botón
            const safeDesc = (p.descripcion || 'Sin descripción adicional.')
                .replace(/'/g, "\\'")
                .replace(/"/g, '&quot;')
                .replace(/\r?\n/g, '<br>');
    
            let tienePrecioEspecial = false;

            // --- LÓGICA DE PRECIO PREFERENTE OCULTO (LEYENDO FORMATO Usuario:Precio) ---
            if (p.precios_especiales && usuarioLogueado) {
                const reglasPrecios = p.precios_especiales.split(',');
                for (let regla of reglasPrecios) {
                    const partes = regla.split(':');
                    if (partes.length === 2 && partes[0].trim() === usuarioLogueado) {
                        precioActual = Number(partes[1].trim()); // Aplica el precio exacto
                        tienePrecioEspecial = true;
                        break; 
                    }
                }
            }

            // --- LÓGICA DE FLUCTUACIÓN DE PRECIOS ---
            let bajoDePrecio = false;
            let subioDePrecio = false;
            let mostrarPrecioViejo = false;

            // Si tiene un precio especial, NO calculamos subidas ni bajadas para que no sospeche
            if (!tienePrecioEspecial) {
                bajoDePrecio = precioAnterior > precioActual;
                subioDePrecio = precioAnterior > 0 && precioAnterior < precioActual;
                mostrarPrecioViejo = precioAnterior > 0 && precioAnterior !== precioActual;
            }

            // --- LÓGICA DE LÍMITES DE COMPRA ---
            let minCompra = Number(p.minimo_compra) || 0;
            let maxCompra = Number(p.maximo_compra) || 0;
            
            let limiteRealMaximo = maxCompra > 0 ? Math.min(maxCompra, stockActual) : stockActual;
            const isSoldOut = stockActual <= 0 || (minCompra > stockActual);
            let valorInicial = minCompra > 0 ? minCompra : 1;

            let actionHtml = '';
            let limitesTexto = '';

            if (minCompra > 0 || maxCompra > 0) {
                let txtMin = minCompra > 0 ? `Mín: ${minCompra}` : '';
                let txtMax = maxCompra > 0 ? `Máx: ${maxCompra}` : '';
                let sep = (txtMin && txtMax) ? ' | ' : '';
                limitesTexto = `<div style="font-size: 0.75rem; color: var(--accent); font-weight: bold; text-align: center; margin-top: 5px;">${txtMin}${sep}${txtMax}</div>`;
            }
            
            const inputId = `qty-card-${titulo.replace(/\s/g, '')}-${p.nombre.replace(/\s/g, '')}-${index}`;

            if (isCache) {
                actionHtml = `<button class="btn-buy" style="opacity:0.5; cursor:wait; width: 100% !important; background: var(--accent) !important; color: #fff !important; border: none !important;" disabled>SINCRONIZANDO...</button>`;
            } else if (isSoldOut) {
                actionHtml = `<button class="btn-buy disabled" disabled style="width: 100% !important; background: var(--bg-dark) !important; color: var(--text-muted) !important; border: 1px solid var(--border-color) !important; font-weight: bold;">AGOTADO</button>`;
            } else {
                actionHtml = `
                    <div class="add-to-cart-wrapper" style="display: flex !important; gap: 10px !important; width: 100% !important; margin-top: auto !important;">
                        <div class="qty-selector-card" style="display: flex !important; justify-content: space-between !important; align-items: center !important; background: var(--bg-card) !important; border-radius: 6px !important; border: 1px solid var(--accent) !important; overflow: hidden !important; flex: 1 !important;">
                            <button class="btn-qty-card" onclick="changeCardQty('${inputId}', -1, ${minCompra}, ${limiteRealMaximo})" style="background: var(--accent-light) !important; border: none !important; border-right: 1px solid var(--accent-light) !important; color: var(--accent) !important; font-size: 1.2rem !important; font-weight: bold !important; width: 35px !important; height: 100% !important; cursor: pointer !important; transition: 0.3s !important; display: flex !important; align-items: center !important; justify-content: center !important;">-</button>
                            <input type="number" id="${inputId}" class="qty-num-card" value="${valorInicial}" min="${valorInicial}" max="${limiteRealMaximo}" onchange="validateCardQty(this, ${minCompra}, ${limiteRealMaximo})" style="background: transparent !important; border: none !important; color: var(--text-main) !important; text-align: center !important; font-size: 1rem !important; font-weight: 800 !important; width: 100% !important; outline: none !important; padding: 0 !important; -moz-appearance: textfield !important;">
                            <button class="btn-qty-card" onclick="changeCardQty('${inputId}', 1, ${minCompra}, ${limiteRealMaximo})" style="background: var(--accent-light) !important; border: none !important; border-left: 1px solid var(--accent-light) !important; color: var(--accent) !important; font-size: 1.2rem !important; font-weight: bold !important; width: 35px !important; height: 100% !important; cursor: pointer !important; transition: 0.3s !important; display: flex !important; align-items: center !important; justify-content: center !important;">+</button>
                        </div>
                        <button class="btn-buy btn-add-cart" onclick="addToCartFromCard('${safeName}', ${precioActual}, '${img}', ${stockActual}, '${inputId}', ${minCompra}, ${maxCompra})" style="flex: 2 !important; margin: 0 !important; padding: 12px !important; font-size: 0.85rem !important; font-weight: 800 !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 5px !important; background: var(--accent) !important; color: #fff !important; border: none !important; box-shadow: 0 4px 10px var(--accent-glow) !important;">
                            AÑADIR
                        </button>
                    </div>
                    ${limitesTexto}
                `;
            }

            // --- CONSTRUCCIÓN DE BADGES VISUALES ---
            let badgesHTML = '';
            
            const esFav = p.favorito && (p.favorito.toString().trim().toLowerCase() === 'si' || p.favorito.toString().trim().toUpperCase() === 'X');
            if (esFav) {
                badgesHTML += `<span class="offer-badge" style="background: rgba(234, 179, 8, 0.2); color: #ca8a04; border: 1px solid rgba(234, 179, 8, 0.4); font-weight:bold; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">⭐ DESTACADO</span>`;
            }
            
            // 🔥 BADGE DE CUENTA COMPLETA 🔥
            const esCuentaCompleta = p.cuenta_completa && (p.cuenta_completa.toString().trim().toLowerCase() === 'si' || p.cuenta_completa.toString().trim().toLowerCase() === 'sí');
            if (esCuentaCompleta) {
                badgesHTML += `<span class="offer-badge" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); font-weight:bold; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;"><i class="material-icons-round" style="font-size: 0.8rem; vertical-align: middle;">tv</i> COMPLETA</span>`;
            }

            if (bajoDePrecio) {
                badgesHTML += `<span class="offer-badge" style="background: rgba(16, 185, 129, 0.1); color: #059669; border: 1px solid rgba(16, 185, 129, 0.3); font-weight:bold; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">⬇ OFERTA</span>`;
            } else if (subioDePrecio) {
                badgesHTML += `<span class="offer-badge" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); font-weight:bold; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">⬆ SUBIÓ</span>`;
            }

            const card = document.createElement('div');
            card.className = `product-card ${isSoldOut ? 'sold-out' : ''}`;
            
            card.innerHTML = `
                <div class="card-img-container">
                    <img src="${img}" class="card-img" alt="${p.nombre}" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Sin+Imagen';">
                    ${isSoldOut ? '<div class="sold-out-badge" style="background: rgba(239, 68, 68, 0.9); color: #fff; font-weight:bold;">AGOTADO</div>' : ''}
                </div>
                <div class="card-body">
                    <div class="card-title" style="color: var(--text-main) !important; font-weight: 900 !important; font-size: 1.1rem; margin-bottom: 5px; text-align: center; text-transform: uppercase;">${p.nombre}</div>
                    
                    <div style="margin-bottom: 10px; display: flex; flex-wrap: wrap; justify-content: center; gap: 5px;">${badgesHTML}</div>
                    
                    <div class="price-container" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                        ${mostrarPrecioViejo ? `<span class="price-old" style="color: var(--text-muted); text-decoration: line-through; font-size: 0.9rem;">$ ${new Intl.NumberFormat('es-CO').format(precioAnterior)}</span>` : ''}
                        <div class="card-price" style="color: ${(bajoDePrecio) ? '#059669' : 'var(--accent)'} !important; text-shadow: none; font-size: 1.4rem; font-weight: 900;">$ ${new Intl.NumberFormat('es-CO').format(precioActual)}</div>
                    </div>

                    <div class="card-stock" style="color: var(--text-gray) !important; margin-top: 5px; margin-bottom: 15px; text-align: center;">
                        ${isSoldOut ? '<span style="color:#ef4444; font-weight:800;">SIN STOCK DISPONIBLE</span>' : `Disponibles: <b style="color: var(--text-main);">${stockActual}</b>`}
                    </div>

                    <div style="text-align: center; margin-bottom: 15px; width: 100%;">
                        <button onclick="mostrarDetallesModal('${safeName}', '${safeDesc}')" style="background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.8rem; padding: 6px 15px; border-radius: 8px; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; justify-content: center; gap: 5px; font-weight: 600; width: 100%; box-sizing: border-box;" onmouseover="this.style.borderColor='var(--accent)'; this.style.color='var(--accent)';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.color='var(--text-main)';">
                            <i class="material-icons-round" style="font-size: 1rem;">description</i> Ver T&C
                        </button>
                    </div>
                    
                    ${actionHtml}
                </div>
            `;
            gridContainer.appendChild(card);
        });
        
        container.appendChild(gridContainer);
    };

    // Solo renderizamos la pestaña que el usuario haya seleccionado
    if (currentStoreTab === 'completas') {
        renderGrupo(cuentasCompletas, "Cuentas Completas");
    } else {
        renderGrupo(cuentasPantallas, "Cuentas por Pantallas");
    }
}

/**
 * 2.1 FUNCIONES AUXILIARES DE TARJETAS (CANTIDAD Y MODAL DE DETALLES)
 */
window.changeCardQty = function(inputId, delta, minReq, maxAllowed) {
    const input = document.getElementById(inputId);
    if (!input) return;
    let val = parseInt(input.value) || 1;
    let limitInferior = minReq > 0 ? minReq : 1;

    let newVal = val + delta;
    if (newVal < limitInferior) newVal = limitInferior;
    if (newVal > maxAllowed) {
        newVal = maxAllowed;
        Toast.fire({ icon: 'warning', title: `Límite de stock: ${maxAllowed}` });
    }
    input.value = newVal;
}

window.validateCardQty = function(input, minReq, maxAllowed) {
    if (!input) return;
    let val = parseInt(input.value);
    let limitInferior = minReq > 0 ? minReq : 1;
    
    if (isNaN(val) || val < limitInferior) {
        input.value = limitInferior;
    } else if (val > maxAllowed) {
        input.value = maxAllowed;
        Toast.fire({ icon: 'warning', title: `Límite de stock: ${maxAllowed}` });
    }
}

window.mostrarDetallesModal = function(nombre, detalles) {
    const isDark = document.body.classList.contains('dark-mode');
    
    Swal.fire({
        html: `
            <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 25px; text-align: left;">
                <div style="width: 55px; height: 55px; border-radius: 14px; background: rgba(37, 99, 235, 0.1); display: flex; align-items: center; justify-content: center; border: 1px solid var(--accent); flex-shrink: 0; box-shadow: 0 0 15px var(--accent-glow);">
                    <i class="material-icons-round" style="color:var(--accent); font-size: 2.2rem;">gavel</i>
                </div>
                <div>
                    <h2 style="margin:0; font-size: 1.25rem; font-family: 'Righteous', sans-serif; color: var(--text-main); letter-spacing: 0.5px;">TÉRMINOS Y CONDICIONES</h2>
                    <div style="background: var(--bg-dark); color: var(--text-gray); border: 1px dashed var(--border-color); padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 0.8rem; display: inline-block; margin-top: 6px; font-weight: bold;">
                        ${nombre}
                    </div>
                </div>
            </div>

            <div style="background: var(--bg-dark); border: 1px solid var(--border-color); border-radius: 12px; padding: 25px; text-align: left; position: relative; overflow: hidden; box-shadow: inset 0 2px 10px rgba(0,0,0,0.05);">
                <div style="position: absolute; top: -10px; right: -10px; opacity: 0.03;">
                    <i class="material-icons-round" style="font-size: 7rem;">description</i>
                </div>
                <p style="color: var(--text-muted); font-size: 0.75rem; font-weight: 800; text-transform: uppercase; margin-top: 0; margin-bottom: 12px; letter-spacing: 1px; display: flex; align-items: center; gap: 5px;">
                    <i class="material-icons-round" style="font-size: 1.1rem;">notes</i> Descripción del Servicio
                </p>
                <div style="color: var(--text-main); line-height: 1.7; font-weight: 500; font-size: 1rem; position: relative; z-index: 1; word-break: break-word; white-space: pre-wrap;">
                    ${detalles}
                </div>
            </div>
        `,
        showConfirmButton: true,
        confirmButtonText: '<i class="material-icons-round" style="font-size: 1.2rem; vertical-align: middle; margin-right: 5px;">check_circle</i> ENTENDIDO', 
        confirmButtonColor: 'var(--accent)', 
        background: isDark ? 'var(--bg-card)' : '#ffffff',
        customClass: { popup: 'premium-modal-radius' }
    });
};

window.addToCartFromCard = function(nombre, precio, img, stockReal, inputId, minCompra, maxCompra) {
    const input = document.getElementById(inputId);
    const cantidadSeleccionada = input ? (parseInt(input.value) || 1) : 1;
    
    // Llamamos a la lógica original enviando la cantidad exacta escrita
    addToCart(nombre, precio, img, stockReal, cantidadSeleccionada, minCompra, maxCompra);
    
    // Reiniciamos el input visual al valor mínimo requerido
    if (input) input.value = minCompra > 0 ? minCompra : 1; 
}


/**
 * 3. LÓGICA DEL CARRITO (CANTIDADES DINÁMICAS Y STOCK MÁXIMO)
 */
function addToCart(nombre, precio, img, stockReal, cantidad, minCompra, maxCompra) {
    const existe = cart.find(item => item.nombre === nombre);
    
    let limiteMaximoCombinado = maxCompra > 0 ? Math.min(maxCompra, stockReal) : stockReal;

    if (existe) {
        let nuevaCantidadTotal = existe.cantidad + cantidad;
        
        if (nuevaCantidadTotal <= limiteMaximoCombinado) {
            existe.cantidad = nuevaCantidadTotal;
            Toast.fire({ icon: 'success', title: 'Cantidad actualizada' });
        } else {
            let msg = maxCompra > 0 && maxCompra < stockReal 
                      ? `El límite por pedido es de ${maxCompra} unidades.` 
                      : `Solo hay ${stockReal} unidades en stock.`;
            return Toast.fire({ icon: 'warning', title: 'Límite alcanzado', text: msg });
        }
    } else {
        if (minCompra > 0 && cantidad < minCompra) {
             return Toast.fire({ icon: 'error', title: 'Compra Mínima', text: `Debes pedir al menos ${minCompra} unidades.` });
        }
        if (cantidad > limiteMaximoCombinado) {
            return Toast.fire({ icon: 'error', title: 'Límite Máximo', text: `Solo puedes pedir hasta ${limiteMaximoCombinado} unidades.` });
        }
        
        cart.push({ nombre, precio, img, cantidad: cantidad, stockMax: limiteMaximoCombinado, minCompra: minCompra });
        Toast.fire({ icon: 'success', title: 'Producto añadido' });
    }
    
    if (typeof updateCartUI === 'function') updateCartUI();
}

window.changeQty = function(index, delta) {
    const item = cart[index];
    const nuevaCant = item.cantidad + delta;
    let limitInferior = item.minCompra > 0 ? item.minCompra : 1;

    if (nuevaCant < limitInferior && delta < 0) {
        cart.splice(index, 1);
        Toast.fire({ icon: 'info', title: 'Producto eliminado' });
    } 
    else if (nuevaCant >= limitInferior && nuevaCant <= item.stockMax) {
        item.cantidad = nuevaCant;
    } 
    else if (nuevaCant > item.stockMax) {
        return Toast.fire({ icon: 'info', title: 'Límite alcanzado' });
    }
    
    if (typeof updateCartUI === 'function') updateCartUI();
}

window.setQty = function(index, inputObj) {
    let nuevaCant = parseInt(inputObj.value) || 1;
    const item = cart[index];
    let limitInferior = item.minCompra > 0 ? item.minCompra : 1;

    if (nuevaCant < limitInferior) {
        nuevaCant = limitInferior;
        Toast.fire({ icon: 'info', title: `Compra mínima: ${limitInferior}` });
    }
    if (nuevaCant > item.stockMax) {
        nuevaCant = item.stockMax;
        Toast.fire({ icon: 'info', title: 'Límite máximo alcanzado' });
    }
    
    item.cantidad = nuevaCant;
    if (typeof updateCartUI === 'function') updateCartUI();
}

window.updateCartUI = function() {
    const list = document.getElementById('cart-items-list');
    const badge = document.getElementById('cart-count');
    const totalDisplay = document.getElementById('cart-total-display');
    
    if(!list || !badge || !totalDisplay) return;

    list.innerHTML = "";
    let total = 0;
    let count = 0;

    if(cart.length === 0) {
        list.innerHTML = '<div style="text-align:center; color:var(--text-gray); margin-top:50px; font-weight:bold;">Carrito vacío</div>';
    } else {
        cart.forEach((item, index) => {
            total += item.precio * item.cantidad;
            count += item.cantidad;
            
            list.innerHTML += `
                <div class="cart-item-row-premium" style="display: flex !important; align-items: center !important; gap: 15px !important; padding: 15px 0 !important; border-bottom: 1px solid var(--border-color) !important;">
                    <img src="${item.img}" class="cart-item-img" style="width: 60px !important; height: 60px !important; object-fit: cover !important; border-radius: 4px !important; border: 1px solid var(--border-color) !important;">
                    <div class="cart-item-info" style="flex-grow: 1 !important;">
                        <h4 class="cart-item-title" style="color: var(--text-main) !important; font-size: 0.85rem !important; font-weight: 800 !important; margin-bottom: 5px !important;">${item.nombre}</h4>
                        <div class="cart-item-price" style="color: var(--accent) !important; font-weight: 700 !important; font-size: 0.85rem !important;">$ ${new Intl.NumberFormat('es-CO').format(item.precio)}</div>
                        
                        <div class="qty-selector" style="display: flex !important; align-items: center !important; justify-content: space-between !important; margin-top: 8px !important; background: var(--bg-dark) !important; border-radius: 4px !important; border: 1px solid var(--border-color) !important; overflow: hidden !important; width: 90px !important;">
                            <button class="btn-qty" onclick="changeQty(${index}, -1)" style="background: var(--accent-light) !important; border: none !important; border-right: 1px solid var(--border-color) !important; color: var(--accent) !important; font-size: 1.1rem !important; font-weight: 800 !important; width: 25px !important; height: 25px !important; cursor: pointer !important; display: flex !important; align-items: center !important; justify-content: center !important;">-</button>
                            <input type="number" class="qty-num-input" value="${item.cantidad}" min="${item.minCompra > 0 ? item.minCompra : 1}" max="${item.stockMax}" onchange="setQty(${index}, this)" style="background: transparent !important; border: none !important; color: var(--text-main) !important; font-size: 0.85rem !important; font-weight: bold !important; width: 40px !important; text-align: center !important; -moz-appearance: textfield !important; outline: none !important; padding: 0 !important;">
                            <button class="btn-qty" onclick="changeQty(${index}, 1)" style="background: var(--accent-light) !important; border: none !important; border-left: 1px solid var(--border-color) !important; color: var(--accent) !important; font-size: 1.1rem !important; font-weight: 800 !important; width: 25px !important; height: 25px !important; cursor: pointer !important; display: flex !important; align-items: center !important; justify-content: center !important;">+</button>
                        </div>
                    </div>
                    <button class="btn-remove-item" onclick="removeFromCart(${index})" style="background: none !important; border: none !important; color: var(--danger) !important; cursor: pointer !important; transition: 0.3s !important; padding: 5px !important;">
                        <span class="material-icons-round">close</span>
                    </button>
                </div>
            `;
        });
    }

    badge.innerText = count;
    totalDisplay.innerText = `$ ${new Intl.NumberFormat('es-CO').format(total)}`;
}

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartUI();
}

window.toggleCart = function() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.classList.toggle('open');
    if (overlay) overlay.classList.toggle('hidden');
}

/**
 * 4. PROCESO DE COMPRA Y CHECKOUT PREMIUM
 */
window.goToCheckout = function() {
    if(cart.length === 0) return;
    
    let total = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const summaryList = document.getElementById('checkout-summary-list');
    summaryList.innerHTML = "";
    
    // Última validación
    for(let item of cart) {
        if(item.minCompra > 0 && item.cantidad < item.minCompra) {
            toggleCart(); 
            return Toast.fire({ icon: 'error', title: 'Error en pedido', text: `Debes comprar al menos ${item.minCompra} unidades de ${item.nombre}.` });
        }
    }
    
    cart.forEach(item => {
        summaryList.innerHTML += `
            <div class="checkout-item-premium" style="display: flex !important; justify-content: space-between !important; align-items: center !important; background: var(--bg-card) !important; padding: 12px 15px !important; margin-bottom: 8px !important; border-radius: 6px !important; border-left: 3px solid var(--accent) !important; border-top: 1px solid var(--border-color) !important; border-bottom: 1px solid var(--border-color) !important; border-right: 1px solid var(--border-color) !important; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                <div>
                    <div class="checkout-item-name" style="color: var(--text-main) !important; font-size: 0.85rem !important; font-weight: 800 !important; text-transform: uppercase !important;">${item.nombre}</div>
                    <div class="checkout-item-qty" style="color: var(--text-gray) !important; font-size: 0.7rem !important; font-weight: 600;">Unidades: ${item.cantidad}</div>
                </div>
                <div class="checkout-item-price" style="color: var(--success) !important; font-weight: 900 !important;">$ ${new Intl.NumberFormat('es-CO').format(item.precio * item.cantidad)}</div>
            </div>
        `;
    });

    document.getElementById('checkout-final-total').innerText = `$ ${new Intl.NumberFormat('es-CO').format(total)}`;
    
    toggleCart(); 
    document.getElementById('checkout-overlay').classList.remove('hidden');
    document.getElementById('checkout-modal').classList.add('active');
}

window.closeCheckout = function() {
    document.getElementById('checkout-overlay').classList.add('hidden');
    document.getElementById('checkout-modal').classList.remove('active');
}

function generarOrderId() {
    const ahora = new Date();
    const year = ahora.getFullYear().toString().slice(-2);
    const month = (ahora.getMonth() + 1).toString().padStart(2, '0');
    const day = ahora.getDate().toString().padStart(2, '0');
    const hours = ahora.getHours().toString().padStart(2, '0');
    const minutes = ahora.getMinutes().toString().padStart(2, '0');
    const seconds = ahora.getSeconds().toString().padStart(2, '0');
    const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `ORD-${year}${month}${day}-${hours}${minutes}${seconds}-${rnd}`;
}

window.finalizePurchase = async function() {
    if(typeof userBalance === 'undefined') userBalance = Number(localStorage.getItem('dw_saldo')) || 0;
    
    let total = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    if(userBalance < total) return Toast.fire({ icon: 'error', title: 'Saldo insuficiente' });

    closeCheckout();

    const u = localStorage.getItem('dw_user');
    const t = localStorage.getItem('dw_token');
    const orderId = generarOrderId();
    
    // 🔥 PANTALLA DE CARGA PREMIUM DURANTE EL CHECKOUT
    const isDark = document.body.classList.contains('dark-mode');
    Swal.fire({ 
        title: '<span style="color:var(--text-main); font-family:\'Righteous\', cursive; letter-spacing:1px;">PROCESANDO PEDIDO</span>', 
        html: `
            <div style="margin-top: 10px; color: var(--text-gray); font-weight: 500;">Conectando con la base de datos...</div>
            <div class="spinner" style="margin: 25px auto;"></div>
        `,
        showConfirmButton: false,
        allowOutsideClick: false,
        background: isDark ? 'var(--bg-card)' : '#ffffff', 
        customClass: { container: 'swal-top-layer', popup: 'premium-modal-radius' }
    });

    let errores = [];
    let exitos = 0;
    
    for (const item of cart) {
        for(let i=0; i<item.cantidad; i++) {
            Swal.update({
                html: `
                    <div style="margin-top: 10px; color: var(--text-gray); font-weight: 500;">
                        Activando: <b style="color:var(--accent);">${item.nombre}</b><br>
                        (Unidad ${i + 1} de ${item.cantidad})
                    </div>
                    <div class="spinner" style="margin: 25px auto;"></div>
                `
            });

            try {
                const res = await apiCall({ 
                    accion: 'comprar', 
                    usuario: u, 
                    token: t, 
                    producto: item.nombre,
                    order_id: orderId,
                    precio_pagado: item.precio
                });
                
                if(res.success) { 
                    exitos++; 
                    userBalance = res.nuevoSaldo; 
                    localStorage.setItem('dw_saldo', userBalance);

                    // 🔥 WEBHOOK SILENCIOSO A GOOGLE SHEETS (Formulario Web Anti-Bloqueos)
                    try {
                        let diasExtraidos = 30;
                        const matchDias = item.nombre.match(/(\d+)\s*(dias|meses|días|mes)/i);
                        if(matchDias) {
                            diasExtraidos = matchDias[2].toLowerCase().includes('mes') 
                                            ? parseInt(matchDias[1]) * 30 
                                            : parseInt(matchDias[1]);
                        }
                        
                        // Empacamos los datos como un formulario nativo
                        const params = new URLSearchParams();
                        params.append('accion', 'nueva_compra');
                        params.append('cuenta', res.datos.cuenta);
                        params.append('fecha', new Date().toISOString().replace('T', ' ').substring(0, 10));
                        params.append('dias', diasExtraidos);
                        params.append('servicio', item.nombre);

                        fetch(WEBHOOK_GS_COMPRAS, {
                            method: 'POST',
                            mode: 'no-cors', 
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: params
                        }).catch(()=>{}); // Silenciado
                    } catch(e) {}
                    
                } else { 
                    errores.push(`${item.nombre}: ${res.msg}`); 
                }
            } catch (error) {
                errores.push(`${item.nombre}: Error de conexión`); 
            }
        }
    }

    if(typeof updateBalanceUI === 'function') updateBalanceUI();
    
    if(exitos > 0) {
        cart = []; 
        updateCartUI();
        
        // 🔥 IMPORTANTE: Borramos el caché local para que en la recarga se actualice el stock al instante
        localStorage.removeItem(STORE_CACHE_KEY);
        cargarTienda(); 
        
        if (errores.length > 0) {
             Swal.fire({
                title: '<span style="color:var(--text-main); font-family:\'Righteous\', cursive;">COMPRA PARCIAL</span>',
                text: `Se activaron ${exitos} servicios. Fallaron: ${errores.length}. Generando recibo...`,
                icon: 'warning',
                background: isDark ? 'var(--bg-card)' : '#ffffff', 
                color: isDark ? '#ffffff' : 'var(--text-main)',
                confirmButtonColor: 'var(--accent)',
                customClass: { container: 'swal-top-layer', popup: 'premium-modal-radius' }
            }).then(() => {
                if (typeof abrirFacturaGlobal === 'function') abrirFacturaGlobal(orderId);
            });
        } else {
            Swal.fire({
                icon: 'success',
                title: '<span style="color:var(--success); font-family:\'Righteous\', cursive;">¡PAGO REALIZADO!</span>',
                text: `Se activaron ${exitos} servicios. Generando recibo...`,
                background: isDark ? 'var(--bg-card)' : '#ffffff', 
                color: isDark ? '#ffffff' : 'var(--text-main)',
                confirmButtonColor: 'var(--accent)',
                timer: 2000,
                showConfirmButton: false,
                customClass: { container: 'swal-top-layer', popup: 'premium-modal-radius' }
            }).then(() => {
                if (typeof abrirFacturaGlobal === 'function') abrirFacturaGlobal(orderId);
            });
        }
    } else {
        Swal.fire({ 
            icon: 'error', 
            title: '<span style="color:var(--danger); font-family:\'Righteous\', cursive;">TRANSACCIÓN FALLIDA</span>', 
            text: errores[0] || "Error desconocido",
            background: isDark ? 'var(--bg-card)' : '#ffffff', 
            color: isDark ? '#ffffff' : 'var(--text-main)',
            confirmButtonColor: 'var(--danger)',
            customClass: { container: 'swal-top-layer', popup: 'premium-modal-radius' }
        });
    }
}

// INYECCIÓN DE ESTILOS ADICIONALES PARA LA TIENDA
const tiendaStyles = `
    /* PESTAÑAS DE NAVEGACIÓN */
    .store-tabs-container { grid-column: 1 / -1; display: flex; justify-content: center; gap: 15px; margin: 10px 0 25px 0; }
    .store-tab { background: var(--bg-card); color: var(--text-gray); border: 1px solid var(--border-color); padding: 12px 25px; border-radius: 30px; font-size: 0.9rem; font-weight: 800; cursor: pointer; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; box-shadow: var(--shadow-sm); }
    .store-tab:hover { border-color: var(--accent); color: var(--text-main); }
    .store-tab.active { background: var(--accent-gradient, var(--accent)); color: #fff; border-color: transparent; box-shadow: 0 4px 15px var(--accent-glow); transform: scale(1.05); }

    /* LAYOUT DE GRILLA PARA LAS TARJETAS */
    .store-grid-container {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 20px;
        width: 100%;
    }

    /* TARJETAS PREMIUM */
    .product-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; box-shadow: var(--shadow-sm); transition: transform 0.3s ease, box-shadow 0.3s ease; }
    /* TARJETAS */
    .product-card { height: auto; min-height: 480px; display: flex; flex-direction: column; overflow: hidden; }
    
    /* 🔥 LA LÓGICA DE LA IMAGEN ARREGLADA (COVER PREMIUM) 🔥 */
    .card-img-container { 
        height: 200px; 
        width: 100%; 
        position: relative; 
        background: #111; 
        overflow: hidden; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        border-bottom: none; 
    }
    
    .card-img { 
        width: 100%; 
        height: 100%; 
        object-fit: cover; 
        padding: 0; 
        box-sizing: border-box; 
        transition: transform 0.5s; 
    }
    .product-card:hover .card-img { transform: scale(1.05); }
    
    .card-body { flex-grow: 1; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; }
    .price-old-container { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: -5px; }
    .price-old { text-decoration: line-through; color: var(--text-muted); font-size: 0.8rem; }
    .sold-out-badge { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-15deg); background: rgba(239, 68, 68, 0.95); color: white; padding: 8px 15px; font-weight: 900; border: 2px solid white; z-index: 10; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4); border-radius: 8px; letter-spacing: 1px; }
    .product-card.sold-out { filter: grayscale(0.8); opacity: 0.8; }
    .btn-buy.disabled { border-color: var(--border-color); color: var(--text-muted); background: var(--bg-dark); cursor: not-allowed; box-shadow: none; }

    /* FIX INPUTS NÚMERICOS */
    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button { 
        -webkit-appearance: none; 
        margin: 0; 
    }
    input[type=number] {
        -moz-appearance: textfield;
    }

    .swal-high-priority { z-index: 99999 !important; }
    .swal2-container { z-index: 1000000 !important; }
    .swal-top-layer { z-index: 1000000 !important; }
    
    @media (max-width: 768px) {
        .floating-cart-btn {
            bottom: 20px;
            right: 20px;
            width: 55px;
            height: 55px;
        }
        .store-tabs-container { flex-direction: column; align-items: center; gap: 10px; }
        .store-tab { width: 90%; justify-content: center; }
        .store-grid-container { grid-template-columns: 1fr; }
    }
    .floating-cart-btn.hidden { display: none !important; }
    .cart-drawer:not(.open) { right: -150% !important; display: none !important; }
`;

const styleSheetTienda = document.createElement("style");
styleSheetTienda.innerText = tiendaStyles;
document.head.appendChild(styleSheetTienda);
