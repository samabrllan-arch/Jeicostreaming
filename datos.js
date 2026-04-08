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
                        <div class="datos-input-wrapper">
                            <span class="material-icons-round datos-input-icon">phone_iphone</span>
                            <input type="tel" id="perfil-telefono" class="datos-input" placeholder="+57 300 000 0000">
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
            
            // Llenamos la pantalla con la data vieja para que no espere
            document.getElementById('perfil-nombre').value = cache.datos.nombre || "";
            document.getElementById('perfil-apellido').value = cache.datos.apellido || "";
            document.getElementById('perfil-correo').value = cache.datos.correo || "";
            document.getElementById('perfil-telefono').value = cache.datos.telefono || "";
            
            document.getElementById('loading-datos').classList.add('hidden');
            document.getElementById('form-datos-perfil').classList.remove('hidden');
            
            // Verificamos si tiene bloqueo de seguridad
            verificarBloqueoSeguridad(cache.timestamp_guardado);
            
            // 🔥 NOTA: Ya NO ponemos "return;" aquí. Queremos que siga y consulte a la BD en silencio.
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
            // Actualizamos silenciosamente los inputs por si el admin cambió algo
            document.getElementById('perfil-nombre').value = res.datos.nombre || "";
            document.getElementById('perfil-apellido').value = res.datos.apellido || "";
            document.getElementById('perfil-correo').value = res.datos.correo || "";
            document.getElementById('perfil-telefono').value = res.datos.telefono || "";

            // Guardamos en LocalStorage. Si ya tenía fecha de guardado (bloqueo), la mantenemos intacta.
            let timeGuardadoAnterior = null;
            if(rawCache) {
                try { timeGuardadoAnterior = JSON.parse(rawCache).timestamp_guardado; } catch(e){}
            }

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
 * 4. GESTIÓN DEL BLOQUEO (COOLDOWN DE 24 HORAS)
 */
function verificarBloqueoSeguridad(tiempoGuardado) {
    if (!tiempoGuardado) return;

    const btn = document.getElementById('btn-guardar-datos');
    const msgContainer = document.getElementById('datos-cooldown-container');
    const msgText = document.getElementById('datos-cooldown-msg');
    
    // Convertir Inputs a readonly
    const inputs = document.querySelectorAll('.datos-input');

    const actualizarContador = () => {
        const tiempoPasado = Date.now() - tiempoGuardado;
        const tiempoRestante = TIEMPO_CACHE_COMPLETO - tiempoPasado;

        if (tiempoRestante <= 0) {
            // Ya pasaron las 24h
            btn.classList.remove('hidden');
            msgContainer.classList.add('hidden');
            inputs.forEach(input => input.removeAttribute('readonly'));
            if(cooldownInterval) clearInterval(cooldownInterval);
            return;
        }

        // Aún está bloqueado
        btn.classList.add('hidden');
        msgContainer.classList.remove('hidden');
        inputs.forEach(input => input.setAttribute('readonly', 'true'));

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
    const telefono = document.getElementById('perfil-telefono').value.trim();

    const isDark = document.body.classList.contains('dark-mode');
    const swalBg = isDark ? '#1e293b' : '#ffffff';
    const swalColor = isDark ? '#f8fafc' : '#0f172a';

    // 1. VALIDACIÓN ESTRICTA
    if (!nombre || !apellido || !correo || !telefono) {
        return Swal.fire({
            icon: 'warning',
            title: 'Faltan Datos',
            text: 'Debes completar todos los campos para poder guardar los cambios.',
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
            nombre, apellido, correo, telefono
        });

        if (res.success) {
            // ACTUALIZAMOS LOCALSTORAGE Y MARCAMOS EL INICIO DEL BLOQUEO (timestamp_guardado)
            const tiempoAhora = Date.now();
            localStorage.setItem('dw_perfil_datos_v2', JSON.stringify({
                timestamp: tiempoAhora,
                timestamp_guardado: tiempoAhora, // Sello de bloqueo exacto
                datos: { nombre, apellido, correo, telefono }
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
    
    .datos-input[readonly] {
        color: var(--text-gray);
        border-color: var(--border-color);
        cursor: not-allowed;
        background: var(--bg-sidebar);
    }

    .datos-help-text {
        color: var(--text-gray);
        font-size: 0.75rem;
        margin-top: 5px;
    }

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

    /* Cooldown Box Premium */
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
    }
`;

const styleSheetDatos = document.createElement("style");
styleSheetDatos.innerText = datosStyles;
document.head.appendChild(styleSheetDatos);
