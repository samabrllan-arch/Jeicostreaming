const COOLDOWN_CODIGOS = 20; // Segundos
let enCooldownCodigos = false;

// Variable global para almacenar el HTML del correo encontrado
let correoHTMLActual = "";

/**
 * 1. FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA
 */
function cargarCodigos() {
    const container = document.getElementById('sec-codigos');
    if (!container) return;

    container.innerHTML = `
        <div class="codigos-wrapper-premium">
            <div class="page-header-premium" style="text-align: center; margin-bottom: 30px;">
                <h1 class="page-title">PORTAL DE <span>ACCESO</span></h1>
                <p class="page-subtitle">Verifica tu cuenta visualizando el correo original del proveedor.</p>
            </div>

            <div class="card-codigos">
                <div id="formAccesoCodigos">
                    
                    <div class="input-group-premium" style="position: relative; margin-bottom: 20px;">
                        <label>Correo de la Cuenta</label>
                        <div class="input-wrapper">
                            <span class="material-icons-round input-icon">email</span>
                            <input type="email" id="txtUserCod" class="ticket-input" placeholder="ejemplo@gmail.com" autocomplete="off">
                        </div>
                    </div>

                    <div class="input-group-premium" style="margin-bottom: 20px;">
                        <label>Contraseña de Acceso</label>
                        <div class="input-wrapper">
                            <span class="material-icons-round input-icon">lock</span>
                            <input type="password" id="txtPassCod" class="ticket-input" placeholder="••••••••">
                            <span class="material-icons-round toggle-password" id="togglePassCod" onclick="togglePasswordVisibilidad()">visibility</span>
                        </div>
                    </div>

                    <div class="input-group-premium">
                        <label>Selecciona el Servicio</label>
                        <div class="services-grid">
                            <button type="button" class="btn-service-brand active" data-asunto="Tu código de acceso único para Disney+||Tu clave de un solo uso para Disney+||Your one-time passcode for Disney+||Vas a actualizar tu Hogar de Disney+" data-brand="Disney">
                                <span class="brand-icon">D+</span> Disney+
                            </button>
                            <button type="button" class="btn-service-brand" data-asunto="Urgente: Tu código de un solo uso||Tu enlace para restablecer tu contraseña requerido" data-brand="HBO">
                                <span class="brand-icon">H+</span> HBO+
                            </button>
                            <button type="button" class="btn-service-brand" data-asunto="Verificación de Amazon" data-brand="Amazon">
                                <span class="brand-icon">AMZ</span> Amazon
                            </button>
                            <button type="button" class="btn-service-brand" data-asunto="Reset Your Crunchyroll Password||Restablece tu contraseña de Crunchyroll" data-brand="Crunchyroll">
                                <span class="brand-icon">CR</span> Crunchy
                            </button>
                        </div>
                        <input type="hidden" id="txtAsuntoCod" value="Tu código de acceso único para Disney+||Tu clave de un solo uso para Disney+||Your one-time passcode for Disney+||Vas a actualizar tu Hogar de Disney+">
                    </div>

                    <button id="btnVerificarCod" class="btn-submit-ticket" onclick="ejecutarAccesoCodigos()" style="margin-top: 25px;">
                        <span class="material-icons-round" id="btnIconCod">search</span>
                        <span id="btnTextCod">BUSCAR CORREO</span>
                    </button>
                </div>

                <div id="statusAreaCod" class="status-msg-cod info-cod hidden" style="margin-top:20px;">
                    <span class="material-icons-round icon-status">terminal</span>
                    <span id="statusTextCod">Sistema listo.</span>
                </div>

                <div id="resultadoFinalCod" class="result-container-cod hidden">
                    <div class="result-label" id="resultLabelCod">CORREO ENCONTRADO EXITOSAMENTE</div>
                    
                    <button onclick="abrirModalCorreo()" class="btn-link-neon">
                        <span class="material-icons-round" style="font-size:20px;">mark_email_unread</span> 
                        VER CORREO ORIGINAL
                    </button>

                    <div id="fechaMsgCod" class="fecha-msg"></div>
                </div>

                <div id="fallbackAreaCod" class="fallback-msg hidden" style="margin-top:20px;">
                    <p>¿No se encuentra el correo? <br><span style="font-size:13px; opacity:0.7;">Es posible que debas solicitarlo nuevamente en la plataforma original.</span></p>
                    <a id="btnSolicitarManualCod" href="#" target="_blank" class="btn-manual-request">
                        Ir a la plataforma <span class="material-icons-round" style="font-size:16px;">open_in_new</span>
                    </a>
                </div>
            </div>
        </div>
    `;

    // Inicializar lógica de la vista (Botones de servicio)
    initServiceButtonsCodigos();
    
    // Enter para ejecutar
    document.getElementById("txtPassCod").addEventListener("keydown", e => {
        if (e.key === "Enter") ejecutarAccesoCodigos();
    });
}

