/* =================================================================================
   ARCHIVO: tienda.js (LADO CLIENTE)
   Lógica: Renderizado de la tienda, carrito de compras y proceso de Checkout.
================================================================================= */

// 🔥 INYECCIÓN DE ESTILOS PARA TARJETAS JEICOSTREAMING (SE EJECUTA UNA SOLA VEZ) 🔥
if (!document.getElementById('jeico-premium-styles')) {
    const style = document.createElement('style');
    style.id = 'jeico-premium-styles';
    style.innerHTML = `
        /* Variables dinámicas para el borde (Negro en claro, Blanco en oscuro) */
        :root {
            --card-strong-border: #0f172a; /* Negro muy oscuro para modo claro */
            --card-shadow-color: rgba(0, 0, 0, 0.15); /* Sombra suave para modo claro */
        }
        body.dark-mode {
            --card-strong-border: #f8fafc; /* Blanco tiza para modo oscuro */
            --card-shadow-color: rgba(0, 0, 0, 0.6); /* Sombra intensa para modo oscuro */
        }

        /* 1. EL ENVOLTORIO: Aquí va la sombra, fuera del clip-path */
        .jeico-card-wrapper {
            height: 100%;
            filter: drop-shadow(0px 8px 16px var(--card-shadow-color));
            transition: filter 0.3s ease; /* Se eliminó el transform para que la tarjeta no se mueva */
            display: flex;
            flex-direction: column;
        }
        
        /* Efecto al pasar el mouse sobre toda la tarjeta (solo brillo) */
        .jeico-card-wrapper:hover {
            filter: drop-shadow(0px 15px 25px var(--accent-glow, rgba(124, 58, 237, 0.5)));
        }

        /* 2. EL BORDE GRUESO: Este tiene el clip-path y el color dinámico */
        .jeico-card-border {
            background: var(--card-strong-border);
            padding: 3px; /* Borde más grueso para resaltar */
            clip-path: polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px);
            height: 100%;
            transition: background 0.3s ease;
            display: flex;
            flex-direction: column;
        }

        /* Al hacer hover, el borde cambia al color principal (Morado/Acento) */
        .jeico-card-wrapper:hover .jeico-card-border {
            background: var(--accent);
        }

        /* 3. EL FONDO INTERIOR */
        .jeico-card-inner {
            background: var(--bg-card);
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            clip-path: polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px);
        }

        /* 4. LA IMAGEN: Conectada al hover del wrapper */
        .jeico-card-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.9;
            transition: transform 0.5s ease, opacity 0.5s ease;
        }
        
        .jeico-card-wrapper:hover .jeico-card-img {
            transform: scale(1.1); /* Efecto zoom activado desde la tarjeta */
            opacity: 1;
        }

        /* 5. TARJETAS AGOTADAS (Neutralizadas sin hover) */
        .jeico-card-wrapper.is-sold-out {
            filter: grayscale(1) drop-shadow(0px 4px 6px rgba(0,0,0,0.1));
            opacity: 0.75;
        }
        .jeico-card-wrapper.is-sold-out:hover {
            filter: grayscale(1) drop-shadow(0px 4px 6px rgba(0,0,0,0.1)); /* Mantiene la sombra estática */
        }
        .jeico-card-wrapper.is-sold-out:hover .jeico-card-border {
            background: var(--card-strong-border); /* Mantiene el borde gris/muerto */
        }
        .jeico-card-wrapper.is-sold-out:hover .jeico-card-img {
            transform: scale(1); /* Desactiva el zoom de la imagen */
            opacity: 0.9; /* Mantiene la opacidad original */
        }
    `;
    document.head.appendChild(style);
}

const STORE_CACHE_KEY = "dw_store_cache";
const CACHE_TTL_MS = 60 * 60 * 1000; // 🔥 1 HORA EN MILISEGUNDOS

if (typeof cart === 'undefined') {
    var cart = [];
}

// Variables globales para el manejo de las pestañas y buscador
let lastProductos = [];
let currentStoreTab = 'pantallas'; // Pestaña por defecto
let currentSearchTerm = ''; // Termino de búsqueda actual
let pagoModoTokens = false; // 🪙 false = dinero | true = tokens

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

// --- CONFIGURACIÓN DE NOTIFICACIONES (CON FIX DE Z-INDEX) ---
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    background: '#0a0a0a',
    color: '#fff',
    iconColor: '#7c3aed',
    customClass: {
        container: 'swal-high-priority'
    }
});

// 🔥 LA MAGIA: Función que convierte enlaces de Drive a un formato sin bloqueos
function convertirAThumbnail(url) {
    if (!url || url.trim() === "") return "";
    
    // Si es un link de Google Drive, usamos el CDN de lh3 para evitar error 403 o descargas forzadas
    if (url.includes("uc?export=view&id=")) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const fileId = urlParams.get('id');
        if (fileId) {
            return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
        }
    }
    
    // Mantener local si no es http
    if (!url.startsWith("http") && !url.startsWith("data:")) {
        return `${API_BASE_URL_CLIENTE}/uploads/categorias/${url}`;
    }
    return url;
}

/**
 * 1. CARGA INICIAL Y SINCRONIZACIÓN MIXTA (STALE-WHILE-REVALIDATE)
 */
async function cargarTienda(silencioso = false) {
    const container = document.getElementById('shop-container');
    if (!container) return;

    const cachedData = localStorage.getItem(STORE_CACHE_KEY);
    let useCachedStatic = false;
    let cachedProducts = [];
    let timestampAntiguo = new Date().getTime();

    if (cachedData) {
        try {
            const data = JSON.parse(cachedData);
            timestampAntiguo = data.timestamp;
            const tiempoPasado = new Date().getTime() - timestampAntiguo;

            if (tiempoPasado < CACHE_TTL_MS) {
                useCachedStatic = true;
                cachedProducts = data.productos;
            }

            if (!silencioso) {
                window.userBalance = Number(localStorage.getItem('dw_saldo')) || 0;
                if (typeof updateBalanceUI === 'function') updateBalanceUI();
                
                const nombreInicio = document.getElementById('inicio-user-name-display');
                const saldoInicio = document.getElementById('inicio-user-balance-display');
                if (nombreInicio) nombreInicio.innerText = localStorage.getItem('dw_user') || 'Cliente';
                if (saldoInicio) saldoInicio.innerText = '$ ' + new Intl.NumberFormat('es-CO').format(window.userBalance || 0);

                renderizarTiendaPremium(data.productos, false);
            }
        } catch (e) {
            console.warn("Caché corrupto, ignorando.");
            if (!silencioso) container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px;"><div class="spinner"></div></div>';
        }
    } else {
        if (!silencioso) container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px;"><div class="spinner"></div></div>';
    }

    const u = localStorage.getItem('dw_user');
    const t = localStorage.getItem('dw_token');

    try {
        const res = await apiCall({ accion: 'getTienda', usuario: u, token: t });

        if (res && res.success) {
            window.userBalance = Number(res.saldo);
            localStorage.setItem('dw_saldo', window.userBalance);

            // 🪙 Guardar y actualizar saldo de tokens
            if (res.token_saldo !== undefined) {
                window.userTokenSaldo = parseInt(res.token_saldo) || 0;
                localStorage.setItem('dw_token_saldo', window.userTokenSaldo);
                if (typeof actualizarTokenSaldoLocal === 'function') actualizarTokenSaldoLocal(window.userTokenSaldo);
            }

            if (typeof updateBalanceUI === 'function') updateBalanceUI();

            const nombreInicio = document.getElementById('inicio-user-name-display');
            const saldoInicio = document.getElementById('inicio-user-balance-display');
            if (nombreInicio) nombreInicio.innerText = localStorage.getItem('dw_user') || 'Cliente';
            if (saldoInicio) saldoInicio.innerText = '$ ' + new Intl.NumberFormat('es-CO').format(window.userBalance || 0);

            let finalProducts = res.productos;

            if (useCachedStatic) {
                finalProducts = res.productos.map(freshProd => {
                    const cachedProd = cachedProducts.find(p => p.nombre === freshProd.nombre);
                    if (cachedProd) {
                        return {
                            ...freshProd,
                            img: cachedProd.img,
                            descripcion: cachedProd.descripcion,
                            cuenta_completa: cachedProd.cuenta_completa,
                            favorito: cachedProd.favorito,
                            minimo_compra: cachedProd.minimo_compra,
                            maximo_compra: cachedProd.maximo_compra,
                            oculto: cachedProd.oculto
                        };
                    }
                    return freshProd;
                });
            }

            localStorage.setItem(STORE_CACHE_KEY, JSON.stringify({
                productos: finalProducts,
                timestamp: useCachedStatic ? timestampAntiguo : new Date().getTime()
            }));

            if (currentSearchTerm === '') {
                lastProductos = finalProducts.filter(p => !(p.oculto && (p.oculto.toString().trim().toLowerCase() === 'si' || p.oculto.toString().trim().toLowerCase() === 'sí')));
            }
            renderizarTiendaPremium(finalProducts, false);
        } else {
            if (res && res.msg === "Sesión inválida") {
                if (typeof logout === 'function') logout();
            }
        }
    } catch (e) {
        console.error("Error de sincronización silenciosa:", e);
    }
}

