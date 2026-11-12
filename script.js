"use strict";

/**
 * QUORATEC SECURITY & CHECKOUT ENGINE v2.1
 * Protección anti-manipulación de enlaces de pago, validación de dominio y sanitización Anti-XSS
 */

// 1. Catálogo inmutable congelado en memoria (Object.freeze)
const CATALOGO_PLANES = Object.freeze({
    personal: Object.freeze({
        id: "personal",
        nombre: "Licencia Anual Personal Pro",
        precio: "39.00",
        urlPayphone: "https://ppls.me/EL3ETzqgERrFbxp12ysVA"
    }),
    contador: Object.freeze({
        id: "contador",
        nombre: "Licencia Anual Contador Master",
        precio: "89.00",
        urlPayphone: "https://ppls.me/nCkv1fVRqiAqs1c9aybBw"
    }),
    empresarial: Object.freeze({
        id: "empresarial",
        nombre: "Licencia Anual Empresarial",
        precio: "169.00",
        urlPayphone: "https://ppls.me/73i5byfZ25yoQj5nOybw"
    }),
    vitalicio: Object.freeze({
        id: "vitalicio",
        nombre: "Licencia Vitalicia Corporativa",
        precio: "299.00",
        urlPayphone: "https://ppls.me/3GMPcKPBk3TjHOfTyH16Q"
    })
});

// 2. Canales Oficiales de Contacto Quoratec (Número secundario 0996459771)
const CANALES_OFICIALES = Object.freeze({
    whatsappNumero: "593996459771",
    correoSoporte: "soporte@quoratec.com",
    dominiosPagoPermitidos: Object.freeze(["ppls.me", "payphone.app"])
});

let planSeleccionadoActual = "empresarial";

// 3. Sanitizadores Anti-XSS para entradas de usuario y URL
function limpiarHWID(valor) {
    if (typeof valor !== "string") return "";
    return valor.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 35);
}

function limpiarEmail(valor) {
    if (typeof valor !== "string") return "";
    return valor.replace(/[^a-zA-Z0-9@._\-+]/g, "").trim().slice(0, 80);
}

// 4. Verificación estricta de URL antes de permitir la navegación al cobro
function esUrlSeguraPayphone(urlStr) {
    try {
        const u = new URL(urlStr);
        return u.protocol === "https:" && CANALES_OFICIALES.dominiosPagoPermitidos.includes(u.hostname);
    } catch {
        return false;
    }
}

// 5. Documentación Legal Inmutable
const DOCUMENTOS_LEGALES = Object.freeze({
    terminos: Object.freeze({
        titulo: "Términos y Condiciones de Servicio",
        bloques: [
            { sub: "1. Naturaleza del Software", txt: "TributaFlow Pro v2.1.0 es una solución desarrollada por Quoratec Software Solutions para la descarga masiva, clasificación y auditoría de comprobantes electrónicos del SRI Ecuador." },
            { sub: "2. Responsabilidad Tributaria", txt: "La revisión final, cuadre contable y presentación oportuna de declaraciones (Formulario 104, ATS) ante el SRI corresponde al contribuyente o contador responsable." },
            { sub: "3. Licenciamiento HWID", txt: "Cada licencia está vinculada criptográficamente al identificador de hardware (HWID) del equipo registrado mediante firma RSA-2048." }
        ]
    }),
    privacidad: Object.freeze({
        titulo: "Privacidad Zero-Knowledge y Datos SRI",
        bloques: [
            { sub: "1. Almacenamiento 100% Local", txt: "Ninguna factura XML, credencial del SRI ni base de datos SQLite se sube a servidores externos. Todo reside cifrado en tu propio disco duro." },
            { sub: "2. Cero Telemetría", txt: "Quoratec no recolecta información financiera ni comercial de tus clientes." }
        ]
    }),
    licenciamiento: Object.freeze({
        titulo: "Política de Licencias y Soporte",
        bloques: [
            { sub: "1. Evaluación Gratuita", txt: "Dispones de 15 días de prueba funcional completa antes de adquirir una licencia." },
            { sub: "2. Activación Inmediata", txt: "Una vez confirmado el pago en Payphone, se genera el certificado comercial (.lic) para tu equipo y se envía a tu correo o WhatsApp." }
        ]
    })
});

