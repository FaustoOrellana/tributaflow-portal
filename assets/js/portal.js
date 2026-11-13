"use strict";
/**
 * TributaFlow Pro v2.3.0 Enterprise — Motor Comercial y Navegación del Portal
 * Arquitectura multipágina, pagos PayPhone + Deuna QR + Transferencia Directa,
 * modales independientes por SO, cero datos privados y CSP estricta.
 */

function congelarProfundo(objeto) {
    if (!objeto || typeof objeto !== "object") return objeto;
    Object.getOwnPropertyNames(objeto).forEach((prop) => {
        const valor = objeto[prop];
        if (valor && typeof valor === "object") {
            congelarProfundo(valor);
        }
    });
    return Object.freeze(objeto);
}

const CONFIG_COMERCIAL = congelarProfundo({
    VERSION: "2.3.0",
    PAYPHONE_LINKS: {
        PERSONAL_PRO: "https://ppls.me/5S1Y89pBi1vYHBTEgEzRA",
        CONTADOR_MASTER: "https://ppls.me/dxope7VBAjK5LR1mO4UitA",
        ESTUDIO_PRO: "https://ppls.me/60Bdw7lcRhMfvjqwA5cFdg",
        ENTERPRISE_TEAM: null,
        ENTERPRISE_CORP: null,
    },
    PAYPHONE_URL_PREFIX: "https://ppls.me/",
    QR_DEUNA_SRC: "assets/qr-deuna.png",
    QR_DEUNA_SUBPAGE_SRC: "../assets/qr-deuna.png",
    TITULAR_RECAUDO: "Fausto Orellana — Recaudo Oficial TributaFlow Pro",
    TITULAR_NOTA_BANCO: "Al escanear el QR o transferir en Banco Pichincha, verifica que el titular registrado sea Fausto Andrés Orellana Jaén (Recaudo Oficial TributaFlow Pro).",
    BANCO_RECAUDO: "Banco Pichincha",
    TIPO_CUENTA_RECAUDO: "Recaudo Empresarial / Deuna! Directo",
    NUMERO_CUENTA_RECAUDO: "Solicitar número vigente por WhatsApp Oficial (0996459771)",
    WHATSAPP_NUMERO: "593996459771",
    WHATSAPP_LOCAL: "0996459771",
    WHATSAPP_URL_PREFIX: "https://wa.me/593996459771",
    CORREO_SOPORTE: "soportetributaflow@quoratec.com",
    MAILTO_URL_PREFIX: "mailto:soportetributaflow@quoratec.com",
    ASUNTO_SOPORTE: "Consulta Soporte Técnico — TributaFlow Pro",
    DOMINIOS_PAYPHONE: ["ppls.me"],
    PAYPHONE_BADGES: "Visa · Mastercard · Diners · Discover · Alia",
    PAYPHONE_GARANTIA: "🛡️ Pago protegido con verificación 3D Secure Ecuador",
    PRECIO_SEAT_EXTRA_USD: 150,
    DEMO_RUC_PRINCIPAL: "1790012345001",
    DEMO_RAZON_PRINCIPAL: "EMPRESA DEMOSTRACIÓN S.A.",
    DEMO_RUC_SECUNDARIO: "0999999999001",
});

const PLANES_V230 = Object.freeze({
    PERSONAL_PRO: Object.freeze({
        id: "PERSONAL_PRO",
        nombre: "Personal Pro",
        nombreComercial: "TF Personal Pro",
        precioRegularUsd: 69,
        precioUsd: 59,
        rucsLabel: "1 RUC contribuyente",
        estacionesBase: 1,
        estacionesLabel: "1 PC (HWID vinculado)",
        esEnterprise: false,
        permiteExtraSeats: false,
    }),
    CONTADOR_MASTER: Object.freeze({
        id: "CONTADOR_MASTER",
        nombre: "Contador Master",
        nombreComercial: "TF Contador 15",
        precioRegularUsd: 169,
        precioUsd: 139,
        rucsLabel: "Hasta 15 RUCs en bóveda",
        estacionesBase: 1,
        estacionesLabel: "1 PC (HWID vinculado)",
        esEnterprise: false,
        permiteExtraSeats: false,
    }),
    ESTUDIO_PRO: Object.freeze({
        id: "ESTUDIO_PRO",
        nombre: "Estudio Contable Pro / PyME",
        nombreComercial: "TF Estudio Pro",
        precioRegularUsd: 399,
        precioUsd: 299,
        rucsLabel: "Hasta 50 RUCs en bóveda",
        estacionesBase: 2,
        estacionesLabel: "Hasta 2 PCs",
        esEnterprise: false,
        permiteExtraSeats: false,
    }),
    ENTERPRISE_TEAM: Object.freeze({
        id: "ENTERPRISE_TEAM",
        nombre: "Enterprise Team (Red LAN)",
        nombreComercial: "TF Enterprise Team",
        precioRegularUsd: 1190,
        precioUsd: 890,
        rucsLabel: "RUCs Ilimitados",
        estacionesBase: 5,
        estacionesLabel: "5 Estaciones Red LAN TCP/IP",
        esEnterprise: true,
        permiteExtraSeats: false,
    }),
    ENTERPRISE_CORP: Object.freeze({
        id: "ENTERPRISE_CORP",
        nombre: "Enterprise Corporativo",
        nombreComercial: "TF Enterprise Corp",
        precioRegularUsd: 1890,
        precioUsd: 1490,
        rucsLabel: "RUCs Ilimitados + Multi-Regional",
        estacionesBase: 10,
        estacionesLabel: "10 Estaciones Base (+$150/PC extra)",
        esEnterprise: true,
        permiteExtraSeats: true,
    }),
});

const INSTALADORES_SO = congelarProfundo({
    windows: Object.freeze({
        id: "windows",
        modalId: "modalDescargaWindows",
        titulo: "Descargar para Windows 10 / 11 (64-bit)",
        badge: "INSTALADOR OFICIAL WINDOWS .EXE",
        archivo: "TributaFlow_Pro_v2.3.0_Enterprise_Windows_x64_Setup.exe",
        tamano: "~82 MB • Firma Digital Verificada",
        url: "https://github.com/FaustoOrellana/tributaflow-portal/releases/download/v2.3.0/TributaFlow_Pro_v2.3.0_Enterprise_Windows_x64_Setup.exe",
        pasos: [
            "1. Descarga el instalador ejecutable Setup.exe para Windows 10/11 (x64).",
            "2. Durante el asistente podrás elegir cuál de las 5 ediciones evaluar durante 15 días gratis sin tarjeta.",
            "3. Inicia sesión con tu clave del SRI 100% en tu equipo local y valida tu primer árbol jerárquico de bóveda.",
        ],
    }),
    linux: Object.freeze({
        id: "linux",
        modalId: "modalDescargaLinux",
        titulo: "Descargar para Linux (Ubuntu / Debian / Mint)",
        badge: "PAQUETE OFICIAL LINUX .DEB",
        archivo: "TributaFlow_Pro_v2.3.0_Linux_amd64.deb",
        tamano: "~109 MB • Arquitectura amd64",
        url: "https://github.com/FaustoOrellana/tributaflow-portal/releases/download/v2.3.0/TributaFlow_Pro_v2.3.0_Linux_amd64.deb",
        pasos: [
            "1. Descarga el paquete .deb oficial e instálalo con: sudo apt install ./TributaFlow_Pro_v2.3.0_Linux_amd64.deb",
            "2. En el primer arranque podrás elegir qué edición de TributaFlow Pro probar por 15 días sin costo.",
            "3. Disfruta de almacenamiento SQLite cifrado HWID y motor Playwright aislado localmente.",
        ],
    }),
    macos: Object.freeze({
        id: "macos",
        modalId: "modalDescargaMacos",
        titulo: "Descargar para macOS (Apple Silicon / Intel)",
        badge: "IMAGEN DE DISCO NATIVA .DMG",
        archivo: "TributaFlow_Pro_v2.3.0_macOS.dmg",
        tamano: "~88 MB • App Bundle Nativo",
        url: "https://github.com/FaustoOrellana/tributaflow-portal/releases/download/v2.3.0/TributaFlow_Pro_v2.3.0_macOS.dmg",
        pasos: [
            "1. Abre el archivo TributaFlow_Pro_v2.3.0_macOS.dmg y arrastra TributaFlow Pro a Aplicaciones.",
            "2. Al abrir por primera vez en macOS, haz clic derecho (o Control + clic) sobre TributaFlow Pro en Aplicaciones y selecciona Abrir.",
            "3. Selecciona cualquiera de las 5 ediciones disponibles para evaluación gratuita de 15 días y opera 100% offline en tu Mac.",
        ],
    }),
});

