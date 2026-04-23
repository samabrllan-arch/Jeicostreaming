const TIEMPO_CACHE_INCOMPLETO = 5 * 60 * 1000; // 5 Minutos
const TIEMPO_CACHE_COMPLETO = 24 * 60 * 60 * 1000; // 24 Horas

let cooldownInterval = null; // Variable para controlar el setInterval

async function cargarDatos() {
    const container = document.getElementById('sec-datos');
    if (!container) return;
    
    // Limpiamos intervalos previos por si recarga la vista
    if (cooldownInterval) clearInterval(cooldownInterval);

    // 1. Renderizamos la estructura base
    container.innerHTML = `
        <div class="datos-wrapper-premium">
            <div class="page-header-premium" style="text-align: center; margin-bottom: 30px;">
                <h1 class="page-title"><i class="material-icons-round" style="vertical-align: text-bottom; color: var(--accent-text);">manage_accounts</i> MI PERFIL</h1>
                <p class="page-subtitle">Gestiona tu información personal y opciones de recuperación.</p>
            </div>

            <div class="card-datos-premium">
                <div id="loading-datos" style="text-align:center; padding: 40px;">
                    <div class="spinner" style="margin: 0 auto;"></div>
                    <p style="color:var(--text-gray); margin-top:15px; font-size:0.85rem; letter-spacing:2px; font-weight: 800;">CARGANDO DATOS...</p>
                </div>

                <form id="form-datos-perfil" class="hidden" onsubmit="actualizarMisDatos(event)">
                    
                    <div class="datos-grid">
                        <div class="input-group-premium">
                            <label>NOMBRE</label>
                            <div class="datos-input-wrapper">
                                <span class="material-icons-round datos-input-icon">badge</span>
                                <input type="text" id="perfil-nombre" class="datos-input" placeholder="Tu nombre">
                            </div>
                        </div>

                        <div class="input-group-premium">
                            <label>APELLIDO</label>
                            <div class="datos-input-wrapper">
                                <span class="material-icons-round datos-input-icon">badge</span>
                                <input type="text" id="perfil-apellido" class="datos-input" placeholder="Tu apellido">
                            </div>
                        </div>
                    </div>

                    <div class="input-group-premium" style="margin-top: 20px;">
                        <label>CORREO DE RECUPERACIÓN</label>
                        <div class="datos-input-wrapper">
                            <span class="material-icons-round datos-input-icon">mark_email_read</span>
                            <input type="email" id="perfil-correo" class="datos-input" placeholder="correo@alternativo.com">
                        </div>
                        <p class="datos-help-text">Se usará para restablecer tu contraseña si la olvidas.</p>
                    </div>

                    <div class="input-group-premium" style="margin-top: 20px;">
                        <label>TELÉFONO / WHATSAPP</label>
                        <div class="datos-phone-group">
                            <div class="datos-select-wrapper">
                                <input type="text" id="perfil-cod-pais" class="datos-input datos-select-pais" list="lista-paises" placeholder="+57" value="+57">
                                <datalist id="lista-paises">
                                    <option value="+57">🇨🇴 Colombia</option>
                                    <option value="+52">🇲🇽 México</option>
                                    <option value="+51">🇵🇪 Perú</option>
                                    <option value="+56">🇨🇱 Chile</option>
                                    <option value="+54">🇦🇷 Argentina</option>
                                    <option value="+593">🇪🇨 Ecuador</option>
                                    <option value="+58">🇻🇪 Venezuela</option>
                                    <option value="+1">🇺🇸 USA</option>
                                    <option value="+34">🇪🇸 España</option>
                                </datalist>
                            </div>
                            <div class="datos-input-wrapper" style="flex: 1;">
                                <span class="material-icons-round datos-input-icon" style="left: 10px;">phone_iphone</span>
                                <input type="tel" id="perfil-telefono" class="datos-input input-phone-number" placeholder="300 000 0000" inputmode="numeric" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                            </div>
                        </div>
                        <p class="datos-help-text" style="color: var(--accent-text); font-weight: bold; margin-top: 8px;">
                            <i class="material-icons-round" style="font-size: 14px; vertical-align: middle;">lightbulb</i> 
                            Recomendado: Ingresa el mismo número que usas en WhatsApp.
                        </p>
                    </div>

                    <div class="input-group-premium" style="margin-top: 25px;">
                        <label>NOTIFICACIONES DE WHATSAPP</label>
                        <div class="toggle-wrapper">
                            <label class="toggle-switch">
                                <input type="checkbox" id="perfil-consentimiento">
                                <span class="toggle-slider"></span>
                            </label>
                            <span class="toggle-label-text">¿Aceptas el envío de info al WhatsApp como recordatorios de cuentas por vencer, movimientos extraños y demás?</span>
                        </div>
                    </div>

                    <button type="submit" class="btn-submit-datos" id="btn-guardar-datos">
                        <span class="material-icons-round">save</span> GUARDAR CAMBIOS
                    </button>

                    <div id="datos-cooldown-container" class="hidden cooldown-box">
                        <span class="material-icons-round cooldown-icon">lock_clock</span>
                        <p class="cooldown-title">EDICIÓN BLOQUEADA POR SEGURIDAD</p>
                        <p id="datos-cooldown-msg" class="cooldown-timer"></p>
                    </div>
                </form>
            </div>
        </div>
    `;

    // 2. LÓGICA DE CACHÉ VISUAL (Carga Instantánea)
    const rawCache = localStorage.getItem('dw_perfil_datos_v2');
    const u = localStorage.getItem('dw_user');
    const t = localStorage.getItem('dw_token');
    
    if (rawCache) {
        try {
            const cache = JSON.parse(rawCache);
            
            document.getElementById('perfil-nombre').value = cache.datos.nombre || "";
            document.getElementById('perfil-apellido').value = cache.datos.apellido || "";
            document.getElementById('perfil-correo').value = cache.datos.correo || "";
            
            // Cargar el switch de consentimiento (Puede venir como 'consentimiento' o 'Consentimiento')
            const consVal = cache.datos.consentimiento || cache.datos.Consentimiento || 'No';
            document.getElementById('perfil-consentimiento').checked = (consVal.toLowerCase() === 'si' || consVal.toLowerCase() === 'sí');
            
            // Función para desensamblar el teléfono y el código de país
            setTelefonoDesensamblado(cache.datos.telefono || "");
            
            document.getElementById('loading-datos').classList.add('hidden');
            document.getElementById('form-datos-perfil').classList.remove('hidden');
            
            // Verificamos si tiene bloqueo de seguridad
            verificarBloqueoSeguridad(cache.timestamp_guardado);
            
        } catch (e) {
            localStorage.removeItem('dw_perfil_datos_v2');
        }
    }

    // 3. CONSULTA SILENCIOSA AL SERVIDOR (Stale-While-Revalidate)
    try {
        const res = await apiCall({ accion: 'getDatosPerfil', usuario: u, token: t });
        
        document.getElementById('loading-datos').classList.add('hidden');
        document.getElementById('form-datos-perfil').classList.remove('hidden');

        if (res.success && res.datos) {
            document.getElementById('perfil-nombre').value = res.datos.nombre || "";
            document.getElementById('perfil-apellido').value = res.datos.apellido || "";
            document.getElementById('perfil-correo').value = res.datos.correo || "";
            
            const consValSrv = res.datos.consentimiento || res.datos.Consentimiento || 'No';
            document.getElementById('perfil-consentimiento').checked = (consValSrv.toLowerCase() === 'si' || consValSrv.toLowerCase() === 'sí');

            setTelefonoDesensamblado(res.datos.telefono || "");

            // Guardamos en LocalStorage. Si ya tenía fecha de guardado (bloqueo), la mantenemos intacta.
            let timeGuardadoAnterior = null;
            if(rawCache) {
                try { timeGuardadoAnterior = JSON.parse(rawCache).timestamp_guardado; } catch(e){}
            }

            // Normalizamos el nombre a 'consentimiento' para la caché
            res.datos.consentimiento = consValSrv;

            localStorage.setItem('dw_perfil_datos_v2', JSON.stringify({
                timestamp: Date.now(),
                timestamp_guardado: timeGuardadoAnterior, // Mantiene el bloqueo estricto si existe
                datos: res.datos
            }));

            verificarBloqueoSeguridad(timeGuardadoAnterior);
        }
    } catch (e) {
        // Si no hay caché y falla la red, mostramos el error
        if (!rawCache) {
            document.getElementById('loading-datos').innerHTML = "<p style='color:var(--danger); font-weight: bold;'>Error de conexión al cargar datos.</p>";
        }
    }
}

