/* =================================================================================
   ARCHIVO: recargas.js (LADO CLIENTE)
   Lógica: Selección de montos, pago con IA, y registro en base de datos adaptativo.
================================================================================= */

const RECHARGE_OPTIONS = [
    { monto: 20000, label: "Paquete Plata", icon: "auto_awesome", bonoStr: "" },
    { monto: 50000, label: "Paquete Oro", icon: "workspace_premium", bonoStr: "+5% BONO" },
    { monto: 100000, label: "Paquete Elite", icon: "diamond", bonoStr: "+7.5% BONO" },
    { monto: 200000, label: "Paquete Titán", icon: "local_fire_department", bonoStr: "+10% BONO" }
];

let selectedAmount = null;

const WSP_ICON_ID = "12_hw1hRhhGNGv1UY7CX-YJajITFtrY-S";
const WSP_ICON_URL = `https://drive.google.com/thumbnail?id=${WSP_ICON_ID}&sz=w200`;

const GAS_URL = "https://script.google.com/macros/s/AKfycbwnMW1rwkNBVT_dn83D6QaSAfy3FEcHW_LUmFMIYmakptyAO8osELRvgRqxRopMdGe6/exec";
const API_CLIENTE_URL = `${API_BASE_URL_CLIENTE}/dw_api.php`;

/**
 * 1. FUNCIÓN PRINCIPAL DE CARGA
 */
function cargarRecarga() {
    const container = document.getElementById('sec-recarga');
    if (!container) return;
    
    const VIDEO_ID_DRIVE = "1QLe0JCZA1tgxx2FSw31okq6cp_a2J_yZ"; 
    const VIDEO_LINK = `https://drive.google.com/file/d/${VIDEO_ID_DRIVE}/preview`;

    container.innerHTML = `
        <div class="recharge-wrapper-premium">
            <div class="page-header-premium">
                <h1 class="page-title">CENTRO DE RECARGAS</h1>
                <p class="page-subtitle">Selecciona un paquete o ingresa el valor deseado para fondear tu cuenta.</p>
                <button onclick="verTutorialVideo('${VIDEO_LINK}')" class="btn-tutorial-video">
                    <span class="material-icons-round">play_circle_filled</span> ¿CÓMO RECARGAR?
                </button>
            </div>
            <div class="recharge-grid-premium" id="recharge-options-container"></div>
            <div class="recharge-input-section">
                <p class="input-helper-text">O INGRESA UN MONTO PERSONALIZADO</p>
                <div class="recharge-custom-input-container">
                    <input type="number" id="custom-recharge" placeholder="Ejem: 15000" class="input-field-recharge" inputmode="numeric" oninput="limpiarSeleccionTarjetas()">
                </div>
                <div class="bonus-table-container">
                    <div class="bonus-table-header" onclick="toggleBonusTable()">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span class="material-icons-round" style="color:var(--accent); font-size:18px;">card_giftcard</span>
                            <h3 class="bonus-table-title" style="margin:0;">VER TABLA DE BONOS</h3>
                        </div>
                        <span class="material-icons-round bonus-chevron" id="bonus-chevron">expand_more</span>
                    </div>
                    <div class="bonus-table-body" id="bonus-table-body">
                        <table class="bonus-table">
                            <thead>
                                <tr><th>RANGO DE RECARGA</th><th style="text-align: right;">BONO REGALO</th></tr>
                            </thead>
                            <tbody>
                                <tr><td>$0 - $49.999</td><td style="text-align: right; color: var(--text-gray);">0%</td></tr>
                                <tr><td>$50.000 - $99.999</td><td class="bonus-highlight" style="text-align: right;">+5%</td></tr>
                                <tr><td>$100.000 - $199.999</td><td class="bonus-highlight" style="text-align: right;">+7.5%</td></tr>
                                <tr><td>$200.000 en adelante</td><td class="bonus-highlight" style="text-align: right;">+10%</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="recharge-actions-elite">
                <button onclick="enviarAlWhatsAppSimple()" class="btn-action-recharge wsp">
                    <img src="${WSP_ICON_URL}" alt="WSP" class="btn-icon-wsp"> RECARGAR VÍA WHATSAPP
                </button>
                <button onclick="procesarPagoBancolombia()" class="btn-action-recharge bank">
                    <span class="material-icons-round">account_balance</span> PAGO BANCOLOMBIA
                </button>
                <button onclick="verHistorialRecargas()" class="btn-action-recharge history-btn">
                    <span class="material-icons-round">history</span> ESTADO DE RECARGAS
                </button>
            </div>
        </div>
    `;
    renderizarOpcionesRecarga();
}

