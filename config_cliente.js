/* ==========================================
   ARCHIVO: config_cliente.js
   Variables globales para personalizar la app
========================================== */
const NOMBRE_NEGOCIO = "JEICOSTREAMING"; 
const API_BASE_URL_CLIENTE = "https://api-ventas-zzd6.onrender.com";

// ==========================================
// ENLACES DE GOOGLE APPS SCRIPT (Microservicios)
// ==========================================

// 1. MAESTRO (Autenticación y Auditoría principal)
const GS_MAESTRO = "https://script.google.com/macros/s/AKfycbyZu-05L75tVwAvJjN7gQ7JQZ7EyxgEUhT723Jd9tXHjdAvZaVXGE6AsENiwyyQX_ukwQ/exec";

// 2. OBREROS (Array de workers para lectura de correos)
const GS_OBREROS = [
    "https://script.google.com/macros/s/AKfycbxRf-m0Z3xjDwRrps5Ia3zdGZtWKioxPj3h3nrexlCzOawt7fzdFgeC_xeqj-zsCJzCrA/exec",
    "https://script.google.com/macros/s/AKfycbyHVbLbV2jhNYPDyxjmp9yIKO9HWAl3IxvO1qAuvMRlVZdFUCGD88U6OsJw8mnpSS3X/exec",
    "https://script.google.com/macros/s/AKfycbyD_7GCUkn2t5O7kl95mU7riGMOiy0hNJtPduv6Sf_37mxfSm50OnMn4aRWlsl7wN7e/exec",
    "https://script.google.com/macros/s/AKfycbxUuHwtfFTW2bnOUBHkw3TkVVoQi9hH4Kk_y96T6XIC6VMwl9qeZmZZckmoySgZnXil/exec",
    "https://script.google.com/macros/s/AKfycbw-V7SRUufYl5hkAWcLV8ajQbCa0vzTD3iwklRas2_ddY4YAzzVAE59XgdeVmLmUrBRDQ/exec"
];

// 3. RECARGAS (Módulo de billetera y saldos)
const GS_RECARGA = "https://script.google.com/macros/s/AKfycbwnMW1rwkNBVT_dn83D6QaSAfy3FEcHW_LUmFMIYmakptyAO8osELRvgRqxRopMdGe6/exec";

// 4. CÓDIGO / COMPRAS (Script para manejo de pines o compras de la tienda)
const GS_CODIGO = "https://script.google.com/macros/s/AKfycbxLaIGGpcQN1oFoyo_PkUp9BZYU4tMGGh-Qaia_s7TtUMRR1R7kLbII8vWsLuah_xfj/exec";
