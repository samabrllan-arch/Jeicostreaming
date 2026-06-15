document.addEventListener('DOMContentLoaded', () => {
    // Escuchar el evento de navegación o ejecutar de inmediato si es necesario
    const originalNav = window.nav;
    if (typeof window.nav === 'function') {
        window.nav = function (secId, element) {
            originalNav(secId, element);
            if (secId === 'recomendaciones') {
                cargarRecomendacionesCliente();
            }
        };
    }
});
window.todasLasRecomendaciones = [];

async function cargarRecomendacionesCliente() {
    const container = document.getElementById('recomendaciones-container');
    if (!container) return;

    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;"><div class="spinner"></div><p style="color: var(--text-gray); margin-top: 20px;">Cargando recomendaciones VIP...</p></div>';

    try {
        const cacheKey = 'recomendaciones_vip_cache';
        const cacheTimeKey = 'recomendaciones_vip_cache_time';
        const now = new Date().getTime();
        const cachedDataStr = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);
        
        let data = null;
        
        // Usar caché si existe y no han pasado 24 horas (24 * 60 * 60 * 1000 = 86400000 ms)
        if (cachedDataStr && cachedTime && (now - parseInt(cachedTime)) < 86400000) {
            data = JSON.parse(cachedDataStr);
        } else {
            const response = await fetch(`${API_BASE_URL_CLIENTE}/dw_api.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion: 'getRecomendaciones' })
            });
            data = await response.json();
            
            if (data.success) {
                localStorage.setItem(cacheKey, JSON.stringify(data));
                localStorage.setItem(cacheTimeKey, now.toString());
            }
        }
        
        if (data && data.success) {
            window.todasLasRecomendaciones = data.datos;
            
            // Construir barra de filtros si no existe
            let filtroContainer = document.getElementById('filtros-recom-premium');
            if (!filtroContainer) {
                filtroContainer = document.createElement('div');
                filtroContainer.id = 'filtros-recom-premium';
                filtroContainer.style.cssText = `
                    display: flex; flex-direction: column; gap: 15px; margin-bottom: 25px;
                `;
                // Ocultar scrollbar en Chrome para contenedores de scroll
                const style = document.createElement('style');
                style.textContent = `
                    .scroll-row::-webkit-scrollbar { display: none; }
                    .scroll-row { scrollbar-width: none; -ms-overflow-style: none; }
                `;
                document.head.appendChild(style);
                
                container.parentNode.insertBefore(filtroContainer, container);
            }
            
            // Extraer categorías y plataformas únicas
            const categoriasUnicas = [...new Set(data.datos.map(d => d.categoria).filter(c => c))];
            const plataformasUnicas = [...new Set(data.datos.map(d => d.plataforma).filter(p => p))];
            
            const btnEstiloBase = `padding: 8px 20px; border-radius: 30px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.1); font-size: 0.9rem; backdrop-filter: blur(10px); flex-shrink: 0;`;
            
            // ROW 1: Controles Globales y Plataformas
            let row1HTML = `
                <div class="scroll-row" style="display: flex; gap: 10px; overflow-x: auto; padding: 0 20px 10px 20px; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <button onclick="cambiarNombreMarca()" class="btn-filtro-rec" style="${btnEstiloBase} background: linear-gradient(45deg, #a855f7, #3b82f6); color: white; border: none; box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);">✨ Mi Marca</button>
                    <button onclick="filtrarRecomendaciones('Todo', this)" class="btn-filtro-rec active" style="${btnEstiloBase} background: white; color: black; box-shadow: 0 0 15px rgba(255,255,255,0.3);">🚀 Todo</button>
                    
                    <div style="width: 2px; height: 20px; background: rgba(255,255,255,0.2); margin: 0 5px; flex-shrink: 0;"></div>
                    <span style="color: #a1a1aa; font-weight: 600; font-size: 0.8rem; letter-spacing: 1px; text-transform: uppercase; flex-shrink: 0;">Plataformas:</span>
            `;
            
            plataformasUnicas.forEach(p => {
                row1HTML += `<button onclick="filtrarRecomendaciones('plat_${p}', this)" class="btn-filtro-rec" style="${btnEstiloBase} background: rgba(20,20,30,0.8); color: white;">🎬 ${p}</button>`;
            });
            row1HTML += `</div>`;

            // ROW 2: Categorias
            let row2HTML = `
                <div class="scroll-row" style="display: flex; gap: 10px; overflow-x: auto; padding: 0 20px 20px 20px; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <span style="color: #a1a1aa; font-weight: 600; font-size: 0.8rem; letter-spacing: 1px; text-transform: uppercase; flex-shrink: 0;">Categorías:</span>
            `;

            if (categoriasUnicas.includes('Estrenos')) {
                row2HTML += `<button onclick="filtrarRecomendaciones('cat_Estrenos', this)" class="btn-filtro-rec" style="${btnEstiloBase} background: rgba(20,20,30,0.8); color: white;">🔥 Estrenos</button>`;
            }
            if (categoriasUnicas.includes('Terror')) {
                row2HTML += `<button onclick="filtrarRecomendaciones('cat_Terror', this)" class="btn-filtro-rec" style="${btnEstiloBase} background: rgba(20,20,30,0.8); color: white;">👻 Terror</button>`;
            }
            categoriasUnicas.forEach(c => {
                if(c !== 'Estrenos' && c !== 'Terror') {
                    row2HTML += `<button onclick="filtrarRecomendaciones('cat_${c}', this)" class="btn-filtro-rec" style="${btnEstiloBase} background: rgba(20,20,30,0.8); color: white;">🍿 ${c}</button>`;
                }
            });
            row2HTML += `</div>`;
            
            filtroContainer.innerHTML = row1HTML + row2HTML;

            // Renderizar todas por defecto
            renderizarTarjetasRecomendacion(data.datos);
        } else {
            container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #ef4444;">No se pudieron cargar las recomendaciones. Error: ${data.msg}</p>`;
        }
    } catch (error) {
        console.error('Error cargando recomendaciones:', error);
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ef4444;">Problemas de conexión con el servidor.</p>';
    }
}