window.toggleBonusTable = function() {
    const body = document.getElementById('bonus-table-body');
    const chevron = document.getElementById('bonus-chevron');
    body.classList.contains('open') ? (body.classList.remove('open'), chevron.style.transform = 'rotate(0deg)') : (body.classList.add('open'), chevron.style.transform = 'rotate(180deg)');
}

window.verTutorialVideo = function(linkVideo) {
    const isMobile = window.innerWidth <= 768;
    Swal.fire({
        html: `<div class="video-modal-container"><h2 class="banco-title" style="margin-bottom: 15px; color:var(--text-white);">Tutorial de Recarga</h2><div class="iframe-wrapper"><iframe src="${linkVideo}" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe></div></div>`,
        showConfirmButton: true, confirmButtonText: 'CERRAR TUTORIAL', confirmButtonColor: '#dc2626', background: 'var(--bg-card)', width: isMobile ? '98%' : '800px', padding: '20px', customClass: { popup: 'banco-swal-popup' }
    });
}

function renderizarOpcionesRecarga() {
    const container = document.getElementById('recharge-options-container');
    if (!container) return;
    container.innerHTML = "";
    RECHARGE_OPTIONS.forEach(opt => {
        const card = document.createElement('div');
        card.className = `recharge-card-premium ${selectedAmount === opt.monto ? 'active' : ''}`;
        card.onclick = () => seleccionarMonto(opt.monto, card);
        let badgeHtml = opt.bonoStr ? `<div style="position:absolute; top:-10px; right:15px; background:var(--accent); color:#ffffff; font-size:10px; font-weight:900; padding:4px 10px; border-radius:20px;">${opt.bonoStr}</div>` : '';
        card.innerHTML = `${badgeHtml}<div class="recharge-card-icon"><span class="material-icons-round">${opt.icon}</span></div><div class="recharge-card-info"><span class="recharge-label">${opt.label}</span><span class="recharge-price">$ ${new Intl.NumberFormat('es-CO').format(opt.monto)}</span></div><div class="selection-check"><span class="material-icons-round">check_circle</span></div>`;
        container.appendChild(card);
    });
}

function seleccionarMonto(monto, element) {
    selectedAmount = monto;
    const customInput = document.getElementById('custom-recharge');
    if (customInput) customInput.value = "";
    document.querySelectorAll('.recharge-card-premium').forEach(c => c.classList.remove('active'));
    element.classList.add('active');
}

function limpiarSeleccionTarjetas() {
    selectedAmount = null;
    document.querySelectorAll('.recharge-card-premium').forEach(c => c.classList.remove('active'));
}

function enviarAlWhatsAppSimple() {
    const customValue = document.getElementById('custom-recharge').value;
    const finalAmount = customValue ? parseInt(customValue) : selectedAmount;
    if (!finalAmount || finalAmount <= 0) return Swal.fire({ title: 'Monto Requerido', text: 'Selecciona un paquete o ingresa un valor válido.', icon: 'warning', background: 'var(--bg-card)', color: 'var(--text-white)' });
    const u = localStorage.getItem('dw_user') || 'Cliente';
    const mensaje = `🌟 *SOLICITUD DE RECARGA* 🌟\n\n👤 *Usuario:* ${u}\n💰 *Monto:* $${new Intl.NumberFormat('es-CO').format(finalAmount)}`;
    window.open(`https://wa.me/573016149753?text=${encodeURIComponent(mensaje)}`, '_blank');
}

function enviarAlWhatsAppSoporte(monto, nombre, fecha, hora) {
    const u = localStorage.getItem('dw_user') || 'Cliente';
    const mensaje = `Hola, hice una recarga de $${new Intl.NumberFormat('es-CO').format(monto)} pero la IA no la vio.\n👤 *Usuario:* ${u}\n📝 *Titular:* ${nombre}\n📅 *Fecha:* ${fecha} ${hora}`;
    window.open(`https://wa.me/573016149753?text=${encodeURIComponent(mensaje)}`, '_blank');
}

