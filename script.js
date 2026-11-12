"use strict";
/**
 * QUORATEC SECURITY & CHECKOUT ENGINE v2.2.0 Enterprise
 * Protección anti-manipulación de enlaces de pago, validación de dominio,
 * autodetección de instaladores nativos v2.2.0 y sanitización Anti-XSS
 */

// 1. Catálogo inmutable de suscripciones anuales congelado en memoria
const CATALOGO_PLANES = Object.freeze({
    personal: Object.freeze({
        id: "personal",
        nombre: "Licencia Anual Personal Pro",
        precio: "39.00",
        etiquetaPrecio: "$39.00 USD / año",
        esCorporativo: false,
        urlPayphone: "https://ppls.me/EL3ETzqgERrFbxp12ysVA"
    }),
    contador: Object.freeze({
        id: "contador",
        nombre: "Licencia Anual Contador Master",
        precio: "89.00",
        etiquetaPrecio: "$89.00 USD / año",
        esCorporativo: false,
        urlPayphone: "https://ppls.me/nCkv1fVRqiAqs1c9aybBw"
    }),
    estudio: Object.freeze({
        id: "estudio",
        nombre: "Licencia Anual Estudio Contable Pro",
        precio: "169.00",
        etiquetaPrecio: "$169.00 USD / año",
        esCorporativo: false,
        urlPayphone: "https://ppls.me/73i5byfZ25yoQj5nOybw"
    }),
    enterprise: Object.freeze({
        id: "enterprise",
        nombre: "Licencia Anual Enterprise Server (5+ Estaciones)",
        precio: "1,490.00",
        etiquetaPrecio: "Desde $1,490.00 USD / año",
        esCorporativo: true,
        urlPayphone: ""
    })
});

// 2. Instaladores Oficiales v2.2.0 Enterprise (Repositorio Público)
const INSTALADORES_OFICIALES = Object.freeze({
    windows: Object.freeze({
        eyebrow: "INSTALADOR OFICIAL WINDOWS 10 / 11 (64-BIT)",
        archivo: "TributaFlow_Pro_v2.2.0_Enterprise_Windows_x64_Setup.exe",
        tamano: "80.0 MB",
        boton: "⬇ Descargar para Windows (.exe)",
        url: "https://github.com/FaustoOrellana/tributaflow-portal/releases/download/v2.2.0/TributaFlow_Pro_v2.2.0_Enterprise_Windows_x64_Setup.exe"
    }),
    linux: Object.freeze({
        eyebrow: "PAQUETE OFICIAL LINUX (UBUNTU / DEBIAN / MINT)",
        archivo: "TributaFlow_Pro_v2.2.0_Linux_amd64.deb",
        tamano: "109 MB",
        boton: "⬇ Descargar para Linux (.deb)",
        url: "https://github.com/FaustoOrellana/tributaflow-portal/releases/download/v2.2.0/TributaFlow_Pro_v2.2.0_Linux_amd64.deb"
    }),
    macos: Object.freeze({
        eyebrow: "INSTALADOR OFICIAL macOS (APPLE SILICON / INTEL)",
        archivo: "TributaFlow_Pro_v2.2.0_macOS.dmg",
        tamano: "87.4 MB",
        boton: "⬇ Descargar para macOS (.dmg)",
        url: "https://github.com/FaustoOrellana/tributaflow-portal/releases/download/v2.2.0/TributaFlow_Pro_v2.2.0_macOS.dmg"
    })
});

// 3. Canales Oficiales de Contacto Quoratec
const CANALES_OFICIALES = Object.freeze({
    whatsappNumero: "593996459771",
    correoSoporte: "soporte@quoratec.com",
    dominiosPagoPermitidos: Object.freeze(["ppls.me", "payphone.app"])
});

let planSeleccionadoActual = "estudio";

// 4. Detección de Sistema Operativo del Visitante
function detectarSistemaOperativo() {
    const ua = (navigator.userAgent || "").toLowerCase();
    const platform = (navigator.platform || "").toLowerCase();

    if (platform.includes("mac") || ua.includes("macintosh") || ua.includes("mac os")) {
        return "macos";
    }
    if ((platform.includes("linux") || ua.includes("linux")) && !ua.includes("android")) {
        return "linux";
    }
    return "windows";
}