/**
 * 2. LÓGICA DE INTERFAZ (BOTONES, TOGGLE PASS Y MODAL)
 */
function togglePasswordVisibilidad() {
    const passInput = document.getElementById("txtPassCod");
    const toggleIcon = document.getElementById("togglePassCod");
    
    if (passInput.type === "password") {
        passInput.type = "text";
        toggleIcon.innerText = "visibility_off";
        toggleIcon.style.color = "var(--success)";
    } else {
        passInput.type = "password";
        toggleIcon.innerText = "visibility";
        toggleIcon.style.color = "var(--text-gray)";
    }
}

function initServiceButtonsCodigos() {
    const botones = document.querySelectorAll(".btn-service-brand");
    const inputAsunto = document.getElementById("txtAsuntoCod");
    const btnVerificar = document.getElementById("btnVerificarCod");
    const btnText = document.getElementById("btnTextCod");
    
    botones.forEach(boton => {
        boton.addEventListener("click", () => {
            if(boton.disabled) return;

            botones.forEach(b => b.classList.remove("active"));
            boton.classList.add("active");
            
            const asuntoSeleccionado = boton.getAttribute("data-asunto");
            const brand = boton.getAttribute("data-brand");
            inputAsunto.value = asuntoSeleccionado;

            // LÓGICA DE BLOQUEO (AMAZON)
            if (brand === "Amazon") {
                btnVerificar.disabled = true;
                btnText.innerText = "Próximamente";
                
                Swal.fire({
                    toast: true, position: 'top-end', icon: 'info',
                    title: 'Servicio en Mantenimiento',
                    text: 'Amazon estará disponible pronto.',
                    showConfirmButton: false, timer: 3000,
                    background: document.body.classList.contains('dark-mode') ? 'var(--bg-card)' : '#ffffff',
                    color: 'var(--text-main)'
                });
            } else {
                if (!enCooldownCodigos) {
                    btnVerificar.disabled = false;
                    btnText.innerText = "BUSCAR CORREO";
                }
            }
        });
    });
}

/**
 * 🔥 FUNCIÓN PARA ABRIR EL MODAL CON EL CORREO HTML
 */
window.abrirModalCorreo = function() {
    const isMobile = window.innerWidth <= 768;
    const isDark = document.body.classList.contains('dark-mode');
    
    // MEJORA 2: Analizar el HTML de forma segura con DOMParser (evita Regex inseguros)
    const parser = new DOMParser();
    const docHtml = parser.parseFromString(correoHTMLActual, 'text/html');
    
    // Forzar apertura en nueva pestaña para TODOS los enlaces
    const links = docHtml.querySelectorAll('a');
    links.forEach(a => a.setAttribute('target', '_blank'));
    
    const htmlParchado = docHtml.documentElement.outerHTML;
    
    Swal.fire({
        html: `
            <div class="video-modal-container" style="padding: 5px;">
                <h2 class="banco-title" style="margin-bottom: ${isMobile ? '10px' : '15px'}; font-size: ${isMobile ? '1.2rem' : '1.5rem'};">Bandeja de Entrada Segura</h2>
                <div class="iframe-wrapper">
                    <iframe id="iframeCorreo" 
                            sandbox="allow-same-origin allow-popups" 
                            frameborder="0" 
                            style="width: 100%; height: 100%; background: #ffffff;"></iframe>
                </div>
            </div>
        `,
        showConfirmButton: true,
        confirmButtonText: '<span class="material-icons-round" style="vertical-align:middle; margin-right:5px;">check_circle</span> CERRAR',
        background: isDark ? 'var(--bg-card)' : '#ffffff',
        width: isMobile ? '98%' : '800px',
        padding: isMobile ? '10px' : '20px',
        customClass: { popup: 'banco-swal-popup', confirmButton: 'btn-correo-cerrar' },
        didOpen: () => {
            // Inyectamos el HTML parchado directamente en el iframe una vez que el modal se abre
            const iframe = document.getElementById('iframeCorreo');
            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(htmlParchado); // <-- Usamos el HTML procesado por DOMParser
            doc.close();
            
            // Parche extra por si el HTML del correo usó Javascript para hacer redirecciones (evita que el iframe salte)
            iframe.onload = function() {
                const innerLinks = iframe.contentWindow.document.querySelectorAll('a');
                innerLinks.forEach(link => {
                    link.setAttribute('target', '_blank');
                });
            };
        }
    });
}