async function procesarPagoBancolombia() {
    const customValue = document.getElementById('custom-recharge').value;
    const finalAmount = customValue ? parseInt(customValue) : selectedAmount;
    if (!finalAmount || finalAmount <= 0) return Swal.fire({ title: 'Monto Requerido', icon: 'warning', background: 'var(--bg-card)', color: 'var(--text-white)' });

    let bono = finalAmount >= 200000 ? finalAmount * 0.1 : (finalAmount >= 100000 ? finalAmount * 0.075 : (finalAmount >= 50000 ? finalAmount * 0.05 : 0));
    const totalRecibir = finalAmount + bono;

    let htmlBono = bono > 0 ? `<div style="color:#10b981; font-weight:800; font-size:12px; margin-top:5px;">🎁 BONO INCLUIDO: $ ${new Intl.NumberFormat('es-CO').format(bono)}</div>` : '';

    const { value: formValues } = await Swal.fire({
        html: `
            <div class="banco-modal-container">
                <h2 class="banco-title">TRANSFERENCIA BANCARIA</h2>
                <p class="banco-subtitle">Sistema automático</p>
                <div class="banco-glass-card">
                    <p class="banco-step-title">Paso 1: Transfiere exactamente</p>
                    <div class="banco-amount-display">$ ${new Intl.NumberFormat('es-CO').format(finalAmount)}</div>
                    ${htmlBono}
                    <div class="banco-key-box" style="margin-top:15px;">
                        <span class="banco-key-label">Llave Bancolombia:</span>
                        <div class="banco-key-value">@ronadl274</div>
                    </div>
                </div>
                <div class="banco-glass-card" style="margin-top:15px;">
                    <p class="banco-step-title">Paso 2: Datos del Comprobante</p>
                    <input type="text" id="nombre-titular" class="banco-custom-input text-input" placeholder="NOMBRE DEL TITULAR" autocomplete="off">
                    <input type="date" id="fecha-pago" class="banco-custom-input text-input-date" value="${new Date().toISOString().split('T')[0]}" style="margin-top:10px;">
                    <div class="banco-time-selectors" style="margin-top:10px;">
                        <input type="number" id="hora" class="banco-custom-input" placeholder="00" min="1" max="12">
                        <span class="banco-time-separator">:</span>
                        <input type="number" id="minuto" class="banco-custom-input" placeholder="00" min="0" max="59">
                        <select id="ampm" class="banco-custom-select ampm-select-white"><option value="AM">AM</option><option value="PM">PM</option></select>
                    </div>
                </div>
            </div>
        `,
        focusConfirm: false, background: 'var(--bg-card)', showCloseButton: true, confirmButtonText: 'CONFIRMAR PAGO', confirmButtonColor: '#dc2626',
        showCancelButton: true, cancelButtonText: 'CANCELAR', customClass: { popup: 'banco-swal-popup', confirmButton: 'banco-btn-confirm', cancelButton: 'banco-btn-cancel' },
        preConfirm: () => {
            let nombre = document.getElementById('nombre-titular').value.trim();
            let fecha = document.getElementById('fecha-pago').value;
            let h = document.getElementById('hora').value;
            let m = document.getElementById('minuto').value;
            let ap = document.getElementById('ampm').value;
            if (!nombre || !h || !m) return Swal.showValidationMessage('⚠️ Completa todos los campos');
            let h24 = parseInt(h);
            if (ap === 'PM' && h24 !== 12) h24 += 12; else if (ap === 'AM' && h24 === 12) h24 = 0;
            const horaStr = h24.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0');
            const fParts = fecha.split("-");
            return { nombre: nombre.toUpperCase(), hora: horaStr, fecha: `${fParts[2]}/${fParts[1]}/${fParts[0].substring(2)}`, bono: bono };
        }
    });

    if (formValues) enviarAlServidorBancolombia(finalAmount, formValues.nombre, formValues.hora, formValues.fecha, formValues.bono);
}

/**
 * 🚀 FUNCIÓN CRÍTICA: VALIDA CON GOOGLE Y LUEGO GUARDA EN BD SIN RECARGAR LA PÁGINA (F5)
 */