window.switchStoreTab = function (tabId) {
    currentStoreTab = tabId;
    renderizarTiendaPremium(lastProductos, false);
}

window.filtrarTienda = function(termino) {
    currentSearchTerm = termino.toLowerCase();
    renderizarTiendaPremium(lastProductos, false);
}

/**
 * 2. RENDERIZADOR DISEÑO GAMER (AMIGABLE Y CLARO/OSCURO)
 */
function renderizarTiendaPremium(productosDB, isCache) {
    const container = document.getElementById('shop-container');
    if (!container) return;

    // 🔥 GUARDAR ESTADO DE FOCO DEL BUSCADOR ANTES DE RE-RENDERIZAR 🔥
    let focusData = { isFocused: false, start: 0, end: 0 };
    const activeEl = document.activeElement;
    if (activeEl && activeEl.tagName === 'INPUT' && activeEl.placeholder.includes("Buscar plataforma")) {
        focusData.isFocused = true;
        focusData.start = activeEl.selectionStart || 0;
        focusData.end = activeEl.selectionEnd || 0;
    }

    const tempContainer = document.createElement('div');
    tempContainer.style.display = 'contents';

    if (!productosDB || productosDB.length === 0) {
        container.innerHTML = "<p style='grid-column: 1/-1; text-align:center; color:var(--text-gray); padding:50px; font-weight: bold;'>Catálogo vacío actualmente.</p>";
        return;
    }

    let productosValidos = productosDB;
    if (productosDB.length > 0 && productosDB[0].hasOwnProperty('oculto')) {
        productosValidos = productosDB.filter(p => {
            const isOculto = p.oculto && (p.oculto.toString().trim().toLowerCase() === 'si' || p.oculto.toString().trim().toLowerCase() === 'sí');
            return !isOculto;
        });
        if (productosDB.length !== lastProductos.length && currentSearchTerm === '') {
             lastProductos = productosValidos;
        }
    }

    let isSearching = currentSearchTerm !== '';

    // Aplicar filtro global si hay búsqueda
    if (isSearching) {
        productosValidos = productosValidos.filter(p => 
            p.nombre.toLowerCase().includes(currentSearchTerm) || 
            (p.descripcion && p.descripcion.toLowerCase().includes(currentSearchTerm))
        );
    }

    // 1. BARRA SUPERIOR UNIFICADA: Pestañas + Buscador lado a lado
    const topBar = document.createElement('div');
    topBar.style.cssText = 'grid-column: 1 / -1 !important; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 25px; width: 100%;';
    
    topBar.innerHTML = `
        <div class="store-tabs-container" style="display: flex; gap: 10px; margin: 0; flex-wrap: wrap;">
            <button class="store-tab ${currentStoreTab === 'pantallas' ? 'active' : ''}" onclick="switchStoreTab('pantallas')" style="border-radius: 0; clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px); text-transform: uppercase; font-weight: 800; letter-spacing: 1px;"><i class="material-icons-round" style="font-size:1.2rem; vertical-align: middle;">devices</i> Por Pantallas</button>
            <button class="store-tab ${currentStoreTab === 'completas' ? 'active' : ''}" onclick="switchStoreTab('completas')" style="border-radius: 0; clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px); text-transform: uppercase; font-weight: 800; letter-spacing: 1px;"><i class="material-icons-round" style="font-size:1.2rem; vertical-align: middle;">tv</i> Cuentas Completas</button>
        </div>

        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; flex-grow:1; justify-content:flex-end;">

            <!-- 🪙 TOGGLE PAGO -->
            <button id="store-pay-toggle"
                onclick="togglePagoModo()"
                style="display:flex; align-items:center; gap:7px; padding:10px 16px;
                       border-radius:0; font-weight:800; font-size:.78rem; letter-spacing:.5px;
                       cursor:pointer; transition:.25s; white-space:nowrap; flex-shrink:0;
                       clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
                       border: 2px solid ${pagoModoTokens ? '#f59e0b' : 'var(--accent)'};
                       background: ${pagoModoTokens ? 'rgba(245,158,11,.12)' : 'rgba(124,58,237,.12)'};
                       color: ${pagoModoTokens ? '#f59e0b' : 'var(--accent-text)'};
                       box-shadow: ${pagoModoTokens ? '0 0 12px rgba(245,158,11,.25)' : '0 0 12px rgba(124,58,237,.15)'}">
                <i class="material-icons-round" style="font-size:1.1rem;">${pagoModoTokens ? 'toll' : 'attach_money'}</i>
                ${pagoModoTokens ? '🪙 TOKENS' : '💵 DINERO'}
                <i class="material-icons-round" style="font-size:.9rem; opacity:.7;">swap_horiz</i>
            </button>

            <!-- Buscador -->
            <div style="position: relative; flex-grow: 1; max-width: 380px; min-width: 200px;">
                <i class="material-icons-round" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: var(--text-gray); font-size: 1.4rem; pointer-events: none;">search</i>
                <input type="text" placeholder="Buscar plataforma o servicio..." value="${currentSearchTerm}"
                    style="width: 100%; padding: 12px 20px 12px 45px; border-radius: 0; border: 2px solid var(--border-color); background: var(--bg-card); color: var(--text-white); font-size: 0.93rem; font-weight: 600; outline: none; transition: 0.3s; box-shadow: inset 0 2px 5px rgba(0,0,0,0.05); clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);"
                    oninput="filtrarTienda(this.value)"
                    onfocus="this.style.borderColor='var(--accent)'; this.style.boxShadow='0 5px 15px var(--accent-glow)';"
                    onblur="this.style.borderColor='var(--border-color)'; this.style.boxShadow='inset 0 2px 5px rgba(0,0,0,0.05)';">
                ${currentSearchTerm ? `<i class="material-icons-round" onclick="filtrarTienda('');" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: var(--danger); font-size: 1.2rem; cursor: pointer;">close</i>` : ''}
            </div>
        </div>
    `;
    tempContainer.appendChild(topBar);

    // Si la búsqueda no arroja resultados
    if (productosValidos.length === 0) {
        const noResults = document.createElement('p');
        noResults.style.cssText = 'grid-column: 1/-1 !important; text-align:center; color:var(--text-gray); padding:50px; font-weight:800; font-size: 1.1rem;';
        noResults.innerHTML = isSearching ? `No encontramos resultados para "${currentSearchTerm}"` : "No hay servicios disponibles en este momento.";
        tempContainer.appendChild(noResults);
        container.innerHTML = tempContainer.innerHTML;
        
        const searchInput = container.querySelector('input[type="text"]');
        if (searchInput && isSearching) { searchInput.focus(); const val = searchInput.value; searchInput.value = ''; searchInput.value = val; }
        return;
    }

    const ordenarGrupo = (grupo) => {
        return grupo.sort((a, b) => {
            const stockA = Number(a.stock) || 0;
            const minA = Number(a.minimo_compra) || 0;
            const isAgotadoA = stockA <= 0 || (minA > stockA) ? 1 : 0;
            const stockB = Number(b.stock) || 0;
            const minB = Number(b.minimo_compra) || 0;
            const isAgotadoB = stockB <= 0 || (minB > stockB) ? 1 : 0;
            if (isAgotadoA !== isAgotadoB) return isAgotadoA - isAgotadoB;
            const aFav = (a.favorito && (a.favorito.toString().trim().toLowerCase() === 'si' || a.favorito.toString().trim().toUpperCase() === 'X')) ? 1 : 0;
            const bFav = (b.favorito && (b.favorito.toString().trim().toLowerCase() === 'si' || b.favorito.toString().trim().toUpperCase() === 'X')) ? 1 : 0;
            if (aFav !== bFav) return bFav - aFav;
            return a.nombre.localeCompare(b.nombre);
        });
    };

    const renderGrupo = (grupo, titulo) => {
        const gridContainer = document.createElement('div');
        gridContainer.style.cssText = `
            grid-column: 1 / -1 !important;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 25px;
            width: 100%;
            padding-bottom: 40px;
        `;

        if (grupo.length === 0 && !isSearching) {
            gridContainer.innerHTML = `<p style='grid-column: 1/-1; text-align:center; color:var(--text-gray); padding: 30px; width: 100%; font-weight: bold;'>No hay ${titulo.toLowerCase()} disponibles en este momento.</p>`;
            tempContainer.appendChild(gridContainer);
            return;
        }

        const usuarioLogueado = localStorage.getItem('dw_user');

        grupo.forEach((p, index) => {
            let img = p.img ? convertirAThumbnail(p.img) : '';
            const stockActual = Number(p.stock) || 0;
            let precioActual = Number(p.precio) || 0;
            const precioAnterior = Number(p.precioAnt) || 0;
            const safeName = escapeHTML(p.nombre).replace(/'/g, "\\'");
            const safeDesc = escapeHTML(p.descripcion || 'Sin descripción adicional.').replace(/\r?\n/g, '<br>').replace(/'/g, "\\'");

            let tienePrecioEspecial = false;
            if (p.precios_especiales && usuarioLogueado) {
                const reglasPrecios = p.precios_especiales.split(',');
                for (let regla of reglasPrecios) {
                    const partes = regla.split(':');
                    if (partes.length === 2 && partes[0].trim() === usuarioLogueado) {
                        precioActual = Number(partes[1].trim());
                        tienePrecioEspecial = true;
                        break;
                    }
                }
            }

            let mostrarPrecioViejo = false;
            if (!tienePrecioEspecial) {
                mostrarPrecioViejo = precioAnterior > 0 && precioAnterior !== precioActual;
            }

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
                limitesTexto = `<div style="font-size: 0.75rem; color: var(--accent-text); font-weight: 800; margin-top: 4px;">${txtMin}${sep}${txtMax}</div>`;
            }

            const inputId = `qty-card-${titulo.replace(/\s/g, '')}-${safeName.replace(/\s/g, '')}-${index}`;

            // 🔥 BOTONES INTERACTIVOS
            if (isCache) {
                actionHtml = `<button style="width:100%; background:var(--bg-dark); color:var(--text-gray); border:2px solid var(--border-color); padding:12px; font-weight:800; clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px);" disabled>CARGANDO...</button>`;
            } else if (isSoldOut) {
                actionHtml = `<button disabled style="width:100%; background:var(--bg-dark); color:var(--text-gray); border:2px solid var(--border-color); padding:12px; font-weight:900; clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px); letter-spacing:1px;">AGOTADO</button>`;
            } else if (pagoModoTokens) {

                // Modo tokens: botón de compra directa con tokens
                const tkSaldo = window.userTokenSaldo || parseInt(localStorage.getItem('dw_token_saldo')) || 0;
                const pkTokens = (p.precio_tokens || 0) * valorInicial;
                const sinPrecio = !p.precio_tokens || p.precio_tokens <= 0;
                const sinSaldo  = tkSaldo < pkTokens;
                actionHtml = `
                    <div style="display: flex; gap: 8px; margin-top: 15px;">
                        <div style="display: flex; background: var(--bg-dark); clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); border: 2px solid var(--border-color); overflow:hidden; transition: 0.2s;" onmouseover="this.style.borderColor='#f59e0b';" onmouseout="this.style.borderColor='var(--border-color)';">
                            <button onclick="changeCardQty('${inputId}', -1, ${minCompra}, ${limiteRealMaximo})" style="background: transparent; color: var(--text-white); border: none; width: 35px; height: 38px; cursor: pointer; font-size: 1.4rem; font-weight: 900; transition: 0.2s;" onmouseover="this.style.background='#f59e0b'; this.style.color='#000';" onmouseout="this.style.background='transparent'; this.style.color='var(--text-white)';">-</button>
                            <input type="number" id="${inputId}" value="${valorInicial}" min="${valorInicial}" max="${limiteRealMaximo}" onchange="validateCardQty(this, ${minCompra}, ${limiteRealMaximo})" style="width: 40px; text-align: center; background: transparent; border: none; border-left: 2px solid var(--border-color); border-right: 2px solid var(--border-color); color: var(--text-white); font-weight: 800; outline: none; -moz-appearance: textfield; font-size: 1rem;">
                            <button onclick="changeCardQty('${inputId}', 1, ${minCompra}, ${limiteRealMaximo})" style="background: transparent; color: var(--text-white); border: none; width: 35px; height: 38px; cursor: pointer; font-size: 1.2rem; font-weight: 900; transition: 0.2s;" onmouseover="this.style.background='#f59e0b'; this.style.color='#000';" onmouseout="this.style.background='transparent'; this.style.color='var(--text-white)';">+</button>
                        </div>
                        <button
                            ${sinPrecio || sinSaldo ? 'disabled' : ''}
                            onclick="comprarDirectoConTokens('${safeName}', '${inputId}', ${p.precio_tokens || 0})"
                            style="flex-grow:1; background:${sinPrecio || sinSaldo ? 'var(--bg-dark)' : 'linear-gradient(135deg,#f59e0b,#d97706)'};
                                   color:${sinPrecio || sinSaldo ? 'var(--text-gray)' : '#000'};
                                   border:none; height:42px; cursor:${sinPrecio || sinSaldo ? 'not-allowed':'pointer'};
                                   display:flex; align-items:center; justify-content:center; gap:6px;
                                   font-weight:900; letter-spacing:1px; text-transform:uppercase;
                                   clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px);
                                   transition:.3s; font-size:.78rem;">
                            <i class="material-icons-round" style="font-size:1.1rem;">toll</i>
                            ${sinPrecio ? 'SIN PRECIO TK' : sinSaldo ? 'TK INSUF.' : new Intl.NumberFormat('es-CO').format(pkTokens)+' TK'}
                        </button>
                    </div>
                `;
            } else {
                actionHtml = `
                    <div style="display: flex; gap: 8px; margin-top: 15px;">
                        <div style="display: flex; background: var(--bg-dark); clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); border: 2px solid var(--border-color); overflow:hidden; transition: 0.2s;" onmouseover="this.style.borderColor='var(--accent)';" onmouseout="this.style.borderColor='var(--border-color)';">
                            <button onclick="changeCardQty('${inputId}', -1, ${minCompra}, ${limiteRealMaximo})" style="background: transparent; color: var(--text-white); border: none; width: 35px; height: 38px; cursor: pointer; font-size: 1.4rem; font-weight: 900; transition: 0.2s;" onmouseover="this.style.background='var(--accent)'; this.style.color='#fff';" onmouseout="this.style.background='transparent'; this.style.color='var(--text-white)';">-</button>
                            <input type="number" id="${inputId}" value="${valorInicial}" min="${valorInicial}" max="${limiteRealMaximo}" onchange="validateCardQty(this, ${minCompra}, ${limiteRealMaximo})" style="width: 40px; text-align: center; background: transparent; border: none; border-left: 2px solid var(--border-color); border-right: 2px solid var(--border-color); color: var(--text-white); font-weight: 800; outline: none; -moz-appearance: textfield; font-size: 1rem;">
                            <button onclick="changeCardQty('${inputId}', 1, ${minCompra}, ${limiteRealMaximo})" style="background: transparent; color: var(--text-white); border: none; width: 35px; height: 38px; cursor: pointer; font-size: 1.2rem; font-weight: 900; transition: 0.2s;" onmouseover="this.style.background='var(--accent)'; this.style.color='#fff';" onmouseout="this.style.background='transparent'; this.style.color='var(--text-white)';">+</button>
                        </div>
                        
                        <button onclick="addToCartFromCard('${safeName}', ${precioActual}, '${img}', ${stockActual}, '${inputId}', ${minCompra}, ${maxCompra}, ${p.precio_tokens || 0})" style="flex-grow: 1; background: var(--accent-gradient); color: #fff; border: none; height: 42px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); transition: 0.3s; box-shadow: 0 4px 10px var(--accent-glow);" onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='translateY(0)';">
                            <i class="material-icons-round" style="font-size: 1.2rem;">shopping_cart</i> AÑADIR
                        </button>
                    </div>
                `;
            }


            // SOLO Etiqueta de Cuenta Completa
            let badgesHTML = '';
            const esCuentaCompleta = p.cuenta_completa && (p.cuenta_completa.toString().trim().toLowerCase() === 'si' || p.cuenta_completa.toString().trim().toLowerCase() === 'sí');
            
            if (esCuentaCompleta) {
                badgesHTML += `<div style="background: #3b82f6; color: #fff; font-size: 0.65rem; font-weight: 900; padding: 4px 10px; clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px); margin-bottom: 6px; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"><i class="material-icons-round" style="font-size: 0.8rem;">tv</i> COMPLETA</div><br>`;
            }

            // 🔥 ESTRUCTURA DE LA TARJETA MEJORADA (Jeicostreaming Style) 🔥
            const cardWrapper = document.createElement('div');
            cardWrapper.className = `jeico-card-wrapper ${isSoldOut ? 'is-sold-out' : ''}`;
            
            cardWrapper.innerHTML = `
                <div class="jeico-card-border">
                    <div class="jeico-card-inner">
                        
                        <div style="position: relative; width: 100%; height: 160px; background: var(--bg-dark); overflow: hidden;">
                            <img src="${img}" class="jeico-card-img">
                            
                            <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 50px; background: linear-gradient(to top, var(--bg-card) 0%, transparent 100%);"></div>
                            
                            <div style="position: absolute; top: -5px; left: -25px; width: 50px; height: 10px; background: var(--accent); transform: rotate(-45deg); z-index: 2;"></div>
                            
                            <button onclick="mostrarDetallesModal('${safeName}', '${safeDesc}')" style="position: absolute; top: 10px; right: 10px; background: var(--bg-dark); border: 2px solid var(--border-color); color: var(--text-white); border-radius: 0; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px); transition: 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.1); z-index: 3;" onmouseover="this.style.background='var(--accent)'; this.style.borderColor='var(--accent)'; this.style.color='#fff';" onmouseout="this.style.background='var(--bg-dark)'; this.style.borderColor='var(--border-color)'; this.style.color='var(--text-white)';">
                                <i class="material-icons-round" style="font-size: 1.2rem;">info</i>
                            </button>

                            <div style="position: absolute; bottom: 10px; left: 15px; z-index: 2;">
                                ${badgesHTML}
                            </div>
                            
                            ${isSoldOut ? '<div style="position:absolute; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:900; letter-spacing:2px; font-size:1.4rem; z-index: 3;">AGOTADO</div>' : ''}
                        </div>

                        <div style="padding: 20px; display: flex; flex-direction: column; flex-grow: 1;">
                            <h3 style="margin: 0 0 12px 0; font-size: 1.15rem; color: var(--text-white); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">${escapeHTML(p.nombre)}</h3>

                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
                                ${pagoModoTokens && p.precio_tokens > 0
                                    ? `<span style="color:#f59e0b; font-size:1.5rem; font-weight:900;">🪙 ${new Intl.NumberFormat('es-CO').format(p.precio_tokens)} TK</span>`
                                    : `<span style="color: var(--accent-text); font-size: 1.5rem; font-weight: 900;">$ ${new Intl.NumberFormat('es-CO').format(precioActual)}</span>
                                       ${mostrarPrecioViejo ? `<span style="text-decoration: line-through; color: var(--text-gray); font-size: 0.9rem; font-weight: 600;">$ ${new Intl.NumberFormat('es-CO').format(precioAnterior)}</span>` : ''}`
                                }
                            </div>

                            <div style="background: var(--bg-dark); border-left: 3px solid ${isSoldOut ? 'var(--text-gray)' : (pagoModoTokens ? '#f59e0b' : 'var(--accent)')}; padding: 8px 12px; color: var(--text-gray); font-size: 0.8rem; border-radius: 0 8px 8px 0;">
                                ${isSoldOut ? '<span style="font-weight:800;">Estado: AGOTADO</span>' : `Stock Disponible: <span style="color:var(--text-white); font-weight:900; font-size:0.9rem;">${stockActual}</span>`}
                                ${limitesTexto}
                            </div>
                            ${(!isSoldOut && !pagoModoTokens && p.tokens_otorgados > 0) ? `
                            <div style="margin-top:8px; background:rgba(245,158,11,.08); border:1px solid rgba(245,158,11,.2); border-radius:6px; padding:5px 10px; font-size:.72rem; font-weight:800; color:#f59e0b; display:flex; align-items:center; gap:5px;">
                                <i class="material-icons-round" style="font-size:.9rem;">toll</i>
                                +${new Intl.NumberFormat('es-CO').format(p.tokens_otorgados)} TK cashback
                            </div>` : ''}

                            <div style="margin-top: auto; position: relative; z-index: 5;">
                                ${actionHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            gridContainer.appendChild(cardWrapper);
        });

        tempContainer.appendChild(gridContainer);
    };

    // 🔥 LA MAGIA DEL FILTRO GLOBAL OCURRE AQUÍ 🔥
    if (isSearching) {
        // SI ESTÁ BUSCANDO: Ignoramos las pestañas y mostramos TODO mezclado
        ordenarGrupo(productosValidos);
        renderGrupo(productosValidos, "Resultados de búsqueda");
    } else {
        // SI NO ESTÁ BUSCANDO: Separamos por pestañas normalmente
        const cuentasCompletas = [];
        const cuentasPantallas = [];
        
        productosValidos.forEach(p => {
            const esCompleta = p.cuenta_completa && (p.cuenta_completa.toString().trim().toLowerCase() === 'si' || p.cuenta_completa.toString().trim().toLowerCase() === 'sí');
            if (esCompleta) cuentasCompletas.push(p);
            else cuentasPantallas.push(p);
        });

        ordenarGrupo(cuentasCompletas);
        ordenarGrupo(cuentasPantallas);
        
        if (currentStoreTab === 'completas') {
            renderGrupo(cuentasCompletas, "Cuentas Completas");
        } else {
            renderGrupo(cuentasPantallas, "Cuentas por Pantallas");
        }
    }

    container.innerHTML = tempContainer.innerHTML;
    
    // 🔥 RESTAURAR EL FOCO Y EL CURSOR EXACTO AL BUSCADOR 🔥
    if (focusData.isFocused) {
        const searchInput = container.querySelector('input[type="text"]');
        if (searchInput) {
            searchInput.focus();
            try {
                searchInput.setSelectionRange(focusData.start, focusData.end);
            } catch(e) {}
        }
    }
}

