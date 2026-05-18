// ================================================================
// SISTEMA DE TEMAS v3.1 — Multi-Color Failsafe & UX Animado
// ================================================================

const TEMAS_CONFIG = {
    fuego: {
        nombre: 'Fuego', emoji: '🔥',
        colors: ['#dc2626', '#ea580c', '#f97316', '#fbbf24'],
        light: { '--accent': '#dc2626', '--accent-hover': '#b91c1c', '--accent-glow': 'rgba(249,115,22,0.2)', '--accent-text': '#c2410c', '--accent-gradient': 'linear-gradient(135deg,#dc2626 0%,#ea580c 100%)' },
        dark: { '--accent': '#ef4444', '--accent-hover': '#dc2626', '--accent-glow': 'rgba(249,115,22,0.35)', '--accent-text': '#fb923c', '--accent-gradient': 'linear-gradient(135deg,#ef4444 0%,#f97316 100%)' }
    },
    tec: {
        nombre: 'Tecnología', emoji: '⚡',
        colors: ['#7c3aed', '#4f46e5', '#6366f1', '#a78bfa'],
        light: { '--accent': '#7c3aed', '--accent-hover': '#6d28d9', '--accent-glow': 'rgba(124,58,237,0.2)', '--accent-text': '#6d28d9', '--accent-gradient': 'linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)' },
        dark: { '--accent': '#8b5cf6', '--accent-hover': '#7c3aed', '--accent-glow': 'rgba(139,92,246,0.35)', '--accent-text': '#a78bfa', '--accent-gradient': 'linear-gradient(135deg,#8b5cf6 0%,#6366f1 100%)' }
    },
    oceano: {
        nombre: 'Océano', emoji: '🌊',
        colors: ['#0284c7', '#0891b2', '#22d3ee', '#7dd3fc'],
        light: { '--accent': '#0284c7', '--accent-hover': '#0369a1', '--accent-glow': 'rgba(2,132,199,0.2)', '--accent-text': '#0369a1', '--accent-gradient': 'linear-gradient(135deg,#0284c7 0%,#0891b2 100%)' },
        dark: { '--accent': '#38bdf8', '--accent-hover': '#0284c7', '--accent-glow': 'rgba(56,189,248,0.35)', '--accent-text': '#7dd3fc', '--accent-gradient': 'linear-gradient(135deg,#38bdf8 0%,#22d3ee 100%)' }
    },
    esmeralda: {
        nombre: 'Esmeralda', emoji: '💎',
        colors: ['#059669', '#0d9488', '#14b8a6', '#34d399'],
        light: { '--accent': '#059669', '--accent-hover': '#047857', '--accent-glow': 'rgba(5,150,105,0.2)', '--accent-text': '#047857', '--accent-gradient': 'linear-gradient(135deg,#059669 0%,#0d9488 100%)' },
        dark: { '--accent': '#10b981', '--accent-hover': '#059669', '--accent-glow': 'rgba(16,185,129,0.35)', '--accent-text': '#34d399', '--accent-gradient': 'linear-gradient(135deg,#10b981 0%,#14b8a6 100%)' }
    }
};

const TEMA_KEY = 'dw_tema_color';
const CUSTOM_KEY = 'dw_tema_custom';

