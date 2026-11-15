/**
 * TributaFlow Pro v2.4.0 — Motor Comercial, Detección Multiplataforma y Blindaje Web
 * Dominio oficial: https://tributaflow.quoratec.com
 * Desarrollado por Quoratec Software Solutions (Ecuador).
 */
(function () {
    "use strict";

    const CLAVES_PROHIBIDAS = new Set(["__proto__", "constructor", "prototype"]);
    const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;
    const HEX_ALFANUM_REGEX = /^[A-Z0-9-]{1,32}$/;

    function esClaveSegura(clave) {
        return typeof clave === "string" && !CLAVES_PROHIBIDAS.has(clave);
    }

    function crearMapaVacio() {
        return Object.create(null);
    }

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

    const URL_PORTAL_DESCARGAS = "https://tributaflow.quoratec.com/#descargas";

    const CONFIG_COMERCIAL = congelarProfundo({
        VERSION: "2.4.0",
        TRIAL_DIAS: 15,
        TRIAL_RUCS: 60,
        TRIAL_MODALIDAD: "Estudio Contable Pro",
        DOMINIO_OFICIAL: "https://tributaflow.quoratec.com",
        URL_DESCARGAS_PORTAL: URL_PORTAL_DESCARGAS,
        API_CONFIG_PATH: "api/config_comercial.json",
        PAYPHONE_LINKS: {
            PERSONAL_PRO: "https://ppls.me/5S1Y89pBi1vYHBTEgEzRA",
            CONTADOR_MASTER: "https://ppls.me/dxope7VBAjK5LR1mO4UitA",
            ESTUDIO_PRO: "https://ppls.me/60Bdw7lcRhMfvjqwA5cFdg",
            ENTERPRISE_TEAM: null,
            ENTERPRISE_CORP: null,
        },
        QR_DEUNA_SRC: "assets/qr-deuna.png",
        QR_DEUNA_SUBPAGE_SRC: "../assets/qr-deuna.png",
        TITULAR_RECAUDO: "Fausto Orellana — Recaudo Oficial TributaFlow Pro",
        TITULAR_NOTA_BANCO:
            "Al escanear el QR o transferir en Banco Pichincha, verifica que el titular registrado sea Fausto Andrés Orellana Jaén (Recaudo Oficial TributaFlow Pro).",
        BANCO_RECAUDO: "Banco Pichincha",
        TIPO_CUENTA_RECAUDO: "Recaudo Empresarial / Deuna! Directo",
        NUMERO_CUENTA_RECAUDO: "Solicitar número vigente por WhatsApp Oficial (0996459771)",
        WHATSAPP_NUMERO: "593996459771",
        WHATSAPP_LOCAL: "0996459771",
        WHATSAPP_URL_PREFIX: "https://wa.me/593996459771",
        CORREO_SOPORTE: "soportetributaflow@quoratec.com",
        MAILTO_URL_PREFIX: "mailto:soportetributaflow@quoratec.com",
        ASUNTO_SOPORTE: "Consulta Soporte Técnico — TributaFlow Pro",
        DOMINIOS_PAYPHONE: ["ppls.me", "payphone.app"],
        GITHUB_RELEASES_PREFIX: "/FaustoOrellana/tributaflow-portal/releases/download/v2.4.0/",
        PAYPHONE_BADGES: "Visa · Mastercard · Diners · Discover · Alia",
        PAYPHONE_GARANTIA: "🛡️ Pago protegido con verificación 3D Secure Ecuador",
        PRECIO_SEAT_EXTRA_USD: 150,
        DEMO_RUC_PRINCIPAL: "1790012345001",
        DEMO_RAZON_PRINCIPAL: "EMPRESA DEMOSTRACIÓN S.A.",
        DEMO_RUC_SECUNDARIO: "0999999999001",
    });

    const PLANES_V240 = congelarProfundo({
        PERSONAL_PRO: {
            id: "PERSONAL_PRO",
            nombre: "Personal Pro",
            nombreComercial: "TF Personal Pro",
            precioRegularUsd: 69,
            precioUsd: 59,
            rucsMax: 3,
            rucsLabel: "Hasta 3 RUCs",
            masivaLabel: "SRI/RIDE/XML • Sin lote multi-RUC/ATS/EFOS",
            estacionesBase: 1,
            estacionesLabel: "1 PC",
            modoLabel: "Bóveda local cifrada (Sin .tfbkp / Sin Red LAN)",
            esEnterprise: false,
            permiteExtraSeats: false,
        },
        CONTADOR_MASTER: {
            id: "CONTADOR_MASTER",
            nombre: "Contador Master",
            nombreComercial: "TF Contador Master",
            precioRegularUsd: 169,
            precioUsd: 139,
            rucsMax: 25,
            rucsLabel: "Hasta 25 RUCs",
            masivaLabel: "Lote Multi-RUC + ATS XML/XSD/Excel",
            estacionesBase: 1,
            estacionesLabel: "1 PC",
            modoLabel: "Modo Local (Sin EFOS / Multi-PC / .tfbkp / LAN)",
            esEnterprise: false,
            permiteExtraSeats: false,
        },
        ESTUDIO_PRO: {
            id: "ESTUDIO_PRO",
            nombre: "Estudio Contable Pro",
            nombreComercial: "TF Estudio Pro",
            precioRegularUsd: 399,
            precioUsd: 299,
            rucsMax: 60,
            rucsLabel: "Hasta 60 RUCs (o 30/PC en hasta 2 PCs)",
            masivaLabel: "Auditor Fantasma EFOS + Contingencia ATS + .tfbkp",
            estacionesBase: 2,
            estacionesLabel: "Hasta 2 PCs (60 RUCs o 30/PC)",
            modoLabel: "Modo Local + .tfbkp AES-256-GCM (Sin Red LAN/UNC)",
            esEnterprise: false,
            permiteExtraSeats: false,
        },
        ENTERPRISE_TEAM: {
            id: "ENTERPRISE_TEAM",
            nombre: "Enterprise Team",
            nombreComercial: "TF Enterprise Team",
            precioRegularUsd: 1190,
            precioUsd: 890,
            rucsMax: -1,
            rucsLabel: "RUCs Ilimitados",
            masivaLabel: "Red LAN TCP/IP Anti-Colisión + Bóveda UNC",
            estacionesBase: 5,
            estacionesLabel: "5 estaciones base",
            modoLabel: "Red LAN TCP/IP + UNC (Sin Multi-Regional HTTPS)",
            esEnterprise: true,
            permiteExtraSeats: false,
        },
        ENTERPRISE_CORP: {
            id: "ENTERPRISE_CORP",
            nombre: "Enterprise Corporativo",
            nombreComercial: "TF Enterprise Corp",
            precioRegularUsd: 1890,
            precioUsd: 1490,
            rucsMax: -1,
            rucsLabel: "RUCs Ilimitados",
            masivaLabel: "10+ estaciones (+$150/PC extra) • Multi-Regional HTTPS",
            estacionesBase: 10,
            estacionesLabel: "10+ estaciones escalables (+$150/PC extra)",
            modoLabel: "Red LAN + Bóveda UNC + Conector Multi-Regional HTTPS",
            esEnterprise: true,
            permiteExtraSeats: true,
        },
    });

    const INSTALADORES_SO = congelarProfundo({
        windows: {
            id: "windows",
            etiqueta: "Windows",
            modalId: "modalDescargaWindows",
            titulo: "Descargar para Windows 10 / 11 (x64 y Tablets Windows)",
            badge: "INSTALADOR OFICIAL WINDOWS .EXE",
            archivo: "TributaFlow_Pro_v2.4.0_Windows_x64_Setup.exe",
            tamano: "Instalador Windows x64 • Verificado SHA-256",
            url: "https://github.com/FaustoOrellana/tributaflow-portal/releases/download/v2.4.0/TributaFlow_Pro_v2.4.0_Windows_x64_Setup.exe",
            sha256: "534211af20180824e4d203ec3e9eedd411de847303e6f11423a31e54e2fed092",
            sha256Url: "https://github.com/FaustoOrellana/tributaflow-portal/releases/download/v2.4.0/TributaFlow_Pro_v2.4.0_Windows_x64_Setup.exe.sha256",
            comandoSha256: 'certutil -hashfile "TributaFlow_Pro_v2.4.0_Windows_x64_Setup.exe" SHA256',
            pasos: [
                "1. Descarga TributaFlow_Pro_v2.4.0_Windows_x64_Setup.exe (compatible con PC, laptop táctil y tablets con Windows).",
                "2. Comprueba que el hash SHA-256 local coincida exactamente con el resumen publicado abajo.",
                "3. Evalúa gratis por 15 días con hasta 60 RUCs (modalidad Estudio Contable Pro, sin tarjeta) o carga tu llave anual .lic.",
            ],
        },
        macos: {
            id: "macos",
            etiqueta: "macOS",
            modalId: "modalDescargaMacos",
            titulo: "Descargar para macOS (Apple Silicon / Intel)",
            badge: "IMAGEN OFICIAL MACOS .DMG",
            archivo: "TributaFlow_Pro_v2.4.0_macOS.dmg",
            tamano: "Imagen de disco macOS • Verificado SHA-256",
            url: "https://github.com/FaustoOrellana/tributaflow-portal/releases/download/v2.4.0/TributaFlow_Pro_v2.4.0_macOS.dmg",
            sha256: "c11460fd02b0470c64efe6de0f565ed804e24ba83c9e24f50e09a84b494c0ae6",
            sha256Url: "https://github.com/FaustoOrellana/tributaflow-portal/releases/download/v2.4.0/TributaFlow_Pro_v2.4.0_macOS.dmg.sha256",
            comandoSha256: "shasum -a 256 TributaFlow_Pro_v2.4.0_macOS.dmg",
            pasos: [
                "1. Abre TributaFlow_Pro_v2.4.0_macOS.dmg tras validar su firma SHA-256 y arrastra TributaFlow Pro a Aplicaciones.",
                "2. La primera vez, haz clic derecho (o Control + clic) sobre TributaFlow Pro y selecciona Abrir.",
                "3. Disfruta de 15 días de evaluación gratuita con hasta 60 RUCs (modalidad Estudio Contable Pro) antes de activar tu plan.",
            ],
        },
        linux: {
            id: "linux",
            etiqueta: "Linux",
            modalId: "modalDescargaLinux",
            titulo: "Descargar para Linux (Ubuntu / Debian / Mint amd64)",
            badge: "PAQUETE OFICIAL LINUX .DEB",
            archivo: "TributaFlow_Pro_v2.4.0_Linux_amd64.deb",
            tamano: "Paquete Debian amd64 • Verificado SHA-256",
            url: "https://github.com/FaustoOrellana/tributaflow-portal/releases/download/v2.4.0/TributaFlow_Pro_v2.4.0_Linux_amd64.deb",
            sha256: "1d0e0d7830264fe63ac4e14b1b75cc72e30e1242bfe8b1a54225d7396ffdd9a0",
            sha256Url: "https://github.com/FaustoOrellana/tributaflow-portal/releases/download/v2.4.0/TributaFlow_Pro_v2.4.0_Linux_amd64.deb.sha256",
            comandoSha256: "sha256sum TributaFlow_Pro_v2.4.0_Linux_amd64.deb",
            pasos: [
                "1. Verifica el hash SHA-256 e instala con: sudo apt install ./TributaFlow_Pro_v2.4.0_Linux_amd64.deb",
                "2. Inicia la aplicación para acceder a la evaluación gratuita de 15 días (hasta 60 RUCs, modalidad Estudio Pro).",
                "3. Opera con bóveda SQLite cifrada AES-256 y respaldo portátil .tfbkp (AES-256-GCM + HMAC).",
            ],
        },
    });

    const TEXTOS_LEGALES = congelarProfundo({
        terminos: {
            titulo: "Acuerdo de Licencia de Usuario Final y Condiciones de Uso — v2.4.0",
            secciones: [
                {
                    sub: "1. Suscripción Anual (365 Días) y 5 Planes Oficiales",
                    txt: "Quoratec Software Solutions otorga una licencia anual de 365 días vinculada criptográficamente al identificador HWID de las estaciones autorizadas: Personal Pro (hasta 3 RUCs, 1 PC), Contador Master (hasta 25 RUCs, 1 PC), Estudio Contable Pro (hasta 60 RUCs o 30/PC en hasta 2 PCs), Enterprise Team (RUCs ilimitados, 5 estaciones base LAN/UNC) y Enterprise Corporativo (10+ estaciones +$150/PC extra y Conector Multi-Regional HTTPS).",
                },
                {
                    sub: "2. Evaluación Gratuita (15 Días / 60 RUCs) y Sin Secuestro de Datos",
                    txt: "Incluye 15 días de evaluación gratuita con capacidad de hasta 60 RUCs en modalidad Estudio Contable Pro y sin necesidad de tarjeta de crédito. La consulta informativa de RUC no consume cupo. Tras finalizar la vigencia sin renovar, conservas lectura local de tu historial y archivos XML/RIDE/Excel sin secuestro de datos.",
                },
                {
                    sub: "3. Limitación de Responsabilidad Tributaria",
                    txt: "TributaFlow Pro es una herramienta de automatización y validación documental SRI. La revisión contable y presentación final de declaraciones y anexos corresponden al contribuyente o su contador autorizado.",
                },
            ],
        },
        privacidad: {
            titulo: "Privacidad Soberana (Local-First) y Respaldo Portátil (.tfbkp)",
            secciones: [
                {
                    sub: "1. Arquitectura 100 % Local Cifrada (AES-256)",
                    txt: "TributaFlow Pro opera bajo arquitectura 100 % Local-First: sin telemetría invasiva ni envío de credenciales del SRI, XML o bases SQLite a servidores externos.",
                },
                {
                    sub: "2. Custodia de Credenciales y Respaldo .tfbkp",
                    txt: "Las consultas se conectan directamente entre tu equipo y los portales oficiales del SRI. Puedes exportar copias cifradas .tfbkp en cualquier momento para resguardar o migrar tu historial.",
                },
            ],
        },
        licenciamiento: {
            titulo: "Actualizaciones SRI, Traslado de Equipo y Condiciones Comerciales",
            secciones: [
                {
                    sub: "1. Actualizaciones Normativas SRI y Soporte Directo",
                    txt: "Incluye actualizaciones de esquemas XML/XSD del SRI y ATS durante los 365 días de vigencia, más soporte oficial por WhatsApp (+593 99 645 9771) y correo (soportetributaflow@quoratec.com).",
                },
                {
                    sub: "2. Traslado por Daño o Cambio de PC y Devoluciones",
                    txt: "La activación (.lic) se emite tras confirmar el abono en PayPhone, Deuna! o transferencia bancaria. Las devoluciones aplican únicamente antes de emitir la llave .lic. Incluye soporte gratuito para traslado por cambio o daño de PC con .tfbkp.",
                },
            ],
        },
    });

    const PAYPHONE_URLS_OFICIALES = Object.freeze(
        Object.values(CONFIG_COMERCIAL.PAYPHONE_LINKS).filter((u) => typeof u === "string" && u.length > 0)
    );
    const URLS_DESCARGA_OFICIALES = Object.freeze(
        Object.values(INSTALADORES_SO).map((s) => s.url)
    );

    const PLAN_LOOKUP = crearMapaVacio();
    Object.keys(PLANES_V240).forEach((k) => {
        if (esClaveSegura(k)) PLAN_LOOKUP[k] = PLANES_V240[k];
    });

    const PLAN_ALIASES = crearMapaVacio();
    Object.assign(PLAN_ALIASES, {
        PERSONAL: "PERSONAL_PRO",
        CONTADOR: "CONTADOR_MASTER",
        CONTADOR15: "CONTADOR_MASTER",
        ESTUDIO: "ESTUDIO_PRO",
        EMPRESARIAL: "ESTUDIO_PRO",
        ENTERPRISE: "ENTERPRISE_CORP",
        ENTERPRISE_SERVER: "ENTERPRISE_CORP",
    });

    const SO_LOOKUP = crearMapaVacio();
    Object.keys(INSTALADORES_SO).forEach((k) => {
        if (esClaveSegura(k)) SO_LOOKUP[k] = INSTALADORES_SO[k];
    });

    let runtimeVersion = CONFIG_COMERCIAL.VERSION;
    let runtimeCorpExtraSeats = 1;
    let estadoModalPago = {
        planId: "ESTUDIO_PRO",
        extraSeats: 0,
        hwidORef: "",
    };

    const telemetriaInterna = {
        blockedUrls: 0,
        blockedMutations: 0,
        lastBlockedReason: "",
        lastBlockedValue: "",
        frameBlocked: false,
    };

    function registrarBloqueoSeguridad(razon, valor) {
        telemetriaInterna.blockedUrls += 1;
        telemetriaInterna.lastBlockedReason = String(razon || "INTEGRITY_CHECK");
        telemetriaInterna.lastBlockedValue = String(valor || "").slice(0, 140);
        window.__TF_LAST_BLOCKED_URL__ = telemetriaInterna.lastBlockedValue;
    }

    /* ======================================================================
       Validación estricta de URLs (Cero bypass por subdominio falso o esquema)
       ====================================================================== */
    function contieneCaracterControlOSchemeMalo(url) {
        if (typeof url !== "string") return true;
        const limpio = url.trim();
        if (!limpio || /[\u0000-\u001F\u007F\\]/.test(limpio)) return true;
        const lower = limpio.toLowerCase();
        return (
            lower.startsWith("javascript:") ||
            lower.startsWith("data:") ||
            lower.startsWith("vbscript:") ||
            lower.startsWith("file:")
        );
    }

    function parsearHttpsEstricta(url) {
        if (contieneCaracterControlOSchemeMalo(url)) return null;
        try {
            const parsed = new URL(url.trim());
            if (parsed.protocol !== "https:") return null;
            if (parsed.username !== "" || parsed.password !== "" || parsed.port !== "") {
                return null;
            }
            return parsed;
        } catch {
            return null;
        }
    }

    function esUrlPayphoneSegura(url) {
        const parsed = parsearHttpsEstricta(url);
        if (!parsed) return false;
        const host = parsed.hostname.toLowerCase();
        if (!CONFIG_COMERCIAL.DOMINIOS_PAYPHONE.includes(host)) return false;
        return PAYPHONE_URLS_OFICIALES.includes(url.trim());
    }

    function esUrlWhatsappSegura(url) {
        const parsed = parsearHttpsEstricta(url);
        if (!parsed) return false;
        if (parsed.hostname.toLowerCase() !== "wa.me") return false;
        return parsed.pathname === `/${CONFIG_COMERCIAL.WHATSAPP_NUMERO}`;
    }

    function esUrlWhatsappShareSegura(url) {
        const parsed = parsearHttpsEstricta(url);
        if (!parsed) return false;
        if (parsed.hostname.toLowerCase() !== "wa.me") return false;
        if (parsed.pathname !== "/" && parsed.pathname !== "") return false;
        const textParam = String(parsed.searchParams.get("text") || "");
        return (
            textParam.includes(CONFIG_COMERCIAL.URL_DESCARGAS_PORTAL) &&
            !textParam.toLowerCase().includes("github.com")
        );
    }

    function esUrlCorreoSegura(url) {
        if (contieneCaracterControlOSchemeMalo(url)) return false;
        const trimmed = url.trim();
        const prefijo = CONFIG_COMERCIAL.MAILTO_URL_PREFIX;
        if (!trimmed.startsWith(prefijo)) return false;
        const siguiente = trimmed.charAt(prefijo.length);
        if (siguiente !== "" && siguiente !== "?") return false;
        try {
            const parsed = new URL(trimmed);
            return (
                parsed.protocol === "mailto:" &&
                parsed.pathname.toLowerCase() === CONFIG_COMERCIAL.CORREO_SOPORTE
            );
        } catch {
            return false;
        }
    }

    function esUrlDescargaOficialSegura(url) {
        const parsed = parsearHttpsEstricta(url);
        if (!parsed) return false;
        if (parsed.hostname.toLowerCase() !== "github.com") return false;
        if (!parsed.pathname.startsWith(CONFIG_COMERCIAL.GITHUB_RELEASES_PREFIX)) return false;
        return URLS_DESCARGA_OFICIALES.includes(url.trim());
    }

    function esUrlPortalOficialSegura(url) {
        const parsed = parsearHttpsEstricta(url);
        if (!parsed) return false;
        return parsed.hostname.toLowerCase() === "tributaflow.quoratec.com";
    }

    function validarDestinoSeguro(url, tipo = "auto") {
        if (contieneCaracterControlOSchemeMalo(url)) return false;
        const limpio = String(url).trim();
        if (tipo === "payphone") return esUrlPayphoneSegura(limpio);
        if (tipo === "whatsapp") return esUrlWhatsappSegura(limpio);
        if (tipo === "whatsapp_share") return esUrlWhatsappShareSegura(limpio);
        if (tipo === "correo") return esUrlCorreoSegura(limpio);
        if (tipo === "download_release") return esUrlDescargaOficialSegura(limpio);
        if (tipo === "portal") return esUrlPortalOficialSegura(limpio);
        return (
            esUrlPayphoneSegura(limpio) ||
            esUrlWhatsappSegura(limpio) ||
            esUrlWhatsappShareSegura(limpio) ||
            esUrlCorreoSegura(limpio) ||
            esUrlDescargaOficialSegura(limpio) ||
            esUrlPortalOficialSegura(limpio)
        );
    }

    function asignarEnlaceSeguro(anchorEl, url, tipo) {
        if (!(anchorEl instanceof HTMLAnchorElement)) return false;
        anchorEl.setAttribute("data-tf-canal-seguro", tipo);
        if (!validarDestinoSeguro(url, tipo)) {
            anchorEl.removeAttribute("href");
            registrarBloqueoSeguridad("ASSIGN_INVALID_URL", url);
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

    /* ======================================================================
       Detección inteligente por Sistema Operativo (NO por pantalla táctil)
       ====================================================================== */
    function detectarInfoSistemaOperativo(envOverride) {
        const hasOverride = envOverride && typeof envOverride === "object";
        const nav = hasOverride
            ? envOverride
            : {
                  userAgent: navigator.userAgent || "",
                  platform: navigator.platform || "",
                  maxTouchPoints: Number(navigator.maxTouchPoints || 0),
                  uaDataPlatform:
                      navigator.userAgentData && navigator.userAgentData.platform
                          ? String(navigator.userAgentData.platform)
                          : "",
                  uaDataMobile: Boolean(navigator.userAgentData && navigator.userAgentData.mobile),
              };

        const ua = String(nav.userAgent || "").toLowerCase();
        const plat = String(nav.platform || "").toLowerCase();
        const uadPlat = String(nav.uaDataPlatform || "").toLowerCase();
        const touch = Number(nav.maxTouchPoints || 0);
        const uadMobile = Boolean(nav.uaDataMobile);

        // Windows SIEMPRE soportado (incluye laptops táctiles, 2-en-1, doble pantalla y tablets Windows)
        const esWindows =
            (/windows|win32|win64|wow64/.test(ua) || /win/.test(plat) || uadPlat === "windows") &&
            !/windows phone|iemobile/.test(ua);
        if (esWindows) {
            return congelarProfundo({
                id: "windows",
                etiqueta: "Windows",
                esMovil: false,
                soportado: true,
                instaladorId: "windows",
            });
        }

        // Android (smartphones y tablets, con o sin teclado externo)
        if (/android/.test(ua) || uadPlat === "android" || (/linux/.test(ua) && uadMobile)) {
            return congelarProfundo({
                id: "android",
                etiqueta: "Android",
                esMovil: true,
                soportado: false,
                instaladorId: null,
            });
        }

        // iPadOS (incluye iPad en "Solicitar sitio web para computadoras": Macintosh + maxTouchPoints > 1)
        const esIpad =
            /ipad/.test(ua) ||
            /ipad/.test(plat) ||
            uadPlat === "ipados" ||
            ((/macintosh|macintel|mac os x/.test(ua) || /mac/.test(plat)) && touch > 1);
        if (esIpad) {
            return congelarProfundo({
                id: "ipados",
                etiqueta: "iPadOS",
                esMovil: true,
                soportado: false,
                instaladorId: null,
            });
        }

        // iOS (iPhone / iPod)
        if (/iphone|ipod|crios|fxios/.test(ua) || uadPlat === "ios") {
            return congelarProfundo({
                id: "ios",
                etiqueta: "iOS",
                esMovil: true,
                soportado: false,
                instaladorId: null,
            });
        }

        // macOS de escritorio
        if (/macintosh|mac os x/.test(ua) || /mac/.test(plat) || uadPlat === "macos") {
            return congelarProfundo({
                id: "macos",
                etiqueta: "macOS",
                esMovil: false,
                soportado: true,
                instaladorId: "macos",
            });
        }

        // Linux de escritorio
        if (
            (/linux|x11|ubuntu|debian|fedora/.test(ua) || /linux/.test(plat) || uadPlat === "linux") &&
            !uadMobile
        ) {
            return congelarProfundo({
                id: "linux",
                etiqueta: "Linux",
                esMovil: false,
                soportado: true,
                instaladorId: "linux",
            });
        }

        if (/mobile|tablet|windows phone|iemobile/.test(ua) || uadMobile) {
            return congelarProfundo({
                id: "mobile",
                etiqueta: "Sistema Móvil",
                esMovil: true,
                soportado: false,
                instaladorId: null,
            });
        }

        return congelarProfundo({
            id: "windows",
            etiqueta: "Windows",
            esMovil: false,
            soportado: true,
            instaladorId: "windows",
        });
    }

    function detectarSistemaOperativo(envOverride) {
        return detectarInfoSistemaOperativo(envOverride).id;
    }

    function esSistemaOperativoSoportado(soIdOrEnv) {
        if (typeof soIdOrEnv === "string") {
            return Boolean(esClaveSegura(soIdOrEnv) && SO_LOOKUP[soIdOrEnv]);
        }
        return detectarInfoSistemaOperativo(soIdOrEnv).soportado;
    }

    /* ======================================================================
       Utilidades comerciales y sanitización estricta
       ====================================================================== */
    function sanitizarIdentificador(valor) {
        return String(valor || "")
            .toUpperCase()
            .replace(/[^A-Z0-9-]/g, "")
            .slice(0, 32);
    }

    function sanitizarNombrePlano(valor) {
        return String(valor || "")
            .replace(/[<>"'`\\]/g, "")
            .trim()
            .slice(0, 64);
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

    function obtenerPrefijoRuta() {
        return document.body && document.body.getAttribute("data-root") ? "../" : "";
    }

    function obtenerSrcQrDeuna() {
        return obtenerPrefijoRuta() === "../"
            ? CONFIG_COMERCIAL.QR_DEUNA_SUBPAGE_SRC
            : CONFIG_COMERCIAL.QR_DEUNA_SRC;
    }

    function resolverPlan(planRaw) {
        const norm = String(planRaw || "")
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9_]/g, "");
        if (esClaveSegura(norm) && PLAN_LOOKUP[norm]) {
            return norm;
        }
        if (esClaveSegura(norm) && PLAN_ALIASES[norm]) {
            const aliasTarget = PLAN_ALIASES[norm];
            if (PLAN_LOOKUP[aliasTarget]) return aliasTarget;
        }
        return "ESTUDIO_PRO";
    }

    function calcularResumenCheckout() {
        const plan =
            (esClaveSegura(estadoModalPago.planId) && PLAN_LOOKUP[estadoModalPago.planId]) ||
            PLAN_LOOKUP.ESTUDIO_PRO;
        const extras = plan.permiteExtraSeats
            ? Math.max(0, Math.min(50, Number(estadoModalPago.extraSeats || 0)))
            : 0;
        const totalUsd = plan.precioUsd + extras * CONFIG_COMERCIAL.PRECIO_SEAT_EXTRA_USD;
        const estacionesTotales = plan.estacionesBase + extras;
        const hwidCorto = extraerCodigoCorto(estadoModalPago.hwidORef);
        const referencia = `TF-${plan.id}-${hwidCorto}`;
        const urlPayphone = esClaveSegura(plan.id) ? CONFIG_COMERCIAL.PAYPHONE_LINKS[plan.id] || null : null;

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

    function crearEl(tag, className, text) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text !== undefined && text !== null) el.textContent = text;
        return el;
    }

    function mostrarToastCopia(texto) {
        let toast = document.getElementById("tfCopyToast");
        if (!toast) {
            toast = crearEl("div", "copy-toast");
            toast.id = "tfCopyToast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");
            document.body.appendChild(toast);
        }
        toast.textContent = String(texto || "");
        toast.style.display = "block";
        clearTimeout(toast._timerId);
        toast._timerId = setTimeout(() => {
            toast.style.display = "none";
        }, 2500);
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

    function construirUrlWhatsapp(texto) {
        return `https://wa.me/${CONFIG_COMERCIAL.WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`;
    }

    function construirUrlWhatsappShareDesktop() {
        const mensaje = `Descargar TributaFlow Pro v${runtimeVersion} en mi computadora (Windows, macOS o Linux): ${CONFIG_COMERCIAL.URL_DESCARGAS_PORTAL}`;
        return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    }

    function construirUrlMailto(asunto, cuerpo) {
        return (
            `mailto:${CONFIG_COMERCIAL.CORREO_SOPORTE}` +
            `?subject=${encodeURIComponent(asunto)}` +
            `&body=${encodeURIComponent(cuerpo)}`
        );
    }

    function construirPlantillaComprobante(resumen, metodoPago) {
        const { plan, extras, montoTexto, estacionesTotales, referencia, hwidORef } = resumen;
        const hwidTexto =
            hwidORef && hwidORef !== "SIN_ESPECIFICAR" ? hwidORef : "[Pegar código TF-XXXXXX-...]";
        const detalleEstaciones =
            extras > 0
                ? `${estacionesTotales} PCs (${plan.estacionesBase} base + ${extras} adicionales)`
                : estacionesTotales === 1
                  ? "1 PC"
                  : `${estacionesTotales} PCs`;
        const asunto = `[TRIBUTAFLOW PRO] Activación Licencia Anual ${referencia} (${metodoPago})`;
        const esPayPhone = String(metodoPago || "").toLowerCase().includes("payphone");
        const campoComprobante = esPayPhone
            ? "• N.º de Comprobante o Titular de la Tarjeta (OBLIGATORIO): [Escribir autorización o titular]"
            : "• N.º de Comprobante / Autorización bancaria (OBLIGATORIO): [Escribir número de transacción]";
        const lineaHwidsAdicionales =
            Number(estacionesTotales) >= 2
                ? "\n• Código HWID PC(s) Adicional(es): [Pegar códigos HWID adicionales]"
                : "";
        const cuerpo =
            `[TRIBUTAFLOW PRO] Hola equipo de TributaFlow Pro, envío mi comprobante de pago real para activar mi licencia anual v${runtimeVersion}:\n\n` +
            `• Plan seleccionado: ${plan.nombreComercial}\n` +
            `• Monto USD anual: ${montoTexto} USD / año\n` +
            `• Estaciones autorizadas: ${detalleEstaciones}\n` +
            `• Método de pago: ${metodoPago}\n` +
            `• Referencia de orden: ${referencia}\n` +
            `${campoComprobante}\n` +
            `• Código HWID de tu PC (TributaFlow Pro -> Activar Licencia): ${hwidTexto}` +
            `${lineaHwidsAdicionales}\n\n` +
            `Datos para emisión de licencia (.lic):\n` +
            `• RUC o Cédula: [Escribir RUC/Cédula]\n` +
            `• Nombre / Razón Social: [Escribir nombre o empresa]\n` +
            `• Correo para recibir tu archivo .lic: [Escribir correo]\n\n` +
            `⚠️ Adjunta la captura o PDF del comprobante. El archivo .lic se emite solo tras verificar el abono real.`;
        return { asunto, cuerpo };
    }

    function construirPlantillaSoporte(planNombre, referencia) {
        const asunto = CONFIG_COMERCIAL.ASUNTO_SOPORTE;
        const detallePlan = planNombre ? `\n• Plan consultado: ${sanitizarNombrePlano(planNombre)}` : "";
        const detalleRef = referencia ? `\n• Referencia de consulta: ${sanitizarIdentificador(referencia)}` : "";
        const cuerpo =
            `${asunto}\n\n` +
            `Hola equipo de TributaFlow Pro, tengo una consulta técnica o comercial (sin envío de comprobante):` +
            `${detallePlan}${detalleRef}\n` +
            `• Detalle de mi consulta: [Escribir consulta técnica o comercial]`;
        return { asunto, cuerpo };
    }

    function vincularCopiaCorreo(anchorEl, obtenerPlantillaFn) {
        if (!(anchorEl instanceof HTMLAnchorElement) || anchorEl.dataset.copyMailBound === "1") return;
        anchorEl.dataset.copyMailBound = "1";
        anchorEl.addEventListener("click", () => {
            const { asunto, cuerpo } = obtenerPlantillaFn();
            const respaldo = `Para: ${CONFIG_COMERCIAL.CORREO_SOPORTE}\nAsunto: ${asunto}\n\n${cuerpo}`;
            copiarAlPortapapeles(respaldo, `Plantilla (${CONFIG_COMERCIAL.CORREO_SOPORTE})`);
        });
    }

    /* ======================================================================
       Modales: Checkout, Descarga PC (Windows/macOS/Linux), Móvil Bloqueado, Legal
       ====================================================================== */
    function cerrarModal(id) {
        const el = document.getElementById(id);
        if (el instanceof HTMLElement) el.style.display = "none";
    }

    function asegurarBotonFlotanteSoporte() {
        if (document.getElementById("btnFlotanteSoporte")) return;
        const btn = crearEl("a", "whatsapp-float", "💬 Soporte TributaFlow Pro");
        btn.id = "btnFlotanteSoporte";
        const { cuerpo } = construirPlantillaSoporte(`TributaFlow Pro v${runtimeVersion}`, "");
        asignarEnlaceSeguro(btn, construirUrlWhatsapp(cuerpo), "whatsapp");
        document.body.appendChild(btn);
    }

    function asegurarModalMovilBloqueado() {
        if (document.getElementById("modalMovilBloqueado")) return;

        const overlay = crearEl("div", "modal-overlay");
        overlay.id = "modalMovilBloqueado";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "modalMovilTitulo");

        const box = crearEl("div", "modal-box modal-narrow");
        const top = crearEl("div", "modal-top");
        const tw = crearEl("div");
        tw.appendChild(crearEl("span", "modal-badge", `INSTALACIÓN EN COMPUTADORA v${runtimeVersion}`));
        const h3 = crearEl("h3", "", "Descarga Disponible para PC (Windows, macOS o Linux)");
        h3.id = "modalMovilTitulo";
        tw.appendChild(h3);

        const btnClose = crearEl("button", "btn-close", "×");
        btnClose.type = "button";
        btnClose.setAttribute("aria-label", "Cerrar aviso de descarga en móvil");
        btnClose.addEventListener("click", () => cerrarModal("modalMovilBloqueado"));
        top.appendChild(tw);
        top.appendChild(btnClose);

        const content = crearEl("div", "modal-content");
        const heroBox = crearEl("div", "mobile-block-hero");
        const osPill = crearEl("span", "mobile-os-pill", "Sistema detectado: Dispositivo móvil");
        osPill.id = "modalMovilOsPill";
        const msg = crearEl(
            "p",
            "",
            "Tu dispositivo utiliza un sistema móvil (Android / iOS / iPadOS) que no admite instaladores de computadora. Puedes explorar toda la web, comparar planes y activar tu licencia desde aquí, o guardar el enlace oficial para abrirlo en tu PC Windows, macOS o Linux."
        );
        heroBox.appendChild(osPill);
        heroBox.appendChild(msg);

        const urlChip = crearEl("div", "mobile-url-chip", CONFIG_COMERCIAL.URL_DESCARGAS_PORTAL);
        urlChip.id = "modalMovilUrlChip";

        const actions = crearEl("div", "mobile-actions-stack");
        const btnWpShare = crearEl("a", "btn-wp-confirm", "📲 Enviar enlace a mi WhatsApp");
        btnWpShare.id = "btnMovilEnviarWp";
        asignarEnlaceSeguro(btnWpShare, construirUrlWhatsappShareDesktop(), "whatsapp_share");

        const btnCopyUrl = crearEl("button", "btn-email-confirm", "📋 Copiar enlace oficial");
        btnCopyUrl.type = "button";
        btnCopyUrl.id = "btnMovilCopiarEnlace";
        btnCopyUrl.addEventListener("click", () => {
            copiarAlPortapapeles(CONFIG_COMERCIAL.URL_DESCARGAS_PORTAL, "Enlace oficial");
        });

        actions.appendChild(btnWpShare);
        actions.appendChild(btnCopyUrl);

        content.appendChild(heroBox);
        content.appendChild(urlChip);
        content.appendChild(actions);

        box.appendChild(top);
        box.appendChild(content);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    function abrirModalMovilBloqueado(soInfo) {
        asegurarModalMovilBloqueado();
        const osPill = document.getElementById("modalMovilOsPill");
        if (osPill instanceof HTMLElement) {
            const nombreOs = (soInfo && soInfo.etiqueta) || "Dispositivo Móvil";
            osPill.textContent = `Sistema detectado: ${nombreOs} (Solo explorador web y activación)`;
        }
        const btnWpShare = document.getElementById("btnMovilEnviarWp");
        if (btnWpShare instanceof HTMLAnchorElement) {
            asignarEnlaceSeguro(btnWpShare, construirUrlWhatsappShareDesktop(), "whatsapp_share");
        }
        const modal = document.getElementById("modalMovilBloqueado");
        if (modal instanceof HTMLElement) modal.style.display = "flex";
    }

    function asegurarModalDescargaSO(soMeta) {
        if (!soMeta || document.getElementById(soMeta.modalId)) return;

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
        r1.appendChild(crearEl("span", "", "Instalador:"));
        r1.appendChild(crearEl("strong", "mono", soMeta.archivo));
        const r2 = crearEl("div", "bank-row");
        r2.appendChild(crearEl("span", "", "Versión / Paquete:"));
        r2.appendChild(crearEl("strong", "", `v${runtimeVersion} • ${soMeta.tamano}`));
        metaBox.appendChild(r1);
        metaBox.appendChild(r2);

        const shaBox = crearEl("div", "os-sha-box");
        const shaHead = crearEl("div", "os-sha-head");
        shaHead.appendChild(crearEl("span", "os-sha-label", "Verificación SHA-256 Oficial:"));
        const btnCopySha = crearEl("button", "btn-sha-copy", "📋 Copiar SHA-256");
        btnCopySha.type = "button";
        btnCopySha.addEventListener("click", () => {
            copiarAlPortapapeles(soMeta.sha256, `SHA-256 ${soMeta.etiqueta}`);
        });
        shaHead.appendChild(btnCopySha);
        const shaCode = crearEl("code", "os-sha-code", soMeta.sha256);
        shaCode.setAttribute("data-modal-sha256", soMeta.id);
        const verifyCmd = crearEl("code", "os-verify-cmd", soMeta.comandoSha256);
        shaBox.appendChild(shaHead);
        shaBox.appendChild(shaCode);
        shaBox.appendChild(verifyCmd);

        const lista = crearEl("ul", "plan-list");
        soMeta.pasos.forEach((p) => lista.appendChild(crearEl("li", "ok", p)));

        const notaEdicion = crearEl(
            "div",
            "enterprise-lan-notice",
            "Incluye 15 días de evaluación gratuita con hasta 60 RUCs (modalidad Estudio Contable Pro, sin tarjeta de crédito). Comprueba el hash SHA-256 antes de instalar; si ya adquiriste tu licencia, carga tu archivo .lic en Activar Licencia."
        );

        const btnDownload = crearEl("a", "btn-glow", `⬇ Descargar ${soMeta.archivo}`);
        btnDownload.setAttribute("data-download-direct", soMeta.id);
        btnDownload.setAttribute("download", soMeta.archivo);
        asignarEnlaceSeguro(btnDownload, soMeta.url, "download_release");

        content.appendChild(metaBox);
        content.appendChild(shaBox);
        content.appendChild(lista);
        content.appendChild(notaEdicion);
        content.appendChild(btnDownload);

        box.appendChild(top);
        box.appendChild(content);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    function abrirModalDescargaSO(soId) {
        const soInfo = detectarInfoSistemaOperativo();
        if (soInfo.esMovil || !soInfo.soportado) {
            abrirModalMovilBloqueado(soInfo);
            return;
        }
        const clave =
            soId && soId !== "auto" && esClaveSegura(soId) && SO_LOOKUP[soId]
                ? soId
                : soInfo.instaladorId || "windows";
        const soMeta = SO_LOOKUP[clave] || INSTALADORES_SO.windows;
        asegurarModalDescargaSO(soMeta);
        const modal = document.getElementById(soMeta.modalId);
        if (modal instanceof HTMLElement) modal.style.display = "flex";
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
        const badge = crearEl("span", "modal-badge", `ACTIVACIÓN OFICIAL TRIBUTAFLOW PRO v${runtimeVersion}`);
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

        const summary = crearEl("div", "checkout-summary");
        const sumLeft = crearEl("div");
        const lblResumenPlan = crearEl("strong", "", "TF Estudio Pro • Hasta 60 RUCs • Hasta 2 PCs independientes");
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
        Object.values(PLANES_V240).forEach((p) => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = `${p.nombre} — ${formatearUsd(p.precioUsd)} USD/año`;
            selPlan.appendChild(opt);
        });
        selPlan.addEventListener("change", () => {
            estadoModalPago.planId = resolverPlan(selPlan.value);
            const planSel = PLAN_LOOKUP[estadoModalPago.planId];
            if (!planSel || !planSel.permiteExtraSeats) {
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
            const target = e.target;
            if (!(target instanceof HTMLInputElement)) return;
            const limpio = sanitizarIdentificador(target.value);
            target.value = limpio;
            estadoModalPago.hwidORef = limpio;
            actualizarVistaModalPago();
        });
        gHwid.appendChild(lHwid);
        gHwid.appendChild(inHwid);

        controlsGrid.appendChild(gPlan);
        controlsGrid.appendChild(gHwid);

        const extraBar = crearEl("div", "extra-seats-bar");
        extraBar.id = "pagoExtraSeatsBar";
        const extraLabel = crearEl(
            "span",
            "",
            "Estaciones adicionales +1 PC sin límite (+$150.00/año c/u sobre 10 base):"
        );
        const stepper = crearEl("div", "seats-stepper");
        const btnMenos = crearEl("button", "", "−");
        btnMenos.type = "button";
        btnMenos.setAttribute("aria-label", "Restar estación adicional");
        const numInput = crearEl("input", "mono-input");
        numInput.type = "number";
        numInput.id = "pagoExtraSeatsInput";
        numInput.min = "0";
        numInput.max = "50";
        numInput.value = "0";
        numInput.style.width = "68px";
        numInput.style.textAlign = "center";
        numInput.setAttribute("aria-label", "Cantidad de PCs adicionales");
        const btnMas = crearEl("button", "", "+");
        btnMas.type = "button";
        btnMas.setAttribute("aria-label", "Sumar estación adicional");
        const lblEstTotales = crearEl("strong", "", "10 PCs totales");
        lblEstTotales.id = "pagoEstacionesTotales";

        btnMenos.addEventListener("click", () => {
            estadoModalPago.extraSeats = Math.max(0, estadoModalPago.extraSeats - 1);
            actualizarVistaModalPago();
        });
        btnMas.addEventListener("click", () => {
            estadoModalPago.extraSeats = Math.min(50, estadoModalPago.extraSeats + 1);
            actualizarVistaModalPago();
        });
        numInput.addEventListener("input", () => {
            const parsed = parseInt(numInput.value || "0", 10);
            estadoModalPago.extraSeats = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(50, parsed));
            actualizarVistaModalPago();
        });

        stepper.appendChild(btnMenos);
        stepper.appendChild(numInput);
        stepper.appendChild(btnMas);
        stepper.appendChild(lblEstTotales);
        extraBar.appendChild(extraLabel);
        extraBar.appendChild(stepper);

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

        const channelsGrid = crearEl("div", "payment-channels-grid");

        // Columna 1: Deuna! / Transferencia Directa (QR protegido exclusivamente dentro del modal)
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

        // Columna 2: PayPhone / Bloque Corporativo Enterprise
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
                "Paso 1: Paga con tarjeta mediante enlace seguro HTTPS verificado (PayPhone Oficial)."
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
        payphonePanel.appendChild(btnPayphone);

        payphonePanel.appendChild(crearEl("div", "pay-security-note", CONFIG_COMERCIAL.PAYPHONE_GARANTIA));

        const payphoneStep2 = crearEl("div", "payphone-step2-box");
        payphoneStep2.id = "pagoPayphonePaso2";
        payphoneStep2.appendChild(
            crearEl(
                "div",
                "payphone-step2-title",
                "Paso 2 (Solo tras aprobarse tu pago con tarjeta)"
            )
        );
        payphoneStep2.appendChild(
            crearEl(
                "div",
                "anti-fp-alert",
                "Para evitar falsos positivos, envía tu comprobante únicamente después de completarse el cobro en PayPhone."
            )
        );

        const btnPayphoneWp = crearEl("a", "btn-wp-confirm", "📲 Enviar Voucher PayPhone por WhatsApp");
        btnPayphoneWp.id = "btnPayphoneVoucherWp";
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

        const rulesBox = crearEl("div", "rules-box");
        [
            "✓ 15 días de evaluación gratuita con hasta 60 RUCs (Estudio Contable Pro, sin tarjeta).",
            "✓ Licencia anual por 365 días vinculada a tu equipo.",
            "✓ Actualizaciones ante cambios del SRI incluidas por 1 año.",
            "✓ Sellado ético: cada RUC se sella tras su primera descarga real.",
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

    function actualizarVistaModalPago() {
        const res = calcularResumenCheckout();
        const { plan, extras, montoTexto, estacionesTotales, referencia, urlPayphone } = res;

        const elTitulo = document.getElementById("pagoModalTitulo");
        const elBadge = document.getElementById("pagoModalBadge");
        const elMeta = document.getElementById("pagoResumenMeta");
        const elMonto = document.getElementById("pagoMontoTotal");
        if (elTitulo) elTitulo.textContent = `${plan.nombre} — Suscripción Anual`;
        if (elBadge) {
            elBadge.textContent = plan.esEnterprise
                ? `ACTIVACIÓN CORPORATIVA RED LAN / VPN v${runtimeVersion}`
                : `CHECKOUT OFICIAL DEUNA / TRANSFERENCIA / PAYPHONE v${runtimeVersion}`;
        }
        if (elMeta) {
            elMeta.textContent = `${plan.nombreComercial} • ${plan.rucsLabel} • ${estacionesTotales} PC(s)`;
        }
        if (elMonto) elMonto.textContent = `${montoTexto} USD`;

        const sel = document.getElementById("pagoPlanSelect");
        if (sel instanceof HTMLSelectElement) sel.value = plan.id;

        const extraBar = document.getElementById("pagoExtraSeatsBar");
        const extraIn = document.getElementById("pagoExtraSeatsInput");
        const estTot = document.getElementById("pagoEstacionesTotales");
        if (extraBar instanceof HTMLElement) extraBar.style.display = plan.permiteExtraSeats ? "flex" : "none";
        if (extraIn instanceof HTMLInputElement) extraIn.value = String(extras);
        if (estTot instanceof HTMLElement) estTot.textContent = `${estacionesTotales} PCs totales`;

        const elRef = document.getElementById("pagoReferenciaTexto");
        const elBankMonto = document.getElementById("pagoBankMonto");
        const elBankRef = document.getElementById("pagoBankRef");
        if (elRef) elRef.textContent = referencia;
        if (elBankMonto) elBankMonto.textContent = `${montoTexto} USD`;
        if (elBankRef) elBankRef.textContent = referencia;

        const qrImg = document.getElementById("pagoQrDeunaImg");
        if (qrImg instanceof HTMLImageElement) qrImg.src = obtenerSrcQrDeuna();

        const pasosUl = document.getElementById("pagoDeunaPasos");
        if (pasosUl instanceof HTMLElement) {
            pasosUl.textContent = "";
            [
                "1. Abre Deuna! o Banca Móvil Banco Pichincha.",
                "2. Escanea el QR de la izquierda.",
                `3. Ingresa ${montoTexto} USD exactos y la referencia ${referencia}.`,
                "4. Envía tu comprobante por WhatsApp o correo para emitir tu archivo .lic.",
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
        ["btnSoporteDeunaWp", "btnSoportePayphoneWp", "btnSoporteEnterpriseWp"].forEach((id) => {
            asignarEnlaceSeguro(document.getElementById(id), soporteWpUrl, "whatsapp");
        });
        ["btnSoporteDeunaCorreo", "btnSoportePayphoneCorreo", "btnSoporteEnterpriseCorreo"].forEach((id) => {
            asignarEnlaceSeguro(document.getElementById(id), soporteCorreoUrl, "correo");
        });

        const payphonePanel = document.getElementById("pagoPayphonePanel");
        const lanPanel = document.getElementById("pagoEnterpriseLanPanel");
        const lanTexto = document.getElementById("pagoEnterpriseLanTexto");
        const cardTitle = document.getElementById("pagoCardTitulo");
        const btnPayphone = document.getElementById("btnPagarPayphoneModal");

        if (urlPayphone && payphonePanel instanceof HTMLElement && lanPanel instanceof HTMLElement) {
            if (cardTitle) cardTitle.textContent = "2. Tarjeta Crédito / Débito (PayPhone Oficial)";
            payphonePanel.style.display = "flex";
            lanPanel.style.display = "none";
            if (btnPayphone instanceof HTMLAnchorElement) {
                asignarEnlaceSeguro(btnPayphone, urlPayphone, "payphone");
                btnPayphone.textContent = `💳 Pagar con Tarjeta en PayPhone (${montoTexto})`;
            }
        } else if (payphonePanel instanceof HTMLElement && lanPanel instanceof HTMLElement) {
            if (cardTitle) cardTitle.textContent = "2. Activación Corporativa Red LAN / VPN (Transferencia Directa)";
            payphonePanel.style.display = "none";
            lanPanel.style.display = "block";
            if (btnPayphone instanceof HTMLAnchorElement) {
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

    function abrirModalPago(planIdRaw, extraSeatsOverride) {
        asegurarModalPago();
        estadoModalPago.planId = resolverPlan(planIdRaw);
        const plan = PLAN_LOOKUP[estadoModalPago.planId];
        if (!plan || !plan.permiteExtraSeats) {
            estadoModalPago.extraSeats = 0;
        } else if (typeof extraSeatsOverride === "number") {
            estadoModalPago.extraSeats = Math.max(0, Math.min(50, extraSeatsOverride));
        }
        actualizarVistaModalPago();
        const modal = document.getElementById("modalPago");
        if (modal instanceof HTMLElement) modal.style.display = "flex";
    }

    function asegurarModalLegal() {
        if (document.getElementById("modalLegal")) return;
        const overlay = crearEl("div", "modal-overlay");
        overlay.id = "modalLegal";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");

        const box = crearEl("div", "modal-box modal-narrow");
        const top = crearEl("div", "modal-top");
        const h3 = crearEl("h3", "", "Marco Legal — TributaFlow Pro");
        h3.id = "modalLegalTitulo";
        const btnClose = crearEl("button", "btn-close", "×");
        btnClose.type = "button";
        btnClose.setAttribute("aria-label", "Cerrar modal legal");
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

    function abrirModalLegal(clave) {
        asegurarModalLegal();
        if (!esClaveSegura(clave) || !Object.prototype.hasOwnProperty.call(TEXTOS_LEGALES, clave)) return;
        const doc = TEXTOS_LEGALES[clave];
        const tituloEl = document.getElementById("modalLegalTitulo");
        const cuerpo = document.getElementById("modalLegalCuerpo");
        if (!doc || !(cuerpo instanceof HTMLElement)) return;
        if (tituloEl) tituloEl.textContent = doc.titulo;
        cuerpo.textContent = "";
        doc.secciones.forEach((sec) => {
            cuerpo.appendChild(crearEl("h4", "", sec.sub));
            cuerpo.appendChild(crearEl("p", "", sec.txt));
        });
        const modal = document.getElementById("modalLegal");
        if (modal instanceof HTMLElement) modal.style.display = "flex";
    }

    /* ======================================================================
       Hidratación centralizada de versión, descargas y widgets interactivos
       ====================================================================== */
    function aplicarVersionEnDOM(versionStr) {
        if (typeof versionStr !== "string" || !SEMVER_REGEX.test(versionStr.trim())) return;
        runtimeVersion = versionStr.trim();

        document.querySelectorAll("[data-app-version]").forEach((el) => {
            el.textContent = runtimeVersion;
        });
        document.querySelectorAll("[data-app-version-tag]").forEach((el) => {
            el.textContent = `v${runtimeVersion}`;
        });
        document.querySelectorAll("[data-trial-days]").forEach((el) => {
            el.textContent = `${CONFIG_COMERCIAL.TRIAL_DIAS} días`;
        });
    }

    function hidratarDescargasPorSistemaOperativo() {
        const soInfo = detectarInfoSistemaOperativo();

        document.querySelectorAll(".os-card[data-os]").forEach((card) => {
            if (!soInfo.esMovil && card.getAttribute("data-os") === soInfo.instaladorId) {
                card.classList.add("os-card-active");
                const sizeEl = card.querySelector(".os-size");
                if (sizeEl && !sizeEl.dataset.recMarked) {
                    sizeEl.dataset.recMarked = "1";
                    sizeEl.textContent = `${sizeEl.textContent} • Recomendado`;
                }
            }
        });

        const btnPrincipalDl = document.getElementById("btnDescargaDetectada");
        if (btnPrincipalDl instanceof HTMLElement) {
            if (soInfo.esMovil || !soInfo.soportado) {
                btnPrincipalDl.textContent = `⬇ Descarga Gratuita ${CONFIG_COMERCIAL.TRIAL_DIAS} Días (Solo PC)`;
            } else {
                btnPrincipalDl.textContent = `⬇ Descarga Gratuita ${CONFIG_COMERCIAL.TRIAL_DIAS} Días (${soInfo.etiqueta} v${runtimeVersion})`;
            }
        }

        // Neutraliza cualquier enlace directo en móviles/iPadOS y en escritorio vincula al release oficial v2.4.0
        document.querySelectorAll("[data-download-os]").forEach((el) => {
            if (el instanceof HTMLAnchorElement) {
                if (soInfo.esMovil || !soInfo.soportado) {
                    el.setAttribute("href", "#descargas");
                    el.removeAttribute("download");
                    el.removeAttribute("data-tf-canal-seguro");
                } else {
                    const targetOs = el.getAttribute("data-download-os");
                    const key =
                        targetOs && targetOs !== "auto" && esClaveSegura(targetOs) && SO_LOOKUP[targetOs]
                            ? targetOs
                            : soInfo.instaladorId || "windows";
                    const meta = SO_LOOKUP[key];
                    if (meta && esUrlDescargaOficialSegura(meta.url)) {
                        el.setAttribute("href", meta.url);
                        el.setAttribute("download", meta.archivo);
                        el.setAttribute("data-tf-canal-seguro", "download_release");
                    }
                }
            }
        });

        document.querySelectorAll("[data-sha256-value]").forEach((el) => {
            const key = el.getAttribute("data-sha256-value");
            if (key && esClaveSegura(key) && SO_LOOKUP[key]) {
                el.textContent = SO_LOOKUP[key].sha256;
            }
        });

        document.querySelectorAll("[data-sha256-copy]").forEach((btn) => {
            if (btn instanceof HTMLElement && !btn.dataset.shaBound) {
                btn.dataset.shaBound = "1";
                btn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const key = btn.getAttribute("data-sha256-copy");
                    if (key && esClaveSegura(key) && SO_LOOKUP[key]) {
                        copiarAlPortapapeles(SO_LOOKUP[key].sha256, `SHA-256 ${SO_LOOKUP[key].etiqueta}`);
                    }
                });
            }
        });
    }

    function sincronizarConfiguracionPortal() {
        if (window.location.protocol !== "http:" && window.location.protocol !== "https:") return;
        if (typeof window.fetch !== "function") return;
        const urlApi = `${obtenerPrefijoRuta()}${CONFIG_COMERCIAL.API_CONFIG_PATH}`;
        fetch(urlApi, { cache: "no-store", credentials: "same-origin" })
            .then((resp) => (resp.ok ? resp.json() : null))
            .then((data) => {
                if (!data || typeof data !== "object" || Array.isArray(data)) return;
                if (Object.prototype.hasOwnProperty.call(data, "version")) {
                    aplicarVersionEnDOM(data.version);
                    hidratarDescargasPorSistemaOperativo();
                }
            })
            .catch(() => {
                // Respaldo embebido congelado en CONFIG_COMERCIAL si está offline
            });
    }

    function inicializarSimuladorAhorro() {
        const rucsRange = document.getElementById("simRucsRange");
        const docsRange = document.getElementById("simDocsRange");
        if (!(rucsRange instanceof HTMLInputElement) || !(docsRange instanceof HTMLInputElement)) return;

        const rucsVal = document.getElementById("simRucsVal");
        const docsVal = document.getElementById("simDocsVal");
        const horasMesEl = document.getElementById("simHorasMes");
        const horasAnioEl = document.getElementById("simHorasAnio");
        const planNombreEl = document.getElementById("simPlanNombre");
        const planDetalleEl = document.getElementById("simPlanDetalle");
        const btnComprarEl = document.getElementById("simBtnAdquirirPlan");
        const presetBtns = document.querySelectorAll("[data-sim-rucs]");

        function actualizarSimulador() {
            const rucs = Math.max(1, Math.min(200, Number(rucsRange.value || 12)));
            const docs = Math.max(20, Math.min(2000, Number(docsRange.value || 250)));

            if (rucsVal) rucsVal.textContent = rucs === 1 ? "1 contribuyente" : `${rucs} RUCs`;
            if (docsVal) docsVal.textContent = `${docs} comp./mes`;

            // Estimación conservadora: carga/cruce/ATS manual ~0.42 h base por RUC + ~0.0055 h por comprobante;
            // TributaFlow Pro automatiza ~86 % del trabajo operativo repetitivo.
            const horasManuales = rucs * (0.42 + docs * 0.0055);
            const horasAhorradasMes = Math.max(2, Math.round(horasManuales * 0.86));
            const horasAhorradasAnio = horasAhorradasMes * 12;

            let planId = "PERSONAL_PRO";
            let motivo = "Hasta 3 RUCs en 1 PC con sincronización SRI/RIDE/XML y bóveda local cifrada AES-256.";
            if (rucs > 3 && rucs <= 25) {
                planId = "CONTADOR_MASTER";
                motivo = "Hasta 25 RUCs en 1 PC con Lote Multi-RUC y Generador/Validador oficial ATS (XML/XSD/Excel).";
            } else if (rucs > 25 && rucs <= 60) {
                planId = "ESTUDIO_PRO";
                motivo = "Hasta 60 RUCs (o 30/PC en hasta 2 PCs), Auditor Fantasma EFOS, Contingencia ATS y respaldo .tfbkp (AES-256-GCM + HMAC).";
            } else if (rucs > 60 && rucs <= 100) {
                planId = "ENTERPRISE_TEAM";
                motivo = "RUCs ilimitados, 5 estaciones base, Red LAN TCP/IP centralizada anti-colisión y Bóveda Compartida UNC.";
            } else if (rucs > 100) {
                planId = "ENTERPRISE_CORP";
                motivo = "RUCs ilimitados, 10+ estaciones escalables (+$150/PC extra) y Conector Multi-Regional HTTPS / Gateway seguro.";
            }

            const planMeta = PLAN_LOOKUP[planId];
            if (horasMesEl) horasMesEl.textContent = `${horasAhorradasMes} h/mes`;
            if (horasAnioEl) horasAnioEl.textContent = `${horasAhorradasAnio} h/año`;
            if (planNombreEl) {
                planNombreEl.textContent = `${planMeta.nombre} — ${formatearUsd(planMeta.precioUsd)} USD/año`;
            }
            if (planDetalleEl) {
                planDetalleEl.textContent = `${planMeta.rucsLabel} • ${planMeta.estacionesLabel}. ${motivo}`;
            }
            if (btnComprarEl instanceof HTMLElement) {
                btnComprarEl.setAttribute("data-checkout-plan", planMeta.id);
                btnComprarEl.textContent = `💳 Adquirir ${planMeta.nombre} (${formatearUsd(planMeta.precioUsd)})`;
            }

            presetBtns.forEach((btn) => {
                const targetRucs = Number(btn.getAttribute("data-sim-rucs") || 0);
                btn.classList.toggle("is-active", targetRucs === rucs);
            });
        }

        rucsRange.addEventListener("input", actualizarSimulador);
        docsRange.addEventListener("input", actualizarSimulador);
        presetBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                rucsRange.value = String(Math.max(1, Math.min(200, Number(btn.getAttribute("data-sim-rucs") || 12))));
                docsRange.value = String(Math.max(20, Math.min(2000, Number(btn.getAttribute("data-sim-docs") || 250))));
                actualizarSimulador();
            });
        });

        actualizarSimulador();
    }

    function inicializarCalculadoraAddonCorp() {
        const inputAddon = document.getElementById("corpAddonInput");
        const btnMenos = document.getElementById("corpAddonMenos");
        const btnMas = document.getElementById("corpAddonMas");
        const lblTotal = document.getElementById("corpAddonTotal");
        const lblPcs = document.getElementById("corpAddonPcs");
        const btnWp = document.getElementById("btnCorpAddonWhatsapp");
        const btnCheckout = document.getElementById("btnCorpAddonCheckout");
        if (!(inputAddon instanceof HTMLInputElement)) return;

        function actualizarAddon() {
            const cant = Math.max(1, Math.min(50, Number(inputAddon.value || 1)));
            runtimeCorpExtraSeats = cant;
            inputAddon.value = String(cant);
            const totalUsd = 1490 + cant * CONFIG_COMERCIAL.PRECIO_SEAT_EXTRA_USD;
            const totalPcs = 10 + cant;
            if (lblTotal) lblTotal.textContent = `${formatearUsd(totalUsd)} USD/año`;
            if (lblPcs) lblPcs.textContent = `${totalPcs} PCs (${10} base + ${cant} adicional${cant > 1 ? "es" : ""})`;
            if (btnWp instanceof HTMLAnchorElement) {
                const texto =
                    `[TRIBUTAFLOW ENTERPRISE CORP v${runtimeVersion}] Solicito cotización/activación de +${cant} estación(es) adicional(es) (+1 PC = $150/año c/u). Total estimado: ${totalPcs} PCs (${formatearUsd(totalUsd)} USD/año).`;
                asignarEnlaceSeguro(btnWp, construirUrlWhatsapp(texto), "whatsapp");
            }
        }

        if (btnMenos) {
            btnMenos.addEventListener("click", () => {
                inputAddon.value = String(Math.max(1, Number(inputAddon.value || 1) - 1));
                actualizarAddon();
            });
        }
        if (btnMas) {
            btnMas.addEventListener("click", () => {
                inputAddon.value = String(Math.min(50, Number(inputAddon.value || 1) + 1));
                actualizarAddon();
            });
        }
        inputAddon.addEventListener("input", actualizarAddon);
        if (btnCheckout) {
            btnCheckout.addEventListener("click", (e) => {
                e.preventDefault();
                abrirModalPago("ENTERPRISE_CORP", runtimeCorpExtraSeats);
            });
        }

        actualizarAddon();
    }

    function inicializarPestanasGuiaUso() {
        const tabs = Array.from(document.querySelectorAll("[data-guide-tab]"));
        const panels = Array.from(document.querySelectorAll("[data-guide-panel]"));
        if (!tabs.length || !panels.length) return;

        const TABS_PERMITIDAS = new Set(["rapida", "1pc", "2pcs", "lan", "corp"]);

        function activarTab(tabId) {
            const idLimpio = TABS_PERMITIDAS.has(tabId) ? tabId : "rapida";
            tabs.forEach((t) => {
                const activo = t.getAttribute("data-guide-tab") === idLimpio;
                t.classList.toggle("is-active", activo);
                t.setAttribute("aria-selected", activo ? "true" : "false");
            });
            panels.forEach((p) => {
                const activo = p.getAttribute("data-guide-panel") === idLimpio;
                p.classList.toggle("is-active", activo);
            });
        }

        tabs.forEach((btn) => {
            btn.addEventListener("click", () => {
                const target = btn.getAttribute("data-guide-tab") || "rapida";
                activarTab(target);
            });
        });

        const hash = String(window.location.hash || "")
            .replace(/^#tab-/, "")
            .replace(/^#/, "")
            .toLowerCase();
        activarTab(TABS_PERMITIDAS.has(hash) ? hash : "rapida");
    }

    /* ======================================================================
       Guardia Anti-Hacking en Tiempo de Ejecución (Clickjacking, XSS DOM, Clobbering)
       ====================================================================== */
    function activarGuardiaAntiClickjacking() {
        let enFrame = false;
        try {
            enFrame = window.self !== window.top;
        } catch {
            enFrame = true;
        }
        if (!enFrame) return false;

        telemetriaInterna.frameBlocked = true;
        const body = document.body;
        if (body instanceof HTMLElement) {
            body.textContent = "";
            const wrap = crearEl("div", "tf-frame-block-screen");
            wrap.appendChild(crearEl("h2", "", "Vista bloqueada por protección anti-clickjacking"));
            wrap.appendChild(
                crearEl(
                    "p",
                    "",
                    "Por tu seguridad, TributaFlow Pro solo se ejecuta en su pestaña directa oficial."
                )
            );
            const openBtn = crearEl("a", "btn-glow", "Abrir portal oficial de TributaFlow Pro");
            asignarEnlaceSeguro(openBtn, CONFIG_COMERCIAL.DOMINIO_OFICIAL, "portal");
            wrap.appendChild(openBtn);
            body.appendChild(wrap);
        }
        return true;
    }

    function sanitizarNodoInyectado(nodo) {
        if (!(nodo instanceof HTMLElement)) return;
        const tag = nodo.tagName.toUpperCase();
        if (["SCRIPT", "IFRAME", "OBJECT", "EMBED", "BASE", "FORM"].includes(tag)) {
            if (tag === "SCRIPT") {
                const src = nodo.getAttribute("src") || "";
                const permitidoLocal =
                    (src === "assets/js/portal.js" || src === "../assets/js/portal.js") &&
                    !nodo.textContent.trim();
                if (permitidoLocal) return;
            }
            nodo.remove();
            telemetriaInterna.blockedMutations += 1;
            registrarBloqueoSeguridad("DISALLOWED_TAG", tag);
            return;
        }

        if (tag === "META" && (nodo.getAttribute("http-equiv") || "").toLowerCase() === "refresh") {
            nodo.remove();
            telemetriaInterna.blockedMutations += 1;
            registrarBloqueoSeguridad("META_REFRESH", "blocked");
            return;
        }

        // Eliminar atributos de eventos inline (onclick, onerror, onload, etc.)
        Array.from(nodo.attributes).forEach((attr) => {
            const nombre = attr.name.toLowerCase();
            if (nombre.startsWith("on")) {
                nodo.removeAttribute(attr.name);
                telemetriaInterna.blockedMutations += 1;
                registrarBloqueoSeguridad("INLINE_HANDLER", nombre);
            }
        });

        if (nodo instanceof HTMLAnchorElement) {
            const href = nodo.getAttribute("href");
            if (href && contieneCaracterControlOSchemeMalo(href)) {
                nodo.removeAttribute("href");
                telemetriaInterna.blockedMutations += 1;
                registrarBloqueoSeguridad("DANGEROUS_HREF", href);
            } else if (href && nodo.hasAttribute("data-tf-canal-seguro")) {
                const tipo = nodo.getAttribute("data-tf-canal-seguro") || "auto";
                if (!validarDestinoSeguro(href, tipo)) {
                    nodo.removeAttribute("href");
                    nodo.setAttribute("data-tf-blocked", "1");
                    telemetriaInterna.blockedMutations += 1;
                    registrarBloqueoSeguridad("TAMPERED_OFFICIAL_HREF", href);
                }
            }
        }

        if (nodo instanceof HTMLImageElement) {
            const src = nodo.getAttribute("src") || "";
            if (src && contieneCaracterControlOSchemeMalo(src) && !src.startsWith("data:image/")) {
                nodo.removeAttribute("src");
                telemetriaInterna.blockedMutations += 1;
                registrarBloqueoSeguridad("DANGEROUS_IMG_SRC", src);
            }
        }
    }

    function iniciarGuardiaMutacionDOM() {
        if (window.__TF_MUTATION_GUARD__) return;
        window.__TF_MUTATION_GUARD__ = true;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                if (m.type === "childList") {
                    m.addedNodes.forEach((node) => {
                        if (node instanceof HTMLElement) {
                            sanitizarNodoInyectado(node);
                            node.querySelectorAll("*").forEach((desc) => sanitizarNodoInyectado(desc));
                        }
                    });
                } else if (m.type === "attributes" && m.target instanceof HTMLElement) {
                    sanitizarNodoInyectado(m.target);
                }
            });
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["href", "src", "action", "formaction", "onclick", "onerror", "onload", "srcdoc"],
        });
    }

    function leerParametrosUrlSeguros() {
        let searchStr = "";
        try {
            searchStr = String(window.location.search || "");
        } catch {
            return;
        }
        const params = new URLSearchParams(searchStr);
        // Ignora intencionalmente ?url=, ?redirect=, ?payphone=, ?next=, ?whatsapp=
        const rawDevice = params.get("device_id") || params.get("hwid") || "";
        const deviceId = sanitizarIdentificador(rawDevice);
        if (deviceId && HEX_ALFANUM_REGEX.test(deviceId)) {
            estadoModalPago.hwidORef = deviceId;
            const inHwid = document.getElementById("pagoHwidInput");
            if (inHwid instanceof HTMLInputElement) inHwid.value = deviceId;
        }
        const rawTier = params.get("tier") || params.get("plan") || "";
        const rawNorm = String(rawTier).trim().toUpperCase().replace(/[^A-Z0-9_]/g, "");
        if (rawNorm && esClaveSegura(rawNorm) && (PLAN_LOOKUP[rawNorm] || PLAN_ALIASES[rawNorm])) {
            abrirModalPago(rawNorm);
        }
    }

    /* ======================================================================
       Inicialización Principal
       ====================================================================== */
    document.addEventListener("DOMContentLoaded", () => {
        if (activarGuardiaAntiClickjacking()) {
            return;
        }

        iniciarGuardiaMutacionDOM();
        aplicarVersionEnDOM(CONFIG_COMERCIAL.VERSION);

        asegurarModalPago();
        asegurarModalLegal();
        asegurarBotonFlotanteSoporte();
        hidratarDescargasPorSistemaOperativo();
        sincronizarConfiguracionPortal();
        inicializarSimuladorAhorro();
        inicializarCalculadoraAddonCorp();
        inicializarPestanasGuiaUso();

        // Fallback seguro CSP para logotipos SVG -> PNG
        document.querySelectorAll("img[data-fallback]").forEach((img) => {
            if (!(img instanceof HTMLImageElement)) return;
            img.addEventListener("error", () => {
                const fb = img.getAttribute("data-fallback");
                if (fb && !contieneCaracterControlOSchemeMalo(fb) && img.getAttribute("src") !== fb) {
                    img.setAttribute("src", fb);
                }
            });
        });

        // Menú desplegable "9 Módulos ▾" en todas las páginas
        const MODULOS_PORTAL = [
            { icon: "📊", title: "1. Panel General", desc: "Tablero KPIs, vencimientos y cupo ético", href: "modulos/panel-general.html" },
            { icon: "🏢", title: "2. Mis Contribuyentes", desc: "Multi-RUC, SQLite HWID y respaldo .tfbkp", href: "modulos/mis-contribuyentes.html" },
            { icon: "⚡", title: "3. Sincronizar SRI", desc: "Árbol contable jerárquico XML y RIDE", href: "modulos/sincronizar-sri.html" },
            { icon: "📥", title: "4. Importar Comprobantes", desc: "Claves .txt del SRI y lotes XML masivos", href: "modulos/importar-comprobantes.html" },
            { icon: "🕵️", title: "5. Auditor Fantasma SRI", desc: "Cruce preventivo contra empresas fantasma", href: "modulos/auditor-fantasma.html" },
            { icon: "🔎", title: "6. Búsqueda RUC / Cédula", desc: "Consulta tributaria directa sin bloqueos", href: "modulos/busqueda-ruc.html" },
            { icon: "📚", title: "7. Consulta Masiva", desc: "Verificación en lote y exportación Excel/CSV", href: "modulos/consulta-masiva.html" },
            { icon: "📑", title: "8. Generador y Validador ATS", desc: "XML ATS oficial, XSD y clave contingencia", href: "modulos/generador-ats.html" },
            { icon: "🔐", title: "9. Ajustes, Red LAN y Blindaje", desc: "Permisos ✓/🔒, estaciones TCP/IP y UNC", href: "modulos/ajustes-seguridad.html" },
        ];

        const navRoot = obtenerPrefijoRuta();
        const currentPage = (window.location.pathname || "").split("/").pop() || "";

        function esModoMovilNav() {
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
            if (!(trigger instanceof HTMLElement) || !(panel instanceof HTMLElement)) return;

            const header = crearEl("div", "nav-dropdown-header", "Suite Completa — 9 Módulos TributaFlow Pro");
            const grid = crearEl("div", "nav-dropdown-grid");

            MODULOS_PORTAL.forEach((mod) => {
                const link = document.createElement("a");
                const isCurrent = Boolean(currentPage && mod.href.endsWith("/" + currentPage));
                link.href = `${navRoot}${mod.href}`;
                link.className = isCurrent ? "nav-dropdown-item is-current" : "nav-dropdown-item";
                link.setAttribute("role", "menuitem");
                if (isCurrent) link.setAttribute("aria-current", "page");

                const iconSpan = crearEl("span", "nav-dropdown-icon", mod.icon);
                iconSpan.setAttribute("aria-hidden", "true");
                const textWrap = crearEl("span", "nav-dropdown-text");
                textWrap.appendChild(crearEl("span", "nav-dropdown-title", mod.title));
                textWrap.appendChild(crearEl("span", "nav-dropdown-desc", mod.desc));
                link.appendChild(iconSpan);
                link.appendChild(textWrap);
                grid.appendChild(link);
            });

            const footer = crearEl("div", "nav-dropdown-footer");
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
                if (esModoMovilNav()) return;
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
                if (esModoMovilNav() || pinnedByClick) return;
                hoverCloseTimer = setTimeout(cerrarDd, 160);
            });

            trigger.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isOpen = dd.classList.contains("is-open");
                if (!esModoMovilNav() && isOpen && !pinnedByClick && Date.now() - lastHoverOpenTs < 400) {
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

        // Blindaje y copia en enlaces estáticos de Soporte Oficial y enlaces externos
        document.querySelectorAll('[data-support-link="whatsapp"]').forEach((el) => {
            if (el instanceof HTMLAnchorElement) {
                el.setAttribute("data-tf-canal-seguro", "whatsapp");
                el.setAttribute("rel", "noopener noreferrer");
            }
        });
        document.querySelectorAll('[data-support-link="correo"]').forEach((el) => {
            if (el instanceof HTMLAnchorElement) {
                el.setAttribute("data-tf-canal-seguro", "correo");
                vincularCopiaCorreo(el, () =>
                    construirPlantillaSoporte(`TributaFlow Pro v${runtimeVersion}`, "")
                );
            }
        });
        document.querySelectorAll('a[target="_blank"]').forEach((el) => {
            if (el instanceof HTMLAnchorElement) {
                el.setAttribute("rel", "noopener noreferrer");
            }
        });

        if (!window.__TF_GUARDIAN_ENLACES__) {
            window.__TF_GUARDIAN_ENLACES__ = true;
            document.addEventListener(
                "click",
                (e) => {
                    const target = e.target;
                    if (!(target instanceof Element)) return;
                    const link = target.closest("a");
                    if (!(link instanceof HTMLAnchorElement)) return;

                    const hrefRaw = link.getAttribute("href") || "";
                    if (contieneCaracterControlOSchemeMalo(hrefRaw)) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        registrarBloqueoSeguridad("DANGEROUS_CLICK_SCHEME", hrefRaw);
                        mostrarToastCopia("⛔ Enlace peligroso neutralizado por seguridad.");
                        return;
                    }

                    if (link.hasAttribute("data-tf-canal-seguro")) {
                        const tipo = link.getAttribute("data-tf-canal-seguro") || "auto";
                        if (!validarDestinoSeguro(hrefRaw, tipo)) {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            registrarBloqueoSeguridad("TAMPERED_CHANNEL_CLICK", hrefRaw);
                            mostrarToastCopia("⛔ Enlace bloqueado por seguridad: canal oficial no verificado.");
                        }
                    }
                },
                true
            );
        }

        // Menú hamburguesa móvil accesible
        const navToggle = document.getElementById("navToggle");
        const navMenu = document.getElementById("navMenu");
        if (navToggle instanceof HTMLElement && navMenu instanceof HTMLElement) {
            navToggle.addEventListener("click", (e) => {
                e.stopPropagation();
                const isOpen = navMenu.classList.toggle("is-open");
                navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
                if (!isOpen) cerrarDropdowns();
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
            if (!(target instanceof Element)) return;
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
                document.querySelectorAll(".modal-overlay").forEach((m) => {
                    if (m instanceof HTMLElement) m.style.display = "none";
                });
            }
        });

        // Checkout modal (solo botones explícitos con data-checkout-plan)
        document.querySelectorAll("[data-checkout-plan]").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                abrirModalPago(btn.getAttribute("data-checkout-plan"));
            });
        });

        // Triggers de descarga por SO (desktop -> modal instalador; móvil/iPadOS -> bloqueo amigable sin GitHub)
        document.querySelectorAll("[data-download-os]").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                abrirModalDescargaSO(btn.getAttribute("data-download-os") || "auto");
            });
        });

        // Modales legales
        document.querySelectorAll("[data-legal]").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                abrirModalLegal(btn.getAttribute("data-legal"));
            });
        });

        // Botón rápido volver arriba en footer unificado
        document.querySelectorAll("[data-scroll-top]").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        });

        window.addEventListener("click", (e) => {
            if (e.target instanceof HTMLElement && e.target.classList.contains("modal-overlay")) {
                e.target.style.display = "none";
            }
        });

        leerParametrosUrlSeguros();
    });

    if (!Object.prototype.hasOwnProperty.call(window, "__TF_SECURITY__")) {
        Object.defineProperty(window, "__TF_SECURITY__", {
            value: congelarProfundo({
                CONFIG_COMERCIAL,
                PLANES_V240,
                INSTALADORES_SO,
                TEXTOS_LEGALES,
                validarDestinoSeguro,
                esUrlPayphoneSegura,
                esUrlWhatsappSegura,
                esUrlWhatsappShareSegura,
                esUrlCorreoSegura,
                esUrlDescargaOficialSegura,
                esUrlPortalOficialSegura,
                detectarSistemaOperativo,
                detectarInfoSistemaOperativo,
                esSistemaOperativoSoportado,
                sanitizarIdentificador,
                resolverPlan,
                abrirModalDescargaSO,
                abrirModalPago,
                obtenerTelemetria: () => Object.freeze({ ...telemetriaInterna }),
            }),
            writable: false,
            configurable: false,
            enumerable: true,
        });
    }
})();
