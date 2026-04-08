let dw_usuarioRecuperacion = "";
let dw_correoRecuperacion = "";
let dw_telRecuperacion = "";

/**
 * 1. CAMBIO DE VISTA: SOLICITUD DE DATOS
 */
window.mostrarRecuperacionPaso1 = function() {
    const mainBox = document.getElementById('login-box-main');
    const step1 = document.getElementById('recover-step-1');
    
    if (mainBox && step1) {
        mainBox.classList.add('hidden');
        step1.classList.remove('hidden');
        step1.style.animation = "fadeInScale 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards";
        
        // Verificar si el botón estaba bloqueado desde antes
        const btn = document.getElementById('btn-recover-1');
        if (typeof window.verificarBloqueoBoton === 'function') {
            window.verificarBloqueoBoton(btn, 'dw_rec1_cooldown', 'COMPROBAR IDENTIDAD');
        }
    }
};

/**
 * 2. REGRESO AL ACCESO PRINCIPAL
 */
window.volverLogin = function() {
    document.getElementById('recover-step-1')?.classList.add('hidden');
    document.getElementById('recover-step-2')?.classList.add('hidden');
    
    const mainBox = document.getElementById('login-box-main');
    if (mainBox) {
        mainBox.classList.remove('hidden');
        mainBox.style.animation = "fadeInScale 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards";
    }
};

/**
 * 3. PASO 1: VALIDACIÓN DE IDENTIDAD (CORREO + TELÉFONO)
 */
async function enviarSolicitudRecuperacion(e) {
    if (e) e.preventDefault();

    const btn = document.getElementById('btn-recover-1');
    
    // Evitar que envíen datos si están castigados
    if (typeof window.verificarBloqueoBoton === 'function') {
        if (window.verificarBloqueoBoton(btn, 'dw_rec1_cooldown', 'COMPROBAR IDENTIDAD')) return;
    }

    dw_correoRecuperacion = document.getElementById('rec-correo').value.trim();
    dw_telRecuperacion = document.getElementById('rec-tel').value.trim();

    // Validación básica de formato
    if (!dw_correoRecuperacion.includes('@') || dw_telRecuperacion.length < 7) {
        return Swal.fire({ 
            icon: 'warning', 
            title: 'Formato Inválido', 
            text: 'Asegúrate de ingresar un correo electrónico real y un número de contacto válido.',
            background: document.body.classList.contains('dark-mode') ? 'var(--bg-card)' : '#ffffff',
            color: 'var(--text-main)', 
            confirmButtonColor: 'var(--accent-text)',
            customClass: { popup: 'premium-modal-radius' }
        });
    }

    btn.innerHTML = '<i class="material-icons-round fa-spin">sync</i> VERIFICANDO...';
    btn.disabled = true;

    try {
        const res = await apiCall({ 
            accion: 'validarDatosRecuperacion', 
            correo: dw_correoRecuperacion, 
            telefono: dw_telRecuperacion 
        });

        if (res.success) {
            localStorage.removeItem('dw_rec1_cooldown'); // Limpiar castigo al tener éxito
            dw_usuarioRecuperacion = res.usuario; 
            
            document.getElementById('recover-step-1').classList.add('hidden');
            const step2 = document.getElementById('recover-step-2');
            step2.classList.remove('hidden');
            step2.style.animation = "fadeInScale 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards";
            
            // Revisar si el botón de actualizar estaba castigado previamente
            const btn2 = document.getElementById('btn-recover-2');
            if (typeof window.verificarBloqueoBoton === 'function') {
                window.verificarBloqueoBoton(btn2, 'dw_rec2_cooldown', 'ACTUALIZAR CONTRASEÑA');
            }

            Swal.fire({ 
                icon: 'success', 
                title: 'Identidad Confirmada', 
                text: `Hola ${res.usuario}, hemos verificado tu cuenta. Define tu nueva contraseña ahora.`, 
                background: document.body.classList.contains('dark-mode') ? 'var(--bg-card)' : '#ffffff',
                color: 'var(--text-main)', 
                showConfirmButton: false,
                timer: 3500,
                customClass: { popup: 'premium-modal-radius' }
            });
            
            btn.innerHTML = "COMPROBAR IDENTIDAD";
            btn.disabled = false;
        } else {
            // 🔥 CASTIGO: Bloqueo de 30 segundos
            if (typeof window.iniciarBloqueoBoton === 'function') {
                window.iniciarBloqueoBoton(btn, 'dw_rec1_cooldown', 'COMPROBAR IDENTIDAD', 30);
            }
            
            Swal.fire({ 
                icon: 'error', 
                title: 'Datos no encontrados', 
                text: 'Los datos ingresados no coinciden con ninguna cuenta en nuestra bóveda.', 
                background: document.body.classList.contains('dark-mode') ? 'var(--bg-card)' : '#ffffff',
                color: 'var(--text-main)',
                confirmButtonColor: 'var(--danger)',
                customClass: { popup: 'premium-modal-radius' }
            });
        }
    } catch (err) {
        if (typeof window.iniciarBloqueoBoton === 'function') {
            window.iniciarBloqueoBoton(btn, 'dw_rec1_cooldown', 'COMPROBAR IDENTIDAD', 30);
        }
        Swal.fire({ 
            icon: 'error', 
            title: 'Fallo de Red', 
            text: 'No se pudo establecer conexión con el servidor central.', 
            background: document.body.classList.contains('dark-mode') ? 'var(--bg-card)' : '#ffffff',
            color: 'var(--text-main)',
            confirmButtonColor: 'var(--danger)',
            customClass: { popup: 'premium-modal-radius' }
        });
    }
}