const TEXTOS_LEGALES = congelarProfundo({
    terminos: Object.freeze({
        titulo: "Términos y Condiciones — TributaFlow Pro",
        secciones: [
            {
                sub: "1. Alcance del Software",
                txt: "TributaFlow Pro v2.3.0 Enterprise es un sistema de escritorio para gestión tributaria, bóveda documental jerárquica estilo Perseo, validación ATS XSD y auditoría de comprobantes SRI Ecuador.",
            },
            {
                sub: "2. Responsabilidad Contable",
                txt: "La revisión contable final y presentación oportuna de anexos y declaraciones ante el Servicio de Rentas Internas corresponde al contribuyente o profesional contable responsable.",
            },
            {
                sub: "3. Licenciamiento Anual Vinculado",
                txt: "Cada licencia tiene vigencia anual de 365 días vinculada criptográficamente (RSA-2048) al identificador HWID de las estaciones autorizadas según el plan contratado.",
            },
        ],
    }),
    privacidad: Object.freeze({
        titulo: "Arquitectura Zero-Knowledge y Privacidad SRI",
        secciones: [
            {
                sub: "1. Bóveda Cifrada 100 % Local",
                txt: "Tus claves del SRI, facturas XML, RIDE PDF y bases de datos SQLite cifradas (PBKDF2 + AES-256-GCM + HMAC) permanecen exclusivamente en tu equipo o servidor Red LAN propio.",
            },
            {
                sub: "2. Cero Datos Personales Expuestos",
                txt: "TributaFlow Pro no transmite información tributaria ni credenciales a nubes externas para su comercialización o analítica.",
            },
        ],
    }),
    licenciamiento: Object.freeze({
        titulo: "Reglas Comerciales, Sellado Ético de RUCs y Actualizaciones",
        secciones: [
            {
                sub: "1. Evaluación Gratuita de 15 Días",
                txt: "Durante la instalación puedes elegir qué edición evaluar por 15 días calendario sin ingresar tarjeta de crédito ni registros obligatorios.",
            },
            {
                sub: "2. Política Ética de Sellado de RUCs",
                txt: "Cada RUC consumido queda sellado en el libro histórico del plan después de la primera descarga real ejecutada en el portal del SRI, evitando abusos del cupo contratado.",
            },
            {
                sub: "3. Actualizaciones SRI Incluidas",
                txt: "Durante los 365 días de vigencia anual recibes actualizaciones ante cambios en esquemas XML/XSD del ATS y portal del SRI sin recargos.",
            },
        ],
    }),
});

let estadoModalPago = {
    planId: "ESTUDIO_PRO",
    extraSeats: 0,
    hwidORef: "",
};

function obtenerPrefijoRuta() {
    return document.body?.getAttribute("data-root") || "";
}

function obtenerSrcQrDeuna() {
    const prefijo = obtenerPrefijoRuta();
    return prefijo === "../"
        ? CONFIG_COMERCIAL.QR_DEUNA_SUBPAGE_SRC
        : CONFIG_COMERCIAL.QR_DEUNA_SRC;
}

function sanitizarIdentificador(valor) {
    return String(valor || "")
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, "")
        .slice(0, 32);
}

