const API_URL = `${API_BASE_URL_CLIENTE}/dw_api.php`;
let userBalance = 0;

// --- 1. API FETCH GLOBAL ---
window.apiCall = async function(params) {
    try { 
        const formData = new URLSearchParams();
        for (const key in params) {
            formData.append(key, params[key]);
        }
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        return await response.json(); 
    } catch (e) { 
        console.error("Error API:", e);
        return { success: false, msg: "Error de conexión con el servidor" }; 
    }
};

// --- 1.5 MOTOR DE SEGURIDAD (COOLDOWN CON LOCALSTORAGE) ---
window.verificarBloqueoBoton = function(btnElement, storageKey, textoOriginal) {
    if (!btnElement) return false;
    const bloqueoHasta = localStorage.getItem(storageKey);
    
    if (bloqueoHasta) {
        const tiempoRestante = Math.ceil((parseInt(bloqueoHasta) - Date.now()) / 1000);
        if (tiempoRestante > 0) {
            // Congelar el botón
            btnElement.disabled = true;
            btnElement.style.opacity = '0.5';
            btnElement.style.cursor = 'not-allowed';
            
            // Limpiar contador viejo para que no titile
            if (btnElement.dataset.intervalo) clearInterval(parseInt(btnElement.dataset.intervalo));

            let segs = tiempoRestante;
            btnElement.innerHTML = `<i class="material-icons-round" style="font-size:1.2rem; vertical-align:middle; margin-right:5px;">lock_clock</i> ${segs}s`;

            const interval = setInterval(() => {
                segs--;
                if (segs <= 0) {
                    clearInterval(interval);
                    localStorage.removeItem(storageKey);
                    btnElement.disabled = false;
                    btnElement.style.opacity = '1';
                    btnElement.style.cursor = 'pointer';
                    btnElement.innerHTML = textoOriginal;
                } else {
                    btnElement.innerHTML = `<i class="material-icons-round" style="font-size:1.2rem; vertical-align:middle; margin-right:5px;">lock_clock</i> ${segs}s`;
                }
            }, 1000);
            
            btnElement.dataset.intervalo = interval;
            return true; // Está bloqueado
        } else {
            localStorage.removeItem(storageKey); // Ya caducó, se borra
        }
    }
    return false;
};

window.iniciarBloqueoBoton = function(btnElement, storageKey, textoOriginal, segundos = 30) {
    localStorage.setItem(storageKey, (Date.now() + (segundos * 1000)).toString());
    window.verificarBloqueoBoton(btnElement, storageKey, textoOriginal);
};

// --- 2. NOTIFICACIONES GLOBALES ---
window.mostrarToast = function(mensaje, tipo = 'success') {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            toast: true,
            position: 'bottom-end',
            icon: tipo,
            title: mensaje,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: document.body.classList.contains('dark-mode') ? '#1e293b' : '#ffffff',
            color: document.body.classList.contains('dark-mode') ? '#ffffff' : '#0f172a'
        });
    } else {
        alert(mensaje);
    }
};

// --- 3. ARRANQUE DE MÓDULOS ---
function arrancarModulos() {
    setTimeout(() => {
        const btnTienda = document.querySelector('.nav-item[onclick*="tienda"]');
        if (btnTienda) {
            nav('tienda', btnTienda);
        } else {
            const secTienda = document.getElementById('sec-tienda');
            if(secTienda) secTienda.classList.remove('hidden');
            
            const cartBtn = document.getElementById('main-cart-btn');
            if(cartBtn) cartBtn.classList.remove('hidden');
            
            document.dispatchEvent(new CustomEvent('moduloCargado', { detail: { modulo: 'tienda' } }));
        }
    }, 150); 
}

