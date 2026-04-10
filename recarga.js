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

    const hoy = new Date();
    const fechaLocal = hoy.getFullYear() + '-' + 
                       String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(hoy.getDate()).padStart(2, '0');

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
                    
                    <input type="date" id="fecha-pago" class="banco-custom-input text-input-date" value="${fechaLocal}" style="margin-top:10px;">
                    
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
 * 🚀 FUNCIÓN CRÍTICA: VALIDA CON GOOGLE Y LUEGO GUARDA EN BD
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
        await fetch(GS_RECARGA, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ usuario: user, monto: monto, bono: bonoCalculado, email_usuario: email, hora_pago: horaPago, fecha_pago: fechaPago, nombre: nombreTitular }) });

        let recargaExitosa = false;
        
        // 2. Bucle de escaneo IA
        for (let i = 1; i <= 2; i++) {
            const statusText = document.getElementById('ia-status');
            if(statusText) statusText.innerText = `> ESCANEANDO BANCO (Intento ${i})...`;
            
            const resp = await fetch(`${GS_RECARGA}?action=forceScan&usuario=${encodeURIComponent(user)}&monto=${monto}`);
            const data = await resp.json();
            
            if (data.estado === 'APROBADO') { 
                recargaExitosa = true; 
                break; 
            }
            
            // MEJORA 2 APLICADA: Solo esperamos los 10s si habrá un siguiente intento.
            // Si i == 2 (último intento) y falló, no esperamos más, terminamos de inmediato.
            if (i < 2) {
                await new Promise(r => setTimeout(r, 10000));
            }
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
                
                localStorage.setItem('dw_saldo', finalData.nuevo_saldo);
                if (typeof window.sincronizarSaldo === 'function') {
                    window.sincronizarSaldo(); 
                } else if (typeof window.updateBalanceUI === 'function') {
                    if (typeof userBalance !== 'undefined') userBalance = finalData.nuevo_saldo;
                    window.updateBalanceUI();
                }

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
            fetch(GS_RECARGA, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'rechazar_timeout', usuario: user, monto: monto }) });
            
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
        const response = await fetch(`${GS_RECARGA}?action=getHistory&usuario=${encodeURIComponent(user)}`);
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