/**
 * 2.1 FUNCIONES AUXILIARES DE TARJETAS (CANTIDAD Y MODAL DE DETALLES)
 */
window.changeCardQty = function (inputId, delta, minReq, maxAllowed) {
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

window.validateCardQty = function (input, minReq, maxAllowed) {
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

window.mostrarDetallesModal = function (nombre, detalles) {
    const isDark = document.body.classList.contains('dark-mode');

    Swal.fire({
        html: `
            <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 25px; text-align: left;">
                <div style="width: 55px; height: 55px; background: var(--bg-dark); display: flex; align-items: center; justify-content: center; border: 2px solid var(--accent); flex-shrink: 0; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);">
                    <i class="material-icons-round" style="color:var(--accent); font-size: 2.2rem;">description</i>
                </div>
                <div>
                    <h2 style="margin:0; font-size: 1.15rem; font-weight: 800; color: var(--text-white); letter-spacing: 0.5px; text-transform: uppercase;">Términos y Condiciones</h2>
                    <div style="background: var(--bg-dark); color: var(--accent-text); border: 1px solid var(--border-color); padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; display: inline-block; margin-top: 6px; font-weight: bold;">
                        ${nombre}
                    </div>
                </div>
            </div>

            <div style="background: var(--bg-dark); border: 2px solid var(--border-color); padding: 25px; text-align: left; position: relative; overflow: hidden; clip-path: polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px);">
                <p style="color: var(--text-gray); font-size: 0.75rem; font-weight: 800; text-transform: uppercase; margin-top: 0; margin-bottom: 15px; letter-spacing: 1px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                    <i class="material-icons-round" style="font-size: 1rem; vertical-align: middle;">info</i> Descripción del Servicio
                </p>
                <div style="color: var(--text-white); line-height: 1.6; font-weight: 500; font-size: 0.95rem; position: relative; z-index: 1; word-break: break-word; white-space: pre-wrap;">${detalles}</div>
            </div>
        `,
        showConfirmButton: true,
        confirmButtonText: '<i class="material-icons-round" style="font-size: 1.2rem; vertical-align: middle; margin-right: 5px;">check</i> ENTENDIDO',
        confirmButtonColor: 'var(--accent)',
        background: isDark ? 'var(--bg-card)' : '#ffffff',
        customClass: { popup: 'cyber-modal-style' }
    });
};

window.addToCartFromCard = function (nombre, precio, img, stockReal, inputId, minCompra, maxCompra, precioTokens = 0) {
    const input = document.getElementById(inputId);
    const cantidadSeleccionada = input ? (parseInt(input.value) || 1) : 1;

    const btnClicked = event.currentTarget;
    const textoOriginal = btnClicked.innerHTML;

    addToCart(nombre, precio, img, stockReal, cantidadSeleccionada, minCompra, maxCompra, precioTokens);
    if (input) input.value = minCompra > 0 ? minCompra : 1;

    // --- EFECTO VISUAL DE COMPRA ---
    btnClicked.style.background = 'var(--success)';
    btnClicked.style.color = '#fff';
    btnClicked.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)';
    btnClicked.innerHTML = '<i class="material-icons-round" style="font-size: 1.2rem; margin-right: 5px;">check_circle</i> AÑADIDO';

    setTimeout(() => {
        btnClicked.style.background = 'var(--accent-gradient)';
        btnClicked.style.color = '#fff';
        btnClicked.style.boxShadow = '0 4px 10px var(--accent-glow)';
        btnClicked.innerHTML = textoOriginal;
    }, 1500);
}

/**
 * 3. LÓGICA DEL CARRITO 
 */
function addToCart(nombre, precio, img, stockReal, cantidad, minCompra, maxCompra, precioTokens = 0) {
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
        cart.push({ nombre, precio, img, cantidad, stockMax: limiteMaximoCombinado, minCompra, precio_tokens: precioTokens });
        Toast.fire({ icon: 'success', title: 'Producto añadido' });
    }
    if (typeof updateCartUI === 'function') updateCartUI();
}