/**
 * 4. PASO 2: ACTUALIZACIÓN DEFINITIVA DE CLAVE
 */
async function procesarNuevaClave(e) {
    if (e) e.preventDefault(); 
    const btn = document.getElementById('btn-recover-2');

    // Evitar bypass
    if (typeof window.verificarBloqueoBoton === 'function') {
        if (window.verificarBloqueoBoton(btn, 'dw_rec2_cooldown', 'ACTUALIZAR CONTRASEÑA')) return;
    }

    const nuevaClave = document.getElementById('rec-nueva-clave').value.trim();

    if (nuevaClave.length < 4) {
        return Swal.fire({ 
            icon: 'warning', 
            title: 'Clave Vulnerable', 
            text: 'Por seguridad, ingresa una clave de al menos 4 caracteres.', 
            background: document.body.classList.contains('dark-mode') ? 'var(--bg-card)' : '#ffffff',
            color: 'var(--text-main)',
            confirmButtonColor: 'var(--accent-text)',
            customClass: { popup: 'premium-modal-radius' }
        });
    }

    btn.innerHTML = '<i class="material-icons-round fa-spin">sync</i> PROCESANDO...';
    btn.disabled = true;

    try {
        const res = await apiCall({ 
            accion: 'cambiarClaveOlvidada', 
            usuario: dw_usuarioRecuperacion, 
            correo: dw_correoRecuperacion,
            telefono: dw_telRecuperacion,
            nuevaClave: nuevaClave 
        });

        if (res.success) {
            localStorage.removeItem('dw_rec2_cooldown'); // Limpiar castigo
            
            Swal.fire({ 
                icon: 'success', 
                title: '¡Clave Actualizada!', 
                text: 'Tu contraseña ha sido restablecida con éxito. Ya puedes ingresar a la bóveda.', 
                background: document.body.classList.contains('dark-mode') ? 'var(--bg-card)' : '#ffffff',
                color: 'var(--text-main)', 
                confirmButtonColor: 'var(--accent-text)',
                customClass: { popup: 'premium-modal-radius' }
            }).then(() => {
                // Limpieza de campos y reinicio
                document.getElementById('rec-correo').value = "";
                document.getElementById('rec-tel').value = "";
                document.getElementById('rec-nueva-clave').value = "";
                dw_usuarioRecuperacion = "";
                btn.innerHTML = "ACTUALIZAR CONTRASEÑA";
                btn.disabled = false;
                volverLogin();
            });
        } else {
            // 🔥 CASTIGO: Bloqueo de 30 segundos
            if (typeof window.iniciarBloqueoBoton === 'function') {
                window.iniciarBloqueoBoton(btn, 'dw_rec2_cooldown', 'ACTUALIZAR CONTRASEÑA', 30);
            }
            Swal.fire({ 
                icon: 'error', 
                title: 'Error en Proceso', 
                text: res.msg, 
                background: document.body.classList.contains('dark-mode') ? 'var(--bg-card)' : '#ffffff',
                color: 'var(--text-main)',
                confirmButtonColor: 'var(--danger)',
                customClass: { popup: 'premium-modal-radius' }
            });
        }
    } catch (err) {
        if (typeof window.iniciarBloqueoBoton === 'function') {
            window.iniciarBloqueoBoton(btn, 'dw_rec2_cooldown', 'ACTUALIZAR CONTRASEÑA', 30);
        }
        Swal.fire({ 
            icon: 'error', 
            title: 'Error Crítico', 
            text: 'Ocurrió un fallo técnico al intentar actualizar la clave.', 
            background: document.body.classList.contains('dark-mode') ? 'var(--bg-card)' : '#ffffff',
            color: 'var(--text-main)',
            confirmButtonColor: 'var(--danger)',
            customClass: { popup: 'premium-modal-radius' }
        });
    }
}

