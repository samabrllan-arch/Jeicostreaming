/* =================================================================================
   ARCHIVO: mistickets.js
   Lógica: Renderizado de Tickets, Buscador en Tiempo Real, Modal de Detalles.
   (ACTUALIZADO: BUSCADOR PREMIUM INTEGRADO E IMÁGENES ADJUNTAS CON THUMBNAIL Y VISOR)
================================================================================= */

let cargandoTickets = false;
let ticketsGlobales = []; // Guardamos los tickets en memoria para el buscador

/**
 * 1. GANCHOS DE NAVEGACIÓN
 */
document.addEventListener('moduloCargado', (e) => {
    if (e.detail.modulo === 'mistickets') {
        cargarMisTickets();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const secMisTickets = document.getElementById('sec-mistickets');
    
    if (secMisTickets) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    if (!secMisTickets.classList.contains('hidden')) {
                        cargarMisTickets();
                    }
                }
            });
        });
        observer.observe(secMisTickets, { attributes: true });
    }
});

/**
 * 🔥 FUNCIÓN AUXILIAR: Convertir a Thumbnail
 */
function convertirAThumbnailTicket(url) {
    if (!url || url.trim() === "") return "";
    if (url.includes("uc?export=view&id=")) {
        return url.replace("uc?export=view&id=", "thumbnail?id=") + "&sz=w600";
    }
    return url;
}

/**
 * 2. FUNCIÓN PRINCIPAL: Obtener y renderizar los tickets (TIEMPO REAL)
 */