async function enviarAlServidorBancolombia(monto, nombreTitular, horaPago, fechaPago, bonoCalculado) {
    const user = localStorage.getItem('dw_user') || 'Cliente';
    const token = localStorage.getItem('dw_token') || '';
    const email = localStorage.getItem('dw_email') || 'Sin correo'; 

    Swal.fire({ 
        html: `
            <div class="banco-loader-container">
                <div class="ia-scanner-ring" style="margin-bottom:20px;">
                    <span class="material-icons-round" style="font-size: 36px; color: var(--text-white);">memory</span>
                </div>
                <h2 class="banco-title" style="margin-top: 10px; font-size: 22px; color: var(--text-white);">Agente IA en proceso...</h2>
                <p style="color:var(--text-gray); font-size: 14px; margin-top: 12px; line-height:1.5; padding: 0 10px;">Nuestro agente está verificando tu transacción.</p>
                <div class="banco-glass-card" style="margin-top: 20px; padding: 15px; border-color: var(--border-color);">
                    <div id="ia-status" style="font-family: 'Inter', sans-serif; color: var(--text-white); font-size:11px; font-weight:800; letter-spacing: 1.5px; text-transform:uppercase;">> ESTABLECIENDO CONEXIÓN...</div>
                </div>
            </div>
        `,
        allowOutsideClick: false, showConfirmButton: false, background: 'var(--bg-card)', customClass: { popup: 'banco-swal-popup' }
    });

    try {
        // 1. Notificar a Google
        await fetch(GAS_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ usuario: user, monto: monto, bono: bonoCalculado, email_usuario: email, hora_pago: horaPago, fecha_pago: fechaPago, nombre: nombreTitular }) });

        let recargaExitosa = false;
        
        // 2. Bucle de escaneo IA
        for (let i = 1; i <= 2; i++) {
            const statusText = document.getElementById('ia-status');
            if(statusText) statusText.innerText = `> ESCANEANDO BANCO (Intento ${i})...`;
            
            const resp = await fetch(`${GAS_URL}?action=forceScan&usuario=${encodeURIComponent(user)}&monto=${monto}`);
            const data = await resp.json();
            if (data.estado === 'APROBADO') { 
                recargaExitosa = true; 
                break; 
            }
            await new Promise(r => setTimeout(r, 10000));
        }

        if (recargaExitosa) {
            // 🔥 AVISAR AL PHP Y ACTUALIZAR SALDO DINÁMICAMENTE 🔥
            const statusText = document.getElementById('ia-status');
            if(statusText) statusText.innerText = `> ¡PAGO ENCONTRADO! ACREDITANDO SALDO...`;
            
            const totalRecarga = monto + bonoCalculado;
            const orderId = "REC-" + Math.random().toString(36).substring(2, 8).toUpperCase();

            const respDb = await fetch(API_CLIENTE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accion: 'procesarRecargaAutomatica',
                    usuario: user,
                    token: token,
                    monto: totalRecarga,
                    order_id: orderId,
                    metodo: 'Bancolombia'
                })
            });

            const finalData = await respDb.json();
            
            if (finalData.success) {
                const nuevoSaldoFormat = new Intl.NumberFormat('es-CO').format(finalData.nuevo_saldo);
                
                // ACTUALIZAR SALDO EN ALMACENAMIENTO Y EN UI USANDO LAS FUNCIONES DE TU CÓDIGO
                localStorage.setItem('dw_saldo', finalData.nuevo_saldo);
                if (typeof window.sincronizarSaldo === 'function') {
                    window.sincronizarSaldo(); // Va a la BD y actualiza la UI
                } else if (typeof window.updateBalanceUI === 'function') {
                    if (typeof userBalance !== 'undefined') userBalance = finalData.nuevo_saldo;
                    window.updateBalanceUI();
                }

                // MODAL DE ÉXITO DINÁMICO
                Swal.fire({
                    html: `
                        <div class="banco-success-container" style="text-align: center; padding: 10px;">
                            <div style="margin-bottom:20px; animation: floatPremium 3s ease-in-out infinite;">
                                <div style="width:90px; height:90px; border-radius:50%; background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05)); display:flex; align-items:center; justify-content:center; margin: 0 auto; box-shadow: 0 10px 30px rgba(16,185,129,0.2); border: 1px solid rgba(16,185,129,0.4);">
                                    <span class="material-icons-round" style="font-size: 45px; color: #10b981; text-shadow: 0 0 15px rgba(16, 185, 129, 0.8);">check_circle</span>
                                </div>
                            </div>
                            <h2 class="banco-title" style="margin-top:10px; color:var(--text-white); font-size:26px; font-weight:900; letter-spacing:-0.5px;">¡Recarga Exitosa!</h2>
                            <p style="color: var(--text-gray); font-size: 15px; margin-top: 15px; line-height: 1.5;">Tu transferencia ha sido validada y acreditada al instante.</p>
                            
                            <div style="margin-top:25px; padding: 15px; border: 1px dashed rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.05); border-radius: 12px; display:flex; align-items:center; justify-content:center; gap: 10px;">
                                <span class="material-icons-round" style="color:#10b981; font-size: 18px;">account_balance_wallet</span>
                                <p style="color: #10b981; font-size: 14px; font-weight: 800; margin: 0; letter-spacing: 0.5px; text-transform:uppercase;">NUEVO SALDO: $ ${nuevoSaldoFormat}</p>
                            </div>
                        </div>
                    `,
                    background: 'var(--bg-card)', showConfirmButton: true, confirmButtonColor: '#10b981', confirmButtonText: 'EXCELENTE',
                    customClass: { popup: 'banco-swal-popup', confirmButton: 'banco-btn-confirm' }
                }).then(() => {
                    // Limpiamos los campos del modal de recarga para una próxima vez
                    if(document.getElementById('custom-recharge')) document.getElementById('custom-recharge').value = "";
                    limpiarSeleccionTarjetas();
                });
            } else {
                Swal.fire({
                    title: 'Error de Acreditación',
                    text: 'El banco lo aprobó pero el servidor rechazó el saldo: ' + finalData.msg,
                    icon: 'error', background: 'var(--bg-card)', color: 'var(--text-white)', confirmButtonColor: '#dc2626',
                    customClass: { popup: 'banco-swal-popup' }
                });
            }
        } else {
            // RECHAZO DE IA CON COLORES VARIABLES
            fetch(GAS_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'rechazar_timeout', usuario: user, monto: monto }) });
            
            Swal.fire({
                html: `
                    <div style="text-align:center; padding: 10px 5px;">
                        <div style="width: 70px; height: 70px; background: rgba(239,68,68,0.1); border-radius: 50%; display:flex; align-items:center; justify-content:center; margin: 0 auto 20px auto; border: 1px solid rgba(239,68,68,0.3); box-shadow: 0 0 20px rgba(239,68,68,0.2);">
                            <span class="material-icons-round" style="font-size: 38px; color: #ef4444;">error_outline</span>
                        </div>
                        <h2 style="color:var(--text-white); font-size:22px; font-weight:900; margin:0 0 10px 0; letter-spacing: -0.5px;">Transacción No Encontrada</h2>
                        <p style="color:var(--text-gray); font-size: 14px; line-height:1.6; margin-bottom:20px;">Lo sentimos, la IA no pudo localizar el pago. Por favor verifica que los datos coincidan <b>exactamente</b> con tu comprobante.</p>
                        
                        <div style="background: var(--bg-dark); border: 1px solid var(--border-color); padding: 15px; border-radius: 12px; text-align:left;">
                            <p style="color:var(--text-gray); font-size:12px; margin:0;"><span style="color:var(--accent-text); font-weight:bold;">SOPORTE:</span> Si estás seguro de que la información es correcta, presiona el botón abajo para solicitar una validación humana.</p>
                        </div>
                    </div>
                `,
                background: 'var(--bg-card)', showCancelButton: true, confirmButtonColor: '#25d366', cancelButtonColor: 'transparent',
                confirmButtonText: '<span class="material-icons-round" style="vertical-align: middle; margin-right: 6px; font-size: 20px;">support_agent</span> SOLICITAR SOPORTE', 
                cancelButtonText: 'CERRAR', customClass: { popup: 'banco-swal-popup', confirmButton: 'banco-btn-confirm', cancelButton: 'banco-btn-cancel' }
            }).then((result) => { 
                if (result.isConfirmed) enviarAlWhatsAppSoporte(monto, nombreTitular, fechaPago, horaPago);
            });
        }
    } catch (e) {
        Swal.fire({
            title: 'Error Crítico', text: 'Se perdió la conexión con el servidor. Intenta de nuevo.', icon: 'error',
            background: 'var(--bg-card)', color: 'var(--text-white)', confirmButtonColor: '#dc2626',
            customClass: { popup: 'banco-swal-popup' }
        });
    }
}