/**
 * ===============================================================
 * ESTILOS CSS PREMIUM PARA RECUPERACIÓN (NEÓN & MODERN UI)
 * ===============================================================
 */
const contraStyles = `
    /* Forzar ocultamiento absoluto para las transiciones */
    #recover-step-1.hidden, #recover-step-2.hidden {
        display: none !important;
    }

    /* Rediseño de los Inputs de Recuperación */
    #recover-step-1 .input-field, 
    #recover-step-2 .input-field {
        width: 100% !important;
        box-sizing: border-box !important;
        background: rgba(0, 0, 0, 0.03) !important;
        border: 2px solid var(--border-color) !important;
        color: var(--text-main) !important;
        padding: 16px 20px !important;
        border-radius: 14px !important;
        font-size: 0.95rem !important;
        font-weight: 600 !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        outline: none !important;
        margin-bottom: 15px !important;
        text-align: center !important;
        letter-spacing: 1px !important;
    }
    
    body.dark-mode #recover-step-1 .input-field, 
    body.dark-mode #recover-step-2 .input-field {
        background: rgba(0, 0, 0, 0.3) !important;
    }

    #recover-step-1 .input-field:focus, 
    #recover-step-2 .input-field:focus {
        border-color: var(--accent-text) !important;
        box-shadow: 0 0 20px var(--accent-glow) !important;
        transform: translateY(-2px) !important;
        background: var(--bg-card) !important;
    }
    
    #recover-step-1 .input-field::placeholder,
    #recover-step-2 .input-field::placeholder {
        color: var(--text-gray) !important;
        font-weight: 400 !important;
    }

    /* Estilo Premium de los Botones Principales */
    #btn-recover-1, #btn-recover-2 {
        background: var(--accent-gradient) !important;
        color: #ffffff !important;
        border: none !important;
        padding: 18px !important;
        border-radius: 14px !important;
        font-weight: 800 !important;
        font-size: 0.95rem !important;
        letter-spacing: 2px !important;
        text-transform: uppercase !important;
        width: 100% !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        transition: all 0.3s ease !important;
        box-shadow: 0 8px 20px var(--accent-glow) !important;
        margin-top: 10px !important;
    }

    #btn-recover-1:hover:not(:disabled), 
    #btn-recover-2:hover:not(:disabled) {
        transform: translateY(-3px) scale(1.02) !important;
        box-shadow: 0 12px 25px var(--accent-glow) !important;
        filter: brightness(1.1) !important;
    }
    
    #btn-recover-1:active:not(:disabled), 
    #btn-recover-2:active:not(:disabled) {
        transform: translateY(1px) scale(0.98) !important;
    }

    /* Botón Moderno de "Volver al Inicio" */
    .back-container {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 10px !important;
        width: 100% !important;
        margin: 20px auto 0 auto !important;
        padding: 15px !important;
        color: var(--text-gray) !important;
        background: var(--bg-dark) !important;
        border: 1px solid var(--border-color) !important;
        font-size: 0.85rem !important;
        font-weight: 800 !important;
        letter-spacing: 1px !important;
        cursor: pointer !important;
        border-radius: 14px !important;
        transition: all 0.3s ease !important;
        text-transform: uppercase !important;
        box-sizing: border-box !important;
    }
    
    .back-container:hover {
        color: var(--text-white) !important;
        border-color: var(--accent-text) !important;
        box-shadow: 0 5px 15px var(--accent-glow) !important;
        transform: translateY(-2px) !important;
    }

    /* EL BLINDAJE: Esto evita que el icono se rompa y se vuelva texto */
    .back-container .material-icons-round {
        font-family: 'Material Icons Round', sans-serif !important;
        font-size: 1.4rem !important;
        text-transform: none !important;
        font-style: normal !important;
        font-weight: normal !important;
        letter-spacing: normal !important;
        transition: transform 0.3s ease, color 0.3s ease !important;
    }

    .back-container:hover .material-icons-round {
        transform: translateX(-5px) !important;
        color: var(--accent-text) !important;
    }

    /* Animación fluida al cambiar de vista */
    @keyframes fadeInScale {
        0% { opacity: 0; transform: scale(0.95) translateY(10px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    
    .fa-spin { animation: spin 1s infinite linear; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;

const styleSheetContra = document.createElement("style");
styleSheetContra.innerText = contraStyles;
document.head.appendChild(styleSheetContra);