/**
 * 3. NÚCLEO DE BÚSQUEDA Y API
 */
async function faseIA(texto, icono, delay = 700) {
    const status = document.getElementById("statusAreaCod");
    const textEl = document.getElementById("statusTextCod");
    const iconEl = status.querySelector(".icon-status");
    
    status.classList.remove('hidden', 'error', 'success');
    status.classList.add('info-cod');
    
    iconEl.innerText = icono;
    textEl.innerHTML = texto;
    
    await new Promise(resolve => setTimeout(resolve, delay));
}

function iniciarCooldownCodigos() {
    enCooldownCodigos = true;
    let restante = COOLDOWN_CODIGOS;
    const btn = document.getElementById("btnVerificarCod");
    const txtBtn = document.getElementById("btnTextCod");
    const iconBtn = document.getElementById("btnIconCod");

    btn.disabled = true;

    const timer = setInterval(() => {
        restante--;
        txtBtn.innerText = `ESPERA ${restante}s`;

        if (restante <= 0) {
            clearInterval(timer);
            enCooldownCodigos = false;
            btn.disabled = false;
            txtBtn.innerText = "BUSCAR CORREO";
            if(iconBtn) iconBtn.innerText = "search";
        }
    }, 1000);
}

async function ejecutarAccesoCodigos() {
    if (enCooldownCodigos) return;

    const user = document.getElementById("txtUserCod").value.trim();
    const pass = document.getElementById("txtPassCod").value.trim();
    const asunto = document.getElementById("txtAsuntoCod").value.trim(); 
    
    const botonActivo = document.querySelector(".btn-service-brand.active");
    const nombreServicioCorto = botonActivo ? botonActivo.getAttribute("data-brand") : "";
    
    const btn = document.getElementById("btnVerificarCod");
    const txtBtn = document.getElementById("btnTextCod");
    const iconBtn = document.getElementById("btnIconCod");
    const status = document.getElementById("statusAreaCod");
    const textEl = document.getElementById("statusTextCod");
    const resBox = document.getElementById("resultadoFinalCod");
    const fechaMsg = document.getElementById("fechaMsgCod");
    const fallbackArea = document.getElementById("fallbackAreaCod"); 

    if (!user || !pass) {
        Swal.fire({ 
            icon: 'error', 
            title: 'Faltan datos', 
            text: 'Ingresa correo y contraseña.', 
            background: document.body.classList.contains('dark-mode') ? 'var(--bg-card)' : '#ffffff', 
            color: 'var(--text-main)',
            customClass: { popup: 'premium-modal-radius' }
        });
        return;
    }

    // Reset visual
    btn.disabled = true;
    txtBtn.innerText = "ESCANÉANDO RED...";
    iconBtn.innerText = "sync";
    iconBtn.classList.add("fa-spin"); 
    resBox.classList.add("hidden");
    fallbackArea.classList.add("hidden"); 
    correoHTMLActual = ""; // Limpiamos la variable global

    try {
        await faseIA("Inicializando motor de búsqueda...", "memory");
        await faseIA("Validando credenciales en la Bóveda...", "security");

        // LOGIN MAESTRO (Usa la variable global GS_MAESTRO de config_cliente.js)
        const login = await fetch(`${GS_MAESTRO}?usuario=${encodeURIComponent(user)}&clave=${encodeURIComponent(pass)}&servicio=${encodeURIComponent(nombreServicioCorto)}`);
        const dataM = await login.json();

        if (!dataM.exito) {
            throw new Error(dataM.mensaje || "Credenciales inválidas.");
        }

        await faseIA("Acceso autorizado. Conectando servidores...", "public");
        await faseIA("Analizando bandeja de entrada...", "psychology");

        let infoExito = null;

        // MEJORA 3: BÚSQUEDA CONCURRENTE EN WORKERS (Usa GS_OBREROS del config)
        const fetchWorker = async (url) => {
            const r = await fetch(`${url}?usuario=${encodeURIComponent(user)}&asunto=${encodeURIComponent(asunto)}`);
            const d = await r.json();
            if (d.exito && d.encontrado && d.cuerpo) {
                return d;
            }
            throw new Error("No encontrado en este worker");
        };

        try {
            // Promise.any lanza todas las peticiones al mismo tiempo y se resuelve con la primera que tenga éxito.
            infoExito = await Promise.any(GS_OBREROS.map(url => fetchWorker(url)));
            correoHTMLActual = infoExito.cuerpo; // Guardamos el HTML completo del correo
        } catch (e) {
            // Si entra al catch, significa que NINGÚN worker encontró el correo
            infoExito = null;
        }

        if (!infoExito) throw new Error("NOT_FOUND");

        // 🔥 AVISO AL MAESTRO PARA ACTUALIZAR AUDITORÍA 🔥
        fetch(`${GS_MAESTRO}?accion=registrar_codigo&usuario=${encodeURIComponent(user)}&codigo_encontrado=Correo_HTML_Visualizado`, { mode: "no-cors" });

        fechaMsg.innerHTML = `<span class="material-icons-round" style="font-size:16px;">schedule</span> Recibido a las: ${infoExito.hora || "Reciente"}`;
        resBox.classList.remove("hidden");

        status.className = "status-msg-cod success";
        status.querySelector(".icon-status").innerText = "check_circle";
        textEl.innerText = "Proceso finalizado. Correo interceptado con éxito.";

        // Éxito
        iconBtn.classList.remove("fa-spin");
        iniciarCooldownCodigos();

    } catch (err) {
        status.className = "status-msg-cod error";
        status.querySelector(".icon-status").innerText = "error";
        
        if (err.message === "Cuenta sin ese servicio") {
            textEl.innerHTML = "No tienes este servicio contratado.<br>Contacta a soporte si crees que es un error.";
        }
        else if (err.message === "NOT_FOUND" || err.message.includes("No se encontró")) {
            textEl.innerText = "No se encontró correo reciente.";
            
            // Aviso de fallo al maestro
            fetch(`${GS_MAESTRO}?accion=registrar_codigo&usuario=${encodeURIComponent(user)}&codigo_encontrado=Fallo_Timeout_No_Encontrado`, { mode: "no-cors" });

            let linkManual = "#";
            if (asunto.includes("Disney")) linkManual = "https://www.disneyplus.com/identity/login/enter-passcode";
            else if (asunto.includes("Crunchyroll") || asunto.includes("Reset")) linkManual = "https://sso.crunchyroll.com/es/reset-password";
            else if (asunto.includes("HBO") || asunto.includes("Urgente") || asunto.includes("restablecer")) linkManual = "https://auth.hbomax.com/login"; 
            
            const btnManual = document.getElementById("btnSolicitarManualCod"); 
            if (btnManual) {
                btnManual.href = linkManual;
                fallbackArea.classList.remove("hidden");
            }
        } else {
            textEl.innerText = err.message;
        }

        btn.disabled = false;
        txtBtn.innerText = "INTENTAR DE NUEVO";
        iconBtn.classList.remove("fa-spin");
        iconBtn.innerText = "refresh";
    }
}