/**
 * Función auxiliar para dividir el teléfono completo en País y Número
 */
function setTelefonoDesensamblado(telefonoCompleto) {
    if (!telefonoCompleto) return;
    
    let codPaisInput = document.getElementById('perfil-cod-pais');
    let inputTel = document.getElementById('perfil-telefono');
    
    // Lista de códigos ordenados del más largo al más corto para evitar falsos positivos
    const codigosFrecuentes = ["+593", "+57", "+52", "+51", "+56", "+54", "+58", "+34", "+1"];
    let codigoEncontrado = "+57"; // Default
    let numeroPuro = telefonoCompleto;

    if (telefonoCompleto.startsWith("+")) {
        let found = false;
        // Primero intentamos hacer match con los conocidos
        for (let cod of codigosFrecuentes) {
            if (telefonoCompleto.startsWith(cod)) {
                codigoEncontrado = cod;
                numeroPuro = telefonoCompleto.substring(cod.length).trim();
                found = true;
                break;
            }
        }
        
        // Si el usuario puso un código raro (ej. +49), la IA lo adivina separando el + y los siguientes números
        if (!found) {
            const match = telefonoCompleto.match(/^(\+\d{1,4})(\d+)$/);
            if (match) {
                codigoEncontrado = match[1];
                numeroPuro = match[2];
            }
        }
    }

    codPaisInput.value = codigoEncontrado;
    inputTel.value = numeroPuro;
}