// 6. Inicialización Segura del DOM
document.addEventListener("DOMContentLoaded", () => {
    // Configurar botón flotante de soporte con el número secundario
    const btnFlotante = document.getElementById("btnFlotanteSoporte");
    if (btnFlotante) {
        const saludo = encodeURIComponent("Hola Quoratec, tengo una consulta sobre TributaFlow Pro.");
        btnFlotante.href = `https://wa.me/${CANALES_OFICIALES.whatsappNumero}?text=${saludo}`;
    }

    // Detectar parámetros si el cliente llega desde el programa de escritorio (?device_id=...)
    const params = new URLSearchParams(window.location.search);
    const deviceId = limpiarHWID(params.get("device_id") || params.get("hwid") || "");

    if (deviceId) {
        const inputHwid = document.getElementById("hwidModal");
        if (inputHwid) inputHwid.value = deviceId;
    }

    // Asignar eventos de clic en tarjetas y botones de planes
    document.querySelectorAll(".plan-card, .btn-plan").forEach((elemento) => {
        elemento.addEventListener("click", (e) => {
            e.stopPropagation();
            const planId = elemento.getAttribute("data-plan-id");
            if (planId && CATALOGO_PLANES[planId]) {
                abrirCheckout(planId);
            }
        });
    });

    // Actualizar enlaces dinámicos cuando el usuario escribe su HWID o correo
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

    // Modales Legales
    document.querySelectorAll(".legal-trigger").forEach((btn) => {
        btn.addEventListener("click", () => {
            mostrarLegal(btn.getAttribute("data-legal"));
        });
    });

    // Cierre de modales
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

// 7. Apertura segura de Checkout
function abrirCheckout(planId) {
    const plan = CATALOGO_PLANES[planId];
    if (!plan || !esUrlSeguraPayphone(plan.urlPayphone)) return;

    planSeleccionadoActual = planId;

    document.getElementById("modalPlanTitulo").textContent = plan.nombre;
    document.getElementById("modalPlanPrecio").textContent = `$${plan.precio} USD`;
    document.getElementById("btnPagarPayphone").href = plan.urlPayphone;

    actualizarCanalesConfirmacion();
    document.getElementById("modalCheckout").style.display = "flex";
}

// 8. Generación de enlaces de confirmación (WhatsApp + Correo Electrónico)
function actualizarCanalesConfirmacion() {
    const plan = CATALOGO_PLANES[planSeleccionadoActual];
    if (!plan) return;

    const hwid = limpiarHWID(document.getElementById("hwidModal").value) || "PENDIENTE_ENVIAR";
    const emailCliente = limpiarEmail(document.getElementById("emailModal").value) || "NO_INGRESADO";

    // A. Enlace para WhatsApp (0996459771)
    const msgWp = `Hola Quoratec, realicé el pago en Payphone para TributaFlow Pro:%0A%0A` +
        `• *Plan:* ${encodeURIComponent(plan.nombre)} ($${plan.precio} USD)%0A` +
        `• *HWID:* ${encodeURIComponent(hwid)}%0A` +
        `• *Correo entrega:* ${encodeURIComponent(emailCliente)}%0A%0A` +
        `Adjunto mi comprobante para la emisión de mi licencia RSA-2048.`;

    document.getElementById("btnConfirmarWpModal").href = `https://wa.me/${CANALES_OFICIALES.whatsappNumero}?text=${msgWp}`;

    // B. Enlace para Correo Electrónico
    const asuntoEmail = encodeURIComponent(`Activación Licencia TributaFlow Pro - ${plan.nombre}`);
    const cuerpoEmail = encodeURIComponent(
        `Hola equipo de Quoratec,\n\n` +
        `He realizado el pago correspondiente a:\n` +
        `- Plan: ${plan.nombre} ($${plan.precio} USD)\n` +
        `- HWID de mi equipo: ${hwid}\n` +
        `- Correo para recibir la llave (.lic): ${emailCliente}\n\n` +
        `Adjunto mi comprobante de pago de Payphone.\n\nSaludos.`
    );

    document.getElementById("btnConfirmarEmailModal").href = `mailto:${CANALES_OFICIALES.correoSoporte}?subject=${asuntoEmail}&body=${cuerpoEmail}`;
}

// 9. Renderizado seguro sin innerHTML
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