function configurarDescargasMultiplataforma() {
    const osDetectado = detectarSistemaOperativo();
    const info = INSTALADORES_OFICIALES[osDetectado] || INSTALADORES_OFICIALES.windows;

    const eyebrowEl = document.getElementById("dlOsEyebrow");
    const fileNameEl = document.getElementById("dlFileName");
    const fileSizeEl = document.getElementById("dlFileSize");
    const btnPrincipal = document.getElementById("btnDescargaPrincipal");

    if (eyebrowEl) eyebrowEl.textContent = info.eyebrow;
    if (fileNameEl) fileNameEl.textContent = info.archivo;
    if (fileSizeEl) fileSizeEl.textContent = info.tamano;
    if (btnPrincipal) {
        btnPrincipal.textContent = info.boton;
        btnPrincipal.href = info.url;
    }

    document.querySelectorAll(".os-card").forEach((card) => {
        if (card.getAttribute("data-os") === osDetectado) {
            card.classList.add("os-card-active");
        }
    });
}

// 5. Sanitizadores Anti-XSS para entradas de usuario y URL
function limpiarHWID(valor) {
    if (typeof valor !== "string") return "";
    return valor.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 35);
}

function limpiarEmail(valor) {
    if (typeof valor !== "string") return "";
    return valor.replace(/[^a-zA-Z0-9@._\-+]/g, "").trim().slice(0, 80);
}

// 6. Verificación estricta de URL antes de permitir la navegación al cobro
function esUrlSeguraPayphone(urlStr) {
    try {
        const u = new URL(urlStr);
        return u.protocol === "https:" && CANALES_OFICIALES.dominiosPagoPermitidos.includes(u.hostname);
    } catch {
        return false;
    }
}

// 7. Documentación Legal Inmutable
const DOCUMENTOS_LEGALES = Object.freeze({
    terminos: Object.freeze({
        titulo: "Términos y Condiciones de Servicio",
        bloques: [
            { sub: "1. Naturaleza del Software", txt: "TributaFlow Pro v2.2.0 Enterprise es una suite desarrollada por Quoratec Software Solutions para la sincronización masiva, validación XSD y auditoría de comprobantes electrónicos del SRI Ecuador." },
            { sub: "2. Responsabilidad Tributaria", txt: "La revisión contable final y presentación oportuna de declaraciones (Formulario 104, ATS) ante el Servicio de Rentas Internas corresponde exclusivamente al contribuyente o contador responsable." },
            { sub: "3. Licenciamiento Criptográfico HWID", txt: "Cada licencia anual se vincula mediante firma digital RSA-2048 al identificador de hardware (HWID) del equipo autorizado." }
        ]
    }),
    privacidad: Object.freeze({
        titulo: "Arquitectura Zero-Knowledge y Privacidad SRI",
        bloques: [
            { sub: "1. Bóveda Multi-Tenant 100% Local", txt: "Ninguna factura XML, credencial del SRI ni base de datos SQLite se transmite a servidores de Quoratec. Toda la contabilidad permanece aislada y cifrada en el almacenamiento local del cliente." },
            { sub: "2. Cero Telemetría Comercial", txt: "Quoratec no recopila, analiza ni comercializa información financiera o tributaria de tus contribuyentes." }
        ]
    }),
    licenciamiento: Object.freeze({
        titulo: "Política de Suscripciones Anuales y Soporte",
        bloques: [
            { sub: "1. Período de Evaluación", txt: "TributaFlow Pro ofrece 15 días de prueba funcional completa sin costo antes de requerir una suscripción anual." },
            { sub: "2. Vigencia y Actualizaciones Normativas", txt: "Todas las licencias tienen vigencia de 365 días calendario a partir de su emisión e incluyen actualizaciones ante cambios de esquemas XML/XSD del SRI." },
            { sub: "3. Activación Inmediata", txt: "Una vez verificado el pago vía Payphone o transferencia corporativa, el certificado comercial (.lic) se genera y entrega por correo electrónico o WhatsApp." }
        ]
    })
});

