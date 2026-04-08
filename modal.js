if (!document.getElementById('estilos-modal-factura')) {
    const style = document.createElement('style');
    style.id = 'estilos-modal-factura';
    style.innerHTML = `
        .mf-overlay { 
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); 
            z-index: 99999; display: flex; align-items: center; justify-content: center; 
            opacity: 0; visibility: hidden; transition: 0.3s; 
        }
        .mf-overlay.active { opacity: 1; visibility: visible; }
        
        .mf-modal { 
            width: 95%; max-width: 600px; background: var(--bg-dark); 
            border: 1px solid var(--border-color); border-radius: 16px; 
            box-shadow: 0 20px 50px rgba(0,0,0,0.3); position: relative; 
            max-height: 90vh; display: flex; flex-direction: column; 
            transform: scale(0.9); transition: 0.3s; overflow: hidden;
        }
        .mf-overlay.active .mf-modal { transform: scale(1); }
        
        .mf-btn-close { 
            position: absolute; top: 15px; right: 15px; 
            background: var(--bg-card); border: 1px solid var(--border-color); 
            color: var(--text-muted); width: 35px; height: 35px; 
            border-radius: 50%; display: flex; align-items: center; justify-content: center; 
            cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.1); 
            z-index: 10; transition: 0.2s; 
        }
        .mf-btn-close:hover { background: var(--danger); color: #fff; border-color: var(--danger); transform: scale(1.1); }
        
        .mf-content { padding: 30px 25px; overflow-y: auto; color: var(--text-white); }
        
        /* Scrollbar interno del modal */
        .mf-content::-webkit-scrollbar { width: 6px; }
        .mf-content::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
        
        .mf-invoice-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px dashed var(--border-color); padding-bottom: 15px; margin-bottom: 20px; }
        .mf-title { font-family: 'Righteous', cursive; font-size: 1.5rem; color: var(--text-white); margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px; }
        .mf-title i { color: var(--accent-text); font-size: 1.8rem; }
        .mf-order-id { font-family: monospace; color: var(--text-gray); background: var(--bg-card); padding: 4px 10px; border-radius: 6px; font-size: 0.95rem; border: 1px solid var(--border-color); }
        
        .mf-btn-copy-all { background: rgba(37, 99, 235, 0.1); color: var(--accent-text); border: 1px solid rgba(37, 99, 235, 0.3); padding: 8px 15px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: bold; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
        .mf-btn-copy-all:hover { background: var(--accent-text); color: #fff; }
        
        .mf-service-block { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; margin-bottom: 15px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        .mf-service-header { background: rgba(37, 99, 235, 0.05); padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(37, 99, 235, 0.1); }
        .mf-service-title { font-weight: 800; color: var(--accent-text); font-size: 1.1rem; margin: 0; display: flex; align-items: center; gap: 8px; }
        .mf-qty-badge { background: var(--accent-text); color: #fff; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; }
        
        .mf-account-row { display: flex; justify-content: space-between; align-items: center; background: var(--bg-dark); padding: 10px 15px; border-radius: 8px; margin-bottom: 8px; font-family: monospace; font-size: 0.95rem; border: 1px solid var(--border-color); color: var(--text-white); transition: 0.2s; }
        .mf-account-row:hover { border-color: var(--accent-text); background: rgba(37, 99, 235, 0.05); }
        
        .mf-btn-copy-mini { background: transparent; border: none; color: var(--text-gray); cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; transition: 0.2s; }
        .mf-btn-copy-mini:hover { color: var(--accent-text); background: rgba(37, 99, 235, 0.1); }
        
        .mf-service-footer { display: flex; justify-content: space-between; padding: 12px 15px; background: var(--bg-dark); border-top: 1px dashed var(--border-color); font-size: 0.9rem; }
        
        .mf-grand-total { background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 25px; }
        .mf-grand-total span:first-child { color: var(--text-gray); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 0.9rem; }
        .mf-grand-total span:last-child { color: var(--success); font-size: 2rem; font-weight: 900; font-family: monospace; }
        
        @media (max-width: 480px) {
            .mf-invoice-header { flex-direction: column; gap: 15px; }
            .mf-btn-copy-all { width: 100%; justify-content: center; }
            .mf-grand-total { flex-direction: column; gap: 5px; align-items: flex-start; }
        }
        
        /* Asegurar que el toast se sobreponga al modal de factura */
        #toast-container { z-index: 999999 !important; }
    `;
    document.head.appendChild(style);
}