/**
 * 5. ESTILOS INTEGRADOS MEJORADOS (UI PREMIUM NEÓN)
 */
const codigosStyles = `
    .codigos-wrapper-premium {
        max-width: 550px;
        margin: 0 auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .card-codigos {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        padding: 40px 30px;
        border-radius: 24px;
        width: 100%;
        box-shadow: 0 15px 40px rgba(0,0,0,0.1);
        transition: background 0.3s, border-color 0.3s;
    }

    /* Título principal con Neón */
    .page-title span { 
        background: var(--accent-gradient); 
        -webkit-background-clip: text; 
        -webkit-text-fill-color: transparent; 
        filter: drop-shadow(0 0 12px var(--accent-glow));
    }

    /* LABELS MODERNOS */
    .input-group-premium label {
        display: block;
        font-size: 0.75rem;
        font-weight: 800;
        color: var(--text-gray);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 10px;
        text-align: left;
    }

    /* INPUTS REDISEÑADOS */
    .input-wrapper { position: relative; display: flex; align-items: center; width: 100%; }
    .input-icon { position: absolute; left: 16px; color: var(--text-gray); font-size: 1.3rem; transition: color 0.3s; }
    .toggle-password { position: absolute; right: 16px; cursor: pointer; color: var(--text-gray); font-size: 1.3rem; transition: all 0.3s; }
    .toggle-password:hover { color: var(--accent-text); transform: scale(1.1); }
    
    #txtUserCod, #txtPassCod {
        width: 100%;
        background: var(--bg-dark);
        border: 2px solid var(--border-color);
        color: var(--text-white);
        padding: 16px 48px;
        border-radius: 14px;
        font-size: 0.95rem;
        font-weight: 600;
        outline: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    #txtUserCod::placeholder, #txtPassCod::placeholder { color: var(--text-gray); font-weight: 400; }

    #txtUserCod:focus, #txtPassCod:focus {
        border-color: var(--accent-text);
        box-shadow: 0 0 15px var(--accent-glow);
        background: var(--bg-card);
    }
    
    #txtUserCod:focus ~ .input-icon, #txtPassCod:focus ~ .input-icon {
        color: var(--accent-text);
    }

    /* GRID DE MARCAS MEJORADO */
    .services-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-top: 5px;
    }

    .btn-service-brand {
        background: var(--bg-dark);
        border: 2px solid var(--border-color);
        color: var(--text-gray);
        padding: 15px 10px;
        border-radius: 14px;
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 800;
        text-transform: uppercase;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        transition: all 0.3s ease;
    }

    .brand-icon { font-size: 1.4rem; font-family: 'Righteous', cursive; }

    /* Colores por Marca Adaptables */
    .btn-service-brand[data-brand="Disney"]:hover:not(:disabled) { border-color: #006aff; color: #006aff; background: rgba(0,106,255,0.05); }
    .btn-service-brand[data-brand="Disney"].active { background: #006aff; color: #fff; border-color: #006aff; box-shadow: 0 5px 15px rgba(0,106,255,0.3); }

    .btn-service-brand[data-brand="HBO"]:hover:not(:disabled) { border-color: #7e00e6; color: #7e00e6; background: rgba(126,0,230,0.05); }
    .btn-service-brand[data-brand="HBO"].active { background: #7e00e6; color: #fff; border-color: #7e00e6; box-shadow: 0 5px 15px rgba(126,0,230,0.3); }

    .btn-service-brand[data-brand="Amazon"]:hover:not(:disabled) { border-color: #ff9900; color: #ff9900; background: rgba(255,153,0,0.05); }
    .btn-service-brand[data-brand="Amazon"].active { background: #ff9900; color: #000; border-color: #ff9900; box-shadow: 0 5px 15px rgba(255,153,0,0.3); }

    .btn-service-brand[data-brand="Crunchyroll"]:hover:not(:disabled) { border-color: #f47521; color: #f47521; background: rgba(244,117,33,0.05); }
    .btn-service-brand[data-brand="Crunchyroll"].active { background: #f47521; color: #000; border-color: #f47521; box-shadow: 0 5px 15px rgba(244,117,33,0.3); }

    /* BOTON BUSCAR CORREO (ESTILO PREMIUM NEÓN) */
    #btnVerificarCod {
        width: 100%;
        background: var(--accent-gradient);
        color: #ffffff;
        border: none;
        padding: 16px;
        border-radius: 14px;
        font-weight: 800;
        font-size: 0.95rem;
        letter-spacing: 2px;
        text-transform: uppercase;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.3s ease;
        box-shadow: 0 8px 20px var(--accent-glow);
    }

    #btnVerificarCod:hover:not(:disabled) {
        transform: translateY(-3px) scale(1.02);
        box-shadow: 0 12px 25px var(--accent-glow);
        filter: brightness(1.1);
    }
    
    #btnVerificarCod:active:not(:disabled) {
        transform: translateY(1px) scale(0.98);
    }

    #btnVerificarCod:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        box-shadow: none;
        transform: none;
    }

    /* STATUS Y RESULTADOS */
    .status-msg-cod {
        display: flex; align-items: center; justify-content: center; gap: 10px;
        padding: 15px; border-radius: 12px; font-size: 0.85rem; font-weight: 700;
        text-align: center; line-height: 1.4; transition: 0.3s;
    }
    .status-msg-cod.info-cod { background: rgba(59, 130, 246, 0.1); border: 1px solid var(--accent-text); color: var(--accent-text); }
    .status-msg-cod.error { background: rgba(225, 29, 72, 0.1); border: 1px solid var(--danger); color: var(--danger); }
    .status-msg-cod.success { background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success); color: var(--success); }

    .result-container-cod {
        margin-top: 20px; background: rgba(16, 185, 129, 0.05); border: 2px dashed rgba(16, 185, 129, 0.4);
        border-radius: 16px; padding: 25px; text-align: center; box-shadow: 0 0 20px rgba(16, 185, 129, 0.1);
    }
    .result-label { font-size: 0.75rem; color: var(--success); font-weight: 800; letter-spacing: 1px; margin-bottom: 15px; text-transform: uppercase; }
    .fecha-msg { margin-top: 15px; font-size: 0.8rem; color: var(--text-gray); display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 700; }

    /* ENLACES Y BOTONES RESULTADO */
    .btn-link-neon {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        background: var(--success); color: #fff; padding: 15px 25px; border-radius: 12px;
        font-weight: 900; text-decoration: none; border: none; cursor: pointer;
        transition: 0.3s; font-size: 0.9rem; letter-spacing: 1px; width: 100%;
        box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3); text-transform: uppercase;
    }
    .btn-link-neon:hover { filter: brightness(1.1); transform: translateY(-3px); box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5); }

    .fallback-msg { text-align: center; color: var(--text-gray); font-size: 0.85rem; line-height: 1.5; }
    .btn-manual-request {
        display: inline-flex; align-items: center; justify-content: center; gap: 5px;
        margin-top: 12px; padding: 12px 20px; background: var(--bg-dark); color: var(--text-white);
        text-decoration: none; border-radius: 12px; font-size: 0.8rem; font-weight: 800; text-transform: uppercase;
        border: 1px solid var(--border-color); transition: 0.3s; width: 100%; box-sizing: border-box;
    }
    .btn-manual-request:hover { background: var(--bg-card); border-color: var(--accent-text); color: var(--accent-text); }

    .fa-spin { animation: spin 1s infinite linear; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    /* ESTILOS DEL MODAL DE CORREO */
    .banco-swal-popup { border: 1px solid var(--border-color) !important; border-radius: 24px !important; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px var(--accent-glow) !important; background: var(--bg-card) !important; overflow: hidden; }
    .video-modal-container { width: 100%; display: flex; flex-direction: column; align-items: center; }
    .banco-title { color: var(--text-white); font-weight: 900; letter-spacing: 1px; }
    .iframe-wrapper {
        position: relative; width: 100%; height: 60vh; max-height: 600px; min-height: 400px;
        border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color);
        box-shadow: inset 0 0 10px rgba(0,0,0,0.1); background: #ffffff;
    }
    .btn-correo-cerrar { background: var(--bg-dark) !important; border: 1px solid var(--success) !important; color: var(--success) !important; border-radius: 12px !important; font-weight: 800 !important; width: 100% !important; padding: 14px !important; letter-spacing: 1px !important; text-transform: uppercase !important; transition: 0.3s !important;}
    .btn-correo-cerrar:hover { background: var(--success) !important; color: #fff !important; }
    
    @media (max-width: 768px) {
        .iframe-wrapper { height: 75vh; max-height: none; min-height: 450px; }
        .card-codigos { padding: 30px 20px; }
    }
`;

const styleSheetCodigos = document.createElement("style");
styleSheetCodigos.innerText = codigosStyles;
document.head.appendChild(styleSheetCodigos);