// 8. Inicialización Segura del DOM
document.addEventListener("DOMContentLoaded", () => {
    configurarDescargasMultiplataforma();

    const btnPrincipal = document.getElementById("btnDescargaPrincipal");
    if (btnPrincipal) {
        btnPrincipal.addEventListener("click", () => {
            const textoOriginal = btnPrincipal.textContent;
            btnPrincipal.textContent = "⏳ Iniciando descarga segura...";
            setTimeout(() => {
                btnPrincipal.textContent = textoOriginal;
            }, 3000);
        });
    }

    const btnFlotante = document.getElementById("btnFlotanteSoporte");
    if (btnFlotante) {
        const saludo = encodeURIComponent("Hola Quoratec, necesito asesoría técnica sobre TributaFlow Pro v2.2.0 Enterprise.");
        btnFlotante.href = `https://wa.me/${CANALES_OFICIALES.whatsappNumero}?text=${saludo}`;
    }

    // Compatibilidad con parámetros enviados desde la aplicación de escritorio (?device_id=...&plan=...)
    const params = new URLSearchParams(window.location.search);
    const deviceId = limpiarHWID(params.get("device_id") || params.get("hwid") || "");
    const planParam = (params.get("plan") || "").toLowerCase().trim();

    if (planParam) {
        // Alias de compatibilidad si el cliente llega con ?plan=empresarial desde versiones previas
        const mapaAlias = { empresarial: "estudio", vitalicio: "enterprise" };
        const planResuelto = CATALOGO_PLANES[planParam] ? planParam : mapaAlias[planParam];
        if (planResuelto) {
            planSeleccionadoActual = planResuelto;
        }
    }

    if (deviceId) {
        const inputHwid = document.getElementById("hwidModal");
        if (inputHwid) {
            inputHwid.value = deviceId;
            actualizarCanalesConfirmacion();
        }
    }

    // Eventos en tarjetas y botones de planes
    document.querySelectorAll(".plan-card, .btn-plan").forEach((elemento) => {
        elemento.addEventListener("click", (e) => {
            e.stopPropagation();
            const planId = elemento.getAttribute("data-plan-id");
            if (planId && CATALOGO_PLANES[planId]) {
                abrirCheckout(planId);
            }
        });
    });

    const hwidInput = document.getElementById("hwidModal");
    if (hwidInput) {
        hwidInput.addEventListener("input", (e) => {
            e.target.value = limpiarHWID(e.target.value);
            actualizarCanalesConfirmacion();
        });
    }

    const emailInput = document.getElementById("emailModal");
    if (emailInput) {
        emailInput.addEventListener("input", (e) => {
            e.target.value = limpiarEmail(e.target.value);
            actualizarCanalesConfirmacion();
        });
    }

    document.querySelectorAll(".legal-trigger").forEach((btn) => {
        btn.addEventListener("click", () => {
            mostrarLegal(btn.getAttribute("data-legal"));
        });
    });

    document.getElementById("btnCerrarCheckout")?.addEventListener("click", () => {
        document.getElementById("modalCheckout").style.display = "none";
    });

    document.getElementById("btnCerrarLegal")?.addEventListener("click", () => {
        document.getElementById("modalLegal").style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === document.getElementById("modalCheckout")) {
            document.getElementById("modalCheckout").style.display = "none";
        }
        if (e.target === document.getElementById("modalLegal")) {
            document.getElementById("modalLegal").style.display = "none";
        }
    });
});

// 9. Apertura segura de Checkout (Soporta pasarela Payphone y flujo corporativo Enterprise)
function abrirCheckout(planId) {
    const plan = CATALOGO_PLANES[planId];
    if (!plan) return;

    if (!plan.esCorporativo && !esUrlSeguraPayphone(plan.urlPayphone)) return;

    planSeleccionadoActual = planId;

    document.getElementById("modalPlanTitulo").textContent = plan.nombre;
    document.getElementById("modalPlanPrecio").textContent = plan.etiquetaPrecio;

    const btnPayphone = document.getElementById("btnPagarPayphone");
    const badgeModal = document.getElementById("modalBadgeTexto");
    const postInstruccion = document.getElementById("postPaymentInstruccion");

    if (plan.esCorporativo) {
        if (btnPayphone) btnPayphone.style.display = "none";
        if (badgeModal) badgeModal.textContent = "DESPLIEGUE CORPORATIVO MULTI-ESTACIÓN";
        if (postInstruccion) {
            postInstruccion.innerHTML = "<strong>Solicita tu cotización y despliegue Enterprise</strong> indicando el número de estaciones y correo corporativo:";
        }
    } else {
        if (btnPayphone) {
            btnPayphone.style.display = "flex";
            btnPayphone.href = plan.urlPayphone;
        }
        if (badgeModal) badgeModal.textContent = "PASARELA OFICIAL VERIFICADA";
        if (postInstruccion) {
            postInstruccion.innerHTML = "<strong>2. Una vez completado el pago</strong>, envía tu comprobante para emitir tu llave criptográfica RSA-2048 por tu canal preferido:";
        }
    }

    actualizarCanalesConfirmacion();
    document.getElementById("modalCheckout").style.display = "flex";
}