// ==========================================
// 2. CREACIÓN DEL DOM DEL MODAL
// ==========================================
function asegurarContenedorModalFactura() {
    let overlay = document.getElementById('mf-global-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'mf-global-overlay';
        overlay.className = 'mf-overlay';
        overlay.innerHTML = `
            <div class="mf-modal">
                <button class="mf-btn-close" onclick="cerrarFacturaGlobal()"><i class="material-icons-round">close</i></button>
                <div class="mf-content" id="mf-global-content"></div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Cerrar al hacer clic en el fondo oscuro
        overlay.addEventListener('click', (e) => {
            if(e.target === overlay) cerrarFacturaGlobal();
        });
    }
    return document.getElementById('mf-global-content');
}

window.cerrarFacturaGlobal = function() {
    const overlay = document.getElementById('mf-global-overlay');
    if(overlay) overlay.classList.remove('active');
};

// ==========================================
// 3. LÓGICA DE COPIADO MODERNA (SIN TECLADO)
// ==========================================
window.copiarAlPortapapelesFactura = function(texto, btnElement) {
    const darFeedback = () => {
        // Lanzar Toast visible globalmente
        if(typeof mostrarToast === 'function') {
            mostrarToast('¡Copiado al portapapeles!', 'success');
        }
        
        // Feedback visual ultrarrápido en el botón tocado
        if (btnElement) {
            // Se identifica si es el botón de la vista móvil o el del modal de PC/Celular global
            const isMainBtn = btnElement.classList.contains('mf-btn-copy-all') || btnElement.id === 'btn-copiar-todo-modal';
            
            if (isMainBtn) {
                const originalHtml = btnElement.innerHTML;
                const originalBg = btnElement.style.background;
                const originalColor = btnElement.style.color;
                const originalBorder = btnElement.style.borderColor;

                // Estado de Éxito rápido
                btnElement.style.background = 'var(--success)';
                btnElement.style.color = '#fff';
                btnElement.style.borderColor = 'var(--success)';
                btnElement.innerHTML = `<i class="material-icons-round" style="font-size: 1.1rem;">check</i> COPIADO`;
                
                // Retorno rápido a 1 segundo para no quedarse verde
                setTimeout(() => {
                    btnElement.style.background = originalBg;
                    btnElement.style.color = originalColor;
                    btnElement.style.borderColor = originalBorder;
                    btnElement.innerHTML = originalHtml;
                }, 1000); 
            } else {
                // Si es un botón de copiar cuenta o copiar grupo
                const icono = btnElement.querySelector('.material-icons-round');
                if (icono) {
                    const textoOriginal = icono.innerText;
                    icono.innerText = 'check';
                    setTimeout(() => { icono.innerText = textoOriginal; }, 1000);
                }
            }
        }
    };

    // Método 100% moderno y silencioso. Si falla (por falta de HTTPS), mostrará el Toast de error.
    if (navigator.clipboard) {
        navigator.clipboard.writeText(texto)
            .then(darFeedback)
            .catch(err => {
                console.error("Error al copiar:", err);
                if(typeof mostrarToast === 'function') {
                    mostrarToast("No se pudo copiar. Verifica que la página sea segura (HTTPS).", "error");
                }
            });
    } else {
        if(typeof mostrarToast === 'function') {
            mostrarToast("Tu navegador no soporta el copiado automático.", "error");
        }
    }
};

// ==========================================
// 4. FUNCIÓN PRINCIPAL DE APERTURA (ABRIR FACTURA GLOBAL)
// ==========================================
window.abrirFacturaGlobal = async function(orderId) {
    const contentDiv = asegurarContenedorModalFactura();
    const overlay = document.getElementById('mf-global-overlay');
    
    // Mostrar loader
    contentDiv.innerHTML = `
        <div style="text-align:center; padding: 40px;">
            <i class="material-icons-round" style="animation: spin 1s linear infinite; font-size: 3rem; color: var(--accent-text);">autorenew</i>
            <p style="margin-top: 15px; color: var(--text-gray);">Generando factura oficial...</p>
        </div>
    `;
    overlay.classList.add('active');

    try {
        // Tomar credenciales
        const u = localStorage.getItem('dw_user');
        const t = localStorage.getItem('dw_token');

        const res = await apiCall({
            accion: 'getPedidos',
            usuario: u,
            token: t,
            filtro: orderId,
            limite: '200'
        });

        if (res.success) {
            const itemsFactura = res.datos.filter(i => i.orderId === orderId);

            if (itemsFactura.length === 0) {
                contentDiv.innerHTML = `
                    <div style="padding: 30px; text-align: center;">
                        <i class="material-icons-round" style="font-size: 3rem; color: var(--danger); margin-bottom:10px;">error_outline</i>
                        <p style="color: var(--text-gray);">No se encontraron cuentas asociadas a este pedido.</p>
                    </div>`;
                return;
            }

            // Agrupar por nombre de servicio
            let agrupacionServicios = {};
            let totalGeneral = 0;

            itemsFactura.forEach(item => {
                if (!agrupacionServicios[item.servicio]) {
                    agrupacionServicios[item.servicio] = { 
                        cuentas: [], 
                        precioUnitario: parseFloat(item.precio) || 0 
                    };
                }
                agrupacionServicios[item.servicio].cuentas.push(item);
            });

            // Formateador de moneda colombiana
            const fmt = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
            
            let htmlFactura = `<div>`;
            let textoFacturaCompleta = `🌟 ${NOMBRE_NEGOCIO} - FACTURA DE COMPRA 🌟\nPEDIDO: ${orderId}\n\n`;

            for (const srv in agrupacionServicios) {
                const dataSrv = agrupacionServicios[srv];
                const cantidad = dataSrv.cuentas.length;
                const subtotal = cantidad * dataSrv.precioUnitario;
                totalGeneral += subtotal;

                let textoServicioSolo = `========================\n📌 SERVICIO: ${srv}\n`;
                let cuentasListaHtml = '';

                dataSrv.cuentas.forEach((cData, idx) => {
                    const c = cData.cuenta;
                    textoServicioSolo += `Cuenta ${idx + 1}: ${c}\n`;
                    
                    // Texto exacto para copiar la cuenta individual
                    const textoCuentaIndividual = `Servicio: ${srv}\nCuenta: ${c}\nValor: $ ${fmt.format(dataSrv.precioUnitario)}`;
                    const encodedTextoCuenta = encodeURIComponent(textoCuentaIndividual);
                    
                    let estado = cData.estado ? cData.estado.toLowerCase() : '';
                    let notaReal = cData.notas || '';

                    // Ocultar notas técnicas del administrador
                    const notasOcultasCliente = ['reciclada', 'archivada', 'stock'];
                    const notaMInusculas = notaReal.toLowerCase();
                    const esNotaInternaAdmin = notasOcultasCliente.some(palabra => notaMInusculas.includes(palabra));

                    if (esNotaInternaAdmin) {
                        estado = 'vencida';
                        notaReal = ''; 
                    }

                    let notasHTML = notaReal 
                        ? `<div style="margin-top: 4px; font-size: 0.75rem; color: #f59e0b; background: rgba(245, 158, 11, 0.1); padding: 4px 8px; border-radius: 6px; border: 1px dashed rgba(245, 158, 11, 0.3); line-height: 1.3;"><i class="material-icons-round" style="font-size:0.9rem; vertical-align:middle; margin-right:3px;">history_edu</i> ${notaReal}</div>` 
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
                            <div class="mf-account-row" style="${opacityAccount}">
                                <span style="word-break: break-all;">${c}</span>
                                <button onclick="copiarAlPortapapelesFactura(decodeURIComponent('${encodedTextoCuenta}'), this)" class="mf-btn-copy-mini" title="Copiar esta cuenta">
                                    <i class="material-icons-round" style="font-size: 1.1rem;">content_copy</i>
                                </button>
                            </div>
                            ${notasHTML}
                            ${badgeVencida}
                        </div>
                    `;
                });

                textoServicioSolo += `------------------------\nValor individual: $ ${fmt.format(dataSrv.precioUnitario)}\nSubtotal del bloque: $ ${fmt.format(subtotal)}\n========================\n`;
                textoFacturaCompleta += textoServicioSolo;
                const encodedTextoServicio = encodeURIComponent(textoServicioSolo);

                htmlFactura += `
                    <div class="mf-service-block">
                        <div class="mf-service-header">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <h4 class="mf-service-title">${srv}</h4>
                                <button onclick="copiarAlPortapapelesFactura(decodeURIComponent('${encodedTextoServicio}'), this)" class="mf-btn-copy-mini" title="Copiar bloque de ${srv}">
                                    <i class="material-icons-round" style="font-size: 1.1rem;">content_copy</i>
                                </button>
                            </div>
                            <span class="mf-qty-badge">x${cantidad}</span>
                        </div>
                        <div style="padding: 15px;">${cuentasListaHtml}</div>
                        <div class="mf-service-footer">
                            <span style="color: var(--text-muted);">Valor ind: <strong>$ ${fmt.format(dataSrv.precioUnitario)}</strong></span>
                            <span style="color: var(--text-white); font-weight: 800;">Subtotal: $ ${fmt.format(subtotal)}</span>
                        </div>
                    </div>
                `;
            }

            htmlFactura += `</div>`;
            textoFacturaCompleta += `\n💰 TOTAL GENERAL: $ ${fmt.format(totalGeneral)}\n¡Gracias por tu preferencia!`;
            const encodedTextoFacturaCompleta = encodeURIComponent(textoFacturaCompleta);

            // Inyección final del HTML estructurado
            contentDiv.innerHTML = `
                <div class="mf-invoice-header">
                    <div>
                        <h3 class="mf-title"><i class="material-icons-round">local_mall</i> FACTURA OFICIAL</h3>
                        <span class="mf-order-id">${orderId}</span>
                    </div>
                    <button class="mf-btn-copy-all" onclick="copiarAlPortapapelesFactura(decodeURIComponent('${encodedTextoFacturaCompleta}'), this)">
                        <i class="material-icons-round" style="font-size: 1.1rem;">receipt</i> Copiar Todo
                    </button>
                </div>
                ${htmlFactura}
                <div class="mf-grand-total">
                    <span>Total Est. Adquisición</span>
                    <span>$ ${fmt.format(totalGeneral)}</span>
                </div>
            `;

        } else {
            contentDiv.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--danger);">${res.msg}</div>`;
        }
    } catch (error) {
        console.error(error);
        contentDiv.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--danger);">Error de red al consultar la factura.</div>`;
    }
};
