/**
 * Seguridad defensiva compartida para Cloudflare Pages Functions (v2.4.0).
 * Cero secretos embebidos y validación estricta OWASP ASVS / Anti-Tampering.
 */

const CLAVES_PROHIBIDAS = new Set(["__proto__", "constructor", "prototype"]);

export const SECURITY_HEADERS = Object.freeze({
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none';",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
});

/**
 * Catálogo comercial oficial inmutable v2.4.0 en el servidor.
 * Regla inquebrantable: enlaces PayPhone y correo oficial intocables.
 */
export const CATALOGO_OFICIAL_V240 = Object.freeze({
    version: "2.4.0",
    trialDias: 15,
    trialRucs: 60,
    trialModalidad: "ESTUDIO_PRO",
    precioSeatExtraUsd: 150,
    correoSoporte: "soportetributaflow@quoratec.com",
    whatsappOficial: "https://wa.me/593996459771",
    planes: Object.freeze({
        PERSONAL_PRO: Object.freeze({
            id: "PERSONAL_PRO",
            precioUsd: 59,
            rucsMax: 3,
            estacionesBase: 1,
            permiteExtraSeats: false,
            payphoneUrl: "https://ppls.me/5S1Y89pBi1vYHBTEgEzRA",
        }),
        CONTADOR_MASTER: Object.freeze({
            id: "CONTADOR_MASTER",
            precioUsd: 139,
            rucsMax: 25,
            estacionesBase: 1,
            permiteExtraSeats: false,
            payphoneUrl: "https://ppls.me/dxope7VBAjK5LR1mO4UitA",
        }),
        ESTUDIO_PRO: Object.freeze({
            id: "ESTUDIO_PRO",
            precioUsd: 299,
            rucsMax: 60,
            estacionesBase: 2,
            permiteExtraSeats: false,
            payphoneUrl: "https://ppls.me/60Bdw7lcRhMfvjqwA5cFdg",
        }),
        ENTERPRISE_TEAM: Object.freeze({
            id: "ENTERPRISE_TEAM",
            precioUsd: 890,
            rucsMax: -1,
            estacionesBase: 5,
            permiteExtraSeats: false,
            payphoneUrl: null,
        }),
        ENTERPRISE_CORP: Object.freeze({
            id: "ENTERPRISE_CORP",
            precioUsd: 1490,
            rucsMax: -1,
            estacionesBase: 10,
            permiteExtraSeats: true,
            payphoneUrl: null,
        }),
    }),
});

const REGEX_ATAQUES = [
    /<\s*script\b/i,
    /\bon\w+\s*=/i,
    /javascript\s*:/i,
    /data\s*:\s*text\/html/i,
    /(\bunion\b\s+\bselect\b|\bdrop\b\s+\btable\b|'\s*or\s+'?1'?\s*=\s*'?1|\bwaitfor\s+delay\b|--\s*$)/i,
    /(\$gt|\$gte|\$lt|\$lte|\$ne|\$in|\$nin|\$regex|\$where)/i,
    /(\.\.\/|\.\.\\|%2e%2e|%252e|\x00)/i,
    /https?:\/\/(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0|localhost|\[::1\])/i,
    /file:\/\//i,
];

const HWID_REGEX = /^[A-Z0-9-]{6,36}$/;
const PLAN_ID_REGEX = /^(PERSONAL_PRO|CONTADOR_MASTER|ESTUDIO_PRO|ENTERPRISE_TEAM|ENTERPRISE_CORP)$/;
const ORDER_REF_REGEX = /^TF-[A-Z0-9_-]{3,48}$/;
const LICENSE_KEY_REGEX = /^TFLIC-[A-Z0-9]{4,64}-[A-F0-9]{16,64}$/;
const RUC_CEDULA_REGEX = /^\d{10}(\d{3})?$/;
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
const HEX_64_REGEX = /^[a-f0-9]{64}$/i;

export function jsonSegura(data, status = 200, extraHeaders = {}) {
    const headers = new Headers(SECURITY_HEADERS);
    headers.set("Content-Type", "application/json; charset=utf-8");
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    headers.set("Pragma", "no-cache");
    Object.entries(extraHeaders).forEach(([k, v]) => headers.set(k, v));
    return new Response(JSON.stringify(data), { status, headers });
}

export function constanteTiempoIgualdad(bytesA, bytesB) {
    if (!(bytesA instanceof Uint8Array) || !(bytesB instanceof Uint8Array)) return false;
    const len = Math.max(bytesA.length, bytesB.length);
    let diff = bytesA.length ^ bytesB.length;
    for (let i = 0; i < len; i++) {
        const a = i < bytesA.length ? bytesA[i] : 0;
        const b = i < bytesB.length ? bytesB[i] : 0;
        diff |= a ^ b;
    }
    return diff === 0;
}

export async function esperarPisoTiempo(inicioMs, pisoMs = 15) {
    const transcurrido = Date.now() - inicioMs;
    if (transcurrido < pisoMs) {
        await new Promise((resolve) => setTimeout(resolve, pisoMs - transcurrido));
    }
}

export function contienePayloadMalicioso(valor) {
    if (typeof valor !== "string") return false;
    return REGEX_ATAQUES.some((rx) => rx.test(valor));
}

export function tieneClavesPeligrosasEnTextoJson(rawBody) {
    return /"(?:__proto__|constructor|prototype)"\s*:/.test(rawBody);
}

