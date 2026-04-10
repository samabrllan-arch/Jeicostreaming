/* =================================================================================
   ARCHIVO: recuperacion_clave.js (LADO CLIENTE)
   Lógica: Flujo seguro de restablecimiento de contraseñas.
================================================================================= */

// Variables globales mantenidas a petición (Mejora 4 Omitida)
let dw_usuarioRecuperacion = "";
let dw_tokenRecuperacion = ""; // 🔥 MEJORA 1: Usamos Token en lugar de correo/teléfono en texto plano

/**
 * 1. CAMBIO DE VISTA: SOLICITUD DE DATOS
 */
window.mostrarRecuperacionPaso1 = function() {
    // Limpiamos memoria por seguridad si se abre y cierra la modal
    dw_usuarioRecuperacion = "";
    dw_tokenRecuperacion = "";
    const inputCorreo = document.getElementById('rec-correo');
    const inputTel = document.getElementById('rec-tel');
    const inputClave = document.getElementById('rec-nueva-clave');
    if(inputCorreo) inputCorreo.value = "";
    if(inputTel) inputTel.value = "";
    if(inputClave) inputClave.value = "";

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
    // Limpiamos memoria por seguridad al cancelar
    dw_usuarioRecuperacion = "";
    dw_tokenRecuperacion = "";
    const inputCorreo = document.getElementById('rec-correo');
    const inputTel = document.getElementById('rec-tel');
    const inputClave = document.getElementById('rec-nueva-clave');
    if(inputCorreo) inputCorreo.value = "";
    if(inputTel) inputTel.value = "";
    if(inputClave) inputClave.value = "";

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
window.enviarSolicitudRecuperacion = async function(e) {
    if (e) e.preventDefault();

    const btn = document.getElementById('btn-recover-1');
    
    // Evitar que envíen datos si están castigados
    if (typeof window.verificarBloqueoBoton === 'function') {
        if (window.verificarBloqueoBoton(btn, 'dw_rec1_cooldown', 'COMPROBAR IDENTIDAD')) return;
    }

    const correoIn = document.getElementById('rec-correo').value.trim();
    const telIn = document.getElementById('rec-tel').value.trim();

    // Validación básica de formato
    if (!correoIn.includes('@') || telIn.length < 7) {
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
            correo: correoIn, 
            telefono: telIn 
        });

        if (res.success) {
            localStorage.removeItem('dw_rec1_cooldown'); // Limpiar castigo al tener éxito
            
            // 🔥 MEJORA 1: Guardar Usuario y Token temporal (El backend devuelve token_recuperacion)
            dw_usuarioRecuperacion = res.usuario; 
            dw_tokenRecuperacion = res.token_recuperacion || "token_fallback"; 
            
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
            // CASTIGO: Bloqueo de 30 segundos
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
};

/**
 * 4. PASO 2: ACTUALIZACIÓN DEFINITIVA DE CLAVE
 */
window.procesarNuevaClave = async function(e) {
    if (e) e.preventDefault(); 
    const btn = document.getElementById('btn-recover-2');

    // Evitar bypass
    if (typeof window.verificarBloqueoBoton === 'function') {
        if (window.verificarBloqueoBoton(btn, 'dw_rec2_cooldown', 'ACTUALIZAR CONTRASEÑA')) return;
    }

    const nuevaClave = document.getElementById('rec-nueva-clave').value.trim();

    // 🔥 MEJORA 2: Aumentar longitud mínima de contraseña a 8 caracteres
    if (nuevaClave.length < 8) {
        return Swal.fire({ 
            icon: 'warning', 
            title: 'Clave Vulnerable', 
            text: 'Por seguridad, ingresa una contraseña de al menos 8 caracteres.', 
            background: document.body.classList.contains('dark-mode') ? 'var(--bg-card)' : '#ffffff',
            color: 'var(--text-main)',
            confirmButtonColor: 'var(--accent-text)',
            customClass: { popup: 'premium-modal-radius' }
        });
    }

    btn.innerHTML = '<i class="material-icons-round fa-spin">sync</i> PROCESANDO...';
    btn.disabled = true;

    try {
        // 🔥 MEJORA 1: Enviar Token en lugar de datos sensibles
        const res = await apiCall({ 
            accion: 'cambiarClaveOlvidada', 
            usuario: dw_usuarioRecuperacion, 
            token_recuperacion: dw_tokenRecuperacion, // Enviamos el Token
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
                volverLogin(); // Limpia campos y regresa
                btn.innerHTML = "ACTUALIZAR CONTRASEÑA";
                btn.disabled = false;
            });
        } else {
            // CASTIGO: Bloqueo de 30 segundos
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
};

// MEJORA 3 APLICADA: EL CSS FUE EXTRAÍDO PARA NO CARGAR LA LÓGICA JAVASCRIPT