// 10. Generación de enlaces de confirmación (WhatsApp + Correo Electrónico)
function actualizarCanalesConfirmacion() {
    const plan = CATALOGO_PLANES[planSeleccionadoActual];
    if (!plan) return;

    const hwid = limpiarHWID(document.getElementById("hwidModal").value) || "PENDIENTE_ENVIAR";
    const emailCliente = limpiarEmail(document.getElementById("emailModal").value) || "NO_INGRESADO";

    const encabezadoMsg = plan.esCorporativo
        ? `Hola Quoratec, solicito información y activación corporativa para TributaFlow Pro v2.2.0 Enterprise:%0A%0A`
        : `Hola Quoratec, realicé el pago en Payphone para TributaFlow Pro v2.2.0:%0A%0A`;

    const cierreMsg = plan.esCorporativo
        ? `Quedo atento a la propuesta comercial y emisión de licencias para nuestras estaciones.`
        : `Adjunto mi comprobante para la emisión de mi certificado anual RSA-2048.`;

    const msgWp = encabezadoMsg +
        `• *Plan:* ${encodeURIComponent(plan.nombre)} (${encodeURIComponent(plan.etiquetaPrecio)})%0A` +
        `• *HWID Principal:* ${encodeURIComponent(hwid)}%0A` +
        `• *Correo entrega:* ${encodeURIComponent(emailCliente)}%0A%0A` +
        cierreMsg;

    document.getElementById("btnConfirmarWpModal").href = `https://wa.me/${CANALES_OFICIALES.whatsappNumero}?text=${msgWp}`;

    const asuntoEmail = encodeURIComponent(`${plan.esCorporativo ? "Solicitud Enterprise" : "Activación Licencia Anual"} TributaFlow Pro v2.2.0 - ${plan.nombre}`);
    const cuerpoEmail = encodeURIComponent(
        `Hola equipo de Quoratec Software Solutions,\n\n` +
        `Detalle de solicitud para TributaFlow Pro v2.2.0 Enterprise:\n` +
        `- Plan: ${plan.nombre} (${plan.etiquetaPrecio})\n` +
        `- HWID de equipo: ${hwid}\n` +
        `- Correo para entrega de certificados (.lic): ${emailCliente}\n\n` +
        `${plan.esCorporativo ? "Por favor contáctennos para coordinar el despliegue multi-estación." : "Adjunto el comprobante de pago de Payphone."}\n\nSaludos.`
    );

    document.getElementById("btnConfirmarEmailModal").href = `mailto:${CANALES_OFICIALES.correoSoporte}?subject=${asuntoEmail}&body=${cuerpoEmail}`;
}

// 11. Renderizado seguro sin innerHTML para documentos legales
function mostrarLegal(tipo) {
    const doc = DOCUMENTOS_LEGALES[tipo];
    if (!doc) return;

    document.getElementById("modalLegalTitulo").textContent = doc.titulo;
    const cuerpo = document.getElementById("modalLegalCuerpo");
    cuerpo.textContent = "";

    doc.bloques.forEach((b) => {
        const h4 = document.createElement("h4");
        h4.textContent = b.sub;
        const p = document.createElement("p");
        p.textContent = b.txt;
        cuerpo.appendChild(h4);
        cuerpo.appendChild(p);
    });

    document.getElementById("modalLegal").style.display = "flex";
}