async function verHistorialRecargas() {
    const user = localStorage.getItem('dw_user');
    if (!user) return Swal.fire({ title: 'Identificación requerida', text: 'Inicia sesión para ver tu historial.', icon: 'info', background: 'var(--bg-card)', color: 'var(--text-white)' });

    Swal.fire({ 
        html: '<div class="ia-scanner-ring" style="margin-bottom:20px;"></div><h2 class="banco-title" style="color: var(--text-white);">Sincronizando...</h2>',
        allowOutsideClick: false, showConfirmButton: false, background: 'var(--bg-card)', customClass: { popup: 'banco-swal-popup' }
    });

    try {
        const response = await fetch(`${GAS_URL}?action=getHistory&usuario=${encodeURIComponent(user)}`);
        const data = await response.json();

        let htmlHistorial = "";
        
        if (!data.historial || data.historial.length === 0) {
            htmlHistorial = `<div class="empty-history-state"><p style="color:var(--text-gray); font-size: 13px; text-align:center; padding: 20px 0;">No tienes recargas recientes registradas en el sistema automático.</p></div>`;
        } else {
            htmlHistorial = data.historial.map((r, index) => {
                let colorBase = r.estado === 'APROBADO' ? '#10b981' : (r.estado === 'RECHAZADA' ? '#ef4444' : '#f59e0b');
                let iconEstado = r.estado === 'APROBADO' ? 'check_circle' : (r.estado === 'RECHAZADA' ? 'cancel' : 'schedule');
                let estadoText = r.estado === 'APROBADO' ? 'Aprobada' : (r.estado === 'RECHAZADA' ? 'Rechazada' : 'En Espera');
                const d = new Date(r.fecha);
                const fechaCorta = isNaN(d) ? r.fecha.substring(0,10) : d.toLocaleDateString('es-CO');
                
                return `
                <div class="history-item-card premium-slide-up" style="animation-delay: ${index * 0.1}s; border-left: 3px solid ${colorBase}; background: var(--bg-dark);">
                    <div class="history-info">
                        <span class="history-amount" style="color:var(--text-white); font-weight:900;">$ ${new Intl.NumberFormat('es-CO').format(r.monto)}</span>
                        <span class="history-date" style="color:var(--text-gray); font-size:11px;">${fechaCorta}</span>
                    </div>
                    <div class="history-status" style="color: ${colorBase}; font-size:10px; font-weight:800; background: ${colorBase}15; padding: 5px 10px; border-radius: 20px; display:flex; align-items:center; gap:5px;">
                        <span class="material-icons-round" style="font-size:12px;">${iconEstado}</span> ${estadoText}
                    </div>
                </div>`;
            }).join('');
        }

        Swal.fire({
            html: `
                <div class="banco-modal-container" style="padding: 20px 15px;">
                    <div class="history-header">
                        <span class="material-icons-round" style="color: var(--text-white); font-size: 26px; background: var(--accent); padding:8px; border-radius:10px;">receipt_long</span>
                        <div style="text-align: left;">
                            <h2 class="banco-title" style="font-size: 18px; margin:0; color: var(--text-white);">HISTORIAL IA</h2>
                            <p style="color:var(--text-gray); font-size:11px; margin:0;">Tus últimos 5 movimientos</p>
                        </div>
                    </div>
                    <div class="history-container">${htmlHistorial}</div>
                </div>
            `,
            background: 'var(--bg-card)', width: '420px', padding: '0', showCloseButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'CERRAR',
            customClass: { popup: 'banco-swal-popup', confirmButton: 'banco-btn-cancel' } 
        });

    } catch (err) {
        Swal.fire({ title: 'Error', text: 'No se pudo cargar el historial.', icon: 'error', background: 'var(--bg-card)', color: 'var(--text-white)', confirmButtonColor: '#dc2626' });
    }
}