export async function leerJsonEstricto(request, maxBytes = 16384) {
    const ctype = String(request.headers.get("content-type") || "").toLowerCase();
    if (!ctype.includes("application/json")) {
        return { ok: false, status: 415, error: "UNSUPPORTED_MEDIA_TYPE" };
    }

    let raw = "";
    try {
        raw = await request.text();
    } catch {
        return { ok: false, status: 400, error: "INVALID_BODY" };
    }

    if (raw.length === 0 || raw.length > maxBytes) {
        return { ok: false, status: raw.length === 0 ? 400 : 413, error: "PAYLOAD_SIZE_INVALID" };
    }

    if (tieneClavesPeligrosasEnTextoJson(raw)) {
        return { ok: false, status: 403, error: "FORBIDDEN_KEY_INJECTION" };
    }

    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return { ok: false, status: 400, error: "MALFORMED_JSON" };
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { ok: false, status: 400, error: "JSON_OBJECT_REQUIRED" };
    }

    return { ok: true, raw, data: parsed };
}

export function validarEsquemaPermitido(obj, camposPermitidos, camposProhibidosTampering = []) {
    const allowedSet = new Set(camposPermitidos);
    const tamperedSet = new Set(camposProhibidosTampering);
    const stack = [obj];

    while (stack.length > 0) {
        const cur = stack.pop();
        if (!cur || typeof cur !== "object") continue;
        for (const key of Object.keys(cur)) {
            if (CLAVES_PROHIBIDAS.has(key)) {
                return { ok: false, status: 403, error: "FORBIDDEN_PROTOTYPE_KEY" };
            }
            if (cur === obj && tamperedSet.has(key)) {
                return { ok: false, status: 403, error: "PRICE_OR_PRIVILEGE_TAMPERING" };
            }
            if (cur === obj && !allowedSet.has(key)) {
                return { ok: false, status: 400, error: "UNEXPECTED_FIELD" };
            }
            const val = cur[key];
            if (typeof val === "string" && contienePayloadMalicioso(val)) {
                return { ok: false, status: 403, error: "MALICIOUS_INPUT_BLOCKED" };
            }
            if (val && typeof val === "object") {
                return { ok: false, status: 400, error: "NESTED_OBJECT_NOT_ALLOWED" };
            }
        }
    }

    return { ok: true };
}

export function calcularCotizacionAutoritativa(planId, extraSeatsRaw = 0) {
    if (!PLAN_ID_REGEX.test(String(planId || ""))) {
        return { ok: false, error: "INVALID_PLAN_ID" };
    }
    const plan = CATALOGO_OFICIAL_V240.planes[planId];
    if (!plan) {
        return { ok: false, error: "UNKNOWN_PLAN" };
    }

    const extraNum = Number(extraSeatsRaw ?? 0);
    if (!Number.isInteger(extraNum) || extraNum < 0 || extraNum > 50) {
        return { ok: false, error: "INVALID_EXTRA_SEATS" };
    }
    if (!plan.permiteExtraSeats && extraNum > 0) {
        return { ok: false, error: "EXTRA_SEATS_NOT_ALLOWED_FOR_PLAN" };
    }

    const montoAutoritativoUsd = plan.precioUsd + extraNum * CATALOGO_OFICIAL_V240.precioSeatExtraUsd;
    const estacionesAutorizadas = plan.estacionesBase + extraNum;

    return {
        ok: true,
        plan,
        extraSeats: extraNum,
        estacionesAutorizadas,
        montoAutoritativoUsd,
        vigenciaDias: 365,
    };
}

export async function calcularHmacSha256Hex(secreto, mensaje) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(secreto),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(mensaje));
    return Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

export function hexABytes(hex) {
    if (typeof hex !== "string" || !HEX_64_REGEX.test(hex)) return null;
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

export async function verificarFirmaHmacRequest(request, rawBody, envSecret, maxAgeSec = 300) {
    if (typeof envSecret !== "string" || envSecret.length < 32) {
        return { ok: false, status: 503, error: "SIGNING_SECRET_NOT_CONFIGURED" };
    }

    const sigHeader = String(request.headers.get("x-signature-256") || "").trim();
    const tsHeader = String(request.headers.get("x-timestamp") || "").trim();
    const sigClean = sigHeader.startsWith("sha256=") ? sigHeader.slice(7) : sigHeader;

    const sigBytes = hexABytes(sigClean);
    const tsNum = Number(tsHeader);
    if (!sigBytes || !Number.isInteger(tsNum) || tsNum <= 0) {
        return { ok: false, status: 401, error: "MISSING_OR_MALFORMED_SIGNATURE" };
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - tsNum) > maxAgeSec) {
        return { ok: false, status: 401, error: "SIGNATURE_TIMESTAMP_EXPIRED" };
    }

    const expectedHex = await calcularHmacSha256Hex(envSecret, `${tsNum}.${rawBody}`);
    const expectedBytes = hexABytes(expectedHex);
    if (!expectedBytes || !constanteTiempoIgualdad(sigBytes, expectedBytes)) {
        return { ok: false, status: 401, error: "INVALID_HMAC_SIGNATURE" };
    }

    return { ok: true, timestamp: tsNum };
}

export function validarCamposComunesLicense({ hwid, orderRef, ruc, email, licenseKey }) {
    if (hwid !== undefined && !HWID_REGEX.test(String(hwid))) return "INVALID_HWID";
    if (orderRef !== undefined && !ORDER_REF_REGEX.test(String(orderRef))) return "INVALID_ORDER_REF";
    if (ruc !== undefined && !RUC_CEDULA_REGEX.test(String(ruc))) return "INVALID_RUC_CEDULA";
    if (email !== undefined && (String(email).length > 120 || !EMAIL_REGEX.test(String(email)))) return "INVALID_EMAIL";
    if (licenseKey !== undefined && !LICENSE_KEY_REGEX.test(String(licenseKey))) return "INVALID_LICENSE_FORMAT";
    return null;
}