// Función global para filtrar
window.filtrarRecomendaciones = (filtro, btnElement) => {
    // Actualizar estilos visuales de botones
    document.querySelectorAll('.btn-filtro-rec').forEach(btn => {
        // Ignorar el botón de cambiar marca para que no pierda su estilo
        if(btn.innerText.includes('Cambiar Marca')) return;
        btn.style.background = 'rgba(20,20,30,0.8)';
        btn.style.color = 'white';
        btn.style.boxShadow = 'none';
        btn.classList.remove('active');
    });
    
    if(btnElement && !btnElement.innerText.includes('Cambiar Marca')) {
        btnElement.style.background = 'white';
        btnElement.style.color = 'black';
        btnElement.style.boxShadow = '0 0 15px rgba(255,255,255,0.3)';
        btnElement.classList.add('active');
    }

    let filtradas = window.todasLasRecomendaciones;
    
    if (filtro.startsWith('plat_')) {
        const plat = filtro.replace('plat_', '');
        filtradas = window.todasLasRecomendaciones.filter(r => r.plataforma === plat);
    } else if (filtro.startsWith('cat_')) {
        const cat = filtro.replace('cat_', '');
        filtradas = window.todasLasRecomendaciones.filter(r => r.categoria === cat);
    }
    
    renderizarTarjetasRecomendacion(filtradas);
};

// Función global para cambiar el nombre de la marca
window.cambiarNombreMarca = async () => {
    const result = await Swal.fire({
        title: '✨ Configura tu Marca',
        text: 'Escribe el nombre de tu tienda o marca personal:',
        input: 'text',
        inputValue: localStorage.getItem('nombre_vendedor_premium') || '',
        inputPlaceholder: 'Ej: Carlos VIP, Streaming Store...',
        showCancelButton: true,
        confirmButtonText: 'Guardar Marca',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#a855f7',
        background: 'rgba(20,20,30,0.95)',
        color: 'white',
        backdrop: 'rgba(0,0,0,0.8)',
        inputValidator: (value) => {
            if (!value) return '¡Necesitas escribir un nombre!';
        }
    });

    if (result.isConfirmed) {
        localStorage.setItem('nombre_vendedor_premium', result.value);
        Swal.fire({
            icon: 'success',
            title: '¡Guardado!',
            text: 'Tu marca se actualizará en tus próximos estados.',
            background: 'rgba(20,20,30,0.95)',
            color: 'white',
            timer: 2000,
            showConfirmButton: false
        });
    }
};