// --- 4. LÓGICA DE SESIÓN Y RENDERIZADO INICIAL ---
document.addEventListener('DOMContentLoaded', async () => {
    const formLogin = document.getElementById('login-form');
    const loginSection = document.getElementById('login-view');
    const dashboardSection = document.getElementById('app-view');
    const userNameDisplay = document.getElementById('display-user');

    // TEMA OSCURO/CLARO
    const themeToggle = document.getElementById('client-theme-toggle');
    const aplicarTemaCliente = (esOscuro) => {
        document.body.classList.toggle('dark-mode', esOscuro);
        if(themeToggle) themeToggle.checked = esOscuro;
        localStorage.setItem('dw_theme', esOscuro ? 'dark' : 'light');
    };

    const temaGuardado = localStorage.getItem('dw_theme');
    if (temaGuardado) aplicarTemaCliente(temaGuardado === 'dark');
    else aplicarTemaCliente(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (themeToggle) themeToggle.addEventListener('change', (e) => aplicarTemaCliente(e.target.checked));

    // VISIBILIDAD DE CONTRASEÑA
    const togglePassword = document.getElementById('togglePassword');
    const passInput = document.getElementById('pass');
    if (togglePassword && passInput) {
        togglePassword.addEventListener('click', function () {
            const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passInput.setAttribute('type', type);
            this.textContent = type === 'password' ? 'visibility_off' : 'visibility';
        });
    }

    // COMPROBAR SESIÓN ACTIVA
    const t = localStorage.getItem('dw_token');
    const u = localStorage.getItem('dw_user');

    if (t && u) {
        if(loginSection) loginSection.style.display = 'none';
        if(dashboardSection) dashboardSection.style.display = 'flex';
        if(userNameDisplay) userNameDisplay.innerText = u;
        
        userBalance = Number(localStorage.getItem('dw_saldo')) || 0;
        updateBalanceUI();
        sincronizarSaldo();
        arrancarModulos();
    } else {
        if(loginSection) loginSection.style.display = 'flex';
        if(dashboardSection) dashboardSection.style.display = 'none';
    }

    // 🔥 PROCESAR LOGIN Y APLICAR BLOQUEO 🔥
    if (formLogin) {
        const btnLogin = formLogin.querySelector('button[type="submit"]');
        
        // Revisar si el botón estaba bloqueado desde antes de recargar la página
        window.verificarBloqueoBoton(btnLogin, 'dw_login_cooldown', 'ENTRAR');

        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Bloqueo de seguridad si el timer sigue corriendo
            if (window.verificarBloqueoBoton(btnLogin, 'dw_login_cooldown', 'ENTRAR')) return;

            const user = document.getElementById('user').value.trim();
            const pass = document.getElementById('pass').value;

            btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> VERIFICANDO...';
            btnLogin.disabled = true;

            const res = await apiCall({ accion: 'login', usuario: user, clave: pass });

            if (res.success) {
                localStorage.removeItem('dw_login_cooldown'); // Limpiar caché de castigo si entró
                localStorage.setItem('dw_token', res.token);
                localStorage.setItem('dw_user', res.usuario);
                localStorage.setItem('dw_saldo', res.saldo || 0);
                
                userBalance = Number(res.saldo || 0);
                
                if(loginSection) loginSection.style.display = 'none';
                if(dashboardSection) dashboardSection.style.display = 'flex';
                if(userNameDisplay) userNameDisplay.innerText = res.usuario;
                
                updateBalanceUI();
                mostrarToast(`¡Bienvenido, ${res.usuario}!`, 'success');
                arrancarModulos();
                
                btnLogin.innerHTML = 'ENTRAR';
                btnLogin.disabled = false;
            } else {
                mostrarToast(res.msg || "Credenciales incorrectas", "error");
                // 🔥 CASTIGO: Bloqueo de 30 segundos
                window.iniciarBloqueoBoton(btnLogin, 'dw_login_cooldown', 'ENTRAR', 30);
            }
        });
    }
});

// --- 5. SINCRONIZACIÓN DE SALDO ---
window.sincronizarSaldo = async function() {
    const u = localStorage.getItem('dw_user');
    const t = localStorage.getItem('dw_token');
    if (!u || !t) return;

    const res = await apiCall({ accion: 'getSaldo', usuario: u, token: t });
    if (res.success) {
        userBalance = Number(res.saldo);
        localStorage.setItem('dw_saldo', userBalance);
        updateBalanceUI();
    }
};

window.updateBalanceUI = function() {
    const formatted = `$ ${new Intl.NumberFormat('es-CO').format(userBalance)}`;
    const dBalance = document.getElementById('display-balance');
    const wBalance = document.getElementById('wallet-balance-big');
    if(dBalance) dBalance.innerText = formatted;
    if(wBalance) wBalance.innerText = formatted;
};

// --- 6. NAVEGACIÓN (SPA) CON CONTROL DE CARRITO ---
window.nav = function(targetId, element) {
    document.querySelectorAll('.nav-item, .submenu-item').forEach(el => el.classList.remove('active'));
    if(element) element.classList.add('active');

    document.querySelectorAll('.main-content > div').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById('sec-' + targetId);
    if(target) target.classList.remove('hidden');

    const cartBtn = document.getElementById('main-cart-btn');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-overlay');

    if (targetId === 'tienda') {
        if(cartBtn) cartBtn.classList.remove('hidden');
        if(typeof cargarTienda === 'function') cargarTienda(); 
    } else {
        if(cartBtn) cartBtn.classList.add('hidden');
        if(cartDrawer) cartDrawer.classList.remove('open');
        if(cartOverlay) cartOverlay.classList.add('hidden');
    }

    if (window.innerWidth <= 768) {
        toggleSidebar(false);
    }

    if (targetId === 'pedidos' && typeof cargarPedidos === 'function') cargarPedidos();
    if (targetId === 'billetera' && typeof cargarBilletera === 'function') cargarBilletera();
    if (targetId === 'recarga' && typeof cargarRecarga === 'function') cargarRecarga();
    if (targetId === 'soporte' && typeof cargarSoporte === 'function') cargarSoporte(); 
    if (targetId === 'codigos' && typeof cargarCodigos === 'function') cargarCodigos(); 
    if (targetId === 'datos' && typeof cargarDatos === 'function') cargarDatos(); 
    if (targetId === 'mistickets' && typeof cargarMisTickets === 'function') cargarMisTickets();
    if (targetId === 'ranking' && typeof cargarRanking === 'function') cargarRanking();

    document.dispatchEvent(new CustomEvent('moduloCargado', { detail: { modulo: targetId } }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- 7. CONTROLES DE INTERFAZ (SIDEBAR / SUBMENÚS) ---
window.toggleSubmenu = function(elemento) {
    const submenu = elemento.nextElementSibling;
    if (submenu && submenu.classList.contains('submenu')) {
        submenu.classList.toggle('hidden');
        elemento.classList.toggle('open');
        const icon = elemento.querySelector('.arrow-icon');
        if(icon) icon.textContent = submenu.classList.contains('hidden') ? 'expand_more' : 'expand_less';
    }
};

window.toggleSidebar = function(force) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    const isOpen = typeof force === 'boolean' ? force : !sidebar.classList.contains('open');
    
    sidebar.classList.toggle('open', isOpen);
    if(overlay) overlay.classList.toggle('active', isOpen);
};

window.logout = function() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
};