window.changeQty = function (index, delta) {
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

window.setQty = function (index, inputObj) {
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

window.updateCartUI = function () {
    const list = document.getElementById('cart-items-list');
    const badge = document.getElementById('cart-count');
    const totalDisplay = document.getElementById('cart-total-display');

    if (!list || !badge || !totalDisplay) return;

    let total = 0;
    let count = 0;

    if (cart.length === 0) {
        list.innerHTML = '<div style="text-align:center; color:var(--text-gray); margin-top:50px; font-weight:bold;">El carrito está vacío</div>';
    } else {
        const htmlString = cart.map((item, index) => {
            total += item.precio * item.cantidad;
            count += item.cantidad;

            return `
                <div class="cart-item-row-premium" style="display: flex !important; align-items: center !important; gap: 15px !important; padding: 15px 0 !important; border-bottom: 1px dashed var(--border-color) !important;">
                    <img src="${item.img}" class="cart-item-img" style="width: 60px !important; height: 60px !important; object-fit: cover !important; border: 2px solid var(--border-color) !important; clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);">
                    <div class="cart-item-info" style="flex-grow: 1 !important;">
                        <h4 class="cart-item-title" style="color: var(--text-white) !important; font-size: 0.85rem !important; font-weight: 800 !important; margin-bottom: 5px !important; text-transform: uppercase;">${escapeHTML(item.nombre)}</h4>
                        <div class="cart-item-price" style="color: var(--accent-text) !important; font-weight: 800 !important; font-size: 0.9rem !important;">$ ${new Intl.NumberFormat('es-CO').format(item.precio)}</div>
                        
                        <div class="qty-selector" style="display: flex !important; align-items: center !important; justify-content: space-between !important; margin-top: 8px !important; background: var(--bg-dark) !important; border: 1px solid var(--border-color) !important; overflow: hidden !important; width: 90px !important; clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);">
                            <button class="btn-qty" onclick="changeQty(${index}, -1)" style="background: transparent !important; border: none !important; border-right: 1px solid var(--border-color) !important; color: var(--text-white) !important; font-size: 1.1rem !important; font-weight: 900 !important; width: 28px !important; height: 28px !important; cursor: pointer !important;">-</button>
                            <input type="number" class="qty-num-input" value="${item.cantidad}" min="${item.minCompra > 0 ? item.minCompra : 1}" max="${item.stockMax}" onchange="setQty(${index}, this)" style="background: transparent !important; border: none !important; color: var(--text-white) !important; font-size: 0.85rem !important; font-weight: bold !important; width: 34px !important; text-align: center !important; -moz-appearance: textfield !important; outline: none !important; padding: 0 !important;">
                            <button class="btn-qty" onclick="changeQty(${index}, 1)" style="background: transparent !important; border: none !important; border-left: 1px solid var(--border-color) !important; color: var(--text-white) !important; font-size: 1.1rem !important; font-weight: 900 !important; width: 28px !important; height: 28px !important; cursor: pointer !important;">+</button>
                        </div>
                    </div>
                    <button class="btn-remove-item" onclick="removeFromCart(${index})" style="background: none !important; border: none !important; color: var(--danger) !important; cursor: pointer !important; transition: 0.3s !important; padding: 5px !important;">
                        <span class="material-icons-round" style="font-size: 1.4rem;">delete</span>
                    </button>
                </div>
            `;
        }).join('');
        list.innerHTML = htmlString;
    }
    badge.innerText = count;
    totalDisplay.innerText = `$ ${new Intl.NumberFormat('es-CO').format(total)}`;
}

window.removeFromCart = function (index) {
    cart.splice(index, 1);
    updateCartUI();
}

window.toggleCart = function () {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.classList.toggle('open');
    if (overlay) overlay.classList.toggle('hidden');
}

/**
 * 4. PROCESO DE COMPRA Y CHECKOUT PREMIUM
 */
window.goToCheckout = function () {
    if (cart.length === 0) return;

    let total = 0;
    for (let item of cart) {
        if (item.minCompra > 0 && item.cantidad < item.minCompra) {
            toggleCart();
            return Toast.fire({ icon: 'error', title: 'Error en pedido', text: `Debes comprar al menos ${item.minCompra} unidades de ${item.nombre}.` });
        }
    }

    const summaryList = document.getElementById('checkout-summary-list');
    let totalFiat = 0;
    let totalTokens = 0;
    const htmlSummary = cart.map((item) => {
        totalFiat   += (item.precio * item.cantidad);
        totalTokens += ((item.precio_tokens || item.precio * 100) * item.cantidad);
        return `
            <div class="checkout-item-premium" style="display: flex !important; justify-content: space-between !important; align-items: center !important; background: var(--bg-dark) !important; padding: 12px 15px !important; margin-bottom: 8px !important; border-left: 4px solid var(--accent) !important; border-top: 1px solid var(--border-color) !important; border-bottom: 1px solid var(--border-color) !important; border-right: 1px solid var(--border-color) !important; clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);">
                <div>
                    <div class="checkout-item-name" style="color: var(--text-white) !important; font-size: 0.85rem !important; font-weight: 800 !important; text-transform: uppercase !important;">${escapeHTML(item.nombre)}</div>
                    <div class="checkout-item-qty" style="color: var(--text-gray) !important; font-size: 0.75rem !important; font-weight: 600;">Unidades: ${item.cantidad}</div>
                </div>
                <div style="text-align:right;">
                    <div class="checkout-item-price" style="color: var(--success) !important; font-weight: 900 !important; font-size: 1.1rem !important;">$ ${new Intl.NumberFormat('es-CO').format(item.precio * item.cantidad)}</div>
                    <div style="color:#f59e0b; font-size:.7rem; font-weight:700;">${new Intl.NumberFormat('es-CO').format((item.precio_tokens || item.precio * 100) * item.cantidad)} TK</div>
                </div>
            </div>
        `;
    }).join('');

    summaryList.innerHTML = htmlSummary;

    // Método de pago
    const tkSaldo = window.userTokenSaldo || parseInt(localStorage.getItem('dw_token_saldo')) || 0;
    const fmt = (n) => new Intl.NumberFormat('es-CO').format(parseInt(n)||0);
    const tkSuficiente = tkSaldo >= totalTokens;

    // Actualizar totales visibles
    const totalEl = document.getElementById('checkout-final-total');
    if (totalEl) totalEl.innerText = `$ ${fmt(totalFiat)}`;

    // Inyectar selector de método de pago (si no existe ya)
    let metodoPagoBox = document.getElementById('checkout-metodo-pago');
    if (!metodoPagoBox) {
        metodoPagoBox = document.createElement('div');
        metodoPagoBox.id = 'checkout-metodo-pago';
        const footerEl = document.querySelector('.checkout-modal-footer') || document.getElementById('checkout-modal');
        if (footerEl) footerEl.prepend(metodoPagoBox);
    }
    metodoPagoBox.innerHTML = `
        <div style="margin:16px 0; background:rgba(245,158,11,.06); border:1px solid rgba(245,158,11,.2); border-radius:12px; padding:14px 18px;">
            <p style="margin:0 0 10px; font-size:.75rem; font-weight:800; text-transform:uppercase; letter-spacing:.8px; color:#f59e0b;">
                🪙 Método de pago
            </p>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <label style="flex:1; min-width:130px; cursor:pointer;">
                    <input type="radio" name="checkout-payment" value="fiat" checked onchange="actualizarResumenPago(${totalFiat}, ${totalTokens})" style="margin-right:6px;">
                    <span style="font-weight:700; font-size:.85rem;">Saldo fiat — <b style="color:var(--success);">$ ${fmt(totalFiat)}</b></span><br>
                    <span style="font-size:.72rem; color:var(--text-muted);">Tu saldo: $ ${fmt(window.userBalance || 0)}</span>
                </label>
                <label style="flex:1; min-width:130px; cursor:${tkSuficiente ? 'pointer' : 'not-allowed'}; opacity:${tkSuficiente ? 1 : .5};">
                    <input type="radio" name="checkout-payment" value="tokens" ${!tkSuficiente ? 'disabled' : ''} onchange="actualizarResumenPago(${totalFiat}, ${totalTokens})" style="margin-right:6px;">
                    <span style="font-weight:700; font-size:.85rem;">Tokens — <b style="color:#f59e0b;">${fmt(totalTokens)} TK</b></span><br>
                    <span style="font-size:.72rem; color:${tkSuficiente ? '#f59e0b' : 'var(--danger)'};">Tu saldo: ${fmt(tkSaldo)} TK ${!tkSuficiente ? '(insuficiente)' : ''}</span>
                </label>
            </div>
        </div>
    `;

    toggleCart();
    document.getElementById('checkout-overlay').classList.remove('hidden');
    document.getElementById('checkout-modal').classList.add('active');
}

window.closeCheckout = function () {
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

window.actualizarResumenPago = function(totalFiat, totalTokens) {
    const metodo = document.querySelector('input[name="checkout-payment"]:checked')?.value || 'fiat';
    const fmt = (n) => new Intl.NumberFormat('es-CO').format(parseInt(n)||0);
    const totalEl = document.getElementById('checkout-final-total');
    if (totalEl) {
        totalEl.innerText = metodo === 'tokens'
            ? `${fmt(totalTokens)} TK`
            : `$ ${fmt(totalFiat)}`;
    }
};

window.finalizePurchase = async function () {
    const payBtn = document.querySelector('.btn-final-pay');
    if (payBtn) payBtn.disabled = true;

    const metodo = document.querySelector('input[name="checkout-payment"]:checked')?.value || 'fiat';

    if (metodo === 'tokens') {
        await finalizePurchaseTokens(payBtn);
        return;
    }

    // --- FLUJO FIAT ORIGINAL ---
    if (typeof userBalance === 'undefined') userBalance = Number(localStorage.getItem('dw_saldo')) || 0;

    let total = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    if (userBalance < total) {
        if (payBtn) payBtn.disabled = false;
        return Toast.fire({ icon: 'error', title: 'Saldo insuficiente' });
    }

    closeCheckout();

    const u = localStorage.getItem('dw_user');
    const t = localStorage.getItem('dw_token');
    const orderId = generarOrderId();
    const isDark = document.body.classList.contains('dark-mode');

    Swal.fire({
        title: '<span style="color:var(--text-white); font-weight: 800; letter-spacing:1px; text-transform:uppercase;">Procesando Pedido</span>',
        html: `
            <div style="margin-top: 10px; color: var(--text-gray); font-size: 0.9rem; font-weight: 600;">Conectando con la base de datos...</div>
            <div class="spinner" style="margin: 25px auto;"></div>
        `,
        showConfirmButton: false,
        allowOutsideClick: false,
        background: isDark ? 'var(--bg-card)' : '#ffffff',
        customClass: { container: 'swal-top-layer', popup: 'cyber-modal-style' }
    });

    let errores = [];
    let exitos = 0;
    let paqueteParaGoogle = []; 

    const fechaLocal = new Date().toISOString().split('T')[0];

    for (const item of cart) {
        Swal.update({
            html: `
                <div style="margin-top: 10px; color: var(--text-gray); font-size: 0.9rem; font-weight: 600; text-align: center; padding: 0 20px;">
                    Procesando:<br><b style="color:var(--accent-text); font-size: 1.1rem; text-transform: uppercase;">${escapeHTML(item.nombre)}</b><br>
                    (x${item.cantidad} unidades)
                </div>
                <div class="spinner" style="margin: 25px auto;"></div>
            `
        });

        try {
            const res = await apiCall({ accion: 'comprar', usuario: u, token: t, producto: item.nombre, cantidad: item.cantidad, order_id: orderId });
            if (res.success) {
                exitos += item.cantidad;
                userBalance = res.nuevoSaldo;
                localStorage.setItem('dw_saldo', userBalance);
                window._lastPurchaseRes = res; // 🪙 Guardamos para mostrar tokens ganados

                let diasExtraidos = 30;
                const matchDias = item.nombre.match(/(\d+)\s*(dias|meses|días|mes)/i);
                if (matchDias) {
                    diasExtraidos = matchDias[2].toLowerCase().includes('mes') ? parseInt(matchDias[1]) * 30 : parseInt(matchDias[1]);
                }

                if (res.datos && res.datos.cuentas) {
                    res.datos.cuentas.forEach(cuentaEntregada => {
                        paqueteParaGoogle.push({ cuenta: cuentaEntregada, fecha: fechaLocal, dias: diasExtraidos, servicio: item.nombre });
                    });
                }
            } else {
                errores.push(`${item.nombre}: ${res.msg}`);
            }
        } catch (error) {
            errores.push(`${item.nombre}: Error de conexión`);
        }
    }

    if (paqueteParaGoogle.length > 0) {
        fetch(GS_CODIGO, { method: "POST", body: JSON.stringify({ accion: "registro_masivo", compras: paqueteParaGoogle }), headers: { "Content-Type": "text/plain" } })
        .catch(e => console.error("Error enviando a Google:", e));
    }

    if (typeof updateBalanceUI === 'function') updateBalanceUI();

    if (exitos > 0) {
        cart = []; updateCartUI();
        // Limpiar el selector de método de pago
        document.getElementById('checkout-metodo-pago')?.remove();
        localStorage.removeItem(STORE_CACHE_KEY);
        await cargarTienda(true);
        Swal.close();

        // Mostrar tokens ganados si los hubo
        const lastRes = window._lastPurchaseRes;
        if (lastRes?.tokens_ganados > 0) {
            const fmt = (n) => new Intl.NumberFormat('es-CO').format(parseInt(n)||0);
            if (typeof actualizarTokenSaldoLocal === 'function') actualizarTokenSaldoLocal(lastRes.nuevoTokenSaldo || 0);
            setTimeout(() => Toast.fire({ icon: 'success', title: `🪙 +${fmt(lastRes.tokens_ganados)} tokens ganados!` }), 800);
        }

        if (errores.length > 0) {
            Toast.fire({ icon: 'warning', title: `Éxito parcial: ${exitos} listos. Fallaron ${errores.length}` });
            if (payBtn) payBtn.disabled = false;
            if (typeof abrirFacturaGlobal === 'function') abrirFacturaGlobal(orderId);
        } else {
            Toast.fire({ icon: 'success', title: '¡Compra completada con éxito!' });
            if (payBtn) payBtn.disabled = false;
            if (typeof abrirFacturaGlobal === 'function') abrirFacturaGlobal(orderId);
        }
    } else {
        if (payBtn) payBtn.disabled = false;
        Swal.fire({
            icon: 'error', title: '<span style="color:var(--danger); font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">Error en el proceso</span>',
            text: errores[0] || "Ocurrió un error inesperado.", background: isDark ? 'var(--bg-card)' : '#ffffff',
            color: isDark ? '#ffffff' : 'var(--text-main)', confirmButtonColor: 'var(--danger)', allowOutsideClick: false,
            customClass: { container: 'swal-top-layer', popup: 'cyber-modal-style' }
        });
    }
}

// 🪙 FLUJO DE COMPRA CON TOKENS
async function finalizePurchaseTokens(payBtn) {
    const u = localStorage.getItem('dw_user');
    const t = localStorage.getItem('dw_token');
    const orderId = generarOrderId();
    const isDark = document.body.classList.contains('dark-mode');
    const fmt = (n) => new Intl.NumberFormat('es-CO').format(parseInt(n)||0);

    closeCheckout();

    Swal.fire({
        title: '<span style="color:var(--text-white); font-weight:800;">Procesando con Tokens</span>',
        html: '<div style="color:#f59e0b; font-size:.9rem; margin-top:10px;">🪙 Canjeando tus tokens...</div><div class="spinner" style="margin:25px auto;"></div>',
        showConfirmButton: false, allowOutsideClick: false,
        background: isDark ? 'var(--bg-card)' : '#ffffff',
        customClass: { container: 'swal-top-layer', popup: 'cyber-modal-style' }
    });

    let errores = [], exitos = 0, paqueteParaGoogle = [];
    const fechaLocal = new Date().toISOString().split('T')[0];

    for (const item of cart) {
        try {
            const res = await apiCall({ accion: 'comprarConTokens', usuario: u, token: t, producto: item.nombre, cantidad: item.cantidad, order_id: orderId });
            if (res.success) {
                exitos += item.cantidad;
                window.userTokenSaldo = res.nuevoTokenSaldo || 0;
                localStorage.setItem('dw_token_saldo', window.userTokenSaldo);
                if (typeof actualizarTokenSaldoLocal === 'function') actualizarTokenSaldoLocal(window.userTokenSaldo);
                let diasExtraidos = 30;
                const matchDias = item.nombre.match(/(\d+)\s*(dias|meses|d\u00edas|mes)/i);
                if (matchDias) diasExtraidos = matchDias[2].toLowerCase().includes('mes') ? parseInt(matchDias[1]) * 30 : parseInt(matchDias[1]);
                if (res.datos?.cuentas) res.datos.cuentas.forEach(c => paqueteParaGoogle.push({ cuenta: c, fecha: fechaLocal, dias: diasExtraidos, servicio: item.nombre }));
            } else {
                errores.push(`${item.nombre}: ${res.msg}`);
            }
        } catch(e) { errores.push(`${item.nombre}: Error de conexión`); }
    }

    if (paqueteParaGoogle.length > 0) {
        fetch(GS_CODIGO, { method: 'POST', body: JSON.stringify({ accion: 'registro_masivo', compras: paqueteParaGoogle }), headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
    }

    document.getElementById('checkout-metodo-pago')?.remove();

    if (exitos > 0) {
        cart = []; updateCartUI();
        localStorage.removeItem(STORE_CACHE_KEY);
        await cargarTienda(true);
        Swal.close();
        Toast.fire({ icon: 'success', title: `🪙 ¡Compra con tokens exitosa!` });
        if (payBtn) payBtn.disabled = false;
        if (typeof abrirFacturaGlobal === 'function') abrirFacturaGlobal(orderId);
    } else {
        if (payBtn) payBtn.disabled = false;
        Swal.fire({ icon: 'error', title: 'Error', text: errores[0] || 'Error desconocido.', background: isDark ? 'var(--bg-card)' : '#fff' });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 🪙 TOGGLE DE MODO PAGO (DINERO ↔ TOKENS)
// ─────────────────────────────────────────────────────────────────────────────
window.togglePagoModo = function() {
    pagoModoTokens = !pagoModoTokens;

    // Feedback visual al botón mientras re-renderiza
    const btn = document.getElementById('store-pay-toggle');
    if (btn) {
        btn.style.transform = 'scale(.95)';
        btn.style.opacity = '.7';
        setTimeout(() => { btn.style.transform = ''; btn.style.opacity = ''; }, 250);
    }

    // Toast informativo
    const tkSaldo = window.userTokenSaldo || parseInt(localStorage.getItem('dw_token_saldo')) || 0;
    const fmt = (n) => new Intl.NumberFormat('es-CO').format(parseInt(n) || 0);
    if (pagoModoTokens) {
        Toast.fire({ icon: 'info', title: `🪙 Modo Tokens — ${fmt(tkSaldo)} TK disponibles`, timer: 2000 });
    } else {
        const bal = window.userBalance || parseInt(localStorage.getItem('dw_saldo')) || 0;
        Toast.fire({ icon: 'info', title: `💵 Modo Dinero — $ ${fmt(bal)} disponibles`, timer: 2000 });
    }

    renderizarTiendaPremium(lastProductos, false);
};

// ─────────────────────────────────────────────────────────────────────────────
// 🪙 COMPRA DIRECTA CON TOKENS (SIN CARRITO)
// ─────────────────────────────────────────────────────────────────────────────
window.comprarDirectoConTokens = async function(nombreProducto, inputId, precioTokensUnitario) {
    const input    = document.getElementById(inputId);
    const cantidad = input ? (parseInt(input.value) || 1) : 1;
    const costoTotal = precioTokensUnitario * cantidad;
    const fmt      = (n) => new Intl.NumberFormat('es-CO').format(parseInt(n) || 0);
    const isDark   = document.body.classList.contains('dark-mode');
    const u = localStorage.getItem('dw_user');
    const t = localStorage.getItem('dw_token');

    // Confirmación rápida
    const { isConfirmed } = await Swal.fire({
        title: `<span style="font-size:1.05rem; font-weight:900;">Canjear con Tokens</span>`,
        html: `
            <div style="text-align:left; font-size:.88rem; color:var(--text-gray);">
                <div style="margin-bottom:10px;"><b style="color:var(--text-white);">${escapeHTML(nombreProducto)}</b></div>
                <div>Cantidad: <b style="color:var(--text-white);">${cantidad}</b></div>
                <div>Costo total: <b style="color:#f59e0b; font-size:1.1rem;">${fmt(costoTotal)} TK</b></div>
                <div style="margin-top:8px; font-size:.78rem;">Tu saldo: ${fmt(window.userTokenSaldo || 0)} TK</div>
            </div>`,
        showCancelButton: true,
        confirmButtonText: '🪙 Confirmar canje',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d97706',
        background: isDark ? 'var(--bg-card)' : '#fff',
        customClass: { container: 'swal-top-layer', popup: 'cyber-modal-style' }
    });

    if (!isConfirmed) return;

    const orderId = generarOrderId();

    Swal.fire({
        title: '<span style="font-weight:800;">Procesando con Tokens</span>',
        html: '<div style="color:#f59e0b; font-size:.9rem; margin-top:10px;">🪙 Canjeando tus tokens...</div><div class="spinner" style="margin:25px auto;"></div>',
        showConfirmButton: false, allowOutsideClick: false,
        background: isDark ? 'var(--bg-card)' : '#fff',
        customClass: { container: 'swal-top-layer', popup: 'cyber-modal-style' }
    });

    try {
        const res = await apiCall({ accion: 'comprarConTokens', usuario: u, token: t, producto: nombreProducto, cantidad, order_id: orderId });

        if (res.success) {
            window.userTokenSaldo = res.nuevoTokenSaldo || 0;
            localStorage.setItem('dw_token_saldo', window.userTokenSaldo);
            if (typeof actualizarTokenSaldoLocal === 'function') actualizarTokenSaldoLocal(window.userTokenSaldo);

            // Notificar a Google si es necesario
            if (res.datos?.cuentas) {
                const fechaLocal = new Date().toISOString().split('T')[0];
                const diasMatch  = nombreProducto.match(/(\d+)\s*(dias|meses|días|mes)/i);
                const dias = diasMatch ? (diasMatch[2].toLowerCase().includes('mes') ? parseInt(diasMatch[1])*30 : parseInt(diasMatch[1])) : 30;
                const paquete = res.datos.cuentas.map(c => ({ cuenta: c, fecha: fechaLocal, dias, servicio: nombreProducto }));
                fetch(GS_CODIGO, { method:'POST', body: JSON.stringify({ accion:'registro_masivo', compras: paquete }), headers:{'Content-Type':'text/plain'} }).catch(()=>{});
            }

            localStorage.removeItem(STORE_CACHE_KEY);
            await cargarTienda(true);
            Swal.close();
            Toast.fire({ icon:'success', title:`🪙 ¡Canje exitoso! −${fmt(costoTotal)} TK` });
            if (typeof abrirFacturaGlobal === 'function') abrirFacturaGlobal(orderId);
        } else {
            Swal.fire({ icon:'error', title:'Error en canje', text: res.msg || 'Error desconocido.', background: isDark ? 'var(--bg-card)' : '#fff' });
        }
    } catch(e) {
        Swal.fire({ icon:'error', title:'Error de conexión', text:'Verifica tu conexión e intenta de nuevo.', background: isDark ? 'var(--bg-card)' : '#fff' });
    }
};