async function cargarMisTickets() {
    if (cargandoTickets) return;
    cargandoTickets = true;

    const container = document.getElementById('tickets-container');
    if (!container) {
        cargandoTickets = false;
        return;
    }
    
    // CREDENCIALES
    const u = localStorage.getItem('dw_user');
    const t = localStorage.getItem('dw_token');

    if (!u || !t) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding:40px;">
                <span class="material-icons-round" style="font-size:3rem; color:var(--danger);">error_outline</span>
                <p style="color: var(--danger); font-weight: bold; margin-top: 15px;">Error: No se detecta una sesión activa.</p>
            </div>`;
        cargandoTickets = false;
        return;
    }

    // Inyectar el área de búsqueda si no existe
    if (!document.getElementById('tickets-search-area')) {
        const searchHtml = `
            <div id="tickets-search-area" style="grid-column: 1/-1; margin-bottom: 20px;">
                <div class="faq-search-wrapper" style="max-width: 100%;">
                    <i class="material-icons-round">search</i>
                    <input type="text" class="faq-search-input" id="input-buscar-tickets" placeholder="Buscar por ID, tipo de falla o contenido del reporte..." onkeyup="filtrarMisTickets()">
                </div>
            </div>
            <div id="tickets-no-results" class="faq-no-results" style="grid-column: 1/-1; display: none;">
                <i class="material-icons-round" style="font-size: 3rem; margin-bottom: 10px; opacity: 0.5;">search_off</i><br>
                No encontramos tickets que coincidan con tu búsqueda.
            </div>
            <div id="tickets-grid-container" style="grid-column: 1/-1; display: contents;"></div>
        `;
        container.innerHTML = searchHtml;
    }

    const gridContainer = document.getElementById('tickets-grid-container');

    // Mostrar Spinner
    gridContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:60px;">
            <div class="spinner" style="margin: 0 auto;"></div>
            <p style="color:var(--text-gray); margin-top:20px; letter-spacing:2px; font-size:0.8rem; font-weight: 800;">SINCRONIZANDO SOPORTE...</p>
        </div>
    `;

    try {
        // Llamada al backend
        const res = await apiCall({ 
            accion: 'getMisTickets', 
            usuario: u, 
            token: t 
        });

        if (res && res.success) {
            ticketsGlobales = res.datos || []; // Guardar en global
            renderMisTickets(ticketsGlobales);
            
            // Reaplicar filtro si había algo escrito
            const inputBusqueda = document.getElementById('input-buscar-tickets');
            if (inputBusqueda && inputBusqueda.value.trim() !== '') {
                filtrarMisTickets();
            }
        } else {
            gridContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:40px;">
                    <span class="material-icons-round" style="font-size:3rem; color:var(--danger);">dns</span>
                    <p style="color: var(--danger); font-weight: bold; margin-top: 15px;">Error del servidor: ${res ? res.msg : 'Respuesta vacía'}</p>
                </div>
            `;
        }
    } catch (error) {
        gridContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding:40px;">
                <span class="material-icons-round" style="font-size:3rem; color:var(--danger);">wifi_off</span>
                <p style="color: var(--danger); font-weight: bold; margin-top: 15px;">Fallo en la conexión: ${error.message}</p>
            </div>
        `;
    } finally {
        cargandoTickets = false;
    }
}

/**
 * 3. RENDERIZADO: Construir el HTML de los tickets
 */
function renderMisTickets(tickets) {
    const gridContainer = document.getElementById('tickets-grid-container');
    if (!gridContainer) return;
    
    try {
        gridContainer.innerHTML = ""; 

        if (!tickets || tickets.length === 0) {
            gridContainer.innerHTML = `
                <div class="no-orders-container" style="grid-column: 1/-1; text-align: center; padding: 80px 20px; border: 1px dashed var(--border-color); border-radius: 20px; background: var(--bg-card);">
                    <span class="material-icons-round" style="font-size: 4rem; color: var(--text-muted); margin-bottom: 15px;">gpp_good</span>
                    <p style="color: var(--text-gray); font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">Sin Incidencias</p>
                    <small style="color: var(--text-muted);">No hay reportes activos en tu historial.</small>
                </div>
            `;
            // Ocultar buscador si no hay tickets
            const searchArea = document.getElementById('tickets-search-area');
            if (searchArea) searchArea.style.display = 'none';
            return;
        }

        // Mostrar buscador si hay tickets
        const searchArea = document.getElementById('tickets-search-area');
        if (searchArea) searchArea.style.display = 'block';

        tickets.forEach(ticket => {
            const estadoSeguro = String(ticket.estado || "Abierto").trim();
            const esAbierto = estadoSeguro.toLowerCase() === 'abierto';
            
            const colorEstado = esAbierto ? '#f59e0b' : 'var(--success)'; 
            const bgEstado = esAbierto ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)';
            const iconEstado = esAbierto ? 'radio_button_checked' : 'check_circle';
            
            let fechaStr = "Fecha no disponible";
            if (ticket.fecha) {
                const fechaObj = new Date(ticket.fecha);
                fechaStr = fechaObj.toLocaleDateString() + ' - ' + fechaObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }

            const botonAccion = esAbierto 
                ? `<button class="btn-cerrar-ticket" onclick="cerrarTicketCliente(${ticket.fila})">
                     <span class="material-icons-round">task_alt</span> Marcar Resuelto
                   </button>` 
                : `<div class="ticket-closed-badge">
                     <span class="material-icons-round">lock</span> SOLUCIONADO
                   </div>`;

            // Codificamos textos e imágenes para enviarlos sin romper el HTML
            const textoCodificado = encodeURIComponent((ticket.contexto || 'Sin detalles.').replace(/'/g, "%27"));
            const respCodificada = encodeURIComponent((ticket.respuesta || '').replace(/'/g, "%27"));
            const imgCodificada = ticket.imagen_adjunta ? encodeURIComponent(ticket.imagen_adjunta) : '';

            // Añadimos datos clave como atributos para el buscador
            const card = document.createElement('div');
            card.className = 'ticket-card-premium ticket-item-filterable'; 
            card.setAttribute('data-id', ticket.fila || '');
            card.setAttribute('data-tipo', (ticket.tipo || '').toLowerCase());
            card.setAttribute('data-estado', estadoSeguro.toLowerCase());
            card.setAttribute('data-contexto', (ticket.contexto || '').toLowerCase());
            card.setAttribute('data-respuesta', (ticket.respuesta || '').toLowerCase());
            
            card.innerHTML = `
                <div class="ticket-header">
                    <div>
                        <div class="ticket-service-name">
                            <span style="color: var(--text-gray); font-size: 0.8rem; margin-right: 5px;">#${ticket.fila}</span> 
                            ${ticket.tipo || 'Reporte de Soporte'}
                        </div>
                        <div class="ticket-date">${fechaStr}</div>
                    </div>
                    <div class="ticket-status-pill" style="background: ${bgEstado}; border-color: ${colorEstado}40;">
                        <span class="material-icons-round" style="color: ${colorEstado};">${iconEstado}</span>
                        <span style="color: ${colorEstado};">${estadoSeguro}</span>
                    </div>
                </div>
                
                <div class="ticket-body">
                    <div class="ticket-detail-btn" onclick="mostrarDetalleModal('${textoCodificado}', '${respCodificada}', '${imgCodificada}')">
                        <div class="ticket-detail-label">
                            <span class="material-icons-round">visibility</span> 
                            <span>LEER REPORTE COMPLETO</span>
                        </div>
                        <span class="material-icons-round detail-icon">open_in_new</span>
                    </div>
                </div>

                <div class="ticket-footer">
                    ${botonAccion}
                </div>
            `;
            gridContainer.appendChild(card);
        });

    } catch (renderError) {
        gridContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding:40px;">
                <p style="color: var(--danger); font-weight: bold;">Error dibujando tickets: ${renderError.message}</p>
            </div>
        `;
    }
}

/**
 * 3.5. MOTOR DE BÚSQUEDA EN TIEMPO REAL
 */
window.filtrarMisTickets = function() {
    const input = document.getElementById('input-buscar-tickets');
    if (!input) return;
    
    const filter = input.value.toLowerCase().trim();
    const ticketsHTML = document.getElementsByClassName('ticket-item-filterable');
    const noResultsMsg = document.getElementById('tickets-no-results');
    
    let hasVisibleItems = false;

    for (let i = 0; i < ticketsHTML.length; i++) {
        const item = ticketsHTML[i];
        const id = item.getAttribute('data-id');
        const tipo = item.getAttribute('data-tipo');
        const estado = item.getAttribute('data-estado');
        const contexto = item.getAttribute('data-contexto');
        const respuesta = item.getAttribute('data-respuesta');
        
        // Criterio de búsqueda
        if (filter === "" || 
            id.includes(filter) || 
            tipo.includes(filter) || 
            estado.includes(filter) || 
            contexto.includes(filter) ||
            respuesta.includes(filter)) {
            
            item.style.display = ""; // Mostrar (volver al flex nativo de grid)
            hasVisibleItems = true;
        } else {
            item.style.display = "none"; // Ocultar
        }
    }
    
    if (noResultsMsg) {
        noResultsMsg.style.display = hasVisibleItems ? 'none' : 'block';
    }
};

/**
 * 4. LÓGICA DE INTERFAZ: Modal para leer el reporte, LA RESPUESTA Y LA IMAGEN
 */
window.mostrarDetalleModal = function(textoCodificado, respCodificada, imgCodificada = '') {
    const isDark = document.body.classList.contains('dark-mode');
    
    const textoLimpio = decodeURIComponent(textoCodificado).replace(/%27/g, "'").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const textoRespuesta = decodeURIComponent(respCodificada).replace(/%27/g, "'").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const imgUrlOriginal = decodeURIComponent(imgCodificada);
    
    // Generar la versión miniatura para que cargue rápido
    const imgUrlMiniatura = convertirAThumbnailTicket(imgUrlOriginal);

    let htmlModal = `
        <div class="modal-ticket-section client-msg">
            <div class="modal-ticket-title">
                <span class="material-icons-round">person</span> TU REPORTE:
            </div>
            <div class="modal-ticket-text">${textoLimpio}</div>
        </div>
    `;

    // Si hay texto de respuesta o una imagen adjunta
    if (textoRespuesta.trim() !== "" || imgUrlOriginal !== "") {
        htmlModal += `
            <div class="modal-ticket-section admin-msg">
                <div class="modal-ticket-title">
                    <span class="material-icons-round">support_agent</span> RESPUESTA DE SOPORTE:
                </div>
        `;
        
        // Ponemos el texto de la respuesta si lo hay
        if (textoRespuesta.trim() !== "") {
            htmlModal += `<div class="modal-ticket-text">${textoRespuesta}</div>`;
        }
        
        // Si hay una imagen, creamos la miniatura cliqueable Y CENTRADA
        if (imgUrlOriginal !== "") {
            const urlSeguraParaClic = encodeURIComponent(imgUrlOriginal);
            htmlModal += `
                <div style="margin-top: 15px; border-top: 1px dashed var(--border-color); padding-top: 15px; text-align: center;">
                    <span style="font-size: 0.8rem; color: var(--success); font-weight: bold; margin-bottom: 8px; display: block; text-transform: uppercase; letter-spacing: 1px;">
                        <i class="material-icons-round" style="font-size: 1.1rem; vertical-align: middle;">image</i> Archivo Adjunto (Clic para ampliar):
                    </span>
                    <img src="${imgUrlMiniatura}" 
                         style="max-width: 100%; max-height: 180px; border-radius: 8px; cursor: zoom-in; border: 1px solid var(--border-color); transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(0,0,0,0.1); display: inline-block;" 
                         onclick="abrirImagenTicketExpandida(\`${urlSeguraParaClic}\`)" 
                         onmouseover="this.style.transform='scale(1.03)'" 
                         onmouseout="this.style.transform='scale(1)'">
                </div>
            `;
        }

        htmlModal += `</div>`;
    } else {
        htmlModal += `
            <div class="modal-ticket-section admin-msg" style="opacity: 0.8; background: rgba(245, 158, 11, 0.05); border-color: rgba(245, 158, 11, 0.2);">
                <div class="modal-ticket-title" style="color: #f59e0b;">
                    <span class="material-icons-round">hourglass_empty</span> EN ESPERA:
                </div>
                <div class="modal-ticket-text" style="color: var(--text-gray); font-style: italic;">Tu ticket está siendo revisado por nuestro equipo. Te responderemos por este medio.</div>
            </div>
        `;
    }

    Swal.fire({
        title: `<div style="font-family:'Righteous'; color:var(--text-main); letter-spacing:1px;">DETALLE DEL TICKET</div>`,
        html: htmlModal,
        background: isDark ? '#1e293b' : '#ffffff',
        confirmButtonColor: 'var(--accent-text)', 
        confirmButtonText: 'CERRAR',
        customClass: {
            popup: 'modal-ticket-premium'
        }
    });
};

/**
 * 4.5. VISOR EXPANDIDO DE IMAGEN (SIN DESCARGAS)
 */
window.abrirImagenTicketExpandida = function(urlCodificada) {
    const urlLimpia = decodeURIComponent(urlCodificada);
    
    // 🔥 TRUCO: Transformamos el link original a un thumbnail GIGANTE (w2500) 
    // para que el navegador lo dibuje como imagen en vez de forzar una descarga.
    let urlAltaResolucion = urlLimpia;
    if (urlLimpia.includes("uc?export=view&id=")) {
        urlAltaResolucion = urlLimpia.replace("uc?export=view&id=", "thumbnail?id=") + "&sz=w2500";
    }

    const isDark = document.body.classList.contains('dark-mode');
    
    Swal.fire({
        imageUrl: urlAltaResolucion,
        imageAlt: 'Evidencia de soporte',
        showConfirmButton: false,
        showCloseButton: true,
        width: 'auto',
        padding: '10px',
        background: isDark ? '#1e293b' : '#ffffff',
        customClass: { popup: 'modal-ticket-premium' }
    });
};

/**
 * 5. ACCIÓN: Cerrar un ticket específico
 */
window.cerrarTicketCliente = async function(fila) {
    const isDark = document.body.classList.contains('dark-mode');

    const confirmar = await Swal.fire({
        title: '¿Marcar como Resuelto?',
        text: "Al cerrar el ticket nos confirmas que tu incidencia fue solucionada.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: 'var(--success)',
        cancelButtonColor: 'var(--bg-dark)',
        confirmButtonText: 'Sí, solucionado',
        cancelButtonText: '<span style="color:var(--text-main);">Cancelar</span>',
        background: isDark ? '#1e293b' : '#ffffff',
        color: isDark ? '#ffffff' : '#0f172a',
        customClass: { popup: 'modal-ticket-premium' }
    });

    if (!confirmar.isConfirmed) return;

    Swal.fire({
        title: 'Actualizando...', text: 'Cerrando tu incidencia.',
        allowOutsideClick: false, 
        background: isDark ? '#1e293b' : '#ffffff', 
        color: isDark ? '#ffffff' : '#0f172a',
        didOpen: () => { Swal.showLoading() }
    });

    const u = localStorage.getItem('dw_user');
    const t = localStorage.getItem('dw_token');

    try {
        const res = await apiCall({ 
            accion: 'cerrarTicket', 
            usuario: u, 
            token: t, 
            fila: fila 
        });

        if (res && res.success) {
            Swal.fire({
                icon: 'success', title: '¡Ticket Cerrado!', text: 'Gracias por avisarnos.',
                background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#ffffff' : '#0f172a', 
                timer: 2000, showConfirmButton: false
            });
            cargarMisTickets(); 
        } else {
            Swal.fire({
                icon: 'error', title: 'Error', text: res ? res.msg : 'Error desconocido',
                background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#ffffff' : '#0f172a'
            });
        }
    } catch (e) {
        Swal.fire({
            icon: 'error', title: 'Fallo de Red', text: 'No se pudo conectar al servidor.',
            background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#ffffff' : '#0f172a'
        });
    }
}

/**
 * ===============================================================
 * ESTILOS CSS INYECTADOS VÍA JS (DISEÑO PREMIUM DINÁMICO)
 * ===============================================================
 */

const ticketStyles = `
    /* --- TARJETA PRINCIPAL DEL TICKET --- */
    .ticket-card-premium {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 16px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 220px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        box-sizing: border-box;
    }

    .ticket-card-premium:hover {
        border-color: var(--accent-text);
        transform: translateY(-4px);
        box-shadow: 0 10px 25px var(--accent-glow);
    }

    /* --- CABECERA DE LA TARJETA --- */
    .ticket-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 15px;
        margin-bottom: 15px;
    }

    .ticket-service-name {
        font-size: 1.1rem;
        color: var(--text-main);
        font-weight: 800;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        display: flex;
        align-items: center;
    }

    .ticket-date {
        font-size: 0.75rem;
        color: var(--text-gray);
        margin-top: 6px;
        font-family: 'Inter', monospace;
    }

    .ticket-status-pill {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 20px;
        border: 1px solid transparent;
        white-space: nowrap;
    }
    
    .ticket-status-pill span:first-child { font-size: 1rem; }
    .ticket-status-pill span:last-child { font-size: 0.75rem; font-weight: 800; letter-spacing: 1px; }

    /* --- CUERPO DE LA TARJETA (BOTÓN DE LEER) --- */
    .ticket-body { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; }

    .ticket-detail-btn {
        background: var(--bg-dark);
        border: 1px solid var(--border-color);
        border-radius: 10px;
        padding: 12px 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s ease;
        user-select: none;
    }

    .ticket-detail-btn:hover { 
        background: rgba(37, 99, 235, 0.05); 
        border-color: var(--accent-text); 
    }

    .ticket-detail-label { 
        display: flex; align-items: center; gap: 8px; 
        color: var(--text-gray); font-size: 0.75rem; 
        font-weight: 800; letter-spacing: 1px; 
    }

    .ticket-detail-btn:hover .ticket-detail-label,
    .ticket-detail-btn:hover .detail-icon { 
        color: var(--accent-text); 
    }

    .detail-icon { color: var(--text-muted); font-size: 1.2rem; transition: color 0.2s; }

    /* --- PIE DE LA TARJETA (BOTONES ACCIÓN) --- */
    .ticket-footer { margin-top: 20px; display: flex; justify-content: flex-end; align-items: center; }

    .btn-cerrar-ticket {
        background: transparent;
        border: 1px solid var(--success);
        color: var(--success);
        padding: 10px 18px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 800;
        letter-spacing: 1px;
        transition: all 0.3s ease;
        text-transform: uppercase;
    }

    .btn-cerrar-ticket span { font-size: 1.1rem; }

    .btn-cerrar-ticket:hover {
        background: var(--success);
        color: #fff;
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    }

    .ticket-closed-badge {
        color: var(--text-gray);
        font-size: 0.8rem;
        font-weight: 800;
        letter-spacing: 2px;
        display: flex;
        align-items: center;
        gap: 6px;
        background: var(--bg-dark);
        padding: 10px 18px;
        border-radius: 8px;
        border: 1px dashed var(--border-color);
    }
    
    .ticket-closed-badge span { font-size: 1.1rem; }

    /* --- DISEÑO DEL MODAL DE SWEETALERT --- */
    .modal-ticket-premium { 
        border: 1px solid var(--border-color); 
        border-radius: 16px !important; 
    }

    .modal-ticket-section { 
        text-align: left; padding: 18px; border-radius: 12px; margin-bottom: 15px; 
    }

    .modal-ticket-title { 
        display: flex; align-items: center; gap: 8px; font-weight: 800; 
        font-size: 0.8rem; letter-spacing: 1.5px; margin-bottom: 10px; 
    }

    .modal-ticket-title span { font-size: 1.1rem; }

    .modal-ticket-text { 
        font-size: 0.95rem; line-height: 1.6; white-space: pre-wrap; 
        max-height: 30vh; overflow-y: auto; font-weight: 500;
    }

    /* Scrollbar estilizada para el modal */
    .modal-ticket-text::-webkit-scrollbar { width: 6px; }
    .modal-ticket-text::-webkit-scrollbar-track { background: transparent; }
    .modal-ticket-text::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }

    /* Variante: Mensaje del Cliente */
    .client-msg { background: var(--bg-dark); border: 1px solid var(--border-color); }
    .client-msg .modal-ticket-title { color: var(--accent-text); }
    .client-msg .modal-ticket-text { color: var(--text-main); }
    
    /* 🔥 FIX MODO OSCURO: Textos más blancos para lectura perfecta */
    body.dark-mode .client-msg .modal-ticket-text { color: #f8fafc; }

    /* Variante: Respuesta del Admin */
    .admin-msg { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); }
    .admin-msg .modal-ticket-title { color: var(--success); }
    .admin-msg .modal-ticket-text { color: var(--text-main); }
    
    /* 🔥 FIX MODO OSCURO: Textos más blancos para lectura perfecta */
    body.dark-mode .admin-msg .modal-ticket-text { color: #f8fafc; }
    
    /* FIX MODO OSCURO: El estado "En Espera" también requiere más brillo */
    body.dark-mode .admin-msg .modal-ticket-text[style*="italic"] { color: #cbd5e1 !important; }
    
    /* --- ESTILOS DEL BUSCADOR DE TICKETS --- */
    .faq-search-wrapper {
        position: relative;
        width: 100%;
    }
    
    .faq-search-wrapper i {
        position: absolute;
        left: 15px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-gray);
        font-size: 1.2rem;
        pointer-events: none;
    }
    
    .faq-search-input {
        width: 100%;
        padding: 15px 15px 15px 45px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        color: var(--text-main);
        font-family: 'Inter', sans-serif;
        font-size: 0.95rem;
        box-sizing: border-box;
        transition: all 0.3s ease;
        outline: none;
        box-shadow: 0 4px 6px rgba(0,0,0,0.02);
    }
    
    .faq-search-input:focus {
        border-color: var(--accent-text);
        box-shadow: 0 0 15px var(--accent-glow);
    }
    
    .faq-search-input::placeholder {
        color: var(--text-muted);
    }
    
    .faq-no-results {
        text-align: center;
        padding: 40px;
        background: var(--bg-card);
        border: 1px dashed var(--border-color);
        border-radius: 16px;
        color: var(--text-gray);
        font-weight: 600;
        margin-top: 10px;
    }
`;

const styleSheetTickets = document.createElement("style");
styleSheetTickets.innerText = ticketStyles;
document.head.appendChild(styleSheetTickets);