function extraerCodigoCorto(valor) {
    const limpio = String(valor || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
    return limpio.slice(0, 8) || "WEB01";
}

function formatearUsd(monto) {
    return `$${Number(monto).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

const PAYPHONE_URLS_OFICIALES = Object.freeze(
    Object.values(CONFIG_COMERCIAL.PAYPHONE_LINKS).filter((u) => typeof u === "string" && u.length > 0)
);

function esUrlPayphoneSegura(url) {
    if (!url || typeof url !== "string") return false;
    try {
        const parsed = new URL(url);
        return (
            parsed.protocol === "https:" &&
            url.startsWith(CONFIG_COMERCIAL.PAYPHONE_URL_PREFIX) &&
            CONFIG_COMERCIAL.DOMINIOS_PAYPHONE.includes(parsed.hostname.toLowerCase()) &&
            PAYPHONE_URLS_OFICIALES.includes(url)
        );
    } catch {
        return false;
    }
}

function esUrlWhatsappSegura(url) {
    if (!url || typeof url !== "string") return false;
    const prefijo = CONFIG_COMERCIAL.WHATSAPP_URL_PREFIX;
    if (!url.startsWith(prefijo)) return false;
    const siguiente = url.charAt(prefijo.length);
    return siguiente === "" || siguiente === "?";
}

function esUrlCorreoSegura(url) {
    if (!url || typeof url !== "string") return false;
    const prefijo = CONFIG_COMERCIAL.MAILTO_URL_PREFIX;
    if (!url.startsWith(prefijo)) return false;
    const siguiente = url.charAt(prefijo.length);
    return siguiente === "" || siguiente === "?";
}

function validarDestinoSeguro(url, tipo = "auto") {
    if (tipo === "payphone") return esUrlPayphoneSegura(url);
    if (tipo === "whatsapp") return esUrlWhatsappSegura(url);
    if (tipo === "correo") return esUrlCorreoSegura(url);
    return esUrlPayphoneSegura(url) || esUrlWhatsappSegura(url) || esUrlCorreoSegura(url);
}

function asignarEnlaceSeguro(anchorEl, url, tipo) {
    if (!anchorEl) return false;
    anchorEl.setAttribute("data-tf-canal-seguro", tipo);
    if (!validarDestinoSeguro(url, tipo)) {
        anchorEl.removeAttribute("href");
        mostrarToastCopia("⛔ Canal bloqueado por verificación de integridad.");
        return false;
    }
    anchorEl.setAttribute("href", url);
    if (tipo !== "correo") {
        anchorEl.target = "_blank";
        anchorEl.rel = "noopener noreferrer";
    }
    return true;
}

function resolverPlan(planRaw) {
    const norm = String(planRaw || "").trim().toUpperCase();
    const aliases = {
        PERSONAL: "PERSONAL_PRO",
        CONTADOR: "CONTADOR_MASTER",
        ESTUDIO: "ESTUDIO_PRO",
        EMPRESARIAL: "ESTUDIO_PRO",
        ENTERPRISE: "ENTERPRISE_CORP",
        ENTERPRISE_SERVER: "ENTERPRISE_CORP",
    };
    const clave = PLANES_V230[norm] ? norm : aliases[norm];
    return PLANES_V230[clave] ? clave : "ESTUDIO_PRO";
}

function calcularResumenCheckout() {
    const plan = PLANES_V230[estadoModalPago.planId] || PLANES_V230.ESTUDIO_PRO;
    const extras = plan.permiteExtraSeats
        ? Math.max(0, Math.min(20, Number(estadoModalPago.extraSeats || 0)))
        : 0;
    const totalUsd = plan.precioUsd + extras * CONFIG_COMERCIAL.PRECIO_SEAT_EXTRA_USD;
    const estacionesTotales = plan.estacionesBase + extras;
    const hwidCorto = extraerCodigoCorto(estadoModalPago.hwidORef);
    const referencia = `TF-${plan.id}-${hwidCorto}`;
    const urlPayphone = CONFIG_COMERCIAL.PAYPHONE_LINKS[plan.id] || null;

    return {
        plan,
        extras,
        totalUsd,
        montoTexto: formatearUsd(totalUsd),
        estacionesTotales,
        referencia,
        hwidORef: estadoModalPago.hwidORef || "SIN_ESPECIFICAR",
        urlPayphone: esUrlPayphoneSegura(urlPayphone) ? urlPayphone : null,
    };
}

function mostrarToastCopia(texto) {
    let toast = document.getElementById("tfCopyToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "tfCopyToast";
        toast.className = "copy-toast";
        document.body.appendChild(toast);
    }
    toast.textContent = texto;
    toast.style.display = "block";
    clearTimeout(toast._timerId);
    toast._timerId = setTimeout(() => {
        toast.style.display = "none";
    }, 2200);
}

function copiarAlPortapapeles(valor, etiqueta) {
    const limpio = String(valor || "").trim();
    if (!limpio) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
            .writeText(limpio)
            .then(() => mostrarToastCopia(`✓ ${etiqueta} copiado: ${limpio}`))
            .catch(() => mostrarToastCopia(`${etiqueta}: ${limpio}`));
    } else {
        mostrarToastCopia(`${etiqueta}: ${limpio}`);
    }
}

function construirPlantillaComprobante(resumen, metodoPago) {
    const { plan, extras, montoTexto, estacionesTotales, referencia, hwidORef } = resumen;
    const hwidTexto =
        hwidORef && hwidORef !== "SIN_ESPECIFICAR"
            ? hwidORef
            : "[Pegar código TF-XXXXXX-...]";
    const detalleEstaciones =
        extras > 0
            ? `${estacionesTotales} PCs (${plan.estacionesBase} base + ${extras} adicionales)`
            : estacionesTotales === 1
                ? "1 PC"
                : `${estacionesTotales} PCs`;
    const asunto = `[TRIBUTAFLOW PRO] Activación Licencia Anual ${referencia} (${metodoPago})`;
    const esPayPhone = String(metodoPago || "").toLowerCase().includes("payphone");
    const campoComprobante = esPayPhone
        ? "• N.º de Comprobante o Titular de la Tarjeta: [Escribir autorización o titular]"
        : "• N.º de Comprobante / Autorización: [Escribir número de transacción]";
    const lineaHwidsAdicionales =
        Number(estacionesTotales) >= 2
            ? "\n• Código HWID PC(s) Adicional(es): [Pegar códigos HWID adicionales]"
            : "";
    const cuerpo =
        `[TRIBUTAFLOW PRO] Hola equipo de TributaFlow Pro, envío mi comprobante de pago para activar mi licencia anual v${CONFIG_COMERCIAL.VERSION}:\n\n` +
        `• Plan seleccionado: ${plan.nombreComercial}\n` +
        `• Monto USD anual: ${montoTexto} USD / año\n` +
        `• Estaciones autorizadas: ${detalleEstaciones}\n` +
        `• Método de pago: ${metodoPago}\n` +
        `• Referencia de orden: ${referencia}\n` +
        `${campoComprobante}\n` +
        `• Código HWID PC Principal (TributaFlow Pro -> Activar Licencia): ${hwidTexto}` +
        `${lineaHwidsAdicionales}\n\n` +
        `Datos para emisión de licencia (.lic):\n` +
        `• RUC o Cédula: [Escribir RUC/Cédula]\n` +
        `• Nombre / Razón Social: [Escribir nombre o empresa]\n` +
        `• Correo para recibir tu archivo .lic: [Escribir correo]\n\n` +
        `⚠️ Adjunta la captura o PDF del comprobante. Tu archivo .lic será emitido en breve una vez confirmado el pago.`;
    return { asunto, cuerpo };
}

function construirPlantillaSoporte(planNombre, referencia) {
    const asunto = CONFIG_COMERCIAL.ASUNTO_SOPORTE;
    const detallePlan = planNombre ? `\n• Plan consultado: ${planNombre}` : "";
    const detalleRef = referencia ? `\n• Referencia de consulta: ${referencia}` : "";
    const cuerpo =
        `${asunto}\n\n` +
        `Hola equipo de TributaFlow Pro, tengo una consulta técnica o comercial (sin envío de comprobante):` +
        `${detallePlan}${detalleRef}\n` +
        `• Detalle de mi consulta: [Escribir consulta técnica o comercial]`;
    return { asunto, cuerpo };
}

function construirUrlWhatsapp(texto) {
    return `https://wa.me/${CONFIG_COMERCIAL.WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`;
}

function construirUrlMailto(asunto, cuerpo) {
    return (
        `mailto:${CONFIG_COMERCIAL.CORREO_SOPORTE}` +
        `?subject=${encodeURIComponent(asunto)}` +
        `&body=${encodeURIComponent(cuerpo)}`
    );
}

function vincularCopiaCorreo(anchorEl, obtenerPlantillaFn) {
    if (!anchorEl || anchorEl.dataset.copyMailBound === "1") return;
    anchorEl.dataset.copyMailBound = "1";
    anchorEl.addEventListener("click", () => {
        const { asunto, cuerpo } = obtenerPlantillaFn();
        const respaldo = `Para: ${CONFIG_COMERCIAL.CORREO_SOPORTE}\nAsunto: ${asunto}\n\n${cuerpo}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
                .writeText(respaldo)
                .then(() =>
                    mostrarToastCopia(
                        `✓ Plantilla copiada al portapapeles (${CONFIG_COMERCIAL.CORREO_SOPORTE})`
                    )
                )
                .catch(() =>
                    mostrarToastCopia(`Correo oficial: ${CONFIG_COMERCIAL.CORREO_SOPORTE}`)
                );
        } else {
            mostrarToastCopia(`Correo oficial: ${CONFIG_COMERCIAL.CORREO_SOPORTE}`);
        }
    });
}

/* ==========================================================================
   Construcción segura de modales compartidos (sin innerHTML) en cualquier página
   ========================================================================== */
function crearEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = text;
    return el;
}

function asegurarModalesEnDOM() {
    asegurarModalPago();
    Object.values(INSTALADORES_SO).forEach((so) => asegurarModalDescargaSO(so));
    asegurarModalLegal();
    asegurarBotonFlotanteSoporte();
}

function asegurarBotonFlotanteSoporte() {
    if (document.getElementById("btnFlotanteSoporte")) return;
    const btn = crearEl("a", "whatsapp-float", "💬 Soporte TributaFlow Pro");
    btn.id = "btnFlotanteSoporte";
    const { cuerpo } = construirPlantillaSoporte(`TributaFlow Pro v${CONFIG_COMERCIAL.VERSION}`, "");
    asignarEnlaceSeguro(btn, construirUrlWhatsapp(cuerpo), "whatsapp");
    document.body.appendChild(btn);
}

function asegurarModalPago() {
    if (document.getElementById("modalPago")) return;

    const overlay = crearEl("div", "modal-overlay");
    overlay.id = "modalPago";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    const box = crearEl("div", "modal-box");
    const top = crearEl("div", "modal-top");
    const titleWrap = crearEl("div");
    const badge = crearEl("span", "modal-badge", "ACTIVACIÓN OFICIAL TRIBUTAFLOW PRO v2.3.0");
    badge.id = "pagoModalBadge";
    const h3 = crearEl("h3", "", "Adquirir Plan Anual");
    h3.id = "pagoModalTitulo";
    titleWrap.appendChild(badge);
    titleWrap.appendChild(h3);

    const btnClose = crearEl("button", "btn-close", "×");
    btnClose.type = "button";
    btnClose.setAttribute("aria-label", "Cerrar modal de pago");
    btnClose.addEventListener("click", () => cerrarModal("modalPago"));
    top.appendChild(titleWrap);
    top.appendChild(btnClose);

    const content = crearEl("div", "modal-content");

    // Resumen superior + select plan + HWID/RUC
    const summary = crearEl("div", "checkout-summary");
    const sumLeft = crearEl("div");
    const lblResumenPlan = crearEl("strong", "", "TF Estudio Pro • Hasta 50 RUCs • Hasta 2 PCs");
    lblResumenPlan.id = "pagoResumenMeta";
    const lblDescVig = crearEl("small", "", "Suscripción anual (365 días) + Actualizaciones SRI incluidas");
    lblDescVig.style.display = "block";
    lblDescVig.style.color = "#cbd5e1";
    sumLeft.appendChild(lblResumenPlan);
    sumLeft.appendChild(lblDescVig);

    const amountEl = crearEl("div", "checkout-amount", "$299.00");
    amountEl.id = "pagoMontoTotal";
    summary.appendChild(sumLeft);
    summary.appendChild(amountEl);

    const controlsGrid = crearEl("div", "checkout-controls-grid");

    const gPlan = crearEl("div", "field-group");
    const lPlan = crearEl("label", "", "Plan Seleccionado:");
    lPlan.htmlFor = "pagoPlanSelect";
    const selPlan = crearEl("select", "text-input");
    selPlan.id = "pagoPlanSelect";
    Object.values(PLANES_V230).forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.nombre} — ${formatearUsd(p.precioUsd)} USD/año`;
        selPlan.appendChild(opt);
    });
    selPlan.addEventListener("change", () => {
        estadoModalPago.planId = selPlan.value;
        if (!PLANES_V230[selPlan.value].permiteExtraSeats) {
            estadoModalPago.extraSeats = 0;
        }
        actualizarVistaModalPago();
    });
    gPlan.appendChild(lPlan);
    gPlan.appendChild(selPlan);

    const gHwid = crearEl("div", "field-group");
    const lHwid = crearEl("label", "", "HWID del Equipo (o RUC/Empresa si aún no instalas):");
    lHwid.htmlFor = "pagoHwidInput";
    const inHwid = crearEl("input", "mono-input");
    inHwid.type = "text";
    inHwid.id = "pagoHwidInput";
    inHwid.placeholder = `Ej: A1B2-C3D4-E5F6 o RUC ${CONFIG_COMERCIAL.DEMO_RUC_PRINCIPAL}`;
    inHwid.maxLength = 32;
    inHwid.addEventListener("input", (e) => {
        const limpio = sanitizarIdentificador(e.target.value);
        e.target.value = limpio;
        estadoModalPago.hwidORef = limpio;
        actualizarVistaModalPago();
    });
    gHwid.appendChild(lHwid);
    gHwid.appendChild(inHwid);

    controlsGrid.appendChild(gPlan);
    controlsGrid.appendChild(gHwid);

    // Barra estaciones extra para ENTERPRISE_CORP (+0 a +20)
    const extraBar = crearEl("div", "extra-seats-bar");
    extraBar.id = "pagoExtraSeatsBar";
    const extraLabel = crearEl(
        "span",
        "",
        "Estaciones adicionales Red LAN / Multi-Regional (+$150.00/año c/u sobre 10 base):"
    );
    const stepper = crearEl("div", "seats-stepper");
    const btnMenos = crearEl("button", "", "−");
    btnMenos.type = "button";
    const numInput = crearEl("input", "mono-input");
    numInput.type = "number";
    numInput.id = "pagoExtraSeatsInput";
    numInput.min = "0";
    numInput.max = "20";
    numInput.value = "0";
    numInput.style.width = "68px";
    numInput.style.textAlign = "center";
    const btnMas = crearEl("button", "", "+");
    btnMas.type = "button";
    const lblEstTotales = crearEl("strong", "", "10 PCs totales");
    lblEstTotales.id = "pagoEstacionesTotales";

    btnMenos.addEventListener("click", () => {
        estadoModalPago.extraSeats = Math.max(0, estadoModalPago.extraSeats - 1);
        actualizarVistaModalPago();
    });
    btnMas.addEventListener("click", () => {
        estadoModalPago.extraSeats = Math.min(20, estadoModalPago.extraSeats + 1);
        actualizarVistaModalPago();
    });
    numInput.addEventListener("input", () => {
        const parsed = parseInt(numInput.value || "0", 10);
        estadoModalPago.extraSeats = isNaN(parsed) ? 0 : Math.max(0, Math.min(20, parsed));
        actualizarVistaModalPago();
    });

    stepper.appendChild(btnMenos);
    stepper.appendChild(numInput);
    stepper.appendChild(btnMas);
    stepper.appendChild(lblEstTotales);
    extraBar.appendChild(extraLabel);
    extraBar.appendChild(stepper);

    // Banner Referencia Única
    const refBanner = crearEl("div", "ref-banner");
    const refLeft = crearEl("div");
    refLeft.appendChild(crearEl("span", "", "Referencia Única de Pago: "));
    const refCodeEl = crearEl("span", "ref-code", "TF-ESTUDIO_PRO-WEB01");
    refCodeEl.id = "pagoReferenciaTexto";
    refLeft.appendChild(refCodeEl);
    const btnCopyRef = crearEl("button", "btn-copy-mini", "📋 Copiar Referencia");
    btnCopyRef.type = "button";
    btnCopyRef.addEventListener("click", () => {
        copiarAlPortapapeles(calcularResumenCheckout().referencia, "Referencia de Pago");
    });
    refBanner.appendChild(refLeft);
    refBanner.appendChild(btnCopyRef);

    // Dos Casillas de Pago (Casilla 1: Deuna QR / Transferencia | Casilla 2: PayPhone / LAN)
    const channelsGrid = crearEl("div", "payment-channels-grid");

    // Casilla 1: Deuna + Transferencia Directa
    const boxDeuna = crearEl("div", "pay-box pay-deuna");
    boxDeuna.appendChild(crearEl("h4", "", "1. Deuna! / Transferencia Bancaria Directa (0 % Comisión)"));

    const deunaLayout = crearEl("div", "deuna-layout");
    const qrWrap = crearEl("div", "qr-preview-wrap");
    const qrImg = document.createElement("img");
    qrImg.id = "pagoQrDeunaImg";
    qrImg.src = obtenerSrcQrDeuna();
    qrImg.alt = "Código QR Oficial Deuna TributaFlow Pro - Banco Pichincha";
    qrWrap.appendChild(qrImg);

    const stepsList = crearEl("ul", "deuna-steps");
    stepsList.id = "pagoDeunaPasos";
    deunaLayout.appendChild(qrWrap);
    deunaLayout.appendChild(stepsList);

    const bankRows = crearEl("div", "bank-rows");
    const rowsMeta = [
        ["Titular:", CONFIG_COMERCIAL.TITULAR_RECAUDO, "pagoBankTitular", "Titular"],
        ["Banco:", CONFIG_COMERCIAL.BANCO_RECAUDO, "pagoBankBanco", "Banco"],
        ["Cuenta:", CONFIG_COMERCIAL.NUMERO_CUENTA_RECAUDO, "pagoBankCuenta", "Datos Cuenta"],
        ["Monto USD:", "$299.00", "pagoBankMonto", "Monto USD"],
        ["Referencia:", "TF-ESTUDIO_PRO-WEB01", "pagoBankRef", "Referencia"],
    ];
    rowsMeta.forEach(([labelTxt, initVal, idVal, copyLabel]) => {
        const row = crearEl("div", "bank-row");
        const left = crearEl("span", "", `${labelTxt} `);
        const strong = crearEl("strong", "", initVal);
        strong.id = idVal;
        left.appendChild(strong);
        const btnC = crearEl("button", "btn-copy-mini", "Copiar");
        btnC.type = "button";
        btnC.addEventListener("click", () => {
            copiarAlPortapapeles(strong.textContent, copyLabel);
        });
        row.appendChild(left);
        row.appendChild(btnC);
        bankRows.appendChild(row);
    });

    const deunaActions = crearEl("div", "checkout-actions-row");
    const btnWp = crearEl("a", "btn-wp-confirm", "📲 Enviar Comprobante por WhatsApp");
    btnWp.id = "btnEnviarComprobanteWp";
    btnWp.target = "_blank";
    btnWp.rel = "noopener noreferrer";

    const btnCorreoDeuna = crearEl("a", "btn-email-confirm", "📧 Enviar Comprobante por Correo");
    btnCorreoDeuna.id = "btnEnviarComprobanteCorreo";
    vincularCopiaCorreo(btnCorreoDeuna, () =>
        construirPlantillaComprobante(calcularResumenCheckout(), "Deuna! / Banco Pichincha")
    );
    deunaActions.appendChild(btnWp);
    deunaActions.appendChild(btnCorreoDeuna);

    const deunaSupportBar = crearEl("div", "support-inline-bar");
    deunaSupportBar.appendChild(crearEl("span", "", "¿Dudas antes de pagar?"));
    const deunaSupportLinks = crearEl("div", "support-inline-links");
    const btnSoporteDeunaWp = crearEl("a", "btn-support-link", "💬 Soporte Oficial (WhatsApp)");
    btnSoporteDeunaWp.id = "btnSoporteDeunaWp";
    btnSoporteDeunaWp.target = "_blank";
    btnSoporteDeunaWp.rel = "noopener noreferrer";
    const btnSoporteDeunaCorreo = crearEl("a", "btn-support-link", "✉️ Soporte Oficial (Correo)");
    btnSoporteDeunaCorreo.id = "btnSoporteDeunaCorreo";
    vincularCopiaCorreo(btnSoporteDeunaCorreo, () => {
        const r = calcularResumenCheckout();
        return construirPlantillaSoporte(r.plan.nombreComercial, r.referencia);
    });
    deunaSupportLinks.appendChild(btnSoporteDeunaWp);
    deunaSupportLinks.appendChild(btnSoporteDeunaCorreo);
    deunaSupportBar.appendChild(deunaSupportLinks);

    boxDeuna.appendChild(deunaLayout);
    boxDeuna.appendChild(crearEl("p", "deuna-titular-note", CONFIG_COMERCIAL.TITULAR_NOTA_BANCO));
    boxDeuna.appendChild(bankRows);
    boxDeuna.appendChild(deunaActions);
    boxDeuna.appendChild(deunaSupportBar);

    // Casilla 2: PayPhone / Bloque Corporativo Enterprise
    const boxCard = crearEl("div", "pay-box pay-card");
    const cardTitle = crearEl("h4", "", "2. Tarjeta Crédito / Débito (PayPhone Oficial)");
    cardTitle.id = "pagoCardTitulo";

    const payphonePanel = crearEl("div");
    payphonePanel.id = "pagoPayphonePanel";
    payphonePanel.style.display = "flex";
    payphonePanel.style.flexDirection = "column";
    payphonePanel.style.gap = "12px";

    payphonePanel.appendChild(
        crearEl(
            "p",
            "",
            "Paso 1: Paga con tarjeta mediante enlace seguro HTTPS verificado (ppls.me)."
        )
    );
    const badgesWrap = crearEl("div", "pay-badges");
    ["Visa", "Mastercard", "Diners", "Discover", "Alia"].forEach((marca) => {
        badgesWrap.appendChild(crearEl("span", "pay-badge-pill", marca));
    });
    badgesWrap.setAttribute("aria-label", CONFIG_COMERCIAL.PAYPHONE_BADGES);
    payphonePanel.appendChild(badgesWrap);

    const btnPayphone = crearEl("a", "btn-payphone-main", "💳 Pagar con Tarjeta en PayPhone ($299.00)");
    btnPayphone.id = "btnPagarPayphoneModal";
    btnPayphone.target = "_blank";
    btnPayphone.rel = "noopener noreferrer";
    payphonePanel.appendChild(btnPayphone);

    payphonePanel.appendChild(crearEl("div", "pay-security-note", CONFIG_COMERCIAL.PAYPHONE_GARANTIA));

    const payphoneStep2 = crearEl("div", "payphone-step2-box");
    payphoneStep2.id = "pagoPayphonePaso2";
    payphoneStep2.appendChild(
        crearEl(
            "div",
            "anti-fp-alert",
            "Paso 2 — Una vez aprobado tu pago con tarjeta, envíanos tu comprobante o el nombre del titular de la tarjeta por WhatsApp o correo junto con tu referencia para activar tu licencia de inmediato."
        )
    );

    const btnPayphoneWp = crearEl("a", "btn-wp-confirm", "📲 Enviar Voucher PayPhone por WhatsApp");
    btnPayphoneWp.id = "btnPayphoneVoucherWp";
    btnPayphoneWp.target = "_blank";
    btnPayphoneWp.rel = "noopener noreferrer";

    const btnPayphoneCorreo = crearEl("a", "btn-email-confirm", "📧 Enviar Voucher PayPhone por Correo");
    btnPayphoneCorreo.id = "btnPayphoneVoucherCorreo";
    vincularCopiaCorreo(btnPayphoneCorreo, () =>
        construirPlantillaComprobante(calcularResumenCheckout(), "PayPhone Tarjeta")
    );

    payphoneStep2.appendChild(btnPayphoneWp);
    payphoneStep2.appendChild(btnPayphoneCorreo);

    const payphoneSupportBar = crearEl("div", "support-inline-bar");
    payphoneSupportBar.appendChild(crearEl("span", "", "¿Consulta técnica sin pago?"));
    const payphoneSupportLinks = crearEl("div", "support-inline-links");
    const btnSoportePayphoneWp = crearEl("a", "btn-support-link", "💬 Contactar Soporte Oficial");
    btnSoportePayphoneWp.id = "btnSoportePayphoneWp";
    btnSoportePayphoneWp.target = "_blank";
    btnSoportePayphoneWp.rel = "noopener noreferrer";
    const btnSoportePayphoneCorreo = crearEl("a", "btn-support-link", "✉️ soportetributaflow@quoratec.com");
    btnSoportePayphoneCorreo.id = "btnSoportePayphoneCorreo";
    vincularCopiaCorreo(btnSoportePayphoneCorreo, () => {
        const r = calcularResumenCheckout();
        return construirPlantillaSoporte(r.plan.nombreComercial, r.referencia);
    });
    payphoneSupportLinks.appendChild(btnSoportePayphoneWp);
    payphoneSupportLinks.appendChild(btnSoportePayphoneCorreo);
    payphoneSupportBar.appendChild(payphoneSupportLinks);
    payphoneStep2.appendChild(payphoneSupportBar);

    payphonePanel.appendChild(payphoneStep2);

    const lanPanel = crearEl("div", "enterprise-lan-notice");
    lanPanel.id = "pagoEnterpriseLanPanel";
    lanPanel.style.display = "none";
    const lanTexto = crearEl("p", "", "");
    lanTexto.id = "pagoEnterpriseLanTexto";
    const lanSupportBar = crearEl("div", "support-inline-bar");
    lanSupportBar.style.marginTop = "10px";
    lanSupportBar.appendChild(crearEl("span", "", "Asesoría corporativa previa:"));
    const lanSupportLinks = crearEl("div", "support-inline-links");
    const btnSoporteEnterpriseWp = crearEl("a", "btn-support-link", "💬 Contactar Soporte Oficial");
    btnSoporteEnterpriseWp.id = "btnSoporteEnterpriseWp";
    btnSoporteEnterpriseWp.target = "_blank";
    btnSoporteEnterpriseWp.rel = "noopener noreferrer";
    const btnSoporteEnterpriseCorreo = crearEl("a", "btn-support-link", "✉️ soportetributaflow@quoratec.com");
    btnSoporteEnterpriseCorreo.id = "btnSoporteEnterpriseCorreo";
    vincularCopiaCorreo(btnSoporteEnterpriseCorreo, () => {
        const r = calcularResumenCheckout();
        return construirPlantillaSoporte(r.plan.nombreComercial, r.referencia);
    });
    lanSupportLinks.appendChild(btnSoporteEnterpriseWp);
    lanSupportLinks.appendChild(btnSoporteEnterpriseCorreo);
    lanSupportBar.appendChild(lanSupportLinks);
    lanPanel.appendChild(lanTexto);
    lanPanel.appendChild(lanSupportBar);

    boxCard.appendChild(cardTitle);
    boxCard.appendChild(payphonePanel);
    boxCard.appendChild(lanPanel);

    channelsGrid.appendChild(boxDeuna);
    channelsGrid.appendChild(boxCard);

    // Reglas comerciales y garantías
    const rulesBox = crearEl("div", "rules-box");
    [
        "✓ 15 días de evaluación gratuita sin tarjeta de crédito.",
        "✓ Licencia anual por 365 días vinculada a tu equipo.",
        "✓ Actualizaciones ante cambios del SRI incluidas por 1 año.",
        "✓ Sellado ético: cada RUC se sella tras la primera descarga real SRI.",
    ].forEach((regla) => rulesBox.appendChild(crearEl("div", "", regla)));

    content.appendChild(summary);
    content.appendChild(controlsGrid);
    content.appendChild(extraBar);
    content.appendChild(refBanner);
    content.appendChild(channelsGrid);
    content.appendChild(rulesBox);

    box.appendChild(top);
    box.appendChild(content);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    actualizarVistaModalPago();
}

function asegurarModalDescargaSO(soMeta) {
    if (document.getElementById(soMeta.modalId)) return;

    const overlay = crearEl("div", "modal-overlay");
    overlay.id = soMeta.modalId;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    const box = crearEl("div", "modal-box modal-narrow");
    const top = crearEl("div", "modal-top");
    const tw = crearEl("div");
    tw.appendChild(crearEl("span", "modal-badge", soMeta.badge));
    tw.appendChild(crearEl("h3", "", soMeta.titulo));

    const btnClose = crearEl("button", "btn-close", "×");
    btnClose.type = "button";
    btnClose.setAttribute("aria-label", `Cerrar descarga ${soMeta.id}`);
    btnClose.addEventListener("click", () => cerrarModal(soMeta.modalId));
    top.appendChild(tw);
    top.appendChild(btnClose);

    const content = crearEl("div", "modal-content");
    const metaBox = crearEl("div", "bank-rows");
    const r1 = crearEl("div", "bank-row");
    r1.appendChild(crearEl("span", "", "Paquete:"));
    r1.appendChild(crearEl("strong", "mono", soMeta.archivo));
    const r2 = crearEl("div", "bank-row");
    r2.appendChild(crearEl("span", "", "Detalles:"));
    r2.appendChild(crearEl("strong", "", soMeta.tamano));
    metaBox.appendChild(r1);
    metaBox.appendChild(r2);

    const lista = crearEl("ul", "plan-list");
    soMeta.pasos.forEach((p) => lista.appendChild(crearEl("li", "ok", p)));

    const notaEdicion = crearEl(
        "div",
        "enterprise-lan-notice",
        "Durante la instalación puedes elegir qué edición evaluar por 15 días gratis (Personal Pro, Contador Master, Estudio Pro, Enterprise Team o Enterprise Corporativo) sin ingresar tarjeta."
    );

    const btnDownload = crearEl("a", "btn-glow", `⬇ Descargar ${soMeta.archivo}`);
    btnDownload.href = soMeta.url;
    btnDownload.setAttribute("download", soMeta.archivo);

    content.appendChild(metaBox);
    content.appendChild(lista);
    content.appendChild(notaEdicion);
    content.appendChild(btnDownload);

    box.appendChild(top);
    box.appendChild(content);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

function asegurarModalLegal() {
    if (document.getElementById("modalLegal")) return;
    const overlay = crearEl("div", "modal-overlay");
    overlay.id = "modalLegal";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    const box = crearEl("div", "modal-box modal-narrow");
    const top = crearEl("div", "modal-top");
    const h3 = crearEl("h3", "", "Información Legal — TributaFlow Pro");
    h3.id = "modalLegalTitulo";
    const btnClose = crearEl("button", "btn-close", "×");
    btnClose.type = "button";
    btnClose.addEventListener("click", () => cerrarModal("modalLegal"));
    top.appendChild(h3);
    top.appendChild(btnClose);

    const cuerpo = crearEl("div", "modal-content");
    cuerpo.id = "modalLegalCuerpo";

    box.appendChild(top);
    box.appendChild(cuerpo);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

function actualizarVistaModalPago() {
    const res = calcularResumenCheckout();
    const { plan, extras, montoTexto, estacionesTotales, referencia, urlPayphone } = res;

    document.getElementById("pagoModalTitulo").textContent = `${plan.nombre} — Suscripción Anual`;
    document.getElementById("pagoModalBadge").textContent = plan.esEnterprise
        ? "ACTIVACIÓN CORPORATIVA RED LAN (SIN PAYPHONE)"
        : "CHECKOUT OFICIAL DEUNA / TRANSFERENCIA / PAYPHONE";
    document.getElementById("pagoResumenMeta").textContent =
        `${plan.nombreComercial} • ${plan.rucsLabel} • ${estacionesTotales} PC(s)`;
    document.getElementById("pagoMontoTotal").textContent = `${montoTexto} USD`;

    const sel = document.getElementById("pagoPlanSelect");
    if (sel) sel.value = plan.id;

    const extraBar = document.getElementById("pagoExtraSeatsBar");
    const extraIn = document.getElementById("pagoExtraSeatsInput");
    const estTot = document.getElementById("pagoEstacionesTotales");
    if (extraBar) extraBar.style.display = plan.permiteExtraSeats ? "flex" : "none";
    if (extraIn) extraIn.value = String(extras);
    if (estTot) estTot.textContent = `${estacionesTotales} PCs totales`;

    document.getElementById("pagoReferenciaTexto").textContent = referencia;
    document.getElementById("pagoBankMonto").textContent = `${montoTexto} USD`;
    document.getElementById("pagoBankRef").textContent = referencia;

    const qrImg = document.getElementById("pagoQrDeunaImg");
    if (qrImg) qrImg.src = obtenerSrcQrDeuna();

    const pasosUl = document.getElementById("pagoDeunaPasos");
    if (pasosUl) {
        pasosUl.textContent = "";
        [
            "1. Abre Deuna! o Banca Móvil Banco Pichincha.",
            "2. Escanea el QR de la izquierda.",
            `3. Ingresa ${montoTexto} USD exactos y la referencia ${referencia}.`,
            "4. Envía tu comprobante por WhatsApp para emitir tu licencia .lic.",
        ].forEach((txt) => pasosUl.appendChild(crearEl("li", "", txt)));
    }

    const deunaTemplate = construirPlantillaComprobante(res, "Deuna! / Banco Pichincha");
    asignarEnlaceSeguro(
        document.getElementById("btnEnviarComprobanteWp"),
        construirUrlWhatsapp(deunaTemplate.cuerpo),
        "whatsapp"
    );
    asignarEnlaceSeguro(
        document.getElementById("btnEnviarComprobanteCorreo"),
        construirUrlMailto(deunaTemplate.asunto, deunaTemplate.cuerpo),
        "correo"
    );

    const payphoneTemplate = construirPlantillaComprobante(res, "PayPhone Tarjeta");
    asignarEnlaceSeguro(
        document.getElementById("btnPayphoneVoucherWp"),
        construirUrlWhatsapp(payphoneTemplate.cuerpo),
        "whatsapp"
    );
    asignarEnlaceSeguro(
        document.getElementById("btnPayphoneVoucherCorreo"),
        construirUrlMailto(payphoneTemplate.asunto, payphoneTemplate.cuerpo),
        "correo"
    );

    const soporteTemplate = construirPlantillaSoporte(plan.nombreComercial, referencia);
    const soporteWpUrl = construirUrlWhatsapp(soporteTemplate.cuerpo);
    const soporteCorreoUrl = construirUrlMailto(soporteTemplate.asunto, soporteTemplate.cuerpo);
    [
        "btnSoporteDeunaWp",
        "btnSoportePayphoneWp",
        "btnSoporteEnterpriseWp",
    ].forEach((id) => {
        asignarEnlaceSeguro(document.getElementById(id), soporteWpUrl, "whatsapp");
    });
    [
        "btnSoporteDeunaCorreo",
        "btnSoportePayphoneCorreo",
        "btnSoporteEnterpriseCorreo",
    ].forEach((id) => {
        asignarEnlaceSeguro(document.getElementById(id), soporteCorreoUrl, "correo");
    });

    const payphonePanel = document.getElementById("pagoPayphonePanel");
    const lanPanel = document.getElementById("pagoEnterpriseLanPanel");
    const lanTexto = document.getElementById("pagoEnterpriseLanTexto");
    const cardTitle = document.getElementById("pagoCardTitulo");
    const btnPayphone = document.getElementById("btnPagarPayphoneModal");

    if (urlPayphone) {
        cardTitle.textContent = "2. Tarjeta Crédito / Débito (PayPhone Oficial)";
        payphonePanel.style.display = "flex";
        lanPanel.style.display = "none";
        asignarEnlaceSeguro(btnPayphone, urlPayphone, "payphone");
        btnPayphone.textContent = `💳 Pagar con Tarjeta en PayPhone (${montoTexto})`;
    } else {
        cardTitle.textContent = "2. Activación Corporativa Red LAN (Transferencia Directa)";
        payphonePanel.style.display = "none";
        lanPanel.style.display = "block";
        if (btnPayphone) {
            btnPayphone.removeAttribute("href");
            btnPayphone.removeAttribute("data-tf-canal-seguro");
        }
        if (lanTexto) {
            lanTexto.textContent =
                `El plan ${plan.nombreComercial} (${montoTexto} USD / año para ${estacionesTotales} estaciones) ` +
                `se activa con 0 % comisión mediante Transferencia Bancaria Directa o QR Deuna! usando la referencia ${referencia}.`;
        }
    }
}

function abrirModalPago(planIdRaw) {
    estadoModalPago.planId = resolverPlan(planIdRaw);
    if (!PLANES_V230[estadoModalPago.planId].permiteExtraSeats) {
        estadoModalPago.extraSeats = 0;
    }
    actualizarVistaModalPago();
    document.getElementById("modalPago").style.display = "flex";
}

function abrirModalDescargaSO(soId) {
    const so = INSTALADORES_SO[soId] || INSTALADORES_SO.windows;
    const modal = document.getElementById(so.modalId);
    if (modal) modal.style.display = "flex";
}

function abrirModalLegal(clave) {
    const doc = TEXTOS_LEGALES[clave];
    if (!doc) return;
    document.getElementById("modalLegalTitulo").textContent = doc.titulo;
    const cuerpo = document.getElementById("modalLegalCuerpo");
    cuerpo.textContent = "";
    doc.secciones.forEach((sec) => {
        cuerpo.appendChild(crearEl("h4", "", sec.sub));
        cuerpo.appendChild(crearEl("p", "", sec.txt));
    });
    document.getElementById("modalLegal").style.display = "flex";
}

function cerrarModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
}

function detectarSistemaOperativo() {
    const ua = (navigator.userAgent || "").toLowerCase();
    const plat = (navigator.platform || "").toLowerCase();
    if (plat.includes("mac") || ua.includes("macintosh")) return "macos";
    if ((plat.includes("linux") || ua.includes("linux")) && !ua.includes("android")) return "linux";
    return "windows";
}

document.addEventListener("DOMContentLoaded", () => {
    asegurarModalesEnDOM();

    // Resaltar SO detectado en tarjetas de descarga
    const soDetectado = detectarSistemaOperativo();
    document.querySelectorAll(".os-card[data-os]").forEach((card) => {
        if (card.getAttribute("data-os") === soDetectado) {
            card.classList.add("os-card-active");
        }
    });

    const btnPrincipalDl = document.getElementById("btnDescargaDetectada");
    if (btnPrincipalDl) {
        const info = INSTALADORES_SO[soDetectado] || INSTALADORES_SO.windows;
        btnPrincipalDl.textContent = `⬇ Descargar ${info.id.toUpperCase()} v2.3.0`;
        btnPrincipalDl.addEventListener("click", () => abrirModalDescargaSO(info.id));
    }

    // Fallback seguro CSP para logotipos SVG -> PNG
    document.querySelectorAll("img[data-fallback]").forEach((img) => {
        img.addEventListener("error", () => {
            const fb = img.getAttribute("data-fallback");
            if (fb && img.getAttribute("src") !== fb) {
                img.setAttribute("src", fb);
            }
        });
    });

    // Hidratar menú desplegable responsivo "9 Módulos ▾" en las 10 páginas
    const MODULOS_PORTAL = [
        { icon: "📊", title: "1. Panel General", desc: "Tablero KPIs, vencimientos y cupo ético", href: "modulos/panel-general.html" },
        { icon: "🏢", title: "2. Mis Contribuyentes", desc: "Multi-RUC, SQLite HWID y respaldo .tfbkp", href: "modulos/mis-contribuyentes.html" },
        { icon: "⚡", title: "3. Sincronizar SRI", desc: "Árbol jerárquico estilo Perseo XML y RIDE", href: "modulos/sincronizar-sri.html" },
        { icon: "📥", title: "4. Importar Comprobantes", desc: "Claves .txt del SRI y lotes XML masivos", href: "modulos/importar-comprobantes.html" },
        { icon: "🕵️", title: "5. Auditor Fantasma SRI", desc: "Cruce preventivo contra empresas fantasma", href: "modulos/auditor-fantasma.html" },
        { icon: "🔎", title: "6. Búsqueda RUC / Cédula", desc: "Consulta tributaria directa sin bloqueos", href: "modulos/busqueda-ruc.html" },
        { icon: "📚", title: "7. Consulta Masiva", desc: "Verificación en lote y exportación Excel/CSV", href: "modulos/consulta-masiva.html" },
        { icon: "📑", title: "8. Generador y Validador ATS", desc: "XML ATS oficial, XSD y clave contingencia", href: "modulos/generador-ats.html" },
        { icon: "🔐", title: "9. Ajustes, Red LAN y Blindaje", desc: "Permisos ✓/🔒, estaciones TCP/IP y UNC", href: "modulos/ajustes-seguridad.html" },
    ];

    const navRoot = (document.body && document.body.getAttribute("data-root")) || "";
    const currentPage = (window.location.pathname || "").split("/").pop() || "";

    function esModoMovil() {
        return window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
    }

    function cerrarDropdowns(excluir) {
        document.querySelectorAll("[data-nav-dropdown]").forEach((dd) => {
            if (dd === excluir) return;
            if (typeof dd._closeNavDropdown === "function") {
                dd._closeNavDropdown();
            } else {
                dd.classList.remove("is-open");
                const btn = dd.querySelector(".nav-dropdown-trigger");
                if (btn) btn.setAttribute("aria-expanded", "false");
            }
        });
    }

    document.querySelectorAll("[data-nav-dropdown]").forEach((dd) => {
        const trigger = dd.querySelector(".nav-dropdown-trigger");
        const panel = dd.querySelector(".nav-dropdown-panel");
        if (!trigger || !panel) return;

        const header = document.createElement("div");
        header.className = "nav-dropdown-header";
        header.textContent = "Suite Completa — 9 Módulos TributaFlow Pro";

        const grid = document.createElement("div");
        grid.className = "nav-dropdown-grid";

        MODULOS_PORTAL.forEach((mod) => {
            const link = document.createElement("a");
            const isCurrent = currentPage && mod.href.endsWith("/" + currentPage);
            link.href = `${navRoot}${mod.href}`;
            link.className = isCurrent ? "nav-dropdown-item is-current" : "nav-dropdown-item";
            link.setAttribute("role", "menuitem");
            if (isCurrent) {
                link.setAttribute("aria-current", "page");
            }

            const iconSpan = document.createElement("span");
            iconSpan.className = "nav-dropdown-icon";
            iconSpan.setAttribute("aria-hidden", "true");
            iconSpan.textContent = mod.icon;

            const textWrap = document.createElement("span");
            textWrap.className = "nav-dropdown-text";

            const titleSpan = document.createElement("span");
            titleSpan.className = "nav-dropdown-title";
            titleSpan.textContent = mod.title;

            const descSpan = document.createElement("span");
            descSpan.className = "nav-dropdown-desc";
            descSpan.textContent = mod.desc;

            textWrap.appendChild(titleSpan);
            textWrap.appendChild(descSpan);
            link.appendChild(iconSpan);
            link.appendChild(textWrap);
            grid.appendChild(link);
        });

        const footer = document.createElement("div");
        footer.className = "nav-dropdown-footer";
        const allLink = document.createElement("a");
        allLink.href = `${navRoot}index.html#modulos`;
        allLink.className = "nav-dropdown-all";
        allLink.textContent = "Ver resumen completo en portada ➔";
        footer.appendChild(allLink);

        panel.textContent = "";
        panel.appendChild(header);
        panel.appendChild(grid);
        panel.appendChild(footer);

        let hoverCloseTimer = null;
        let pinnedByClick = false;
        let lastHoverOpenTs = 0;

        function abrirDd(pinned) {
            if (hoverCloseTimer) {
                clearTimeout(hoverCloseTimer);
                hoverCloseTimer = null;
            }
            cerrarDropdowns(dd);
            dd.classList.add("is-open");
            trigger.setAttribute("aria-expanded", "true");
            if (pinned) pinnedByClick = true;
        }

        function cerrarDd() {
            if (hoverCloseTimer) {
                clearTimeout(hoverCloseTimer);
                hoverCloseTimer = null;
            }
            dd.classList.remove("is-open");
            trigger.setAttribute("aria-expanded", "false");
            pinnedByClick = false;
        }

        dd._closeNavDropdown = cerrarDd;

        dd.addEventListener("mouseenter", () => {
            if (esModoMovil()) return;
            if (hoverCloseTimer) {
                clearTimeout(hoverCloseTimer);
                hoverCloseTimer = null;
            }
            if (!dd.classList.contains("is-open")) {
                lastHoverOpenTs = Date.now();
                abrirDd(false);
            }
        });

        dd.addEventListener("mouseleave", () => {
            if (esModoMovil() || pinnedByClick) return;
            hoverCloseTimer = setTimeout(() => {
                cerrarDd();
            }, 160);
        });

        trigger.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = dd.classList.contains("is-open");
            if (!esModoMovil() && isOpen && !pinnedByClick && Date.now() - lastHoverOpenTs < 400) {
                pinnedByClick = true;
                return;
            }
            if (isOpen) {
                cerrarDd();
            } else {
                abrirDd(true);
            }
        });
    });

    // Blindaje anti-redirección en captura y respaldo de copia en enlaces estáticos de Soporte Oficial
    document.querySelectorAll('[data-support-link="whatsapp"]').forEach((el) => {
        el.setAttribute("data-tf-canal-seguro", "whatsapp");
        if (!el.getAttribute("rel")) {
            el.setAttribute("rel", "noopener noreferrer");
        }
    });
    document.querySelectorAll('[data-support-link="correo"]').forEach((el) => {
        el.setAttribute("data-tf-canal-seguro", "correo");
        vincularCopiaCorreo(el, () =>
            construirPlantillaSoporte(`TributaFlow Pro v${CONFIG_COMERCIAL.VERSION}`, "")
        );
    });
    document.querySelectorAll('a[target="_blank"]').forEach((el) => {
        el.setAttribute("rel", "noopener noreferrer");
    });

    if (!window.__TF_GUARDIAN_ENLACES__) {
        window.__TF_GUARDIAN_ENLACES__ = true;
        document.addEventListener(
            "click",
            (e) => {
                const target = e.target;
                if (!target || typeof target.closest !== "function") return;
                const link = target.closest("a[data-tf-canal-seguro]");
                if (!link) return;
                const tipo = link.getAttribute("data-tf-canal-seguro") || "auto";
                const hrefActual = link.getAttribute("href") || "";
                if (!validarDestinoSeguro(hrefActual, tipo)) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    window.__TF_LAST_BLOCKED_URL__ = hrefActual;
                    mostrarToastCopia("⛔ Enlace bloqueado por seguridad: canal oficial no verificado.");
                }
            },
            true
        );
    }

    // Menú responsive móvil
    const navToggle = document.getElementById("navToggle");
    const navMenu = document.getElementById("navMenu");
    if (navToggle && navMenu) {
        navToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = navMenu.classList.toggle("is-open");
            navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
            if (!isOpen) {
                cerrarDropdowns();
            }
        });

        navMenu.querySelectorAll("a, .nav-cta").forEach((el) => {
            el.addEventListener("click", () => {
                cerrarDropdowns();
                navMenu.classList.remove("is-open");
                navToggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    document.addEventListener("click", (e) => {
        const target = e.target;
        if (!target || typeof target.closest !== "function") return;
        if (!target.closest("[data-nav-dropdown]")) {
            cerrarDropdowns();
        }
        if (navMenu && navToggle && !target.closest("#navMenu") && !target.closest("#navToggle")) {
            navMenu.classList.remove("is-open");
            navToggle.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            cerrarDropdowns();
            if (navMenu) navMenu.classList.remove("is-open");
            if (navToggle) navToggle.setAttribute("aria-expanded", "false");
        }
    });

    // Solo los botones aislados con data-checkout-plan disparan el Modal de Pago
    document.querySelectorAll("[data-checkout-plan]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            abrirModalPago(btn.getAttribute("data-checkout-plan"));
        });
    });

    // Modales de descarga por Sistema Operativo (abre modal con guía de instalación y enlace directo GitHub Releases)
    document.querySelectorAll("[data-download-os]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            abrirModalDescargaSO(btn.getAttribute("data-download-os"));
        });
    });

    // Triggers legales del Footer
    document.querySelectorAll("[data-legal]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            abrirModalLegal(btn.getAttribute("data-legal"));
        });
    });

    // Parámetros opcionales desde la aplicación (?device_id=...&tier=...)
    const params = new URLSearchParams(window.location.search);
    const deviceId = sanitizarIdentificador(params.get("device_id") || params.get("hwid") || "");
    const tierParam = params.get("tier") || params.get("plan") || "";
    if (deviceId) {
        estadoModalPago.hwidORef = deviceId;
        const inHwid = document.getElementById("pagoHwidInput");
        if (inHwid) inHwid.value = deviceId;
    }
    if (tierParam) {
        abrirModalPago(tierParam);
    }

    // Cerrar modales al hacer clic fuera o presionar Escape
    window.addEventListener("click", (e) => {
        if (e.target && e.target.classList && e.target.classList.contains("modal-overlay")) {
            e.target.style.display = "none";
        }
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            document.querySelectorAll(".modal-overlay").forEach((m) => {
                m.style.display = "none";
            });
        }
    });
});

if (!Object.prototype.hasOwnProperty.call(window, "__TF_SECURITY__")) {
    Object.defineProperty(window, "__TF_SECURITY__", {
        value: congelarProfundo({
            CONFIG_COMERCIAL,
            PLANES_V230,
            INSTALADORES_SO,
            TEXTOS_LEGALES,
            validarDestinoSeguro,
            esUrlPayphoneSegura,
            esUrlWhatsappSegura,
            esUrlCorreoSegura,
        }),
        writable: false,
        configurable: false,
        enumerable: true,
    });
}