// ── Helpers de Color ──────────────────────────────────────────
function hexToRgba(hex, a) {
    if (!hex || hex.length < 7) return `rgba(124,58,237,${a})`;
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
}
function darken(hex, pct) {
    if (!hex || hex.length < 7) return hex;
    let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    r = Math.round(r * (1 - pct)); g = Math.round(g * (1 - pct)); b = Math.round(b * (1 - pct));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
function lighten(hex, pct) {
    if (!hex || hex.length < 7) return hex;
    let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, Math.round(r + (255 - r) * pct)); g = Math.min(255, Math.round(g + (255 - g) * pct)); b = Math.min(255, Math.round(b + (255 - b) * pct));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// 🔥 FAILSAFE: Evita crashes si el usuario tiene una memoria vieja
function getSafeCustomData() {
    try {
        const raw = localStorage.getItem(CUSTOM_KEY);
        if (!raw) return { mode: 2, colors: ["#7c3aed", "#ec4899", "#f59e0b"] };

        const parsed = JSON.parse(raw);
        // Si viene del formato antiguo (c1, c2)
        if (parsed.c1 && !parsed.colors) {
            return { mode: 2, colors: [parsed.c1, parsed.c2 || "#ec4899", "#f59e0b"] };
        }
        // Si tiene formato nuevo pero le falta información
        if (parsed.colors && Array.isArray(parsed.colors)) {
            return {
                mode: parsed.mode || 2,
                colors: [
                    parsed.colors[0] || "#7c3aed",
                    parsed.colors[1] || "#ec4899",
                    parsed.colors[2] || "#f59e0b"
                ]
            };
        }
        return { mode: 2, colors: ["#7c3aed", "#ec4899", "#f59e0b"] };
    } catch (e) {
        return { mode: 2, colors: ["#7c3aed", "#ec4899", "#f59e0b"] };
    }
}

// Generador Inteligente de Degradados para 1, 2 o 3 colores
function buildVarsFromColors(colorsArray) {
    if (!colorsArray || colorsArray.length === 0) colorsArray = ['#7c3aed'];
    const isDark = document.body.classList.contains('dark-mode');
    const c1 = colorsArray[0];
    const lastC = colorsArray[colorsArray.length - 1];

    let gradStr;
    if (colorsArray.length === 1) {
        const c2 = isDark ? lighten(c1, 0.2) : darken(c1, 0.15);
        gradStr = `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
    } else {
        const stops = colorsArray.map((c, i) => {
            const pct = Math.round((i / (colorsArray.length - 1)) * 100);
            return `${isDark ? lighten(c, 0.1) : c} ${pct}%`;
        });
        gradStr = `linear-gradient(135deg, ${stops.join(', ')})`;
    }

    if (isDark) {
        return {
            '--accent': lighten(c1, 0.1), '--accent-hover': c1,
            '--accent-glow': hexToRgba(c1, 0.35), '--accent-text': lighten(lastC, 0.3),
            '--accent-gradient': gradStr
        };
    } else {
        return {
            '--accent': c1, '--accent-hover': darken(c1, 0.15),
            '--accent-glow': hexToRgba(c1, 0.2), '--accent-text': darken(lastC, 0.15),
            '--accent-gradient': gradStr
        };
    }
}

// ── Aplicación de Tema ────────────────────────────────────────
window.aplicarTema = function (nombre, guardar = true) {
    let vars;
    if (nombre === 'custom') {
        const saved = getSafeCustomData();
        const numColors = saved.mode || 2;
        const colors = saved.colors.slice(0, numColors);
        vars = buildVarsFromColors(colors);
    } else {
        const tema = TEMAS_CONFIG[nombre];
        if (!tema) return;
        const isDark = document.body.classList.contains('dark-mode');
        vars = isDark ? tema.dark : tema.light;
    }

    Object.entries(vars).forEach(([k, v]) => document.body.style.setProperty(k, v));

    if (guardar) localStorage.setItem(TEMA_KEY, nombre);

    document.querySelectorAll('.tema-card').forEach(c =>
        c.classList.toggle('tema-card--active', c.dataset.tema === nombre)
    );

    const orb = document.getElementById('tema-preview-orb');
    if (orb) orb.style.background = vars['--accent-gradient'];
};

window.setCustomMode = function (n) {
    let saved = getSafeCustomData();
    saved.mode = n;
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(saved));
    window.renderizarSelectorTemas();
    window.aplicarTemaCustom();
};

window.aplicarTemaCustom = function () {
    let saved = getSafeCustomData();
    const numColors = saved.mode || 2;

    const c1 = document.getElementById('custom-c1')?.value || saved.colors[0];
    const c2 = document.getElementById('custom-c2')?.value || saved.colors[1];
    const c3 = document.getElementById('custom-c3')?.value || saved.colors[2];

    localStorage.setItem(CUSTOM_KEY, JSON.stringify({ mode: numColors, colors: [c1, c2, c3] }));
    window.aplicarTema('custom', true);
};

// ── Renderizado del Panel ─────────────────────────────────────
window.renderizarSelectorTemas = function () {
    const el = document.getElementById('panel-temas');
    if (!el) return;
    const activo = localStorage.getItem(TEMA_KEY) || 'fuego';
    const custom = getSafeCustomData();
    const mode = custom.mode || 2;
    const [c1, c2, c3] = custom.colors;

    let html = '<div class="temas-grid">';

    // Default Preset Cards
    for (const [key, t] of Object.entries(TEMAS_CONFIG)) {
        const grad = `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]}, ${t.colors[2]}, ${t.colors[3]})`;
        html += `
        <div class="tema-card ${key === activo ? 'tema-card--active' : ''}" data-tema="${key}" onclick="window.aplicarTema('${key}')">
            <div class="tema-card-gradient" style="background:${grad}"></div>
            <div class="tema-card-info">
                <span class="tema-emoji">${t.emoji}</span>
                <span class="tema-nombre">${t.nombre}</span>
                <span class="tema-check material-icons-round">check_circle</span>
            </div>
            <div class="tema-dots">
                ${t.colors.map(c => `<span class="tema-dot" style="background:${c}"></span>`).join('')}
            </div>
        </div>`;
    }

    // Custom Color Card
    let customGradStr;
    if (mode === 1) customGradStr = c1;
    else if (mode === 2) customGradStr = `linear-gradient(135deg, ${c1}, ${c2})`;
    else customGradStr = `linear-gradient(135deg, ${c1}, ${c2}, ${c3})`;

    html += `
    <div class="tema-card tema-card-custom ${activo === 'custom' ? 'tema-card--active' : ''}" data-tema="custom" onclick="window.aplicarTema('custom')">
        <div class="tema-card-gradient" style="background:${customGradStr}"></div>
        <div class="tema-card-info">
            <span class="tema-emoji">🎨</span>
            <span class="tema-nombre">Personalizado</span>
            <span class="tema-check material-icons-round">check_circle</span>
        </div>
        
        <div class="tema-custom-pickers" onclick="event.stopPropagation()">
            <div class="custom-mode-selector">
                <button class="mode-btn ${mode === 1 ? 'active' : ''}" onclick="setCustomMode(1)">1</button>
                <button class="mode-btn ${mode === 2 ? 'active' : ''}" onclick="setCustomMode(2)">2</button>
                <button class="mode-btn ${mode === 3 ? 'active' : ''}" onclick="setCustomMode(3)">3</button>
                <span style="font-size:0.55rem; color:var(--text-gray); margin-left:3px; text-transform:uppercase; font-weight:900;">COLORES</span>
            </div>
            <div class="custom-color-inputs">
                <input type="color" id="custom-c1" value="${c1}" onchange="window.aplicarTemaCustom()">
                ${mode >= 2 ? `<input type="color" id="custom-c2" value="${c2}" onchange="window.aplicarTemaCustom()">` : ''}
                ${mode === 3 ? `<input type="color" id="custom-c3" value="${c3}" onchange="window.aplicarTemaCustom()">` : ''}
            </div>
        </div>
    </div>`;

    html += '</div>';

    // Vista Previa Inferior
    html += `
    <div class="tema-preview-row">
        <div class="tema-preview-orb" id="tema-preview-orb"></div>
        <div class="tema-preview-text">
            <span class="tprev-label">Vista previa de tu paleta</span>
            <span class="tprev-desc">Observa cómo se adapta a botones y acentos visuales.</span>
        </div>
        <button class="tprev-btn" style="background:var(--accent-gradient);color:#fff;border:none;padding:10px 24px;border-radius:12px;font-weight:900;font-size:0.75rem;letter-spacing:1px;cursor:default;box-shadow:0 4px 15px var(--accent-glow);">EJEMPLO</button>
    </div>`;

    el.innerHTML = html;

    const orb = document.getElementById('tema-preview-orb');
    if (orb) {
        const cs = getComputedStyle(document.body);
        orb.style.background = cs.getPropertyValue('--accent-gradient') || 'var(--accent)';
    }
};

// ── Listeners Principales ─────────────────────────────────────
new MutationObserver(() => {
    const t = localStorage.getItem(TEMA_KEY) || 'fuego';
    window.aplicarTema(t, false);
}).observe(document.body, { attributes: true, attributeFilter: ['class'] });

document.addEventListener('moduloCargado', (e) => {
    if (e.detail.modulo === 'inicio') {
        window.renderizarSelectorTemas();

        // 1. Limpiar el saludo superior para que quede libre
        const greetingEl = document.querySelector('.dashboard-greeting');
        if (greetingEl) {
            greetingEl.innerHTML = 'Bienvenido de vuelta,';
        }

        // 2. Inyección blindada del GIF a la derecha del nombre
        const nameEl = document.getElementById('inicio-user-name-display');
        if (nameEl && !document.getElementById('gif-saludo')) {
            // Creamos una caja invisible (Flexbox) para alinearlos perfectamente
            const flexContenedor = document.createElement('div');
            flexContenedor.style.display = 'flex';
            flexContenedor.style.alignItems = 'center';
            flexContenedor.style.gap = '15px'; // Distancia fija entre el texto y el GIF

            // Envolvemos el nombre en la caja
            nameEl.parentNode.insertBefore(flexContenedor, nameEl);
            flexContenedor.appendChild(nameEl);

            // Creamos y agregamos el GIF
            const img = document.createElement('img');
            img.src = 'Saludo.gif';
            img.id = 'gif-saludo';
            img.className = 'gif-greeting';
            flexContenedor.appendChild(img);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    window.aplicarTema(localStorage.getItem(TEMA_KEY) || 'fuego', false);
});

document.addEventListener('DOMContentLoaded', () => {
    window.aplicarTema(localStorage.getItem(TEMA_KEY) || 'fuego', false);
});

// ── Inyección de Estilos CSS ──────────────────────────────────
(function () {
    const s = document.createElement('style');
    s.innerHTML = `
        /* ANIMACIÓN EMOJI MIRANDO DE LADO A LADO */
        @keyframes look-around {
            0%, 40%  { transform: translateX(0px) scaleX(1); }       /* Pausa mirando a la izquierda */
            45%, 50% { transform: translateX(4px) scaleX(-1); }      /* Voltea rápido a la derecha */
            55%, 90% { transform: translateX(4px) scaleX(-1); }      /* Pausa mirando a la derecha */
            95%, 100%{ transform: translateX(0px) scaleX(1); }       /* Vuelve rápido a la izquierda */
        }
        .animated-look {
            display: inline-block;
            animation: look-around 4s infinite; /* 4 segundos hace que sea muy pausado y natural */
            font-size: 1.2rem;
            margin-left: 6px;
            transform-origin: center;
        }

        /* DASHBOARD HERO */
        .inicio-dashboard-hero{background:var(--bg-card);border:1px solid var(--border-color);border-radius:24px;padding:35px 40px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;gap:30px;position:relative;overflow:hidden}
        .inicio-dashboard-hero::after{content:'';position:absolute;top:-80px;right:-80px;width:220px;height:220px;border-radius:50%;background:var(--accent-glow);filter:blur(50px);pointer-events:none}
        .dashboard-user-info{position:relative;z-index:1}
        .dashboard-greeting{color:var(--text-gray);font-size:.72rem;text-transform:uppercase;letter-spacing:3px;font-weight:700;margin-bottom:6px; display:flex; align-items:center;}
        .dashboard-name{color:var(--text-white);font-size:clamp(1.6rem,3vw,2.4rem);font-family:'Righteous',cursive;margin:0;line-height:1.15}
        .dashboard-balance-card{position:relative;z-index:1;background:var(--accent-gradient);padding:22px 30px;border-radius:18px;display:flex;align-items:center;gap:24px;box-shadow:0 8px 30px var(--accent-glow);flex-shrink:0}
        .balance-label{color:rgba(255,255,255,.75);font-size:.6rem;font-weight:800;letter-spacing:2px;text-transform:uppercase}
        .balance-amount{color:#fff;font-family:'Righteous',cursive;font-size:1.8rem;margin:4px 0 0;letter-spacing:.5px}
        .btn-recarga-quick{background:rgba(255,255,255,.18);backdrop-filter:blur(8px);color:#fff;border:1px solid rgba(255,255,255,.25);padding:10px 18px;border-radius:12px;font-weight:800;font-size:.72rem;letter-spacing:1px;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;gap:6px;transition:.25s;white-space:nowrap}
        .btn-recarga-quick:hover{background:rgba(255,255,255,.3);transform:translateY(-2px)}
        .btn-recarga-quick .material-icons-round{font-size:1.1rem}

        /* QUICK ACTIONS */
        .inicio-quick-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px}
        .quick-card{background:var(--bg-card);border:1px solid var(--border-color);padding:22px 20px;border-radius:18px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:all .25s cubic-bezier(.16,1,.3,1)}
        .quick-card:hover{border-color:var(--accent);transform:translateY(-3px);box-shadow:0 8px 24px var(--accent-glow)}
        .quick-icon{width:44px;height:44px;border-radius:12px;background:var(--accent-glow);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:.3s}
        .quick-icon .material-icons-round{font-size:1.3rem;color:var(--accent-text)}
        .quick-card:hover .quick-icon{background:var(--accent-gradient)}
        .quick-card:hover .quick-icon .material-icons-round{color:#fff}
        .quick-text{flex:1;min-width:0}
        .quick-text h3{margin:0 0 3px;font-size:.88rem;font-weight:800;color:var(--text-white)}
        .quick-text p{margin:0;font-size:.72rem;color:var(--text-gray);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .quick-arrow{color:var(--text-gray);font-size:1.1rem!important;transition:.3s;opacity:0}
        .quick-card:hover .quick-arrow{color:var(--accent-text);opacity:1;transform:translateX(3px)}

        /* TEMA SECTION */
        .temas-section{background:var(--bg-card);border:1px solid var(--border-color);border-radius:18px;padding:24px;margin-bottom:20px}
        .temas-section-title{font-size:.7rem;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:var(--text-gray);margin:0 0 16px;display:flex;align-items:center;gap:8px}
        .temas-section-title .material-icons-round{font-size:1rem;color:var(--accent-text)}

        /* TEMA GRID */
        .temas-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:18px}
        /* ESTILO DEFINITIVO PARA EL GIF ANIMADO */
        .gif-greeting {
            width: 50px;
            height: 50px;
            flex-shrink: 0;
            margin-left: 10px;
            filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));
            object-fit: contain;
        }
        /* TEMA CARD */
        .tema-card{border:2px solid var(--border-color);border-radius:16px;overflow:hidden;cursor:pointer;transition:all .3s cubic-bezier(.16,1,.3,1);background:var(--bg-dark); display:flex; flex-direction:column;}
        .tema-card:hover{transform:translateY(-4px);border-color:var(--accent);box-shadow:0 8px 24px var(--accent-glow)}
        .tema-card--active{border-color:var(--accent)!important;box-shadow:0 0 20px var(--accent-glow)}
        .tema-card-gradient{height:60px;width:100%;transition:height .3s}
        .tema-card:hover .tema-card-gradient{height:68px}
        .tema-card-info{display:flex;align-items:center;gap:8px;padding:12px 14px 6px}
        .tema-emoji{font-size:1.2rem;flex-shrink:0}
        .tema-nombre{flex:1;font-weight:800;font-size:.82rem;color:var(--text-white)}
        .tema-check{font-size:1rem!important;color:var(--accent-text);opacity:0;transition:.2s;flex-shrink:0}
        .tema-card--active .tema-check{opacity:1}

        /* Default Dots */
        .tema-dots{display:flex;gap:6px;padding:8px 14px 14px;justify-content:center}
        .tema-dot{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.15);transition:.2s;box-shadow:0 2px 4px rgba(0,0,0,0.2);}
        .tema-card:hover .tema-dot{transform:scale(1.15)}
        body:not(.dark-mode) .tema-dot{border-color:rgba(0,0,0,.08)}

        /* UX Custom Pickers */
        .tema-custom-pickers{display:flex;flex-direction:column;gap:10px;padding:5px 14px 14px;align-items:center;margin-top:auto;}
        .custom-mode-selector{display:flex; align-items:center; background:rgba(0,0,0,0.05); border-radius:50px; padding:3px; border:1px solid var(--border-color);}
        body.dark-mode .custom-mode-selector{background:rgba(255,255,255,0.03);}
        .mode-btn{background:transparent; border:none; color:var(--text-gray); font-weight:800; font-size:0.7rem; width:22px; height:22px; border-radius:50%; cursor:pointer; transition:0.2s; display:flex; align-items:center; justify-content:center;}
        .mode-btn.active{background:var(--accent); color:#fff; box-shadow:0 2px 5px var(--accent-glow);}
        .mode-btn:hover:not(.active){color:var(--text-white);}
        
        .custom-color-inputs{display:flex; gap:8px; justify-content:center; align-items:center;}
        .custom-color-inputs input[type=color]{width:32px;height:32px;border:2px solid var(--border-color);border-radius:50%;cursor:pointer;padding:0;background:none;transition:.2s; overflow:hidden;}
        .custom-color-inputs input[type=color]::-webkit-color-swatch-wrapper {padding: 0;}
        .custom-color-inputs input[type=color]::-webkit-color-swatch {border: none; border-radius:50%;}
        .custom-color-inputs input[type=color]:hover{border-color:var(--accent);transform:scale(1.15); box-shadow:0 4px 10px var(--accent-glow);}

        /* Preview row */
        .tema-preview-row{display:flex;align-items:center;gap:18px;background:var(--bg-dark);border:1px solid var(--border-color);border-radius:14px;padding:16px 20px}
        .tema-preview-orb{width:48px;height:48px;border-radius:50%;flex-shrink:0;box-shadow:0 4px 20px var(--accent-glow);transition:background .4s}
        .tema-preview-text{flex:1;display:flex;flex-direction:column;gap:2px}
        .tprev-label{font-size:.78rem;font-weight:800;color:var(--text-white)}
        .tprev-desc{font-size:.68rem;color:var(--text-gray)}
        .tprev-btn{transition:.3s!important}
        .tprev-btn:hover{filter:brightness(1.15);transform:translateY(-1px)}
        /* ===== FOOTER PREMIUM ===== */
        .inicio-footer-premium {
            margin-top: 30px;
            padding-top: 25px;
            border-top: 1px dashed var(--border-color);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
            text-align: center;
        }
        .footer-content {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
            font-size: 0.68rem;
            color: var(--text-gray);
            letter-spacing: 1.5px;
            text-transform: uppercase;
        }
        .footer-brand-name {
            background: var(--accent-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 900;
            letter-spacing: 2.5px;
            font-size: 0.75rem;
        }
        .footer-dot {
            width: 4px; height: 4px;
            background: var(--accent);
            border-radius: 50%;
            opacity: 0.6;
        }
        .footer-tech-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border-color);
            padding: 5px 12px;
            border-radius: 50px;
            font-size: 0.55rem;
            font-weight: 800;
            color: var(--text-gray);
            letter-spacing: 1.5px;
            text-transform: uppercase;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        body.dark-mode .footer-tech-badge { background: rgba(0, 0, 0, 0.3); }
        .footer-tech-badge .material-icons-round {
            font-size: 0.75rem;
            color: var(--success); /* El escudito se verá verde, indicando seguridad */
        }
        /* RESPONSIVE */
        @media(max-width:900px){.inicio-quick-actions{grid-template-columns:1fr}}
        @media(max-width:768px){
            .inicio-dashboard-hero{flex-direction:column;align-items:stretch;padding:28px 24px;gap:20px}
            .dashboard-balance-card{flex-direction:column;align-items:stretch;text-align:center;gap:14px}
            .btn-recarga-quick{justify-content:center}
            .temas-grid{grid-template-columns:1fr}
            .tema-preview-row{flex-direction:column;text-align:center}
        }
    `;
    document.head.appendChild(s);
})();