/**
 * 4. GESTIÓN DEL BLOQUEO (COOLDOWN DE 24 HORAS)
 */
function verificarBloqueoSeguridad(tiempoGuardado) {
    if (!tiempoGuardado) return;

    const btn = document.getElementById('btn-guardar-datos');
    const msgContainer = document.getElementById('datos-cooldown-container');
    const msgText = document.getElementById('datos-cooldown-msg');
    
    const inputs = document.querySelectorAll('.datos-input');
    const toggleConsentimiento = document.getElementById('perfil-consentimiento');

    const actualizarContador = () => {
        const tiempoPasado = Date.now() - tiempoGuardado;
        const tiempoRestante = TIEMPO_CACHE_COMPLETO - tiempoPasado;

        if (tiempoRestante <= 0) {
            // Ya pasaron las 24h
            btn.classList.remove('hidden');
            msgContainer.classList.add('hidden');
            inputs.forEach(input => input.removeAttribute('readonly'));
            if(toggleConsentimiento) toggleConsentimiento.removeAttribute('disabled');
            if(cooldownInterval) clearInterval(cooldownInterval);
            return;
        }

        // Aún está bloqueado
        btn.classList.add('hidden');
        msgContainer.classList.remove('hidden');
        inputs.forEach(input => {
            if(input.tagName === 'INPUT') input.setAttribute('readonly', 'true');
        });
        if(toggleConsentimiento) toggleConsentimiento.setAttribute('disabled', 'true');

        // Calcular formato HH:MM:SS
        const horas = Math.floor(tiempoRestante / (1000 * 60 * 60));
        const minutos = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((tiempoRestante % (1000 * 60)) / 1000);

        msgText.innerText = `Podrás volver a editar en: ${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    };

    actualizarContador(); // Llamada inmediata
    cooldownInterval = setInterval(actualizarContador, 1000); // Actualiza cada segundo
}

/**
 * 5. GUARDAR DATOS
 */
async function actualizarMisDatos(e) {
    e.preventDefault();

    const nombre = document.getElementById('perfil-nombre').value.trim();
    const apellido = document.getElementById('perfil-apellido').value.trim();
    const correo = document.getElementById('perfil-correo').value.trim();
    
    // Capturamos el switch
    const consentimiento = document.getElementById('perfil-consentimiento').checked ? 'Si' : 'No';
    
    // Unimos el código de país y el número antes de guardar
    let codPais = document.getElementById('perfil-cod-pais').value.trim();
    const numeroTel = document.getElementById('perfil-telefono').value.trim();
    
    // Asegurarnos de que el código de país lleve el +
    if (!codPais.startsWith('+')) codPais = '+' + codPais;
    
    const telefonoFinal = codPais + numeroTel;

    const isDark = document.body.classList.contains('dark-mode');
    const swalBg = isDark ? '#1e293b' : '#ffffff';
    const swalColor = isDark ? '#f8fafc' : '#0f172a';

    // 1. VALIDACIÓN ESTRICTA
    if (!nombre || !apellido || !correo || !numeroTel) {
        return Swal.fire({
            icon: 'warning',
            title: 'Faltan Datos',
            text: 'Debes completar todos los campos (incluyendo el teléfono) para poder guardar los cambios.',
            background: swalBg, color: swalColor, confirmButtonColor: '#3b82f6'
        });
    }

    if (numeroTel.length < 7) {
        return Swal.fire({
            icon: 'warning',
            title: 'Teléfono Inválido',
            text: 'Por favor, ingresa un número de teléfono válido (sin el código de país).',
            background: swalBg, color: swalColor, confirmButtonColor: '#3b82f6'
        });
    }

    // 2. CONFIRMACIÓN ANTES DE BLOQUEAR
    const confirmar = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Por seguridad, si guardas estos datos no podrás modificarlos durante las próximas 24 horas.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f59e0b',
        cancelButtonColor: isDark ? '#334155' : '#e2e8f0',
        confirmButtonText: 'Sí, Guardar',
        cancelButtonText: '<span style="color: var(--text-main)">Revisar</span>',
        background: swalBg, color: swalColor
    });

    if(!confirmar.isConfirmed) return;

    const btn = document.getElementById('btn-guardar-datos');
    btn.innerHTML = '<span class="material-icons-round fa-spin">sync</span> GUARDANDO...';
    btn.disabled = true;

    const u = localStorage.getItem('dw_user');
    const t = localStorage.getItem('dw_token');

    try {
        const res = await apiCall({ 
            accion: 'setDatosPerfil', 
            usuario: u, 
            token: t,
            nombre, 
            apellido, 
            correo, 
            telefono: telefonoFinal,
            consentimiento: consentimiento // Lo mandamos al backend
        });

        if (res.success) {
            // ACTUALIZAMOS LOCALSTORAGE Y MARCAMOS EL INICIO DEL BLOQUEO (timestamp_guardado)
            const tiempoAhora = Date.now();
            localStorage.setItem('dw_perfil_datos_v2', JSON.stringify({
                timestamp: tiempoAhora,
                timestamp_guardado: tiempoAhora, // Sello de bloqueo exacto
                datos: { nombre, apellido, correo, telefono: telefonoFinal, consentimiento }
            }));

            Swal.fire({
                toast: true, position: 'top-end', icon: 'success',
                title: 'Perfil Blindado',
                text: 'Los datos se guardaron correctamente.',
                showConfirmButton: false, timer: 3000,
                background: swalBg, color: swalColor
            });

            // Activar visualmente el bloqueo de inmediato
            verificarBloqueoSeguridad(tiempoAhora);

        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: res.msg, background: swalBg, color: swalColor });
            btn.innerHTML = '<span class="material-icons-round">save</span> GUARDAR CAMBIOS';
            btn.disabled = false;
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error de Red', text: 'No se pudo conectar con el servidor.', background: swalBg, color: swalColor });
        btn.innerHTML = '<span class="material-icons-round">save</span> GUARDAR CAMBIOS';
        btn.disabled = false;
    }
}

/**
 * ESTILOS INTEGRADOS (ADAPTADOS A TEMA DW)
 */
const datosStyles = `
    .datos-wrapper-premium {
        max-width: 650px;
        margin: 0 auto;
        padding: 20px 0;
    }

    .card-datos-premium {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        transition: background 0.3s, border-color 0.3s;
    }

    .datos-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
    }

    .input-group-premium {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .input-group-premium label {
        color: var(--text-gray);
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
    }

    .datos-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
    }

    .datos-input-icon {
        position: absolute;
        left: 15px;
        color: var(--accent-text);
        font-size: 20px;
        pointer-events: none;
    }

    .datos-input {
        width: 100%;
        box-sizing: border-box; 
        background: var(--bg-dark);
        border: 1px solid var(--border-color);
        color: var(--text-main);
        padding: 16px 15px 16px 45px;
        border-radius: 12px;
        font-size: 0.95rem;
        outline: none;
        transition: all 0.3s ease;
    }

    .datos-input:focus {
        border-color: var(--accent-text);
        box-shadow: 0 0 0 3px var(--accent-glow);
    }
    
    .datos-input[readonly], .datos-input[disabled] {
        color: var(--text-gray);
        border-color: var(--border-color);
        cursor: not-allowed;
        background: var(--bg-sidebar);
    }

    /* --- ESTILOS PARA EL GRUPO DEL TELÉFONO --- */
    .datos-phone-group {
        display: flex;
        align-items: center;
        gap: 0; 
    }

    .datos-select-wrapper {
        width: 110px;
        flex-shrink: 0;
    }

    .datos-select-pais {
        padding: 16px 15px;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        border-right: none;
        text-align: center;
    }

    .input-phone-number {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        padding-left: 40px; 
    }
    
    .datos-phone-group:focus-within .datos-input {
        border-color: var(--accent-text);
        box-shadow: none; 
    }
    .datos-phone-group:focus-within {
        box-shadow: 0 0 0 3px var(--accent-glow);
        border-radius: 12px;
    }

    .datos-help-text {
        color: var(--text-gray);
        font-size: 0.75rem;
        margin-top: 5px;
    }

    /* --- ESTILOS PARA EL SWITCH DE CONSENTIMIENTO --- */
    .toggle-wrapper {
        display: flex;
        align-items: center;
        gap: 15px;
        background: var(--bg-dark);
        padding: 15px;
        border-radius: 12px;
        border: 1px solid var(--border-color);
    }

    .toggle-switch {
        position: relative;
        display: inline-block;
        width: 48px;
        height: 26px;
        flex-shrink: 0;
    }

    .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0; left: 0; right: 0; bottom: 0;
        background-color: var(--bg-sidebar);
        transition: .4s;
        border-radius: 34px;
        border: 1px solid var(--border-color);
    }

    .toggle-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: var(--text-gray);
        transition: .4s;
        border-radius: 50%;
    }

    input:checked + .toggle-slider {
        background-color: var(--success);
        border-color: var(--success);
    }

    input:checked + .toggle-slider:before {
        transform: translateX(22px);
        background-color: #fff;
    }

    input[disabled] + .toggle-slider {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .toggle-label-text {
        color: var(--text-main);
        font-size: 0.85rem;
        line-height: 1.4;
    }

    /* --- BOTONES Y COOLDOWN --- */
    .btn-submit-datos {
        width: 100%;
        background: var(--accent-text);
        color: #ffffff;
        border: none;
        padding: 18px;
        border-radius: 12px;
        font-weight: 800;
        letter-spacing: 1px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        transition: 0.3s;
        margin-top: 30px;
        box-shadow: 0 4px 15px var(--accent-glow);
    }

    .btn-submit-datos:hover {
        background: var(--accent-hover);
        transform: translateY(-3px);
        box-shadow: 0 8px 20px var(--accent-glow);
    }
    
    .btn-submit-datos.hidden {
        display: none !important;
    }

    .cooldown-box {
        text-align: center;
        margin-top: 25px;
        background: rgba(245, 158, 11, 0.05);
        padding: 20px;
        border-radius: 12px;
        border: 1px dashed rgba(245, 158, 11, 0.4);
    }
    .cooldown-icon {
        color: #f59e0b;
        font-size: 32px;
        margin-bottom: 5px;
    }
    .cooldown-title {
        color: #f59e0b;
        font-size: 0.85rem;
        font-weight: 800;
        margin-top: 5px;
        letter-spacing: 1px;
    }
    .cooldown-timer {
        color: var(--text-main);
        font-size: 1rem;
        font-weight: bold;
        margin-top: 8px;
        font-family: 'Inter', monospace;
    }

    .fa-spin { animation: spin 1s infinite linear; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    @media (max-width: 600px) {
        .datos-grid { grid-template-columns: 1fr; }
        .card-datos-premium { padding: 25px 20px; }
        .toggle-wrapper { flex-direction: column; align-items: flex-start; }
    }
`;

const styleSheetDatos = document.createElement("style");
styleSheetDatos.innerText = datosStyles;
document.head.appendChild(styleSheetDatos);