/**
 * 8. ESTILOS COMPLETOS (ULTRA-PREMIUM)
 * 100% Adaptativos a Light Mode y Dark Mode usando tus variables nativas.
 */
const recargaStyles = `
    .recharge-wrapper-premium { max-width: 850px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 20px; }
    .recharge-grid-premium { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; width: 100%; margin-bottom: 40px; justify-content: center; }
    .recharge-card-premium { background: var(--bg-card); border: 1px solid var(--border-color); padding: 30px 20px; border-radius: 20px; text-align: center; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; }
    .recharge-card-premium:hover { background: var(--bg-dark); border-color: var(--accent); transform: translateY(-5px); }
    .recharge-card-premium.active { border-color: var(--accent); background: rgba(220, 38, 38, 0.08); box-shadow: 0 0 40px rgba(220, 38, 38, 0.15); }
    .recharge-card-icon span { font-size: 2.8rem; color: var(--text-gray); margin-bottom: 15px; display: block; transition: 0.3s; }
    .recharge-card-premium.active .recharge-card-icon span { color: var(--accent); text-shadow: 0 0 20px rgba(220, 38, 38, 0.5); transform: scale(1.1); }
    .recharge-label { display: block; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); margin-bottom: 8px; font-weight: 700; }
    .recharge-price { display: block; font-size: 1.5rem; font-weight: 800; color: var(--text-white); font-family: 'Inter', sans-serif; letter-spacing: -0.5px; }
    .selection-check { position: absolute; top: 15px; right: 15px; color: var(--accent); opacity: 0; transition: 0.3s; transform: scale(0.8); }
    .recharge-card-premium.active .selection-check { opacity: 1; transform: scale(1); }
    
    .recharge-input-section { width: 100%; max-width: 400px; text-align: center; margin-bottom: 40px; }
    .input-helper-text { color: var(--text-gray); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; font-weight: 800; }
    .input-field-recharge::-webkit-outer-spin-button, .input-field-recharge::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .input-field-recharge { -moz-appearance: textfield; background: var(--bg-card); border: 1px solid var(--border-color); padding: 20px; border-radius: 15px; color: var(--text-white); text-align: center; width: 100%; font-size: 1.4rem; font-weight: 700; transition: 0.3s; letter-spacing: 1px; }
    .input-field-recharge:focus { border-color: var(--accent); outline: none; box-shadow: 0 0 25px var(--accent-glow); background: var(--bg-dark); }
    .input-field-recharge::placeholder { color: var(--text-gray); font-weight: 500; }
    
    /* ACORDEÓN DE BONOS */
    .bonus-table-container { width: 100%; max-width: 400px; margin: 20px auto 30px auto; background: var(--bg-dark); border: 1px solid var(--border-color); border-radius: 15px; overflow: hidden; transition: 0.3s; }
    .bonus-table-container:hover { border-color: var(--accent); }
    .bonus-table-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; cursor: pointer; user-select: none; }
    .bonus-table-title { color: var(--text-gray); font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; transition: 0.3s; }
    .bonus-table-header:hover .bonus-table-title { color: var(--text-white); }
    .bonus-chevron { color: var(--text-gray); transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    .bonus-table-body { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease, opacity 0.3s ease; padding: 0 15px; }
    .bonus-table-body.open { max-height: 300px; opacity: 1; padding: 0 15px 15px 15px; border-top: 1px dashed var(--border-color); margin-top: 5px; }
    .bonus-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; margin-top: 10px; }
    .bonus-table th { color: var(--text-gray); font-weight: 700; padding: 8px 5px; border-bottom: 1px dashed var(--border-color); font-size: 10px; letter-spacing: 1px; }
    .bonus-table td { color: var(--text-white); padding: 10px 5px; border-bottom: 1px solid var(--border-color); font-weight: 600; }
    .bonus-table tr:last-child td { border-bottom: none; }
    .bonus-highlight { color: #10b981 !important; font-weight: 900 !important; }
    
    .recharge-actions-elite { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .btn-action-recharge { display: flex; align-items: center; justify-content: center; gap: 15px; width: 100%; max-width: 400px; padding: 18px; border-radius: 50px; font-weight: 800; letter-spacing: 1.5px; cursor: pointer; transition: 0.3s; border: none; text-transform: uppercase; font-size: 0.85rem; font-family: 'Inter', sans-serif; }
    .btn-action-recharge.wsp { background: #25d366; color: #000; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.2); }
    .btn-action-recharge.wsp:hover { background: #22c55e; box-shadow: 0 6px 25px rgba(37, 211, 102, 0.4); transform: translateY(-2px); }
    .btn-icon-wsp { width: 24px; height: 24px; object-fit: contain; }
    .btn-action-recharge.bank { background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-gray); }
    .btn-action-recharge.bank:hover { border-color: var(--accent); color: var(--text-white); background: var(--bg-dark); transform: translateY(-2px); }
    .btn-action-recharge.history-btn { background: transparent; border: 1px dashed var(--border-color); color: var(--text-gray); padding: 15px; font-size: 0.75rem; }
    .btn-action-recharge.history-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(220,38,38,0.05); }

    /* ESTILOS SWAL / MODALES BANCARIOS BLINDADOS AL TEMA */
    .premium-toast { border-radius: 15px !important; border: 1px solid var(--border-color) !important; }
    .banco-swal-popup { border: 1px solid var(--border-color) !important; border-radius: 24px !important; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5) !important; background: var(--bg-card) !important; overflow: hidden; }
    .banco-modal-container, .banco-loader-container { padding: 30px 20px 10px 20px; text-align: center; font-family: 'Inter', sans-serif; }
    .banco-glass-card { background: var(--bg-dark); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; text-align: center; }
    .banco-title { color: var(--text-white); font-size: 22px; font-weight: 900; letter-spacing: 1px; margin: 0 0 5px 0; }
    .banco-subtitle { color: var(--text-gray); font-size: 13px; margin: 0 0 25px 0; text-transform: uppercase; letter-spacing: 1.5px; }
    .banco-step-title { color: var(--text-white); font-size: 13px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; margin: 0 0 10px 0; }
    .banco-amount-display { font-size: 38px; font-weight: 900; color: var(--text-white); text-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 15px; letter-spacing: -1px; }
    .banco-key-box { background: var(--bg-dark); border-radius: 12px; padding: 12px; border: 1px dashed var(--border-color); display: flex; flex-direction: column; align-items: center; }
    .banco-key-label { color: var(--text-gray); font-size: 12px; margin-bottom: 5px; }
    .banco-key-value { color: var(--text-white); font-size: 20px; font-weight: 800; letter-spacing: 2px; }

    .banco-custom-input.text-input, .banco-custom-input.text-input-date { width: 100%; text-align: left; padding: 15px; font-size: 15px; background: var(--bg-dark) !important; color: var(--text-white) !important; font-weight: 800; text-transform: uppercase; border: 2px solid var(--border-color); border-radius: 10px; box-sizing: border-box; box-shadow: inset 0 2px 5px rgba(0,0,0,0.05); transition: 0.3s; }
    .banco-custom-input.text-input::placeholder { color: var(--text-gray) !important; font-weight: 500; text-transform: none; }
    .banco-custom-input.text-input:focus, .banco-custom-input.text-input-date:focus { background: var(--bg-card) !important; color: var(--text-white) !important; border-color: var(--accent) !important; box-shadow: 0 0 15px var(--accent-glow) !important; outline: none; }
    
    .banco-time-selectors { display: flex; justify-content: center; align-items: center; gap: 8px; }
    .banco-custom-input { width: 65px; appearance: none; background: var(--bg-dark); color: var(--text-white); border: 1px solid var(--border-color); padding: 12px 0; border-radius: 10px; font-size: 18px; font-weight: 700; text-align: center; outline: none; transition: 0.3s;}
    .banco-custom-select.ampm-select-white { width: 100%; background: var(--bg-dark) !important; color: var(--text-white) !important; border: 2px solid var(--border-color); padding: 12px 0; border-radius: 10px; font-size: 16px; font-weight: 900; text-align: center; cursor: pointer; outline: none; }
    .banco-time-separator { color: var(--text-gray); font-size: 24px; font-weight: bold; margin: 0 2px; }

    .ia-scanner-ring { width: 80px; height: 80px; margin: 0 auto; border-radius: 50%; display:flex; align-items:center; justify-content:center; border: 2px solid var(--border-color); position:relative; box-shadow: 0 0 25px rgba(0,0,0,0.1); }
    .ia-scanner-ring::before { content: ''; position:absolute; top:-2px; left:-2px; right:-2px; bottom:-2px; border-radius:50%; border: 2px solid transparent; border-top-color: var(--accent-text); animation: ia-spin 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite; }
    @keyframes ia-spin { 100% { transform: rotate(360deg); } }
    @keyframes floatPremium { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-8px) scale(1.02); } }

    .banco-swal-actions { margin-top: 10px !important; gap: 10px !important; padding: 0 20px 20px 20px !important; width: 100% !important; box-sizing: border-box; }
    .banco-btn-confirm { border-radius: 12px !important; padding: 14px 0 !important; font-weight: 800 !important; letter-spacing: 1px !important; width: 100% !important; margin: 0 !important; background: var(--accent-gradient) !important; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3) !important; transition: 0.3s !important; color:#fff !important;}
    .banco-btn-cancel { border-radius: 12px !important; padding: 14px 0 !important; font-weight: 700 !important; letter-spacing: 1px !important; width: 100% !important; margin: 0 !important; border: 1px solid var(--border-color) !important; color: var(--text-gray) !important; background: var(--bg-dark) !important;}

    .history-header { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px dashed var(--border-color); }
    .history-container { display: flex; flex-direction: column; gap: 12px; max-height: 280px; overflow-y: auto; padding-right: 8px; }
    .history-item-card { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-radius: 12px; text-align: left; border-top: 1px solid var(--border-color); }
    .history-amount { color: var(--text-white); font-size: 18px; font-weight: 900; font-family: 'Inter', sans-serif; letter-spacing: -0.5px; margin-bottom: 3px; display:block;}
    .premium-slide-up { animation: slideUpFade 0.4s ease forwards; opacity: 0; transform: translateY(15px); }
    @keyframes slideUpFade { to { opacity: 1; transform: translateY(0); } }

    /* VIDEOS */
    .btn-tutorial-video { background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-white); padding: 8px 20px; border-radius: 50px; display: inline-flex; align-items: center; gap: 8px; font-weight: 800; font-size: 0.75rem; letter-spacing: 1px; cursor: pointer; transition: 0.3s; margin-top: 15px; }
    .btn-tutorial-video:hover { background: var(--bg-card); border-color: var(--accent); box-shadow: 0 0 15px var(--accent-glow); transform: translateY(-2px); }
    .iframe-wrapper { position: relative; width: 100%; height: 60vh; max-height: 500px; min-height: 300px; border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); background: #000; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
    .iframe-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
`;

const styleSheetRecarga = document.createElement("style");
styleSheetRecarga.innerText = recargaStyles;
document.head.appendChild(styleSheetRecarga);