function renderizarTarjetasRecomendacion(datos) {
    const container = document.getElementById('recomendaciones-container');
    container.innerHTML = '';
    
    if (datos.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-gray); padding: 40px; background: rgba(255,255,255,0.02); border-radius: 20px;">No hay títulos para este filtro. ¡Prueba otro!</p>';
        return;
    }

    datos.forEach(r => {
        let colorPlataforma = r.color || '#e50914'; // Usar color de DB o Netflix by default
        let textColor = '#ffffff';
        
        // Si la BD no trae color, usar el fallback
        if (!r.color) {
            if (r.plataforma.toLowerCase().includes('max') || r.plataforma.toLowerCase().includes('hbo')) colorPlataforma = '#5A2E98';
            if (r.plataforma.toLowerCase().includes('prime') || r.plataforma.toLowerCase().includes('amazon')) colorPlataforma = '#00A8E1';
            if (r.plataforma.toLowerCase().includes('disney')) colorPlataforma = '#113CCF';
            if (r.plataforma.toLowerCase().includes('crunchyroll')) colorPlataforma = '#F47521';
            if (r.plataforma.toLowerCase().includes('apple')) colorPlataforma = '#ffffff';
        }
        
        // Forzar texto negro si el fondo es blanco o muy claro
        if (colorPlataforma.toLowerCase() === '#ffffff' || colorPlataforma.toLowerCase() === '#fff') {
            textColor = '#000000';
        }
        
        const cardId = `rec-card-${r.id}`;
        const card = document.createElement('div');
        card.className = 'rec-card-premium';
        card.id = cardId;
        card.style.cssText = `
            background: rgba(20, 20, 30, 0.7);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            border-radius: 20px;
            overflow: hidden;
            position: relative;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 15px 35px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex;
            flex-direction: column;
        `;
        
        // Efectos hover
        card.onmouseover = () => { 
            card.style.transform = 'translateY(-12px) scale(1.02)'; 
            card.style.boxShadow = `0 25px 50px rgba(0,0,0,0.7), 0 0 40px ${colorPlataforma}50, inset 0 0 0 1px ${colorPlataforma}`; 
            card.style.borderColor = colorPlataforma;
            card.querySelector('.img-zoom').style.transform = 'scale(1.1)';
        };
        card.onmouseout = () => { 
            card.style.transform = 'translateY(0) scale(1)'; 
            card.style.boxShadow = '0 15px 35px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)'; 
            card.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            card.querySelector('.img-zoom').style.transform = 'scale(1)';
        };

        card.innerHTML = `
            <div style="position: relative; width: 100%; padding-top: 140%; overflow: hidden; cursor: pointer;" onclick="abrirPopUpPeli(${r.id})">
                <img class="img-zoom" src="${r.url_imagen}" alt="${r.titulo}" crossorigin="anonymous" referrerpolicy="no-referrer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.7s ease;">
                <div style="position: absolute; top: 15px; right: 15px; display: flex; gap: 8px; flex-direction: column; align-items: flex-end; z-index: 2;">
                    <div style="background: ${colorPlataforma}; color: ${textColor}; padding: 6px 14px; border-radius: 30px; font-weight: 900; font-size: 0.75rem; box-shadow: 0 4px 15px rgba(0,0,0,0.5); text-transform: uppercase; letter-spacing: 1px;">
                        ${r.plataforma}
                    </div>
                    <div style="background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); color: #fff; border: 1px solid rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 30px; font-weight: 600; font-size: 0.7rem; box-shadow: 0 4px 10px rgba(0,0,0,0.5); letter-spacing: 0.5px;">
                        ${r.categoria || 'General'}
                    </div>
                </div>
                <div style="position: absolute; bottom: 0; left: 0; width: 100%; background: linear-gradient(to top, rgba(15,15,20,1) 0%, rgba(15,15,20,0.8) 40%, transparent 100%); padding: 40px 20px 15px 20px; z-index: 1;">
                    <h3 style="color: white; margin: 0; font-size: 1.5rem; font-weight: 900; text-shadow: 0 2px 10px rgba(0,0,0,0.8); letter-spacing: -0.5px; line-height: 1.1;">${r.titulo}</h3>
                </div>
            </div>
            <div style="padding: 20px; flex-grow: 1; display: flex; flex-direction: column; background: rgba(15,15,20,0.95); position: relative; z-index: 2;">
                <p style="color: #a1a1aa; font-size: 0.95rem; line-height: 1.6; margin-bottom: 20px; flex-grow: 1; font-weight: 400;">${r.resumen}</p>
                <div style="background: linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%); border-left: 4px solid #f59e0b; padding: 15px; border-radius: 0 12px 12px 0; margin-top: auto; border-top: 1px solid rgba(245,158,11,0.1); border-right: 1px solid rgba(245,158,11,0.1); border-bottom: 1px solid rgba(245,158,11,0.1); margin-bottom: 15px;">
                    <p style="color: #fbbf24; font-weight: 800; margin: 0; font-size: 0.95rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${r.gancho}</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="abrirPopUpPeli(${r.id})" style="flex: 1; padding: 10px; background: ${colorPlataforma}; color: ${textColor}; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                        <i class="material-icons-round" style="vertical-align: middle; font-size: 1.1rem;">shopping_cart</i> Ver
                    </button>
                    <button onclick="generarEstadoWhatsApp(${r.id}, '${r.titulo.replace(/'/g, "\\'")}', '${r.url_imagen}', '${r.plataforma}', '${colorPlataforma}', '${r.gancho.replace(/'/g, "\\'")}', '${textColor}')" style="flex: 1; padding: 10px; background: #25D366; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                        <i class="material-icons-round" style="vertical-align: middle; font-size: 1.1rem;">share</i> Estado
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    
    // Inyectar animación global
    if (!document.getElementById('anim-filtros-style')) {
        const style = document.createElement('style');
        style.id = 'anim-filtros-style';
        style.textContent = `
            @keyframes fadeInScale {
                from { opacity: 0; transform: scale(0.9) translateY(40px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .rec-card-premium {
                opacity: 0; /* Oculto por defecto hasta que el observer lo active */
            }
            .rec-card-premium.visible {
                animation: fadeInScale 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
        `;
        document.head.appendChild(style);
    }

    // Configurar IntersectionObserver para animar al hacer scroll
    if (window.RecomObserver) {
        window.RecomObserver.disconnect();
    }
    
    window.RecomObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Pequeño delay en cascada para elementos en la misma fila
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
                window.RecomObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    // Observar todas las tarjetas nuevas
    document.querySelectorAll('.rec-card-premium').forEach(card => {
        window.RecomObserver.observe(card);
    });
}

// Función global para abrir SweetAlert
window.abrirPopUpPeli = (id_peli) => {
    const r = window.todasLasRecomendaciones.find(x => x.id === id_peli);
    if (!r) return;

    let colorPlataforma = '#e50914';
    let textColor = '#ffffff';
    if (r.plataforma.toLowerCase().includes('max') || r.plataforma.toLowerCase().includes('hbo')) colorPlataforma = '#5A2E98';
    if (r.plataforma.toLowerCase().includes('prime') || r.plataforma.toLowerCase().includes('amazon')) colorPlataforma = '#00A8E1';
    if (r.plataforma.toLowerCase().includes('disney')) colorPlataforma = '#113CCF';
    if (r.plataforma.toLowerCase().includes('crunchyroll')) colorPlataforma = '#F47521';
    if (r.plataforma.toLowerCase().includes('apple')) { colorPlataforma = '#ffffff'; textColor = '#000000'; }

    const emojisDecoracion = ['🍿', '🎬', '🎟️', '🥤', '📽️', '📺', '⭐', '🔥'];
    const emojisRandomPop = Array.from({length: 12}, () => {
        const emoji = emojisDecoracion[Math.floor(Math.random() * emojisDecoracion.length)];
        const top = Math.floor(Math.random() * 90) + 5; // 5vh to 95vh
        const left = Math.floor(Math.random() * 90) + 5; // 5vw to 95vw
        const size = Math.floor(Math.random() * 60) + 20; // 20px to 80px
        const rotation = Math.floor(Math.random() * 360) - 180; // -180 to 180
        const animDuration = (Math.random() * 5 + 4).toFixed(1); // 4s to 9s
        const opacity = (Math.random() * 0.4 + 0.2).toFixed(2); // 0.2 to 0.6
        
        return `<div style="position:fixed; top:${top}vh; left:${left}vw; font-size:${size}px; opacity:${opacity}; z-index:-1; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.9)); pointer-events:none; --rot: ${rotation}deg; transform: rotate(${rotation}deg); animation: floatAnim ${animDuration}s ease-in-out infinite alternate;">${emoji}</div>`;
    }).join('');

    Swal.fire({
        html: `
            <style>
                .swal-blur-container {
                    backdrop-filter: blur(15px) !important;
                    -webkit-backdrop-filter: blur(15px) !important;
                    background: rgba(0, 0, 0, 0.6) !important;
                }
                .swal-premium-transparent {
                    background: transparent !important;
                }
                @keyframes floatAnim {
                    0% { transform: translateY(0px) rotate(var(--rot)); }
                    50% { transform: translateY(-25px) rotate(calc(var(--rot) + 15deg)); }
                    100% { transform: translateY(0px) rotate(calc(var(--rot) - 5deg)); }
                }
            </style>
            
            ${emojisRandomPop}

            <div style="position: relative; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.8), 0 0 40px ${colorPlataforma}40; border: 1px solid rgba(255,255,255,0.15); background: rgba(10,10,15,0.3); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
                <div style="position: absolute; top: -20%; left: -20%; width: 140%; height: 140%; background-image: url('${r.url_imagen}'); background-size: cover; background-position: center; filter: blur(35px) brightness(0.6); z-index: 0;"></div>
                
                <div style="position: relative; z-index: 2; padding: 0;">
                    <div style="position: relative; width: 100%; height: 320px;">
                        <img src="${r.url_imagen}" crossorigin="anonymous" referrerpolicy="no-referrer" style="width: 100%; height: 100%; object-fit: cover; border-radius: 24px 24px 0 0; box-shadow: inset 0 -20px 50px rgba(0,0,0,0.8);">
                        <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 200px; background: linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.7) 40%, transparent 100%);"></div>
                        
                        <div style="position: absolute; top: 15px; right: 15px; background: ${colorPlataforma}; color: ${textColor}; padding: 8px 20px; border-radius: 30px; font-weight: 900; font-size: 0.95rem; box-shadow: 0 5px 20px rgba(0,0,0,0.8); border: 2px solid rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 1px;">
                            ${r.plataforma}
                        </div>
                    </div>
                    
                    <div style="padding: 0 30px 30px 30px; text-align: center;">
                        <h2 style="font-weight: 900; font-size: 2.4rem; text-shadow: 0 4px 15px rgba(0,0,0,0.9); margin: -60px 0 20px 0; color: white; line-height: 1.1; position: relative;">${r.titulo}</h2>
                        
                        <div style="background: rgba(0,0,0,0.6); border-radius: 16px; padding: 20px; border: 1px solid ${colorPlataforma}50; box-shadow: 0 10px 25px rgba(0,0,0,0.5), inset 0 0 20px ${colorPlataforma}20; position: relative; overflow: hidden;">
                            <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, ${colorPlataforma}20 0%, transparent 70%); z-index: 0;"></div>
                            <p style="font-size: 1.1rem; color: #f4f4f5; font-weight: 500; margin: 0; line-height: 1.5; position: relative; z-index: 1;">
                                ¡Consigue tu cuenta premium de <b style="color: ${colorPlataforma}; font-size: 1.3rem; text-shadow: 0 0 15px ${colorPlataforma}; text-transform: uppercase;">${r.plataforma}</b> y míralo ahora mismo sin interrupciones!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `,
        showConfirmButton: true,
        confirmButtonText: '<i class="material-icons-round" style="vertical-align: middle; margin-right: 5px;">shopping_cart</i> Obtener Cuenta VIP',
        confirmButtonColor: colorPlataforma,
        showCancelButton: true,
        cancelButtonText: 'Cerrar',
        cancelButtonColor: 'rgba(255,255,255,0.1)',
        background: 'transparent',
        backdrop: true,
        color: 'white',
        width: '480px',
        padding: '0',
        showClass: {
            popup: 'swal2-show',
            backdrop: 'swal2-backdrop-show swal-blur-container'
        },
        hideClass: {
            popup: 'swal2-hide',
            backdrop: 'swal2-backdrop-hide swal-blur-container'
        },
        customClass: { 
            popup: 'swal-premium-transparent',
            container: 'swal-blur-container'
        }
    }).then((res) => { if (res.isConfirmed) nav('tienda'); });
};

async function generarEstadoWhatsApp(id, titulo, url_img, plataforma, colorPlataforma, gancho, textColor) {
    let nombreVendedor = localStorage.getItem('nombre_vendedor_premium');
    
    if (!nombreVendedor) {
        const result = await Swal.fire({
            title: '✨ Configura tu Marca',
            text: 'Ingresa tu nombre o el de tu tienda para ponerle una marca de agua súper cool a tus estados.',
            input: 'text',
            inputPlaceholder: 'Ej: Carlos VIP, Streaming Store...',
            showCancelButton: true,
            confirmButtonText: 'Guardar y Generar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: colorPlataforma,
            background: 'rgba(20,20,30,0.95)',
            color: 'white',
            backdrop: 'rgba(0,0,0,0.8)',
            inputValidator: (value) => {
                if (!value) return '¡Necesitas escribir un nombre!';
            }
        });

        if (result.isConfirmed) {
            nombreVendedor = result.value;
            localStorage.setItem('nombre_vendedor_premium', nombreVendedor);
        } else {
            return; // Cancelado
        }
    }

    Swal.fire({ title: 'Preparando Imagen...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    // Load html2canvas if not exists
    if (typeof html2canvas === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        document.head.appendChild(script);
        await new Promise(r => script.onload = r);
    }
    
    // Inyectar fuente cursiva súper cool
    if (!document.getElementById('pacifico-font')) {
        const fontLink = document.createElement('link');
        fontLink.id = 'pacifico-font';
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap';
        document.head.appendChild(fontLink);
        // Esperar un momento breve para que la fuente intente cargar
        await new Promise(r => setTimeout(r, 400));
    }

    const emojisDecoracion = ['🍿', '🎬', '🎟️', '🥤', '📽️', '📺', '⭐', '🔥'];
    const emojisRandom = Array.from({length: 6}, () => {
        const emoji = emojisDecoracion[Math.floor(Math.random() * emojisDecoracion.length)];
        const top = Math.floor(Math.random() * 90) + 5;
        const left = Math.floor(Math.random() * 90) + 5;
        const size = Math.floor(Math.random() * 60) + 40;
        const rotation = Math.floor(Math.random() * 360);
        return `<div style="position:absolute; top:${top}%; left:${left}%; font-size:${size}px; transform:rotate(${rotation}deg); opacity:0.15; z-index:1; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.5));">${emoji}</div>`;
    }).join('');

    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
        position: fixed; top: -9999px; left: -9999px;
        width: 1080px; height: 1920px;
        overflow: hidden;
        font-family: 'Inter', sans-serif;
        box-sizing: border-box; padding: 0;
    `;

    statusDiv.innerHTML = `
<div style="
    width: 1080px; height: 1920px;
    position: relative;
    overflow: hidden;
    background: #020205;
    font-family: 'Inter', Arial, Helvetica, sans-serif;
">

    <!-- ── IMAGEN A SANGRE COMPLETA ─────────────────────────── -->
    <img
        src="${url_img}"
        crossorigin="anonymous"
        style="
            position: absolute; top: 0; left: 0;
            width: 100%; height: 100%;
            object-fit: cover; object-position: center 20%;
            z-index: 1;
        "
    />

    <!-- ── VIÑETA CINEMÁTICA — 4 capas de gradiente ─────────── -->

    <!-- Superior: oscurece el área de los badges -->
    <div style="
        position: absolute; top: 0; left: 0;
        width: 100%; height: 520px;
        background: linear-gradient(to bottom,
            rgba(2,2,5,0.92) 0%,
            rgba(2,2,5,0.50) 55%,
            rgba(2,2,5,0) 100%
        );
        z-index: 2;
    "></div>

    <!-- Inferior: fade dramático hacia el panel de texto -->
    <div style="
        position: absolute; bottom: 0; left: 0;
        width: 100%; height: 1000px;
        background: linear-gradient(to top,
            #020205 0%,
            rgba(2,2,5,0.97) 20%,
            rgba(2,2,5,0.88) 42%,
            rgba(2,2,5,0.52) 66%,
            rgba(2,2,5,0) 100%
        );
        z-index: 2;
    "></div>

    <!-- Lateral izquierdo: sombra suave para respirar el texto -->
    <div style="
        position: absolute; top: 0; left: 0;
        width: 300px; height: 100%;
        background: linear-gradient(to right, rgba(2,2,5,0.62) 0%, rgba(2,2,5,0) 100%);
        z-index: 2;
    "></div>

    <!-- Lateral derecho: vignette sutil -->
    <div style="
        position: absolute; top: 0; right: 0;
        width: 180px; height: 100%;
        background: linear-gradient(to left, rgba(2,2,5,0.35) 0%, rgba(2,2,5,0) 100%);
        z-index: 2;
    "></div>


    <!-- ── FIRMA VISUAL: Light Leak borde izquierdo ──────────── -->

    <!-- Línea central sólida -->
    <div style="
        position: absolute; top: 0; left: 0;
        width: 5px; height: 100%;
        background: linear-gradient(to bottom,
            rgba(2,2,5,0) 6%,
            ${colorPlataforma} 26%,
            ${colorPlataforma} 74%,
            rgba(2,2,5,0) 94%
        );
        z-index: 6;
        opacity: 0.80;
    "></div>

    <!-- Halo difuso del light leak -->
    <div style="
        position: absolute; top: 0; left: 0;
        width: 65px; height: 100%;
        background: linear-gradient(to right, ${colorPlataforma} 0%, rgba(2,2,5,0) 100%);
        opacity: 0.4;
        z-index: 5;
    "></div>


    <!-- ── HEADER: Badge plataforma + Nombre vendedor ─────────── -->
    <div style="
        position: absolute; top: 0; left: 0;
        width: 100%;
        padding: 70px 80px;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        z-index: 10;
    ">

        <!-- Badge plataforma: borde fino, sin fondo sólido -->
        <div style="
            border: 2.5px solid ${colorPlataforma};
            padding: 15px 42px;
            display: inline-block;
        ">
            <span style="
                color: ${colorPlataforma};
                font-size: 31px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 8px;
                font-family: 'Inter', Arial, sans-serif;
            ">${plataforma}</span>
        </div>

        <!-- Nombre del vendedor -->
        <div style="text-align: right;">
            <div style="
                color: #ffffff;
                font-family: 'Pacifico', cursive;
                font-size: 38px;
                text-shadow:
                    0 0 22px ${colorPlataforma},
                    0 2px 14px rgba(0,0,0,0.9);
            ">${nombreVendedor}</div>
            <div style="
                margin-top: 11px;
                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: 10px;
            ">
                <div style="
                    width: 9px; height: 9px;
                    border-radius: 50%;
                    background: #22c55e;
                    box-shadow: 0 0 10px #22c55e;
                "></div>
                <span style="
                    color: #22c55e;
                    font-size: 22px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 5px;
                    font-family: 'Inter', Arial, sans-serif;
                ">Cuenta VIP</span>
            </div>
        </div>

    </div><!-- /header -->


    <!-- ── BLOQUE INFERIOR: Título · Gancho · CTA ────────────── -->
    <div style="
        position: absolute; bottom: 0; left: 0;
        width: 100%;
        padding: 0 85px 115px 85px;
        box-sizing: border-box;
        z-index: 10;
    ">

        <!-- Eyebrow label -->
        <div style="
            display: flex;
            align-items: center;
            gap: 22px;
            margin-bottom: 32px;
        ">
            <div style="width: 52px; height: 3px; background: ${colorPlataforma};"></div>
            <span style="
                color: ${colorPlataforma};
                font-size: 25px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 9px;
                font-family: 'Inter', Arial, sans-serif;
            ">Recomendado</span>
            <div style="
                flex: 1; height: 2px;
                background: linear-gradient(to right, ${colorPlataforma}, rgba(2,2,5,0));
                opacity: 0.5;
            "></div>
        </div>

        <!-- TÍTULO principal -->
        <h1 style="
            color: #FFFFFF;
            font-size: 110px;
            font-weight: 400;
            margin: 0 0 44px 0;
            line-height: 1.05;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-shadow: 
                4px 4px 0px ${colorPlataforma},
                8px 8px 0px rgba(0,0,0,0.8),
                0 15px 40px rgba(0,0,0,0.9);
            font-family: 'Righteous', 'Inter', Arial, sans-serif;
        ">${titulo}</h1>

        <!-- Línea divisoria -->
        <div style="
            width: 100%; height: 2px;
            background: linear-gradient(to right, rgba(255,255,255,0.13), rgba(2,2,5,0));
            margin-bottom: 50px;
        "></div>

        <!-- GANCHO — bloque de cita -->
        <div style="
            position: relative;
            margin-bottom: 72px;
            padding-left: 38px;
        ">
            <!-- Comilla decorativa grande -->
            <div style="
                position: absolute;
                top: -70px; left: -20px;
                color: ${colorPlataforma};
                font-size: 185px;
                line-height: 1;
                opacity: 0.28;
                font-family: Georgia, 'Times New Roman', serif;
            ">"</div>

            <p style="
                color: rgba(255,255,255,0.78);
                font-size: 44px;
                font-weight: 300;
                font-style: italic;
                margin: 0;
                line-height: 1.45;
                position: relative;
                z-index: 1;
                font-family: 'Inter', Arial, sans-serif;
            ">${gancho}</p>
        </div>

        <!-- CTA BUTTON -->
        <div style="
            background: ${colorPlataforma};
            padding: 42px 0;
            text-align: center;
            border-radius: 14px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 25px 65px rgba(0,0,0,0.5);
        ">
            <!-- Reflejo de luz superior izquierdo -->
            <div style="
                position: absolute; top: 0; left: 0;
                width: 44%; height: 100%;
                background: linear-gradient(to right, rgba(255,255,255,0.20), rgba(2,2,5,0));
                border-radius: 14px 0 0 14px;
            "></div>

            <span style="
                color: ${textColor};
                font-size: 40px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 5px;
                position: relative;
                z-index: 1;
                font-family: 'Inter', Arial, sans-serif;
            ">¡Pídelo Ahora Mismo!</span>
        </div>

    </div><!-- /bloque inferior -->

</div>
    `;

    document.body.appendChild(statusDiv);

    try {
        const canvas = await html2canvas(statusDiv, {
            useCORS: true,
            allowTaint: false,
            scale: 1, 
            backgroundColor: null
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        document.body.removeChild(statusDiv);
        
        Swal.fire({
            title: '¡Diseño Listo!',
            html: `
                <p style="margin-bottom: 15px; color: var(--text-gray);">Toca el botón para compartirlo directo en WhatsApp.</p>
                <img src="${imgData}" style="width: 100%; max-width: 250px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            `,
            showCancelButton: true,
            confirmButtonText: '<i class="material-icons-round" style="vertical-align: middle;">share</i> Compartir Estado',
            cancelButtonText: 'Descargar',
            confirmButtonColor: '#25D366'
        }).then(async (res) => {
            if (res.isConfirmed) {
                // Try Web Share API for native WhatsApp sharing on Mobile
                try {
                    const blob = await (await fetch(imgData)).blob();
                    const file = new File([blob], `VIP_${titulo.replace(/\s+/g, '')}.jpg`, { type: 'image/jpeg' });
                    
                    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            title: 'Recomendación VIP',
                            text: `¡Tienes que ver ${titulo} en ${plataforma}!\n🔥 ${gancho}\n\nEscríbeme para darte tu cuenta VIP al instante. 🍿`
                        });
                    } else {
                        // Fallback: descargar si es PC o no soporta Web Share
                        Swal.fire('Atención', 'Tu navegador no soporta envío directo a WhatsApp. La imagen se descargará para que la subas tú mismo.', 'info');
                        const link = document.createElement('a'); link.download = `Estado_${titulo.replace(/\s+/g, '_')}.jpg`; link.href = imgData; link.click();
                    }
                } catch (err) {
                    console.log('Share cancelado o fallido', err);
                }
            } else if (res.dismiss === Swal.DismissReason.cancel) {
                // Descargar normal
                const link = document.createElement('a');
                link.download = `Estado_${titulo.replace(/\s+/g, '_')}.jpg`;
                link.href = imgData;
                link.click();
            }
        });
    } catch (e) {
        console.error('Error html2canvas:', e);
        if (statusDiv.parentNode) document.body.removeChild(statusDiv);
        Swal.fire('Ups', 'Hubo un problema al generar la imagen.', 'error');
    }
}
